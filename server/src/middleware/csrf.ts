import { createMiddleware } from 'hono/factory';
import { env } from '../env';
import { AppError } from '../lib/errors';

const allowed = new Set(env.APP_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean));

/**
 * Proteção contra CSRF para requisições que alteram dados:
 *  - cookie de sessão com SameSite=Lax;
 *  - cabeçalho X-Requested-With obrigatório (formulários de outros sites não conseguem enviá-lo);
 *  - Origin, quando enviado, precisa estar na lista de origens permitidas.
 */
export const csrfMiddleware = createMiddleware(async (c, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) return next();
  if (c.req.header('x-requested-with') !== 'conecta') {
    throw new AppError(403, 'csrf', 'Requisição bloqueada por segurança. Recarregue a página e tente novamente.');
  }
  const origin = c.req.header('origin');
  if (origin && !allowed.has(origin)) {
    // Mesmo site: o host do Origin é o host da requisição (funciona atrás de proxy HTTPS, como no Render).
    let originHost = '';
    try { originHost = new URL(origin).host; } catch { /* Origin inválido */ }
    const host = c.req.header('x-forwarded-host') ?? c.req.header('host') ?? new URL(c.req.url).host;
    if (originHost !== host) throw new AppError(403, 'csrf', 'Origem da requisição não permitida.');
  }
  await next();
});
