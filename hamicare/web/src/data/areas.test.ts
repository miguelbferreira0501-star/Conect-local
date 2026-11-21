import { describe, expect, it } from 'vitest';
import { LIFE_AREAS, LIFE_ORDER, libById } from './tasks';
import { arenaHouse, upgradeHouse } from './arenas';
import { chosenAreas } from '../components/Areas';
import { itemById } from './items';
import { FLOOR_CSS, FLOOR_TONE, WALLPAPER_CSS } from '../components/Furniture';

describe('áreas da vida', () => {
  it('toda área tem hábitos que existem na biblioteca', () => {
    for (const a of Object.keys(LIFE_AREAS) as (keyof typeof LIFE_AREAS)[]) {
      expect(LIFE_AREAS[a].tasks.length).toBeGreaterThanOrEqual(4);
      for (const id of LIFE_AREAS[a].tasks) expect(libById(id), `${a}: ${id}`).toBeTruthy();
    }
  });
  it('mostra 8 áreas e nenhuma traz comida', () => {
    expect(LIFE_ORDER).toHaveLength(8);
    const food = /comer|fruta|lanche|refei|salada|almo[cç]|jantar/i;
    for (const a of LIFE_ORDER) for (const id of LIFE_AREAS[a].tasks) expect(food.test(libById(id)!.title), id).toBe(false);
  });
  it('a antiga "Saúde" vale como Movimento e Hidratação', () => {
    expect(chosenAreas(['saude', 'calma'])).toEqual(['calma', 'movimento', 'agua']);
  });
});

describe('casa inicial colorida', () => {
  it('a casa nova começa verdinha', () => {
    const h = arenaHouse(1);
    expect(h.wallpaper).toBe('p-menta');
    expect(h.floor).toBe('f-pistache');
    for (const id of [h.wallpaper, h.floor]) expect(itemById(id)).toBeTruthy();
    expect(WALLPAPER_CSS['p-menta']).toBeTruthy();
    expect(FLOOR_CSS['f-pistache'] && FLOOR_TONE['f-pistache']).toBeTruthy();
  });
  it('quem estava com a casa marrom de fábrica ganha a verde; quem escolheu outra parede fica como está', () => {
    const old = { ...arenaHouse(1), wallpaper: 'p-creme', floor: 'f-madeira' };
    const up = upgradeHouse(old, 1);
    expect([up.wallpaper, up.floor]).toEqual(['p-menta', 'f-pistache']);
    const mine = { ...arenaHouse(1), wallpaper: 'p-lavanda', floor: 'f-madeira' };
    expect(upgradeHouse(mine, 1)).toBe(mine);
  });
});
