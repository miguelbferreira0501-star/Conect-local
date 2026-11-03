import { useEffect, useState } from 'react';
import { ArrowUpToLine, Gift, Heart, Lock, PackageOpen, Pencil, Sparkles } from 'lucide-react';
import { Hamster } from '../components/Hamster';
import { Capivara } from '../components/Capivara';
import { Room } from '../components/Room';
import { Furniture, FLOOR_CSS, WALLPAPER_CSS } from '../components/Furniture';
import { Coins, Seed, Seg, Sheet, toast } from '../components/ui';
import { HOUSE_KINDS, ITEMS, KIND_LABEL, SEASONS, STYLES, WEARABLE_KINDS, currentSeason, inSeason, itemById, stylePrice, type Item, type ItemKind } from '../data/items';
import { ALL_FINDS, PLACES, placeById } from '../data/world';
import { periodOf } from '../data/lines';
import { levelOf } from '../logic/progress';
import { hashStr, mulberry32 } from '../lib/util';
import {
  bringFront, buy, buyStyle, canBuy, claimDailyGift, finishAdventure, isPremium, moveItem, owned, placeItem, placeLocked, setFloor, setWallpaper, startAdventure, storeItem, todayKey, toggleWish, unwear, useApp, wear,
  type AdventureResult,
} from '../lib/store';
import { AdventureModal } from './Home';
import type { WearSlot } from '../types';

type Tab = 'casa' | 'mapa' | 'loja' | 'armario';

export function World({ onPlus, onGift, initialTab }: { onPlus: () => void; onGift: (itemId: string) => void; initialTab?: Tab }) {
  const s = useApp();
  const [tab, setTab] = useState<Tab>(initialTab ?? 'casa');
  return (
    <div className="grid gap-4">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Nível {levelOf(s.xp)}</p>
          <h1 className="font-display text-[30px] font-bold leading-tight">Mundo</h1>
        </div>
        <Coins value={s.coins} />
      </header>
      <Seg value={tab} onChange={setTab} label="Seções do mundo" options={[{ id: 'casa', label: 'Casa' }, { id: 'mapa', label: 'Mapa' }, { id: 'loja', label: 'Loja' }, { id: 'armario', label: 'Armário' }]} />
      {tab === 'casa' && <HouseTab />}
      {tab === 'mapa' && <MapTab onPlus={onPlus} />}
      {tab === 'loja' && <ShopTab onPlus={onPlus} onGift={onGift} />}
      {tab === 'armario' && <WardrobeTab />}
    </div>
  );
}

// ---------- Casa ----------

