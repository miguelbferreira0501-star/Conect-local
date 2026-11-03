// Jornada de peso por calorias, condicionamento e fases do Hami. Funções puras (testadas em evolution.test.ts).
import type { AgeGroup, BodyData, BodyStart, DayLog, Direction, GoalId, Journey } from '../types';
import { addDays, clamp, dayDiff } from '../lib/util';

/** Faixa saudável do Hami, em gramas de hamster (nunca comparável a gente). */
export const BAND = { min: 120, max: 150, center: 135 } as const;
/** Limites visuais: abaixo ou acima disso o desenho não muda mais. */
export const LIMITS = { min: 105, max: 175 } as const;
export const START_GRAMS: Record<BodyStart, number> = { fofinho: 165, equilibrado: 135, mignon: 115 };
/** Resumo da jornada a cada 7 dias. */
export const WEIGH_EVERY_DAYS = 7;

export const isMinor = (age: AgeGroup) => age !== '18mais';

export function isActive(day: DayLog | undefined): boolean {
  return !!day && Object.keys(day.done).length > 0;
}

/** Dias com pelo menos uma tarefa feita, na janela de `n` dias que termina em `endKey` (inclusive). */
export function activeDaysIn(days: Record<string, DayLog>, endKey: string, n: number): number {
  let count = 0;
  for (let i = 0; i < n; i++) if (isActive(days[addDays(endKey, -i)])) count++;
  return count;
}

/** Média dos registros de peso da pessoa nos últimos 14 dias até `endKey`. */
export function recentAverageKg(logs: BodyData['logs'], endKey: string): number | null {
  const recent = logs.filter((l) => {
    const d = dayDiff(l.date, endKey);
    return d >= 0 && d < 14;
  });
  if (!recent.length) return null;
  return recent.reduce((s, l) => s + l.kg, 0) / recent.length;
}

// ---------- Jornada de calorias ----------
//
// A pessoa escolhe emagrecer, ganhar ou manter. Cada missão saudável soma uma
// estimativa das calorias que ela queimou, economizou (troca saudável) ou somou
// (lanche nutritivo). O Hami recebe exatamente as mesmas calorias: quando a
// pessoa chega à meta dela, ele chega à dele.

/** Calorias aproximadas em 1 kg de gordura corporal. */
export const KCAL_PER_KG = 7700;
/** Peso usado nas contas quando a pessoa prefere não informar o dela. */
export const REF_KG = 70;
/** Teto de calorias contadas por dia: mais do que isso não acelera (sem exagero). */
export const DAY_CAP: Record<Direction, number> = { perder: 800, ganhar: 700, manter: 800 };
/** Corpo do Hami no começo e na meta de cada jornada. */
export const JOURNEY_GRAMS: Record<Direction, { start: number; goal: number }> = {
  perder: { start: 165, goal: 135 },
  ganhar: { start: 115, goal: 140 },
  manter: { start: 135, goal: 135 },
};
/** Meta padrão quando a pessoa não define uma: 5% do peso. */
export const DEFAULT_GOAL_PCT = 0.05;

export function directionOf(goal: GoalId, minor: boolean): Direction {
  if (minor) return 'manter';
  return goal === 'emagrecer' ? 'perder' : goal === 'ganhar' ? 'ganhar' : 'manter';
}

export const roundHalf = (v: number) => Math.round(v * 2) / 2;

export function defaultGoalKg(kg: number, dir: Direction): number {
  if (dir === 'manter') return kg;
  return roundHalf(kg * (dir === 'perder' ? 1 - DEFAULT_GOAL_PCT : 1 + DEFAULT_GOAL_PCT));
}

export const needKcalFor = (kg: number, goalKg: number) => Math.round(Math.abs(goalKg - kg) * KCAL_PER_KG);

export interface KcalSource {
  cat?: string;
  energy?: 1 | 2 | 3;
  met?: number;
  min?: number;
  swap?: number;
  gain?: number;
}

/** Atividade física criada pela pessoa: estimativa pela energia que ela pede. */
const CUSTOM_MOVE: Record<1 | 2 | 3, { met: number; min: number }> = { 1: { met: 2.5, min: 10 }, 2: { met: 3.5, min: 20 }, 3: { met: 6, min: 30 } };

/**
 * Calorias estimadas de uma missão para a jornada.
 * Movimento: (MET − 1) × kg × horas (só o que passa do repouso).
 * Emagrecer: movimento + troca saudável. Ganhar: lanche nutritivo. Manter: movimento (só para ver).
 */
export function taskKcal(t: KcalSource, dir: Direction, kg: number): number {
  if (dir === 'ganhar') return Math.round(t.gain ?? 0);
  const move = t.met && t.min ? t : t.cat === 'fitness' && t.energy ? CUSTOM_MOVE[t.energy] : null;
  const burn = move?.met && move.min ? (move.met - 1) * kg * (move.min / 60) : 0;
  return Math.round(burn + (dir === 'perder' ? t.swap ?? 0 : 0));
}

/** Calorias do dia que contam para a jornada (com teto diário). */
export function dayKcal(d: DayLog | undefined, dir: Direction): number {
  if (!d?.kcal) return 0;
  const sum = Object.values(d.kcal).reduce((a, b) => a + b, 0);
  return Math.min(DAY_CAP[dir], sum);
}

