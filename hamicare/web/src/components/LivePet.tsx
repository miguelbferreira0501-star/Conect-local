// O Hami reage ao toque com gestos simples e fofos, conforme o lugar tocado (sem emojis e sem cambalhotas):
// cabeça = fecha os olhinhos e inclina; barriga = cócegas e dá risadinha; pezinhos = pulinho;
// dois toques = acena "Oi!"; segurar o dedo = cafuné (ronrona e balança devagar).
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Hamster } from './Hamster';
import { play, type SoundId } from '../lib/sound';
import { useApp } from '../lib/store';
import type { Outfit, PetMood } from '../types';
import type { Condition, HamiProp } from '../lib/hamiDay';

export type Trick = 'cabeca' | 'barriga' | 'pes' | 'tchau' | 'cafune' | 'choro';

const TRICKS: Record<Trick, { mood: PetMood; sound: SoundId; ms: number; say?: string }> = {
  cabeca: { mood: 'calmo', sound: 'iii', ms: 1100 },
  barriga: { mood: 'risada', sound: 'risada', ms: 1000 },
  pes: { mood: 'animado', sound: 'pulo', ms: 700 },
  tchau: { mood: 'feliz', sound: 'iii', ms: 1500, say: 'Oi!' },
  cafune: { mood: 'calmo', sound: 'ronrom', ms: 1800 },
  // chorão fofinho (sozinho, de tempos em tempos, quando ele precisa de ajuda)
  choro: { mood: 'choro', sound: 'choro', ms: 2600 },
};

interface Props {
  size?: number;
  /** Humor de quando ele está parado. */
  mood?: PetMood;
  /** O que mais acontece no toque (ex.: contar o carinho). Devolva false para não reagir. */
  onTap?: () => boolean | void;
  /** Fala de agora (aparece num balãozinho em cima dele). */
  say?: string | null;
  className?: string;
  children?: ReactNode;
  label?: string;
  growth?: number;
  /** Situação do dia (rostinho e efeitos) e roupinha que ela pede (gorro, cachecol…). */
  cond?: Condition | null;
  wear?: Partial<Outfit>;
  /** Objeto da atividade de agora (livro, fones…). */
  prop?: HamiProp;
  /** Animação do corpo (tremendo de frio, dançando…). */
  fx?: string;
  /** Chorar sozinho a cada tantos milissegundos (0 = não chora). */
  cryEvery?: number;
}

let seq = 0;

export function LivePet({ size = 200, mood = 'feliz', onTap, say, className = '', children, label, growth, cond, wear, prop, fx = '', cryEvery = 0 }: Props) {
  const s = useApp();
  const [trick, setTrick] = useState<{ t: Trick; id: number } | null>(null);
  const hold = useRef<number | null>(null);
  const held = useRef(false);
  const lastTap = useRef(0);
  const single = useRef<number | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const asleep = s.pet.sleeping;
  const trickRef = useRef<typeof trick>(null);
  trickRef.current = trick;
  // Chorinho de tempos em tempos (o primeiro logo depois de abrir, para a pessoa ver).
  useEffect(() => {
    if (!cryEvery || asleep) return;
    const cry = () => !trickRef.current && run('choro');
    const first = window.setTimeout(cry, 1800);
    const id = window.setInterval(cry, cryEvery);
    return () => (clearTimeout(first), clearInterval(id));
  }, [cryEvery, asleep]); // eslint-disable-line react-hooks/exhaustive-deps

  function run(t: Trick) {
    const id = ++seq;
    setTrick({ t, id });
    play(TRICKS[t].sound);
    later(() => setTrick((cur) => (cur?.id === id ? null : cur)), TRICKS[t].ms);
  }

  function tap(e: React.MouseEvent<HTMLButtonElement>) {
    if (held.current) return;
    if (onTap?.() === false) return;
    if (asleep) {
      play('ronco');
      return;
    }
    const now = Date.now();
    // Dois toques rápidos: ele acena.
    if (now - lastTap.current < 320) {
      if (single.current) clearTimeout(single.current);
      lastTap.current = 0;
      run('tchau');
      return;
    }
    lastTap.current = now;
    const r = e.currentTarget.getBoundingClientRect();
    const y = (e.clientY - r.top) / Math.max(1, r.height);
    const part: Trick = y < 0.52 ? 'cabeca' : y < 0.82 ? 'barriga' : 'pes';
    single.current = window.setTimeout(() => run(part), 200);
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
        <span key={trick?.id ?? 0} className={`live-body ${trick ? (trick.t === 'choro' ? 'fx-sob' : `gest-${trick.t}`) : fx}`}>
          <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={wear ? { ...s.pet.outfit, ...wear } : s.pet.outfit} mood={petMood} cond={cond ?? undefined} condFace={!trick} prop={trick?.t === 'tchau' ? undefined : prop} size={size} label={s.pet.name} pose={trick?.t === 'tchau' ? 'tchau' : undefined} growth={growth} />
        </span>
        {trick?.t === 'cafune' && <span className="live-glow" aria-hidden="true" />}
      </button>
      {children}
    </div>
  );
}
