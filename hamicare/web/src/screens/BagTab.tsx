// Bolsa: tudo o que a pessoa já tem. Em cima, o Hami (roupas) ou a casa (móveis) mostrando o resultado;
// embaixo, as categorias e a grade com ✓ no que está em uso. Tocar veste/tira ou coloca/guarda.
// A coleção (itens novos, álbum e oficina) também mora aqui.
import { memo, useState } from 'react';
import { Check, ShoppingBag } from 'lucide-react';
import { Hamster } from '../components/Hamster';
import { Room } from '../components/Room';
import { ItemIcon } from '../components/ItemIcon';
import { FLOOR_CSS, WALLPAPER_CSS } from '../components/Furniture';
import { Seg, toast } from '../components/ui';
import { HOUSE_KINDS, ITEMS, KIND_LABEL, WEARABLE_KINDS, type Item, type ItemKind } from '../data/items';
import { FURS } from '../data/fur';
import { periodOf } from '../data/lines';
import { isPremium, owned, placeItem, setFloor, setWallpaper, storeItem, unwear, updatePet, useApp, wear } from '../lib/store';
import { play } from '../lib/sound';
import { AlbumView, InventoryView, WorkshopView } from './Collection';
import type { State, WearSlot } from '../types';

type Part = 'roupas' | 'casa' | 'colecao';
type WearCat = 'tudo' | WearSlot | 'pelagem';
type HouseCat = 'tudo' | 'movel' | 'decor' | 'brinquedo' | 'parede' | 'piso';

const WEAR_CATS: [WearCat, string][] = [
  ['tudo', 'Tudo'],
  ['chapeu', 'Chapéus'],
  ['oculos', 'Óculos'],
  ['roupa', 'Roupas'],
  ['acessorio', 'Acessórios'],
  ['efeito', 'Efeitos'],
  ['pelagem', 'Pelagem'],
];
const HOUSE_CATS: [HouseCat, string][] = [
  ['tudo', 'Tudo'],
  ['movel', 'Móveis'],
  ['decor', 'Decoração'],
  ['brinquedo', 'Brinquedos'],
  ['parede', 'Parede'],
  ['piso', 'Piso'],
];

const BagTile = memo(function BagTile({ item, on, fur, onTap }: { item: Item; on: boolean; fur: string; onTap: (i: Item) => void }) {
  const flat = item.kind === 'parede' || item.kind === 'piso';
  return (
    <button className={`bag-tile ${on ? 'is-on' : ''}`} onClick={() => onTap(item)} aria-pressed={on} aria-label={item.name}>
      {flat ? <span className="bag-swatch" style={{ background: item.kind === 'parede' ? WALLPAPER_CSS[item.id] : FLOOR_CSS[item.id] }} /> : <ItemIcon item={item} size={46} fur={fur} />}
      {on && (
        <span className="bag-check" aria-hidden="true">
          <Check size={14} strokeWidth={4} />
        </span>
      )}
    </button>
  );
});

function ownedFurs(s: State) {
  const premium = isPremium(s);
  return FURS.filter((f) => (!f.price || owned(s, `fur:${f.id}`)) && (!f.plus || premium));
}

function Empty({ text, onStore }: { text: string; onStore: () => void }) {
  return (
    <div className="bag-empty">
      <span className="bag-empty-ico">
        <ShoppingBag size={34} />
      </span>
      <p>{text}</p>
      <button className="btn btn-primary" onClick={onStore}>
        Ir para a Loja
      </button>
    </div>
  );
}

function Chips<T extends string>({ value, list, onChange, label }: { value: T; list: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="bag-chips" role="tablist" aria-label={label}>
      {list.map(([id, txt]) => (
        <button key={id} role="tab" aria-selected={value === id} className={value === id ? 'is-on' : ''} onClick={() => onChange(id)}>
          {txt}
        </button>
      ))}
    </div>
  );
}

