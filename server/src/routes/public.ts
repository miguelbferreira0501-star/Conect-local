import { Hono } from 'hono';
import { z } from 'zod';
import { BRAND, ibgeCode, searchQuerySchema, uuid } from '@conecta/shared';
import { withUser } from '../db/pool';
import { env } from '../env';
import { notFound, parse } from '../lib/errors';
import type { AppEnv } from '../middleware/context';
import { locationsRepo } from '../repositories/locations';
import { availability, businessDetail, businessReviews } from '../services/business';
import { categories, discover, search, suggest } from '../services/search';

export const publicRoutes = new Hono<AppEnv>();

const longCache = 'public, max-age=86400, stale-while-revalidate=604800';

publicRoutes.get('/health', (c) => c.json({ ok: true }));

publicRoutes.get('/config', (c) => c.json({ brand: BRAND, demoMode: env.DEMO_MODE }));

publicRoutes.get('/locations/states', async (c) => {
  c.header('Cache-Control', longCache);
  return c.json(await locationsRepo.states());
});

publicRoutes.get('/locations/states/:uf/cities', async (c) => {
  const uf = parse(z.string().regex(/^[A-Za-z]{2}$/, 'UF inválida.'), c.req.param('uf'));
  c.header('Cache-Control', longCache);
  return c.json(await locationsRepo.citiesByUf(uf));
});

publicRoutes.get('/locations/cities/:ibge', async (c) => {
  const city = await locationsRepo.city(parse(ibgeCode, c.req.param('ibge')));
  if (!city) throw notFound('Cidade não encontrada.');
  c.header('Cache-Control', longCache);
  return c.json(city);
});

publicRoutes.get('/locations/nearest', async (c) => {
  const { lat, lon } = parse(z.object({ lat: z.coerce.number().min(-35).max(6), lon: z.coerce.number().min(-75).max(-28) }), c.req.query());
  const city = await locationsRepo.nearest(lat, lon);
  if (!city) throw notFound('Não encontramos uma cidade brasileira para essa localização.');
  return c.json(city);
});

publicRoutes.get('/categories', async (c) => {
  c.header('Cache-Control', 'public, max-age=600');
  return c.json((await categories()).map(({ keywords: _k, ...rest }) => rest));
});

publicRoutes.get('/search', async (c) => c.json(await search(parse(searchQuerySchema, c.req.query()))));

publicRoutes.get('/search/suggest', async (c) => {
  const { city, q } = parse(z.object({ city: ibgeCode, q: z.string().trim().max(60) }), c.req.query());
  return c.json(await suggest(city, q));
});

publicRoutes.get('/discover', async (c) => {
  const { city } = parse(z.object({ city: ibgeCode }), c.req.query());
  return c.json(await discover(city));
});

publicRoutes.get('/businesses/:slug', async (c) => {
  const slug = parse(z.string().regex(/^[a-z0-9-]{1,120}$/, 'Endereço inválido.'), c.req.param('slug'));
  return c.json(await businessDetail(slug, c.get('userId')));
});

publicRoutes.get('/businesses/:id/reviews', async (c) => {
  const id = parse(uuid, c.req.param('id'));
  const q = parse(
    z.object({
      sort: z.enum(['recent', 'highest', 'lowest']).default('recent'),
      page: z.coerce.number().int().min(1).max(500).default(1),
      rating: z.coerce.number().int().min(1).max(5).optional(),
    }),
    c.req.query(),
  );
  return c.json(await businessReviews(id, c.get('userId'), q));
});

publicRoutes.get('/businesses/:id/availability', async (c) => {
  const id = parse(uuid, c.req.param('id'));
  const q = parse(z.object({ serviceId: uuid, date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.') }), c.req.query());
  return c.json(await withUser(null, (db) => availability(db, id, q.serviceId, q.date)));
});
