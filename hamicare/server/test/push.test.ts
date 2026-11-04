import { describe, expect, it } from 'vitest';
import { pool } from '../src/db';
import { reminderFor, sendDueReminders } from '../src/push';
import { call, newUser, setupDatabase } from './helpers';

setupDatabase();

describe('lembretes push', () => {
  it('manda um por dia, depois do horário escolhido, e remove inscrição expirada', async () => {
    const u = await newUser('Ana');
    await call('PUT', '/push/prefs', { enabled: true, time: '19:00', tz: 'America/Sao_Paulo', kinds: { tarefas: true } }, u.cookie);
    await call('POST', '/push/subscribe', { endpoint: 'https://push.exemplo.com/abc', keys: { p256dh: 'x', auth: 'y' } }, u.cookie);
    await call('PUT', '/state', { state: { v: 2, pet: { stats: { saciedade: 10, felicidade: 80 } } }, clientUpdatedAt: 1 }, u.cookie);
    const sent: string[] = [];
    const fake = async (_s: unknown, payload: string) => void sent.push(JSON.parse(payload).body);

    expect(await sendDueReminders(new Date('2026-11-03T21:00:00Z'), fake)).toBe(0); // 18h em São Paulo: ainda não
    expect(await sendDueReminders(new Date('2026-11-03T22:30:00Z'), fake)).toBe(1); // 19h30
    expect(sent[0]).toMatch(/Hami/); // com fome: lembrete do Hami
    expect(await sendDueReminders(new Date('2026-11-03T23:30:00Z'), fake)).toBe(0); // já lembrou hoje

    const gone = async () => {
      throw Object.assign(new Error('gone'), { statusCode: 410 });
    };
    await sendDueReminders(new Date('2026-11-04T22:30:00Z'), gone);
    expect((await pool.query("SELECT count(*)::int AS n FROM app.subscriptions_of($1)", [u.id])).rows[0].n).toBe(0);
  });

  it('escolhe a mensagem pelo estado, sem culpa', () => {
    const now = new Date();
    expect(reminderFor({ adventure: { endsAt: 0 } }, {}, now)).toMatch(/aventura/);
    expect(reminderFor({}, { tarefas: false, missoes: false }, now)).toBeNull();
  });
});
