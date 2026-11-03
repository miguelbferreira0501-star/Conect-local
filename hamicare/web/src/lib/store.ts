// Estado do HamiCare: salvo no aparelho (localStorage) e, com conta, no backup privado do servidor.
import { useSyncExternalStore } from 'react';
import type { AgeGroup, Battery, BodyStart, CareId, Category, DayLog, Direction, Freq, GoalId, Incentive, Journey, Mood, Outfit, PetMood, Photo, State, Task, TraitId, WearSlot } from '../types';
import { LIBRARY, libById, rewardFor } from '../data/tasks';
import { ITEMS, RECIPES, STYLES, itemById, stylePrice } from '../data/items';
import { PLACES, placeById } from '../data/world';
import { FACTS } from '../data/lines';
import { addDays, clamp, dayDiff, dayKey, hashStr, uid } from './util';
import {
  BAND, JOURNEY_GRAMS, REF_KG, WEIGH_EVERY_DAYS, checkJourneyGoal, conditioning, defaultGoalKg, directionOf, isMinor, journeyGrams, journeyKcal,
  journeyProgress, needKcalFor, phaseFor, PHASES, recentAverageKg, scaleProgress, taskKcal,
} from '../logic/evolution';
import { streakOf } from '../logic/streak';
import { XP_TASK, activeQuests, claimKey, levelOf, newAchievements, questProgress, QUESTS } from '../logic/progress';

const KEY = 'hamicare:v2';
const OLD_KEY = 'xodo:v1';

export const todayKey = () => dayKey(new Date());

// ---------- Comemorações (a interface mostra uma de cada vez) ----------

export type Celebration =
  | { type: 'level'; level: number }
  | { type: 'achievement'; title: string; emoji: string; coins: number }
  | { type: 'phase'; phase: number }
  | { type: 'weigh'; grams: number; before: number; kcal: number }
  | { type: 'goal' }
  | { type: 'streak'; count: number };

const celebrationListeners = new Set<(c: Celebration) => void>();
export function onCelebrate(fn: (c: Celebration) => void) {
  celebrationListeners.add(fn);
  return () => {
    celebrationListeners.delete(fn);
  };
}
const celebrate = (c: Celebration) => celebrationListeners.forEach((l) => l(c));

// ---------- Estado inicial e migração ----------

export function fresh(): State {
  const today = todayKey();
  return {
    v: 2,
    seed: Math.floor(Math.random() * 1e9),
    createdAt: today,
    onboarded: false,
    profile: { name: '', ageGroup: '18mais', goal: 'habitos', focus: [], minutes: 15, likes: [], incentive: 'carinho', feeling: 3 },
    pet: {
      name: '', fur: 'caramelo', trait: 'carinhoso', body: 'equilibrado', grams: BAND.center, startGrams: BAND.center, lastWeighIn: today,
      weighIns: [{ date: today, grams: BAND.center }], phase: 0, stats: { felicidade: 80, energia: 80, saciedade: 70, limpeza: 80 },
      statsAt: Date.now(), sleeping: false, outfit: { chapeu: null, oculos: null, roupa: null, acessorio: null }, facts: [],
    },
    body: { tracking: false, sync: false, consentAt: null, heightCm: null, logs: [], baselineKg: null, goalKg: null, goalWeeks: null, hideNumbers: false },
    coins: 30,
    xp: 0,
    tasks: [],
    days: {},
    journal: [],
    jar: [],
    inventory: { 'p-creme': 1, 'f-madeira': 1, cenoura: 3, maca: 2, semente: 3, rodinha: 1, caminha: 1, planta: 1 },
    wishlist: [],
    // Casa inicial: já vem com o básico de todo hamster.
    house: {
      wallpaper: 'p-creme',
      floor: 'f-madeira',
      items: [
        { uid: 'inicial-rodinha', itemId: 'rodinha', x: 20, y: 74, z: 1 },
        { uid: 'inicial-caminha', itemId: 'caminha', x: 79, y: 86, z: 2 },
        { uid: 'inicial-planta', itemId: 'planta', x: 88, y: 62, z: 3 },
      ],
    },
    adventure: null,
    finds: [],
    placesDone: {},
    achievements: {},
    claimed: {},
    photos: [],
    settings: { theme: 'claro', accent: 'morango', notif: { enabled: false, time: '19:00', kinds: { tarefas: true, hami: true, missoes: true, aventura: true, amigos: true } }, sound: true },
    premium: { trialStart: null, until: null },
    privacy: { requests: 'todos', sharePhotos: true },
    journey: { dir: 'manter', startedAt: today, startGrams: BAND.center, goalGrams: BAND.center, needKcal: 0, reachedAt: null },
    welcomed: null,
    bio: '',
    themeV: 1,
    lastGift: null,
    updatedAt: Date.now(),
  };
}

// ---------- Jornada de peso ----------

/** Último peso que a pessoa registrou (só com consentimento). */
export function latestKg(s: State): number | null {
  const last = [...s.body.logs].sort((a, b) => a.date.localeCompare(b.date)).pop();
  return last?.kg ?? s.body.baselineKg ?? null;
}

/** Peso usado nas contas de calorias: o da pessoa, ou 70 kg como estimativa. */
export const personKg = (s: State) => latestKg(s) ?? REF_KG;

/**
 * Monta uma jornada nova. O Hami começa do peso atual dele (ou do corpo inicial da jornada)
 * e a meta dele acompanha a da pessoa.
 */
