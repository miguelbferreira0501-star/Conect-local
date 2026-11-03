import { describe, expect, it } from 'vitest';
import { befriend, call, house, pet, setupDatabase, withProfile } from './helpers';

setupDatabase();

describe('amigos e feed', () => {
  it('pedido por código, aceite e feed só para amigos', async () => {
    const ana = await withProfile('Ana');
    const bia = await withProfile('Bia');
    const caio = await withProfile('Caio');
    const found = await call('GET', `/social/code/${bia.code}`, undefined, ana.cookie);
    expect(found.body.profile.name).toBe('Bia');
    await befriend(ana, bia);
    expect((await call('GET', '/social/friends', undefined, ana.cookie)).body.friends.map((p: { name: string }) => p.name)).toEqual(['Bia']);

    const post = await call('POST', '/social/posts', { kind: 'atividade', text: 'Caminhei 15 minutos!', pet: { ...pet, mood: 'animado' } }, ana.cookie);
    expect(post.status).toBe(201);
    expect((await call('GET', '/social/feed', undefined, bia.cookie)).body.posts).toHaveLength(1);
    expect((await call('GET', '/social/feed', undefined, caio.cookie)).body.posts).toHaveLength(0);
    // Quem não é amigo não comenta nem reage
    expect((await call('POST', '/social/comments', { postId: post.body.id, text: 'Oi!' }, caio.cookie)).status).toBe(404);
    expect((await call('PUT', '/social/reactions', { postId: post.body.id, kind: 'carinho' }, caio.cookie)).status).toBe(404);
  });

  it('comentários: só gentileza passa, e quem postou pode esconder', async () => {
    const ana = await withProfile('Ana');
    const bia = await withProfile('Bia');
    await befriend(ana, bia);
    const { body } = await call('POST', '/social/posts', { kind: 'momento', text: 'Arrumei meu quarto' }, ana.cookie);
    const bad = await call('POST', '/social/comments', { postId: body.id, text: 'que preguiça, idiota' }, bia.cookie);
    expect(bad.status).toBe(422);
    expect((await call('POST', '/social/comments', { postId: body.id, text: 'tá gordinho' }, bia.cookie)).status).toBe(422);
    expect((await call('POST', '/social/comments', { postId: body.id, text: 'me chama no zap' }, bia.cookie)).status).toBe(422);
    const ok = await call('POST', '/social/comments', { postId: body.id, text: 'Que orgulho!' }, bia.cookie);
    expect(ok.status).toBe(201);
    expect((await call('PUT', '/social/reactions', { postId: body.id, kind: 'parabens' }, bia.cookie)).status).toBe(200);
    expect((await call('PUT', '/social/reactions', { postId: body.id, kind: 'raiva' }, bia.cookie)).status).toBe(422);
    let feed = (await call('GET', '/social/feed', undefined, ana.cookie)).body;
    expect(feed.comments.map((c: { text: string }) => c.text)).toEqual(['Que orgulho!']);
    expect(feed.reactions[0].kind).toBe('parabens');
    expect((await call('POST', `/social/comments/${ok.body.id}/hide`, {}, bia.cookie)).status).toBe(403);
    expect((await call('POST', `/social/comments/${ok.body.id}/hide`, {}, ana.cookie)).status).toBe(200);
    feed = (await call('GET', '/social/feed', undefined, ana.cookie)).body;
    expect(feed.comments).toHaveLength(0);
    // Post com texto ofensivo também é recusado
    expect((await call('POST', '/social/posts', { kind: 'momento', text: 'vocês são uns idiotas' }, ana.cookie)).status).toBe(422);
  });

  it('duas denúncias de pessoas diferentes escondem o post', async () => {
    const ana = await withProfile('Ana');
    const bia = await withProfile('Bia');
    const caio = await withProfile('Caio');
    await befriend(ana, bia);
    await befriend(ana, caio);
    const { body } = await call('POST', '/social/posts', { kind: 'momento', text: 'Dia legal' }, ana.cookie);
    await call('POST', '/social/reports', { type: 'post', id: body.id, userId: ana.id, reason: 'conteudo' }, bia.cookie);
    expect((await call('GET', '/social/feed', undefined, caio.cookie)).body.posts).toHaveLength(1);
    await call('POST', '/social/reports', { type: 'post', id: body.id, userId: ana.id, reason: 'conteudo' }, caio.cookie);
    expect((await call('GET', '/social/feed', undefined, caio.cookie)).body.posts).toHaveLength(0);
  });

  it('menores: só elogios prontos, sem foto real; até 12 anos sem social', async () => {
    const teen = await withProfile('Teen', '13a17');
    const adult = await withProfile('Adulto');
    await befriend(adult, teen);
    const { body } = await call('POST', '/social/posts', { kind: 'momento', text: 'Oi' }, adult.cookie);
    expect((await call('POST', '/social/comments', { postId: body.id, text: 'muito legal' }, teen.cookie)).status).toBe(422);
    expect((await call('POST', '/social/comments', { postId: body.id, text: 'Arrasou! 👏' }, teen.cookie)).status).toBe(201);
    expect((await call('POST', '/social/posts', { kind: 'momento', text: '', image: 'data:image/jpeg;base64,AAAA' }, teen.cookie)).status).toBe(403);
    expect((await call('GET', '/social/me', undefined, teen.cookie)).body.profile.teen).toBe(true);
    const kid = await call('POST', '/auth/register', { name: 'Kid', email: `kid${Date.now()}@teste.com`, password: 'Senha1234', ageGroup: 'ate12', acceptTerms: true, healthConsent: true, guardianConsent: true });
    expect((await call('GET', '/social/feed', undefined, kid.cookie)).status).toBe(403);
  });

  it('bloqueio corta amizade, feed e pedidos; perfil fechado não recebe pedido', async () => {
    const ana = await withProfile('Ana');
    const bia = await withProfile('Bia');
    await befriend(ana, bia);
    await call('POST', '/social/posts', { kind: 'momento', text: 'Oi' }, ana.cookie);
    await call('POST', `/social/blocks/${ana.id}`, {}, bia.cookie);
    expect((await call('GET', '/social/friends', undefined, ana.cookie)).body.friends).toHaveLength(0);
    expect((await call('GET', '/social/feed', undefined, bia.cookie)).body.posts).toHaveLength(0);
    expect((await call('POST', `/social/friends/${bia.id}/request`, {}, ana.cookie)).body.result).toBe('bloqueado');
    expect((await call('GET', `/social/code/${bia.code}`, undefined, ana.cookie)).body.profile).toBeNull();
    const caio = await withProfile('Caio');
    await call('PUT', '/social/profile', { name: 'Caio', pet, house, level: 1, acceptsRequests: false }, caio.cookie);
    expect((await call('POST', `/social/friends/${caio.id}/request`, {}, ana.cookie)).body.result).toBe('fechado');
  });

  it('presentes só para amigos e abertos uma vez', async () => {
    const ana = await withProfile('Ana');
    const bia = await withProfile('Bia');
    const caio = await withProfile('Caio');
    await befriend(ana, bia);
    expect((await call('POST', '/social/gifts', { to: caio.id, itemId: 'laco' }, ana.cookie)).status).toBe(403);
    expect((await call('POST', '/social/gifts', { to: bia.id, itemId: 'item-inventado' }, ana.cookie)).status).toBe(422);
    expect((await call('POST', '/social/gifts', { to: bia.id, itemId: 'laco', note: 'pra você' }, ana.cookie)).status).toBe(201);
    const gifts = (await call('GET', '/social/gifts', undefined, bia.cookie)).body.gifts;
    expect(gifts[0].itemId).toBe('laco');
    expect((await call('POST', `/social/gifts/${gifts[0].id}/claim`, {}, bia.cookie)).body.gift.itemId).toBe('laco');
    expect((await call('POST', `/social/gifts/${gifts[0].id}/claim`, {}, bia.cookie)).body.gift).toBeNull();
  });

  it('desafios em grupo: amigos veem, entram e marcam o dia', async () => {
    const ana = await withProfile('Ana');
    const bia = await withProfile('Bia');
    const caio = await withProfile('Caio');
    await befriend(ana, bia);
    const ch = await call('POST', '/social/challenges', { title: 'Caminhar', emoji: '🚶', target: 5, days: 7 }, ana.cookie);
    expect(ch.status).toBe(201);
    expect((await call('GET', '/social/challenges', undefined, caio.cookie)).body.challenges).toHaveLength(0);
    expect((await call('POST', `/social/challenges/${ch.body.id}/checkin`, {}, caio.cookie)).status).toBe(404);
    expect((await call('POST', `/social/challenges/${ch.body.id}/checkin`, {}, bia.cookie)).status).toBe(200);
    const list = (await call('GET', '/social/challenges', undefined, ana.cookie)).body.challenges;
    expect(list[0].members.sort()).toEqual([ana.id, bia.id].sort());
    expect(list[0].checkins[bia.id]).toHaveLength(1);
  });
});
