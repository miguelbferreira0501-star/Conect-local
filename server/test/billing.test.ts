import { createServer, type Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { resetRateLimits } from '../src/lib/rateLimit';
import { app, call, newUser, setupDatabase } from './helpers';

setupDatabase();

/** Simulador da API v3 da Asaas. */
const state = { requests: [] as Array<{ method: string; path: string; body: any; key?: string }>, paymentStatus: 'PENDING', canceled: [] as string[], webhooks: [] as any[], webhookUpdates: 0 };
const subValues = new Map<string, number>();
let server: Server;
beforeAll(async () => {
  server = createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      const body = raw ? JSON.parse(raw) : null;
      const path = req.url!.replace('/v3', '');
      state.requests.push({ method: req.method!, path, body, key: req.headers['access_token'] as string });
      const json = (code: number, data: object) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(data)); };
      if (req.method === 'POST' && path === '/customers') return json(200, { id: 'cus_1' });
      if (path.startsWith('/webhooks')) {
        if (req.method === 'GET') return json(200, { data: state.webhooks });
        if (req.method === 'POST') { state.webhooks.push({ id: 'wh_1', url: body.url, enabled: true, body }); return json(200, { id: 'wh_1' }); }
        if (req.method === 'PUT') { state.webhookUpdates++; return json(200, { id: 'wh_1' }); }
      }
      if (req.method === 'POST' && path === '/subscriptions') { const id = `sub_${state.requests.length}`; subValues.set(id, body.value); return json(200, { id }); }
      let m = /^\/subscriptions\/([^/]+)\/payments$/.exec(path);
      if (m) return json(200, { data: [{ id: `pay_${m[1]}`, status: 'PENDING', value: subValues.get(m[1]) ?? 49.99, dueDate: '2026-10-25', invoiceUrl: `https://sandbox.asaas.com/i/${m[1]}`, subscription: m[1] }] });
      m = /^\/payments\/([^/]+)\/pixQrCode$/.exec(path);
      if (m) return json(200, { encodedImage: 'iVBORw0KGgo=', payload: '00020126PIXCOPIAECOLA', expirationDate: '2026-10-26 23:59:59' });
      m = /^\/payments\/([^/]+)$/.exec(path);
      if (m) return json(200, { id: m[1], status: state.paymentStatus, value: subValues.get(m[1].replace('pay_', '')) ?? 49.99, dueDate: '2026-10-25', invoiceUrl: null, subscription: m[1].replace('pay_', '') });
      m = /^\/subscriptions\/([^/]+)$/.exec(path);
      if (req.method === 'DELETE' && m) { state.canceled.push(m[1]); return json(200, { deleted: true }); }
      json(404, { errors: [{ description: 'não encontrado' }] });
    });
  });
  await new Promise<void>((r) => server.listen(4598, '127.0.0.1', r));
});
afterAll(() => new Promise<void>((r) => server.close(() => r())));

const profile = {
  name: 'Oficina Paga', categorySlug: 'banho-e-tosa', shortDescription: 'Oficina mecânica completa.', cityIbge: 4209102, street: 'Rua C, 3',
  modeInPerson: true, modeAtCustomer: false, modeOnline: false, whatsapp: '47999990000', acceptsBooking: true, acceptsQuote: true,
};
const webhook = (body: object, token = 'token-do-webhook-de-teste-123') =>
  app.request('/api/webhooks/asaas', { method: 'POST', headers: { 'content-type': 'application/json', 'asaas-access-token': token }, body: JSON.stringify(body) });

describe('configuração automática da Asaas', () => {
  it('cadastra o aviso de pagamento com o token e não duplica ao reiniciar', async () => {
    process.env.PUBLIC_URL = 'https://meusite.onrender.com';
    const { env } = await import('../src/env');
    (env as { PUBLIC_URL?: string }).PUBLIC_URL = 'https://meusite.onrender.com';
    const { ensureAsaasWebhook } = await import('../src/services/billing/asaas');
    const first = await ensureAsaasWebhook('dono@teste.com');
    expect(first.webhook).toBe('ok');
    expect(state.webhooks).toHaveLength(1);
    expect(state.webhooks[0].body).toMatchObject({ url: 'https://meusite.onrender.com/api/webhooks/asaas', authToken: 'token-do-webhook-de-teste-123', enabled: true });
    expect(state.webhooks[0].body.events).toContain('PAYMENT_RECEIVED');
    await ensureAsaasWebhook('dono@teste.com');
    expect(state.webhooks).toHaveLength(1);
    expect(state.webhookUpdates).toBe(1);
  });
});