export function buildJourney(dir: Direction, kg: number | null, goalKg: number | null, today: string, fromGrams?: number): Journey {
  const start = fromGrams ?? JOURNEY_GRAMS[dir].start;
  const goalGrams = dir === 'perder' ? (start > 135 ? 135 : Math.max(BAND.min, start - 15)) : dir === 'ganhar' ? (start < 140 ? 140 : Math.min(160, start + 15)) : start;
  const base = kg ?? REF_KG;
  const goal = goalKg ?? defaultGoalKg(base, dir);
  return { dir, startedAt: today, startGrams: start, goalGrams, needKcal: dir === 'manter' ? 0 : needKcalFor(base, goal), reachedAt: null };
}

const OLD_GOAL: Record<string, GoalId> = { peso: 'emagrecer', equilibrio: 'manter' };

/** Completa estados antigos (antes da jornada de calorias) e de backups. */
function normalize(raw: State): State {
  const s: State = { ...fresh(), ...raw, v: 2 };
  const goal = OLD_GOAL[s.profile.goal as string] ?? s.profile.goal;
  if (goal !== s.profile.goal) s.profile = { ...s.profile, goal };
  // Identidade colorida: o tema claro passa a ser o padrão (uma vez; depois vale a escolha da pessoa).
  if (!raw.themeV) s.settings = { ...s.settings, theme: s.settings.theme === 'auto' ? 'claro' : s.settings.theme };
  s.themeV = 1;
  if (!raw.journey) {
    const dir = directionOf(goal, isMinor(s.profile.ageGroup));
    s.journey = buildJourney(dir, latestKg(s), s.body.goalKg, todayKey(), s.pet.grams);
  }
  return s;
}

const OLD_FUR: Record<string, string> = { maracuja: 'caramelo', pitanga: 'pessego', acai: 'lavanda', mate: 'menta', ceu: 'ceu' };
const OLD_ITEM: Record<string, string> = { vaso: 'planta', luzinhas: 'pisca', varal: 'quadro', radinho: 'relogio', violao: 'flores', concha: 'concha-decor' };

/** Converte o progresso do app antigo (Xodó) para o HamiCare. */
export function migrateXodo(old: any): State {
  const s = fresh();
  s.from = 'xodo';
  s.createdAt = typeof old.createdAt === 'string' ? old.createdAt : s.createdAt;
  s.profile.name = old.userName ?? '';
  s.pet.name = old.petName ?? '';
  s.pet.fur = OLD_FUR[old.petColor] ?? 'caramelo';
  s.xp = Number(old.xp) || 0;
  s.coins = (Number(old.seeds) || 0) + 30;
  for (const id of old.inventory ?? []) {
    const mapped = OLD_ITEM[id] ?? id;
    if (itemById(mapped)) s.inventory[mapped] = 1;
    else s.coins += 20;
  }
  s.tasks = (old.goals ?? []).map((g: any) => ({ id: `t${g.id}`, title: g.title, emoji: g.emoji ?? '⭐', cat: 'autocuidado', freq: { kind: 'diaria' }, reward: 5, energy: 2, createdAt: s.createdAt }));
  for (const [key, d] of Object.entries<any>(old.days ?? {})) {
    const done: DayLog['done'] = {};
    for (const id of d.done ?? []) done[id] = libById(id)?.cat ?? 'autocuidado';
    s.days[key] = { done, mood: d.mood, battery: d.battery, care: [] };
    if (d.note) s.journal.push({ id: uid(), date: key, text: d.note });
  }
  s.jar = (old.jar ?? []).map((n: any) => ({ id: n.id ?? uid(), text: n.text, date: n.date }));
  s.settings.theme = old.theme ?? 'auto';
  return s;
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.v === 2) return normalize(parsed);
    }
    const old = localStorage.getItem(OLD_KEY);
    if (old) {
      const parsed = JSON.parse(old);
      if (parsed?.v === 1) return migrateXodo(parsed);
    }
  } catch {
    // Sem armazenamento (aba anônima, prévia): o app funciona só na memória.
  }
  return fresh();
}

let state: State = load();
const listeners = new Set<() => void>();
let changeHook: ((s: State) => void) | null = null;

/** O módulo de sincronização se registra aqui para mandar o backup ao servidor. */
export function setChangeHook(fn: ((s: State) => void) | null) {
  changeHook = fn;
}

function set(next: State, opts: { silent?: boolean } = {}) {
  state = { ...next, updatedAt: Date.now() };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Sem armazenamento: o progresso vive só nesta sessão.
  }
  listeners.forEach((l) => l());
  if (!opts.silent) changeHook?.(state);
}

export const getState = () => state;
export function useApp(): State {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}

/** Troca o estado inteiro (recuperação de backup ou sincronização). */
export function replaceState(next: State, opts: { silent?: boolean } = {}) {
  set(normalize(next), opts);
}

export function resetAll() {
  try {
    localStorage.removeItem(OLD_KEY);
  } catch {
    /* sem armazenamento */
  }
  set(fresh());
}

// ---------- Ajudantes ----------

export const minor = (s: State) => isMinor(s.profile.ageGroup);
export const isPremium = (s: State, today = todayKey()) => !!s.premium.until && s.premium.until >= today;
export const dayOf = (s: State, key = todayKey()): DayLog => s.days[key] ?? { done: {}, care: [] };
const withDay = (s: State, key: string, d: DayLog): State => ({ ...s, days: { ...s.days, [key]: d } });
export const owned = (s: State, id: string) => (s.inventory[id] ?? 0) > 0;
export const level = (s: State) => levelOf(s.xp);

function reward(s: State, coins: number, xp: number): State {
  const before = levelOf(s.xp);
  const next = { ...s, coins: s.coins + coins, xp: Math.max(0, s.xp + xp) };
  const after = levelOf(next.xp);
  if (after > before) setTimeout(() => celebrate({ type: 'level', level: after }), 0);
  return next;
}

