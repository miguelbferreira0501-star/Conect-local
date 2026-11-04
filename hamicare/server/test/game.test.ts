import { describe, expect, it } from 'vitest';
import pg from 'pg';
import { call, newUser, setupDatabase } from './helpers';
import { pool } from '../src/db';
import { DEFAULT_GAME as G, arenaItemsOf, rarityRank, xpAt } from '../../web/src/shared/game';

setupDatabase();

const today = () => new Date().toISOString().slice(0, 10);
const task = (id: string, energy = 1, cat = 'habitos', date = today()) => ({ op: 'grant', src: { kind: 'tarefa', id, energy, cat, date } });

async function wallet(cookie: string) {
  await call('GET', '/game/wallet', undefined, cookie);
}

async function owner<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  // Garante que a carteira existe (ela nasce no primeiro acesso).
  const c = new pg.Client({ connectionString: process.env.DATABASE_OWNER_URL });
  await c.connect();
  try {
    return await fn(c);
  } finally {
    await c.end();
  }
}

describe('carteira e ganhos no servidor', () => {
  it('missão paga uma vez; repetir não paga; desmarcar devolve; marcar de novo paga uma vez', async () => {
    const u = await newUser('Ana');
    const r1 = await call('POST', '/game/ops', { ops: [task('agua'), task('agua')] }, u.cookie);
    expect(r1.status).toBe(200);
    expect(r1.body.wallet.xp).toBe(5);
    expect(r1.body.wallet.coins).toBe(30 + 3);
    const r2 = await call('POST', '/game/ops', { ops: [{ op: 'revoke', ref: `tarefa:${today()}:agua` }] }, u.cookie);
    expect(r2.body.wallet.xp).toBe(0);
    expect(r2.body.wallet.coins).toBe(30);
    const r3 = await call('POST', '/game/ops', { ops: [task('agua'), task('agua')] }, u.cookie);
    expect(r3.body.wallet.xp).toBe(5);
  });

  it('o servidor usa a energia e a categoria da biblioteca, não a do app', async () => {
    const u = await newUser('Bia');
    const r = await call('POST', '/game/ops', { ops: [task('agua', 3, 'fitness')] }, u.cookie);
    expect(r.body.wallet.xp).toBe(G.task.xp[0]);
  });

  it('movimento e rotina têm teto no dia; data longe de hoje não vale', async () => {
    const u = await newUser('Caio');
    const ops = Array.from({ length: 8 }, (_, i) => task(`treino-${i}`, 3, 'fitness'));
    const r = await call('POST', '/game/ops', { ops }, u.cookie);
    expect(r.body.wallet.xp).toBe(G.caps.category.fitness);
    const old = await call('POST', '/game/ops', { ops: [task('agua', 1, 'habitos', '2020-01-01')] }, u.cookie);
    expect(old.body.results[0]).toEqual({ ok: false, error: 'invalido' });
  });

  it('nível e arena só o servidor paga; app não consegue mandar prêmio de nível', async () => {
    const u = await newUser('Davi');
    const fake = await call('POST', '/game/ops', { ops: [{ op: 'grant', src: { kind: 'nivel', level: 30 } }] }, u.cookie);
    expect(fake.body.results[0].ok).toBe(false);
    // Coloca o XP perto do nível 2 e completa uma missão.
    await wallet(u.cookie);
    await owner((c) => c.query('UPDATE game_wallet SET xp = $2 WHERE user_id = $1', [u.id, xpAt(2, G) - 3]));
    const r = await call('POST', '/game/ops', { ops: [task('agua')] }, u.cookie);
    const arena = G.arenas.find((a) => a.n === 2)!;
    expect(r.body.wallet.level).toBe(2);
    expect(r.body.wallet.arena).toBe(2);
    expect(r.body.wallet.coins).toBe(30 + 3 + G.levelUp.base + G.levelUp.perLevel * 2 + arena.reward.coins);
    expect(r.body.wallet.pending).toEqual([arena.reward.chest]);
    // Os itens exclusivos da arena entram no inventário, com origem "arena".
    const inv = await call('GET', '/game/inventory', undefined, u.cookie);
    const gifts = arenaItemsOf(2);
    expect(gifts.length).toBeGreaterThan(0);
    for (const id of gifts) expect(inv.body.items).toContainEqual(expect.objectContaining({ itemId: id, origin: 'arena' }));
    // Desmarcar não faz cair de nível nem paga o nível de novo depois.
    await call('POST', '/game/ops', { ops: [{ op: 'revoke', ref: `tarefa:${today()}:agua` }] }, u.cookie);
    const again = await call('POST', '/game/ops', { ops: [task('agua')] }, u.cookie);
    expect(again.body.wallet.level).toBe(2);
    expect(again.body.wallet.pending).toHaveLength(1);
  });

  it('conquista usa as sementes do servidor; desafio só com chave do período atual', async () => {
    const u = await newUser('Eva');
    const r = await call('POST', '/game/ops', { ops: [{ op: 'grant', src: { kind: 'conquista', id: 'primeira-tarefa', coins: 99999 } }, { op: 'grant', src: { kind: 'desafio', period: 'semana', id: 'ativos5', key: '2020-01-06' } }] }, u.cookie);
    expect(r.body.results[0].ok).toBe(true);
    expect(r.body.results[1].ok).toBe(false);
    // 100 XP da conquista já levam ao nível 2: paga também o nível e a arena 2.
    expect(r.body.wallet.xp).toBe(G.achievementXp);
    expect(r.body.wallet.coins).toBe(30 + 10 + G.levelUp.base + G.levelUp.perLevel * 2 + G.arenas[1].reward.coins);
    const w = await call('GET', '/game/wallet', undefined, u.cookie);
    expect(w.body.ledger.find((l: { ref: string }) => l.ref === 'conquista:primeira-tarefa').coins).toBe(10);
  });

  it('importa o progresso do aparelho uma vez só, com teto', async () => {
    const u = await newUser('Fabi');
    const r = await call('POST', '/game/import', { coins: 999999, xp: 999999, items: ['laco', 'inventado', 'sofa', 'fur:mel'] }, u.cookie);
    expect(r.status).toBe(200);
    expect(r.body.wallet.coins).toBe(5000);
    expect(r.body.wallet.xp).toBe(20000);
    expect(r.body.items).toBe(3);
    expect((await call('POST', '/game/import', { coins: 1, xp: 1, items: [] }, u.cookie)).status).toBe(409);
  });
});

