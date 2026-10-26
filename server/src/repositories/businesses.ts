import type { BusinessRow, PlanId, ServiceMode } from '@conecta/shared';

export type { BusinessRow };
import { query, type Db } from '../db/pool';

export interface CandidateFilters {
  city: number;
  category?: string;
  neighborhood?: string;
  minRating?: number;
  minReviews?: number;
  priceLevels?: number[];
  modes?: ServiceMode[];
  bookable?: boolean;
  includeOnlineElsewhere: boolean;
  createdAfter?: Date;
}

const BASE_SELECT = `
  SELECT b.*, c.slug AS cat_slug, c.name AS cat_name, c.short_name AS cat_short, c.icon AS cat_icon, c.keywords AS cat_keywords,
    ci.name AS city_name, ci.uf AS city_uf, ci.timezone,
    coalesce(st.review_count, 0) AS review_count, st.average, st.stddev, st.first_review_at, st.last_review_at,
    coalesce(svc.names, '{}') AS service_names, coalesce(svc.cnt, 0)::int AS services_count,
    coalesce(svc.priced, 0)::int AS services_with_price, coalesce(svc.bookable, false) AS has_bookable,
    (SELECT count(*)::int FROM photos p WHERE p.business_id = b.id) AS photos_count`;

const BASE_JOINS = `
  FROM businesses b
  JOIN categories c ON c.id = b.category_id
  JOIN cities ci ON ci.ibge = b.city_ibge
  LEFT JOIN business_review_stats st ON st.business_id = b.id
  LEFT JOIN LATERAL (
    SELECT array_agg(s.name ORDER BY s.sort_order) AS names, count(*) AS cnt,
      count(*) FILTER (WHERE s.price_type <> 'quote') AS priced, bool_or(s.bookable) AS bookable
    FROM services s WHERE s.business_id = b.id AND s.active
  ) svc ON true`;

