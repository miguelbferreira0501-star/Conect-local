// Ganhos de XP e sementes: quanto cada coisa vale e os limites do dia.
// Cada ganho tem uma referência única (`ref`): a mesma coisa nunca paga duas vezes,
// e desmarcar devolve exatamente o que foi pago.
import type { GameConfig, TaskCat } from './config';
import { levelOf, levelUpCoins, arenaOf } from './levels';

export type Source =
  | { kind: 'tarefa'; id: string; energy: 1 | 2 | 3; cat: TaskCat; date: string }
  | { kind: 'cuidado'; care: string; date: string }
  | { kind: 'diario' | 'pote' | 'humor'; date: string }
  | { kind: 'bemestar'; tool: string; date: string }
  | { kind: 'desafio'; period: 'dia' | 'semana' | 'mes'; id: string; key: string }
  | { kind: 'conquista'; id: string; coins: number }
  | { kind: 'aventura'; place: string; xp: number; coins: number; date: string; n: number }
  | { kind: 'presente'; coins: number; date: string }
  | { kind: 'temporada'; month: string; xp: number; coins: number }
  | { kind: 'evento'; id: string; coins: number }
  | { kind: 'nivel'; level: number }
  | { kind: 'arena'; arena: number }
  | { kind: 'colecao'; id: string }
  | { kind: 'temporada-degrau'; month: string; tier: number }
  | { kind: 'turma'; id: string; date: string }
  | { kind: 'rapida'; id: QuickId; slot: number; coins: number; date: string }
  | { kind: 'amigo'; n: number };

/** Missões rápidas: renovam a cada 8 horas (3 turnos por dia). */
export type QuickId = 'emocao' | 'reflexao' | 'meta';
export const QUICK_IDS: QuickId[] = ['emocao', 'reflexao', 'meta'];
/** Reflexão mais longa vale mais sementes (até 12). */
export const reflectionCoins = (chars: number) => (chars >= 400 ? 12 : chars >= 150 ? 8 : 4);
/** Prêmio por amigo novo: cada um vale mais que o anterior (até o 5º). */
export const FRIEND_LADDER = [40, 60, 80, 100, 150];
/** Martelinho que conserta a ofensiva (sementes). */
export const HAMMER_PRICE = 80;

export interface Grant {
  ref: string;
  label: string;
  xp: number;
  coins: number;
  /** Conta no teto da rotina do dia? */
  routine: boolean;
  date?: string;
  /** Teto de XP da categoria de missão (ou de aventuras). */
  bucket?: string;
}

const clampEnergy = (e: number): 1 | 2 | 3 => (e >= 3 ? 3 : e <= 1 ? 1 : 2);

/** Quanto vale cada fonte, antes dos limites do dia. */
export function baseGrant(src: Source, cfg: GameConfig): Grant {
  switch (src.kind) {
    case 'tarefa': {
      const e = clampEnergy(src.energy);
      return {
        ref: `tarefa:${src.date}:${src.id}`,
        label: 'Missão concluída',
        xp: cfg.task.xpById[src.id] ?? cfg.task.xp[e - 1],
        coins: cfg.task.coins[e - 1],
        routine: true,
        date: src.date,
        bucket: `cat:${src.cat}`,
      };
    }
    case 'cuidado':
      return { ref: `cuidado:${src.date}:${src.care}`, label: 'Cuidou do Hami', ...cfg.small.cuidado, routine: true, date: src.date };
    case 'diario':
      return { ref: `diario:${src.date}`, label: 'Escreveu no diário', ...cfg.small.diario, routine: true, date: src.date };
    case 'pote':
      return { ref: `pote:${src.date}`, label: 'Guardou algo bom no pote', ...cfg.small.pote, routine: true, date: src.date };
    case 'humor':
      return { ref: `humor:${src.date}`, label: 'Registrou o humor', ...cfg.small.humor, routine: true, date: src.date };
    case 'bemestar':
      return { ref: `bemestar:${src.date}:${src.tool}`, label: 'Momento de bem-estar', ...cfg.small.bemestar, routine: true, date: src.date };
    case 'desafio':
      return { ref: `desafio:${src.id}:${src.key}`, label: 'Desafio concluído', ...cfg.quest[src.period], routine: false };
    case 'conquista':
      return { ref: `conquista:${src.id}`, label: 'Conquista', xp: cfg.achievementXp, coins: Math.max(0, Math.min(500, src.coins)), routine: false };
    case 'aventura':
      return { ref: `aventura:${src.date}:${src.place}:${src.n}`, label: 'Aventura', xp: Math.max(0, Math.min(40, src.xp)), coins: Math.max(0, Math.min(40, src.coins)), routine: false, date: src.date, bucket: 'aventura' };
    case 'presente':
      return { ref: `presente:${src.date}`, label: 'Presente do dia', xp: 0, coins: Math.max(0, Math.min(20, src.coins)), routine: false, date: src.date };
    case 'temporada':
      return { ref: `temporada:${src.month}`, label: 'Prêmio da temporada', xp: Math.max(0, Math.min(300, src.xp)), coins: Math.max(0, Math.min(300, src.coins)), routine: false };
    case 'evento':
      return { ref: `evento:${src.id}`, label: 'Evento', xp: 0, coins: Math.max(0, Math.min(500, src.coins)), routine: false };
    case 'nivel':
      return { ref: `nivel:${src.level}`, label: `Chegou ao nível ${src.level}`, xp: 0, coins: levelUpCoins(src.level, cfg), routine: false };
    case 'arena': {
      const a = cfg.arenas.find((x) => x.n === src.arena);
      return { ref: `arena:${src.arena}`, label: `Arena ${src.arena} liberada`, xp: 0, coins: a?.reward.coins ?? 0, routine: false };
    }
    case 'turma':
      return { ref: `turma:${src.id}:${src.date}`, label: 'Turma completou o dia', xp: cfg.team.xp, coins: cfg.team.coins, routine: false };
    case 'temporada-degrau': {
      const t = cfg.season.tiers[src.tier];
      return { ref: `temporada:${src.month}:d${src.tier}`, label: `Temporada: degrau ${src.tier + 1}`, xp: t?.xp ?? 0, coins: t?.coins ?? 0, routine: false };
    }
    case 'rapida':
      return {
        ref: `rapida:${src.date}:${Math.max(0, Math.min(2, Math.floor(src.slot)))}:${src.id}`,
        label: src.id === 'reflexao' ? 'Missão rápida: reflexão' : src.id === 'emocao' ? 'Missão rápida: emoção' : 'Missão rápida: meta',
        xp: 4,
        coins: Math.max(2, Math.min(12, Math.round(src.coins))),
        routine: true,
        date: src.date,
      };
    case 'amigo': {
      const n = Math.max(1, Math.min(FRIEND_LADDER.length, Math.floor(src.n)));
      return { ref: `amigo:${n}`, label: `Prêmio do ${n}º amigo`, xp: 0, coins: FRIEND_LADDER[n - 1], routine: false };
    }
    case 'colecao': {
      const c = cfg.collections.find((x) => x.id === src.id);
      return { ref: `colecao:${src.id}`, label: `Coleção completa: ${c?.name ?? src.id}`, xp: c?.reward.xp ?? 0, coins: c?.reward.coins ?? 0, routine: false };
    }
  }
}

