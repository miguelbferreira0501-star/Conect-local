// Lembretes gentis. Com o app aberto: aviso na tela ou notificação do sistema (se permitida).
// Com o app instalado e conta ativa, o servidor manda push no horário escolhido.
import { NOTIFS } from '../data/lines';
import { reminderText } from '../shared/reminders';
import type { NotifKind, State } from '../types';
import { dayOf, todayKey, todayTasks } from './store';

const SENT_KEY = 'hamicare:lembrete';

/** Escolhe o lembrete mais útil agora (sem culpa e sem pressão). */
export function pickReminder(s: State, now = Date.now()): { kind: NotifKind; text: string } | null {
  const k = s.settings.notif.kinds;
  const today = todayKey();
  const pending = todayTasks(s, today).filter((t) => !(t.id in dayOf(s, today).done)).length;
  const pick = (list: string[]) => list[Math.floor(now / 86_400_000) % list.length];
  if (k.aventura && s.adventure && s.adventure.endsAt <= now) return { kind: 'aventura', text: pick(NOTIFS.aventura) };
  if (k.hami && (s.pet.stats.saciedade < 30 || s.pet.stats.felicidade < 30)) return { kind: 'hami', text: pick(NOTIFS.hami) };
  if (k.tarefas && pending > 0) return { kind: 'tarefas', text: pick(NOTIFS.tarefas) };
  if (k.agua) return { kind: 'agua', text: reminderText('agua', s.pet.name, Math.floor(now / 3_600_000)) };
  if (k.missoes) return { kind: 'missoes', text: pick(NOTIFS.missoes) };
  return null;
}

export function permission(): NotificationPermission | 'indisponivel' {
  return typeof Notification === 'undefined' ? 'indisponivel' : Notification.permission;
}

export async function askPermission(): Promise<NotificationPermission | 'indisponivel'> {
  if (typeof Notification === 'undefined') return 'indisponivel';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export async function showNotification(text: string, fallback: (t: string) => void) {
  try {
    if (permission() === 'granted') {
      const reg = await navigator.serviceWorker?.getRegistration?.();
      if (reg) await reg.showNotification('HamiCare', { body: text, icon: 'icon-192.png', tag: 'hamicare' });
      else new Notification('HamiCare', { body: text });
      return;
    }
  } catch {
    /* sem notificação do sistema: usa o aviso na tela */
  }
  fallback(text);
}

/** Confere uma vez por minuto se passou do horário escolhido e ainda não lembrou hoje. */
export function reminderDue(s: State, now = new Date()): boolean {
  if (!s.onboarded || !s.settings.notif.enabled) return false;
  const [h, m] = s.settings.notif.time.split(':').map(Number);
  if (now.getHours() * 60 + now.getMinutes() < h * 60 + m) return false;
  try {
    return localStorage.getItem(SENT_KEY) !== todayKey();
  } catch {
    return false;
  }
}

export function markReminded() {
  try {
    localStorage.setItem(SENT_KEY, todayKey());
  } catch {
    /* sem armazenamento */
  }
}
