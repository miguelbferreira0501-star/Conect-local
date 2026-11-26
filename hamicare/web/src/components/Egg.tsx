// Ovinho que choca com as tarefas: a cada tarefa concluída aparece o ovo ao lado do Lumbi, um passo mais perto
// de chocar (com rachadinhas aparecendo). Na 5ª tarefa ele racha de vez e nasce um filhote novo, que entra
// na coleção. Um toque em qualquer lugar fecha.
import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { dayGoalOf, dayOf, EGG_GOAL, eggCount, todayKey, todayTasks, useApp, watchState } from '../lib/store';
import { play } from '../lib/sound';
import { CompanionArt } from './Companion';
import { COMPANIONS, type CompanionKind } from '../data/companions';
import { PetAct, type Trick } from './LivePet';
import type { State } from '../types';

const EGG_COLORS = [
  ['#BDEBFF', '#8FD3F2', '#E6F8FF'],
  ['#FFD6E4', '#FF9FBF', '#FFF0F5'],
  ['#E6DCFF', '#B9A4FF', '#F6F2FF'],
  ['#D9F5D0', '#9FD98C', '#F2FFEE'],
  ['#FFF0B8', '#FFD166', '#FFFAE6'],
];

/** O ovo, com manchas onduladas e rachaduras conforme o progresso (0 a 1). */
export function EggArt({ k = 0, progress = 0, size = 150, open = false }: { k?: number; progress?: number; size?: number; open?: boolean }) {
  const [base, spot, shine] = EGG_COLORS[k % EGG_COLORS.length];
  const cracks = Math.floor(progress * 4);
  const cid = `egg${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg viewBox="0 0 120 150" width={size} height={size * 1.25} aria-hidden="true" className={`egg ${open ? 'is-open' : ''}`}>
      <defs>
        <clipPath id={cid}>
          <path d="M60 4 C92 4 114 52 114 92 C114 126 90 146 60 146 C30 146 6 126 6 92 C6 52 28 4 60 4 Z" />
        </clipPath>
      </defs>
      <g className="egg-top">
        <g clipPath={`url(#${cid})`}>
          <rect width="120" height="150" fill={base} />
          <path d="M-10 70 C20 40 40 100 70 66 S110 40 130 64 V-10 H-10 Z" fill={shine} opacity="0.85" />
          <path d="M-10 118 C20 92 46 140 76 108 S112 92 130 110 V160 H-10 Z" fill={spot} opacity="0.75" />
          <circle cx="86" cy="40" r="9" fill={spot} opacity="0.6" />
          <circle cx="30" cy="92" r="7" fill={shine} opacity="0.9" />
        </g>
        <ellipse cx="40" cy="36" rx="9" ry="16" fill="#fff" opacity="0.55" transform="rotate(20 40 36)" />
        {cracks >= 1 && <path d="M58 60 l6 8 -5 7 7 6" fill="none" stroke="#5a6b8c" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />}
        {cracks >= 2 && <path d="M30 80 l8 4 -2 8 8 3" fill="none" stroke="#5a6b8c" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />}
        {cracks >= 3 && <path d="M84 84 l-7 5 4 7 -6 5" fill="none" stroke="#5a6b8c" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />}
      </g>
    </svg>
  );
}

/** Filhotes antigos (antes do redesenho) viram os bichinhos novos, no mesmo estilo dos companheiros. */
const LEGACY: Record<string, CompanionKind> = { pintinho: 'passarinho', coelhinho: 'ovelha', patinho: 'passarinho', sapinho: 'tartaruga' };

/** Os filhotes que nascem dos ovos: os mesmos bichinhos dos companheiros (contorno macio, olhos brilhantes). */
export function EggPet({ id, size = 80 }: { id: string; size?: number }) {
  const kind = (LEGACY[id] ?? id) as CompanionKind;
  const pet = COMPANIONS.find((c) => c.kind === kind) ?? COMPANIONS[0];
  return <CompanionArt pet={pet} size={size} label={NAMES[id] ?? pet.species} />;
}

const NAMES: Record<string, string> = { pintinho: 'Passarinho', coelhinho: 'Ovelhinha', passarinho: 'Passarinho', tartaruga: 'Tartaruguinha', ourico: 'Ouricinho', sapinho: 'Tartaruguinha', patinho: 'Passarinho', joaninha: 'Joaninha', ovelha: 'Ovelhinha', pinguim: 'Pinguinzinho', gatinho: 'Gatinho', polvo: 'Polvinho' };
const CHEER: Trick[] = ['coracao', 'comemora', 'estrela', 'danca', 'acenar'];

