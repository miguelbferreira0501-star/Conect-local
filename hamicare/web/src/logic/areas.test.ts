import { describe, expect, it } from 'vitest';
import { AREA_GOAL, AREA_PLAN, AREAS, areaOf, areaOfLegacy as legacyOf, areasFor, areasForLegacy, CALM_TASKS, isWeightArea } from './areas';
import { libById } from '../data/tasks';
import type { GoalId } from '../types';

describe('áreas', () => {
  it('por enquanto só existe a área de hábitos saudáveis', () => {
    for (const g of ['emagrecer', 'ganhar', 'manter', 'habitos', 'calma'] as GoalId[]) expect(areaOf(g, false)).toBe('habitos');
    expect(areasFor('18mais', 'comeco')).toEqual(['habitos']);
    expect(areasFor('ate12', 'app')).toEqual(['habitos']);
  });

  it('(antigo) cada objetivo cai numa área; os antigos viram hábitos', () => {
    expect(legacyOf('emagrecer', false)).toBe('perder');
    expect(legacyOf('ganhar', false)).toBe('ganhar');
    expect(legacyOf('manter', false)).toBe('manter');
    expect(legacyOf('habitos', false)).toBe('habitos');
    expect(legacyOf('calma', false)).toBe('calma');
    for (const g of ['ativo', 'cuidar', 'condicionamento'] as GoalId[]) expect(legacyOf(g, false)).toBe('habitos');
  });

  it('menores de 18 nunca ficam numa área de peso', () => {
    for (const g of Object.values(AREA_GOAL)) expect(isWeightArea(legacyOf(g, true))).toBe(false);
    expect(areasForLegacy('13a17', 'app')).toEqual(['habitos', 'calma']);
    expect(areasForLegacy('ate12', 'comeco')).toEqual(['habitos', 'calma']);
  });

  it('no começo aparecem perder, ganhar, hábitos e calma; no app também manter', () => {
    expect(areasForLegacy('18mais', 'comeco')).toEqual(['perder', 'ganhar', 'habitos', 'calma']);
    expect(areasForLegacy('18mais', 'app')).toContain('manter');
    for (const a of areasForLegacy('18mais', 'app')) expect(AREAS[a].label.length).toBeGreaterThan(3);
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
