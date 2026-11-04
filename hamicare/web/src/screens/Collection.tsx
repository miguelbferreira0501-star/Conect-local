// Coleção: o inventário (com raridade, origem e o selo "Novo"), o Álbum de Coleções com prêmios,
// a Oficina (fragmentos viram o item que falta) e a Carteira (histórico de sementes e XP).
import { useEffect, useMemo, useState } from 'react';
import { Check, Hammer } from 'lucide-react';
import { ItemIcon } from '../components/ItemIcon';
import { Glyph } from '../components/art';
import { Seed, Sheet, toast } from '../components/ui';
import { HOUSE_KINDS, ITEMS, LOOKS, WEARABLE_KINDS, itemById, type Item } from '../data/items';
import { gameCfg } from '../lib/game';
import { craftNow, loadLedger } from '../lib/chests';
import { claimCollection, collectionClaimed, markSeen, placeItem, useApp, wear } from '../lib/store';
import { RARITY_ORDER, chestPool, collectionProgress, rarityOf, type LedgerEntry, type Rarity } from '../shared/game';
import type { ItemOrigin, State } from '../types';
import { Fragments, RarityChip, rarityColor, rarityLabel } from './Chests';

const ORIGIN_LABEL: Record<ItemOrigin, string> = { loja: 'Vendinha', bau: 'Baú', arena: 'Arena', oficina: 'Oficina', presente: 'Presente', inicio: 'Começo' };
const ownedIds = (s: State) => new Set(Object.keys(s.inventory).filter((id) => s.inventory[id] > 0));
const isNew = (s: State, id: string) => !!s.itemMeta?.[id] && !s.itemMeta[id].seen;

function Tile({ item, s, onClick, dim }: { item: Item; s: State; onClick?: () => void; dim?: boolean }) {
  const r = rarityOf(item);
  return (
    <button className={`inv-tile ${dim ? 'is-dim' : ''}`} style={{ ['--rc' as string]: rarityColor(r) }} onClick={onClick} aria-label={`${item.name}, ${rarityLabel(r)}${isNew(s, item.id) ? ', novo' : ''}`}>
      {isNew(s, item.id) && <span className="inv-new">Novo</span>}
      <span className="inv-icon">
        <ItemIcon item={item} size={30} fur={s.pet.fur} />
      </span>
      <span className="inv-name">{item.name}</span>
    </button>
  );
}

// ---------- Itens ----------

type KindF = 'todos' | 'novos' | 'vestir' | 'casa';

