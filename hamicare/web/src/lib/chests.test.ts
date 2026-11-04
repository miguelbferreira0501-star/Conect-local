import { describe, expect, it } from 'vitest';
import { applyServerWallet, buy, chestOffer, claimCollection, craftLocal, fresh, getState, markSeen, openChestLocal, replaceState } from './store';
import { localShop } from './chests';
import { DEFAULT_GAME as G, chestPool, rarityOf } from '../shared/game';
import { ITEMS, itemById } from '../data/items';
import { ACHIEVEMENTS } from '../logic/progress';
import type { State } from '../types';

const allAch = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, '2026-01-01']));

function start(patch: Partial<State> = {}, game: Partial<State['game']> = {}) {
  const base = fresh();
  replaceState({ ...base, onboarded: true, missionsV: 1, xpV: 2, coins: 0, achievements: allAch, ...patch, game: { ...base.game, ...game }, profile: { ...base.profile, goal: 'habitos', ageGroup: '18mais', ...(patch.profile ?? {}) } });
}

describe('baús no aparelho (sem conta)', () => {
  it('cobra o preço, entrega um item novo e registra na carteira', () => {
    start({ coins: 250 });
    const r = openChestLocal('madeira');
    if (typeof r === 'string') throw new Error(r);
    const s = getState();
    expect(s.coins).toBe(250 - G.chests.madeira.price);
    expect(r.duplicate).toBe(false);
    expect(s.inventory[r.itemId]).toBe(1);
    expect(s.itemMeta?.[r.itemId]).toMatchObject({ from: 'bau' });
    expect(s.game.ledger[0]).toMatchObject({ coins: -G.chests.madeira.price, label: G.chests.madeira.name });
    expect(chestPool().some((p) => p.id === r.itemId && p.rarity === r.rarity)).toBe(true);
  });

  it('sem sementes não abre e não cobra', () => {
    start({ coins: 99 });
    expect(openChestLocal('madeira')).toBe('sem-sementes');
    expect(getState().coins).toBe(99);
  });

  it('baú grátis da arena abre sem cobrar e só uma vez', () => {
    start({ coins: 0 }, { pendingChests: ['prata'] });
    const r = openChestLocal('prata', true);
    expect(typeof r).toBe('object');
    expect(getState().coins).toBe(0);
    expect(getState().game.pendingChests).toEqual([]);
    expect(openChestLocal('prata', true)).toBe('sem-bau');
  });

  it('repetido vira fragmentos (quando já tem todos daquela raridade)', () => {
    const all = Object.fromEntries(ITEMS.map((i) => [i.id, 1]));
    start({ coins: 100, inventory: all });
    const r = openChestLocal('madeira');
    if (typeof r === 'string') throw new Error(r);
    expect(r.duplicate).toBe(true);
    expect(r.fragments).toBe(G.rarities[r.rarity].fragments);
    expect(getState().game.fragments).toBe(r.fragments);
  });

  it('a proteção contra azar garante raro no baú certo', () => {
    start({ coins: 100 }, { pity: { semRaro: G.pity.rareAfter - 1, semLendario: 0 } });
    const r = openChestLocal('madeira');
    if (typeof r === 'string') throw new Error(r);
    expect(['raro', 'epico', 'lendario']).toContain(r.rarity);
    expect(getState().game.pity.semRaro).toBe(0);
  });

  it('as chances mostradas na loja somam 100 em todos os baús', () => {
    start();
    for (const c of localShop().chests) expect(Object.values(c.odds).reduce((a, b) => a + b, 0)).toBeCloseTo(100, 5);
  });
});