function logEventIn(s: State, name: string, key = todayKey()): State {
  const d = dayOf(s, key);
  return withDay(s, key, { ...d, events: [...(d.events ?? []), name] });
}

export function logEvent(name: string) {
  commit(logEventIn(state, name));
}

/** Aplica efeitos de tempo, pesagens, fases e conquistas, depois salva. */
function commit(next: State) {
  set(maintain(next));
}

// ---------- Manutenção (tempo passando) ----------

const DECAY_PER_HOUR = { felicidade: 1.5, saciedade: 2.5, limpeza: 1, energia: 1.2 };

export function decayStats(s: State, now = Date.now()): State {
  const hours = (now - s.pet.statsAt) / 3_600_000;
  if (hours < 0.05) return s;
  const st = s.pet.stats;
  const stats = {
    felicidade: clamp(st.felicidade - DECAY_PER_HOUR.felicidade * hours, 5, 100),
    saciedade: clamp(st.saciedade - DECAY_PER_HOUR.saciedade * hours, 5, 100),
    limpeza: clamp(st.limpeza - DECAY_PER_HOUR.limpeza * hours, 5, 100),
    energia: clamp(st.energia + (s.pet.sleeping ? 12 : -DECAY_PER_HOUR.energia) * hours, 5, 100),
  };
  return { ...s, pet: { ...s.pet, stats, statsAt: now } };
}

export function maintain(input: State): State {
  if (!input.onboarded) return input;
  let s = decayStats(input);
  const today = todayKey();
  // Jornada: o peso do Hami acompanha as calorias das missões (ou a balança, se a pessoa quiser).
  s = applyJourney(s, today);
  // Fase (nunca regride)
  const phase = phaseFor(conditioning(s.days, today));
  if (phase > s.pet.phase) {
    s = { ...s, pet: { ...s.pet, phase } };
    setTimeout(() => celebrate({ type: 'phase', phase }), 0);
  }
  // Conquistas
  const won = newAchievements(s, today);
  if (won.length) {
    const achievements = { ...s.achievements };
    let coins = 0;
    for (const a of won) {
      achievements[a.id] = today;
      coins += a.coins;
      setTimeout(() => celebrate({ type: 'achievement', title: a.title, emoji: a.emoji, coins: a.coins }), 0);
    }
    s = { ...s, achievements, coins: s.coins + coins };
  }
  return s;
}

/** Progresso atual da jornada (0 a 1) e calorias somadas. */
export function journeyNow(s: State, today = todayKey()): { kcal: number; progress: number; byScale: boolean } {
  const j = s.journey;
  const kcal = journeyKcal(s.days, j.startedAt, j.dir);
  if (j.dir !== 'manter' && s.body.sync && s.body.baselineKg && !minor(s)) {
    const recent = recentAverageKg(s.body.logs, today);
    if (recent) return { kcal, progress: scaleProgress(j.dir, s.body.baselineKg, s.body.goalKg ?? defaultGoalKg(s.body.baselineKg, j.dir), recent), byScale: true };
  }
  return { kcal, progress: journeyProgress(j, kcal), byScale: false };
}

function applyJourney(input: State, today: string): State {
  let s = input;
  const j = s.journey;
  const { progress } = journeyNow(s, today);
  const grams = journeyGrams(j, progress);
  if (grams !== s.pet.grams || s.pet.weighIns[s.pet.weighIns.length - 1]?.date !== today) {
    const hist = s.pet.weighIns.filter((w) => w.date !== today);
    s = { ...s, pet: { ...s.pet, grams, weighIns: [...hist, { date: today, grams }].slice(-200) } };
  }
  if (progress >= 1 && !j.reachedAt && j.dir !== 'manter') {
    s = { ...s, journey: { ...j, reachedAt: today } };
    setTimeout(() => celebrate({ type: 'goal' }), 0);
  }
  // Resumo da semana: a cada 7 dias, mostra quanto vocês avançaram.
  const weeks = Math.floor(dayDiff(s.pet.lastWeighIn, today) / WEIGH_EVERY_DAYS);
  if (weeks >= 1) {
    const date = addDays(s.pet.lastWeighIn, weeks * WEIGH_EVERY_DAYS);
    const from = addDays(date, -WEIGH_EVERY_DAYS);
    const before = [...s.pet.weighIns].reverse().find((w) => w.date <= from)?.grams ?? s.journey.startGrams;
    const kcal = journeyKcal(s.days, from > j.startedAt ? from : j.startedAt, j.dir, addDays(date, -1));
    s = { ...s, pet: { ...s.pet, lastWeighIn: date } };
    if (!minor(s) && j.dir !== 'manter') setTimeout(() => celebrate({ type: 'weigh', grams: s.pet.grams, before, kcal }), 0);
  }
  return s;
}

/** Troca a missão principal (emagrecer, ganhar, manter ou outra) e começa uma jornada nova. */
export function setMission(goal: GoalId, goalKg: number | null = null) {
  const today = todayKey();
  const dir = directionOf(goal, minor(state));
  const kg = latestKg(state);
  const journey = buildJourney(dir, kg, goalKg ?? (dir === state.journey.dir ? state.body.goalKg : null), today, state.pet.grams);
  commit({ ...state, profile: { ...state.profile, goal }, journey, body: { ...state.body, goalKg: goalKg ?? (dir === state.journey.dir ? state.body.goalKg : null), baselineKg: kg ?? state.body.baselineKg }, pet: { ...state.pet, lastWeighIn: today } });
}

/** Chamado pelo app a cada minuto e ao voltar para a tela. */
export function tick() {
  if (!state.onboarded) return;
  const next = maintain(state);
  if (next !== state) set(next, { silent: true });
}

// ---------- Onboarding ----------

