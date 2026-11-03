import { describe, expect, it } from 'vitest';
import { checkRef, cleanKcal, mealTotals, tooLittle } from './meals';
import type { MealEntry } from '../types';

const m = (kcal: number, eaten = false): MealEntry => ({ id: String(kcal), meal: 'almoco', name: 'x', qty: '', kcal, eaten });

describe('cardápio do dia', () => {
  it('soma o planejado e o que já foi comido', () => {
    expect(mealTotals([m(160), m(100, true), m(165, true)])).toEqual({ planned: 425, eaten: 265, items: 3 });
    expect(mealTotals(undefined)).toEqual({ planned: 0, eaten: 0, items: 0 });
  });
  it('calorias de um item ficam entre 0 e 3.000', () => {
    expect(cleanKcal(-5)).toBe(0);
    expect(cleanKcal(99.6)).toBe(100);
    expect(cleanKcal(99999)).toBe(3000);
    expect(cleanKcal(Number.NaN)).toBe(0);
  });
  it('referência diária segura', () => {
    expect(checkRef(null).ok).toBe(true);
    expect(checkRef(1800).ok).toBe(true);
    expect(checkRef(900).ok).toBe(false);
    expect(checkRef(9000).ok).toBe(false);
  });
  it('avisa com carinho quando o cardápio fica pequeno demais', () => {
    expect(tooLittle(600, 4)).toBe(true);
    expect(tooLittle(1500, 4)).toBe(false);
    expect(tooLittle(300, 1)).toBe(false);
  });
});
