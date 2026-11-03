import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { env } from './env';

pg.types.setTypeParser(20, (v) => Number(v)); // contagens (bigint)
pg.types.setTypeParser(1082, (v) => v); // date como 'AAAA-MM-DD'

export const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 10 });

/**
 * Executa `fn` numa transação com a identidade do usuário definida para as
 * políticas RLS do banco (app.current_user_id()).
 */
export async function withUser<T>(userId: string | null, fn: (db: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.user_id', $1, true)", [userId ?? '']);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

export async function migrate(client: pg.Client) {
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const done = new Set((await client.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name));
  for (const file of readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()) {
    if (done.has(file)) continue;
    const sql = readFileSync(join(migrationsDir, file), 'utf8').replaceAll('{{APP_ROLE}}', env.DB_APP_ROLE);
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      if (env.NODE_ENV !== 'test') console.log(`✔ migração aplicada: ${file}`);
    } catch (e) {
      await client.query('ROLLBACK');
      throw new Error(`Falha na migração ${file}: ${(e as Error).message}`);
    }
  }
}

export async function reset(client: pg.Client) {
  await client.query('DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS app CASCADE; CREATE SCHEMA public;');
  await client.query(`GRANT USAGE ON SCHEMA public TO ${env.DB_APP_ROLE}`);
}

/** Promove a administradores os e-mails de ADMIN_EMAILS. */
export async function syncAdmins() {
  const emails = (env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (emails.length) await pool.query('SELECT app.promote_admins($1)', [emails]);
}
