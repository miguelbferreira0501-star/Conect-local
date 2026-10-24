import pg from 'pg';
import { env } from '../env';

// Datas e números vindos do Postgres em formatos previsíveis.
pg.types.setTypeParser(1700, (v) => Number(v)); // numeric
pg.types.setTypeParser(20, (v) => Number(v)); // bigint (contagens)
pg.types.setTypeParser(1082, (v) => v); // date como 'YYYY-MM-DD'

export const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 10 });

export type Db = pg.PoolClient | pg.Pool;

export async function query<T extends pg.QueryResultRow = any>(sql: string, params: unknown[] = [], db: Db = pool) {
  const res = await db.query<T>(sql, params);
  return res.rows;
}

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