export interface OnboardingAnswers {
  goal: GoalId;
  focus: Category[];
  minutes: number;
  likes: string[];
  incentive: Incentive;
  feeling: Mood;
  ageGroup: AgeGroup;
  tracking: boolean;
  weightKg: number | null;
  heightCm: number | null;
  /** Meta de peso da jornada (kg). null = 5% do peso. */
  goalKg: number | null;
  fur: string;
  trait: TraitId;
  petName: string;
  userName: string;
  body: BodyStart;
}

/** Plano inicial: 4 a 6 atividades escolhidas pelas respostas. */
export function starterPlan(a: Pick<OnboardingAnswers, 'goal' | 'focus' | 'minutes' | 'likes' | 'ageGroup'>): string[] {
  const easy = a.minutes <= 10;
  const dir = directionOf(a.goal, isMinor(a.ageGroup));
  const likedMoves = a.likes.map((id) => libById(id)).filter((t) => t && t.cat === 'fitness' && (!easy || t.energy <= 2));
  const move = (fallback: string) => (likedMoves.length ? likedMoves[0]!.id : fallback);
  if (dir === 'perder') return ['agua-refri', 'fruta', move(easy ? 'escada' : 'caminhada'), 'salada', 'agua', 'respirar'];
  if (dir === 'ganhar') return ['vitamina', 'lanche', 'refeicao', easy ? 'alongar' : 'forca', 'castanhas', 'respirar'];
  const ids = new Set<string>(['agua', 'respirar']);
  const moving = ['condicionamento', 'ativo', 'manter'].includes(a.goal) || a.focus.includes('fitness');
  if (moving) (likedMoves.length ? likedMoves.slice(0, 2).map((t) => t!.id) : [easy ? 'alongar' : 'caminhada']).forEach((id) => ids.add(id));
  else ids.add('alongar');
  if (a.goal === 'cuidar' || a.focus.includes('autocuidado')) ['dentes', 'pausa'].forEach((i) => ids.add(i));
  if (a.goal === 'habitos' || a.goal === 'manter' || a.focus.includes('habitos')) ['sono', 'fruta'].forEach((i) => ids.add(i));
  if (a.focus.includes('emocional')) ids.add('gratidao');
  return [...ids].slice(0, 6);
}

function libTask(id: string, today: string): Task | null {
  const t = libById(id);
  return t
    ? { id: t.id, title: t.title, emoji: t.emoji, cat: t.cat, freq: { kind: 'diaria' }, reward: rewardFor(t.energy), energy: t.energy, createdAt: today, met: t.met, min: t.min, swap: t.swap, gain: t.gain }
    : null;
}

export function completeOnboarding(a: OnboardingAnswers) {
  const today = todayKey();
  const base = state.from ? state : fresh();
  const isMinorAge = isMinor(a.ageGroup);
  const goal: GoalId = isMinorAge && (a.goal === 'emagrecer' || a.goal === 'ganhar') ? 'ativo' : a.goal;
  const dir = directionOf(goal, isMinorAge);
  const bodyStart: BodyStart = dir === 'perder' ? 'fofinho' : dir === 'ganhar' ? 'mignon' : 'equilibrado';
  const tasks = state.from && state.tasks.length ? state.tasks : (starterPlan(a).map((id) => libTask(id, today)).filter(Boolean) as Task[]);
  const tracking = !isMinorAge && a.tracking;
  const kg = tracking && a.weightKg ? a.weightKg : null;
  const goalKg = tracking && kg && a.goalKg && checkJourneyGoal(kg, a.goalKg, dir, a.heightCm, false).ok ? a.goalKg : null;
  const journey = buildJourney(dir, kg, goalKg, today);
  const grams = journey.startGrams;
  set({
    ...base,
    onboarded: true,
    journey,
    profile: { name: a.userName.trim(), ageGroup: a.ageGroup, goal, focus: a.focus, minutes: a.minutes, likes: a.likes, incentive: a.incentive, feeling: a.feeling },
    pet: { ...base.pet, name: a.petName.trim() || 'Hami', fur: a.fur, trait: a.trait, body: bodyStart, grams, startGrams: grams, lastWeighIn: today, weighIns: [{ date: today, grams }] },
    body: {
      ...base.body,
      tracking,
      consentAt: tracking ? new Date().toISOString() : null,
      heightCm: tracking ? a.heightCm : null,
      logs: tracking && a.weightKg ? [{ date: today, kg: a.weightKg }] : [],
      baselineKg: kg,
      goalKg,
    },
    tasks,
    days: { ...base.days, [today]: { ...dayOf(base, today), mood: a.feeling } },
    premium: state.premium,
    welcomed: today,
  });
}

// ---------- Tarefas ----------

export function isDue(t: Task, key: string): boolean {
  if (t.freq.kind === 'diaria') return true;
  if (t.freq.kind === 'hoje') return t.freq.date === key;
  return t.freq.days.includes(new Date(`${key}T12:00:00`).getDay());
}

/** Tarefas de hoje. No modo dia difícil, só ficam as leves (e as já feitas). */
export function todayTasks(s: State, key = todayKey()): Task[] {
  const d = dayOf(s, key);
  return s.tasks.filter((t) => isDue(t, key) && (d.battery !== 1 || t.energy === 1 || t.id in d.done));
}

/** Calorias que esta tarefa conta na jornada (0 para menores: sem contagem de calorias). */
export function kcalOf(s: State, task: Task): number {
  if (minor(s)) return 0;
  return taskKcal({ ...libById(task.id), ...stripUndefined(task) }, s.journey.dir, personKg(s));
}

const stripUndefined = <T extends object>(o: T): Partial<T> => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;

