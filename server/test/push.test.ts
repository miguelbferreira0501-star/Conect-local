import { createECDH, randomBytes } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import pg from 'pg';
import webpush from 'web-push';
import { withUser } from '../src/db/pool';
import { resetRateLimits } from '../src/lib/rateLimit';
import { runDueNotifications } from '../src/services/push';
import { call, newUser, setupDatabase } from './helpers';

setupDatabase();

/** Serviço de push simulado: guarda o que seria entregue no celular. */
const sent: Array<{ endpoint: string; msg: { title: string; body: string; url: string } }> = [];
let gone = new Set<string>();
vi.spyOn(webpush, 'sendNotification').mockImplementation(async (sub, payload) => {
  if (gone.has(sub.endpoint)) throw Object.assign(new Error('Gone'), { statusCode: 410 });
  sent.push({ endpoint: sub.endpoint, msg: JSON.parse(String(payload)) });
  return { statusCode: 201, body: '', headers: {} };
});
afterEach(() => { gone = new Set(); });

const device = () => {
  const ecdh = createECDH('prime256v1');
  ecdh.generateKeys();
  return { endpoint: `https://push.exemplo.com/${randomBytes(8).toString('hex')}`, keys: { p256dh: ecdh.getPublicKey('base64url'), auth: randomBytes(16).toString('base64url') } };
};
const flush = () => new Promise((r) => setTimeout(r, 50));
const to = (endpoint: string) => sent.filter((s) => s.endpoint === endpoint);

const allDays = Object.fromEntries(['0', '1', '2', '3', '4', '5', '6'].map((d) => [d, [['08:00', '22:00']]]));
const day = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
async function owner<T>(fn: (db: pg.Client) => Promise<T>) {
  const db = new pg.Client({ connectionString: process.env.DATABASE_OWNER_URL });
  await db.connect();
  try { return await fn(db); } finally { await db.end(); }
}

