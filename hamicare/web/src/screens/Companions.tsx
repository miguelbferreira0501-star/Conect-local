// Pets companheiros: o cartão no Mapa das Arenas, a coleção, o ovo chocando e o pet que anda junto com o Hami.
import { useContext, useState } from 'react';
import { GrowthContext } from '../components/Hamster';
import { createPortal } from 'react-dom';
import { Heart } from 'lucide-react';
import { CompanionArt, Egg } from '../components/Companion';
import { Sheet } from '../components/ui';
import { companionById, companionStatus, HATCH_DAYS, PET_VOICE, type Companion } from '../data/companions';
import { gameCfg } from '../lib/game';
import { play } from '../lib/sound';
import { hatchCompanion, setCompanion, useApp } from '../lib/store';

const VOICE = PET_VOICE;

const arenaName = (n: number) => gameCfg().arenas.find((a) => a.n === n)?.name ?? `Arena ${n}`;
const daysWord = (n: number) => (n === 1 ? '1 dia' : `${n} dias`);

/** O pet que anda com o Hami (tocar faz ele pular e fazer barulhinho). Fica do lado do Hami, no mesmo chão,
 *  e acompanha o tamanho dele (o Hami filhote é bem menor). `hamster` é o tamanho do desenho do Hami ao lado. */
