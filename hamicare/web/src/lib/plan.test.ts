import { describe, expect, it } from 'vitest';
import { PLAN_MIN, replaceState, getState, starterPlan, fresh } from './store';
import { libById } from '../data/tasks';
import type { GoalId } from '../types';

const ans = (goal: GoalId, minutes = 15) => ({ goal, focus: [], minutes, likes: [], ageGroup: '18mais' as const });

describe('plano de missões', () => {
  it('monta de 7 a 8 hábitos para cada missão, sem repetir e sem comida', () => {
    for (const goal of ['emagrecer', 'ganhar', 'manter', 'habitos', 'condicionamento', 'ativo', 'cuidar'] as GoalId[]) {
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
});
