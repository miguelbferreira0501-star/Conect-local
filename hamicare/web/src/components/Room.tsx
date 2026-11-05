import { useRef, useState, type ReactNode } from 'react';
import type { House } from '../types';
import { itemById } from '../data/items';
import type { Period } from '../data/lines';
import { FLOOR_CSS, Furniture, Garland, WALLPAPER_CSS } from './Furniture';
import { Glyph } from './art';
import { KIT_PLACE } from './room/kit';
import { RoomWindow } from './room/RoomWindow';
import { trimOf, WALL_H } from './room/theme';

interface Props {
  house: House;
  period?: Period;
  height?: number;
  /** O Hami (ou outro conteúdo) no centro do chão. */
  children?: ReactNode;
  editing?: boolean;
  selected?: string | null;
  onSelect?: (uid: string | null) => void;
  onMove?: (uid: string, x: number, y: number) => void;
}

const GARLANDS = new Set(['pisca', 'bandeirinhas']);
/** Tapetes ficam no chão, sempre embaixo do Hami e dos móveis. */
const FLAT = /^tapete/;

/** Onde a peça está: tapete (deitado no chão), parede (pendurado) ou chão (em pé, com sombra). */
function placeOf(itemId: string, svg: string | undefined, y: number): 'tapete' | 'parede' | 'chao' {
  const kit = svg ? KIT_PLACE[svg] : undefined;
  if (kit === 'tapete' || FLAT.test(itemId)) return 'tapete';
  if (kit === 'parede') return 'parede';
  return y < WALL_H - 4 ? 'parede' : 'chao';
}

/** Mais para o fundo, um pouquinho menor (dá profundidade ao cômodo). */
const depth = (y: number) => 0.8 + 0.2 * Math.min(1, Math.max(0, (y - WALL_H) / (100 - WALL_H)));

/**
 * A casa do Hami: um cômodo de verdade (parede com papel, lambri e rodapé, chão em perspectiva,
 * janela com cortina) e os móveis posicionados em % (arrastáveis no modo de edição).
 */
export function Room({ house, period = 'tarde', height = 260, children, editing, selected, onSelect, onMove }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ uid: string; x: number; y: number } | null>(null);
  const trim = trimOf(house.wallpaper);

  function pos(e: React.PointerEvent) {
    const r = ref.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  }

  const items = [...house.items].sort((a, b) => a.z - b.z);
  // Chão em perspectiva: um plano deitado para trás que termina exatamente na linha do rodapé.
  // (perspectiva 1,4×altura, olho a 30% da altura, plano a 60°: a borda de trás cai em WALL_H = 60%)
  const floorH = height * 0.5833;

  return (
    <div
      ref={ref}
      className={`room ${editing ? 'room-editing' : ''}`}
      style={{ height }}
      onPointerDown={(e) => {
        if (editing && (e.target === e.currentTarget || (e.target as HTMLElement).dataset.roomBg)) onSelect?.(null);
      }}
    >
      {/* Parede */}
      <div data-room-bg="1" className="absolute inset-x-0 top-0" style={{ height: `${WALL_H}%`, background: WALLPAPER_CSS[house.wallpaper] ?? WALLPAPER_CSS['p-creme'] }} />
      {trim.wainscot && (
        <div data-room-bg="1" className="room-wainscot" style={{ top: `${WALL_H - 17}%`, height: '17%', ['--wc' as string]: trim.wainscot, ['--tr' as string]: trim.trim }} />
      )}
      <div className="room-crown" style={{ ['--tr' as string]: trim.trim }} />
      <div className="room-window" aria-hidden="true">
        <RoomWindow trim={trim} period={period} />
      </div>
      {/* Chão */}
      <div className="room-floor-wrap" style={{ perspective: `${height * 1.4}px`, perspectiveOrigin: `50% ${height * 0.3}px` }}>
        <div data-room-bg="1" className="room-floor" style={{ height: floorH, background: FLOOR_CSS[house.floor] ?? FLOOR_CSS['f-madeira'] }} />
      </div>
      <div className="room-floor-shade" style={{ top: `${WALL_H}%` }} />
      <div className="room-baseboard" style={{ top: `${WALL_H - 3.2}%`, ['--tr' as string]: trim.trim }} />

      {/* Sombras dos móveis no chão */}
      {items.map((it) => {
        const item = itemById(it.itemId);
        if (!item || GARLANDS.has(it.itemId)) return null;
        const live = drag?.uid === it.uid ? drag : it;
        if (placeOf(it.itemId, item.svg, live.y) !== 'chao') return null;
        const k = depth(live.y);
        return <span key={`s${it.uid}`} className="room-shadow" style={{ left: `${live.x}%`, top: `${live.y}%`, width: `${(item.size ?? 12) * 0.95 * k}%` }} />;
      })}

      {items.map((it) => {
        const item = itemById(it.itemId);
        if (!item) return null;
        const live = drag?.uid === it.uid ? drag : it;
        if (GARLANDS.has(it.itemId)) {
          return (
            <div key={it.uid} className={`absolute inset-x-0 top-0 ${editing ? 'cursor-pointer' : ''}`} style={{ zIndex: 4 }} onPointerDown={() => editing && onSelect?.(it.uid)}>
              <Garland id={item.svg ?? it.itemId} />
              {editing && selected === it.uid && <div className="absolute inset-x-2 top-0 h-10 rounded-xl ring-2 ring-[var(--accent)]" />}
            </div>
          );
        }
        const place = placeOf(it.itemId, item.svg, live.y);
        const k = place === 'parede' ? 1 : depth(live.y);
        return (
          <div
            key={it.uid}
            role={editing ? 'button' : 'img'}
            aria-label={item.name}
            tabIndex={editing ? 0 : -1}
            className={`room-item ${place === 'tapete' ? 'is-flat' : ''} ${editing ? 'is-editable' : ''} ${selected === it.uid ? 'is-selected' : ''}`}
            style={{
              left: `${live.x}%`,
              top: `${live.y}%`,
              width: `${item.size ?? 12}%`,
              scale: k === 1 ? undefined : String(k),
              zIndex: place === 'tapete' ? 3 : place === 'parede' ? 5 : 10 + Math.round(live.y),
              fontSize: `${(item.size ?? 12) * 0.82}cqw`,
            }}
            onPointerDown={(e) => {
              if (!editing) return;
              e.preventDefault();
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              onSelect?.(it.uid);
              setDrag({ uid: it.uid, ...pos(e) });
            }}
            onPointerMove={(e) => {
              if (drag?.uid === it.uid) setDrag({ uid: it.uid, ...pos(e) });
            }}
            onPointerUp={() => {
              if (drag?.uid === it.uid) onMove?.(it.uid, drag.x, drag.y);
              setDrag(null);
            }}
          >
            {item.svg ? <Furniture id={item.svg} c1={item.c1} c2={item.c2} /> : <Glyph e={item.art ?? item.emoji} size="fill" />}
          </div>
        );
      })}
      {children && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[3%] flex justify-center" style={{ zIndex: 98 }}>
          <div className="pointer-events-auto">{children}</div>
        </div>
      )}
      <div className="room-light" aria-hidden="true" />
      {period === 'noite' && <div className="room-night" aria-hidden="true" />}
    </div>
  );
}
