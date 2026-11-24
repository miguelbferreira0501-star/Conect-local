// Loja (aba própria): "Especial de hoje" que renova à meia-noite, roupas e móveis em seções, os limitados
// (coleções com desconto e itens de temporada) e as lojinhas de antes (vendinha, baús, etc.).
// As sementes só aparecem aqui, onde se compra.
import { useEffect, useMemo, useState } from 'react';
import { Gift, Lock, RefreshCw, Shirt, Sofa, Sparkles } from 'lucide-react';
import { FLOOR_CSS, WALLPAPER_CSS } from '../components/Furniture';
import { play } from '../lib/sound';
import { ITEMS, KIND_LABEL, STYLES, WEARABLE_KINDS, HOUSE_KINDS, stylePrice, type Item, type ItemKind } from '../data/items';

const GOLD: ItemKind[] = ['efeito', 'decor', 'piso'];
import { ItemIcon } from '../components/ItemIcon';
import { Coins, Seed, toast } from '../components/ui';
import { buyStyle, canBuy, isPremium, level, owned, todayKey, useApp } from '../lib/store';
import { LookTiles, ShopHub, TryOn } from './Shop';
import type { State } from '../types';
import { untilMidnight } from '../lib/util';

type Sec = 'itens' | 'limitados' | 'lojinhas';
type Mode = 'roupas' | 'moveis';

