/** SQL do painel das empresas. Todas as consultas rodam com o usuário na sessão (RLS). */
import { query, type Db } from '../db/pool';
import { PET_COLS } from './pets';

const profileCols = `b.id, b.slug, b.name, b.status, b.suspended_reason, b.verified_at, b.is_demo, b.professional_name, c.slug AS category_slug,
  b.short_description, b.description, b.city_ibge, b.neighborhood, b.street, b.postal_code, b.address_public, b.mode_in_person,
  b.mode_at_customer, b.mode_online, b.phone, b.whatsapp, b.website, b.instagram, b.email, b.price_level, b.accepts_booking,
  b.accepts_quote, b.logo_url, b.cover_url, b.opening_hours, b.hours_updated_at, b.requests_received, b.requests_answered,
  b.plan, b.plan_until`;

export const panelRepo = {
  myBusinesses: (db: Db) =>
    query<{ id: string; slug: string; name: string; status: string; role: string }>(
      `SELECT b.id, b.slug, b.name, b.status, m.role FROM business_members m JOIN businesses b ON b.id = m.business_id
       WHERE m.user_id = app.current_user_id() ORDER BY b.name`, [], db),

  role: async (db: Db, businessId: string) =>
    (await query<{ role: string }>(`SELECT role FROM business_members WHERE business_id = $1 AND user_id = app.current_user_id()`, [businessId], db))[0]?.role ?? null,

  business: async (db: Db, id: string) =>
    (await query(`SELECT ${profileCols} FROM businesses b JOIN categories c ON c.id = b.category_id WHERE b.id = $1`, [id], db))[0] ?? null,

  areas: async (db: Db, id: string) =>
    (await query<{ city_ibge: number }>(`SELECT city_ibge FROM business_service_areas WHERE business_id = $1 ORDER BY city_ibge`, [id], db)).map((r) => r.city_ibge),

  photos: (db: Db, id: string) => query<{ id: string; url: string }>(`SELECT id, url FROM photos WHERE business_id = $1 ORDER BY sort_order, id`, [id], db),

  services: (db: Db, id: string) =>
    query(`SELECT id, name, description, price_type, price_min_cents, price_max_cents, duration_minutes, bookable, booking_mode, notes, deposit_cents
           FROM services WHERE business_id = $1 AND active ORDER BY sort_order, name`, [id], db),

  stats: async (db: Db, id: string) => {
    const r = (await query<{ review_count: number; average: number | null }>(
      `SELECT review_count, average FROM business_review_stats WHERE business_id = $1`, [id], db))[0];
    const p = (await query<{ n: number }>(
      `SELECT ((SELECT count(*) FROM bookings WHERE business_id = $1 AND status = 'requested' AND starts_at > now())
             + (SELECT count(*) FROM quote_requests WHERE business_id = $1 AND status = 'sent'))::int AS n`, [id], db))[0];
    return { reviewCount: r?.review_count ?? 0, average: r?.average ?? null, pendingRequests: p.n };
  },

  categoryId: async (db: Db, slug: string) =>
    (await query<{ id: number }>(`SELECT id FROM categories WHERE slug = $1 AND active`, [slug], db))[0]?.id ?? null,

  countMine: async (db: Db) =>
    (await query<{ n: number }>(`SELECT count(*)::int AS n FROM business_members WHERE user_id = app.current_user_id() AND role = 'owner'`, [], db))[0].n,

  insertBusiness: async (db: Db, v: Record<string, unknown>) => {
    const cols = Object.keys(v);
    const rows = await query<{ id: string }>(
      `INSERT INTO businesses (${cols.join(', ')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING id`,
      Object.values(v), db);
    await query(`INSERT INTO business_members (business_id, user_id, role) VALUES ($1, app.current_user_id(), 'owner')`, [rows[0].id], db);
    return rows[0].id;
  },

  updateBusiness: (db: Db, id: string, v: Record<string, unknown>) => {
    const cols = Object.keys(v);
    return query(
      `UPDATE businesses SET ${cols.map((c, i) => `${c} = $${i + 2}`).join(', ')}, updated_at = now() WHERE id = $1`,
      [id, ...Object.values(v)], db);
  },

  setAreas: async (db: Db, id: string, cities: number[]) => {
    await query(`DELETE FROM business_service_areas WHERE business_id = $1`, [id], db);
    if (cities.length) {
      await query(`INSERT INTO business_service_areas (business_id, city_ibge) SELECT $1, unnest($2::int[]) ON CONFLICT DO NOTHING`, [id, cities], db);
    }
  },

  insertService: async (db: Db, businessId: string, s: Record<string, unknown>) =>
    (await query<{ id: string }>(
      `INSERT INTO services (business_id, name, description, price_type, price_min_cents, price_max_cents, duration_minutes, bookable, notes, booking_mode, deposit_cents, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, (SELECT coalesce(max(sort_order), 0) + 1 FROM services WHERE business_id = $1)) RETURNING id`,
      [businessId, s.name, s.description, s.price_type, s.price_min_cents, s.price_max_cents, s.duration_minutes, s.bookable, s.notes, s.booking_mode, s.deposit_cents ?? null], db))[0].id,

  updateService: (db: Db, businessId: string, serviceId: string, s: Record<string, unknown>) =>
    query(
      `UPDATE services SET name = $3, description = $4, price_type = $5, price_min_cents = $6, price_max_cents = $7, duration_minutes = $8, bookable = $9, notes = $10, booking_mode = $11, deposit_cents = $12
       WHERE id = $2 AND business_id = $1`,
      [businessId, serviceId, s.name, s.description, s.price_type, s.price_min_cents, s.price_max_cents, s.duration_minutes, s.bookable, s.notes, s.booking_mode, s.deposit_cents ?? null], db),

  /** Serviços com histórico (agendamentos, avaliações) são desativados em vez de apagados. */
  removeService: (db: Db, businessId: string, serviceId: string) =>
    query(`UPDATE services SET active = false WHERE id = $2 AND business_id = $1`, [businessId, serviceId], db),

  countServices: async (db: Db, businessId: string) =>
    (await query<{ n: number }>(`SELECT count(*)::int AS n FROM services WHERE business_id = $1 AND active`, [businessId], db))[0].n,

  insertImage: async (db: Db, businessId: string, kind: string, mime: string, data: Buffer) =>
    (await query<{ id: string }>(`INSERT INTO images (business_id, kind, mime, data) VALUES ($1, $2, $3, $4) RETURNING id`, [businessId, kind, mime, data], db))[0].id,

  deleteImage: (db: Db, businessId: string, imageId: string) => query(`DELETE FROM images WHERE id = $2 AND business_id = $1`, [businessId, imageId], db),

  imagesOfKind: (db: Db, businessId: string, kind: string) =>
    query<{ id: string }>(`SELECT id FROM images WHERE business_id = $1 AND kind = $2`, [businessId, kind], db),

  addPhoto: (db: Db, businessId: string, imageId: string) =>
    query(`INSERT INTO photos (id, business_id, url, sort_order) VALUES ($2, $1, '/api/images/' || $2, (SELECT coalesce(max(sort_order), 0) + 1 FROM photos WHERE business_id = $1))`, [businessId, imageId], db),

  removePhoto: (db: Db, businessId: string, photoId: string) => query(`DELETE FROM photos WHERE id = $2 AND business_id = $1`, [businessId, photoId], db),

  countPhotos: async (db: Db, businessId: string) =>
    (await query<{ n: number }>(`SELECT count(*)::int AS n FROM photos WHERE business_id = $1`, [businessId], db))[0].n,

  image: async (db: Db, id: string) =>
    (await query<{ mime: string; data: Buffer }>(`SELECT mime, data FROM images WHERE id = $1`, [id], db))[0] ?? null,

  requests: (db: Db, businessId: string) =>
    query(
      `SELECT * FROM (
         SELECT bk.id, 'booking' AS type, bk.status, s.name AS service_name, bk.starts_at, NULL::text AS preferred_date, bk.notes AS description,
           NULL::text AS contact_preference, NULL::text AS neighborhood, bk.created_at, bk.business_note AS business_response,
           bk.contact_phone, cu.name AS customer_name, cu.email AS customer_email, cu.phone AS customer_phone,
           bk.booking_mode, bk.period, st.name AS staff_name, bk.party_size,
           (SELECT row_to_json(x) FROM (SELECT ${PET_COLS()} FROM pets p WHERE p.id = bk.pet_id) x) AS pet,
           (SELECT count(*)::int FROM booking_updates u WHERE u.booking_id = bk.id) AS live_count,
           bk.ends_at, bk.address, bk.destination, bk.details, bk.deposit_cents, bk.deposit_status, bk.customer_package_id IS NOT NULL AS from_package,
           (SELECT count(*)::int FROM bookings x WHERE x.business_id = bk.business_id AND x.user_id = bk.user_id AND x.status = 'completed') AS customer_visits
         FROM bookings bk JOIN services s ON s.id = bk.service_id LEFT JOIN business_staff st ON st.id = bk.staff_id
         LEFT JOIN LATERAL app.business_customer(bk.business_id, bk.user_id) cu ON true
         WHERE bk.business_id = $1
         UNION ALL
         SELECT q.id, 'quote', q.status, s.name, NULL, q.preferred_date::text, q.description, q.contact_preference, q.neighborhood, q.created_at,
           q.business_response, q.contact_phone, cu.name, cu.email, cu.phone, NULL, NULL, NULL, NULL,
           (SELECT row_to_json(x) FROM (SELECT ${PET_COLS()} FROM pets p WHERE p.id = q.pet_id) x), 0,
           NULL, NULL, NULL, NULL, NULL, NULL, false, 0
         FROM quote_requests q LEFT JOIN services s ON s.id = q.service_id
         LEFT JOIN LATERAL app.business_customer(q.business_id, q.user_id) cu ON true
         WHERE q.business_id = $1
       ) r ORDER BY created_at DESC LIMIT 300`,
      [businessId], db),

  booking: async (db: Db, businessId: string, id: string) =>
    (await query<{ id: string; status: string; starts_at: Date }>(`SELECT id, status, starts_at FROM bookings WHERE id = $2 AND business_id = $1`, [businessId, id], db))[0] ?? null,

  quote: async (db: Db, businessId: string, id: string) =>
    (await query<{ id: string; status: string }>(`SELECT id, status FROM quote_requests WHERE id = $2 AND business_id = $1`, [businessId, id], db))[0] ?? null,

  setBooking: (db: Db, id: string, status: string, note: string | null) =>
    query(`UPDATE bookings SET status = $2, business_note = coalesce($3, business_note), updated_at = now() WHERE id = $1`, [id, status, note], db),

  setQuote: (db: Db, id: string, status: string, response: string | null) =>
    query(`UPDATE quote_requests SET status = $2, business_response = coalesce($3, business_response),
             answered_at = CASE WHEN $2 = 'answered' THEN now() ELSE answered_at END, updated_at = now() WHERE id = $1`, [id, status, response], db),

  reviews: (db: Db, businessId: string) =>
    query(
      `SELECT r.id, r.author_display_name AS "authorName", r.rating, r.comment, s.name AS "serviceName", r.created_at AS "createdAt",
         CASE WHEN rr.review_id IS NULL THEN NULL ELSE json_build_object('body', rr.body, 'createdAt', rr.created_at) END AS reply
       FROM reviews r LEFT JOIN services s ON s.id = r.service_id LEFT JOIN review_replies rr ON rr.review_id = r.id
       WHERE r.business_id = $1 AND r.status = 'published' ORDER BY r.created_at DESC LIMIT 200`,
      [businessId], db),

  upsertReply: (db: Db, businessId: string, reviewId: string, body: string) =>
    query(`INSERT INTO review_replies (review_id, business_id, body) VALUES ($2, $1, $3)
           ON CONFLICT (review_id) DO UPDATE SET body = EXCLUDED.body, created_at = now()`, [businessId, reviewId, body], db),

  deleteReply: (db: Db, businessId: string, reviewId: string) =>
    query(`DELETE FROM review_replies WHERE review_id = $2 AND business_id = $1`, [businessId, reviewId], db),

  // ── Equipe ──
  staffCount: async (db: Db, businessId: string) =>
    (await query<{ n: number }>(`SELECT count(*)::int AS n FROM business_staff WHERE business_id = $1 AND active`, [businessId], db))[0].n,

  insertStaff: async (db: Db, businessId: string, v: { name: string; roleTitle: string | null; kind: string; openingHours: unknown }) =>
    (await query<{ id: string }>(
      `INSERT INTO business_staff (business_id, name, role_title, kind, opening_hours, sort_order)
       VALUES ($1, $2, $3, $4, $5, (SELECT coalesce(max(sort_order), 0) + 1 FROM business_staff WHERE business_id = $1)) RETURNING id`,
      [businessId, v.name, v.roleTitle, v.kind, v.openingHours ? JSON.stringify(v.openingHours) : null], db))[0].id,

  updateStaff: (db: Db, businessId: string, id: string, v: { name: string; roleTitle: string | null; kind: string; openingHours: unknown }) =>
    query(`UPDATE business_staff SET name = $3, role_title = $4, kind = $5, opening_hours = $6 WHERE id = $2 AND business_id = $1`,
      [businessId, id, v.name, v.roleTitle, v.kind, v.openingHours ? JSON.stringify(v.openingHours) : null], db),

  /** Desativa (mantém o histórico dos agendamentos). */
  removeStaff: (db: Db, businessId: string, id: string) =>
    query(`UPDATE business_staff SET active = false WHERE id = $2 AND business_id = $1`, [businessId, id], db),

  setStaffServices: async (db: Db, staffId: string, serviceIds: string[]) => {
    await query(`DELETE FROM staff_services WHERE staff_id = $1`, [staffId], db);
    if (serviceIds.length) await query(`INSERT INTO staff_services (staff_id, service_id) SELECT $1, unnest($2::uuid[]) ON CONFLICT DO NOTHING`, [staffId, serviceIds], db);
  },

  agenda: (db: Db, businessId: string, from: Date, to: Date) =>
    query(
      `SELECT bk.id, bk.status, bk.starts_at, bk.ends_at, bk.booking_mode, bk.period, s.name AS service_name, bk.staff_id, st.name AS staff_name, bk.party_size,
         cu.name AS customer_name, coalesce(bk.contact_phone, cu.phone) AS customer_phone,
         (SELECT row_to_json(x) FROM (SELECT ${PET_COLS()} FROM pets p WHERE p.id = bk.pet_id) x) AS pet,
         (SELECT count(*)::int FROM booking_updates u WHERE u.booking_id = bk.id) AS live_count,
         bk.address, bk.destination, bk.details, bk.deposit_cents, bk.deposit_status
       FROM bookings bk JOIN services s ON s.id = bk.service_id LEFT JOIN business_staff st ON st.id = bk.staff_id
       LEFT JOIN LATERAL app.business_customer(bk.business_id, bk.user_id) cu ON true
       WHERE bk.business_id = $1 AND bk.status IN ('requested', 'confirmed', 'completed') AND bk.starts_at < $3 AND bk.ends_at > $2
       ORDER BY bk.starts_at`,
      [businessId, from, to], db),

  aiUsageThisMonth: async (db: Db, businessId: string) =>
    (await query<{ requests: number }>(`SELECT requests FROM ai_usage WHERE business_id = $1 AND month = date_trunc('month', now())::date`, [businessId], db))[0]?.requests ?? 0,

  recordAiUsage: (db: Db, businessId: string, input: number, output: number) =>
    query(`SELECT app.record_ai_usage($1, $2, $3)`, [businessId, input, output], db),

  // ── Administração ──
  adminList: (db: Db, q: string) =>
    query(
      `SELECT b.id, b.slug, b.name, b.status, b.suspended_reason AS "suspendedReason", b.verified_at AS "verifiedAt", b.is_demo AS "isDemo",
         b.created_at AS "createdAt", b.plan, b.plan_until AS "planUntil", c.short_name AS category, ci.name AS city, ci.uf, coalesce(st.review_count, 0) AS "reviewCount"
       FROM businesses b JOIN categories c ON c.id = b.category_id JOIN cities ci ON ci.ibge = b.city_ibge
       LEFT JOIN business_review_stats st ON st.business_id = b.id
       WHERE app.is_admin() AND ($1 = '' OR app.norm(b.name) LIKE '%' || app.norm($1) || '%')
       ORDER BY b.is_demo, b.created_at DESC LIMIT 200`,
      [q], db),

  adminUpdate: (db: Db, id: string, status: string, verified: boolean, reason: string | null) =>
    query(`SELECT app.admin_update_business($1, $2, $3, $4)`, [id, status, verified, reason], db),

  adminSetPlan: (db: Db, id: string, plan: string, until: Date | null) =>
    query(`SELECT app.admin_set_plan($1, $2, $3)`, [id, plan, until], db),

  isAdmin: async (db: Db) => (await query<{ a: boolean }>(`SELECT app.is_admin() AS a`, [], db))[0].a,
};
