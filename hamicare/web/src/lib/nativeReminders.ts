// Lembretes no app da loja (iPhone/Android): agendados no próprio celular, chegam mesmo com o app fechado
// e sem internet. Reagendados quando o app abre e quando algo muda (horários, missões feitas, nome do Hami).
import { LocalNotifications } from '@capacitor/local-notifications';
import { planDay } from '../shared/reminders';
import { isNativeApp } from './native';
import { dayOf, getState, todayKey, todayTasks, watchState } from './store';
import type { State } from '../types';

/** Quantos dias para frente ficam agendados (o app reagenda sempre que abre). */
const DAYS_AHEAD = 4;
let perm: 'granted' | 'denied' | 'default' = 'default';

export const nativePermission = () => perm;

export async function askNativePermission(): Promise<'granted' | 'denied' | 'default'> {
  try {
    const r = await LocalNotifications.requestPermissions();
    perm = r.display === 'granted' ? 'granted' : r.display === 'denied' ? 'denied' : 'default';
  } catch {
    perm = 'denied';
  }
  return perm;
}

async function refreshPermission() {
  try {
    const r = await LocalNotifications.checkPermissions();
    perm = r.display === 'granted' ? 'granted' : r.display === 'denied' ? 'denied' : 'default';
  } catch {
    /* sem o plugin: fica como está */
  }
}

/** Monta a lista de notificações dos próximos dias (pura, para conferir nos testes). */
export function plannedNotifications(s: State, now = new Date()) {
  const n = s.settings.notif;
  if (!s.onboarded || !n.enabled) return [];
  const prefs = { enabled: true, time: n.time, bedtime: n.bedtime ?? '22:00', water: n.water ?? 'normal', kinds: n.kinds };
  const minor = s.profile.ageGroup !== '18mais';
  const today = todayKey();
  const allDone = todayTasks(s, today).every((t) => t.id in dayOf(s, today).done);
  const out: { id: number; title: string; body: string; schedule: { at: Date; allowWhileIdle: boolean } }[] = [];
  for (let d = 0; d < DAYS_AHEAD; d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
    const plan = planDay({ prefs, pet: s.pet.name || 'Hami', weekday: day.getDay(), minor, seed: Math.floor(day.getTime() / 86_400_000), skipTasks: d === 0 && allDone });
    plan.forEach((p, i) => {
      const [h, m] = p.at.split(':').map(Number);
      const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
      if (at.getTime() > now.getTime() + 30_000) out.push({ id: (d + 1) * 100 + i, title: 'HamiCare', body: p.body, schedule: { at, allowWhileIdle: true } });
    });
  }
  return out;
}

let last = '';
export async function scheduleNativeReminders(s: State = getState()) {
  if (!isNativeApp()) return;
  await refreshPermission();
  const list = perm === 'granted' ? plannedNotifications(s) : [];
  const sig = JSON.stringify(list.map((n) => [n.id, n.schedule.at.getTime(), n.body]));
  if (sig === last) return;
  last = sig;
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map((x) => ({ id: x.id })) });
    if (list.length) await LocalNotifications.schedule({ notifications: list });
  } catch {
    last = '';
  }
}

/** Liga os lembretes do app da loja: agenda ao abrir e reagenda (com calma) quando o estado muda. */
export function installNativeReminders() {
  if (!isNativeApp()) return;
  void scheduleNativeReminders();
  let t: ReturnType<typeof setTimeout> | undefined;
  watchState(() => {
    clearTimeout(t);
    t = setTimeout(() => void scheduleNativeReminders(), 1500);
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void scheduleNativeReminders();
  });
}
