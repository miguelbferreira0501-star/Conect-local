import type { PetDTO, PetValues, LiveUpdateDTO } from '@conecta/shared';
import { query, type Db } from '../db/pool';

/** Colunas da ficha do pet no formato da API (sem a foto em si). */
export const PET_COLS = (alias = 'p') => `${alias}.id, ${alias}.name, ${alias}.species, ${alias}.breed, ${alias}.size, ${alias}.sex,
  ${alias}.birth_year AS "birthYear", ${alias}.weight_kg::float AS "weightKg", ${alias}.temperament, ${alias}.health_notes AS "healthNotes",
  ${alias}.care_notes AS "careNotes", ${alias}.grooming_notes AS "groomingNotes", ${alias}.vaccines_up_to_date AS "vaccinesUpToDate",
  CASE WHEN ${alias}.photo IS NOT NULL THEN '/api/pets/' || ${alias}.id || '/photo?v=' || extract(epoch FROM ${alias}.updated_at)::bigint END AS "photoUrl"`;

type Clean = PetValues;

export const petsRepo = {
  list: (db: Db) => query<PetDTO>(`SELECT ${PET_COLS()} FROM pets p WHERE p.user_id = app.current_user_id() ORDER BY p.created_at`, [], db),

  get: async (db: Db, id: string) => (await query<PetDTO>(`SELECT ${PET_COLS()} FROM pets p WHERE p.id = $1`, [id], db))[0] ?? null,

  count: async (db: Db) => (await query<{ n: number }>(`SELECT count(*)::int AS n FROM pets WHERE user_id = app.current_user_id()`, [], db))[0].n,

  create: async (db: Db, v: Clean) =>
    (await query<{ id: string }>(
      `INSERT INTO pets (user_id, name, species, breed, size, sex, birth_year, weight_kg, temperament, health_notes, care_notes, grooming_notes, vaccines_up_to_date)
       VALUES (app.current_user_id(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [v.name, v.species, v.breed, v.size, v.sex, v.birthYear, v.weightKg, v.temperament, v.healthNotes, v.careNotes, v.groomingNotes, v.vaccinesUpToDate], db))[0].id,

  update: (db: Db, id: string, v: Clean) =>
    query(
      `UPDATE pets SET name=$2, species=$3, breed=$4, size=$5, sex=$6, birth_year=$7, weight_kg=$8, temperament=$9, health_notes=$10,
         care_notes=$11, grooming_notes=$12, vaccines_up_to_date=$13, updated_at=now()
       WHERE id = $1 AND user_id = app.current_user_id() RETURNING id`,
      [id, v.name, v.species, v.breed, v.size, v.sex, v.birthYear, v.weightKg, v.temperament, v.healthNotes, v.careNotes, v.groomingNotes, v.vaccinesUpToDate], db),

  remove: (db: Db, id: string) => query(`DELETE FROM pets WHERE id = $1 AND user_id = app.current_user_id() RETURNING id`, [id], db),

  setPhoto: (db: Db, id: string, mime: string | null, data: Buffer | null) =>
    query(`UPDATE pets SET photo_mime = $2, photo = $3, updated_at = now() WHERE id = $1 AND user_id = app.current_user_id() RETURNING id`, [id, mime, data], db),

  /** Foto: o dono vê; a empresa vê se o pet tem pedido com ela (regra no banco). */
  photo: async (db: Db, id: string) =>
    (await query<{ mime: string; data: Buffer }>(`SELECT photo_mime AS mime, photo AS data FROM pets WHERE id = $1 AND photo IS NOT NULL`, [id], db))[0] ?? null,

  ownsPet: async (db: Db, id: string) =>
    !!(await query(`SELECT 1 FROM pets WHERE id = $1 AND user_id = app.current_user_id()`, [id], db))[0],
};

const LIVE_COLS = `u.id, u.stage, u.note, u.details,
  CASE WHEN u.photo IS NOT NULL THEN '/api/live/' || u.id || '/photo' END AS "photoUrl", u.created_at AS "createdAt"`;

export const liveRepo = {
  list: (db: Db, bookingId: string) =>
    query<LiveUpdateDTO>(`SELECT ${LIVE_COLS} FROM booking_updates u WHERE u.booking_id = $1 ORDER BY u.created_at`, [bookingId], db),

  add: async (db: Db, v: { bookingId: string; businessId: string; stage: string; note: string | null; details: object; mime: string | null; photo: Buffer | null }) =>
    (await query<LiveUpdateDTO>(
      `INSERT INTO booking_updates (booking_id, business_id, stage, note, details, photo_mime, photo, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, app.current_user_id()) RETURNING ${LIVE_COLS.replace(/u\./g, '')}`,
      [v.bookingId, v.businessId, v.stage, v.note, JSON.stringify(v.details), v.mime, v.photo], db))[0],

  remove: (db: Db, businessId: string, id: string) => query(`DELETE FROM booking_updates WHERE id = $2 AND business_id = $1 RETURNING id`, [businessId, id], db),

  photo: async (db: Db, id: string) =>
    (await query<{ mime: string; data: Buffer }>(`SELECT photo_mime AS mime, photo AS data FROM booking_updates WHERE id = $1 AND photo IS NOT NULL`, [id], db))[0] ?? null,
};
