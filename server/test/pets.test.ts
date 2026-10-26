import { describe, expect, it } from 'vitest';
import pg from 'pg';
import { resetRateLimits } from '../src/lib/rateLimit';
import { app, call, newUser, setupDatabase } from './helpers';

setupDatabase();

const allDays = Object.fromEntries(['0', '1', '2', '3', '4', '5', '6'].map((d) => [d, [['07:00', '22:00']]]));
const profile = {
  name: 'Banho Teste Pataí', categorySlug: 'banho-e-tosa', shortDescription: 'Banho e tosa sem estresse.', cityIbge: 4209102, street: 'Rua Pet, 10',
  modeInPerson: true, modeAtCustomer: false, modeOnline: false, whatsapp: '47999990000', acceptsBooking: true, acceptsQuote: true,
};
const day = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
// JPEG mínimo válido (assinatura ffd8ff)
const JPEG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';

async function setupShop() {
  resetRateLimits();
  const owner = await newUser('Dona do Pet Shop');
  const { body: biz } = await call('POST', '/panel/businesses', { ...profile, name: `Banho Teste ${Date.now()}` }, owner.cookie);
  await call('PUT', `/panel/businesses/${biz.id}/hours`, allDays, owner.cookie);
  const { body: svc } = await call('POST', `/panel/businesses/${biz.id}/services`, { name: 'Banho — porte pequeno', priceType: 'fixed', priceMin: 55, durationMinutes: 60, bookable: true }, owner.cookie);
  return { owner, biz, svc };
}

describe('ficha do pet', () => {
  it('cadastra, edita, põe foto; outra pessoa não vê nem usa o pet', async () => {
    resetRateLimits();
    const tutor = await newUser('Tutora Ana');
    const bad = await call('POST', '/me/pets', { name: '', species: 'dog' }, tutor.cookie);
    expect(bad.status).toBe(422);
    const { status, body: pet } = await call('POST', '/me/pets', {
      name: 'Thor', species: 'dog', breed: 'Shih-tzu', size: 'small', birthYear: 2021, weightKg: 6.5,
      temperament: ['Medroso', 'Medo de secador'], healthNotes: 'Alergia a perfume', groomingNotes: 'Tosa bebê', vaccinesUpToDate: true,
    }, tutor.cookie);
    expect(status).toBe(201);
    expect(pet).toMatchObject({ name: 'Thor', size: 'small', weightKg: 6.5, temperament: ['Medroso', 'Medo de secador'], photoUrl: null });

    const withPhoto = await call('PUT', `/me/pets/${pet.id}/photo`, { dataUrl: JPEG }, tutor.cookie);
    expect(withPhoto.body.photoUrl).toMatch(new RegExp(`^/api/pets/${pet.id}/photo`));
    expect((await call('PUT', `/me/pets/${pet.id}/photo`, { dataUrl: 'data:image/png;base64,AAAA' }, tutor.cookie)).status).toBe(422);

    const photo = await app.request(withPhoto.body.photoUrl, { headers: { cookie: tutor.cookie, 'x-requested-with': 'conecta' } });
    expect(photo.status).toBe(200);
    expect(photo.headers.get('content-type')).toBe('image/jpeg');

    const stranger = await newUser('Curioso');
    expect((await call('GET', '/me/pets', undefined, stranger.cookie)).body).toEqual([]);
    expect((await call('PUT', `/me/pets/${pet.id}`, { name: 'Roubado', species: 'dog' }, stranger.cookie)).status).toBe(404);
    expect((await app.request(withPhoto.body.photoUrl, { headers: { cookie: stranger.cookie, 'x-requested-with': 'conecta' } })).status).toBe(404);

    // Agendar com pet de outra pessoa: recusado na API e no banco
    const { biz, svc } = await setupShop();
    const slot = (await call('GET', `/businesses/${biz.id}/availability?serviceId=${svc.id}&date=${day(2)}`)).body.slots[0];
    expect((await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: slot.startsAt, petId: pet.id }, stranger.cookie)).status).toBe(422);
    const db = new pg.Client({ connectionString: process.env.DATABASE_OWNER_URL });
    await db.connect();
    await expect(db.query(`INSERT INTO bookings (user_id, business_id, service_id, starts_at, ends_at, pet_id) VALUES ($1, $2, $3, now() + interval '3 days', now() + interval '3 days 1 hour', $4)`,
      [stranger.id, biz.id, svc.id, pet.id])).rejects.toThrow(/pet_not_owned/);
    await db.end();
  });
});

