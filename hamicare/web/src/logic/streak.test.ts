import { describe, expect, it } from 'vitest';
import { bestStreak, streakOf } from './streak';
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
});
