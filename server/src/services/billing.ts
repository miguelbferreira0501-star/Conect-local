/** Assinatura dos planos pagos: checkout (Pix/cartão), status, cancelamento e avisos do meio de pagamento. */
import { timingSafeEqual } from 'node:crypto';
import { PLANS, effectivePlan, type BillingStatusDTO, type CheckoutInput, type CheckoutResultDTO, type PlanId } from '@conecta/shared';
import { pool, query, withUser, type Db } from '../db/pool';
import { env } from '../env';
import { AppError, forbidden, notFound } from '../lib/errors';
import { panelRepo } from '../repositories/panel';
import { usersRepo } from '../repositories/users';
import { asaas, asaasEnabled, type AsaasPayment } from './billing/asaas';

const PAID_STATUSES = new Set(['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']);

async function requireMember(db: Db, businessId: string) {
  const role = await panelRepo.role(db, businessId);
  if (role !== 'owner' && role !== 'manager') throw forbidden('Você não tem acesso a esta empresa.');
}

async function latestSubscription(db: Db, businessId: string) {
  return (
    await query<{ id: string; provider_subscription_id: string; plan: PlanId; billing_type: 'PIX' | 'CREDIT_CARD'; status: 'pending' | 'active' | 'canceled'; value_cents: number; created_at: Date }>(
      `SELECT * FROM subscriptions WHERE business_id = $1 ORDER BY created_at DESC LIMIT 1`, [businessId], db)
  )[0] ?? null;
}

const applyPayment = (eventId: string, event: string, p: AsaasPayment) =>
  query<{ r: string }>(`SELECT app.billing_apply_payment($1, $2, $3, $4, $5, $6, $7, $8) AS r`,
    [eventId, event, p.id, p.subscription ?? null, p.status, Math.round(p.value * 100), p.dueDate ?? null, p.invoiceUrl ?? null]);

