import { describe, expect, it } from 'vitest';
import pg from 'pg';
import { befriend, call, newUser, setupDatabase, withProfile } from './helpers';
import { PLUS_WEEKLY } from '../../web/src/shared/game';
import { weekStart } from '../../web/src/lib/util';

setupDatabase();

async function owner<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: process.env.DATABASE_OWNER_URL });
  await c.connect();
  try {
    return await fn(c);
  } finally {
    await c.end();
  }
}
const givePlus = (id: string) => owner((c) => c.query("UPDATE users SET premium_until = current_date + 30 WHERE id = $1", [id]));
const week = () => weekStart(new Date().toISOString().slice(0, 10));
const mesada = (w = week()) => ({ ops: [{ op: 'grant', src: { kind: 'plus', week: w } }] });

describe('HamiCare+', () => {
  it('mesada semanal: só com Plus, uma vez por semana, só a semana de agora', async () => {
    const u = await newUser('Lia');
    const sem = await call('POST', '/game/ops', mesada(), u.cookie);
    expect(sem.body.wallet.coins).toBe(30);
    await givePlus(u.id);
    const old = await call('POST', '/game/ops', mesada('2020-01-06'), u.cookie);
    expect(old.body.wallet.coins).toBe(30);
    const r1 = await call('POST', '/game/ops', mesada(), u.cookie);
    expect(r1.body.wallet.coins).toBe(30 + PLUS_WEEKLY);
    const r2 = await call('POST', '/game/ops', mesada(), u.cookie);
    expect(r2.body.wallet.coins).toBe(30 + PLUS_WEEKLY);
  });

  it('turma de quem tem Plus cabe 8 pessoas; sem Plus, 4', async () => {
    const dona = await withProfile('Mel');
    const amigos = [];
    for (const n of ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8']) {
      const f = await withProfile(n);
      await befriend(dona, f);
      amigos.push(f);
    }
    const r = await call('POST', '/social/team', { name: 'Turmona', missions: ['agua'], members: amigos.slice(0, 3).map((f) => f.id) }, dona.cookie);
    expect(r.status).toBe(201);
    expect(r.body.team.max).toBe(4);
    expect((await call('POST', '/social/team/members', { userId: amigos[3].id }, dona.cookie)).status).toBe(409);
    await givePlus(dona.id);
    for (const f of amigos.slice(3, 7)) expect((await call('POST', '/social/team/members', { userId: f.id }, dona.cookie)).status).toBe(200);
    const cheia = await call('POST', '/social/team/members', { userId: amigos[7].id }, dona.cookie);
    expect(cheia.status).toBe(409);
    const t = await call('GET', '/social/team', undefined, dona.cookie);
    expect(t.body.team.max).toBe(8);
    expect(t.body.team.members).toHaveLength(8);
  });
});

describe('viagem do dia e trilha Plus', () => {
  const today = () => new Date().toISOString().slice(0, 10);
  const task = (id: string) => ({ op: 'grant', src: { kind: 'tarefa', id, energy: 1, cat: 'habitos', date: today() } });
  it('a viagem só paga com 3 missões no dia, uma vez', async () => {
    const u = await newUser('Vivi');
    const cedo = await call('POST', '/game/ops', { ops: [{ op: 'grant', src: { kind: 'viagem', date: today() } }] }, u.cookie);
    expect(cedo.body.wallet.coins).toBe(30);
    const r = await call('POST', '/game/ops', { ops: [task('agua'), task('caminhada'), task('alongar'), { op: 'grant', src: { kind: 'viagem', date: today() } }] }, u.cookie);
    const depois = r.body.wallet.coins as number;
    const r2 = await call('POST', '/game/ops', { ops: [{ op: 'grant', src: { kind: 'viagem', date: today() } }] }, u.cookie);
    expect(r2.body.wallet.coins).toBe(depois);
    expect(JSON.stringify((await call('GET', '/game/wallet', undefined, u.cookie)).body.ledger)).toContain('Viagem do dia');
  });
  it('a trilha Plus só paga com Plus ativo e dias ativos', async () => {
    const u = await newUser('Teo');
    const month = today().slice(0, 7);
    const plusTier = { ops: [{ op: 'grant', src: { kind: 'temporada-plus', month, tier: 0 } }] };
    await call('POST', '/game/ops', { ops: [task('agua')] }, u.cookie);
    const antes = (await call('POST', '/game/ops', plusTier, u.cookie)).body.wallet.coins as number;
    await givePlus(u.id);
    const com = (await call('POST', '/game/ops', plusTier, u.cookie)).body.wallet.coins as number;
    expect(com).toBe(antes + 15);
    expect((await call('POST', '/game/ops', plusTier, u.cookie)).body.wallet.coins).toBe(com);
    // degrau que pede mais dias ativos ainda não paga
    const longe = { ops: [{ op: 'grant', src: { kind: 'temporada-plus', month, tier: 5 } }] };
    expect((await call('POST', '/game/ops', longe, u.cookie)).body.wallet.coins).toBe(com);
  });
});
