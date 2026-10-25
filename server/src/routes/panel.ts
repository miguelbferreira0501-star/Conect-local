import { Hono } from 'hono';
import { z } from 'zod';
import { adminBusinessUpdateSchema, imageUploadSchema, replySchema, requestActionSchema, uuid } from '@conecta/shared';
import { withUser } from '../db/pool';
import { AppError, forbidden, notFound, parse } from '../lib/errors';
import { hit } from '../lib/rateLimit';
import { requireAuth } from '../middleware/auth';
import type { AppEnv, Ctx } from '../middleware/context';
import { panelRepo } from '../repositories/panel';
import { panel } from '../services/panel';
import { aiEnabled, runAssistant } from '../services/ai';
import { streamSSE } from 'hono/streaming';
import { aiRequestSchema } from '@conecta/shared';

const uid = (c: Ctx) => c.get('userId') as string;
const bid = (c: Ctx) => parse(uuid, c.req.param('businessId'));

/** Imagens públicas (logo, capa, fotos). */
export const imageRoutes = new Hono<AppEnv>();
imageRoutes.get('/images/:id', async (c) => {
  const id = parse(uuid, c.req.param('id'));
  const img = await withUser(null, (db) => panelRepo.image(db, id));
  if (!img) throw notFound('Imagem não encontrada.');
  return c.body(new Uint8Array(img.data), 200, {
    'Content-Type': img.mime,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  });
});

/** Painel das empresas: /api/panel/... */
export const panelRoutes = new Hono<AppEnv>();
panelRoutes.use('*', requireAuth);

panelRoutes.get('/businesses', async (c) => c.json(await panel.myBusinesses(uid(c))));
panelRoutes.post('/businesses', async (c) => {
  if (!hit(`create-biz:${uid(c)}`, 5, 60 * 60_000)) throw new AppError(429, 'rate_limited', 'Muitas tentativas. Aguarde um pouco.');
  return c.json(await panel.create(uid(c), await c.req.json()), 201);
});
panelRoutes.get('/businesses/:businessId', async (c) => c.json(await panel.get(uid(c), bid(c))));
panelRoutes.put('/businesses/:businessId/profile', async (c) => c.json(await panel.updateProfile(uid(c), bid(c), await c.req.json())));
panelRoutes.put('/businesses/:businessId/hours', async (c) => c.json(await panel.updateHours(uid(c), bid(c), await c.req.json())));

panelRoutes.post('/businesses/:businessId/services', async (c) => c.json(await panel.saveService(uid(c), bid(c), null, await c.req.json()), 201));
panelRoutes.put('/businesses/:businessId/services/:serviceId', async (c) =>
  c.json(await panel.saveService(uid(c), bid(c), parse(uuid, c.req.param('serviceId')), await c.req.json())));
panelRoutes.delete('/businesses/:businessId/services/:serviceId', async (c) =>
  c.json(await panel.removeService(uid(c), bid(c), parse(uuid, c.req.param('serviceId')))));

panelRoutes.post('/businesses/:businessId/images', async (c) => {
  if (!hit(`upload:${uid(c)}`, 60, 60 * 60_000)) throw new AppError(429, 'rate_limited', 'Muitos envios de imagem. Aguarde um pouco.');
  const { kind, dataUrl } = parse(imageUploadSchema, await c.req.json());
  return c.json(await panel.uploadImage(uid(c), bid(c), kind, dataUrl), 201);
});
panelRoutes.delete('/businesses/:businessId/images/:kind', async (c) => {
  const kind = parse(z.enum(['logo', 'cover', 'photo']), c.req.param('kind'));
  const imageId = c.req.query('id') ? parse(uuid, c.req.query('id')) : null;
  return c.json(await panel.removeImage(uid(c), bid(c), kind, imageId));
});

panelRoutes.get('/businesses/:businessId/requests', async (c) => c.json(await panel.requests(uid(c), bid(c))));
panelRoutes.post('/businesses/:businessId/requests/:type/:id', async (c) => {
  const type = parse(z.enum(['booking', 'quote']), c.req.param('type'));
  const { action, message } = parse(requestActionSchema, await c.req.json());
  return c.json(await panel.actOnRequest(uid(c), bid(c), type, parse(uuid, c.req.param('id')), action, message));
});

