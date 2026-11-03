import { describe, expect, it } from 'vitest';
import { pool } from '../src/db';
import { mailIdle, outbox } from '../src/lib/mail';
import { resetLimits } from '../src/lib/rateLimit';
import { app, call, newUser, setupDatabase } from './helpers';

setupDatabase();

async function linkFor(email: string) {
  await mailIdle();
  const mail = [...outbox].reverse().find((m) => m.to === email);
  const token = mail?.text.match(/#redefinir=([\w-]+)/)?.[1];
  return { mail, token };
}

describe('esqueci minha senha', () => {
  it('manda o link, troca a senha uma vez só e derruba as sessões antigas', async () => {
    const u = await newUser('Lia Souza');
    const r = await call('POST', '/auth/forgot', { email: u.email.toUpperCase() });
    expect(r.status).toBe(200);
    const { mail, token } = await linkFor(u.email);
    expect(mail?.subject).toContain('senha');
    expect(mail?.text).toContain('Lia,');
    expect(mail?.html).toContain('Criar senha nova');
    expect(token).toBeTruthy();

    expect((await call('POST', '/auth/reset/check', { token })).body.valid).toBe(true);
    expect((await call('POST', '/auth/reset', { token, password: 'curta' })).status).toBe(422);

    const done = await call('POST', '/auth/reset', { token, password: 'NovaSenha99' });
    expect(done.status).toBe(200);
    expect(done.body.user.email).toBe(u.email);
    expect(done.cookie).toBeTruthy();

    // A sessão de antes caiu; a nova funciona.
    expect((await call('GET', '/auth/me', undefined, u.cookie)).body.user).toBeNull();
    expect((await call('GET', '/auth/me', undefined, done.cookie)).body.user.email).toBe(u.email);

    // Senha antiga não entra mais; a nova entra.
    resetLimits();
    expect((await call('POST', '/auth/login', { email: u.email, password: 'Senha1234' })).status).toBe(401);
    expect((await call('POST', '/auth/login', { email: u.email, password: 'NovaSenha99' })).status).toBe(200);

    // O mesmo link não serve de novo.
    expect((await call('POST', '/auth/reset/check', { token })).body.valid).toBe(false);
    expect((await call('POST', '/auth/reset', { token, password: 'OutraSenha1' })).status).toBe(410);
  });

  it('responde igual para e-mail que não existe e não manda nada', async () => {
    resetLimits();
    const before = outbox.length;
    const r = await call('POST', '/auth/forgot', { email: 'ninguem@teste.com' });
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ ok: true });
    await mailIdle();
    expect(outbox.length).toBe(before);
    expect((await call('POST', '/auth/forgot', { email: 'nao-e-email' })).status).toBe(422);
  });

  it('link vencido ou inventado não troca a senha', async () => {
    const u = await newUser('Rui');
    await call('POST', '/auth/forgot', { email: u.email });
    const { token } = await linkFor(u.email);
    const owner = await import('pg').then((pg) => new pg.default.Client({ connectionString: process.env.DATABASE_OWNER_URL }));
    await owner.connect();
    await owner.query(`UPDATE password_resets SET expires_at = now() - interval '1 minute'`);
    await owner.end();
    expect((await call('POST', '/auth/reset', { token, password: 'NovaSenha99' })).status).toBe(410);
    expect((await call('POST', '/auth/reset', { token: 'x'.repeat(43), password: 'NovaSenha99' })).status).toBe(410);
    expect((await call('POST', '/auth/reset', { token: '../../', password: 'NovaSenha99' })).status).toBe(422);
    resetLimits();
    expect((await call('POST', '/auth/login', { email: u.email, password: 'Senha1234' })).status).toBe(200);
  });

  it('limita os pedidos por e-mail e a API não lê a tabela de pedidos', async () => {
    const u = await newUser('Teo');
    const before = outbox.length;
    for (let i = 0; i < 5; i++) expect((await call('POST', '/auth/forgot', { email: u.email })).status).toBe(200);
    await mailIdle();
    expect(outbox.filter((m) => m.to === u.email).length - outbox.slice(0, before).filter((m) => m.to === u.email).length).toBe(3);
    await expect(pool.query('SELECT * FROM password_resets')).rejects.toThrow(/permission denied/);
  });
});

describe('consentimento e páginas legais', () => {
  it('guarda a versão dos termos e o consentimento de saúde no cadastro', async () => {
    const u = await newUser('Gil');
    const owner = await import('pg').then((pg) => new pg.default.Client({ connectionString: process.env.DATABASE_OWNER_URL }));
    await owner.connect();
    const row = (await owner.query('SELECT terms_version, terms_accepted_at, health_consent_at FROM users WHERE id = $1', [u.id])).rows[0];
    await owner.end();
    expect(row.terms_version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(row.terms_accepted_at).toBeTruthy();
    expect(row.health_consent_at).toBeTruthy();
    resetLimits();
    const no = await call('POST', '/auth/register', { name: 'X', email: `x${Date.now()}@teste.com`, password: 'Senha1234', ageGroup: '18mais', acceptTerms: true });
    expect(no.status).toBe(422);
    expect(no.body.message).toContain('dados de saúde');
  });

  it('serve /privacidade e /termos como páginas', async () => {
    for (const path of ['/privacidade', '/termos']) {
      const res = await app.request(path);
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain('<html lang="pt-BR">');
      expect(html).toMatch(/LGPD|Código de Defesa do Consumidor/);
    }
  });
});
