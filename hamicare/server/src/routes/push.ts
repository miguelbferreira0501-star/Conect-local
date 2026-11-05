import { Hono } from 'hono';
import { z } from 'zod';
import { withUser } from '../db';
import { invalid } from '../lib/errors';
import { type AppEnv, requireAuth } from '../auth';
import { vapidKeys } from '../push';

export const push = new Hono<AppEnv>();
push.use('*', requireAuth);

push.get('/key', async (c) => c.json({ publicKey: (await vapidKeys()).publicKey }));

push.post('/subscribe', async (c) => {
  const body = z.object({ endpoint: z.string().url().max(1000), keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }) }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw invalid('Inscrição inválida.');
  const b = body.data;
  await withUser(c.get('userId'), (db) =>
    db.query(
      `INSERT INTO push_subscriptions (endpoint, user_id, p256dh, auth) VALUES ($1, app.current_user_id(), $2, $3)
       ON CONFLICT (endpoint) DO UPDATE SET p256dh = $2, auth = $3`,
      [b.endpoint, b.keys.p256dh, b.keys.auth],
    ),
  );
  return c.json({ ok: true }, 201);
});

push.delete('/subscribe', async (c) => {
  const { endpoint } = await c.req.json().catch(() => ({}));
  await withUser(c.get('userId'), (db) => db.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [String(endpoint ?? '')]));
  return c.json({ ok: true });
});

push.put('/prefs', async (c) => {
  const body = z
    .object({
      enabled: z.boolean(),
      time: z.string().regex(/^[0-2]\d:[0-5]\d$/),
      tz: z.string().max(60).default('America/Sao_Paulo'),
      kinds: z.record(z.boolean()).default({}),
      water: z.enum(['pouco', 'normal', 'muito']).default('normal'),
      bedtime: z.string().regex(/^[0-2]\d:[0-5]\d$/).default('22:00'),
    })
    .safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw invalid('Preferências inválidas.');
  const b = body.data;
  let tz = b.tz;
  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone: tz });
  } catch {
    tz = 'America/Sao_Paulo';
  }
  await withUser(c.get('userId'), (db) =>
    db.query(
      `INSERT INTO push_prefs (user_id, enabled, time, tz, kinds, water, bedtime) VALUES (app.current_user_id(), $1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET enabled = $1, time = $2, tz = $3, kinds = $4, water = $5, bedtime = $6`,
      [b.enabled, b.time, tz, b.kinds, b.water, b.bedtime],
    ),
  );
  return c.json({ ok: true });
});
