import { describe, expect, it } from 'vitest';
import { bestStreak, breakDay, repairPlan, streakOf } from './streak';
import type { DayLog } from '../types';

const on: DayLog = { done: { a: 'habitos' }, care: [] };
const build = (keys: string[]) => Object.fromEntries(keys.map((k) => [k, on]));

describe('ofensiva', () => {
  // 2026-11-02 é segunda-feira.
  it('conta dias seguidos e hoje ainda não feito não quebra', () => {
    const days = build(['2026-11-02', '2026-11-03', '2026-11-04']);
    expect(streakOf(days, '2026-11-05', '2026-11-01').count).toBe(3);
    expect(streakOf(days, '2026-11-05', '2026-11-01').today).toBe(false);
  });
  it('até 2 dias de descanso por semana não quebram', () => {
    const days = build(['2026-11-02', '2026-11-05', '2026-11-06']);
    const s = streakOf(days, '2026-11-06', '2026-11-01');
    expect(s.count).toBe(3);
    expect(s.rested).toEqual(['2026-11-04', '2026-11-03']);
  });
  it('o terceiro dia parado na semana quebra a ofensiva', () => {
    const days = build(['2026-11-02', '2026-11-06']);
    expect(streakOf(days, '2026-11-06', '2026-11-01').count).toBe(1);
  });
  it('descansos antes do primeiro dia ativo não entram', () => {
    const days = build(['2026-11-05']);
    expect(streakOf(days, '2026-11-05', '2026-11-01').rested).toEqual([]);
  });
  it('recorde guarda a maior ofensiva', () => {
    const days = build(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-11-03']);
    expect(bestStreak(days, '2026-11-03', '2026-10-01')).toBe(4);
  });
  it('martelinho: conserta o dia que quebrou e a sequência volta', () => {
    // 11 e 10 usam os 2 descansos da semana e o 09 quebra; hoje (12) fez missão.
    const days = build(['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-12']);
    expect(streakOf(days, '2026-11-12', '2026-11-01').count).toBe(1);
    expect(breakDay(days, '2026-11-12', '2026-11-01')).toBe('2026-11-09');
    const plan = repairPlan(days, '2026-11-12', '2026-11-01');
    expect(plan).toEqual({ fix: ['2026-11-09'], before: 1, after: 8 });
    const fixed = { ...days, '2026-11-09': { done: {}, care: [], repaired: true } };
    expect(streakOf(fixed, '2026-11-12', '2026-11-01').count).toBe(8);
  });
  it('martelinho: até 2 dias, e nada a consertar quando não melhora', () => {
    const days = build(['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-12']);
    // 06 a 11 parados: 07/08 (fim de semana) gastam o descanso da semana 1; 09 e 10 o da semana 2; 11 quebra… e 06 também.
    const plan = repairPlan(days, '2026-11-12', '2026-11-01');
    expect(plan?.fix.length).toBeLessThanOrEqual(2);
    expect(plan!.after).toBeGreaterThan(plan!.before);
    expect(repairPlan(build(['2026-11-05']), '2026-11-05', '2026-11-01')).toBeNull();
  });
  it('martelinho: dia quebrado há mais de 7 dias não conserta', () => {
    const days = build(['2026-10-12', '2026-10-13', '2026-10-14', '2026-11-12']);
    expect(repairPlan(days, '2026-11-12', '2026-10-10')).toBeNull();
  });
});
