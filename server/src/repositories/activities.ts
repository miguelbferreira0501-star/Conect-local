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
           NULL::text AS preferred_date, bk.notes AS description, bk.created_at, bk.completed_at AS closed_at, r.id AS review_id
         FROM bookings bk JOIN businesses b ON b.id = bk.business_id JOIN categories c ON c.id = b.category_id
         JOIN services s ON s.id = bk.service_id LEFT JOIN reviews r ON r.booking_id = bk.id
         UNION ALL
         SELECT q.id, 'quote', q.status, b.id, b.slug, b.name, b.logo_url, c.name, b.is_demo, s.name, s.id, NULL,
           q.preferred_date::text, q.description, q.created_at, q.hired_at, r.id
         FROM quote_requests q JOIN businesses b ON b.id = q.business_id JOIN categories c ON c.id = b.category_id
         LEFT JOIN services s ON s.id = q.service_id LEFT JOIN reviews r ON r.quote_id = q.id
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

  createBooking: async (db: Db, b: { businessId: string; serviceId: string; startsAt: Date; endsAt: Date; notes?: string; phone?: string }) =>
    (await query<{ id: string }>(
      `INSERT INTO bookings (user_id, business_id, service_id, starts_at, ends_at, notes, contact_phone)
       VALUES (app.current_user_id(), $1, $2, $3, $4, $5, $6) RETURNING id`,
      [b.businessId, b.serviceId, b.startsAt, b.endsAt, b.notes || null, b.phone || null], db))[0],

  setBookingStatus: (db: Db, id: string, status: 'cancelled' | 'completed') =>
    query(
      `UPDATE bookings SET status = $2, updated_at = now(),
         completed_at = CASE WHEN $2 = 'completed' THEN now() ELSE completed_at END,
         cancelled_at = CASE WHEN $2 = 'cancelled' THEN now() ELSE cancelled_at END
       WHERE id = $1`,
      [id, status], db),

  createQuote: async (db: Db, q: { businessId: string; serviceId?: string | null; description: string; preferredDate?: string | null; contactPreference: string; phone?: string; neighborhood?: string }) =>
    (await query<{ id: string }>(
      `INSERT INTO quote_requests (user_id, business_id, service_id, description, preferred_date, contact_preference, contact_phone, neighborhood)
       VALUES (app.current_user_id(), $1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [q.businessId, q.serviceId ?? null, q.description, q.preferredDate ?? null, q.contactPreference, q.phone || null, q.neighborhood || null], db))[0],

  setQuoteStatus: (db: Db, id: string, status: 'hired' | 'closed') =>
    query(`UPDATE quote_requests SET status = $2, updated_at = now(), hired_at = CASE WHEN $2 = 'hired' THEN now() ELSE hired_at END WHERE id = $1`, [id, status], db),

  countActiveFutureBookings: async (db: Db) =>
    (await query<{ n: number }>(`SELECT count(*)::int AS n FROM bookings WHERE status IN ('requested','confirmed') AND starts_at > now()`, [], db))[0].n,

  countQuotesToday: async (db: Db) =>
    (await query<{ n: number }>(`SELECT count(*)::int AS n FROM quote_requests WHERE created_at > now() - interval '1 day'`, [], db))[0].n,
};
