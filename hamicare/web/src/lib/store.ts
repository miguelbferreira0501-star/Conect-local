// Estado do HamiCare: salvo no aparelho (localStorage) e, com conta, no backup privado do servidor.
import { careDays, growthOf } from '../logic/growth';
import { useSyncExternalStore } from 'react';
import { AREA_GOAL, AREA_PLAN, areaOf, isWeightArea, type Area } from '../logic/areas';
import type { AgeGroup, Battery, BodyStart, CareId, Category, DayLog, Direction, Freq, GoalId, Incentive, Journey, MealEntry, Mood, Outfit, PetMood, Photo, State, Task, TraitId, WearSlot } from '../types';
import { LIBRARY, libById, rewardFor } from '../data/tasks';
import { ITEMS, LOOKS, RECIPES, STYLES, WEARABLE_KINDS, itemById, stylePrice } from '../data/items';
import { PLACES, placeById } from '../data/world';
import { FACTS } from '../data/lines';
import { FURS } from '../data/fur';
import { presetByName } from '../data/foods';
import { checkRef, cleanKcal } from '../logic/meals';
import { addDays, clamp, dayDiff, dayKey, hashStr, uid } from './util';
import {
  BAND, JOURNEY_GRAMS, REF_KG, WEIGH_EVERY_DAYS, checkJourneyGoal, conditioning, defaultGoalKg, directionOf, isMinor, journeyGrams, journeyKcal,
  journeyProgress, needKcalFor, phaseFor, PHASES, recentAverageKg, scaleProgress, taskKcal,
} from '../logic/evolution';
import { streakOf } from '../logic/streak';
import { activeQuests, claimKey, levelOf, newAchievements, periodStart, questProgress, QUESTS } from '../logic/progress';
import { addUsage, arenaItemsOf, arenaOf, baseGrant, canCraft, capGrant, chestPool, collectionProgress, emptyPity, emptyUsage, levelUps, migrateXp, openChest, xpAt, type ChestId, type DayUsage, type Pity, type Rarity, type Source } from '../shared/game';
import { arenaHouse, upgradeHouse } from '../data/arenas';
import { companionById, eggWarmth, HATCH_DAYS, withEggs } from '../data/companions';
import { KIT_PLACE } from '../components/room/kit';
import { gameCfg } from './game';
import type { GameState, ItemOrigin } from '../types';
import { REMINDER_DEFAULTS } from '../shared/reminders';

const KEY = 'hamicare:v2';
const OLD_KEY = 'xodo:v1';

/** Quantas missões o plano monta (e o mínimo que a lista mantém ao atualizar o app). */
export const PLAN_SIZE = 8;
export const PLAN_MIN = 7;

export const todayKey = () => dayKey(new Date());

// ---------- Comemorações (a interface mostra uma de cada vez) ----------

export type Celebration =
  | { type: 'level'; level: number; coins?: number; arena?: { n: number; name: string; chest?: ChestId; items?: string[] } }
  | { type: 'achievement'; title: string; emoji: string; coins: number }
  | { type: 'phase'; phase: number }
  | { type: 'weigh'; grams: number; before: number; kcal: number }
  | { type: 'goal' }
  | { type: 'streak'; count: number }
  | { type: 'grow'; stage: number; name: string };

const celebrationListeners = new Set<(c: Celebration) => void>();
export function onCelebrate(fn: (c: Celebration) => void) {
  celebrationListeners.add(fn);
  return () => {
    celebrationListeners.delete(fn);
  };
}
const celebrate = (c: Celebration) => celebrationListeners.forEach((l) => l(c));

// ---------- Estado inicial e migração ----------

export const emptyGame = (): GameState => ({ usage: {}, paid: {}, ledger: [], fragments: 0, pity: emptyPity(), pendingChests: [], maxLevel: 1 });

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
    xpV: 2,
    game: emptyGame(),
    tasks: [],
    days: {},
    journal: [],
    jar: [],
    // Os móveis do quartinho inicial já são da pessoa (pode guardar e recolocar).
    inventory: { 'p-creme': 1, 'f-madeira': 1, cenoura: 3, maca: 2, semente: 3, rodinha: 1, caminha: 1, planta: 1, ...Object.fromEntries(arenaHouse(1).items.map((i) => [i.itemId, 1])) },
    wishlist: [],
    // Casa inicial: um quartinho já decorado (cama, criado-mudo, guarda-roupa, rodinha…).
    house: arenaHouse(1),
    adventure: null,
    finds: [],
    placesDone: {},
    achievements: {},
    claimed: {},
    photos: [],
    settings: { theme: 'claro', accent: 'morango', notif: { enabled: false, time: '19:00', kinds: { ...REMINDER_DEFAULTS }, water: 'normal', bedtime: '22:00' }, sound: true },
    premium: { trialStart: null, until: null },
    privacy: { requests: 'todos', sharePhotos: true },
    journey: { dir: 'manter', startedAt: today, startGrams: BAND.center, goalGrams: BAND.center, needKcal: 0, reachedAt: null },
    welcomed: null,
    bio: '',
    themeV: 1,
    missionsV: 1,
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
/** Missões de comida da versão anterior (agora a comida fica só no Cardápio). */
const FOOD_TASKS = ['agua-refri', 'fruta', 'sem-acucar', 'salada', 'refeicao', 'lanche', 'vitamina', 'castanhas'];

/** Completa estados antigos (antes da jornada de calorias) e de backups. */
function normalize(raw: State): State {
  const s: State = { ...fresh(), ...raw, v: 2 };
  // Reforma das casas: as que ainda estão do jeito que vieram ganham a decoração nova (as arrumadas pela pessoa ficam como estão),
  // e os móveis novos entram no inventário.
  return upgradeHouses(normalizeRest(s, raw));
}

