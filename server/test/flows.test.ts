import { describe, expect, it } from 'vitest';
import pg from 'pg';
import { pixPayload } from '@conecta/shared';
import { withUser } from '../src/db/pool';
import { resetRateLimits } from '../src/lib/rateLimit';
import { call, newUser, setupDatabase } from './helpers';

setupDatabase();

const allDays = Object.fromEntries(['0', '1', '2', '3', '4', '5', '6'].map((d) => [d, [['08:00', '22:00']]]));
const base = {
  shortDescription: 'Empresa de teste para os fluxos.', cityIbge: 4209102, street: 'Rua B, 2', modeInPerson: true, modeAtCustomer: true,
  modeOnline: false, whatsapp: '47999990000', acceptsBooking: true, acceptsQuote: true,
};
const day = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

async function owner<T>(fn: (db: pg.Client) => Promise<T>) {
  const db = new pg.Client({ connectionString: process.env.DATABASE_OWNER_URL });
  await db.connect();
  try { return await fn(db); } finally { await db.end(); }
}

async function newBusiness(cookie: string, name: string, categorySlug: string, service: Record<string, unknown>) {
  const { body: biz } = await call('POST', '/panel/businesses', { ...base, name, categorySlug }, cookie);
  await call('PUT', `/panel/businesses/${biz.id}/hours`, allDays, cookie);
  const { body: svc } = await call('POST', `/panel/businesses/${biz.id}/services`, { bookable: true, ...service }, cookie);
  return { biz, svc };
}

