/** Formatação em português do Brasil. */

/**
 * Nota com uma casa decimal, SEMPRE arredondada para baixo (4,86 → "4,8"),
 * para nunca exibir uma nota maior do que a real.
 */
export function formatRating(avg: number): string {
  const truncated = Math.floor(avg * 10 + 1e-9) / 10;
  return truncated.toFixed(1).replace('.', ',');
}

/** Abaixo deste número, a nota é exibida com o aviso "poucas avaliações". */
export const MIN_REVIEWS_FOR_CONFIDENT_RATING = 3;

export function reviewCountLabel(count: number): string {
  if (count === 0) return 'Sem avaliações ainda';
  return count === 1 ? '1 avaliação' : `${count.toLocaleString('pt-BR')} avaliações`;
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export function formatCents(cents: number): string {
  return brl.format(cents / 100).replace(/ /g, ' ');
}

export type PriceType = 'fixed' | 'from' | 'range' | 'quote';

export function formatServicePrice(s: { priceType: PriceType; priceMinCents: number | null; priceMaxCents: number | null }): string {
  switch (s.priceType) {
    case 'fixed':
      return s.priceMinCents != null ? formatCents(s.priceMinCents) : 'Consulte o preço';
    case 'from':
      return s.priceMinCents != null ? `A partir de ${formatCents(s.priceMinCents)}` : 'Consulte o preço';
    case 'range':
      return s.priceMinCents != null && s.priceMaxCents != null
        ? `${formatCents(s.priceMinCents)} a ${formatCents(s.priceMaxCents)}`
        : 'Consulte o preço';
    default:
      return 'Solicitar orçamento';
  }
}

export const PRICE_LEVEL_LABELS: Record<number, string> = {
  1: 'Econômico',
  2: 'Preço moderado',
  3: 'Preço acima da média',
  4: 'Premium',
};

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km < 10 ? km.toFixed(1).replace('.', ',') : Math.round(km)} km`;
}

export function relativeTime(date: string | Date, now: Date = new Date()): string {
  const diffDays = Math.floor((now.getTime() - new Date(date).getTime()) / 86_400_000);
  if (diffDays <= 0) return 'hoje';
  if (diffDays === 1) return 'ontem';
  if (diffDays < 30) return `há ${diffDays} dias`;
  const months = Math.floor(diffDays / 30);
  if (months < 12) return months === 1 ? 'há 1 mês' : `há ${months} meses`;
  const years = Math.floor(diffDays / 365);
  return years === 1 ? 'há 1 ano' : `há ${years} anos`;
}

/** Nome público do autor de uma avaliação: "Maria S." — protege a privacidade. */
export function publicAuthorName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] ?? 'Cliente';
  const last = parts.length > 1 ? `${parts[parts.length - 1][0].toUpperCase()}.` : '';
  return `${first.charAt(0).toUpperCase()}${first.slice(1)}${last ? ' ' + last : ''}`;
}

export function formatPhoneBR(digits: string): string {
  const d = digits.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
}

/** Preço de referência de um serviço (para comparar com a cidade). Orçamento não entra. */
export function serviceReferenceCents(s: { priceType: PriceType; priceMinCents: number | null; priceMaxCents: number | null }): number | null {
  if (s.priceType === 'quote' || s.priceMinCents == null) return null;
  if (s.priceType === 'range' && s.priceMaxCents != null) return Math.round((s.priceMinCents + s.priceMaxCents) / 2);
  return s.priceMinCents;
}

/** Mediana de preço do mesmo serviço na cidade (só com 3+ empresas, para não expor concorrente). */
export interface CityPriceRef {
  medianCents: number;
  businesses: number;
}

export const CITY_PRICE_MIN_BUSINESSES = 3;

export type PriceComparison = { tone: 'below' | 'average' | 'above'; label: string };

export function comparePriceWithCity(
  s: { priceType: PriceType; priceMinCents: number | null; priceMaxCents: number | null },
  ref: CityPriceRef | null | undefined,
): PriceComparison | null {
  const own = serviceReferenceCents(s);
  if (own == null || !ref || ref.businesses < CITY_PRICE_MIN_BUSINESSES || ref.medianCents <= 0) return null;
  const ratio = own / ref.medianCents;
  if (ratio <= 0.9) return { tone: 'below', label: 'Abaixo da média da cidade' };
  if (ratio >= 1.15) return { tone: 'above', label: 'Acima da média da cidade' };
  return { tone: 'average', label: 'Na média da cidade' };
}

export function median(values: number[]): number {
  const v = [...values].sort((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : Math.round((v[mid - 1] + v[mid]) / 2);
}
