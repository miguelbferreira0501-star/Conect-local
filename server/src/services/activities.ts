import { randomUUID } from 'node:crypto';
import { ACTIVITY_LIMITS, localDateOf, repeatDates, toActivityDTO, type BookingRequestInput, type QuoteRequestInput } from '@conecta/shared';

export { ACTIVITY_LIMITS, toActivityDTO };
import { withUser, type Db } from '../db/pool';
import { AppError, notFound } from '../lib/errors';
import { activitiesRepo } from '../repositories/activities';
import { businessesRepo } from '../repositories/businesses';
import { petsRepo } from '../repositories/pets';
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
    const biz = await businessesRepo.basicById(input.businessId, db);
    if (!biz) throw notFound('Empresa não encontrada.');
    if (input.petId && !(await petsRepo.ownsPet(db, input.petId))) throw new AppError(422, 'invalid_pet', 'Escolha um dos seus pets.');
    const first = new Date(input.startsAt);
    const dates = input.repeat ? repeatDates(first, input.repeat) : [first];
    if ((await activitiesRepo.countActiveFutureBookings(db)) + dates.length > ACTIVITY_LIMITS.maxActiveFutureBookings) {
      throw new AppError(429, 'too_many_bookings', 'Você já tem muitos agendamentos em aberto. Cancele ou conclua algum antes de marcar outro.');
    }
    const seriesId = dates.length > 1 ? randomUUID() : null;
    const ids: string[] = [];
    const skipped: string[] = [];
    for (const [i, startsAt] of dates.entries()) {
      const avail = await availability(db, input.businessId, input.serviceId, localDateOf(startsAt, biz.timezone), input.staffId ?? null);
      if (i === 0 && avail.mode === 'day' && dates.length > 1) throw new AppError(422, 'repeat_unavailable', 'Diárias não podem ser repetidas automaticamente.');
      const slot = avail.slots.find((s) => new Date(s.startsAt).getTime() === startsAt.getTime());
      if (!slot) {
        if (i === 0) throw new AppError(409, 'slot_unavailable', 'Este horário não está mais disponível. Escolha outro.');
        skipped.push(startsAt.toISOString()); // repetição sem vaga: as outras continuam
        continue;
      }
      // Sem preferência: fica com quem estiver livre (o primeiro da equipe, na ordem definida pela empresa).
      const staffId = avail.staff.length ? (input.staffId ?? slot.staffIds[0]) : null;
      const created = await activitiesRepo.createBooking(db, {
        businessId: input.businessId, serviceId: input.serviceId, startsAt, endsAt: new Date(slot.endsAt), notes: input.notes,
        phone: input.contactPhone, staffId, mode: avail.mode, period: avail.mode === 'period' ? slot.label : null,
        partySize: input.partySize ?? null, petId: input.petId ?? null, seriesId,
      });
      ids.push(created.id);
    }
    return { id: ids[0], ids, skipped, seriesId, status: 'requested' as const, isDemoBusiness: biz.is_demo };
  });
}

/** Cancela este e os próximos agendamentos da mesma série (ex.: parar os passeios semanais). */
export async function cancelSeries(userId: string, bookingId: string) {
  return withUser(userId, async (db) => {
    const b = await activitiesRepo.booking(db, bookingId);
    if (!b) throw notFound('Agendamento não encontrado.');
    const n = await activitiesRepo.cancelSeriesFrom(db, bookingId);
    if (!n) throw new AppError(409, 'invalid_state', 'Não há agendamentos futuros para cancelar nesta série.');
    return { ok: true, cancelled: n };
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
    if (input.petId && !(await petsRepo.ownsPet(db, input.petId))) throw new AppError(422, 'invalid_pet', 'Escolha um dos seus pets.');
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
