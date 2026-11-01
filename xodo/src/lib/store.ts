import { useSyncExternalStore } from 'react';
import { TASKS, taskById, rewardFor, type Energy } from '../data/tasks';
import type { PetColor } from '../data/colors';
import { itemById, type DecorSpot } from '../data/items';
import { PLACES, placeById } from '../data/places';
import { dayKey, hashStr, mulberry32, uid } from './util';

export type Battery = 1 | 2 | 3;
export type Mood = 1 | 2 | 3 | 4 | 5;
export type Theme = 'auto' | 'claro' | 'escuro';

export interface Goal {
  id: string;
  title: string;
  emoji: string;
}

export interface DayLog {
  battery?: Battery;
  mood?: Mood;
  note?: string;
  /** Ids da biblioteca de cuidados sugeridos para o dia. */
  suggestions: string[];
  /** Ids feitos: id da biblioteca, `g:<id>` (meta fixa) ou `o:<id>` (só hoje). */
  done: string[];
  oneOff: Goal[];
}

export interface JarNote {
  id: string;
  text: string;
  date: string;
}

export interface Postcard {
  id: string;
  placeId: string;
  date: string;
  souvenir?: string;
}

export interface Trip {
  placeId: string;
  startedAt: number;
  endsAt: number;
}

export interface State {
  v: 1;
  seed: number;
  onboarded: boolean;
  createdAt: string;
  userName: string;
  petName: string;
  petColor: PetColor;
  xp: number;
  seeds: number;
  /** 0 a 100. Cheia, o xodó pode sair para passear. */
  disposicao: number;
  inventory: string[];
  hat: string | null;
  acc: string | null;
  decor: Partial<Record<DecorSpot, string>>;
  goals: Goal[];
  days: Record<string, DayLog>;
  jar: JarNote[];
  postcards: Postcard[];
  trip: Trip | null;
  theme: Theme;
}

export const STAGES = [
  { name: 'Broto', min: 0 },
  { name: 'Filhote', min: 60 },
  { name: 'Jovem', min: 250 },
  { name: 'Adulto', min: 700 },
];

export function stageOf(xp: number): number {
  let stage = 0;
  STAGES.forEach((s, i) => {
    if (xp >= s.min) stage = i;
  });
  return stage;
}

export const TRIP_MINUTES = 45;
const XP_PER_TASK = 10;
const DISPOSICAO_PER_TASK = 25;
const COUNT_BY_BATTERY: Record<Battery, number> = { 1: 3, 2: 5, 3: 6 };

const KEY = 'xodo:v1';

function fresh(): State {
  return {
    v: 1,
    seed: Math.floor(Math.random() * 1e9),
    onboarded: false,
    createdAt: dayKey(new Date()),
    userName: '',
    petName: '',
    petColor: 'maracuja',
    xp: 0,
    seeds: 20,
    disposicao: 0,
    inventory: [],
    hat: null,
    acc: null,
    decor: {},
    goals: [],
    days: {},
    jar: [],
    postcards: [],
    trip: null,
    theme: 'auto',
  };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.v === 1) return { ...fresh(), ...parsed };
    }
  } catch {
    // Sem armazenamento (aba anônima, prévia): o app funciona só na memória.
  }
  return fresh();
}

let state: State = load();
const listeners = new Set<() => void>();

