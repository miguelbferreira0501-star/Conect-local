// A Loja: a rua das lojinhas (portas grandes coloridas) e a loja em tela cheia, como um cantinho próprio:
// o Hami vendedor no alto, fundo marrom, quadradinhos só com o desenho e o preço (o nome aparece ao tocar)
// e abas da loja embaixo (Vendinha, Roupas, Casa, Comida e Baús).
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronLeft, ChevronRight, Crown, Gift, Heart, Lock } from 'lucide-react';
import { Hamster } from '../components/Hamster';
import { Room } from '../components/Room';
import { ItemIcon } from '../components/ItemIcon';
import { Glyph } from '../components/art';
import { Coins, Seed, toast } from '../components/ui';
import { SHOP_COLORS, SHOPS, ShopFront, ShopIcon, type ShopId } from '../components/ShopFront';
import { PLUS_COUNTS } from '../components/PlusCard';
import { KIT_PLACE } from '../components/room/kit';
import { ITEMS, KIND_LABEL, LOOKS, SEASONS, WEARABLE_KINDS, currentSeason, inSeason, itemById, type Item, type ItemKind } from '../data/items';
import { periodOf } from '../data/lines';
import { levelOf } from '../logic/progress';
import { hashStr, mulberry32 } from '../lib/util';
import { buy, buyLook, canBuy, claimDailyGift, isPremium, lookPrice, todayKey, toggleWish, useApp, wear as wearItem } from '../lib/store';
import { play } from '../lib/sound';
import { ChestShopView } from './Chests';
import type { House, WearSlot } from '../types';

const ORDER: ShopId[] = ['vendinha', 'roupas', 'casa', 'comida', 'baus'];
const AISLES: Record<'roupas' | 'casa' | 'comida', ItemKind[]> = {
  roupas: ['chapeu', 'oculos', 'roupa', 'acessorio', 'efeito'],
  casa: ['movel', 'decor', 'brinquedo', 'parede', 'piso'],
  comida: ['comida'],
};
const forSale = () => ITEMS.filter((i) => !i.souvenir && inSeason(i) && i.price > 0);

// ---------- A rua das lojinhas ----------

const DOOR_TEXT: Record<ShopId, string> = {
  vendinha: 'Coleção do dia e presente',
  roupas: 'Roupas, fantasias e looks',
  casa: 'Móveis, paredes e pisos',
  comida: 'Comidinhas para o Hami',
  baus: 'Baús com surpresas',
};

/** A aba Loja: uma porta grande e colorida para cada lojinha. */
export function ShopHub({ onPlus, onGift }: { onPlus: () => void; onGift: (itemId: string) => void }) {
  const s = useApp();
  const pending = s.game.pendingChests.length;
  const [open, setOpen] = useState<ShopId | null>(null);
  const gift = s.lastGift !== todayKey();
  return (
    <div className="grid gap-4">
      <div className="shop-doors">
        {ORDER.map((id) => {
          const c = SHOP_COLORS[id];
          const badge = id === 'baus' && pending ? pending : id === 'vendinha' && gift ? 1 : 0;
          return (
            <button key={id} className={`shop-door door-${id}`} style={{ background: c.tile, boxShadow: `0 6px 0 ${c.edge}` }} onClick={() => (play('abrir'), setOpen(id))} data-sound="none">
              <span className="shop-door-text">
                <b>{c.title}</b>
                {id === 'vendinha' && <small>{DOOR_TEXT[id]}</small>}
              </span>
              {badge > 0 && <span className="shop-door-badge">{id === 'baus' ? badge : '!'}</span>}
              <span className="shop-door-art" aria-hidden="true">
                <Hamster growth={1} fur={s.pet.fur} outfit={SHOPS[id].outfit} size={id === 'vendinha' ? 120 : 84} idle={false} mood="feliz" />
              </span>
            </button>
          );
        })}
      </div>
      {open && <ShopMode shop={open} onShop={setOpen} onClose={() => setOpen(null)} onPlus={onPlus} onGift={(id) => (setOpen(null), onGift(id))} />}
    </div>
  );
}

// ---------- A loja em tela cheia ----------

