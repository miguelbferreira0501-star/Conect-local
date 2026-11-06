// Pets companheiros: cada arena aberta traz um ovo misterioso. Ele choca depois de alguns dias de cuidado
// (fez pelo menos uma missão ou cuidou do Hami), contados a partir do dia em que o ovo chegou.
import { caredDay } from '../logic/growth';
import type { CompanionState, DayLog } from '../types';
import type { SoundId } from '../lib/sound';

export type CompanionKind = 'passarinho' | 'joaninha' | 'gatinho' | 'ourico' | 'tartaruga' | 'pinguim' | 'cachorro' | 'polvo' | 'ovelha' | 'dragao' | 'robo' | 'unicornio';

export interface Companion {
  id: string;
  /** Arena que traz o ovo. */
  arena: number;
  kind: CompanionKind;
  name: string;
  species: string;
  c1: string;
  c2: string;
  /** Cores do ovo. */
  egg: [string, string];
  about: string;
}

export const COMPANIONS: Companion[] = [
  { id: 'pet-piu', arena: 1, kind: 'passarinho', name: 'Piu', species: 'Passarinho', c1: '#8FC8F5', c2: '#FFB347', egg: ['#E6F3FF', '#8FC8F5'], about: 'Acorda cantando e adora uma janelinha com sol.' },
  { id: 'pet-pintinha', arena: 2, kind: 'joaninha', name: 'Pintinha', species: 'Joaninha', c1: '#F0525F', c2: '#2B2224', egg: ['#FFE3E6', '#F0525F'], about: 'Conta as bolinhas das costas para se acalmar.' },
  { id: 'pet-bolinho', arena: 3, kind: 'gatinho', name: 'Bolinho', species: 'Gatinho', c1: '#FFB066', c2: '#FFF1DE', egg: ['#FFF1DE', '#FFB066'], about: 'Ronrona alto quando você termina uma missão.' },
  { id: 'pet-pipoca', arena: 4, kind: 'ourico', name: 'Pipoca', species: 'Ouriço', c1: '#B07A52', c2: '#F2D2B0', egg: ['#F2E2CC', '#B07A52'], about: 'Tímido, mas vira uma bolinha de carinho.' },
  { id: 'pet-coco', arena: 5, kind: 'tartaruga', name: 'Coco', species: 'Tartaruguinha', c1: '#7CC39A', c2: '#C98A5B', egg: ['#E3F6EA', '#7CC39A'], about: 'Devagarinho também chega. Esse é o lema dele.' },
  { id: 'pet-gelinho', arena: 6, kind: 'pinguim', name: 'Gelinho', species: 'Pinguim', c1: '#3A3F5C', c2: '#FFFFFF', egg: ['#EEF4FF', '#7F9BD6'], about: 'Escorrega de barriga quando está feliz.' },
  { id: 'pet-biscoito', arena: 7, kind: 'cachorro', name: 'Biscoito', species: 'Cachorrinho', c1: '#E8C08E', c2: '#A8703F', egg: ['#FFF4E3', '#E8C08E'], about: 'Abana o rabo para cada copo de água que você bebe.' },
  { id: 'pet-bolha', arena: 8, kind: 'polvo', name: 'Bolha', species: 'Polvinho', c1: '#FF9FC2', c2: '#FFE3EC', egg: ['#FFE3EC', '#B399F0'], about: 'Dá oito abraços de uma vez.' },
  { id: 'pet-algodao', arena: 9, kind: 'ovelha', name: 'Algodão', species: 'Ovelhinha de nuvem', c1: '#FFFFFF', c2: '#B399F0', egg: ['#F4EEFF', '#D7C2FF'], about: 'Ajuda a contar ovelhinhas na hora de dormir.' },
  { id: 'pet-faisca', arena: 10, kind: 'dragao', name: 'Faísca', species: 'Dragãozinho', c1: '#7FD8BE', c2: '#FFD34D', egg: ['#E3FAF2', '#7FD8BE'], about: 'Solta faíscas de alegria (que não queimam).' },
  { id: 'pet-bip', arena: 11, kind: 'robo', name: 'Bip', species: 'Robozinho', c1: '#C9D3E6', c2: '#7FB8F0', egg: ['#E9EEF8', '#A57CF0'], about: 'Faz bip-bip quando lembra você de descansar.' },
  { id: 'pet-estrela', arena: 12, kind: 'unicornio', name: 'Estrela', species: 'Unicórnio alado', c1: '#FFFFFF', c2: '#FF9FC2', egg: ['#FFF6D6', '#FFD34D'], about: 'Deixa um rastro de brilho por onde passa.' },
];

/** Barulhinho de cada pet quando você toca nele. */
export const PET_VOICE: Record<CompanionKind, SoundId> = {
  passarinho: 'iii',
  joaninha: 'brilho',
  gatinho: 'ronrom',
  ourico: 'pulo',
  tartaruga: 'bolha',
  pinguim: 'quica',
  cachorro: 'coracao',
  polvo: 'bolha',
  ovelha: 'bocejo',
  dragao: 'magia',
  robo: 'ligar',
  unicornio: 'brilho',
};

export const companionById = (id: string | null | undefined) => COMPANIONS.find((c) => c.id === id);
export const companionOfArena = (n: number) => COMPANIONS.find((c) => c.arena === n);

/** Dias de cuidado para chocar um ovo. */
export const HATCH_DAYS = 3;

/** Quantos dias de cuidado o ovo já recebeu (do dia em que chegou em diante). */
export function eggWarmth(days: Record<string, DayLog>, since: string): number {
  let n = 0;
  for (const [date, d] of Object.entries(days)) if (date >= since && caredDay(d)) n++;
  return Math.min(HATCH_DAYS, n);
}

export const emptyCompanions = (): CompanionState => ({ got: {}, active: null });

/** Ovos que chegam com as arenas abertas (o que já chegou continua como está). */
export function withEggs(c: CompanionState | undefined, arenaNow: number, today: string): CompanionState {
  const cur = c ?? emptyCompanions();
  let got = cur.got;
  for (const pet of COMPANIONS) {
    if (pet.arena <= arenaNow && !got[pet.id]) got = { ...got, [pet.id]: { at: today } };
  }
  return got === cur.got && c ? c : { ...cur, got };
}

export type CompanionStatus = { pet: Companion; state: 'chocado' | 'ovo' | 'pronto' | 'bloqueado'; warmth: number };

export function companionStatus(c: CompanionState | undefined, days: Record<string, DayLog>): CompanionStatus[] {
  return COMPANIONS.map((pet) => {
    const g = c?.got[pet.id];
    if (!g) return { pet, state: 'bloqueado', warmth: 0 };
    if (g.hatched) return { pet, state: 'chocado', warmth: HATCH_DAYS };
    const warmth = eggWarmth(days, g.at);
    return { pet, state: warmth >= HATCH_DAYS ? 'pronto' : 'ovo', warmth };
  });
}
