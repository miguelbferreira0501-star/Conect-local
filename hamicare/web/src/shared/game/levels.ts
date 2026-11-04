// Níveis e arenas: quanto XP falta, em que nível e em que arena a pessoa está.
import type { ArenaDef, GameConfig } from './config';

/** XP para passar do nível `level` para o seguinte. */
export function xpToNext(level: number, cfg: GameConfig): number {
  const { first, growth } = cfg.levels;
  if (level < 1) return first[0];
  if (level <= first.length) return first[level - 1];
  const last = first[first.length - 1];
  return Math.round((last * Math.pow(growth, level - first.length)) / 10) * 10;
}

/** XP total para chegar ao nível `level` (nível 1 = 0). */
export function xpAt(level: number, cfg: GameConfig): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpToNext(l, cfg);
  return total;
}

export function levelOf(xp: number, cfg: GameConfig): number {
  let level = 1;
  let need = xpToNext(1, cfg);
  let left = Math.max(0, xp);
  while (left >= need && level < 999) {
    left -= need;
    level++;
    need = xpToNext(level, cfg);
  }
  return level;
}

export function levelProgress(xp: number, cfg: GameConfig): { level: number; current: number; needed: number } {
  const level = levelOf(xp, cfg);
  return { level, current: Math.max(0, xp) - xpAt(level, cfg), needed: xpToNext(level, cfg) };
}

/** Arena atual: a mais alta cujo nível já foi alcançado. */
export function arenaOf(level: number, cfg: GameConfig): ArenaDef {
  let a = cfg.arenas[0];
  for (const x of cfg.arenas) if (x.level <= level && x.n > a.n) a = x;
  return a;
}

export const nextArena = (level: number, cfg: GameConfig): ArenaDef | null => cfg.arenas.filter((a) => a.level > level).sort((a, b) => a.level - b.level)[0] ?? null;

/** Prêmio em sementes por chegar a um nível. */
export const levelUpCoins = (level: number, cfg: GameConfig) => cfg.levelUp.base + cfg.levelUp.perLevel * level;

/**
 * Quem já usava o app tinha outra curva (25·n·(n−1)). Converte o XP mantendo o nível
 * e o progresso dentro dele: ninguém perde nível na mudança.
 */
export function migrateXp(oldXp: number, cfg: GameConfig): number {
  const oldAt = (n: number) => 25 * (n - 1) * n;
  let n = 1;
  while (oldAt(n + 1) <= oldXp) n++;
  const frac = (oldXp - oldAt(n)) / (oldAt(n + 1) - oldAt(n));
  return Math.round(xpAt(n, cfg) + Math.min(0.999, Math.max(0, frac)) * xpToNext(n, cfg));
}
