import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { env } from '../env';
import { loadLocations } from './locations';
import { seedDemo } from './seed';

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

async function main() {
  const cmd = process.argv[2];
  const client = new pg.Client({ connectionString: env.DATABASE_OWNER_URL });
  await client.connect();
  try {
    if (cmd === 'migrate') await migrate(client);
    else if (cmd === 'locations') await loadLocations(client);
    else if (cmd === 'seed') {
      if (!env.DEMO_MODE) throw new Error('O seed de demonstração só pode rodar com DEMO_MODE=true.');
      await seedDemo(client);
    } else if (cmd === 'reset') {
      await reset(client);
      await migrate(client);
      await loadLocations(client);
      if (env.DEMO_MODE) await seedDemo(client);
    } else {
      console.log('Uso: cli.ts migrate | locations | seed | reset');
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
