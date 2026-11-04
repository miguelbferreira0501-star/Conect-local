// Simulação da economia: como quatro tipos de pessoa avançam ao longo de um ano.
// Serve para ajustar a curva de níveis, os ganhos e os preços dos baús.
import { CHEST_ORDER, rarityRank, type ChestId, type GameConfig, type Rarity } from './config';
import { arenaOf, levelOf } from './levels';
import { addUsage, baseGrant, capGrant, emptyUsage, levelUps, type Source } from './rewards';
import { emptyPity, openChest, seeded, type PoolItem } from './chests';

export interface Persona {
  id: string;
  label: string;
  /** Chance de usar o app num dia. */
  activeChance: number;
  /** Missões por dia ativo e mistura de energia (leve, normal, puxada). */
  tasks: number;
  energyMix: [number, number, number];
  care: number;
  mood: number;
  journal: number;
  jar: number;
  tool: number;
  /** Desafios: quantos dos 3 diários, chance de cada semanal e do mensal. */
  dailyQuests: number;
  weekly: number;
  monthly: number;
  adventuresPerWeek: number;
  /** Conquistas: uma a cada tantos dias ativos. */
  achievementEvery: number;
  /** Só fica os primeiros dias (pessoa nova). */
  stopAfter?: number;
}

export const PERSONAS: Persona[] = [
  { id: 'novo', label: 'Novo (2 semanas animado)', activeChance: 0.85, tasks: 5, energyMix: [0.45, 0.45, 0.1], care: 3, mood: 0.8, journal: 0.4, jar: 0.3, tool: 0.4, dailyQuests: 2, weekly: 0.6, monthly: 0.2, adventuresPerWeek: 3, achievementEvery: 2, stopAfter: 14 },
  { id: 'casual', label: 'Casual (3 dias por semana)', activeChance: 0.43, tasks: 3, energyMix: [0.6, 0.35, 0.05], care: 1, mood: 0.4, journal: 0.1, jar: 0.1, tool: 0.2, dailyQuests: 1, weekly: 0.3, monthly: 0.1, adventuresPerWeek: 1, achievementEvery: 10 },
  { id: 'frequente', label: 'Frequente (quase todo dia)', activeChance: 0.85, tasks: 6, energyMix: [0.4, 0.45, 0.15], care: 3, mood: 0.8, journal: 0.4, jar: 0.4, tool: 0.5, dailyQuests: 2, weekly: 0.7, monthly: 0.5, adventuresPerWeek: 3, achievementEvery: 5 },
  { id: 'muito-ativo', label: 'Muito ativo (todo dia, tudo)', activeChance: 1, tasks: 14, energyMix: [0.3, 0.4, 0.3], care: 5, mood: 1, journal: 1, jar: 1, tool: 1, dailyQuests: 3, weekly: 1, monthly: 1, adventuresPerWeek: 7, achievementEvery: 3 },
];

export interface SimResult {
  persona: string;
  days: number;
  /** Dia em que chegou a cada nível (null = não chegou). */
  levelDay: Record<number, number | null>;
  finalLevel: number;
  finalArena: number;
  xpPerActiveDay: number;
  coinsPerWeek: number;
  chests: Record<ChestId, number>;
  rarities: Record<Rarity, number>;
  duplicates: number;
  /** Fração do catálogo dos baús que a pessoa tem no fim. */
  owned: number;
  firstDay: Partial<Record<Rarity, number>>;
}

/** Política de compra: guarda até poder o melhor baú dentro do alcance de 2 semanas, depois compra. */
function pickChest(coins: number, perDay: number, cfg: GameConfig): ChestId | null {
  const reach = coins + perDay * 14;
  const target = [...CHEST_ORDER].reverse().find((c) => cfg.chests[c].price <= reach) ?? 'madeira';
  return coins >= cfg.chests[target].price ? target : null;
}

