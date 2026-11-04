import { describe, expect, it } from 'vitest';
import { call, newUser, setupDatabase } from './helpers';
import { DEFAULT_GAME } from '../../web/src/shared/game';
import { resetGameConfigCache } from '../src/routes/game';

setupDatabase();

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

describe('administração do jogo', () => {
  it('só admin edita; o servidor confere, guarda versões e dá para voltar', async () => {
    resetGameConfigCache();
    const comum = await newUser('Comum');
    expect((await call('GET', '/admin/game-config', undefined, comum.cookie)).status).toBe(403);
    expect((await call('POST', '/admin/game-config', { config: DEFAULT_GAME }, comum.cookie)).status).toBe(403);
    const chefe = await newUser('Chefe', '18mais', 'chefe@teste.com');
    const cur = await call('GET', '/admin/game-config', undefined, chefe.cookie);
    expect(cur.status).toBe(200);
    expect(cur.body.current.chests.prata.price).toBe(DEFAULT_GAME.chests.prata.price);

    // Chances que não somam 100: nada muda.
    const bad = clone(DEFAULT_GAME);
    bad.chests.prata.odds.comum = 90;
    const r1 = await call('POST', '/admin/game-config', { config: bad }, chefe.cookie);
    expect(r1.status).toBe(422);
    expect(r1.body.errors.join(' ')).toMatch(/Baú de Prata: as chances somam/);

    // Versão nova válida: o app de todo mundo recebe os números novos.
    const good = clone(DEFAULT_GAME);
    good.chests.prata.price = 250;
    const r2 = await call('POST', '/admin/game-config', { config: good, note: 'prata mais barato' }, chefe.cookie);
    expect(r2.status).toBe(201);
    expect((await call('GET', '/game/config', undefined, comum.cookie)).body.config.chests.prata.price).toBe(250);
    // E o servidor cobra o preço novo.
    const chests = await call('GET', '/game/chests', undefined, comum.cookie);
    expect(chests.body.chests.find((c: { id: string }) => c.id === 'prata').price).toBe(250);

    // Voltar para a versão anterior vira uma versão nova.
    const v = r2.body.version;
    const good2 = clone(good);
    good2.chests.prata.price = 260;
    const r3 = await call('POST', '/admin/game-config', { config: good2 }, chefe.cookie);
    expect(r3.body.version).toBe(v + 1);
    const back = await call('POST', `/admin/game-config/${v}/restore`, {}, chefe.cookie);
    expect(back.status).toBe(201);
    expect((await call('GET', '/game/config', undefined, comum.cookie)).body.config.chests.prata.price).toBe(250);
    const list = await call('GET', '/admin/game-config', undefined, chefe.cookie);
    expect(list.body.versions.map((x: { version: number }) => x.version)).toEqual([v + 2, v + 1, v]);
    expect(list.body.versions[2].note).toBe('prata mais barato');
    resetGameConfigCache();
  });
});
