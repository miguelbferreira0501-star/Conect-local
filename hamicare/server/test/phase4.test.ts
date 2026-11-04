import { describe, expect, it } from 'vitest';
import pg from 'pg';
import { befriend, call, house, pet, setupDatabase, withProfile } from './helpers';
import { DEFAULT_GAME as G } from '../../web/src/shared/game';

setupDatabase();

const today = () => new Date().toISOString().slice(0, 10);
const month = () => today().slice(0, 7);
const task = (id: string, date = today()) => ({ op: 'grant', src: { kind: 'tarefa', id, energy: 1, cat: 'habitos', date } });

async function owner<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: process.env.DATABASE_OWNER_URL });
  await c.connect();
  try {
    return await fn(c);
  } finally {
    await c.end();
  }
}

/** Dias ativos no mês, direto no histórico (como se a pessoa tivesse feito missões nesses dias). */
async function activeDaysThisMonth(userId: string, n: number) {
  await owner(async (c) => {
    for (let d = 1; d <= n; d++) {
      const day = `${month()}-${String(d).padStart(2, '0')}`;
      await c.query("INSERT INTO game_ledger (user_id, ref, label, coins, xp, day, routine) VALUES ($1, $2, 'teste', 0, 0, $3, true)", [userId, `tarefa:${day}:agua`, day]);
    }
  });
}

describe('temporada (trilha grátis)', () => {
  it('o servidor conta os dias ativos e só paga degraus alcançados, uma vez', async () => {
    const u = await withProfile('Tia');
    await call('GET', '/game/wallet', undefined, u.cookie);
    await activeDaysThisMonth(u.id, 3);
    const s = await call('GET', '/game/season', undefined, u.cookie);
    expect(s.body.days).toBe(3);
    const claim = (tier: number) => ({ op: 'grant', src: { kind: 'temporada-degrau', month: month(), tier } });
    // Degrau 2 (2 dias): fragmentos. Degrau 4 (6 dias): ainda não.
    const r = await call('POST', '/game/ops', { ops: [claim(1), claim(3), claim(1)] }, u.cookie);
    expect(r.body.results[0].ok).toBe(true);
    expect(r.body.results[1]).toEqual({ ok: false, error: 'invalido' });
    expect(r.body.wallet.fragments).toBe(G.season.tiers[1].fragments);
    const after = await call('GET', '/game/season', undefined, u.cookie);
    expect(after.body.claimed).toEqual([1]);
    // Mês velho não vale.
    const old = await call('POST', '/game/ops', { ops: [{ op: 'grant', src: { kind: 'temporada-degrau', month: '2020-01', tier: 0 } }] }, u.cookie);
    expect(old.body.results[0].ok).toBe(false);
  });

  it('degrau com baú deixa o baú grátis guardado', async () => {
    const u = await withProfile('Ugo');
    await call('GET', '/game/wallet', undefined, u.cookie);
    const i = G.season.tiers.findIndex((t) => t.chest);
    await activeDaysThisMonth(u.id, G.season.tiers[i].days);
    const r = await call('POST', '/game/ops', { ops: [{ op: 'grant', src: { kind: 'temporada-degrau', month: month(), tier: i } }] }, u.cookie);
    expect(r.body.wallet.pending).toContain(G.season.tiers[i].chest);
  });
});

describe('visitas com reação', () => {
  it('só amigos deixam reação, uma por dia, e o anfitrião vê quem passou', async () => {
    const a = await withProfile('Ana');
    const b = await withProfile('Bru');
    const stranger = await withProfile('Cid');
    expect((await call('POST', `/social/visits/${b.id}`, { reaction: 'carinho' }, a.cookie)).status).toBe(403);
    await befriend(a, b);
    expect((await call('POST', `/social/visits/${b.id}`, { reaction: 'inventada' }, a.cookie)).status).toBe(422);
    expect((await call('POST', `/social/visits/${b.id}`, { reaction: 'abraco' }, a.cookie)).body.result).toBe('ok');
    expect((await call('POST', `/social/visits/${b.id}`, { reaction: 'carinho' }, a.cookie)).body.result).toBe('limite');
    const seen = await call('GET', '/social/visits', undefined, b.cookie);
    expect(seen.body.visits).toHaveLength(1);
    expect(seen.body.visits[0]).toMatchObject({ userId: a.id, name: 'Ana', reaction: 'abraco' });
    // Quem não é amigo não lê as visitas dos outros.
    expect((await call('GET', '/social/visits', undefined, stranger.cookie)).body.visits).toEqual([]);
  });

  it('a arena de casa aparece no perfil', async () => {
    const a = await withProfile('Dani');
    const p = await call('PUT', '/social/profile', { name: 'Dani', pet, house, level: 6, acceptsRequests: true, arena: 5 }, a.cookie);
    expect(p.body.profile.arena).toBe(5);
  });
});

describe('ranking só entre amigos', () => {
  it('mostra você e amigos com números do servidor; peso nunca aparece', async () => {
    const a = await withProfile('Eva');
    const b = await withProfile('Fê');
    const c = await withProfile('Gil'); // não é amigo
    await befriend(a, b);
    await call('POST', '/game/ops', { ops: [task('agua'), task('alongar')] }, b.cookie);
    await call('POST', '/game/ops', { ops: [task('agua')] }, c.cookie);
    const r = await call('GET', '/social/ranking', undefined, a.cookie);
    expect(r.status).toBe(200);
    const ids = r.body.rows.map((x: { userId: string }) => x.userId).sort();
    expect(ids).toEqual([a.id, b.id].sort());
    const fe = r.body.rows.find((x: { userId: string }) => x.userId === b.id);
    expect(fe).toMatchObject({ dias: 1, missoes: 2, me: false });
    expect(JSON.stringify(r.body)).not.toMatch(/peso|kg|kcal|weight/i);
  });

  it('quem sai do ranking some da lista dos amigos e também não vê', async () => {
    const a = await withProfile('Hugo');
    const b = await withProfile('Iris');
    await befriend(a, b);
    await call('PUT', '/social/profile', { name: 'Iris', pet, house, level: 2, acceptsRequests: true, ranked: false }, b.cookie);
    const forA = await call('GET', '/social/ranking', undefined, a.cookie);
    expect(forA.body.rows.map((x: { userId: string }) => x.userId)).toEqual([a.id]);
    const forB = await call('GET', '/social/ranking', undefined, b.cookie);
    expect(forB.body).toEqual({ rows: [], optedOut: true });
  });
});