function ShopMode({ shop, onShop, onClose, onPlus, onGift }: { shop: ShopId; onShop: (id: ShopId) => void; onClose: () => void; onPlus: () => void; onGift: (itemId: string) => void }) {
  const s = useApp();
  const kids = s.profile.ageGroup === 'ate12';
  const [tryOn, setTryOn] = useState<{ item: Item; list: Item[] } | null>(null);
  const openTry = (item: Item, list?: Item[]) => setTryOn({ item, list: list ?? [item] });
  const scroller = useRef<HTMLDivElement>(null);
  const c = SHOP_COLORS[shop];
  const pending = s.game.pendingChests.length;
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [shop]);
  // Enquanto a loja está aberta, a página de trás não rola.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  return createPortal(
    <div className={`shop-mode sm-${shop}`} style={{ ['--tile' as string]: c.tile, ['--tile-edge' as string]: c.edge, ['--awning' as string]: SHOPS[shop].awning[0] }} role="dialog" aria-modal="true" aria-label={c.title}>
      <div className="sm-scroll" ref={scroller}>
        <div className="sm-top">
          <ShopFront key={shop} shop={shop} immersive />
          <button className="sm-back" onClick={onClose} aria-label="Sair da loja">
            <ChevronLeft size={24} />
          </button>
          <span className="sm-coins" aria-label={`${s.coins} sementes`}>
            <Coins value={s.coins} />
          </span>
        </div>
        <div className="sm-body">
          {!kids && !isPremium(s) && <PlusBanner onPlus={onPlus} />}
          {shop === 'vendinha' && <VendinhaBody onTry={openTry} kids={kids} />}
          {(shop === 'roupas' || shop === 'casa' || shop === 'comida') && <AisleBody key={shop} kinds={AISLES[shop]} looks={shop === 'roupas'} onTry={openTry} onPlus={onPlus} />}
          {shop === 'baus' && (
            <div className="sm-chests">
              <ChestShopView />
            </div>
          )}
        </div>
      </div>
      <nav className="sm-tabs" aria-label="Lojinhas">
        {ORDER.map((id) => (
          <button key={id} className={`sm-tab ${id === shop ? 'is-on' : ''}`} aria-current={id === shop ? 'page' : undefined} onClick={() => onShop(id)}>
            <span className="sm-tab-ico" style={{ background: SHOP_COLORS[id].tile }}>
              <ShopIcon id={id} size={24} c="#FFFFFF" />
            </span>
            <span>{SHOP_COLORS[id].label}</span>
            {id === 'baus' && pending > 0 && <span className="sm-tab-badge">{pending}</span>}
          </button>
        ))}
      </nav>
      <TryOn item={tryOn?.item ?? null} list={tryOn?.list ?? []} onPick={(it) => setTryOn((t) => (t ? { ...t, item: it } : t))} onClose={() => setTryOn(null)} onPlus={onPlus} onGift={onGift} />
    </div>,
    document.body,
  );
}

function PlusBanner({ onPlus }: { onPlus: () => void }) {
  const s = useApp();
  return (
    <button className="sm-plus" onClick={onPlus}>
      <span className="min-w-0 text-left">
        <b>Virar Plus</b>
        <small>{PLUS_COUNTS.items} itens lindos só para o {s.pet.name || 'Hami'}</small>
      </span>
      <span className="sm-plus-art" aria-hidden="true">
        <Hamster growth={1} fur={s.pet.fur} outfit={{ chapeu: 'coroa-rei', oculos: null, roupa: null, acessorio: null, efeito: null }} size={74} idle={false} mood="animado" />
      </span>
      <span className="sm-plus-go" aria-hidden="true">
        <ChevronRight size={18} />
      </span>
    </button>
  );
}

function Title({ children, side }: { children: React.ReactNode; side?: React.ReactNode }) {
  return (
    <div className="sm-title">
      <h2>{children}</h2>
      {side}
    </div>
  );
}

