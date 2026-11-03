// Conta, sessão, backup do estado, teste do Plus e eventos.
import bcrypt from 'bcryptjs';
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { z } from 'zod';
import { pool, withUser } from '../db';
import { env } from '../env';
import { AppError, invalid, notFound } from '../lib/errors';
import { allow } from '../lib/rateLimit';
import { type AppEnv, clearSessionCookie, hashToken, newSessionToken, requireAuth, SESSION_COOKIE, setSessionCookie } from '../auth';

export const account = new Hono<AppEnv>();

const ip = (c: { req: { header: (n: string) => string | undefined } }) => c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'local';

const registerSchema = z.object({
  name: z.string().trim().min(1).max(40),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8, 'A senha precisa de pelo menos 8 caracteres.').max(200),
  ageGroup: z.enum(['ate12', '13a17', '18mais']),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'É preciso aceitar os termos e a política de privacidade.' }) }),
  guardianConsent: z.boolean().optional(),
});

async function openSession(c: Parameters<typeof setSessionCookie>[0], userId: string) {
  const token = newSessionToken();
  await withUser(userId, (db) => db.query(`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + make_interval(days => $3))`, [hashToken(token), userId, env.SESSION_DAYS]));
  setSessionCookie(c, token);
}

export async function me(userId: string) {
  return withUser(userId, async (db) => {
    await db.query('UPDATE users SET last_seen_at = now() WHERE id = $1', [userId]);
    const { rows } = await db.query(
      `SELECT id, email, name, age_group AS "ageGroup", role, premium_until AS "premiumUntil", trial_used AS "trialUsed", banned_at IS NOT NULL AS banned FROM users WHERE id = $1`,
      [userId],
    );
    return rows[0] ?? null;
  });
}

account.post('/auth/register', async (c) => {
  if (!allow(`reg:${ip(c)}`, 10, 3600_000)) throw new AppError(429, 'limite', 'Muitas tentativas. Tente de novo mais tarde.');
  const parsed = registerSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) throw invalid(parsed.error.issues[0]?.message ?? 'Confira os dados.');
  const b = parsed.data;
  if (b.ageGroup === 'ate12' && !b.guardianConsent) throw invalid('Para menores de 13 anos, um adulto responsável precisa autorizar.');
  const hash = await bcrypt.hash(b.password, 10);
  let id: string;
  try {
    id = (await pool.query('SELECT app.register_user($1, $2, $3, $4) AS id', [b.email, hash, b.name, b.ageGroup])).rows[0].id;
  } catch (e) {
    if ((e as { code?: string }).code === '23505') throw new AppError(409, 'email_em_uso', 'Já existe uma conta com esse e-mail. Tente entrar.');
    throw e;
  }
  const admins = (env.ADMIN_EMAILS ?? '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
  if (admins.includes(b.email)) await pool.query('SELECT app.promote_admins($1)', [[b.email]]);
  await openSession(c, id);
  return c.json({ user: await me(id) }, 201);
});

