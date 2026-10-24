/**
 * Horários de funcionamento: { "0": [["08:00","12:00"],["13:00","18:00"]], ... }
 * Chaves 0 (domingo) a 6 (sábado). Horário local da cidade da empresa.
 */
export type OpeningHours = Partial<Record<'0' | '1' | '2' | '3' | '4' | '5' | '6', Array<[string, string]>>>;

export const WEEKDAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/** Só mostramos "Aberto agora" se os horários foram confirmados nos últimos 180 dias. */
export const HOURS_FRESHNESS_DAYS = 180;

export function hoursAreFresh(updatedAt: string | Date | null, now: Date = new Date()): boolean {
  if (!updatedAt) return false;
  return (now.getTime() - new Date(updatedAt).getTime()) / 86_400_000 <= HOURS_FRESHNESS_DAYS;
}

export function localParts(date: Date, timeZone: string): { weekday: number; minutes: number; isoDate: string } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  return {
    weekday,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    isoDate: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export function isOpenAt(hours: OpeningHours | null | undefined, date: Date, timeZone: string): boolean {
  if (!hours) return false;
  const { weekday, minutes } = localParts(date, timeZone);
  const ranges = hours[String(weekday) as keyof OpeningHours] ?? [];
  return ranges.some(([a, b]) => minutes >= toMinutes(a) && minutes < toMinutes(b));
}

export function describeDayHours(ranges: Array<[string, string]> | undefined): string {
  if (!ranges || ranges.length === 0) return 'Fechado';
  return ranges.map(([a, b]) => `${a} às ${b}`).join(' e ');
}
