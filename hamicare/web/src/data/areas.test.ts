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
  it('as áreas antigas continuam valendo: "Saúde" = Movimento e Nutrição; "Casa" = Higiene', () => {
    expect(chosenAreas(['saude', 'calma'])).toEqual(['calma', 'agua', 'movimento']);
    expect(chosenAreas(['casa'])).toEqual(['higiene']);
  });
  it('as 8 áreas seguem a ordem das ilustrações', () => {
    expect(LIFE_ORDER).toEqual(['calma', 'agua', 'estudo', 'movimento', 'carinho', 'sono', 'alegria', 'higiene']);
    expect(LIFE_ORDER.map((a) => LIFE_AREAS[a].label)).toEqual(['Calma', 'Nutrição', 'Produtividade', 'Movimento', 'Amor-próprio', 'Sono', 'Gratidão', 'Higiene']);
  });
});

describe('casa inicial colorida', () => {
  it('a casa nova começa azul clarinha com piso creme', () => {
    const h = arenaHouse(1);
    expect(h.wallpaper).toBe('p-azulzinho');
    expect(h.floor).toBe('f-creme');
    for (const id of [h.wallpaper, h.floor]) expect(itemById(id)).toBeTruthy();
    expect(WALLPAPER_CSS['p-azulzinho']).toBeTruthy();
    expect(FLOOR_CSS['f-creme'] && FLOOR_TONE['f-creme']).toBeTruthy();
  });
  it('quem estava com a casa de fábrica (marrom ou verdinha) ganha a nova; quem escolheu outra parede fica como está', () => {
    for (const [wallpaper, floor] of [['p-creme', 'f-madeira'], ['p-menta', 'f-pistache']]) {
      const up = upgradeHouse({ ...arenaHouse(1), wallpaper, floor }, 1);
      expect([up.wallpaper, up.floor]).toEqual(['p-azulzinho', 'f-creme']);
    }
    const mine = { ...arenaHouse(1), wallpaper: 'p-lavanda', floor: 'f-madeira' };
    expect(upgradeHouse(mine, 1)).toBe(mine);
  });
  it('móveis no lugar antigo (espalhados) chegam mais perto do Lumbi; casa mexida fica como está', () => {
    const OLD: Record<string, [number, number]> = { 'k-cama-rosa': [25, 71], 'k-guarda-roupa-rosa': [82, 68] };
    const h = { ...arenaHouse(1), items: arenaHouse(1).items.filter((i) => OLD[i.itemId]).map((i) => ({ ...i, x: OLD[i.itemId][0], y: OLD[i.itemId][1] })) };
    const up = upgradeHouse(h, 1);
    expect(up.items.find((i) => i.itemId === 'k-guarda-roupa-rosa')!.x).toBe(74);
    const moved = { ...h, items: h.items.map((i, n) => (n === 0 ? { ...i, x: 40 } : i)) };
    expect(upgradeHouse(moved, 1).items).toEqual(moved.items);
  });
});
