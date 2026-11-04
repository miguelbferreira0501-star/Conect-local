import { createHash, randomBytes } from 'node:crypto';
import type { Context } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { pool } from './db';
import { env } from './env';
import { AppError, unauthorized } from './lib/errors';

export type AppEnv = { Variables: { userId: string | null } };
export const SESSION_COOKIE = 'hc_session';
export const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');

/** Identifica o usuário pela sessão (cookie httpOnly). Não bloqueia visitantes. */
export const sessionMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE);
  let userId: string | null = null;
  if (token && token.length >= 32 && token.length <= 128) {
    const { rows } = await pool.query('SELECT app.auth_session_user($1) AS id', [hashToken(token)]);
    userId = rows[0]?.id ?? null;
  }
  c.set('userId', userId);
  await next();
});

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.get('userId')) throw unauthorized();
  await next();
});

/** Proteção contra CSRF: cabeçalho obrigatório + origem permitida (ou o próprio site). */
const allowed = new Set(env.APP_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean));
export const csrfMiddleware = createMiddleware(async (c, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) return next();
  if (c.req.header('x-requested-with') !== 'hamicare') throw new AppError(403, 'csrf', 'Requisição bloqueada por segurança. Recarregue e tente de novo.');
  const origin = c.req.header('origin');
  if (origin && !allowed.has(origin)) {
    let originHost = '';
    try {
      originHost = new URL(origin).host;
    } catch {
      /* Origin inválido */
    }
    const host = c.req.header('x-forwarded-host') ?? c.req.header('host') ?? new URL(c.req.url).host;
    if (originHost !== host) throw new AppError(403, 'csrf', 'Origem da requisição não permitida.');
  }
  await next();
});

export function newSessionToken() {
  return randomBytes(32).toString('base64url');
}

export function setSessionCookie(c: Context, token: string) {
  setCookie(c, SESSION_COOKIE, token, { httpOnly: true, secure: env.COOKIE_SECURE, sameSite: 'Lax', path: '/', maxAge: env.SESSION_DAYS * 86400 });
}

export function clearSessionCookie(c: Context) {
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
}
