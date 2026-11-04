// Raridade de cada item da loja e quais itens podem sair nos baús.
import { ITEMS, type Item, type ItemKind } from '../../data/items';
import type { Rarity } from './config';
import type { PoolItem } from './chests';

/** Tipos que podem sair em baú: roupas, móveis, decoração, brinquedos, paredes e pisos. */
export const CHEST_KINDS: ItemKind[] = ['chapeu', 'oculos', 'roupa', 'acessorio', 'efeito', 'movel', 'decor', 'brinquedo', 'parede', 'piso'];

/** Raridade de um item: a definida no catálogo ou uma estimativa pelo preço e pelo tipo. */
export function rarityOf(item: Item): Rarity {
  if (item.rarity) return item.rarity;
  if (item.plus) return 'epico';
  if (item.kind === 'efeito') return item.price >= 110 ? 'lendario' : item.price >= 80 ? 'epico' : 'raro';
  if (item.c1 === '#F6C445' && item.base) return 'epico'; // variações douradas
  if (item.season) return 'raro';
  const p = item.price;
  if (p <= 20) return 'comum';
  if (p <= 35) return 'incomum';
  if (p <= 55) return 'raro';
  if (p <= 80) return 'epico';
  return 'lendario';
}

/** Itens que podem sair nos baús (sem comidas, lembranças de aventura, itens do Plus e de época). */
export function chestPool(items: Item[] = ITEMS): PoolItem[] {
  return items.filter((i) => CHEST_KINDS.includes(i.kind) && !i.souvenir && !i.plus && !i.season && i.price > 0).map((i) => ({ id: i.id, rarity: rarityOf(i) }));
}

/** Itens exclusivos que a arena dá de presente (a configuração pode trocar a lista). */
export function arenaItemsOf(n: number, cfgItems?: string[], items: Item[] = ITEMS): string[] {
  return cfgItems ?? items.filter((i) => i.arena === n).map((i) => i.id);
}
