import { describe, expect, it } from 'vitest';
import { arenaHouse, MOON_ITEMS, MOON_N, upgradeHouse } from './arenas';
import { itemById } from './items';
import { useKindOf } from '../components/Room';

describe('casa na Lua', () => {
  it('a base lunar vem com móveis lunares que existem e não estão à venda', () => {
    const h = arenaHouse(MOON_N);
    expect(h.wallpaper).toBe('p-lua');
    expect(h.items.length).toBeGreaterThanOrEqual(8);
    for (const it of h.items) {
      const item = itemById(it.itemId);
      expect(item, it.itemId).toBeTruthy();
      expect(item!.souvenir).toBe(true);
      expect(MOON_ITEMS).toContain(it.itemId);
    }
  });
  it('a casa lunar antiga (sem ninguém mexer) vira a base nova', () => {
    const old = { wallpaper: 'p-lua', floor: 'f-lua', items: ['cama-cratera', 'foguete-hami', 'bandeira-lua', 'mobile-planetas', 'luminaria-lua'].map((itemId, i) => ({ uid: `m${i}`, itemId, x: 50, y: 80, z: i })) };
    const up = upgradeHouse(old, MOON_N);
    expect(up.items.map((i) => i.itemId)).toContain('lua-cama');
    // quem já arrumou do seu jeito continua como estava
    const mine = { ...old, items: old.items.slice(0, 2) };
    expect(upgradeHouse(mine, MOON_N)).toBe(mine);
  });
  it('o Hami usa a cama, a banheira, a poltrona e a rodinha lunares', () => {
    const kind = (id: string) => useKindOf(id, itemById(id)?.svg);
    expect(kind('lua-cama')).toBe('deitar');
    expect(kind('lua-banheira')).toBe('banho');
    expect(kind('lua-poltrona')).toBe('sentar');
    expect(kind('lua-rodinha')).toBe('correr');
  });
});
