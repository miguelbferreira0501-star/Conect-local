import {
  buildDiscoverSections, normalize, sortScored, type CategoryDTO, type DiscoverResponse, type SearchQuery, type SearchResponse, type SuggestionDTO,
} from '@conecta/shared';
import { notFound } from '../lib/errors';
import { businessesRepo } from '../repositories/businesses';
import { categoriesRepo } from '../repositories/categories';
import { locationsRepo } from '../repositories/locations';
import { globalMean, scoreRows, toCard } from './cards';

export { sortScored };

let categoriesCache: { value: Array<CategoryDTO & { keywords: string[] }>; at: number } | null = null;
export async function categories() {
  if (!categoriesCache || Date.now() - categoriesCache.at > 10 * 60_000) {
    categoriesCache = { value: await categoriesRepo.list(), at: Date.now() };
  }
  return categoriesCache.value;
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
  const sections = buildDiscoverSections(scored, city.name);

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
