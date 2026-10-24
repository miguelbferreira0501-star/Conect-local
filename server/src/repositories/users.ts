import type { UserDTO } from '@conecta/shared';
import { query, type Db } from '../db/pool';

const cols = `id, name, email, phone, city_ibge AS "cityIbge", created_at AS "createdAt"`;

export const usersRepo = {
  findCredentials: async (email: string, db?: Db) =>
    (await query<{ id: string; password_hash: string }>(`SELECT * FROM app.auth_user_by_email($1)`, [email], db))[0] ?? null,

  emailExists: async (email: string, db?: Db) =>
    (await query<{ exists: boolean }>(`SELECT app.auth_email_exists($1) AS exists`, [email], db))[0].exists,

  /** Requer app.user_id = id (política RLS users_self). */
  create: async (db: Db, u: { id: string; name: string; email: string; passwordHash: string }) =>
    (
      await query<UserDTO>(
        `INSERT INTO users (id, name, email, password_hash, terms_accepted_at) VALUES ($1,$2,$3,$4,now()) RETURNING ${cols}`,
        [u.id, u.name, u.email, u.passwordHash],
        db,
      )
    )[0],

  me: async (db: Db) => (await query<UserDTO>(`SELECT ${cols} FROM users WHERE id = app.current_user_id()`, [], db))[0] ?? null,

  passwordHash: async (db: Db) =>
    (await query<{ password_hash: string }>(`SELECT password_hash FROM users WHERE id = app.current_user_id()`, [], db))[0]?.password_hash,

  update: async (db: Db, patch: { name?: string; phone?: string | null; cityIbge?: number | null }) => {
    const sets: string[] = [];
    const params: unknown[] = [];
    if (patch.name !== undefined) { params.push(patch.name); sets.push(`name = $${params.length}`); }
    if (patch.phone !== undefined) { params.push(patch.phone || null); sets.push(`phone = $${params.length}`); }
    if (patch.cityIbge !== undefined) { params.push(patch.cityIbge); sets.push(`city_ibge = $${params.length}`); }
    if (sets.length === 0) return usersRepo.me(db);
    return (await query<UserDTO>(`UPDATE users SET ${sets.join(', ')}, updated_at = now() WHERE id = app.current_user_id() RETURNING ${cols}`, params, db))[0];
  },

  deleteMe: (db: Db) => query(`DELETE FROM users WHERE id = app.current_user_id()`, [], db),

  createSession: (db: Db, tokenHash: string, userId: string, expiresAt: Date) =>
    query(`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1,$2,$3)`, [tokenHash, userId, expiresAt], db),

  deleteSession: (db: Db, tokenHash: string) => query(`DELETE FROM sessions WHERE token_hash = $1`, [tokenHash], db),

  deleteExpiredSessions: (db: Db) => query(`DELETE FROM sessions WHERE expires_at < now()`, [], db),
};
