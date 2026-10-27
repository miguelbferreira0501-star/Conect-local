/** Regras do painel das empresas. */
import { randomBytes } from 'node:crypto';
import {
  PANEL_LIMITS, PLANS, effectivePlan, staffInputSchema, type PanelAgendaItemDTO, type PanelStaffDTO, type PlanId, type BusinessProfileInput, type PanelBusinessDTO, type PanelRequestDTO, type PanelReviewDTO, businessProfileSchema,
  openingHoursSchema, serviceInputSchema,
} from '@conecta/shared';
import type { z } from 'zod';
import { withUser, type Db } from '../db/pool';
import { AppError, forbidden, notFound, parse } from '../lib/errors';
import { businessesRepo } from '../repositories/businesses';
import { locationsRepo } from '../repositories/locations';
import { panelRepo } from '../repositories/panel';
import { notifyBookingStatus } from './push';

type Profile = z.output<typeof businessProfileSchema>;

const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);

/** Garante que o usuário é dono/gerente da empresa (além das políticas RLS do banco). */
async function requireMember(db: Db, businessId: string) {
  const role = await panelRepo.role(db, businessId);
  if (role !== 'owner' && role !== 'manager') throw forbidden('Você não tem acesso a esta empresa.');
}

async function profileColumns(db: Db, p: Profile) {
  const categoryId = await panelRepo.categoryId(db, p.categorySlug);
  if (!categoryId) throw new AppError(422, 'validation_error', 'Categoria inválida.', { categorySlug: 'Categoria inválida.' });
  const city = await locationsRepo.city(p.cityIbge, db);
  if (!city) throw new AppError(422, 'validation_error', 'Cidade inválida.', { cityIbge: 'Cidade inválida.' });
  return {
    name: p.name,
    professional_name: p.professionalName,
    category_id: categoryId,
    short_description: p.shortDescription,
    description: p.description,
    city_ibge: p.cityIbge,
    neighborhood: p.neighborhood,
    street: p.street,
    postal_code: p.postalCode,
    address_public: p.addressPublic,
    mode_in_person: p.modeInPerson,
    mode_at_customer: p.modeAtCustomer,
    mode_online: p.modeOnline,
    phone: p.phone,
    whatsapp: p.whatsapp,
    website: p.website,
    instagram: p.instagram,
    email: p.email,
    price_level: p.priceLevel,
    accepts_booking: p.acceptsBooking,
    accepts_quote: p.acceptsQuote,
    // Sem geocodificação ainda: não inventamos coordenadas (a distância não é exibida para esta empresa).
    lat: null,
    lon: null,
  };
}

