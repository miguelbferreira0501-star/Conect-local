/**
 * Notificações no celular (Web Push). Funciona no navegador, no app instalado e no app da Play Store.
 * As chaves VAPID são geradas no primeiro uso e guardadas no banco (ou vêm de VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY).
 */
import webpush from 'web-push';
import { z } from 'zod';
import { BRAND, LIVE_STAGES, RETURN_AFTER_DAYS, type LiveStage } from '@conecta/shared';
import { pool, query, withUser, type Db } from '../db/pool';
import { env } from '../env';
import { parse } from '../lib/errors';

export interface PushMessage { title: string; body: string; url: string; tag?: string }
interface Target { endpoint: string; p256dh: string; auth: string }

let keys: { publicKey: string; privateKey: string } | null = null;

export async function vapidKeys() {
  if (keys) return keys;
  if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) keys = { publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY };
  else {
    const fresh = webpush.generateVAPIDKeys();
    const stored = (await query<{ v: string }>(`SELECT app.setting_init('vapid', $1) AS v`, [JSON.stringify(fresh)]))[0].v;
    keys = JSON.parse(stored);
  }
  webpush.setVapidDetails(`mailto:${BRAND.supportEmail}`, keys!.publicKey, keys!.privateKey);
  return keys!;
}

/** Envia sem travar quem chamou; aparelhos que não existem mais são esquecidos. */
export async function sendPush(targets: Target[], msg: PushMessage) {
  if (!targets.length) return 0;
  await vapidKeys();
  const payload = JSON.stringify({ ...msg, icon: '/icon-192.png', badge: '/icon-192.png' });
  const results = await Promise.allSettled(targets.map((t) =>
    webpush.sendNotification({ endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } }, payload, { TTL: 60 * 60 * 12, urgency: 'high' })));
  let ok = 0;
  for (const [i, r] of results.entries()) {
    if (r.status === 'fulfilled') ok++;
    else {
      const code = (r.reason as { statusCode?: number })?.statusCode;
      if (code === 404 || code === 410) await query(`SELECT app.push_forget($1)`, [targets[i].endpoint]).catch(() => {});
      else console.error('Push:', code ?? (r.reason as Error)?.message);
    }
  }
  return ok;
}

/** Dispara em segundo plano: notificação nunca derruba a ação principal. */
const later = (fn: () => Promise<unknown>) => { fn().catch((e) => console.error('Push:', (e as Error).message)); };

// ── Aparelhos ──
export const subscriptionSchema = z.object({
  endpoint: z.string().url().max(1000).refine((u) => /^https?:\/\//.test(u), 'Endereço inválido.'),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(4).max(100) }),
});

export async function saveSubscription(userId: string, input: unknown) {
  const s = parse(subscriptionSchema, input);
  await withUser(userId, async (db) => {
    // O mesmo aparelho pode ter sido de outra conta: o banco só deixa apagar o que é seu, então trocamos pelo definer.
    await db.query(`SELECT app.push_forget($1)`, [s.endpoint]);
    await db.query(`INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (app.current_user_id(), $1, $2, $3)`, [s.endpoint, s.keys.p256dh, s.keys.auth]);
  });
  return { ok: true };
}

export async function removeSubscription(userId: string, endpoint: string) {
  await withUser(userId, (db) => db.query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [endpoint]));
  return { ok: true };
}

export async function sendTest(userId: string) {
  const targets = await withUser(userId, (db) => query<Target>(`SELECT endpoint, p256dh, auth FROM push_subscriptions`, [], db));
  const sent = await sendPush(targets, { title: `${BRAND.name}: notificações ativadas`, body: 'Você vai receber os avisos do seu pet por aqui.', url: '/' });
  return { sent };
}

// ── Avisos dos eventos ──
const bookingOwnerTargets = (db: Db, bookingId: string) => query<Target>(`SELECT * FROM app.push_targets_booking_owner($1)`, [bookingId], db);

/** Pet ao Vivo: cada etapa chega no celular do tutor. Chamado com a conexão da empresa. */
export async function notifyLive(db: Db, bookingId: string, stage: LiveStage, note: string | null) {
  const targets = await bookingOwnerTargets(db, bookingId);
  const info = (await query<{ pet: string | null; biz: string }>(
    `SELECT pe.name AS pet, b.name AS biz FROM bookings bk JOIN businesses b ON b.id = bk.business_id LEFT JOIN pets pe ON pe.id = bk.pet_id WHERE bk.id = $1`, [bookingId], db))[0];
  const st = LIVE_STAGES[stage];
  later(() => sendPush(targets, {
    title: `${info?.pet ?? 'Seu pet'}: ${st.label.toLowerCase()}`,
    body: note || `${info?.biz ?? 'A empresa'} atualizou o Pet ao Vivo. Toque para ver.`,
    url: '/atividades', tag: `live-${bookingId}`,
  }));
}

/** Empresa confirmou ou recusou o pedido. */
export async function notifyBookingStatus(db: Db, bookingId: string, status: 'confirmed' | 'declined') {
  const targets = await bookingOwnerTargets(db, bookingId);
  const info = (await query<{ biz: string; svc: string; quando: string }>(
    `SELECT b.name AS biz, s.name AS svc, to_char(bk.starts_at AT TIME ZONE ci.timezone, 'DD/MM "às" HH24:MI') AS quando
     FROM bookings bk JOIN businesses b ON b.id = bk.business_id JOIN cities ci ON ci.ibge = b.city_ibge JOIN services s ON s.id = bk.service_id WHERE bk.id = $1`, [bookingId], db))[0];
  if (!info) return;
  later(() => sendPush(targets, status === 'confirmed'
    ? { title: 'Horário confirmado', body: `${info.svc} em ${info.biz} — ${info.quando}.`, url: '/atividades', tag: `booking-${bookingId}` }
    : { title: 'Pedido não confirmado', body: `${info.biz} não pôde atender ${info.quando}. Que tal outro horário?`, url: '/atividades', tag: `booking-${bookingId}` }));
}

/** Novo pedido para a empresa (agendamento, orçamento ou pacote). Chamado com a conexão de quem pediu. */
export async function notifyBusiness(db: Db, businessId: string, msg: PushMessage) {
  const targets = await query<Target>(`SELECT * FROM app.push_targets_business($1)`, [businessId], db);
  later(() => sendPush(targets, msg));
}

/** Agendador: lembrete na véspera do horário e lembrete de retorno. */
export async function runDueNotifications() {
  const rows = await query<Target & PushMessage & { kind: string }>(`SELECT * FROM app.push_take_due($1)`, [JSON.stringify(RETURN_AFTER_DAYS)], pool);
  let sent = 0;
  for (const r of rows) sent += await sendPush([r], { title: r.title, body: r.body, url: r.url, tag: r.kind });
  return { due: rows.length, sent };
}

export function startPushScheduler() {
  const tick = () => runDueNotifications().then((r) => r.due && console.log(`Lembretes enviados: ${r.sent}/${r.due}`)).catch((e) => console.error('Lembretes:', e.message));
  setTimeout(tick, 60_000);
  setInterval(tick, 15 * 60_000).unref();
}
