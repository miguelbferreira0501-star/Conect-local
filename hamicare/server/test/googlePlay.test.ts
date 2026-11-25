import { describe, expect, it } from 'vitest';
import { app, call, newUser, setupDatabase } from './helpers';
import { googleVerify, type GoogleSub } from '../src/routes/googlePlay';
import { env } from '../src/env';

setupDatabase();

// A API do Google é simulada: cada token aponta para um estado guardado aqui.
const subs = new Map<string, GoogleSub>();
const acks: string[] = [];
googleVerify.subscription = async (t) => subs.get(t) ?? null;
googleVerify.acknowledge = async (_p, t) => void acks.push(t);
const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const mensal = 'com.hamicare.app.plus.mensal';
const put = (token: string, s: Partial<GoogleSub>) => subs.set(token, { productId: mensal, state: 'ACTIVE', expiresAt: Date.now() + 30 * 864e5, linkedToken: null, acknowledged: false, test: true, ...s });
const me = async (cookie: string) => (await call('GET', '/auth/me', undefined, cookie)).body.user.premiumUntil?.slice(0, 10) ?? null;
const rtdn = (token: string, path = env.GOOGLE_RTDN_TOKEN) =>
  app.request(`/api/google-webhook/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: { data: Buffer.from(JSON.stringify({ packageName: 'com.hamicare.app', subscriptionNotification: { purchaseToken: token } })).toString('base64') } }),
  });
(env as { GOOGLE_RTDN_TOKEN?: string }).GOOGLE_RTDN_TOKEN = 'segredo-dos-avisos-123';

describe('assinatura pela Google Play', () => {
  it('compra conferida libera o Plus, confirma no Google e o aviso de renovação estende', async () => {
    const u = await newUser('Lia');
    const exp = Date.now() + 30 * 864e5;
    put('tok-lia-000001', { expiresAt: exp });
    const r = await call('POST', '/billing/google', { purchaseToken: 'tok-lia-000001' }, u.cookie);
    expect(r.status).toBe(200);
    expect(r.body.premiumUntil).toBe(day(exp));
    expect(acks).toContain('tok-lia-000001');
    const exp2 = exp + 30 * 864e5;
    put('tok-lia-000001', { expiresAt: exp2, acknowledged: true });
    expect((await rtdn('tok-lia-000001')).status).toBe(200);
    expect(await me(u.cookie)).toBe(day(exp2));
  });

  it('troca de plano (token novo ligado ao antigo) continua na mesma conta', async () => {
    const u = await newUser('Rui');
    put('tok-rui-000001', {});
    await call('POST', '/billing/google', { purchaseToken: 'tok-rui-000001' }, u.cookie);
    const exp = Date.now() + 365 * 864e5;
    put('tok-rui-000002', { productId: 'com.hamicare.app.plus.anual', expiresAt: exp, linkedToken: 'tok-rui-000001' });
    await rtdn('tok-rui-000002');
    expect(await me(u.cookie)).toBe(day(exp));
  });

  it('reembolso tira o Plus; pagamento pendente não libera', async () => {
    const u = await newUser('Teo');
    const exp = Date.now() + 30 * 864e5;
    put('tok-teo-000001', { state: 'PENDING', expiresAt: exp });
    const p = await call('POST', '/billing/google', { purchaseToken: 'tok-teo-000001' }, u.cookie);
    expect(p.body.pending).toBe(true);
    expect(await me(u.cookie)).toBe(null);
    put('tok-teo-000001', { expiresAt: exp });
    await call('POST', '/billing/google', { purchaseToken: 'tok-teo-000001' }, u.cookie);
    expect(await me(u.cookie)).toBe(day(exp));
    put('tok-teo-000001', { state: 'REVOKED', expiresAt: exp });
    await rtdn('tok-teo-000001');
    const after = await me(u.cookie);
    expect(after === null || after < day(Date.now())).toBe(true);
  });

  it('recusa token falso, de outro produto, já ligado a outra conta, sem login e aviso sem a senha', async () => {
    const a = await newUser('Ana');
    const b = await newUser('Bel');
    expect((await call('POST', '/billing/google', { purchaseToken: 'nao-existe-0001' }, a.cookie)).status).toBe(400);
    put('tok-outro-0001', { productId: 'com.outro.app.vip' });
    expect((await call('POST', '/billing/google', { purchaseToken: 'tok-outro-0001' }, a.cookie)).status).toBe(400);
    put('tok-ana-000001', {});
    expect((await call('POST', '/billing/google', { purchaseToken: 'tok-ana-000001' }, a.cookie)).status).toBe(200);
    expect((await call('POST', '/billing/google', { purchaseToken: 'tok-ana-000001' }, b.cookie)).status).toBe(409);
    expect(await me(b.cookie)).toBe(null);
    expect((await call('POST', '/billing/google', { purchaseToken: 'tok-ana-000001' })).status).toBe(401);
    expect((await rtdn('tok-ana-000001', 'senha-errada-0000')).status).toBe(403);
  });
});
