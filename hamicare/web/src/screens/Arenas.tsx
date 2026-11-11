// Mapa das Arenas: a trilha das 12 arenas, a arena de agora, as já abertas e as que vêm depois.
// Daqui o Hami muda de casa (as casas antigas ficam guardadas) e você espia as casas de cada arena.
import { useEffect, useRef, useState } from 'react';
import { Check, Home as HomeIcon, Lock, MapPin, Eye } from 'lucide-react';
import { ArenaScene } from '../components/ArenaScene';
import { Chest } from '../components/Chest';
import { Hamster } from '../components/Hamster';
import { Room } from '../components/Room';
import { Glyph } from '../components/art';
import { ItemIcon } from '../components/ItemIcon';
import { Seed, Sheet, toast } from '../components/ui';
import { itemById } from '../data/items';
import { periodOf } from '../data/lines';
import { gameCfg } from '../lib/game';
import { backToEarth, buyMoon, currentArena, homeArenaOf, houseOf, moveHome, useApp } from '../lib/store';
import { MoonTrip } from '../components/MoonTrip';
import { MOON_N, MOON_PRICE } from '../data/arenas';
import { levelProgress } from '../logic/progress';
import { arenaItemsOf } from '../shared/game/catalog';
import { nextArena, xpAt } from '../shared/game/levels';
import type { ArenaDef } from '../shared/game/config';
import type { State } from '../types';
import { CompanionBuddy, CompanionsCard } from './Companions';
import { Egg } from '../components/Companion';
import { companionOfArena, HATCH_DAYS } from '../data/companions';

export const arenaByN = (n: number) => gameCfg().arenas.find((a) => a.n === n) ?? gameCfg().arenas[0];

/** Nível e barra de XP, com a próxima arena. */
export function LevelCard({ s }: { s: State }) {
  const cfg = gameCfg();
  const lp = levelProgress(s.xp);
  const level = Math.max(lp.level, s.game.maxLevel);
  const next = nextArena(level, cfg);
  const toNext = next ? Math.max(0, xpAt(next.level, cfg) - s.xp) : 0;
  return (
    <section className="card grid gap-2.5 p-4" aria-label="Seu nível">
      <div className="flex items-center gap-3">
        <span className="level-badge" aria-hidden="true">{level}</span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Nível {level}</p>
          <p className="font-display text-[19px] font-bold leading-tight">{arenaByN(currentArena(s)).name}</p>
        </div>
      </div>
      <div className="bar" role="progressbar" aria-label="XP até o próximo nível" aria-valuemin={0} aria-valuemax={lp.needed} aria-valuenow={lp.current}>
        <div className="bar-fill bar-leaf" style={{ transform: `scaleX(${Math.min(1, lp.current / Math.max(1, lp.needed))})` }} />
      </div>
      <p className="text-[14px] text-muted">
        {lp.current} de {lp.needed} XP para o nível {lp.level + 1}
        {next ? (
          <>
            {' '}· <b className="text-ink">{next.name}</b> abre no nível {next.level} (faltam {toNext} XP)
          </>
        ) : (
          ' · Você já chegou na última arena. Os níveis continuam dando prêmios.'
        )}
      </p>
    </section>
  );
}

