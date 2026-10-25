import { beforeAll, afterAll, expect } from 'vitest';
import pg from 'pg';
import { createApp } from '../src/app';
import { migrate, reset } from '../src/db/cli';
import { loadLocations } from '../src/db/locations';
import { seedDemo } from '../src/db/seed';
import { pool } from '../src/db/pool';

export const app = createApp();
const H = { 'content-type': 'application/json', 'x-requested-with': 'conecta' };

export async function call(method: string, path: string, body?: unknown, cookie?: string) {
  const res = await app.request(`/api${path}`, {
    method,
    headers: { ...H, ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const setCookie = res.headers.get('set-cookie');
  const type = res.headers.get('content-type') ?? '';
  return { status: res.status, body: type.includes('json') ? await res.json() : await res.arrayBuffer(), cookie: setCookie?.split(';')[0], headers: res.headers };
}

export async function newUser(name = 'Teste Silva') {
  const email = `t${Date.now()}${Math.random().toString(16).slice(2, 6)}@teste.com`;
  const r = await call('POST', '/auth/register', { name, email, password: 'Senha1234', acceptTerms: true });
  expect(r.status).toBe(201);
  return { id: r.body.user.id as string, cookie: r.cookie as string, email };
}

/** Recria o banco de teste do zero. */
export function setupDatabase() {
  beforeAll(async () => {
    const owner = new pg.Client({ connectionString: process.env.DATABASE_OWNER_URL });
    await owner.connect();
    await reset(owner);
    await migrate(owner);
    await loadLocations(owner);
    await seedDemo(owner, { quiet: true });
    await owner.end();
  });
  afterAll(() => pool.end());
}
