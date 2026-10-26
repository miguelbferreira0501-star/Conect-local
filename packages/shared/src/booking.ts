/** Cálculo de horários livres para agendamento (puro, usado pela API e pela prévia). */
import { toMinutes, type OpeningHours } from './hours';
import { weekdayOf, zonedToUtc } from './time';

export const BOOKING_RULES = {
  slotStepMinutes: 30,
  minLeadMinutes: 60,
  maxDaysAhead: 90,
};

export interface SlotInput {
  date: string; // AAAA-MM-DD no fuso da empresa
  timezone: string;
  durationMinutes: number;
  openingHours: OpeningHours | Record<string, Array<[string, string]>> | null;
  busy: Array<{ starts_at: string | Date; ends_at: string | Date }>;
  now?: Date;
}

export function computeSlots(i: SlotInput): Array<{ startsAt: string; label: string }> {
  const now = i.now ?? new Date();
  const dayStart = zonedToUtc(i.date, 0, i.timezone);
  if (dayStart.getTime() > now.getTime() + BOOKING_RULES.maxDaysAhead * 86_400_000) return [];
  const ranges = (i.openingHours as Record<string, Array<[string, string]>> | null)?.[String(weekdayOf(i.date))] ?? [];
  const minStart = now.getTime() + BOOKING_RULES.minLeadMinutes * 60_000;
  const slots: Array<{ startsAt: string; label: string }> = [];
  for (const [open, close] of ranges) {
    for (let m = toMinutes(open); m + i.durationMinutes <= toMinutes(close); m += BOOKING_RULES.slotStepMinutes) {
      const start = zonedToUtc(i.date, m, i.timezone);
      const end = new Date(start.getTime() + i.durationMinutes * 60_000);
      if (start.getTime() < minStart) continue;
      if (i.busy.some((b) => start < new Date(b.ends_at) && end > new Date(b.starts_at))) continue;
      slots.push({ startsAt: start.toISOString(), label: `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` });
    }
  }
  return slots;
}

/** Data local (AAAA-MM-DD) de um instante no fuso indicado. */
export function localDateOf(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);
}

// ── Agendas por nicho ──────────────────────────────────────────────────────────

export type BookingMode = 'slot' | 'period' | 'day';
export type Period = 'morning' | 'afternoon' | 'evening';

export const BOOKING_MODE_LABELS: Record<BookingMode, { title: string; description: string }> = {
  slot: { title: 'Horário marcado', description: 'O cliente escolhe dia e horário exato (usa a duração do serviço).' },
  period: { title: 'Dia e turno', description: 'O cliente escolhe o dia e manhã, tarde ou noite; você combina a hora exata.' },
  day: { title: 'Diária', description: 'O cliente reserva o dia inteiro (espaços, hospedagem, eventos).' },
};

export const PERIODS: Record<Period, { label: string; start: string; end: string }> = {
  morning: { label: 'Manhã', start: '08:00', end: '12:00' },
  afternoon: { label: 'Tarde', start: '12:00', end: '18:00' },
  evening: { label: 'Noite', start: '18:00', end: '22:00' },
};

/**
 * Configuração padrão de agenda de cada categoria (a empresa pode mudar por serviço).
 * `staffLabel` é como o app chama quem atende: "Profissional", "Quadra", "Espaço"...
 */
export const BOOKING_PROFILES: Record<string, { mode: BookingMode; staffLabel: string; staffLabelPlural: string; staffKind: 'person' | 'resource' }> = {
  'banho-e-tosa': { mode: 'slot', staffLabel: 'Banhista/tosador(a)', staffLabelPlural: 'Banhistas e tosadores', staffKind: 'person' },
  passeador: { mode: 'slot', staffLabel: 'Passeador(a)', staffLabelPlural: 'Passeadores', staffKind: 'person' },
  // Pet sitter combina o turno da visita (manhã/tarde/noite) e a hora exata com o tutor.
  'pet-sitter': { mode: 'period', staffLabel: 'Cuidador(a)', staffLabelPlural: 'Cuidadores', staffKind: 'person' },
  'hospedagem-e-creche': { mode: 'day', staffLabel: 'Vaga', staffLabelPlural: 'Vagas', staffKind: 'resource' },
  adestramento: { mode: 'slot', staffLabel: 'Adestrador(a)', staffLabelPlural: 'Adestradores', staffKind: 'person' },
  'pet-taxi': { mode: 'slot', staffLabel: 'Veículo', staffLabelPlural: 'Veículos', staffKind: 'resource' },
  'outros-servicos': { mode: 'slot', staffLabel: 'Profissional', staffLabelPlural: 'Profissionais', staffKind: 'person' },
};
export const bookingProfile = (categorySlug: string) => BOOKING_PROFILES[categorySlug] ?? BOOKING_PROFILES['outros-servicos'];

type Hours = OpeningHours | Record<string, Array<[string, string]>> | null;

