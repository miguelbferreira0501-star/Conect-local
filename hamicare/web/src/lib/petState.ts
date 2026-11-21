// Estados visuais do Hami escolhidos pelo contexto (nunca ao acaso). O desenho continua 2D em SVG:
// é o que mantém o mesmo Hami em todas as poses, aceita as 280+ roupas encaixadas e roda leve no celular.
import type { PetMood, State } from '../types';

export type PetState = 'dormindo' | 'sonolento' | 'com-fome' | 'sujinho' | 'carente' | 'dia-dificil' | 'comemorando' | 'feliz' | 'tranquilo';

export interface PetContext {
  /** Acabou de concluir uma tarefa ou receber carinho. */
  celebrating?: boolean;
  /** Dia difícil ligado (bateria 1). */
  hardDay?: boolean;
  /** Tarefas do dia: feitas e total. */
  done?: number;
  total?: number;
  /** Hora local (0–23). */
  hour?: number;
}

/** Decide o estado pela ordem do que importa mais agora. */
export function petStateOf(s: State, c: PetContext = {}): PetState {
  const st = s.pet.stats;
  if (s.pet.sleeping) return 'dormindo';
  if (c.celebrating) return 'comemorando';
  if (st.energia < 20) return 'sonolento';
  if (st.saciedade < 25) return 'com-fome';
  if (st.limpeza < 25) return 'sujinho';
  if (c.hardDay && !c.done) return 'dia-dificil';
  if (st.felicidade < 35) return 'carente';
  if ((c.hour ?? 12) >= 22 && c.total && c.done === c.total) return 'sonolento';
  if (c.total && c.done === c.total) return 'feliz';
  return c.hardDay ? 'tranquilo' : 'feliz';
}

export const MOOD_OF: Record<PetState, PetMood> = {
  dormindo: 'dormindo',
  sonolento: 'sono',
  'com-fome': 'boca',
  sujinho: 'surpreso',
  carente: 'calmo',
  'dia-dificil': 'calmo',
  comemorando: 'animado',
  feliz: 'feliz',
  tranquilo: 'calmo',
};

export const petMoodOf = (s: State, c?: PetContext): PetMood => MOOD_OF[petStateOf(s, c)];
