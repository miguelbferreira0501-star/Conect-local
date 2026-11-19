import { describe, expect, it } from 'vitest';
import { app, call, newUser, setupDatabase } from './helpers';
import { appleVerify, type AppleTx } from '../src/routes/billing';

setupDatabase();

// A conferência criptográfica é da biblioteca da Apple; aqui o "JWS" é um JSON e a conferência é simulada.
const fake = (tx: Partial<AppleTx>) => `jws.${Buffer.from(JSON.stringify(tx)).toString('base64url')}.sig`;
appleVerify.transaction = async (jws) => (jws.startsWith('jws.') ? (JSON.parse(Buffer.from(jws.split('.')[1], 'base64url').toString()) as AppleTx) : null);
appleVerify.notification = async (payload) => {
  const n = JSON.parse(payload);
  return { type: n.type, tx: await appleVerify.transaction(n.jws) };
};
const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const base = { bundleId: 'com.hamicare.app', productId: 'com.hamicare.app.plus.mensal', environment: 'Sandbox' };
const me = async (cookie: string) => (await call('GET', '/auth/me', undefined, cookie)).body.user.premiumUntil?.slice(0, 10) ?? null;

describe('assinatura pela App Store', () => {
  it('compra conferida libera o Plus até o vencimento e o aviso de renovação estende', async () => {
    const u = await newUser('Bia');
    const exp = Date.now() + 30 * 864e5;
    const r = await call('POST', '/billing/apple', { jws: fake({ ...base, originalTransactionId: 't-bia', expiresDate: exp, appAccountToken: u.id }) }, u.cookie);
    expect(r.status).toBe(200);
    expect(r.body.premiumUntil).toBe(day(exp));
    expect(await me(u.cookie)).toBe(day(exp));
    const exp2 = exp + 30 * 864e5;
    const w = await app.request('/api/apple-webhook', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ signedPayload: JSON.stringify({ type: 'DID_RENEW', jws: fake({ ...base, originalTransactionId: 't-bia', expiresDate: exp2 }) }) }) });
    expect(w.status).toBe(200);
    expect(await me(u.cookie)).toBe(day(exp2));
  });

  it('reembolso tira o Plus que veio da assinatura', async () => {
    const u = await newUser('Caio');
    const exp = Date.now() + 30 * 864e5;
    await call('POST', '/billing/apple', { jws: fake({ ...base, originalTransactionId: 't-caio', expiresDate: exp }) }, u.cookie);
    await app.request('/api/apple-webhook', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ signedPayload: JSON.stringify({ type: 'REFUND', jws: fake({ ...base, originalTransactionId: 't-caio', expiresDate: exp, revocationDate: Date.now() }) }) }) });
    const p = await me(u.cookie);
    expect(p === null || p < day(Date.now())).toBe(true);
  });

  it('recusa compra falsa, de outro app, de outra conta ou já ligada a outra pessoa', async () => {
    const a = await newUser('Ana');
    const b = await newUser('Beto');
    const exp = Date.now() + 30 * 864e5;
    expect((await call('POST', '/billing/apple', { jws: 'nao-e-da-apple-de-verdade' }, a.cookie)).status).toBe(400);
    expect((await call('POST', '/billing/apple', { jws: fake({ ...base, bundleId: 'com.outro.app', originalTransactionId: 't-x', expiresDate: exp }) }, a.cookie)).body.premiumUntil).toBe(null);
    expect((await call('POST', '/billing/apple', { jws: fake({ ...base, originalTransactionId: 't-y', expiresDate: exp, appAccountToken: b.id }) }, a.cookie)).status).toBe(409);
    expect((await call('POST', '/billing/apple', { jws: fake({ ...base, originalTransactionId: 't-ana', expiresDate: exp }) }, a.cookie)).status).toBe(200);
    expect((await call('POST', '/billing/apple', { jws: fake({ ...base, originalTransactionId: 't-ana', expiresDate: exp }) }, b.cookie)).status).toBe(409);
    expect(await me(b.cookie)).toBe(null);
    expect((await call('POST', '/billing/apple', { jws: fake({ ...base, originalTransactionId: 't-z', expiresDate: exp }) })).status).toBe(401);
  });
});
