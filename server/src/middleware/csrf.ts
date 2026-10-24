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
    const self = new URL(c.req.url).origin;
    if (origin !== self) throw new AppError(403, 'csrf', 'Origem da requisição não permitida.');
  }
  await next();
});
