// Guardiões do Hami: quem pode pagar dá HamiCare+ para quem não pode (pagamento único, sem renovação).
// - POST /guardiao/pedidos: cria o pedido e devolve o link de pagamento (Mercado Pago: Pix e cartão).
// - POST /guardiao-webhook (fora do /api com CSRF): o Mercado Pago avisa; o servidor confere o pagamento
//   direto na API dele (nunca confia no aviso) e entrega as vagas para a fila, em ordem de chegada.
// - POST /guardiao/pedir: entra na fila de quem precisa (13 anos ou mais, sem Plus ativo).
// - GET /guardiao/mural: Guardiões recentes e números (público).
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Hono } from 'hono';
import { z } from 'zod';
import { pool, withUser } from '../db';
import { env } from '../env';
import { AppError, invalid, notFound } from '../lib/errors';
import { type AppEnv, requireAuth } from '../auth';
import { checkKindness, REASON_TEXT } from '../../../web/src/shared/moderation';
import { brl, guardianBonus, guardianQuote, TIERS, type GuardianPeriod, type GuardianTier } from '../../../web/src/shared/guardian';

const MP_API = 'https://api.mercadopago.com';
const testMode = () => env.GUARDIAN_TEST_PAY && env.NODE_ENV !== 'production';
const provider = (): 'mercadopago' | 'teste' | null => (env.MP_ACCESS_TOKEN ? 'mercadopago' : testMode() ? 'teste' : null);

export const guardian = new Hono<AppEnv>();

guardian.get('/mural', async (c) => {
  const r = await withUser(c.get('userId'), async (db) => {
    const stats = (await db.query('SELECT app.guardian_stats() AS s')).rows[0].s;
    const wall = (await db.query('SELECT name, tier, seats, months, message, paid_at AS "paidAt" FROM app.guardian_wall(30)')).rows;
    return { stats, wall };
  });
  return c.json({ ...r, paymentsOn: !!provider() });
});

guardian.get('/me', requireAuth, async (c) => {
  const r = await withUser(c.get('userId'), async (db) => {
    const request = (await db.query('SELECT status, created_at AS "createdAt", granted_at AS "grantedAt", months FROM guardian_requests WHERE user_id = app.current_user_id()')).rows[0] ?? null;
    const orders = (
      await db.query(
        `SELECT id, tier, period, seats, months, amount_cents AS "amountCents", status, seats_left AS "seatsLeft", created_at AS "createdAt", paid_at AS "paidAt"
         FROM guardian_orders WHERE user_id = app.current_user_id() ORDER BY created_at DESC LIMIT 20`,
      )
    ).rows;
    return { request, orders };
  });
  return c.json({ ...r, paymentsOn: !!provider(), testMode: provider() === 'teste' });
});

const orderSchema = z.object({
  tier: z.enum(['aliado', 'protetor', 'heroi']),
  period: z.enum(['mes', 'ano']),
  heroCents: z.number().int().optional(),
  displayName: z.string().trim().max(40).optional(),
  message: z.string().trim().max(140).optional(),
});