/** Quadradinho de um item: só o desenho e o preço. */
function ShopTile({ item, onTry }: { item: Item; onTry: (item: Item, list?: Item[]) => void }) {
  const s = useApp();
  const res = canBuy(s, item.id);
  const wished = s.wishlist.includes(item.id);
  const wear = WEARABLE_KINDS.includes(item.kind);
  const count = item.kind === 'comida' ? s.inventory[item.id] ?? 0 : 0;
  const label = res === 'ja-tem' ? 'já é seu' : res === 'plus' ? 'só no Plus' : res === 'nivel' ? `libera no nível ${item.level}` : `${item.price} sementes`;
  return (
    <li>
      <button className={`sm-tile ${res === 'ja-tem' ? 'is-owned' : ''} ${res === 'sem-sementes' ? 'is-short' : ''}`} onClick={() => onTry(item)} aria-label={`${item.name}, ${label}`}>
        {item.plus && (
          <span className="sm-badge sm-badge-plus" aria-hidden="true">
            <Crown size={11} />
          </span>
        )}
        {wished && (
          <span className="sm-badge sm-badge-wish" aria-hidden="true">
            <Heart size={11} />
          </span>
        )}
        {count > 0 && <span className="sm-badge sm-badge-count" aria-hidden="true">x{count}</span>}
        <span className={`sm-art ${item.kind === 'chapeu' || item.kind === 'oculos' ? 'is-head' : item.kind === 'roupa' ? 'is-body' : ''}`} aria-hidden="true">
          {wear ? <Hamster fur={s.pet.fur} outfit={{ chapeu: null, oculos: null, roupa: null, acessorio: null, efeito: null, [item.kind]: item.id }} size={86} idle={false} growth={1} /> : <ItemIcon item={item} size={item.svg ? 44 : 36} />}
        </span>
        <span className="sm-price" aria-hidden="true">
          {res === 'ja-tem' ? (
            <Check size={16} strokeWidth={3} />
          ) : res === 'nivel' ? (
            <>
              <Lock size={12} /> Nv {item.level}
            </>
          ) : (
            <>
              <Seed /> {item.price}
            </>
          )}
        </span>
      </button>
    </li>
  );
}

function TileGrid({ items, onTry }: { items: Item[]; onTry: (item: Item, list?: Item[]) => void }) {
  return (
    <ul className="sm-grid">
      {items.map((item) => (
        <ShopTile key={item.id} item={item} onTry={(it) => onTry(it, items)} />
      ))}
    </ul>
  );
}

/** Ordem da prateleira: o que dá para comprar primeiro, depois Plus e o que já é seu. */
function shelf(items: Item[], s: ReturnType<typeof useApp>) {
  const rank = (i: Item) => ({ ok: 0, 'sem-sementes': 1, nivel: 2, plus: 3, 'ja-tem': 4 })[canBuy(s, i.id) as string] ?? 2;
  return [...items].sort((a, b) => rank(a) - rank(b) || a.price - b.price);
}

function VendinhaBody({ onTry, kids }: { onTry: (item: Item, list?: Item[]) => void; kids: boolean }) {
  const s = useApp();
  const today = todayKey();
  const daily = dailyCollection(today).filter((i) => !kids || !i.plus);
  const giftReady = s.lastGift !== today;
  const season = currentSeason();
  const wishes = forSale().filter((i) => s.wishlist.includes(i.id));
  const [allPlus, setAllPlus] = useState(false);
  const now = new Date();
  const mins = 24 * 60 - (now.getHours() * 60 + now.getMinutes());
  return (
    <>
      <Title side={<span className="sm-chip">Renova em {Math.floor(mins / 60)}h{String(mins % 60).padStart(2, '0')}</span>}>Coleção do dia</Title>
      <TileGrid items={daily} onTry={onTry} />
      <button
        className={`sm-gift ${giftReady ? '' : 'is-done'}`}
        disabled={!giftReady}
        onClick={() => {
          const g = claimDailyGift();
          if (g) toast(g.food ? `Presente: ${itemById(g.food)?.name}!` : `Presente: +${g.coins} sementes!`);
        }}
      >
        <Glyph e="🎁" size={40} />
        <span className="min-w-0 text-left">
          <b>{giftReady ? 'Presente do dia' : 'Presente aberto'}</b>
          <small>{giftReady ? 'Toque para abrir' : 'Volte amanhã'}</small>
        </span>
      </button>
      {season && (
        <p className="sm-note">
          <Glyph e="✨" size={18} className="gi" /> {SEASONS[season].label}: itens especiais {SEASONS[season].until}
        </p>
      )}
      {!kids && (
        <>
          <PlusShowcase onTry={onTry} onAll={() => setAllPlus(!allPlus)} />
          {allPlus && <TileGrid items={shelf(forSale().filter((i) => i.plus), s)} onTry={onTry} />}
        </>
      )}
      {wishes.length > 0 && (
        <>
          <Title>
            <Heart size={18} className="inline" /> Desejos
          </Title>
          <TileGrid items={wishes} onTry={onTry} />
        </>
      )}
    </>
  );
}

