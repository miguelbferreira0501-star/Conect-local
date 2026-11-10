// Check-in de humor ao abrir o app (uma vez por dia), com a NOSSA carinha: ela muda aos pouquinhos de
// triste para feliz enquanto a pessoa arrasta a barrinha colorida. "Explorar mais" abre as emoções e
// "Continuar" salva.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal } from 'lucide-react';
import { EMOTIONS, MOODS } from '../data/lines';
import { play } from '../lib/sound';
import { dayOf, setEmotions, setMood, todayKey, useApp } from '../lib/store';
import { MoodFace, moodColor, moodOf } from './MoodSlider';

const KEY = 'hamicare:checkin';

let opener: (() => void) | null = null;
/** Abre o check-in de qualquer lugar do app. */
export function openCheckin() {
  opener?.();
}

/** Fundo bem clarinho na cor da carinha. */
function tint(hex: string, k = 0.72) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.round(v + (255 - v) * k).toString(16).padStart(2, '0');
  return `#${f(n >> 16)}${f((n >> 8) & 255)}${f(n & 255)}`;
}

export function MoodCheckinHost() {
  const s = useApp();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(50);
  const [touched, setTouched] = useState(false);
  const [more, setMore] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const today = todayKey();

  useEffect(() => {
    opener = () => {
      const d = dayOf(s, todayKey());
      setV(d.mood ? (d.mood - 1) * 25 : 50);
      setTouched(!!d.mood);
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
  const m = moodOf(v);
  const color = moodColor(t);
  const label = touched ? MOODS[m - 1].label : 'Arraste a barrinha';
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
      <div className="ci-sheet" style={{ background: `linear-gradient(180deg, ${tint(color, 0.55)}, ${tint(color, 0.85)} 70%)` }}>
        <span className="ci-grab" aria-hidden="true" />
        <p className="ci-title">Como você está se sentindo agora?</p>
        <div className="ci-face">
          <MoodFace t={t} size={172} />
        </div>
        <p className={`ci-label ${touched ? '' : 'is-hint'}`} aria-hidden="true">
          {label}
        </p>
        <div className="ci-slider">
          <input
            type="range"
            min={0}
            max={100}
            value={v}
            className="mood-range"
            style={{ ['--thumb' as string]: color }}
            aria-label="Como você está agora"
            aria-valuetext={label}
            data-sound="none"
            onChange={(e) => {
              const nv = Number(e.target.value);
              if (moodOf(nv) !== m) play('pega', { step: moodOf(nv) - 1 });
              setV(nv);
              setTouched(true);
            }}
          />
          <div className="ci-ends" aria-hidden="true">
            <span>Muito difícil</span>
            <span>Muito bem</span>
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
          style={{ background: color }}
          onClick={() => {
            setMood(m);
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
