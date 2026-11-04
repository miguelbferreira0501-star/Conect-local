import { describe, expect, it } from 'vitest';
import { PLAN_MIN, replaceState, getState, starterPlan, fresh, changeArea, areaNow, weightOn, kcalOf } from './store';
import { libById } from '../data/tasks';
import type { GoalId } from '../types';

const ans = (goal: GoalId, minutes = 15) => ({ goal, focus: [], minutes, likes: [], ageGroup: '18mais' as const });

describe('plano de missões', () => {
  it('monta de 7 a 8 hábitos para cada missão, sem repetir e sem comida', () => {
    for (const goal of ['emagrecer', 'ganhar', 'manter', 'habitos', 'calma', 'condicionamento', 'ativo', 'cuidar'] as GoalId[]) {
      for (const minutes of [5, 15, 60]) {
        const plan = starterPlan(ans(goal, minutes));
        expect(plan.length, `${goal} ${minutes}`).toBeGreaterThanOrEqual(PLAN_MIN);
        expect(new Set(plan).size).toBe(plan.length);
        expect(plan.every((id) => libById(id)), goal).toBe(true);
      }
    }
  });

  it('quem ficou com poucas missões ganha hábitos até ter 7 (uma vez só)', () => {
    const base = fresh();
    const today = base.createdAt;
    const t = (id: string) => ({ id, title: id, emoji: '⭐', cat: 'fitness' as const, freq: { kind: 'diaria' as const }, reward: 3, energy: 1 as const, createdAt: today });
    replaceState({ ...base, onboarded: true, profile: { ...base.profile, goal: 'ganhar' }, tasks: [t('forca'), t('respirar'), t('vitamina')], missionsV: undefined });
    const s = getState();
    expect(s.tasks.find((x) => x.id === 'vitamina')).toBeUndefined();
    expect(s.tasks.length).toBeGreaterThanOrEqual(PLAN_MIN);
    expect(s.tasks.filter((x) => x.id === 'forca')).toHaveLength(1);
    // Depois da migração, apagar missões não traz de volta
    replaceState({ ...s, tasks: s.tasks.slice(0, 2) });
    expect(getState().tasks).toHaveLength(2);
  });

  it('hábitos: cama, dentes e caminhada; calma: respirar e 5-4-3-2-1', () => {
    expect(starterPlan(ans('habitos'))).toEqual(expect.arrayContaining(['cama-arrumar', 'dentes', 'caminhada']));
    expect(starterPlan(ans('calma'))).toEqual(expect.arrayContaining(['respirar', 'aterrar', 'sono']));
  });

  it('trocar de área: hábitos sem peso, depois perder peso, mantendo as missões criadas pela pessoa', () => {
    const base = fresh();
    const today = base.createdAt;
    const mine = { id: 'minha-1', title: 'Estudar 20 min', emoji: '📚', cat: 'emocional' as const, freq: { kind: 'diaria' as const }, reward: 3, energy: 1 as const, createdAt: today };
    replaceState({ ...base, onboarded: true, missionsV: 1, profile: { ...base.profile, goal: 'habitos', ageGroup: '18mais' }, tasks: [mine] });
    expect(areaNow(getState())).toBe('habitos');
    expect(weightOn(getState())).toBe(false);
    expect(kcalOf(getState(), { ...mine, id: 'caminhada', met: 3.5, min: 15 })).toBe(0);

    changeArea('perder', true);
    const s = getState();
    expect(areaNow(s)).toBe('perder');
    expect(s.journey.dir).toBe('perder');
    expect(weightOn(s)).toBe(true);
    expect(s.tasks.some((t) => t.id === 'minha-1')).toBe(true);
    expect(s.tasks.some((t) => t.id === 'passos')).toBe(true);
    expect(kcalOf(s, s.tasks.find((t) => t.id === 'passos')!)).toBeGreaterThan(0);

    changeArea('calma', false);
    expect(areaNow(getState())).toBe('calma');
    expect(getState().tasks.some((t) => t.id === 'passos')).toBe(true);
  });

  it('menor de 18 não entra em área de peso', () => {
    const base = fresh();
    replaceState({ ...base, onboarded: true, missionsV: 1, profile: { ...base.profile, goal: 'habitos', ageGroup: '13a17' } });
    changeArea('perder', true);
    expect(areaNow(getState())).toBe('habitos');
    expect(weightOn(getState())).toBe(false);
  });
});
