/** Cálculo de horários livres para agendamento (puro, usado pela API e pela prévia). */
import { toMinutes, type OpeningHours } from './hours';
import { weekdayOf, zonedToUtc } from './time';

export const BOOKING_RULES = {
  slotStepMinutes: 30,
  minLeadMinutes: 60,
  maxDaysAhead: 60,
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
