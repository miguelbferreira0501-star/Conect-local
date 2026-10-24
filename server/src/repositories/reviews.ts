import { query, type Db } from '../db/pool';

const reviewCols = `r.id, r.author_display_name AS "authorName", r.rating, r.comment, r.aspects, r.verified_interaction AS "verifiedInteraction",
  s.name AS "serviceName", r.created_at AS "createdAt", r.updated_at AS "updatedAt", (r.user_id = app.current_user_id()) AS "isMine"`;

export const reviewsRepo = {
  listForBusiness: (db: Db, businessId: string, opts: { sort: 'recent' | 'highest' | 'lowest'; limit: number; offset: number; rating?: number }) => {
    const order = opts.sort === 'highest' ? 'r.rating DESC, r.created_at DESC' : opts.sort === 'lowest' ? 'r.rating ASC, r.created_at DESC' : 'r.created_at DESC';
    const params: unknown[] = [businessId, opts.limit, opts.offset];
    let extra = '';
    if (opts.rating) { params.push(opts.rating); extra = `AND r.rating = $4`; }
    return query(
      `SELECT ${reviewCols}, rr.body AS "replyBody", rr.created_at AS "replyAt"
       FROM reviews r LEFT JOIN services s ON s.id = r.service_id LEFT JOIN review_replies rr ON rr.review_id = r.id
       WHERE r.business_id = $1 AND r.status = 'published' ${extra}
       ORDER BY ${order} LIMIT $2 OFFSET $3`,
      params, db);
  },

  countForBusiness: async (db: Db, businessId: string, rating?: number) =>
    (await query<{ n: number }>(
      `SELECT count(*)::int AS n FROM reviews WHERE business_id = $1 AND status = 'published' ${rating ? 'AND rating = $2' : ''}`,
      rating ? [businessId, rating] : [businessId], db))[0].n,

  mine: (db: Db) =>
    query(
      `SELECT ${reviewCols}, json_build_object('id', b.id, 'slug', b.slug, 'name', b.name) AS business, r.status
       FROM reviews r JOIN businesses b ON b.id = r.business_id LEFT JOIN services s ON s.id = r.service_id
       WHERE r.user_id = app.current_user_id() ORDER BY r.created_at DESC`, [], db),

  mineById: async (db: Db, id: string) =>
    (await query<{ id: string; business_id: string; created_at: Date }>(
      `SELECT id, business_id, created_at FROM reviews WHERE id = $1 AND user_id = app.current_user_id()`, [id], db))[0] ?? null,

  publicById: async (db: Db, id: string) =>
    (await query<{ id: string; user_id: string }>(`SELECT id, user_id FROM reviews WHERE id = $1 AND status = 'published'`, [id], db))[0] ?? null,

  lastMineForBusiness: async (db: Db, businessId: string) =>
    (await query<{ created_at: Date }>(
      `SELECT created_at FROM reviews WHERE business_id = $1 AND user_id = app.current_user_id() ORDER BY created_at DESC LIMIT 1`, [businessId], db))[0] ?? null,

  countMineToday: async (db: Db) =>
    (await query<{ n: number }>(`SELECT count(*)::int AS n FROM reviews WHERE user_id = app.current_user_id() AND created_at > now() - interval '1 day'`, [], db))[0].n,

  create: async (db: Db, r: { businessId: string; authorName: string; bookingId: string | null; quoteId: string | null; serviceId: string | null; rating: number; comment: string; aspects: object }) =>
    (await query<{ id: string }>(
      `INSERT INTO reviews (business_id, user_id, author_display_name, booking_id, quote_id, service_id, rating, comment, aspects)
       VALUES ($1, app.current_user_id(), $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [r.businessId, r.authorName, r.bookingId, r.quoteId, r.serviceId, r.rating, r.comment, JSON.stringify(r.aspects)], db))[0],

  update: (db: Db, id: string, r: { rating: number; comment: string; aspects: object }) =>
    query(`UPDATE reviews SET rating = $2, comment = $3, aspects = $4, updated_at = now() WHERE id = $1`, [id, r.rating, r.comment, JSON.stringify(r.aspects)], db),

  remove: (db: Db, id: string) => query(`DELETE FROM reviews WHERE id = $1`, [id], db),

  report: async (db: Db, reviewId: string, reason: string, details?: string) => {
    const rows = await query(
      `INSERT INTO review_reports (review_id, user_id, reason, details) VALUES ($1, app.current_user_id(), $2, $3)
       ON CONFLICT (review_id, user_id) DO NOTHING RETURNING id`, [reviewId, reason, details || null], db);
    if (rows.length) await query(`SELECT app.increment_review_reports($1)`, [reviewId], db);
    return rows.length > 0;
  },
};