export interface ToggleResult {
  reward: number;
  kcal: number;
  /** Primeira atividade do dia: a ofensiva subiu. */
  streak: number | null;
}

export function toggleTask(id: string): ToggleResult | null {
  const key = todayKey();
  const d = dayOf(state, key);
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return null;
  if (id in d.done) {
    const done = { ...d.done };
    delete done[id];
    const kcal = { ...(d.kcal ?? {}) };
    delete kcal[id];
    commit(reward(withDay(state, key, { ...d, done, kcal }), -task.reward, -XP_TASK));
    return null;
  }
  const kcal = kcalOf(state, task);
  let next = withDay(state, key, { ...d, done: { ...d.done, [id]: task.cat }, kcal: kcal > 0 ? { ...(d.kcal ?? {}), [id]: kcal } : d.kcal });
  next = reward(next, task.reward, XP_TASK);
  // Durante uma aventura, cada atividade traz o Hami 5 minutos mais cedo.
  if (next.adventure) next = { ...next, adventure: { ...next.adventure, endsAt: next.adventure.endsAt - 5 * 60_000 } };
  const firstToday = Object.keys(d.done).length === 0;
  // Um dia de cuidado revela uma curiosidade nova sobre o Hami.
  if (firstToday && next.pet.facts.length < FACTS.length) {
    const fact = FACTS.find((_, i) => !next.pet.facts.includes(String(i)));
    if (fact) next = { ...next, pet: { ...next.pet, facts: [...next.pet.facts, String(FACTS.indexOf(fact))] } };
  }
  next = { ...next, pet: { ...next.pet, stats: { ...next.pet.stats, felicidade: clamp(next.pet.stats.felicidade + 4, 0, 100) } } };
  commit(next);
  const streak = firstToday ? streakOf(state.days, key, state.createdAt).count : null;
  if (streak) setTimeout(() => celebrate({ type: 'streak', count: streak }), 0);
  return { reward: task.reward, kcal, streak };
}

export interface TaskInput {
  title: string;
  emoji: string;
  cat: Category;
  freq: Freq;
  energy: 1 | 2 | 3;
}

export function addTask(input: TaskInput) {
  const title = input.title.trim();
  if (!title) return;
  const task: Task = { id: `t${uid()}`, title, emoji: input.emoji, cat: input.cat, freq: input.freq, energy: input.energy, reward: rewardFor(input.energy), createdAt: todayKey() };
  commit({ ...state, tasks: [...state.tasks, task] });
}

export function addLibraryTask(libId: string) {
  if (state.tasks.some((t) => t.id === libId)) return;
  const t = libTask(libId, todayKey());
  if (t) commit({ ...state, tasks: [...state.tasks, t] });
}

export function updateTask(id: string, patch: Partial<TaskInput>) {
  commit({
    ...state,
    tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...patch, title: (patch.title ?? t.title).trim() || t.title, reward: rewardFor(patch.energy ?? t.energy) } : t)),
  });
}

export function deleteTask(id: string) {
  commit({ ...state, tasks: state.tasks.filter((t) => t.id !== id) });
}

export function setBattery(b: Battery) {
  const key = todayKey();
  commit(withDay(state, key, { ...dayOf(state, key), battery: b }));
}

/** Marca hoje como dia de descanso (protege a ofensiva; não tira nada). */
export function setRest(rest: boolean) {
  const key = todayKey();
  commit(withDay(state, key, { ...dayOf(state, key), rest }));
}

// ---------- Humor, diário e pote ----------

export function setMood(m: Mood, key = todayKey()) {
  commit(withDay(state, key, { ...dayOf(state, key), mood: m }));
}

export function setEmotions(emotions: string[], key = todayKey()) {
  commit(withDay(state, key, { ...dayOf(state, key), emotions }));
}

export function addJournal(text: string, prompt?: string) {
  const clean = text.trim();
  if (!clean) return;
  const next = logEventIn({ ...state, journal: [...state.journal, { id: uid(), date: todayKey(), text: clean, prompt }] }, 'diario');
  commit(reward(next, 3, 5));
}

export function deleteJournal(id: string) {
  commit({ ...state, journal: state.journal.filter((j) => j.id !== id) });
}

export function addJar(text: string) {
  const clean = text.trim();
  if (!clean) return;
  commit(reward(logEventIn({ ...state, jar: [...state.jar, { id: uid(), text: clean, date: todayKey() }] }, 'pote'), 3, 5));
}

export function deleteJar(id: string) {
  commit({ ...state, jar: state.jar.filter((j) => j.id !== id) });
}

// ---------- Cuidados com o Hami ----------

const CARE_EFFECT: Partial<Record<CareId, Partial<Record<keyof State['pet']['stats'], number>>>> = {
  carinho: { felicidade: 10 },
  brincar: { felicidade: 15, energia: -10 },
  escovar: { limpeza: 15, felicidade: 4 },
  banho: { limpeza: 100, felicidade: 6 },
  conversar: { felicidade: 8 },
  foto: { felicidade: 3 },
};

function applyCare(s: State, kind: CareId, effect: Partial<Record<keyof State['pet']['stats'], number>>): State {
  const st = { ...s.pet.stats };
  for (const [k, v] of Object.entries(effect) as [keyof typeof st, number][]) st[k] = clamp(st[k] + v, 0, 100);
  const key = todayKey();
  const d = dayOf(s, key);
  const first = !d.care.includes(kind);
  let next = withDay({ ...s, pet: { ...s.pet, stats: st } }, key, { ...d, care: first ? [...d.care, kind] : d.care });
  if (first) next = reward(next, 2, 3);
  return next;
}

export function care(kind: Exclude<CareId, 'comida' | 'dormir'>) {
  if (state.pet.sleeping && kind !== 'conversar') return;
  commit(applyCare(decayStats(state), kind, CARE_EFFECT[kind] ?? {}));
}

