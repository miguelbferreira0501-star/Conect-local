/**
 * PRÉVIA SEM SERVIDOR.
 * Responde às mesmas rotas da API real usando as regras de @conecta/shared e os dados de demonstração
 * exportados do banco (data.json). Contas, favoritos, pedidos e avaliações criados na prévia ficam
 * apenas no navegador de quem a abriu (localStorage). Não há segurança real aqui: é só para visualizar.
 */
import {
  ACTIVITY_LIMITS, BRAND, RANKING_PARAMS, REVIEW_RULES, bookingProfile, bookingRequestSchema, buildDiscoverSections, computeAvailability,
  CITY_PRICE_MIN_BUSINESSES, median, serviceReferenceCents, haversineKm, hoursAreFresh, localDateOf, loginSchema, normalize, profileUpdateSchema, publicAuthorName, quoteRequestSchema, registerSchema,
  reviewInputSchema, reviewReportSchema, reviewUpdateSchema, scoreRows, searchQuerySchema, sortScored, toActivityDTO, toCard,
  type ActivityRow, type BusinessRow, type CityDTO, type SuggestionDTO,
  LIVE_STAGE_DETAILS, liveFlow, petInputSchema, repeatDates, type LiveStage, type LiveUpdateDTO, type PetDTO,
  bookingOccurrences, RETURN_AFTER_DAYS, LIVE_STAGES, type MyPackageDTO, type PackageDTO,
} from '@conecta/shared';
import type { ZodTypeAny } from 'zod';
import raw from './data.json';
import { storage } from '@/lib/storage';

type Json = any; // eslint-disable-line @typescript-eslint/no-explicit-any

export class MockError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string>) {
    super(message);
  }
}

const NOW = Date.now();
const at = (msAgo: number | null) => (msAgo == null ? null : new Date(NOW - msAgo));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => ((Math.random() * 16) | 0).toString(16)));

// ── Dados de referência ──
const D = raw as Json;
const cities = new Map<number, CityDTO>();
for (const [ibge, name, uf, lat, lon, tz] of D.cities) cities.set(ibge, { ibge, name, uf, lat, lon, timezone: tz || 'America/Sao_Paulo' });
const citiesByUf = new Map<string, Array<{ ibge: number; name: string }>>();
for (const c of cities.values()) {
  if (!citiesByUf.has(c.uf)) citiesByUf.set(c.uf, []);
  citiesByUf.get(c.uf)!.push({ ibge: c.ibge, name: c.name });
}
const categories = D.categories as Array<{ id: number; slug: string; name: string; shortName: string; icon: string; description: string; keywords: string[] }>;
const catById = new Map(categories.map((c) => [c.id, c]));
const businesses = (D.businesses as Json[]).map((b) => ({ ...b, created_at: at(b.created_at), hours_updated_at: at(b.hours_updated_at), verified_at: at(b.verified_at) }));
const bizById = new Map(businesses.map((b) => [b.id, b]));
const bizBySlug = new Map(businesses.map((b) => [b.slug, b]));
const servicesByBiz = new Map<string, Json[]>();
for (const s of D.services) {
  if (!servicesByBiz.has(s.business_id)) servicesByBiz.set(s.business_id, []);
  servicesByBiz.get(s.business_id)!.push(s);
}
const areasByBiz = new Map<string, number[]>();
for (const a of D.areas) {
  if (!areasByBiz.has(a.business_id)) areasByBiz.set(a.business_id, []);
  areasByBiz.get(a.business_id)!.push(a.city_ibge);
}
interface Review { id: string; business_id: string; user_id: string | null; author: string; service_id: string | null; rating: number; comment: string; aspects: Record<string, number>; created_at: string; updated_at: string; booking_id?: string | null; quote_id?: string | null }
const seedReviews: Review[] = (D.reviews as Json[]).map(([id, business_id, author, service_id, rating, comment, aspects, ago]) => {
  const d = at(ago)!.toISOString();
  return { id, business_id, user_id: null, author, service_id, rating, comment, aspects: aspects || {}, created_at: d, updated_at: d };
});

// ── Estado local (navegador) ──
interface State {
  users: Array<{ id: string; name: string; email: string; pwd: string; phone: string | null; cityIbge: number | null; createdAt: string }>;
  session: string | null;
  favorites: Record<string, string[]>;
  bookings: Array<{ id: string; user_id: string; business_id: string; service_id: string; starts_at: string; ends_at: string; status: string; notes?: string; created_at: string; completed_at?: string | null;
    pet_id?: string | null; series_id?: string | null; sim?: boolean; address?: string | null; destination?: string | null; details?: Json; deposit_cents?: number | null; customer_package_id?: string | null }>;
  myPackages?: Array<{ id: string; user_id: string; package_id: string; business_id: string; status: 'requested' | 'active' | 'cancelled'; created_at: string; pet_id: string | null }>;
  pets: Array<PetDTO & { user_id: string }>;
  quotes: Array<{ id: string; user_id: string; business_id: string; service_id: string | null; description: string; preferred_date: string | null; contact_preference: string; status: string; created_at: string; hired_at?: string | null }>;
  reviews: Review[];
  reports: Array<{ review_id: string; user_id: string }>;
}
const KEY = 'cl_preview_state_v2';
const DEMO_PET = '00000000-0000-4000-8000-00000000a001';
const DEMO_ID = '00000000-0000-4000-8000-000000000001';

function initialState(): State {
  const d = D.demo;
  return {
    users: [{ id: DEMO_ID, name: d.name, email: d.email, pwd: 'Demo1234', phone: null, cityIbge: d.cityIbge, createdAt: new Date(NOW - 30 * 86_400_000).toISOString() }],
    session: null,
    favorites: { [DEMO_ID]: d.favorites },
    bookings: d.bookings.map((b: Json) => ({ ...b, user_id: DEMO_ID, starts_at: at(b.starts_at)!.toISOString(), ends_at: at(b.ends_at)!.toISOString(), created_at: at(b.created_at)!.toISOString() })),
    quotes: d.quotes.map((q: Json) => ({ ...q, user_id: DEMO_ID, created_at: at(q.created_at)!.toISOString() })),
    reviews: [],
    reports: [],
    pets: [{ id: DEMO_PET, user_id: DEMO_ID, name: 'Thor', species: 'dog', breed: 'Shih-tzu', size: 'small', sex: 'male', birthYear: 2021, weightKg: 6.5,
      temperament: ['Medroso', 'Medo de secador'], healthNotes: 'Alergia a shampoo com perfume.', careNotes: null, groomingNotes: 'Tosa bebê, orelhas compridas.', vaccinesUpToDate: true, photoUrl: null }],
  };
}

