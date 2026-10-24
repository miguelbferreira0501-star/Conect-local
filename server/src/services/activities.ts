import { REVIEW_RULES, type ActivityDTO, type BookingRequestInput, type QuoteRequestInput } from '@conecta/shared';
import { withUser, type Db } from '../db/pool';
import { AppError, notFound } from '../lib/errors';
import { activitiesRepo, type ActivityRow } from '../repositories/activities';
import { businessesRepo } from '../repositories/businesses';
import { reviewsRepo } from '../repositories/reviews';
import { availability } from './business';

export const ACTIVITY_LIMITS = { maxActiveFutureBookings: 10, maxQuotesPerDay: 15, reviewWindowDays: 180 };

export function toActivityDTO(a: ActivityRow, lastReviewByBusiness: Map<string, Date>, now = new Date()): ActivityDTO {
  const startsAt = a.starts_at ? new Date(a.starts_at) : null;
  const done = (a.type === 'booking' && a.status === 'completed') || (a.type === 'quote' && a.status === 'hired');
  const closedAt = a.closed_at ? new Date(a.closed_at) : startsAt;
  const withinWindow = !closedAt || now.getTime() - closedAt.getTime() <= ACTIVITY_LIMITS.reviewWindowDays * 86_400_000;
  const last = lastReviewByBusiness.get(a.business_id);
  const cooldownOk = !last || now.getTime() - last.getTime() >= REVIEW_RULES.minDaysBetweenReviewsSameBusiness * 86_400_000;
  const active = a.status === 'requested' || a.status === 'confirmed';
  return {
    id: a.id,
    type: a.type,
    status: a.status as ActivityDTO['status'],
    business: { id: a.business_id, slug: a.business_slug, name: a.business_name, logoUrl: a.logo_url, categoryName: a.category_name },
    serviceName: a.service_name,
    startsAt: startsAt?.toISOString() ?? null,
    preferredDate: a.preferred_date,
    description: a.description,
    createdAt: new Date(a.created_at).toISOString(),
    canReview: done && !a.review_id && withinWindow && cooldownOk,
    reviewId: a.review_id,
    canMarkDone: a.type === 'booking' ? active && !!startsAt && startsAt <= now : a.status === 'sent' || a.status === 'answered',
    canCancel: a.type === 'booking' ? active && !!startsAt && startsAt > now : a.status === 'sent' || a.status === 'answered',
  };
}

async function lastReviewMap(db: Db) {
  const mine = (await reviewsRepo.mine(db)) as Array<{ business: { id: string }; createdAt: Date }>;
  const map = new Map<string, Date>();
  for (const r of mine) {
    const d = new Date(r.createdAt);
    const prev = map.get(r.business.id);
    if (!prev || d > prev) map.set(r.business.id, d);
  }
  return map;
}

export const listActivities = (userId: string) =>
  withUser(userId, async (db) => {
    const rows = await activitiesRepo.list(db);
    const last = await lastReviewMap(db);
    return rows.map((r) => toActivityDTO(r, last));
  });

export async function createBooking(userId: string, input: BookingRequestInput) {
  return withUser(userId, async (db) => {
    // Bloqueio por empresa: evita dois clientes reservando o mesmo horário ao mesmo tempo.
    await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [input.businessId]);
    if ((await activitiesRepo.countActiveFutureBookings(db)) >= ACTIVITY_LIMITS.maxActiveFutureBookings) {
      throw new AppError(429, 'too_many_bookings', 'Você já tem muitos agendamentos em aberto. Cancele ou conclua algum antes de marcar outro.');
    }
    const biz = await businessesRepo.basicById(input.businessId, db);
    if (!biz) throw notFound('Empresa não encontrada.');
    const startsAt = new Date(input.startsAt);
    const localDate = new Intl.DateTimeFormat('en-CA', { timeZone: biz.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(startsAt);
    const avail = await availability(db, input.businessId, input.serviceId, localDate);
    if (!avail.slots.some((s) => new Date(s.startsAt).getTime() === startsAt.getTime())) {
      throw new AppError(409, 'slot_unavailable', 'Este horário não está mais disponível. Escolha outro.');
    }
    const created = await activitiesRepo.createBooking(db, {
      businessId: input.businessId,
      serviceId: input.serviceId,
      startsAt,
      endsAt: new Date(startsAt.getTime() + avail.durationMinutes * 60_000),
      notes: input.notes,
      phone: input.contactPhone,
    });
    return { id: created.id, status: 'requested' as const, isDemoBusiness: biz.is_demo };
  });
}

export async function updateBooking(userId: string, id: string, action: 'cancel' | 'complete') {
  return withUser(userId, async (db) => {
    const b = await activitiesRepo.booking(db, id);
    if (!b) throw notFound('Agendamento não encontrado.');
    const active = b.status === 'requested' || b.status === 'confirmed';
    const started = new Date(b.starts_at) <= new Date();
    if (action === 'cancel') {
      if (!active || started) throw new AppError(409, 'invalid_state', 'Este agendamento não pode mais ser cancelado.');
      await activitiesRepo.setBookingStatus(db, id, 'cancelled');
    } else {
      if (!active || !started) throw new AppError(409, 'invalid_state', 'Você poderá confirmar a realização depois do horário agendado.');
      await activitiesRepo.setBookingStatus(db, id, 'completed');
    }
    return { ok: true };
  });
}

export async function createQuote(userId: string, input: QuoteRequestInput) {
  return withUser(userId, async (db) => {
    if ((await activitiesRepo.countQuotesToday(db)) >= ACTIVITY_LIMITS.maxQuotesPerDay) {
      throw new AppError(429, 'too_many_quotes', 'Você atingiu o limite de solicitações por hoje. Tente novamente amanhã.');
    }
    const biz = await businessesRepo.basicById(input.businessId, db);
    if (!biz) throw notFound('Empresa não encontrada.');
    if (!biz.accepts_quote) throw new AppError(422, 'quote_unavailable', 'Esta empresa não recebe pedidos de orçamento pela plataforma.');
    if (input.serviceId && !(await businessesRepo.service(input.businessId, input.serviceId, db))) {
      throw new AppError(422, 'invalid_service', 'Serviço inválido para esta empresa.');
    }
    const created = await activitiesRepo.createQuote(db, { ...input, phone: input.contactPhone });
    return { id: created.id, status: 'sent' as const, isDemoBusiness: biz.is_demo };
  });
}

export async function updateQuote(userId: string, id: string, action: 'hired' | 'close') {
  return withUser(userId, async (db) => {
    const q = await activitiesRepo.quote(db, id);
    if (!q) throw notFound('Solicitação não encontrada.');
    if (q.status !== 'sent' && q.status !== 'answered') throw new AppError(409, 'invalid_state', 'Esta solicitação já foi encerrada.');
    await activitiesRepo.setQuoteStatus(db, id, action === 'hired' ? 'hired' : 'closed');
    return { ok: true };
  });
}