export function CompanionBuddy({ hamster = 176 }: { hamster?: number }) {
  const s = useApp();
  const k = useContext(GrowthContext);
  const pet = companionById(s.companions?.active);
  const [hop, setHop] = useState(0);
  if (!pet) return null;
  const size = Math.round(hamster * (0.3 + 0.14 * k));
  const half = 67 * k * (hamster / 200);
  const style = { left: `calc(50% - ${Math.round(half + 2 + size * 0.8)}px)`, bottom: Math.round(0.07 * (hamster - size)) };
  return (
    <button
      className="buddy"
      style={style}
      data-sound="none"
      aria-label={`${pet.name}, seu pet companheiro`}
      onClick={(e) => {
        e.stopPropagation();
        play(VOICE[pet.kind]);
        setHop((h) => h + 1);
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <span key={hop} className={hop ? 'buddy-hop' : 'buddy-idle'}>
        <CompanionArt pet={pet} size={size} />
      </span>
    </button>
  );
}

/** Cartão do Mapa das Arenas: o ovo de agora, o pet que está junto e quantos já nasceram. */
export function CompanionsCard() {
  const s = useApp();
  const [open, setOpen] = useState(false);
  const list = companionStatus(s.companions, s.days);
  const born = list.filter((x) => x.state === 'chocado').length;
  const ready = list.find((x) => x.state === 'pronto');
  const egg = list.find((x) => x.state === 'ovo');
  const active = companionById(s.companions?.active);
  const name = s.pet.name || 'Hami';
  return (
    <>
      <button className={`card pets-card ${ready ? 'is-ready' : ''}`} onClick={() => setOpen(true)} aria-label={`Pets companheiros: ${born} de ${list.length}`}>
        <span className={`pets-card-art ${ready ? 'egg-wobble' : ''}`}>
          {ready ? <Egg colors={ready.pet.egg} warmth={HATCH_DAYS} size={64} /> : active ? <CompanionArt pet={active} size={64} /> : egg ? <Egg colors={egg.pet.egg} warmth={egg.warmth} size={64} /> : <Egg colors={['#EEE', '#DDD']} locked size={64} />}
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="eyebrow block">
            Pets companheiros · {born}/{list.length}
          </span>
          <span className="block font-display text-[18px] font-bold leading-tight">{ready ? 'Um ovo vai chocar!' : active ? `${active.name} anda com o ${name}` : 'Ovo misterioso'}</span>
          <span className="block text-[13px] text-muted">
            {ready ? 'Toque para ver quem vai nascer.' : egg ? `Choca com mais ${daysWord(HATCH_DAYS - egg.warmth)} de cuidado.` : 'Cada arena nova traz um ovo.'}
          </span>
        </span>
      </button>
      <CompanionsSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function CompanionsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useApp();
  const list = companionStatus(s.companions, s.days);
  const active = s.companions?.active ?? null;
  const [view, setView] = useState<Companion | null>(null);
  const [hatching, setHatching] = useState<Companion | null>(null);
  const name = s.pet.name || 'Hami';
  return (
    <Sheet open={open} onClose={onClose} title="Pets companheiros">
      <div className="grid gap-4">
        <p className="text-[14px] leading-snug text-muted">
          Cada arena aberta traz um ovo misterioso. Ele choca depois de {daysWord(HATCH_DAYS)} em que você fez uma missão ou cuidou do {name}. Quem nasce pode andar junto com o {name}.
        </p>
        {view && (
          <section className="pet-detail" aria-label={view.name}>
            <CompanionArt pet={view} size={110} />
            <div className="min-w-0">
              <p className="eyebrow">{view.species} · {arenaName(view.arena)}</p>
              <h3 className="font-display text-[22px] font-bold leading-tight">{view.name}</h3>
              <p className="text-[14px] leading-snug">{view.about}</p>
              {active === view.id ? (
                <button className="btn btn-soft btn-sm mt-2" onClick={() => setCompanion(null)}>
                  Deixar descansando em casa
                </button>
              ) : (
                <button className="btn btn-primary btn-sm mt-2" data-sound="vestir" onClick={() => setCompanion(view.id)}>
                  <Heart size={16} /> Levar junto
                </button>
              )}
            </div>
          </section>
        )}
        <ul className="pets-grid">
          {list.map(({ pet, state, warmth }) => (
            <li key={pet.id} className={`pet-slot is-${state} ${active === pet.id ? 'is-active' : ''}`}>
              {state === 'chocado' ? (
                <button onClick={() => (play(VOICE[pet.kind]), setView(pet))} aria-label={`${pet.name}, ${pet.species}`}>
                  <CompanionArt pet={pet} size={70} />
                  <b>{pet.name}</b>
                  <small>{active === pet.id ? 'Com você' : pet.species}</small>
                </button>
              ) : state === 'pronto' ? (
                <button onClick={() => setHatching(pet)} aria-label={`Chocar o ovo de ${arenaName(pet.arena)}`}>
                  <span className="egg-wobble">
                    <Egg colors={pet.egg} warmth={HATCH_DAYS} size={70} />
                  </span>
                  <b className="text-accent">Chocar!</b>
                  <small>{arenaName(pet.arena)}</small>
                </button>
              ) : state === 'ovo' ? (
                <div aria-label={`Ovo de ${arenaName(pet.arena)}: ${warmth} de ${HATCH_DAYS} dias de cuidado`}>
                  <Egg colors={pet.egg} warmth={warmth} size={70} />
                  <b>
                    {warmth}/{HATCH_DAYS} dias
                  </b>
                  <span className="pet-bar" aria-hidden="true">
                    <span style={{ transform: `scaleX(${warmth / HATCH_DAYS})` }} />
                  </span>
                </div>
              ) : (
                <div aria-label={`Ovo da arena ${pet.arena}, ainda fechada`}>
                  <Egg colors={pet.egg} locked size={70} />
                  <b>Arena {pet.arena}</b>
                  <small>{arenaName(pet.arena)}</small>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      <HatchOverlay pet={hatching} onDone={(p) => (setHatching(null), p && setView(p))} />
    </Sheet>
  );
}

/** O ovo trincando: três toquinhos e o pet nasce. */
function HatchOverlay({ pet, onDone }: { pet: Companion | null; onDone: (p: Companion | null) => void }) {
  const s = useApp();
  const [taps, setTaps] = useState(0);
  const [born, setBorn] = useState(false);
  if (!pet) return null;
  const close = () => {
    setTaps(0);
    setBorn(false);
    onDone(born ? pet : null);
  };
  const tap = () => {
    if (born) return;
    const t = taps + 1;
    setTaps(t);
    if (t < 3) play('bau-treme');
    else if (hatchCompanion(pet.id)) {
      play('festa');
      setTimeout(() => play(VOICE[pet.kind]), 700);
      setBorn(true);
    }
  };
  const isActive = s.companions?.active === pet.id;
  return createPortal(
    <div className="hatch-screen" role="dialog" aria-modal="true" aria-label={born ? `${pet.name} nasceu!` : 'Ovo misterioso'}>
      <div className="streak-rays lvl-rays" aria-hidden="true" />
      {!born ? (
        <div className="relative grid justify-items-center gap-4 text-center">
          <p className="font-display text-[26px] font-bold text-white">Tem alguém aí dentro…</p>
          <button key={taps} className={`hatch-egg ${taps ? 'is-shake' : 'egg-wobble'}`} onClick={tap} data-sound="none" aria-label={`Tocar no ovo (${3 - taps} vezes)`}>
            <Egg colors={pet.egg} warmth={HATCH_DAYS} size={190} />
            {taps >= 1 && <span className="hatch-crack" aria-hidden="true" />}
          </button>
          <p className="text-[16px] font-bold text-white/95">Toque no ovo {3 - taps === 1 ? 'mais 1 vez' : `${3 - taps} vezes`}</p>
          <button className="btn btn-soft btn-sm" onClick={close}>
            Depois
          </button>
        </div>
      ) : (
        <div className="relative grid justify-items-center gap-3 text-center">
          <div className="hatch-pop">
            <CompanionArt pet={pet} size={200} />
          </div>
          <p className="eyebrow !text-white/90">{pet.species} de {arenaName(pet.arena)}</p>
          <h2 className="font-display text-[34px] font-bold leading-tight text-white">{pet.name} nasceu!</h2>
          <p className="max-w-[300px] text-[16px] font-semibold text-white/95">{pet.about}</p>
          <div className="grid w-full max-w-[320px] gap-2">
            {!isActive && (
              <button className="btn welcome-btn w-full" onClick={() => (setCompanion(pet.id), close())}>
                <Heart size={18} /> Levar junto com o {s.pet.name || 'Hami'}
              </button>
            )}
            <button className={`btn w-full ${isActive ? 'welcome-btn' : 'btn-soft'}`} onClick={close}>
              {isActive ? `Oi, ${pet.name}!` : 'Agora não'}
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

