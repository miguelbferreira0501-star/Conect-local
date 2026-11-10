// Check-in de humor ao abrir o app (uma vez por dia), no estilo da referência: fundo que muda de cor,
// carinha de olhinhos que muda com a barrinha, balão com o nome do humor, "Explorar mais" e "Continuar".
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal } from 'lucide-react';
import { EMOTIONS } from '../data/lines';
import { play } from '../lib/sound';
import { dayOf, setEmotions, setMood, todayKey, useApp } from '../lib/store';
import type { Mood } from '../types';

const LABELS = ['Muito ruim', 'Ruim', 'Neutro', 'Bem', 'Ótimo'];
const BG = ['#C9C3E8', '#C2D3EC', '#BADAE9', '#CDEBC9', '#FFD9A3'];
const KEY = 'hamicare:checkin';

let opener: (() => void) | null = null;
/** Abre o check-in de qualquer lugar do app. */
export function openCheckin() {
  opener?.();
}

const mix = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
};

function Face({ v }: { v: number }) {
  // v de 0 a 1: boca de triste a sorriso, olhos que piscam devagar
  const curve = (v - 0.5) * 30;
  return (
    <svg viewBox="0 0 200 140" width="200" height="140" aria-hidden="true" className="ci-face">
      {[70, 130].map((x) => (
        <g key={x}>
          <circle cx={x} cy="60" r="26" fill="#FFFFFF" />
          <circle cx={x + (v - 0.5) * 6} cy={62 - (v - 0.5) * 4} r="15" fill="#3B3B3B" className="ci-pupil" />
        </g>
      ))}
      {v < 0.25 && <path d="M50 30 l26 8 M150 30 l-26 8" stroke="#3B3B3B" strokeWidth="6" strokeLinecap="round" opacity={0.25 + (0.25 - v) * 3} />}
      <path d={`M76 112 Q100 ${112 + curve} 124 112`} stroke="#3B3B3B" strokeWidth="11" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function MoodCheckinHost() {
  const s = useApp();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(50);
  const [more, setMore] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const today = todayKey();

  useEffect(() => {
    opener = () => {
      const d = dayOf(s, todayKey());
      setV(d.mood ? (d.mood - 1) * 25 : 50);
      setPicked(d.emotions ?? []);
      setOpen(true);
    };
    return () => {
      opener = null;
    };
  });

  // Abre sozinho uma vez por dia, se a pessoa ainda não contou como está.
  useEffect(() => {
    if (!s.onboarded || dayOf(s, today).mood) return;
    let seen: string | null = null;
    try {
      seen = localStorage.getItem(KEY);
    } catch {
      /* sem armazenamento: abre mesmo assim */
    }
    if (seen === today) return;
    const t = window.setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, [s.onboarded, today]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;
  const t = v / 100;
  const idx = Math.min(4, Math.round(v / 25));
  const close = () => {
    try {
      localStorage.setItem(KEY, today);
    } catch {
      /* ok */
    }
    setOpen(false);
    setMore(false);
  };
  return createPortal(
    <div className="ci-wrap" role="dialog" aria-modal="true" aria-label="Como você está se sentindo agora?">
      <div className="ci-dim" onClick={close} />
      <div className="ci-sheet" style={{ background: bgFor(v) }}>
        <p className="ci-title">👇 Como você está se sentindo agora?</p>
        <Face v={t} />
        <div className="ci-slider">
          <span className="ci-bubble" style={{ left: `${Math.min(84, Math.max(16, v))}%` }}>
            {LABELS[idx]}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={v}
            aria-label="Como você está agora"
            aria-valuetext={LABELS[idx]}
            onChange={(e) => {
              const nv = Number(e.target.value);
              if (Math.round(nv / 25) !== idx) play('pega', { step: Math.round(nv / 25) });
              setV(nv);
            }}
          />
          <div className="ci-ends">
            <span>Muito ruim</span>
            <span>Ótimo</span>
          </div>
        </div>
        {more && (
          <div className="ci-chips">
            {EMOTIONS.map((e) => {
              const on = picked.includes(e);
              return (
                <button key={e} className={on ? 'is-on' : ''} aria-pressed={on} onClick={() => setPicked(on ? picked.filter((x) => x !== e) : [...picked, e])}>
                  {e}
                </button>
              );
            })}
          </div>
        )}
        <button className="ci-more" onClick={() => setMore(!more)}>
          <SlidersHorizontal size={18} /> {more ? 'Menos opções' : 'Explorar mais'}
        </button>
        <button
          className="ci-go"
          onClick={() => {
            setMood((idx + 1) as Mood);
            if (picked.length) setEmotions(picked);
            play('tarefa');
            close();
          }}
        >
          Continuar
        </button>
      </div>
    </div>,
    document.body,
  );
}

/** Cor do fundo ao longo da barrinha (lilás → azul → verde → laranja). */
function bgFor(v: number) {
  const x = (v / 100) * 4;
  const i = Math.min(3, Math.floor(x));
  return mix(BG[i], BG[i + 1], x - i);
}