export const panel = {
  myBusinesses: (userId: string) => withUser(userId, (db) => panelRepo.myBusinesses(db)),

  async create(userId: string, input: BusinessProfileInput) {
    const p = parse(businessProfileSchema, input);
    return withUser(userId, async (db) => {
      if ((await panelRepo.countMine(db)) >= PANEL_LIMITS.maxBusinessesPerUser) {
        throw new AppError(429, 'too_many_businesses', `Cada conta pode cadastrar até ${PANEL_LIMITS.maxBusinessesPerUser} empresas.`);
      }
      const cols = await profileColumns(db, p);
      const city = await locationsRepo.city(p.cityIbge, db);
      const base = slugify(`${p.name}-${city!.name}`) || 'empresa';
      // Tenta o endereço "nome-cidade"; se já existir, acrescenta um sufixo curto.
      for (let attempt = 0; attempt < 5; attempt++) {
        const slug = attempt === 0 ? base : `${base}-${randomBytes(2).toString('hex')}`;
        await db.query('SAVEPOINT slug_try');
        try {
          const id = await panelRepo.insertBusiness(db, { ...cols, slug });
          await panelRepo.setAreas(db, id, p.serviceAreaCities.filter((c) => c !== p.cityIbge));
          await db.query('RELEASE SAVEPOINT slug_try');
          return { id, slug };
        } catch (e) {
          await db.query('ROLLBACK TO SAVEPOINT slug_try');
          if ((e as { code?: string; constraint?: string }).constraint !== 'businesses_slug_key') throw e;
        }
      }
      throw new AppError(409, 'conflict', 'Não foi possível criar o endereço da empresa. Tente outro nome.');
    });
  },

  async get(userId: string, businessId: string): Promise<PanelBusinessDTO> {
    return withUser(userId, async (db) => {
      await requireMember(db, businessId);
      const b = await panelRepo.business(db, businessId);
      if (!b) throw notFound('Empresa não encontrada.');
      const areas = await panelRepo.areas(db, businessId);
      const photos = await panelRepo.photos(db, businessId);
      const services = await panelRepo.services(db, businessId);
      const stats = await panelRepo.stats(db, businessId);
      const staff = await businessesRepo.staff(businessId, db);
      const aiUsed = await panelRepo.aiUsageThisMonth(db, businessId);
      const paying = (await db.query(`SELECT 1 FROM subscriptions WHERE business_id = $1 AND status <> 'canceled' LIMIT 1`, [businessId])).rows.length > 0;
      return {
        id: b.id, slug: b.slug, name: b.name, status: b.status, suspendedReason: b.suspended_reason,
        verifiedAt: b.verified_at ? new Date(b.verified_at).toISOString() : null, isDemo: b.is_demo,
        profile: {
          name: b.name, professionalName: b.professional_name, categorySlug: b.category_slug, shortDescription: b.short_description,
          description: b.description, cityIbge: b.city_ibge, neighborhood: b.neighborhood, street: b.street, postalCode: b.postal_code,
          addressPublic: b.address_public, serviceAreaCities: areas, modeInPerson: b.mode_in_person, modeAtCustomer: b.mode_at_customer,
          modeOnline: b.mode_online, phone: b.phone, whatsapp: b.whatsapp, website: b.website, instagram: b.instagram, email: b.email,
          priceLevel: b.price_level, acceptsBooking: b.accepts_booking, acceptsQuote: b.accepts_quote,
        },
        logoUrl: b.logo_url, coverUrl: b.cover_url, photos,
        openingHours: b.opening_hours, hoursUpdatedAt: b.hours_updated_at ? new Date(b.hours_updated_at).toISOString() : null,
        services: services.map((s) => ({
          id: s.id, name: s.name, description: s.description, priceType: s.price_type,
          priceMin: s.price_min_cents == null ? null : s.price_min_cents / 100, priceMax: s.price_max_cents == null ? null : s.price_max_cents / 100,
          durationMinutes: s.duration_minutes, bookable: s.bookable, bookingMode: s.booking_mode, notes: s.notes,
          deposit: s.deposit_cents == null ? null : s.deposit_cents / 100,
        })),
        settings: { pixKey: b.pix_key ?? null, loyaltyEvery: b.loyalty_every ?? null },
        staff: staff.map((s, i) => ({ ...s, paused: i >= PLANS[effectivePlan(b.plan as PlanId, b.plan_until)].maxStaff })) as PanelStaffDTO[],
        plan: {
          id: b.plan, effective: effectivePlan(b.plan, b.plan_until), until: b.plan_until ? new Date(b.plan_until).toISOString() : null, aiUsedThisMonth: aiUsed,
          // Teste grátis: plano ativo sem assinatura cadastrada
          trial: !b.is_demo && !paying && effectivePlan(b.plan, b.plan_until) !== 'free',
          subscribed: paying,
        },
        stats: { ...stats, requestsReceived: b.requests_received, requestsAnswered: b.requests_answered },
      };
    });
  },

  async updateProfile(userId: string, businessId: string, input: BusinessProfileInput) {
    const p = parse(businessProfileSchema, input);
    return withUser(userId, async (db) => {
      await requireMember(db, businessId);
      await panelRepo.updateBusiness(db, businessId, await profileColumns(db, p));
      await panelRepo.setAreas(db, businessId, p.serviceAreaCities.filter((c) => c !== p.cityIbge));
      return { ok: true };
    });
  },

  async updateHours(userId: string, businessId: string, hours: unknown) {
    const h = parse(openingHoursSchema, hours);
    return withUser(userId, async (db) => {
      await requireMember(db, businessId);
      const clean = Object.fromEntries(Object.entries(h).filter(([, r]) => r && r.length));
      await panelRepo.updateBusiness(db, businessId, { opening_hours: JSON.stringify(clean), hours_updated_at: new Date() });
      return { ok: true };
    });
  },

  async saveService(userId: string, businessId: string, serviceId: string | null, input: unknown) {
    const s = parse(serviceInputSchema, input);
    const cents = (v: number | null) => (v == null ? null : Math.round(v * 100));
    const row = {
      name: s.name, description: s.description, price_type: s.priceType,
      price_min_cents: s.priceType === 'quote' ? null : cents(s.priceMin),
      price_max_cents: s.priceType === 'range' ? cents(s.priceMax) : null,
      duration_minutes: s.durationMinutes, bookable: s.bookable && (s.bookingMode !== 'slot' || !!s.durationMinutes), notes: s.notes,
      booking_mode: s.bookingMode,
      deposit_cents: s.deposit ? Math.round(s.deposit * 100) : null,
    };
    return withUser(userId, async (db) => {
      await requireMember(db, businessId);
      if (serviceId) {
        await panelRepo.updateService(db, businessId, serviceId, row);
        return { id: serviceId };
      }
      if ((await panelRepo.countServices(db, businessId)) >= PANEL_LIMITS.maxServices) {
        throw new AppError(429, 'too_many_services', `Limite de ${PANEL_LIMITS.maxServices} serviços por empresa.`);
      }
      return { id: await panelRepo.insertService(db, businessId, row) };
    });
  },

  removeService: (userId: string, businessId: string, serviceId: string) =>
    withUser(userId, async (db) => {
      await requireMember(db, businessId);
      await panelRepo.removeService(db, businessId, serviceId);
      return { ok: true };
    }),

  async uploadImage(userId: string, businessId: string, kind: 'logo' | 'cover' | 'photo', dataUrl: string) {
    const [, mime, b64] = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/) ?? [];
    if (!mime) throw new AppError(422, 'validation_error', 'Imagem inválida.');
    const data = Buffer.from(b64, 'base64');
    if (data.length > 600_000) throw new AppError(422, 'validation_error', 'Imagem muito grande (máximo de 600 KB).');
    // Confere a assinatura do arquivo (não confia só no tipo informado).
    const sig = data.subarray(0, 12).toString('hex');
    const ok = (mime === 'image/jpeg' && sig.startsWith('ffd8ff')) || (mime === 'image/png' && sig.startsWith('89504e47'))
      || (mime === 'image/webp' && sig.startsWith('52494646') && sig.slice(16, 24) === '57454250');
    if (!ok) throw new AppError(422, 'validation_error', 'O arquivo não é uma imagem válida.');
    return withUser(userId, async (db) => {
      await requireMember(db, businessId);
      if (kind === 'photo' && (await panelRepo.countPhotos(db, businessId)) >= PANEL_LIMITS.maxPhotos) {
        throw new AppError(429, 'too_many_photos', `Limite de ${PANEL_LIMITS.maxPhotos} fotos por empresa.`);
      }
      const old = kind === 'photo' ? [] : await panelRepo.imagesOfKind(db, businessId, kind);
      const id = await panelRepo.insertImage(db, businessId, kind, mime, data);
      const url = `/api/images/${id}`;
      if (kind === 'photo') await panelRepo.addPhoto(db, businessId, id);
      else await panelRepo.updateBusiness(db, businessId, { [kind === 'logo' ? 'logo_url' : 'cover_url']: url });
      for (const o of old) await panelRepo.deleteImage(db, businessId, o.id);
      return { id, url };
    });
  },

  removeImage: (userId: string, businessId: string, kind: 'logo' | 'cover' | 'photo', imageId: string | null) =>
    withUser(userId, async (db) => {
      await requireMember(db, businessId);
      if (kind === 'photo' && imageId) {
        await panelRepo.removePhoto(db, businessId, imageId);
        await panelRepo.deleteImage(db, businessId, imageId);
      } else if (kind !== 'photo') {
        for (const o of await panelRepo.imagesOfKind(db, businessId, kind)) await panelRepo.deleteImage(db, businessId, o.id);
        await panelRepo.updateBusiness(db, businessId, { [kind === 'logo' ? 'logo_url' : 'cover_url']: null });
      }
      return { ok: true };
    }),

  requests: (userId: string, businessId: string): Promise<PanelRequestDTO[]> =>
    withUser(userId, async (db) => {
      await requireMember(db, businessId);
      const rows = await panelRepo.requests(db, businessId);
      return rows.map((r) => ({
        id: r.id, type: r.type, status: r.status, serviceName: r.service_name,
        startsAt: r.starts_at ? new Date(r.starts_at).toISOString() : null, preferredDate: r.preferred_date,
        description: r.description, contactPreference: r.contact_preference, neighborhood: r.neighborhood,
        createdAt: new Date(r.created_at).toISOString(), businessResponse: r.business_response,
        bookingMode: r.booking_mode ?? null, period: r.period ?? null, staffName: r.staff_name ?? null, partySize: r.party_size ?? null,
        pet: r.pet ?? null, liveCount: r.live_count ?? 0,
        endsAt: r.ends_at ? new Date(r.ends_at).toISOString() : null, address: r.address ?? null, destination: r.destination ?? null, details: r.details ?? {},
        deposit: r.deposit_cents ? { cents: r.deposit_cents, status: r.deposit_status ?? 'pending' } : null, fromPackage: !!r.from_package, customerVisits: r.customer_visits ?? 0,
        customer: r.customer_name
          ? { name: r.customer_name, phone: r.contact_phone || r.customer_phone || null, email: r.customer_email }
          : null,
      }));
    }),

  async actOnRequest(userId: string, businessId: string, type: 'booking' | 'quote', id: string, action: string, message?: string) {
    return withUser(userId, async (db) => {
      await requireMember(db, businessId);
      const msg = message?.trim() || null;
      if (type === 'booking') {
        const b = await panelRepo.booking(db, businessId, id);
        if (!b) throw notFound('Agendamento não encontrado.');
        if (action === 'confirm' && b.status === 'requested') {
          await panelRepo.setBooking(db, id, 'confirmed', msg);
          await notifyBookingStatus(db, id, 'confirmed');
        } else if (action === 'decline' && (b.status === 'requested' || b.status === 'confirmed') && new Date(b.starts_at) > new Date()) {
          await panelRepo.setBooking(db, id, 'declined', msg);
          await notifyBookingStatus(db, id, 'declined');
        } else throw new AppError(409, 'invalid_state', 'Este agendamento não pode mais ser alterado.');
      } else {
        const q = await panelRepo.quote(db, businessId, id);
        if (!q) throw notFound('Pedido não encontrado.');
        if (action === 'answer' && (q.status === 'sent' || q.status === 'answered')) {
          if (!msg) throw new AppError(422, 'validation_error', 'Escreva a resposta para o cliente.', { message: 'Escreva a resposta para o cliente.' });
          await panelRepo.setQuote(db, id, 'answered', msg);
        } else if (action === 'close' && (q.status === 'sent' || q.status === 'answered')) await panelRepo.setQuote(db, id, 'closed', msg);
        else throw new AppError(409, 'invalid_state', 'Este pedido não pode mais ser alterado.');
      }
      return { ok: true };
    });
  },

  async saveStaff(userId: string, businessId: string, staffId: string | null, input: unknown) {
    const v = parse(staffInputSchema, input);
    return withUser(userId, async (db) => {
      await requireMember(db, businessId);
      if (!staffId) {
        const b = await panelRepo.business(db, businessId);
        const plan = PLANS[effectivePlan(b.plan as PlanId, b.plan_until)];
        if ((await panelRepo.staffCount(db, businessId)) >= plan.maxStaff) {
          throw new AppError(402, 'plan_limit', `O plano ${plan.name} permite até ${plan.maxStaff} ${plan.maxStaff === 1 ? 'agenda' : 'agendas'}. Mude de plano para adicionar mais.`);
        }
      }
      const id = staffId ?? (await panelRepo.insertStaff(db, businessId, v));
      if (staffId) await panelRepo.updateStaff(db, businessId, staffId, v);
      await panelRepo.setStaffServices(db, id, v.serviceIds);
      return { id };
    });
  },

  removeStaff: (userId: string, businessId: string, staffId: string) =>
    withUser(userId, async (db) => {
      await requireMember(db, businessId);
      await panelRepo.removeStaff(db, businessId, staffId);
      return { ok: true };
    }),

  agenda: (userId: string, businessId: string, from: Date, days: number): Promise<PanelAgendaItemDTO[]> =>
    withUser(userId, async (db) => {
      await requireMember(db, businessId);
      const rows = await panelRepo.agenda(db, businessId, from, new Date(from.getTime() + days * 86_400_000));
      return rows.map((r) => ({
        id: r.id, status: r.status, startsAt: new Date(r.starts_at).toISOString(), endsAt: new Date(r.ends_at).toISOString(),
        mode: r.booking_mode, period: r.period, serviceName: r.service_name, staffId: r.staff_id, staffName: r.staff_name, partySize: r.party_size,
        customerName: r.customer_name, customerPhone: r.customer_phone, pet: r.pet ?? null, liveCount: r.live_count ?? 0,
        address: r.address ?? null, destination: r.destination ?? null, details: r.details ?? {},
        deposit: r.deposit_cents ? { cents: r.deposit_cents, status: r.deposit_status ?? 'pending' } : null,
      }));
    }),

  reviews: (userId: string, businessId: string) =>
    withUser(userId, async (db) => {
      await requireMember(db, businessId);
      return (await panelRepo.reviews(db, businessId)) as PanelReviewDTO[];
    }),

  reply: (userId: string, businessId: string, reviewId: string, body: string | null) =>
    withUser(userId, async (db) => {
      await requireMember(db, businessId);
      if (body) await panelRepo.upsertReply(db, businessId, reviewId, body);
      else await panelRepo.deleteReply(db, businessId, reviewId);
      return { ok: true };
    }),
};
