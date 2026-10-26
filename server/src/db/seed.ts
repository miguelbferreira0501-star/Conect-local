/**
 * Seed de DEMONSTRAÇÃO. Cria empresas, clientes e avaliações fictícias,
 * todas marcadas (is_demo = true / e-mails @exemplo.invalid).
 * Executa somente com DEMO_MODE=true.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type pg from 'pg';
import { bookingProfile, CATEGORY_DEFINITIONS, publicAuthorName, type OpeningHours } from '@conecta/shared';
import { CATEGORY_TEMPLATES, DEMO_CITIES, DEMO_FIRST_NAMES, DEMO_LAST_NAMES, GENERIC_PHRASES, type CategoryTemplate } from './seedData';

export const DEMO_ACCOUNT = { email: 'demo@conectalocal.app', password: 'Demo1234', name: 'Cliente Demonstração' };

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const HOURS: Record<CategoryTemplate['hours'], OpeningHours> = {
  commercial: { '1': [['08:00', '12:00'], ['13:30', '18:00']], '2': [['08:00', '12:00'], ['13:30', '18:00']], '3': [['08:00', '12:00'], ['13:30', '18:00']], '4': [['08:00', '12:00'], ['13:30', '18:00']], '5': [['08:00', '12:00'], ['13:30', '18:00']], '6': [['08:00', '12:00']] },
  extended: { '1': [['09:00', '19:00']], '2': [['09:00', '19:00']], '3': [['09:00', '19:00']], '4': [['09:00', '19:00']], '5': [['09:00', '19:00']], '6': [['09:00', '17:00']] },
  evening: { '0': [['09:00', '22:00']], '1': [['14:00', '23:00']], '2': [['14:00', '23:00']], '3': [['14:00', '23:00']], '4': [['14:00', '23:00']], '5': [['14:00', '23:00']], '6': [['09:00', '22:00']] },
  weekend: { '2': [['09:00', '18:00']], '3': [['09:00', '18:00']], '4': [['09:00', '18:00']], '5': [['09:00', '18:00']], '6': [['09:00', '16:00']] },
  restaurant: { '0': [['11:30', '16:00']], '2': [['11:30', '15:00'], ['18:30', '23:30']], '3': [['11:30', '15:00'], ['18:30', '23:30']], '4': [['11:30', '15:00'], ['18:30', '23:30']], '5': [['11:30', '15:00'], ['18:30', '23:59']], '6': [['11:30', '16:00'], ['18:30', '23:59']] },
  appointment: { '1': [['09:00', '18:00']], '2': [['09:00', '18:00']], '3': [['09:00', '18:00']], '4': [['09:00', '18:00']], '5': [['09:00', '18:00']] },
};

type Profile = 'established' | 'good' | 'single5' | 'mixed' | 'new' | 'inactive' | 'none';
const PROFILE_CYCLE: Profile[] = ['established', 'good', 'single5', 'mixed', 'established', 'new', 'inactive', 'good', 'none'];
const CITY_BY_INDEX: Array<keyof typeof DEMO_CITIES> = ['joinville', 'joinville', 'joinville', 'saopaulo', 'saopaulo', 'florianopolis', 'curitiba'];

async function insertMany(client: pg.Client, table: string, columns: string[], rows: unknown[][]) {
  const chunk = Math.floor(30000 / columns.length);
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    const params: unknown[] = [];
    const values = slice.map((row) => {
      const ph = row.map((v) => {
        params.push(v);
        return `$${params.length}`;
      });
      return `(${ph.join(',')})`;
    });
    await client.query(`INSERT INTO ${table} (${columns.join(',')}) VALUES ${values.join(',')}`, params);
  }
}

/** Categorias são dado do produto (não de demonstração): gravadas/atualizadas a cada inicialização. */
export async function syncCategories(client: pg.Client) {
  for (const [i, c] of CATEGORY_DEFINITIONS.entries()) {
    await client.query(
      `INSERT INTO categories (slug, name, short_name, icon, description, keywords, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, short_name=EXCLUDED.short_name, icon=EXCLUDED.icon,
         description=EXCLUDED.description, keywords=EXCLUDED.keywords, sort_order=EXCLUDED.sort_order`,
      [c.slug, c.name, c.shortName, c.icon, c.description, c.keywords, i],
    );
  }
  // Foco no nicho pet: categorias fora da lista atual ficam inativas (somem do app e do cadastro).
  await client.query(`UPDATE categories SET active = (slug = ANY($1)) WHERE active <> (slug = ANY($1))`, [CATEGORY_DEFINITIONS.map((c) => c.slug)]);
}

