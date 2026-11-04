// Áreas do HamiCare: o que a pessoa quer cuidar agora. Dá para trocar a qualquer momento.
// - perder / ganhar / manter: o Hami muda de peso junto (só para maiores de 18).
// - habitos: só hábitos saudáveis (cama, dentes, caminhada…), sem falar de peso nem de calorias.
// - calma: para quem sente ansiedade: respirar, desacelerar, dormir melhor e um SOS para as crises.
import type { AgeGroup, GoalId } from '../types';
import { isMinor } from './evolution';

export type Area = 'perder' | 'ganhar' | 'manter' | 'habitos' | 'calma';

export const AREA_GOAL: Record<Area, GoalId> = { perder: 'emagrecer', ganhar: 'ganhar', manter: 'manter', habitos: 'habitos', calma: 'calma' };

export const AREAS: Record<Area, { label: string; short: string; emoji: string; desc: string }> = {
  perder: { label: 'Perder peso', short: 'Perder peso', emoji: '🔥', desc: 'Eu emagreço junto com você, a cada hábito saudável.' },
  ganhar: { label: 'Ganhar peso', short: 'Ganhar peso', emoji: '💪', desc: 'Eu cresço junto com você: cardápio caprichado e treino de força.' },
  manter: { label: 'Manter o peso', short: 'Manter o peso', emoji: '⚖️', desc: 'Equilíbrio depois de chegar na meta.' },
  habitos: { label: 'Só hábitos saudáveis', short: 'Hábitos saudáveis', emoji: '🌱', desc: 'Arrumar a cama, escovar os dentes, caminhar… sem falar de peso.' },
  calma: { label: 'Calma para a ansiedade', short: 'Calma', emoji: '🍃', desc: 'Respirar, desacelerar, dormir melhor e um SOS para as crises.' },
};

/** A área de cada objetivo (os objetivos antigos viram "hábitos"). Menores de 18 nunca ficam numa área de peso. */
export function areaOf(goal: GoalId, minor: boolean): Area {
  if (goal === 'calma') return 'calma';
  if (minor) return 'habitos';
  if (goal === 'emagrecer') return 'perder';
  if (goal === 'ganhar') return 'ganhar';
  if (goal === 'manter') return 'manter';
  return 'habitos';
}

export const isWeightArea = (a: Area) => a === 'perder' || a === 'ganhar' || a === 'manter';

/** Áreas que a pessoa pode escolher. No começo não aparece "manter" (ele faz sentido depois da meta). */
export function areasFor(age: AgeGroup, where: 'comeco' | 'app'): Area[] {
  if (isMinor(age)) return ['habitos', 'calma'];
  return where === 'comeco' ? ['perder', 'ganhar', 'habitos', 'calma'] : ['perder', 'ganhar', 'manter', 'habitos', 'calma'];
}

/** Missões de quem escolhe só hábitos ou calma (8 por dia). */
export const AREA_PLAN: Record<'habitos' | 'calma', string[]> = {
  habitos: ['cama-arrumar', 'dentes', 'caminhada', 'agua', 'banho', 'sono', 'pausa', 'alongar'],
  calma: ['respirar', 'aterrar', 'meditar', 'caminhada', 'preocupacao', 'pausa', 'sono', 'sentir'],
};

/** Missões que contam como "prática de calma" no cartão do Início. */
export const CALM_TASKS = ['respirar', 'aterrar', 'meditar', 'preocupacao', 'musica', 'natureza', 'diario', 'sentir', 'gratidao'];