describe('compras no servidor', () => {
  it('preço vem do catálogo; sem sementes não compra; a mesma compra não cobra duas vezes', async () => {
    const u = await newUser('Gabi');
    const r = await call('POST', '/game/ops', { ops: [{ op: 'spend', ref: 'loja:laco:1', label: 'x', coins: 1 }] }, u.cookie);
    expect(r.body.results[0].ok).toBe(true);
    expect(r.body.wallet.coins).toBe(30 - 20);
    const again = await call('POST', '/game/ops', { ops: [{ op: 'spend', ref: 'loja:laco:1', label: 'x', coins: 1 }] }, u.cookie);
    expect(again.body.wallet.coins).toBe(10);
    const owned = await call('POST', '/game/ops', { ops: [{ op: 'spend', ref: 'loja:laco:2', label: 'x', coins: 1 }] }, u.cookie);
    expect(owned.body.results[0].error).toBe('ja-tem');
    const poor = await call('POST', '/game/ops', { ops: [{ op: 'spend', ref: 'loja:bone:3', label: 'x', coins: 1 }] }, u.cookie);
    expect(poor.body.results[0].error).toBe('sem-sementes');
    const plus = await call('POST', '/game/ops', { ops: [{ op: 'spend', ref: 'loja:cartola:4', label: 'x', coins: 1 }] }, u.cookie);
    expect(plus.body.results[0].error).toBe('plus');
  });
});