account.post('/auth/login', async (c) => {
  const body = z.object({ email: z.string().trim().toLowerCase(), password: z.string() }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw invalid('Informe e-mail e senha.');
  if (!allow(`login:${ip(c)}:${body.data.email}`, 8, 15 * 60_000)) throw new AppError(429, 'limite', 'Muitas tentativas. Espere alguns minutos.');
  const row = (await pool.query('SELECT * FROM app.login_lookup($1)', [body.data.email])).rows[0];
  const ok = row && (await bcrypt.compare(body.data.password, row.password_hash));
  if (!ok) throw new AppError(401, 'credenciais', 'E-mail ou senha não conferem.');
  if (row.banned) throw new AppError(403, 'banido', 'Esta conta foi suspensa por desrespeitar as regras da comunidade.');
  await openSession(c, row.id);
  return c.json({ user: await me(row.id) });
});

account.post('/auth/logout', async (c) => {
  const token = getCookie(c, SESSION_COOKIE);
  const userId = c.get('userId');
  if (token && userId) await withUser(userId, (db) => db.query('DELETE FROM sessions WHERE token_hash = $1', [hashToken(token)]));
  clearSessionCookie(c);
  return c.json({ ok: true });
});

account.get('/auth/me', async (c) => {
  const userId = c.get('userId');
  return c.json({ user: userId ? await me(userId) : null });
});

/** Exclui a conta e tudo ligado a ela (cascata no banco). Pede a senha de novo. */
account.delete('/account', requireAuth, async (c) => {
  const userId = c.get('userId')!;
  const { password } = await c.req.json().catch(() => ({}));
  const user = await me(userId);
  const row = (await pool.query('SELECT * FROM app.login_lookup($1)', [user.email])).rows[0];
  if (!row || !(await bcrypt.compare(String(password ?? ''), row.password_hash))) throw new AppError(401, 'credenciais', 'Senha incorreta.');
  await withUser(userId, (db) => db.query('DELETE FROM users WHERE id = $1', [userId]));
  clearSessionCookie(c);
  return c.json({ ok: true });
});

// ---------- Backup do estado (salvamento automático e recuperação) ----------

account.get('/state', requireAuth, async (c) => {
  const row = await withUser(c.get('userId'), (db) => db.query('SELECT state, client_updated_at FROM user_state WHERE user_id = app.current_user_id()').then((r) => r.rows[0]));
  return c.json({ state: row?.state ?? null, clientUpdatedAt: row ? Number(row.client_updated_at) : null });
});

account.put('/state', requireAuth, async (c) => {
  const raw = await c.req.text();
  if (raw.length > 3_000_000) throw invalid('Backup grande demais.');
  const body = z.object({ state: z.record(z.unknown()), clientUpdatedAt: z.number().int().positive() }).safeParse(JSON.parse(raw || '{}'));
  if (!body.success || body.data.state.v !== 2) throw invalid('Backup inválido.');
  await withUser(c.get('userId'), (db) =>
    db.query(
      `INSERT INTO user_state (user_id, state, client_updated_at) VALUES (app.current_user_id(), $1, $2)
       ON CONFLICT (user_id) DO UPDATE SET state = EXCLUDED.state, client_updated_at = EXCLUDED.client_updated_at, updated_at = now()`,
      [body.data.state, body.data.clientUpdatedAt],
    ),
  );
  return c.json({ ok: true });
});

// ---------- HamiCare+ ----------

account.post('/plus/trial', requireAuth, async (c) => {
  const until = await withUser(c.get('userId'), (db) => db.query('SELECT app.start_trial() AS until').then((r) => r.rows[0]?.until));
  if (!until) throw new AppError(409, 'teste_usado', 'O teste grátis já foi usado nesta conta.');
  return c.json({ premiumUntil: until });
});

// ---------- Eventos e missões especiais ----------

account.get('/events', requireAuth, async (c) => {
  const rows = await withUser(c.get('userId'), (db) =>
    db
      .query(
        `SELECT e.id, e.title, e.description, e.starts_on AS "startsOn", e.ends_on AS "endsOn", e.reward_coins AS "rewardCoins", e.item_id AS "itemId",
          EXISTS (SELECT 1 FROM event_claims x WHERE x.event_id = e.id AND x.user_id = app.current_user_id()) AS claimed
         FROM events e WHERE current_date BETWEEN e.starts_on AND e.ends_on ORDER BY e.ends_on`,
      )
      .then((r) => r.rows),
  );
  return c.json({ events: rows });
});

account.post('/events/:id/claim', requireAuth, async (c) => {
  const id = c.req.param('id');
  const ev = await withUser(c.get('userId'), async (db) => {
    const e = (await db.query('SELECT reward_coins, item_id FROM events WHERE id = $1 AND current_date BETWEEN starts_on AND ends_on', [id])).rows[0];
    if (!e) return null;
    const ins = await db.query('INSERT INTO event_claims (event_id, user_id) VALUES ($1, app.current_user_id()) ON CONFLICT DO NOTHING', [id]);
    return ins.rowCount ? { coins: e.reward_coins, itemId: e.item_id } : 'ja';
  });
  if (!ev) throw notFound('Evento não encontrado ou encerrado.');
  if (ev === 'ja') throw new AppError(409, 'ja_resgatado', 'Você já pegou essa recompensa.');
  return c.json({ reward: ev });
});