function AisleBody({ kinds, looks, onTry, onPlus }: { kinds: ItemKind[]; looks?: boolean; onTry: (item: Item, list?: Item[]) => void; onPlus: () => void }) {
  const s = useApp();
  const kids = s.profile.ageGroup === 'ate12';
  const [kind, setKind] = useState<ItemKind | 'looks' | 'identidade'>(looks ? 'looks' : kinds[0]);
  // Para menores de 13 anos, nada do Plus aparece nas prateleiras.
  const items = useMemo(
    () => (kind === 'looks' ? [] : shelf(forSale().filter((i) => (kind === 'identidade' ? i.tag === 'identidade' : i.kind === kind) && !(kids && i.plus)), s)),
    [kind, s, kids],
  );
  // Roupas: a prateleira "Sou assim" junta os itens de identidade (bandeiras, cordões, bomba de insulina, cadeira de rodas…).
  const wear = kinds.includes('acessorio');
  const chips: (ItemKind | 'looks' | 'identidade')[] = [...(looks ? (['looks'] as const) : []), ...kinds, ...(wear ? (['identidade'] as const) : [])];
  return (
    <>
      {chips.length > 1 && (
        <div className="sm-chips" role="tablist" aria-label="Prateleiras">
          {chips.map((k) => (
            <button key={k} role="tab" aria-selected={kind === k} className={`sm-chip-btn ${kind === k ? 'is-on' : ''}`} onClick={() => setKind(k)}>
              {k === 'looks' ? 'Looks' : k === 'identidade' ? 'Sou assim' : KIND_LABEL[k]}
            </button>
          ))}
        </div>
      )}
      {kind === 'looks' ? <LookTiles onPlus={onPlus} /> : <TileGrid items={items} onTry={onTry} />}
    </>
  );
}

