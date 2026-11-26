// Ovinho que choca com as tarefas: a cada tarefa concluída aparece o ovo ao lado do Lumbi, um passo mais perto
// de chocar (com rachadinhas aparecendo). Na 5ª tarefa ele racha de vez e nasce um filhote novo, que entra
// na coleção. Um toque em qualquer lugar fecha.
import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { dayGoalOf, dayOf, EGG_GOAL, eggCount, todayKey, todayTasks, useApp, watchState } from '../lib/store';
import { play } from '../lib/sound';
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

/** Os filhotes que nascem dos ovos (desenhos próprios, simples e fofos). */
export function EggPet({ id, size = 80 }: { id: string; size?: number }) {
  const eye = (x: number, y: number) => <circle cx={x} cy={y} r="2.6" fill="#3a2a2a" />;
  const blush = (x: number, y: number) => <ellipse cx={x} cy={y} rx="3.4" ry="2.2" fill="#ff9fb4" opacity="0.7" />;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <ellipse cx="32" cy="60" rx="16" ry="3" fill="rgba(0,0,0,0.12)" />
      {id === 'pintinho' && (
        <g>
          <ellipse cx="32" cy="38" rx="18" ry="19" fill="#FFE066" />
          <path d="M30 18 q2-6 6-4" stroke="#F2B705" strokeWidth="3" fill="none" strokeLinecap="round" />
          {eye(26, 34)}
          {eye(38, 34)}
          <path d="M29 39 l3 3 3-3 Z" fill="#FF9A3D" />
          {blush(22, 41)}
          {blush(42, 41)}
          <path d="M14 40 q-5 3 0 7 M50 40 q5 3 0 7" stroke="#F2C230" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
      )}
      {id === 'coelhinho' && (
        <g>
          <ellipse cx="24" cy="16" rx="5" ry="13" fill="#fff" stroke="#e9dce4" strokeWidth="1.5" />
          <ellipse cx="40" cy="16" rx="5" ry="13" fill="#fff" stroke="#e9dce4" strokeWidth="1.5" />
          <ellipse cx="24" cy="17" rx="2.4" ry="8" fill="#ffc2d4" />
          <ellipse cx="40" cy="17" rx="2.4" ry="8" fill="#ffc2d4" />
          <ellipse cx="32" cy="40" rx="18" ry="17" fill="#fff" stroke="#e9dce4" strokeWidth="1.5" />
          {eye(26, 38)}
          {eye(38, 38)}
          <ellipse cx="32" cy="43" rx="2.2" ry="1.6" fill="#ff8fab" />
          {blush(22, 45)}
          {blush(42, 45)}
        </g>
      )}
      {id === 'passarinho' && (
        <g>
          <ellipse cx="32" cy="38" rx="18" ry="17" fill="#8FC8FF" />
          <ellipse cx="32" cy="44" rx="11" ry="9" fill="#DDF0FF" />
          <path d="M14 36 q-8 6 -2 12 q6 -2 6 -8 Z" fill="#6FB2F0" />
          <path d="M50 36 q8 6 2 12 q-6 -2 -6 -8 Z" fill="#6FB2F0" />
          {eye(26, 33)}
          {eye(38, 33)}
          <path d="M29 38 l3 3 3-3 Z" fill="#FFB547" />
          <path d="M30 21 q2 -6 5 -3 q1 -5 4 -1" stroke="#6FB2F0" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </g>
      )}
      {id === 'tartaruga' && (
        <g>
          <ellipse cx="14" cy="46" rx="6" ry="5" fill="#9BD67F" />
          <ellipse cx="50" cy="46" rx="6" ry="5" fill="#9BD67F" />
          <circle cx="32" cy="22" r="10" fill="#9BD67F" />
          {eye(28, 21)}
          {eye(36, 21)}
          {blush(25, 25)}
          {blush(39, 25)}
          <ellipse cx="32" cy="42" rx="20" ry="14" fill="#6FB65A" />
          <path d="M22 40 h20 M32 30 v22 M24 34 l16 14 M40 34 l-16 14" stroke="#5A9A48" strokeWidth="2" opacity="0.6" />
        </g>
      )}
      {id === 'ourico' && (
        <g>
          {Array.from({ length: 9 }, (_, i) => (
            <path key={i} d={`M${14 + i * 4.5} 30 l2 -12 l3 12 Z`} fill="#A47551" />
          ))}
          <ellipse cx="32" cy="40" rx="20" ry="16" fill="#A47551" />
          <ellipse cx="34" cy="44" rx="14" ry="11" fill="#F7DFC2" />
          {eye(30, 41)}
          {eye(40, 41)}
          <circle cx="47" cy="45" r="2.4" fill="#3a2a2a" />
          {blush(28, 47)}
        </g>
      )}
      {id === 'sapinho' && (
        <g>
          <circle cx="23" cy="24" r="7" fill="#8ED081" />
          <circle cx="41" cy="24" r="7" fill="#8ED081" />
          {eye(23, 24)}
          {eye(41, 24)}
          <ellipse cx="32" cy="40" rx="20" ry="15" fill="#8ED081" />
          <path d="M24 42 q8 6 16 0" stroke="#3a2a2a" strokeWidth="2" fill="none" strokeLinecap="round" />
          {blush(19, 42)}
          {blush(45, 42)}
        </g>
      )}
      {id === 'patinho' && (
        <g>
          <ellipse cx="34" cy="44" rx="18" ry="13" fill="#FFF3A6" />
          <circle cx="26" cy="28" r="11" fill="#FFF3A6" />
          {eye(24, 26)}
          <path d="M14 29 q-6 1 -7 4 q5 2 9 0 Z" fill="#FF9A3D" />
          {blush(28, 31)}
          <path d="M40 40 q8 -2 10 4" stroke="#F2D96B" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      )}
      {id === 'joaninha' && (
        <g>
          <circle cx="32" cy="22" r="9" fill="#3a2a2a" />
          <circle cx="29" cy="21" r="2" fill="#fff" />
          <circle cx="35" cy="21" r="2" fill="#fff" />
          <ellipse cx="32" cy="42" rx="19" ry="16" fill="#FF5C5C" />
          <path d="M32 26 v32" stroke="#3a2a2a" strokeWidth="2" />
          {[[24, 36], [40, 36], [22, 48], [42, 48]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3.4" fill="#3a2a2a" />
          ))}
        </g>
      )}
    </svg>
  );
}

const NAMES: Record<string, string> = { pintinho: 'Pintinho', coelhinho: 'Coelhinho', passarinho: 'Passarinho', tartaruga: 'Tartaruguinha', ourico: 'Ouricinho', sapinho: 'Sapinho', patinho: 'Patinho', joaninha: 'Joaninha' };
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
      <h2 className="eggs-title">{show.hatched ? (cracked ? `Nasceu um ${NAMES[show.hatched] ?? 'filhote'}!` : 'Ih… está rachando!') : 'Oba! Seu ovinho ficou mais perto de chocar!'}</h2>
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
