import { describe, expect, it } from 'vitest';
import { app, call, newUser, setupDatabase } from './helpers';

setupDatabase();

const H = { 'content-type': 'application/json', 'x-requested-with': 'hamicare' };

describe('app da loja (iPhone/Android)', () => {
  it('aceita pedidos da origem do app e bloqueia outros sites', async () => {
    const u = await newUser('Iris');
    const ok = await call('PUT', '/push/prefs', { enabled: true, time: '19:00' }, u.cookie, { ...H, origin: 'capacitor://localhost' });
    expect(ok.status).toBe(200);
    const bad = await call('PUT', '/push/prefs', { enabled: true, time: '19:00' }, u.cookie, { ...H, origin: 'https://site-estranho.com' });
    expect(bad.status).toBe(403);
  });

  it('responde ao pré-pedido do navegador do app (CORS) só para a origem do app', async () => {
    const pre = await app.request('/api/auth/login', { method: 'OPTIONS', headers: { origin: 'capacitor://localhost', 'access-control-request-method': 'POST' } });
    expect(pre.status).toBe(204);
    expect(pre.headers.get('access-control-allow-origin')).toBe('capacitor://localhost');
    expect(pre.headers.get('access-control-allow-credentials')).toBe('true');
    const other = await app.request('/api/health', { headers: { origin: 'https://site-estranho.com' } });
    expect(other.headers.get('access-control-allow-origin')).toBeNull();
  });
});
