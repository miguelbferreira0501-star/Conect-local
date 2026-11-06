// Crescimento do Hami: ele nasce pequenininho (uns 70% do tamanho) e cresce um pouquinho a cada dia de cuidado.
// Demora de propósito: chega ao tamanho máximo depois de uns 300 dias cuidados (não precisam ser seguidos).
import type { DayLog } from '../types';

export interface GrowthStage {
  /** Dias de cuidado para chegar nesta fase. */
  days: number;
  name: string;
  /** Tamanho do desenho (1 = tamanho máximo). */
  scale: number;
}

export const GROWTH: GrowthStage[] = [
  { days: 0, name: 'Recém-nascido', scale: 0.72 },
  { days: 4, name: 'Filhote', scale: 0.75 },
  { days: 12, name: 'Pequenino', scale: 0.78 },
  { days: 30, name: 'Crescendo', scale: 0.82 },
  { days: 60, name: 'Jovem', scale: 0.86 },
  { days: 110, name: 'Quase adulto', scale: 0.9 },
  { days: 180, name: 'Adulto', scale: 0.95 },
  { days: 300, name: 'Grandão', scale: 1 },
];

/** Dia de cuidado: fez pelo menos uma missão ou cuidou do Hami (comida, banho, carinho…). */
export const caredDay = (d: DayLog | undefined) => !!d && (Object.keys(d.done ?? {}).length > 0 || (d.care ?? []).length > 0);

export function careDays(days: Record<string, DayLog>): number {
  let n = 0;
  for (const d of Object.values(days)) if (caredDay(d)) n++;
  return n;
}

export interface Growth {
  stage: number;
  name: string;
  /** Tamanho agora: cresce um pouquinho a cada dia, não só quando muda de fase. */
  scale: number;
  days: number;
  next: GrowthStage | null;
  /** Quantos dias de cuidado faltam para a próxima fase. */
  toNext: number;
  /** Quanto já andou dentro da fase atual (0 a 1). */
  progress: number;
}

export function growthOf(days: number): Growth {
  let stage = 0;
  GROWTH.forEach((g, i) => {
    if (days >= g.days) stage = i;
  });
  const cur = GROWTH[stage];
  const next = GROWTH[stage + 1] ?? null;
  const progress = next ? (days - cur.days) / (next.days - cur.days) : 1;
  const scale = next ? cur.scale + (next.scale - cur.scale) * progress : cur.scale;
  return { stage, name: cur.name, scale: Math.round(scale * 10000) / 10000, days, next, toNext: next ? next.days - days : 0, progress };
}
