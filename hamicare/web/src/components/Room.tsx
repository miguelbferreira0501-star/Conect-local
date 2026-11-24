import { useRef, useState, type ReactNode } from 'react';
import { ArrowUpToLine, X } from 'lucide-react';
import type { House } from '../types';
import { itemById } from '../data/items';
import type { Period } from '../data/lines';
import { FLOOR_TONE, Furniture, Garland, WALLPAPER_CSS } from './Furniture';
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
  /** Tocar num móvel que o Hami sabe usar (cama, banheira, sofá…). */
  onUse?: (uid: string, kind: UseKind) => void;
  /** Modo de decorar: guardar o móvel selecionado ou trazer para a frente (botões em cima dele). */
  onRemove?: (uid: string) => void;
  onFront?: (uid: string) => void;
  /** O Hami usando um móvel agora: desenhado dentro dele, com a largura do móvel em px. */
  usage?: { uid: string; kind: UseKind; node: (w: number) => ReactNode } | null;
  /** Só este móvel pode ser arrastado (prévia da compra na Loja). */
  only?: string;
  /** O móvel da prévia: fica transparente, com a marca no chão verde (lugar livre) ou vermelha (ocupado). */
  ghost?: { uid: string; ok: boolean };
  /** Enquanto arrasta (para a marca mudar de cor na hora). */
  onDrag?: (uid: string, x: number, y: number) => void;
}

export type UseKind = 'deitar' | 'banho' | 'sentar' | 'correr' | 'balancar';
/** O que o Hami faz em cada móvel. */
export function useKindOf(itemId: string, svg?: string): UseKind | null {
  if (svg === 'k-banheira' || svg === 'k-lua-banheira') return 'banho';
  if (svg === 'k-cama' || svg === 'k-lua-cama' || svg === 'k-cama-dossel' || svg === 'k-almofada' || svg === 'caminha' || /^cama/.test(itemId)) return 'deitar';
  if (svg === 'k-sofa' || svg === 'k-poltrona' || svg === 'k-cadeira' || svg === 'k-banquinho' || /poltrona|cadeira|banco|trono|sofa/.test(itemId)) return 'sentar';
  if (svg === 'k-rodinha' || svg === 'k-lua-rodinha' || svg === 'rodinha') return 'correr';
  if (svg === 'k-balanco') return 'balancar';
  return null;
}

const GARLANDS = new Set(['pisca', 'bandeirinhas']);
/** Tapetes ficam no chão, sempre embaixo do Hami e dos móveis. */
const FLAT = /^tapete/;

/** Onde a peça está: tapete (deitado no chão), parede (pendurado) ou chão (em pé, com sombra). */
export function placeOf(itemId: string, svg: string | undefined, y: number): 'tapete' | 'parede' | 'chao' {
  const kit = svg ? KIT_PLACE[svg] : undefined;
  if (kit === 'tapete' || FLAT.test(itemId)) return 'tapete';
  if (kit === 'parede') return 'parede';
  return y < WALL_H - 4 ? 'parede' : 'chao';
}

/** Mais para o fundo, um pouquinho menor (dá profundidade ao cômodo). */
const depth = (y: number) => 0.8 + 0.2 * Math.min(1, Math.max(0, (y - WALL_H) / (100 - WALL_H)));

/**
 * A casa do Hami: um cômodo de verdade (parede lisa de uma cor só até o chão, chão em perspectiva,
 * janela com cortina) e os móveis posicionados em % (arrastáveis no modo de edição).
 */