describe('Pet ao Vivo', () => {
  it('empresa vê a ficha, manda etapas com foto; a etapa final conclui e libera a avaliação', async () => {
    const { owner, biz, svc } = await setupShop();
    const tutor = await newUser('Tutor Bruno');
    const { body: pet } = await call('POST', '/me/pets', { name: 'Mel', species: 'cat', careNotes: 'Tem medo de cães' }, tutor.cookie);
    const slot = (await call('GET', `/businesses/${biz.id}/availability?serviceId=${svc.id}&date=${day(0)}`)).body.slots.at(-1)
      ?? (await call('GET', `/businesses/${biz.id}/availability?serviceId=${svc.id}&date=${day(1)}`)).body.slots[0];
    const { body: booking } = await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: slot.startsAt, petId: pet.id }, tutor.cookie);

    const reqs = (await call('GET', `/panel/businesses/${biz.id}/requests`, undefined, owner.cookie)).body;
    expect(reqs[0].pet).toMatchObject({ name: 'Mel', species: 'cat', careNotes: 'Tem medo de cães' });
    const live = `/panel/businesses/${biz.id}/bookings/${booking.id}/live`;
    expect((await call('POST', live, { stage: 'checkin' }, owner.cookie)).status).toBe(409); // ainda não confirmado

    await call('POST', `/panel/businesses/${biz.id}/requests/booking/${booking.id}`, { action: 'confirm' }, owner.cookie);
    expect((await call('POST', live, { stage: 'checkin', note: 'Chegou tranquila', photo: JPEG }, owner.cookie)).status).toBe(201);
    expect((await call('POST', live, { stage: 'bath' }, owner.cookie)).status).toBe(201);
    expect((await call('POST', live, { stage: 'voando' }, owner.cookie)).status).toBe(422);

    // Outra empresa não posta neste agendamento
    const other = await newUser('Outra Loja');
    expect((await call('POST', live, { stage: 'bath' }, other.cookie)).status).toBe(403);

    let acts = (await call('GET', '/me/activities', undefined, tutor.cookie)).body;
    expect(acts[0].pet).toEqual({ id: pet.id, name: 'Mel' });
    expect(acts[0].live).toMatchObject({ count: 2, lastStage: 'bath' });
    expect(acts[0].canReview).toBe(false);

    const timeline = (await call('GET', `/bookings/${booking.id}/live`, undefined, tutor.cookie)).body;
    expect(timeline.map((u: { stage: string }) => u.stage)).toEqual(['checkin', 'bath']);
    expect(timeline[0].note).toBe('Chegou tranquila');
    const photo = await app.request(timeline[0].photoUrl, { headers: { cookie: tutor.cookie, 'x-requested-with': 'conecta' } });
    expect(photo.status).toBe(200);
    // Quem não é o tutor nem a empresa não vê a linha do tempo nem a foto
    expect((await call('GET', `/bookings/${booking.id}/live`, undefined, other.cookie)).status).toBe(404);
    expect((await app.request(timeline[0].photoUrl, { headers: { cookie: other.cookie, 'x-requested-with': 'conecta' } })).status).toBe(404);
    // A empresa vê a foto do pet que tem pedido com ela
    await call('PUT', `/me/pets/${pet.id}/photo`, { dataUrl: JPEG }, tutor.cookie);
    const petPhoto = (await call('GET', `/panel/businesses/${biz.id}/requests`, undefined, owner.cookie)).body[0].pet.photoUrl;
    expect((await app.request(petPhoto, { headers: { cookie: owner.cookie, 'x-requested-with': 'conecta' } })).status).toBe(200);

    expect((await call('POST', live, { stage: 'ready', photo: JPEG }, owner.cookie)).status).toBe(201);
    acts = (await call('GET', '/me/activities', undefined, tutor.cookie)).body;
    expect(acts[0].status).toBe('completed');
    expect(acts[0].canReview).toBe(true);
    const agenda = (await call('GET', `/panel/businesses/${biz.id}/agenda?days=7&from=${encodeURIComponent(new Date(Date.now() - 86_400_000).toISOString())}`, undefined, owner.cookie)).body;
    expect(agenda.find((a: { id: string }) => a.id === booking.id)).toMatchObject({ liveCount: 3, pet: { name: 'Mel' } });
  });
});

describe('agendamento recorrente', () => {
  it('toda semana: cria a série; "cancelar os próximos" para a partir do escolhido', async () => {
    const { biz, svc } = await setupShop();
    const tutor = await newUser('Tutora Passeio');
    const slot = (await call('GET', `/businesses/${biz.id}/availability?serviceId=${svc.id}&date=${day(2)}`)).body.slots[2];
    const r = await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: slot.startsAt, repeat: { everyWeeks: 1, count: 4 } }, tutor.cookie);
    expect(r.status).toBe(201);
    expect(r.body.ids).toHaveLength(4);
    expect(r.body.skipped).toEqual([]);

    let mine = (await call('GET', '/me/activities', undefined, tutor.cookie)).body.filter((a: { seriesId: string }) => a.seriesId === r.body.seriesId);
    expect(mine).toHaveLength(4);
    const times = mine.map((a: { startsAt: string }) => new Date(a.startsAt).getTime()).sort();
    expect(times[1] - times[0]).toBe(7 * 86_400_000);

    // Outro cliente pega a 3ª semana? Não: o horário já está ocupado pela série.
    const other = await newUser();
    expect((await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: new Date(times[2]).toISOString() }, other.cookie)).status).toBe(409);

    const second = mine.find((a: { startsAt: string }) => new Date(a.startsAt).getTime() === times[1]);
    expect((await call('POST', `/bookings/${second.id}/cancel-series`, {}, tutor.cookie)).body.cancelled).toBe(3);
    mine = (await call('GET', '/me/activities', undefined, tutor.cookie)).body.filter((a: { seriesId: string }) => a.seriesId === r.body.seriesId);
    expect(mine.filter((a: { status: string }) => a.status === 'cancelled')).toHaveLength(3);
    expect((await call('POST', `/bookings/${second.id}/cancel-series`, {}, other.cookie)).status).toBe(404);

    expect((await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: slot.startsAt, repeat: { everyWeeks: 3, count: 4 } }, tutor.cookie)).status).toBe(422);
  });
});