export interface AgendaStaff {
  id: string;
  name: string;
  /** Horários próprios; null = horários da empresa */
  openingHours: Hours;
}

export interface AvailabilityInput {
  mode: BookingMode;
  date: string; // AAAA-MM-DD (para "day": primeiro dia da lista)
  timezone: string;
  durationMinutes: number | null;
  businessHours: Hours;
  /** Equipe que pode fazer o serviço. Vazio = agenda única da empresa. */
  staff: AgendaStaff[];
  busy: Array<{ starts_at: string | Date; ends_at: string | Date; staff_id: string | null }>;
  now?: Date;
  /** Para "day": quantos dias listar. */
  days?: number;
}

export interface AvailabilityResult {
  mode: BookingMode;
  slots: Array<{ startsAt: string; endsAt: string; label: string; staffIds: string[] }>;
}

function addDays(iso: string, n: number) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/**
 * Disponibilidade para qualquer tipo de agenda. Cada item lista quais membros da equipe estão livres
 * (staffIds vazio = agenda única da empresa). Reservas sem profissional bloqueiam todos (conservador).
 */
export function computeAvailability(i: AvailabilityInput): AvailabilityResult {
  const now = i.now ?? new Date();
  const agendas: Array<{ id: string | null; hours: Hours }> = i.staff.length
    ? i.staff.map((s) => ({ id: s.id, hours: s.openingHours ?? i.businessHours }))
    : [{ id: null, hours: i.businessHours }];
  const isBusy = (agendaId: string | null, start: Date, end: Date) =>
    i.busy.some((b) => (agendaId === null || b.staff_id === null || b.staff_id === agendaId) && start < new Date(b.ends_at) && end > new Date(b.starts_at));
  const rangesOf = (hours: Hours, date: string) => (hours as Record<string, Array<[string, string]>> | null)?.[String(weekdayOf(date))] ?? [];
  const minStart = now.getTime() + BOOKING_RULES.minLeadMinutes * 60_000;
  const horizon = now.getTime() + BOOKING_RULES.maxDaysAhead * 86_400_000;
  const merged = new Map<string, { startsAt: string; endsAt: string; label: string; staffIds: string[] }>();
  const push = (start: Date, end: Date, label: string, agendaId: string | null) => {
    const key = start.toISOString();
    const item = merged.get(key) ?? { startsAt: key, endsAt: end.toISOString(), label, staffIds: [] };
    if (agendaId) item.staffIds.push(agendaId);
    merged.set(key, item);
  };

  if (i.mode === 'slot') {
    const duration = i.durationMinutes ?? 60;
    for (const a of agendas) {
      for (const [open, close] of rangesOf(a.hours, i.date)) {
        for (let m = toMinutes(open); m + duration <= toMinutes(close); m += BOOKING_RULES.slotStepMinutes) {
          const start = zonedToUtc(i.date, m, i.timezone);
          const end = new Date(start.getTime() + duration * 60_000);
          if (start.getTime() < minStart || start.getTime() > horizon || isBusy(a.id, start, end)) continue;
          push(start, end, `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`, a.id);
        }
      }
    }
  } else if (i.mode === 'period') {
    for (const a of agendas) {
      const ranges = rangesOf(a.hours, i.date);
      for (const [key, p] of Object.entries(PERIODS) as Array<[Period, (typeof PERIODS)[Period]]>) {
        // O turno vale se a empresa/profissional abre em parte dele.
        const overlaps = ranges.some(([o, c]) => toMinutes(o) < toMinutes(p.end) && toMinutes(c) > toMinutes(p.start));
        if (!overlaps) continue;
        const start = zonedToUtc(i.date, toMinutes(p.start), i.timezone);
        const end = zonedToUtc(i.date, toMinutes(p.end), i.timezone);
        // Turno pode ser pedido até o fim do turno anterior ao início (antecedência mínima sobre o início).
        if (start.getTime() < minStart || start.getTime() > horizon || isBusy(a.id, start, end)) continue;
        push(start, end, key, a.id);
      }
    }
  } else {
    for (let d = 0; d < (i.days ?? 60); d++) {
      const date = addDays(i.date, d);
      for (const a of agendas) {
        if (rangesOf(a.hours, date).length === 0) continue;
        const start = zonedToUtc(date, 0, i.timezone);
        const end = zonedToUtc(addDays(date, 1), 0, i.timezone);
        if (start.getTime() + 86_400_000 < minStart || start.getTime() > horizon || isBusy(a.id, start, end)) continue;
        push(start, end, date, a.id);
      }
    }
  }
  return { mode: i.mode, slots: [...merged.values()].sort((a, b) => a.startsAt.localeCompare(b.startsAt)) };
}

/** Categorias em que o agendamento é uma reserva com número de pessoas (e serviços formam o cardápio). */
export const RESERVATION_CATEGORIES = new Set(['restaurantes']);
export const isReservationCategory = (slug: string) => RESERVATION_CATEGORIES.has(slug);