/** Encerra o teste grátis (como se os 30 dias tivessem passado). */
async function endTrial(businessId: string) {
  const db = new pg.Client({ connectionString: process.env.DATABASE_OWNER_URL });
  await db.connect();
  await db.query(`UPDATE businesses SET plan = 'free', plan_until = NULL WHERE id = $1`, [businessId]);
  await db.end();
}

describe('assinatura paga', () => {
  it('Pix: checkout no app → aviso de pagamento → plano ativo', async () => {
    resetRateLimits();
    const owner = await newUser('Dono Pagante');
    const { body: biz } = await call('POST', '/panel/businesses', profile, owner.cookie);
    // Empresa nova começa com 30 dias de teste grátis
    const trial = (await call('GET', `/panel/businesses/${biz.id}/billing`, undefined, owner.cookie)).body;
    expect(trial.effectivePlan).toBe('pro');
    expect(new Date(trial.planUntil).getTime() - Date.now()).toBeGreaterThan(29 * 86_400_000);
    await endTrial(biz.id);
    expect((await call('POST', `/panel/businesses/${biz.id}/billing/checkout`, { plan: 'pro', method: 'PIX', cpfCnpj: '111.111.111-11', holderName: 'Dono Pagante' }, owner.cookie)).status).toBe(422);

    const co = await call('POST', `/panel/businesses/${biz.id}/billing/checkout`, { plan: 'pro', method: 'PIX', cpfCnpj: '529.982.247-25', holderName: 'Dono Pagante' }, owner.cookie);
    expect(co.status).toBe(201);
    expect(co.body.pix.copyPaste).toBe('00020126PIXCOPIAECOLA');
    expect(co.body.pix.qrCodeImage).toMatch(/^data:image\/png;base64,/);
    const subReq = state.requests.find((r) => r.path === '/subscriptions')!;
    expect(subReq.body).toMatchObject({ customer: 'cus_1', billingType: 'PIX', value: 49.99, cycle: 'MONTHLY', externalReference: biz.id });
    expect(subReq.key).toBe('chave-asaas-teste');

    // CPF não fica guardado no nosso banco
    const db = new pg.Client({ connectionString: process.env.DATABASE_OWNER_URL });
    await db.connect();
    const dump = JSON.stringify((await db.query(`SELECT * FROM subscriptions s JOIN businesses b ON b.id = s.business_id WHERE b.id = $1`, [biz.id])).rows);
    expect(dump).not.toContain('52998224725');

    let st = (await call('GET', `/panel/businesses/${biz.id}/billing`, undefined, owner.cookie)).body;
    expect(st.subscription.status).toBe('pending');
    expect(st.effectivePlan).toBe('free');

    const pay = { id: co.body.paymentId, status: 'RECEIVED', value: 49.99, dueDate: '2026-10-25', invoiceUrl: null, subscription: co.body.subscriptionId };
    expect((await webhook({ id: 'evt_fake', event: 'PAYMENT_RECEIVED', payment: pay }, 'token-errado-xxxxxxxx')).status).toBe(401);
    const ok = await webhook({ id: 'evt_1', event: 'PAYMENT_RECEIVED', payment: pay });
    expect((await ok.json()).result).toBe('activated');
    expect((await (await webhook({ id: 'evt_1', event: 'PAYMENT_RECEIVED', payment: pay })).json()).result).toBe('duplicate');

    st = (await call('GET', `/panel/businesses/${biz.id}/billing`, undefined, owner.cookie)).body;
    expect(st.subscription.status).toBe('active');
    expect(st.effectivePlan).toBe('pro');
    const until = new Date(st.planUntil);
    expect(until.getTime()).toBeGreaterThan(new Date('2026-11-25').getTime());

    // Plano pago libera mais agendas
    expect((await call('POST', `/panel/businesses/${biz.id}/staff`, { name: 'A', kind: 'person' }, owner.cookie)).status).toBe(201);
    expect((await call('POST', `/panel/businesses/${biz.id}/staff`, { name: 'B', kind: 'person' }, owner.cookie)).status).toBe(201);

    // Cancelar: período pago continua valendo
    expect((await call('POST', `/panel/businesses/${biz.id}/billing/cancel`, {}, owner.cookie)).status).toBe(200);
    expect(state.canceled).toContain(co.body.subscriptionId);
    st = (await call('GET', `/panel/businesses/${biz.id}/billing`, undefined, owner.cookie)).body;
    expect(st.subscription.status).toBe('canceled');
    expect(st.effectivePlan).toBe('pro');
    await db.end();
  });

  it('valor menor que o plano não libera; plano vencido pausa as agendas extras', async () => {
    resetRateLimits();
    const owner = await newUser('Dono Esperto');
    const { body: biz } = await call('POST', '/panel/businesses', { ...profile, name: 'Ateliê Pausa' }, owner.cookie);
    await endTrial(biz.id);
    const co = await call('POST', `/panel/businesses/${biz.id}/billing/checkout`, { plan: 'pro', method: 'PIX', cpfCnpj: '529.982.247-25', holderName: 'Dono Esperto' }, owner.cookie);
    expect(co.status).toBe(201);
    const pay = { id: co.body.paymentId, status: 'RECEIVED', value: 1, dueDate: '2026-10-25', invoiceUrl: null, subscription: co.body.subscriptionId };
    expect((await (await webhook({ id: 'evt_under', event: 'PAYMENT_RECEIVED', payment: pay })).json()).result).toBe('underpaid');
    expect((await call('GET', `/panel/businesses/${biz.id}/billing`, undefined, owner.cookie)).body.effectivePlan).toBe('free');
    expect((await call('POST', `/panel/businesses/${biz.id}/staff`, { name: 'A', kind: 'person' }, owner.cookie)).status).toBe(201);
    expect((await call('POST', `/panel/businesses/${biz.id}/staff`, { name: 'B', kind: 'person' }, owner.cookie)).status).toBe(402);

    expect((await (await webhook({ id: 'evt_full', event: 'PAYMENT_RECEIVED', payment: { ...pay, value: 49.99 } })).json()).result).toBe('activated');
    expect((await call('POST', `/panel/businesses/${biz.id}/staff`, { name: 'B', kind: 'person' }, owner.cookie)).status).toBe(201);
    let pub = (await call('GET', `/businesses/${biz.slug}`)).body;
    expect(pub.staff.map((x: { name: string }) => x.name)).toEqual(['A', 'B']);

    // Venceu sem pagar: fica sem assinatura e só a primeira agenda continua aceitando clientes
    const db = new pg.Client({ connectionString: process.env.DATABASE_OWNER_URL });
    await db.connect();
    await db.query(`UPDATE businesses SET plan_until = now() - interval '1 day' WHERE id = $1`, [biz.id]);
    await db.end();
    pub = (await call('GET', `/businesses/${biz.slug}`)).body;
    expect(pub.staff.map((x: { name: string }) => x.name)).toEqual(['A']);
    const panel = (await call('GET', `/panel/businesses/${biz.id}`, undefined, owner.cookie)).body;
    expect(panel.plan.effective).toBe('free');
    expect(panel.staff.map((x: { name: string; paused: boolean }) => [x.name, x.paused])).toEqual([['A', false], ['B', true]]);
    expect((await call('POST', `/panel/businesses/${biz.id}/staff`, { name: 'C', kind: 'person' }, owner.cookie)).status).toBe(402);
  });

  it('sem aviso da Asaas, a tela de status confere o pagamento direto', async () => {
    resetRateLimits();
    const owner = await newUser();
    const { body: biz } = await call('POST', '/panel/businesses', { ...profile, name: 'Oficina Sem Aviso' }, owner.cookie);
    await endTrial(biz.id);
    const co = await call('POST', `/panel/businesses/${biz.id}/billing/checkout`, { plan: 'pro', method: 'CREDIT_CARD', cpfCnpj: '11.222.333/0001-81', holderName: 'Empresa LTDA' }, owner.cookie);
    expect(co.status).toBe(201);
    expect(co.body.pix).toBeNull();
    expect(co.body.invoiceUrl).toMatch(/^https:\/\/sandbox\.asaas\.com\/i\//);
    state.paymentStatus = 'CONFIRMED';
    const st = (await call('GET', `/panel/businesses/${biz.id}/billing`, undefined, owner.cookie)).body;
    expect(st.effectivePlan).toBe('pro');
    state.paymentStatus = 'PENDING';
  });

  it('somente dono/gerente assina; outra pessoa não vê nem altera', async () => {
    resetRateLimits();
    const owner = await newUser();
    const intruder = await newUser();
    const { body: biz } = await call('POST', '/panel/businesses', { ...profile, name: 'Oficina Protegida' }, owner.cookie);
    expect((await call('GET', `/panel/businesses/${biz.id}/billing`, undefined, intruder.cookie)).status).toBe(403);
    expect((await call('POST', `/panel/businesses/${biz.id}/billing/checkout`, { plan: 'pro', method: 'PIX', cpfCnpj: '529.982.247-25', holderName: 'X Y' }, intruder.cookie)).status).toBe(403);
  });
});
