import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { env } from '../env';
import { loadLocations } from './locations';
import { seedDemo, syncCategories } from './seed';

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = existsSync(join(here, 'migrations')) ? join(here, 'migrations') : join(here, '../migrations');

export async function migrate(client: pg.Client) {
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
  const done = new Set((await client.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name));
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = readFileSync(join(migrationsDir, file), 'utf8').replaceAll('{{APP_ROLE}}', env.DB_APP_ROLE);
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`✔ migração aplicada: ${file}`);
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

/** Cria (ou atualiza a senha do) papel da aplicação. O dono precisa do privilégio CREATEROLE (Neon e Supabase têm). */
export async function ensureAppRole(client: pg.Client) {
  if (!env.DB_APP_PASSWORD) return;
  const role = env.DB_APP_ROLE;
  const exists = (await client.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [role])).rowCount;
  const pwd = (await client.query('SELECT quote_literal($1) AS q', [env.DB_APP_PASSWORD])).rows[0].q;
  // Na criação definimos os atributos; depois, só sincronizamos a senha (donos com CREATEROLE não alteram atributos).
  if (exists) await client.query(`ALTER ROLE ${role} WITH PASSWORD ${pwd}`);
  else await client.query(`CREATE ROLE ${role} WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD ${pwd}`);
  const db = (await client.query('SELECT current_database() AS d')).rows[0].d;
  await client.query(`GRANT CONNECT ON DATABASE "${db}" TO ${role}`);
  console.log(`✔ papel da aplicação "${role}" pronto`);
}

/** Preparação idempotente para produção: papel, migrações, municípios e (no modo demonstração) dados de exemplo. */
export async function deploy(client: pg.Client) {
  await ensureAppRole(client);
  await migrate(client);
  const cities = (await client.query('SELECT count(*)::int AS n FROM cities')).rows[0].n;
  if (cities < 5000) await loadLocations(client);
  await syncCategories(client);
  if (env.DEMO_MODE) {
    // Recria a demonstração quando não há exemplos nas categorias atuais (ex.: depois da troca de nicho).
    const n = (await client.query('SELECT count(*)::int AS n FROM businesses b JOIN categories c ON c.id = b.category_id WHERE b.is_demo AND c.active')).rows[0].n;
    if (n === 0) await seedDemo(client);
  } else {
    // Lançamento: remove empresas, clientes e avaliações fictícias (as reais não são tocadas).
    const r = await client.query('DELETE FROM businesses WHERE is_demo');
    await client.query(`DELETE FROM users WHERE email LIKE '%@exemplo.invalid' OR email = 'demo@conectalocal.app'`);
    if (r.rowCount) console.log(`✔ dados de demonstração removidos (${r.rowCount} empresas)`);
  }
  const admins = (env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (admins.length) {
    const r = await client.query(`UPDATE users SET role = 'admin' WHERE email = ANY($1) AND role <> 'admin'`, [admins]);
    if (r.rowCount) console.log(`✔ administradores definidos: ${r.rowCount}`);
  }
}

async function main() {
  const cmd = process.argv[2];
  const client = new pg.Client({ connectionString: env.DATABASE_OWNER_URL });
  await client.connect();
  try {
    if (cmd === 'migrate') await migrate(client);
    else if (cmd === 'deploy') await deploy(client);
    else if (cmd === 'locations') await loadLocations(client);
    else if (cmd === 'seed') {
      if (!env.DEMO_MODE) throw new Error('O seed de demonstração só pode rodar com DEMO_MODE=true.');
      await seedDemo(client);
    } else if (cmd === 'reset') {
      if (env.NODE_ENV === 'production') throw new Error('reset apaga o banco e não pode rodar em produção.');
      await reset(client);
      await migrate(client);
      await loadLocations(client);
      await syncCategories(client);
      if (env.DEMO_MODE) await seedDemo(client);
    } else {
      console.log('Uso: cli.ts migrate | deploy | locations | seed | reset');
    }
  } finally {
    await client.end();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
