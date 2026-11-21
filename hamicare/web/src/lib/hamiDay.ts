// A vida do Hami no Início, sem a pessoa precisar fazer nada:
// 1) Situação do dia: cada dia novo ele acorda com alguma coisa (muito frio, muito calor, gripado, encharcado
//    de chuva, entediado, sujinho de terra ou com medo do trovão) e pede algumas tarefas para melhorar.
//    É sempre a mesma o dia todo (sorteio fixo pelo dia) e nunca repete a de ontem.
// 2) Atividade: cada vez que a pessoa abre o app, ele está fazendo uma coisa diferente (lendo, brincando
//    de bolinha, ouvindo música, fazendo bolhas, tirando uma soneca…), sem repetir a da vez anterior.
import type { Outfit, PetMood } from '../types';

export type Condition = 'frio' | 'calor' | 'gripado' | 'chuva' | 'tedio' | 'terra' | 'medo';

export interface ConditionInfo {
  /** Nome curto (para o selinho). */
  label: string;
  /** Pedido do Hami ({n} = quantas tarefas). */
  ask: string;
  /** O que ele diz quando melhora. */
  fixed: string;
  /** Roupinha que ele veste enquanto está assim (por cima da escolhida). */
  wear?: Partial<Outfit>;
}

export const CONDITIONS: Record<Condition, ConditionInfo> = {
  frio: { label: 'Muito frio', ask: 'Brrr! Acordei congelando… Faz {n} tarefas pra me esquentar?', fixed: 'Ufa, agora estou quentinho! Obrigado por cuidar de mim.', wear: { chapeu: 'gorro', acessorio: 'cachecol-azul' } },
  calor: { label: 'Muito calor', ask: 'Que calor! Estou derretendo… Faz {n} tarefas pra me refrescar?', fixed: 'Ahh, que fresquinho! Bem melhor agora.' },
  gripado: { label: 'Gripadinho', ask: 'Atchim! Acordei gripadinho… Faz {n} tarefas pra eu melhorar?', fixed: 'Sarei! Obrigado pelo carinho.', wear: { acessorio: 'cachecol-amarelo' } },
  chuva: { label: 'Encharcado', ask: 'Peguei uma chuva no caminho e fiquei encharcado! Faz {n} tarefas pra me secar?', fixed: 'Sequinho e fofinho de novo!' },
  tedio: { label: 'Entediado', ask: 'Que tédio… Faz {n} tarefas pra gente se animar?', fixed: 'Agora sim, que dia divertido!' },
  terra: { label: 'Sujinho', ask: 'Rolei na terra brincando e fiquei todo sujinho! Faz {n} tarefas pra eu ficar limpinho?', fixed: 'Limpinho e cheiroso!' },
  medo: { label: 'Com medinho', ask: 'Teve trovão de noite e fiquei com medinho… Faz {n} tarefas pra eu me sentir seguro?', fixed: 'Com você aqui eu fico tranquilo.' },
};
export const CONDITION_ORDER: Condition[] = ['frio', 'calor', 'gripado', 'chuva', 'tedio', 'terra', 'medo'];

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

/** A situação do Hami no dia (nunca a mesma de ontem). */
export function conditionOf(seed: number, day: string): Condition {
  const c = rawCondition(seed, day);
  if (c !== rawCondition(seed, prevDay(day))) return c;
  return CONDITION_ORDER[(CONDITION_ORDER.indexOf(c) + 1) % CONDITION_ORDER.length];
}

/** Quantas tarefas ele pede (2, ou menos se a pessoa tiver menos tarefas no dia). */
export const conditionNeed = (tasksToday: number) => Math.max(1, Math.min(2, tasksToday));

export const askText = (c: Condition, n: number) => CONDITIONS[c].ask.replace('{n}', String(n));

// ---------- Atividades ----------

export type Activity = 'lendo' | 'bolinha' | 'musica' | 'bolhas' | 'soneca' | 'meditando' | 'desenhando' | 'exercicio';
/** O que ele segura enquanto faz a atividade (desenhado no próprio Hami). */
export type HamiProp = 'livro' | 'fones' | 'desenho' | 'halteres' | 'varinha';

export interface ActivityInfo {
  mood: PetMood;
  prop?: HamiProp;
  lines: string[];
}

export const ACTIVITIES: Record<Activity, ActivityInfo> = {
  lendo: { mood: 'calmo', prop: 'livro', lines: ['Estou lendo uma história de aventura!', 'Esse livro é muito bom. Quer que eu conte o final?', 'Shh… chegou a parte mais legal do livro!'] },
  bolinha: { mood: 'animado', lines: ['Olha a bolinha! Brinca comigo?', 'Peguei! Agora é sua vez!', 'Quica, quica, quica!'] },
  musica: { mood: 'calmo', prop: 'fones', lines: ['Essa música é a minha favorita!', 'Dança comigo um pouquinho?', 'Tum, tum, tum… que ritmo bom!'] },
  bolhas: { mood: 'animado', prop: 'varinha', lines: ['Olha quantas bolhinhas!', 'Consegue estourar uma?', 'Fiz uma bolha gigante!'] },
  soneca: { mood: 'dormindo', lines: ['Zzz… (uma sonequinha rapidinha)', 'Zzz… sonhando com sementinhas…'] },
  meditando: { mood: 'calmo', lines: ['Respira comigo… inspira… solta…', 'Estou meditando. Que paz!'] },
  desenhando: { mood: 'feliz', prop: 'desenho', lines: ['Fiz um desenho de você!', 'Olha meu desenho! Ficou bonito?'] },
  exercicio: { mood: 'animado', prop: 'halteres', lines: ['Um, dois, um, dois! Me exercitando!', 'Ficando fortinho!'] },
};
export const ACTIVITY_ORDER: Activity[] = ['lendo', 'bolinha', 'musica', 'bolhas', 'soneca', 'meditando', 'desenhando', 'exercicio'];

/**
 * Sorteia o que ele está fazendo agora, sem repetir a anterior. De noite a soneca é mais provável;
 * de dia ela é rara (para ele não parecer que só dorme).
 */
export function pickActivity(last: Activity | null, hour: number, rnd: number): Activity {
  const night = hour >= 21 || hour < 7;
  const weights: number[] = ACTIVITY_ORDER.map((a) => (a === last ? 0 : a === 'soneca' ? (night ? 4 : 0.4) : 1));
  const total = weights.reduce((x, y) => x + y, 0);
  let r = rnd * total;
  for (let i = 0; i < ACTIVITY_ORDER.length; i++) {
    r -= weights[i];
    if (r < 0) return ACTIVITY_ORDER[i];
  }
  return ACTIVITY_ORDER.find((a) => a !== last) ?? 'lendo';
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