export function ArenasTab({ onHouse }: { onHouse: () => void }) {
  const s = useApp();
  const cfg = gameCfg();
  const cur = currentArena(s);
  const home = homeArenaOf(s);
  const [open, setOpen] = useState<number | null>(null);
  const curRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (cur > 2) curRef.current?.scrollIntoView({ block: 'center' });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="grid gap-4">
      <LevelCard s={s} />
      <MoonCard onHouse={onHouse} />
      <CompanionsCard />
      <ol className="arena-trail" aria-label="Trilha das arenas">
        {cfg.arenas.map((a, i) => {
          const unlocked = a.n <= cur;
          const isHome = a.n === home;
          return (
            <li key={a.n} ref={a.n === cur ? curRef : undefined} className={`arena-stop ${i % 2 ? 'is-right' : ''} ${a.n === cur ? 'is-current' : ''} ${unlocked ? '' : 'is-locked'}`}>
              <button className="arena-card" onClick={() => setOpen(a.n)} aria-label={`${a.name}, ${unlocked ? (isHome ? 'onde o Hami mora' : 'aberta') : `abre no nível ${a.level}`}`}>
                <ArenaScene arena={a.id} height={118} mini locked={!unlocked} time="dia" />
                <span className="arena-num">{a.n}</span>
                {unlocked ? (
                  isHome ? (
                    <span className="arena-flag is-home"><HomeIcon size={13} /> Mora aqui</span>
                  ) : (
                    <span className="arena-flag"><Check size={13} /> Aberta</span>
                  )
                ) : (
                  <span className="arena-lock"><Lock size={22} /></span>
                )}
                <span className="arena-label">
                  <b>{a.name}</b>
                  <small>{unlocked ? a.desc : `Nível ${a.level}`}</small>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <ArenaSheet n={open} onClose={() => setOpen(null)} onHouse={() => (setOpen(null), onHouse())} />
    </div>
  );
}

function Rewards({ a, fur }: { a: ArenaDef; fur: string }) {
  const items = arenaItemsOf(a.n, a.reward.items).map(itemById).filter(Boolean);
  const egg = companionOfArena(a.n);
  return (
    <div className="flex flex-wrap gap-2">
      {egg && (
        <span className="reward-chip" title={`Choca com ${HATCH_DAYS} dias de cuidado`}>
          <Egg colors={egg.egg} size={24} /> Ovo de pet misterioso
        </span>
      )}
      {a.reward.coins > 0 && (
        <span className="reward-chip">
          <Seed size={18} /> {a.reward.coins}
        </span>
      )}
      {a.reward.chest && (
        <span className="reward-chip">
          <Chest kind={a.reward.chest} size={26} /> {gameCfg().chests[a.reward.chest].name}
        </span>
      )}
      {items.map((it) => (
        <span key={it!.id} className="reward-chip" title={it!.name}>
          <ItemIcon item={it!} size={20} fur={fur} /> {it!.name}
        </span>
      ))}
    </div>
  );
}

function ArenaSheet({ n, onClose, onHouse }: { n: number | null; onClose: () => void; onHouse: () => void }) {
  const s = useApp();
  const [peek, setPeek] = useState(false);
  const last = useRef<number | null>(n);
  if (n != null) last.current = n;
  const a = arenaByN(last.current ?? 1);
  const unlocked = a.n <= currentArena(s);
  const isHome = a.n === homeArenaOf(s);

  useEffect(() => setPeek(false), [n]);

  function move() {
    if (moveHome(a.n)) toast(`${s.pet.name} se mudou para ${a.name}. A casa antiga ficou guardada.`);
  }

  return (
    <Sheet open={n != null} onClose={onClose} title={a.name}>
      <div className="grid gap-4">
        {peek && unlocked ? (
          <Room house={houseOf(s, a.n)} period={periodOf()} height={320}>
            <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood="feliz" size={124} label={s.pet.name} />
          </Room>
        ) : (
          <ArenaScene arena={a.id} height={220} locked={!unlocked}>
            {unlocked && (
              <div className="relative">
                <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood="feliz" size={104} label={s.pet.name} />
                <CompanionBuddy hamster={104} />
              </div>
            )}
          </ArenaScene>
        )}
        <p className="text-[15px] leading-snug">{a.desc}</p>
        <section className="grid gap-2">
          <h3 className="section-label">{unlocked ? 'O que veio com esta arena' : `Prêmios do nível ${a.level}`}</h3>
          <Rewards a={a} fur={s.pet.fur} />
        </section>
        {unlocked ? (
          <div className="grid gap-2">
            {isHome ? (
              <>
                <p className="flex items-center gap-2 rounded-2xl bg-accent-soft p-3 font-bold">
                  <MapPin size={18} /> {s.pet.name} mora aqui
                </p>
                <button className="btn btn-primary" onClick={onHouse}>
                  <HomeIcon size={18} /> Ver e decorar a casa
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-primary" onClick={move}>
                  <HomeIcon size={18} /> Morar aqui
                </button>
                <button className="btn btn-soft" onClick={() => setPeek(!peek)}>
                  <Eye size={18} /> {peek ? 'Ver a paisagem' : 'Espiar a casa daqui'}
                </button>
                <p className="text-[13px] text-muted">Mudar de casa é de graça e dá pra voltar quando quiser. Cada casa guarda seus móveis.</p>
              </>
            )}
          </div>
        ) : (
          <p className="rounded-2xl bg-surface2 p-3 font-bold">
            Abre no nível {a.level}. Cada missão feita te leva mais perto, no seu ritmo.
          </p>
        )}
      </div>
    </Sheet>
  );
}

/** Selo do lugar onde o Hami mora (para o Início). */
export function ArenaPin({ s, onClick }: { s: State; onClick: () => void }) {
  const a = arenaByN(homeArenaOf(s));
  return (
    <button className="arena-pin" onClick={onClick} aria-label={`Mapa das arenas. Agora em ${a.name}`}>
      <Glyph e="🗺️" size={24} />
      <span>Mapa</span>
    </button>
  );
}

/** Viagem para a Lua: casa lunar por 5.000 sementes, com a animação do foguete. */
function MoonCard({ onHouse }: { onHouse: () => void }) {
  const s = useApp();
  const [flying, setFlying] = useState(false);
  const home = homeArenaOf(s) === MOON_N;
  const pct = Math.min(1, s.coins / MOON_PRICE);
  return (
    <section className="moon-card" aria-label="Viagem para a Lua">
      <span className="moon-card-ball" aria-hidden="true" />
      <h2>Casa na Lua</h2>
      <p>
        {s.moon
          ? home
            ? `${s.pet.name} mora na Lua, com a Terra na janela.`
            : `${s.pet.name} tem uma casa na Lua. Quer voltar para lá?`
          : 'Uma casa lunar com foguete, cama de cratera e a Terra na janela. A viagem mais especial do HamiCare.'}
      </p>
      {s.moon ? (
        home ? (
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-soft btn-sm" onClick={onHouse}>
              Ver a casa lunar
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => backToEarth() && toast(`${s.pet.name} voltou para a Terra! 🌍`)}>
              🌍 Voltar para a Terra
            </button>
          </div>
        ) : (
          <button className="btn btn-primary btn-sm justify-self-start" onClick={() => setFlying(true)}>
            Voar para a Lua
          </button>
        )
      ) : (
        <>
          <div className="bar" role="progressbar" aria-label="Sementes para a viagem" aria-valuemin={0} aria-valuemax={MOON_PRICE} aria-valuenow={Math.min(s.coins, MOON_PRICE)}>
            <div className="bar-fill bar-leaf" style={{ transform: `scaleX(${pct})` }} />
          </div>
          <button
            className="btn btn-primary btn-sm justify-self-start"
            disabled={s.coins < MOON_PRICE}
            onClick={() => {
              const r = buyMoon();
              if (r === 'ok') setFlying(true);
              else if (r === 'sem-sementes') toast(`Faltam ${MOON_PRICE - s.coins} sementes para a viagem.`);
            }}
          >
            <Seed size={14} /> {s.coins >= MOON_PRICE ? `Viajar por ${MOON_PRICE.toLocaleString('pt-BR')}` : `${s.coins.toLocaleString('pt-BR')} de ${MOON_PRICE.toLocaleString('pt-BR')} sementes`}
          </button>
        </>
      )}
      <MoonTrip
        open={flying}
        onDone={() => {
          setFlying(false);
          if (homeArenaOf(s) !== MOON_N) moveHome(MOON_N);
          toast(`${s.pet.name} chegou na Lua! 🌙`);
        }}
      />
    </section>
  );
}

