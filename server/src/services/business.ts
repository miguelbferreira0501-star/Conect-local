import { BOOKING_RULES, bookingProfile, computeAvailability, hoursAreFresh, type BusinessDetailDTO, type ReviewDTO } from '@conecta/shared';
import { withUser, type Db } from '../db/pool';
import { AppError, notFound } from '../lib/errors';
import { zonedToUtc } from '../lib/time';
import { businessesRepo } from '../repositories/businesses';
import { favoritesRepo } from '../repositories/favorites';
import { reviewsRepo } from '../repositories/reviews';
import { globalMean, scoreRows, toCard } from './cards';

export async function businessDetail(slug: string, userId: string | null): Promise<BusinessDetailDTO> {
  return withUser(userId, async (db) => {
    const row = await businessesRepo.bySlug(slug, db);
    if (!row) throw notFound('Empresa não encontrada.');
    const mean = await globalMean();
    const [scored] = scoreRows([row], { q: '', mean });
    // Mesma conexão (transação): consultas em sequência.
    const services = await businessesRepo.services(row.id, db);
    const photos = await businessesRepo.photos(row.id, db);
    const areas = await businessesRepo.serviceAreas(row.id, db);
    const distribution = await businessesRepo.ratingDistribution(row.id, db);
    const aspects = await businessesRepo.aspectAverages(row.id, db);
    const isFavorite = userId ? await favoritesRepo.isFavorite(db, row.id) : false;
    const staff = await businessesRepo.staff(row.id, db);
    const card = toCard(scored);
    return {
      ...card,
      description: row.description,
      address: {
        street: row.address_public ? row.street : null,
        neighborhood: row.neighborhood,
        postalCode: row.address_public ? row.postal_code : null,
        public: row.address_public,
      },
      coordinates: row.address_public && row.lat != null && row.lon != null && row.mode_in_person ? { lat: row.lat, lon: row.lon } : null,
      serviceAreaCities: areas,
      openingHours: row.opening_hours,
      hoursUpdatedAt: row.hours_updated_at ? new Date(row.hours_updated_at).toISOString() : null,
      hoursFresh: hoursAreFresh(row.hours_updated_at),
      timezone: row.timezone,
      contact: {
        phone: row.phone,
        whatsapp: row.whatsapp,
        website: safeUrl(row.website),
        instagram: row.instagram,
        facebook: row.facebook,
        email: row.email,
      },
      services: services as BusinessDetailDTO['services'],
      photos: photos as BusinessDetailDTO['photos'],
      ratingDistribution: distribution,
      aspectAverages: aspects,
      verifiedAt: row.verified_at ? new Date(row.verified_at).toISOString() : null,
      isFavorite,
      staff: staff.map(({ openingHours: _h, ...st }) => st),
      staffLabel: bookingProfile(row.cat_slug).staffLabel,
    };
  });
}

/** Só exibimos links http(s) bem formados. */
function safeUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
}

export async function businessReviews(
  businessId: string,
  userId: string | null,
  opts: { sort: 'recent' | 'highest' | 'lowest'; page: number; rating?: number },
): Promise<{ items: ReviewDTO[]; total: number; page: number; pageSize: number }> {
  const pageSize = 10;
  return withUser(userId, async (db) => {
    const items = await reviewsRepo.listForBusiness(db, businessId, { sort: opts.sort, limit: pageSize, offset: (opts.page - 1) * pageSize, rating: opts.rating });
    const total = await reviewsRepo.countForBusiness(db, businessId, opts.rating);
    return { items: items.map((r) => ({ ...r, isMine: !!r.isMine })) as ReviewDTO[], total, page: opts.page, pageSize };
  });
}

export { BOOKING_RULES };

/**
 * Disponibilidade de um serviço (qualquer tipo de agenda), por profissional/recurso.
 * `staffId` restringe a uma pessoa; sem ele, junta todos que fazem o serviço ("sem preferência").
 */
export async function availability(db: Db, businessId: string, serviceId: string, date: string, staffId?: string | null, now = new Date()) {
  const biz = await businessesRepo.basicById(businessId, db);
  if (!biz) throw notFound('Empresa não encontrada.');
  if (!biz.accepts_booking) throw new AppError(422, 'booking_unavailable', 'Esta empresa não oferece agendamento pela plataforma.');
  const svc = await businessesRepo.service(businessId, serviceId, db);
  if (!svc || !svc.bookable || (svc.booking_mode === 'slot' && !svc.duration_minutes)) {
    throw new AppError(422, 'service_not_bookable', 'Este serviço não pode ser agendado pela plataforma.');
  }
  const allStaff = await businessesRepo.staff(businessId, db);
  let staff = allStaff.filter((s) => s.serviceIds.length === 0 || s.serviceIds.includes(serviceId));
  if (staffId) {
    staff = staff.filter((s) => s.id === staffId);
    if (!staff.length) throw new AppError(422, 'invalid_staff', 'Este profissional não faz este serviço.');
  }
  const days = svc.booking_mode === 'day' ? 60 : 1;
  const from = zonedToUtc(date, 0, biz.timezone);
  const busy = await businessesRepo.busyRanges(businessId, from, new Date(from.getTime() + (days + 1) * 86_400_000), db);
  const result = computeAvailability({
    mode: svc.booking_mode, date, timezone: biz.timezone, durationMinutes: svc.duration_minutes, businessHours: biz.opening_hours,
    staff: staff.map((s) => ({ id: s.id, name: s.name, openingHours: s.openingHours })), busy, now, days,
  });
  return {
    date, timezone: biz.timezone, mode: svc.booking_mode, durationMinutes: svc.duration_minutes, slots: result.slots,
    staff: staff.map((s) => ({ id: s.id, name: s.name, roleTitle: s.roleTitle })),
  };
}
