// Assinatura do Lumbi+ pela App Store (StoreKit 2).
// - POST /api/billing/apple (logado): o app manda a transação assinada pela Apple (JWS) logo depois da compra
//   ou ao restaurar; o servidor confere a assinatura com os certificados da Apple e libera o Plus.
// - POST /api/apple-webhook (sem cookie): avisos da Apple (App Store Server Notifications V2) com renovações,
//   cancelamentos e reembolsos, também conferidos pela assinatura.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Hono } from 'hono';
import { z } from 'zod';
import { Environment, SignedDataVerifier, type JWSTransactionDecodedPayload } from '@apple/app-store-server-library';
import { withUser } from '../db';
import { env } from '../env';
import { AppError, invalid } from '../lib/errors';
import { type AppEnv, requireAuth } from '../auth';
import { IAP_IDS } from '../../../web/src/shared/iap';

export interface AppleTx {
  originalTransactionId: string;
  productId: string;
  bundleId: string;
  expiresDate?: number;
  revocationDate?: number;
  appAccountToken?: string;
  environment: string;
}

let verifiers: SignedDataVerifier[] | null = null;
function getVerifiers(): SignedDataVerifier[] {
  if (verifiers) return verifiers;
  const dir = join(import.meta.dirname, '../../certs/apple');
  const roots = readdirSync(dir).filter((f) => f.endsWith('.cer')).map((f) => readFileSync(join(dir, f)));
  // Produção primeiro (precisa do número do app); depois Sandbox, que é o ambiente do TestFlight e da revisão da Apple.
  verifiers = [
    ...(env.APPLE_APP_ID ? [new SignedDataVerifier(roots, true, Environment.PRODUCTION, env.APPLE_BUNDLE_ID, env.APPLE_APP_ID)] : []),
    new SignedDataVerifier(roots, true, Environment.SANDBOX, env.APPLE_BUNDLE_ID),
  ];
  return verifiers;
}
const asTx = (t: JWSTransactionDecodedPayload): AppleTx => ({
  originalTransactionId: t.originalTransactionId ?? '',
  productId: t.productId ?? '',
  bundleId: t.bundleId ?? '',
  expiresDate: t.expiresDate,
  revocationDate: t.revocationDate,
  appAccountToken: t.appAccountToken,
  environment: String(t.environment ?? ''),
});

/** Conferência das assinaturas da Apple. Os testes trocam estas duas funções. */
export const appleVerify = {
  async transaction(jws: string): Promise<AppleTx | null> {
    for (const v of getVerifiers()) {
      try {
        return asTx(await v.verifyAndDecodeTransaction(jws));
      } catch {
        /* tenta o próximo ambiente */
      }
    }
    return null;
  },
  async notification(payload: string): Promise<{ type: string; tx: AppleTx | null } | null> {
    for (const v of getVerifiers()) {
      try {
        const n = await v.verifyAndDecodeNotification(payload);
        const signed = n.data?.signedTransactionInfo;
        return { type: String(n.notificationType ?? ''), tx: signed ? asTx(await v.verifyAndDecodeTransaction(signed)) : null };
      } catch {
        /* tenta o próximo ambiente */
      }
    }
    return null;
  },
};

async function apply(tx: AppleTx, userId: string | null, forceRevoked = false): Promise<string | null> {
  if (tx.bundleId !== env.APPLE_BUNDLE_ID || !IAP_IDS.includes(tx.productId) || !tx.originalTransactionId) return null;
  const revoked = forceRevoked || !!tx.revocationDate;
  return withUser(userId, async (db) => {
    const r = await db.query('SELECT app.apple_apply($1, $2, $3, $4, $5, $6) AS p', [
      tx.originalTransactionId,
      userId,
      tx.productId,
      tx.expiresDate ? new Date(tx.expiresDate) : null,
      revoked,
      ['Production', 'Sandbox', 'Xcode', 'LocalTesting'].includes(tx.environment) ? tx.environment : 'Sandbox',
    ]);
    const p = r.rows[0]?.p as Date | string | null;
    return p ? (typeof p === 'string' ? p.slice(0, 10) : p.toISOString().slice(0, 10)) : null;
  }).catch((e: { code?: string }) => {
    if (e.code === '42501') throw new AppError(409, 'outra_conta', 'Esta assinatura da App Store já está ligada a outra conta do Lumbi. Entre com aquela conta.');
    throw e;
  });
}

export const billing = new Hono<AppEnv>();

billing.post('/apple', requireAuth, async (c) => {
  const body = z.object({ jws: z.string().min(20).max(20000) }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw invalid('Compra inválida.');
  const tx = await appleVerify.transaction(body.data.jws);
  if (!tx) throw new AppError(400, 'compra_invalida', 'Não conseguimos confirmar esta compra com a Apple. Tente restaurar as compras.');
  const userId = c.get('userId')!;
  // Se o app mandou a conta junto da compra, ela tem que ser a mesma de quem está logado.
  if (tx.appAccountToken && tx.appAccountToken.toLowerCase() !== userId.toLowerCase()) {
    throw new AppError(409, 'outra_conta', 'Esta compra foi feita em outra conta do Lumbi. Entre com aquela conta.');
  }
  const premiumUntil = await apply(tx, userId);
  return c.json({ premiumUntil });
});

export const appleWebhook = new Hono();
appleWebhook.post('/', async (c) => {
  const body = z.object({ signedPayload: z.string().min(20).max(60000) }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) return c.json({ ok: false }, 400);
  const n = await appleVerify.notification(body.data.signedPayload);
  if (!n) return c.json({ ok: false }, 400);
  if (n.tx) await apply(n.tx, null, n.type === 'REFUND' || n.type === 'REVOKE');
  // A Apple só precisa saber que recebemos (200); se não houver dono ainda, a compra é ligada quando o app enviar.
  return c.json({ ok: true });
});
