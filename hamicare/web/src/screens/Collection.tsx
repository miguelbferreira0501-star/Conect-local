import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Pet } from '../components/Pet';
import { Room } from '../components/Room';
import { Modal, Seed, Seeds, toast } from '../components/ui';
import { PostcardView } from '../components/Celebrations';
import { ITEMS, SEASONS, currentSeason, inSeason, type Item } from '../data/items';
import { PLACES } from '../data/places';
import { periodOf } from '../data/lines';
import { buy, equip, isEquipped, stageOf, unequip, useApp, type Postcard } from '../lib/store';

type Tab = 'loja' | 'guarda' | 'album';

export function Collection() {
  const s = useApp();
  const [tab, setTab] = useState<Tab>('loja');

  return (
    <div className="grid gap-4">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Mimos pro seu xodó</p>
          <h1 className="font-display text-[30px] font-bold leading-tight">Coleção</h1>
        </div>
        <Seeds value={s.seeds} />
      </header>

      <Room period={periodOf()} decor={s.decor} height={190}>
        <Pet color={s.petColor} stage={stageOf(s.xp)} hat={s.hat} acc={s.acc} size={130} label={s.petName} />
      </Room>

      <div className="seg" role="group" aria-label="Seções">
        <button aria-pressed={tab === 'loja'} onClick={() => setTab('loja')}>
          Loja
        </button>
        <button aria-pressed={tab === 'guarda'} onClick={() => setTab('guarda')}>
          Meus itens
        </button>
        <button aria-pressed={tab === 'album'} onClick={() => setTab('album')}>
          Álbum
        </button>
      </div>

      {tab === 'loja' && <Shop />}
      {tab === 'guarda' && <Wardrobe />}
      {tab === 'album' && <Album />}
    </div>
  );
}

function Shop() {
  const s = useApp();
  const season = currentSeason();
  const forSale = ITEMS.filter((i) => !i.souvenir && inSeason(i) && !s.inventory.includes(i.id));
  const seasonal = forSale.filter((i) => i.season);
  const regular = forSale.filter((i) => !i.season);

  return (
    <div className="grid gap-4">
      {season && seasonal.length > 0 && (
        <section className="grid gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-display text-[20px] font-bold leading-tight">{SEASONS[season].label}</h2>
            <span className="text-[13px] font-bold text-muted">{SEASONS[season].until}</span>
          </div>
          <ItemGrid items={seasonal} />
        </section>
      )}
      <section className="grid gap-2">
        <h2 className="font-display text-[20px] font-bold leading-tight">Sempre na loja</h2>
        {regular.length ? <ItemGrid items={regular} /> : <p className="text-muted">Você já tem tudo! Novidades chegam nas temporadas.</p>}
      </section>
      <p className="text-[14px] text-muted">Ganhe sementinhas fazendo cuidados. Lembrancinhas de viagem só vêm dos passeios.</p>
    </div>
  );
}

function ItemGrid({ items }: { items: Item[] }) {
  const s = useApp();
  return (
    <ul className="grid grid-cols-2 gap-2.5">
      {items.map((item) => {
        const short = s.seeds < item.price;
        return (
          <li key={item.id} className="card grid gap-2 p-3">
            <ItemPreview item={item} />
            <p className="text-[15px] font-extrabold leading-tight">{item.name}</p>
            <button
              className="btn btn-soft min-h-[40px] px-3 text-[15px]"
              disabled={short}
              onClick={() => {
                if (buy(item.id)) toast(`${item.name}: já tá usando!`);
              }}
              aria-label={`Comprar ${item.name} por ${item.price} sementinhas`}
            >
              <Seed /> {item.price}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ItemPreview({ item }: { item: Item }) {
  const s = useApp();
  if (item.slot === 'decor') {
    return (
      <div className="grid h-[84px] place-items-center rounded-2xl bg-surface2">
        {item.emoji ? (
          <span className="text-[44px] leading-none" role="img" aria-label={item.name}>
            {item.emoji}
          </span>
        ) : (
          <div className="h-full w-full overflow-hidden rounded-2xl">
            <Room period="tarde" decor={{ teto: item.id }} height={84} />
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="grid h-[84px] place-items-center rounded-2xl bg-surface2">
      <Pet
        color={s.petColor}
        stage={3}
        hat={item.slot === 'chapeu' ? item.id : null}
        acc={item.slot === 'acessorio' ? item.id : null}
        size={84}
        idle={false}
        label={item.name}
      />
    </div>
  );
}

function Wardrobe() {
  const s = useApp();
  const owned = ITEMS.filter((i) => s.inventory.includes(i.id));
  if (!owned.length) {
    return <p className="card p-5 text-muted">Seus itens aparecem aqui. Que tal escolher o primeiro na loja? Você começou com 20 sementinhas.</p>;
  }
  return (
    <ul className="grid grid-cols-2 gap-2.5">
      {owned.map((item) => {
        const on = isEquipped(s, item.id);
        return (
          <li key={item.id} className="card grid gap-2 p-3">
            <ItemPreview item={item} />
            <p className="text-[15px] font-extrabold leading-tight">{item.name}</p>
            <button className={`btn min-h-[40px] px-3 text-[15px] ${on ? 'btn-ghost' : 'btn-leaf'}`} onClick={() => (on ? unequip(item.id) : equip(item.id))}>
              {on ? 'Tirar' : 'Usar'}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Album() {
  const s = useApp();
  const [open, setOpen] = useState<Postcard | null>(null);
  const byPlace = new Map(s.postcards.map((p) => [p.placeId, p]));

  return (
    <div className="grid gap-3">
      <p className="text-[15px] text-muted tabular-nums">
        {byPlace.size} de {PLACES.length} lugares do Brasil visitados. Encha a disposição do seu xodó pra ele viajar.
      </p>
      <ul className="grid grid-cols-2 gap-2.5">
        {PLACES.map((place) => {
          const card = byPlace.get(place.id);
          return (
            <li key={place.id}>
              {card ? (
                <button
                  className="postcard-tile"
                  style={{ background: `linear-gradient(160deg, ${place.colors[0]}, ${place.colors[1]})` }}
                  onClick={() => setOpen(card)}
                >
                  <span className="text-[34px] leading-none" aria-hidden="true">
                    {place.emoji}
                  </span>
                  <span className="text-left text-[15px] font-extrabold leading-tight text-[#1e2b24]">
                    {place.name}
                    <span className="block text-[12px] opacity-70">{place.uf}</span>
                  </span>
                </button>
              ) : (
                <div className="postcard-tile postcard-locked" aria-label={`Ainda não visitado, ${place.uf}`}>
                  <Lock size={22} className="text-muted" aria-hidden="true" />
                  <span className="text-left text-[15px] font-extrabold leading-tight text-muted">
                    ???
                    <span className="block text-[12px]">{place.uf}</span>
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <Modal open={!!open} onClose={() => setOpen(null)} label="Cartão-postal">
        {open && (
          <>
            <PostcardView card={open} />
            <div className="px-5 pb-5">
              <button className="btn btn-ghost w-full" onClick={() => setOpen(null)}>
                Fechar
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
