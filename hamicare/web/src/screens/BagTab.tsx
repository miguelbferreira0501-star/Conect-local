// Bolsa: tudo o que a pessoa já tem, no jeito de "provador" dos apps de pet. Em cima, o quarto do Lumbi com ele
// dentro (mostrando o resultado na hora); logo abaixo, o nome dele (ou "Esconder casa" nas roupas), Foto e
// Favoritos; depois a barra de categorias com ícones e a grade com ✓ no que está em uso. Tocar num item abre a
// folha de baixo para vestir/tirar ou colocar/guardar (e favoritar). Embaixo, Roupas / Casa / Coleção.
import { memo, useEffect, useRef, useState, type ReactNode } from 'react';
import { Blocks, BrickWall, Camera, Check, Crown, Eye, EyeOff, Gem, Glasses, Grid2x2, Heart, Lamp, LayoutGrid, Library, Palette, PawPrint, Shirt, Sofa, Sparkles, ToyBrick, X } from 'lucide-react';
import { Hamster } from '../components/Hamster';
import { Room } from '../components/Room';
import { ItemIcon } from '../components/ItemIcon';
import { FLOOR_CSS, WALLPAPER_CSS } from '../components/Furniture';
import { Seg, toast } from '../components/ui';
import { HOUSE_KINDS, ITEMS, KIND_LABEL, WEARABLE_KINDS, type Item, type ItemKind } from '../data/items';
import { FURS, type Fur } from '../data/fur';
import { periodOf } from '../data/lines';
import { isPremium, owned, placeItem, setFloor, setWallpaper, storeItem, takePhoto, toggleFavorite, unwear, updatePet, useApp, wear } from '../lib/store';
import { rarityOf } from '../shared/game/catalog';
import { play } from '../lib/sound';
import { AlbumView, InventoryView, WorkshopView } from './Collection';
import type { State, WearSlot } from '../types';

type Part = 'roupas' | 'casa' | 'colecao';
type WearCat = 'tudo' | 'fav' | WearSlot | 'pelagem';
type HouseCat = 'tudo' | 'fav' | 'movel' | 'decor' | 'brinquedo' | 'parede' | 'piso';

const WEAR_CATS: [WearCat, string, ReactNode][] = [
  ['tudo', 'Tudo', <LayoutGrid key="a" />],
  ['fav', 'Favoritos', <Heart key="b" />],
  ['roupa', 'Roupas', <Shirt key="c" />],
  ['chapeu', 'Chapéus', <Crown key="d" />],
  ['oculos', 'Óculos', <Glasses key="e" />],
  ['acessorio', 'Acessórios', <Gem key="f" />],
  ['efeito', 'Efeitos', <Sparkles key="g" />],
  ['pelagem', 'Pelagem', <Palette key="h" />],
];
const HOUSE_CATS: [HouseCat, string, ReactNode][] = [
  ['tudo', 'Tudo', <LayoutGrid key="a" />],
  ['fav', 'Favoritos', <Heart key="b" />],
  ['movel', 'Móveis', <Sofa key="c" />],
  ['decor', 'Decoração', <Lamp key="d" />],
  ['brinquedo', 'Brinquedos', <ToyBrick key="e" />],
  ['parede', 'Parede', <BrickWall key="f" />],
  ['piso', 'Piso', <Grid2x2 key="g" />],
];
const RARITY: Record<string, string> = { comum: 'Comum', incomum: 'Incomum', raro: 'Raro', epico: 'Épico', lendario: 'Lendário' };

/** O que aparece na grade: um item ou uma pelagem. */
type Entry = { kind: 'item'; item: Item } | { kind: 'fur'; fur: Fur };
const entryId = (e: Entry) => (e.kind === 'item' ? e.item.id : `fur:${e.fur.id}`);

