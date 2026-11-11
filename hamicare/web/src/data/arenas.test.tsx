import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ARENA_HOME, arenaHouse } from './arenas';
import { ITEMS, itemById } from './items';
import { PLACES } from './world';
import { WALLPAPER_CSS, FLOOR_CSS } from '../components/Furniture';
import { ArenaScene, ARENA_SCENE_IDS } from '../components/ArenaScene';
import { Chest } from '../components/Chest';
import { hasArt } from '../components/art';
import { DEFAULT_GAME as G, xpAt } from '../shared/game';
import { arenaItemsOf } from '../shared/game/catalog';
import { fresh, getState, replaceState, toggleTask, todayKey, moveHome, houseOf, homeArenaOf, currentArena, placeItem } from '../lib/store';
import type { Task } from '../types';
import { ACHIEVEMENTS } from '../logic/progress';

const allAch = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, '2026-01-01']));
const T = (id: string): Task => ({ id, title: id, emoji: '⭐', cat: 'fitness', freq: { kind: 'diaria' }, reward: 3, energy: 3, createdAt: todayKey() });

function start(xp: number, maxLevel = 1) {
  const base = fresh();
  replaceState({ ...base, onboarded: true, missionsV: 1, xpV: 2, xp, coins: 0, tasks: [T('corrida')], achievements: allAch, game: { ...base.game, maxLevel }, profile: { ...base.profile, goal: 'habitos' } });
}

describe('as 12 arenas', () => {
  it('cada arena tem cenário, casa pronta e itens exclusivos que existem', () => {
    expect(G.arenas).toHaveLength(12);
    for (const a of G.arenas) {
      expect(ARENA_SCENE_IDS).toContain(a.id);
      const home = ARENA_HOME[a.n];
      expect(home, `casa da arena ${a.n}`).toBeTruthy();
      expect(itemById(home.wallpaper)?.kind).toBe('parede');
      expect(itemById(home.floor)?.kind).toBe('piso');
      expect(WALLPAPER_CSS[home.wallpaper], home.wallpaper).toBeTruthy();
      expect(FLOOR_CSS[home.floor], home.floor).toBeTruthy();
      for (const it of home.items) expect(itemById(it.itemId), it.itemId).toBeTruthy();
      if (a.n > 1) expect(arenaItemsOf(a.n).length, `itens da arena ${a.n}`).toBeGreaterThan(0);
    }
  });

  it('itens de arena não estão à venda e têm desenho próprio', () => {
    const exclusive = ITEMS.filter((i) => i.arena);
    expect(exclusive.length).toBeGreaterThan(50);
    for (const i of exclusive) {
      expect(i.price, i.id).toBe(0);
      expect(i.souvenir, i.id).toBe(true);
      // Roupas são desenhadas no próprio Hami (base); móveis e decoração têm desenho próprio.
      if (i.kind !== 'parede' && i.kind !== 'piso') expect(Boolean(i.base) || hasArt(i.art ?? i.emoji ?? ''), i.id).toBe(true);
    }
    // Toda peça das casas prontas existe: ou é exclusiva da arena (vem de presente), ou é móvel da loja (vem junto com a casa).
    for (const a of G.arenas.filter((x) => x.n > 1)) {
      const gifts = arenaItemsOf(a.n);
      for (const it of ARENA_HOME[a.n].items) {
        const item = ITEMS.find((i) => i.id === it.itemId);
        expect(item, it.itemId).toBeTruthy();
        if (item!.arena) expect(gifts, `${it.itemId} (arena ${a.n})`).toContain(it.itemId);
        else expect(item!.price, it.itemId).toBeGreaterThan(0);
      }
    }
  });

  it('passeios nunca exigem o Plus e abrem até o nível da arena ligada', () => {
    for (const p of PLACES) expect(p.plus, p.id).toBeFalsy();
    for (const a of G.arenas.filter((x) => x.place)) {
      const place = PLACES.find((p) => p.id === a.place);
      expect(place, a.place).toBeTruthy();
      expect(place!.level, a.place).toBeLessThanOrEqual(a.level);
    }
  });

  it('todos os cenários desenham de dia e de noite, sem números quebrados', () => {
    for (const id of ARENA_SCENE_IDS) {
      for (const time of ['dia', 'noite', 'amanhecer', 'entardecer'] as const) {
        const html = renderToStaticMarkup(<ArenaScene arena={id} time={time} />);
        expect(html, `${id} ${time}`).not.toMatch(/NaN|undefined/);
      }
      expect(renderToStaticMarkup(<ArenaScene arena={id} mini locked />)).toContain('is-locked');
    }
    for (const k of ['madeira', 'prata', 'ouro', 'magico', 'lendario'] as const) expect(renderToStaticMarkup(<Chest kind={k} open />)).not.toMatch(/NaN|undefined/);
  });
});

