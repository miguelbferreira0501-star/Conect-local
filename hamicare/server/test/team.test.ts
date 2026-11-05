import { afterEach, describe, expect, it } from 'vitest';
import { setPushSender } from '../src/push';
import { DEFAULT_GAME as G } from '../../web/src/shared/game';
import { befriend, call, setupDatabase, withProfile } from './helpers';

setupDatabase();

const today = () => new Date().toISOString().slice(0, 10);
afterEach(() => setPushSender(null));

function noonTz(): string {
  let off = ((12 - new Date().getUTCHours()) % 24 + 24) % 24;
  if (off > 12) off -= 24;
  return off === 0 ? 'UTC' : `Etc/GMT${off > 0 ? '-' : '+'}${Math.abs(off)}`;
}

describe('turma', () => {
  it('só amigos, no máximo 4 pessoas e uma turma por pessoa', async () => {
    const ana = await withProfile('Ana');
    const [bia, cid, dani, edu] = [await withProfile('Bia'), await withProfile('Cid'), await withProfile('Dani'), await withProfile('Edu')];
    const estranho = await withProfile('Fê');
    for (const f of [bia, cid, dani, edu]) await befriend(ana, f);

    const notFriend = await call('POST', '/social/team', { name: 'Turma', missions: ['agua'], members: [estranho.id] }, ana.cookie);
    expect(notFriend.status).toBe(403);
    expect((await call('POST', '/social/team', { name: 'Turma', missions: ['inventada'] }, ana.cookie)).status).toBe(422);
    expect((await call('POST', '/social/team', { name: 'Turma', missions: ['agua', 'sol', 'sono', 'dentes'] }, ana.cookie)).status).toBe(422);

    const r = await call('POST', '/social/team', { name: 'Os Fofos', missions: ['agua', 'caminhada'], members: [bia.id, cid.id, dani.id] }, ana.cookie);
    expect(r.status).toBe(201);
    expect(r.body.team.members).toHaveLength(4);
    // Cheia: o quinto não entra.
    const full = await call('POST', '/social/team/members', { userId: edu.id }, ana.cookie);
    expect(full.status).toBe(409);
    expect(full.body.error).toBe('turma_cheia');
    // Quem já está numa turma não cria outra.
    await befriend(bia, edu);
    const again = await call('POST', '/social/team', { name: 'Outra', missions: ['agua'], members: [edu.id] }, bia.cookie);
    expect(again.status).toBe(409);
    expect(again.body.error).toBe('ja_em_turma');
    // Quem não é amigo direto vê o Hami dos outros da turma (Bia e Cid não são amigos).
    const seenByBia = await call('GET', '/social/team', undefined, bia.cookie);
    expect(seenByBia.body.team.members.map((m: { name: string }) => m.name).sort()).toEqual(['Ana', 'Bia', 'Cid', 'Dani']);
    // Quem não está na turma não vê nada.
    expect((await call('GET', '/social/team', undefined, edu.cookie)).body.team).toBeNull();
  });

  it('a missão só conta quando todos fazem; o prêmio só sai com o dia completo', async () => {
    const ana = await withProfile('Gabi');
    const bia = await withProfile('Hugo');
    await befriend(ana, bia);
    await call('PUT', '/push/prefs', { enabled: true, time: '19:00', tz: noonTz() }, ana.cookie);
    await call('POST', '/push/subscribe', { endpoint: 'https://push.exemplo.com/gabi', keys: { p256dh: 'x', auth: 'y' } }, ana.cookie);
    await call('PUT', '/push/prefs', { enabled: true, time: '19:00', tz: noonTz() }, bia.cookie);
    await call('POST', '/push/subscribe', { endpoint: 'https://push.exemplo.com/hugo', keys: { p256dh: 'x', auth: 'y' } }, bia.cookie);
    const box: string[] = [];
    setPushSender(async (_s, p) => void box.push(JSON.parse(p).body));
    const tick = () => new Promise((r) => setTimeout(r, 120));

    const t = (await call('POST', '/social/team', { name: 'Dupla', missions: ['agua', 'sol'], members: [bia.id] }, ana.cookie)).body.team;
    const check = (cookie: string, mission: string) => call('POST', '/social/team/checkin', { mission, day: today() }, cookie);
    expect((await check(ana.cookie, 'dentes')).status).toBe(422); // não é da turma
    await check(ana.cookie, 'agua');
    await check(ana.cookie, 'sol');
    let r = await check(bia.cookie, 'agua');
    expect(r.body.team.today.complete).toBe(false);
    expect(r.body.team.today.checkins[ana.id]).toEqual(expect.arrayContaining(['agua', 'sol']));
    // Prêmio antes do dia completo: não paga.
    const claim = { op: 'grant', src: { kind: 'turma', id: t.id, date: today() } };
    expect((await call('POST', '/game/ops', { ops: [claim] }, ana.cookie)).body.results[0].ok).toBe(false);
    await tick();
    // Ana fez tudo e a Bia já começou: ninguém recebe "falta só você" ainda (Bia é quem falta, e foi ela que marcou).
    r = await check(bia.cookie, 'sol');
    expect(r.body.team.today.complete).toBe(true);
    expect(r.body.team.streak).toBe(1);
    await tick();
    expect(box.some((b) => b.includes('completou as missões de hoje'))).toBe(true);
    const before = (await call('GET', '/game/wallet', undefined, ana.cookie)).body.wallet.coins;
    const paid = await call('POST', '/game/ops', { ops: [claim, claim] }, ana.cookie);
    expect(paid.body.results[0].ok).toBe(true);
    expect(paid.body.wallet.coins).toBe(before + G.team.coins);
  });

  it('avisa quem falta quando só falta essa pessoa', async () => {
    const a = await withProfile('Iara');
    const b = await withProfile('João');
    await befriend(a, b);
    await call('PUT', '/push/prefs', { enabled: true, time: '19:00', tz: noonTz() }, b.cookie);
    await call('POST', '/push/subscribe', { endpoint: 'https://push.exemplo.com/joao', keys: { p256dh: 'x', auth: 'y' } }, b.cookie);
    const box: string[] = [];
    setPushSender(async (_s, p) => void box.push(JSON.parse(p).body));
    await call('POST', '/social/team', { name: 'Nós', missions: ['agua'], members: [b.id] }, a.cookie);
    await call('POST', '/social/team/checkin', { mission: 'agua', day: today() }, a.cookie);
    await new Promise((r) => setTimeout(r, 120));
    expect(box.at(-1)).toMatch(/só falta a sua parte/);
  });

  it('sair da turma; se quem criou sai, a turma acaba', async () => {
    const a = await withProfile('Kai');
    const b = await withProfile('Lia');
    const c = await withProfile('Mel');
    await befriend(a, b);
    await befriend(a, c);
    await call('POST', '/social/team', { name: 'Trio', missions: ['agua'], members: [b.id, c.id] }, a.cookie);
    // Quem não criou não tira os outros.
    expect((await call('DELETE', `/social/team/members/${c.id}`, undefined, b.cookie)).status).toBe(403);
    const left = await call('DELETE', `/social/team/members/${b.id}`, undefined, b.cookie);
    expect(left.body.team).toBeNull();
    expect((await call('GET', '/social/team', undefined, a.cookie)).body.team.members).toHaveLength(2);
    await call('DELETE', `/social/team/members/${a.id}`, undefined, a.cookie);
    expect((await call('GET', '/social/team', undefined, c.cookie)).body.team).toBeNull();
  });
});
