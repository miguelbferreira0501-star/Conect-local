import { afterEach, describe, expect, it } from 'vitest';
import { pool } from '../src/db';
import { sendDueReminders, setPushSender } from '../src/push';
import { befriend, call, newUser, setupDatabase, withProfile } from './helpers';

setupDatabase();

type Sent = { endpoint: string; payload: { title: string; body: string; url: string; tag: string } };
const fakeSender = (box: Sent[]) => async (s: { endpoint: string }, payload: string) => void box.push({ endpoint: s.endpoint, payload: JSON.parse(payload) });

/** Um fuso em que agora é meio-dia (para os avisos de amigos não caírem no silêncio da noite). */
function noonTz(): string {
  let off = ((12 - new Date().getUTCHours()) % 24 + 24) % 24;
  if (off > 12) off -= 24;
  return off === 0 ? 'UTC' : `Etc/GMT${off > 0 ? '-' : '+'}${Math.abs(off)}`;
}

async function subscribe(cookie: string, endpoint: string, prefs: Record<string, unknown>) {
  expect((await call('PUT', '/push/prefs', { enabled: true, time: '19:00', tz: 'America/Sao_Paulo', kinds: {}, ...prefs }, cookie)).status).toBe(200);
  await call('POST', '/push/subscribe', { endpoint, keys: { p256dh: 'x', auth: 'y' } }, cookie);
}

afterEach(() => setPushSender(null));

describe('lembretes ao longo do dia', () => {
  it('água nos horários do plano, sem repetir, nunca de madrugada; inscrição vencida sai', async () => {
    const u = await newUser('Ana');
    expect((await call('PUT', '/push/prefs', { enabled: true, time: '19:00', water: 'demais' }, u.cookie)).status).toBe(422);
    await subscribe(u.cookie, 'https://push.exemplo.com/ana', { water: 'normal', kinds: { tarefas: false, hami: false } });
    await call('PUT', '/state', { state: { v: 2, pet: { name: 'Bolota', stats: { saciedade: 90, felicidade: 90 }, statsAt: Date.now() } }, clientUpdatedAt: 1 }, u.cookie);
    const box: Sent[] = [];
    const fake = fakeSender(box);

    expect(await sendDueReminders(new Date('2026-11-04T12:30:00Z'), fake)).toBe(0); // 9h30 em São Paulo: ainda não
    expect(await sendDueReminders(new Date('2026-11-04T13:05:00Z'), fake)).toBe(1); // 10h05: água
    expect(box[0].payload.body).toMatch(/Bolota/);
    expect(box[0].payload).toMatchObject({ url: '/#atividades', tag: 'hamicare-agua' });
    expect(await sendDueReminders(new Date('2026-11-04T13:40:00Z'), fake)).toBe(0); // mesmo horário: não repete
    expect(await sendDueReminders(new Date('2026-11-04T16:10:00Z'), fake)).toBe(1); // 13h10: próximo copo
    expect(await sendDueReminders(new Date('2026-11-05T02:30:00Z'), fake)).toBe(0); // 23h30: silêncio da noite

    const gone = async () => {
      throw Object.assign(new Error('gone'), { statusCode: 410 });
    };
    await sendDueReminders(new Date('2026-11-05T13:05:00Z'), gone);
    expect((await pool.query('SELECT count(*)::int AS n FROM app.subscriptions_of($1)', [u.id])).rows[0].n).toBe(0);
  });

  it('o Hami com fome chama depois do meio-dia, uma vez no dia', async () => {
    const u = await newUser('Bia');
    await subscribe(u.cookie, 'https://push.exemplo.com/bia', { kinds: { agua: false, tarefas: false } });
    await call('PUT', '/state', { state: { v: 2, pet: { name: 'Paçoca', stats: { saciedade: 20, felicidade: 80 }, statsAt: Date.UTC(2026, 10, 4, 12) } }, clientUpdatedAt: 1 }, u.cookie);
    const box: Sent[] = [];
    expect(await sendDueReminders(new Date('2026-11-04T15:10:00Z'), fakeSender(box))).toBe(1); // 12h10
    expect(box[0].payload).toMatchObject({ url: '/#cuidar', tag: 'hamicare-hami' });
    expect(box[0].payload.body).toMatch(/Paçoca/);
    expect(await sendDueReminders(new Date('2026-11-04T17:30:00Z'), fakeSender(box))).toBe(0);
  });
});

describe('avisos de amigos', () => {
  it('visita, presente e pedido de amizade avisam quem recebe, se a pessoa quiser', async () => {
    const ana = await withProfile('Ana');
    const bia = await withProfile('Bia');
    await subscribe(bia.cookie, 'https://push.exemplo.com/bia2', { tz: noonTz() });
    const box: Sent[] = [];
    setPushSender(fakeSender(box));
    const tick = () => new Promise((r) => setTimeout(r, 120));

    await call('POST', `/social/friends/${bia.id}/request`, {}, ana.cookie);
    await tick();
    expect(box.map((b) => b.payload.body)).toContain('Ana quer ser seu amigo no HamiCare 🐹');
    await call('POST', `/social/friends/${ana.id}/accept`, {}, bia.cookie);

    await call('POST', `/social/visits/${bia.id}`, { reaction: 'abraco' }, ana.cookie);
    await tick();
    expect(box.at(-1)!.payload).toMatchObject({ url: '/#amigos', tag: 'hamicare-amigos' });
    expect(box.at(-1)!.payload.body).toMatch(/Ana passou na sua casa e deixou .* abraço!/);

    await call('POST', '/social/gifts', { to: bia.id, itemId: 'vibe', note: '' }, ana.cookie);
    await tick();
    expect(box.at(-1)!.payload.body).toBe('Ana mandou uma vibe boa pra você 💛');

    // Desligou os avisos de amigos: nada mais chega.
    await subscribe(bia.cookie, 'https://push.exemplo.com/bia2', { tz: noonTz(), kinds: { amigos: false } });
    const before = box.length;
    await call('POST', '/social/gifts', { to: bia.id, itemId: 'vibe', note: '' }, ana.cookie);
    await tick();
    expect(box.length).toBe(before);
  });

  it('sem lembretes ligados, ninguém recebe aviso', async () => {
    const a = await withProfile('Cid');
    const b = await withProfile('Dani');
    await befriend(a, b);
    const box: Sent[] = [];
    setPushSender(fakeSender(box));
    await call('POST', `/social/visits/${b.id}`, { reaction: 'carinho' }, a.cookie);
    await new Promise((r) => setTimeout(r, 120));
    expect(box).toHaveLength(0);
  });
});
