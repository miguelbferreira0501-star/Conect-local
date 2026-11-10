import { describe, expect, it } from 'vitest';
import { DEFAULT_GAME as G, RARITY_ORDER, CHEST_ORDER, rarityRank } from './config';
import { arenaOf, levelOf, levelProgress, migrateXp, nextArena, xpAt, xpToNext } from './levels';
import { addUsage, baseGrant, capGrant, emptyUsage, levelUps } from './rewards';
import { chestOdds, emptyPity, openChest, pityInfo, rollRarity, seeded, type Pity } from './chests';
import { chestPool } from './catalog';

describe('níveis', () => {
  it('curva cresce sempre e segue a tabela inicial', () => {
    expect(xpToNext(1, G)).toBe(100);
    expect(xpToNext(10, G)).toBe(2700);
    for (let l = 1; l < 40; l++) expect(xpToNext(l + 1, G)).toBeGreaterThan(xpToNext(l, G));
    expect(xpAt(1, G)).toBe(0);
    expect(xpAt(2, G)).toBe(100);
    expect(levelOf(99, G)).toBe(1);
    expect(levelOf(100, G)).toBe(2);
    expect(levelProgress(130, G)).toEqual({ level: 2, current: 30, needed: 150 });
  });

  it('cada nível do 1 ao 12 abre uma arena; depois do 12 a arena fica na última', () => {
    for (let l = 1; l <= 12; l++) expect(arenaOf(l, G).n).toBe(l);
    expect(arenaOf(20, G).n).toBe(12);
    expect(nextArena(11, G)?.n).toBe(12);
    expect(nextArena(12, G)).toBeNull();
    expect(new Set(G.arenas.map((a) => a.id)).size).toBe(G.arenas.length);
  });

  it('quem já usava o app não perde nível na mudança de curva', () => {
    const oldAt = (n: number) => 25 * (n - 1) * n;
    for (const old of [0, 10, 49, 50, 149, 150, 299, 300, 740, 2250, 3299, 3300, 9000]) {
      let n = 1;
      while (oldAt(n + 1) <= old) n++;
      expect(levelOf(migrateXp(old, G), G), `xp antigo ${old}`).toBe(n);
    }
  });

  it('subir vários níveis de uma vez paga cada nível e cada arena', () => {
    const r = levelUps(90, xpAt(4, G) + 5, G);
    expect(r.levels).toEqual([2, 3, 4]);
    expect(r.arenas).toEqual([2, 3, 4]);
    expect(levelUps(xpAt(13, G), xpAt(14, G), G).arenas).toEqual([]);
  });
});

