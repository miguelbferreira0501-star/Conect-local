// Baús: chances por raridade, proteção contra azar, escolha do item e repetidos.
// Baús só aceitam sementes ganhas no app (nunca dinheiro). Para menores de 18 o baú é
// "revelado": a pessoa vê o item antes de comprar (sem sorteio na hora da compra).
import { CHEST_ORDER, RARITY_ORDER, rarityRank, type ChestId, type GameConfig, type Rarity } from './config';

export interface Pity {
  /** Baús seguidos sem item raro ou melhor. */
  semRaro: number;
  /** Baús seguidos sem item lendário. */
  semLendario: number;
}

export const emptyPity = (): Pity => ({ semRaro: 0, semLendario: 0 });

/** Chances de verdade deste baú agora, já com a proteção contra azar. Soma 100. */
export function chestOdds(chest: ChestId, pity: Pity, cfg: GameConfig): Record<Rarity, number> {
  const base = { ...cfg.chests[chest].odds };
  const { rareAfter, softFrom, softStep, legendaryAfter } = cfg.pity;
  // Garantia de lendário.
  if (pity.semLendario + 1 >= legendaryAfter) return { comum: 0, incomum: 0, raro: 0, epico: 0, lendario: 100 };
  const lowMass = base.comum + base.incomum;
  // Garantia de raro ou melhor: tira toda a chance de comum e incomum e divide entre o resto.
  if (lowMass > 0 && pity.semRaro + 1 >= rareAfter) {
    const high = base.raro + base.epico + base.lendario || 1;
    const k = 100 / high;
    return round({ comum: 0, incomum: 0, raro: base.raro * k || 100, epico: base.epico * k, lendario: base.lendario * k });
  }
  // Proteção suave: a cada baú sem raro, a chance de raro sobe um pouco (tirando de comum e incomum).
  if (lowMass > 0 && pity.semRaro + 1 > softFrom) {
    const boost = Math.min(lowMass, softStep * (pity.semRaro + 1 - softFrom));
    const fromComum = Math.min(base.comum, boost * (base.comum / lowMass));
    const fromIncomum = boost - fromComum;
    return round({ ...base, comum: base.comum - fromComum, incomum: base.incomum - fromIncomum, raro: base.raro + boost });
  }
  return base;
}

function round(o: Record<Rarity, number>): Record<Rarity, number> {
  const r = Object.fromEntries(RARITY_ORDER.map((k) => [k, Math.round(o[k] * 10) / 10])) as Record<Rarity, number>;
  // Ajusta o arredondamento na maior chance para somar exatamente 100.
  const diff = Math.round((100 - RARITY_ORDER.reduce((n, k) => n + r[k], 0)) * 10) / 10;
  if (diff) {
    const top = RARITY_ORDER.reduce((a, b) => (r[b] > r[a] ? b : a));
    r[top] = Math.round((r[top] + diff) * 10) / 10;
  }
  return r;
}

/** A proteção está ativa? (para mostrar na loja) */
export function pityInfo(pity: Pity, cfg: GameConfig): { rareIn: number; legendaryIn: number; boosted: boolean } {
  return {
    rareIn: Math.max(1, cfg.pity.rareAfter - pity.semRaro),
    legendaryIn: Math.max(1, cfg.pity.legendaryAfter - pity.semLendario),
    boosted: pity.semRaro + 1 > cfg.pity.softFrom,
  };
}

export function rollRarity(odds: Record<Rarity, number>, rng: () => number): Rarity {
  let x = rng() * 100;
  for (const r of RARITY_ORDER) {
    if (odds[r] <= 0) continue;
    if (x < odds[r]) return r;
    x -= odds[r];
  }
  return [...RARITY_ORDER].reverse().find((r) => odds[r] > 0) ?? 'comum';
}

export interface PoolItem {
  /** Fantasia exclusiva do Baú Lendário: sai mais vezes nele. */
  star?: boolean;
  id: string;
  rarity: Rarity;
}

export interface ChestResult {
  chest: ChestId;
  rarity: Rarity;
  itemId: string;
  duplicate: boolean;
  /** Fragmentos ganhos (repetido vira fragmento). */
  fragments: number;
  pity: Pity;
}

/**
 * Abre um baú. Prefere itens que a pessoa ainda não tem; se ela já tem todos daquela
 * raridade, o item vem repetido e vira fragmentos (com os fragmentos dá para fabricar
 * o item que falta). Se uma raridade não tiver itens, usa a de baixo.
 */
export function openChest(args: { chest: ChestId; pity: Pity; owned: Set<string>; pool: PoolItem[]; rng: () => number; cfg: GameConfig }): ChestResult {
  const { chest, pity, owned, pool, rng, cfg } = args;
  const odds = chestOdds(chest, pity, cfg);
  let rarity = rollRarity(odds, rng);
  let candidates = pool.filter((p) => p.rarity === rarity);
  while (!candidates.length && rarityRank(rarity) > 0) {
    rarity = RARITY_ORDER[rarityRank(rarity) - 1];
    candidates = pool.filter((p) => p.rarity === rarity);
  }
  if (!candidates.length) throw new Error('Baú sem itens');
  // Exclusivas só saem do Baú Lendário; nele, 60% das vezes o item lendário é uma delas.
  if (chest !== 'lendario') candidates = candidates.filter((p) => !p.star).length ? candidates.filter((p) => !p.star) : candidates;
  else if (rarity === 'lendario') {
    const stars = candidates.filter((p) => p.star);
    if (stars.length && rng() < 0.6) candidates = stars;
  }
  const fresh = candidates.filter((p) => !owned.has(p.id));
  const list = fresh.length ? fresh : candidates;
  const item = list[Math.floor(rng() * list.length) % list.length];
  const duplicate = !fresh.length;
  const next: Pity = {
    semRaro: rarityRank(rarity) >= rarityRank('raro') ? 0 : pity.semRaro + 1,
    semLendario: rarity === 'lendario' ? 0 : pity.semLendario + 1,
  };
  return { chest, rarity, itemId: item.id, duplicate, fragments: duplicate ? cfg.rarities[rarity].fragments : 0, pity: next };
}

/** Oficina: quantos fragmentos custa fabricar um item (pela raridade dele). */
export function craftCost(rarity: Rarity, cfg: GameConfig): number {
  return cfg.rarities[rarity].craft;
}

/** Pode fabricar? Só itens que saem de baú, que a pessoa ainda não tem, com fragmentos suficientes. */
export function canCraft(itemId: string, args: { pool: PoolItem[]; owned: Set<string>; fragments: number; cfg: GameConfig }): { ok: true; cost: number; rarity: Rarity } | { ok: false; error: 'invalido' | 'ja-tem' | 'sem-fragmentos'; cost?: number } {
  const p = args.pool.find((x) => x.id === itemId);
  if (!p) return { ok: false, error: 'invalido' };
  if (args.owned.has(itemId)) return { ok: false, error: 'ja-tem' };
  const cost = craftCost(p.rarity, args.cfg);
  if (args.fragments < cost) return { ok: false, error: 'sem-fragmentos', cost };
  return { ok: true, cost, rarity: p.rarity };
}

/** Quantas peças de uma coleção a pessoa já tem. */
export function collectionProgress(items: string[], owned: Set<string>): { have: number; total: number; done: boolean } {
  const have = items.filter((id) => owned.has(id)).length;
  return { have, total: items.length, done: have === items.length && items.length > 0 };
}

export const isChest = (x: string): x is ChestId => (CHEST_ORDER as string[]).includes(x);

/** Gerador de números aleatórios previsível (para testes e simulação). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
