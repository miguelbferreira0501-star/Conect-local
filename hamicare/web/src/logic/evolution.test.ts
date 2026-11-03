import { describe, expect, it } from 'vitest';
import {
  BAND, DAY_CAP, JOURNEY_GRAMS, checkJourneyGoal, conditioning, dayKcal, defaultGoalKg, directionOf, fluffOf, journeyGrams, journeyKcal,
  journeyProgress, minDaysLeft, needKcalFor, phaseFor, rapidChange, scaleProgress, taskKcal,
} from './evolution';
import type { DayLog, Journey } from '../types';
import { addDays } from '../lib/util';

const day = (cats: string[]): DayLog => ({ done: Object.fromEntries(cats.map((c, i) => [`t${i}`, c])) as DayLog['done'], care: [] });
const journey = (p: Partial<Journey> = {}): Journey => ({ dir: 'perder', startedAt: '2026-11-01', startGrams: JOURNEY_GRAMS.perder.start, goalGrams: JOURNEY_GRAMS.perder.goal, needKcal: 26950, reachedAt: null, ...p });

describe('calorias de cada missão', () => {
  it('movimento: (MET − 1) × kg × horas', () => {
    // Caminhada de 15 min (MET 3,5) para 70 kg: 2,5 × 70 × 0,25 = 43,75
    expect(taskKcal({ met: 3.5, min: 15 }, 'perder', 70)).toBe(44);
    // A mesma caminhada gasta mais para quem pesa mais
    expect(taskKcal({ met: 3.5, min: 15 }, 'perder', 100)).toBe(63);
  });
  it('emagrecer conta a troca saudável; ganhar conta o lanche nutritivo', () => {
    const agua = { swap: 140 };
    const vitamina = { gain: 350 };
    expect(taskKcal(agua, 'perder', 70)).toBe(140);
    expect(taskKcal(agua, 'ganhar', 70)).toBe(0);
    expect(taskKcal(vitamina, 'ganhar', 70)).toBe(350);
    expect(taskKcal(vitamina, 'perder', 70)).toBe(0);
  });
  it('quem quer ganhar peso não perde nada por se exercitar', () => {
    expect(taskKcal({ met: 7, min: 20 }, 'ganhar', 70)).toBe(0);
  });
  it('atividade criada pela pessoa ganha uma estimativa pela energia', () => {
    expect(taskKcal({ cat: 'fitness', energy: 2 }, 'perder', 70)).toBe(58);
    expect(taskKcal({ cat: 'emocional', energy: 2 }, 'perder', 70)).toBe(0);
  });
  it('o dia tem teto: exagerar não acelera a jornada', () => {
    const d: DayLog = { done: {}, care: [], kcal: { a: 600, b: 600 } };
    expect(dayKcal(d, 'perder')).toBe(DAY_CAP.perder);
    expect(dayKcal({ done: {}, care: [], kcal: { a: 120 } }, 'perder')).toBe(120);
  });
});

describe('jornada do Hami', () => {
  it('menores sempre mantêm o peso', () => {
    expect(directionOf('emagrecer', true)).toBe('manter');
    expect(directionOf('emagrecer', false)).toBe('perder');
    expect(directionOf('ganhar', false)).toBe('ganhar');
    expect(directionOf('habitos', false)).toBe('manter');
  });
  it('meta padrão de 5% e calorias necessárias', () => {
    expect(defaultGoalKg(80, 'perder')).toBe(76);
    expect(defaultGoalKg(60, 'ganhar')).toBe(63);
    expect(needKcalFor(80, 76)).toBe(30800);
  });
  it('o Hami chega à meta dele quando a pessoa chega à dela', () => {
    const j = journey();
    expect(journeyGrams(j, journeyProgress(j, 0))).toBe(165);
    expect(journeyGrams(j, journeyProgress(j, j.needKcal / 2))).toBe(150);
    expect(journeyGrams(j, journeyProgress(j, j.needKcal * 3))).toBe(135);
  });
  it('cada missão tira um pouquinho, proporcional', () => {
    const j = journey();
    // 140 kcal de 26.950 → 0,52% da jornada → 30 g × 0,0052 ≈ 0,2 g
    expect(165 - journeyGrams(j, journeyProgress(j, 140))).toBeCloseTo(0.2, 1);
  });
  it('ganhar peso faz o Hami crescer até a meta', () => {
    const j = journey({ dir: 'ganhar', startGrams: 115, goalGrams: 140, needKcal: 23100 });
    expect(journeyGrams(j, journeyProgress(j, 23100))).toBe(140);
  });
  it('manter: o Hami fica firme', () => {
    const j = journey({ dir: 'manter', startGrams: 135, goalGrams: 135, needKcal: 0 });
    expect(journeyGrams(j, journeyProgress(j, 5000))).toBe(135);
  });
  it('soma só os dias da jornada', () => {
    const days: Record<string, DayLog> = {
      '2026-10-30': { done: {}, care: [], kcal: { a: 300 } },
      '2026-11-01': { done: {}, care: [], kcal: { a: 200 } },
      '2026-11-02': { done: {}, care: [], kcal: { a: 100, b: 50 } },
    };
    expect(journeyKcal(days, '2026-11-01', 'perder')).toBe(350);
    expect(journeyKcal(days, '2026-11-01', 'perder', '2026-11-01')).toBe(200);
  });
  it('pela balança: acompanha a variação real da pessoa', () => {
    expect(scaleProgress('perder', 80, 76, 78)).toBe(0.5);
    expect(scaleProgress('perder', 80, 76, 82)).toBe(0);
    expect(scaleProgress('ganhar', 60, 63, 63)).toBe(1);
  });
  it('dias mínimos no ritmo seguro', () => {
    expect(minDaysLeft(journey({ needKcal: 8000 }), 0)).toBe(10);
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

describe('metas seguras', () => {
  it('menores não têm meta', () => expect(checkJourneyGoal(60, 55, 'perder', null, true).ok).toBe(false));
  it('recusa metas na direção errada ou grandes demais', () => {
    expect(checkJourneyGoal(80, 82, 'perder', null, false).ok).toBe(false);
    expect(checkJourneyGoal(80, 60, 'perder', null, false).ok).toBe(false);
    expect(checkJourneyGoal(80, 72, 'perder', null, false).ok).toBe(true);
    expect(checkJourneyGoal(60, 75, 'ganhar', null, false).ok).toBe(false);
    expect(checkJourneyGoal(60, 65, 'ganhar', null, false).ok).toBe(true);
  });
  it('recusa meta abaixo de IMC 18,5', () => {
    expect(checkJourneyGoal(60, 55, 'perder', 175, false).ok).toBe(false);
  });
  it('detecta mudança rápida', () => {
    expect(rapidChange([{ date: '2026-10-20', kg: 80 }, { date: '2026-11-03', kg: 76 }], '2026-11-03')).toBe(true);
    expect(rapidChange([{ date: '2026-10-20', kg: 80 }, { date: '2026-11-03', kg: 79.5 }], '2026-11-03')).toBe(false);
  });
});
