// Comprar móvel vendo ele no quarto: a peça aparece transparente dentro da casa, com uma marca no chão
// (verde = lugar livre, vermelha = ocupado). A pessoa arrasta para onde quiser, vira para o outro lado,
// escolhe a cor e compra: o móvel já fica naquele lugar.
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Crown, FlipHorizontal2, Lock } from 'lucide-react';
import { Hamster } from './Hamster';
import { Room, placeOf } from './Room';
import { ItemIcon } from './ItemIcon';
import { Seed, toast } from './ui';
import { WALL_H } from './room/theme';
import { ITEMS, type Item } from '../data/items';
import { periodOf } from '../data/lines';
import { canBuy, owned, placeAt, useApp } from '../lib/store';
import { play } from '../lib/sound';
import type { House, HouseItem } from '../types';

const GHOST = 'provador';
const GARLANDS = new Set(['pisca', 'bandeirinhas']);

/** As cores do mesmo móvel (mesmo desenho, cores diferentes). */
export function variantsOf(item: Item): Item[] {
  if (!item.svg) return [item];
  const list = ITEMS.filter((i) => i.kind === item.kind && i.svg === item.svg && !i.souvenir && !i.chestOnly && !i.arena && (i.price > 0 || i.id === item.id));
  return list.length ? list : [item];
}

type Pos = { x: number; y: number };
const half = (item: Item, y: number) => ((item.size ?? 12) * (0.8 + 0.2 * Math.min(1, Math.max(0, (y - WALL_H) / (100 - WALL_H))))) / 2;

/** Mantém a peça no lugar dela: quadros e relógios na parede, o resto no chão (dentro do cômodo). */
function clampFor(item: Item, p: Pos): Pos {
  const wallOnly = placeOf(item.id, item.svg, 0) === 'parede' && placeOf(item.id, item.svg, 99) === 'parede';
  const flat = placeOf(item.id, item.svg, 99) === 'tapete';
  const y = wallOnly ? Math.min(WALL_H - 6, Math.max(18, p.y)) : flat ? Math.min(99, Math.max(WALL_H + 12, p.y)) : Math.min(99, Math.max(WALL_H + 6, p.y));
  const hw = half(item, y);
  return { x: Math.min(100 - hw - 1, Math.max(hw + 1, p.x)), y };
}

/** O lugar está livre? (não encosta em outro móvel do mesmo tipo: chão com chão, parede com parede, tapete com tapete) */
function spotOk(house: House, item: Item, p: Pos): boolean {
  const mine = placeOf(item.id, item.svg, p.y);
  const hw = half(item, p.y);
  return !house.items.some((it: HouseItem) => {
    if (GARLANDS.has(it.itemId)) return false;
    const other = ITEMS.find((i) => i.id === it.itemId);
    if (!other) return false;
    const kind = placeOf(other.id, other.svg, it.y);
    if (kind !== mine) return false;
    const ow = half(other, it.y);
    const dy = Math.abs(it.y - p.y);
    const near = mine === 'parede' ? dy < ((item.size ?? 12) + (other.size ?? 12)) * 0.32 : dy < 9;
    return near && Math.abs(it.x - p.x) < (hw + ow) * 0.82;
  });
}

/** Primeiro lugar livre perto do meio do cômodo. */
function freeSpot(house: House, item: Item): Pos {
  const wall = placeOf(item.id, item.svg, 0) === 'parede' && placeOf(item.id, item.svg, 99) === 'parede';
  const flat = placeOf(item.id, item.svg, 99) === 'tapete';
  const ys = wall ? [34, 26, 42] : flat ? [92, 86, 97] : [82, 90, 74, 96];
  const xs = [50, 36, 64, 26, 74, 18, 82];
  for (const y of ys) for (const x of xs) {
    const p = clampFor(item, { x, y });
    if (spotOk(house, item, p)) return p;
  }
  return clampFor(item, { x: 50, y: ys[0] });
}

