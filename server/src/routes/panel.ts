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
adminRoutes.patch('/businesses/:businessId', async (c) => {
  const { status, verified, reason } = parse(adminBusinessUpdateSchema, await c.req.json());
  await withUser(uid(c), (db) => panelRepo.adminUpdate(db, bid(c), status, verified, reason || null));
  return c.json({ ok: true });
});
