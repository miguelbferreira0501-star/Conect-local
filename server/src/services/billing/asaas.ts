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

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!env.ASAAS_API_KEY) throw new AppError(503, 'billing_unavailable', 'O pagamento on-line ainda não foi configurado.');
  let res: Response;
  try {
    res = await fetch(`${env.ASAAS_API_URL}${path}`, {
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
};