function hash(t: string) {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Itens que dá para comprar agora (na loja, sem os de baú, aventura, arena e comida). */
function forSale(s: State, mode: Mode): Item[] {
  const kinds = mode === 'roupas' ? WEARABLE_KINDS : [...HOUSE_KINDS, 'parede', 'piso'];
  const lvl = level(s);
  return ITEMS.filter((i) => kinds.includes(i.kind) && !i.souvenir && !i.chestOnly && !i.arena && i.price > 0 && (i.level ?? 1) <= lvl && (!i.plus || isPremium(s)) && !owned(s, i.id));
}

/** O especial do dia: 9 peças sorteadas pelo dia (iguais o dia todo). */
function special(s: State, mode: Mode, day: string): Item[] {
  const all = forSale(s, mode);
  return [...all].sort((a, b) => hash(`${s.seed}:${day}:${a.id}`) - hash(`${s.seed}:${day}:${b.id}`)).slice(0, 9);
}

function Tile({ item, onOpen }: { item: Item; onOpen: (i: Item) => void }) {
  const s = useApp();
  const r = canBuy(s, item.id);
  return (
    <button className={`st-tile ${r === 'sem-sementes' ? 'is-short' : ''}`} onClick={() => onOpen(item)} aria-label={`${item.name}, ${item.price} sementes`}>
      <span className="st-tile-art">
        <ItemIcon item={item} size={44} fur={s.pet.fur} />
      </span>
      <span className="st-price">
        <Seed size={13} /> {item.price}
      </span>
    </button>
  );
}

/** Casas prontas: a coleção inteira (parede, piso e móveis) com desconto. */
function HouseStyles() {
  const s = useApp();
  return (
    <div className="grid grid-cols-2 gap-2">
      {STYLES.map((st) => {
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
                  toast(r === 'ok' ? `Casa no estilo ${st.name}!` : r === 'sem-sementes' ? 'Faltam sementes para essa coleção.' : 'Esse estilo é do HamiCare+.');
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
  const [sec, setSec] = useState<Sec>('itens');
  const [mode, setMode] = useState<Mode>('roupas');
  const [now, setNow] = useState(Date.now());
  const [open, setOpen] = useState<{ item: Item; list: Item[] } | null>(null);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const day = todayKey();
  const today = useMemo(() => special(s, mode, day), [s, mode, day]);
  const rest = useMemo(() => forSale(s, mode).filter((i) => !today.includes(i)), [s, mode, today]);
  const kids = s.profile.ageGroup === 'ate12';
  const seasonal = useMemo(() => ITEMS.filter((i) => i.season && !owned(s, i.id) && !i.souvenir && !i.chestOnly && (!i.plus || isPremium(s))), [s]);
  // Seções por tipo (chapéus, roupas…), cada uma mostrando 6 e o resto em "Ver mais".
  const [more, setMore] = useState<ItemKind[]>([]);
  const order: ItemKind[] = mode === 'roupas' ? ['roupa', 'chapeu', 'oculos', 'acessorio', 'efeito'] : ['movel', 'decor', 'brinquedo', 'parede', 'piso'];
  const groups = order.map((k) => [k, rest.filter((i) => i.kind === k).sort((a, b) => a.price - b.price)] as [ItemKind, Item[]]).filter(([, l]) => l.length);
  const openItem = (item: Item, list: Item[]) => setOpen({ item, list });

  return (
    <div className="st">
      <div className="st-awning" aria-hidden="true" />
      <header className="st-head">
        <h1>Loja</h1>
        <span className="st-coins">
          <Coins value={s.coins} />
        </span>
      </header>
      {sec === 'itens' && (
        <>
          <section className="st-card">
            <span className="st-ribbon">Especial de hoje</span>
            <p className="st-refresh">
              <RefreshCw size={14} /> Renova em <b className="tabular-nums">{untilMidnight(now)}</b>
            </p>
            {today.length ? (
              <div className="st-grid">
                {today.map((i) => (
                  <Tile key={i.id} item={i} onOpen={(it) => openItem(it, today)} />
                ))}
              </div>
            ) : (
              <p className="st-empty">Você já tem tudo por aqui! Volte amanhã para novidades.</p>
            )}
          </section>
          {groups.map(([kind, list]) => {
            const open = more.includes(kind);
            const shown = open ? list : list.slice(0, 6);
            return (
              <section key={kind} className="st-card">
                <span className={`st-ribbon ${GOLD.includes(kind) ? 'is-gold' : ''}`}>{KIND_LABEL[kind]}</span>
                <div className="st-grid">
                  {shown.map((i) => (
                    <Tile key={i.id} item={i} onOpen={(it) => openItem(it, list)} />
                  ))}
                </div>
                {list.length > 6 && (
                  <button className="st-more" onClick={() => setMore((m) => (open ? m.filter((k) => k !== kind) : [...m, kind]))}>
                    {open ? 'Ver menos' : `Ver mais (${list.length - 6})`}
                  </button>
                )}
              </section>
            );
          })}
        </>
      )}

      {sec === 'limitados' && (
        <div className="grid gap-4">
          <section className="st-card">
            <span className="st-ribbon is-pink">Coleções com desconto</span>
            <LookTiles onPlus={onPlus} />
          </section>
          <section className="st-card">
            <span className="st-ribbon">Casas prontas</span>
            <p className="st-refresh">A coleção inteira com 25% de desconto</p>
            <HouseStyles />
          </section>
          {seasonal.length > 0 && (
            <section className="st-card">
              <span className="st-ribbon is-gold">Da temporada</span>
              <div className="st-grid">
                {seasonal.map((i) => (
                  <Tile key={i.id} item={i} onOpen={(it) => openItem(it, seasonal)} />
                ))}
              </div>
            </section>
          )}
          {!kids && !isPremium(s) && (
            <button className="st-plus" onClick={onPlus}>
              <Gift size={20} /> Itens exclusivos no HamiCare+
            </button>
          )}
        </div>
      )}

      {sec === 'lojinhas' && <ShopHub onPlus={onPlus} onGift={onGift} />}

      {/* embaixo, como nas lojas dos apps de pet: o seletor Roupas/Móveis flutuando e as seções da loja */}
      <div className="st-dock">
        {sec === 'itens' && (
          <div className="st-float" role="tablist" aria-label="Roupas ou móveis">
            <button role="tab" aria-selected={mode === 'roupas'} className={mode === 'roupas' ? 'is-on' : ''} onClick={() => (setMode('roupas'), play('toque'))}>
              <Shirt size={18} /> Roupas
            </button>
            <button role="tab" aria-selected={mode === 'moveis'} className={mode === 'moveis' ? 'is-on' : ''} onClick={() => (setMode('moveis'), play('toque'))}>
              <Sofa size={18} /> Móveis
            </button>
          </div>
        )}
        <div className="st-tabs" role="tablist" aria-label="Seções da loja">
          {(
            [
              ['itens', 'Itens'],
              ['limitados', 'Limitados'],
              ['lojinhas', 'Lojinhas'],
            ] as [Sec, string][]
          ).map(([id, label]) => (
            <button key={id} role="tab" aria-selected={sec === id} className={sec === id ? 'is-on' : ''} onClick={() => setSec(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <TryOn item={open?.item ?? null} list={open?.list ?? []} onPick={(item) => setOpen((o) => (o ? { ...o, item } : o))} onClose={() => setOpen(null)} onPlus={onPlus} onGift={onGift} />
    </div>
  );
}
