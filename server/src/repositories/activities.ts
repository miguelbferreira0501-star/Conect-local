import type { ActivityRow } from '@conecta/shared';
import { query, type Db } from '../db/pool';

export type { ActivityRow };

/** Todas as consultas dependem da política RLS: só retornam dados do próprio usuário. */
export const activitiesRepo = {
  list: (db: Db) =>
    query<ActivityRow>(
      `SELECT * FROM (
         SELECT bk.id, 'booking' AS type, bk.status, b.id AS business_id, b.slug AS business_slug, b.name AS business_name,
           b.logo_url, c.name AS category_name, b.is_demo, s.name AS service_name, s.id AS service_id, bk.starts_at,
           NULL::text AS preferred_date, bk.notes AS description, bk.created_at, bk.completed_at AS closed_at, r.id AS review_id, bk.business_note AS business_message,
           bk.booking_mode, bk.period, st.name AS staff_name, bk.party_size,
           bk.pet_id, pt.name AS pet_name, bk.series_id, lv.n AS live_count, lv.stage AS live_last_stage, lv.at AS live_last_at,
           bk.ends_at, bk.address, bk.destination, bk.details, bk.deposit_cents, bk.deposit_status, b.pix_key, bk.customer_package_id, (SELECT ci.name FROM cities ci WHERE ci.ibge = b.city_ibge) AS city_name
         FROM bookings bk JOIN businesses b ON b.id = bk.business_id JOIN categories c ON c.id = b.category_id
         JOIN services s ON s.id = bk.service_id LEFT JOIN reviews r ON r.booking_id = bk.id
         LEFT JOIN business_staff st ON st.id = bk.staff_id
         LEFT JOIN pets pt ON pt.id = bk.pet_id
         LEFT JOIN LATERAL (
           SELECT count(*)::int AS n, (array_agg(u.stage ORDER BY u.created_at DESC))[1] AS stage, max(u.created_at) AS at
           FROM booking_updates u WHERE u.booking_id = bk.id
         ) lv ON true
         UNION ALL
         SELECT q.id, 'quote', q.status, b.id, b.slug, b.name, b.logo_url, c.name, b.is_demo, s.name, s.id, NULL,
           q.preferred_date::text, q.description, q.created_at, q.hired_at, r.id, q.business_response, NULL, NULL, NULL, NULL,
           q.pet_id, pt.name, NULL::uuid, 0, NULL, NULL::timestamptz,
           NULL::timestamptz, NULL, NULL, NULL::jsonb, NULL::int, NULL, NULL, NULL::uuid, NULL
         FROM quote_requests q JOIN businesses b ON b.id = q.business_id JOIN categories c ON c.id = b.category_id
         LEFT JOIN services s ON s.id = q.service_id LEFT JOIN reviews r ON r.quote_id = q.id
         LEFT JOIN pets pt ON pt.id = q.pet_id
       ) a ORDER BY coalesce(a.starts_at, a.created_at) DESC`,
      [],
      db,
    ),

  booking: async (db: Db, id: string) =>
    (await query<{ id: string; status: string; starts_at: Date; business_id: string; service_id: string; completed_at: Date | null }>(
      `SELECT id, status, starts_at, business_id, service_id, completed_at FROM bookings WHERE id = $1`, [id], db))[0] ?? null,

  quote: async (db: Db, id: string) =>
    (await query<{ id: string; status: string; business_id: string; service_id: string | null; hired_at: Date | null }>(
      `SELECT id, status, business_id, service_id, hired_at FROM quote_requests WHERE id = $1`, [id], db))[0] ?? null,

  createBooking: async (db: Db, b: { businessId: string; serviceId: string; startsAt: Date; endsAt: Date; notes?: string; phone?: string; staffId: string | null; mode: string; period: string | null; partySize: number | null; petId: string | null; seriesId: string | null;
    address?: string | null; destination?: string | null; details?: object; depositCents?: number | null; customerPackageId?: string | null }) =>
    (await query<{ id: string }>(
      `INSERT INTO bookings (user_id, business_id, service_id, starts_at, ends_at, notes, contact_phone, staff_id, booking_mode, period, party_size, pet_id, series_id,
         address, destination, details, deposit_cents, deposit_status, customer_package_id)
       VALUES (app.current_user_id(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CASE WHEN $16::int IS NULL THEN NULL ELSE 'pending' END, $17) RETURNING id`,
      [b.businessId, b.serviceId, b.startsAt, b.endsAt, b.notes || null, b.phone || null, b.staffId, b.mode, b.period, b.partySize, b.petId, b.seriesId,
        b.address ?? null, b.destination ?? null, JSON.stringify(b.details ?? {}), b.depositCents ?? null, b.customerPackageId ?? null], db))[0],

  /** Pacote do tutor com o número de sessões ainda livres (contando agendamentos não cancelados). */
  customerPackage: async (db: Db, id: string) =>
    (await query<{ id: string; business_id: string; service_id: string; status: string; expires_at: Date | null; remaining: number }>(
      `SELECT cp.id, cp.business_id, p.service_id, cp.status, cp.expires_at,
         cp.sessions - (SELECT count(*)::int FROM bookings b WHERE b.customer_package_id = cp.id AND b.status NOT IN ('cancelled', 'declined')) AS remaining
       FROM customer_packages cp JOIN packages p ON p.id = cp.package_id
       WHERE cp.id = $1 AND cp.user_id = app.current_user_id()`, [id], db))[0] ?? null,

  /** Cancela o agendamento e os seguintes da mesma série que ainda não aconteceram. */
  cancelSeriesFrom: async (db: Db, id: string) =>
    (await query(
      `UPDATE bookings bk SET status = 'cancelled', cancelled_at = now(), updated_at = now()
       FROM bookings ref
       WHERE ref.id = $1 AND ref.user_id = app.current_user_id() AND ref.series_id IS NOT NULL
         AND bk.series_id = ref.series_id AND bk.user_id = ref.user_id AND bk.starts_at >= ref.starts_at
         AND bk.starts_at > now() AND bk.status IN ('requested', 'confirmed')
       RETURNING bk.id`, [id], db)).length,

  setBookingStatus: (db: Db, id: string, status: 'cancelled' | 'completed') =>
    query(
      `UPDATE bookings SET status = $2, updated_at = now(),
         completed_at = CASE WHEN $2 = 'completed' THEN now() ELSE completed_at END,
         cancelled_at = CASE WHEN $2 = 'cancelled' THEN now() ELSE cancelled_at END
       WHERE id = $1`,
      [id, status], db),

  createQuote: async (db: Db, q: { businessId: string; serviceId?: string | null; description: string; preferredDate?: string | null; contactPreference: string; phone?: string; neighborhood?: string; petId?: string | null }) =>
    (await query<{ id: string }>(
      `INSERT INTO quote_requests (user_id, business_id, service_id, description, preferred_date, contact_preference, contact_phone, neighborhood, pet_id)
       VALUES (app.current_user_id(), $1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [q.businessId, q.serviceId ?? null, q.description, q.preferredDate ?? null, q.contactPreference, q.phone || null, q.neighborhood || null, q.petId ?? null], db))[0],

  setQuoteStatus: (db: Db, id: string, status: 'hired' | 'closed') =>
    query(`UPDATE quote_requests SET status = $2, updated_at = now(), hired_at = CASE WHEN $2 = 'hired' THEN now() ELSE hired_at END WHERE id = $1`, [id, status], db),

  countActiveFutureBookings: async (db: Db) =>
    (await query<{ n: number }>(`SELECT count(*)::int AS n FROM bookings WHERE user_id = app.current_user_id() AND status IN ('requested','confirmed') AND starts_at > now()`, [], db))[0].n,

  countQuotesToday: async (db: Db) =>
    (await query<{ n: number }>(`SELECT count(*)::int AS n FROM quote_requests WHERE created_at > now() - interval '1 day'`, [], db))[0].n,
};