export function PlaceFurniture({ item, onPick, onClose, onPlus }: { item: Item; onPick: (item: Item) => void; onClose: () => void; onPlus: () => void }) {
  const s = useApp();
  const variants = useMemo(() => variantsOf(item), [item.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [pos, setPos] = useState<Pos>(() => freeSpot(s.house, item));
  const [flip, setFlip] = useState(false);
  // trocar a cor mantém o lugar
  useEffect(() => setPos((p) => clampFor(item, p)), [item.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const ok = spotOk(s.house, item, pos);
  const res = canBuy(s, item.id);
  const kids = s.profile.ageGroup === 'ate12';
  const mine = owned(s, item.id);
  const ghost: HouseItem = { uid: GHOST, itemId: item.id, x: pos.x, y: pos.y, z: 999, flip };
  const house: House = { ...s.house, items: [...s.house.items, ghost] };
  const move = (_: string, x: number, y: number) => setPos(clampFor(item, { x, y }));
  // O quarto é maior que a tela (dá para arrastar para os lados); abre centralizado na peça e anda junto
  // quando a peça chega perto da borda.
  const scroller = useRef<HTMLDivElement>(null);
  const center = (x: number, smooth = false) => {
    const el = scroller.current;
    if (!el) return;
    const left = (x / 100) * el.scrollWidth - el.clientWidth / 2;
    el.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
  };
  useEffect(() => center(pos.x), []); // eslint-disable-line react-hooks/exhaustive-deps
  const drag = (uid: string, x: number, y: number) => {
    move(uid, x, y);
    const el = scroller.current;
    if (!el) return;
    const px = (x / 100) * el.scrollWidth - el.scrollLeft;
    if (px < 60) el.scrollLeft -= 10;
    else if (px > el.clientWidth - 60) el.scrollLeft += 10;
  };

  function confirm() {
    if (!ok) {
      play('erro');
      return toast('Esse lugar está ocupado. Arraste até a marca ficar verde.');
    }
    const r = placeAt(item.id, pos.x, pos.y, flip);
    if (r === 'ok') {
      play('compra');
      toast(mine ? 'Mudou de lugar!' : `${item.name} já está na sua casa!`);
      onClose();
    } else if (r === 'sem-sementes') toast(`Faltam ${item.price - s.coins} sementes`);
  }

  return (
    <div className="fitting place" role="dialog" aria-modal="true" aria-label={item.name}>
      <div className="pl-room">
        <div ref={scroller} className="pl-scroll">
          <div className="pl-wide">
            <Room house={house} period={periodOf()} height={420} editing only={GHOST} ghost={{ uid: GHOST, ok }} onDrag={drag} onMove={move}>
              <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood="feliz" size={150} label={s.pet.name} />
            </Room>
          </div>
        </div>
        <button className="pl-back" onClick={onClose} aria-label="Voltar">
          <ChevronLeft size={24} />
        </button>
        <span className="pl-coins">
          <Seed size={16} /> {s.coins}
        </span>
        <button className="pl-flip" onClick={() => (setFlip((f) => !f), play('toque'))} aria-label="Virar para o outro lado" data-sound="none">
          <FlipHorizontal2 size={22} strokeWidth={2.4} />
        </button>
        <p className={`pl-hint ${ok ? '' : 'is-bad'}`}>{ok ? 'Arraste a peça para onde quiser' : 'Lugar ocupado: arraste até ficar verde'}</p>
      </div>
      <div className="pl-panel">
        <p className="pl-title">{variants.length > 1 ? 'Escolha a cor que você mais gosta!' : item.name}</p>
        {res === 'plus' ? (
          <button className="pl-buy is-plus" onClick={kids ? undefined : onPlus} disabled={kids}>
            <Crown size={18} /> {kids ? 'Exclusivo do HamiCare+' : 'Liberar com o Plus'}
          </button>
        ) : res === 'nivel' ? (
          <span className="pl-buy is-off">
            <Lock size={16} /> Libera no nível {item.level}
          </span>
        ) : (
          <button className={`pl-buy ${ok ? '' : 'is-blocked'}`} disabled={res === 'sem-sementes'} onClick={confirm}>
            {mine ? (
              'Colocar aqui'
            ) : (
              <>
                <Seed size={20} /> {item.price}
              </>
            )}
          </button>
        )}
        {res === 'sem-sementes' && <p className="pl-note">Faltam {item.price - s.coins} sementes</p>}
        {variants.length > 1 && (
          <div className="pl-grid">
            {variants.map((v) => (
              <button key={v.id} className={`pl-var ${v.id === item.id ? 'is-on' : ''}`} onClick={() => (play('toque'), onPick(v))} aria-label={v.name} data-sound="none">
                <ItemIcon item={v} size={46} />
                {owned(s, v.id) && <span className="pl-own">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
