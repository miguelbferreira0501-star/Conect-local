// A vida do Lumbi no Início, sem a pessoa precisar fazer nada:
// 1) Situação do dia: cada dia novo ele acorda com alguma coisa (muito frio, muito calor, gripado, encharcado
//    de chuva, entediado, sujinho de terra, com medo do trovão ou chorando de saudade) e pede algumas tarefas
//    para melhorar. Enquanto espera, cai num chorinho fofo de tempos em tempos (para dar dó).
//    É sempre a mesma o dia todo (sorteio fixo pelo dia) e nunca repete a de ontem.
// 2) Atividade: cada vez que a pessoa abre o app, ele está fazendo uma coisa diferente (lendo, brincando
//    de bolinha, ouvindo música, fazendo bolhas, tirando uma soneca…), sem repetir a da vez anterior.
import type { Outfit, PetMood } from '../types';

export type Condition = 'frio' | 'calor' | 'gripado' | 'chuva' | 'tedio' | 'terra' | 'medo' | 'saudade';

export interface ConditionInfo {
  /** Nome curto (para o selinho). */
  label: string;
  /** Pedido do Lumbi ({n} = quantas tarefas). */
  ask: string;
  /** O que ele diz quando melhora. */
  fixed: string;
  /** Roupinha que ele veste enquanto está assim (por cima da escolhida). */
  wear?: Partial<Outfit>;
  /** Fica de olhinhos marejados (chorão fofinho) enquanto espera ajuda. */
  teary?: boolean;
}

export const CONDITIONS: Record<Condition, ConditionInfo> = {
  frio: { label: 'Muito frio', ask: 'Brrr! Acordei congelando… Faz {n} tarefas pra me esquentar?', fixed: 'Ufa, agora estou quentinho! Obrigado por cuidar de mim.', wear: { chapeu: 'gorro', acessorio: 'cachecol-azul' } },
  calor: { label: 'Muito calor', ask: 'Que calor! Estou derretendo… Faz {n} tarefas pra me refrescar?', fixed: 'Ahh, que fresquinho! Bem melhor agora.' },
  gripado: { label: 'Gripadinho', ask: 'Atchim! Acordei gripadinho… Faz {n} tarefas pra eu melhorar?', fixed: 'Sarei! Obrigado pelo carinho.', wear: { acessorio: 'cachecol-amarelo' } },
  chuva: { label: 'Encharcado', ask: 'Peguei uma chuva no caminho e fiquei encharcado! Faz {n} tarefas pra me secar?', fixed: 'Sequinho e fofinho de novo!', teary: true },
  tedio: { label: 'Entediado', ask: 'Que tédio… Faz {n} tarefas pra gente se animar?', fixed: 'Agora sim, que dia divertido!' },
  terra: { label: 'Sujinho', ask: 'Rolei na terra brincando e fiquei todo sujinho! Faz {n} tarefas pra eu ficar limpinho?', fixed: 'Limpinho e cheiroso!' },
  medo: { label: 'Com medinho', ask: 'Teve trovão de noite e fiquei com medinho… Faz {n} tarefas pra eu me sentir seguro?', fixed: 'Com você aqui eu fico tranquilo.', teary: true },
  saudade: { label: 'Com saudade', ask: 'Acordei chorando de saudade de você… Faz {n} tarefas pra me dar um abraço?', fixed: 'Que abraço gostoso! Agora estou feliz de novo.', teary: true },
};
export const CONDITION_ORDER: Condition[] = ['frio', 'calor', 'gripado', 'chuva', 'tedio', 'terra', 'medo', 'saudade'];

