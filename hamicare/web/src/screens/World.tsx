import { MOON_N } from '../data/arenas';
import { useEffect, useState } from 'react';
import { ArrowUpToLine, ChevronLeft, Lock, PackageOpen, Pencil, Sparkles } from 'lucide-react';
import { Hamster } from '../components/Hamster';
import { TripDepart } from '../components/TripDepart';
import { ISLAND_AT, MAP_H, MAP_W, TripMapArt } from '../components/TripMap';
import { CompanionBuddy } from './Companions';
import { Room } from '../components/Room';
import { FLOOR_CSS, WALLPAPER_CSS } from '../components/Furniture';
import { Seg, Sheet, toast } from '../components/ui';
import { HOUSE_KINDS, ITEMS, itemById } from '../data/items';
import { ALL_FINDS, PLACES, placeById } from '../data/world';
import { periodOf } from '../data/lines';
import { levelOf } from '../logic/progress';
import {
  bringFront, homeArenaOf, finishAdventure, moveItem, owned, placeItem, placeLocked, setFloor, setWallpaper, startAdventure, storeItem, useApp, type AdventureResult,
} from '../lib/store';
import { AdventureModal } from './Home';
import { Glyph } from '../components/art';
import { ArenasTab, arenaByN } from './Arenas';
import { ItemIcon } from '../components/ItemIcon';

export type WorldTab = 'arenas' | 'casa' | 'mapa' | 'loja' | 'armario';
type Tab = WorldTab;

export function World({ onPlus, initialTab, onBack }: { onPlus: () => void; onGift?: (itemId: string) => void; initialTab?: Tab; onBack?: () => void }) {
  const s = useApp();
  const [tab, setTab] = useState<Tab>(initialTab ?? 'casa');
  return (
    <div className="grid gap-4">
      <header className="flex items-end gap-3">
        {onBack && (
          <button className="world-back" onClick={onBack} aria-label="Voltar para o Início">
            <ChevronLeft size={24} />
          </button>
        )}
        <div>
          <p className="eyebrow">Nível {levelOf(s.xp)}</p>
          <h1 className="font-display text-[30px] font-bold leading-tight">Mundo</h1>
        </div>
      </header>
      <Seg value={tab} onChange={setTab} label="Seções do mundo" options={[{ id: 'arenas', label: 'Arenas' }, { id: 'casa', label: 'Casa' }, { id: 'mapa', label: 'Passeios' }]} />
      {tab === 'arenas' && <ArenasTab onHouse={() => setTab('casa')} />}
      {tab === 'casa' && <HouseTab onArenas={() => setTab('arenas')} />}
      {tab === 'mapa' && <MapTab onPlus={onPlus} />}
    </div>
  );
}

// ---------- Casa ----------