describe('casas por arena', () => {
  it('abrir uma arena dá os itens exclusivos e deixa a casa dela pronta, sem mudar o Hami', async () => {
    start(xpAt(2, G) - 1);
    toggleTask('corrida');
    await new Promise((r) => setTimeout(r, 5));
    const s = getState();
    expect(currentArena(s)).toBe(2);
    for (const id of arenaItemsOf(2)) expect(s.inventory[id], id).toBe(1);
    expect(homeArenaOf(s)).toBe(1);
    expect(s.houses?.[2]).toEqual(arenaHouse(2));
  });

  it('mudar de casa guarda a antiga com os móveis e dá pra voltar', () => {
    start(xpAt(4, G), 4);
    const before = getState();
    replaceState({ ...before, inventory: { ...before.inventory, 'cama-tronco': 1 }, house: { ...before.house, items: [{ uid: 'x1', itemId: 'cadeira', x: 40, y: 80, z: 1 }] } });
    expect(moveHome(9)).toBe(false); // ainda não abriu
    expect(moveHome(3)).toBe(true);
    let s = getState();
    expect(homeArenaOf(s)).toBe(3);
    expect(s.house).toEqual(arenaHouse(3));
    expect(houseOf(s, 1).items.map((i) => i.itemId)).toEqual(['cadeira']);
    expect(moveHome(1)).toBe(true);
    s = getState();
    expect(s.house.items.map((i) => i.itemId)).toEqual(['cadeira']);
    expect(houseOf(s, 3)).toEqual(arenaHouse(3));
  });

  it('o mesmo móvel não aparece em duas casas', () => {
    start(xpAt(4, G), 4);
    const s0 = getState();
    replaceState({ ...s0, inventory: { ...s0.inventory, abajur: 1 } });
    placeItem('abajur');
    expect(getState().house.items.filter((i) => i.itemId === 'abajur')).toHaveLength(1);
    moveHome(2);
    // colocar de novo traz o móvel da outra casa para a casa de agora
    expect(placeItem('abajur')).toBe('movido');
    const s1 = getState();
    expect(s1.house.items.filter((i) => i.itemId === 'abajur')).toHaveLength(1);
    expect(Object.values(s1.houses ?? {}).flatMap((h) => h.items).filter((i) => i.itemId === 'abajur')).toHaveLength(0);
    expect(placeItem('abajur')).toBe('ja-esta');
  });
});

describe('reforma das casas', () => {
  it('casa do jeito que veio ganha a decoração nova; casa arrumada pela pessoa fica como está', async () => {
    const { upgradeHouse, arenaHouse } = await import('./arenas');
    const old = { wallpaper: 'p-lavanda', floor: 'f-carpete', items: [{ uid: 'a', itemId: 'rodinha', x: 20, y: 74, z: 1 }, { uid: 'b', itemId: 'caminha', x: 79, y: 86, z: 2 }, { uid: 'c', itemId: 'planta', x: 88, y: 62, z: 3 }] };
    const up = upgradeHouse(old, 1);
    expect(up.items.map((i) => i.itemId)).toEqual(arenaHouse(1).items.map((i) => i.itemId));
    expect(up.wallpaper).toBe('p-lavanda');
    const mine = { ...old, items: [...old.items, { uid: 'd', itemId: 'sofa', x: 30, y: 80, z: 4 }] };
    expect(upgradeHouse(mine, 1)).toBe(mine);
    const arena2 = { wallpaper: 'p-jardim', floor: 'f-musgo', items: [{ uid: 'x', itemId: 'casa-passaro', x: 78, y: 46, z: 1 }, { uid: 'y', itemId: 'banco-galho', x: 30, y: 94, z: 2 }] };
    expect(upgradeHouse(arena2, 2).items.length).toBeGreaterThan(5);
    expect(upgradeHouse(arenaHouse(3), 3).items).toEqual(arenaHouse(3).items);
  });
});

describe('casa na Lua', () => {
  it('voltar para a Terra leva para a casa onde ele morava', async () => {
    const { backToEarth, buyMoon, homeArenaOf, getState, replaceState, fresh, moveHome } = await import('../lib/store');
    const { xpAt, DEFAULT_GAME } = await import('../shared/game');
    replaceState({ ...fresh(), onboarded: true, xp: xpAt(4, DEFAULT_GAME), coins: 6000 });
    moveHome(3);
    expect(backToEarth()).toBe(false);
    expect(buyMoon()).toBe('ok');
    expect(homeArenaOf(getState())).toBe(13);
    expect(backToEarth()).toBe(true);
    expect(homeArenaOf(getState())).toBe(3);
  });
});
