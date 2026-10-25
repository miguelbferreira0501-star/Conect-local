import { describe, expect, it } from 'vitest';
import pg from 'pg';
import { resetRateLimits } from '../src/lib/rateLimit';
import { call, newUser, setupDatabase } from './helpers';

setupDatabase();

const allDays = Object.fromEntries(['0', '1', '2', '3', '4', '5', '6'].map((d) => [d, [['08:00', '22:00']]]));
const base = {
  shortDescription: 'Empresa de teste para agendas.', cityIbge: 4209102, street: 'Rua B, 2', modeInPerson: true, modeAtCustomer: true,
  modeOnline: false, whatsapp: '47999990000', acceptsBooking: true, acceptsQuote: true,
};
const day = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

async function setPlan(id: string, plan: string) {
  const db = new pg.Client({ connectionString: process.env.DATABASE_OWNER_URL });
  await db.connect();
  await db.query(`UPDATE businesses SET plan = $2 WHERE id = $1`, [id, plan]);
  await db.end();
}

describe('agendas com profissionais', () => {
  it('dois clientes no mesmo horário com profissionais diferentes; o terceiro não consegue', async () => {
    resetRateLimits();
    const owner = await newUser();
    const { body: biz } = await call('POST', '/panel/businesses', { ...base, name: 'Salão Duas Cadeiras', categorySlug: 'estetica-e-beleza' }, owner.cookie);
    await setPlan(biz.id, 'pro');
    await call('PUT', `/panel/businesses/${biz.id}/hours`, allDays, owner.cookie);
    const { body: svc } = await call('POST', `/panel/businesses/${biz.id}/services`, { name: 'Escova', priceType: 'fixed', priceMin: 60, durationMinutes: 60, bookable: true }, owner.cookie);
    const { body: ana } = await call('POST', `/panel/businesses/${biz.id}/staff`, { name: 'Ana', kind: 'person', serviceIds: [svc.id] }, owner.cookie);
    const { body: bia } = await call('POST', `/panel/businesses/${biz.id}/staff`, { name: 'Bia', kind: 'person' }, owner.cookie);

    const detail = (await call('GET', `/businesses/${biz.slug}`)).body;
    expect(detail.staff.map((s: { name: string }) => s.name)).toEqual(['Ana', 'Bia']);
    expect(detail.staffLabel).toBe('Profissional');

    const av = (await call('GET', `/businesses/${biz.id}/availability?serviceId=${svc.id}&date=${day(2)}`)).body;
    expect(av.mode).toBe('slot');
    const slot = av.slots[0];
    expect(slot.staffIds.sort()).toEqual([ana.id, bia.id].sort());

    const [c1, c2, c3] = [await newUser(), await newUser(), await newUser()];
    const b1 = await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: slot.startsAt, staffId: ana.id }, c1.cookie);
    expect(b1.status).toBe(201);
    const b2 = await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: slot.startsAt }, c2.cookie); // sem preferência → Bia
    expect(b2.status).toBe(201);
    expect((await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: slot.startsAt }, c3.cookie)).status).toBe(409);

    const acts = (await call('GET', '/me/activities', undefined, c2.cookie)).body;
    expect(acts[0].staffName).toBe('Bia');
    const agenda = (await call('GET', `/panel/businesses/${biz.id}/agenda?days=7`, undefined, owner.cookie)).body;
    expect(agenda.map((a: { staffName: string }) => a.staffName).sort()).toEqual(['Ana', 'Bia']);
  });

  it('dia e turno (serviços em casa) e diária (espaço de eventos)', async () => {
    resetRateLimits();
    const owner = await newUser();
    const { body: biz } = await call('POST', '/panel/businesses', { ...base, name: 'Limpa Casa', categorySlug: 'limpeza' }, owner.cookie);
    await call('PUT', `/panel/businesses/${biz.id}/hours`, allDays, owner.cookie);
    const { body: svc } = await call('POST', `/panel/businesses/${biz.id}/services`, { name: 'Faxina', priceType: 'from', priceMin: 200, bookable: true, bookingMode: 'period' }, owner.cookie);
    const av = (await call('GET', `/businesses/${biz.id}/availability?serviceId=${svc.id}&date=${day(3)}`)).body;
    expect(av.mode).toBe('period');
    expect(av.slots.map((s: { label: string }) => s.label)).toEqual(['morning', 'afternoon', 'evening']);
    const c = await newUser();
    const morning = av.slots[0];
    expect((await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: morning.startsAt }, c.cookie)).status).toBe(201);
    const after = (await call('GET', `/businesses/${biz.id}/availability?serviceId=${svc.id}&date=${day(3)}`)).body;
    expect(after.slots.map((s: { label: string }) => s.label)).toEqual(['afternoon', 'evening']);
    expect((await call('GET', '/me/activities', undefined, c.cookie)).body[0].period).toBe('morning');

    const { body: hall } = await call('POST', '/panel/businesses', { ...base, name: 'Salão Festa', categorySlug: 'espacos-para-eventos' }, owner.cookie);
    await call('PUT', `/panel/businesses/${hall.id}/hours`, allDays, owner.cookie);
    const { body: diaria } = await call('POST', `/panel/businesses/${hall.id}/services`, { name: 'Locação (diária)', priceType: 'fixed', priceMin: 1500, bookable: true, bookingMode: 'day' }, owner.cookie);
    const days = (await call('GET', `/businesses/${hall.id}/availability?serviceId=${diaria.id}&date=${day(1)}`)).body;
    expect(days.mode).toBe('day');
    expect(days.slots.length).toBeGreaterThan(50);
    const chosen = days.slots[5];
    expect((await call('POST', '/bookings', { businessId: hall.id, serviceId: diaria.id, startsAt: chosen.startsAt }, c.cookie)).status).toBe(201);
    const again = (await call('GET', `/businesses/${hall.id}/availability?serviceId=${diaria.id}&date=${day(1)}`)).body;
    expect(again.slots.some((s: { startsAt: string }) => s.startsAt === chosen.startsAt)).toBe(false);
  });
});

