// Catálogo da loja. Roupas são desenhadas no próprio Hami (Hamster.tsx); móveis e decoração
// vão para a casa (Room.tsx); comidas são consumíveis.
export type ItemKind = 'chapeu' | 'oculos' | 'roupa' | 'acessorio' | 'movel' | 'decor' | 'brinquedo' | 'comida' | 'parede' | 'piso';
export type Season = 'natal' | 'junina';

export interface Item {
  id: string;
  name: string;
  kind: ItemKind;
  price: number;
  emoji?: string;
  /** Móvel desenhado em SVG (Furniture.tsx) em vez de emoji. */
  svg?: string;
  /** Largura na casa, em % do cômodo. */
  size?: number;
  plus?: boolean;
  season?: Season;
  level?: number;
  /** Só vem de aventura: não está à venda. */
  souvenir?: boolean;
  food?: { saciedade: number; felicidade: number };
}

const W = (id: string, name: string, kind: ItemKind, price: number, extra: Partial<Item> = {}): Item => ({ id, name, kind, price, ...extra });

export const ITEMS: Item[] = [
  // Chapéus
  W('laco', 'Laço de fita', 'chapeu', 20),
  W('bone', 'Boné', 'chapeu', 30),
  W('gorro', 'Gorro de lã', 'chapeu', 35),
  W('coroa', 'Coroa de flores', 'chapeu', 40),
  W('chef', 'Chapéu de chef', 'chapeu', 45, { level: 3 }),
  W('cartola', 'Cartola', 'chapeu', 60, { plus: true }),
  W('capacete', 'Capacete espacial', 'chapeu', 80, { plus: true }),
  W('palha', 'Chapéu de palha', 'chapeu', 30, { season: 'junina' }),
  W('gorro-natal', 'Gorro de Natal', 'chapeu', 30, { season: 'natal' }),
  // Óculos
  W('redondos', 'Óculos redondos', 'oculos', 25),
  W('sol', 'Óculos de sol', 'oculos', 35),
  W('coracao', 'Óculos de coração', 'oculos', 40, { plus: true }),
  // Roupas
  W('moletom', 'Moletom', 'roupa', 45),
  W('regata', 'Regata esportiva', 'roupa', 35, { level: 2 }),
  W('tutu', 'Saia de tule', 'roupa', 40),
  W('capa', 'Capa de herói', 'roupa', 70, { plus: true }),
  W('pijama', 'Pijama de estrelas', 'roupa', 50, { level: 4 }),
  // Acessórios
  W('cachecol', 'Cachecol', 'acessorio', 30),
  W('gravata', 'Gravata-borboleta', 'acessorio', 20),
  W('mochila', 'Mochilinha', 'acessorio', 40, { level: 2 }),
  W('medalha', 'Medalha de ouro', 'acessorio', 90, { level: 6 }),
  // Móveis
  W('rodinha', 'Rodinha de exercício', 'movel', 30, { svg: 'rodinha', size: 26 }),
  W('caminha', 'Caminha de hamster', 'movel', 35, { svg: 'caminha', size: 26 }),
  W('casinha', 'Casinha de madeira', 'movel', 50, { svg: 'casinha', size: 28 }),
  W('mesa', 'Mesinha', 'movel', 30, { svg: 'mesa', size: 22 }),
  W('luminaria', 'Luminária de pé', 'movel', 35, { svg: 'luminaria', size: 12 }),
  W('tapete', 'Tapete redondo', 'movel', 25, { svg: 'tapete', size: 40 }),
  W('estante', 'Estante com livros', 'movel', 55, { svg: 'estante', size: 20, level: 3 }),
  W('sofa', 'Sofá', 'movel', 60, { emoji: '🛋️', size: 26, level: 2 }),
  W('cadeira', 'Cadeira', 'movel', 25, { emoji: '🪑', size: 14 }),
  W('cama', 'Cama grande', 'movel', 70, { emoji: '🛏️', size: 28, level: 4 }),
  // Decoração
  W('planta', 'Costela-de-adão', 'decor', 15, { emoji: '🪴', size: 14 }),
  W('cacto', 'Cacto', 'decor', 15, { emoji: '🌵', size: 11 }),
  W('flores', 'Vaso de flores', 'decor', 20, { emoji: '🌷', size: 11 }),
  W('quadro', 'Quadrinho', 'decor', 20, { emoji: '🖼️', size: 14 }),
  W('relogio', 'Relógio da vó', 'decor', 35, { emoji: '🕰️', size: 12 }),
  W('vela', 'Velinha cheirosa', 'decor', 15, { emoji: '🕯️', size: 9 }),
  W('livros', 'Pilha de livros', 'decor', 15, { emoji: '📚', size: 12 }),
  W('palmeira', 'Palmeirinha', 'decor', 35, { emoji: '🌴', size: 16, level: 3 }),
  W('arco-iris', 'Arco-íris', 'decor', 45, { emoji: '🌈', size: 18, plus: true }),
  W('nuvem', 'Nuvem fofinha', 'decor', 25, { emoji: '☁️', size: 14 }),
  W('estrela', 'Estrela', 'decor', 20, { emoji: '⭐', size: 10 }),
  W('aquario', 'Aquário', 'decor', 50, { emoji: '🐠', size: 12, level: 5 }),
  W('pisca', 'Pisca-pisca', 'decor', 30, { svg: 'pisca', size: 60, season: 'natal' }),
  W('arvore-natal', 'Arvorezinha de Natal', 'decor', 40, { emoji: '🎄', size: 16, season: 'natal' }),
  W('bandeirinhas', 'Bandeirinhas', 'decor', 25, { svg: 'bandeirinhas', size: 60, season: 'junina' }),
  // Brinquedos
  W('bola', 'Bolinha', 'brinquedo', 10, { emoji: '⚽', size: 9 }),
  W('novelo', 'Novelo', 'brinquedo', 10, { emoji: '🧶', size: 9 }),
  W('ursinho', 'Ursinho', 'brinquedo', 25, { emoji: '🧸', size: 12 }),
  W('ioio', 'Ioiô', 'brinquedo', 15, { emoji: '🪀', size: 9 }),
  W('balao', 'Balão', 'brinquedo', 15, { emoji: '🎈', size: 10 }),
  W('videogame', 'Videogame', 'brinquedo', 60, { emoji: '🎮', size: 12, level: 4 }),
  // Comidas (consumíveis)
  W('semente', 'Semente de girassol extra', 'comida', 3, { emoji: '🌻', food: { saciedade: 8, felicidade: 6 } }),
  W('cenoura', 'Cenourinha', 'comida', 4, { emoji: '🥕', food: { saciedade: 15, felicidade: 4 } }),
  W('brocolis', 'Brócolis', 'comida', 4, { emoji: '🥦', food: { saciedade: 15, felicidade: 3 } }),
  W('maca', 'Maçã', 'comida', 5, { emoji: '🍎', food: { saciedade: 18, felicidade: 5 } }),
  W('milho', 'Milho', 'comida', 5, { emoji: '🌽', food: { saciedade: 20, felicidade: 5 } }),
  W('morango', 'Morango', 'comida', 6, { emoji: '🍓', food: { saciedade: 12, felicidade: 9 }, level: 2 }),
  W('banana', 'Banana', 'comida', 5, { emoji: '🍌', food: { saciedade: 18, felicidade: 6 }, level: 2 }),
  W('mirtilo', 'Mirtilos', 'comida', 7, { emoji: '🫐', food: { saciedade: 10, felicidade: 10 }, level: 3 }),
  W('queijo', 'Queijinho', 'comida', 8, { emoji: '🧀', food: { saciedade: 15, felicidade: 12 }, level: 4 }),
  W('abobora', 'Abóbora', 'comida', 6, { emoji: '🎃', food: { saciedade: 22, felicidade: 6 }, level: 5 }),
  // Pratos preparados (só na cozinha)
  W('salada', 'Saladinha colorida', 'comida', 0, { emoji: '🥗', food: { saciedade: 45, felicidade: 15 }, souvenir: true }),
  W('espetinho', 'Espetinho de frutas', 'comida', 0, { emoji: '🍢', food: { saciedade: 35, felicidade: 25 }, souvenir: true }),
  W('bolinho', 'Bolinho de aniversário', 'comida', 0, { emoji: '🧁', food: { saciedade: 20, felicidade: 40 }, souvenir: true }),
  // Papéis de parede
  W('p-creme', 'Parede creme', 'parede', 0),
  W('p-listras', 'Listras de morango', 'parede', 30),
  W('p-bolinhas', 'Bolinhas de menta', 'parede', 30),
  W('p-ceu', 'Céu com nuvens', 'parede', 40),
  W('p-folhas', 'Folhagem tropical', 'parede', 45, { level: 3 }),
  W('p-lavanda', 'Lavanda pastel', 'parede', 30),
  W('p-cinza', 'Cinza moderno', 'parede', 30),
  W('p-estrelas', 'Noite estrelada', 'parede', 60, { plus: true }),
  // Pisos
  W('f-madeira', 'Madeira', 'piso', 0),
  W('f-clara', 'Madeira clara', 'piso', 25),
  W('f-carpete', 'Carpete rosinha', 'piso', 30),
  W('f-azulejo', 'Azulejo xadrez', 'piso', 35),
  W('f-grama', 'Gramado', 'piso', 35, { level: 3 }),
  W('f-marmore', 'Mármore', 'piso', 50, { plus: true }),
];

