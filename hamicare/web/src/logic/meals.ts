// Cardápio do dia: totais e validações. Funções puras (testadas em meals.test.ts).
import type { MealEntry } from '../types';

export const KCAL_ITEM_MAX = 3000;
/** Referência diária aceita sem acompanhamento: 1.200 a 5.000 kcal. */
export const REF_MIN = 1200;
export const REF_MAX = 5000;

export const cleanKcal = (n: number) => (Number.isFinite(n) ? Math.round(Math.min(KCAL_ITEM_MAX, Math.max(0, n))) : 0);

export function mealTotals(list: MealEntry[] | undefined): { planned: number; eaten: number; items: number } {
  const l = list ?? [];
  return {
    planned: l.reduce((n, m) => n + m.kcal, 0),
    eaten: l.filter((m) => m.eaten).reduce((n, m) => n + m.kcal, 0),
    items: l.length,
  };
}

export type RefCheck = { ok: true } | { ok: false; reason: string };

export function checkRef(kcal: number | null): RefCheck {
  if (kcal === null) return { ok: true };
  if (!Number.isFinite(kcal) || kcal < REF_MIN) return { ok: false, reason: `Abaixo de ${REF_MIN.toLocaleString('pt-BR')} kcal por dia só com acompanhamento de um nutricionista.` };
  if (kcal > REF_MAX) return { ok: false, reason: 'Confira o valor digitado.' };
  return { ok: true };
}

/** O cardápio planejado está bem abaixo do mínimo saudável? (aviso gentil, nunca bloqueia comer) */
export const tooLittle = (planned: number, items: number) => items >= 3 && planned > 0 && planned < 900;