/** Prévia: um banho de hoje já "acontecendo", para o Pet ao Vivo aparecer logo de cara. */
function withLiveDemo(st: State): State {
  const shop = businesses.find((b) => b.city_ibge === D.demo.cityIbge && catById.get(b.category_id)?.slug === 'banho-e-tosa' && (servicesByBiz.get(b.id) ?? []).some((x) => x.bookable));
  if (!shop) return st;
  const svc = (servicesByBiz.get(shop.id) ?? []).find((x) => x.bookable)!;
  const start = new Date(NOW + 20 * 60_000);
  start.setMinutes(0, 0, 0);
  st.bookings.push({ id: uid(), user_id: DEMO_ID, business_id: shop.id, service_id: svc.id, starts_at: start.toISOString(), ends_at: new Date(start.getTime() + (svc.duration_minutes ?? 60) * 60_000).toISOString(),
    status: 'confirmed', created_at: new Date(NOW - 25_000).toISOString(), pet_id: DEMO_PET, sim: true });
  return st;
}
let S: State = storage.get<State | null>(KEY, null) ?? withLiveDemo(initialState());
const save = () => storage.set(KEY, S);
export function resetPreview() {
  S = withLiveDemo(initialState());
  save();
}

// ── Auxiliares ──
function parse<T extends ZodTypeAny>(schema: T, data: unknown) {
  const r = schema.safeParse(data);
  if (!r.success) {
    const fields: Record<string, string> = {};
    for (const i of r.error.issues) fields[i.path.join('.') || '_'] ??= i.message;
    throw new MockError(422, 'validation_error', Object.values(fields)[0] ?? 'Dados inválidos.', fields);
  }
  return r.data as ReturnType<T['parse']>;
}
const me = () => S.users.find((u) => u.id === S.session) ?? null;
function requireUser() {
  const u = me();
  if (!u) throw new MockError(401, 'unauthorized', 'Entre na sua conta para continuar.');
  return u;
}
const userDTO = (u: State['users'][number]) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, cityIbge: u.cityIbge, createdAt: u.createdAt });
const allReviews = () => [...seedReviews, ...S.reviews];

