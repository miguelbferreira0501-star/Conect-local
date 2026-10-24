/**
 * Selos de confiança. Cada selo tem critério objetivo e verificável.
 * Nenhum selo pode ser comprado. Ver docs/RANKING.md.
 */
export type BadgeId = 'verified' | 'consistent_history' | 'many_reviews' | 'responsive' | 'booking_available';

export interface BadgeDefinition {
  id: BadgeId;
  label: string;
  criteria: string;
}

export const BADGE_RULES = {
  consistentHistory: { minReviews: 20, minAverage: 4.3, maxStddev: 1.0, minSpanDays: 180 },
  manyReviews: { minReviews: 50 },
  responsive: { minRequests: 10, minAnsweredRate: 0.8 },
} as const;

export const BADGES: Record<BadgeId, BadgeDefinition> = {
  verified: {
    id: 'verified',
    label: 'Perfil verificado',
    criteria:
      'A empresa comprovou CNPJ ou documento do responsável, endereço e telefone. Indica que os dados foram conferidos — não é garantia de qualidade do serviço.',
  },
  consistent_history: {
    id: 'consistent_history',
    label: 'Histórico consistente',
    criteria: `Pelo menos ${BADGE_RULES.consistentHistory.minReviews} avaliações, média a partir de 4,3, notas pouco dispersas e avaliações distribuídas em pelo menos 6 meses.`,
  },
  many_reviews: {
    id: 'many_reviews',
    label: 'Muitas avaliações',
    criteria: `Pelo menos ${BADGE_RULES.manyReviews.minReviews} avaliações válidas de clientes.`,
  },
  responsive: {
    id: 'responsive',
    label: 'Responde às solicitações',
    criteria: `Respondeu pelo menos 80% das solicitações recebidas pela plataforma (mínimo de ${BADGE_RULES.responsive.minRequests}).`,
  },
  booking_available: {
    id: 'booking_available',
    label: 'Agenda disponível',
    criteria: 'Oferece agendamento pela plataforma, com horários de funcionamento cadastrados.',
  },
};

export interface BadgeInput {
  verifiedAt: string | Date | null;
  reviewCount: number;
  average: number | null;
  stddev: number | null;
  firstReviewAt: string | Date | null;
  lastReviewAt: string | Date | null;
  requestsReceived: number;
  requestsAnswered: number;
  acceptsBooking: boolean;
  hasBookableService: boolean;
  hasOpeningHours: boolean;
}

export function computeBadges(b: BadgeInput): BadgeId[] {
  const out: BadgeId[] = [];
  if (b.verifiedAt) out.push('verified');
  const ch = BADGE_RULES.consistentHistory;
  if (
    b.reviewCount >= ch.minReviews &&
    b.average != null &&
    b.average >= ch.minAverage &&
    b.stddev != null &&
    b.stddev <= ch.maxStddev &&
    b.firstReviewAt &&
    b.lastReviewAt &&
    (new Date(b.lastReviewAt).getTime() - new Date(b.firstReviewAt).getTime()) / 86_400_000 >= ch.minSpanDays
  ) {
    out.push('consistent_history');
  }
  if (b.reviewCount >= BADGE_RULES.manyReviews.minReviews) out.push('many_reviews');
  const r = BADGE_RULES.responsive;
  if (b.requestsReceived >= r.minRequests && b.requestsAnswered / b.requestsReceived >= r.minAnsweredRate) {
    out.push('responsive');
  }
  if (b.acceptsBooking && b.hasBookableService && b.hasOpeningHours) out.push('booking_available');
  return out;
}

/** Fração (0–1) dos itens do perfil preenchidos — usada no ranking. */
export function profileCompleteness(p: {
  description?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  instagram?: string | null;
  openingHours?: unknown;
  servicesCount: number;
  servicesWithPrice: number;
  photosCount: number;
  hasAddressOrArea: boolean;
}): number {
  const checks = [
    !!p.description && p.description.length >= 60,
    !!p.logoUrl,
    !!p.coverUrl,
    !!(p.phone || p.whatsapp),
    !!(p.website || p.instagram),
    !!p.openingHours && Object.keys(p.openingHours as object).length > 0,
    p.servicesCount >= 3,
    p.servicesCount > 0 && p.servicesWithPrice / p.servicesCount >= 0.5,
    p.photosCount >= 3,
    p.hasAddressOrArea,
  ];
  return checks.filter(Boolean).length / checks.length;
}