export function feed(foodId: string): boolean {
  const item = itemById(foodId);
  if (!item?.food || !owned(state, foodId) || state.pet.sleeping) return false;
  const s = { ...decayStats(state), inventory: { ...state.inventory, [foodId]: state.inventory[foodId] - 1 } };
  commit(applyCare(s, 'comida', item.food));
  return true;
}

export function toggleSleep() {
  const s = decayStats(state);
  const sleeping = !s.pet.sleeping;
  commit(sleeping ? applyCare({ ...s, pet: { ...s.pet, sleeping } }, 'dormir', {}) : { ...s, pet: { ...s.pet, sleeping } });
}

export function cook(result: string): boolean {
  const recipe = RECIPES.find((r) => r.result === result);
  if (!recipe || !recipe.needs.every((id) => owned(state, id))) return false;
  const inventory = { ...state.inventory };
  for (const id of recipe.needs) inventory[id] -= 1;
  inventory[result] = (inventory[result] ?? 0) + 1;
  commit({ ...state, inventory });
  return true;
}

export function takePhoto(caption: string, scene: string, mood: PetMood = 'animado'): Photo {
  const photo: Photo = { id: uid(), date: todayKey(), caption: caption.trim(), scene, snap: { fur: state.pet.fur, grams: state.pet.grams, phase: state.pet.phase, outfit: state.pet.outfit, mood } };
  commit(applyCare({ ...state, photos: [photo, ...state.photos].slice(0, 60) }, 'foto', CARE_EFFECT.foto ?? {}));
  return photo;
}

export function deletePhoto(id: string) {
  commit({ ...state, photos: state.photos.filter((p) => p.id !== id) });
}

// ---------- Loja, guarda-roupa e casa ----------

export type BuyResult = 'ok' | 'sem-sementes' | 'plus' | 'nivel' | 'ja-tem';

export function canBuy(s: State, itemId: string): BuyResult {
  const item = itemById(itemId);
  if (!item || item.souvenir) return 'ja-tem';
  if (item.kind !== 'comida' && owned(s, itemId)) return 'ja-tem';
  if (item.plus && !isPremium(s)) return 'plus';
  if ((item.level ?? 1) > levelOf(s.xp)) return 'nivel';
  if (s.coins < item.price) return 'sem-sementes';
  return 'ok';
}

export function buy(itemId: string): BuyResult {
  const res = canBuy(state, itemId);
  if (res !== 'ok') return res;
  const item = itemById(itemId)!;
  let next: State = { ...state, coins: state.coins - item.price, inventory: { ...state.inventory, [itemId]: (state.inventory[itemId] ?? 0) + 1 }, wishlist: state.wishlist.filter((w) => w !== itemId) };
  if (['chapeu', 'oculos', 'roupa', 'acessorio'].includes(item.kind)) next = { ...next, pet: { ...next.pet, outfit: { ...next.pet.outfit, [item.kind]: itemId } } };
  if (item.kind === 'parede') next = { ...next, house: { ...next.house, wallpaper: itemId } };
  if (item.kind === 'piso') next = { ...next, house: { ...next.house, floor: itemId } };
  commit(next);
  return 'ok';
}

export function buyStyle(styleId: string): BuyResult {
  const style = STYLES.find((st) => st.id === styleId);
  if (!style) return 'ja-tem';
  if (style.plus && !isPremium(state)) return 'plus';
  const price = stylePrice(style, (id) => owned(state, id));
  if (state.coins < price) return 'sem-sementes';
  const inventory = { ...state.inventory };
  for (const id of [style.wallpaper, style.floor, ...style.items.map((i) => i.itemId)]) inventory[id] = Math.max(1, inventory[id] ?? 0);
  const items = style.items.map((it, i) => ({ uid: uid(), itemId: it.itemId, x: it.x, y: it.y, z: i + 1 }));
  commit({ ...state, coins: state.coins - price, inventory, house: { wallpaper: style.wallpaper, floor: style.floor, items } });
  return 'ok';
}

export function toggleWish(itemId: string) {
  const has = state.wishlist.includes(itemId);
  commit({ ...state, wishlist: has ? state.wishlist.filter((w) => w !== itemId) : [...state.wishlist, itemId] });
}

/** Presente do dia: sementes ou uma comidinha, uma vez por dia. */
export function claimDailyGift(): { coins: number; food?: string } | null {
  const today = todayKey();
  if (state.lastGift === today) return null;
  const roll = hashStr(`${state.seed}:${today}`) % 10;
  const foods = ['morango', 'milho', 'cenoura', 'maca', 'banana'];
  if (roll < 4) {
    const food = foods[roll % foods.length];
    commit({ ...state, lastGift: today, inventory: { ...state.inventory, [food]: (state.inventory[food] ?? 0) + 1 } });
    return { coins: 0, food };
  }
  const coins = 5 + roll * 2;
  commit({ ...state, lastGift: today, coins: state.coins + coins });
  return { coins };
}

/** Recebe um presente de um amigo (item já validado pelo servidor ou pela página). */
export function receiveGift(itemId: string) {
  if (!itemById(itemId)) return;
  commit({ ...state, inventory: { ...state.inventory, [itemId]: (state.inventory[itemId] ?? 0) + 1 } });
}

/** Recompensa de evento (validada pelo servidor). */
export function addCoins(n: number) {
  if (n > 0) commit({ ...state, coins: state.coins + n });
}

/** Paga um presente para um amigo (desconta as sementes). */
export function payGift(itemId: string): boolean {
  const item = itemById(itemId);
  if (!item || item.souvenir || state.coins < item.price) return false;
  commit({ ...state, coins: state.coins - item.price });
  return true;
}