guardian.post('/pedidos', requireAuth, async (c) => {
  const body = orderSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw invalid('Pedido inválido.');
  const b = body.data;
  const quote = guardianQuote(b.tier as GuardianTier, b.period as GuardianPeriod, b.heroCents);
  if (!quote) throw invalid('Escolha um valor de pelo menos uma pessoa ajudada.');
  for (const text of [b.displayName, b.message]) {
    if (!text) continue;
    const k = checkKindness(text);
    if (!k.ok) throw invalid(REASON_TEXT[k.reason]);
  }
  const prov = provider();
  if (!prov) throw new AppError(503, 'indisponivel', 'O programa Guardião abre em breve. Obrigado pela vontade de ajudar!');
  const userId = c.get('userId')!;
  const order = await withUser(userId, async (db) => {
    const age = (await db.query('SELECT age_group FROM users WHERE id = $1', [userId])).rows[0]?.age_group;
    if (age !== '18mais') throw new AppError(403, 'so_adultos', 'Só adultos podem ser Guardiões. Peça para um adulto da família.');
    return (
      await db.query(
        `INSERT INTO guardian_orders (user_id, tier, period, seats, months, amount_cents, display_name, message, provider)
         VALUES (app.current_user_id(), $1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [b.tier, b.period, quote.seats, quote.months, quote.cents, b.displayName || null, b.message || null, prov],
      )
    ).rows[0] as { id: string };
  });
  const title = `Guardião do Hami (${TIERS[b.tier as GuardianTier].name}): HamiCare+ para ${quote.seats} ${quote.seats === 1 ? 'pessoa' : 'pessoas'} por ${quote.months === 12 ? '1 ano' : '1 mês'}`;
  if (prov === 'teste') return c.json({ orderId: order.id, checkoutUrl: `${env.APP_URL}/#guardiao=teste:${order.id}`, provider: prov, quote }, 201);
  // Mercado Pago: preferência de pagamento (Checkout Pro). A volta cai no app com #guardiao=ok.
  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: { authorization: `Bearer ${env.MP_ACCESS_TOKEN}`, 'content-type': 'application/json', 'x-idempotency-key': order.id },
    body: JSON.stringify({
      items: [{ id: `guardiao-${b.tier}-${b.period}`, title, quantity: 1, unit_price: quote.cents / 100, currency_id: 'BRL' }],
      external_reference: order.id,
      statement_descriptor: 'HAMICARE',
      notification_url: `${env.APP_URL}/api/guardiao-webhook`,
      back_urls: { success: `${env.APP_URL}/#guardiao=ok`, pending: `${env.APP_URL}/#guardiao=pendente`, failure: `${env.APP_URL}/#guardiao=falhou` },
      auto_return: 'approved',
    }),
  }).catch(() => null);
  const pref = res?.ok ? ((await res.json()) as { id: string; init_point: string }) : null;
  if (!pref?.init_point) throw new AppError(502, 'pagamento_indisponivel', 'Não deu para abrir o pagamento agora. Tente de novo em instantes.');
  await pool.query('UPDATE guardian_orders SET provider_ref = $2 WHERE id = $1', [order.id, pref.id]);
  return c.json({ orderId: order.id, checkoutUrl: pref.init_point, provider: prov, quote }, 201);
});

/** Pagamento de mentira (só com GUARDIAN_TEST_PAY e fora de produção): confirma o próprio pedido. */
guardian.post('/teste/:id/pagar', requireAuth, async (c) => {
  if (!testMode()) throw notFound();
  const id = c.req.param('id');
  const own = await withUser(c.get('userId'), (db) => db.query('SELECT amount_cents FROM guardian_orders WHERE id = $1', [id]).then((r) => r.rows[0]));
  if (!own) throw notFound('Pedido não encontrado.');
  return c.json(await confirmPaid(id, `teste-${id}`, own.amount_cents));
});

/** Confirma o pagamento, entrega as vagas e paga o agradecimento em sementes (uma vez só). */
export async function confirmPaid(orderId: string, ref: string, cents: number) {
  const row = await withUser(null, (db) => db.query('SELECT owner, seats, assigned FROM app.guardian_mark_paid($1, $2, $3)', [orderId, ref, cents]).then((r) => r.rows[0]));
  if (!row) return { ok: true, first: false };
  if (row.owner) {
    const bonus = guardianBonus(row.seats);
    await withUser(row.owner, async (db) => {
      const ins = await db.query('INSERT INTO game_ledger (user_id, ref, label, coins) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING', [row.owner, `guardiao:${orderId}`, 'Obrigado, Guardião!', bonus]);
      if (ins.rowCount) {
        await db.query('INSERT INTO game_wallet (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [row.owner]);
        await db.query('UPDATE game_wallet SET coins = coins + $2, updated_at = now() WHERE user_id = $1', [row.owner, bonus]);
      }
    });
  }
  return { ok: true, first: true, assigned: row.assigned as number };
}

guardian.post('/pedir', requireAuth, async (c) => {
  const body = z.object({ reason: z.string().trim().max(200).optional() }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw invalid('Pedido inválido.');
  const reason = body.data.reason || null;
  if (reason) {
    const k = checkKindness(reason);
    if (!k.ok) throw invalid(REASON_TEXT[k.reason]);
  }
  const userId = c.get('userId')!;
  const r = await withUser(userId, async (db) => {
    const u = (await db.query('SELECT age_group, premium_until >= current_date AS plus FROM users WHERE id = $1', [userId])).rows[0];
    if (u?.age_group === 'ate12') throw new AppError(403, 'idade', 'O HamiCare+ é para quem tem 13 anos ou mais.');
    if (u?.plus) throw new AppError(409, 'ja_plus', 'Você já está com o HamiCare+ ativo. Quando acabar, dá para pedir de novo.');
    const old = (await db.query('SELECT status FROM guardian_requests WHERE user_id = $1', [userId])).rows[0];
    if (old?.status === 'esperando') {
      await db.query('UPDATE guardian_requests SET reason = $2 WHERE user_id = $1', [userId, reason]);
    } else {
      await db.query('INSERT INTO guardian_requests (user_id, reason) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET reason = $2, status = \'esperando\', created_at = now(), granted_at = NULL, months = NULL, order_id = NULL', [userId, reason]);
    }
    await db.query('SELECT app.guardian_assign()');
    const req = (await db.query('SELECT status, created_at AS "createdAt", granted_at AS "grantedAt", months FROM guardian_requests WHERE user_id = $1', [userId])).rows[0];
    const premiumUntil = (await db.query('SELECT premium_until AS p FROM users WHERE id = $1', [userId])).rows[0]?.p ?? null;
    return { request: req, premiumUntil };
  });
  return c.json(r);
});

guardian.delete('/pedir', requireAuth, async (c) => {
  await withUser(c.get('userId'), (db) => db.query("DELETE FROM guardian_requests WHERE user_id = app.current_user_id() AND status = 'esperando'"));
  return c.json({ ok: true });
});

// ---------- Aviso do Mercado Pago (sem cookie e sem CSRF: conferimos direto na API dele) ----------

export const guardianWebhook = new Hono<AppEnv>();

/** Confere a assinatura do aviso (x-signature) quando MP_WEBHOOK_SECRET existe. */
function signatureOk(header: string | undefined, requestId: string | undefined, dataId: string): boolean {
  if (!env.MP_WEBHOOK_SECRET) return true;
  if (!header) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => p.trim().split('=') as [string, string]));
  if (!parts.ts || !parts.v1) return false;
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId ?? ''};ts:${parts.ts};`;
  const expected = createHmac('sha256', env.MP_WEBHOOK_SECRET).update(manifest).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

guardianWebhook.post('/', async (c) => {
  if (!env.MP_ACCESS_TOKEN) return c.json({ ok: true });
  const body = (await c.req.json().catch(() => ({}))) as { type?: string; topic?: string; data?: { id?: string | number } };
  const type = c.req.query('type') ?? body.type ?? c.req.query('topic') ?? body.topic;
  const dataId = String(c.req.query('data.id') ?? body.data?.id ?? c.req.query('id') ?? '');
  if (type !== 'payment' || !/^\d{1,30}$/.test(dataId)) return c.json({ ok: true });
  if (!signatureOk(c.req.header('x-signature'), c.req.header('x-request-id'), dataId)) return c.json({ error: 'assinatura' }, 401);
  const res = await fetch(`${MP_API}/v1/payments/${dataId}`, { headers: { authorization: `Bearer ${env.MP_ACCESS_TOKEN}` } }).catch(() => null);
  if (!res?.ok) return c.json({ ok: false }, 502);
  const pay = (await res.json()) as { status?: string; external_reference?: string; transaction_amount?: number; currency_id?: string };
  if (pay.status !== 'approved' || pay.currency_id !== 'BRL' || !pay.external_reference || !/^[0-9a-f-]{36}$/.test(pay.external_reference)) return c.json({ ok: true });
  await confirmPaid(pay.external_reference, dataId, Math.round((pay.transaction_amount ?? 0) * 100));
  return c.json({ ok: true });
});

export const guardianPriceText = (cents: number) => brl(cents);
