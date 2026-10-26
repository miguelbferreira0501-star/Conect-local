/**
 * Cada área marca do seu jeito: banho e tosa por horário, passeio em dias da semana, pet sitter por
 * período de viagem, hospedagem por entrada e saída, táxi dog com endereço de busca e destino.
 * Funções puras: usadas pela API, pelo app e pela prévia.
 */
import { z } from 'zod';
import { localDateOf, PERIODS, type BookingMode, type Period } from './booking';
import { zonedToUtc, weekdayOf } from './time';

export type BookingFlow = 'grooming' | 'walk' | 'sitter' | 'stay' | 'daycare' | 'training' | 'ride' | 'generic';

export function bookingFlow(categorySlug: string, serviceMode: BookingMode | null | undefined): BookingFlow {
  switch (categorySlug) {
    case 'banho-e-tosa': return 'grooming';
    case 'passeador': return 'walk';
    case 'pet-sitter': return 'sitter';
    case 'hospedagem-e-creche': return serviceMode === 'day' ? 'stay' : 'daycare';
    case 'adestramento': return 'training';
    case 'pet-taxi': return 'ride';
    default: return serviceMode === 'day' ? 'stay' : 'generic';
  }
}

export const FLOW_COPY: Record<BookingFlow, { title: string; cta: string; submit: string }> = {
  grooming: { title: 'Agendar banho e tosa', cta: 'Agendar', submit: 'Solicitar agendamento' },
  walk: { title: 'Agendar passeio', cta: 'Agendar passeio', submit: 'Solicitar passeio' },
  sitter: { title: 'Agendar visitas', cta: 'Agendar visitas', submit: 'Solicitar visitas' },
  stay: { title: 'Reservar hospedagem', cta: 'Reservar', submit: 'Solicitar reserva' },
  daycare: { title: 'Agendar creche', cta: 'Agendar creche', submit: 'Solicitar creche' },
  training: { title: 'Agendar aula', cta: 'Agendar aula', submit: 'Solicitar aula' },
  ride: { title: 'Agendar corrida', cta: 'Agendar corrida', submit: 'Solicitar corrida' },
  generic: { title: 'Agendar horário', cta: 'Agendar', submit: 'Solicitar agendamento' },
};

/** Áreas em que o endereço do tutor é obrigatório (o serviço vai até ele). */
export const FLOW_NEEDS_ADDRESS = new Set<BookingFlow>(['walk', 'sitter', 'ride']);

export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;
export const BOOKING_LIMITS = { maxOccurrences: 40, maxStayNights: 30, maxSitterDays: 31 };

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.');
export const bookingDetailsSchema = z.object({
  /** Banho e tosa: buscar e levar o pet em casa */
  pickup: z.boolean().optional(),
  /** Adestramento: aula na casa do tutor */
  atHome: z.boolean().optional(),
  /** Táxi dog: ida e volta */
  roundTrip: z.boolean().optional(),
  returnTime: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido.').optional(),
  /** Pet sitter: chave, portaria, alarme, onde ficam ração e remédios */
  houseNotes: z.string().trim().max(500, 'Use no máximo 500 caracteres.').optional(),
}).default({});
export type BookingDetails = z.infer<typeof bookingDetailsSchema>;

export const flowFieldsSchema = z.object({
  address: z.string().trim().max(200, 'Use no máximo 200 caracteres.').optional(),
  destination: z.string().trim().max(200, 'Use no máximo 200 caracteres.').optional(),
  details: bookingDetailsSchema,
  /** Passeio/creche: em quais dias da semana repetir (0 = domingo) */
  weekdays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  /** Pet sitter: último dia das visitas; hospedagem: dia da saída */
  untilDate: isoDate.optional(),
  /** Pet sitter: turnos de visita por dia */
  periods: z.array(z.enum(['morning', 'afternoon', 'evening'])).min(1).max(3).optional(),
});

function addDays(iso: string, n: number) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

export interface OccurrenceInput {
  startsAt: Date;
  timezone: string;
  mode: BookingMode;
  repeat?: { everyWeeks: number; count: number } | null;
  weekdays?: number[] | null;
  untilDate?: string | null;
  periods?: Period[] | null;
}

/**
 * Horários de cada atendimento que o pedido cria (o primeiro é o escolhido).
 * - pet sitter: cada dia do período × cada turno escolhido;
 * - passeio/creche: os dias da semana escolhidos, por N semanas (a cada 1, 2 ou 4);
 * - demais: a repetição simples (mesmo dia da semana).
 * Diárias (hospedagem) viram um único atendimento com entrada e saída (ver stayRange).
 */
export function bookingOccurrences(i: OccurrenceInput): Date[] {
  const firstDate = localDateOf(i.startsAt, i.timezone);
  const minutes = Math.round((i.startsAt.getTime() - zonedToUtc(firstDate, 0, i.timezone).getTime()) / 60_000);
  let out: Date[];
  if (i.mode === 'period' && i.untilDate) {
    const days = daysBetween(firstDate, i.untilDate);
    if (days < 0 || days >= BOOKING_LIMITS.maxSitterDays) throw new RangeError(`Escolha um período de até ${BOOKING_LIMITS.maxSitterDays} dias.`);
    const periods = [...new Set(i.periods?.length ? i.periods : [])].sort((a, b) => PERIODS[a].start.localeCompare(PERIODS[b].start));
    out = [];
    for (let d = 0; d <= days; d++) {
      const date = addDays(firstDate, d);
      const list = periods.length ? periods : (null as Period[] | null);
      if (!list) out.push(zonedToUtc(date, minutes, i.timezone));
      else for (const p of list) out.push(zonedToUtc(date, toMin(PERIODS[p].start), i.timezone));
    }
    out = out.filter((t) => t.getTime() >= i.startsAt.getTime());
  } else if (i.weekdays?.length && i.repeat) {
    const wanted = new Set(i.weekdays);
    out = [];
    for (let d = 0; d < i.repeat.count * 7 * i.repeat.everyWeeks; d++) {
      if (Math.floor(d / 7) % i.repeat.everyWeeks !== 0) continue;
      const date = addDays(firstDate, d);
      if (wanted.has(weekdayOf(date))) out.push(zonedToUtc(date, minutes, i.timezone));
    }
    if (!out.length || out[0].getTime() !== i.startsAt.getTime()) out.unshift(i.startsAt);
  } else if (i.repeat) {
    out = Array.from({ length: i.repeat.count }, (_, k) => new Date(i.startsAt.getTime() + k * i.repeat!.everyWeeks * 7 * 86_400_000));
  } else {
    out = [i.startsAt];
  }
  const uniq = [...new Map(out.map((t) => [t.getTime(), t])).values()].sort((a, b) => a.getTime() - b.getTime());
  if (uniq.length > BOOKING_LIMITS.maxOccurrences) throw new RangeError(`São ${uniq.length} atendimentos; o máximo por pedido é ${BOOKING_LIMITS.maxOccurrences}.`);
  return uniq;
}

const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** Hospedagem: noites entre a entrada e a saída (a saída não conta como diária). */
export function stayNights(checkIn: string, checkOut: string): string[] {
  const n = daysBetween(checkIn, checkOut);
  return Array.from({ length: Math.max(0, n) }, (_, k) => addDays(checkIn, k));
}