export function InventoryView() {
  const s = useApp();
  const [kind, setKind] = useState<KindF>('todos');
  const [rar, setRar] = useState<Rarity | null>(null);
  const [from, setFrom] = useState<ItemOrigin | null>(null);
  const [open, setOpen] = useState<Item | null>(null);
  const mine = useMemo(() => ITEMS.filter((i) => i.kind !== 'comida' && (s.inventory[i.id] ?? 0) > 0), [s.inventory]);
  const newIds = mine.filter((i) => isNew(s, i.id)).map((i) => i.id);

  // Ao sair do inventário, os itens vistos perdem o selo "Novo".
  useEffect(() => () => markSeen(newIds), []); // eslint-disable-line react-hooks/exhaustive-deps

  const list = mine
    .filter((i) => (kind === 'novos' ? isNew(s, i.id) : kind === 'vestir' ? WEARABLE_KINDS.includes(i.kind) : kind === 'casa' ? !WEARABLE_KINDS.includes(i.kind) : true))
    .filter((i) => !rar || rarityOf(i) === rar)
    .filter((i) => !from || (s.itemMeta?.[i.id]?.from ?? 'inicio') === from)
    .sort((a, b) => (s.itemMeta?.[b.id]?.at ?? 0) - (s.itemMeta?.[a.id]?.at ?? 0) || RARITY_ORDER.indexOf(rarityOf(b)) - RARITY_ORDER.indexOf(rarityOf(a)));

  const meta = open ? s.itemMeta?.[open.id] : undefined;
  return (
    <div className="grid gap-3">
      <p className="text-[14px] text-muted">
        {mine.length} itens na coleção{newIds.length ? ` · ${newIds.length} novos` : ''}
      </p>
      <div className="tabs-scroll">
        {(
          [
            ['todos', 'Todos'],
            ['novos', `Novos (${newIds.length})`],
            ['vestir', 'Para vestir'],
            ['casa', 'Para a casa'],
          ] as const
        ).map(([k, l]) => (
          <button key={k} className={`chip ${kind === k ? 'chip-accent' : 'chip-plain'}`} onClick={() => setKind(k)}>
            {l}
          </button>
        ))}
      </div>
      <div className="tabs-scroll">
        {RARITY_ORDER.map((r) => (
          <button key={r} className={`chip ${rar === r ? 'chip-accent' : 'chip-plain'}`} onClick={() => setRar(rar === r ? null : r)}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: rarityColor(r) }} /> {rarityLabel(r)}
          </button>
        ))}
      </div>
      <div className="tabs-scroll">
        {(['bau', 'loja', 'arena', 'oficina', 'presente'] as ItemOrigin[]).map((o) => (
          <button key={o} className={`chip ${from === o ? 'chip-accent' : 'chip-plain'}`} onClick={() => setFrom(from === o ? null : o)}>
            {ORIGIN_LABEL[o]}
          </button>
        ))}
      </div>
      {list.length ? (
        <div className="inv-grid">
          {list.map((i) => (
            <Tile key={i.id} item={i} s={s} onClick={() => setOpen(i)} />
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-muted">Nada por aqui com esses filtros.</p>
      )}
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.name ?? ''}>
        {open && (
          <div className="grid justify-items-center gap-3 text-center">
            <div className="chest-prize-icon" style={{ ['--rc' as string]: rarityColor(rarityOf(open)) }}>
              <ItemIcon item={open} size={70} fur={s.pet.fur} />
            </div>
            <RarityChip r={rarityOf(open)} />
            <p className="text-[14px] text-muted">
              Veio de: <b>{ORIGIN_LABEL[meta?.from ?? 'inicio']}</b>
              {meta?.at ? ` · ${new Date(meta.at).toLocaleDateString('pt-BR')}` : ''}
            </p>
            {WEARABLE_KINDS.includes(open.kind) && (
              <button className="btn btn-primary w-full" onClick={() => (wear(open.id), toast(`${s.pet.name} está usando ${open.name}!`), setOpen(null))}>
                Vestir no {s.pet.name}
              </button>
            )}
            {HOUSE_KINDS.includes(open.kind) && (
              <button className="btn btn-primary w-full" onClick={() => (placeItem(open.id), toast(`${open.name} foi para a casa.`), setOpen(null))}>
                Colocar na casa
              </button>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}

// ---------- Álbum de Coleções ----------

export function AlbumView({ onWorkshop }: { onWorkshop: () => void }) {
  const s = useApp();
  const cfg = gameCfg();
  const owned = ownedIds(s);
  const done = cfg.collections.filter((c) => collectionProgress(c.items, owned).done).length;
  const looksDone = LOOKS.filter((l) => l.items.every((id) => owned.has(id))).length;
  return (
    <div className="grid gap-3">
      <section className="card flex items-center gap-3 p-4">
        <Glyph e="📖" size={44} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[19px] font-bold leading-tight">Álbum de Coleções</p>
          <p className="text-[14px] text-muted">
            {done} de {cfg.collections.length} completas · {looksDone} de {LOOKS.length} looks inteiros
          </p>
        </div>
      </section>
      <ul className="grid gap-3">
        {cfg.collections.map((c) => {
          const p = collectionProgress(c.items, owned);
          const claimed = collectionClaimed(s, c.id);
          return (
            <li key={c.id} className={`card album-card grid gap-3 p-4 ${p.done ? 'is-done' : ''}`}>
              <div className="flex items-center gap-3">
                <span className={`album-stamp ${p.done ? '' : 'is-off'}`}>
                  <Glyph e={c.art} size={34} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[18px] font-bold leading-tight">{c.name}</p>
                  <p className="text-[13px] text-muted">{c.desc}</p>
                </div>
                <span className="chip chip-plain shrink-0 tabular-nums">
                  {p.have}/{p.total}
                </span>
              </div>
              <div className="bar bar-thin">
                <div className="bar-fill bar-leaf" style={{ transform: `scaleX(${p.have / p.total})` }} />
              </div>
              <div className="album-items">
                {c.items.map((id) => {
                  const it = itemById(id);
                  return it ? (
                    <span key={id} className={`album-item ${owned.has(id) ? '' : 'is-missing'}`} title={it.name} aria-label={`${it.name}${owned.has(id) ? '' : ' (falta)'}`}>
                      <ItemIcon item={it} size={22} fur={s.pet.fur} />
                    </span>
                  ) : null;
                })}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[14px] font-black">
                  Prêmio: <Seed size={15} /> {c.reward.coins} · {c.reward.xp} XP
                </span>
                {claimed ? (
                  <span className="chip chip-plain">
                    <Check size={14} /> Recebido
                  </span>
                ) : p.done ? (
                  <button className="btn btn-primary btn-sm" onClick={() => claimCollection(c.id) && toast(`Coleção ${c.name} completa! +${c.reward.coins} sementes`)}>
                    Pegar prêmio
                  </button>
                ) : (
                  <button className="text-[13px] font-bold text-accent" onClick={onWorkshop}>
                    Fabricar o que falta
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-[13px] text-muted">As peças saem nos baús, na Vendinha ou na Oficina. Cada coleção paga o prêmio uma vez.</p>
    </div>
  );
}

// ---------- Oficina ----------

export function WorkshopView() {
  const s = useApp();
  const cfg = gameCfg();
  const [rar, setRar] = useState<Rarity | null>(null);
  const [pick, setPick] = useState<Item | null>(null);
  const [busy, setBusy] = useState(false);
  const owned = ownedIds(s);
  const pool = useMemo(() => chestPool(), []);
  const missing = pool.filter((p) => !owned.has(p.id));
  const wanted = new Set(cfg.collections.flatMap((c) => c.items).filter((id) => !owned.has(id)));
  const toItems = (ids: { id: string }[]) => ids.map((p) => itemById(p.id)).filter(Boolean) as Item[];
  const forCollections = toItems(missing.filter((p) => wanted.has(p.id)));
  const list = toItems(missing.filter((p) => !rar || p.rarity === rar)).sort((a, b) => RARITY_ORDER.indexOf(rarityOf(a)) - RARITY_ORDER.indexOf(rarityOf(b)));
  const cost = (it: Item) => cfg.rarities[rarityOf(it)].craft;

  async function craft(it: Item) {
    setBusy(true);
    const r = await craftNow(it.id);
    setBusy(false);
    if (r === 'ok') {
      toast(`${it.name} fabricado!`);
      setPick(null);
    } else toast(r === 'sem-fragmentos' ? 'Faltam fragmentos.' : r === 'rede' ? 'Sem conexão agora. Nada foi gasto.' : 'Não deu para fabricar este item.');
  }

  return (
    <div className="grid gap-3">
      <section className="workshop-hero">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/25">
            <Hammer size={28} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[20px] font-bold leading-tight">Oficina</p>
            <p className="text-[14px] font-semibold leading-snug opacity-90">Item repetido de baú vira fragmentos. Junte e fabrique o item que você quiser.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Fragments n={s.game.fragments} />
          {RARITY_ORDER.map((r) => (
            <span key={r} className="text-[12px] font-bold opacity-90">
              {rarityLabel(r)} {cfg.rarities[r].craft}
            </span>
          ))}
        </div>
      </section>
      {forCollections.length > 0 && (
        <section className="grid gap-2">
          <h3 className="section-label px-1">Faltam para as coleções</h3>
          <div className="inv-grid">
            {forCollections.slice(0, 9).map((it) => (
              <CraftTile key={it.id} item={it} s={s} cost={cost(it)} onClick={() => setPick(it)} />
            ))}
          </div>
        </section>
      )}
      <h3 className="section-label px-1">Todos que faltam ({missing.length})</h3>
      <div className="tabs-scroll">
        {RARITY_ORDER.map((r) => (
          <button key={r} className={`chip ${rar === r ? 'chip-accent' : 'chip-plain'}`} onClick={() => setRar(rar === r ? null : r)}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: rarityColor(r) }} /> {rarityLabel(r)}
          </button>
        ))}
      </div>
      {list.length ? (
        <div className="inv-grid">
          {list.map((it) => (
            <CraftTile key={it.id} item={it} s={s} cost={cost(it)} onClick={() => setPick(it)} />
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-muted">Você já tem todos desta raridade!</p>
      )}
      <Sheet open={!!pick} onClose={() => setPick(null)} title="Fabricar">
        {pick && (
          <div className="grid justify-items-center gap-3 text-center">
            <div className="chest-prize-icon" style={{ ['--rc' as string]: rarityColor(rarityOf(pick)) }}>
              <ItemIcon item={pick} size={70} fur={s.pet.fur} />
            </div>
            <p className="font-display text-[22px] font-bold">{pick.name}</p>
            <RarityChip r={rarityOf(pick)} />
            <button className="btn btn-primary w-full" disabled={busy || s.game.fragments < cost(pick)} onClick={() => craft(pick)}>
              {s.game.fragments < cost(pick) ? `Faltam ${cost(pick) - s.game.fragments} fragmentos` : `Fabricar por ${cost(pick)} fragmentos`}
            </button>
          </div>
        )}
      </Sheet>
    </div>
  );
}

function CraftTile({ item, s, cost, onClick }: { item: Item; s: State; cost: number; onClick: () => void }) {
  const can = s.game.fragments >= cost;
  return (
    <button className={`inv-tile ${can ? '' : 'is-dim'}`} style={{ ['--rc' as string]: rarityColor(rarityOf(item)) }} onClick={onClick} aria-label={`${item.name}, ${cost} fragmentos`}>
      <span className="inv-icon">
        <ItemIcon item={item} size={30} fur={s.pet.fur} />
      </span>
      <span className="inv-name">{item.name}</span>
      <span className="inv-cost">
        <Glyph e="💎" size={12} /> {cost}
      </span>
    </button>
  );
}

// ---------- Carteira ----------

export function WalletSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useApp();
  const [data, setData] = useState<{ entries: LedgerEntry[]; fromServer: boolean } | null>(null);
  useEffect(() => {
    if (!open) return;
    let live = true;
    setData(null);
    loadLedger().then((d) => live && setData(d));
    return () => {
      live = false;
    };
  }, [open]);
  return (
    <Sheet open={open} onClose={onClose} title="Carteira">
      <div className="grid gap-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="wallet-box">
            <Seed size={22} />
            <b className="tabular-nums">{s.coins}</b>
            <span>sementes</span>
          </div>
          <div className="wallet-box">
            <Glyph e="💎" size={22} />
            <b className="tabular-nums">{s.game.fragments}</b>
            <span>fragmentos</span>
          </div>
          <div className="wallet-box">
            <Glyph e="⭐" size={22} />
            <b className="tabular-nums">{s.xp}</b>
            <span>XP</span>
          </div>
        </div>
        <h3 className="section-label">Histórico</h3>
        {!data ? (
          <p className="text-muted">Carregando…</p>
        ) : data.entries.length ? (
          <ul className="grid gap-1.5">
            {data.entries.slice(0, 60).map((e, i) => (
              <li key={`${e.ref}-${i}`} className="wallet-row">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{e.label}</span>
                  <span className="block text-[12px] text-muted">{new Date(Number(e.at)).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                </span>
                {e.xp !== 0 && <span className="text-[13px] font-bold text-muted tabular-nums">{e.xp > 0 ? '+' : ''}{e.xp} XP</span>}
                {e.coins !== 0 && (
                  <span className={`font-black tabular-nums ${e.coins > 0 ? 'text-leaf' : 'text-[#d9542b]'}`}>
                    {e.coins > 0 ? '+' : ''}
                    {e.coins}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Ainda sem movimentos. Faça uma missão para ganhar as primeiras sementes!</p>
        )}
        <p className="text-[13px] text-muted">Sementes só se ganham cuidando de você no app. Não existe compra de sementes com dinheiro.{data?.fromServer ? ' Este histórico vem da sua conta.' : ''}</p>
      </div>
    </Sheet>
  );
}
