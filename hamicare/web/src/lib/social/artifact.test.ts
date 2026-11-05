import { describe, expect, it } from 'vitest';
import { codeFor, createArtifactSocial } from './artifact';
import { postKey } from './types';

/** Banco em memória com a mesma forma do `db` da página publicada. */
function fakeDb() {
  const docs = new Map<string, object>();
  return {
    docs,
    doc: (path: string) => ({
      get: async () => ({ exists: docs.has(path), data: () => (docs.has(path) ? JSON.parse(JSON.stringify(docs.get(path))) : undefined) }),
      set: async (d: object) => void docs.set(path, JSON.parse(JSON.stringify(d))),
    }),
    collection: (col: string) => ({
      get: async () => ({
        docs: [...docs.entries()].filter(([k]) => k.split('/').length === 2 && k.startsWith(`${col}/`)).map(([k, v]) => ({ id: k.split('/')[1], exists: true, data: () => JSON.parse(JSON.stringify(v)) })),
      }),
    }),
  };
}

const profile = (name: string) => ({
  name,
  pet: { name: `Hami de ${name}`, fur: 'caramelo', phase: 1, outfit: { chapeu: null, oculos: null, roupa: null, acessorio: null } },
  house: { wallpaper: 'p-creme', floor: 'f-madeira', items: [] },
  level: 2,
  teen: false,
  acceptsRequests: true,
});

describe('social na página publicada', () => {
  it('amizade, feed, reações, comentários gentis, presentes e desafios', async () => {
    const db = fakeDb();
    const ana = createArtifactSocial(db, 'u_ana');
    const bia = createArtifactSocial(db, 'u_bia');
    await ana.saveProfile(profile('Ana'));
    await bia.saveProfile(profile('Bia'));

    // Pedido por código e aceite
    const found = await ana.findByCode(codeFor('u_bia'));
    expect(found?.name).toBe('Bia');
    expect(await ana.request('u_bia')).toBe('ok');
    expect((await bia.friends()).incoming.map((p) => p.name)).toEqual(['Ana']);
    expect((await ana.friends()).outgoing.map((p) => p.name)).toEqual(['Bia']);
    await bia.accept('u_ana');
    expect((await ana.friends()).friends.map((p) => p.name)).toEqual(['Bia']);

    // Post, reação e comentários
    await ana.post({ kind: 'atividade', text: 'Caminhei 15 minutos!' });
    const feedB = await bia.feed();
    expect(feedB.posts).toHaveLength(1);
    const key = postKey(feedB.posts[0]);
    await bia.react(key, 'parabens');
    expect(await bia.comment(key, 'Que orgulho de você!')).toEqual({ ok: true });
    const bad = await bia.comment(key, 'que idiota');
    expect(bad.ok).toBe(false);
    const feedA = await ana.feed();
    expect(feedA.reactions).toEqual([{ postKey: key, authorId: 'u_bia', kind: 'parabens' }]);
    expect(feedA.comments.map((c) => c.text)).toEqual(['Que orgulho de você!']);

    // Quem postou pode esconder um comentário
    await ana.hideComment(feedA.posts[0].id, feedA.comments[0].id);
    expect((await ana.feed()).comments).toHaveLength(0);

    // Presente
    await bia.sendGift('u_ana', 'laco', 'pra você');
    const gifts = await ana.gifts();
    expect(gifts[0].itemId).toBe('laco');
    expect((await ana.claimGift(gifts[0].id))?.itemId).toBe('laco');
    expect(await ana.claimGift(gifts[0].id)).toBeNull();

    // Desafio em grupo: amiga vê como convite, entra marcando o dia
    await ana.createChallenge({ title: 'Caminhar', emoji: '🚶', target: 5, days: 7 });
    const chB = await bia.challenges();
    expect(chB).toHaveLength(1);
    expect(chB[0].members).toEqual(['u_ana']);
    await bia.checkin(chB[0].id);
    const chA = await ana.challenges();
    expect(chA[0].members.sort()).toEqual(['u_ana', 'u_bia']);
    expect(chA[0].checkins['u_bia']).toHaveLength(1);

    // Bloqueio some com a amizade e com o feed
    await ana.block('u_bia');
    expect((await ana.friends()).friends).toHaveLength(0);
    expect((await bia.feed()).posts).toHaveLength(0);
  });

  it('quem desativou pedidos não recebe pedido novo', async () => {
    const db = fakeDb();
    const ana = createArtifactSocial(db, 'u_ana');
    const bia = createArtifactSocial(db, 'u_bia');
    await ana.saveProfile(profile('Ana'));
    await bia.saveProfile({ ...profile('Bia'), acceptsRequests: false });
    expect(await ana.request('u_bia')).toBe('fechado');
  });
});

