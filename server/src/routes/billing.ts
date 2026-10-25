import { Hono } from 'hono';
import { checkoutSchema, uuid } from '@conecta/shared';
import { AppError, parse } from '../lib/errors';
import { hit } from '../lib/rateLimit';
import { requireAuth } from '../middleware/auth';
import type { AppEnv, Ctx } from '../middleware/context';
import { billing } from '../services/billing';

const uid = (c: Ctx) => c.get('userId') as string;
const bid = (c: Ctx) => parse(uuid, c.req.param('businessId'));

/** /api/panel/businesses/:businessId/billing... (dono/gerente) */
export const billingRoutes = new Hono<AppEnv>();
billingRoutes.use('*', requireAuth);
billingRoutes.get('/businesses/:businessId/billing', async (c) => c.json(await billing.status(uid(c), bid(c))));
billingRoutes.post('/businesses/:businessId/billing/checkout', async (c) => {
  if (!hit(`checkout:${uid(c)}`, 10, 60 * 60_000)) throw new AppError(429, 'rate_limited', 'Muitas tentativas. Aguarde alguns minutos.');
  const input = parse(checkoutSchema, await c.req.json());
  return c.json(await billing.checkout(uid(c), bid(c), input), 201);
});
billingRoutes.post('/businesses/:businessId/billing/cancel', async (c) => c.json(await billing.cancel(uid(c), bid(c))));

/** Aviso (webhook) da Asaas — servidor para servidor, autenticado pelo token configurado na Asaas. */
export const webhookRoutes = new Hono<AppEnv>();
webhookRoutes.post('/webhooks/asaas', async (c) => {
  if (!billing.verifyWebhookToken(c.req.header('asaas-access-token'))) return c.json({ error: 'unauthorized' }, 401);
  const result = await billing.handleWebhook(await c.req.json());
  return c.json({ ok: true, result });
});
