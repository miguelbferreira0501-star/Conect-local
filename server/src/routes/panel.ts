import { Hono } from 'hono';
import { z } from 'zod';
import { effectivePlan, planIsActive, type PlanId, adminBusinessUpdateSchema, imageUploadSchema, replySchema, requestActionSchema, uuid } from '@conecta/shared';
import pg from 'pg';
import { withUser } from '../db/pool';
import { env } from '../env';
import { AppError, forbidden, notFound, parse } from '../lib/errors';
import { hit } from '../lib/rateLimit';
import { requireAuth } from '../middleware/auth';
import type { AppEnv, Ctx } from '../middleware/context';
import { panelRepo } from '../repositories/panel';
import { usersRepo } from '../repositories/users';
const usersRepoMe = usersRepo.me;
import { panel } from '../services/panel';
import * as pets from '../services/pets';
import * as benefits from '../services/benefits';

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

// Sem assinatura (teste grátis acabou), o painel fica só para leitura: dá para ver o histórico,
// responder pedidos já feitos e assinar (rotas de cobrança ficam em billingRoutes).
panelRoutes.use('/businesses/:businessId/*', async (c, next) => {
  if (c.req.method === 'GET' || /\/requests\//.test(c.req.path)) return next();
  const id = parse(uuid, c.req.param('businessId'));
  const b = await withUser(uid(c), (db) => panelRepo.business(db, id));
  if (b && !b.is_demo && !planIsActive(effectivePlan(b.plan as PlanId, b.plan_until))) {
    throw new AppError(402, 'plan_required', 'Seu teste grátis terminou. Assine o Plano Pataí para voltar a usar o painel.');
  }
  return next();
});

panelRoutes.get('/businesses', async (c) => c.json(await panel.myBusinesses(uid(c))));
/** O teste grátis de 30 dias vale uma vez por conta. */
panelRoutes.get('/trial', async (c) => c.json(await withUser(uid(c), async (db) => {
  const r = (await db.query(`SELECT trial_used_at FROM users WHERE id = app.current_user_id()`)).rows[0];
  return { available: !r?.trial_used_at, days: 30 };
})));
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

// Benefícios: sinal Pix, fidelidade, pacotes e relatórios
const pid = (c: Ctx, name: string) => parse(uuid, c.req.param(name));
panelRoutes.put('/businesses/:businessId/settings', async (c) => c.json(await benefits.saveSettings(uid(c), bid(c), await c.req.json())));
panelRoutes.get('/businesses/:businessId/packages', async (c) => c.json(await benefits.panelPackages(uid(c), bid(c))));
panelRoutes.post('/businesses/:businessId/packages', async (c) => c.json(await benefits.savePackage(uid(c), bid(c), null, await c.req.json()), 201));
panelRoutes.put('/businesses/:businessId/packages/:packageId', async (c) =>
  c.json(await benefits.savePackage(uid(c), bid(c), pid(c, 'packageId'), await c.req.json())));
panelRoutes.delete('/businesses/:businessId/packages/:packageId', async (c) => c.json(await benefits.removePackage(uid(c), bid(c), pid(c, 'packageId'))));
panelRoutes.get('/businesses/:businessId/customer-packages', async (c) => c.json(await benefits.panelCustomerPackages(uid(c), bid(c))));
panelRoutes.post('/businesses/:businessId/customer-packages/:id', async (c) =>
  c.json(await benefits.updateCustomerPackage(uid(c), bid(c), pid(c, 'id'), await c.req.json())));
panelRoutes.post('/businesses/:businessId/bookings/:bookingId/deposit-paid', async (c) =>
  c.json(await benefits.markDepositPaid(uid(c), bid(c), pid(c, 'bookingId'))));
panelRoutes.get('/businesses/:businessId/reports', async (c) => c.json(await benefits.report(uid(c), bid(c), c.req.query('month') || undefined)));

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

// Pet ao Vivo (lado da empresa)
panelRoutes.get('/businesses/:businessId/bookings/:bookingId/live', async (c) => c.json(await pets.listLive(uid(c), parse(uuid, c.req.param('bookingId')))));
panelRoutes.post('/businesses/:businessId/bookings/:bookingId/live', async (c) => {
  if (!hit(`live:${uid(c)}`, 120, 60 * 60_000)) throw new AppError(429, 'rate_limited', 'Muitas atualizações em pouco tempo. Aguarde um pouco.');
  return c.json(await pets.addLive(uid(c), bid(c), parse(uuid, c.req.param('bookingId')), await c.req.json()), 201);
});
panelRoutes.delete('/businesses/:businessId/live/:updateId', async (c) => c.json(await pets.removeLive(uid(c), bid(c), parse(uuid, c.req.param('updateId')))));

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
  if (!(await withUser(uid(c), (db) => panelRepo.isAdmin(db)))) {
    // E-mail listado em ADMIN_EMAILS vira administrador na primeira visita (não precisa reiniciar o servidor).
    const me = await withUser(uid(c), (db) => usersRepoMe(db));
    if (!me || !adminEmails().includes(me.email.trim().toLowerCase())) throw forbidden('Área restrita a administradores.');
    await promoteToAdmin(uid(c));
  }
  await next();
});

function adminEmails() {
  return (env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
}

async function promoteToAdmin(userId: string) {
  const client = new pg.Client({ connectionString: env.DATABASE_OWNER_URL });
  await client.connect();
  try {
    await client.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [userId]);
  } finally {
    await client.end();
  }
}
adminRoutes.get('/me', (c) => c.json({ admin: true }));
adminRoutes.get('/billing-status', async (c) => {
  const { billingSetupStatus, ensureAsaasWebhook } = await import('../services/billing/asaas');
  if (c.req.query('recheck') === '1') await ensureAsaasWebhook((await withUser(uid(c), (db) => usersRepoMe(db)))?.email ?? 'contato@exemplo.com.br');
  return c.json(billingSetupStatus());
});
adminRoutes.post('/billing/pix-key', async (c) => {
  const { createAsaasPixKey } = await import('../services/billing/asaas');
  return c.json(await createAsaasPixKey((await withUser(uid(c), (db) => usersRepoMe(db)))?.email ?? 'contato@exemplo.com.br'));
});
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
