// Widget da tela do celular (iPhone e Android): o app manda o resumo do dia para o plugin "HamiWidget"
// (plugins/hami-widget), que guarda e pede para o widget se redesenhar. No navegador não faz nada.
import { Capacitor, registerPlugin } from '@capacitor/core';
import { isNativeApp } from './native';
import { dayOf, getState, litersText, todayTasks, waterGoalOf, watchState } from './store';
import { petLine, periodOf } from '../data/lines';
import { streakOf } from '../logic/streak';
import { dayKey } from './util';
import type { State } from '../types';

export interface WidgetData {
  name: string;
  line: string;
  done: number;
  total: number;
  water: string;
  streak: number;
  fur: string;
  updatedAt: number;
}

interface HamiWidgetPlugin {
  update(data: WidgetData): Promise<{ saved: boolean }>;
}
const HamiWidget = registerPlugin<HamiWidgetPlugin>('HamiWidget');

/** Resumo do dia que aparece no widget. */
export function widgetData(s: State, now = new Date()): WidgetData {
  const key = dayKey(now);
  const day = dayOf(s, key);
  const tasks = todayTasks(s, key);
  const done = tasks.filter((t) => t.id in day.done).length;
  return {
    name: s.pet.name || 'Hami',
    line: petLine({ period: periodOf(now), battery: day.battery, done, total: tasks.length, user: s.profile.name, seed: s.seed + now.getDate(), stats: s.pet.stats, sleeping: s.pet.sleeping }),
    done,
    total: tasks.length,
    water: `${litersText(day.water ?? 0)} de ${litersText(waterGoalOf(s))}`,
    streak: streakOf(s.days, key, s.createdAt).count,
    fur: s.pet.fur,
    updatedAt: Date.now(),
  };
}

let last = '';
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
  void push();
  let t: ReturnType<typeof setTimeout> | undefined;
  watchState(() => {
    clearTimeout(t);
    t = setTimeout(() => void push(), 1200);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) void push();
  });
}
