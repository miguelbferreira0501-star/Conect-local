import { describe, expect, it } from 'vitest';
import { BAND, checkGoal, conditioning, fluffOf, pendingWeighIns, phaseFor, rapidChange, weighIn } from './evolution';
import type { BodyData, DayLog } from '../types';
import { addDays } from '../lib/util';

const body = (p: Partial<BodyData> = {}): BodyData => ({
  tracking: false, sync: false, consentAt: null, heightCm: null, logs: [], baselineKg: null, goalKg: null, goalWeeks: null, hideNumbers: false, ...p,
});
const day = (cats: string[]): DayLog => ({ done: Object.fromEntries(cats.map((c, i) => [`t${i}`, c])) as DayLog['done'], care: [] });

describe('peso virtual', () => {
  it('menores de 18: o peso nunca muda', () => {
    expect(weighIn({ grams: 165, startGrams: 165, minor: true, sync: true, baselineKg: 80, recentKg: 70, activeDays: 7 }).grams).toBe(165);
  });
  it('sem sincronização: anda até a faixa saudável, no máximo 3 g por semana, e só com dias ativos', () => {
    expect(weighIn({ grams: 165, startGrams: 165, minor: false, sync: false, baselineKg: null, recentKg: null, activeDays: 4 }).grams).toBe(162);
    expect(weighIn({ grams: 165, startGrams: 165, minor: false, sync: false, baselineKg: null, recentKg: null, activeDays: 1 }).grams).toBe(164);
    expect(weighIn({ grams: 165, startGrams: 165, minor: false, sync: false, baselineKg: null, recentKg: null, activeDays: 0 }).grams).toBe(165);
    expect(weighIn({ grams: 115, startGrams: 115, minor: false, sync: false, baselineKg: null, recentKg: null, activeDays: 5 }).grams).toBe(118);
  });
  it('dentro da faixa, o Hami mantém o peso', () => {
    expect(weighIn({ grams: 140, startGrams: 140, minor: false, sync: false, baselineKg: null, recentKg: null, activeDays: 7 }).grams).toBe(140);
  });
  it('com sincronização: acompanha a variação proporcional da pessoa, devagar', () => {
    // A pessoa foi de 100 kg para 90 kg (-10%): alvo do Hami = 165 × 0,9 = 148,5 g.
    const r = weighIn({ grams: 165, startGrams: 165, minor: false, sync: true, baselineKg: 100, recentKg: 90, activeDays: 0 });
    expect(r.target).toBe(148.5);
    expect(r.grams).toBe(162);
  });
  it('o alvo sincronizado respeita os limites do desenho', () => {
    expect(weighIn({ grams: 120, startGrams: 120, minor: false, sync: true, baselineKg: 100, recentKg: 50, activeDays: 0 }).target).toBe(105);
  });
  it('faz as pesagens atrasadas, uma por semana', () => {
    const start = '2026-10-01';
    const days: Record<string, DayLog> = {};
    for (let i = 0; i < 21; i++) days[addDays(start, i)] = day(['fitness']);
    const res = pendingWeighIns({ grams: 165, startGrams: 165, lastWeighIn: start, today: addDays(start, 21), minor: false, body: body(), days });
    expect(res.map((r) => r.grams)).toEqual([162, 159, 156]);
    expect(res[0].date).toBe('2026-10-08');
  });
  it('fofura vai de 0 a 1', () => {
    expect(fluffOf(105)).toBe(0);
    expect(fluffOf(175)).toBe(1);
    expect(fluffOf(BAND.center)).toBeGreaterThan(0.3);
  });
});

describe('condicionamento e fases', () => {
  it('constância vale mais que intensidade', () => {
    const today = '2026-11-03';
    const constante: Record<string, DayLog> = {};
    for (let i = 0; i < 10; i++) constante[addDays(today, -i)] = day(['fitness']);
    const intenso: Record<string, DayLog> = { [today]: day(['fitness', 'fitness', 'fitness', 'fitness', 'fitness', 'fitness', 'fitness', 'fitness', 'fitness', 'fitness']) };
    expect(conditioning(constante, today)).toBe(50);
    expect(conditioning(intenso, today)).toBe(6);
  });
  it('fases por pontuação', () => {
    expect([0, 24, 25, 50, 74, 75, 100].map(phaseFor)).toEqual([0, 0, 1, 2, 2, 3, 3]);
  });
});

describe('metas de peso seguras', () => {
  it('menores não têm meta', () => expect(checkGoal(60, 55, 10, null, true).ok).toBe(false));
  it('recusa prazos curtos e ritmo acima de 1% por semana', () => {
    expect(checkGoal(80, 76, 3, null, false).ok).toBe(false);
    expect(checkGoal(80, 70, 8, null, false).ok).toBe(false);
    expect(checkGoal(80, 76, 6, null, false).ok).toBe(true);
  });
  it('recusa meta abaixo de IMC 18,5', () => {
    expect(checkGoal(60, 52, 20, 175, false).ok).toBe(false);
  });
  it('detecta mudança rápida', () => {
    expect(rapidChange([{ date: '2026-10-20', kg: 80 }, { date: '2026-11-03', kg: 76 }], '2026-11-03')).toBe(true);
    expect(rapidChange([{ date: '2026-10-20', kg: 80 }, { date: '2026-11-03', kg: 79.5 }], '2026-11-03')).toBe(false);
  });
});
