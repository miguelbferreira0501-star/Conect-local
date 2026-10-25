import { describe, expect, it } from 'vitest';
import { DEMO_ACCOUNT } from '../src/db/seed';
import { withUser } from '../src/db/pool';
import { app, call, newUser, setupDatabase } from './helpers';
import { resetRateLimits } from '../src/lib/rateLimit';

setupDatabase();
const H = { 'content-type': 'application/json', 'x-requested-with': 'conecta' };

describe('localidades e busca', () => {
  it('lista os 27 estados e municípios por UF', async () => {
    expect((await call('GET', '/locations/states')).body).toHaveLength(27);
    const sc = (await call('GET', '/locations/states/SC/cities')).body;
    expect(sc.some((c: { name: string }) => c.name === 'Joinville')).toBe(true);
  });

  it('encontra a cidade mais próxima de coordenadas', async () => {
    expect((await call('GET', '/locations/nearest?lat=-26.30&lon=-48.85')).body.name).toBe('Joinville');
  });

  it('busca por termo usa palavras-chave da categoria e não inventa nota', async () => {
    const r = await call('GET', '/search?city=4209102&q=eletricista');
    expect(r.status).toBe(200);
    expect(r.body.total).toBeGreaterThan(0);
    for (const b of r.body.items) {
      expect(b.category.slug).toBe('reformas-e-manutencao');
      if (b.rating.count === 0) expect(b.rating.average).toBeNull();
    }
  });

  it('"melhor avaliadas" não coloca 1 avaliação 5★ acima de centenas consistentes', async () => {
    const r = await call('GET', '/search?city=4209102&sort=rating&pageSize=50');
    const items = r.body.items as Array<{ rating: { count: number; average: number } }>;
    const single = items.findIndex((i) => i.rating.count === 1 && i.rating.average === 5);
    const strong = items.findIndex((i) => i.rating.count >= 100 && i.rating.average >= 4.5);
    if (single >= 0 && strong >= 0) expect(strong).toBeLessThan(single);
  });

  it('filtros combinados são respeitados', async () => {
    const r = await call('GET', '/search?city=4209102&minRating=4&modes=at_customer&pageSize=50');
    for (const b of r.body.items) {
      expect(b.rating.average).toBeGreaterThanOrEqual(4);
      expect(b.modes).toContain('at_customer');
    }
  });

  it('cidade sem empresas sugere cidades próximas', async () => {
    const r = await call('GET', '/search?city=4201307'); // Araquari (atendida por áreas de Joinville)
    const r2 = await call('GET', '/search?city=1302603'); // Manaus
    expect(r2.body.total).toBe(0);
    expect(r2.body.nearbyCities.length).toBeGreaterThan(0);
    for (const b of r.body.items) expect(['servesCity', 'establishmentInCity']).toContain(b.locationMatch);
  });

  it('valida parâmetros inválidos', async () => {
    expect((await call('GET', '/search?city=123')).status).toBe(422);
  });
});