panelRoutes.post('/businesses/:businessId/staff', async (c) => c.json(await panel.saveStaff(uid(c), bid(c), null, await c.req.json()), 201));
panelRoutes.put('/businesses/:businessId/staff/:staffId', async (c) =>
  c.json(await panel.saveStaff(uid(c), bid(c), parse(uuid, c.req.param('staffId')), await c.req.json())));
panelRoutes.delete('/businesses/:businessId/staff/:staffId', async (c) =>
  c.json(await panel.removeStaff(uid(c), bid(c), parse(uuid, c.req.param('staffId')))));

panelRoutes.get('/businesses/:businessId/agenda', async (c) => {
  const { from, days } = parse(z.object({ from: z.string().datetime({ offset: true }).optional(), days: z.coerce.number().int().min(1).max(31).default(7) }), c.req.query());
  return c.json(await panel.agenda(uid(c), bid(c), from ? new Date(from) : new Date(Date.now() - 86_400_000), days));
});

// Assistente de IA (resposta em tempo real via Server-Sent Events)
panelRoutes.get('/ai/status', (c) => c.json({ enabled: aiEnabled() }));
panelRoutes.post('/businesses/:businessId/ai', async (c) => {
  if (!hit(`ai:${uid(c)}`, 30, 60 * 60_000)) throw new AppError(429, 'rate_limited', 'Muitos pedidos ao assistente. Aguarde alguns minutos.');
  const businessId = bid(c);
  const { task, message, reviewId } = parse(aiRequestSchema, await c.req.json());
  return streamSSE(c, async (stream) => {
    try {
      await runAssistant(uid(c), businessId, task, message, reviewId, { onText: (t) => stream.writeSSE({ event: 'text', data: JSON.stringify(t) }) });
      await stream.writeSSE({ event: 'done', data: '{}' });
    } catch (err) {
      const message = err instanceof AppError ? err.message : 'O assistente está indisponível no momento.';
      if (!(err instanceof AppError)) console.error(err);
      await stream.writeSSE({ event: 'error', data: JSON.stringify({ message, code: err instanceof AppError ? err.code : 'internal' }) });
    }
  });
});

panelRoutes.get('/businesses/:businessId/reviews', async (c) => c.json(await panel.reviews(uid(c), bid(c))));
panelRoutes.put('/businesses/:businessId/reviews/:reviewId/reply', async (c) => {
  const { body } = parse(replySchema, await c.req.json());
  return c.json(await panel.reply(uid(c), bid(c), parse(uuid, c.req.param('reviewId')), body));
});
panelRoutes.delete('/businesses/:businessId/reviews/:reviewId/reply', async (c) =>
  c.json(await panel.reply(uid(c), bid(c), parse(uuid, c.req.param('reviewId')), null)));

/** Administração: /api/admin/... (somente usuários com papel admin). */
export const adminRoutes = new Hono<AppEnv>();
adminRoutes.use('*', requireAuth, async (c, next) => {
  if (!(await withUser(uid(c), (db) => panelRepo.isAdmin(db)))) throw forbidden('Área restrita a administradores.');
  await next();
});
adminRoutes.get('/me', (c) => c.json({ admin: true }));
adminRoutes.get('/businesses', async (c) => c.json(await withUser(uid(c), (db) => panelRepo.adminList(db, (c.req.query('q') ?? '').slice(0, 60)))));
adminRoutes.put('/businesses/:businessId/plan', async (c) => {
  const { plan, until } = parse(z.object({ plan: z.enum(['free', 'pro', 'team']), until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional() }), await c.req.json());
  await withUser(uid(c), (db) => panelRepo.adminSetPlan(db, bid(c), plan, until ? new Date(`${until}T23:59:59-03:00`) : null));
  return c.json({ ok: true });
});
adminRoutes.patch('/businesses/:businessId', async (c) => {
  const { status, verified, reason } = parse(adminBusinessUpdateSchema, await c.req.json());
  await withUser(uid(c), (db) => panelRepo.adminUpdate(db, bid(c), status, verified, reason || null));
  return c.json({ ok: true });
});
