// Lembretes push: um por dia, no horário escolhido (no fuso da pessoa), sem culpa e sem pressão.
import webpush from 'web-push';
import { pool } from './db';
import { env } from './env';
import { NOTIFS } from '../../web/src/data/lines';

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

type Kinds = Partial<Record<'tarefas' | 'hami' | 'missoes' | 'aventura' | 'amigos', boolean>>;

/** Escolhe a mensagem pelo estado salvo (o mesmo critério do app). */
export function reminderFor(state: any, kinds: Kinds, now: Date): string | null {
  const on = (k: keyof Kinds) => kinds[k] !== false;
  const pick = (list: string[]) => list[Math.floor(now.getTime() / 86_400_000) % list.length];
  if (on('aventura') && state?.adventure && state.adventure.endsAt <= now.getTime()) return pick(NOTIFS.aventura);
  const stats = state?.pet?.stats;
  if (on('hami') && stats && (stats.saciedade < 30 || stats.felicidade < 30)) return pick(NOTIFS.hami);
  if (on('tarefas')) return pick(NOTIFS.tarefas);
  if (on('missoes')) return pick(NOTIFS.missoes);
  return null;
}

type Sender = (sub: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: string) => Promise<unknown>;

export async function sendDueReminders(now = new Date(), send: Sender = (s, p) => webpush.sendNotification(s, p)): Promise<number> {
  await vapidKeys();
  const due = (await pool.query('SELECT * FROM app.due_reminders($1)', [now])).rows;
  let sent = 0;
  for (const d of due) {
    const text = reminderFor(d.state, d.kinds ?? {}, now);
    await pool.query('SELECT app.mark_reminded($1, $2)', [d.user_id, now]);
    if (!text) continue;
    const subs = (await pool.query('SELECT * FROM app.subscriptions_of($1)', [d.user_id])).rows;
    for (const s of subs) {
      try {
        await send({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ title: 'HamiCare', body: text }));
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await pool.query('SELECT app.drop_subscription($1)', [s.endpoint]);
      }
    }
  }
  return sent;
}