describe('baús no servidor', () => {
  it('abre baú: cobra o preço, entrega o item, registra na carteira e no histórico de baús', async () => {
    const u = await newUser('Hugo');
    await wallet(u.cookie);
    await owner((c) => c.query('UPDATE game_wallet SET coins = 1000 WHERE user_id = $1', [u.id]));
    const r = await call('POST', '/game/chest/open', { chest: 'madeira' }, u.cookie);
    expect(r.status).toBe(200);
    expect(r.body.wallet.coins).toBe(1000 - G.chests.madeira.price);
    expect(r.body.result.revealed).toBe(false);
    const inv = await call('GET', '/game/inventory', undefined, u.cookie);
    expect(inv.body.items.map((i: { itemId: string }) => i.itemId)).toContain(r.body.result.itemId);
    const w = await call('GET', '/game/wallet', undefined, u.cookie);
    expect(w.body.ledger[0].coins).toBe(-G.chests.madeira.price);
  });

  it('sem sementes não abre; baú grátis só se tiver prêmio de arena guardado', async () => {
    const u = await newUser('Iara');
    expect((await call('POST', '/game/chest/open', { chest: 'ouro' }, u.cookie)).status).toBe(409);
    expect((await call('POST', '/game/chest/open', { chest: 'prata', free: true }, u.cookie)).status).toBe(409);
    await wallet(u.cookie);
    await owner((c) => c.query("UPDATE game_wallet SET pending_chests = '{prata}' WHERE user_id = $1", [u.id]));
    const r = await call('POST', '/game/chest/open', { chest: 'prata', free: true }, u.cookie);
    expect(r.status).toBe(200);
    expect(r.body.wallet.coins).toBe(30);
    expect(r.body.wallet.pending).toEqual([]);
  });

  it('proteção contra azar: com 7 baús sem raro, o próximo é raro ou melhor', async () => {
    const u = await newUser('João');
    await wallet(u.cookie);
    await owner((c) => c.query(`UPDATE game_wallet SET coins = 5000, pity = '{"semRaro": ${G.pity.rareAfter - 1}, "semLendario": 0}' WHERE user_id = $1`, [u.id]));
    const r = await call('POST', '/game/chest/open', { chest: 'madeira' }, u.cookie);
    expect(rarityRank(r.body.result.rarity)).toBeGreaterThanOrEqual(rarityRank('raro'));
    expect(r.body.wallet.pity.semRaro).toBe(0);
  });

  it('as chances mostradas somam 100 e mostram a proteção ativa', async () => {
    const u = await newUser('Kai');
    const r = await call('GET', '/game/chests', undefined, u.cookie);
    for (const ch of r.body.chests) expect(Math.round(Object.values(ch.odds as Record<string, number>).reduce((a, b) => a + b, 0))).toBe(100);
    expect(r.body.revealed).toBe(false);
    expect(r.body.chests[0].offer).toBeNull();
  });

  it('menor de 18: baú revelado (vê o item antes e recebe exatamente ele)', async () => {
    const u = await newUser('Teen', '13a17');
    await wallet(u.cookie);
    await owner((c) => c.query('UPDATE game_wallet SET coins = 1000 WHERE user_id = $1', [u.id]));
    const list = await call('GET', '/game/chests', undefined, u.cookie);
    expect(list.body.revealed).toBe(true);
    const offer = list.body.chests.find((c: { id: string }) => c.id === 'madeira').offer;
    expect(offer.itemId).toBeTruthy();
    const again = await call('GET', '/game/chests', undefined, u.cookie);
    expect(again.body.chests.find((c: { id: string }) => c.id === 'madeira').offer).toEqual(offer);
    const r = await call('POST', '/game/chest/open', { chest: 'madeira' }, u.cookie);
    expect(r.body.result.itemId).toBe(offer.itemId);
    expect(r.body.result.revealed).toBe(true);
  });

  it('pedidos ao mesmo tempo não pagam a mesma missão duas vezes', async () => {
    const u = await newUser('Lu');
    await Promise.all(Array.from({ length: 5 }, () => call('POST', '/game/ops', { ops: [task('agua')] }, u.cookie)));
    const w = await call('GET', '/game/wallet', undefined, u.cookie);
    expect(w.body.wallet.xp).toBe(5);
    expect(w.body.wallet.coins).toBe(33);
  });

  it('cada pessoa só vê a própria carteira (regras do banco)', async () => {
    const a = await newUser('Mia');
    const b = await newUser('Noa');
    await call('POST', '/game/ops', { ops: [task('agua')] }, a.cookie);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.user_id', $1, true)", [b.id]);
      expect((await client.query('SELECT * FROM game_ledger WHERE user_id = $1', [a.id])).rowCount).toBe(0);
      expect((await client.query('SELECT * FROM game_wallet WHERE user_id = $1', [a.id])).rowCount).toBe(0);
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('sem conta não acessa', async () => {
    expect((await call('GET', '/game/wallet')).status).toBe(401);
  });
});
