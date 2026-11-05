// Lembretes push ao longo do dia (água, Hami, missões, pausa, hora de dormir, passeios) e avisos de amigos.
// Quem decide o que sai e quando é o planejador compartilhado (web/src/shared/reminders.ts):
// no máximo 5 por dia, 1 hora entre eles, nunca de madrugada e sem culpa.
import webpush from 'web-push';
import { pool } from './db';
import { env } from './env';
import { dueReminder, isQuiet, localNow, REMINDER_DEFAULTS, type ReminderKind, type WaterPlan } from '../../web/src/shared/reminders';

let vapid: { publicKey: string; privateKey: string } | null = null;

export async function vapidKeys() {
  if (vapid) return vapid;
  if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) vapid = { publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY };
  else {
    const stored = (await pool.query("SELECT app.get_setting('vapid') AS v")).rows[0].v;
    if (stored) vapid = JSON.parse(stored);
    else {
      const k = webpush.generateVAPIDKeys();
      await pool.query("SELECT app.set_setting('vapid', $1)", [JSON.stringify(k)]);
      vapid = JSON.parse((await pool.query("SELECT app.get_setting('vapid') AS v")).rows[0].v);
    }
  }
  webpush.setVapidDetails(env.VAPID_SUBJECT, vapid!.publicKey, vapid!.privateKey);
  return vapid!;
}

type Sender = (sub: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: string) => Promise<unknown>;
let defaultSender: Sender = (s, p) => webpush.sendNotification(s, p);
/** Nos testes, troca o envio de verdade por um falso. */
export function setPushSender(fn: Sender | null) {
  defaultSender = fn ?? ((s, p) => webpush.sendNotification(s, p));
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

/** Manda para todos os aparelhos da pessoa; inscrições vencidas são apagadas. */
export async function pushTo(userId: string, payload: PushPayload, send: Sender = defaultSender): Promise<number> {
  await vapidKeys();
  const subs = (await pool.query('SELECT * FROM app.subscriptions_of($1)', [userId])).rows;
  let sent = 0;
  for (const s of subs) {
    try {
      await send({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload));
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await pool.query('SELECT app.drop_subscription($1)', [s.endpoint]);
    }
  }
  return sent;
}

function safeLocal(now: Date, tz: string) {
  try {
    return localNow(now, tz);
  } catch {
    return localNow(now, 'America/Sao_Paulo');
  }
}

/** Roda a cada poucos minutos: manda o próximo lembrete de quem tem um na hora. */
export async function sendDueReminders(now = new Date(), send: Sender = defaultSender): Promise<number> {
  const rows = (await pool.query('SELECT * FROM app.reminder_candidates()')).rows;
  let sent = 0;
  for (const r of rows) {
    const { reminder, sent: log } = dueReminder({
      prefs: { enabled: r.enabled, time: r.time, kinds: r.kinds ?? {}, water: r.water as WaterPlan, bedtime: r.bedtime },
      state: r.state,
      sent: r.sent ?? {},
      now: safeLocal(now, r.tz),
      minor: r.minor,
    });
    if (JSON.stringify(log) !== JSON.stringify(r.sent ?? {})) await pool.query('SELECT app.save_reminder_log($1, $2)', [r.user_id, log]);
    if (reminder) sent += await pushTo(r.user_id, { title: reminder.title, body: reminder.body, url: reminder.url, tag: reminder.tag }, send);
  }
  return sent;
}

/** Aviso de amigo (visita, presente, pedido de amizade), se a pessoa quiser e não for de madrugada. */
export async function notifyFriend(userId: string, body: string, url = '/#amigos', now = new Date()): Promise<number> {
  const t = (await pool.query('SELECT * FROM app.notify_target($1)', [userId])).rows[0];
  if (!t?.enabled) return 0;
  const kinds = (t.kinds ?? {}) as Partial<Record<ReminderKind, boolean>>;
  if (!(kinds.amigos ?? REMINDER_DEFAULTS.amigos)) return 0;
  if (isQuiet(safeLocal(now, t.tz).hm, t.minor)) return 0;
  return pushTo(userId, { title: 'HamiCare', body, url, tag: 'hamicare-amigos' });
}
