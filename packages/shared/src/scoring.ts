/**
 * Pipeline de pontuação: linha de empresa → relevância, ranking, selos e cartão público.
 * Puro (sem banco): usado pela API, pela prévia sem servidor e pelo futuro painel empresarial.
 */
import { computeBadges, profileCompleteness } from './badges';
import { haversineKm } from './geo';
import { hoursAreFresh, isOpenAt } from './hours';
import { explainRanking, interleaveNewcomers, isNewcomer, rankBusiness, type RankingBreakdown } from './ranking';
import type { SearchQuery, ServiceMode } from './schemas';
import { textRelevance } from './text';
import type { BusinessCardDTO, DiscoverSection } from './types';

export interface BusinessRow {
  id: string;
  slug: string;
  name: string;
  professional_name: string | null;
  short_description: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  street: string | null;
  neighborhood: string | null;
  postal_code: string | null;
  city_ibge: number;
  lat: number | null;
  lon: number | null;
  address_public: boolean;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  email: string | null;
  price_level: number | null;
  mode_in_person: boolean;
  mode_at_customer: boolean;
  mode_online: boolean;
  accepts_booking: boolean;
  accepts_quote: boolean;
  opening_hours: Record<string, Array<[string, string]>> | null;
  hours_updated_at: string | Date | null;
  verified_at: string | Date | null;
  requests_received: number;
  requests_answered: number;
  is_demo: boolean;
  created_at: string | Date;
  cat_slug: string;
  cat_name: string;
  cat_short: string;
  cat_icon: string;
  cat_keywords: string[];
  city_name: string;
  city_uf: string;
  timezone: string;
  review_count: number;
  average: number | null;
  stddev: number | null;
  first_review_at: string | Date | null;
  last_review_at: string | Date | null;
  location_match: 'establishmentInCity' | 'servesCity' | 'onlineOnly';
  service_names: string[] | null;
  services_count: number;
  services_with_price: number;
  has_bookable: boolean;
  photos_count: number;
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

/** Desempates estáveis: mais avaliações e, depois, nome. */
const tie = (a: Scored, b: Scored) => b.row.review_count - a.row.review_count || a.row.name.localeCompare(b.row.name, 'pt-BR');

export function sortScored(list: Scored[], sort: SearchQuery['sort']): Scored[] {
  const arr = [...list];
  switch (sort) {
    case 'rating':
      // Usa a nota ajustada (bayesiana) para não premiar quem tem 1 avaliação 5 estrelas.
      return arr.sort((a, b) => b.ranking.bayesianRating - a.ranking.bayesianRating || tie(a, b));
    case 'reviews':
      return arr.sort((a, b) => b.row.review_count - a.row.review_count || b.ranking.score - a.ranking.score);
    case 'distance':
      return arr.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) || b.ranking.score - a.ranking.score);
    case 'newest':
      return arr.sort((a, b) => new Date(b.row.created_at).getTime() - new Date(a.row.created_at).getTime());
    default:
      return interleaveNewcomers(arr.sort((a, b) => b.ranking.score - a.ranking.score || tie(a, b)), (s) => s.newcomer);
  }
}


/** Seções da tela inicial, a partir das empresas já pontuadas de uma cidade. */
export function buildDiscoverSections(scored: Scored[], cityName: string, nowDate: Date = new Date()): DiscoverSection[] {
  const city = { name: cityName };
  const now = nowDate.getTime();
  const sections: DiscoverSection[] = [];

  const topRated = [...scored]
    .filter((s) => s.row.review_count >= 5)
    .sort((a, b) => b.ranking.bayesianRating - a.ranking.bayesianRating || tie(a, b))
    .slice(0, 8);
  if (topRated.length) sections.push({ id: 'top-rated', title: `Bem avaliadas em ${city.name}`, subtitle: 'Nota ajustada pela quantidade de avaliações', items: topRated.map((s) => toCard(s)) });

  const byCategory = new Map<string, Scored>();
  for (const s of topRated.length ? [...scored].filter((x) => x.row.review_count >= 5).sort((a, b) => b.ranking.bayesianRating - a.ranking.bayesianRating) : []) {
    if (!byCategory.has(s.row.cat_slug)) byCategory.set(s.row.cat_slug, s);
  }
  if (byCategory.size >= 3) sections.push({ id: 'best-per-category', title: 'A mais bem avaliada de cada categoria', items: [...byCategory.values()].map((s) => toCard(s)) });

  const recent = scored
    .filter((s) => s.row.last_review_at && now - new Date(s.row.last_review_at).getTime() < 30 * 86_400_000)
    .sort((a, b) => new Date(b.row.last_review_at!).getTime() - new Date(a.row.last_review_at!).getTime())
    .slice(0, 8);
  if (recent.length) sections.push({ id: 'recent-reviews', title: 'Com avaliações recentes', subtitle: 'Avaliadas nos últimos 30 dias', items: recent.map((s) => toCard(s)) });

  const newcomers = scored
    .filter((s) => now - new Date(s.row.created_at).getTime() < 90 * 86_400_000)
    .sort((a, b) => new Date(b.row.created_at).getTime() - new Date(a.row.created_at).getTime())
    .slice(0, 8);
  if (newcomers.length) sections.push({ id: 'newcomers', title: 'Novas na plataforma', subtitle: 'Ainda com poucas avaliações', items: newcomers.map((s) => toCard(s)) });

  return sections;
}