/** Looks prontos: o Hami vestido e o preço do conjunto (o nome do look aparece para leitores de tela). */
function LookTiles({ onPlus }: { onPlus: () => void }) {
  const s = useApp();
  const kids = s.profile.ageGroup === 'ate12';
  return (
    <ul className="sm-looks">
      {LOOKS.filter((look) => !(kids && lookPrice(s, look.id).plus)).map((look) => {
        const lp = lookPrice(s, look.id);
        const items = look.items.map((id) => itemById(id)!).filter(Boolean);
        const outfit = { ...s.pet.outfit };
        for (const it of items) outfit[it.kind as WearSlot] = it.id;
        const all = lp.missing.length === 0;
        const locked = lp.plus && !isPremium(s);
        const act = () => {
          if (all) return items.forEach((i) => wearItem(i.id)), toast(`Look ${look.name} vestido!`);
          if (locked) return onPlus();
          if (lp.level > levelOf(s.xp)) return toast(`Esse look libera no nível ${lp.level}`);
          if (buyLook(look.id) === 'ok') toast(`Look ${look.name} é seu!`);
          else toast(`Faltam ${lp.price - s.coins} sementes`);
        };
        return (
          <li key={look.id}>
            <button className="sm-look" onClick={act} aria-label={`Look ${look.name}: ${all ? 'vestir' : locked ? 'só no Plus' : `${lp.price} sementes`}`}>
              {lp.plus && (
                <span className="sm-badge sm-badge-plus" aria-hidden="true">
                  <Crown size={11} />
                </span>
              )}
              <span className="sm-art" aria-hidden="true">
                <Hamster fur={s.pet.fur} outfit={outfit} size={118} idle={false} growth={1} />
              </span>
              <span className="sm-price" aria-hidden="true">
                {all ? (
                  'Vestir'
                ) : locked ? (
                  <>
                    <Lock size={12} /> Plus
                  </>
                ) : (
                  <>
                    <Seed /> {lp.price} <small>−20%</small>
                  </>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Provador: o Hami com a roupa de agora + a peça escolhida, antes de comprar. */
/** Provador no estilo jogo: o Hami grandão no meio (ou a peça dentro da sua casa), nome e preço,
 *  e um carrossel com as peças da prateleira para ir trocando. */
function TryOn({ item, list, onPick, onClose, onPlus, onGift }: { item: Item | null; list: Item[]; onPick: (item: Item) => void; onClose: () => void; onPlus: () => void; onGift?: (itemId: string) => void }) {
  const s = useApp();
  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    strip.current?.querySelector('.fit-pick.is-on')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [item]);
  if (!item) return null;
  const res = canBuy(s, item.id);
  const wear = WEARABLE_KINDS.includes(item.kind);
  const outfit = wear ? { ...s.pet.outfit, [item.kind]: item.id } : s.pet.outfit;
  const home = !wear && ['movel', 'decor', 'brinquedo', 'parede', 'piso'].includes(item.kind);
  const preview = home ? previewHouse(s.house, item) : null;
  const kids = s.profile.ageGroup === 'ate12';
  const wished = s.wishlist.includes(item.id);
  return (
    <div className="fitting" role="dialog" aria-modal="true" aria-label={item.name}>
      <div className="fit-top">
        <button className="sm-back !static" onClick={onClose} aria-label="Voltar">
          <ChevronLeft size={24} />
        </button>
        <button className={`fit-wish ${wished ? 'is-on' : ''}`} onClick={() => toggleWish(item.id)} aria-label={wished ? 'Tirar dos desejos' : 'Guardar nos desejos'} aria-pressed={wished}>
          <Heart size={18} />
        </button>
      </div>
      <div className="fit-stage">
        {preview ? (
          <div className="fit-room">
            <Room house={preview} period={periodOf()} height={300}>
              <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood="animado" size={120} label={s.pet.name} />
            </Room>
          </div>
        ) : wear ? (
          <div key={item.id} className="fit-pet">
            <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={outfit} mood="feliz" size={250} label={`${s.pet.name} com ${item.name}`} growth={1} />
          </div>
        ) : (
          <div key={item.id} className="fit-pet">
            <ItemIcon item={item} size={110} />
          </div>
        )}
      </div>
      <div className="fit-info">
        <p className="fit-name">
          {item.name} {item.plus && <Crown size={16} className="inline" />}
        </p>
        {res === 'ja-tem' ? (
          wear ? (
            <button className="fit-btn" onClick={() => (wearItem(item.id), toast('Vestido!'))}>
              Vestir agora
            </button>
          ) : (
            <span className="fit-btn is-owned">Já é seu</span>
          )
        ) : res === 'plus' ? (
          <button className="fit-btn is-plus" onClick={kids ? undefined : onPlus} disabled={kids}>
            <Crown size={16} /> {kids ? 'Exclusivo do HamiCare+' : 'Liberar com o Plus'}
          </button>
        ) : res === 'nivel' ? (
          <span className="fit-btn is-owned">
            <Lock size={14} /> Libera no nível {item.level}
          </span>
        ) : (
          <button className="fit-btn" disabled={res === 'sem-sementes'} onClick={() => buy(item.id) === 'ok' && toast(wear ? `${item.name}: já tá vestindo!` : `${item.name} é seu!`)}>
            <Seed size={16} /> {item.price}
          </button>
        )}
        {res === 'sem-sementes' && <p className="fit-note">Faltam {item.price - s.coins} sementes</p>}
        {onGift && res !== 'plus' && !kids && (
          <button className="fit-link" onClick={() => (onClose(), onGift(item.id))}>
            <Gift size={14} /> Presentear um amigo
          </button>
        )}
      </div>
      {list.length > 1 && (
        <div className="fit-strip" ref={strip}>
          {list.map((it) => {
            const r = canBuy(s, it.id);
            return (
              <button key={it.id} className={`fit-pick ${it.id === item.id ? 'is-on' : ''}`} onClick={() => (play('vestir'), onPick(it))} aria-label={it.name} data-sound="none">
                <span className={`sm-art ${it.kind === 'chapeu' || it.kind === 'oculos' ? 'is-head' : ''}`}>
                  {WEARABLE_KINDS.includes(it.kind) ? <Hamster fur={s.pet.fur} outfit={{ chapeu: null, oculos: null, roupa: null, acessorio: null, efeito: null, [it.kind]: it.id }} size={70} idle={false} growth={1} /> : <ItemIcon item={it} size={30} />}
                </span>
                {r === 'plus' && <span className="fit-pick-tag">PLUS</span>}
                {r === 'ja-tem' && <span className="fit-pick-tag is-own">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Seis destaques que mudam todo dia (um deles do HamiCare+, quando houver). */
function dailyCollection(today: string): Item[] {
  const rnd = mulberry32(hashStr(`colecao:${today}`));
  const pool = ITEMS.filter((i) => !i.souvenir && i.price > 0 && inSeason(i) && i.kind !== 'comida' && i.kind !== 'parede' && i.kind !== 'piso');
  const free = pool.filter((i) => !i.plus).sort(() => rnd() - 0.5);
  const plus = pool.filter((i) => i.plus).sort(() => rnd() - 0.5);
  return [...free.slice(0, plus.length ? 5 : 6), ...plus.slice(0, 1)];
}

/** A casa da pessoa com a peça escolhida (parede e piso trocam; móvel entra num cantinho livre). */
function previewHouse(house: House, item: Item): House {
  if (item.kind === 'parede') return { ...house, wallpaper: item.id };
  if (item.kind === 'piso') return { ...house, floor: item.id };
  const place = KIT_PLACE[item.svg ?? ''];
  const spot = place === 'parede' ? { x: 50, y: 30 } : place === 'tapete' ? { x: 50, y: 95 } : { x: 74, y: 82 };
  return { ...house, items: [...house.items, { uid: 'provador', itemId: item.id, ...spot, z: 999 }] };
}

/** Vitrine do Plus: 8 peças que mudam todo dia, para provar no Hami (ou ver na casa) de graça. */
export function PlusShowcase({ onTry, onAll }: { onTry: (item: Item, list?: Item[]) => void; onAll: () => void }) {
  const s = useApp();
  const today = todayKey();
  const premium = isPremium(s);
  const picks = useMemo(() => {
    const rnd = mulberry32(hashStr(`plus:${today}`));
    // Só as peças desenhadas mais caprichadas: roupas com desenho no Hami e móveis do kit novo.
    const pool = ITEMS.filter((i) => i.plus && !i.souvenir && i.price > 0 && inSeason(i)).sort(() => rnd() - 0.5);
    const wear = pool.filter((i) => WEARABLE_KINDS.includes(i.kind) && i.kind !== 'efeito' && i.base).slice(0, 5);
    const home = pool.filter((i) => i.svg?.startsWith('k-')).slice(0, 3);
    return [wear[0], home[0], wear[1], wear[2], home[1], wear[3], home[2], wear[4]].filter(Boolean);
  }, [today]);
  return (
    <section className="plus-showcase" aria-label="Vitrine do HamiCare+">
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-[12px] font-black uppercase tracking-wide text-[#9A6A00]">
            <Crown size={13} /> {premium ? 'Exclusivos do seu Plus' : 'Vitrine do HamiCare+'}
          </p>
          <p className="font-display text-[19px] font-bold leading-tight">{premium ? 'Peças especiais para você' : `Prove no ${s.pet.name}, é de graça`}</p>
        </div>
        <button className="shrink-0 text-[13px] font-extrabold underline underline-offset-2" onClick={onAll}>
          Ver tudo
        </button>
      </div>
      <ul className="plus-row">
        {picks.map((item) => {
          const wear = WEARABLE_KINDS.includes(item.kind);
          return (
            <li key={item.id}>
              <button className="plus-tile" onClick={() => onTry(item)} aria-label={`${wear ? 'Provar' : 'Ver na casa'}: ${item.name}`}>
                <span className="plus-tile-art">
                  {wear ? (
                    <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={{ chapeu: null, oculos: null, roupa: null, acessorio: null, efeito: null, [item.kind]: item.id }} size={92} idle={false} label={item.name} growth={1} />
                  ) : (
                    <ItemIcon item={item} size={44} />
                  )}
                </span>
                <span className="plus-tile-name">{item.name}</span>
                <span className="plus-tile-cta">{wear ? 'Provar' : 'Ver na casa'}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