function HouseTab({ onArenas }: { onArenas: () => void }) {
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
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate font-bold">
          Casa em <span className="font-display text-[17px]">{homeArenaOf(s) === MOON_N ? 'Lua' : arenaByN(homeArenaOf(s)).name}</span>
        </p>
        <button className="btn btn-soft btn-sm shrink-0" onClick={onArenas}>
          Trocar de casa
        </button>
      </div>
      <Room house={s.house} period={periodOf()} height={400} editing={editing} selected={sel} onSelect={setSel} onMove={moveItem} onRemove={(uid) => (storeItem(uid), setSel(null), toast('Guardado nos seus móveis'))} onFront={bringFront}>
        {!s.adventure && (
          <div className="relative">
            <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood={s.pet.sleeping ? 'dormindo' : 'feliz'} size={150} label={s.pet.name} turn />
            {!editing && <CompanionBuddy hamster={150} />}
          </div>
        )}
      </Room>
      <div className="flex gap-2">
        <button className={`btn flex-1 ${editing ? 'btn-primary' : 'btn-soft'}`} onClick={() => (setEditing(!editing), setSel(null))}>
          <Pencil size={18} /> {editing ? 'Pronto' : 'Decorar'}
        </button>
      </div>
      {editing && (
        <>
          <p className="text-[14px] text-muted">Arraste os móveis com o dedo. Toque num móvel para trazer pra frente ou tirar da casa (o Hami fica transparente para você alcançar o que está atrás dele).</p>
          {selItem && (
            <div className="flex items-center gap-2 rounded-2xl bg-accent-soft p-3">
              <span className="house-sel-icon" aria-label={itemById(selItem.itemId)?.name}>
                {itemById(selItem.itemId) && <ItemIcon item={itemById(selItem.itemId)!} size={30} />}
              </span>
              <span className="flex-1" />
              <button className="btn btn-ghost btn-sm" onClick={() => bringFront(selItem.uid)}>
                <ArrowUpToLine size={16} /> Frente
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => (storeItem(selItem.uid), setSel(null))}>
                <PackageOpen size={16} /> Tirar da casa
              </button>
            </div>
          )}
          <section className="grid gap-2">
            <h2 className="font-display text-[19px] font-bold">Seus móveis guardados</h2>
            {tray.length ? (
              <div className="grid grid-cols-4 gap-2">
                {tray.map((i) => (
                  <button key={i.id} className="tile house-tray-tile" onClick={() => placeItem(i.id)} aria-label={`Colocar ${i.name}`}>
                    <ItemIcon item={i} size={40} />
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
    </div>
  );
}

// ---------- Mapa ----------

function MapTab({ onPlus }: { onPlus: () => void }) {
  const s = useApp();
  const [open, setOpen] = useState<string | null>(null);
  const [result, setResult] = useState<AdventureResult | null>(null);
  const [album, setAlbum] = useState(false);
  const [trip, setTrip] = useState<{ name: string; colors: [string, string] } | null>(null);
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
          <Glyph e={advPlace.emoji} size={40} />
          <div className="min-w-0 flex-1">
            <p className="font-bold leading-tight">
              {s.pet.name} está em {advPlace.name}
            </p>
            <p className="text-[13px] text-muted">{advLeft > 0 ? `Volta em ~${advLeft} min. Cada atividade concluída traz ele 5 min mais cedo.` : 'Já voltou!'}</p>
          </div>
          {advLeft === 0 && (
            <button className="btn btn-primary btn-sm" data-sound="conquista" onClick={() => setResult(finishAdventure())}>
              Abrir
            </button>
          )}
        </div>
      )}
      <div className="trip-map" role="group" aria-label="Mapa dos passeios">
        <TripMapArt locked={Object.fromEntries(PLACES.map((p) => [p.id, !!placeLocked(s, p.id)]))} />
        {PLACES.map((p) => {
          const lock = placeLocked(s, p.id);
          const [x, y] = ISLAND_AT[p.id] ?? [200, 400];
          const got = p.finds.filter((f) => s.finds.includes(f.id)).length;
          return (
            <button key={p.id} className="trip-spot" style={{ left: `${(x / MAP_W) * 100}%`, top: `${((y - 22) / MAP_H) * 100}%` }} onClick={() => setOpen(p.id)} aria-label={`${p.name}${lock === 'nivel' ? `, libera no nível ${p.level}` : lock === 'plus' ? ', só no Plus' : `, ${got} de ${p.finds.length} achadinhos`}`}>
              {lock ? (
                <span className={`trip-lock ${lock === 'plus' ? 'is-plus' : ''}`} aria-hidden="true">
                  {lock === 'plus' ? <Sparkles size={16} /> : <Lock size={16} />}
                </span>
              ) : (
                <span className="trip-count" aria-hidden="true">
                  {got}/{p.finds.length}
                </span>
              )}
            </button>
          );
        })}
        {(() => {
          const at = adv && advPlace ? ISLAND_AT[advPlace.id] : ISLAND_AT.casa;
          return (
            <span className="trip-pin" style={{ left: `${(at[0] / MAP_W) * 100}%`, top: `${((at[1] - 74) / MAP_H) * 100}%` }} aria-label={adv && advPlace ? `${s.pet.name} está em ${advPlace.name}` : `${s.pet.name} está em casa`}>
              <span className="trip-pin-face">
                <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} size={78} idle={false} mood="feliz" growth={1} />
              </span>
            </span>
          );
        })()}
        <button className="trip-album" onClick={() => setAlbum(true)}>
          <Glyph e="📒" size={22} />
          <span>
            Álbum {s.finds.length}/{ALL_FINDS.length}
          </span>
        </button>
      </div>
      <Sheet open={album} onClose={() => setAlbum(false)} title="Álbum de achadinhos">
      <section className="album" aria-label="Álbum de achadinhos">
        <p className="text-[13px] font-semibold text-[#7a5a3a]">Cada aventura pode trazer uma figurinha nova. As que faltam aparecem só a sombrinha.</p>
        <div className="grid gap-2.5">
          {PLACES.map((pl) => {
            const got = pl.finds.filter((f) => s.finds.includes(f.id)).length;
            return (
              <div key={pl.id} className="album-row">
                <span className="album-place">
                  <Glyph e={pl.emoji} size={28} />
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
                        <span className="sticker-art"><Glyph e={f.emoji} size={36} /></span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      </Sheet>

      <Sheet open={!!place} onClose={() => setOpen(null)} title={place ? place.name : ''}>
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
                      {m.minutes >= 60 ? `${m.minutes / 60} h` : `${m.minutes} min`} · <Glyph e="⚡" size={14} className="gi" /> {m.energy} de energia · <Glyph e="🌻" size={14} className="gi" /> {m.coins}
                    </p>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!!adv}
                    data-sound="enviar"
                    onClick={() => {
                      const r = startAdventure(place.id, m.id);
                      const msg = { ok: `${s.pet.name} saiu para a aventura!`, cansado: `${s.pet.name} está cansado. Deixe ele dormir um pouco.`, dormindo: `${s.pet.name} está dormindo.`, ocupado: 'Já tem uma aventura em andamento.', bloqueado: 'Lugar bloqueado.' }[r];
                      if (r === 'ok') {
                        setOpen(null);
                        setTrip({ name: place.name, colors: place.colors as [string, string] });
                      } else toast(msg);
                    }}
                  >
                    Ir
                  </button>
                </div>
              ))}
            <div className="flex gap-2">
              {place.finds.map((f) => (
                <span key={f.id} className={`chip ${s.finds.includes(f.id) ? 'chip-gold' : 'chip-plain'}`}>
                  {s.finds.includes(f.id) ? (
                    <>
                      <Glyph e={f.emoji} size={18} /> {f.name}
                    </>
                  ) : (
                    '? Achadinho'
                  )}
                </span>
              ))}
            </div>
            <p className="text-[12px] text-muted">A missão longa sempre traz um achadinho novo, se faltar algum.</p>
          </div>
        )}
      </Sheet>
      <AdventureModal result={result} onClose={() => setResult(null)} />
      <TripDepart place={trip} onDone={() => (setTrip(null), toast(`${s.pet.name} saiu para a aventura!`))} />
    </div>
  );
}