describe('perfis e grupos na página publicada', () => {
  async function trio() {
    const db = fakeDb();
    const ana = createArtifactSocial(db, 'u_ana');
    const bia = createArtifactSocial(db, 'u_bia');
    const caio = createArtifactSocial(db, 'u_caio');
    const fora = createArtifactSocial(db, 'u_fora');
    await ana.saveProfile({ ...profile('Ana'), bio: 'Um dia de cada vez', streak: 4, badges: 2 });
    await bia.saveProfile(profile('Bia'));
    await caio.saveProfile(profile('Caio'));
    await fora.saveProfile(profile('Fora'));
    for (const [a, b, idB, idA] of [[ana, bia, 'u_bia', 'u_ana'], [ana, caio, 'u_caio', 'u_ana']] as const) {
      await a.request(idB);
      await b.accept(idA);
    }
    return { db, ana, bia, caio, fora };
  }

  it('perfil: amigos veem bio, contadores e posts; estranhos não veem nada', async () => {
    const { ana, bia, fora } = await trio();
    await ana.post({ kind: 'momento', text: 'Bebi água o dia todo' });
    const page = await bia.profile('u_ana');
    expect(page?.profile.bio).toBe('Um dia de cada vez');
    expect(page?.profile.streak).toBe(4);
    expect(page?.posts).toHaveLength(1);
    expect(page?.friendsCount).toBe(2);
    expect(await fora.profile('u_ana')).toBeNull();
  });

  it('grupo: só amigos de quem criou entram, mural separado do feed, sair funciona', async () => {
    const { ana, bia, caio, fora } = await trio();
    const g = await ana.createGroup({ name: 'Turma da água', emoji: '💧', color: 'ceu', members: ['u_bia', 'u_caio', 'u_fora'] });
    expect(g.members.sort()).toEqual(['u_ana', 'u_bia', 'u_caio']);
    expect((await caio.groups()).groups.map((x) => x.name)).toEqual(['Turma da água']);
    expect((await fora.groups()).groups).toHaveLength(0);
    // Bia e Caio não são amigos, mas o grupo deixa um ver o perfil do outro
    expect((await bia.profile('u_caio'))?.profile.name).toBe('Caio');

    await bia.post({ kind: 'momento', text: 'Bora beber água!', groupId: g.id });
    expect((await caio.groupFeed(g.id)).posts.map((p) => p.text)).toEqual(['Bora beber água!']);
    expect((await ana.feed()).posts.filter((p) => p.groupId)).toHaveLength(0);
    await expect(fora.groupFeed(g.id)).rejects.toThrow();

    await caio.leaveGroup(g.id, 'u_caio');
    expect((await caio.groups()).groups).toHaveLength(0);
    expect((await bia.groups()).groups[0].members.sort()).toEqual(['u_ana', 'u_bia']);
    await ana.leaveGroup(g.id, 'u_ana');
    expect((await bia.groups()).groups).toHaveLength(0);
  });

  it('nome de grupo ofensivo é recusado', async () => {
    const { ana } = await trio();
    await expect(ana.createGroup({ name: 'grupo dos idiotas', emoji: '😀', color: 'ceu', members: [] })).rejects.toThrow();
  });
});

