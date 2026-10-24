import { createHash } from 'node:crypto';
import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { pool } from '../db/pool';
import { unauthorized } from '../lib/errors';
import type { AppEnv } from './context';

export const SESSION_COOKIE = 'cl_session';
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/** Identifica o usuário pela sessão (cookie httpOnly). Não bloqueia visitantes. */
export const sessionMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE);
  let userId: string | null = null;
  if (token && token.length >= 32 && token.length <= 128) {
    const { rows } = await pool.query('SELECT app.auth_session_user($1) AS user_id', [hashToken(token)]);
    userId = rows[0]?.user_id ?? null;
  }
  c.set('userId', userId);
  await next();
});

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.get('userId')) throw unauthorized();
  await next();
});