describe('notificações no celular', () => {
  it('empresa recebe pedido novo; tutor recebe confirmação e cada etapa do Pet ao Vivo', async () => {
    resetRateLimits();
    expect((await call('GET', '/push/key')).body.publicKey).toMatch(/^[A-Za-z0-9_-]{80,}$/);
    const o = await newUser('Dona do Banho');
    const oDev = device();
    expect((await call('POST', '/me/push', oDev, o.cookie)).status).toBe(201);
    const { body: biz } = await call('POST', '/panel/businesses', {
      name: 'Banho Avisa', categorySlug: 'banho-e-tosa', shortDescription: 'Banho com aviso no celular.', cityIbge: 4209102, street: 'Rua B, 2',
      modeInPerson: true, modeAtCustomer: false, modeOnline: false, whatsapp: '47999990000', acceptsBooking: true, acceptsQuote: true,
    }, o.cookie);
    await call('PUT', `/panel/businesses/${biz.id}/hours`, allDays, o.cookie);
    const { body: svc } = await call('POST', `/panel/businesses/${biz.id}/services`, { name: 'Banho', priceType: 'fixed', priceMin: 60, durationMinutes: 60, bookable: true }, o.cookie);

    const t = await newUser('Tutora Atenta');
    const tDev = device();
    await call('POST', '/me/push', tDev, t.cookie);
    expect((await call('POST', '/me/push/test', {}, t.cookie)).body.sent).toBe(1);
    const { body: pet } = await call('POST', '/me/pets', { name: 'Thor', species: 'dog' }, t.cookie);
    const av = (await call('GET', `/businesses/${biz.id}/availability?serviceId=${svc.id}&date=${day(1)}`)).body;
    const bk = await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: av.slots[2].startsAt, petId: pet.id }, t.cookie);
    await flush();
    expect(to(oDev.endpoint).at(-1)!.msg).toMatchObject({ title: '🐾 Novo pedido de agendamento', url: `/empresas/${biz.id}/pedidos` });

    // Quem não fez pedido não consegue os aparelhos da empresa
    const stranger = await newUser();
    expect((await withUser(stranger.id, (db) => db.query(`SELECT * FROM app.push_targets_business($1)`, [biz.id]))).rows).toHaveLength(0);
    expect((await withUser(stranger.id, (db) => db.query(`SELECT * FROM app.push_targets_booking_owner($1)`, [bk.body.id]))).rows).toHaveLength(0);

    await call('POST', `/panel/businesses/${biz.id}/requests/booking/${bk.body.id}`, { action: 'confirm' }, o.cookie);
    await flush();
    expect(to(tDev.endpoint).at(-1)!.msg.title).toBe('✅ Horário confirmado');

    await call('POST', `/panel/businesses/${biz.id}/bookings/${bk.body.id}/live`, { stage: 'bath' }, o.cookie);
    await flush();
    expect(to(tDev.endpoint).at(-1)!.msg).toMatchObject({ title: '🛁 Thor: no banho', url: '/atividades' });

    // Aparelho que sumiu é esquecido
    gone.add(tDev.endpoint);
    await call('POST', `/panel/businesses/${biz.id}/bookings/${bk.body.id}/live`, { stage: 'drying' }, o.cookie);
    await flush();
    expect((await owner((db) => db.query(`SELECT 1 FROM push_subscriptions WHERE endpoint = $1`, [tDev.endpoint]))).rows).toHaveLength(0);
  });

  it('lembra o horário na véspera e chama o cliente de volta, uma vez só', async () => {
    resetRateLimits();
    const o = await newUser('Dono Lembrete');
    const { body: biz } = await call('POST', '/panel/businesses', {
      name: 'Banho Lembra', categorySlug: 'banho-e-tosa', shortDescription: 'Banho que lembra você.', cityIbge: 4209102, street: 'Rua B, 2',
      modeInPerson: true, modeAtCustomer: false, modeOnline: false, whatsapp: '47999990000', acceptsBooking: true, acceptsQuote: true,
    }, o.cookie);
    await call('PUT', `/panel/businesses/${biz.id}/hours`, allDays, o.cookie);
    const { body: svc } = await call('POST', `/panel/businesses/${biz.id}/services`, { name: 'Banho e tosa', priceType: 'fixed', priceMin: 80, durationMinutes: 60, bookable: true }, o.cookie);
    const t = await newUser('Tutor Esquecido');
    const tDev = device();
    await call('POST', '/me/push', tDev, t.cookie);
    const { body: pet } = await call('POST', '/me/pets', { name: 'Mel', species: 'dog' }, t.cookie);
    const av = (await call('GET', `/businesses/${biz.id}/availability?serviceId=${svc.id}&date=${day(1)}`)).body;
    const past = await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: av.slots[1].startsAt, petId: pet.id }, t.cookie);
    const soon = await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: av.slots[4].startsAt }, t.cookie);
    await owner(async (db) => {
      await db.query(`UPDATE bookings SET status = 'completed', starts_at = now() - interval '16 days', ends_at = now() - interval '16 days' + interval '1 hour' WHERE id = $1`, [past.body.id]);
      await db.query(`UPDATE bookings SET status = 'confirmed', starts_at = now() + interval '20 hours', ends_at = now() + interval '21 hours' WHERE id = $1`, [soon.body.id]);
    });
    sent.length = 0;
    const r = await runDueNotifications();
    expect(r.sent).toBeGreaterThanOrEqual(2);
    const mine = to(tDev.endpoint).map((s) => s.msg);
    expect(mine.find((m) => m.title === 'Lembrete: Banho e tosa')?.body).toMatch(/Banho Lembra/);
    expect(mine.find((m) => m.title === 'Hora de agendar para Mel?')).toMatchObject({ url: `/empresa/${biz.slug}/agendar?servico=${svc.id}` });
    expect(mine.find((m) => m.title === 'Hora de agendar para Mel?')!.body).toMatch(/Faz 16 dias/);
    // Não repete
    expect(to(tDev.endpoint).length).toBe(2);
    await runDueNotifications();
    expect(to(tDev.endpoint).length).toBe(2);
  });
});
