import { afterAll, beforeAll, expect } from 'vitest';
import pg from 'pg';
import { createApp } from '../src/app';
import { migrate, pool, reset } from '../src/db';
import { resetLimits } from '../src/lib/rateLimit';

export const app = createApp();
const H = { 'content-type': 'application/json', 'x-requested-with': 'hamicare' };

export async function call(method: string, path: string, body?: unknown, cookie?: string, headers: Record<string, string> = H) {
  const res = await app.request(`/api${path}`, { method, headers: { ...headers, ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const setCookie = res.headers.get('set-cookie');
  const type = res.headers.get('content-type') ?? '';
  return { status: res.status, body: type.includes('json') ? await res.json() : await res.text(), cookie: setCookie?.split(';')[0] };
}

let n = 0;
export async function newUser(name = 'Teste', ageGroup = '18mais', email?: string) {
  resetLimits();
  const mail = email ?? `u${Date.now()}${n++}@teste.com`;
  const r = await call('POST', '/auth/register', { name, email: mail, password: 'Senha1234', ageGroup, acceptTerms: true, healthConsent: true, guardianConsent: true });
  expect(r.status).toBe(201);
  return { id: r.body.user.id as string, cookie: r.cookie as string, email: mail };
}

export const pet = { name: 'Paçoca', fur: 'caramelo', phase: 1, outfit: { chapeu: null, oculos: null, roupa: null, acessorio: null } };
export const house = { wallpaper: 'p-creme', floor: 'f-madeira', items: [] };

export async function withProfile(name = 'Teste', ageGroup = '18mais') {
  const u = await newUser(name, ageGroup);
  const p = await call('PUT', '/social/profile', { name, pet, house, level: 2, acceptsRequests: true }, u.cookie);
  expect(p.status).toBe(200);
  return { ...u, code: p.body.profile.code as string };
}

export async function befriend(a: { id: string; cookie: string }, b: { id: string; cookie: string }) {
  expect((await call('POST', `/social/friends/${b.id}/request`, {}, a.cookie)).body.result).toBe('ok');
  expect((await call('POST', `/social/friends/${a.id}/accept`, {}, b.cookie)).status).toBe(200);
}

export function setupDatabase() {
  beforeAll(async () => {
    const owner = new pg.Client({ connectionString: process.env.DATABASE_OWNER_URL });
    await owner.connect();
    await reset(owner);
    await migrate(owner);
    await owner.end();
  });
  afterAll(() => pool.end());
}