function Clothes({ onStore }: { onStore: () => void }) {
  const s = useApp();
  const [cat, setCat] = useState<WearCat>('tudo');
  const mine = ITEMS.filter((i) => WEARABLE_KINDS.includes(i.kind) && owned(s, i.id) && (cat === 'tudo' || i.kind === cat));
  const furs = ownedFurs(s);
  const tap = (i: Item) => {
    const slot = i.kind as WearSlot;
    if (s.pet.outfit[slot] === i.id) unwear(slot);
    else wear(i.id);
    play('toque');
  };
  return (
    <>
      <div className="bag-stage">
        <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} size={170} label={s.pet.name} />
      </div>
      <Chips value={cat} list={WEAR_CATS} onChange={setCat} label="Tipos de roupa" />
      {cat === 'pelagem' ? (
        <div className="bag-grid">
          {furs.map((f) => (
            <button key={f.id} className={`bag-tile ${s.pet.fur === f.id ? 'is-on' : ''}`} aria-pressed={s.pet.fur === f.id} aria-label={f.label} onClick={() => (updatePet({ fur: f.id }), play('toque'))}>
              <span className="icon-still">
                <Hamster fur={f.id} size={66} idle={false} label={f.label} />
              </span>
              {s.pet.fur === f.id && (
                <span className="bag-check" aria-hidden="true">
                  <Check size={14} strokeWidth={4} />
                </span>
              )}
            </button>
          ))}
        </div>
      ) : mine.length ? (
        <div className="bag-grid">
          {mine.map((i) => (
            <BagTile key={i.id} item={i} on={s.pet.outfit[i.kind as WearSlot] === i.id} fur={s.pet.fur} onTap={tap} />
          ))}
        </div>
      ) : (
        <Empty text={cat === 'tudo' ? 'Sua bolsa de roupas está vazia. Troque suas sementes por roupinhas na Loja!' : `Nenhum item de ${KIND_LABEL[cat as ItemKind].toLowerCase()} ainda. Que tal procurar na Loja?`} onStore={onStore} />
      )}
    </>
  );
}

function House({ onStore, onDecorate }: { onStore: () => void; onDecorate: () => void }) {
  const s = useApp();
  const [cat, setCat] = useState<HouseCat>('tudo');
  const kinds: ItemKind[] = cat === 'tudo' ? [...HOUSE_KINDS, 'parede', 'piso'] : [cat];
  const mine = ITEMS.filter((i) => kinds.includes(i.kind) && (owned(s, i.id) || s.house.items.some((h) => h.itemId === i.id) || s.house.wallpaper === i.id || s.house.floor === i.id));
  const onNow = (i: Item) => (i.kind === 'parede' ? s.house.wallpaper === i.id : i.kind === 'piso' ? s.house.floor === i.id : s.house.items.some((h) => h.itemId === i.id));
  const tap = (i: Item) => {
    play('toque');
    if (i.kind === 'parede') return setWallpaper(i.id);
    if (i.kind === 'piso') return setFloor(i.id);
    const here = s.house.items.filter((h) => h.itemId === i.id);
    if (here.length) {
      storeItem(here[here.length - 1].uid);
      return;
    }
    const r = placeItem(i.id);
    if (r === 'movido') toast('Trouxe da outra casa para esta.');
  };
  return (
    <>
      <div className="bag-room">
        <Room house={s.house} period={periodOf()} height={250}>
          {!s.adventure && <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood={s.pet.sleeping ? 'dormindo' : 'feliz'} size={110} label={s.pet.name} />}
        </Room>
        <button className="bag-decorate" onClick={onDecorate}>
          Arrumar a casa
        </button>
      </div>
      <Chips value={cat} list={HOUSE_CATS} onChange={setCat} label="Tipos de item da casa" />
      {mine.length ? (
        <div className="bag-grid">
          {mine.map((i) => (
            <BagTile key={i.id} item={i} on={onNow(i)} fur={s.pet.fur} onTap={tap} />
          ))}
        </div>
      ) : (
        <Empty text="Nada aqui ainda. Troque suas sementes por móveis e decoração na Loja!" onStore={onStore} />
      )}
    </>
  );
}

export function BagTab({ onStore, onDecorate }: { onStore: () => void; onDecorate: () => void }) {
  const s = useApp();
  const [part, setPart] = useState<Part>('roupas');
  const [col, setCol] = useState<'itens' | 'album' | 'oficina'>('itens');
  const fresh = Object.values(s.itemMeta ?? {}).filter((m) => !m.seen).length;
  return (
    <div className="bag">
      <header className="bag-head">
        <h1>Bolsa</h1>
      </header>
      <Seg
        value={part}
        onChange={setPart}
        label="Partes da bolsa"
        options={[
          { id: 'roupas', label: 'Roupas' },
          { id: 'casa', label: 'Casa' },
          { id: 'colecao', label: fresh ? `Coleção (${fresh})` : 'Coleção' },
        ]}
      />
      {part === 'roupas' && <Clothes onStore={onStore} />}
      {part === 'casa' && <House onStore={onStore} onDecorate={onDecorate} />}
      {part === 'colecao' && (
        <div className="grid gap-4">
          <Seg
            value={col}
            onChange={setCol}
            label="Coleção"
            options={[
              { id: 'itens', label: 'Itens' },
              { id: 'album', label: 'Álbum' },
              { id: 'oficina', label: 'Oficina' },
            ]}
          />
          {col === 'itens' && <InventoryView />}
          {col === 'album' && <AlbumView onWorkshop={() => setCol('oficina')} />}
          {col === 'oficina' && <WorkshopView />}
        </div>
      )}
    </div>
  );
}
