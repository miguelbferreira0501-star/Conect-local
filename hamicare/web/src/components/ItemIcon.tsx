// O desenho pequeno de um item: móvel, decoração, parede, piso ou roupa (vestida num Lumbi pequenininho).
import { memo, useEffect, useRef } from 'react';
import { Furniture, FLOOR_CSS, Garland, WALLPAPER_CSS } from './Furniture';
import { KitLite } from './room/kit';
import { Hamster } from './Hamster';
import { Glyph } from './art';
import { WEARABLE_KINDS, type Item } from '../data/items';

export const ItemIcon = memo(function ItemIcon({ item, size = 34, fur = 'caramelo' }: { item: Item; size?: number; fur?: string }) {
  // Enfeites que atravessam a parede (pisca-pisca, bandeirinhas): no quadradinho, um pedaço do varal.
  if (item.svg === 'pisca' || item.svg === 'bandeirinhas')
    return (
      <span className="relative block overflow-hidden" style={{ width: size * 1.6, height: size * 0.9 }} aria-hidden="true">
        <span className="absolute inset-x-0 top-[22%] block h-10">
          <Garland id={item.svg} />
        </span>
      </span>
    );
  if (item.svg) return <KitIcon item={item} size={size} />;
  return <OtherIcon item={item} size={size} fur={fur} />;
});

/**
 * Móvel no quadradinho: mede o desenho de verdade (alguns têm pés, pêndulo ou vaso fora da moldura)
 * e enquadra pelo tamanho real, para caber inteiro e grande.
 */
function KitIcon({ item, size }: { item: Item; size: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    // Mede depois de desenhado (em listas que acabaram de abrir o desenho ainda não tem tamanho): tenta algumas vezes.
    let tries = 0;
    let raf = 0;
    const fit = () => {
      const svg = ref.current?.querySelector('svg');
      if (!svg || typeof (svg as SVGGraphicsElement).getBBox !== 'function') return;
      try {
        const b = (svg as SVGGraphicsElement).getBBox();
        if (!b.width || !b.height) {
          if (tries++ < 12) raf = requestAnimationFrame(fit);
          return;
        }
        const pad = Math.max(b.width, b.height) * 0.05;
        svg.setAttribute('viewBox', `${b.x - pad} ${b.y - pad} ${b.width + pad * 2} ${b.height + pad * 2}`);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      } catch {
        if (tries++ < 12) raf = requestAnimationFrame(fit);
      }
    };
    fit();
    return () => cancelAnimationFrame(raf);
  }, [item.svg, item.c1, item.c2]);
  return (
    <span ref={ref} className="kit-icon" style={{ width: size * 1.7, height: size * 1.7 }}>
      <KitLite.Provider value={true}>
        <Furniture id={item.svg ?? ''} c1={item.c1} c2={item.c2} />
      </KitLite.Provider>
    </span>
  );
}

function OtherIcon({ item, size, fur }: { item: Item; size: number; fur: string }) {
  if (item.art || item.emoji) return <Glyph e={item.art ?? item.emoji} size={Math.round(size * 1.25)} />;
  if (item.kind === 'parede') return <span className="block rounded-xl" style={{ width: size * 1.3, height: size * 1.3, background: WALLPAPER_CSS[item.id] }} />;
  if (item.kind === 'piso') return <span className="block rounded-xl" style={{ width: size * 1.3, height: size * 1.3, background: FLOOR_CSS[item.id] }} />;
  if (WEARABLE_KINDS.includes(item.kind)) {
    return (
      <span className="icon-still">
        <Hamster
          growth={1}
          fur={fur}
          outfit={{ chapeu: null, oculos: null, roupa: null, acessorio: null, efeito: null, [item.kind]: item.id }}
          size={Math.round(size * 1.65)}
          idle={false}
          label={item.name}
        />
      </span>
    );
  }
  return null;
}