describe('XP e sementes com limites', () => {
  const day = '2026-11-05';
  it('missão leve, normal e puxada valem o XP da configuração; algumas têm valor próprio', () => {
    expect(baseGrant({ kind: 'tarefa', id: 'agua', energy: 1, cat: 'habitos', date: day }, G).xp).toBe(G.task.xp[0]);
    expect(baseGrant({ kind: 'tarefa', id: 'x', energy: 2, cat: 'habitos', date: day }, G).xp).toBe(G.task.xp[1]);
    expect(baseGrant({ kind: 'tarefa', id: 'corrida', energy: 3, cat: 'fitness', date: day }, G).xp).toBe(G.task.xp[2]);
    expect(baseGrant({ kind: 'tarefa', id: 'caminhada', energy: 2, cat: 'fitness', date: day }, G).xp).toBe(G.task.xpById.caminhada);
    expect(baseGrant({ kind: 'diario', date: day }, G).xp).toBe(G.small.diario.xp);
    // Subir de nível é difícil: a missão mais puxada vale bem menos que 1% do caminho até a última arena.
    expect(G.task.xp[2] / xpAt(12, G)).toBeLessThan(0.001);
  });

  it('a mesma coisa tem sempre a mesma referência (não paga duas vezes)', () => {
    const a = baseGrant({ kind: 'tarefa', id: 'agua', energy: 1, cat: 'habitos', date: day }, G);
    const b = baseGrant({ kind: 'tarefa', id: 'agua', energy: 3, cat: 'habitos', date: day }, G);
    expect(a.ref).toBe(b.ref);
    expect(baseGrant({ kind: 'nivel', level: 5 }, G).ref).toBe('nivel:5');
  });

  it('movimento tem teto: exercício demais não rende mais XP', () => {
    let u = emptyUsage();
    let total = 0;
    for (let i = 0; i < 6; i++) {
      const g = baseGrant({ kind: 'tarefa', id: `treino${i}`, energy: 3, cat: 'fitness', date: day }, G);
      const paid = capGrant(g, u, G);
      total += paid.xp;
      u = addUsage(u, g, paid);
    }
    expect(total).toBe(G.caps.category.fitness);
  });

  it('a rotina do dia tem teto de XP e de sementes, e só 12 missões contam', () => {
    let u = emptyUsage();
    let xp = 0;
    let coins = 0;
    const cats = ['autocuidado', 'habitos', 'emocional', 'fitness'] as const;
    for (let i = 0; i < 40; i++) {
      const g = baseGrant({ kind: 'tarefa', id: `t${i}`, energy: 2, cat: cats[i % 4], date: day }, G);
      const paid = capGrant(g, u, G);
      xp += paid.xp;
      coins += paid.coins;
      u = addUsage(u, g, paid);
    }
    expect(xp).toBeLessThanOrEqual(G.caps.day.xp);
    expect(coins).toBeLessThanOrEqual(G.caps.day.coins);
    expect(u.tasks).toBe(G.caps.tasks);
  });

  it('desmarcar devolve o uso do dia', () => {
    const g = baseGrant({ kind: 'tarefa', id: 'agua', energy: 1, cat: 'habitos', date: day }, G);
    const paid = capGrant(g, emptyUsage(), G);
    const u = addUsage(addUsage(emptyUsage(), g, paid), g, paid, -1);
    expect(u).toEqual({ ...emptyUsage(), buckets: { 'cat:habitos': 0 } });
  });

  it('valores enviados de fora têm limite (aventura, conquista, evento)', () => {
    expect(baseGrant({ kind: 'aventura', place: 'p', xp: 9999, coins: 9999, date: day, n: 1 }, G).xp).toBeLessThanOrEqual(40);
    expect(baseGrant({ kind: 'conquista', id: 'x', coins: 99999 }, G).coins).toBeLessThanOrEqual(500);
    expect(baseGrant({ kind: 'evento', id: 'x', coins: -50 }, G).coins).toBe(0);
  });
});