function statsFor(bizId: string) {
  const rs = allReviews().filter((r) => r.business_id === bizId);
  const n = rs.length;
  if (!n) return { review_count: 0, average: null, stddev: null, first_review_at: null, last_review_at: null, dist: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  const avg = rs.reduce((a, r) => a + r.rating, 0) / n;
  const sd = Math.sqrt(rs.reduce((a, r) => a + (r.rating - avg) ** 2, 0) / n);
  const times = rs.map((r) => new Date(r.created_at).getTime());
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
  for (const r of rs) dist[r.rating as 1]++;
  return { review_count: n, average: avg, stddev: sd, first_review_at: new Date(Math.min(...times)), last_review_at: new Date(Math.max(...times)), dist };
}

function rowFor(b: Json, cityIbge: number): BusinessRow {
  const cat = catById.get(b.category_id)!;
  const city = cities.get(b.city_ibge)!;
  const svcs = servicesByBiz.get(b.id) ?? [];
  const st = statsFor(b.id);
  return {
    ...b,
    cat_slug: cat.slug, cat_name: cat.name, cat_short: cat.shortName, cat_icon: cat.icon, cat_keywords: cat.keywords,
    city_name: city.name, city_uf: city.uf, timezone: city.timezone,
    review_count: st.review_count, average: st.average, stddev: st.stddev, first_review_at: st.first_review_at, last_review_at: st.last_review_at,
    location_match: b.city_ibge === cityIbge ? 'establishmentInCity' : (areasByBiz.get(b.id) ?? []).includes(cityIbge) ? 'servesCity' : 'onlineOnly',
    service_names: svcs.map((s) => s.name), services_count: svcs.length,
    services_with_price: svcs.filter((s) => s.price_type !== 'quote').length, has_bookable: svcs.some((s) => s.bookable), photos_count: 0,
  } as BusinessRow;
}

function cityPriceFor(b: Json, name: string) {
  const key = normalize(name);
  const perBiz = new Map<string, number>();
  for (const o of businesses) {
    if (o.city_ibge !== b.city_ibge || o.category_id !== b.category_id) continue;
    for (const s of servicesByBiz.get(o.id) ?? []) {
      if (normalize(s.name) !== key) continue;
      const ref = serviceReferenceCents({ priceType: s.price_type, priceMinCents: s.price_min_cents, priceMaxCents: s.price_max_cents });
      if (ref != null && !perBiz.has(o.id)) perBiz.set(o.id, ref);
    }
  }
  return perBiz.size >= CITY_PRICE_MIN_BUSINESSES ? { medianCents: median([...perBiz.values()]), businesses: perBiz.size } : null;
}

function globalMean() {
  const rs = allReviews();
  return rs.length >= 50 ? rs.reduce((a, r) => a + r.rating, 0) / rs.length : RANKING_PARAMS.fallbackGlobalMean;
}

function candidates(city: number, f: { category?: string; neighborhood?: string; minRating?: number; minReviews?: number; priceLevels?: number[]; modes?: string[]; bookable?: boolean; includeOnline: boolean }) {
  return businesses
    .filter((b) => b.city_ibge === city || (areasByBiz.get(b.id) ?? []).includes(city) || (f.includeOnline && b.mode_online))
    .map((b) => rowFor(b, city))
    .filter((r) =>
      (!f.category || r.cat_slug === f.category) &&
      (!f.neighborhood || normalize(r.neighborhood ?? '') === normalize(f.neighborhood)) &&
      (!f.minRating || (r.average ?? 0) >= f.minRating) &&
      (!f.minReviews || r.review_count >= f.minReviews) &&
      (!f.priceLevels?.length || f.priceLevels.includes(r.price_level ?? -1)) &&
      (f.modes ?? []).every((m) => (r as Json)[`mode_${m}`]) &&
      (!f.bookable || (r.accepts_booking && r.has_bookable)),
    );
}

function nearbyCities(city: CityDTO) {
  const counts = new Map<number, number>();
  for (const b of businesses) counts.set(b.city_ibge, (counts.get(b.city_ibge) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([ibge]) => ibge !== city.ibge)
    .map(([ibge, n]) => {
      const c = cities.get(ibge)!;
      return { ibge, name: c.name, uf: c.uf, businesses: n, distanceKm: Math.round(haversineKm(city.lat, city.lon, c.lat, c.lon)) };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 5);
}

// ── Pet ao Vivo simulado (a prévia não tem empresa real do outro lado) ──
const SIM_NOTES: Record<string, (pet: string) => string> = {
  checkin: (p) => `${p} chegou e foi recebido com carinho!`, bath: () => 'Banho com shampoo hipoalergênico, água morninha.',
  drying: () => 'Secagem em temperatura baixa, sem susto.', grooming: () => 'Tosa do jeitinho que está na ficha.',
  ready: (p) => `${p} está pronto e cheiroso! Pode vir buscar.`, walk_start: () => 'Saímos! Rota tranquila pelo parque.',
  walk_end: () => 'Voltamos! 42 minutos de passeio.', visit_start: () => 'Cheguei! Tudo certo por aqui.',
  visit_end: () => 'Tudo feito, com muito carinho.', pickup: (p) => `Buscamos ${p}. A caminho!`, dropoff: (p) => `${p} foi entregue em segurança.`,
  done: () => 'Atendimento concluído.',
};
/** Foto simulada da prévia: ilustração plana na paleta do app (a pata da marca), com o nome da etapa. */
function simPhoto(stage: string, pet: string) {
  const label = (LIVE_STAGES as Record<string, { label: string }>)[stage]?.label ?? 'Foto';
  const paw = '<g fill="#f1bcd3"><circle cx="19.5" cy="27" r="4.6"/><circle cx="27.2" cy="19" r="4.9"/><circle cx="36.8" cy="19" r="4.9"/><circle cx="44.5" cy="27" r="4.6"/><path d="M32 30c-6.9 0-13 6.6-13 12 0 3.9 3 5.8 6.5 5.8 2.6 0 4.1-1.4 6.5-1.4s3.9 1.4 6.5 1.4c3.5 0 6.5-1.9 6.5-5.8 0-5.4-6.1-12-13-12z"/></g>';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><rect width="640" height="400" fill="#fdf2f7"/><g transform="translate(224 70) scale(3)">${paw}</g><text x="320" y="320" font-size="30" font-family="DM Sans, Arial" font-weight="600" fill="#6b1d3e" text-anchor="middle">${pet} · ${label}</text><text x="320" y="356" font-size="20" font-family="DM Sans, Arial" fill="#9d2b5a" text-anchor="middle">Imagem ilustrativa da prévia</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
const SIM_STEP_MS = 14_000;
function simLive(b: State['bookings'][number]): LiveUpdateDTO[] {
  if (!b.sim) return [];
  const biz = bizById.get(b.business_id);
  const flow = liveFlow(catById.get(biz?.category_id)?.slug ?? '');
  const pet = S.pets.find((p) => p.id === b.pet_id)?.name ?? 'Seu pet';
  const t0 = new Date(b.created_at).getTime() + 8_000;
  return flow.map((stage: LiveStage, i: number) => ({ stage, at: t0 + i * SIM_STEP_MS })).filter((x) => x.at <= Date.now()).map((x, i) => ({
    id: `${b.id}-${i}`, stage: x.stage, note: SIM_NOTES[x.stage]?.(pet) ?? null,
    details: Object.fromEntries((LIVE_STAGE_DETAILS[x.stage] ?? []).map((d) => [d, true])), photoUrl: simPhoto(x.stage, pet), createdAt: new Date(x.at).toISOString(),
  }));
}
/** Na prévia, a "empresa" confirma sozinha e conclui ao fim das etapas. */
function simStatus(b: State['bookings'][number]) {
  if (!b.sim || b.status === 'cancelled') return b;
  const flow = liveFlow(catById.get(bizById.get(b.business_id)?.category_id)?.slug ?? '');
  const live = simLive(b);
  if (live.length >= flow.length && b.status !== 'completed') { b.status = 'completed'; b.completed_at = live.at(-1)!.createdAt; save(); }
  else if (b.status === 'requested' && Date.now() - new Date(b.created_at).getTime() > 5_000) { b.status = 'confirmed'; save(); }
  return b;
}

function activityRows(userId: string): ActivityRow[] {
  const reviewFor = (k: 'booking_id' | 'quote_id', id: string) => S.reviews.find((r) => r[k] === id)?.id ?? null;
  const base = (bizId: string) => {
    const b = bizById.get(bizId)!;
    return { business_id: b.id, business_slug: b.slug, business_name: b.name, logo_url: b.logo_url, category_name: catById.get(b.category_id)!.name, is_demo: true };
  };
  const svcName = (bizId: string, sid: string | null) => (servicesByBiz.get(bizId) ?? []).find((s) => s.id === sid)?.name ?? null;
  const rows: ActivityRow[] = [
    ...S.bookings.filter((b) => b.user_id === userId).map(simStatus).map((b) => {
      const live = simLive(b);
      const pet = S.pets.find((p) => p.id === b.pet_id);
      return {
      pet_id: pet?.id ?? null, pet_name: pet?.name ?? null, series_id: b.series_id ?? null,
      live_count: live.length, live_last_stage: live.at(-1)?.stage ?? null, live_last_at: live.at(-1)?.createdAt ?? null,
      id: b.id, type: 'booking' as const, status: b.status, ...base(b.business_id), service_name: svcName(b.business_id, b.service_id), service_id: b.service_id,
      starts_at: b.starts_at, preferred_date: null, description: b.notes ?? null, created_at: b.created_at, closed_at: b.completed_at ?? null, review_id: reviewFor('booking_id', b.id),
      ends_at: b.ends_at, address: b.address ?? null, destination: b.destination ?? null, details: b.details ?? {}, deposit_cents: b.deposit_cents ?? null,
      deposit_status: b.deposit_cents ? ('pending' as const) : null, pix_key: pixKeyFor(bizById.get(b.business_id)), customer_package_id: b.customer_package_id ?? null,
      city_name: cities.get(bizById.get(b.business_id).city_ibge)?.name ?? '',
    }; }),
    ...S.quotes.filter((q) => q.user_id === userId).map((q) => ({
      id: q.id, type: 'quote' as const, status: q.status, ...base(q.business_id), service_name: svcName(q.business_id, q.service_id), service_id: q.service_id,
      starts_at: null, preferred_date: q.preferred_date, description: q.description, created_at: q.created_at, closed_at: q.hired_at ?? null, review_id: reviewFor('quote_id', q.id),
    })),
  ];
  return rows.sort((a, b) => new Date(b.starts_at ?? b.created_at).getTime() - new Date(a.starts_at ?? a.created_at).getTime());
}

function activities(userId: string) {
  const last = new Map<string, Date>();
  for (const r of S.reviews.filter((x) => x.user_id === userId)) {
    const d = new Date(r.created_at);
    if (!last.has(r.business_id) || d > last.get(r.business_id)!) last.set(r.business_id, d);
  }
  return activityRows(userId).map((r) => toActivityDTO(r, last));
}

function availability(bizId: string, serviceId: string, date: string) {
  const b = bizById.get(bizId);
  if (!b) throw new MockError(404, 'not_found', 'Empresa não encontrada.');
  const svc = (servicesByBiz.get(bizId) ?? []).find((s) => s.id === serviceId);
  if (!b.accepts_booking || !svc?.bookable) throw new MockError(422, 'service_not_bookable', 'Este serviço não pode ser agendado pela plataforma.');
  const tz = cities.get(b.city_ibge)!.timezone;
  const busy = S.bookings.filter((x) => x.business_id === bizId && (x.status === 'requested' || x.status === 'confirmed')).map((x) => ({ ...x, staff_id: null }));
  const r = computeAvailability({ mode: 'slot', date, timezone: tz, durationMinutes: svc.duration_minutes, businessHours: b.opening_hours, staff: [], busy });
  return { date, timezone: tz, mode: 'slot', durationMinutes: svc.duration_minutes, slots: r.slots, staff: [] };
}

// ── Benefícios na prévia: Pix fictício, cartão fidelidade, sinal e pacotes ──
const BENEFIT_CATS = new Set(['banho-e-tosa', 'passeador', 'hospedagem-e-creche', 'adestramento']);
const catSlug = (b: Json) => catById.get(b.category_id)?.slug ?? '';
const pixKeyFor = (b: Json) => (BENEFIT_CATS.has(catSlug(b)) ? `pix+${b.slug.slice(0, 30)}@exemplo.invalid` : null);
const depositFor = (b: Json, s: Json) => (['banho-e-tosa', 'hospedagem-e-creche'].includes(catSlug(b)) && s.bookable && (s.price_min_cents ?? 0) >= 4000 ? 2000 : null);
function packagesFor(b: Json): PackageDTO[] {
  const cat = catSlug(b);
  if (!['banho-e-tosa', 'passeador', 'adestramento'].includes(cat)) return [];
  const s = (servicesByBiz.get(b.id) ?? []).find((x) => x.bookable && ['fixed', 'from'].includes(x.price_type) && x.price_min_cents > 0);
  if (!s) return [];
  const n = cat === 'passeador' ? 8 : 4;
  return [{ id: `pkg-${s.id}`, serviceId: s.id, serviceName: s.name, name: cat === 'passeador' ? 'Clube 8 passeios no mês' : cat === 'adestramento' ? 'Pacote 4 aulas' : 'Clube 4 banhos no mês',
    sessions: n, priceCents: Math.round((s.price_min_cents * n * 0.85) / 100) * 100, validityDays: 30, active: true, singlePriceCents: s.price_min_cents }];
}
function myPackages(userId: string): MyPackageDTO[] {
  return (S.myPackages ?? []).filter((x) => x.user_id === userId && x.status !== 'cancelled').map((x) => {
    const b = bizById.get(x.business_id)!;
    const p = packagesFor(b).find((y) => y.id === x.package_id)!;
    const used = S.bookings.filter((bk) => bk.customer_package_id === x.id && bk.status !== 'cancelled').length;
    // Na prévia a empresa "confirma o pagamento" sozinha depois de alguns segundos.
    const status = x.status === 'requested' && Date.now() - new Date(x.created_at).getTime() > 15_000 ? 'active' : x.status;
    return { id: x.id, name: p.name, serviceId: p.serviceId, serviceName: p.serviceName, business: { id: b.id, slug: b.slug, name: b.name, pixKey: pixKeyFor(b), city: cities.get(b.city_ibge)!.name },
      sessions: p.sessions, remaining: p.sessions - used, priceCents: p.priceCents, status, expiresAt: null, createdAt: x.created_at, petName: S.pets.find((pt) => pt.id === x.pet_id)?.name ?? null };
  });
}
function reminders(userId: string) {
  const seen = new Set<string>();
  const out = [];
  for (const bk of S.bookings.filter((x) => x.user_id === userId).map(simStatus).filter((x) => x.status === 'completed').sort((a, b) => b.starts_at.localeCompare(a.starts_at))) {
    const key = `${bk.pet_id}-${bk.service_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const b = bizById.get(bk.business_id)!;
    const days = Math.floor((Date.now() - new Date(bk.starts_at).getTime()) / 86_400_000);
    const upcoming = S.bookings.some((x) => x.user_id === userId && x.service_id === bk.service_id && new Date(x.starts_at) > new Date() && ['requested', 'confirmed'].includes(x.status));
    if (upcoming || RETURN_AFTER_DAYS[catSlug(b)] == null || days < RETURN_AFTER_DAYS[catSlug(b)] || days > 120) continue;
    out.push({ petId: bk.pet_id ?? null, petName: S.pets.find((p) => p.id === bk.pet_id)?.name ?? null, business: { slug: b.slug, name: b.name }, serviceId: bk.service_id,
      serviceName: (servicesByBiz.get(b.id) ?? []).find((s) => s.id === bk.service_id)?.name ?? 'atendimento', daysSince: days });
  }
  return out.slice(0, 3);
}

// ── Rotas ──
export async function handle(method: string, fullPath: string, body: Json): Promise<Json> {
  const [path, qsPart] = fullPath.split('?');
  const query = Object.fromEntries(new URLSearchParams(qsPart ?? ''));
  const m = (re: RegExp) => path.match(re);
  let r: RegExpMatchArray | null;

  if (method === 'GET') {
    if (path === '/config') return { brand: BRAND, demoMode: true, preview: true };
    if (path === '/locations/states') return D.states;
    if ((r = m(/^\/locations\/states\/([A-Za-z]{2})\/cities$/))) return citiesByUf.get(r[1].toUpperCase()) ?? [];
    if ((r = m(/^\/locations\/cities\/(\d+)$/))) {
      const c = cities.get(Number(r[1]));
      if (!c) throw new MockError(404, 'not_found', 'Cidade não encontrada.');
      return c;
    }
    if (path === '/locations/nearest') {
      const lat = Number(query.lat), lon = Number(query.lon);
      let best: CityDTO | null = null, bd = Infinity;
      for (const c of cities.values()) { const d = haversineKm(lat, lon, c.lat, c.lon); if (d < bd) { bd = d; best = c; } }
      return best;
    }
    if (path === '/categories') return categories.map(({ keywords: _k, ...c }) => c);
    if (path === '/search') {
      const q = parse(searchQuerySchema, query);
      const city = cities.get(q.city);
      if (!city) throw new MockError(404, 'not_found', 'Cidade não encontrada.');
      const rows = candidates(city.ibge, { ...q, includeOnline: !!q.q || !!q.category || !!q.modes?.includes('online') });
      const scored = scoreRows(rows, { q: q.q, mean: globalMean(), lat: q.lat, lon: q.lon });
      const distanceAvailable = q.lat != null && q.lon != null;
      const sort = q.sort === 'distance' && !distanceAvailable ? 'relevance' : q.sort;
      const sorted = sortScored(scored, sort);
      const start = (q.page - 1) * q.pageSize;
      const res: Json = { items: sorted.slice(start, start + q.pageSize).map((s) => toCard(s, { explain: true })), total: sorted.length, page: q.page, pageSize: q.pageSize, city, appliedSort: sort, distanceAvailable };
      if (!sorted.length) res.nearbyCities = nearbyCities(city);
      return res;
    }
    if (path === '/search/suggest') {
      const term = normalize(query.q ?? '');
      const city = Number(query.city);
      if (term.length < 2) return [];
      const out: SuggestionDTO[] = [];
      for (const c of categories) {
        const kw = c.keywords.find((k) => normalize(k).startsWith(term) || normalize(k).includes(` ${term}`));
        if (normalize(c.name).includes(term) || kw) out.push({ type: 'category', label: c.name, value: c.name, slug: c.slug });
        if (kw && !normalize(c.name).includes(term) && out.filter((o) => o.type === 'service').length < 3) out.push({ type: 'service', label: kw.charAt(0).toUpperCase() + kw.slice(1), value: kw });
      }
      const local = businesses.filter((b) => b.city_ibge === city || (areasByBiz.get(b.id) ?? []).includes(city));
      const svcNames = [...new Set(local.flatMap((b) => (servicesByBiz.get(b.id) ?? []).map((s) => s.name)))].filter((n) => normalize(n).includes(term)).slice(0, 4);
      for (const s of svcNames) if (!out.some((o) => normalize(o.label) === normalize(s))) out.push({ type: 'service', label: s, value: s });
      for (const b of local.filter((x) => normalize(x.name).includes(term)).slice(0, 4)) out.push({ type: 'business', label: b.name, value: b.name, slug: b.slug });
      return out.slice(0, 8);
    }
    if (path === '/discover') {
      const city = cities.get(Number(query.city));
      if (!city) throw new MockError(404, 'not_found', 'Cidade não encontrada.');
      const rows = candidates(city.ibge, { includeOnline: false });
      const scored = scoreRows(rows, { q: '', mean: globalMean() });
      const popular = (D.popular[city.ibge] ?? []).filter((p: Json) => p.requests >= 3);
      return { city, totalBusinesses: rows.length, sections: buildDiscoverSections(scored, city.name), popularServices: popular.length >= 3 ? popular : [] };
    }
    if ((r = m(/^\/businesses\/([0-9a-f-]{36})\/reviews$/))) {
      const sort = query.sort ?? 'recent';
      const page = Number(query.page ?? 1);
      const rating = query.rating ? Number(query.rating) : undefined;
      const u = me();
      let list = allReviews().filter((x) => x.business_id === r![1] && (!rating || x.rating === rating));
      list = list.sort((a, b) =>
        sort === 'highest' ? b.rating - a.rating || b.created_at.localeCompare(a.created_at)
        : sort === 'lowest' ? a.rating - b.rating || b.created_at.localeCompare(a.created_at)
        : b.created_at.localeCompare(a.created_at));
      const svcName = (sid: string | null) => (servicesByBiz.get(r![1]) ?? []).find((s) => s.id === sid)?.name ?? null;
      return {
        items: list.slice((page - 1) * 10, page * 10).map((x) => ({
          id: x.id, authorName: x.author, rating: x.rating, comment: x.comment, aspects: x.aspects, verifiedInteraction: true,
          serviceName: svcName(x.service_id), createdAt: x.created_at, updatedAt: x.updated_at, isMine: !!u && x.user_id === u.id,
        })),
        total: list.length, page, pageSize: 10,
      };
    }
    if ((r = m(/^\/businesses\/([0-9a-f-]{36})\/availability$/))) return availability(r[1], query.serviceId, query.date);
    if ((r = m(/^\/businesses\/([a-z0-9-]+)$/))) {
      const b = bizBySlug.get(r[1]);
      if (!b) throw new MockError(404, 'not_found', 'Empresa não encontrada.');
      const row = rowFor(b, b.city_ibge);
      const [scored] = scoreRows([row], { q: '', mean: globalMean() });
      const st = statsFor(b.id);
      const aspectsAgg: Record<string, number[]> = {};
      for (const x of allReviews().filter((y) => y.business_id === b.id)) for (const [k, v] of Object.entries(x.aspects)) (aspectsAgg[k] ??= []).push(v);
      const u = me();
      return {
        ...toCard(scored),
        description: b.description,
        address: { street: b.address_public ? b.street : null, neighborhood: b.neighborhood, postalCode: null, public: b.address_public },
        coordinates: b.address_public && b.lat != null && b.mode_in_person ? { lat: b.lat, lon: b.lon } : null,
        serviceAreaCities: (areasByBiz.get(b.id) ?? []).map((i) => ({ ibge: i, name: cities.get(i)!.name, uf: cities.get(i)!.uf })),
        openingHours: b.opening_hours, hoursUpdatedAt: b.hours_updated_at?.toISOString() ?? null, hoursFresh: hoursAreFresh(b.hours_updated_at),
        timezone: row.timezone,
        contact: { phone: b.phone, whatsapp: b.whatsapp, website: b.website, instagram: b.instagram, facebook: b.facebook, email: b.email },
        services: (servicesByBiz.get(b.id) ?? []).map((s) => ({
          id: s.id, name: s.name, description: s.description, priceType: s.price_type, priceMinCents: s.price_min_cents, priceMaxCents: s.price_max_cents,
          durationMinutes: s.duration_minutes, bookable: s.bookable, bookingMode: 'slot', notes: s.notes, cityPrice: cityPriceFor(b, s.name),
          depositCents: pixKeyFor(b) ? depositFor(b, s) : null,
        })),
        pixKey: pixKeyFor(b),
        loyaltyEvery: BENEFIT_CATS.has(catSlug(b)) ? 10 : null,
        myLoyaltyVisits: u && BENEFIT_CATS.has(catSlug(b)) ? S.bookings.filter((x) => x.user_id === u.id && x.business_id === b.id).map(simStatus).filter((x) => x.status === 'completed').length : null,
        packages: packagesFor(b),
        photos: [],
        staff: [],
        staffLabel: bookingProfile(catById.get(b.category_id)!.slug).staffLabel,
        ratingDistribution: st.dist,
        aspectAverages: Object.fromEntries(Object.entries(aspectsAgg).filter(([, v]) => v.length >= 3).map(([k, v]) => [k, Math.round((v.reduce((a, c) => a + c, 0) / v.length) * 10) / 10])),
        verifiedAt: b.verified_at?.toISOString() ?? null,
        isFavorite: !!u && (S.favorites[u.id] ?? []).includes(b.id),
      };
    }
    if (path === '/auth/me') return { user: me() ? userDTO(me()!) : null };
    if (path === '/me/favorites') {
      const u = requireUser();
      const rows = (S.favorites[u.id] ?? []).map((id) => bizById.get(id)).filter(Boolean).map((b) => rowFor(b, b.city_ibge));
      return scoreRows(rows, { q: '', mean: globalMean() }).map((s) => toCard(s));
    }
    if (path === '/me/activities') return activities(requireUser().id);
    if (path === '/me/packages') return myPackages(requireUser().id);
    if (path === '/me/reminders') return reminders(requireUser().id);
    if (path === '/me/pets') { const uu = requireUser(); return S.pets.filter((p) => p.user_id === uu.id).map(({ user_id: _u, ...p }) => p); }
    if ((r = m(/^\/bookings\/([^/]+)\/live$/))) {
      const uu = requireUser();
      const bk = S.bookings.find((x) => x.id === r![1] && x.user_id === uu.id);
      if (!bk) throw new MockError(404, 'not_found', 'Agendamento não encontrado.');
      return simLive(bk);
    }
    if ((r = m(/^\/me\/review-eligibility\/(.+)$/))) return activities(requireUser().id).filter((a) => a.business.id === r![1] && a.canReview);
    if (path === '/me/reviews') {
      const u = requireUser();
      return S.reviews.filter((x) => x.user_id === u.id).sort((a, b) => b.created_at.localeCompare(a.created_at)).map((x) => {
        const b = bizById.get(x.business_id)!;
        return {
          id: x.id, authorName: x.author, rating: x.rating, comment: x.comment, aspects: x.aspects, verifiedInteraction: true, status: 'published',
          serviceName: (servicesByBiz.get(b.id) ?? []).find((s) => s.id === x.service_id)?.name ?? null, createdAt: x.created_at, updatedAt: x.updated_at,
          isMine: true, business: { id: b.id, slug: b.slug, name: b.name },
        };
      });
    }
  }

  if (method === 'POST' && path === '/auth/register') {
    const input = parse(registerSchema, body);
    if (S.users.some((u) => u.email === input.email)) throw new MockError(409, 'email_taken', 'Já existe uma conta com este e-mail. Tente entrar.', { email: 'Já existe uma conta com este e-mail.' });
    const u = { id: uid(), name: input.name, email: input.email, pwd: input.password, phone: null, cityIbge: null, createdAt: new Date().toISOString() };
    S.users.push(u);
    S.session = u.id;
    save();
    return { user: userDTO(u) };
  }
  if (method === 'POST' && path === '/auth/login') {
    const input = parse(loginSchema, body);
    const u = S.users.find((x) => x.email === input.email && x.pwd === input.password);
    if (!u) throw new MockError(401, 'invalid_credentials', 'E-mail ou senha incorretos.');
    S.session = u.id;
    save();
    return { user: userDTO(u) };
  }
  if (method === 'POST' && path === '/auth/logout') {
    S.session = null;
    save();
    return { ok: true };
  }

  const u = requireUser();
  if (method === 'PATCH' && path === '/me') {
    const input = parse(profileUpdateSchema, body);
    if (input.name !== undefined) u.name = input.name;
    if (input.phone !== undefined) u.phone = input.phone || null;
    if (input.cityIbge !== undefined) u.cityIbge = input.cityIbge;
    save();
    return { user: userDTO(u) };
  }
  if (method === 'DELETE' && path === '/me') {
    if (body?.password !== u.pwd) throw new MockError(401, 'invalid_password', 'Senha incorreta.', { password: 'Senha incorreta.' });
    S.users = S.users.filter((x) => x.id !== u.id);
    delete S.favorites[u.id];
    S.bookings = S.bookings.filter((x) => x.user_id !== u.id);
    S.quotes = S.quotes.filter((x) => x.user_id !== u.id);
    S.reviews = S.reviews.filter((x) => x.user_id !== u.id);
    S.session = null;
    save();
    return { ok: true };
  }
  if ((r = m(/^\/me\/favorites\/(.+)$/))) {
    const list = new Set(S.favorites[u.id] ?? []);
    if (method === 'PUT') list.add(r[1]);
    else list.delete(r[1]);
    S.favorites[u.id] = [...list];
    save();
    return { ok: true };
  }
  if (path === '/me/pets' && method === 'POST') {
    if (S.pets.filter((p) => p.user_id === u.id).length >= 10) throw new MockError(422, 'limit', 'Você pode cadastrar até 10 pets.');
    const v = parse(petInputSchema, body);
    const pet = { ...v, id: uid(), user_id: u.id, photoUrl: null } as State['pets'][number];
    S.pets.push(pet);
    save();
    const { user_id: _u, ...dto } = pet;
    return dto;
  }
  if ((r = m(/^\/me\/pets\/([^/]+)(\/photo)?$/))) {
    const pet = S.pets.find((p) => p.id === r![1] && p.user_id === u.id);
    if (!pet) throw new MockError(404, 'not_found', 'Pet não encontrado.');
    if (r[2]) pet.photoUrl = (body as { dataUrl: string | null }).dataUrl;
    else if (method === 'DELETE') S.pets = S.pets.filter((p) => p !== pet);
    else Object.assign(pet, parse(petInputSchema, body));
    save();
    const { user_id: _u, ...dto } = pet;
    return method === 'DELETE' ? { ok: true } : dto;
  }
  if (method === 'POST' && path === '/me/packages') {
    const pid = String(body?.packageId ?? '');
    const b = businesses.find((x) => packagesFor(x).some((p) => p.id === pid));
    if (!b) throw new MockError(404, 'not_found', 'Pacote não encontrado.');
    S.myPackages ??= [];
    if (S.myPackages.some((x) => x.user_id === u.id && x.package_id === pid && x.status !== 'cancelled')) throw new MockError(409, 'conflict', 'Você já pediu este pacote.');
    const id = uid();
    S.myPackages.push({ id, user_id: u.id, package_id: pid, business_id: b.id, status: 'requested', created_at: new Date().toISOString(), pet_id: body?.petId ?? null });
    save();
    return { id };
  }
  if ((r = m(/^\/me\/packages\/(.+)\/cancel$/)) && method === 'POST') {
    const x = (S.myPackages ?? []).find((y) => y.id === r![1] && y.user_id === u.id);
    if (x) x.status = 'cancelled';
    save();
    return { ok: true };
  }
  if (method === 'POST' && path === '/bookings') {
    const input = parse(bookingRequestSchema, body);
    const b = bizById.get(input.businessId)!;
    const first = new Date(input.startsAt);
    const tz = cities.get(b.city_ibge)!.timezone;
    const dates = input.weekdays?.length && input.repeat
      ? bookingOccurrences({ startsAt: first, timezone: tz, mode: 'slot', repeat: input.repeat, weekdays: input.weekdays })
      : input.repeat ? repeatDates(first, input.repeat) : [first];
    const svcRow = (servicesByBiz.get(b.id) ?? []).find((x) => x.id === input.serviceId);
    const pkg = input.customerPackageId ? myPackages(u.id).find((x) => x.id === input.customerPackageId && x.status === 'active') : null;
    if (input.customerPackageId && !pkg) throw new MockError(422, 'invalid_package', 'Este pacote não está ativo.');
    if (pkg && dates.length > pkg.remaining) throw new MockError(422, 'package_exhausted', `Seu pacote tem ${pkg.remaining} sessões restantes.`);
    const depositCents = !pkg && pixKeyFor(b) && svcRow ? depositFor(b, svcRow) : null;
    if (S.bookings.filter((x) => x.user_id === u.id && ['requested', 'confirmed'].includes(x.status) && new Date(x.starts_at) > new Date()).length + dates.length > ACTIVITY_LIMITS.maxActiveFutureBookings) {
      throw new MockError(429, 'too_many_bookings', 'Você já tem muitos agendamentos em aberto.');
    }
    if (input.petId && !S.pets.some((p) => p.id === input.petId && p.user_id === u.id)) throw new MockError(422, 'invalid_pet', 'Escolha um dos seus pets.');
    const seriesId = dates.length > 1 ? uid() : null;
    const ids: string[] = [];
    const skipped: string[] = [];
    for (const [i, startsAt] of dates.entries()) {
      const avail = availability(input.businessId, input.serviceId, localDateOf(startsAt, cities.get(b.city_ibge)!.timezone));
      if (!avail.slots.some((x) => new Date(x.startsAt).getTime() === startsAt.getTime())) {
        if (i === 0) throw new MockError(409, 'slot_unavailable', 'Este horário não está mais disponível. Escolha outro.');
        skipped.push(startsAt.toISOString());
        continue;
      }
      const id = uid();
      // Só o primeiro da série "acontece" na prévia (para mostrar o Pet ao Vivo).
      S.bookings.push({ id, user_id: u.id, business_id: b.id, service_id: input.serviceId, starts_at: startsAt.toISOString(), ends_at: new Date(startsAt.getTime() + avail.durationMinutes * 60_000).toISOString(),
        status: 'requested', notes: input.notes, created_at: new Date().toISOString(), pet_id: input.petId ?? null, series_id: seriesId, sim: i === 0,
        address: input.address ?? null, destination: input.destination ?? null, details: input.details ?? {}, deposit_cents: ids.length === 0 ? depositCents : null, customer_package_id: pkg?.id ?? null });
      ids.push(id);
    }
    save();
    return { id: ids[0], ids, skipped, seriesId, status: 'requested', isDemoBusiness: true, depositCents };
  }
  if ((r = m(/^\/bookings\/(.+)\/cancel-series$/))) {
    const ref = S.bookings.find((x) => x.id === r![1] && x.user_id === u.id);
    if (!ref?.series_id) throw new MockError(404, 'not_found', 'Agendamento não encontrado.');
    let n = 0;
    for (const x of S.bookings) {
      if (x.series_id === ref.series_id && x.user_id === u.id && x.starts_at >= ref.starts_at && new Date(x.starts_at) > new Date() && ['requested', 'confirmed'].includes(x.status)) { x.status = 'cancelled'; n++; }
    }
    if (!n) throw new MockError(409, 'invalid_state', 'Não há agendamentos futuros para cancelar nesta série.');
    save();
    return { ok: true, cancelled: n };
  }
  if ((r = m(/^\/bookings\/(.+)\/(cancel|complete)$/))) {
    const b = S.bookings.find((x) => x.id === r![1] && x.user_id === u.id);
    if (!b) throw new MockError(404, 'not_found', 'Agendamento não encontrado.');
    const active = b.status === 'requested' || b.status === 'confirmed';
    const started = new Date(b.starts_at) <= new Date();
    if (r[2] === 'cancel') {
      if (!active || started) throw new MockError(409, 'invalid_state', 'Este agendamento não pode mais ser cancelado.');
      b.status = 'cancelled';
    } else {
      if (!active || !started) throw new MockError(409, 'invalid_state', 'Você poderá confirmar a realização depois do horário agendado.');
      b.status = 'completed';
      b.completed_at = new Date().toISOString();
    }
    save();
    return { ok: true };
  }
  if (method === 'POST' && path === '/quotes') {
    const input = parse(quoteRequestSchema, body);
    const id = uid();
    S.quotes.push({ id, user_id: u.id, business_id: input.businessId, service_id: input.serviceId ?? null, description: input.description, preferred_date: input.preferredDate ?? null, contact_preference: input.contactPreference, status: 'sent', created_at: new Date().toISOString() });
    save();
    return { id, status: 'sent', isDemoBusiness: true };
  }
  if ((r = m(/^\/quotes\/(.+)\/(hired|close)$/))) {
    const q = S.quotes.find((x) => x.id === r![1] && x.user_id === u.id);
    if (!q) throw new MockError(404, 'not_found', 'Solicitação não encontrada.');
    if (q.status !== 'sent' && q.status !== 'answered') throw new MockError(409, 'invalid_state', 'Esta solicitação já foi encerrada.');
    q.status = r[2] === 'hired' ? 'hired' : 'closed';
    if (q.status === 'hired') q.hired_at = new Date().toISOString();
    save();
    return { ok: true };
  }
  if (method === 'POST' && path === '/reviews') {
    const input = parse(reviewInputSchema, body);
    const a = activities(u.id).find((x) => x.id === input.activityId && x.type === input.activityType && x.business.id === input.businessId);
    if (!a?.canReview) throw new MockError(403, 'not_eligible', a?.reviewId ? 'Você já avaliou este atendimento.' : 'Você só pode avaliar depois de contratar o serviço e confirmar que ele foi realizado.');
    if (S.reviews.filter((x) => x.user_id === u.id && Date.now() - new Date(x.created_at).getTime() < 86_400_000).length >= REVIEW_RULES.maxReviewsPerDay) {
      throw new MockError(429, 'too_many_reviews', 'Você atingiu o limite de avaliações por hoje.');
    }
    const src = input.activityType === 'booking' ? S.bookings.find((x) => x.id === input.activityId) : S.quotes.find((x) => x.id === input.activityId);
    const now = new Date().toISOString();
    const rev: Review = {
      id: uid(), business_id: input.businessId, user_id: u.id, author: publicAuthorName(u.name), service_id: src?.service_id ?? null, rating: input.rating,
      comment: input.comment, aspects: input.aspects as Record<string, number>, created_at: now, updated_at: now,
      booking_id: input.activityType === 'booking' ? input.activityId : null, quote_id: input.activityType === 'quote' ? input.activityId : null,
    };
    S.reviews.push(rev);
    save();
    return { id: rev.id };
  }
  if ((r = m(/^\/reviews\/([^/]+)\/report$/))) {
    parse(reviewReportSchema, body);
    if (S.reviews.some((x) => x.id === r![1] && x.user_id === u.id)) throw new MockError(403, 'forbidden', 'Você não pode denunciar a sua própria avaliação.');
    const already = S.reports.some((x) => x.review_id === r![1] && x.user_id === u.id);
    if (!already) S.reports.push({ review_id: r[1], user_id: u.id });
    save();
    return { ok: true, alreadyReported: already };
  }
  if ((r = m(/^\/reviews\/([^/]+)$/))) {
    const rev = S.reviews.find((x) => x.id === r![1] && x.user_id === u.id);
    if (!rev) throw new MockError(404, 'not_found', 'Avaliação não encontrada.');
    if (method === 'DELETE') S.reviews = S.reviews.filter((x) => x !== rev);
    else {
      const input = parse(reviewUpdateSchema, body);
      Object.assign(rev, { rating: input.rating, comment: input.comment, aspects: input.aspects, updated_at: new Date().toISOString() });
    }
    save();
    return { ok: true };
  }

  throw new MockError(404, 'not_found', 'Rota não encontrada.');
}

