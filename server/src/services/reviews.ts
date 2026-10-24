import { publicAuthorName, REVIEW_RULES, type ReviewInput, type ReviewReportInput, type ReviewUpdateInput } from '@conecta/shared';
import { withUser } from '../db/pool';
import { AppError, forbidden, notFound } from '../lib/errors';
import { activitiesRepo } from '../repositories/activities';
import { reviewsRepo } from '../repositories/reviews';
import { usersRepo } from '../repositories/users';
import { listActivities } from './activities';

/**
 * Regras anti-fraude (ver docs/AVALIACOES.md):
 *  1. Só avalia quem tem uma contratação registrada: agendamento realizado ou orçamento marcado como contratado.
 *  2. Uma avaliação por contratação; intervalo mínimo de 30 dias entre avaliações da mesma empresa.
 *  3. Limite diário de avaliações por pessoa.
 *  4. Sem links, e-mails ou telefones no texto.
 *  5. O banco revalida a ligação com a contratação (trigger) e a autoria (RLS).
 *  6. Empresas não podem apagar avaliações; denúncias vão para moderação, sem ocultar automaticamente.
 */
export async function eligibility(userId: string, businessId: string) {
  const acts = await listActivities(userId);
  return acts.filter((a) => a.business.id === businessId && a.canReview);
}

export async function createReview(userId: string, input: ReviewInput) {
  const all = await listActivities(userId);
  const activity = all.find((a) => a.id === input.activityId && a.type === input.activityType && a.business.id === input.businessId);
  if (!activity?.canReview) {
    const message = activity?.reviewId
      ? 'Você já avaliou este atendimento. Se quiser, edite a sua avaliação.'
      : activity && (activity.status === 'completed' || activity.status === 'hired')
        ? `Você avaliou esta empresa recentemente ou o prazo para avaliar terminou. É possível avaliar a mesma empresa a cada ${REVIEW_RULES.minDaysBetweenReviewsSameBusiness} dias.`
        : 'Você só pode avaliar depois de contratar o serviço e confirmar que ele foi realizado.';
    throw new AppError(403, 'not_eligible', message);
  }
  return withUser(userId, async (db) => {
    if ((await reviewsRepo.countMineToday(db)) >= REVIEW_RULES.maxReviewsPerDay) {
      throw new AppError(429, 'too_many_reviews', 'Você atingiu o limite de avaliações por hoje.');
    }
    const user = await usersRepo.me(db);
    const source = input.activityType === 'booking' ? await activitiesRepo.booking(db, input.activityId) : await activitiesRepo.quote(db, input.activityId);
    const created = await reviewsRepo.create(db, {
      businessId: input.businessId,
      authorName: publicAuthorName(user!.name),
      bookingId: input.activityType === 'booking' ? input.activityId : null,
      quoteId: input.activityType === 'quote' ? input.activityId : null,
      serviceId: source?.service_id ?? null,
      rating: input.rating,
      comment: input.comment,
      aspects: input.aspects,
    });
    return { id: created.id };
  });
}

export async function updateReview(userId: string, id: string, input: ReviewUpdateInput) {
  return withUser(userId, async (db) => {
    const r = await reviewsRepo.mineById(db, id);
    if (!r) throw notFound('Avaliação não encontrada.');
    if (Date.now() - new Date(r.created_at).getTime() > REVIEW_RULES.editableDays * 86_400_000) {
      throw new AppError(409, 'not_editable', `Avaliações só podem ser editadas até ${REVIEW_RULES.editableDays} dias depois de publicadas.`);
    }
    await reviewsRepo.update(db, id, input);
    return { ok: true };
  });
}

export async function deleteReview(userId: string, id: string) {
  return withUser(userId, async (db) => {
    const r = await reviewsRepo.mineById(db, id);
    if (!r) throw notFound('Avaliação não encontrada.');
    await reviewsRepo.remove(db, id);
    return { ok: true };
  });
}

export async function reportReview(userId: string, id: string, input: ReviewReportInput) {
  return withUser(userId, async (db) => {
    const r = await reviewsRepo.publicById(db, id);
    if (!r) throw notFound('Avaliação não encontrada.');
    if (r.user_id === userId) throw forbidden('Você não pode denunciar a sua própria avaliação.');
    const created = await reviewsRepo.report(db, id, input.reason, input.details);
    return { ok: true, alreadyReported: !created };
  });
}

export const myReviews = (userId: string) => withUser(userId, (db) => reviewsRepo.mine(db));