describe('restaurantes', () => {
  it('busca por tipo de comida, seção "Onde comer" e reserva com número de pessoas', async () => {
    resetRateLimits();
    const pizza = (await call('GET', '/search?city=4209102&q=pizzaria')).body;
    expect(pizza.total).toBeGreaterThan(0);
    expect(pizza.items.every((b: { category: { slug: string } }) => b.category.slug === 'restaurantes')).toBe(true);
    const japa = (await call('GET', '/search?city=4209102&q=comida japonesa')).body;
    expect(japa.items[0].category.slug).toBe('restaurantes');

    const home = (await call('GET', '/discover?city=4209102')).body;
    expect(home.sections[0].id).toBe('restaurants');
    expect(home.sections[0].title).toBe('Onde comer em Joinville');
    const cats = (await call('GET', '/categories')).body;
    expect(cats[0].slug).toBe('restaurantes');

    const owner = await newUser();
    const { body: biz } = await call('POST', '/panel/businesses', { ...base, name: 'Restaurante Teste', categorySlug: 'restaurantes', modeAtCustomer: false }, owner.cookie);
    await call('PUT', `/panel/businesses/${biz.id}/hours`, allDays, owner.cookie);
    const { body: svc } = await call('POST', `/panel/businesses/${biz.id}/services`, { name: 'Reserva de mesa', priceType: 'quote', durationMinutes: 120, bookable: true }, owner.cookie);
    await call('POST', `/panel/businesses/${biz.id}/staff`, { name: 'Varanda', kind: 'resource' }, owner.cookie);
    const detail = (await call('GET', `/businesses/${biz.slug}`)).body;
    expect(detail.staffLabel).toBe('Mesa');
    const slot = (await call('GET', `/businesses/${biz.id}/availability?serviceId=${svc.id}&date=${day(2)}`)).body.slots[0];
    const c = await newUser();
    expect((await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: slot.startsAt, partySize: 60 }, c.cookie)).status).toBe(422);
    expect((await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: slot.startsAt, partySize: 4 }, c.cookie)).status).toBe(201);
    expect((await call('GET', '/me/activities', undefined, c.cookie)).body[0].partySize).toBe(4);
    const reqs = (await call('GET', `/panel/businesses/${biz.id}/requests`, undefined, owner.cookie)).body;
    expect(reqs[0].partySize).toBe(4);
    expect(reqs[0].staffName).toBe('Varanda');
  });
});
