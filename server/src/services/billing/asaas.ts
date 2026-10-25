/**
 * Cliente mínimo da API v3 da Asaas (https://docs.asaas.com).
 * Autenticação pelo cabeçalho `access_token`. Cartão é digitado na página segura da Asaas (invoiceUrl):
 * dados de cartão nunca passam pelo nosso servidor.
 */
import { env } from '../../env';
import { AppError } from '../../lib/errors';

export interface AsaasPayment {
  id: string;
  status: string;
  value: number;
  dueDate: string;
  invoiceUrl: string | null;
  subscription?: string;
}

export const asaasEnabled = () => !!env.ASAAS_API_KEY;

const ENVIRONMENTS = [
  { name: 'produção', url: 'https://api.asaas.com/v3' },
  { name: 'testes (sandbox)', url: 'https://api-sandbox.asaas.com/v3' },
] as const;
let resolved: { name: string; url: string } | null = null;

/**
 * Cada chave da Asaas só funciona no seu ambiente. Sem ASAAS_API_URL, testamos produção e depois sandbox
 * e ficamos com o que aceitar a chave — assim o dono só precisa colar a chave.
 */
export async function asaasEnvironment(): Promise<{ name: string; url: string }> {
  if (resolved) return resolved;
  if (env.ASAAS_API_URL) return (resolved = { name: env.ASAAS_API_URL.includes('sandbox') ? 'testes (sandbox)' : 'produção', url: env.ASAAS_API_URL });
  for (const e of ENVIRONMENTS) {
    try {
      const res = await fetch(`${e.url}/webhooks?limit=1`, { headers: { access_token: env.ASAAS_API_KEY ?? '', 'User-Agent': 'conecta-local' }, signal: AbortSignal.timeout(15_000) });
      if (res.ok) return (resolved = e);
    } catch {
      /* tenta o próximo */
    }
  }
  throw new AppError(503, 'billing_unavailable', 'A chave da Asaas não foi aceita. Confira se foi copiada inteira.');
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!env.ASAAS_API_KEY) throw new AppError(503, 'billing_unavailable', 'O pagamento on-line ainda não foi configurado.');
  const base = (await asaasEnvironment()).url;
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', access_token: env.ASAAS_API_KEY, 'User-Agent': 'conecta-local' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new AppError(503, 'billing_unavailable', 'Não conseguimos falar com o meio de pagamento. Tente novamente em instantes.');
  }
  const data = (await res.json().catch(() => ({}))) as { errors?: Array<{ description?: string }> } & T;
  if (!res.ok) {
    const msg = data.errors?.[0]?.description;
    console.error('Asaas', res.status, path, msg);
    throw new AppError(res.status >= 500 ? 503 : 422, 'billing_error', msg ? `Meio de pagamento: ${msg}` : 'O meio de pagamento recusou o pedido.');
  }
  return data;
}

export const asaas = {
  createCustomer: (c: { name: string; cpfCnpj: string; email: string; externalReference: string }) =>
    request<{ id: string }>('POST', '/customers', { ...c, notificationDisabled: false }),

  createSubscription: (s: { customer: string; billingType: 'PIX' | 'CREDIT_CARD'; value: number; nextDueDate: string; description: string; externalReference: string }) =>
    request<{ id: string }>('POST', '/subscriptions', { ...s, cycle: 'MONTHLY' }),

  subscriptionPayments: (subscriptionId: string) =>
    request<{ data: AsaasPayment[] }>('GET', `/subscriptions/${encodeURIComponent(subscriptionId)}/payments`),

  payment: (paymentId: string) => request<AsaasPayment>('GET', `/payments/${encodeURIComponent(paymentId)}`),

  pixQrCode: (paymentId: string) =>
    request<{ encodedImage: string; payload: string; expirationDate?: string }>('GET', `/payments/${encodeURIComponent(paymentId)}/pixQrCode`),

  cancelSubscription: (subscriptionId: string) => request<{ deleted: boolean }>('DELETE', `/subscriptions/${encodeURIComponent(subscriptionId)}`),

  listWebhooks: () => request<{ data: Array<{ id: string; url: string; enabled: boolean }> }>('GET', '/webhooks?limit=100'),
  createWebhook: (w: object) => request<{ id: string }>('POST', '/webhooks', w),
  updateWebhook: (id: string, w: object) => request<{ id: string }>('PUT', `/webhooks/${encodeURIComponent(id)}`, w),
};

export const WEBHOOK_EVENTS = [
  'PAYMENT_CREATED', 'PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED', 'PAYMENT_OVERDUE', 'PAYMENT_DELETED',
  'PAYMENT_REFUNDED', 'PAYMENT_PARTIALLY_REFUNDED', 'PAYMENT_CHARGEBACK_REQUESTED',
  'SUBSCRIPTION_CREATED', 'SUBSCRIPTION_UPDATED', 'SUBSCRIPTION_DELETED', 'SUBSCRIPTION_INACTIVATED',
];

export const publicUrl = () => (env.PUBLIC_URL ?? env.RENDER_EXTERNAL_URL ?? '').replace(/\/$/, '');

export interface BillingSetupStatus {
  configured: boolean;
  environment: string | null;
  webhook: 'ok' | 'missing_public_url' | 'missing_token' | 'error' | 'not_checked';
  message: string;
}
let setupStatus: BillingSetupStatus = { configured: false, environment: null, webhook: 'not_checked', message: 'Pagamentos não configurados: falta a chave da Asaas (ASAAS_API_KEY).' };
export const billingSetupStatus = () => setupStatus;

/** Cadastra (ou atualiza) na Asaas o aviso de pagamento deste site. Roda ao iniciar o servidor. */
export async function ensureAsaasWebhook(contactEmail: string): Promise<BillingSetupStatus> {
  if (!env.ASAAS_API_KEY) return setupStatus;
  try {
    const environment = (await asaasEnvironment()).name;
    const base = publicUrl();
    if (!base) return (setupStatus = { configured: true, environment, webhook: 'missing_public_url', message: 'Chave aceita, mas falta o endereço público do site (PUBLIC_URL).' });
    if (!env.ASAAS_WEBHOOK_TOKEN) return (setupStatus = { configured: true, environment, webhook: 'missing_token', message: 'Chave aceita, mas falta ASAAS_WEBHOOK_TOKEN.' });
    const url = `${base}/api/webhooks/asaas`;
    const body = {
      name: 'Conecta Local', url, email: contactEmail, enabled: true, interrupted: false, apiVersion: 3,
      authToken: env.ASAAS_WEBHOOK_TOKEN, sendType: 'SEQUENTIALLY', events: WEBHOOK_EVENTS,
    };
    const existing = (await asaas.listWebhooks()).data.find((w) => w.url === url);
    if (existing) await asaas.updateWebhook(existing.id, body);
    else await asaas.createWebhook(body);
    return (setupStatus = { configured: true, environment, webhook: 'ok', message: `Pagamentos conectados à Asaas (${environment}). Avisos de pagamento configurados.` });
  } catch (e) {
    console.error('Configuração da Asaas:', (e as Error).message);
    return (setupStatus = { configured: false, environment: resolved?.name ?? null, webhook: 'error', message: (e as Error).message });
  }
}