export function wear(itemId: string) {
  const item = itemById(itemId);
  if (!item || !owned(state, itemId) || !['chapeu', 'oculos', 'roupa', 'acessorio'].includes(item.kind)) return;
  commit({ ...state, pet: { ...state.pet, outfit: { ...state.pet.outfit, [item.kind]: itemId } } });
}

export function unwear(slot: WearSlot) {
  commit({ ...state, pet: { ...state.pet, outfit: { ...state.pet.outfit, [slot]: null } as Outfit } });
}

export function setWallpaper(id: string) {
  if (owned(state, id)) commit({ ...state, house: { ...state.house, wallpaper: id } });
}

export function setFloor(id: string) {
  if (owned(state, id)) commit({ ...state, house: { ...state.house, floor: id } });
}

export function placeItem(itemId: string) {
  const placedCount = state.house.items.filter((i) => i.itemId === itemId).length;
  if (placedCount >= (state.inventory[itemId] ?? 0)) return;
  const z = Math.max(0, ...state.house.items.map((i) => i.z)) + 1;
  commit({ ...state, house: { ...state.house, items: [...state.house.items, { uid: uid(), itemId, x: 30 + (z % 5) * 10, y: 72, z }] } });
}

export function moveItem(itemUid: string, x: number, y: number) {
  commit({ ...state, house: { ...state.house, items: state.house.items.map((i) => (i.uid === itemUid ? { ...i, x: clamp(x, 4, 96), y: clamp(y, 8, 96) } : i)) } });
}

export function bringFront(itemUid: string) {
  const z = Math.max(0, ...state.house.items.map((i) => i.z)) + 1;
  commit({ ...state, house: { ...state.house, items: state.house.items.map((i) => (i.uid === itemUid ? { ...i, z } : i)) } });
}

export function storeItem(itemUid: string) {
  commit({ ...state, house: { ...state.house, items: state.house.items.filter((i) => i.uid !== itemUid) } });
}

// ---------- Mundo e aventuras ----------

export function placeLocked(s: State, placeId: string): 'nivel' | 'plus' | null {
  const p = placeById(placeId);
  if (!p) return 'nivel';
  if (p.level > levelOf(s.xp)) return 'nivel';
  if (p.plus && !isPremium(s)) return 'plus';
  return null;
}

export function startAdventure(placeId: string, missionId: string): 'ok' | 'bloqueado' | 'cansado' | 'ocupado' | 'dormindo' {
  const s = decayStats(state);
  if (s.adventure) return 'ocupado';
  if (s.pet.sleeping) return 'dormindo';
  if (placeLocked(s, placeId)) return 'bloqueado';
  const mission = placeById(placeId)?.missions.find((m) => m.id === missionId);
  if (!mission) return 'bloqueado';
  if (s.pet.stats.energia < mission.energy) return 'cansado';
  const now = Date.now();
  commit({ ...s, adventure: { placeId, missionId, startedAt: now, endsAt: now + mission.minutes * 60_000 }, pet: { ...s.pet, stats: { ...s.pet.stats, energia: s.pet.stats.energia - mission.energy } } });
  return 'ok';
}

export interface AdventureResult {
  placeId: string;
  story: string;
  coins: number;
  xp: number;
  find: string | null;
}

export function finishAdventure(now = Date.now()): AdventureResult | null {
  const adv = state.adventure;
  if (!adv || now < adv.endsAt) return null;
  const place = placeById(adv.placeId);
  const mission = place?.missions.find((m) => m.id === adv.missionId);
  if (!place || !mission) {
    commit({ ...state, adventure: null });
    return null;
  }
  // Achadinho: o primeiro que falta neste lugar; garantido na missão longa, 50% nas outras.
  const missing = place.finds.filter((f) => !state.finds.includes(f.id));
  const lucky = mission.minutes >= 120 || hashStr(`${state.seed}:${adv.startedAt}`) % 2 === 0;
  const find = missing.length && lucky ? missing[0].id : null;
  let next: State = {
    ...state,
    adventure: null,
    finds: find ? [...state.finds, find] : state.finds,
    placesDone: { ...state.placesDone, [place.id]: (state.placesDone[place.id] ?? 0) + 1 },
  };
  next = logEventIn(reward(next, mission.coins, mission.xp), 'aventura');
  commit(next);
  return { placeId: place.id, story: mission.story, coins: mission.coins, xp: mission.xp, find };
}

export function unlockedPlaces(s: State) {
  return PLACES.filter((p) => !placeLocked(s, p.id));
}

// ---------- Desafios ----------

export function claimQuest(questId: string): boolean {
  const today = todayKey();
  const q = QUESTS.find((x) => x.id === questId);
  if (!q || !activeQuests(state.seed, today).some((a) => a.id === q.id)) return false;
  const k = claimKey(q, today);
  if (state.claimed[k] || questProgress(q, state.days, today) < q.target) return false;
  commit(reward({ ...state, claimed: { ...state.claimed, [k]: true } }, q.coins, q.xp));
  return true;
}

// ---------- Temporada do mês ----------

export const SEASON_GOAL = 20;

export function seasonProgress(s: State, today = todayKey()): { days: number; claimed: boolean } {
  const from = `${today.slice(0, 7)}-01`;
  const days = Object.entries(s.days).filter(([k, d]) => k >= from && k <= today && Object.keys(d.done).length > 0).length;
  return { days, claimed: !!s.claimed[`temporada:${today.slice(0, 7)}`] };
}

export function claimSeason(): boolean {
  const today = todayKey();
  const p = seasonProgress(state, today);
  if (p.claimed || p.days < SEASON_GOAL) return false;
  commit(reward({ ...state, claimed: { ...state.claimed, [`temporada:${today.slice(0, 7)}`]: true } }, 120, 150));
  return true;
}