describe('segurança', () => {
  it('bloqueia requisição que altera dados sem o cabeçalho anti-CSRF', async () => {
    const res = await app.request('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    expect(res.status).toBe(403);
  });

  it('bloqueia origem não permitida', async () => {
    const res = await app.request('http://localhost/api/auth/login', { method: 'POST', headers: { ...H, origin: 'https://site-malicioso.com' }, body: '{}' });
    expect(res.status).toBe(403);
  });

  it('área logada exige sessão', async () => {
    expect((await call('GET', '/me/activities')).status).toBe(401);
  });

  it('login com senha errada não revela se o e-mail existe', async () => {
    resetRateLimits();
    const a = await call('POST', '/auth/login', { email: DEMO_ACCOUNT.email, password: 'errada123' });
    const b = await call('POST', '/auth/login', { email: 'ninguem@teste.com', password: 'errada123' });
    expect(a.status).toBe(401);
    expect(a.body.error.message).toBe(b.body.error.message);
  });

  it('RLS: um usuário não enxerga favoritos e agendamentos de outro', async () => {
    resetRateLimits();
    const alice = await newUser('Alice');
    const bob = await newUser('Bob');
    const biz = (await call('GET', '/search?city=4209102')).body.items[0];
    await call('PUT', `/me/favorites/${biz.id}`, {}, alice.cookie);
    const bobView = await withUser(bob.id, (db) => db.query('SELECT * FROM favorites'));
    expect(bobView.rowCount).toBe(0);
    const aliceView = await withUser(alice.id, (db) => db.query('SELECT * FROM favorites'));
    expect(aliceView.rowCount).toBe(1);
    const anon = await withUser(null, (db) => db.query('SELECT count(*)::int AS n FROM bookings'));
    expect(anon.rows[0].n).toBe(0);
    const users = await withUser(bob.id, (db) => db.query('SELECT email FROM users'));
    expect(users.rows.map((r) => r.email)).toEqual([bob.email]);
  });

  it('RLS: não é possível inserir favorito em nome de outra pessoa', async () => {
    const a = await newUser();
    const b = await newUser();
    const biz = (await call('GET', '/search?city=4209102')).body.items[0];
    await expect(
      withUser(a.id, (db) => db.query('INSERT INTO favorites (user_id, business_id) VALUES ($1, $2)', [b.id, biz.id])),
    ).rejects.toThrow(/row-level security/);
  });

  it('banco recusa avaliação sem contratação, mesmo burlando a API', async () => {
    const u = await newUser();
    const biz = (await call('GET', '/search?city=4209102')).body.items[0];
    await expect(
      withUser(u.id, (db) =>
        db.query(`INSERT INTO reviews (business_id, user_id, author_display_name, rating, comment) VALUES ($1, $2, 'X', 5, 'Avaliação falsa tentando burlar a API do sistema')`, [biz.id, u.id]),
      ),
    ).rejects.toThrow(/review_activity_required/);
  });

  it('papel da aplicação não consegue alterar a nota de uma empresa nem a contagem de denúncias', async () => {
    const u = await newUser();
    await expect(withUser(u.id, (db) => db.query(`UPDATE reviews SET report_count = 0`))).rejects.toThrow(/permission denied/);
    await expect(withUser(u.id, (db) => db.query(`UPDATE businesses SET verified_at = now()`))).rejects.toThrow(/permission denied/);
  });
});

describe('agendamento, orçamento e avaliação', () => {
  it('fluxo completo com regras de elegibilidade', async () => {
    resetRateLimits();
    const login = await call('POST', '/auth/login', { email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password });
    expect(login.status).toBe(200);
    const cookie = login.cookie!;
    const acts = (await call('GET', '/me/activities', undefined, cookie)).body;
    const past = acts.find((a: { canMarkDone: boolean; type: string }) => a.canMarkDone && a.type === 'booking');
    expect(past.canReview).toBe(false);

    const early = await call('POST', '/reviews', { businessId: past.business.id, activityType: 'booking', activityId: past.id, rating: 5, comment: 'Excelente atendimento, muito pontuais.' }, cookie);
    expect(early.status).toBe(403);

    expect((await call('POST', `/bookings/${past.id}/complete`, {}, cookie)).status).toBe(200);
    const bad = await call('POST', '/reviews', { businessId: past.business.id, activityType: 'booking', activityId: past.id, rating: 5, comment: 'Liguem 99999-1234 muito bom mesmo' }, cookie);
    expect(bad.status).toBe(422);
    const ok = await call('POST', '/reviews', { businessId: past.business.id, activityType: 'booking', activityId: past.id, rating: 4, comment: 'Atendimento muito bom, apenas um pequeno atraso.' }, cookie);
    expect(ok.status).toBe(201);
    const dup = await call('POST', '/reviews', { businessId: past.business.id, activityType: 'booking', activityId: past.id, rating: 1, comment: 'Tentando avaliar duas vezes a mesma visita.' }, cookie);
    expect(dup.status).toBe(403);
    expect(dup.body.error.message).toMatch(/já avaliou/);

    // Editar e denunciar
    expect((await call('PATCH', `/reviews/${ok.body.id}`, { rating: 5, comment: 'Atendimento excelente, recomendo bastante.' }, cookie)).status).toBe(200);
    const other = await newUser();
    const rep = await call('POST', `/reviews/${ok.body.id}/report`, { reason: 'spam' }, other.cookie);
    expect(rep.body.ok).toBe(true);
    expect((await call('POST', `/reviews/${ok.body.id}/report`, { reason: 'spam' }, cookie)).status).toBe(403);
  });

  it('impede dois agendamentos no mesmo horário e fora do expediente', async () => {
    resetRateLimits();
    const a = await newUser();
    const b = await newUser();
    const biz = (await call('GET', '/businesses/espaco-bem-cuidar-joinville')).body;
    const svc = biz.services.find((s: { bookable: boolean }) => s.bookable);
    let slot: string | undefined;
    for (let d = 1; d < 10 && !slot; d++) {
      const date = new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10);
      slot = (await call('GET', `/businesses/${biz.id}/availability?serviceId=${svc.id}&date=${date}`)).body.slots[0]?.startsAt;
    }
    expect(slot).toBeDefined();
    const first = await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: slot }, a.cookie);
    expect(first.status).toBe(201);
    const second = await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: slot }, b.cookie);
    expect(second.status).toBe(409);
    const night = new Date(slot!);
    night.setUTCHours(5, 0, 0, 0);
    expect((await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: night.toISOString() }, b.cookie)).status).toBe(409);
    expect((await call('POST', `/bookings/${first.body.id}/complete`, {}, a.cookie)).status).toBe(409);
    expect((await call('POST', `/bookings/${first.body.id}/cancel`, {}, a.cookie)).status).toBe(200);
    // Horário liberado após o cancelamento
    expect((await call('POST', '/bookings', { businessId: biz.id, serviceId: svc.id, startsAt: slot }, b.cookie)).status).toBe(201);
  });

  it('orçamento exige telefone quando o contato é por WhatsApp; contratado libera avaliação', async () => {
    const u = await newUser();
    const biz = (await call('GET', '/businesses/espaco-bem-cuidar-joinville')).body;
    const noPhone = await call('POST', '/quotes', { businessId: biz.id, description: 'Preciso de um orçamento para limpeza de pele.', contactPreference: 'whatsapp' }, u.cookie);
    expect(noPhone.status).toBe(422);
    const q = await call('POST', '/quotes', { businessId: biz.id, description: 'Preciso de um orçamento para limpeza de pele.', contactPreference: 'whatsapp', contactPhone: '(47) 99999-0000' }, u.cookie);
    expect(q.status).toBe(201);
    await call('POST', `/quotes/${q.body.id}/hired`, {}, u.cookie);
    const acts = (await call('GET', '/me/activities', undefined, u.cookie)).body;
    expect(acts.find((a: { id: string }) => a.id === q.body.id).canReview).toBe(true);
  });

  it('excluir conta exige senha e apaga os dados', async () => {
    const u = await newUser();
    expect((await call('DELETE', '/me', { password: 'errada' }, u.cookie)).status).toBe(401);
    expect((await call('DELETE', '/me', { password: 'Senha1234' }, u.cookie)).status).toBe(200);
    expect((await call('GET', '/me/activities', undefined, u.cookie)).status).toBe(401);
  });
});