const doneToday = (s: State) => {
  const k = todayKey();
  const day = dayOf(s, k);
  const tasks = todayTasks(s, k);
  return { ids: tasks.filter((t) => t.id in day.done).map((t) => t.id), goal: dayGoalOf(s, tasks.length) };
};

type Show = { n: number; hatched: string | null; pets: number; nth: number };

export function EggHost() {
  const [show, setShow] = useState<Show | null>(null);
  const [cracked, setCracked] = useState(false);
  useEffect(
    () =>
      watchState((now, prev) => {
        const a = doneToday(prev);
        const b = doneToday(now);
        const fresh = b.ids.find((id) => !a.ids.includes(id));
        if (!fresh) return;
        // A meta do dia acabou de ser batida: a comemoração da meta aparece no lugar (o ovo conta mesmo assim).
        const goalNow = b.goal > 0 && a.ids.length < b.goal && b.ids.length >= b.goal;
        window.setTimeout(() => {
          const r = eggCount(fresh);
          if (!r || (goalNow && !r.hatched)) return;
          setCracked(false);
          setShow({ ...r, nth: b.ids.length });
          if (r.hatched) window.setTimeout(() => (setCracked(true), play('conquista')), 1100);
        }, 450);
      }),
    [],
  );
  if (!show) return null;
  const left = EGG_GOAL - show.n;
  const k = Math.max(0, show.pets - (show.hatched ? 1 : 0));
  const pose = CHEER[show.nth % CHEER.length];
  const ord = `${show.nth}ª`;
  return createPortal(
    <div className="eggs" role="dialog" aria-modal="true" aria-label="Ovinho" onClick={() => setShow(null)}>
      <span className="eggs-confetti" aria-hidden="true">
        {Array.from({ length: 16 }, (_, i) => (
          <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 8) * 0.18}s`, background: ['#FFD34D', '#FF8FB4', '#7FD3FF', '#9BE07F', '#B9A4FF'][i % 5] }} />
        ))}
      </span>
      <p className="eggs-top">{ord} tarefa concluída!</p>
      <div className="eggs-stage">
        {show.hatched && cracked ? (
          <span className="eggs-born">
            <span className="eggs-glow" aria-hidden="true" />
            <EggPet id={show.hatched} size={150} />
          </span>
        ) : (
          <span className={`eggs-egg ${show.hatched ? 'is-hatching' : ''}`}>
            <EggArt k={k} progress={show.n / EGG_GOAL} size={150} />
          </span>
        )}
        <PetAct t={pose} size={130} className="eggs-pose" quiet />
      </div>
      <h2 className="eggs-title">{show.hatched ? (cracked ? `Chocou! Olha: ${NAMES[show.hatched] ?? 'um filhote'}` : 'Ih… está rachando!') : 'Oba! Seu ovinho ficou mais perto de chocar!'}</h2>
      {!show.hatched && (
        <div className="eggs-bar" aria-label={`${show.n} de ${EGG_GOAL}`}>
          <span className="eggs-track">
            <i style={{ width: `${(show.n / EGG_GOAL) * 100}%` }} />
          </span>
          <span className="eggs-end" aria-hidden="true">
            <EggArt k={k} progress={1} size={30} />
          </span>
        </div>
      )}
      <p className="eggs-sub">{show.hatched ? (cracked ? `Ele entrou para a sua coleção de filhotes (${show.pets} no total).` : 'Segura que vem novidade…') : `${left === 1 ? 'Falta' : 'Faltam'} ${left} ${left === 1 ? 'tarefa' : 'tarefas'} para chocar!`}</p>
      <button className="eggs-btn" onClick={() => setShow(null)}>
        Oba!
      </button>
    </div>,
    document.body,
  );
}

/** Coleção de filhotes (para o perfil ou a bolsa). */
export function EggCollection() {
  const s = useApp();
  const pets = s.egg?.pets ?? [];
  const n = s.egg?.n ?? 0;
  return (
    <section className="eggc" aria-label="Filhotes dos ovinhos">
      <div className="eggc-now">
        <EggArt k={pets.length} progress={n / EGG_GOAL} size={70} />
        <span>
          <b>Ovinho chocando</b>
          <small>
            {n} de {EGG_GOAL} tarefas
          </small>
        </span>
      </div>
      {pets.length > 0 && (
        <div className="eggc-list">
          {pets.map((p, i) => (
            <span key={i} title={NAMES[p]}>
              <EggPet id={p} size={52} />
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