export async function seedDemo(client: pg.Client, opts: { now?: Date; quiet?: boolean } = {}) {
  const now = opts.now ?? new Date();
  const rnd = mulberry32(20261024);
  const pick = <T>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)];
  const between = (a: number, b: number) => a + rnd() * (b - a);
  const int = (a: number, b: number) => Math.floor(between(a, b + 1));
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);
  const gauss = () => {
    const u = 1 - rnd();
    const v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  await client.query('BEGIN');
  try {
    await syncCategories(client);
    const catRows = (await client.query('SELECT id, slug FROM categories')).rows as Array<{ id: number; slug: string }>;
    const catId = new Map(catRows.map((r) => [r.slug, r.id]));

    // Limpa demonstração anterior
    await client.query('DELETE FROM businesses WHERE is_demo');
    await client.query(`DELETE FROM users WHERE email LIKE '%@exemplo.invalid' OR email = $1`, [DEMO_ACCOUNT.email]);

    const cityRows = (await client.query('SELECT ibge, lat, lon, ddd FROM cities WHERE ibge = ANY($1)', [Object.values(DEMO_CITIES).map((c) => c.ibge)])).rows;
    const cityInfo = new Map(cityRows.map((r) => [r.ibge, r]));

    // Clientes de demonstração (não conseguem fazer login: senha aleatória descartada)
    const unusableHash = await bcrypt.hash(randomBytes(24).toString('hex'), 10);
    const reviewers: Array<{ id: string; name: string }> = [];
    const userRows: unknown[][] = [];
    for (let i = 0; i < 160; i++) {
      const name = `${pick(DEMO_FIRST_NAMES)} ${pick(DEMO_LAST_NAMES)}`;
      const id = randomUUID();
      reviewers.push({ id, name });
      userRows.push([id, name, `cliente${i + 1}@exemplo.invalid`, unusableHash, daysAgo(int(400, 1200)), daysAgo(int(400, 1200))]);
    }
    await insertMany(client, 'users', ['id', 'name', 'email', 'password_hash', 'terms_accepted_at', 'created_at'], userRows);

    const businessRows: unknown[][] = [];
    const serviceRows: unknown[][] = [];
    const areaRows: unknown[][] = [];
    const bookingRows: unknown[][] = [];
    const quoteRows: unknown[][] = [];
    const reviewRows: unknown[][] = [];
    const created: Array<{ id: string; slug: string; city: number; services: Array<{ id: string; bookable: boolean; duration: number | null }> }> = [];
    let profileIdx = 0;
    let phoneSeq = 1;

    for (const def of CATEGORY_DEFINITIONS) {
      const tpl = CATEGORY_TEMPLATES[def.slug];
      for (const [i, [name, professional]] of tpl.names.entries()) {
        const cityKey = CITY_BY_INDEX[i];
        const city = DEMO_CITIES[cityKey];
        const info = cityInfo.get(city.ibge);
        const profile = PROFILE_CYCLE[profileIdx++ % PROFILE_CYCLE.length];
        const id = randomUUID();
        const slug = slugify(`${name}-${cityKey}`);
        const createdAt =
          profile === 'new' ? daysAgo(int(10, 45)) : profile === 'none' ? daysAgo(int(20, 80)) : profile === 'single5' ? daysAgo(int(60, 200)) : daysAgo(int(500, 1300));
        const isStale = profile === 'inactive' || rnd() < 0.12;
        const hoursUpdated = isStale ? daysAgo(int(220, 600)) : daysAgo(int(1, 90));
        const hasFullProfile = profile !== 'none' && rnd() > 0.2;
        const ddd = info.ddd;
        const phone = `${ddd}9000${String(phoneSeq++).padStart(5, '0')}`;
        const neighborhood = pick(city.neighborhoods);
        const modes = tpl.modes;
        businessRows.push([
          id, slug, name, professional ?? null, catId.get(def.slug), pick(tpl.descriptions).split('.')[0] + '.',
          pick(tpl.descriptions) + (hasFullProfile ? ` ${pick(tpl.descriptions)}` : ''),
          modes.in_person ? `Rua Exemplo, ${int(10, 2500)}` : null, neighborhood, null, city.ibge,
          info.lat + between(-0.035, 0.035), info.lon + between(-0.035, 0.035), modes.in_person,
          phone, phone, hasFullProfile ? `https://${slug}.exemplo.invalid` : null, hasFullProfile ? slug.replace(/-/g, '').slice(0, 24) : null,
          pick(tpl.priceLevels), modes.in_person, modes.at_customer, modes.online, tpl.booking, true,
          JSON.stringify(HOURS[tpl.hours]), hoursUpdated,
          profile === 'established' || (profile === 'good' && rnd() > 0.4) ? daysAgo(int(30, 300)) : null,
          'demonstração', true, createdAt, createdAt,
        ]);
        // Serviços: 4 a 6 do modelo
        const pool = [...tpl.services].sort(() => rnd() - 0.5).slice(0, int(4, Math.min(6, tpl.services.length)));
        const svcs: Array<{ id: string; bookable: boolean; duration: number | null }> = [];
        pool.forEach((s, order) => {
          const sid = randomUUID();
          const bookable = tpl.booking && !!s.bookable;
          svcs.push({ id: sid, bookable, duration: s.duration ?? null });
          const adj = (v?: number) => (v == null ? null : Math.round(v * between(0.9, 1.15)) * 100);
          const mode = s.mode ?? (bookingProfile(def.slug).mode === 'period' ? 'period' : 'slot');
          serviceRows.push([sid, id, s.name, s.description ?? null, s.priceType, s.priceType === 'quote' ? null : s.min === 0 ? 0 : adj(s.min), s.priceType === 'range' ? Math.round((s.max as number) * 1.1) * 100 : null, s.duration ?? null, bookable || (tpl.booking && mode === 'day' && !!s.bookable), s.notes ?? null, order, mode]);
        });
        // Áreas de atendimento além da sede
        if (modes.at_customer && city.areas.length) {
          for (const a of city.areas.slice(0, int(1, city.areas.length))) areaRows.push([id, a]);
        }
        created.push({ id, slug, city: city.ibge, services: svcs });

        // Avaliações
        let count = 0;
        let mean = 4.5;
        let sigma = 0.6;
        let range: [number, number] = [5, 900];
        switch (profile) {
          case 'established': count = int(70, 240); mean = between(4.5, 4.85); sigma = 0.55; range = [1, 1000]; break;
          case 'good': count = int(14, 55); mean = between(4.1, 4.6); sigma = 0.75; range = [3, 540]; break;
          case 'single5': count = 1; mean = 5; sigma = 0; range = [5, 40]; break;
          case 'mixed': count = int(12, 45); mean = between(3.1, 3.8); sigma = 1.25; range = [2, 700]; break;
          case 'new': count = int(1, 3); mean = 4.6; sigma = 0.5; range = [1, 9]; break;
          case 'inactive': count = int(8, 22); mean = between(4.0, 4.5); sigma = 0.8; range = [420, 1000]; break;
          default: count = 0;
        }
        const usedReviewers = new Set<string>();
        for (let r = 0; r < count; r++) {
          let reviewer = pick(reviewers);
          for (let t = 0; t < 5 && usedReviewers.has(reviewer.id); t++) reviewer = pick(reviewers);
          usedReviewers.add(reviewer.id);
          const rating = sigma === 0 ? 5 : Math.max(1, Math.min(5, Math.round(mean + gauss() * sigma)));
          const reviewDate = daysAgo(r === 0 ? range[0] + rnd() * 3 : between(range[0], range[1]));
          if (reviewDate < createdAt) reviewDate.setTime(createdAt.getTime() + int(1, 5) * 86_400_000);
          const bucket = rating >= 4 ? 'good' : rating === 3 ? 'mid' : 'bad';
          const first = rnd() < 0.6 ? pick(tpl.phrases[bucket]) : pick(GENERIC_PHRASES[bucket]);
          const second = rnd() < 0.35 ? ` ${pick(GENERIC_PHRASES[bucket])}` : '';
          const aspects: Record<string, number> = {};
          for (const a of tpl.aspects.slice(0, int(0, 3))) aspects[a] = Math.max(1, Math.min(5, Math.round(rating + gauss() * 0.5)));
          const svc = pick(svcs);
          const activityId = randomUUID();
          const actDate = new Date(reviewDate.getTime() - int(1, 4) * 86_400_000);
          if (svc.bookable && svc.duration) {
            actDate.setUTCHours(13 + int(0, 6), 0, 0, 0);
            bookingRows.push([activityId, reviewer.id, id, svc.id, actDate, new Date(actDate.getTime() + svc.duration * 60_000), 'completed', new Date(actDate.getTime() - 3 * 86_400_000), actDate]);
          } else {
            quoteRows.push([activityId, reviewer.id, id, svc.id, 'Gostaria de um orçamento para este serviço, por favor.', 'whatsapp', 'hired', new Date(actDate.getTime() - 5 * 86_400_000), actDate]);
          }
          reviewRows.push([
            randomUUID(), id, reviewer.id, publicAuthorName(reviewer.name),
            svc.bookable && svc.duration ? activityId : null, svc.bookable && svc.duration ? null : activityId,
            svc.id, rating, (first + second).slice(0, 1000), JSON.stringify(aspects), reviewDate, reviewDate,
          ]);
        }
      }
    }

    await insertMany(client, 'businesses', ['id', 'slug', 'name', 'professional_name', 'category_id', 'short_description', 'description', 'street', 'neighborhood', 'postal_code', 'city_ibge', 'lat', 'lon', 'address_public', 'phone', 'whatsapp', 'website', 'instagram', 'price_level', 'mode_in_person', 'mode_at_customer', 'mode_online', 'accepts_booking', 'accepts_quote', 'opening_hours', 'hours_updated_at', 'verified_at', 'verification_method', 'is_demo', 'created_at', 'updated_at'], businessRows);
    // Empresas de exemplo ficam com o plano ativo (sem vencimento) para a agenda funcionar na demonstração.
    await client.query(`UPDATE businesses SET plan = 'pro', plan_until = NULL WHERE is_demo`);
    await insertMany(client, 'services', ['id', 'business_id', 'name', 'description', 'price_type', 'price_min_cents', 'price_max_cents', 'duration_minutes', 'bookable', 'notes', 'sort_order', 'booking_mode'], serviceRows);
    // Benefícios de exemplo: Pix fictício (e-mail @exemplo.invalid), cartão fidelidade, sinal e pacotes.
    await client.query(
      `UPDATE businesses b SET pix_key = 'pix+' || left(b.slug, 30) || '@exemplo.invalid', loyalty_every = 10
       FROM categories c WHERE c.id = b.category_id AND b.is_demo AND c.slug IN ('banho-e-tosa', 'passeador', 'hospedagem-e-creche', 'adestramento')`);
    await client.query(
      `UPDATE services s SET deposit_cents = CASE WHEN s.booking_mode = 'day' THEN 3000 ELSE 2000 END
       FROM businesses b JOIN categories c ON c.id = b.category_id
       WHERE s.business_id = b.id AND b.is_demo AND s.bookable AND c.slug IN ('banho-e-tosa', 'hospedagem-e-creche') AND s.price_min_cents >= 4000`);
    await client.query(
      `INSERT INTO packages (business_id, service_id, name, sessions, price_cents, validity_days)
       SELECT DISTINCT ON (s.business_id) s.business_id, s.id,
         CASE c.slug WHEN 'passeador' THEN 'Clube 8 passeios no mês' WHEN 'adestramento' THEN 'Pacote 4 aulas' ELSE 'Clube 4 banhos no mês' END,
         CASE c.slug WHEN 'passeador' THEN 8 ELSE 4 END,
         (round(s.price_min_cents * CASE c.slug WHEN 'passeador' THEN 8 ELSE 4 END * 0.85 / 100) * 100)::int, 30
       FROM services s JOIN businesses b ON b.id = s.business_id JOIN categories c ON c.id = b.category_id
       WHERE b.is_demo AND s.bookable AND s.booking_mode = 'slot' AND s.price_type IN ('fixed', 'from') AND s.price_min_cents > 0
         AND c.slug IN ('banho-e-tosa', 'passeador', 'adestramento')
       ORDER BY s.business_id, s.sort_order`);
    if (areaRows.length) await insertMany(client, 'business_service_areas', ['business_id', 'city_ibge'], areaRows);
    if (bookingRows.length) await insertMany(client, 'bookings', ['id', 'user_id', 'business_id', 'service_id', 'starts_at', 'ends_at', 'status', 'created_at', 'completed_at'], bookingRows);
    if (quoteRows.length) await insertMany(client, 'quote_requests', ['id', 'user_id', 'business_id', 'service_id', 'description', 'contact_preference', 'status', 'created_at', 'hired_at'], quoteRows);
    await insertMany(client, 'reviews', ['id', 'business_id', 'user_id', 'author_display_name', 'booking_id', 'quote_id', 'service_id', 'rating', 'comment', 'aspects', 'created_at', 'updated_at'], reviewRows);

    // Conta de demonstração com histórico para testar avaliações e atividades
    const demoId = randomUUID();
    await client.query(
      `INSERT INTO users (id, name, email, password_hash, city_ibge, terms_accepted_at) VALUES ($1,$2,$3,$4,$5,now())`,
      [demoId, DEMO_ACCOUNT.name, DEMO_ACCOUNT.email, await bcrypt.hash(DEMO_ACCOUNT.password, 10), DEMO_CITIES.joinville.ibge],
    );
    const jlle = created.filter((b) => b.city === DEMO_CITIES.joinville.ibge && b.services.some((s) => s.bookable));
    const past = jlle[1];
    const pastSvc = past.services.find((s) => s.bookable)!;
    const pastStart = daysAgo(3);
    pastStart.setUTCHours(14, 0, 0, 0);
    await client.query(
      `INSERT INTO bookings (user_id, business_id, service_id, starts_at, ends_at, status, created_at) VALUES ($1,$2,$3,$4,$5,'confirmed',$6)`,
      [demoId, past.id, pastSvc.id, pastStart, new Date(pastStart.getTime() + (pastSvc.duration ?? 60) * 60_000), daysAgo(8)],
    );
    const future = jlle[4];
    const futureSvc = future.services.find((s) => s.bookable)!;
    const futureStart = new Date(now.getTime() + 4 * 86_400_000);
    futureStart.setUTCHours(17, 0, 0, 0);
    await client.query(
      `INSERT INTO bookings (user_id, business_id, service_id, starts_at, ends_at, status) VALUES ($1,$2,$3,$4,$5,'requested')`,
      [demoId, future.id, futureSvc.id, futureStart, new Date(futureStart.getTime() + (futureSvc.duration ?? 60) * 60_000)],
    );
    const quoteBiz = created.filter((b) => b.city === DEMO_CITIES.joinville.ibge)[7];
    await client.query(
      `INSERT INTO quote_requests (user_id, business_id, service_id, description, contact_preference, status, created_at, answered_at)
       VALUES ($1,$2,$3,'Preciso de um orçamento para o serviço no meu apartamento, de preferência à tarde.','whatsapp','answered',$4,$5)`,
      [demoId, quoteBiz.id, quoteBiz.services[0].id, daysAgo(6), daysAgo(5)],
    );
    const favs = created.filter((b) => b.city === DEMO_CITIES.joinville.ibge).slice(0, 3);
    for (const f of favs) await client.query('INSERT INTO favorites (user_id, business_id) VALUES ($1,$2)', [demoId, f.id]);

    await client.query('COMMIT');
    if (!opts.quiet) {
      console.log(`✔ demonstração: ${businessRows.length} empresas, ${serviceRows.length} serviços, ${reviewRows.length} avaliações`);
      console.log(`  conta de teste: ${DEMO_ACCOUNT.email} / ${DEMO_ACCOUNT.password}`);
    }
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
}
