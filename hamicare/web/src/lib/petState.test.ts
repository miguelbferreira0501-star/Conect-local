import { describe, expect, it } from 'vitest';
import { petStateOf } from './petState';
import { decayStats } from './store';
import type { State } from '../types';

const base = (energia: number, sleeping = false) => ({ pet: { sleeping, stats: { felicidade: 80, saciedade: 80, limpeza: 80, energia }, statsAt: 0 } }) as unknown as State;

describe('Lumbi não vive com sono', () => {
  it('de dia, com energia mediana, ele fica feliz (não sonolento)', () => {
    expect(petStateOf(base(30), { hour: 10 })).toBe('feliz');
  });
  it('sono só bem cansado ou tarde da noite', () => {
    expect(petStateOf(base(8), { hour: 10 })).toBe('sonolento');
    expect(petStateOf(base(30), { hour: 23 })).toBe('sonolento');
  });
  it('o tempo parado não deixa a energia cair abaixo de 35', () => {
    const s = decayStats(base(80), 10 * 24 * 3_600_000);
    expect(s.pet.stats.energia).toBe(35);
  });
  it('ele acorda sozinho de dia quando já descansou', () => {
    const day = new Date(2026, 10, 21, 10, 0).getTime();
    const s = { ...base(50, true), pet: { ...base(50, true).pet, statsAt: day - 2 * 3_600_000 } } as State;
    expect(decayStats(s, day).pet.sleeping).toBe(false);
  });
});
