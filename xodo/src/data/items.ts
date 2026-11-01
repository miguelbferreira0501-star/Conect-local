// Itens da loja. Chapéus e acessórios são desenhados no próprio bichinho (Pet.tsx);
// a decoração aparece no cantinho dele (Room.tsx).
export type Slot = 'chapeu' | 'acessorio' | 'decor';
export type DecorSpot = 'teto' | 'paredeEsq' | 'paredeDir' | 'chaoEsq' | 'chaoDir';
export type Season = 'natal' | 'junina';

export interface Item {
  id: string;
  name: string;
  slot: Slot;
  price: number;
  emoji?: string;
  spot?: DecorSpot;
  season?: Season;
  /** Só vem de passeio: não está à venda. */
  souvenir?: boolean;
}

export const ITEMS: Item[] = [
  { id: 'laco', name: 'Laço de fita', slot: 'chapeu', price: 20 },
  { id: 'bone', name: 'Boné azul', slot: 'chapeu', price: 30 },
  { id: 'gorro', name: 'Gorro de lã', slot: 'chapeu', price: 35 },
  { id: 'coroa', name: 'Coroa de flores', slot: 'chapeu', price: 40 },
  { id: 'palha', name: 'Chapéu de palha', slot: 'chapeu', price: 30, season: 'junina' },
  { id: 'gorro-natal', name: 'Gorro de Natal', slot: 'chapeu', price: 30, season: 'natal' },
  { id: 'gravata', name: 'Gravata-borboleta', slot: 'acessorio', price: 20 },
  { id: 'oculos', name: 'Óculos redondos', slot: 'acessorio', price: 25 },
  { id: 'cachecol', name: 'Cachecol', slot: 'acessorio', price: 30 },
  { id: 'vaso', name: 'Costela-de-adão', slot: 'decor', spot: 'chaoEsq', emoji: '🪴', price: 15 },
  { id: 'quadro', name: 'Quadrinho', slot: 'decor', spot: 'paredeEsq', emoji: '🖼️', price: 20 },
  { id: 'ursinho', name: 'Ursinho', slot: 'decor', spot: 'chaoDir', emoji: '🧸', price: 25 },
  { id: 'radinho', name: 'Radinho de pilha', slot: 'decor', spot: 'chaoDir', emoji: '📻', price: 30 },
  { id: 'relogio', name: 'Relógio da vó', slot: 'decor', spot: 'paredeDir', emoji: '🕰️', price: 35 },
  { id: 'violao', name: 'Violão', slot: 'decor', spot: 'chaoEsq', emoji: '🎸', price: 40 },
  { id: 'varal', name: 'Varal de fotos', slot: 'decor', spot: 'teto', price: 30 },
  { id: 'luzinhas', name: 'Pisca-pisca', slot: 'decor', spot: 'teto', price: 30, season: 'natal' },
  { id: 'bandeirinhas', name: 'Bandeirinhas', slot: 'decor', spot: 'teto', price: 25, season: 'junina' },
  // Lembrancinhas de passeio
  { id: 'concha', name: 'Conchinha de Noronha', slot: 'decor', spot: 'chaoDir', emoji: '🐚', price: 0, souvenir: true },
  { id: 'cuia', name: 'Cuia de chimarrão', slot: 'decor', spot: 'chaoEsq', emoji: '🧉', price: 0, souvenir: true },
  { id: 'capim', name: 'Capim-dourado', slot: 'decor', spot: 'paredeDir', emoji: '🌾', price: 0, souvenir: true },
  { id: 'folha', name: 'Folha da Amazônia', slot: 'decor', spot: 'paredeEsq', emoji: '🍃', price: 0, souvenir: true },
];

export const itemById = (id: string | null | undefined) => ITEMS.find((i) => i.id === id);

export const SEASONS: Record<Season, { label: string; months: number[]; until: string }> = {
  natal: { label: 'Temporada de Natal', months: [10, 11], until: 'até 31 de dezembro' },
  junina: { label: 'Arraiá do Xodó', months: [5, 6], until: 'até 31 de julho' },
};

export function inSeason(item: Item, date = new Date()) {
  return !item.season || SEASONS[item.season].months.includes(date.getMonth());
}

export function currentSeason(date = new Date()): Season | null {
  const m = date.getMonth();
  return (Object.keys(SEASONS) as Season[]).find((s) => SEASONS[s].months.includes(m)) ?? null;
}
