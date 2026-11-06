// O Hami com personalidade: cada toque faz uma gracinha diferente (rola de barriga pra cima, pula dando
// cambalhota, acena, dá risada, dança), e segurar o dedo nele vira cafuné (ronrona e solta coraçõezinhos).
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Hamster } from './Hamster';
import { Glyph } from './art';
import { play, type SoundId } from '../lib/sound';
import { useApp } from '../lib/store';
import type { PetMood } from '../types';

export type Trick = 'rolar' | 'pular' | 'tchau' | 'risada' | 'dancar' | 'cafune';

const TRICKS: Record<Trick, { mood: PetMood; sound: SoundId; ms: number; fx: string; say?: string }> = {
  rolar: { mood: 'risada', sound: 'risada', ms: 1700, fx: '💗' },
  pular: { mood: 'animado', sound: 'pulo', ms: 900, fx: '⭐' },
  tchau: { mood: 'feliz', sound: 'iii', ms: 1500, fx: '💛', say: 'Oi!' },
  risada: { mood: 'risada', sound: 'risada', ms: 1100, fx: '😄' },
  dancar: { mood: 'animado', sound: 'brilho', ms: 1500, fx: '🎵' },
  cafune: { mood: 'calmo', sound: 'ronrom', ms: 1600, fx: '💗' },
};
/** A ordem das gracinhas (a primeira é a do vídeo: rolar de barriga pra cima). */
const ORDER: Trick[] = ['rolar', 'tchau', 'pular', 'risada', 'dancar'];

interface Props {
  size?: number;
  /** Humor de quando ele está parado. */
  mood?: PetMood;
  /** O que mais acontece no toque (ex.: contar o carinho). Devolva false para não fazer gracinha. */
  onTap?: () => boolean | void;
  /** Fala de agora (aparece num balãozinho em cima dele). */
  say?: string | null;
  className?: string;
  children?: ReactNode;
  label?: string;
  growth?: number;
}

let fxSeq = 0;

export function LivePet({ size = 200, mood = 'feliz', onTap, say, className = '', children, label, growth }: Props) {
  const s = useApp();
  const [trick, setTrick] = useState<{ t: Trick; id: number } | null>(null);
  const [fx, setFx] = useState<{ id: number; e: string; x: number; d: number }[]>([]);
  const turn = useRef(0);
  const hold = useRef<number | null>(null);
  const held = useRef(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const asleep = s.pet.sleeping;

  function run(t: Trick) {
    const def = TRICKS[t];
    const id = ++fxSeq;
    setTrick({ t, id });
    play(def.sound);
    const burst = Array.from({ length: 5 }, (_, i) => ({ id: id * 10 + i, e: def.fx, x: 20 + Math.random() * 60, d: i * 90 }));
    setFx((f) => [...f.slice(-10), ...burst]);
    later(() => setFx((f) => f.filter((p) => Math.floor(p.id / 10) !== id)), 1500);
    later(() => setTrick((cur) => (cur?.id === id ? null : cur)), def.ms);
  }

  function tap() {
    if (held.current) return;
    if (onTap?.() === false) return;
    if (asleep) {
      play('ronco');
      return;
    }
    run(ORDER[turn.current++ % ORDER.length]);
  }

  const now = trick ? TRICKS[trick.t] : null;
  const petMood: PetMood = asleep ? 'dormindo' : now?.mood ?? mood;
  const bubble = now?.say ?? say;
  return (
    <div className={`live-pet ${className}`}>
      {bubble && (
        <p key={bubble + (trick?.id ?? 0)} className="live-say" aria-live="polite">
          {bubble}
        </p>
      )}
      <button
        className="live-pet-btn"
        data-sound="none"
        aria-label={label ?? `Fazer carinho no ${s.pet.name}`}
        onClick={tap}
        onPointerDown={() => {
          held.current = false;
          if (asleep) return;
          hold.current = window.setTimeout(() => {
            held.current = true;
            run('cafune');
          }, 550);
        }}
        onPointerUp={() => hold.current && clearTimeout(hold.current)}
        onPointerLeave={() => hold.current && clearTimeout(hold.current)}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span key={trick?.id ?? 0} className={`live-body ${trick ? `trick-${trick.t}` : ''}`}>
          <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood={petMood} size={size} label={s.pet.name} pose={trick?.t === 'tchau' ? 'tchau' : undefined} growth={growth} />
        </span>
        {trick?.t === 'rolar' && <span className="live-dust" aria-hidden="true" />}
        {fx.map((p) => (
          <span key={p.id} className="live-fx" style={{ left: `${p.x}%`, animationDelay: `${p.d}ms` }} aria-hidden="true">
            <Glyph e={p.e} size={26} />
          </span>
        ))}
      </button>
      {children}
    </div>
  );
}