function set(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Ignora: sem armazenamento, o progresso vive só nesta sessão.
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useApp(): State {
  return useSyncExternalStore(subscribe, () => state);
}

export const getState = () => state;

export const todayKey = () => dayKey(new Date());

export function dayOf(s: State, key: string): DayLog {
  return s.days[key] ?? { suggestions: [], done: [], oneOff: [] };
}

function withDay(s: State, key: string, d: DayLog): State {
  return { ...s, days: { ...s.days, [key]: d } };
}

// ---------- Cuidados do dia ----------

export interface TodayTask {
  id: string;
  title: string;
  emoji: string;
  reward: number;
  kind: 'sugestao' | 'meta' | 'hoje';
  energy: Energy;
}

export function rewardOf(id: string): number {
  if (id.startsWith('g:') || id.startsWith('o:')) return 5;
  const t = taskById(id);
  return t ? rewardFor(t.energy) : 3;
}

export function todayTasks(s: State, key = todayKey()): TodayTask[] {
  const d = dayOf(s, key);
  const goals: TodayTask[] = s.goals.map((g) => ({
    id: `g:${g.id}`, title: g.title, emoji: g.emoji, reward: 5, kind: 'meta', energy: 2,
  }));
  const oneOff: TodayTask[] = d.oneOff.map((g) => ({
    id: `o:${g.id}`, title: g.title, emoji: g.emoji, reward: 5, kind: 'hoje', energy: 2,
  }));
  const suggestions: TodayTask[] = d.suggestions
    .map((id) => taskById(id))
    .filter((t): t is NonNullable<typeof t> => !!t)
    .sort((a, b) => a.energy - b.energy)
    .map((t) => ({ id: t.id, title: t.title, emoji: t.emoji, reward: rewardFor(t.energy), kind: 'sugestao', energy: t.energy }));
  return [...goals, ...oneOff, ...suggestions];
}

function pickSuggestions(s: State, key: string, battery: Battery, keep: string[]): string[] {
  const rnd = mulberry32(hashStr(`${key}:${s.seed}:${battery}`));
  const pool = TASKS.filter((t) => t.energy <= battery && !keep.includes(t.id));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const need = Math.max(0, COUNT_BY_BATTERY[battery] - keep.length);
  const chosen: string[] = [];
  // Dia de bateria cheia: garante até 2 desafios maiores.
  if (battery === 3) pool.filter((t) => t.energy === 3).slice(0, 2).forEach((t) => chosen.push(t.id));
  // Todo dia tem pelo menos um cuidado bem pequeno.
  const easy = pool.find((t) => t.energy === 1 && !chosen.includes(t.id));
  if (easy) chosen.push(easy.id);
  for (const t of pool) {
    if (chosen.length >= need) break;
    if (!chosen.includes(t.id)) chosen.push(t.id);
  }
  return [...keep, ...chosen.slice(0, need)];
}

export function setBattery(b: Battery) {
  const key = todayKey();
  const d = dayOf(state, key);
  const keep = d.suggestions.filter((id) => d.done.includes(id));
  set(withDay(state, key, { ...d, battery: b, suggestions: pickSuggestions(state, key, b, keep) }));
}

export function setMood(m: Mood, key = todayKey()) {
  const d = dayOf(state, key);
  set(withDay(state, key, { ...d, mood: m }));
}

export function setNote(note: string, key = todayKey()) {
  const d = dayOf(state, key);
  set(withDay(state, key, { ...d, note }));
}

export interface TaskResult {
  reward: number;
  evolvedTo?: number;
}

export function toggleTask(id: string): TaskResult | null {
  const key = todayKey();
  const d = dayOf(state, key);
  const reward = rewardOf(id);
  if (d.done.includes(id)) {
    set({
      ...withDay(state, key, { ...d, done: d.done.filter((x) => x !== id) }),
      seeds: Math.max(0, state.seeds - reward),
      xp: Math.max(0, state.xp - XP_PER_TASK),
      disposicao: state.trip ? state.disposicao : Math.max(0, state.disposicao - DISPOSICAO_PER_TASK),
    });
    return null;
  }
  const before = stageOf(state.xp);
  const xp = state.xp + XP_PER_TASK;
  // Durante um passeio, cada cuidado faz o xodó voltar 5 minutos mais cedo.
  const trip = state.trip ? { ...state.trip, endsAt: state.trip.endsAt - 5 * 60_000 } : null;
  set({
    ...withDay(state, key, { ...d, done: [...d.done, id] }),
    seeds: state.seeds + reward,
    xp,
    disposicao: trip ? state.disposicao : Math.min(100, state.disposicao + DISPOSICAO_PER_TASK),
    trip,
  });
  const after = stageOf(xp);
  return { reward, evolvedTo: after > before ? after : undefined };
}

/** Marca um cuidado da lista de hoje quando a pessoa faz a ação em outra tela. */
export function completeIfListed(taskId: string): TaskResult | null {
  const key = todayKey();
  const d = dayOf(state, key);
  if (d.suggestions.includes(taskId) && !d.done.includes(taskId)) return toggleTask(taskId);
  return null;
}

export function swapSuggestion(id: string) {
  const key = todayKey();
  const d = dayOf(state, key);
  const battery = d.battery ?? 2;
  const energy = taskById(id)?.energy ?? 1;
  const available = TASKS.filter((t) => t.energy <= battery && !d.suggestions.includes(t.id));
  const same = available.filter((t) => t.energy === energy);
  const pool = same.length ? same : available;
  if (!pool.length) return;
  const next = pool[Math.floor(Math.random() * pool.length)];
  set(withDay(state, key, { ...d, suggestions: d.suggestions.map((x) => (x === id ? next.id : x)) }));
}

export function addGoal(title: string, emoji: string, everyDay: boolean) {
  const goal = { id: uid(), title: title.trim(), emoji };
  if (!goal.title) return;
  if (everyDay) {
    set({ ...state, goals: [...state.goals, goal] });
  } else {
    const key = todayKey();
    const d = dayOf(state, key);
    set(withDay(state, key, { ...d, oneOff: [...d.oneOff, goal] }));
  }
}

export function removeTask(taskId: string) {
  const key = todayKey();
  const d = dayOf(state, key);
  if (taskId.startsWith('g:')) {
    const id = taskId.slice(2);
    set({ ...state, goals: state.goals.filter((g) => g.id !== id) });
  } else if (taskId.startsWith('o:')) {
    const id = taskId.slice(2);
    set(withDay(state, key, { ...d, oneOff: d.oneOff.filter((g) => g.id !== id) }));
  }
}

// ---------- Passeios ----------

export function startTrip() {
  if (state.trip || state.disposicao < 100) return;
  const visited = new Set(state.postcards.map((p) => p.placeId));
  const unseen = PLACES.filter((p) => !visited.has(p.id));
  const list = unseen.length ? unseen : PLACES;
  const place = list[Math.floor(Math.random() * list.length)];
  const now = Date.now();
  set({ ...state, trip: { placeId: place.id, startedAt: now, endsAt: now + TRIP_MINUTES * 60_000 }, disposicao: 0 });
}

export function finishTrip(): { card: Postcard; evolvedTo?: number } | null {
  const trip = state.trip;
  if (!trip || Date.now() < trip.endsAt) return null;
  const place = placeById(trip.placeId);
  if (!place) {
    set({ ...state, trip: null });
    return null;
  }
  const souvenir = place.souvenir && !state.inventory.includes(place.souvenir) ? place.souvenir : undefined;
  const card: Postcard = { id: uid(), placeId: place.id, date: todayKey(), souvenir };
  const before = stageOf(state.xp);
  const xp = state.xp + 20;
  set({
    ...state,
    trip: null,
    postcards: [...state.postcards, card],
    seeds: state.seeds + 15,
    xp,
    inventory: souvenir ? [...state.inventory, souvenir] : state.inventory,
  });
  const after = stageOf(xp);
  return { card, evolvedTo: after > before ? after : undefined };
}

// ---------- Loja e guarda-roupa ----------

export function buy(itemId: string): boolean {
  const item = itemById(itemId);
  if (!item || item.souvenir || state.inventory.includes(itemId) || state.seeds < item.price) return false;
  set({ ...state, seeds: state.seeds - item.price, inventory: [...state.inventory, itemId] });
  equip(itemId);
  return true;
}

export function equip(itemId: string) {
  const item = itemById(itemId);
  if (!item || !state.inventory.includes(itemId)) return;
  if (item.slot === 'chapeu') set({ ...state, hat: itemId });
  else if (item.slot === 'acessorio') set({ ...state, acc: itemId });
  else if (item.spot) set({ ...state, decor: { ...state.decor, [item.spot]: itemId } });
}

export function unequip(itemId: string) {
  const item = itemById(itemId);
  if (!item) return;
  if (state.hat === itemId) set({ ...state, hat: null });
  else if (state.acc === itemId) set({ ...state, acc: null });
  else if (item.spot && state.decor[item.spot] === itemId) {
    const decor = { ...state.decor };
    delete decor[item.spot];
    set({ ...state, decor });
  }
}

export function isEquipped(s: State, itemId: string): boolean {
  return s.hat === itemId || s.acc === itemId || Object.values(s.decor).includes(itemId);
}

// ---------- Pote de coisas boas ----------

export function addJarNote(text: string): TaskResult | null {
  const clean = text.trim();
  if (!clean) return null;
  set({ ...state, jar: [...state.jar, { id: uid(), text: clean, date: todayKey() }] });
  return completeIfListed('escrever');
}

// ---------- Perfil, backup e tema ----------

export function completeOnboarding(userName: string, petName: string, petColor: PetColor) {
  set({ ...state, userName: userName.trim(), petName: petName.trim() || 'Xodó', petColor, onboarded: true });
}

export function updateProfile(patch: Partial<Pick<State, 'userName' | 'petName' | 'petColor' | 'theme'>>) {
  set({ ...state, ...patch });
}

export function exportCode(): string {
  const bytes = new TextEncoder().encode(JSON.stringify(state));
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return `XODO1.${btoa(bin)}`;
}

export function importCode(code: string): boolean {
  try {
    const clean = code.trim().replace(/^XODO1\./, '').replace(/\s+/g, '');
    const bin = atob(clean);
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || parsed.v !== 1 || typeof parsed.petName !== 'string') return false;
    set({ ...fresh(), ...parsed });
    return true;
  } catch {
    return false;
  }
}

export function resetAll() {
  set(fresh());
}

/** Dias em que a pessoa fez pelo menos um cuidado. Não existe "sequência perdida". */
export function careDays(s: State): number {
  return Object.values(s.days).filter((d) => d.done.length > 0).length;
}
