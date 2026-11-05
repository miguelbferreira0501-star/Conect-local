// A casa de cada arena: parede, piso e os móveis já arrumados (kit novo + os exclusivos da arena).
// x e y em % do cômodo; y é onde a peça toca o chão (ou a parede, para as que ficam penduradas).
import type { House } from '../types';

type Spot = { itemId: string; x: number; y: number };

export const ARENA_HOME: Record<number, { wallpaper: string; floor: string; items: Spot[] }> = {
  // Casinha Inicial: quartinho aconchegante
  1: {
    wallpaper: 'p-creme',
    floor: 'f-madeira',
    items: [
      { itemId: 'k-tapete-rosa', x: 50, y: 95 },
      { itemId: 'k-cama-rosa', x: 25, y: 71 },
      { itemId: 'k-criado-branco', x: 50.5, y: 68 },
      { itemId: 'k-planta-grande-terracota', x: 63, y: 72 },
      { itemId: 'k-guarda-roupa-rosa', x: 82, y: 68 },
      { itemId: 'k-relogio-madeira', x: 17, y: 40 },
      { itemId: 'k-rodinha-azul', x: 85, y: 93 },
      { itemId: 'k-ursinho-caramelo', x: 10, y: 97 },
    ],
  },
  // Jardim: cantinho verde com casinha e flores
  2: {
    wallpaper: 'p-jardim',
    floor: 'f-musgo',
    items: [
      { itemId: 'k-tapete-verde', x: 50, y: 95 },
      { itemId: 'k-casinha-verde', x: 22, y: 72 },
      { itemId: 'k-vaso-flores-rosa', x: 46, y: 69 },
      { itemId: 'k-planta-grande-branca', x: 88, y: 71 },
      { itemId: 'casa-passaro', x: 80, y: 44 },
      { itemId: 'k-planta-pendurada-terracota', x: 9, y: 28 },
      { itemId: 'banco-galho', x: 68, y: 86 },
      { itemId: 'k-cesto-rosa', x: 12, y: 97 },
    ],
  },
  // Vila: cafeteria
  3: {
    wallpaper: 'p-vila',
    floor: 'f-tacos',
    items: [
      { itemId: 'k-tapete-retangulo-vermelho', x: 50, y: 97 },
      { itemId: 'balcao-cafe', x: 22, y: 72 },
      { itemId: 'k-prateleira-madeira', x: 19, y: 38 },
      { itemId: 'k-relogio-madeira', x: 86, y: 40 },
      { itemId: 'k-mesa-jantar-vermelha', x: 70, y: 82 },
      { itemId: 'k-planta-grande-terracota', x: 92, y: 71 },
      { itemId: 'lampiao', x: 8, y: 96 },
    ],
  },
  // Floresta: quarto de toquinha
  4: {
    wallpaper: 'p-floresta',
    floor: 'f-folhas',
    items: [
      { itemId: 'k-tapete-verde', x: 50, y: 95 },
      { itemId: 'cama-tronco', x: 25, y: 73 },
      { itemId: 'k-quadro-madeira', x: 16, y: 40 },
      { itemId: 'k-torre-verde', x: 64, y: 71 },
      { itemId: 'luminaria-cogumelo', x: 86, y: 73 },
      { itemId: 'k-planta-pendurada-terracota', x: 92, y: 28 },
      { itemId: 'k-cesto-rosa', x: 86, y: 97 },
      { itemId: 'k-ursinho-caramelo', x: 11, y: 97 },
    ],
  },
  // Praia tropical
  5: {
    wallpaper: 'p-tropical',
    floor: 'f-areia',
    items: [
      { itemId: 'tapete-tropical', x: 50, y: 96 },
      { itemId: 'k-prateleira-branca', x: 18, y: 38 },
      { itemId: 'k-quadro-dourado', x: 85, y: 38 },
      { itemId: 'guarda-sol', x: 20, y: 80 },
      { itemId: 'k-planta-grande-branca', x: 66, y: 70 },
      { itemId: 'cadeira-praia', x: 82, y: 86 },
      { itemId: 'k-vaso-flores-amarelo', x: 44, y: 69 },
      { itemId: 'k-pufe-rosa', x: 12, y: 97 },
    ],
  },
  // Chalé na neve
  6: {
    wallpaper: 'p-chale',
    floor: 'f-chale',
    items: [
      { itemId: 'tapete-neve', x: 50, y: 96 },
      { itemId: 'lareira', x: 22, y: 72 },
      { itemId: 'k-quadro-madeira', x: 22, y: 30 },
      { itemId: 'k-estante-madeira', x: 86, y: 68 },
      { itemId: 'k-relogio-madeira', x: 66, y: 44 },
      { itemId: 'k-poltrona-vermelha', x: 70, y: 86 },
      { itemId: 'k-cesto-rosa', x: 38, y: 88 },
      { itemId: 'k-ursinho-branco', x: 10, y: 97 },
    ],
  },
  // Cidade: sala moderna
  7: {
    wallpaper: 'p-cidade',
    floor: 'f-concreto',
    items: [
      { itemId: 'k-tapete-retangulo-azul', x: 50, y: 97 },
      { itemId: 'k-sofa-azul', x: 27, y: 71 },
      { itemId: 'k-quadro-rosa', x: 20, y: 40 },
      { itemId: 'k-rack-tv-branco', x: 78, y: 70 },
      { itemId: 'k-mesa-centro-branco', x: 34, y: 88 },
      { itemId: 'poltrona-moderna', x: 66, y: 92 },
      { itemId: 'luminaria-neon', x: 93, y: 94 },
      { itemId: 'k-planta-grande-azul', x: 7, y: 84 },
    ],
  },
  // Fundo do mar
  8: {
    wallpaper: 'p-mar',
    floor: 'f-areia-mar',
    items: [
      { itemId: 'k-tapete-azul', x: 50, y: 95 },
      { itemId: 'cama-concha', x: 25, y: 73 },
      { itemId: 'k-quadro-dourado', x: 17, y: 38 },
      { itemId: 'k-prateleira-branca', x: 84, y: 40 },
      { itemId: 'k-vaso-flores-azul', x: 54, y: 69 },
      { itemId: 'coral', x: 86, y: 75 },
      { itemId: 'k-bau-azul', x: 72, y: 92 },
      { itemId: 'k-cesto-rosa', x: 10, y: 97 },
    ],
  },
  // Mundo dos sonhos
  9: {
    wallpaper: 'p-sonhos',
    floor: 'f-algodao',
    items: [
      { itemId: 'k-tapete-coracao-rosa', x: 50, y: 95 },
      { itemId: 'cama-nuvem', x: 25, y: 73 },
      { itemId: 'k-quadro-coracao-rosa', x: 18, y: 38 },
      { itemId: 'k-penteadeira-lilas', x: 80, y: 69 },
      { itemId: 'luminaria-lua', x: 82, y: 40 },
      { itemId: 'k-pufe-rosa', x: 66, y: 90 },
      { itemId: 'k-ursinho-rosa', x: 11, y: 97 },
    ],
  },
  // Castelo
  10: {
    wallpaper: 'p-castelo',
    floor: 'f-real',
    items: [
      { itemId: 'tapete-vermelho', x: 50, y: 97 },
      { itemId: 'trono', x: 22, y: 73 },
      { itemId: 'k-quadro-dourado', x: 20, y: 34 },
      { itemId: 'k-espelho-dourado', x: 64, y: 69 },
      { itemId: 'k-guarda-roupa-lilas', x: 84, y: 68 },
      { itemId: 'k-bau-madeira', x: 72, y: 92 },
      { itemId: 'k-luminaria-amarela', x: 8, y: 92 },
    ],
  },
  // Espaço
  11: {
    wallpaper: 'p-espaco',
    floor: 'f-metal',
    items: [
      { itemId: 'k-tapete-lilas', x: 50, y: 95 },
      { itemId: 'cama-estrelas', x: 25, y: 73 },
      { itemId: 'mobile-planetas', x: 84, y: 30 },
      { itemId: 'k-rack-tv-azul', x: 76, y: 71 },
      { itemId: 'k-pufe-azul', x: 50, y: 88 },
      { itemId: 'luminaria-estrelas', x: 92, y: 95 },
      { itemId: 'k-ursinho-branco', x: 10, y: 97 },
    ],
  },
  // Céu celeste
  12: {
    wallpaper: 'p-celeste',
    floor: 'f-ouro',
    items: [
      { itemId: 'k-tapete-amarelo', x: 50, y: 95 },
      { itemId: 'portal-celeste', x: 21, y: 73 },
      { itemId: 'k-quadro-coracao-dourado', x: 84, y: 36 },
      { itemId: 'k-planta-grande-branca', x: 62, y: 69 },
      { itemId: 'k-espelho-dourado', x: 92, y: 70 },
      { itemId: 'fonte-celeste', x: 80, y: 88 },
      { itemId: 'k-vaso-flores-amarelo', x: 36, y: 92 },
    ],
  },
};