/** O que já foi usado num dia (para os limites). */
export interface DayUsage {
  xp: number;
  coins: number;
  tasks: number;
  buckets: Record<string, number>;
}

export const emptyUsage = (): DayUsage => ({ xp: 0, coins: 0, tasks: 0, buckets: {} });

function bucketCap(bucket: string | undefined, cfg: GameConfig): number {
  if (!bucket) return Infinity;
  if (bucket === 'aventura') return cfg.caps.adventureXp;
  if (bucket.startsWith('cat:')) return cfg.caps.category[bucket.slice(4) as TaskCat] ?? Infinity;
  return Infinity;
}

/**
 * Aplica os limites do dia. Devolve o que de fato é pago.
 * Movimento tem teto próprio: fazer mais exercício do que isso não rende mais.
 */
export function capGrant(g: Grant, usage: DayUsage, cfg: GameConfig): { xp: number; coins: number; capped: boolean; counted: boolean } {
  let xp = g.xp;
  let coins = g.coins;
  if (g.ref.startsWith('tarefa:') && usage.tasks >= cfg.caps.tasks) return { xp: 0, coins: 0, capped: true, counted: false };
  const cap = bucketCap(g.bucket, cfg);
  xp = Math.min(xp, Math.max(0, cap - (usage.buckets[g.bucket ?? ''] ?? 0)));
  if (g.routine) {
    xp = Math.min(xp, Math.max(0, cfg.caps.day.xp - usage.xp));
    coins = Math.min(coins, Math.max(0, cfg.caps.day.coins - usage.coins));
  }
  return { xp, coins, capped: xp < g.xp || coins < g.coins, counted: true };
}

export function addUsage(usage: DayUsage, g: Grant, paid: { xp: number; coins: number; counted?: boolean }, sign: 1 | -1 = 1): DayUsage {
  const next: DayUsage = { ...usage, buckets: { ...usage.buckets } };
  if (g.routine) {
    next.xp = Math.max(0, next.xp + sign * paid.xp);
    next.coins = Math.max(0, next.coins + sign * paid.coins);
  }
  if (g.ref.startsWith('tarefa:') && paid.counted !== false) next.tasks = Math.max(0, next.tasks + sign);
  if (g.bucket) next.buckets[g.bucket] = Math.max(0, (next.buckets[g.bucket] ?? 0) + sign * paid.xp);
  return next;
}

/** Linha da carteira: de onde veio ou para onde foi cada semente. */
export interface LedgerEntry {
  at: number;
  ref: string;
  label: string;
  coins: number;
  xp: number;
}

/** Subiu de nível com este XP? Quais níveis e arenas novas (para pagar os prêmios). */
export function levelUps(xpBefore: number, xpAfter: number, cfg: GameConfig): { levels: number[]; arenas: number[] } {
  const a = levelOf(xpBefore, cfg);
  const b = levelOf(xpAfter, cfg);
  const levels: number[] = [];
  const arenas: number[] = [];
  for (let l = a + 1; l <= b; l++) {
    levels.push(l);
    const ar = arenaOf(l, cfg);
    if (ar.level === l) arenas.push(ar.n);
  }
  return { levels, arenas };
}
