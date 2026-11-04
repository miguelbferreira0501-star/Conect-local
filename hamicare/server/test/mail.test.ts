// Envio de e-mail pelos serviços sem domínio: Brevo (pela web) e SMTP (Gmail).
// Cada arquivo de teste roda isolado, então dá para montar a configuração antes de carregar o módulo.
import { SMTPServer } from 'smtp-server';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const received: { from: string; to: string[]; data: string; user?: string; pass?: string }[] = [];
let server: SMTPServer;
let port = 0;

beforeAll(async () => {
  server = new SMTPServer({
    secure: false,
    authOptional: false,
    disabledCommands: ['STARTTLS'],
    allowInsecureAuth: true,
    onAuth(auth, _s, cb) {
      if (auth.username === 'hami@gmail.com' && auth.password === 'abcdefghijklmnop') return cb(null, { user: auth.username });
      cb(new Error('senha errada'));
    },
    onData(stream, session, cb) {
      let data = '';
      stream.on('data', (c) => (data += c));
      stream.on('end', () => {
        received.push({ from: session.envelope.mailFrom ? session.envelope.mailFrom.address : '', to: session.envelope.rcptTo.map((r) => r.address), data, user: session.user as string });
        cb();
      });
    },
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
  port = (server.server.address() as { port: number }).port;
});
const ENV_KEYS = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'BREVO_API_KEY', 'MAIL_FROM'];
const saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
afterAll(async () => {
  for (const k of ENV_KEYS) if (saved[k] === undefined) delete process.env[k];
  else process.env[k] = saved[k];
  await new Promise<void>((r) => server.close(() => r()));
});

describe('e-mail sem domínio', () => {
  it('manda pelo Gmail (SMTP) com a senha de app que vem com espaços', async () => {
    vi.resetModules();
    Object.assign(process.env, { SMTP_HOST: '127.0.0.1', SMTP_PORT: String(port), SMTP_USER: 'hami@gmail.com', SMTP_PASS: 'abcd efgh ijkl mnop' });
    delete process.env.MAIL_FROM;
    const mail = await import('../src/lib/mail');
    expect(mail.mailVia()).toBe('smtp');
    const ok = await mail.sendMail(mail.resetMail('lia@teste.com', 'Lia', 'http://localhost/#redefinir=abc', 60));
    expect(ok).toBe(true);
    const got = received.at(-1)!;
    expect(got.user).toBe('hami@gmail.com');
    expect(got.from).toBe('hami@gmail.com');
    expect(got.to).toEqual(['lia@teste.com']);
    expect(got.data).toContain('HamiCare <hami@gmail.com>');
    expect(got.data).toMatch(/redefinir=(3D)?abc/); // o corpo vai codificado (quoted-printable)
  });

  it('manda pelo Brevo, com o remetente verificado, e o Brevo vem antes do SMTP', async () => {
    vi.resetModules();
    Object.assign(process.env, { BREVO_API_KEY: 'xkeysib-teste', MAIL_FROM: 'HamiCare <hami@gmail.com>' });
    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => (calls.push({ url, init }), new Response('{"messageId":"1"}', { status: 201 })));
    const mail = await import('../src/lib/mail');
    expect(mail.mailVia()).toBe('brevo');
    expect(await mail.sendMail(mail.resetMail('bia@teste.com', 'Bia', 'http://localhost/#redefinir=xyz', 60))).toBe(true);
    expect(calls[0].url).toBe('https://api.brevo.com/v3/smtp/email');
    expect((calls[0].init.headers as Record<string, string>)['api-key']).toBe('xkeysib-teste');
    const body = JSON.parse(String(calls[0].init.body));
    expect(body.sender).toEqual({ name: 'HamiCare', email: 'hami@gmail.com' });
    expect(body.to).toEqual([{ email: 'bia@teste.com' }]);
    expect(body.htmlContent).toContain('redefinir=xyz');
    vi.stubGlobal('fetch', async () => new Response('erro', { status: 401 }));
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await mail.sendMail(mail.resetMail('bia@teste.com', 'Bia', 'x', 60))).toBe(false);
    expect(err).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('lê o remetente com e sem nome', async () => {
    const { parseFrom } = await import('../src/lib/mail');
    expect(parseFrom('HamiCare <a@b.com>')).toEqual({ name: 'HamiCare', email: 'a@b.com' });
    expect(parseFrom('"Hami Care" <a@b.com>')).toEqual({ name: 'Hami Care', email: 'a@b.com' });
    expect(parseFrom('a@b.com')).toEqual({ email: 'a@b.com' });
  });
});
