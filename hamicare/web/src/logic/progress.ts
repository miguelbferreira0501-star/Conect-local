// Níveis, desafios (diários, semanais, mensais) e conquistas. Funções puras.
import type { DayLog, State } from '../types';
import { addDays, dayDiff, hashStr, monthKey, mulberry32, weekStart } from '../lib/util';
import { isActive } from './evolution';
import { bestStreak } from './streak';
import { levelOf as engineLevelOf, levelProgress as engineLevelProgress } from '../shared/game/levels';
import { gameCfg } from '../lib/game';

// ---------- Nível ----------
// A curva fica no motor do jogo (shared/game), com a configuração em uso.

export function levelOf(xp: number): number {
  return engineLevelOf(xp, gameCfg());
}

export function levelProgress(xp: number): { level: number; current: number; needed: number } {
  return engineLevelProgress(xp, gameCfg());
}

/** Prêmio de um desafio (vem da configuração do jogo). */
export const questReward = (q: { period: Period }) => gameCfg().quest[q.period];

// ---------- Contagens de um período ----------

type Days = Record<string, DayLog>;

function eachDay(from: string, to: string, fn: (key: string) => void) {
  for (let k = from; dayDiff(k, to) >= 0; k = addDays(k, 1)) fn(k);
}

export function countIn(days: Days, from: string, to: string, pick: (d: DayLog) => number): number {
  let n = 0;
  eachDay(from, to, (k) => {
    const d = days[k];
    if (d) n += pick(d);
  });
  return n;
}

const doneCount = (d: DayLog) => Object.keys(d.done).length;
const catCount = (cat: string) => (d: DayLog) => Object.values(d.done).filter((c) => c === cat).length;
const hasCat = (cat: string) => (d: DayLog) => (Object.values(d.done).includes(cat as never) ? 1 : 0);
const eventCount = (name: string) => (d: DayLog) => (d.events ?? []).filter((e) => e === name).length;

// ---------- Desafios ----------

export type Period = 'dia' | 'semana' | 'mes';

export interface QuestDef {
  id: string;
  period: Period;
  title: string;
  target: number;
  coins: number;
  xp: number;
  count: (d: DayLog) => number;
}

export const QUESTS: QuestDef[] = [
  { id: 'tarefas3', period: 'dia', title: 'Concluir 3 missões', target: 3, coins: 10, xp: 15, count: doneCount },
  { id: 'mover1', period: 'dia', title: 'Fazer 1 atividade de movimento', target: 1, coins: 8, xp: 10, count: catCount('fitness') },
  { id: 'cuidar2', period: 'dia', title: 'Cuidar do Hami 2 vezes', target: 2, coins: 6, xp: 10, count: (d) => d.care.length },
  { id: 'humor', period: 'dia', title: 'Registrar como você está', target: 1, coins: 5, xp: 8, count: (d) => (d.mood ? 1 : 0) },
  { id: 'pote', period: 'dia', title: 'Guardar algo bom no pote', target: 1, coins: 6, xp: 8, count: eventCount('pote') },
  { id: 'vibe', period: 'dia', title: 'Mandar uma vibe boa a um amigo', target: 1, coins: 6, xp: 8, count: eventCount('vibe') },
  { id: 'respirar', period: 'dia', title: 'Fazer uma pausa para respirar', target: 1, coins: 5, xp: 8, count: eventCount('respirar') },
  { id: 'ativos5', period: 'semana', title: 'Ter 5 dias com atividades', target: 5, coins: 40, xp: 60, count: (d) => (isActive(d) ? 1 : 0) },
  { id: 'mover3', period: 'semana', title: 'Se mexer em 3 dias diferentes', target: 3, coins: 35, xp: 50, count: hasCat('fitness') },
  { id: 'diario3', period: 'semana', title: 'Escrever 3 vezes no diário', target: 3, coins: 30, xp: 40, count: eventCount('diario') },
  { id: 'aventura1', period: 'semana', title: 'Levar o Hami a uma aventura', target: 1, coins: 25, xp: 40, count: eventCount('aventura') },
  { id: 'cuidado20', period: 'mes', title: 'Cuidar de você em 20 dias', target: 20, coins: 150, xp: 200, count: hasCat('autocuidado') },
  { id: 'mover12', period: 'mes', title: 'Se mexer em 12 dias', target: 12, coins: 150, xp: 200, count: hasCat('fitness') },
];

export function periodStart(period: Period, today: string): string {
  if (period === 'dia') return today;
  if (period === 'semana') return weekStart(today);
  return `${monthKey(today)}-01`;
}

/** Quais desafios valem neste período (escolha fixa por pessoa e por período). */
export function activeQuests(seed: number, today: string): QuestDef[] {
  const pick = (period: Period, n: number) => {
    const pool = QUESTS.filter((q) => q.period === period);
    const rnd = mulberry32(hashStr(`${seed}:${periodStart(period, today)}`));
    return [...pool].sort(() => rnd() - 0.5).slice(0, n);
  };
  return [...pick('dia', 3), ...pick('semana', 2), ...pick('mes', 1)];
}

