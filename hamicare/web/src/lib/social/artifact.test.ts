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
