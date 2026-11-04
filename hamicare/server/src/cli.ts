import pg from 'pg';
import { env } from './env';
import { migrate, reset } from './db';

/** Cria (ou atualiza a senha do) papel da API, sem privilégios de dono: as políticas RLS valem para ele. */
async function ensureAppRole(client: pg.Client) {
  if (!env.DB_APP_PASSWORD) return;
  const role = env.DB_APP_ROLE;
  const pwd = (await client.query('SELECT quote_literal($1) AS q', [env.DB_APP_PASSWORD])).rows[0].q;
  const exists = (await client.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [role])).rowCount;
  if (exists) await client.query(`ALTER ROLE ${role} WITH PASSWORD ${pwd}`);
  else await client.query(`CREATE ROLE ${role} WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD ${pwd}`);
  const db = (await client.query('SELECT current_database() AS d')).rows[0].d;
  await client.query(`GRANT CONNECT ON DATABASE "${db}" TO ${role}`);
  console.log(`✔ papel da API "${role}" pronto`);
}

const cmd = process.argv[2];
const client = new pg.Client({ connectionString: env.DATABASE_OWNER_URL });
await client.connect();
try {
  if (cmd === 'reset') await reset(client);
  if (cmd === 'deploy') await ensureAppRole(client);
  await migrate(client);
} finally {
  await client.end();
}
