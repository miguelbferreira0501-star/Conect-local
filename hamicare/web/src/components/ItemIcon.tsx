// O desenho pequeno de um item: móvel, decoração, parede, piso ou roupa (vestida num Hami pequenininho).
import { Furniture, FLOOR_CSS, WALLPAPER_CSS } from './Furniture';
import { Hamster } from './Hamster';
import { Glyph } from './art';
import { WEARABLE_KINDS, type Item } from '../data/items';

export function ItemIcon({ item, size = 34, fur = 'caramelo' }: { item: Item; size?: number; fur?: string }) {
  if (item.svg) {
    return (
      <span className="grid place-items-center" style={{ width: size * 1.3, height: size * 1.3 }}>
        <span style={{ width: size * 1.2 }}>
          <Furniture id={item.svg} />
        </span>
      </span>
    );
  }
  if (item.art || item.emoji) return <Glyph e={item.art ?? item.emoji} size={Math.round(size * 1.25)} />;
  if (item.kind === 'parede') return <span className="block rounded-xl" style={{ width: size * 1.3, height: size * 1.3, background: WALLPAPER_CSS[item.id] }} />;
  if (item.kind === 'piso') return <span className="block rounded-xl" style={{ width: size * 1.3, height: size * 1.3, background: FLOOR_CSS[item.id] }} />;
  if (WEARABLE_KINDS.includes(item.kind)) {
    return <Hamster fur={fur} outfit={{ chapeu: null, oculos: null, roupa: null, acessorio: null, efeito: null, [item.kind]: item.id }} size={Math.round(size * 1.65)} idle={false} label={item.name} />;
  }
  return null;
}
