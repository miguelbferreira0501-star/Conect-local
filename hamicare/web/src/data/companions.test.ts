import { describe, expect, it } from 'vitest';
import { COMPANIONS, companionStatus, eggWarmth, HATCH_DAYS, withEggs } from './companions';
import type { DayLog } from '../types';

const day = (over: Partial<DayLog> = {}): DayLog => ({ done: {}, care: [], ...over }) as DayLog;

describe('pets companheiros', () => {
  it('um pet por arena, ids únicos', () => {
    expect(COMPANIONS.map((c) => c.arena)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(new Set(COMPANIONS.map((c) => c.id)).size).toBe(12);
  });

  it('cada arena aberta traz o ovo dela, sem mexer nos que já chegaram', () => {
    const a = withEggs(undefined, 3, '2026-11-01');
    expect(Object.keys(a.got)).toEqual(['pet-piu', 'pet-pintinha', 'pet-bolinho']);
    expect(a.active).toBeNull();
    expect(withEggs(a, 3, '2026-11-09')).toBe(a);
    const b = withEggs(a, 4, '2026-11-09');
    expect(b.got['pet-piu'].at).toBe('2026-11-01');
    expect(b.got['pet-pipoca'].at).toBe('2026-11-09');
  });

  it('o ovo esquenta só com dias de cuidado depois que chegou', () => {
    const days = {
      '2026-10-30': day({ care: ['carinho'] }),
      '2026-11-01': day({ done: { agua: 'habitos' } }),
      '2026-11-02': day(),
      '2026-11-03': day({ care: ['banho'] }),
    } as Record<string, DayLog>;
    expect(eggWarmth(days, '2026-11-01')).toBe(2);
    expect(eggWarmth({ ...days, '2026-11-05': day({ care: ['comida'] }), '2026-11-06': day({ care: ['comida'] }) }, '2026-11-01')).toBe(HATCH_DAYS);
  });

  it('estados: fechado, ovo, pronto e chocado', () => {
    const days = { '2026-11-01': day({ care: ['carinho'] }), '2026-11-02': day({ care: ['carinho'] }), '2026-11-03': day({ care: ['carinho'] }) } as Record<string, DayLog>;
    const c = { got: { 'pet-piu': { at: '2026-11-01', hatched: '2026-11-03' }, 'pet-pintinha': { at: '2026-11-01' }, 'pet-bolinho': { at: '2026-11-03' } }, active: 'pet-piu' };
    const st = companionStatus(c, days);
    expect(st.slice(0, 4).map((x) => x.state)).toEqual(['chocado', 'pronto', 'ovo', 'bloqueado']);
    expect(st[2].warmth).toBe(1);
  });
});
