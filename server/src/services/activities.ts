import { randomUUID } from 'node:crypto';
import {
  ACTIVITY_LIMITS, BOOKING_LIMITS, effectivePlan, planIsActive, bookingFlow, bookingOccurrences, FLOW_NEEDS_ADDRESS, localDateOf, stayNights, toActivityDTO, zonedToUtc,
  type BookingRequestInput, type QuoteRequestInput,
} from '@conecta/shared';

export { ACTIVITY_LIMITS, toActivityDTO };
import { withUser, type Db } from '../db/pool';
import { AppError, notFound } from '../lib/errors';
import { activitiesRepo } from '../repositories/activities';
import { businessesRepo } from '../repositories/businesses';
import { petsRepo } from '../repositories/pets';
import { reviewsRepo } from '../repositories/reviews';
import { availability } from './business';
import { notifyBusiness } from './push';

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

const whenLabel = (d: Date, tz: string) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: tz, weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(d);

/** Avisa a empresa no celular: pedido novo esperando confirmação. */
async function notifyNewBooking(db: Db, businessId: string, service: string, when: string) {
  await notifyBusiness(db, businessId, { title: '🐾 Novo pedido de agendamento', body: `${service} · ${when}. Toque para confirmar.`, url: `/empresas/${businessId}/pedidos`, tag: `req-${businessId}` });
}

export async function createBooking(userId: string, input: BookingRequestInput) {
  return withUser(userId, async (db) => {
    // Bloqueio por empresa: evita dois clientes reservando o mesmo horário ao mesmo tempo.
    await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [input.businessId]);
    const biz = await businessesRepo.basicById(input.businessId, db);
    if (!biz) throw notFound('Empresa não encontrada.');
    const svc = await businessesRepo.service(input.businessId, input.serviceId, db);
    if (!svc) throw new AppError(422, 'invalid_service', 'Serviço inválido para esta empresa.');
    if (input.petId && !(await petsRepo.ownsPet(db, input.petId))) throw new AppError(422, 'invalid_pet', 'Escolha um dos seus pets.');
    const flow = bookingFlow(biz.cat_slug, svc.booking_mode);
    const d = input.details ?? {};
    const needsAddress = FLOW_NEEDS_ADDRESS.has(flow) || d.pickup || d.atHome;
    if (needsAddress && !input.address) throw new AppError(422, 'validation_error', 'Informe o endereço.', { address: 'Informe o endereço.' });
    if (flow === 'ride' && !input.destination) throw new AppError(422, 'validation_error', 'Informe para onde levar o pet.', { destination: 'Informe para onde levar o pet.' });
    const pkg = input.customerPackageId ? await packageForBooking(db, input.customerPackageId, input.businessId, input.serviceId) : null;
    const extra = {
      address: needsAddress ? input.address ?? null : null, destination: flow === 'ride' ? input.destination ?? null : null,
      details: { ...d, houseNotes: flow === 'sitter' ? d.houseNotes : undefined },
      depositCents: svc.deposit_cents && biz.pix_key && !pkg ? svc.deposit_cents : null, customerPackageId: pkg?.id ?? null,
    };
    const first = new Date(input.startsAt);

    // Hospedagem: uma reserva só, da entrada até a saída, na mesma vaga em todas as noites.
    if (svc.booking_mode === 'day' && input.untilDate) {
      const checkIn = localDateOf(first, biz.timezone);
      const nights = stayNights(checkIn, input.untilDate);
      if (!nights.length || nights.length > BOOKING_LIMITS.maxStayNights) throw new AppError(422, 'validation_error', `A saída precisa ser depois da entrada (até ${BOOKING_LIMITS.maxStayNights} noites).`, { untilDate: 'Data de saída inválida.' });
      const avail = await availability(db, input.businessId, input.serviceId, checkIn, input.staffId ?? null);
      const byDay = new Map(avail.slots.map((x) => [x.label, x]));
      let staffIds: string[] | null = null;
      for (const n of nights) {
        const slot = byDay.get(n);
        if (!slot) throw new AppError(409, 'slot_unavailable', `Não há vaga na noite de ${n.split('-').reverse().join('/')}. Escolha outras datas.`);
        staffIds = staffIds === null ? slot.staffIds : staffIds.filter((x) => slot.staffIds.includes(x));
      }
      if (avail.staff.length && !staffIds?.length) throw new AppError(409, 'slot_unavailable', 'Não há a mesma vaga livre em todas as noites. Tente outras datas.');
      const staffId = avail.staff.length ? (input.staffId ?? staffIds![0]) : null;
      const created = await activitiesRepo.createBooking(db, {
        businessId: input.businessId, serviceId: input.serviceId, startsAt: zonedToUtc(checkIn, 0, biz.timezone), endsAt: zonedToUtc(input.untilDate, 0, biz.timezone),
        notes: input.notes, phone: input.contactPhone, staffId, mode: 'day', period: null, partySize: null, petId: input.petId ?? null, seriesId: null,
        ...extra, depositCents: extra.depositCents ? extra.depositCents * nights.length : null,
      });
      await notifyNewBooking(db, input.businessId, svc.name, `${nights.length} ${nights.length === 1 ? 'diária' : 'diárias'} a partir de ${checkIn.split('-').reverse().join('/')}`);
      return { id: created.id, ids: [created.id], skipped: [], seriesId: null, nights: nights.length, status: 'requested' as const, isDemoBusiness: biz.is_demo,
        depositCents: extra.depositCents ? extra.depositCents * nights.length : null };
    }

    let dates: Date[];
    try {
      dates = bookingOccurrences({ startsAt: first, timezone: biz.timezone, mode: svc.booking_mode, repeat: input.repeat ?? null, weekdays: input.weekdays ?? null, untilDate: input.untilDate ?? null, periods: input.periods ?? null });
    } catch (e) {
      throw new AppError(422, 'validation_error', (e as Error).message);
    }
    if (pkg && dates.length > pkg.remaining) throw new AppError(422, 'package_exhausted', `Seu pacote tem ${pkg.remaining} ${pkg.remaining === 1 ? 'sessão restante' : 'sessões restantes'}.`);
    if ((await activitiesRepo.countActiveFutureBookings(db)) + dates.length > ACTIVITY_LIMITS.maxActiveFutureBookings) {
      throw new AppError(429, 'too_many_bookings', 'Você já tem muitos agendamentos em aberto. Cancele ou conclua algum antes de marcar outro.');
    }
    const seriesId = dates.length > 1 ? randomUUID() : null;
    const ids: string[] = [];
    const skipped: string[] = [];
    for (const [i, startsAt] of dates.entries()) {
      const avail = await availability(db, input.businessId, input.serviceId, localDateOf(startsAt, biz.timezone), input.staffId ?? null);
      if (i === 0 && avail.mode === 'day' && dates.length > 1) throw new AppError(422, 'repeat_unavailable', 'Para diárias, escolha a data de saída.');
      const slot = avail.slots.find((s) => new Date(s.startsAt).getTime() === startsAt.getTime());
      if (!slot) {
        if (dates.length === 1) throw new AppError(409, 'slot_unavailable', 'Este horário não está mais disponível. Escolha outro.');
        skipped.push(startsAt.toISOString()); // sem vaga nesta data: as outras continuam
        continue;
      }
      // Sem preferência: fica com quem estiver livre (o primeiro da equipe, na ordem definida pela empresa).
      const staffId = avail.staff.length ? (input.staffId ?? slot.staffIds[0]) : null;
      const created = await activitiesRepo.createBooking(db, {
        businessId: input.businessId, serviceId: input.serviceId, startsAt, endsAt: new Date(slot.endsAt), notes: input.notes,
        phone: input.contactPhone, staffId, mode: avail.mode, period: avail.mode === 'period' ? slot.label : null,
        partySize: input.partySize ?? null, petId: input.petId ?? null, seriesId, ...extra,
        // Sinal só no primeiro atendimento da série (garante a vaga; os demais seguem o combinado).
        depositCents: ids.length === 0 ? extra.depositCents : null,
      });
      ids.push(created.id);
    }
    if (!ids.length) throw new AppError(409, 'slot_unavailable', 'Nenhuma das datas tem vaga. Escolha outros dias ou horários.');
    await notifyNewBooking(db, input.businessId, svc.name, whenLabel(dates[0], biz.timezone) + (ids.length > 1 ? ` (+${ids.length - 1})` : ''));
    return { id: ids[0], ids, skipped, seriesId, status: 'requested' as const, isDemoBusiness: biz.is_demo, depositCents: extra.depositCents };
  });
}

