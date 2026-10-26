import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { z } from 'zod';
import {
  bookingRequestSchema, loginSchema, profileUpdateSchema, quoteRequestSchema, registerSchema, reviewInputSchema,
  reviewReportSchema, reviewUpdateSchema, uuid,
} from '@conecta/shared';
import { withUser } from '../db/pool';
import { env } from '../env';
import { AppError, parse } from '../lib/errors';
import { hit } from '../lib/rateLimit';
import { requireAuth, SESSION_COOKIE } from '../middleware/auth';
import { clientIp, type AppEnv, type Ctx } from '../middleware/context';
import { favoritesRepo } from '../repositories/favorites';
import * as activities from '../services/activities';
import * as pets from '../services/pets';
import * as benefits from '../services/benefits';
import * as auth from '../services/auth';
import { globalMean, scoreRows, toCard } from '../services/cards';
import * as reviews from '../services/reviews';
import { businessesRepo } from '../repositories/businesses';

export const accountRoutes = new Hono<AppEnv>();

const uid = (c: Ctx) => c.get('userId') as string;

function setSession(c: Ctx, session: { token: string; expiresAt: Date }) {
  setCookie(c, SESSION_COOKIE, session.token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'Lax',
    path: '/',
    expires: session.expiresAt,
  });
}