export const billing = {
  enabled: asaasEnabled,

  async checkout(userId: string, businessId: string, input: Required<Pick<CheckoutInput, 'plan' | 'method' | 'holderName'>> & { cpfCnpj: string }): Promise<CheckoutResultDTO> {
    const plan = PLANS[input.plan];
    const { email, customerId, current, planUntil } = await withUser(userId, async (db) => {
      await requireMember(db, businessId);
      const me = await usersRepo.me(db);
      const b = await panelRepo.business(db, businessId);
      if (!b) throw notFound('Empresa não encontrada.');
      if (b.is_demo) throw new AppError(422, 'demo', 'Empresas de exemplo não podem assinar planos.');
      const sub = await latestSubscription(db, businessId);
      const cust = (await query<{ billing_customer_id: string | null }>(`SELECT billing_customer_id FROM businesses WHERE id = $1`, [businessId], db))[0];
      return { email: me!.email, customerId: cust?.billing_customer_id ?? null, current: sub, planUntil: effectivePlan(b.plan, b.plan_until) !== 'free' ? b.plan_until : null };
    });
    if (current && current.status === 'active' && current.plan === input.plan) {
      throw new AppError(409, 'already_subscribed', `Você já assina o plano ${plan.name}.`);
    }

    // Cliente no meio de pagamento (o CPF/CNPJ fica só lá).
    const customer = customerId ?? (await asaas.createCustomer({ name: input.holderName, cpfCnpj: input.cpfCnpj, email, externalReference: businessId })).id;
    // Ainda no teste grátis (ou com período pago): a primeira cobrança vence quando ele acabar.
    const day = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d);
    const firstDue = planUntil && new Date(planUntil) > new Date() ? day(new Date(planUntil)) : day(new Date());
    const sub = await asaas.createSubscription({
      customer, billingType: input.method, value: plan.priceCents / 100, nextDueDate: firstDue,
      description: `Pataí — plano ${plan.name} (mensal)`, externalReference: businessId,
    });
    await withUser(userId, (db) =>
      query(`SELECT app.billing_register_subscription($1, $2, $3, $4, $5, $6)`, [businessId, customer, sub.id, input.plan, input.method, plan.priceCents], db));

    // Troca de plano: a assinatura anterior é cancelada (o período já pago continua valendo).
    if (current && current.status !== 'canceled') {
      await asaas.cancelSubscription(current.provider_subscription_id).catch(() => {});
      await withUser(userId, (db) => query(`SELECT app.billing_mark_canceled($1)`, [current.provider_subscription_id], db));
    }

    const first = (await asaas.subscriptionPayments(sub.id)).data[0];
    if (!first) throw new AppError(503, 'billing_unavailable', 'A cobrança ainda não foi gerada. Tente de novo em alguns segundos.');
    await applyPayment(`created:${first.id}`, 'PAYMENT_CREATED', { ...first, subscription: sub.id });
    let pix: CheckoutResultDTO['pix'] = null;
    if (input.method === 'PIX') {
      const qr = await asaas.pixQrCode(first.id);
      pix = { qrCodeImage: `data:image/png;base64,${qr.encodedImage}`, copyPaste: qr.payload, expiresAt: qr.expirationDate ?? null };
    }
    return { subscriptionId: sub.id, paymentId: first.id, method: input.method, valueCents: plan.priceCents, invoiceUrl: first.invoiceUrl ?? null, pix, firstDueDate: firstDue };
  },

  async status(userId: string, businessId: string): Promise<BillingStatusDTO> {
    const { b, sub, payment } = await withUser(userId, async (db) => {
      await requireMember(db, businessId);
      const b = await panelRepo.business(db, businessId);
      const sub = await latestSubscription(db, businessId);
      const payment = sub
        ? (await query(`SELECT * FROM subscription_payments WHERE subscription_id = $1 ORDER BY coalesce(due_date, updated_at::date) DESC, updated_at DESC LIMIT 1`, [sub.id], db))[0] ?? null
        : null;
      return { b, sub, payment };
    });
    // Se o aviso da Asaas ainda não chegou, confere direto (evita o cliente esperar).
    if (sub && sub.status === 'pending' && payment && !PAID_STATUSES.has(payment.status) && asaasEnabled()) {
      const fresh = await asaas.payment(payment.provider_payment_id).catch(() => null);
      if (fresh && PAID_STATUSES.has(fresh.status)) {
        await applyPayment(`poll:${fresh.id}:${fresh.status}`, 'PAYMENT_CONFIRMED', { ...fresh, subscription: sub.provider_subscription_id });
        return billing.status(userId, businessId);
      }
    }
    return {
      enabled: asaasEnabled(),
      plan: b.plan,
      effectivePlan: effectivePlan(b.plan, b.plan_until),
      planUntil: b.plan_until ? new Date(b.plan_until).toISOString() : null,
      subscription: sub ? { id: sub.provider_subscription_id, plan: sub.plan, method: sub.billing_type, status: sub.status, valueCents: sub.value_cents, createdAt: new Date(sub.created_at).toISOString() } : null,
      lastPayment: payment ? { status: payment.status, dueDate: payment.due_date, paidAt: payment.paid_at ? new Date(payment.paid_at).toISOString() : null, invoiceUrl: payment.invoice_url } : null,
    };
  },

  async cancel(userId: string, businessId: string) {
    const sub = await withUser(userId, async (db) => {
      await requireMember(db, businessId);
      return latestSubscription(db, businessId);
    });
    if (!sub || sub.status === 'canceled') throw new AppError(409, 'no_subscription', 'Não há assinatura ativa para cancelar.');
    await asaas.cancelSubscription(sub.provider_subscription_id);
    await withUser(userId, (db) => query(`SELECT app.billing_mark_canceled($1)`, [sub.provider_subscription_id], db));
    return { ok: true };
  },

  /** Confere o token do aviso em tempo constante. */
  verifyWebhookToken(token: string | undefined) {
    const expected = env.ASAAS_WEBHOOK_TOKEN;
    if (!expected || !token) return false;
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  },

  async handleWebhook(body: { id?: string; event?: string; payment?: AsaasPayment; subscription?: { id: string } }) {
    const event = body.event ?? '';
    if (event.startsWith('PAYMENT_') && body.payment?.subscription) {
      const id = body.id ?? `${event}:${body.payment.id}:${body.payment.status}`;
      return (await applyPayment(id, event, body.payment))[0].r;
    }
    if (event.startsWith('SUBSCRIPTION_') && body.subscription?.id) {
      const id = body.id ?? `${event}:${body.subscription.id}`;
      return (await pool.query(`SELECT app.billing_subscription_event($1, $2, $3) AS r`, [id, event, body.subscription.id])).rows[0].r;
    }
    return 'ignored';
  },
};