function upgradeHouses(input: State): State {
  let s = input;
  const home = upgradeHouse(s.house, s.homeArena ?? 1);
  if (home !== s.house) s = withHouseFurniture({ ...s, house: home }, home);
  for (const [n, h] of Object.entries(s.houses ?? {})) {
    const up = upgradeHouse(h, Number(n));
    if (up !== h) s = withHouseFurniture({ ...s, houses: { ...s.houses, [n]: up } }, up);
  }
  return s;
}

function normalizeRest(s: State, raw: State): State {
  // Só a área de hábitos saudáveis por enquanto: quem estava numa área de peso ou calma passa para hábitos (o Hami para de mudar de peso).
  if (s.profile.goal !== 'habitos') {
    s.profile = { ...s.profile, goal: 'habitos' };
    s.journey = { ...s.journey, dir: 'manter', startGrams: s.pet.grams, goalGrams: s.pet.grams };
  }
  const goal = OLD_GOAL[s.profile.goal as string] ?? s.profile.goal;
  if (goal !== s.profile.goal) s.profile = { ...s.profile, goal };
  // Identidade colorida: o tema claro passa a ser o padrão (uma vez; depois vale a escolha da pessoa).
  if (!raw.themeV) s.settings = { ...s.settings, theme: s.settings.theme === 'auto' ? 'claro' : s.settings.theme };
  s.themeV = 1;
  // Lembretes novos (água, pausa, hora de dormir): quem já tinha lembretes ganha os padrões.
  const n = s.settings.notif;
  s.settings = { ...s.settings, notif: { ...n, kinds: { ...REMINDER_DEFAULTS, ...n.kinds }, water: n.water ?? 'normal', bedtime: n.bedtime ?? '22:00' } };
  // Missões são só hábitos: as antigas de comida saem da lista (o histórico dos dias fica).
  if (s.tasks.some((t) => FOOD_TASKS.includes(t.id))) s.tasks = s.tasks.filter((t) => !FOOD_TASKS.includes(t.id));
  // A garrafa de água ganhou desenho de garrafa (antes era um copo de refrigerante).
  if (s.tasks.some((t) => t.id === 'garrafa' && t.emoji === '🥤')) s.tasks = s.tasks.map((t) => (t.id === 'garrafa' && t.emoji === '🥤' ? { ...t, emoji: '🚰' } : t));
  // Uma vez: listas que ficaram curtas ganham hábitos do plano até ter pelo menos 7 missões.
  if (!raw.missionsV && s.onboarded && s.tasks.length < PLAN_MIN) {
    const have = new Set(s.tasks.map((t) => t.id));
    const add = starterPlan(s.profile).filter((id) => !have.has(id)).slice(0, PLAN_MIN - s.tasks.length);
    s.tasks = [...s.tasks, ...(add.map((id) => libTask(id, todayKey())).filter(Boolean) as Task[])];
  }
  s.missionsV = 1;
  // Curva de níveis nova: converte o XP antigo sem ninguém perder nível (uma vez).
  if (raw.xpV !== 2) {
    s.xp = migrateXp(Number(raw.xp) || 0, gameCfg());
    s.xpV = 2;
  }
  s.game = { ...emptyGame(), ...(raw.game ?? {}) };
  s.game.maxLevel = Math.max(s.game.maxLevel || 1, levelOf(s.xp));
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
      if (parsed?.v === 2) {
        // Se algo der errado ao atualizar o estado, abre com os dados como estão (nunca perde o progresso).
        try {
          return normalize(parsed);
        } catch {
          return { ...fresh(), ...parsed };
        }
      }
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

const watchers = new Set<(s: State, prev: State) => void>();
/** Quem precisa saber o que mudou (por exemplo, os efeitos sonoros). */
export function watchState(fn: (s: State, prev: State) => void) {
  watchers.add(fn);
  return () => {
    watchers.delete(fn);
  };
}

function set(next: State, opts: { silent?: boolean } = {}) {
  const prev = state;
  state = { ...next, updatedAt: Date.now() };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Sem armazenamento: o progresso vive só nesta sessão.
  }
  listeners.forEach((l) => l());
  watchers.forEach((w) => w(state, prev));
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
/** A área atual (perder, ganhar, manter, hábitos ou calma). */
export const areaNow = (s: State): Area => areaOf(s.profile.goal, minor(s));
/** Mostra peso, calorias e Cardápio? Só nas áreas de peso (e nunca para menores). */
export const weightOn = (s: State) => isWeightArea(areaNow(s));
export const isPremium = (s: State, today = todayKey()) => !!s.premium.until && s.premium.until >= today;
export const dayOf = (s: State, key = todayKey()): DayLog => s.days[key] ?? { done: {}, care: [] };
const withDay = (s: State, key: string, d: DayLog): State => ({ ...s, days: { ...s.days, [key]: d } });
export const owned = (s: State, id: string) => (s.inventory[id] ?? 0) > 0;
export const level = (s: State) => levelOf(s.xp);

// ---------- Economia: ganhos, devoluções e gastos (todos passam por aqui) ----------

export type GameOp =
  | { op: 'grant'; src: Source }
  | { op: 'revoke'; ref: string }
  | { op: 'spend'; ref: string; label: string; coins: number; itemId?: string };

let gameHook: ((op: GameOp) => void) | null = null;
/** Com conta, cada ganho e gasto também vai para o servidor (que confere e manda o saldo certo). */
export function setGameHook(fn: ((op: GameOp) => void) | null) {
  gameHook = fn;
}

const LEDGER_MAX = 200;

function pushLedger(g: GameState, entry: { ref: string; label: string; coins: number; xp: number }): GameState {
  if (!entry.coins && !entry.xp) return g;
  return { ...g, ledger: [{ at: Date.now(), ...entry }, ...g.ledger].slice(0, LEDGER_MAX) };
}

/** Guarda só os dias recentes de uso e de pagamentos de rotina. */
function prune(g: GameState, today: string): GameState {
  const keepFrom = addDays(today, -3);
  const oldDated = addDays(today, -45);
  const usage = Object.fromEntries(Object.entries(g.usage).filter(([d]) => d >= keepFrom));
  const paid = Object.fromEntries(
    Object.entries(g.paid).filter(([ref]) => {
      const m = ref.match(/^(tarefa|cuidado|diario|pote|humor|bemestar|aventura|presente):(\d{4}-\d{2}-\d{2})/);
      return !m || m[2] >= oldDated;
    }),
  );
  return { ...g, usage, paid };
}

/**
 * Paga um ganho com os limites do dia, sem pagar a mesma coisa duas vezes.
 * Subir de nível paga o prêmio do nível; arena nova paga sementes e um baú grátis.
 */
function grant(s: State, src: Source): State {
  const cfg = gameCfg();
  const g = baseGrant(src, cfg);
  if (s.game.paid[g.ref]) return s;
  const day = g.date ?? todayKey();
  const usage: DayUsage = s.game.usage[day] ?? emptyUsage();
  const paid = capGrant(g, usage, cfg);
  let game: GameState = { ...s.game, paid: { ...s.game.paid, [g.ref]: { xp: paid.xp, coins: paid.coins } }, usage: { ...s.game.usage, [day]: addUsage(usage, g, paid) } };
  game = pushLedger(game, { ref: g.ref, label: g.label, coins: paid.coins, xp: paid.xp });
  let next: State = { ...s, coins: s.coins + paid.coins, xp: s.xp + paid.xp, game };
  gameHook?.({ op: 'grant', src });
  // Níveis e arenas novos (só os que nunca foram alcançados).
  const ups = levelUps(s.xp, next.xp, cfg);
  const fresh = ups.levels.filter((l) => l > s.game.maxLevel);
  for (const level of fresh) {
    const lg = baseGrant({ kind: 'nivel', level }, cfg);
    let coins = next.game.paid[lg.ref] ? 0 : lg.coins;
    let g2 = coins ? pushLedger({ ...next.game, paid: { ...next.game.paid, [lg.ref]: { xp: 0, coins } } }, { ref: lg.ref, label: lg.label, coins, xp: 0 }) : next.game;
    const arena = ups.arenas.includes(cfg.arenas.find((a) => a.level === level)?.n ?? -1) ? cfg.arenas.find((a) => a.level === level) : undefined;
    if (arena) {
      const ag = baseGrant({ kind: 'arena', arena: arena.n }, cfg);
      if (!g2.paid[ag.ref]) {
        g2 = pushLedger({ ...g2, paid: { ...g2.paid, [ag.ref]: { xp: 0, coins: ag.coins } }, pendingChests: arena.reward.chest ? [...g2.pendingChests, arena.reward.chest] : g2.pendingChests }, { ref: ag.ref, label: ag.label, coins: ag.coins, xp: 0 });
        coins += ag.coins;
      }
    }
    next = { ...next, coins: next.coins + coins, game: { ...g2, maxLevel: Math.max(g2.maxLevel, level) } };
    // Arena nova: os itens exclusivos vão para o inventário e a casa da arena fica pronta.
    let gifts: string[] = [];
    if (arena) {
      gifts = arenaItemsOf(arena.n, arena.reward.items).filter((id) => !next.inventory[id]);
      const houses: Record<string, State['house']> = { ...(next.houses ?? {}) };
      const created = !houses[arena.n] && (next.homeArena ?? 1) !== arena.n;
      if (created) houses[arena.n] = arenaHouse(arena.n);
      next = { ...gainItems(next, gifts, 'arena'), houses };
      if (created) next = withHouseFurniture(next, houses[arena.n]);
    }
    const celebrated = { level, coins, arena: arena ? { n: arena.n, name: arena.name, chest: arena.reward.chest, items: gifts } : undefined };
    setTimeout(() => celebrate({ type: 'level', ...celebrated }), 0);
  }
  return { ...next, game: prune(next.game, todayKey()) };
}

/** Desfaz um ganho (ex.: desmarcou a missão). O nível já alcançado nunca cai. */
function revoke(s: State, ref: string): State {
  const p = s.game.paid[ref];
  if (!p) return s;
  const cfg = gameCfg();
  const paidMap = { ...s.game.paid };
  delete paidMap[ref];
  const m = ref.match(/^[a-z]+:(\d{4}-\d{2}-\d{2})/);
  let usage = s.game.usage;
  if (m && usage[m[1]]) {
    const parts = ref.split(':');
    const kind = parts[0];
    const routine = ['tarefa', 'cuidado', 'diario', 'pote', 'humor', 'bemestar'].includes(kind);
    const task = s.tasks.find((t) => t.id === parts[2]);
    const g = { ref, label: '', xp: p.xp, coins: p.coins, routine, bucket: kind === 'tarefa' && task ? `cat:${task.cat}` : undefined };
    usage = { ...usage, [m[1]]: addUsage(usage[m[1]], g, { xp: p.xp, coins: p.coins }, -1) };
  }
  const floor = xpAt(s.game.maxLevel, cfg);
  const game = pushLedger({ ...s.game, paid: paidMap, usage }, { ref: `estorno:${ref}`, label: 'Desfeito', coins: -p.coins, xp: -p.xp });
  gameHook?.({ op: 'revoke', ref });
  return { ...s, coins: Math.max(0, s.coins - p.coins), xp: Math.max(floor, s.xp - p.xp), game };
}

/** Gasta sementes (loja, presentes) e registra na carteira. */
function spend(s: State, coins: number, label: string, ref: string, itemId?: string): State {
  if (coins <= 0) return s;
  gameHook?.({ op: 'spend', ref, label, coins, itemId });
  return { ...s, coins: s.coins - coins, game: pushLedger(s.game, { ref, label, coins: -coins, xp: 0 }) };
}

/** Com conta: o servidor manda o saldo certo (sementes, XP, fragmentos e proteção contra azar). */
export function applyServerWallet(w: { coins: number; xp: number; fragments: number; pity: Pity; maxLevel: number; pending?: string[] }) {
  const s = getState();
  const pendingChests = w.pending ? (w.pending.filter((c) => c in gameCfg().chests) as ChestId[]) : s.game.pendingChests;
  set({ ...s, coins: w.coins, xp: w.xp, game: { ...s.game, fragments: w.fragments, pity: w.pity, pendingChests, maxLevel: Math.max(s.game.maxLevel, w.maxLevel) } }, { silent: true });
}

/** Itens novos: entram no inventário com a origem e o selo "Novo". */
function gainItems(s: State, ids: string[], from: ItemOrigin, opts: { stack?: boolean } = {}): State {
  if (!ids.length) return s;
  const inventory = { ...s.inventory };
  const itemMeta = { ...(s.itemMeta ?? {}) };
  for (const id of ids) {
    const had = (inventory[id] ?? 0) > 0;
    inventory[id] = opts.stack ? (inventory[id] ?? 0) + 1 : Math.max(1, inventory[id] ?? 0);
    if (!had) itemMeta[id] = { at: Date.now(), from };
  }
  return { ...s, inventory, itemMeta };
}

/** Móveis da loja que vêm junto com uma casa pronta: entram no inventário (um por peça arrumada),
 *  assim a pessoa pode guardar e recolocar sem perder. Os exclusivos da arena já chegam como presente. */
function withHouseFurniture(s: State, h: State['house']): State {
  const ids = h.items.map((i) => i.itemId).filter((id) => !itemById(id)?.arena);
  return ids.length ? gainItems(s, ids, 'arena', { stack: true }) : s;
}

/** Tira o selo "Novo" dos itens vistos. */
export function markSeen(ids: string[]) {
  const meta = state.itemMeta ?? {};
  if (!ids.some((id) => meta[id] && !meta[id].seen)) return;
  const itemMeta = { ...meta };
  for (const id of ids) if (itemMeta[id]) itemMeta[id] = { ...itemMeta[id], seen: true };
  commit({ ...state, itemMeta });
}

// ---------- Baús, Oficina e coleções ----------

export interface ChestOutcome {
  chest: ChestId;
  rarity: Rarity;
  itemId: string;
  duplicate: boolean;
  fragments: number;
  revealed: boolean;
}

const POOL = chestPool();
const cryptoRng = () => {
  try {
    return crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
  } catch {
    return Math.random();
  }
};
const ownedSet = (s: State) => new Set(Object.keys(s.inventory).filter((id) => s.inventory[id] > 0));

/** Baú revelado (menores, sem conta): o item que este baú vai dar, sorteado antes e mostrado. */
export function chestOffer(chest: ChestId): { itemId: string; rarity: Rarity; pity: Pity } {
  const have = state.game.offers?.[chest];
  if (have) return have;
  const r = openChest({ chest, pity: state.game.pity, owned: ownedSet(state), pool: POOL, rng: cryptoRng, cfg: gameCfg() });
  const offer = { itemId: r.itemId, rarity: r.rarity, pity: r.pity };
  set({ ...state, game: { ...state.game, offers: { ...(state.game.offers ?? {}), [chest]: offer } } }, { silent: true });
  return offer;
}

/** Abre um baú no aparelho (sem conta). Com conta quem abre é o servidor. */
export function openChestLocal(chest: ChestId, free = false): ChestOutcome | 'sem-sementes' | 'sem-bau' {
  const cfg = gameCfg();
  const def = cfg.chests[chest];
  let s = state;
  let pending = s.game.pendingChests;
  if (free) {
    const i = pending.indexOf(chest);
    if (i < 0) return 'sem-bau';
    pending = [...pending.slice(0, i), ...pending.slice(i + 1)];
  } else if (s.coins < def.price) return 'sem-sementes';
  const owned = ownedSet(s);
  const revealed = minor(s);
  let r: { rarity: Rarity; itemId: string; pity: Pity };
  if (revealed) {
    r = chestOffer(chest);
    s = state;
  } else {
    r = openChest({ chest, pity: s.game.pity, owned, pool: POOL, rng: cryptoRng, cfg });
  }
  const duplicate = owned.has(r.itemId);
  const fragments = duplicate ? cfg.rarities[r.rarity].fragments : 0;
  if (!free) s = spend(s, def.price, def.name, `bau:${uid()}`);
  if (!duplicate) s = gainItems(s, [r.itemId], 'bau');
  const offers = { ...(s.game.offers ?? {}) };
  delete offers[chest];
  commit({ ...s, game: { ...s.game, pity: r.pity, fragments: s.game.fragments + fragments, pendingChests: pending, offers } });
  return { chest, rarity: r.rarity, itemId: r.itemId, duplicate, fragments, revealed };
}

/** Com conta: o servidor abriu o baú; o item entra no inventário do aparelho. */
export function applyChestResult(r: ChestOutcome) {
  if (!r.duplicate) commit(gainItems(state, [r.itemId], 'bau'));
}

/** Oficina: troca fragmentos por um item que falta (sem conta). */
export function craftLocal(itemId: string): 'ok' | 'invalido' | 'ja-tem' | 'sem-fragmentos' {
  const c = canCraft(itemId, { pool: POOL, owned: ownedSet(state), fragments: state.game.fragments, cfg: gameCfg() });
  if (!c.ok) return c.error;
  const s = gainItems(state, [itemId], 'oficina');
  commit({ ...s, game: { ...s.game, fragments: s.game.fragments - c.cost } });
  return 'ok';
}

/** Com conta: o servidor fabricou; o item entra no inventário do aparelho. */
export function applyCraftResult(itemId: string) {
  commit(gainItems(state, [itemId], 'oficina'));
}

export const collectionDone = (s: State, id: string) => {
  const c = gameCfg().collections.find((x) => x.id === id);
  return !!c && collectionProgress(c.items, ownedSet(s)).done;
};
export const collectionClaimed = (s: State, id: string) => !!s.game.paid[`colecao:${id}`];

/** Coleção completa: paga o prêmio uma vez (com conta, o servidor confere as peças). */
export function claimCollection(id: string): boolean {
  if (!collectionDone(state, id) || collectionClaimed(state, id)) return false;
  commit(grant(state, { kind: 'colecao', id }));
  return true;
}

function logEventIn(s: State, name: string, key = todayKey()): State {
  const d = dayOf(s, key);
  return withDay(s, key, { ...d, events: [...(d.events ?? []), name] });
}

/** Ferramentas de bem-estar que valem XP (uma vez por dia cada). */
const TOOL_EVENTS = ['respirar', 'aterrar', 'meditar', 'relaxar', 'dormir', 'foco', 'sos'];

export function logEvent(name: string) {
  const next = logEventIn(state, name);
  commit(TOOL_EVENTS.includes(name) ? grant(next, { kind: 'bemestar', tool: name, date: todayKey() }) : next);
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
  // Crescimento: o Hami cresce com os dias de cuidado (a primeira vez só anota, sem festa).
  const grown = growthOf(careDays(s.days));
  if (s.pet.growStage == null) s = { ...s, pet: { ...s.pet, growStage: grown.stage } };
  else if (grown.stage > s.pet.growStage) {
    s = { ...s, pet: { ...s.pet, growStage: grown.stage } };
    setTimeout(() => celebrate({ type: 'grow', stage: grown.stage, name: grown.name }), 0);
  }
  // Pets companheiros: cada arena aberta traz um ovo misterioso.
  const comp = withEggs(s.companions, currentArena(s), today);
  if (comp !== s.companions) s = { ...s, companions: comp };
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
    for (const a of won) achievements[a.id] = today;
    s = { ...s, achievements };
    for (const a of won) {
      s = grant(s, { kind: 'conquista', id: a.id, coins: a.coins });
      setTimeout(() => celebrate({ type: 'achievement', title: a.title, emoji: a.emoji, coins: a.coins }), 0);
    }
  }
  return s;
}

