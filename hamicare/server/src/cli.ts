import pg from 'pg';
import { env } from './env';
import { migrate, reset } from './db';

const cmd = process.argv[2];
const client = new pg.Client({ connectionString: env.DATABASE_OWNER_URL });
await client.connect();
try {
  if (cmd === 'reset') await reset(client);
  await migrate(client);
} finally {
  await client.end();
}
