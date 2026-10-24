import {
  interleaveNewcomers, normalize, type CategoryDTO, type DiscoverResponse, type SearchQuery, type SearchResponse, type SuggestionDTO,
} from '@conecta/shared';
import { notFound } from '../lib/errors';
import { businessesRepo } from '../repositories/businesses';
import { categoriesRepo } from '../repositories/categories';
import { locationsRepo } from '../repositories/locations';
import { globalMean, scoreRows, toCard, type Scored } from './cards';

let categoriesCache: { value: Array<CategoryDTO & { keywords: string[] }>; at: number } | null = null;
export async function categories() {
  if (!categoriesCache || Date.now() - categoriesCache.at > 10 * 60_000) {
    categoriesCache = { value: await categoriesRepo.list(), at: Date.now() };
  }
  return categoriesCache.value;
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

export async function search(q: SearchQuery): Promise<SearchResponse> {
  const city = await locationsRepo.city(q.city);
  if (!city) throw notFound('Cidade não encontrada.');
  const hasIntent = !!q.q || !!q.category;
  const rows = await businessesRepo.candidates({
    city: city.ibge,
    category: q.category,
    neighborhood: q.neighborhood,
    minRating: q.minRating,
    minReviews: q.minReviews,
    priceLevels: q.priceLevels,
    modes: q.modes,
    bookable: q.bookable,
    // Empresas só on-line de outras cidades aparecem quando há uma busca ou categoria (ou filtro on-line).
    includeOnlineElsewhere: hasIntent || !!q.modes?.includes('online'),
  });
  const mean = await globalMean();
  const scored = scoreRows(rows, { q: q.q, mean, lat: q.lat, lon: q.lon });
  const distanceAvailable = q.lat != null && q.lon != null;
  const sort = q.sort === 'distance' && !distanceAvailable ? 'relevance' : q.sort;
  const sorted = sortScored(scored, sort);
  const start = (q.page - 1) * q.pageSize;
  const items = sorted.slice(start, start + q.pageSize).map((s) => toCard(s, { explain: true }));
  const response: SearchResponse = { items, total: sorted.length, page: q.page, pageSize: q.pageSize, city, appliedSort: sort, distanceAvailable };
  if (sorted.length === 0) response.nearbyCities = await locationsRepo.nearbyWithBusinesses(city);
  return response;
}

export async function discover(cityIbge: number): Promise<DiscoverResponse> {
  const city = await locationsRepo.city(cityIbge);
  if (!city) throw notFound('Cidade não encontrada.');
  const rows = await businessesRepo.candidates({ city: city.ibge, includeOnlineElsewhere: false });
  const mean = await globalMean();
  const scored = scoreRows(rows, { q: '', mean });
  const now = Date.now();
  const sections: DiscoverResponse['sections'] = [];

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

  // Serviços populares: só exibimos com volume mínimo real de solicitações.
  const popular = (await businessesRepo.popularServices(city.ibge, new Date(now - 90 * 86_400_000), 8)).filter((p) => p.requests >= 3);
  return { city, totalBusinesses: rows.length, sections, popularServices: popular.length >= 3 ? popular : [] };
}

export async function suggest(cityIbge: number, q: string): Promise<SuggestionDTO[]> {
  const term = normalize(q);
  if (term.length < 2) return [];
  const cats = await categories();
  const out: SuggestionDTO[] = [];
  for (const c of cats) {
    const kw = c.keywords.find((k) => normalize(k).startsWith(term) || normalize(k).includes(` ${term}`));
    if (normalize(c.name).includes(term) || kw) {
      out.push({ type: 'category', label: c.name, value: c.name, slug: c.slug });
    }
    if (kw && !normalize(c.name).includes(term) && out.filter((o) => o.type === 'service').length < 3) {
      out.push({ type: 'service', label: kw.charAt(0).toUpperCase() + kw.slice(1), value: kw });
    }
  }
  const [services, names] = await Promise.all([businessesRepo.suggestServices(cityIbge, q), businessesRepo.suggestNames(cityIbge, q)]);
  for (const s of services) if (!out.some((o) => normalize(o.label) === normalize(s.name))) out.push({ type: 'service', label: s.name, value: s.name });
  for (const n of names) out.push({ type: 'business', label: n.name, value: n.name, slug: n.slug });
  return out.slice(0, 8);
}