describe('agendamento por área', () => {
  it('hospedagem: entrada e saída numa reserva só, com sinal pelo Pix que só a empresa confirma', async () => {
    resetRateLimits();
    const o = await newUser('Dona Hotel');
    const { biz, svc } = await newBusiness(o.cookie, 'Hotelzinho Pet', 'hospedagem-e-creche',
      { name: 'Diária', priceType: 'fixed', priceMin: 90, bookingMode: 'day', deposit: 30 });
    expect((await call('PUT', `/panel/businesses/${biz.id}/settings`, { pixKey: 'chave inválida' }, o.cookie)).status).toBe(422);
    const set = await call('PUT', `/panel/businesses/${biz.id}/settings`, { pixKey: '(47) 99999-0000', loyaltyEvery: null }, o.cookie);
    expect(set.body.pixKey).toBe('+5547999990000');

    const pub = (await call('GET', `/businesses/${biz.slug}`)).body;
    expect(pub.pixKey).toBe('+5547999990000');
    expect(pub.services[0].depositCents).toBe(3000);

    const t = await newUser('Tutor Viajante');
    const av = (await call('GET', `/businesses/${biz.id}/availability?serviceId=${svc.id}&date=${day(2)}`)).body;
    const checkIn = av.slots[0];
    const bad = await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: checkIn.startsAt, untilDate: checkIn.label }, t.cookie);
    expect(bad.status).toBe(422);
    const r = await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: checkIn.startsAt, untilDate: av.slots[3].label }, t.cookie);
    expect(r.status).toBe(201);
    expect(r.body.ids).toHaveLength(1);
    expect(r.body.nights).toBe(3);
    expect(r.body.depositCents).toBe(9000);

    const act = (await call('GET', '/me/activities', undefined, t.cookie)).body[0];
    expect(act.endsAt.slice(0, 10)).toBe(av.slots[3].label);
    expect(act.deposit).toMatchObject({ cents: 9000, status: 'pending', pixKey: '+5547999990000', city: 'Joinville' });
    const code = pixPayload({ key: act.deposit.pixKey, amountCents: 9000, name: 'Hotelzinho Pet', city: 'Joinville' });
    expect(code).toContain('5405' + '90.00');

    // As noites ficam ocupadas
    const again = (await call('GET', `/businesses/${biz.id}/availability?serviceId=${svc.id}&date=${day(2)}`)).body;
    expect(again.slots.some((s: { label: string }) => s.label === av.slots[1].label)).toBe(false);

    // Tutor não confirma o próprio sinal; a empresa confirma
    expect((await call('POST', `/panel/businesses/${biz.id}/bookings/${r.body.id}/deposit-paid`, {}, t.cookie)).status).toBe(403);
    await expect(withUser(t.id, (db) => db.query(`UPDATE bookings SET deposit_status = 'paid' WHERE id = $1`, [r.body.id])))
      .rejects.toThrow(/deposit_not_allowed/);
    expect((await call('POST', `/panel/businesses/${biz.id}/bookings/${r.body.id}/deposit-paid`, {}, o.cookie)).status).toBe(200);
    expect((await call('GET', '/me/activities', undefined, t.cookie)).body[0].deposit.status).toBe('paid');
  });

  it('pet sitter: vários dias e turnos; passeador: dias da semana; táxi dog exige destino', async () => {
    resetRateLimits();
    const o = await newUser('Dona Sitter');
    const t = await newUser('Tutor');
    const sitter = await newBusiness(o.cookie, 'Sitter Amiga', 'pet-sitter', { name: 'Visita', priceType: 'fixed', priceMin: 50, bookingMode: 'period' });
    const av = (await call('GET', `/businesses/${sitter.biz.id}/availability?serviceId=${sitter.svc.id}&date=${day(3)}`)).body;
    const r = await call('POST', '/bookings', {
      businessId: sitter.biz.id, serviceId: sitter.svc.id, startsAt: av.slots[0].startsAt, untilDate: day(5), periods: ['morning', 'evening'],
      address: 'Rua das Palmeiras, 50 – ap 3', details: { houseNotes: 'Chave na portaria. Ração no armário.' },
    }, t.cookie);
    expect(r.status).toBe(201);
    expect(r.body.ids).toHaveLength(6);
    const req = (await call('GET', `/panel/businesses/${sitter.biz.id}/requests`, undefined, o.cookie)).body;
    const one = (Array.isArray(req) ? req : req.items)[0];
    expect(one.address).toBe('Rua das Palmeiras, 50 – ap 3');
    expect(one.details.houseNotes).toMatch(/portaria/);

    // O teste grátis vale uma vez por conta: cada empresa aqui tem seu dono.
    const o2 = await newUser('Dono Passeio');
    const o3 = await newUser('Dono Táxi');
    const walker = await newBusiness(o2.cookie, 'Passeios do Bairro', 'passeador', { name: 'Passeio 1h', priceType: 'fixed', priceMin: 35, durationMinutes: 60 });
    const wav = (await call('GET', `/businesses/${walker.biz.id}/availability?serviceId=${walker.svc.id}&date=${day(1)}`)).body;
    const first = wav.slots.find((s: { startsAt: string }) => new Date(s.startsAt).getUTCHours() === 12);
    const wd = new Date(`${day(1)}T12:00:00Z`).getUTCDay();
    expect((await call('POST', '/bookings', { businessId: walker.biz.id, serviceId: walker.svc.id, startsAt: first.startsAt }, t.cookie)).status).toBe(422);
    const w = await call('POST', '/bookings', {
      businessId: walker.biz.id, serviceId: walker.svc.id, startsAt: first.startsAt, address: 'Rua A, 1',
      weekdays: [wd, (wd + 2) % 7], repeat: { everyWeeks: 1, count: 2 },
    }, t.cookie);
    expect(w.status).toBe(201);
    expect(w.body.ids.length).toBeGreaterThanOrEqual(3);
    expect(w.body.seriesId).toBeTruthy();

    const taxi = await newBusiness(o3.cookie, 'Táxi Dog Rápido', 'pet-taxi', { name: 'Corrida', priceType: 'from', priceMin: 25, durationMinutes: 60 });
    const tav = (await call('GET', `/businesses/${taxi.biz.id}/availability?serviceId=${taxi.svc.id}&date=${day(2)}`)).body;
    expect((await call('POST', '/bookings', { businessId: taxi.biz.id, serviceId: taxi.svc.id, startsAt: tav.slots[2].startsAt, address: 'Rua A, 1' }, t.cookie)).status).toBe(422);
    const ride = await call('POST', '/bookings', {
      businessId: taxi.biz.id, serviceId: taxi.svc.id, startsAt: tav.slots[2].startsAt, address: 'Rua A, 1', destination: 'Clínica Vet Centro', details: { roundTrip: true, returnTime: '18:00' },
    }, t.cookie);
    expect(ride.status).toBe(201);
    const act = (await call('GET', '/me/activities', undefined, t.cookie)).body.find((a: { id: string }) => a.id === ride.body.id);
    expect(act).toMatchObject({ address: 'Rua A, 1', destination: 'Clínica Vet Centro', details: { roundTrip: true, returnTime: '18:00' } });
  });
});

