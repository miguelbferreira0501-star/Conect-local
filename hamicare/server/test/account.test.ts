import { describe, expect, it } from 'vitest';
import { call, newUser, setupDatabase } from './helpers';

setupDatabase();

describe('conta e backup', () => {
  it('cadastra, entra, sai e recusa senha errada', async () => {
    const u = await newUser('Ana');
    expect((await call('GET', '/auth/me', undefined, u.cookie)).body.user.name).toBe('Ana');
    expect((await call('POST', '/auth/register', { name: 'Ana', email: u.email, password: 'Senha1234', ageGroup: '18mais', acceptTerms: true })).status).toBe(409);
    expect((await call('POST', '/auth/login', { email: u.email, password: 'errada123' })).status).toBe(401);
    const login = await call('POST', '/auth/login', { email: u.email.toUpperCase(), password: 'Senha1234' });
    expect(login.status).toBe(200);
    await call('POST', '/auth/logout', {}, login.cookie);
    expect((await call('GET', '/auth/me', undefined, login.cookie)).body.user).toBeNull();
  });

  it('menor de 13 precisa de autorização de um responsável', async () => {
    const r = await call('POST', '/auth/register', { name: 'Kid', email: 'kid@teste.com', password: 'Senha1234', ageGroup: 'ate12', acceptTerms: true });
    expect(r.status).toBe(422);
  });

  it('bloqueia pedido sem o cabeçalho anti-CSRF', async () => {
    const r = await call('POST', '/auth/login', { email: 'x@y.com', password: 'x' }, undefined, { 'content-type': 'application/json' });
    expect(r.status).toBe(403);
  });

  it('guarda e recupera o backup do estado', async () => {
    const u = await newUser('Bia');
    expect((await call('GET', '/state', undefined, u.cookie)).body.state).toBeNull();
    const state = { v: 2, pet: { name: 'Pudim' }, journal: [{ text: 'segredo' }] };
    expect((await call('PUT', '/state', { state, clientUpdatedAt: 123 }, u.cookie)).status).toBe(200);
    const r = await call('GET', '/state', undefined, u.cookie);
    expect(r.body.state.pet.name).toBe('Pudim');
    expect(r.body.clientUpdatedAt).toBe(123);
    expect((await call('PUT', '/state', { state: { v: 1 }, clientUpdatedAt: 5 }, u.cookie)).status).toBe(422);
    expect((await call('GET', '/state')).status).toBe(401);
  });

  it('teste grátis do Plus só uma vez', async () => {
    const u = await newUser('Caio');
    const r = await call('POST', '/plus/trial', {}, u.cookie);
    expect(r.status).toBe(200);
    expect((await call('GET', '/auth/me', undefined, u.cookie)).body.user.premiumUntil).toBe(r.body.premiumUntil);
    expect((await call('POST', '/plus/trial', {}, u.cookie)).status).toBe(409);
  });

  it('exclui a conta com a senha', async () => {
    const u = await newUser('Davi');
    expect((await call('DELETE', '/account', { password: 'errada' }, u.cookie)).status).toBe(401);
    expect((await call('DELETE', '/account', { password: 'Senha1234' }, u.cookie)).status).toBe(200);
    expect((await call('POST', '/auth/login', { email: u.email, password: 'Senha1234' })).status).toBe(401);
  });
});
