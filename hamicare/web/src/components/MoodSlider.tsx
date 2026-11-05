// Humor de hoje com uma barrinha: arrastando, a carinha muda aos pouquinhos de triste (esquerda) para feliz (direita).
// O valor salvo continua de 1 a 5 (gráfico e histórico); a carinha acompanha o dedo sem degraus.
import { useEffect, useRef, useState } from 'react';
import { MOODS } from '../data/lines';
import { play } from '../lib/sound';
import type { Mood } from '../types';

const STOPS: [number, string][] = [
  [0, '#9B95E8'],
  [0.25, '#8DBEF0'],
  [0.5, '#9ED9B8'],
  [0.75, '#C9E57E'],
  [1, '#FFD34D'],
];

function mixHex(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

/** Cor da carinha ao longo da barra. */
export function moodColor(t: number) {
  for (let i = 1; i < STOPS.length; i++) {
    const [t1, c1] = STOPS[i];
    const [t0, c0] = STOPS[i - 1];
    if (t <= t1) return mixHex(c0, c1, (t - t0) / (t1 - t0));
  }
  return STOPS[STOPS.length - 1][1];
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Valor da barra (0 a 100) → humor de 1 a 5. */
export const moodOf = (v: number) => (Math.round(v / 25) + 1) as Mood;

/** A carinha: cor, boca, olhos, sobrancelhas, lágrima e bochechas mudam com t (0 = muito difícil, 1 = muito bem). */
export function MoodFace({ t, size = 96 }: { t: number; size?: number }) {
  const color = moodColor(t);
  const ink = '#3A2E4A';
  const curve = lerp(-15, 24, t); // boca: para baixo (triste) → sorriso
  const open = t > 0.78;
  const squeeze = t < 0.14; // olhinhos apertados ">  <"
  const happyEyes = t > 0.88;
  const worry = clamp01((0.5 - t) / 0.5); // sobrancelhas preocupadas
  const blush = clamp01((t - 0.55) / 0.45);
  const tear = clamp01((0.22 - t) / 0.22);
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" style={{ transform: `rotate(${(t - 0.5) * 10}deg)`, transition: 'transform 120ms ease-out' }}>
      <circle cx="50" cy="52" r="44" fill={color} />
      <ellipse cx="38" cy="30" rx="14" ry="8" fill="#FFFFFF" opacity="0.35" transform="rotate(-25 38 30)" />
      <circle cx="50" cy="52" r="44" fill="none" stroke="#000" strokeOpacity="0.06" strokeWidth="3" />
      {/* sobrancelhas */}
      {worry > 0.05 && !squeeze && (
        <g stroke={ink} strokeWidth="3.4" strokeLinecap="round" opacity={0.25 + worry * 0.75}>
          <path d={`M27 ${33 - worry * 2} L41 ${33 - worry * 8}`} />
          <path d={`M73 ${33 - worry * 2} L59 ${33 - worry * 8}`} />
        </g>
      )}
      {/* olhos */}
      {squeeze ? (
        <g stroke={ink} strokeWidth="3.6" strokeLinecap="round" fill="none">
          <path d="M30 38 L40 44 L30 50" />
          <path d="M70 38 L60 44 L70 50" />
        </g>
      ) : happyEyes ? (
        <g stroke={ink} strokeWidth="3.8" strokeLinecap="round" fill="none">
          <path d="M28 46 Q35 36 42 46" />
          <path d="M58 46 Q65 36 72 46" />
        </g>
      ) : (
        <g fill={ink}>
          <ellipse cx="35" cy="44" rx="5" ry={lerp(6.5, 7.5, t)} />
          <ellipse cx="65" cy="44" rx="5" ry={lerp(6.5, 7.5, t)} />
          <circle cx="36.8" cy="41" r="1.8" fill="#FFFFFF" />
          <circle cx="66.8" cy="41" r="1.8" fill="#FFFFFF" />
        </g>
      )}
      {/* lágrima */}
      {tear > 0.02 && <path d={`M30 ${52 + tear * 6} q-4 7 0 10 q4 -3 0 -10 Z`} fill="#7FC4F5" opacity={tear} />}
      {/* bochechas */}
      {blush > 0.02 && (
        <g fill="#FF8FA8" opacity={blush * 0.75}>
          <ellipse cx="24" cy="60" rx="7" ry="4.5" />
          <ellipse cx="76" cy="60" rx="7" ry="4.5" />
        </g>
      )}
      {/* boca */}
      {open ? (
        <g>
          <path d={`M30 62 Q50 ${62 + curve * 1.2} 70 62 Z`} fill={ink} />
          <path d={`M40 ${62 + curve * 0.7} Q50 ${62 + curve * 0.95} 60 ${62 + curve * 0.7} Q50 ${62 + curve * 0.55} 40 ${62 + curve * 0.7} Z`} fill="#FF8FA8" />
        </g>
      ) : (
        <path d={`M32 ${66 - curve * 0.15} Q50 ${66 + curve * 0.9} 68 ${66 - curve * 0.15}`} stroke={ink} strokeWidth="4" strokeLinecap="round" fill="none" />
      )}
    </svg>
  );
}

export function MoodSlider({ value, onCommit }: { value: Mood | undefined; onCommit: (m: Mood) => void }) {
  const [v, setV] = useState(value ? ((value - 1) / 4) * 100 : 50);
  const [touched, setTouched] = useState(!!value);
  const input = useRef<HTMLInputElement>(null);
  const last = useRef<number>(value ? value : moodOf(v));
  const commit = useRef(onCommit);
  commit.current = onCommit;

  // Humor salvo por outro lugar (por exemplo, conversando com o Hami): a barrinha acompanha.
  useEffect(() => {
    if (value && moodOf(v) !== value) setV(((value - 1) / 4) * 100);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // "change" do navegador só dispara quando a pessoa solta a barrinha (ou usa as setas): aí salva.
  useEffect(() => {
    const el = input.current;
    if (!el) return;
    const onChange = () => commit.current(moodOf(Number(el.value)));
    el.addEventListener('change', onChange);
    return () => el.removeEventListener('change', onChange);
  }, []);

  const t = v / 100;
  const m = moodOf(v);
  const label = touched ? MOODS[m - 1].label : 'Arraste a barrinha';
  return (
    <div className="mood-slider">
      <div className="grid justify-items-center gap-1">
        <MoodFace t={t} />
        <p className={`text-[16px] font-extrabold ${touched ? '' : 'text-muted'}`} aria-hidden="true">
          {label}
        </p>
      </div>
      <input
        ref={input}
        type="range"
        min={0}
        max={100}
        step={1}
        value={v}
        className="mood-range"
        style={{ ['--thumb' as string]: moodColor(t) }}
        aria-label="Como você está agora"
        aria-valuetext={label}
        data-sound="none"
        onChange={(e) => {
          const nv = Number(e.target.value);
          setV(nv);
          setTouched(true);
          const nm = moodOf(nv);
          if (nm !== last.current) {
            last.current = nm;
            play('pega', { step: nm - 1 });
          }
        }}
      />
      <div className="flex justify-between text-[12px] font-bold text-muted" aria-hidden="true">
        <span>Muito difícil</span>
        <span>Muito bem</span>
      </div>
    </div>
  );
}