const Tile = memo(function Tile({ entry, on, fur, onTap }: { entry: Entry; on: boolean; fur: string; onTap: (e: Entry) => void }) {
  const it = entry.kind === 'item' ? entry.item : null;
  const flat = it && (it.kind === 'parede' || it.kind === 'piso');
  return (
    <button className={`bag2-tile ${on ? 'is-on' : ''}`} onClick={() => onTap(entry)} aria-pressed={on} aria-label={it ? it.name : `Pelagem ${entry.kind === 'fur' ? entry.fur.label : ''}`}>
      {it ? (
        flat ? (
          <span className="bag-swatch" style={{ background: it.kind === 'parede' ? WALLPAPER_CSS[it.id] : FLOOR_CSS[it.id] }} />
        ) : (
          <ItemIcon item={it} size={54} fur={fur} />
        )
      ) : (
        entry.kind === 'fur' && (
          <span className="icon-still">
            <Hamster fur={entry.fur.id} size={70} idle={false} label={entry.fur.label} />
          </span>
        )
      )}
      {on && (
        <span className="bag2-check" aria-hidden="true">
          <Check size={13} strokeWidth={4} />
        </span>
      )}
    </button>
  );
});

function ownedFurs(s: State) {
  const premium = isPremium(s);
  return FURS.filter((f) => (!f.price || owned(s, `fur:${f.id}`)) && (!f.plus || premium));
}