export const businessesRepo = {
  /** Empresas que podem aparecer para uma cidade, já com filtros estruturados aplicados. */
  async candidates(f: CandidateFilters, db?: Db): Promise<BusinessRow[]> {
    const params: unknown[] = [f.city];
    const where: string[] = [`b.status = 'active'`, 'c.active'];
    const loc = [
      `b.city_ibge = $1`,
      `EXISTS (SELECT 1 FROM business_service_areas a WHERE a.business_id = b.id AND a.city_ibge = $1)`,
    ];
    if (f.includeOnlineElsewhere) loc.push('b.mode_online');
    where.push(`(${loc.join(' OR ')})`);
    const add = (sql: string, value: unknown) => {
      params.push(value);
      where.push(sql.replaceAll('?', `$${params.length}`));
    };
    if (f.category) add('c.slug = ?', f.category);
    if (f.neighborhood) add(`app.norm(b.neighborhood) = app.norm(?)`, f.neighborhood);
    if (f.minRating) add('st.average >= ?', f.minRating);
    if (f.minReviews) add('coalesce(st.review_count, 0) >= ?', f.minReviews);
    if (f.priceLevels?.length) add('b.price_level = ANY(?)', f.priceLevels);
    if (f.createdAfter) add('b.created_at >= ?', f.createdAfter);
    for (const m of f.modes ?? []) where.push(`b.mode_${m}`);
    if (f.bookable) where.push('b.accepts_booking AND coalesce(svc.bookable, false)');
    return query<BusinessRow>(
      `${BASE_SELECT},
        CASE WHEN b.city_ibge = $1 THEN 'establishmentInCity'
             WHEN EXISTS (SELECT 1 FROM business_service_areas a WHERE a.business_id = b.id AND a.city_ibge = $1) THEN 'servesCity'
             ELSE 'onlineOnly' END AS location_match
       ${BASE_JOINS}
       WHERE ${where.join(' AND ')}`,
      params,
      db,
    );
  },

  async bySlug(slug: string, db?: Db): Promise<BusinessRow | null> {
    const rows = await query<BusinessRow>(
      `${BASE_SELECT}, 'establishmentInCity' AS location_match ${BASE_JOINS} WHERE b.slug = $1`,
      [slug],
      db,
    );
    return rows[0] ?? null;
  },

  async basicById(id: string, db?: Db) {
    const rows = await query<{ id: string; slug: string; name: string; accepts_booking: boolean; accepts_quote: boolean; opening_hours: BusinessRow['opening_hours']; timezone: string; is_demo: boolean; plan: PlanId; plan_until: Date | null }>(
      `SELECT b.id, b.slug, b.name, b.accepts_booking, b.accepts_quote, b.opening_hours, b.is_demo, b.plan, b.plan_until, ci.timezone
       FROM businesses b JOIN cities ci ON ci.ibge = b.city_ibge WHERE b.id = $1 AND b.status = 'active'`,
      [id],
      db,
    );
    return rows[0] ?? null;
  },

  /** Mediana de preço, na cidade e categoria, dos serviços com estes nomes (só com 3+ empresas). */
  cityPriceRefs: (cityIbge: number, catSlug: string, names: string[], db?: Db) =>
    query<{ name: string; median: number; n: number }>(
      `SELECT x.name,
         round(percentile_cont(0.5) WITHIN GROUP (ORDER BY CASE WHEN s.price_type = 'range' AND s.price_max_cents IS NOT NULL
           THEN (s.price_min_cents + s.price_max_cents) / 2.0 ELSE s.price_min_cents END))::int AS median,
         count(DISTINCT s.business_id)::int AS n
       FROM unnest($3::text[]) AS x(name)
       JOIN services s ON app.norm(s.name) = app.norm(x.name) AND s.active AND s.price_type <> 'quote' AND s.price_min_cents IS NOT NULL
       JOIN businesses b ON b.id = s.business_id AND b.status = 'active' AND b.city_ibge = $1
       JOIN categories c ON c.id = b.category_id AND c.slug = $2
       GROUP BY x.name HAVING count(DISTINCT s.business_id) >= 3`,
      [cityIbge, catSlug, names],
      db,
    ),

  services: (businessId: string, db?: Db) =>
    query(
      `SELECT id, name, description, price_type AS "priceType", price_min_cents AS "priceMinCents",
         price_max_cents AS "priceMaxCents", duration_minutes AS "durationMinutes", bookable, booking_mode AS "bookingMode", notes
       FROM services WHERE business_id = $1 AND active ORDER BY sort_order, name`,
      [businessId],
      db,
    ),

  service: async (businessId: string, serviceId: string, db?: Db) =>
    (
      await query<{ id: string; name: string; bookable: boolean; duration_minutes: number | null; booking_mode: 'slot' | 'period' | 'day' }>(
        `SELECT id, name, bookable, duration_minutes, booking_mode FROM services WHERE id = $1 AND business_id = $2 AND active`,
        [serviceId, businessId],
        db,
      )
    )[0] ?? null,

  /** Equipe ativa com os serviços que cada um faz. */
  staff: (businessId: string, db?: Db) =>
    query<{ id: string; name: string; roleTitle: string | null; kind: 'person' | 'resource'; openingHours: Record<string, Array<[string, string]>> | null; serviceIds: string[] }>(
      `SELECT s.id, s.name, s.role_title AS "roleTitle", s.kind, s.opening_hours AS "openingHours",
         coalesce(array_agg(ss.service_id) FILTER (WHERE ss.service_id IS NOT NULL), '{}') AS "serviceIds"
       FROM business_staff s LEFT JOIN staff_services ss ON ss.staff_id = s.id
       WHERE s.business_id = $1 AND s.active GROUP BY s.id ORDER BY s.sort_order, s.name`,
      [businessId], db),

  photos: (businessId: string, db?: Db) =>
    query(`SELECT id, url, caption FROM photos WHERE business_id = $1 ORDER BY sort_order`, [businessId], db),

  serviceAreas: (businessId: string, db?: Db) =>
    query<{ ibge: number; name: string; uf: string }>(
      `SELECT c.ibge, c.name, c.uf FROM business_service_areas a JOIN cities c ON c.ibge = a.city_ibge
       WHERE a.business_id = $1 ORDER BY c.name`,
      [businessId],
      db,
    ),

  async ratingDistribution(businessId: string, db?: Db) {
    const rows = await query(`SELECT r1, r2, r3, r4, r5 FROM business_review_stats WHERE business_id = $1`, [businessId], db);
    const r = rows[0] ?? { r1: 0, r2: 0, r3: 0, r4: 0, r5: 0 };
    return { 1: r.r1, 2: r.r2, 3: r.r3, 4: r.r4, 5: r.r5 } as Record<1 | 2 | 3 | 4 | 5, number>;
  },

  async aspectAverages(businessId: string, db?: Db) {
    const rows = await query<{ key: string; avg: number; n: number }>(
      `SELECT a.key, avg(a.value::int)::float8 AS avg, count(*)::int AS n
       FROM reviews r, jsonb_each_text(r.aspects) a
       WHERE r.business_id = $1 AND r.status = 'published' GROUP BY a.key`,
      [businessId],
      db,
    );
    return Object.fromEntries(rows.filter((r) => r.n >= 3).map((r) => [r.key, Math.round(r.avg * 10) / 10]));
  },

  /** Média geral das avaliações válidas (usada como "prior" da média bayesiana). */
  async globalStats(db?: Db) {
    const rows = await query<{ avg: number | null; n: number }>(
      `SELECT avg(rating)::float8 AS avg, count(*)::int AS n FROM reviews WHERE status = 'published'`,
      [],
      db,
    );
    return rows[0];
  },

  popularServices: (city: number, since: Date, limit: number) =>
    query<{ name: string; requests: number }>(`SELECT * FROM app.popular_services($1, $2, $3)`, [city, since, limit]),

  busyRanges: (businessId: string, from: Date, to: Date, db?: Db) =>
    query<{ starts_at: Date; ends_at: Date; staff_id: string | null }>(`SELECT * FROM app.business_busy_ranges($1, $2, $3)`, [businessId, from, to], db),

  suggestNames: (city: number, q: string) =>
    query<{ name: string; slug: string }>(
      `SELECT b.name, b.slug FROM businesses b
       WHERE b.status = 'active' AND (b.city_ibge = $1 OR EXISTS (SELECT 1 FROM business_service_areas a WHERE a.business_id = b.id AND a.city_ibge = $1))
         AND (app.norm(b.name) LIKE '%' || app.norm($2) || '%' OR app.norm(b.professional_name) LIKE '%' || app.norm($2) || '%')
       ORDER BY b.name LIMIT 4`,
      [city, q],
    ),

  suggestServices: (city: number, q: string) =>
    query<{ name: string }>(
      `SELECT DISTINCT s.name FROM services s JOIN businesses b ON b.id = s.business_id
       WHERE b.status = 'active' AND s.active
         AND (b.city_ibge = $1 OR EXISTS (SELECT 1 FROM business_service_areas a WHERE a.business_id = b.id AND a.city_ibge = $1))
         AND app.norm(s.name) LIKE '%' || app.norm($2) || '%'
       ORDER BY s.name LIMIT 4`,
      [city, q],
    ),
};
