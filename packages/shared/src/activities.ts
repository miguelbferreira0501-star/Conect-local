/** Regras de estado das atividades do cliente (agendamentos e orçamentos). */
import { REVIEW_RULES } from './schemas';
import type { ActivityDTO } from './types';

export interface ActivityRow {
  id: string;
  type: 'booking' | 'quote';
  status: string;
  business_id: string;
  business_slug: string;
  business_name: string;
  logo_url: string | null;
  category_name: string;
  is_demo: boolean;
  service_name: string | null;
  service_id: string | null;
  starts_at: string | Date | null;
  preferred_date: string | null;
  description: string | null;
  created_at: string | Date;
  closed_at: string | Date | null;
  review_id: string | null;
}

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

