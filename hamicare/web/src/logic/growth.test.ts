import { describe, expect, it } from 'vitest';
import { careDays, growthOf, GROWTH } from './growth';

describe('crescimento do Hami', () => {
  it('nasce com metade do tamanho e só chega ao máximo depois de 300 dias de cuidado', () => {
    expect(growthOf(0)).toMatchObject({ stage: 0, name: 'Recém-nascido', scale: 0.5, toNext: 4 });
    expect(growthOf(299).scale).toBeLessThan(1);
    expect(growthOf(300)).toMatchObject({ name: 'Grandão', scale: 1, next: null, toNext: 0 });
    expect(growthOf(900).scale).toBe(1);
  });

  it('cresce um pouquinho a cada dia, sem nunca diminuir', () => {
    let last = 0;
    for (let d = 0; d <= 320; d++) {
      const g = growthOf(d);
      expect(g.scale).toBeGreaterThanOrEqual(last);
      last = g.scale;
    }
    expect(growthOf(31).scale).toBeGreaterThan(growthOf(30).scale);
  });

  it('as fases ficam cada vez mais longas', () => {
    for (let i = 2; i < GROWTH.length; i++) expect(GROWTH[i].days - GROWTH[i - 1].days).toBeGreaterThan(GROWTH[i - 1].days - GROWTH[i - 2].days);
  });

  it('conta dias com missão ou com cuidado do Hami', () => {
    const days = {
      '2026-11-01': { done: { agua: 'habitos' as const }, care: [] },
      '2026-11-02': { done: {}, care: ['banho' as const] },
      '2026-11-03': { done: {}, care: [] },
    };
    expect(careDays(days)).toBe(2);
  });
});
