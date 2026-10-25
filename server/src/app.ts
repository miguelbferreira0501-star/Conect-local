import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { secureHeaders } from 'hono/secure-headers';
import { env } from './env';
import { AppError } from './lib/errors';
import { sessionMiddleware } from './middleware/auth';
import type { AppEnv } from './middleware/context';
import { csrfMiddleware } from './middleware/csrf';
import { accountRoutes } from './routes/account';
import { adminRoutes, imageRoutes, panelRoutes } from './routes/panel';
import { billingRoutes, webhookRoutes } from './routes/billing';
import { publicRoutes } from './routes/public';
import { bodyLimit } from 'hono/body-limit';

export function createApp() {
  const app = new Hono<AppEnv>();

  app.use(
    '*',
    secureHeaders({
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'data:'],
        frameAncestors: ["'none'"],
      },
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy: { geolocation: ['self'], camera: [], microphone: [] },
    }),
  );

  // Digital Asset Links: prova ao Android que o app da Play Store e este site são do mesmo dono
  // (permite abrir o site em tela cheia, sem barra de navegador, dentro do app).
  app.get('/.well-known/assetlinks.json', (c) => {
    const fingerprints = (env.ANDROID_CERT_SHA256 ?? '').split(',').map((f) => f.trim().toUpperCase()).filter(Boolean);
    if (!env.ANDROID_PACKAGE_NAME || fingerprints.length === 0) return c.json([]);
    return c.json([
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: { namespace: 'android_app', package_name: env.ANDROID_PACKAGE_NAME, sha256_cert_fingerprints: fingerprints },
      },
    ]);
  });

  // Avisos de pagamento chegam de outro servidor: sem sessão nem cabeçalho anti-CSRF (autenticados por token).
  app.route('/api', webhookRoutes);

  const api = new Hono<AppEnv>();
  api.use('*', bodyLimit({ maxSize: 1024 * 1024, onError: (c) => c.json({ error: { code: 'too_large', message: 'Envio muito grande (máximo de 1 MB).' } }, 413) }));
  api.use('*', sessionMiddleware, csrfMiddleware);
  api.route('/', imageRoutes);
  api.route('/panel', billingRoutes);
  api.route('/panel', panelRoutes);
  api.route('/admin', adminRoutes);
  api.route('/', publicRoutes);
  api.route('/', accountRoutes);
  api.notFound((c) => c.json({ error: { code: 'not_found', message: 'Rota não encontrada.' } }, 404));
  app.route('/api', api);

  app.onError((err, c) => {
    if (err instanceof AppError) {
      return c.json({ error: { code: err.code, message: err.message, fields: err.fields } }, err.status);
    }
    const pgErr = err as { code?: string; message?: string };
    if (pgErr.code === '23505') {
      return c.json({ error: { code: 'conflict', message: 'Este registro já existe ou o horário acabou de ser ocupado.' } }, 409);
    }
    if (pgErr.code === 'P0001' && pgErr.message?.startsWith('review_activity')) {
      return c.json({ error: { code: 'not_eligible', message: 'Você só pode avaliar contratações realizadas.' } }, 403);
    }
    if (err instanceof SyntaxError) {
      return c.json({ error: { code: 'bad_request', message: 'Dados enviados em formato inválido.' } }, 400);
    }
    console.error(err);
    return c.json({ error: { code: 'internal', message: 'Algo deu errado do nosso lado. Tente novamente em instantes.' } }, 500);
  });

  // Em produção, o mesmo processo serve o front-end compilado (PWA).
  const webDist = resolve(process.cwd(), env.WEB_DIST);
  const indexPath = resolve(webDist, 'index.html');
  if (existsSync(indexPath)) {
    app.use('/assets/*', async (c, next) => {
      await next();
      if (c.res.status === 200) c.header('Cache-Control', 'public, max-age=31536000, immutable');
    });
    app.use('*', serveStatic({ root: env.WEB_DIST }));
    // Arquivo estático inexistente: 404 de verdade (não devolve o HTML do app).
    app.get('/assets/*', (c) => c.text('Não encontrado', 404));
    // Rotas do app (SPA): lê o index.html a cada requisição para nunca servir uma versão antiga após um novo build.
    app.get('*', (c) => {
      c.header('Cache-Control', 'no-cache');
      return c.html(readFileSync(indexPath, 'utf8'));
    });
  }

  return app;
}