describe('benefícios do plano', () => {
  it('clube de pacotes: pedido, ativação pela empresa e uso nas sessões', async () => {
    resetRateLimits();
    const o = await newUser('Dono Banho');
    const { biz, svc } = await newBusiness(o.cookie, 'Banho Clube', 'banho-e-tosa', { name: 'Banho', priceType: 'fixed', priceMin: 60, durationMinutes: 60, deposit: 20 });
    await call('PUT', `/panel/businesses/${biz.id}/settings`, { pixKey: 'dono@banho.com', loyaltyEvery: 3 }, o.cookie);
    const p = await call('POST', `/panel/businesses/${biz.id}/packages`, { serviceId: svc.id, name: '4 banhos no mês', sessions: 4, price: 200, validityDays: 30 }, o.cookie);
    expect(p.status).toBe(201);

    const pub = (await call('GET', `/businesses/${biz.slug}`)).body;
    expect(pub.packages).toHaveLength(1);
    expect(pub.packages[0]).toMatchObject({ name: '4 banhos no mês', sessions: 4, priceCents: 20000, singlePriceCents: 6000 });
    expect(pub.loyaltyEvery).toBe(3);
    expect(pub.myLoyaltyVisits).toBeNull();

    const t = await newUser('Tutora Fiel');
    const req = await call('POST', '/me/packages', { packageId: pub.packages[0].id }, t.cookie);
    expect(req.status).toBe(201);
    expect((await call('POST', '/me/packages', { packageId: pub.packages[0].id }, t.cookie)).status).toBe(409);
    const cpId = req.body.id;

    const av = (await call('GET', `/businesses/${biz.id}/availability?serviceId=${svc.id}&date=${day(2)}`)).body;
    expect((await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: av.slots[1].startsAt, customerPackageId: cpId }, t.cookie)).status).toBe(422);

    const list = (await call('GET', `/panel/businesses/${biz.id}/customer-packages`, undefined, o.cookie)).body;
    expect(list[0]).toMatchObject({ status: 'requested', customerName: 'Tutora Fiel', priceCents: 20000 });
    expect((await call('POST', `/panel/businesses/${biz.id}/customer-packages/${cpId}`, { action: 'activate' }, t.cookie)).status).toBe(403);
    expect((await call('POST', `/panel/businesses/${biz.id}/customer-packages/${cpId}`, { action: 'activate' }, o.cookie)).status).toBe(200);

    let mine = (await call('GET', '/me/packages', undefined, t.cookie)).body;
    expect(mine[0]).toMatchObject({ status: 'active', remaining: 4 });
    const b1 = await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: av.slots[1].startsAt, customerPackageId: cpId }, t.cookie);
    expect(b1.status).toBe(201);
    expect(b1.body.depositCents).toBeNull(); // sessão já paga no pacote: sem sinal
    mine = (await call('GET', '/me/packages', undefined, t.cookie)).body;
    expect(mine[0].remaining).toBe(3);

    // Outra pessoa não usa o pacote
    const other = await newUser();
    expect((await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: av.slots[3].startsAt, customerPackageId: cpId }, other.cookie)).status).toBe(422);
    // Avulso cobra o sinal
    const avulso = await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: av.slots[4].startsAt }, other.cookie);
    expect(avulso.body.depositCents).toBe(2000);
  });

  it('cartão fidelidade, lembrete de retorno e relatório do mês', async () => {
    resetRateLimits();
    const o = await newUser('Dona Relatório');
    const { biz, svc } = await newBusiness(o.cookie, 'Banho Relatório', 'banho-e-tosa', { name: 'Banho e tosa', priceType: 'fixed', priceMin: 80, durationMinutes: 60 });
    await call('PUT', `/panel/businesses/${biz.id}/settings`, { pixKey: null, loyaltyEvery: 3 }, o.cookie);
    const t = await newUser('Tutor Sumido');
    const { body: pet } = await call('POST', '/me/pets', { name: 'Thor', species: 'dog' }, t.cookie);
    const av = (await call('GET', `/businesses/${biz.id}/availability?serviceId=${svc.id}&date=${day(1)}`)).body;
    const a = await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: av.slots[1].startsAt, petId: pet.id }, t.cookie);
    const b = await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: av.slots[3].startsAt, petId: pet.id }, t.cookie);
    // Os dois atendimentos aconteceram há 20 e 18 dias
    await owner((db) => db.query(
      `UPDATE bookings SET status = 'completed', completed_at = now(), starts_at = now() - make_interval(days => CASE WHEN id = $1 THEN 20 ELSE 18 END),
         ends_at = now() - make_interval(days => CASE WHEN id = $1 THEN 20 ELSE 18 END) + interval '1 hour' WHERE id IN ($1, $2)`, [a.body.id, b.body.id]));

    const pub = (await call('GET', `/businesses/${biz.slug}`, undefined, t.cookie)).body;
    expect(pub.myLoyaltyVisits).toBe(2);
    const reqs = (await call('GET', `/panel/businesses/${biz.id}/requests`, undefined, o.cookie)).body;
    expect((Array.isArray(reqs) ? reqs : reqs.items).find((x: { id: string }) => x.id === a.body.id).customerVisits).toBe(2);

    const rem = (await call('GET', '/me/reminders', undefined, t.cookie)).body;
    expect(rem[0]).toMatchObject({ petName: 'Thor', serviceName: 'Banho e tosa', daysSince: 18, business: { slug: biz.slug } });

    const month = new Date(Date.now() - 18 * 86_400_000).toISOString().slice(0, 7);
    const rep = (await call('GET', `/panel/businesses/${biz.id}/reports?month=${month}`, undefined, o.cookie)).body;
    expect(rep.completed).toBeGreaterThanOrEqual(1);
    expect(rep.revenueCents % 8000).toBe(0);
    expect(rep.topServices[0].name).toBe('Banho e tosa');
    expect((await call('GET', `/panel/businesses/${biz.id}/reports?month=2026-13`, undefined, o.cookie)).status).toBe(422);
    expect((await call('GET', `/panel/businesses/${biz.id}/reports`, undefined, t.cookie)).status).toBe(403);

    // Sem assinatura: a empresa sai do app e o painel fica bloqueado para alterações
    await owner((db) => db.query(`UPDATE businesses SET plan = 'free', plan_until = NULL WHERE id = $1`, [biz.id]));
    expect((await call('GET', `/businesses/${biz.slug}`, undefined, t.cookie)).status).toBe(404);
    expect((await call('GET', `/businesses/${biz.slug}`, undefined, o.cookie)).status).toBe(200); // a equipe ainda vê
    expect((await call('GET', `/panel/businesses/${biz.id}/reports`, undefined, o.cookie)).status).toBe(402);
    expect((await call('PUT', `/panel/businesses/${biz.id}/settings`, { pixKey: null, loyaltyEvery: 5 }, o.cookie)).status).toBe(402);
  });
});