describe('baú revelado para menores de 18', () => {
  it('mostra o item antes e entrega exatamente ele', () => {
    start({ coins: 400, profile: { ...fresh().profile, ageGroup: '13a17' } });
    const shop = localShop();
    expect(shop.revealed).toBe(true);
    const offer = shop.chests.find((c) => c.id === 'prata')!.offer!;
    expect(offer).toBeTruthy();
    // A oferta não muda ao abrir a loja de novo.
    expect(localShop().chests.find((c) => c.id === 'prata')!.offer).toEqual(offer);
    const r = openChestLocal('prata');
    if (typeof r === 'string') throw new Error(r);
    expect(r).toMatchObject({ itemId: offer.itemId, rarity: offer.rarity, revealed: true });
    expect(getState().game.offers?.prata).toBeUndefined();
    // Depois da compra vem uma oferta nova.
    expect(chestOffer('prata')).toBeTruthy();
  });
});

describe('Oficina', () => {
  it('troca fragmentos pelo item que falta', () => {
    const target = chestPool().find((p) => p.rarity === 'raro')!;
    start({}, { fragments: G.rarities.raro.craft + 5 });
    expect(craftLocal(target.id)).toBe('ok');
    expect(getState().inventory[target.id]).toBe(1);
    expect(getState().itemMeta?.[target.id]).toMatchObject({ from: 'oficina' });
    expect(getState().game.fragments).toBe(5);
    expect(craftLocal(target.id)).toBe('ja-tem');
  });

  it('sem fragmentos suficientes ou item fora dos baús não fabrica', () => {
    const target = chestPool().find((p) => p.rarity === 'epico')!;
    start({}, { fragments: G.rarities.epico.craft - 1 });
    expect(craftLocal(target.id)).toBe('sem-fragmentos');
    expect(craftLocal('banco-galho')).toBe('invalido'); // exclusivo de arena
    expect(getState().game.fragments).toBe(G.rarities.epico.craft - 1);
  });
});

describe('Álbum de Coleções', () => {
  it('todas as peças existem e dá para conseguir (baú, Vendinha ou Oficina)', () => {
    const pool = new Set(chestPool().map((p) => p.id));
    for (const c of G.collections) {
      expect(c.items.length).toBeGreaterThanOrEqual(5);
      for (const id of c.items) {
        expect(itemById(id), `${c.id}: ${id}`).toBeTruthy();
        expect(pool.has(id), `${c.id}: ${id} sai em baú`).toBe(true);
      }
    }
  });

  it('paga o prêmio só com a coleção completa, e uma vez só', () => {
    const col = G.collections[0];
    start({ coins: 0, inventory: Object.fromEntries(col.items.slice(1).map((id) => [id, 1])) });
    expect(claimCollection(col.id)).toBe(false);
    replaceState({ ...getState(), inventory: { ...getState().inventory, [col.items[0]]: 1 } });
    expect(claimCollection(col.id)).toBe(true);
    expect(getState().coins).toBe(col.reward.coins);
    expect(claimCollection(col.id)).toBe(false);
    expect(getState().coins).toBe(col.reward.coins);
  });
});

describe('itens novos e origem', () => {
  it('compra na Vendinha marca a origem e o selo some depois de visto', () => {
    const item = ITEMS.find((i) => i.kind === 'decor' && !i.souvenir && i.price > 0 && !i.plus && !i.season && !(i.level && i.level > 1) && !fresh().inventory[i.id])!;
    start({ coins: 500 });
    expect(buy(item.id)).toBe('ok');
    expect(getState().itemMeta?.[item.id]).toMatchObject({ from: 'loja' });
    expect(getState().itemMeta?.[item.id]?.seen).toBeFalsy();
    markSeen([item.id]);
    expect(getState().itemMeta?.[item.id]?.seen).toBe(true);
    expect(rarityOf(item)).toBeTruthy();
  });

  it('com conta, os baús grátis vêm do servidor', () => {
    start({}, { pendingChests: ['madeira'] });
    applyServerWallet({ coins: 10, xp: 0, fragments: 3, pity: { semRaro: 0, semLendario: 0 }, maxLevel: 1, pending: ['ouro', 'xyz'] });
    expect(getState().game.pendingChests).toEqual(['ouro']);
    expect(getState().game.fragments).toBe(3);
  });
});