/** Número estável a partir de um texto (o mesmo dia dá sempre o mesmo resultado). */
function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function prevDay(day: string) {
  const [y, m, d] = day.split('-').map(Number);
  const t = new Date(y, m - 1, d - 1);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

function rawCondition(seed: number, day: string): Condition {
  return CONDITION_ORDER[hash(`${seed}:${day}`) % CONDITION_ORDER.length];
}

/** A situação do Lumbi no dia (nunca a mesma de ontem). */
export function conditionOf(seed: number, day: string): Condition {
  const c = rawCondition(seed, day);
  if (c !== rawCondition(seed, prevDay(day))) return c;
  return CONDITION_ORDER[(CONDITION_ORDER.indexOf(c) + 1) % CONDITION_ORDER.length];
}

/** Quantas tarefas ele pede (2, ou menos se a pessoa tiver menos tarefas no dia). */
export const conditionNeed = (tasksToday: number) => Math.max(1, Math.min(2, tasksToday));

/** De quanto em quanto tempo ele chora enquanto espera ajuda (mais vezes de noite, se ninguém ajudou). */
export const cryEvery = (hour: number) => (hour >= 18 ? 7000 : 11000);

export const askText = (c: Condition, n: number) => CONDITIONS[c].ask.replace('{n}', String(n));

// ---------- Atividades ----------

export type Activity = 'parado' | 'sentado' | 'soneca' | 'cama';
/** O que ele segura enquanto faz a atividade (desenhado no próprio mascote). */
export type HamiProp = 'livro' | 'fones' | 'desenho' | 'halteres' | 'varinha' | 'coracao' | 'estrela' | 'travesseiro';

export interface ActivityInfo {
  mood: PetMood;
  prop?: HamiProp;
  lines: string[];
}

/** Ao abrir o app ele está tranquilo: em pé, sentadinho ou tirando uma soneca (nada de agitação). */
export const ACTIVITIES: Record<Activity, ActivityInfo> = {
  parado: { mood: 'feliz', lines: ['Oi! Que bom te ver!', 'Tô aqui te esperando!', 'Vamos fazer as tarefas juntos?'] },
  sentado: { mood: 'feliz', lines: ['Sentadinho aqui, curtindo o dia.', 'Sentei pra te esperar!', 'Tô de boa, só sentadinho.'] },
  // soneca no chão (enroladinho) ou na caminha
  soneca: { mood: 'dormindo', lines: ['Zzz… (uma sonequinha rapidinha)', 'Zzz… sonhando com petiscos…'] },
  cama: { mood: 'dormindo', lines: ['Zzz… que caminha gostosa…', 'Zzz… (abraçadinho no travesseiro)'] },
};
export const ACTIVITY_ORDER: Activity[] = ['parado', 'sentado', 'soneca', 'cama'];

/**
 * Sorteia o que ele está fazendo agora, sem repetir a anterior. De noite a soneca é mais provável;
 * de dia ela é rara (para ele não parecer que só dorme).
 */
export function pickActivity(last: Activity | null, hour: number, rnd: number): Activity {
  const night = hour >= 21 || hour < 7;
  const weights: number[] = ACTIVITY_ORDER.map((a) => (a === last ? 0 : a === 'soneca' || a === 'cama' ? (night ? 3 : 0.1) : 1));
  const total = weights.reduce((x, y) => x + y, 0);
  let r = rnd * total;
  for (let i = 0; i < ACTIVITY_ORDER.length; i++) {
    r -= weights[i];
    if (r < 0) return ACTIVITY_ORDER[i];
  }
  return ACTIVITY_ORDER.find((a) => a !== last) ?? 'parado';
}

const KEY = 'hamicare:atividade';
/** A atividade desta visita (lembra a anterior neste aparelho para não repetir). */
export function activityForVisit(hour: number): Activity {
  let last: Activity | null = null;
  try {
    const v = localStorage.getItem(KEY) as Activity | null;
    if (v && v in ACTIVITIES) last = v;
  } catch {
    /* sem armazenamento */
  }
  const a = pickActivity(last, hour, Math.random());
  try {
    localStorage.setItem(KEY, a);
  } catch {
    /* sem armazenamento */
  }
  return a;
}
