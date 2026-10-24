import { ACTIVITY_LIMITS, localDateOf, toActivityDTO, type BookingRequestInput, type QuoteRequestInput } from '@conecta/shared';

export { ACTIVITY_LIMITS, toActivityDTO };
import { withUser, type Db } from '../db/pool';
import { AppError, notFound } from '../lib/errors';
import { activitiesRepo } from '../repositories/activities';
import { businessesRepo } from '../repositories/businesses';
import { reviewsRepo } from '../repositories/reviews';
import { availability } from './business';

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
    const localDate = localDateOf(startsAt, biz.timezone);
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