/** Soma da jornada desde `from` até `to` (inclusive). */
export function journeyKcal(days: Record<string, DayLog>, from: string, dir: Direction, to?: string): number {
  let total = 0;
  for (const [k, d] of Object.entries(days)) if (k >= from && (!to || k <= to)) total += dayKcal(d, dir);
  return total;
}

/** Progresso (0 a 1) pela balança: só quando a pessoa registra o peso e liga a sincronização. */
export function scaleProgress(dir: Direction, baselineKg: number, goalKg: number, recentKg: number): number {
  if (dir === 'manter' || baselineKg === goalKg) return 0;
  const p = dir === 'perder' ? (baselineKg - recentKg) / (baselineKg - goalKg) : (recentKg - baselineKg) / (goalKg - baselineKg);
  return clamp(p, 0, 1);
}

export function journeyProgress(j: Journey, kcal: number): number {
  if (j.dir === 'manter' || j.needKcal <= 0) return 0;
  return clamp(kcal / j.needKcal, 0, 1);
}

/** Peso do Hami para um progresso da jornada (meio grama de precisão no desenho, décimos no número). */
export function journeyGrams(j: Journey, progress: number): number {
  const g = j.startGrams + (j.goalGrams - j.startGrams) * clamp(progress, 0, 1);
  return Math.round(clamp(g, LIMITS.min, LIMITS.max) * 10) / 10;
}

/** Quantos dias faltam no ritmo do teto diário (o caminho mais rápido que o app permite). */
export function minDaysLeft(j: Journey, kcal: number): number {
  if (j.dir === 'manter') return 0;
  return Math.ceil(Math.max(0, j.needKcal - kcal) / DAY_CAP[j.dir]);
}

export type GoalCheck = { ok: true } | { ok: false; reason: string };

/**
 * Valida a meta de uma jornada: só para 18+, no máximo 20% do peso (perder) ou 15% (ganhar)
 * por jornada e, com altura, nunca abaixo de IMC 18,5.
 */
export function checkJourneyGoal(kg: number, goalKg: number, dir: Direction, heightCm: number | null, minor: boolean): GoalCheck {
  if (minor) return { ok: false, reason: 'Metas de peso não ficam disponíveis para menores de 18 anos.' };
  if (!(kg > 25 && kg < 400) || !(goalKg > 25 && goalKg < 400)) return { ok: false, reason: 'Confira os valores digitados.' };
  if (dir === 'perder') {
    if (goalKg >= kg) return { ok: false, reason: 'Para emagrecer, a meta precisa ser menor que o peso de hoje.' };
    if (goalKg < kg * 0.8) return { ok: false, reason: 'Vamos por etapas: uma jornada vai até 20% do seu peso. Depois dá pra começar outra.' };
  }
  if (dir === 'ganhar') {
    if (goalKg <= kg) return { ok: false, reason: 'Para ganhar peso, a meta precisa ser maior que o peso de hoje.' };
    if (goalKg > kg * 1.15) return { ok: false, reason: 'Vamos por etapas: uma jornada vai até 15% do seu peso. Depois dá pra começar outra.' };
  }
  if (heightCm) {
    const bmi = goalKg / Math.pow(heightCm / 100, 2);
    if (bmi < 18.5) return { ok: false, reason: 'Essa meta fica abaixo de um peso saudável para a sua altura. Escolha outra.' };
  }
  return { ok: true };
}

/** 0 (mignon) a 1 (bem fofinho): quanto o corpo e as bochechas se abrem no desenho. */
export function fluffOf(grams: number): number {
  return clamp((grams - LIMITS.min) / (LIMITS.max - LIMITS.min), 0, 1);
}

export function bandLabel(grams: number): string {
  if (grams < BAND.min) return 'Mignon';
  if (grams > BAND.max) return 'Fofinho';
  return 'Na faixa saudável';
}

// ---------- Condicionamento e fases ----------

export const PHASES = ['Inicial', 'Evolução', 'Condicionamento', 'Avançada'] as const;
export const PHASE_MIN = [0, 25, 50, 75];
/** 20 dias de movimento em 4 semanas = 100. */
const FULL_CREDIT_DAYS = 20;

/**
 * Condicionamento (0 a 100) dos últimos 28 dias. Um dia com movimento vale 1;
 * vários no mesmo dia valem 1,25 no máximo: constância vale mais que intensidade.
 */
export function conditioning(days: Record<string, DayLog>, today: string): number {
  let credit = 0;
  for (let i = 0; i < 28; i++) {
    const d = days[addDays(today, -i)];
    if (!d) continue;
    const moves = Object.values(d.done).filter((c) => c === 'fitness').length;
    credit += moves === 0 ? 0 : moves === 1 ? 1 : 1.25;
  }
  return Math.min(100, Math.round((credit / FULL_CREDIT_DAYS) * 100));
}

export function phaseFor(score: number): number {
  let p = 0;
  PHASE_MIN.forEach((min, i) => {
    if (score >= min) p = i;
  });
  return p;
}

// ---------- Cuidado com mudanças rápidas ----------

/** Queda rápida (mais de 1,5% por semana nas últimas 2 semanas) pede uma mensagem de cuidado. */
export function rapidChange(logs: BodyData['logs'], today: string): boolean {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.filter((l) => dayDiff(l.date, today) <= 14 && dayDiff(l.date, today) >= 0);
  if (recent.length < 2) return false;
  const first = recent[0];
  const last = recent[recent.length - 1];
  const weeks = Math.max(1, dayDiff(first.date, last.date) / 7);
  return Math.abs(last.kg - first.kg) / first.kg / weeks > 0.015;
}