export const itemById = (id: string | null | undefined) => ITEMS.find((i) => i.id === id);

export const KIND_LABEL: Record<ItemKind, string> = {
  chapeu: 'Chapéus',
  oculos: 'Óculos',
  roupa: 'Roupas',
  acessorio: 'Acessórios',
  movel: 'Móveis',
  decor: 'Decoração',
  brinquedo: 'Brinquedos',
  comida: 'Comidas',
  parede: 'Papéis de parede',
  piso: 'Pisos',
};

export const WEARABLE_KINDS: ItemKind[] = ['chapeu', 'oculos', 'roupa', 'acessorio'];
export const HOUSE_KINDS: ItemKind[] = ['movel', 'decor', 'brinquedo'];

export const SEASONS: Record<Season, { label: string; months: number[]; until: string }> = {
  natal: { label: 'Temporada de Natal', months: [10, 11], until: 'até 31 de dezembro' },
  junina: { label: 'Arraiá do Hami', months: [5, 6], until: 'até 31 de julho' },
};

export function inSeason(item: Item, date = new Date()) {
  return !item.season || SEASONS[item.season].months.includes(date.getMonth());
}

export function currentSeason(date = new Date()): Season | null {
  const m = date.getMonth();
  return (Object.keys(SEASONS) as Season[]).find((s) => SEASONS[s].months.includes(m)) ?? null;
}

