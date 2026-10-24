import { hoursAreFresh, toMinutes, type BusinessDetailDTO, type ReviewDTO } from '@conecta/shared';
import { withUser, type Db } from '../db/pool';
import { AppError, notFound } from '../lib/errors';
import { weekdayOf, zonedToUtc } from '../lib/time';
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

export const BOOKING_RULES = {
  slotStepMinutes: 30,
  minLeadMinutes: 60,
  maxDaysAhead: 60,
};

/** Horários livres de um serviço numa data (no fuso da cidade da empresa). */
export async function availability(db: Db, businessId: string, serviceId: string, date: string, now = new Date()) {
  const biz = await businessesRepo.basicById(businessId, db);
  if (!biz) throw notFound('Empresa não encontrada.');
  if (!biz.accepts_booking) throw new AppError(422, 'booking_unavailable', 'Esta empresa não oferece agendamento pela plataforma.');
  const svc = await businessesRepo.service(businessId, serviceId, db);
  if (!svc || !svc.bookable || !svc.duration_minutes) throw new AppError(422, 'service_not_bookable', 'Este serviço não pode ser agendado pela plataforma.');
  const dayStart = zonedToUtc(date, 0, biz.timezone);
  if (dayStart.getTime() > now.getTime() + BOOKING_RULES.maxDaysAhead * 86_400_000) {
    return { date, timezone: biz.timezone, durationMinutes: svc.duration_minutes, slots: [] as Array<{ startsAt: string; label: string }> };
  }
  const ranges = biz.opening_hours?.[String(weekdayOf(date))] ?? [];
  const busy = await businessesRepo.busyRanges(businessId, dayStart, new Date(dayStart.getTime() + 86_400_000), db);
  const slots: Array<{ startsAt: string; label: string }> = [];
  const minStart = now.getTime() + BOOKING_RULES.minLeadMinutes * 60_000;
  for (const [open, close] of ranges) {
    for (let m = toMinutes(open); m + svc.duration_minutes <= toMinutes(close); m += BOOKING_RULES.slotStepMinutes) {
      const start = zonedToUtc(date, m, biz.timezone);
      const end = new Date(start.getTime() + svc.duration_minutes * 60_000);
      if (start.getTime() < minStart) continue;
      if (busy.some((b) => start < new Date(b.ends_at) && end > new Date(b.starts_at))) continue;
      slots.push({ startsAt: start.toISOString(), label: `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` });
    }
  }
  return { date, timezone: biz.timezone, durationMinutes: svc.duration_minutes, slots };
}
