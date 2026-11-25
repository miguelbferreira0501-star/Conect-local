// Assinatura do Lumbi+ pela Google Play (app Android, Trusted Web Activity com a Digital Goods API).
// - POST /api/billing/google (logado): o app manda o purchase token logo depois da compra ou ao restaurar;
//   o servidor confere o token na API do Google (Android Publisher), confirma a compra (acknowledge, que o
//   Google exige em até 3 dias, senão devolve o dinheiro) e libera o Plus até o vencimento.
// - POST /api/google-webhook/:token (sem cookie): avisos do Google (Real-time developer notifications, via
//   Pub/Sub) com renovações, cancelamentos e reembolsos; o servidor busca o estado de novo na API.
import { createSign } from 'node:crypto';
import { Hono } from 'hono';
import { z } from 'zod';
import { withUser } from '../db';
import { env } from '../env';
import { AppError, invalid } from '../lib/errors';
import { type AppEnv, requireAuth } from '../auth';
import { IAP_IDS } from '../../../web/src/shared/iap';

export interface GoogleSub {
  productId: string;
  /** ACTIVE, IN_GRACE_PERIOD, ON_HOLD, PAUSED, CANCELED (ainda vale até o vencimento), EXPIRED, PENDING… */
  state: string;
  expiresAt: number | null;
  linkedToken: string | null;
  acknowledged: boolean;
  test: boolean;
}

const API = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';
let cached: { token: string; until: number } | null = null;

/** Token de acesso da conta de serviço (JWT assinado com a chave dela, trocado no Google). */
async function accessToken(): Promise<string> {
  if (cached && cached.until > Date.now() + 60_000) return cached.token;
  if (!env.GOOGLE_SERVICE_ACCOUNT_JSON) throw new AppError(503, 'play_off', 'As assinaturas pelo Google Play ainda estão sendo ligadas. Tente de novo mais tarde.');
  const raw = env.GOOGLE_SERVICE_ACCOUNT_JSON.trim();
  const key = JSON.parse(raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')) as { client_email: string; private_key: string; token_uri?: string };
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: key.token_uri ?? 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const sig = createSign('RSA-SHA256').update(unsigned).sign(key.private_key).toString('base64url');
  const r = await fetch(key.token_uri ?? 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
  });
  if (!r.ok) throw new AppError(502, 'play_auth', 'Não conseguimos falar com o Google Play agora. Tente de novo em instantes.');
  const j = (await r.json()) as { access_token: string; expires_in: number };
  cached = { token: j.access_token, until: Date.now() + j.expires_in * 1000 };
  return j.access_token;
}

