import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { env } from './env';
import { AppError } from './lib/errors';
import { type AppEnv, csrfMiddleware, NATIVE_ORIGINS, sessionMiddleware } from './auth';
import { account } from './routes/account';
import { social } from './routes/social';
import { admin } from './routes/admin';
import { push } from './routes/push';
import { game } from './routes/game';
import { legal } from './routes/legal';
import { stores } from './routes/stores';
import { guardian, guardianWebhook } from './routes/guardian';

export function createApp() {
  const app = new Hono<AppEnv>();

  app.use('*', async (c, next) => {
    await next();
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('Referrer-Policy', 'same-origin');
    c.header('X-Frame-Options', 'DENY');
  });

  const api = new Hono<AppEnv>();
  // App da loja: os pedidos saem pelo lado nativo (sem CORS), mas, se algum sair pelo navegador do app,
  // a origem dele é aceita (só ela; o site continua na mesma origem).
  api.use('*', async (c, next) => {
    const origin = c.req.header('origin');
    if (origin && NATIVE_ORIGINS.includes(origin)) {
      c.header('Access-Control-Allow-Origin', origin);
      c.header('Access-Control-Allow-Credentials', 'true');
      c.header('Vary', 'Origin');
      if (c.req.method === 'OPTIONS') {
        c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'content-type, x-requested-with');
        c.header('Access-Control-Max-Age', '600');
        return c.body(null, 204);
      }
    }
    await next();
  });
  api.use('*', sessionMiddleware, csrfMiddleware);
  api.get('/health', (c) => c.json({ ok: true, app: 'hamicare' }));
  api.route('/', account);
  api.route('/social', social);
  api.route('/admin', admin);
  api.route('/push', push);
  api.route('/game', game);
  api.route('/guardiao', guardian);
  api.notFound((c) => c.json({ error: 'nao_encontrado', message: 'Rota não encontrada.' }, 404));
  // Aviso do Mercado Pago (Guardiões): sem cookie e sem CSRF, conferido direto na API do Mercado Pago.
  app.route('/api/guardiao-webhook', guardianWebhook);
  app.route('/api', api);

  app.onError((err, c) => {
    if (err instanceof AppError) return c.json({ error: err.code, message: err.message }, err.status as 400);
    console.error(err);
    return c.json({ error: 'erro_interno', message: 'Algo deu errado do nosso lado. Tente de novo.' }, 500);
  });

  // Política de privacidade e termos (endereços para as lojas de apps).
  app.route('/', legal);
  // Vínculo do app Android com o site e a página para excluir a conta (pedidos das lojas).
  app.route('/', stores);

  // App web compilado (um arquivo + service worker e ícones), servido pelo mesmo processo.
  if (existsSync(env.WEB_DIST)) {
    app.use('/*', serveStatic({ root: env.WEB_DIST }));
    const index = readFileSync(join(env.WEB_DIST, 'index.html'), 'utf8');
    app.get('*', (c) => c.html(index));
  }
  return app;
}
