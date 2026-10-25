import { createServer, type Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { resetRateLimits } from '../src/lib/rateLimit';
import { app, call, newUser, setupDatabase } from './helpers';

setupDatabase();

/** Simulador da API de Mensagens da Anthropic (formato de streaming SSE). */
let lastBody: any = null;
let server: Server;
beforeAll(async () => {
  server = createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      lastBody = JSON.parse(raw);
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      const send = (event: string, data: object) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      send('message_start', { type: 'message_start', message: { id: 'msg_1', type: 'message', role: 'assistant', model: lastBody.model, content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 812, output_tokens: 1 } } });
      send('content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } });
      for (const t of ['Frase curta: Consertos ', 'de roupas com carinho.']) send('content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: t } });
      send('content_block_stop', { type: 'content_block_stop', index: 0 });
      send('message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 240 } });
      send('message_stop', { type: 'message_stop' });
      res.end();
    });
  });
  await new Promise<void>((r) => server.listen(4599, '127.0.0.1', r));
});
afterAll(() => new Promise<void>((r) => server.close(() => r())));

async function sse(path: string, body: object, cookie: string) {
  const res = await app.request(`/api${path}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-requested-with': 'conecta', cookie }, body: JSON.stringify(body) });
  const text = await res.text();
  const events = text.split('\n\n').filter(Boolean).map((chunk) => {
    const ev = /event: (.+)/.exec(chunk)?.[1];
    const data = /data: (.+)/.exec(chunk)?.[1];
    return { ev, data: data ? JSON.parse(data) : null };
  });
  return { status: res.status, events, text: events.filter((e) => e.ev === 'text').map((e) => e.data).join('') };
}

const profile = {
  name: 'Ateliê da IA', categorySlug: 'outros-servicos', shortDescription: 'Ajustes e consertos de roupas.', cityIbge: 4209102,
  street: 'Rua A, 1', modeInPerson: true, modeAtCustomer: false, modeOnline: false, whatsapp: '47999990000', acceptsBooking: true, acceptsQuote: true,
};

describe('assistente de IA', () => {
  it('gera texto em tempo real, com regras de honestidade, e registra o uso', async () => {
    resetRateLimits();
    const owner = await newUser('Dona IA');
    const { body: biz } = await call('POST', '/panel/businesses', profile, owner.cookie);
    const r = await sse(`/panel/businesses/${biz.id}/ai`, { task: 'description', message: 'Atendo há pouco tempo' }, owner.cookie);
    expect(r.events.at(-1)?.ev).toBe('done');
    expect(r.text).toBe('Frase curta: Consertos de roupas com carinho.');
    expect(lastBody.model).toBe('claude-opus-5-5');
    expect(lastBody.fallbacks).toBe('default');
    expect(lastBody.output_config.effort).toBe('low');
    expect(lastBody.system).toContain('Nunca invente');
    expect(lastBody.messages[0].content).toContain('Ateliê da IA');
    expect(lastBody.messages[0].content).toContain('<pedido_do_dono>');
    const dash = (await call('GET', `/panel/businesses/${biz.id}`, undefined, owner.cookie)).body;
    expect(dash.plan.aiUsedThisMonth).toBe(1);
  });

  it('rascunho de resposta envia a avaliação marcada como dado do cliente', async () => {
    resetRateLimits();
    const ownerDb = new pg.Client({ connectionString: process.env.DATABASE_OWNER_URL });
    await ownerDb.connect();
    const demo = (await ownerDb.query(`SELECT b.id FROM businesses b WHERE slug = 'espaco-bem-cuidar-joinville'`)).rows[0];
    const owner = await newUser('Dono Demo');
    await ownerDb.query(`INSERT INTO business_members (business_id, user_id, role) VALUES ($1, $2, 'owner')`, [demo.id, owner.id]);
    await ownerDb.end();
    const review = (await call('GET', `/businesses/${demo.id}/reviews`)).body.items[0];
    const r = await sse(`/panel/businesses/${demo.id}/ai`, { task: 'reply', reviewId: review.id }, owner.cookie);
    expect(r.events.at(-1)?.ev).toBe('done');
    expect(lastBody.messages[0].content).toContain('<avaliacao_cliente>');
    expect(lastBody.messages[0].content).toContain(review.comment);
  });

  it('respeita o limite mensal do plano e bloqueia quem não é da empresa', async () => {
    resetRateLimits();
    const owner = await newUser();
    const intruder = await newUser();
    const { body: biz } = await call('POST', '/panel/businesses', { ...profile, name: 'Ateliê Limite' }, owner.cookie);
    const denied = await sse(`/panel/businesses/${biz.id}/ai`, { task: 'tips' }, intruder.cookie);
    expect(denied.events[0].ev).toBe('error');
    lastBody = null;
    const ownerDb = new pg.Client({ connectionString: process.env.DATABASE_OWNER_URL });
    await ownerDb.connect();
    await ownerDb.query(`INSERT INTO ai_usage (business_id, month, requests) VALUES ($1, date_trunc('month', now())::date, 10)`, [biz.id]);
    await ownerDb.end();
    const limited = await sse(`/panel/businesses/${biz.id}/ai`, { task: 'tips' }, owner.cookie);
    expect(limited.events[0].ev).toBe('error');
    expect(limited.events[0].data.code).toBe('plan_limit');
    expect(lastBody).toBeNull(); // nem chegou a chamar a IA
  });

  it('equipe: limite de agendas por plano', async () => {
    resetRateLimits();
    const owner = await newUser();
    const { body: biz } = await call('POST', '/panel/businesses', { ...profile, name: 'Salão Equipe' }, owner.cookie);
    expect((await call('POST', `/panel/businesses/${biz.id}/staff`, { name: 'Ana', kind: 'person' }, owner.cookie)).status).toBe(201);
    const second = await call('POST', `/panel/businesses/${biz.id}/staff`, { name: 'Bia', kind: 'person' }, owner.cookie);
    expect(second.status).toBe(402);
    expect(second.body.error.message).toMatch(/plano Grátis/);
  });
});
