import { describe, expect, it } from 'vitest';
import { AREA_GOAL, AREA_PLAN, AREAS, areaOf, areasFor, CALM_TASKS, isWeightArea } from './areas';
import { libById } from '../data/tasks';
import type { GoalId } from '../types';

describe('áreas', () => {
  it('cada objetivo cai numa área; os antigos viram hábitos', () => {
    expect(areaOf('emagrecer', false)).toBe('perder');
    expect(areaOf('ganhar', false)).toBe('ganhar');
    expect(areaOf('manter', false)).toBe('manter');
    expect(areaOf('habitos', false)).toBe('habitos');
    expect(areaOf('calma', false)).toBe('calma');
    for (const g of ['ativo', 'cuidar', 'condicionamento'] as GoalId[]) expect(areaOf(g, false)).toBe('habitos');
  });

  it('menores de 18 nunca ficam numa área de peso', () => {
    for (const g of Object.values(AREA_GOAL)) expect(isWeightArea(areaOf(g, true))).toBe(false);
    expect(areasFor('13a17', 'app')).toEqual(['habitos', 'calma']);
    expect(areasFor('ate12', 'comeco')).toEqual(['habitos', 'calma']);
  });

  it('no começo aparecem perder, ganhar, hábitos e calma; no app também manter', () => {
    expect(areasFor('18mais', 'comeco')).toEqual(['perder', 'ganhar', 'habitos', 'calma']);
    expect(areasFor('18mais', 'app')).toContain('manter');
    for (const a of areasFor('18mais', 'app')) expect(AREAS[a].label.length).toBeGreaterThan(3);
  });

  it('planos de hábitos e calma têm 8 missões da biblioteca, sem comida', () => {
    for (const plan of Object.values(AREA_PLAN)) {
      expect(plan).toHaveLength(8);
      expect(new Set(plan).size).toBe(8);
      for (const id of plan) expect(libById(id), id).toBeTruthy();
    }
    expect(AREA_PLAN.habitos).toEqual(expect.arrayContaining(['cama-arrumar', 'dentes', 'caminhada']));
    expect(AREA_PLAN.calma).toEqual(expect.arrayContaining(['respirar', 'aterrar', 'sono']));
    for (const id of CALM_TASKS) expect(libById(id), id).toBeTruthy();
  });
});