export function questProgress(q: QuestDef, days: Days, today: string): number {
  return Math.min(q.target, countIn(days, periodStart(q.period, today), today, q.count));
}

export const claimKey = (q: QuestDef, today: string) => `${q.id}:${periodStart(q.period, today)}`;

// ---------- Conquistas ----------

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  coins: number;
  check: (s: State, ctx: AchCtx) => boolean;
}

export interface AchCtx {
  today: string;
  totalDone: number;
  best: number;
}

export function achContext(s: State, today: string): AchCtx {
  return {
    today,
    totalDone: Object.values(s.days).reduce((n, d) => n + doneCount(d), 0),
    best: bestStreak(s.days, today, s.createdAt),
  };
}

const anyDay = (s: State, f: (d: DayLog) => boolean) => Object.values(s.days).some(f);
const daysWith = (s: State, f: (d: DayLog) => boolean) => Object.values(s.days).filter(f).length;

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'primeira-tarefa', title: 'Primeiro passo', desc: 'Concluiu a primeira missão', emoji: '🌱', coins: 10, check: (_s, c) => c.totalDone >= 1 },
  { id: 'primeira-caminhada', title: 'Pé na rua', desc: 'Primeira caminhada', emoji: '🚶', coins: 15, check: (s) => anyDay(s, (d) => 'caminhada' in d.done) },
  { id: 'primeiro-movimento', title: 'Corpo em movimento', desc: 'Primeira atividade física', emoji: '💪', coins: 10, check: (s) => anyDay(s, (d) => Object.values(d.done).includes('fitness')) },
  { id: 'semana-cuidado', title: 'Semana de autocuidado', desc: '7 dias cuidando de você', emoji: '🛁', coins: 30, check: (s) => daysWith(s, (d) => Object.values(d.done).includes('autocuidado')) >= 7 },
  { id: 'dez', title: 'Dez feitas', desc: '10 atividades concluídas', emoji: '🔟', coins: 20, check: (_s, c) => c.totalDone >= 10 },
  { id: 'cem', title: 'Cem missões', desc: '100 missões concluídas', emoji: '💯', coins: 100, check: (_s, c) => c.totalDone >= 100 },
  { id: 'ofensiva7', title: 'Uma semana seguida', desc: 'Ofensiva de 7 dias', emoji: '🔥', coins: 30, check: (_s, c) => c.best >= 7 },
  { id: 'ofensiva30', title: 'Primeiro mês de constância', desc: 'Ofensiva de 30 dias', emoji: '🏅', coins: 120, check: (_s, c) => c.best >= 30 },
  { id: 'primeira-aventura', title: 'Explorador', desc: 'Primeira aventura do Hami', emoji: '🗺️', coins: 20, check: (s) => Object.keys(s.placesDone).length > 0 },
  { id: 'primeira-decoracao', title: 'Lar doce lar', desc: 'Decorou a casa pela primeira vez', emoji: '🛋️', coins: 15, check: (s) => s.house.items.some((i) => !i.uid.startsWith('inicial-')) || s.house.wallpaper !== 'p-creme' || s.house.floor !== 'f-madeira' },
  { id: 'primeiro-banho', title: 'Cheirosinho', desc: 'Deu o primeiro banho no Hami', emoji: '🫧', coins: 10, check: (s) => anyDay(s, (d) => d.care.includes('banho')) },
  { id: 'pote10', title: 'Pote cheinho', desc: '10 coisas boas guardadas', emoji: '🫙', coins: 25, check: (s) => s.jar.length >= 10 },
  { id: 'diario7', title: 'Querido diário', desc: '7 textos no diário', emoji: '📔', coins: 25, check: (s) => s.journal.length >= 7 },
  { id: 'achados10', title: 'Colecionador', desc: '10 achadinhos encontrados', emoji: '🐞', coins: 40, check: (s) => s.finds.length >= 10 },
  { id: 'fase2', title: 'Em evolução', desc: 'O Hami chegou à fase Evolução', emoji: '⭐', coins: 30, check: (s) => s.pet.phase >= 1 },
  { id: 'fase3', title: 'Condicionado', desc: 'O Hami chegou à fase Condicionamento', emoji: '🌟', coins: 60, check: (s) => s.pet.phase >= 2 },
  { id: 'fase4', title: 'Avançado', desc: 'O Hami chegou à fase Avançada', emoji: '💛', coins: 100, check: (s) => s.pet.phase >= 3 },
];

/** Conquistas que acabaram de ser ganhas (ainda não registradas). */
export function newAchievements(s: State, today: string): AchievementDef[] {
  const pending = ACHIEVEMENTS.filter((a) => !s.achievements[a.id]);
  if (!pending.length) return [];
  const ctx = achContext(s, today);
  return pending.filter((a) => a.check(s, ctx));
}