/** Progresso atual da jornada (0 a 1) e calorias somadas. */
export function journeyNow(s: State, today = todayKey()): { kcal: number; progress: number; byScale: boolean } {
  const j = s.journey;
  const kcal = journeyKcal(s.days, j.startedAt, j.dir, undefined, s.mealRef ?? null);
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
    const kcal = journeyKcal(s.days, from > j.startedAt ? from : j.startedAt, j.dir, addDays(date, -1), s.mealRef ?? null);
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

/**
 * Troca de área (ex.: de hábitos para perder peso). Com `trocarMissoes`, as missões da biblioteca
 * viram as da nova área; as missões criadas pela pessoa ficam.
 */
export function changeArea(area: Area, trocarMissoes: boolean) {
  if (minor(state) && isWeightArea(area)) return;
  const goal = AREA_GOAL[area];
  setMission(goal);
  if (!trocarMissoes) return;
  const today = todayKey();
  const p = state.profile;
  const plan = starterPlan({ goal, focus: p.focus, minutes: p.minutes, likes: p.likes, ageGroup: p.ageGroup });
  const custom = state.tasks.filter((t) => !libById(t.id));
  const tasks = [...(plan.map((id) => libTask(id, today)).filter(Boolean) as Task[]), ...custom];
  commit({ ...state, tasks });
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
/** Plano inicial: 7 a 8 hábitos escolhidos pelas respostas (missões nunca têm comida). */
export function starterPlan(a: Pick<OnboardingAnswers, 'goal' | 'focus' | 'minutes' | 'likes' | 'ageGroup'>): string[] {
  const easy = a.minutes <= 10;
  const dir = directionOf(a.goal, isMinor(a.ageGroup));
  const likedMoves = a.likes.map((id) => libById(id)).filter((t) => t && t.cat === 'fitness' && (!easy || t.energy <= 2));
  const move = (fallback: string) => (likedMoves.length ? likedMoves[0]!.id : fallback);
  const pick = (list: string[]) => [...new Set(list)].filter((id) => libById(id)).slice(0, PLAN_SIZE);
  // Completa com hábitos gerais até o tamanho do plano.
  const fill = ['alongar', 'sono', 'garrafa', 'agua-acordar', 'pausa', 'caminhada', 'levantar', 'gratidao', 'dentes', 'respirar'];
  if (a.goal === 'habitos') return pick([...(easy ? AREA_PLAN.habitos.map((id) => (id === 'caminhada' ? 'levantar' : id)) : AREA_PLAN.habitos), ...fill]);
  if (a.goal === 'calma') return pick([...AREA_PLAN.calma, 'musica', 'natureza', ...fill]);
  if (dir === 'perder') return pick([move(easy ? 'escada' : 'caminhada'), 'passos', easy ? 'alongar' : 'escada', 'agua', 'garrafa', 'sono', 'levantar', 'respirar', ...fill]);
  if (dir === 'ganhar') return pick([easy ? 'alongar' : 'forca', easy ? 'mobilidade' : 'casa', 'agua', 'garrafa', 'sono', 'descansar', 'alongar', 'respirar', ...fill]);
  const ids = new Set<string>(['agua', 'respirar']);
  const moving = ['condicionamento', 'ativo', 'manter'].includes(a.goal) || a.focus.includes('fitness');
  if (moving) (likedMoves.length ? likedMoves.slice(0, 2).map((t) => t!.id) : [easy ? 'alongar' : 'caminhada']).forEach((id) => ids.add(id));
  else ids.add('alongar');
  if (a.goal === 'cuidar' || a.focus.includes('autocuidado')) ['dentes', 'pausa'].forEach((i) => ids.add(i));
  if (a.goal === 'manter' || a.focus.includes('habitos')) ['sono', 'garrafa'].forEach((i) => ids.add(i));
  if (a.focus.includes('emocional')) ids.add('gratidao');
  return pick([...ids, ...fill]);
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
  const goal: GoalId = isMinorAge && (a.goal === 'emagrecer' || a.goal === 'ganhar' || a.goal === 'manter') ? 'habitos' : a.goal;
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
  if (!weightOn(s)) return 0;
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
    commit(revoke(withDay(state, key, { ...d, done, kcal }), `tarefa:${key}:${id}`));
    return null;
  }
  const kcal = kcalOf(state, task);
  let next = withDay(state, key, { ...d, done: { ...d.done, [id]: task.cat }, kcal: kcal > 0 ? { ...(d.kcal ?? {}), [id]: kcal } : d.kcal });
  next = grant(next, { kind: 'tarefa', id, energy: task.energy, cat: task.cat, date: key });
  const got = next.game.paid[`tarefa:${key}:${id}`]?.coins ?? 0;
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
  return { reward: got, kcal, streak };
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
  const next = withDay(state, key, { ...dayOf(state, key), mood: m });
  commit(key === todayKey() ? grant(next, { kind: 'humor', date: key }) : next);
}

export function setEmotions(emotions: string[], key = todayKey()) {
  commit(withDay(state, key, { ...dayOf(state, key), emotions }));
}

export function addJournal(text: string, prompt?: string) {
  const clean = text.trim();
  if (!clean) return;
  const next = logEventIn({ ...state, journal: [...state.journal, { id: uid(), date: todayKey(), text: clean, prompt }] }, 'diario');
  commit(grant(next, { kind: 'diario', date: todayKey() }));
}

export function deleteJournal(id: string) {
  commit({ ...state, journal: state.journal.filter((j) => j.id !== id) });
}

export function addJar(text: string) {
  const clean = text.trim();
  if (!clean) return;
  commit(grant(logEventIn({ ...state, jar: [...state.jar, { id: uid(), text: clean, date: todayKey() }] }, 'pote'), { kind: 'pote', date: todayKey() }));
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
  if (first) next = grant(next, { kind: 'cuidado', care: kind, date: key });
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
  let next: State = { ...gainItems(spend(state, item.price, `Comprou: ${item.name}`, `loja:${itemId}:${Date.now()}`, itemId), [itemId], 'loja', { stack: true }), wishlist: state.wishlist.filter((w) => w !== itemId) };
  if (WEARABLE_KINDS.includes(item.kind)) next = { ...next, pet: { ...next.pet, outfit: { ...next.pet.outfit, [item.kind]: itemId } } };
  if (item.kind === 'parede') next = { ...next, house: { ...next.house, wallpaper: itemId } };
  if (item.kind === 'piso') next = { ...next, house: { ...next.house, floor: itemId } };
  commit(next);
  return 'ok';
}

/** Preço de um look: só as peças que faltam, com 20% de desconto. */
export function lookPrice(s: State, lookId: string): { price: number; missing: string[]; plus: boolean; level: number } {
  const look = LOOKS.find((l) => l.id === lookId);
  const items = (look?.items ?? []).map((id) => itemById(id)!).filter(Boolean);
  const missing = items.filter((i) => !owned(s, i.id));
  return {
    price: Math.round(missing.reduce((n, i) => n + i.price, 0) * 0.8),
    missing: missing.map((i) => i.id),
    plus: items.some((i) => i.plus),
    level: Math.max(1, ...items.map((i) => i.level ?? 1)),
  };
}

/** Compra o look inteiro (só o que falta) e já veste tudo. */
export function buyLook(lookId: string): BuyResult {
  const look = LOOKS.find((l) => l.id === lookId);
  if (!look) return 'ja-tem';
  const lp = lookPrice(state, lookId);
  if (lp.plus && !isPremium(state)) return 'plus';
  if (lp.level > levelOf(state.xp)) return 'nivel';
  if (state.coins < lp.price) return 'sem-sementes';
  const { inventory, itemMeta } = gainItems(state, lp.missing, 'loja');
  const outfit = { ...state.pet.outfit };
  for (const id of look.items) {
    const it = itemById(id);
    if (it) outfit[it.kind as WearSlot] = id;
  }
  commit({ ...spend(state, lp.price, `Comprou o look ${look.name}`, `look:${lookId}:${Date.now()}`), inventory, itemMeta, pet: { ...state.pet, outfit }, wishlist: state.wishlist.filter((w) => !look.items.includes(w)) });
  return 'ok';
}

export function buyStyle(styleId: string): BuyResult {
  const style = STYLES.find((st) => st.id === styleId);
  if (!style) return 'ja-tem';
  if (style.plus && !isPremium(state)) return 'plus';
  const price = stylePrice(style, (id) => owned(state, id));
  if (state.coins < price) return 'sem-sementes';
  const { inventory, itemMeta } = gainItems(state, [style.wallpaper, style.floor, ...style.items.map((i) => i.itemId)], 'loja');
  const items = style.items.map((it, i) => ({ uid: uid(), itemId: it.itemId, x: it.x, y: it.y, z: i + 1 }));
  commit({ ...spend(state, price, `Comprou o estilo ${style.name}`, `estilo:${styleId}:${Date.now()}`), inventory, itemMeta, house: { wallpaper: style.wallpaper, floor: style.floor, items } });
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
  const coins = 3 + (roll - 4);
  commit(grant({ ...state, lastGift: today }, { kind: 'presente', coins, date: today }));
  return { coins };
}

// ---------- Pets companheiros ----------

/** Choca o ovo (só depois dos dias de cuidado). O primeiro pet já vem andar junto com o Hami. */
export function hatchCompanion(id: string): boolean {
  const c = state.companions;
  const g = c?.got[id];
  if (!c || !g || g.hatched || !companionById(id) || eggWarmth(state.days, g.at) < HATCH_DAYS) return false;
  commit({ ...state, companions: { got: { ...c.got, [id]: { ...g, hatched: todayKey() } }, active: c.active ?? id } });
  return true;
}

/** Escolhe quem anda junto com o Hami (ou ninguém). */
export function setCompanion(id: string | null) {
  const c = state.companions;
  if (!c || (id && !c.got[id]?.hatched)) return;
  commit({ ...state, companions: { ...c, active: id } });
}

/** Recebe um presente de um amigo (item já validado pelo servidor ou pela página). */
export function receiveGift(itemId: string) {
  if (!itemById(itemId)) return;
  commit(gainItems(state, [itemId], 'presente', { stack: true }));
}

/** Recompensa de evento (validada pelo servidor). */
export function addCoins(n: number, eventId = `evento-${Date.now()}`) {
  if (n > 0) commit(grant(state, { kind: 'evento', id: eventId, coins: n }));
}

/** Paga um presente para um amigo (desconta as sementes). */
export function payGift(itemId: string): boolean {
  const item = itemById(itemId);
  if (!item || item.souvenir || state.coins < item.price) return false;
  commit(spend(state, item.price, `Presente: ${item.name}`, `presente-amigo:${itemId}:${Date.now()}`, itemId));
  return true;
}

export function wear(itemId: string) {
  const item = itemById(itemId);
  if (!item || !owned(state, itemId) || !WEARABLE_KINDS.includes(item.kind)) return;
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
  // O mesmo móvel não fica em duas casas ao mesmo tempo.
  const placedCount = [state.house, ...Object.values(state.houses ?? {})].reduce((n, h) => n + h.items.filter((i) => i.itemId === itemId).length, 0);
  if (placedCount >= (state.inventory[itemId] ?? 0)) return;
  const z = Math.max(0, ...state.house.items.map((i) => i.z)) + 1;
  // Quadro e relógio vão para a parede; tapete, para o meio do chão; o resto, para o chão.
  const place = KIT_PLACE[itemById(itemId)?.svg ?? ''];
  const y = place === 'parede' ? 40 : place === 'tapete' ? 94 : 76;
  commit({ ...state, house: { ...state.house, items: [...state.house.items, { uid: uid(), itemId, x: 30 + (z % 5) * 10, y, z }] } });
}

/** Arena atual (a mais alta já aberta). */
export const currentArena = (s: State) => arenaOf(Math.max(levelOf(s.xp), s.game.maxLevel), gameCfg()).n;
/** Arena onde o Hami mora. */
export const homeArenaOf = (s: State) => Math.min(s.homeArena ?? 1, currentArena(s));
/** Casa de uma arena (a de agora ou uma guardada). */
export function houseOf(s: State, n: number) {
  return n === homeArenaOf(s) ? s.house : s.houses?.[n] ?? arenaHouse(n);
}

/** Muda a casa principal do Hami para outra arena já aberta (as casas antigas ficam guardadas). */
export function moveHome(n: number): boolean {
  if (n < 1 || n > currentArena(state)) return false;
  const from = homeArenaOf(state);
  if (n === from) return true;
  const houses: Record<string, State['house']> = { ...(state.houses ?? {}), [from]: state.house };
  const house = houses[n] ?? arenaHouse(n);
  delete houses[n];
  commit({ ...state, homeArena: n, house, houses });
  return true;
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
  const advN = (dayOf(next, todayKey()).events ?? []).filter((e) => e === 'aventura').length + 1;
  next = logEventIn(grant(next, { kind: 'aventura', place: place.id, xp: mission.xp, coins: mission.coins, date: todayKey(), n: advN }), 'aventura');
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
  commit(grant({ ...state, claimed: { ...state.claimed, [k]: true } }, { kind: 'desafio', period: q.period, id: q.id, key: periodStart(q.period, todayKey()) }));
  return true;
}

// ---------- Cardápio do dia (privado) ----------

export function addMeal(entry: Omit<MealEntry, 'id' | 'eaten'>, key = todayKey()) {
  if (minor(state) || !entry.name.trim()) return;
  const d = dayOf(state, key);
  const item: MealEntry = { ...entry, id: uid(), name: entry.name.trim().slice(0, 40), qty: entry.qty.trim().slice(0, 30), kcal: cleanKcal(entry.kcal), eaten: false };
  // Alimento novo (fora da lista pronta) fica salvo em "Meus alimentos".
  let myFoods = state.myFoods ?? [];
  if (!presetByName(item.name) && !myFoods.some((f) => f.name.toLowerCase() === item.name.toLowerCase())) myFoods = [{ name: item.name, qty: item.qty, kcal: item.kcal }, ...myFoods].slice(0, 40);
  commit({ ...withDay(state, key, { ...d, meals: [...(d.meals ?? []), item] }), myFoods });
}

export function updateMeal(id: string, patch: Partial<Pick<MealEntry, 'name' | 'qty' | 'kcal' | 'meal' | 'eaten'>>, key = todayKey()) {
  const d = dayOf(state, key);
  const meals = (d.meals ?? []).map((m) => (m.id === id ? { ...m, ...patch, kcal: patch.kcal === undefined ? m.kcal : cleanKcal(patch.kcal), name: patch.name === undefined ? m.name : patch.name.slice(0, 40), qty: patch.qty === undefined ? m.qty : patch.qty.slice(0, 30) } : m));
  commit(withDay(state, key, { ...d, meals }));
}

export function removeMeal(id: string, key = todayKey()) {
  const d = dayOf(state, key);
  commit(withDay(state, key, { ...d, meals: (d.meals ?? []).filter((m) => m.id !== id) }));
}

/** Repete o cardápio de ontem (tudo como "ainda não comi"). */
export function copyYesterdayMeals(): number {
  const today = todayKey();
  const y = dayOf(state, addDays(today, -1)).meals ?? [];
  if (!y.length) return 0;
  const d = dayOf(state, today);
  commit(withDay(state, today, { ...d, meals: [...(d.meals ?? []), ...y.map((m) => ({ ...m, id: uid(), eaten: false }))] }));
  return y.length;
}

export function setMealRef(kcal: number | null): { ok: true } | { ok: false; reason: string } {
  const r = checkRef(kcal);
  if (!r.ok) return r;
  commit({ ...state, mealRef: kcal === null ? null : Math.round(kcal) });
  return { ok: true };
}

export function removeMyFood(name: string) {
  commit({ ...state, myFoods: (state.myFoods ?? []).filter((f) => f.name !== name) });
}

// ---------- Temporada do mês ----------

export const SEASON_GOAL = 20;

export function seasonProgress(s: State, today = todayKey()): { days: number; claimed: boolean } {
  const from = `${today.slice(0, 7)}-01`;
  const days = Object.entries(s.days).filter(([k, d]) => k >= from && k <= today && Object.keys(d.done).length > 0).length;
  return { days, claimed: !!s.claimed[`temporada:${today.slice(0, 7)}`] };
}

/** Dias ativos no mês (com pelo menos uma missão feita). Com conta, o app usa o número do servidor. */
export function seasonDays(s: State, today = todayKey()): number {
  return seasonProgress(s, today).days;
}
export const seasonTierClaimed = (s: State, tier: number, month = todayKey().slice(0, 7)) => !!s.game.paid[`temporada:${month}:d${tier}`];

/** Prêmio da turma no dia completo (com conta, o servidor confere que todos fizeram tudo). */
export const teamRewardClaimed = (s: State, teamId: string, date: string) => !!s.game.paid[`turma:${teamId}:${date}`];
export function claimTeamReward(teamId: string, date: string): boolean {
  if (teamRewardClaimed(state, teamId, date)) return false;
  commit(grant(state, { kind: 'turma', id: teamId, date }));
  return true;
}

/** Pega o prêmio de um degrau da trilha da temporada (grátis). */
export function claimSeasonTier(tier: number, days = seasonDays(state)): boolean {
  const t = gameCfg().season.tiers[tier];
  const month = todayKey().slice(0, 7);
  if (!t || days < t.days || seasonTierClaimed(state, tier, month)) return false;
  let next = grant(state, { kind: 'temporada-degrau', month, tier });
  next = { ...next, game: { ...next.game, fragments: next.game.fragments + (t.fragments ?? 0), pendingChests: t.chest ? [...next.game.pendingChests, t.chest] : next.game.pendingChests } };
  commit(next);
  return true;
}

export function claimSeason(): boolean {
  const today = todayKey();
  const p = seasonProgress(state, today);
  if (p.claimed || p.days < SEASON_GOAL) return false;
  commit(grant({ ...state, claimed: { ...state.claimed, [`temporada:${today.slice(0, 7)}`]: true } }, { kind: 'temporada', month: today.slice(0, 7), xp: 30, coins: 120 }));
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

/** A pelagem pode ser usada agora? (as especiais são compradas; as do Plus pedem o Plus) */
export function furAvailable(s: State, furId: string): boolean {
  const f = FURS.find((x) => x.id === furId);
  if (!f) return false;
  if (f.plus && !isPremium(s)) return false;
  return !f.price || owned(s, `fur:${furId}`);
}

export function buyFur(furId: string): BuyResult {
  const f = FURS.find((x) => x.id === furId);
  if (!f || !f.price) return 'ja-tem';
  if (owned(state, `fur:${furId}`)) return 'ja-tem';
  if (state.coins < f.price) return 'sem-sementes';
  commit({ ...spend(state, f.price, `Pelagem ${f.label}`, `pelagem:${furId}`), inventory: { ...state.inventory, [`fur:${furId}`]: 1 }, pet: { ...state.pet, fur: furId } });
  return 'ok';
}

export function updatePet(patch: Partial<Pick<State['pet'], 'name' | 'fur' | 'trait'>>) {
  if (patch.fur && !furAvailable(state, patch.fur)) return;
  commit({ ...state, pet: { ...state.pet, ...patch } });
}

export function updateSettings(patch: Partial<State['settings']>) {
  commit({ ...state, settings: { ...state.settings, ...patch } });
}

// ---------- Água e meta do dia ----------

export const waterGoalOf = (s: State) => s.settings.waterGoal ?? 8;
export const dayGoalOf = (s: State, total: number) => Math.min(total || 1, s.settings.dayGoal ?? Math.max(3, Math.ceil(total * 0.6)));

/** Mais (ou menos) um copo de água hoje. Bater a meta dá uma comemoração. */
export function addWater(delta: 1 | -1): { cups: number; hitGoal: boolean } {
  const today = todayKey();
  const day = dayOf(state, today);
  const cups = Math.max(0, Math.min(30, (day.water ?? 0) + delta));
  const goal = waterGoalOf(state);
  const hitGoal = delta > 0 && cups === goal;
  commit(withDay(state, today, { ...day, water: cups }));
  return { cups, hitGoal };
}

export function setWaterGoal(n: number) {
  updateSettings({ waterGoal: Math.max(4, Math.min(16, Math.round(n))) });
}

export function setDayGoal(n: number) {
  updateSettings({ dayGoal: Math.max(1, Math.min(20, Math.round(n))) });
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
/** Teste grátis (sem conta): 7 dias no plano anual, 3 no mensal. Uma vez só. */
export function startTrial(days = 7): boolean {
  if (state.premium.trialStart) return false;
  const today = todayKey();
  commit({ ...state, premium: { trialStart: today, until: addDays(today, Math.min(7, Math.max(1, days))) } });
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