function HouseTab() {
  const s = useApp();
  const [editing, setEditing] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const placed = (id: string) => s.house.items.filter((i) => i.itemId === id).length;
  const tray = ITEMS.filter((i) => HOUSE_KINDS.includes(i.kind) && (s.inventory[i.id] ?? 0) > placed(i.id));
  const walls = ITEMS.filter((i) => i.kind === 'parede' && owned(s, i.id));
  const floors = ITEMS.filter((i) => i.kind === 'piso' && owned(s, i.id));
  const selItem = s.house.items.find((i) => i.uid === sel);

  return (
    <div className="grid gap-4">
      <Room house={s.house} period={periodOf()} height={300} editing={editing} selected={sel} onSelect={setSel} onMove={moveItem}>
        {!s.adventure && <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood={s.pet.sleeping ? 'dormindo' : 'feliz'} size={130} label={s.pet.name} />}
      </Room>
      <div className="flex gap-2">
        <button className={`btn flex-1 ${editing ? 'btn-primary' : 'btn-soft'}`} onClick={() => (setEditing(!editing), setSel(null))}>
          <Pencil size={18} /> {editing ? 'Pronto' : 'Decorar'}
        </button>
      </div>
      {editing && (
        <>
          <p className="text-[14px] text-muted">Arraste os móveis com o dedo. Toque num móvel para trazer pra frente ou guardar.</p>
          {selItem && (
            <div className="flex items-center gap-2 rounded-2xl bg-accent-soft p-3">
              <span className="min-w-0 flex-1 font-bold">{itemById(selItem.itemId)?.name}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => bringFront(selItem.uid)}>
                <ArrowUpToLine size={16} /> Frente
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => (storeItem(selItem.uid), setSel(null))}>
                <PackageOpen size={16} /> Guardar
              </button>
            </div>
          )}
          <section className="grid gap-2">
            <h2 className="font-display text-[19px] font-bold">Seus móveis guardados</h2>
            {tray.length ? (
              <div className="grid grid-cols-4 gap-2">
                {tray.map((i) => (
                  <button key={i.id} className="tile !p-2" onClick={() => placeItem(i.id)} aria-label={`Colocar ${i.name}`}>
                    <ItemIcon item={i} />
                    <span className="text-[11px] font-bold leading-tight">{i.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[14px] text-muted">Tudo já está na casa. Compre mais na Loja.</p>
            )}
          </section>
          <section className="grid gap-2">
            <h2 className="font-display text-[19px] font-bold">Parede e piso</h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {walls.map((w) => (
                <button key={w.id} className={`h-14 w-14 shrink-0 rounded-2xl border-[3px] ${s.house.wallpaper === w.id ? 'border-accent' : 'border-line'}`} style={{ background: WALLPAPER_CSS[w.id] }} aria-label={w.name} onClick={() => setWallpaper(w.id)} />
              ))}
              <span className="w-2 shrink-0" />
              {floors.map((f) => (
                <button key={f.id} className={`h-14 w-14 shrink-0 rounded-2xl border-[3px] ${s.house.floor === f.id ? 'border-accent' : 'border-line'}`} style={{ background: FLOOR_CSS[f.id] }} aria-label={f.name} onClick={() => setFloor(f.id)} />
              ))}
            </div>
          </section>
        </>
      )}
      <section className="grid gap-2" aria-label="Estilos de casa">
        <h2 className="font-display text-[19px] font-bold">Estilos prontos</h2>
        <p className="text-[14px] text-muted">Compre a coleção inteira com 25% de desconto e a casa já fica arrumada.</p>
        <div className="grid grid-cols-2 gap-2">
          {STYLES.map((st) => {
            const price = stylePrice(st, (id) => owned(s, id));
            const locked = st.plus && !isPremium(s);
            return (
              <div key={st.id} className="card grid gap-2 overflow-hidden p-0">
                <div className="h-16" style={{ background: `${WALLPAPER_CSS[st.wallpaper]}` }}>
                  <div className="mt-11 h-5" style={{ background: FLOOR_CSS[st.floor] }} />
                </div>
                <div className="grid gap-2 px-3 pb-3">
                  <p className="font-bold leading-tight">
                    {st.name} {st.plus && <Sparkles size={14} className="inline text-accent" />}
                  </p>
                  <button
                    className="btn btn-soft btn-sm"
                    disabled={locked}
                    onClick={() => {
                      const r = buyStyle(st.id);
                      toast(r === 'ok' ? `Casa no estilo ${st.name}!` : r === 'sem-sementes' ? 'Faltam sementes para essa coleção.' : 'Esse estilo é do HamiCare+.');
                    }}
                  >
                    {locked ? <Lock size={14} /> : <Seed />} {price}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function ItemIcon({ item, size = 34 }: { item: Item; size?: number }) {
  if (item.svg) {
    return (
      <span className="grid place-items-center" style={{ width: size * 1.3, height: size * 1.3 }}>
        <span style={{ width: size * 1.2 }}>
          <Furniture id={item.svg} />
        </span>
      </span>
    );
  }
  if (item.emoji) return <span style={{ fontSize: size, lineHeight: 1 }}>{item.emoji}</span>;
  if (item.kind === 'parede') return <span className="block rounded-xl" style={{ width: size * 1.3, height: size * 1.3, background: WALLPAPER_CSS[item.id] }} />;
  if (item.kind === 'piso') return <span className="block rounded-xl" style={{ width: size * 1.3, height: size * 1.3, background: FLOOR_CSS[item.id] }} />;
  return null;
}

// ---------- Mapa ----------

function MapTab({ onPlus }: { onPlus: () => void }) {
  const s = useApp();
  const [open, setOpen] = useState<string | null>(null);
  const [result, setResult] = useState<AdventureResult | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);
  const place = open ? placeById(open) : null;
  const adv = s.adventure;
  const advPlace = adv ? placeById(adv.placeId) : null;
  const advLeft = adv ? Math.max(0, Math.ceil((adv.endsAt - now) / 60_000)) : 0;

  return (
    <div className="grid gap-4">
      {adv && advPlace && (
        <div className="card flex items-center gap-3 p-4">
          <span className="text-[30px]">{advPlace.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="font-bold leading-tight">
              {s.pet.name} está em {advPlace.name}
            </p>
            <p className="text-[13px] text-muted">{advLeft > 0 ? `Volta em ~${advLeft} min. Cada atividade concluída traz ele 5 min mais cedo.` : 'Já voltou!'}</p>
          </div>
          {advLeft === 0 && (
            <button className="btn btn-primary btn-sm" onClick={() => setResult(finishAdventure())}>
              Abrir
            </button>
          )}
        </div>
      )}
      <div className="map h-[420px]" role="group" aria-label="Mapa">
        {PLACES.map((p) => {
          const lock = placeLocked(s, p.id);
          return (
            <button key={p.id} className="map-pin" style={{ left: `${p.pos[0]}%`, top: `${p.pos[1]}%` }} data-locked={!!lock} onClick={() => setOpen(p.id)} aria-label={`${p.name}${lock ? ' (bloqueado)' : ''}`}>
              <span className="pin-bubble">{lock ? '🔒' : p.emoji}</span>
              <span className="pin-label">{p.name}</span>
            </button>
          );
        })}
      </div>
      <section className="album" aria-label="Álbum de achadinhos">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-[21px] font-bold text-[#5b3a1e]">📒 Álbum de achadinhos</h2>
          <span className="album-count">
            {s.finds.length}/{ALL_FINDS.length}
          </span>
        </div>
        <p className="text-[13px] font-semibold text-[#7a5a3a]">Cada aventura pode trazer uma figurinha nova. As que faltam aparecem só a sombrinha.</p>
        <div className="grid gap-2.5">
          {PLACES.map((pl) => {
            const got = pl.finds.filter((f) => s.finds.includes(f.id)).length;
            return (
              <div key={pl.id} className="album-row">
                <span className="album-place">
                  <span className="text-[20px]" aria-hidden="true">
                    {pl.emoji}
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-[13px] font-extrabold">{pl.name}</span>
                    <span className="block text-[11px] font-bold opacity-70">
                      {got}/{pl.finds.length}
                    </span>
                  </span>
                </span>
                <div className="grid flex-1 grid-cols-3 gap-1.5">
                  {pl.finds.map((f, i) => {
                    const has = s.finds.includes(f.id);
                    return (
                      <span key={f.id} className={`sticker ${has ? 'is-got' : ''}`} style={{ rotate: has ? `${(i - 1) * 4}deg` : undefined }} title={has ? f.name : 'Ainda não encontrado'} aria-label={has ? f.name : 'Figurinha que falta'}>
                        <span className="sticker-art">{f.emoji}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Sheet open={!!place} onClose={() => setOpen(null)} title={place ? `${place.emoji} ${place.name}` : ''}>
        {place && (
          <div className="grid gap-3 pt-1">
            <div className="h-24 rounded-2xl" style={{ background: `linear-gradient(160deg, ${place.colors[0]}, ${place.colors[1]})` }} />
            <p className="text-[15px]">{place.desc}</p>
            {placeLocked(s, place.id) === 'nivel' && <p className="rounded-2xl bg-surface2 p-3 font-bold">Libera no nível {place.level}. Cada atividade te leva mais perto.</p>}
            {placeLocked(s, place.id) === 'plus' && (
              <button className="btn btn-soft" onClick={onPlus}>
                <Sparkles size={18} /> Aventura extra do HamiCare+
              </button>
            )}
            {!placeLocked(s, place.id) &&
              place.missions.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-2xl bg-surface2 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold leading-tight">{m.title}</p>
                    <p className="text-[12px] font-bold text-muted">
                      {m.minutes >= 60 ? `${m.minutes / 60} h` : `${m.minutes} min`} · ⚡ {m.energy} de energia · 🌻 {m.coins}
                    </p>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!!adv}
                    onClick={() => {
                      const r = startAdventure(place.id, m.id);
                      const msg = { ok: `${s.pet.name} saiu para a aventura!`, cansado: `${s.pet.name} está cansado. Deixe ele dormir um pouco.`, dormindo: `${s.pet.name} está dormindo.`, ocupado: 'Já tem uma aventura em andamento.', bloqueado: 'Lugar bloqueado.' }[r];
                      toast(msg);
                      if (r === 'ok') setOpen(null);
                    }}
                  >
                    Ir
                  </button>
                </div>
              ))}
            <div className="flex gap-2">
              {place.finds.map((f) => (
                <span key={f.id} className={`chip ${s.finds.includes(f.id) ? 'chip-gold' : 'chip-plain'}`}>
                  {s.finds.includes(f.id) ? `${f.emoji} ${f.name}` : '? Achadinho'}
                </span>
              ))}
            </div>
            <p className="text-[12px] text-muted">A missão longa sempre traz um achadinho novo, se faltar algum.</p>
          </div>
        )}
      </Sheet>
      <AdventureModal result={result} onClose={() => setResult(null)} />
    </div>
  );
}

// ---------- Loja ----------

const SHOP_KINDS: ItemKind[] = ['comida', 'chapeu', 'oculos', 'roupa', 'acessorio', 'movel', 'decor', 'brinquedo', 'parede', 'piso'];

function ShopTab({ onPlus, onGift }: { onPlus: () => void; onGift: (itemId: string) => void }) {
  const s = useApp();
  const [kind, setKind] = useState<ItemKind | 'desejos'>('comida');
  const season = currentSeason();
  const giftReady = s.lastGift !== todayKey();
  const list = ITEMS.filter((i) => !i.souvenir && inSeason(i) && i.price > 0 && (kind === 'desejos' ? s.wishlist.includes(i.id) : i.kind === kind));
  const today = todayKey();
  const daily = dailyCollection(today);
  const line = SELLER_LINES[hashStr(`${s.seed}:${today}:loja`) % SELLER_LINES.length];
  const now = new Date();
  const mins = 24 * 60 - (now.getHours() * 60 + now.getMinutes());

  return (
    <div className="grid gap-4">
      <section className="shop-hero" aria-label="Vendinha da Dona Capivara">
        <div className="flex items-end gap-2">
          <div className="seller-bob shrink-0">
            <Capivara size={98} />
          </div>
          <p className="seller-speech">
            <b>Dona Capivara:</b> {line.replace('{pet}', s.pet.name)}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-[20px] font-bold leading-tight">✨ Coleção do dia</p>
          <span className="rounded-full bg-white/25 px-3 py-1 text-[12px] font-black">
            Renova em {Math.floor(mins / 60)}h{String(mins % 60).padStart(2, '0')}
          </span>
        </div>
        <ul className="grid grid-cols-2 gap-2.5">
          {daily.map((item) => (
            <ShopCard key={item.id} item={item} onPlus={onPlus} onGift={onGift} />
          ))}
        </ul>
      </section>
      <button
        className={`card flex items-center gap-3 p-4 text-left ${giftReady ? '' : 'opacity-60'}`}
        disabled={!giftReady}
        onClick={() => {
          const g = claimDailyGift();
          if (g) toast(g.food ? `Presente: ${itemById(g.food)?.emoji} ${itemById(g.food)?.name}!` : `Presente: +${g.coins} sementes!`);
        }}
      >
        <Gift className="shrink-0 text-accent" />
        <span className="min-w-0 flex-1">
          <span className="block font-bold">{giftReady ? 'Presente do dia' : 'Presente de hoje já aberto'}</span>
          <span className="block text-[13px] text-muted">{giftReady ? 'Toque para abrir: sementes ou uma comidinha' : 'Volte amanhã para outro'}</span>
        </span>
      </button>
      {season && <p className="rounded-2xl bg-gold-soft px-4 py-2 text-[14px] font-bold">✨ {SEASONS[season].label}: itens especiais {SEASONS[season].until}</p>}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[...SHOP_KINDS, 'desejos' as const].map((k) => (
          <button key={k} className={`chip ${kind === k ? 'chip-accent' : 'chip-plain'}`} onClick={() => setKind(k)}>
            {k === 'desejos' ? `💗 Desejos (${s.wishlist.length})` : KIND_LABEL[k]}
          </button>
        ))}
      </div>
      {list.length ? (
        <ul className="grid grid-cols-2 gap-2.5">
          {list.map((item) => (
            <ShopCard key={item.id} item={item} onPlus={onPlus} onGift={onGift} />
          ))}
        </ul>
      ) : (
        <p className="text-center text-muted">{kind === 'desejos' ? 'Toque no coração dos itens para guardar aqui.' : 'Você já tem tudo dessa categoria!'}</p>
      )}
    </div>
  );
}

const SELLER_LINES = [
  'Bem-vindo à minha vendinha! Tudo fresquinho hoje.',
  'A coleção do dia vai embora à meia-noite, viu?',
  'Semente bem gasta é semente feliz.',
  'Psiu… o {pet} ia ficar lindo de chapéu novo.',
  'Cuidar de si também merece um mimo.',
  'Volte amanhã: sempre chega novidade.',
];

/** Quatro destaques que mudam todo dia (um deles do HamiCare+, quando houver). */
function dailyCollection(today: string): Item[] {
  const rnd = mulberry32(hashStr(`colecao:${today}`));
  const pool = ITEMS.filter((i) => !i.souvenir && i.price > 0 && inSeason(i) && i.kind !== 'comida' && i.kind !== 'parede' && i.kind !== 'piso');
  const free = pool.filter((i) => !i.plus).sort(() => rnd() - 0.5);
  const plus = pool.filter((i) => i.plus).sort(() => rnd() - 0.5);
  return [...free.slice(0, plus.length ? 3 : 4), ...plus.slice(0, 1)];
}

function ShopCard({ item, onPlus, onGift }: { item: Item; onPlus: () => void; onGift: (itemId: string) => void }) {
  const s = useApp();
  const res = canBuy(s, item.id);
  const wished = s.wishlist.includes(item.id);
  const isWear = WEARABLE_KINDS.includes(item.kind);
  return (
    <li className={`card shop-card relative grid gap-2 p-3 ${item.plus ? 'is-plus' : ''}`}>
      <button className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-surface2" aria-label={wished ? 'Tirar dos desejos' : 'Guardar nos desejos'} aria-pressed={wished} onClick={() => toggleWish(item.id)}>
        <Heart size={16} className={wished ? 'fill-[var(--accent)] text-accent' : 'text-muted'} />
      </button>
      <div className="grid h-[80px] place-items-center rounded-2xl bg-surface2">
        {isWear ? (
          <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={{ chapeu: null, oculos: null, roupa: null, acessorio: null, [item.kind]: item.id }} size={80} idle={false} label={item.name} />
        ) : (
          <ItemIcon item={item} size={36} />
        )}
      </div>
      <p className="pr-6 text-[14px] font-extrabold leading-tight">
        {item.name} {item.plus && <Sparkles size={13} className="inline text-accent" />}
      </p>
      {item.kind === 'comida' && <p className="-mt-1 text-[12px] text-muted">Você tem {s.inventory[item.id] ?? 0}</p>}
      {res === 'ja-tem' ? (
        <span className="chip chip-leaf justify-center">Já é seu</span>
      ) : res === 'plus' ? (
        <button className="btn btn-soft btn-sm" onClick={onPlus}>
          <Lock size={14} /> Plus
        </button>
      ) : res === 'nivel' ? (
        <span className="chip chip-plain justify-center">Nível {item.level}</span>
      ) : (
        <button className="btn btn-soft btn-sm" disabled={res === 'sem-sementes'} onClick={() => buy(item.id) === 'ok' && toast(isWear ? `${item.name}: já tá vestindo!` : `${item.name} é seu!`)}>
          <Seed /> {item.price}
        </button>
      )}
      {res !== 'plus' && (
        <button className="text-[12px] font-bold text-muted underline underline-offset-2" onClick={() => onGift(item.id)}>
          Presentear um amigo
        </button>
      )}
    </li>
  );
}

// ---------- Armário ----------

function WardrobeTab() {
  const s = useApp();
  const mine = ITEMS.filter((i) => WEARABLE_KINDS.includes(i.kind) && owned(s, i.id));
  return (
    <div className="grid gap-4">
      <div className="grid place-items-center rounded-[26px] bg-surface2 py-3">
        <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} size={180} label={s.pet.name} />
      </div>
      {mine.length ? (
        (['chapeu', 'oculos', 'roupa', 'acessorio'] as WearSlot[]).map((slot) => {
          const items = mine.filter((i) => i.kind === slot);
          if (!items.length) return null;
          return (
            <section key={slot} className="grid gap-2">
              <h2 className="font-display text-[19px] font-bold">{KIND_LABEL[slot]}</h2>
              <div className="flex flex-wrap gap-2">
                {items.map((i) => {
                  const on = s.pet.outfit[slot] === i.id;
                  return (
                    <button key={i.id} className={`chip ${on ? 'chip-accent' : 'chip-plain'}`} aria-pressed={on} onClick={() => (on ? unwear(slot) : wear(i.id))}>
                      {on ? '✓ ' : ''}
                      {i.name}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })
      ) : (
        <p className="rounded-2xl border-2 border-dashed border-line p-5 text-center text-muted">Ainda não tem roupinhas. Que tal escolher a primeira na Loja?</p>
      )}
    </div>
  );
}
