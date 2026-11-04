// A casa de cada arena: parede, piso e os móveis exclusivos já arrumados.
import type { House } from '../types';

export const ARENA_HOME: Record<number, { wallpaper: string; floor: string; items: { itemId: string; x: number; y: number }[] }> = {
  1: { wallpaper: 'p-creme', floor: 'f-madeira', items: [] },
  2: { wallpaper: 'p-jardim', floor: 'f-musgo', items: [{ itemId: 'banco-galho', x: 30, y: 94 }, { itemId: 'casa-passaro', x: 78, y: 46 }] },
  3: { wallpaper: 'p-vila', floor: 'f-tacos', items: [{ itemId: 'balcao-cafe', x: 28, y: 94 }, { itemId: 'lampiao', x: 84, y: 92 }] },
  4: { wallpaper: 'p-floresta', floor: 'f-folhas', items: [{ itemId: 'cama-tronco', x: 26, y: 95 }, { itemId: 'luminaria-cogumelo', x: 82, y: 92 }] },
  5: { wallpaper: 'p-tropical', floor: 'f-areia', items: [{ itemId: 'tapete-tropical', x: 52, y: 99 }, { itemId: 'cadeira-praia', x: 22, y: 94 }, { itemId: 'guarda-sol', x: 82, y: 92 }] },
  6: { wallpaper: 'p-chale', floor: 'f-chale', items: [{ itemId: 'tapete-neve', x: 52, y: 99 }, { itemId: 'lareira', x: 24, y: 84 }] },
  7: { wallpaper: 'p-cidade', floor: 'f-concreto', items: [{ itemId: 'poltrona-moderna', x: 24, y: 94 }, { itemId: 'luminaria-neon', x: 82, y: 92 }] },
  8: { wallpaper: 'p-mar', floor: 'f-areia-mar', items: [{ itemId: 'cama-concha', x: 26, y: 95 }, { itemId: 'coral', x: 84, y: 93 }] },
  9: { wallpaper: 'p-sonhos', floor: 'f-algodao', items: [{ itemId: 'cama-nuvem', x: 26, y: 95 }, { itemId: 'luminaria-lua', x: 80, y: 44 }] },
  10: { wallpaper: 'p-castelo', floor: 'f-real', items: [{ itemId: 'tapete-vermelho', x: 52, y: 99 }, { itemId: 'trono', x: 22, y: 92 }] },
  11: { wallpaper: 'p-espaco', floor: 'f-metal', items: [{ itemId: 'cama-estrelas', x: 26, y: 95 }, { itemId: 'luminaria-estrelas', x: 84, y: 92 }, { itemId: 'mobile-planetas', x: 62, y: 34 }] },
  12: { wallpaper: 'p-celeste', floor: 'f-ouro', items: [{ itemId: 'portal-celeste', x: 22, y: 92 }, { itemId: 'fonte-celeste', x: 80, y: 94 }] },
};

export function arenaHouse(n: number): House {
  const h = ARENA_HOME[n] ?? ARENA_HOME[1];
  return { wallpaper: h.wallpaper, floor: h.floor, items: h.items.map((it, i) => ({ uid: `arena${n}-${i}`, itemId: it.itemId, x: it.x, y: it.y, z: i + 1 })) };
}