function limit(c: Ctx, name: string, max: number, windowMs: number) {
  if (!hit(`${name}:${clientIp(c)}`, max, windowMs)) {
    throw new AppError(429, 'rate_limited', 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.');
  }
}

// ── Autenticação ──
accountRoutes.post('/auth/register', async (c) => {
  limit(c, 'register', 10, 60 * 60_000);
  const { user, session } = await auth.register(parse(registerSchema, await c.req.json()));
  setSession(c, session);
  return c.json({ user }, 201);
});

accountRoutes.post('/auth/login', async (c) => {
  limit(c, 'login', 10, 10 * 60_000);
  const { user, session } = await auth.login(parse(loginSchema, await c.req.json()));
  setSession(c, session);
  return c.json({ user });
});

accountRoutes.post('/auth/logout', async (c) => {
  const token = getCookie(c, SESSION_COOKIE);
  const userId = c.get('userId');
  if (token && userId) await auth.logout(userId, token);
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
  return c.json({ ok: true });
});

accountRoutes.get('/auth/me', async (c) => {
  const userId = c.get('userId');
  return c.json({ user: userId ? await auth.me(userId) : null });
});

// ── Área logada ──
const me = new Hono<AppEnv>();
me.use('*', requireAuth);

me.patch('/me', async (c) => c.json({ user: await auth.updateProfile(uid(c), parse(profileUpdateSchema, await c.req.json())) }));

me.delete('/me', async (c) => {
  limit(c, 'delete-account', 5, 60 * 60_000);
  const { password } = parse(z.object({ password: z.string().min(1, 'Informe sua senha.') }), await c.req.json());
  await auth.deleteAccount(uid(c), password);
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
  return c.json({ ok: true });
});

me.get('/me/favorites', async (c) => {
  const userId = uid(c);
  const ids = await withUser(userId, (db) => favoritesRepo.ids(db));
  if (ids.length === 0) return c.json([]);
  // Reaproveita o mesmo formato de cartão da busca.
  const rows = (
    await Promise.all(ids.map((id) => businessesRepo.basicById(id).then((b) => (b ? businessesRepo.bySlug(b.slug) : null))))
  ).filter((r): r is NonNullable<typeof r> => !!r);
  const mean = await globalMean();
  return c.json(scoreRows(rows, { q: '', mean }).map((s) => toCard(s)));
});

me.put('/me/favorites/:businessId', async (c) => {
  const id = parse(uuid, c.req.param('businessId'));
  await withUser(uid(c), (db) => favoritesRepo.add(db, id));
  return c.json({ ok: true });
});

me.delete('/me/favorites/:businessId', async (c) => {
  const id = parse(uuid, c.req.param('businessId'));
  await withUser(uid(c), (db) => favoritesRepo.remove(db, id));
  return c.json({ ok: true });
});

me.get('/me/activities', async (c) => c.json(await activities.listActivities(uid(c))));

// Ficha dos pets
me.get('/me/pets', async (c) => c.json(await pets.listPets(uid(c))));
me.post('/me/pets', async (c) => c.json(await pets.savePet(uid(c), null, await c.req.json()), 201));
me.put('/me/pets/:id', async (c) => c.json(await pets.savePet(uid(c), parse(uuid, c.req.param('id')), await c.req.json())));
me.delete('/me/pets/:id', async (c) => c.json(await pets.deletePet(uid(c), parse(uuid, c.req.param('id')))));
me.put('/me/pets/:id/photo', async (c) => {
  const { dataUrl } = parse(z.object({ dataUrl: z.string().max(800_000).nullable() }), await c.req.json());
  return c.json(await pets.setPetPhoto(uid(c), parse(uuid, c.req.param('id')), dataUrl));
});
// Fotos privadas: só quem pode ver a ficha ou o atendimento (regras no banco).
const privateImage = (img: { mime: string; data: Buffer } | null, c: Ctx) => {
  if (!img) throw new AppError(404, 'not_found', 'Imagem não encontrada.');
  return c.body(new Uint8Array(img.data), 200, { 'Content-Type': img.mime, 'Cache-Control': 'private, max-age=86400', 'X-Content-Type-Options': 'nosniff' });
};
me.get('/pets/:id/photo', async (c) => privateImage(await pets.petPhoto(uid(c), parse(uuid, c.req.param('id'))), c));
me.get('/live/:id/photo', async (c) => privateImage(await pets.livePhoto(uid(c), parse(uuid, c.req.param('id'))), c));
// Pet ao Vivo (lado do tutor)
me.get('/bookings/:id/live', async (c) => c.json(await pets.listLive(uid(c), parse(uuid, c.req.param('id')))));

me.get('/me/packages', async (c) => c.json(await benefits.myPackages(uid(c))));
me.post('/me/packages', async (c) => {
  if (!hit(`pkg:${uid(c)}`, 20, 60 * 60_000)) throw new AppError(429, 'rate_limited', 'Muitos pedidos. Aguarde um pouco.');
  return c.json(await benefits.requestPackage(uid(c), await c.req.json()), 201);
});
me.post('/me/packages/:id/cancel', async (c) => c.json(await benefits.cancelMyPackage(uid(c), parse(uuid, c.req.param('id')))));
me.get('/me/reminders', async (c) => c.json(await benefits.reminders(uid(c))));

me.post('/bookings', async (c) => {
  limit(c, 'booking', 20, 60 * 60_000);
  return c.json(await activities.createBooking(uid(c), parse(bookingRequestSchema, await c.req.json())), 201);
});
me.post('/bookings/:id/cancel', async (c) => c.json(await activities.updateBooking(uid(c), parse(uuid, c.req.param('id')), 'cancel')));
me.post('/bookings/:id/cancel-series', async (c) => c.json(await activities.cancelSeries(uid(c), parse(uuid, c.req.param('id')))));
me.post('/bookings/:id/complete', async (c) => c.json(await activities.updateBooking(uid(c), parse(uuid, c.req.param('id')), 'complete')));

me.post('/quotes', async (c) => {
  limit(c, 'quote', 30, 60 * 60_000);
  return c.json(await activities.createQuote(uid(c), parse(quoteRequestSchema, await c.req.json())), 201);
});
me.post('/quotes/:id/hired', async (c) => c.json(await activities.updateQuote(uid(c), parse(uuid, c.req.param('id')), 'hired')));
me.post('/quotes/:id/close', async (c) => c.json(await activities.updateQuote(uid(c), parse(uuid, c.req.param('id')), 'close')));

me.get('/me/reviews', async (c) => c.json(await reviews.myReviews(uid(c))));
me.get('/me/review-eligibility/:businessId', async (c) => c.json(await reviews.eligibility(uid(c), parse(uuid, c.req.param('businessId')))));

me.post('/reviews', async (c) => {
  limit(c, 'review', 10, 60 * 60_000);
  return c.json(await reviews.createReview(uid(c), parse(reviewInputSchema, await c.req.json())), 201);
});
me.patch('/reviews/:id', async (c) => c.json(await reviews.updateReview(uid(c), parse(uuid, c.req.param('id')), parse(reviewUpdateSchema, await c.req.json()))));
me.delete('/reviews/:id', async (c) => c.json(await reviews.deleteReview(uid(c), parse(uuid, c.req.param('id')))));
me.post('/reviews/:id/report', async (c) => {
  limit(c, 'report', 20, 60 * 60_000);
  return c.json(await reviews.reportReview(uid(c), parse(uuid, c.req.param('id')), parse(reviewReportSchema, await c.req.json())));
});

accountRoutes.route('/', me);
