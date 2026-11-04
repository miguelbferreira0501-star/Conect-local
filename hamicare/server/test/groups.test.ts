import { describe, expect, it } from 'vitest';
import { befriend, call, house, pet, setupDatabase, withProfile } from './helpers';

setupDatabase();

describe('perfil estilo rede social', () => {
  it('bio passa pelo filtro de gentileza e aparece com contadores', async () => {
    const ana = await withProfile('Ana');
    const bia = await withProfile('Bia');
    await befriend(ana, bia);
    const bad = await call('PUT', '/social/profile', { name: 'Ana', pet, house, level: 3, acceptsRequests: true, bio: 'odeio vocês, idiotas' }, ana.cookie);
    expect(bad.status).toBe(422);
    const ok = await call('PUT', '/social/profile', { name: 'Ana', pet, house, level: 3, acceptsRequests: true, bio: 'Um dia de cada vez 🌻', streak: 12, badges: 5 }, ana.cookie);
    expect(ok.status).toBe(200);
    await call('POST', '/social/posts', { kind: 'momento', text: 'Bebi água o dia todo' }, ana.cookie);
    const seen = await call('GET', `/social/profiles/${ana.id}`, undefined, bia.cookie);
    expect(seen.status).toBe(200);
    expect(seen.body.profile.bio).toBe('Um dia de cada vez 🌻');
    expect(seen.body.profile.streak).toBe(12);
    expect(seen.body.posts).toHaveLength(1);
    expect(seen.body.friendsCount).toBe(1);
    expect(seen.body.isFriend).toBe(true);
    // O perfil público nunca tem peso
    expect(JSON.stringify(seen.body)).not.toMatch(/grams|kg|peso/);
  });

  it('quem não tem ligação nenhuma não vê o perfil', async () => {
    const ana = await withProfile('Ana');
    const estranho = await withProfile('Estranho');
    expect((await call('GET', `/social/profiles/${ana.id}`, undefined, estranho.cookie)).status).toBe(404);
  });
});

describe('grupos de amigos', () => {
  it('cria grupo só com amigos, mural é só dos membros', async () => {
    const ana = await withProfile('Ana');
    const bia = await withProfile('Bia');
    const caio = await withProfile('Caio');
    const fora = await withProfile('Fora');
    await befriend(ana, bia);
    await befriend(ana, caio);
    // Fora não é amigo de Ana: é ignorado na criação
    const g = await call('POST', '/social/groups', { name: 'Turma da caminhada', emoji: '🚶', color: 'menta', members: [bia.id, caio.id, fora.id] }, ana.cookie);
    expect(g.status).toBe(201);
    expect(g.body.group.members.sort()).toEqual([ana.id, bia.id, caio.id].sort());
    const id = g.body.group.id;

    // Bia e Caio não são amigos entre si, mas se veem pelo grupo
    expect((await call('GET', `/social/profiles/${caio.id}`, undefined, bia.cookie)).status).toBe(200);
    const listed = await call('GET', '/social/groups', undefined, caio.cookie);
    expect(listed.body.groups).toHaveLength(1);
    expect(listed.body.profiles[bia.id].name).toBe('Bia');

    const post = await call('POST', '/social/posts', { kind: 'atividade', text: 'Bora caminhar amanhã?', groupId: id }, bia.cookie);
    expect(post.status).toBe(201);
    expect((await call('GET', `/social/groups/${id}/feed`, undefined, caio.cookie)).body.posts).toHaveLength(1);
    // Post do grupo não aparece no feed geral nem para quem está fora
    expect((await call('GET', '/social/feed', undefined, ana.cookie)).body.posts.filter((p: { groupId?: string }) => p.groupId)).toHaveLength(0);
    expect((await call('GET', `/social/groups/${id}/feed`, undefined, fora.cookie)).status).toBe(404);
    expect((await call('POST', '/social/posts', { kind: 'momento', text: 'oi', groupId: id }, fora.cookie)).status).toBe(403);
    // Caio comenta e reage no mural do grupo (só gentileza)
    expect((await call('POST', '/social/comments', { postId: post.body.id, text: 'Bora!' }, caio.cookie)).status).toBe(201);
    expect((await call('POST', '/social/comments', { postId: post.body.id, text: 'que idiota' }, caio.cookie)).status).toBe(422);
  });

  it('só quem criou adiciona; sair é livre; dono saindo apaga o grupo', async () => {
    const ana = await withProfile('Ana');
    const bia = await withProfile('Bia');
    const caio = await withProfile('Caio');
    await befriend(ana, bia);
    await befriend(ana, caio);
    await befriend(bia, caio);
    const { body } = await call('POST', '/social/groups', { name: 'Água', emoji: '💧', members: [bia.id] }, ana.cookie);
    const id = body.group.id;
    expect((await call('POST', `/social/groups/${id}/members`, { userId: caio.id }, bia.cookie)).status).toBe(403);
    expect((await call('POST', `/social/groups/${id}/members`, { userId: caio.id }, ana.cookie)).status).toBe(200);
    expect((await call('DELETE', `/social/groups/${id}/members/${caio.id}`, undefined, caio.cookie)).status).toBe(200);
    expect((await call('GET', '/social/groups', undefined, caio.cookie)).body.groups).toHaveLength(0);
    expect((await call('DELETE', `/social/groups/${id}/members/${ana.id}`, undefined, ana.cookie)).status).toBe(200);
    expect((await call('GET', '/social/groups', undefined, bia.cookie)).body.groups).toHaveLength(0);
  });

  it('bloqueio esconde os posts da pessoa no grupo', async () => {
    const ana = await withProfile('Ana');
    const bia = await withProfile('Bia');
    const caio = await withProfile('Caio');
    await befriend(ana, bia);
    await befriend(ana, caio);
    const { body } = await call('POST', '/social/groups', { name: 'Leitura', emoji: '📚', members: [bia.id, caio.id] }, ana.cookie);
    await call('POST', '/social/posts', { kind: 'momento', text: 'Li 10 páginas', groupId: body.group.id }, caio.cookie);
    expect((await call('GET', `/social/groups/${body.group.id}/feed`, undefined, bia.cookie)).body.posts).toHaveLength(1);
    await call('POST', `/social/blocks/${caio.id}`, {}, bia.cookie);
    expect((await call('GET', `/social/groups/${body.group.id}/feed`, undefined, bia.cookie)).body.posts).toHaveLength(0);
  });
});
