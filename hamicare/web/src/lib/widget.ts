// Widget da tela do celular (iPhone e Android): o app manda o resumo do dia para o plugin "HamiWidget"
// (plugins/hami-widget), que guarda e pede para o widget se redesenhar. No navegador não faz nada.
import { Capacitor, registerPlugin } from '@capacitor/core';
import { isNativeApp } from './native';
import { addWater, dayOf, getState, isPremium, litersText, todayTasks, waterGoalOf, watchState } from './store';
import { AFFIRMATIONS, petLine, periodOf } from '../data/lines';
import { streakOf } from '../logic/streak';
import { addDays, dayDiff, dayKey } from './util';
import type { State } from '../types';

export interface WidgetData {
  name: string;
  line: string;
  done: number;
  total: number;
  water: string;
  streak: number;
  fur: string;
  /** Galeria de widgets: copos de água, lista de tarefas, % do dia, semana, dias juntos, carinho, frases. */
  cups: number;
  cupsGoal: number;
  tasks: { t: string; d: boolean }[];
  pct: number;
  week: { l: string; d: boolean }[];
  together: number;
  love: number;
  affirm: string;
  move: string;
  plus: boolean;
  kid: boolean;
  updatedAt: number;
}

const LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MOVE_TIPS = ['Que tal alongar 5 minutinhos?', 'Uma voltinha de 10 minutos faz bem!', 'Levanta e dança uma música comigo!', 'Respira fundo e estica os braços pro céu.'];

interface HamiWidgetPlugin {
  update(data: WidgetData): Promise<{ saved: boolean }>;
  takePending(): Promise<{ water: number }>;
  pin(o: { kind: string }): Promise<{ ok: boolean }>;
}
const HamiWidget = registerPlugin<HamiWidgetPlugin>('HamiWidget');

/** Resumo do dia que aparece no widget. */
export function widgetData(s: State, now = new Date()): WidgetData {
  const key = dayKey(now);
  const day = dayOf(s, key);
  const tasks = todayTasks(s, key);
  const done = tasks.filter((t) => t.id in day.done).length;
  return {
    name: s.pet.name || 'Lumbi',
    line: petLine({ period: periodOf(now), battery: day.battery, done, total: tasks.length, user: s.profile.name, seed: s.seed + now.getDate(), stats: s.pet.stats, sleeping: s.pet.sleeping }),
    done,
    total: tasks.length,
    water: `${litersText(day.water ?? 0)} de ${litersText(waterGoalOf(s))}`,
    streak: streakOf(s.days, key, s.createdAt).count,
    fur: s.pet.fur,
    cups: day.water ?? 0,
    cupsGoal: waterGoalOf(s),
    tasks: [...tasks].sort((a, b) => Number(a.id in day.done) - Number(b.id in day.done)).slice(0, 5).map((t) => ({ t: t.title, d: t.id in day.done })),
    pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    week: Array.from({ length: 7 }, (_, i) => {
      const k = addDays(key, i - 6);
      return { l: LETTERS[new Date(`${k}T12:00:00`).getDay()], d: Object.keys(s.days[k]?.done ?? {}).length > 0 };
    }),
    together: Math.max(1, dayDiff(s.createdAt.slice(0, 10), key) + 1),
    love: Math.round(s.pet.stats.felicidade),
    affirm: AFFIRMATIONS[Math.floor(now.getTime() / 86_400_000) % AFFIRMATIONS.length],
    move: (() => {
      const next = tasks.find((t) => t.cat === 'fitness' && !(t.id in day.done));
      return next ? `Próxima: ${next.title}` : MOVE_TIPS[now.getDate() % MOVE_TIPS.length];
    })(),
    plus: isPremium(s),
    kid: s.profile.ageGroup === 'ate12',
    updatedAt: Date.now(),
  };
}

let last = '';
/** Copos de água marcados direto no widget: o app soma quando abre. */
async function takePending() {
  try {
    const r = await HamiWidget.takePending();
    if (r.water > 0) addWater(r.water);
  } catch {
    /* plugin antigo: nada a somar */
  }
}

/** Coloca um widget da galeria na tela inicial (Android 8+). */
export async function pinWidget(kind: string): Promise<boolean> {
  if (!isNativeApp() || !Capacitor.isPluginAvailable('HamiWidget')) return false;
  try {
    return (await HamiWidget.pin({ kind })).ok;
  } catch {
    return false;
  }
}

async function push() {
  const s = getState();
  if (!s.onboarded) return;
  const data = widgetData(s);
  const sig = JSON.stringify({ ...data, updatedAt: 0 });
  if (sig === last) return;
  last = sig;
  try {
    await HamiWidget.update(data);
  } catch {
    last = '';
  }
}

/** Liga o widget no app da loja: atualiza ao abrir, quando algo muda (com calma) e ao voltar para o app. */
export function installWidget() {
  if (!isNativeApp() || !Capacitor.isPluginAvailable('HamiWidget')) return;
  void takePending().then(push);
  let t: ReturnType<typeof setTimeout> | undefined;
  watchState(() => {
    clearTimeout(t);
    t = setTimeout(() => void push(), 1200);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) void push();
    else void takePending();
  });
}