describe('visitas e ranking na página publicada', () => {
  it('reação só entre amigos, uma por dia; ranking só de quem aceita aparecer', async () => {
    const db = fakeDb();
    const ana = createArtifactSocial(db, 'u_ana');
    const bia = createArtifactSocial(db, 'u_bia');
    const cris = createArtifactSocial(db, 'u_cris');
    const stats = (dias: number) => ({ dias, missoes: dias * 2, conquistas: 3, colecoes: 0, arenas: 2 });
    await ana.saveProfile({ ...profile('Ana'), arena: 3, ranked: true, stats: stats(5) });
    await bia.saveProfile({ ...profile('Bia'), ranked: true, stats: stats(9) });
    await cris.saveProfile({ ...profile('Cris'), ranked: true, stats: stats(20) });
    await expect(ana.visit('u_bia', 'carinho')).rejects.toThrow();
    await ana.request('u_bia');
    await bia.accept('u_ana');
    expect(await ana.visit('u_bia', 'abraco')).toBe('ok');
    expect(await ana.visit('u_bia', 'carinho')).toBe('limite');
    const v = await bia.visits();
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ userId: 'u_ana', name: 'Ana', reaction: 'abraco' });
    // Cris não é amiga: fica fora do ranking da Ana.
    const r = await ana.ranking();
    expect(r.rows.map((x) => x.name).sort()).toEqual(['Ana', 'Bia']);
    expect(r.rows.find((x) => x.me)?.dias).toBe(5);
    // Bia sai do ranking: some para a Ana e não vê o dela.
    await bia.saveProfile({ ...profile('Bia'), ranked: false, stats: stats(9) });
    expect((await ana.ranking()).rows.map((x) => x.name)).toEqual(['Ana']);
    expect(await bia.ranking()).toEqual({ rows: [], optedOut: true });
  });
});

describe('turma na página publicada', () => {
  it('até 4 amigos, uma turma por pessoa, e a missão só conta quando todos fazem', async () => {
    const db = fakeDb();
    const day = '2026-11-05';
    const users = ['ana', 'bia', 'cris', 'duda', 'edu'].map((n) => ({ n, api: createArtifactSocial(db, `u_${n}`) }));
    for (const u of users) await u.api.saveProfile(profile(u.n));
    const [ana, bia, cris, duda, edu] = users.map((u) => u.api);
    for (const other of ['u_bia', 'u_cris', 'u_duda', 'u_edu']) {
      await ana.request(other);
      await users.find((u) => `u_${u.n}` === other)!.api.accept('u_ana');
    }
    await expect(ana.createTeam({ name: 'Fofos', missions: ['agua'], members: ['u_naoexiste'] }, day)).rejects.toThrow(/amigos/);
    const t = await ana.createTeam({ name: 'Fofos', missions: ['agua', 'sol', 'inventada'], members: ['u_bia', 'u_cris', 'u_duda'] }, day);
    expect(t.missions).toEqual(['agua', 'sol']);
    expect(t.memberIds).toHaveLength(4);
    await expect(ana.addTeamMember('u_edu', day)).rejects.toThrow(/4 pessoas/);
    // Bia vê a turma (com os Hamis de todos).
    expect((await bia.team(day))!.members.map((m) => m.name)).toEqual(['ana', 'bia', 'cris', 'duda']);
    expect(await edu.team(day)).toBeNull();
    // Missão só conta quando todos fazem.
    for (const api of [ana, bia, cris]) await api.teamCheckin('agua', day, true);
    let v = (await duda.team(day))!;
    expect(v.today.complete).toBe(false);
    await duda.teamCheckin('agua', day, true);
    for (const api of [ana, bia, cris]) await api.teamCheckin('sol', day, true);
    v = (await duda.teamCheckin('sol', day, true))!;
    expect(v.today.complete).toBe(true);
    expect(v.streak).toBe(1);
    // Duda sai; quem criou desfaz a turma.
    expect(await duda.leaveTeam('u_duda', day)).toBeNull();
    expect((await ana.team(day))!.memberIds).toHaveLength(3);
    await ana.leaveTeam('u_ana', day);
    expect(await bia.team(day)).toBeNull();
  });
});