/** Pacote do clube: precisa estar ativo, ser do tutor, da empresa e do serviço, e ter sessões livres. */
async function packageForBooking(db: Db, customerPackageId: string, businessId: string, serviceId: string) {
  const p = await activitiesRepo.customerPackage(db, customerPackageId);
  if (!p || p.business_id !== businessId || p.service_id !== serviceId) throw new AppError(422, 'invalid_package', 'Este pacote não vale para este serviço.');
  if (p.status !== 'active' || (p.expires_at && new Date(p.expires_at) < new Date())) throw new AppError(422, 'invalid_package', 'Este pacote não está ativo.');
  if (p.remaining <= 0) throw new AppError(422, 'package_exhausted', 'As sessões deste pacote acabaram.');
  return p;
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
    if (!planIsActive(effectivePlan(biz.plan, biz.plan_until))) throw notFound('Empresa não encontrada.');
    if (!biz.accepts_quote) throw new AppError(422, 'quote_unavailable', 'Esta empresa não recebe pedidos de orçamento pela plataforma.');
    if (input.serviceId && !(await businessesRepo.service(input.businessId, input.serviceId, db))) {
      throw new AppError(422, 'invalid_service', 'Serviço inválido para esta empresa.');
    }
    if (input.petId && !(await petsRepo.ownsPet(db, input.petId))) throw new AppError(422, 'invalid_pet', 'Escolha um dos seus pets.');
    const created = await activitiesRepo.createQuote(db, { ...input, phone: input.contactPhone });
    await notifyBusiness(db, input.businessId, { title: '💬 Novo pedido de orçamento', body: input.description.slice(0, 120), url: `/empresas/${input.businessId}/pedidos`, tag: `quote-${created.id}` });
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
