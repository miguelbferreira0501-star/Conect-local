/** Converte linhas do banco em DTOs públicos e calcula ranking/selos com as regras compartilhadas. */
import {
  computeBadges, explainRanking, haversineKm, hoursAreFresh, isNewcomer, isOpenAt, profileCompleteness, rankBusiness,
  RANKING_PARAMS, textRelevance, type BusinessCardDTO, type RankingBreakdown, type ServiceMode,
} from '@conecta/shared';
import { businessesRepo, type BusinessRow } from '../repositories/businesses';

let globalCache: { value: number; at: number } | null = null;

/** Média geral (prior bayesiano). Usa valor padrão até haver 50 avaliações na plataforma. */
export async function globalMean(): Promise<number> {
  if (globalCache && Date.now() - globalCache.at < 5 * 60_000) return globalCache.value;
  const s = await businessesRepo.globalStats();
  const value = s.n >= 50 && s.avg != null ? s.avg : RANKING_PARAMS.fallbackGlobalMean;
  globalCache = { value, at: Date.now() };
  return value;
}

export function modesOf(r: BusinessRow): ServiceMode[] {
  const m: ServiceMode[] = [];
  if (r.mode_in_person) m.push('in_person');
  if (r.mode_at_customer) m.push('at_customer');
  if (r.mode_online) m.push('online');
  return m;
}

export function completenessOf(r: BusinessRow): number {
  return profileCompleteness({
    description: r.description,
    logoUrl: r.logo_url,
    coverUrl: r.cover_url,
    phone: r.phone,
    whatsapp: r.whatsapp,
    website: r.website,
    instagram: r.instagram,
    openingHours: r.opening_hours,
    servicesCount: r.services_count,
    servicesWithPrice: r.services_with_price,
    photosCount: r.photos_count,
    hasAddressOrArea: !!(r.street || r.neighborhood || !r.mode_in_person),
  });
}

export interface Scored {
  row: BusinessRow;
  text: number;
  ranking: RankingBreakdown;
  distanceKm: number | null;
  newcomer: boolean;
}

export function scoreRows(rows: BusinessRow[], opts: { q: string; mean: number; lat?: number; lon?: number; now?: Date }): Scored[] {
  const now = opts.now ?? new Date();
  const out: Scored[] = [];
  for (const row of rows) {
    const text = opts.q
      ? textRelevance(opts.q, {
          name: row.name,
          professionalName: row.professional_name,
          categoryName: row.cat_name,
          categoryKeywords: row.cat_keywords,
          services: row.service_names ?? [],
          neighborhood: row.neighborhood,
          description: row.short_description,
        })
      : 1;
    if (text === 0) continue;
    const ranking = rankBusiness(
      {
        stats: { count: row.review_count, average: row.average, stddev: row.stddev, lastReviewAt: row.last_review_at },
        completeness: completenessOf(row),
        textRelevance: text,
        location: row.location_match,
      },
      opts.mean,
      now,
    );
    const distanceKm =
      opts.lat != null && opts.lon != null && row.lat != null && row.lon != null && row.mode_in_person
        ? Math.round(haversineKm(opts.lat, opts.lon, row.lat, row.lon) * 10) / 10
        : null;
    out.push({ row, text, ranking, distanceKm, newcomer: isNewcomer(row.created_at, row.review_count, now) });
  }
  return out;
}

export function badgesOf(r: BusinessRow) {
  return computeBadges({
    verifiedAt: r.verified_at,
    reviewCount: r.review_count,
    average: r.average,
    stddev: r.stddev,
    firstReviewAt: r.first_review_at,
    lastReviewAt: r.last_review_at,
    requestsReceived: r.requests_received,
    requestsAnswered: r.requests_answered,
    acceptsBooking: r.accepts_booking,
    hasBookableService: r.has_bookable,
    hasOpeningHours: !!r.opening_hours && Object.keys(r.opening_hours).length > 0,
  });
}

export function toCard(s: Scored, opts: { explain?: boolean; now?: Date } = {}): BusinessCardDTO {
  const r = s.row;
  const now = opts.now ?? new Date();
  const fresh = hoursAreFresh(r.hours_updated_at, now);
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    professionalName: r.professional_name,
    category: { slug: r.cat_slug, name: r.cat_name, shortName: r.cat_short, icon: r.cat_icon },
    shortDescription: r.short_description,
    logoUrl: r.logo_url,
    coverUrl: r.cover_url,
    rating: { count: r.review_count, average: r.review_count > 0 ? r.average : null },
    city: { ibge: r.city_ibge, name: r.city_name, uf: r.city_uf },
    neighborhood: r.neighborhood,
    locationMatch: r.location_match,
    distanceKm: s.distanceKm,
    topServices: (r.service_names ?? []).slice(0, 3),
    priceLevel: r.price_level,
    modes: modesOf(r),
    acceptsBooking: r.accepts_booking && r.has_bookable,
    acceptsQuote: r.accepts_quote,
    // Só informamos "aberto agora" quando os horários foram confirmados recentemente.
    openNow: fresh && r.opening_hours && r.mode_in_person ? isOpenAt(r.opening_hours, now, r.timezone) : null,
    badges: badgesOf(r),
    isNewcomer: s.newcomer,
    isDemo: r.is_demo,
    createdAt: new Date(r.created_at).toISOString(),
    rankingExplanation: opts.explain
      ? explainRanking(s.ranking, { count: r.review_count, average: r.average, stddev: r.stddev, lastReviewAt: r.last_review_at })
      : undefined,
  };
}
