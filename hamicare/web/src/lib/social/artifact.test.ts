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