export function Room({ house, period = 'tarde', height = 260, children, editing, selected, onSelect, onMove, onRemove, onFront, onUse, usage, only, ghost, onDrag, wide = 1 }: Props & { wide?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ uid: string; x: number; y: number } | null>(null);
  const grab = useRef({ dx: 0, dy: 0 });
  const trim = trimOf(house.wallpaper);

  function pos(e: React.PointerEvent) {
    const r = ref.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  }

  const items = [...house.items].sort((a, b) => a.z - b.z);
  // Chão em perspectiva: um plano deitado para trás que termina exatamente onde a parede acaba.
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
      <div className="room-window" aria-hidden="true">
        <RoomWindow trim={trim} period={period} lunar={house.wallpaper === 'p-lua' || house.floor === 'f-lua'} />
      </div>
      {/* Chão */}
      <div className="room-floor-wrap" style={{ perspective: `${height * 1.4}px`, perspectiveOrigin: `50% ${height * 0.3}px` }}>
        <div data-room-bg="1" className="room-floor" style={{ height: floorH, background: FLOOR_TONE[house.floor] ?? FLOOR_TONE['f-madeira'] }} />
      </div>

      {/* Sombras dos móveis no chão */}
      {items.map((it) => {
        const item = itemById(it.itemId);
        if (!item || GARLANDS.has(it.itemId)) return null;
        const live = drag?.uid === it.uid ? drag : it;
        const k = depth(live.y);
        if (ghost?.uid === it.uid) {
          const wall = placeOf(it.itemId, item.svg, live.y) === 'parede';
          return <span key={`s${it.uid}`} className={`room-foot ${ghost.ok ? 'is-ok' : 'is-bad'} ${wall ? 'is-wall' : ''}`} style={{ left: `${live.x}%`, top: `${live.y}%`, width: `${((item.size ?? 12) * (wall ? 1 : 1.05) * k) / wide}%` }} />;
        }
        if (placeOf(it.itemId, item.svg, live.y) !== 'chao') return null;
        return <span key={`s${it.uid}`} className="room-shadow" style={{ left: `${live.x}%`, top: `${live.y}%`, width: `${((item.size ?? 12) * 0.95 * k) / wide}%` }} />;
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
        const kind = !editing && onUse ? useKindOf(it.itemId, item.svg) : null;
        const use = usage?.uid === it.uid ? usage : null;
        const px = ((ref.current?.clientWidth ?? 390) * (item.size ?? 12)) / wide / 100;
        const movable = editing && (!only || only === it.uid);
        return (
          <div
            key={it.uid}
            role={editing || kind ? 'button' : 'img'}
            aria-label={kind ? `${item.name}: levar o Hami até lá` : item.name}
            tabIndex={editing || kind ? 0 : -1}
            onClick={kind ? () => onUse?.(it.uid, kind) : undefined}
            className={`room-item ${place === 'tapete' ? 'is-flat' : ''} ${movable ? 'is-editable' : ''} ${selected === it.uid ? 'is-selected' : ''} ${kind ? 'is-usable' : ''} ${ghost?.uid === it.uid ? 'is-ghost' : ''}`}
            style={{
              left: `${live.x}%`,
              top: `${live.y}%`,
              width: `${(item.size ?? 12) / wide}%`,
              scale: k === 1 ? undefined : String(k),
              zIndex: ghost?.uid === it.uid ? 300 : editing && selected === it.uid ? 300 : place === 'tapete' ? 3 : place === 'parede' ? 5 : 10 + Math.round(live.y),
              fontSize: `${((item.size ?? 12) * 0.82) / wide}cqw`,
            }}
            onPointerDown={(e) => {
              if (!movable) return;
              e.preventDefault();
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              onSelect?.(it.uid);
              // segura pelo ponto onde tocou (o móvel não pula para baixo do dedo)
              const p = pos(e);
              grab.current = { dx: it.x - p.x, dy: it.y - p.y };
              setDrag({ uid: it.uid, x: it.x, y: it.y });
            }}
            onPointerMove={(e) => {
              if (drag?.uid !== it.uid) return;
              const p = pos(e);
              const next = { uid: it.uid, x: p.x + grab.current.dx, y: p.y + grab.current.dy };
              setDrag(next);
              onDrag?.(it.uid, next.x, next.y);
            }}
            onPointerUp={() => {
              if (drag?.uid === it.uid) onMove?.(it.uid, drag.x, drag.y);
              setDrag(null);
            }}
          >
            <div className="room-item-art" style={it.flip ? { transform: 'scaleX(-1)' } : undefined}>
              {item.svg ? <Furniture id={item.svg} c1={item.c1} c2={item.c2} /> : <Glyph e={item.art ?? item.emoji} size="fill" />}
            </div>
            {use && <div className={`room-use use-${use.kind}`}>{use.node(px)}</div>}
            {use?.kind === 'banho' && item.svg && (
              <div className="room-use-front" aria-hidden="true">
                <Furniture id={item.svg} c1={item.c1} c2={item.c2} />
              </div>
            )}
            {editing && selected === it.uid && (onRemove || onFront) && (
              <span className="room-sel-actions">
                {onFront && (
                  <button aria-label={`Trazer ${item.name} pra frente`} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => (e.stopPropagation(), onFront(it.uid))}>
                    <ArrowUpToLine size={16} />
                  </button>
                )}
                {onRemove && (
                  <button className="is-remove" aria-label={`Tirar ${item.name} da casa`} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => (e.stopPropagation(), onRemove(it.uid))}>
                    <X size={17} strokeWidth={3} />
                  </button>
                )}
              </span>
            )}
          </div>
        );
      })}
      {children && (
        <div className={`pointer-events-none absolute inset-x-0 bottom-[3%] flex justify-center ${editing && !only ? 'room-pet-ghost' : ''}`} style={{ zIndex: 98 }}>
          <div className={editing ? 'pointer-events-none' : 'pointer-events-auto'}>{children}</div>
        </div>
      )}
      <div className="room-light" aria-hidden="true" />
    </div>
  );
}