/** Carregando a categoria: o Lumbi pequenininho com pontinhos pulando. */
function Loading() {
  return (
    <div className="bag2-loading" aria-hidden="true">
      <span className="icon-still">
        <Hamster fur="caramelo" size={56} idle={false} label="" />
      </span>
      <span className="bag2-dots">
        <i />
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

/** Folha de baixo de um item: desenho, nome, tipo/raridade, favorito e o botão de usar. */
function Sheet({ entry, on, fav, onPrimary, onFav, onClose, fur }: { entry: Entry; on: boolean; fav: boolean; onPrimary: () => void; onFav: () => void; onClose: () => void; fur: string }) {
  const it = entry.kind === 'item' ? entry.item : null;
  const flat = it && (it.kind === 'parede' || it.kind === 'piso');
  const name = it ? it.name : entry.kind === 'fur' ? `Pelagem ${entry.fur.label}` : '';
  const sub = it ? (it.price === 0 && !it.souvenir && !it.arena ? 'Item de começo' : `${KIND_LABEL[it.kind]} · ${RARITY[rarityOf(it)] ?? ''}`) : 'Pelagem';
  const label = !it
    ? on
      ? 'Em uso'
      : 'Usar esta pelagem'
    : WEARABLE_KINDS.includes(it.kind)
      ? on
        ? 'Tirar'
        : 'Vestir'
      : flat
        ? on
          ? 'Em uso'
          : 'Usar na casa'
        : on
          ? 'Guardar'
          : 'Colocar na casa';
  const disabled = on && (!it || !!flat);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="bag2-sheet-wrap" onClick={onClose}>
      <div className="bag2-sheet" role="dialog" aria-modal="true" aria-label={name} onClick={(e) => e.stopPropagation()}>
        <button className="bag2-sheet-x" onClick={onClose} aria-label="Fechar">
          <X size={18} strokeWidth={3} />
        </button>
        <div className="bag2-sheet-card">
          <span className="bag2-sheet-art">
            {it ? (
              flat ? (
                <span className="bag-swatch" style={{ background: it.kind === 'parede' ? WALLPAPER_CSS[it.id] : FLOOR_CSS[it.id] }} />
              ) : (
                <ItemIcon item={it} size={58} fur={fur} />
              )
            ) : (
              entry.kind === 'fur' && (
                <span className="icon-still">
                  <Hamster fur={entry.fur.id} size={62} idle={false} label="" />
                </span>
              )
            )}
          </span>
          <span className="min-w-0 flex-1">
            <b>{name}</b>
            <small>{sub}</small>
          </span>
          <button className={`bag2-fav ${fav ? 'is-on' : ''}`} onClick={onFav} aria-pressed={fav} aria-label={fav ? 'Tirar dos favoritos' : 'Favoritar'}>
            <Heart size={20} strokeWidth={2.6} />
          </button>
        </div>
        <button className="bag2-primary" onClick={onPrimary} disabled={disabled}>
          {label}
        </button>
      </div>
    </div>
  );
}

function Closet({ part, onStore, onDecorate }: { part: 'roupas' | 'casa'; onStore: () => void; onDecorate: () => void }) {
  const s = useApp();
  const [wcat, setWcat] = useState<WearCat>('tudo');
  const [hcat, setHcat] = useState<HouseCat>('tudo');
  const [hide, setHide] = useState(false);
  const [open, setOpen] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const favs = s.favorites ?? [];
  const cat = part === 'roupas' ? wcat : hcat;
  const cats = part === 'roupas' ? WEAR_CATS : HOUSE_CATS;

  // Trocar de categoria: o bonequinho "carregando" aparece um instantinho.
  function pick(c: string) {
    if (c === cat) return;
    play('toque');
    if (part === 'roupas') setWcat(c as WearCat);
    else setHcat(c as HouseCat);
    setLoading(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setLoading(false), 420);
  }
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const inHouse = (i: Item) => (i.kind === 'parede' ? s.house.wallpaper === i.id : i.kind === 'piso' ? s.house.floor === i.id : s.house.items.some((h) => h.itemId === i.id));
  const isOn = (e: Entry) => (e.kind === 'fur' ? s.pet.fur === e.fur.id : WEARABLE_KINDS.includes(e.item.kind) ? s.pet.outfit[e.item.kind as WearSlot] === e.item.id : inHouse(e.item));

  let list: Entry[];
  if (part === 'roupas') {
    const furs: Entry[] = ownedFurs(s).map((f) => ({ kind: 'fur', fur: f }));
    const items: Entry[] = ITEMS.filter((i) => WEARABLE_KINDS.includes(i.kind) && owned(s, i.id)).map((i) => ({ kind: 'item', item: i }));
    list =
      wcat === 'pelagem'
        ? furs
        : wcat === 'fav'
          ? [...items, ...furs].filter((e) => favs.includes(entryId(e)))
          : wcat === 'tudo'
            ? items
            : items.filter((e) => e.kind === 'item' && e.item.kind === wcat);
  } else {
    const kinds: ItemKind[] = [...HOUSE_KINDS, 'parede', 'piso'];
    const items: Entry[] = ITEMS.filter((i) => kinds.includes(i.kind) && (owned(s, i.id) || inHouse(i))).map((i) => ({ kind: 'item', item: i }));
    list = hcat === 'tudo' ? items : hcat === 'fav' ? items.filter((e) => favs.includes(entryId(e))) : items.filter((e) => e.kind === 'item' && e.item.kind === hcat);
  }

  function use(e: Entry) {
    const on = isOn(e);
    if (e.kind === 'fur') {
      if (!on) {
        updatePet({ fur: e.fur.id });
        toast(`Pelagem ${e.fur.label}!`);
      }
    } else {
      const i = e.item;
      if (WEARABLE_KINDS.includes(i.kind)) {
        if (on) unwear(i.kind as WearSlot);
        else wear(i.id);
        toast(on ? `Tirou: ${i.name}` : `Vestiu: ${i.name}`);
        play('vestir');
      } else if (i.kind === 'parede') {
        setWallpaper(i.id);
        toast(`Parede nova: ${i.name}`);
      } else if (i.kind === 'piso') {
        setFloor(i.id);
        toast(`Piso novo: ${i.name}`);
      } else {
        const here = s.house.items.filter((h) => h.itemId === i.id);
        if (here.length) {
          storeItem(here[here.length - 1].uid);
          toast(`Guardou: ${i.name}`);
        } else {
          const r = placeItem(i.id);
          toast(r === 'movido' ? 'Trouxe da outra casa para esta.' : `Colocou na casa: ${i.name}`);
          play('colocar');
        }
      }
    }
    setOpen(null);
  }

  const photo = () => {
    takePhoto(part === 'roupas' ? `${s.pet.name} de look novo` : `${s.pet.name} em casa`, 'casa', 'animado');
    play('foto');
    toast('Foto guardada no álbum!');
  };

  const showRoom = !(part === 'roupas' && hide);
  return (
    <>
      {/* o quarto com o Lumbi dentro (nas roupas dá para esconder a casa e ver só ele) */}
      <div className={`bag2-stage ${showRoom ? '' : 'is-plain'}`}>
        {showRoom ? (
          <Room house={s.house} period={periodOf()} height={300}>
            {!s.adventure && <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood="feliz" size={150} label={s.pet.name} />}
          </Room>
        ) : (
          <div className="bag2-plain">
            <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood="feliz" size={220} label={s.pet.name} />
          </div>
        )}
        {part === 'casa' && (
          <button className="bag2-arrange" onClick={onDecorate}>
            <Blocks size={16} /> Arrumar
          </button>
        )}
      </div>
      <div className="bag2-bar">
        {part === 'roupas' ? (
          <button className="bag2-act" onClick={() => (setHide((h) => !h), play('toque'))} aria-pressed={hide}>
            {hide ? <Eye size={22} /> : <EyeOff size={22} />}
            <span>{hide ? 'Mostrar casa' : 'Esconder casa'}</span>
          </button>
        ) : (
          <span className="bag2-act is-name">
            <PawPrint size={22} />
            <span>{s.pet.name}</span>
          </span>
        )}
        <span className="flex-1" />
        <button className="bag2-act" onClick={photo}>
          <Camera size={22} />
          <span>Foto</span>
        </button>
        <button className={`bag2-act ${cat === 'fav' ? 'is-on' : ''}`} onClick={() => pick(cat === 'fav' ? 'tudo' : 'fav')} aria-pressed={cat === 'fav'}>
          <Heart size={22} />
          <span>Favoritos</span>
        </button>
      </div>
      <div className="bag2-cats" role="tablist" aria-label={part === 'roupas' ? 'Tipos de roupa' : 'Tipos de item da casa'}>
        {cats.map(([id, label, icon]) => (
          <button key={id} role="tab" aria-selected={cat === id} aria-label={label} title={label} className={cat === id ? 'is-on' : ''} onClick={() => pick(id)}>
            {icon}
          </button>
        ))}
      </div>
      <div className="bag2-list">
        {loading && <Loading />}
        {list.length ? (
          <div className={`bag2-grid ${loading ? 'is-loading' : ''}`}>
            {list.map((e) => (
              <Tile key={entryId(e)} entry={e} on={isOn(e)} fur={s.pet.fur} onTap={setOpen} />
            ))}
          </div>
        ) : (
          !loading && (
            <div className="bag2-empty">
              <p>{cat === 'fav' ? 'Toque no coração de um item para ele aparecer aqui.' : 'Troque suas sementes por itens na Loja.'}</p>
              {cat !== 'fav' && (
                <button className="bag2-visit" onClick={onStore}>
                  Visitar a Loja
                </button>
              )}
            </div>
          )
        )}
      </div>
      {open && (
        <Sheet
          entry={open}
          on={isOn(open)}
          fav={favs.includes(entryId(open))}
          fur={s.pet.fur}
          onPrimary={() => use(open)}
          onFav={() => {
            const on = toggleFavorite(entryId(open));
            play('toque');
            toast(on ? 'Foi para os favoritos' : 'Saiu dos favoritos');
          }}
          onClose={() => setOpen(null)}
        />
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
    <div className="bag2">
      {part === 'colecao' ? (
        <div className="grid gap-4">
          <header className="bag-head">
            <h1>Coleção</h1>
          </header>
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
      ) : (
        <Closet key={part} part={part} onStore={onStore} onDecorate={onDecorate} />
      )}
      {/* Roupas / Casa / Coleção, embaixo (como o provador dos apps de pet) */}
      <nav className="bag2-switch" aria-label="Partes da bolsa">
        {(
          [
            ['roupas', 'Roupas', <Shirt key="r" />],
            ['casa', 'Casa', <Sofa key="c" />],
            ['colecao', fresh ? `Coleção (${fresh})` : 'Coleção', <Library key="l" />],
          ] as [Part, string, ReactNode][]
        ).map(([id, label, icon]) => (
          <button key={id} className={part === id ? 'is-on' : ''} aria-pressed={part === id} onClick={() => (setPart(id), play('toque'))}>
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
