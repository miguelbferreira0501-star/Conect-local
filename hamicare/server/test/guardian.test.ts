import { describe, expect, it } from 'vitest';
import pg from 'pg';
import { call, newUser, setupDatabase } from './helpers';

setupDatabase();

async function owner<T>(fn: (c: pg.Client) => Promise<T>) {
  const c = new pg.Client({ connectionString: process.env.DATABASE_OWNER_URL });
  await c.connect();
  try {
    return await fn(c);
  } finally {
    await c.end();
  }
}
const premiumOf = (id: string) => owner((c) => c.query('SELECT premium_until::text AS p FROM users WHERE id = $1', [id]).then((r) => r.rows[0].p as string | null));
const coinsOf = (id: string) => owner((c) => c.query('SELECT coins FROM game_wallet WHERE user_id = $1', [id]).then((r) => r.rows[0]?.coins as number | undefined));
const today = () => new Date().toISOString().slice(0, 10);

describe('Guardiões do Hami', () => {
  it('mural é público e mostra os números', async () => {
    const r = await call('GET', '/guardiao/mural');
    expect(r.status).toBe(200);
    expect(r.body.paymentsOn).toBe(true);
    expect(r.body.stats).toMatchObject({ helped: 0, waiting: 0 });
  });

  it('só adultos compram; menores de 13 não pedem Plus', async () => {
    const teen = await newUser('Teen', '13a17');
    const r = await call('POST', '/guardiao/pedidos', { tier: 'aliado', period: 'mes' }, teen.cookie);
    expect(r.status).toBe(403);
    expect(r.body.error).toBe('so_adultos');
    const kid = await newUser('Kid', 'ate12');
    expect((await call('POST', '/guardiao/pedir', {}, kid.cookie)).status).toBe(403);
    expect((await call('POST', '/guardiao/pedidos', { tier: 'aliado', period: 'mes' })).status).toBe(401);
  });

  it('recado passa pelo filtro de gentileza e valor do Super-herói tem mínimo', async () => {
    const g = await newUser('Gentil');
    expect((await call('POST', '/guardiao/pedidos', { tier: 'heroi', period: 'mes', heroCents: 300 }, g.cookie)).status).toBe(422);
    expect((await call('POST', '/guardiao/pedidos', { tier: 'aliado', period: 'mes', message: 'você é um idiota' }, g.cookie)).status).toBe(422);
  });

  it('pagamento entrega as vagas para a fila, em ordem, e agradece o Guardião uma vez só', async () => {
    const a = await newUser('Ana');
    const b = await newUser('Bia', '13a17');
    expect((await call('POST', '/guardiao/pedir', { reason: 'Estou desempregada agora' }, a.cookie)).body.request.status).toBe('esperando');
    expect((await call('POST', '/guardiao/pedir', {}, b.cookie)).body.request.status).toBe('esperando');
    expect((await call('GET', '/guardiao/mural')).body.stats.waiting).toBeGreaterThanOrEqual(2);

    const g = await newUser('Gui');
    const o = await call('POST', '/guardiao/pedidos', { tier: 'protetor', period: 'mes', displayName: 'Gui', message: 'Força, vocês conseguem!' }, g.cookie);
    expect(o.status).toBe(201);
    expect(o.body.quote).toEqual({ seats: 3, months: 1, cents: 2970 });
    expect(o.body.checkoutUrl).toContain('#guardiao=teste:');
    const before = (await coinsOf(g.id)) ?? 30;

    const paid = await call('POST', `/guardiao/teste/${o.body.orderId}/pagar`, {}, g.cookie);
    expect(paid.body).toMatchObject({ ok: true, first: true });
    expect(paid.body.assigned).toBeGreaterThanOrEqual(2);
    expect((await premiumOf(a.id))! > today()).toBe(true);
    expect((await premiumOf(b.id))! > today()).toBe(true);
    expect((await call('GET', '/guardiao/me', undefined, a.cookie)).body.request).toMatchObject({ status: 'atendido', months: 1 });
    expect(await coinsOf(g.id)).toBe(before + 300);

    // Pagar de novo não entrega nem agradece outra vez.
    expect((await call('POST', `/guardiao/teste/${o.body.orderId}/pagar`, {}, g.cookie)).body.first).toBe(false);
    expect(await coinsOf(g.id)).toBe(before + 300);

    // Mural mostra o Guardião e o recado.
    const mural = await call('GET', '/guardiao/mural');
    expect(mural.body.wall[0]).toMatchObject({ name: 'Gui', tier: 'protetor', seats: 3, message: 'Força, vocês conseguem!' });

    // Quem já está com Plus não entra na fila.
    expect((await call('POST', '/guardiao/pedir', {}, a.cookie)).status).toBe(409);
  });

  it('vaga que sobrou vai direto para quem pede depois; outra pessoa não vê o pedido dos outros', async () => {
    const c = await newUser('Cadu');
    const r = await call('POST', '/guardiao/pedir', {}, c.cookie);
    expect(r.body.request.status).toBe('atendido');
    expect(r.body.premiumUntil > today()).toBe(true);
    const other = await newUser('Outra');
    const me = await call('GET', '/guardiao/me', undefined, other.cookie);
    expect(me.body.request).toBeNull();
    expect(me.body.orders).toEqual([]);
  });

  it('cancelar o pedido de ajuda e aviso do Mercado Pago sem token não faz nada', async () => {
    const d = await newUser('Duda');
    await call('POST', '/guardiao/pedir', {}, d.cookie);
    expect((await call('DELETE', '/guardiao/pedir', {}, d.cookie)).status).toBe(200);
    expect((await call('GET', '/guardiao/me', undefined, d.cookie)).body.request).toBeNull();
    const w = await call('POST', '/guardiao-webhook', { type: 'payment', data: { id: '123' } }, undefined, { 'content-type': 'application/json' });
    expect(w.status).toBe(200);
  });
});
