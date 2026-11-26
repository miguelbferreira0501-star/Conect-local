// Loja (aba própria): só as lojinhas (vendinha, roupas, casa, comida e baús). As coleções temáticas e as casas
// prontas continuam aqui para as lojinhas usarem.
// As sementes só aparecem aqui, onde se compra.
import { useState } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { FLOOR_CSS, WALLPAPER_CSS } from '../components/Furniture';
import { play } from '../lib/sound';
import { STYLES, itemById, stylePrice, type Item, type StyleSet } from '../data/items';
import { Room } from '../components/Room';
import { Hamster } from '../components/Hamster';
import type { House } from '../types';

import { ItemIcon } from '../components/ItemIcon';
import { Coins, Seed, toast } from '../components/ui';
import { buyStyle, isPremium, owned, useApp } from '../lib/store';
import { ShopHub, TryOn } from './Shop';

function ThemeCard({ st }: { st: StyleSet }) {
  const s = useApp();
  const price = stylePrice(st, (id) => owned(s, id));
  const house: House = { wallpaper: st.wallpaper, floor: st.floor, items: st.items.map((it, i) => ({ uid: `${st.id}-${i}`, itemId: it.itemId, x: it.x, y: it.y, z: i + 1 })) };
  const outfit = { ...s.pet.outfit, roupa: st.outfit!.roupa, chapeu: st.outfit!.chapeu ?? s.pet.outfit.chapeu };
  const pieces = [st.outfit!.roupa, st.outfit!.chapeu, ...st.items.map((i) => i.itemId)].filter((id): id is string => !!id);
  const buy = () => {
    const r = buyStyle(st.id);
    if (r === 'ok') play('compra');
    else play('erro');
    toast(r === 'ok' ? `${st.name}: casa arrumada e roupinha vestida!` : r === 'sem-sementes' ? `Faltam ${price - s.coins} sementes para essa coleção.` : 'Essa coleção é do Lumbi+.');
  };
  return (
    <article className="st-theme" style={{ background: st.tone }}>
      <div className="st-theme-room">
        <Room house={house} period="tarde" height={200}>
          <Hamster fur={s.pet.fur} outfit={outfit} mood="feliz" size={86} growth={1} label={s.pet.name} />
        </Room>
      </div>
      <div className="st-theme-info">
        <b>{st.name}</b>
        <small>
          {st.items.length} móveis + roupinha combinando · 10% off
        </small>
        <div className="st-theme-pieces">
          {pieces.map((id) => {
            const it = itemById(id);
            return it ? (
              <span key={id} className={owned(s, id) ? 'is-own' : ''} title={it.name}>
                <ItemIcon item={it} size={30} fur={s.pet.fur} />
              </span>
            ) : null;
          })}
        </div>
        <button className="st-theme-buy" disabled={!price} onClick={buy}>
          {price ? (
            <>
              <Seed size={18} /> {price}
            </>
          ) : (
            'Coleção completa'
          )}
        </button>
      </div>
    </article>
  );
}

export function ThemeCollections() {
  return (
    <div className="st-themes">
      {STYLES.filter((st) => st.outfit).map((st) => (
        <ThemeCard key={st.id} st={st} />
      ))}
    </div>
  );
}

/** Casas prontas: a coleção inteira (parede, piso e móveis) com desconto. */
export function HouseStyles() {
  const s = useApp();
  return (
    <div className="grid grid-cols-2 gap-2">
      {STYLES.filter((st) => !st.outfit).map((st) => {
        const price = stylePrice(st, (id) => owned(s, id));
        const locked = st.plus && !isPremium(s);
        if (locked && s.profile.ageGroup === 'ate12') return null;
        return (
          <div key={st.id} className="st-style">
            <div className="st-style-art" style={{ background: WALLPAPER_CSS[st.wallpaper] }}>
              <div style={{ background: FLOOR_CSS[st.floor] }} />
            </div>
            <div className="grid gap-2 px-3 pb-3">
              <p className="font-bold leading-tight">
                {st.name} {st.plus && <Sparkles size={14} className="inline text-accent" />}
              </p>
              <button
                className="st-style-buy"
                disabled={locked || !price}
                onClick={() => {
                  const r = buyStyle(st.id);
                  if (r === 'ok') play('compra');
                  toast(r === 'ok' ? `Casa no estilo ${st.name}!` : r === 'sem-sementes' ? 'Faltam sementes para essa coleção.' : 'Esse estilo é do Lumbi+.');
                }}
              >
                {locked ? <Lock size={14} /> : <Seed />} {price || 'Já é sua'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StoreTab({ onPlus, onGift }: { onPlus: () => void; onGift: (itemId: string) => void }) {
  const s = useApp();
  const [open, setOpen] = useState<{ item: Item; list: Item[] } | null>(null);
  // Só as lojinhas (Vendinha, Roupas, Casa, Comida e Baús): as seções "Itens" e "Limitados" saíram.
  return (
    <div className="st st-only-shops">
      <div className="st-awning" aria-hidden="true" />
      <header className="st-head">
        <h1>Loja</h1>
        <span className="st-coins">
          <Coins value={s.coins} />
        </span>
      </header>
      <ShopHub onPlus={onPlus} onGift={onGift} />
      <TryOn item={open?.item ?? null} list={open?.list ?? []} onPick={(item) => setOpen((o) => (o ? { ...o, item } : o))} onClose={() => setOpen(null)} onPlus={onPlus} onGift={onGift} />
    </div>
  );
}
