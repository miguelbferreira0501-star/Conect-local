import { describe, expect, it } from 'vitest';
import { befriend, call, newUser, setupDatabase, withProfile } from './helpers';

setupDatabase();

describe('administração', () => {
  it('só admin acessa; Plus, banimento, denúncias e eventos', async () => {
    const comum = await newUser('Comum');
    expect((await call('GET', '/admin/stats', undefined, comum.cookie)).status).toBe(403);
    const chefe = await newUser('Chefe', '18mais', 'chefe@teste.com');
    const stats = await call('GET', '/admin/stats', undefined, chefe.cookie);
    expect(stats.status).toBe(200);
    expect(stats.body.stats.usuarios).toBeGreaterThanOrEqual(2);

    // Plus
    expect((await call('POST', `/admin/users/${comum.id}/premium`, { until: '2030-01-01' }, chefe.cookie)).status).toBe(200);
    expect((await call('GET', '/auth/me', undefined, comum.cookie)).body.user.premiumUntil).toBe('2030-01-01');
    expect((await call('GET', '/admin/users?q=comum', undefined, chefe.cookie)).body.users.length).toBeGreaterThan(0);

    // Denúncia revisada: conteúdo removido
    const ana = await withProfile('Ana');
    const bia = await withProfile('Bia');
    // Admin acha a pessoa pelo código de amigo (HAMI-…).
    const byCode = await call('GET', `/admin/users?q=${encodeURIComponent(ana.code.toLowerCase())}`, undefined, chefe.cookie);
    expect(byCode.body.users.map((u: { id: string }) => u.id)).toContain(ana.id);
    await befriend(ana, bia);
    const post = await call('POST', '/social/posts', { kind: 'momento', text: 'Oi' }, ana.cookie);
    await call('POST', '/social/reports', { type: 'post', id: post.body.id, userId: ana.id, reason: 'spam' }, bia.cookie);
    const reports = (await call('GET', '/admin/reports', undefined, chefe.cookie)).body.reports;
    expect(reports[0].content).toBe('Oi');
    expect((await call('POST', '/admin/reports/resolve', { type: 'post', targetId: post.body.id, action: 'remover' }, chefe.cookie)).status).toBe(200);
    expect((await call('GET', '/social/feed', undefined, bia.cookie)).body.posts).toHaveLength(0);
    expect((await call('GET', '/admin/reports', undefined, chefe.cookie)).body.reports).toHaveLength(0);

    // Banimento derruba a sessão e impede o login
    expect((await call('POST', `/admin/users/${bia.id}/ban`, { banned: true }, chefe.cookie)).status).toBe(200);
    expect((await call('GET', '/auth/me', undefined, bia.cookie)).body.user).toBeNull();
    expect((await call('POST', '/auth/login', { email: bia.email, password: 'Senha1234' })).status).toBe(403);

    // Evento com recompensa: resgate uma vez
    const today = new Date().toISOString().slice(0, 10);
    const ev = await call('POST', '/admin/events', { title: 'Semana da água', description: 'Beba água!', startsOn: today, endsOn: today, rewardCoins: 50, itemId: null }, chefe.cookie);
    expect(ev.status).toBe(201);
    expect((await call('GET', '/events', undefined, comum.cookie)).body.events[0].title).toBe('Semana da água');
    expect((await call('POST', `/events/${ev.body.id}/claim`, {}, comum.cookie)).body.reward.coins).toBe(50);
    expect((await call('POST', `/events/${ev.body.id}/claim`, {}, comum.cookie)).status).toBe(409);
    expect((await call('POST', '/admin/events', { title: 'x', startsOn: today, endsOn: today, rewardCoins: 1 }, comum.cookie)).status).toBe(403);
  });
});

describe('admin dá sementes', () => {
  it('só admin; vai para a carteira e para o histórico', async () => {
    const quem = await withProfile('Sortuda');
    const comum = await newUser('Curioso');
    expect((await call('POST', `/admin/users/${quem.id}/coins`, { coins: 10000 }, comum.cookie)).status).toBe(403);
    // a conta de admin já existe neste arquivo: entra com ela
    const chefe = { cookie: (await call('POST', '/auth/login', { email: 'chefe@teste.com', password: 'Senha1234' })).cookie as string };
    expect((await call('POST', `/admin/users/${quem.id}/coins`, { coins: 0 }, chefe.cookie)).status).toBe(422);
    expect((await call('POST', `/admin/users/${quem.id}/coins`, { coins: 999999 }, chefe.cookie)).status).toBe(422);
    const r = await call('POST', `/admin/users/${quem.id}/coins`, { coins: 10000 }, chefe.cookie);
    expect(r.status).toBe(200);
    const w = await call('GET', '/game/wallet', undefined, quem.cookie);
    expect(w.body.wallet.coins).toBe(30 + 10000);
    expect(JSON.stringify(w.body.ledger)).toContain('Presente da equipe HamiCare');
  });
});

describe('métricas de produto', () => {
  it('retenção, origem e teste grátis; só admin vê', async () => {
    const r = await call('POST', '/auth/register', { name: 'Origem', email: `origem${Date.now()}@teste.com`, password: 'Senha1234', ageGroup: '18mais', acceptTerms: true, healthConsent: true, ref: 'tiktok' });
    expect(r.status).toBe(201);
    await call('GET', '/auth/me', undefined, r.cookie);
    expect((await call('GET', '/admin/metrics', undefined, r.cookie)).status).toBe(403);
    const chefe = { cookie: (await call('POST', '/auth/login', { email: 'chefe@teste.com', password: 'Senha1234' })).cookie as string };
    const m = (await call('GET', '/admin/metrics', undefined, chefe.cookie)).body.metrics;
    expect(m.origem.tiktok).toBe(1);
    expect(m.ativosHoje).toBeGreaterThanOrEqual(1);
    expect(m.retencao.d1).toBeTruthy();
  });
});