/** Conversa com a API do Google. Os testes trocam estas duas funções. */
export const googleVerify = {
  async subscription(purchaseToken: string): Promise<GoogleSub | null> {
    const url = `${API}/${env.GOOGLE_PLAY_PACKAGE}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`;
    const r = await fetch(url, { headers: { authorization: `Bearer ${await accessToken()}` } });
    if (r.status === 404 || r.status === 400 || r.status === 410) return null;
    if (!r.ok) throw new AppError(502, 'play_api', 'Não conseguimos confirmar a compra com o Google Play agora. Toque em "Restaurar compras" daqui a pouco.');
    const j = (await r.json()) as {
      subscriptionState?: string;
      linkedPurchaseToken?: string;
      acknowledgementState?: string;
      testPurchase?: object;
      lineItems?: { productId?: string; expiryTime?: string }[];
    };
    const items = j.lineItems ?? [];
    const best = items.reduce<{ productId?: string; expiryTime?: string } | undefined>((a, b) => (!a || (b.expiryTime ?? '') > (a.expiryTime ?? '') ? b : a), undefined);
    return {
      productId: best?.productId ?? '',
      state: (j.subscriptionState ?? '').replace('SUBSCRIPTION_STATE_', ''),
      expiresAt: best?.expiryTime ? Date.parse(best.expiryTime) : null,
      linkedToken: j.linkedPurchaseToken ?? null,
      acknowledged: j.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
      test: !!j.testPurchase,
    };
  },
  async acknowledge(productId: string, purchaseToken: string): Promise<void> {
    const url = `${API}/${env.GOOGLE_PLAY_PACKAGE}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`;
    const r = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${await accessToken()}`, 'content-type': 'application/json' }, body: '{}' });
    if (!r.ok && r.status !== 400) throw new AppError(502, 'play_ack', 'A compra foi feita, mas não conseguimos confirmá-la com o Google Play. Toque em "Restaurar compras".');
  },
};

/** Estados em que o Plus vale (cancelada continua valendo até o fim do período já pago). */
const LIVE = new Set(['ACTIVE', 'IN_GRACE_PERIOD', 'CANCELED']);

async function apply(token: string, sub: GoogleSub, userId: string | null): Promise<string | null> {
  if (!IAP_IDS.includes(sub.productId)) return null;
  if (sub.state === 'PENDING') return null; // pagamento ainda não concluído (boleto, por exemplo)
  const revoked = sub.state === 'REVOKED';
  const expires = LIVE.has(sub.state) || revoked ? sub.expiresAt : Math.min(sub.expiresAt ?? 0, Date.now());
  return withUser(userId, async (db) => {
    const r = await db.query('SELECT app.google_apply($1, $2, $3, $4, $5, $6, $7) AS p', [token, sub.linkedToken, userId, sub.productId, expires ? new Date(expires) : null, revoked, sub.test]);
    const p = r.rows[0]?.p as Date | string | null;
    return p ? (typeof p === 'string' ? p.slice(0, 10) : p.toISOString().slice(0, 10)) : null;
  }).catch((e: { code?: string }) => {
    if (e.code === '42501') throw new AppError(409, 'outra_conta', 'Esta assinatura do Google Play já está ligada a outra conta do Lumbi. Entre com aquela conta.');
    throw e;
  });
}

export const googleBilling = new Hono<AppEnv>();

googleBilling.post('/', requireAuth, async (c) => {
  const body = z.object({ purchaseToken: z.string().min(10).max(2000), productId: z.string().max(100).optional() }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw invalid('Compra inválida.');
  const { purchaseToken } = body.data;
  const sub = await googleVerify.subscription(purchaseToken);
  if (!sub || !IAP_IDS.includes(sub.productId)) throw new AppError(400, 'compra_invalida', 'Não conseguimos confirmar esta compra com o Google Play. Tente restaurar as compras.');
  const premiumUntil = await apply(purchaseToken, sub, c.get('userId')!);
  if (!sub.acknowledged && sub.state !== 'PENDING') await googleVerify.acknowledge(sub.productId, purchaseToken);
  return c.json({ premiumUntil, pending: sub.state === 'PENDING' });
});

export const googleWebhook = new Hono();
googleWebhook.post('/:token', async (c) => {
  if (!env.GOOGLE_RTDN_TOKEN || c.req.param('token') !== env.GOOGLE_RTDN_TOKEN) return c.json({ ok: false }, 403);
  const body = z.object({ message: z.object({ data: z.string().max(20000) }) }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) return c.json({ ok: true }); // formato desconhecido: confirma para o Pub/Sub não reenviar
  let n: { packageName?: string; subscriptionNotification?: { purchaseToken?: string } } = {};
  try {
    n = JSON.parse(Buffer.from(body.data.message.data, 'base64').toString('utf8'));
  } catch {
    return c.json({ ok: true });
  }
  const token = n.subscriptionNotification?.purchaseToken;
  if (!token || (n.packageName && n.packageName !== env.GOOGLE_PLAY_PACKAGE)) return c.json({ ok: true });
  const sub = await googleVerify.subscription(token);
  if (sub) await apply(token, sub, null);
  return c.json({ ok: true });
});
