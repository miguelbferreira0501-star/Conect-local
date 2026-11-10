// Ofensiva com descanso protegido. Funções puras (testadas em streak.test.ts).
import type { DayLog } from '../types';
import { addDays, dayDiff, weekStart } from '../lib/util';
import { isActive } from './evolution';

/** Dias sem atividade, por semana (seg a dom), que não quebram a ofensiva. */
export const REST_PER_WEEK = 2;

export interface StreakInfo {
  /** Dias ativos seguidos (descansos protegidos não somam, mas não quebram). */
  count: number;
  /** Dias de descanso protegidos dentro da ofensiva atual. */
  rested: string[];
  /** Hoje já conta? */
  today: boolean;
  /** Descansos ainda disponíveis nesta semana. */
  restLeft: number;
}

export function streakOf(days: Record<string, DayLog>, today: string, createdAt: string): StreakInfo {
  const restUsed = new Map<string, number>();
  const rested: string[] = [];
  let pending: string[] = [];
  let count = 0;
  const todayActive = isActive(days[today]);
  // Hoje ainda está em andamento: sem atividade (e sem descanso marcado), a contagem começa ontem.
  let key = todayActive || days[today]?.rest ? today : addDays(today, -1);
  while (dayDiff(createdAt, key) >= 0) {
    if (isActive(days[key])) {
      count++;
      rested.push(...pending);
      pending = [];
    } else if (days[key]?.repaired) {
      // Consertado com o martelinho: segura a sequência sem gastar o descanso da semana.
      pending.push(key);
    } else {
      const wk = weekStart(key);
      const used = restUsed.get(wk) ?? 0;
      if (used >= REST_PER_WEEK) break;
      restUsed.set(wk, used + 1);
      pending.push(key);
    }
    key = addDays(key, -1);
  }
  // Descansos antes do primeiro dia ativo da sequência ficam de fora (pending é descartado).
  return { count, rested, today: todayActive, restLeft: Math.max(0, REST_PER_WEEK - restUsedThisWeek(days, today, createdAt)) };
}

/** Martelinho: conserta até 2 dias perdidos (nos últimos 7) que quebraram uma sequência. */
export const HAMMER_MAX = 3;
export const HAMMER_FIX_MAX = 2;

/** Dia em que a sequência quebrou (o primeiro dia, voltando no tempo, que não foi protegido). */
export function breakDay(days: Record<string, DayLog>, today: string, createdAt: string): string | null {
  const restUsed = new Map<string, number>();
  let key = isActive(days[today]) || days[today]?.rest ? today : addDays(today, -1);
  while (dayDiff(createdAt, key) >= 0) {
    if (!isActive(days[key]) && !days[key]?.repaired) {
      const wk = weekStart(key);
      const used = restUsed.get(wk) ?? 0;
      if (used >= REST_PER_WEEK) return key;
      restUsed.set(wk, used + 1);
    }
    key = addDays(key, -1);
  }
  return null;
}

export interface RepairPlan {
  /** Dias que o martelinho conserta (1 martelinho por dia). */
  fix: string[];
  before: number;
  after: number;
}

/** O que dá para consertar agora: só vale se a sequência voltar maior. */
export function repairPlan(days: Record<string, DayLog>, today: string, createdAt: string): RepairPlan | null {
  const before = streakOf(days, today, createdAt).count;
  let d = days;
  const fix: string[] = [];
  let best: RepairPlan | null = null;
  for (let i = 0; i < HAMMER_FIX_MAX; i++) {
    const b = breakDay(d, today, createdAt);
    if (!b || dayDiff(b, today) > 7) break;
    fix.push(b);
    d = { ...d, [b]: { ...(d[b] ?? { done: {}, care: [] }), repaired: true } };
    const after = streakOf(d, today, createdAt).count;
    if (after > before && (!best || after > best.after)) best = { fix: [...fix], before, after };
  }
  return best;
}

/** Descansos usados nesta semana: dias sem atividade até ontem, mais hoje se marcado como descanso. */
function restUsedThisWeek(days: Record<string, DayLog>, today: string, createdAt: string): number {
  let start = weekStart(today);
  if (dayDiff(start, createdAt) > 0) start = createdAt;
  let used = 0;
  for (let k = start; dayDiff(k, today) > 0; k = addDays(k, 1)) if (!isActive(days[k]) && !days[k]?.repaired) used++;
  if (days[today]?.rest && !isActive(days[today])) used++;
  return used;
}

/** Maior ofensiva já feita (para o recorde e as conquistas). */
export function bestStreak(days: Record<string, DayLog>, today: string, createdAt: string): number {
  let best = 0;
  for (let k = createdAt; dayDiff(k, today) >= 0; k = addDays(k, 1)) {
    if (isActive(days[k]) && !isActive(days[addDays(k, 1)])) best = Math.max(best, streakOf(days, k, createdAt).count);
  }
  return Math.max(best, streakOf(days, today, createdAt).count);
}
