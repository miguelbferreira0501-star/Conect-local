import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { env } from './env';
import { AppError } from './lib/errors';
import { type AppEnv, csrfMiddleware, sessionMiddleware } from './auth';
import { account } from './routes/account';
import { social } from './routes/social';
import { admin } from './routes/admin';
import { push } from './routes/push';
import { legal } from './routes/legal';

export function createApp() {
  const app = new Hono<AppEnv>();

  app.use('*', async (c, next) => {
    await next();
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('Referrer-Policy', 'same-origin');
    c.header('X-Frame-Options', 'DENY');
  });

  const api = new Hono<AppEnv>();
  api.use('*', sessionMiddleware, csrfMiddleware);
  api.get('/health', (c) => c.json({ ok: true, app: 'hamicare' }));
  api.route('/', account);
  api.route('/social', social);
  api.route('/admin', admin);
  api.route('/push', push);
  api.notFound((c) => c.json({ error: 'nao_encontrado', message: 'Rota não encontrada.' }, 404));
  app.route('/api', api);

  app.onError((err, c) => {
    if (err instanceof AppError) return c.json({ error: err.code, message: err.message }, err.status as 400);
    console.error(err);
    return c.json({ error: 'erro_interno', message: 'Algo deu errado do nosso lado. Tente de novo.' }, 500);
  });

  // Política de privacidade e termos (endereços para as lojas de apps).
  app.route('/', legal);

  // App web compilado (um arquivo + service worker e ícones), servido pelo mesmo processo.
  if (existsSync(env.WEB_DIST)) {
    app.use('/*', serveStatic({ root: env.WEB_DIST }));
    const index = readFileSync(join(env.WEB_DIST, 'index.html'), 'utf8');
    app.get('*', (c) => c.html(index));
  }
  return app;
}