export function arenaHouse(n: number): House {
  const h = ARENA_HOME[n] ?? ARENA_HOME[1];
  return { wallpaper: h.wallpaper, floor: h.floor, items: h.items.map((it, i) => ({ uid: `arena${n}-${i}`, itemId: it.itemId, x: it.x, y: it.y, z: i + 1 })) };
}

/** Como as casas vinham antes da reforma (para atualizar só as que ninguém mexeu). */
const OLD_ARENA_ITEMS: Record<number, string[]> = {
  1: [],
  2: ['banco-galho', 'casa-passaro'],
  3: ['balcao-cafe', 'lampiao'],
  4: ['cama-tronco', 'luminaria-cogumelo'],
  5: ['tapete-tropical', 'cadeira-praia', 'guarda-sol'],
  6: ['tapete-neve', 'lareira'],
  7: ['poltrona-moderna', 'luminaria-neon'],
  8: ['cama-concha', 'coral'],
  9: ['cama-nuvem', 'luminaria-lua'],
  10: ['tapete-vermelho', 'trono'],
  11: ['cama-estrelas', 'luminaria-estrelas', 'mobile-planetas'],
  12: ['portal-celeste', 'fonte-celeste'],
};
/** A casinha inicial de antes (rodinha, caminha e plantinha). */
const OLD_STARTER = ['caminha', 'planta', 'rodinha'];

const same = (a: string[], b: string[]) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

/** Casa ainda do jeito que veio (antes da reforma)? Então ganha a decoração nova da arena, com a parede e o piso de quem já escolheu. */
export function upgradeHouse(h: House, n: number): House {
  const ids = h.items.map((i) => i.itemId);
  const old = OLD_ARENA_ITEMS[n] ?? [];
  if (!(same(ids, old) || (n === 1 && same(ids, OLD_STARTER)))) return h;
  const fresh = arenaHouse(n);
  return { ...h, items: fresh.items };
}