// ---------- Dados físicos (opcionais, privados) ----------

export function enableTracking(on: boolean) {
  if (minor(state)) return;
  commit({ ...state, body: { ...state.body, tracking: on, consentAt: on ? new Date().toISOString() : state.body.consentAt, sync: on ? state.body.sync : false } });
}

export function setSync(on: boolean) {
  if (minor(state) || !state.body.tracking) return;
  const latest = [...state.body.logs].sort((a, b) => b.date.localeCompare(a.date))[0];
  commit({ ...state, body: { ...state.body, sync: on, baselineKg: state.body.baselineKg ?? latest?.kg ?? null } });
}

export function logWeight(kg: number): boolean {
  if (minor(state) || !state.body.tracking || !(kg > 25 && kg < 400)) return false;
  const today = todayKey();
  const logs = [...state.body.logs.filter((l) => l.date !== today), { date: today, kg: Math.round(kg * 10) / 10 }].sort((a, b) => a.date.localeCompare(b.date));
  commit({ ...state, body: { ...state.body, logs, baselineKg: state.body.baselineKg ?? kg } });
  return true;
}

export function deleteWeightData() {
  commit({ ...state, body: { ...state.body, logs: [], baselineKg: null, goalKg: null, goalWeeks: null, sync: false } });
  // Sem os dados, a jornada volta para as estimativas (70 kg e meta de 5%).
  const j = state.journey;
  if (j.dir !== 'manter') commit({ ...state, journey: { ...j, needKcal: needKcalFor(REF_KG, defaultGoalKg(REF_KG, j.dir)) } });
}

export function setHeight(cm: number | null) {
  commit({ ...state, body: { ...state.body, heightCm: cm && cm > 80 && cm < 250 ? cm : null } });
}

/** Meta de peso da jornada (precisa do peso registrado). */
export function setGoal(goalKg: number | null): { ok: true } | { ok: false; reason: string } {
  const dir = state.journey.dir;
  const base = state.body.baselineKg ?? latestKg(state);
  if (goalKg === null) {
    commit({ ...state, body: { ...state.body, goalKg: null }, journey: { ...state.journey, needKcal: dir === 'manter' ? 0 : needKcalFor(base ?? REF_KG, defaultGoalKg(base ?? REF_KG, dir)) } });
    return { ok: true };
  }
  if (!base) return { ok: false, reason: 'Registre seu peso atual primeiro.' };
  const check = checkJourneyGoal(base, goalKg, dir, state.body.heightCm, minor(state));
  if (!check.ok) return check;
  commit({ ...state, body: { ...state.body, goalKg, baselineKg: base }, journey: { ...state.journey, needKcal: needKcalFor(base, goalKg), reachedAt: null } });
  return { ok: true };
}

export function setHideNumbers(hide: boolean) {
  commit({ ...state, body: { ...state.body, hideNumbers: hide } });
}

// ---------- Perfil, ajustes, plano ----------

export function updateProfile(patch: Partial<State['profile']>) {
  let next: State = { ...state, profile: { ...state.profile, ...patch } };
  // Ficou menor de idade: desliga tudo que é número de peso.
  if (patch.ageGroup && isMinor(patch.ageGroup)) {
    next = { ...next, body: { ...next.body, tracking: false, sync: false, goalKg: null, goalWeeks: null } };
    if (next.journey.dir !== 'manter') next = { ...next, journey: buildJourney('manter', null, null, todayKey(), BAND.center), profile: { ...next.profile, goal: 'ativo' } };
  }
  commit(next);
}

export function updatePet(patch: Partial<Pick<State['pet'], 'name' | 'fur' | 'trait'>>) {
  commit({ ...state, pet: { ...state.pet, ...patch } });
}

export function updateSettings(patch: Partial<State['settings']>) {
  commit({ ...state, settings: { ...state.settings, ...patch } });
}

/** O cartão de boas-vindas aparece uma vez por dia. */
export function markWelcomed() {
  commit({ ...state, welcomed: todayKey() });
}

export function setBio(bio: string) {
  commit({ ...state, bio: bio.trim().slice(0, 120) });
}

export function updatePrivacy(patch: Partial<State['privacy']>) {
  commit({ ...state, privacy: { ...state.privacy, ...patch } });
}

/** Teste grátis de 7 dias do HamiCare+ (uma vez por conta). */
export function startTrial(): boolean {
  if (state.premium.trialStart) return false;
  const today = todayKey();
  commit({ ...state, premium: { trialStart: today, until: addDays(today, 7) } });
  return true;
}

export function grantPremium(until: string | null) {
  set({ ...state, premium: { ...state.premium, until } }, { silent: true });
}

// ---------- Backup por código ----------

export function exportCode(): string {
  const bytes = new TextEncoder().encode(JSON.stringify(state));
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return `HAMI2.${btoa(bin)}`;
}

export function importCode(code: string): boolean {
  try {
    const clean = code.trim().replace(/^(HAMI2|XODO1)\./, '').replace(/\s+/g, '');
    const bin = atob(clean);
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (parsed?.v === 2 && typeof parsed.pet?.name === 'string') replaceState(parsed);
    else if (parsed?.v === 1 && typeof parsed.petName === 'string') replaceState(migrateXodo(parsed));
    else return false;
    return true;
  } catch {
    return false;
  }
}

// ---------- Números para telas ----------

export const PHASE_NAMES = PHASES;
export const ALL_TASK_LIBRARY = LIBRARY;
export const sinceStart = (s: State) => Math.max(0, dayDiff(s.createdAt, todayKey()));
export const ALL_ITEMS = ITEMS;
