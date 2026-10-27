/** Ficha do pet e Pet ao Vivo (etapas do atendimento com fotos). */
import { effectivePlan, FINAL_LIVE_STAGES, liveUpdateSchema, petInputSchema, planIsActive, type LiveStage, type PlanId } from '@conecta/shared';
import { withUser, type Db } from '../db/pool';
import { AppError, forbidden, notFound, parse } from '../lib/errors';
import { decodeImage } from '../lib/images';
import { panelRepo } from '../repositories/panel';
import { liveRepo, petsRepo } from '../repositories/pets';
import { query } from '../db/pool';
import { notifyLive } from './push';

export const PET_LIMITS = { maxPets: 10 };

/** Recursos do plano (Pet ao Vivo, pacotes, fidelidade) exigem assinatura ativa ou teste grátis. */
export async function requireActivePlan(db: Db, businessId: string) {
  const biz = await panelRepo.business(db, businessId);
  if (!biz || !planIsActive(effectivePlan(biz.plan as PlanId, biz.plan_until))) {
    throw new AppError(402, 'plan_required', 'Este recurso faz parte do Plano Pataí. Assine em Plano para continuar.');
  }
}

export const listPets = (userId: string) => withUser(userId, (db) => petsRepo.list(db));

export async function savePet(userId: string, petId: string | null, input: unknown) {
  const v = parse(petInputSchema, input);
  return withUser(userId, async (db) => {
    if (!petId) {
      if ((await petsRepo.count(db)) >= PET_LIMITS.maxPets) throw new AppError(422, 'limit', `Você pode cadastrar até ${PET_LIMITS.maxPets} pets.`);
      const id = await petsRepo.create(db, v);
      return petsRepo.get(db, id);
    }
    if (!(await petsRepo.update(db, petId, v)).length) throw notFound('Pet não encontrado.');
    return petsRepo.get(db, petId);
  });
}

export async function deletePet(userId: string, petId: string) {
  return withUser(userId, async (db) => {
    if (!(await petsRepo.remove(db, petId)).length) throw notFound('Pet não encontrado.');
    return { ok: true };
  });
}

export async function setPetPhoto(userId: string, petId: string, dataUrl: string | null) {
  const img = dataUrl ? decodeImage(dataUrl) : null;
  return withUser(userId, async (db) => {
    if (!(await petsRepo.setPhoto(db, petId, img?.mime ?? null, img?.data ?? null)).length) throw notFound('Pet não encontrado.');
    return petsRepo.get(db, petId);
  });
}

export const petPhoto = (userId: string, petId: string) => withUser(userId, (db) => petsRepo.photo(db, petId));

// ── Pet ao Vivo ──

/** Linha do tempo de um agendamento: o tutor ou a empresa (o banco confere quem pode ver). */
export async function listLive(userId: string, bookingId: string) {
  return withUser(userId, async (db) => {
    const visible = (await query(`SELECT 1 FROM bookings WHERE id = $1`, [bookingId], db))[0];
    if (!visible) throw notFound('Agendamento não encontrado.');
    return liveRepo.list(db, bookingId);
  });
}

export async function addLive(userId: string, businessId: string, bookingId: string, input: unknown) {
  const v = parse(liveUpdateSchema, input);
  const img = v.photo ? decodeImage(v.photo) : null;
  return withUser(userId, async (db) => {
    const role = await panelRepo.role(db, businessId);
    if (role !== 'owner' && role !== 'manager') throw forbidden('Você não tem acesso a esta empresa.');
    await requireActivePlan(db, businessId);
    const b = await panelRepo.booking(db, businessId, bookingId);
    if (!b) throw notFound('Agendamento não encontrado.');
    if (b.status !== 'confirmed' && b.status !== 'completed') {
      throw new AppError(409, 'invalid_state', 'Confirme o agendamento antes de mostrar o pet ao vivo.');
    }
    const update = await liveRepo.add(db, {
      bookingId, businessId, stage: v.stage, note: v.note, details: v.details, mime: img?.mime ?? null, photo: img?.data ?? null,
    });
    await notifyLive(db, bookingId, v.stage as LiveStage, v.note ?? null);
    // Etapa final conclui o atendimento: o tutor já pode avaliar.
    if (FINAL_LIVE_STAGES.has(v.stage as LiveStage) && b.status === 'confirmed') {
      await query(`UPDATE bookings SET status = 'completed', completed_at = now(), updated_at = now() WHERE id = $1`, [bookingId], db);
    }
    return update;
  });
}

export async function removeLive(userId: string, businessId: string, updateId: string) {
  return withUser(userId, async (db) => {
    const role = await panelRepo.role(db, businessId);
    if (role !== 'owner' && role !== 'manager') throw forbidden('Você não tem acesso a esta empresa.');
    if (!(await liveRepo.remove(db, businessId, updateId)).length) throw notFound('Etapa não encontrada.');
    return { ok: true };
  });
}

export const livePhoto = (userId: string, updateId: string) => withUser(userId, (db) => liveRepo.photo(db, updateId));