export function simulate(p: Persona, cfg: GameConfig, pool: PoolItem[], days = 365, seed = 1): SimResult {
  const rng = seeded(seed);
  let xp = 0;
  let coins = 0;
  let earned = 0;
  let activeDays = 0;
  let pity = emptyPity();
  let achievements = 0;
  const owned = new Set<string>();
  const levelDay: Record<number, number | null> = {};
  const chests = Object.fromEntries(CHEST_ORDER.map((c) => [c, 0])) as Record<ChestId, number>;
  const rarities = { comum: 0, incomum: 0, raro: 0, epico: 0, lendario: 0 } as Record<Rarity, number>;
  const firstDay: Partial<Record<Rarity, number>> = {};
  let duplicates = 0;
  const paidRefs = new Set<string>();

  const open = (chest: ChestId, day: number) => {
    const r = openChest({ chest, pity, owned, pool, rng, cfg });
    pity = r.pity;
    chests[chest]++;
    rarities[r.rarity]++;
    if (firstDay[r.rarity] === undefined) firstDay[r.rarity] = day;
    if (r.duplicate) duplicates++;
    owned.add(r.itemId);
  };

  const pay = (src: Source, usage: ReturnType<typeof emptyUsage>, day: number) => {
    const g = baseGrant(src, cfg);
    if (paidRefs.has(g.ref)) return usage;
    paidRefs.add(g.ref);
    const paid = capGrant(g, usage, cfg);
    const before = xp;
    xp += paid.xp;
    coins += paid.coins;
    earned += paid.coins;
    const ups = levelUps(before, xp, cfg);
    for (const l of ups.levels) {
      if (levelDay[l] === undefined) levelDay[l] = day;
      const lg = capGrant(baseGrant({ kind: 'nivel', level: l }, cfg), usage, cfg);
      coins += lg.coins;
      earned += lg.coins;
    }
    for (const a of ups.arenas) {
      const ar = cfg.arenas.find((x) => x.n === a)!;
      coins += ar.reward.coins;
      earned += ar.reward.coins;
      if (ar.reward.chest) open(ar.reward.chest, day);
    }
    return addUsage(usage, g, paid);
  };

  for (let day = 1; day <= days; day++) {
    if (p.stopAfter && day > p.stopAfter) break;
    const date = `d${day}`;
    if (rng() > p.activeChance) continue;
    activeDays++;
    let u = emptyUsage();
    const cats = ['habitos', 'autocuidado', 'emocional', 'fitness'] as const;
    for (let i = 0; i < p.tasks; i++) {
      const x = rng();
      const energy = (x < p.energyMix[0] ? 1 : x < p.energyMix[0] + p.energyMix[1] ? 2 : 3) as 1 | 2 | 3;
      u = pay({ kind: 'tarefa', id: `t${i}`, energy, cat: energy === 3 ? 'fitness' : cats[i % 4], date }, u, day);
    }
    for (let i = 0; i < p.care; i++) u = pay({ kind: 'cuidado', care: `c${i}`, date }, u, day);
    if (rng() < p.mood) u = pay({ kind: 'humor', date }, u, day);
    if (rng() < p.journal) u = pay({ kind: 'diario', date }, u, day);
    if (rng() < p.jar) u = pay({ kind: 'pote', date }, u, day);
    if (rng() < p.tool) u = pay({ kind: 'bemestar', tool: 'respirar', date }, u, day);
    for (let q = 0; q < p.dailyQuests; q++) u = pay({ kind: 'desafio', period: 'dia', id: `q${q}`, key: date }, u, day);
    if (day % 7 === 0) for (let q = 0; q < 2; q++) if (rng() < p.weekly) u = pay({ kind: 'desafio', period: 'semana', id: `w${q}`, key: date }, u, day);
    if (day % 30 === 0 && rng() < p.monthly) u = pay({ kind: 'desafio', period: 'mes', id: 'm', key: date }, u, day);
    if (rng() < p.adventuresPerWeek / 7) u = pay({ kind: 'aventura', place: 'x', xp: 15, coins: 8, date, n: 1 }, u, day);
    u = pay({ kind: 'presente', coins: 4, date }, u, day);
    if (activeDays % p.achievementEvery === 0 && achievements < 16) {
      achievements++;
      u = pay({ kind: 'conquista', id: `a${achievements}`, coins: 30 }, u, day);
    }
    // Compras de baú
    const perDay = activeDays ? earned / day : 0;
    for (let guard = 0; guard < 3; guard++) {
      const c = pickChest(coins, perDay, cfg);
      if (!c) break;
      coins -= cfg.chests[c].price;
      open(c, day);
    }
  }
  const last = p.stopAfter ?? days;
  const lvl = levelOf(xp, cfg);
  for (const l of [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 20]) if (levelDay[l] === undefined) levelDay[l] = null;
  return {
    persona: p.id,
    days: last,
    levelDay,
    finalLevel: lvl,
    finalArena: arenaOf(lvl, cfg).n,
    xpPerActiveDay: Math.round(xp / Math.max(1, activeDays)),
    coinsPerWeek: Math.round((earned / last) * 7),
    chests,
    rarities,
    duplicates,
    owned: Math.round((owned.size / pool.length) * 100) / 100,
    firstDay,
  };
}

/** Média de várias rodadas (sementes diferentes) para tirar a sorte da conta. */
export function simulateMany(p: Persona, cfg: GameConfig, pool: PoolItem[], days = 365, runs = 20): SimResult {
  const all = Array.from({ length: runs }, (_, i) => simulate(p, cfg, pool, days, i + 1));
  const med = (xs: (number | null)[]) => {
    const v = xs.filter((x): x is number => x !== null).sort((a, b) => a - b);
    return v.length >= runs / 2 ? v[Math.floor(v.length / 2)] : null;
  };
  const avg = (f: (r: SimResult) => number) => Math.round((all.reduce((n, r) => n + f(r), 0) / runs) * 10) / 10;
  const levels = Object.keys(all[0].levelDay).map(Number);
  return {
    persona: p.id,
    days: all[0].days,
    levelDay: Object.fromEntries(levels.map((l) => [l, med(all.map((r) => r.levelDay[l]))])),
    finalLevel: Math.round(avg((r) => r.finalLevel)),
    finalArena: Math.round(avg((r) => r.finalArena)),
    xpPerActiveDay: avg((r) => r.xpPerActiveDay),
    coinsPerWeek: avg((r) => r.coinsPerWeek),
    chests: Object.fromEntries(CHEST_ORDER.map((c) => [c, avg((r) => r.chests[c])])) as Record<ChestId, number>,
    rarities: Object.fromEntries(Object.keys(all[0].rarities).map((k) => [k, avg((r) => r.rarities[k as Rarity])])) as Record<Rarity, number>,
    duplicates: avg((r) => r.duplicates),
    owned: avg((r) => r.owned),
    firstDay: Object.fromEntries((['raro', 'epico', 'lendario'] as Rarity[]).map((k) => [k, med(all.map((r) => r.firstDay[k] ?? null))])) as Partial<Record<Rarity, number>>,
  };
}

export const rareOrBetter = (r: Record<Rarity, number>) => (Object.keys(r) as Rarity[]).filter((k) => rarityRank(k) >= 2).reduce((n, k) => n + r[k], 0);
