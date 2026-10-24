/**
 * Exporta os dados de DEMONSTRAÇÃO para a prévia sem servidor (web/src/preview/data.json).
 * Uso: npm run db:reset && npm run preview:data
 * Datas são gravadas como "milissegundos antes da exportação" e reconstruídas ao abrir a prévia.
 */
import { writeFileSync } from 'node:fs';
import pg from 'pg';
import { env } from '../src/env';

const client = new pg.Client({ connectionString: env.DATABASE_OWNER_URL });
await client.connect();
const now = Date.now();
const ago = (d: Date | null) => (d ? now - new Date(d).getTime() : null);
const q = async (sql: string, p: unknown[] = []) => (await client.query(sql, p)).rows;

const states = await q(`SELECT uf, name, region FROM states ORDER BY name`);
const cities = (await q(`SELECT ibge, name, uf, lat, lon, timezone FROM cities ORDER BY uf, name`)).map((c) => [
  c.ibge, c.name, c.uf, Math.round(c.lat * 1e4) / 1e4, Math.round(c.lon * 1e4) / 1e4, c.timezone === 'America/Sao_Paulo' ? 0 : c.timezone,
]);
const categories = await q(`SELECT id, slug, name, short_name AS "shortName", icon, description, keywords FROM categories ORDER BY sort_order`);
const businesses = (await q(`SELECT * FROM businesses WHERE is_demo ORDER BY name`)).map((b) => ({
  ...b, created_at: ago(b.created_at), updated_at: undefined, hours_updated_at: ago(b.hours_updated_at), verified_at: ago(b.verified_at),
}));
const services = await q(`SELECT id, business_id, name, description, price_type, price_min_cents, price_max_cents, duration_minutes, bookable, notes, sort_order FROM services ORDER BY business_id, sort_order`);
const areas = await q(`SELECT business_id, city_ibge FROM business_service_areas`);
const reviews = (await q(`SELECT r.id, r.business_id, r.author_display_name, r.service_id, r.rating, r.comment, r.aspects, r.created_at
  FROM reviews r JOIN businesses b ON b.id = r.business_id WHERE b.is_demo AND r.status = 'published'`)).map((r) => [
  r.id, r.business_id, r.author_display_name, r.service_id, r.rating, r.comment, Object.keys(r.aspects).length ? r.aspects : 0, ago(r.created_at),
]);
const demo = (await q(`SELECT id, name, email, city_ibge FROM users WHERE email = 'demo@conectalocal.app'`))[0];
const demoBookings = (await q(`SELECT id, business_id, service_id, starts_at, ends_at, status, created_at FROM bookings WHERE user_id = $1`, [demo.id]))
  .map((b) => ({ ...b, starts_at: ago(b.starts_at), ends_at: ago(b.ends_at), created_at: ago(b.created_at) }));
const demoQuotes = (await q(`SELECT id, business_id, service_id, description, preferred_date, contact_preference, status, created_at FROM quote_requests WHERE user_id = $1`, [demo.id]))
  .map((x) => ({ ...x, created_at: ago(x.created_at) }));
const demoFavorites = (await q(`SELECT business_id FROM favorites WHERE user_id = $1`, [demo.id])).map((f) => f.business_id);
const popular: Record<number, Array<{ name: string; requests: number }>> = {};
for (const { city_ibge } of await q(`SELECT DISTINCT city_ibge FROM businesses`)) {
  popular[city_ibge] = await q(`SELECT name, requests::int FROM app.popular_services($1, now() - interval '90 days', 8)`, [city_ibge]);
}
await client.end();

const out = { exportedNote: 'Dados fictícios de demonstração', states, cities, categories, businesses, services, areas, reviews,
  demo: { name: demo.name, email: demo.email, cityIbge: demo.city_ibge, bookings: demoBookings, quotes: demoQuotes, favorites: demoFavorites }, popular };
writeFileSync(new URL('../../web/src/preview/data.json', import.meta.url), JSON.stringify(out));
console.log(`✔ prévia: ${businesses.length} empresas, ${reviews.length} avaliações, ${cities.length} municípios`);