describe('baús', () => {
  const pool = chestPool();

  it('chances somam 100 em todo baú e toda situação de proteção', () => {
    for (const c of CHEST_ORDER) {
      for (let s = 0; s < G.pity.rareAfter + 2; s++) {
        const o = chestOdds(c, { semRaro: s, semLendario: 0 }, G);
        expect(Math.round(RARITY_ORDER.reduce((n, r) => n + o[r], 0) * 10) / 10, `${c} ${s}`).toBe(100);
      }
    }
  });

  it('proteção suave: a chance de raro sobe a cada baú sem raro', () => {
    const a = chestOdds('madeira', { semRaro: 0, semLendario: 0 }, G).raro;
    const b = chestOdds('madeira', { semRaro: G.pity.softFrom, semLendario: 0 }, G).raro;
    const c = chestOdds('madeira', { semRaro: G.pity.softFrom + 1, semLendario: 0 }, G).raro;
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
    expect(pityInfo({ semRaro: G.pity.softFrom, semLendario: 0 }, G).boosted).toBe(true);
  });

  it('garantia: depois de 7 baús sem raro, o 8º é raro ou melhor', () => {
    const rng = seeded(1);
    for (let i = 0; i < 200; i++) {
      const r = openChest({ chest: 'madeira', pity: { semRaro: G.pity.rareAfter - 1, semLendario: 0 }, owned: new Set(), pool, rng, cfg: G });
      expect(rarityRank(r.rarity)).toBeGreaterThanOrEqual(rarityRank('raro'));
      expect(r.pity.semRaro).toBe(0);
    }
  });

  it('garantia de lendário depois de muitos baús sem lendário', () => {
    const r = openChest({ chest: 'madeira', pity: { semRaro: 0, semLendario: G.pity.legendaryAfter - 1 }, owned: new Set(), pool, rng: seeded(2), cfg: G });
    expect(r.rarity).toBe('lendario');
    expect(r.pity.semLendario).toBe(0);
  });

  it('nunca mais de 7 baús seguidos sem raro (simulação de 5.000 baús de madeira)', () => {
    const rng = seeded(7);
    let pity: Pity = emptyPity();
    let streak = 0;
    let worst = 0;
    const count: Record<string, number> = {};
    for (let i = 0; i < 5000; i++) {
      const r = openChest({ chest: 'madeira', pity, owned: new Set(), pool, rng, cfg: G });
      pity = r.pity;
      count[r.rarity] = (count[r.rarity] ?? 0) + 1;
      streak = rarityRank(r.rarity) >= rarityRank('raro') ? 0 : streak + 1;
      worst = Math.max(worst, streak);
    }
    expect(worst).toBeLessThanOrEqual(G.pity.rareAfter - 1);
    // Sem proteção seriam 5% de raro; com proteção, um pouco mais.
    expect(count.raro / 5000).toBeGreaterThan(0.08);
    expect(count.raro / 5000).toBeLessThan(0.2);
  });

  it('sorteio segue as chances anunciadas (baú de prata, 20.000 aberturas, sem proteção)', () => {
    const rng = seeded(11);
    const odds = G.chests.prata.odds;
    const n = 20000;
    const c: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      const r = rollRarity(odds, rng);
      c[r] = (c[r] ?? 0) + 1;
    }
    for (const r of RARITY_ORDER) expect(Math.abs((c[r] ?? 0) / n - odds[r] / 100), r).toBeLessThan(0.015);
  });

  it('prefere itens que a pessoa ainda não tem; com tudo daquela raridade, vira fragmentos', () => {
    const comuns = pool.filter((p) => p.rarity === 'comum');
    const owned = new Set(comuns.slice(1).map((p) => p.id));
    const onlyComum = { ...G, chests: { ...G.chests, madeira: { ...G.chests.madeira, odds: { comum: 100, incomum: 0, raro: 0, epico: 0, lendario: 0 } } } };
    const r1 = openChest({ chest: 'madeira', pity: emptyPity(), owned, pool, rng: seeded(3), cfg: onlyComum });
    expect(r1.itemId).toBe(comuns[0].id);
    expect(r1.duplicate).toBe(false);
    owned.add(comuns[0].id);
    const r2 = openChest({ chest: 'madeira', pity: emptyPity(), owned, pool, rng: seeded(4), cfg: onlyComum });
    expect(r2.duplicate).toBe(true);
    expect(r2.fragments).toBe(G.rarities.comum.fragments);
  });

  it('o pool tem itens de todas as raridades e nada de comida, Plus ou época', () => {
    for (const r of RARITY_ORDER) expect(pool.some((p) => p.rarity === r), r).toBe(true);
    expect(pool.some((p) => p.id === 'maca' || p.id === 'cartola' || p.id === 'gorro-natal')).toBe(false);
  });
});

describe('fantasias exclusivas do Baú Lendário', async () => {
  const { openChest, chestPool, DEFAULT_GAME: cfg } = await import('./index');
  const { ITEMS } = await import('../../data/items');
  const pool = chestPool();
  const stars = new Set(pool.filter((p) => p.star).map((p) => p.id));
  const pity = { semRaro: 0, semLendario: 0 };
  it('existem e não estão à venda', () => {
    expect(stars.size).toBeGreaterThanOrEqual(6);
    expect(ITEMS.filter((i) => stars.has(i.id)).every((i) => i.chestOnly && i.kind === 'roupa')).toBe(true);
  });
  it('só saem do Baú Lendário, e saem bastante nele', () => {
    let seed = 7;
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 300; i++) expect(stars.has(openChest({ chest: 'magico', pity, owned: new Set(), pool, rng, cfg }).itemId)).toBe(false);
    let hits = 0;
    for (let i = 0; i < 400; i++) if (stars.has(openChest({ chest: 'lendario', pity, owned: new Set(), pool, rng, cfg }).itemId)) hits++;
    expect(hits / 400).toBeGreaterThan(0.2);
  });
});
