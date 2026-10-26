import { describe, expect, it } from 'vitest';
import pg from 'pg';
import { withUser } from '../src/db/pool';
import { resetRateLimits } from '../src/lib/rateLimit';
import { call, newUser, setupDatabase } from './helpers';

setupDatabase();

const profile = {
  name: 'Elétrica Teste Real', categorySlug: 'banho-e-tosa', shortDescription: 'Instalações elétricas residenciais com garantia.',
  description: 'Atendemos casas e apartamentos.', cityIbge: 4209102, neighborhood: 'Centro', street: '', addressPublic: true,
  serviceAreaCities: [4201307, 4209102], modeInPerson: false, modeAtCustomer: true, modeOnline: false,
  whatsapp: '(47) 99999-1111', priceLevel: 2, acceptsBooking: true, acceptsQuote: true,
};
// JPEG mínimo válido (1×1)
const JPEG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

describe('painel das empresas', () => {
  it('cadastro completo: empresa aparece na hora para os clientes', async () => {
    resetRateLimits();
    const owner = await newUser('Dono Empresa');
    const invalid = await call('POST', '/panel/businesses', { ...profile, whatsapp: '', phone: '' }, owner.cookie);
    expect(invalid.status).toBe(422);
    expect(invalid.body.error.fields.whatsapp).toBeDefined();

    const created = await call('POST', '/panel/businesses', profile, owner.cookie);
    expect(created.status).toBe(201);
    const id = created.body.id;
    expect(created.body.slug).toBe('eletrica-teste-real-joinville');

    expect((await call('POST', `/panel/businesses/${id}/services`, { name: 'Troca de tomada', priceType: 'fixed', priceMin: 80, durationMinutes: 60, bookable: true }, owner.cookie)).status).toBe(201);
    expect((await call('POST', `/panel/businesses/${id}/services`, { name: 'Faixa sem máximo', priceType: 'range', priceMin: 100 }, owner.cookie)).status).toBe(422);
    expect((await call('PUT', `/panel/businesses/${id}/hours`, { '1': [['08:00', '18:00']], '2': [['18:00', '08:00']] }, owner.cookie)).status).toBe(422);
    expect((await call('PUT', `/panel/businesses/${id}/hours`, { '1': [['08:00', '18:00']], '3': [['08:00', '18:00']] }, owner.cookie)).status).toBe(200);
    const logo = await call('POST', `/panel/businesses/${id}/images`, { kind: 'logo', dataUrl: JPEG }, owner.cookie);
    expect(logo.status).toBe(201);
    const fake = await call('POST', `/panel/businesses/${id}/images`, { kind: 'photo', dataUrl: 'data:image/png;base64,SGVsbG8gbXVuZG8=' }, owner.cookie);
    expect(fake.status).toBe(422);

    const img = await call('GET', logo.body.url.replace('/api', ''));
    expect(img.status).toBe(200);
    expect(img.headers.get('content-type')).toBe('image/jpeg');

    const search = await call('GET', '/search?city=4209102&q=eletrica teste');
    expect(search.body.items.some((b: { id: string }) => b.id === id)).toBe(true);
    const inArea = await call('GET', '/search?city=4201307&q=tomada');
    expect(inArea.body.items.find((b: { id: string }) => b.id === id)?.locationMatch).toBe('servesCity');
    const detail = await call('GET', `/businesses/${created.body.slug}`);
    expect(detail.body.isDemo).toBe(false);
    expect(detail.body.logoUrl).toBe(logo.body.url);
    expect(detail.body.coordinates).toBeNull(); // sem geocodificação: não inventamos localização
  });

  it('empresa recebe, confirma e responde pedidos; cliente vê a resposta', async () => {
    resetRateLimits();
    const owner = await newUser('Dona Salão');
    const customer = await newUser('Cliente Feliz');
    const { body: biz } = await call('POST', '/panel/businesses', { ...profile, name: 'Salão Teste', categorySlug: 'banho-e-tosa', modeInPerson: true, street: 'Rua A, 10' }, owner.cookie);
    const { body: svc } = await call('POST', `/panel/businesses/${biz.id}/services`, { name: 'Corte', priceType: 'fixed', priceMin: 50, durationMinutes: 30, bookable: true }, owner.cookie);
    const allDays = Object.fromEntries(['0', '1', '2', '3', '4', '5', '6'].map((d) => [d, [['00:00', '23:30']]]));
    await call('PUT', `/panel/businesses/${biz.id}/hours`, allDays, owner.cookie);

    const date = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
    const slot = (await call('GET', `/businesses/${biz.id}/availability?serviceId=${svc.id}&date=${date}`)).body.slots[0].startsAt;
    const booking = await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: slot, contactPhone: '47988887777' }, customer.cookie);
    expect(booking.status).toBe(201);
    const quote = await call('POST', '/quotes', { businessId: biz.id, description: 'Quero um orçamento para noiva.', contactPreference: 'whatsapp', contactPhone: '47988887777' }, customer.cookie);
    expect(quote.status).toBe(201);

    const reqs = await call('GET', `/panel/businesses/${biz.id}/requests`, undefined, owner.cookie);
    expect(reqs.body).toHaveLength(2);
    expect(reqs.body[0].customer.name).toBe('Cliente Feliz');
    expect(reqs.body.find((r: { type: string }) => r.type === 'booking').customer.phone).toBe('47988887777');

    expect((await call('POST', `/panel/businesses/${biz.id}/requests/booking/${booking.body.id}`, { action: 'confirm' }, owner.cookie)).status).toBe(200);
    expect((await call('POST', `/panel/businesses/${biz.id}/requests/quote/${quote.body.id}`, { action: 'answer' }, owner.cookie)).status).toBe(422);
    expect((await call('POST', `/panel/businesses/${biz.id}/requests/quote/${quote.body.id}`, { action: 'answer', message: 'Pacote noiva R$ 350.' }, owner.cookie)).status).toBe(200);

    const acts = (await call('GET', '/me/activities', undefined, customer.cookie)).body;
    expect(acts.find((a: { id: string }) => a.id === booking.body.id).status).toBe('confirmed');
    const q = acts.find((a: { id: string }) => a.id === quote.body.id);
    expect(q.status).toBe('answered');
    expect(q.businessMessage).toBe('Pacote noiva R$ 350.');

    const dash = (await call('GET', `/panel/businesses/${biz.id}`, undefined, owner.cookie)).body;
    expect(dash.stats.requestsReceived).toBe(2);
    expect(dash.stats.requestsAnswered).toBe(2);
  });

  it('isolamento: ninguém mexe na empresa de outra pessoa nem se torna dono de uma existente', async () => {
    resetRateLimits();
    const owner = await newUser();
    const intruder = await newUser();
    const { body: biz } = await call('POST', '/panel/businesses', { ...profile, name: 'Empresa Protegida' }, owner.cookie);
    expect((await call('GET', `/panel/businesses/${biz.id}`, undefined, intruder.cookie)).status).toBe(403);
    expect((await call('PUT', `/panel/businesses/${biz.id}/profile`, { ...profile, name: 'Hackeada' }, intruder.cookie)).status).toBe(403);
    expect((await call('GET', `/panel/businesses/${biz.id}/requests`, undefined, intruder.cookie)).status).toBe(403);

    // Direto no banco, burlando a API:
    const updated = await withUser(intruder.id, (db) => db.query(`UPDATE businesses SET name = 'Hackeada' WHERE id = $1`, [biz.id]));
    expect(updated.rowCount).toBe(0);
    await expect(withUser(intruder.id, (db) => db.query(`INSERT INTO business_members (business_id, user_id, role) VALUES ($1, $2, 'owner')`, [biz.id, intruder.id]))).rejects.toThrow(/row-level security/);
    const demo = (await call('GET', '/search?city=4209102')).body.items[0];
    await expect(withUser(intruder.id, (db) => db.query(`INSERT INTO business_members (business_id, user_id, role) VALUES ($1, $2, 'owner')`, [demo.id, intruder.id]))).rejects.toThrow(/row-level security/);
    // Não consegue se autoverificar nem criar empresa já verificada
    await expect(withUser(intruder.id, (db) => db.query(`INSERT INTO businesses (slug, name, category_id, city_ibge, verified_at) VALUES ('x', 'x', 1, 4209102, now())`))).rejects.toThrow(/permission denied/);
    const leaked = await withUser(intruder.id, (db) => db.query(`SELECT * FROM app.business_customer($1, $2)`, [biz.id, owner.id]));
    expect(leaked.rowCount).toBe(0);
  });

  it('e-mail listado em ADMIN_EMAILS vira administrador ao abrir /admin, sem reiniciar', async () => {
    resetRateLimits();
    const r = await call('POST', '/auth/register', { name: 'Chefe', email: 'chefe@teste.com', password: 'Senha1234', acceptTerms: true });
    expect(r.status).toBe(201);
    expect((await call('GET', '/admin/me', undefined, r.cookie)).status).toBe(200);
    const other = await newUser('Curioso');
    expect((await call('GET', '/admin/me', undefined, other.cookie)).status).toBe(403);
  });

  it('administrador suspende e verifica; empresa suspensa some da busca', async () => {
    resetRateLimits();
    const admin = await newUser('Admin');
    const owner = await newUser();
    const { body: biz } = await call('POST', '/panel/businesses', { ...profile, name: 'Empresa Duvidosa' }, owner.cookie);
    expect((await call('GET', '/admin/businesses', undefined, admin.cookie)).status).toBe(403);
    const ownerDb = new pg.Client({ connectionString: process.env.DATABASE_OWNER_URL });
    await ownerDb.connect();
    await ownerDb.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [admin.id]);
    await ownerDb.end();
    const list = await call('GET', '/admin/businesses?q=duvidosa', undefined, admin.cookie);
    expect(list.body).toHaveLength(1);
    expect((await call('PATCH', `/admin/businesses/${biz.id}`, { status: 'suspended', verified: false, reason: 'Denúncias' }, admin.cookie)).status).toBe(200);
    expect((await call('GET', '/search?city=4209102&q=duvidosa')).body.total).toBe(0);
    expect((await call('GET', `/panel/businesses/${biz.id}`, undefined, owner.cookie)).body.status).toBe('suspended');
    await call('PATCH', `/admin/businesses/${biz.id}`, { status: 'active', verified: true }, admin.cookie);
    const found = (await call('GET', '/search?city=4209102&q=duvidosa')).body.items[0];
    expect(found.badges).toContain('verified');
    await expect(withUser(owner.id, (db) => db.query(`SELECT app.admin_update_business($1, 'active', true, null)`, [biz.id]))).rejects.toThrow(/forbidden/);
  });

  it('resposta pública a avaliação só na própria empresa', async () => {
    resetRateLimits();
    const owner = await newUser();
    const { body: biz } = await call('POST', '/panel/businesses', { ...profile, name: 'Empresa Com Resposta' }, owner.cookie);
    const demo = (await call('GET', '/businesses/banho-tosa-bem-cuidar-joinville')).body;
    const review = (await call('GET', `/businesses/${demo.id}/reviews`)).body.items[0];
    // Tenta responder avaliação de outra empresa usando a própria como "dona" da resposta
    await expect(withUser(owner.id, (db) => db.query(`INSERT INTO review_replies (review_id, business_id, body) VALUES ($1, $2, 'oi')`, [review.id, biz.id]))).rejects.toThrow(/row-level security/);
    expect((await call('GET', `/panel/businesses/${biz.id}/reviews`, undefined, owner.cookie)).body).toEqual([]);
  });
});
