import { describe, expect, it } from 'vitest';
import { activeQuests, levelOf, questProgress, QUESTS, xpForLevel } from './progress';
import type { DayLog } from '../types';

describe('níveis', () => {
  it('curva de XP', () => {
    expect([1, 2, 3, 4, 5].map(xpForLevel)).toEqual([0, 50, 150, 300, 500]);
    expect(levelOf(0)).toBe(1);
    expect(levelOf(149)).toBe(2);
    expect(levelOf(150)).toBe(3);
  });
});

describe('desafios', () => {
  it('3 diários, 2 semanais e 1 mensal, sempre os mesmos no período', () => {
    const a = activeQuests(42, '2026-11-03');
    expect(a.filter((q) => q.period === 'dia')).toHaveLength(3);
    expect(a.filter((q) => q.period === 'semana')).toHaveLength(2);
    expect(a.filter((q) => q.period === 'mes')).toHaveLength(1);
    expect(activeQuests(42, '2026-11-03').map((q) => q.id)).toEqual(a.map((q) => q.id));
  });
  it('progresso semanal soma a semana inteira', () => {
    const q = QUESTS.find((x) => x.id === 'mover3')!;
    const days: Record<string, DayLog> = {
      '2026-11-02': { done: { a: 'fitness', b: 'fitness' }, care: [] },
      '2026-11-03': { done: { a: 'fitness' }, care: [] },
      '2026-10-30': { done: { a: 'fitness' }, care: [] },
    };
    expect(questProgress(q, days, '2026-11-04')).toBe(2);
  });
});
