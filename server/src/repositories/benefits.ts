/** Clube de pacotes, cartão fidelidade, lembretes de retorno e relatórios. */
import { query, type Db } from '../db/pool';

const PKG_COLS = `p.id, p.service_id AS "serviceId", s.name AS "serviceName", p.name, p.sessions, p.price_cents AS "priceCents",
  p.validity_days AS "validityDays", p.active,
  CASE WHEN s.price_type IN ('fixed', 'from') THEN s.price_min_cents END AS "singlePriceCents"`;

export const benefitsRepo = {
  setSettings: (db: Db, businessId: string, pixKey: string | null, loyaltyEvery: number | null) =>
    query(`UPDATE businesses SET pix_key = $2, loyalty_every = $3, updated_at = now() WHERE id = $1 RETURNING id`, [businessId, pixKey, loyaltyEvery], db),

  packages: (db: Db, businessId: string, onlyActive: boolean) =>
    query(`SELECT ${PKG_COLS} FROM packages p JOIN services s ON s.id = p.service_id
           WHERE p.business_id = $1 ${onlyActive ? 'AND p.active AND s.active' : ''} ORDER BY p.created_at`, [businessId], db),

  package: async (db: Db, id: string) =>
    (await query<{ id: string; business_id: string; service_id: string; sessions: number; price_cents: number; validity_days: number; active: boolean }>(
      `SELECT id, business_id, service_id, sessions, price_cents, validity_days, active FROM packages WHERE id = $1`, [id], db))[0] ?? null,

  insertPackage: async (db: Db, businessId: string, v: { serviceId: string; name: string; sessions: number; priceCents: number; validityDays: number; active: boolean }) =>
    (await query<{ id: string }>(
      `INSERT INTO packages (business_id, service_id, name, sessions, price_cents, validity_days, active) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [businessId, v.serviceId, v.name, v.sessions, v.priceCents, v.validityDays, v.active], db))[0].id,

  updatePackage: (db: Db, businessId: string, id: string, v: { serviceId: string; name: string; sessions: number; priceCents: number; validityDays: number; active: boolean }) =>
    query(`UPDATE packages SET service_id = $3, name = $4, sessions = $5, price_cents = $6, validity_days = $7, active = $8
           WHERE id = $2 AND business_id = $1 RETURNING id`, [businessId, id, v.serviceId, v.name, v.sessions, v.priceCents, v.validityDays, v.active], db),

  /** Pacotes já vendidos ficam no histórico: apagar vira desativar. */
  removePackage: async (db: Db, businessId: string, id: string) => {
    const sold = (await query(`SELECT 1 FROM customer_packages WHERE package_id = $1 LIMIT 1`, [id], db)).length;
    return sold
      ? query(`UPDATE packages SET active = false WHERE id = $2 AND business_id = $1 RETURNING id`, [businessId, id], db)
      : query(`DELETE FROM packages WHERE id = $2 AND business_id = $1 RETURNING id`, [businessId, id], db);
  },

  serviceBelongs: async (db: Db, businessId: string, serviceId: string) =>
    (await query(`SELECT 1 FROM services WHERE id = $1 AND business_id = $2`, [serviceId, businessId], db)).length > 0,

  requestPackage: async (db: Db, p: { packageId: string; businessId: string; petId: string | null; sessions: number; priceCents: number }) =>
    (await query<{ id: string }>(
      `INSERT INTO customer_packages (package_id, business_id, user_id, pet_id, sessions, price_cents)
       VALUES ($1, $2, app.current_user_id(), $3, $4, $5) RETURNING id`, [p.packageId, p.businessId, p.petId, p.sessions, p.priceCents], db))[0].id,

  openRequestFor: async (db: Db, packageId: string) =>
    (await query(`SELECT 1 FROM customer_packages WHERE package_id = $1 AND user_id = app.current_user_id() AND status = 'requested'`, [packageId], db)).length > 0,

  myPackages: (db: Db) =>
    query(
      `SELECT cp.id, p.name, p.service_id AS "serviceId", s.name AS "serviceName",
         json_build_object('id', b.id, 'slug', b.slug, 'name', b.name, 'pixKey', b.pix_key, 'city', ci.name) AS business,
         cp.sessions, cp.sessions - coalesce(u.used, 0) AS remaining, cp.price_cents AS "priceCents", cp.status,
         cp.expires_at AS "expiresAt", cp.created_at AS "createdAt", pe.name AS "petName"
       FROM customer_packages cp
       JOIN packages p ON p.id = cp.package_id JOIN services s ON s.id = p.service_id
       JOIN businesses b ON b.id = cp.business_id JOIN cities ci ON ci.ibge = b.city_ibge
       LEFT JOIN pets pe ON pe.id = cp.pet_id
       LEFT JOIN LATERAL (SELECT count(*)::int AS used FROM bookings bk WHERE bk.customer_package_id = cp.id AND bk.status NOT IN ('cancelled', 'declined')) u ON true
       WHERE cp.user_id = app.current_user_id() AND cp.status <> 'cancelled'
       ORDER BY cp.created_at DESC`, [], db),

  cancelMyRequest: (db: Db, id: string) =>
    query(`UPDATE customer_packages SET status = 'cancelled' WHERE id = $1 AND user_id = app.current_user_id() AND status = 'requested' RETURNING id`, [id], db),

  panelCustomerPackages: (db: Db, businessId: string) =>
    query(
      `SELECT cp.id, p.name AS "packageName", u.name AS "customerName", u.phone AS "customerPhone", pe.name AS "petName",
         cp.sessions, coalesce(used.n, 0) AS used, cp.price_cents AS "priceCents", cp.status, cp.expires_at AS "expiresAt", cp.created_at AS "createdAt"
       FROM customer_packages cp
       JOIN packages p ON p.id = cp.package_id
       LEFT JOIN LATERAL app.business_customer(cp.business_id, cp.user_id) u ON true
       LEFT JOIN pets pe ON pe.id = cp.pet_id
       LEFT JOIN LATERAL (SELECT count(*)::int AS n FROM bookings bk WHERE bk.customer_package_id = cp.id AND bk.status NOT IN ('cancelled', 'declined')) used ON true
       WHERE cp.business_id = $1 AND (cp.status <> 'cancelled' OR cp.created_at > now() - interval '30 days')
       ORDER BY (cp.status = 'requested') DESC, cp.created_at DESC LIMIT 200`, [businessId], db),

  setCustomerPackage: (db: Db, businessId: string, id: string, action: 'activate' | 'cancel') =>
    action === 'activate'
      ? query(
        `UPDATE customer_packages cp SET status = 'active', activated_at = now(), expires_at = now() + make_interval(days => p.validity_days)
         FROM packages p WHERE p.id = cp.package_id AND cp.id = $2 AND cp.business_id = $1 AND cp.status = 'requested' RETURNING cp.id`, [businessId, id], db)
      : query(`UPDATE customer_packages SET status = 'cancelled' WHERE id = $2 AND business_id = $1 AND status <> 'cancelled' RETURNING id`, [businessId, id], db),

  setDepositPaid: (db: Db, businessId: string, bookingId: string) =>
    query(`UPDATE bookings SET deposit_status = 'paid', updated_at = now() WHERE id = $2 AND business_id = $1 AND deposit_status = 'pending' RETURNING id`,
      [businessId, bookingId], db),

  /** Atendimentos concluídos do tutor nesta empresa (para o cartão fidelidade). */
  myVisits: async (db: Db, businessId: string) =>
    (await query<{ n: number }>(
      `SELECT count(*)::int AS n FROM bookings WHERE business_id = $1 AND user_id = app.current_user_id() AND status = 'completed'`, [businessId], db))[0].n,

  /** Último atendimento concluído de cada pet/serviço do tutor, para lembrar a volta. */
  lastVisits: (db: Db) =>
    query<{ pet_id: string | null; pet_name: string | null; slug: string; name: string; cat_slug: string; service_id: string; service_name: string; last_at: Date }>(
      `SELECT DISTINCT ON (coalesce(bk.pet_id::text, ''), bk.business_id, bk.service_id)
         bk.pet_id, pe.name AS pet_name, b.slug, b.name, c.slug AS cat_slug, bk.service_id, s.name AS service_name, bk.starts_at AS last_at
       FROM bookings bk
       JOIN businesses b ON b.id = bk.business_id JOIN categories c ON c.id = b.category_id
       JOIN services s ON s.id = bk.service_id
       LEFT JOIN pets pe ON pe.id = bk.pet_id
       WHERE bk.user_id = app.current_user_id() AND bk.status = 'completed' AND b.status = 'active'
         AND NOT EXISTS (SELECT 1 FROM bookings nx WHERE nx.user_id = bk.user_id AND nx.service_id = bk.service_id
           AND nx.pet_id IS NOT DISTINCT FROM bk.pet_id AND nx.starts_at > now() AND nx.status IN ('requested', 'confirmed'))
       ORDER BY coalesce(bk.pet_id::text, ''), bk.business_id, bk.service_id, bk.starts_at DESC`, [], db),

  report: async (db: Db, businessId: string, from: Date, to: Date) => {
    const p = [businessId, from, to];
    const [totals] = await query<{ completed: number; cancelled: number; revenue: number }>(
      `SELECT count(*) FILTER (WHERE bk.status = 'completed')::int AS completed,
         count(*) FILTER (WHERE bk.status IN ('cancelled', 'declined'))::int AS cancelled,
         coalesce(sum(CASE WHEN bk.status = 'completed' AND bk.customer_package_id IS NULL AND s.price_type IN ('fixed', 'from') THEN s.price_min_cents END), 0)::int
         + coalesce((SELECT sum(cp.price_cents) FROM customer_packages cp WHERE cp.business_id = $1 AND cp.activated_at >= $2 AND cp.activated_at < $3), 0)::int AS revenue
       FROM bookings bk JOIN services s ON s.id = bk.service_id
       WHERE bk.business_id = $1 AND bk.starts_at >= $2 AND bk.starts_at < $3`, p, db);
    const [customers] = await query<{ new: number; returning: number }>(
      `WITH m AS (SELECT DISTINCT user_id FROM bookings WHERE business_id = $1 AND status = 'completed' AND starts_at >= $2 AND starts_at < $3)
       SELECT count(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM bookings o WHERE o.business_id = $1 AND o.user_id = m.user_id AND o.status = 'completed' AND o.starts_at < $2))::int AS new,
              count(*) FILTER (WHERE EXISTS (SELECT 1 FROM bookings o WHERE o.business_id = $1 AND o.user_id = m.user_id AND o.status = 'completed' AND o.starts_at < $2))::int AS returning
       FROM m`, p, db);
    const topServices = await query<{ name: string; count: number }>(
      `SELECT s.name, count(*)::int AS count FROM bookings bk JOIN services s ON s.id = bk.service_id
       WHERE bk.business_id = $1 AND bk.status = 'completed' AND bk.starts_at >= $2 AND bk.starts_at < $3
       GROUP BY s.name ORDER BY count DESC, s.name LIMIT 5`, p, db);
    const busiestHours = await query<{ hour: number; count: number }>(
      `SELECT extract(hour FROM bk.starts_at AT TIME ZONE ci.timezone)::int AS hour, count(*)::int AS count
       FROM bookings bk JOIN businesses b ON b.id = bk.business_id JOIN cities ci ON ci.ibge = b.city_ibge
       WHERE bk.business_id = $1 AND bk.status IN ('completed', 'confirmed') AND bk.starts_at >= $2 AND bk.starts_at < $3
       GROUP BY hour ORDER BY count DESC, hour LIMIT 5`, p, db);
    const missing = await query<{ name: string | null; phone: string | null; pet_name: string | null; last_visit: Date }>(
      `SELECT DISTINCT ON (bk.user_id) u.name, coalesce(bk.contact_phone, u.phone) AS phone, pe.name AS pet_name, bk.starts_at AS last_visit
       FROM bookings bk LEFT JOIN LATERAL app.business_customer(bk.business_id, bk.user_id) u ON true LEFT JOIN pets pe ON pe.id = bk.pet_id
       WHERE bk.business_id = $1 AND bk.status = 'completed'
         AND NOT EXISTS (SELECT 1 FROM bookings o WHERE o.business_id = $1 AND o.user_id = bk.user_id
           AND (o.starts_at > now() - interval '45 days') AND o.status IN ('completed', 'confirmed', 'requested'))
       ORDER BY bk.user_id, bk.starts_at DESC`, [businessId], db);
    return { totals, customers, topServices, busiestHours, missing };
  },
};
