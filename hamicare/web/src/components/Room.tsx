import { useRef, useState, type ReactNode } from 'react';
import type { House } from '../types';
import { itemById } from '../data/items';
import type { Period } from '../data/lines';
import { FLOOR_CSS, Furniture, Garland, WALLPAPER_CSS } from './Furniture';

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

/** A casa do Hami: parede, piso e móveis posicionados em % (arrastáveis no modo de edição). */
export function Room({ house, period = 'tarde', height = 260, children, editing, selected, onSelect, onMove }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ uid: string; x: number; y: number } | null>(null);

  function pos(e: React.PointerEvent) {
    const r = ref.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  }

  const items = [...house.items].sort((a, b) => a.z - b.z);

  return (
    <div
      ref={ref}
      className={`room ${editing ? 'room-editing' : ''}`}
      style={{ height }}
      onPointerDown={(e) => {
        if (editing && e.target === e.currentTarget) onSelect?.(null);
      }}
    >
      <div className="absolute inset-x-0 top-0 h-[72%]" style={{ background: WALLPAPER_CSS[house.wallpaper] ?? WALLPAPER_CSS['p-creme'] }} />
      <div className="absolute inset-x-0 bottom-0 h-[28%]" style={{ background: FLOOR_CSS[house.floor] ?? FLOOR_CSS['f-madeira'] }} />
      <div className={`room-window room-window-${period}`} aria-hidden="true">
        <span>{period === 'noite' ? '🌙' : '☀️'}</span>
      </div>
      {items.map((it) => {
        const item = itemById(it.itemId);
        if (!item) return null;
        const live = drag?.uid === it.uid ? drag : it;
        if (GARLANDS.has(it.itemId)) {
          return (
            <div key={it.uid} className={`absolute inset-x-0 top-0 ${editing ? 'cursor-pointer' : ''}`} style={{ zIndex: 1 }} onPointerDown={() => editing && onSelect?.(it.uid)}>
              <Garland id={item.svg ?? it.itemId} />
              {editing && selected === it.uid && <div className="absolute inset-x-2 top-0 h-10 rounded-xl ring-2 ring-[var(--accent)]" />}
            </div>
          );
        }
        return (
          <div
            key={it.uid}
            role={editing ? 'button' : 'img'}
            aria-label={item.name}
            tabIndex={editing ? 0 : -1}
            className={`room-item ${editing ? 'is-editable' : ''} ${selected === it.uid ? 'is-selected' : ''}`}
            style={{ left: `${live.x}%`, top: `${live.y}%`, width: `${item.size ?? 12}%`, zIndex: Math.round(live.y), fontSize: `${(item.size ?? 12) * 0.82}cqw` }}
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
            {item.svg ? <Furniture id={item.svg} /> : <span className="block select-none text-center leading-none">{item.emoji}</span>}
          </div>
        );
      })}
      {children && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[3%] flex justify-center" style={{ zIndex: 88 }}>
          <div className="pointer-events-auto">{children}</div>
        </div>
      )}
      {period === 'noite' && <div className="room-night" aria-hidden="true" />}
    </div>
  );
}
