// Peso virtual, condicionamento e fases do Hami. Funções puras (testadas em evolution.test.ts).
import type { AgeGroup, BodyData, BodyStart, DayLog } from '../types';
import { addDays, clamp, dayDiff } from '../lib/util';

/** Faixa saudável do Hami, em gramas de hamster (nunca comparável a gente). */
export const BAND = { min: 120, max: 150, center: 135 } as const;
/** Limites visuais: abaixo ou acima disso o desenho não muda mais. */
export const LIMITS = { min: 105, max: 175 } as const;
export const START_GRAMS: Record<BodyStart, number> = { fofinho: 165, equilibrado: 135, mignon: 115 };
/** Mudança máxima por pesagem semanal. */
export const MAX_STEP = 3;
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

export interface WeighInput {
  grams: number;
  startGrams: number;
  minor: boolean;
  sync: boolean;
  baselineKg: number | null;
  recentKg: number | null;
  activeDays: number;
}

export interface WeighResult {
  grams: number;
  target: number;
  mode: 'fixo' | 'sincronizado' | 'faixa';
}

const roundHalf = (v: number) => Math.round(v * 2) / 2;

/**
 * Uma pesagem semanal. Exercício não mexe direto no peso: ele só decide se o Hami
 * anda em direção à faixa saudável (modo faixa). No modo sincronizado (18+, com
 * consentimento), o alvo acompanha a variação proporcional da pessoa.
 */
export function weighIn(i: WeighInput): WeighResult {
  if (i.minor) return { grams: i.grams, target: i.grams, mode: 'fixo' };
  if (i.sync && i.baselineKg && i.recentKg) {
    const target = roundHalf(clamp(i.startGrams * (i.recentKg / i.baselineKg), LIMITS.min, LIMITS.max));
    return { grams: stepTowards(i.grams, target, MAX_STEP), target, mode: 'sincronizado' };
  }
  const target = clamp(i.grams, BAND.min, BAND.max);
  const step = i.activeDays >= 3 ? MAX_STEP : i.activeDays >= 1 ? 1 : 0;
  return { grams: stepTowards(i.grams, target, step), target, mode: 'faixa' };
}

function stepTowards(from: number, to: number, step: number): number {
  const diff = to - from;
  if (Math.abs(diff) <= step) return roundHalf(to);
  return roundHalf(from + Math.sign(diff) * step);
}

/**
 * Faz as pesagens pendentes desde `lastWeighIn` (no máximo 8 semanas de uma vez).
 * Devolve a lista de pesagens novas, em ordem.
 */
export function pendingWeighIns(args: {
  grams: number;
  startGrams: number;
  lastWeighIn: string;
  today: string;
  minor: boolean;
  body: BodyData;
  days: Record<string, DayLog>;
}): { date: string; grams: number }[] {
  const out: { date: string; grams: number }[] = [];
  let grams = args.grams;
  let last = args.lastWeighIn;
  for (let w = 0; w < 8 && dayDiff(last, args.today) >= WEIGH_EVERY_DAYS; w++) {
    const date = addDays(last, WEIGH_EVERY_DAYS);
    const end = addDays(date, -1);
    const res = weighIn({
      grams,
      startGrams: args.startGrams,
      minor: args.minor,
      sync: args.body.sync,
      baselineKg: args.body.baselineKg,
      recentKg: recentAverageKg(args.body.logs, end),
      activeDays: activeDaysIn(args.days, end, 7),
    });
    grams = res.grams;
    out.push({ date, grams });
    last = date;
  }
  return out;
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

// ---------- Metas pessoais de peso (só 18+) ----------

export type GoalCheck = { ok: true } | { ok: false; reason: string };

/**
 * Valida uma meta pessoal: sem metas extremas. Mínimo de 4 semanas, no máximo 1%
 * do peso por semana, e (com altura) nunca abaixo de IMC 18,5 nem acima de 30.
 */
export function checkGoal(currentKg: number, goalKg: number, weeks: number, heightCm: number | null, minor: boolean): GoalCheck {
  if (minor) return { ok: false, reason: 'Metas de peso não ficam disponíveis para menores de 18 anos.' };
  if (!(currentKg > 25 && currentKg < 400) || !(goalKg > 25 && goalKg < 400)) return { ok: false, reason: 'Confira os valores digitados.' };
  if (weeks < 4) return { ok: false, reason: 'Escolha um prazo de pelo menos 4 semanas.' };
  const perWeek = Math.abs(goalKg - currentKg) / weeks;
  if (perWeek > currentKg * 0.01) {
    const minWeeks = Math.ceil(Math.abs(goalKg - currentKg) / (currentKg * 0.01));
    return { ok: false, reason: `Essa meta é rápida demais. Com essa diferença, o prazo mínimo seguro é de ${minWeeks} semanas.` };
  }
  if (heightCm) {
    const bmi = goalKg / Math.pow(heightCm / 100, 2);
    if (bmi < 18.5) return { ok: false, reason: 'Essa meta fica abaixo de um peso saudável para a sua altura. Escolha outra.' };
  }
  return { ok: true };
}

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