/** Coleções temáticas: compra o estilo inteiro com desconto e já arruma a casa. */
export interface StyleSet {
  id: string;
  name: string;
  wallpaper: string;
  floor: string;
  items: { itemId: string; x: number; y: number }[];
  plus?: boolean;
}

export const STYLES: StyleSet[] = [
  { id: 'minimalista', name: 'Minimalista', wallpaper: 'p-creme', floor: 'f-clara', items: [{ itemId: 'luminaria', x: 82, y: 58 }, { itemId: 'planta', x: 12, y: 74 }, { itemId: 'mesa', x: 30, y: 72 }] },
  { id: 'aconchegante', name: 'Aconchegante', wallpaper: 'p-listras', floor: 'f-carpete', items: [{ itemId: 'sofa', x: 22, y: 66 }, { itemId: 'tapete', x: 50, y: 88 }, { itemId: 'vela', x: 84, y: 70 }, { itemId: 'livros', x: 72, y: 76 }] },
  { id: 'natureza', name: 'Natureza', wallpaper: 'p-bolinhas', floor: 'f-grama', items: [{ itemId: 'planta', x: 10, y: 70 }, { itemId: 'cacto', x: 86, y: 74 }, { itemId: 'flores', x: 74, y: 78 }, { itemId: 'casinha', x: 24, y: 70 }] },
  { id: 'moderno', name: 'Moderno', wallpaper: 'p-cinza', floor: 'f-azulejo', items: [{ itemId: 'luminaria', x: 86, y: 58 }, { itemId: 'quadro', x: 24, y: 30 }, { itemId: 'cadeira', x: 18, y: 72 }, { itemId: 'estante', x: 72, y: 62 }] },
  { id: 'tropical', name: 'Tropical', wallpaper: 'p-folhas', floor: 'f-madeira', items: [{ itemId: 'palmeira', x: 12, y: 66 }, { itemId: 'flores', x: 84, y: 76 }, { itemId: 'rodinha', x: 26, y: 72 }] },
  { id: 'colorido', name: 'Colorido', wallpaper: 'p-bolinhas', floor: 'f-azulejo', items: [{ itemId: 'balao', x: 84, y: 40 }, { itemId: 'bola', x: 72, y: 84 }, { itemId: 'tapete', x: 50, y: 88 }, { itemId: 'arco-iris', x: 22, y: 30 }], plus: true },
  { id: 'pastel', name: 'Pastel', wallpaper: 'p-lavanda', floor: 'f-carpete', items: [{ itemId: 'nuvem', x: 20, y: 28 }, { itemId: 'estrela', x: 80, y: 26 }, { itemId: 'ursinho', x: 82, y: 76 }, { itemId: 'caminha', x: 22, y: 76 }] },
];

/** Preço da coleção: soma do que falta, com 25% de desconto. */
export function stylePrice(style: StyleSet, owned: (id: string) => boolean): number {
  const ids = [style.wallpaper, style.floor, ...style.items.map((i) => i.itemId)];
  const missing = [...new Set(ids)].filter((id) => !owned(id));
  return Math.round(missing.reduce((s, id) => s + (itemById(id)?.price ?? 0), 0) * 0.75);
}

/** Receitas da cozinha: 3 ingredientes viram um prato que alimenta mais. */
export const RECIPES = [
  { result: 'salada', name: 'Saladinha colorida', needs: ['brocolis', 'cenoura', 'milho'] },
  { result: 'espetinho', name: 'Espetinho de frutas', needs: ['morango', 'banana', 'maca'] },
  { result: 'bolinho', name: 'Bolinho de aniversário', needs: ['banana', 'semente', 'mirtilo'] },
];
