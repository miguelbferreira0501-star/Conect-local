// O Hami reage ao toque de um jeito natural: um guinchinho de hamster, um pulinho e ele dá "oi" com a mãozinha.
// Sozinho, ele respira, pisca, acena de vez em quando e bate os bracinhos (no próprio desenho do Hami).
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Hamster } from './Hamster';
import { SleepingHami } from './SleepingHami';
import { play, type SoundId } from '../lib/sound';
import { useApp } from '../lib/store';
import type { Outfit, PetMood } from '../types';
import type { Condition, HamiProp } from '../lib/hamiDay';

export type Trick = 'carinho' | 'choro';

const TRICKS: Record<Trick, { mood: PetMood; sound: SoundId; ms: number; say?: string }> = {
  // carinho: amassadinho, pulinho, olhinhos fechados de alegria, bracinhos batendo e coraçõezinhos
  carinho: { mood: 'risada', sound: 'squeak', ms: 1400 },
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

  function tap() {
    if (onTap?.() === false) return;
    if (asleep) {
      play('ronco');
      return;
    }
    run('carinho');
  }

  const now = trick ? TRICKS[trick.t] : null;
  const petMood: PetMood = asleep ? 'dormindo' : (now?.mood ?? mood);
  const bubble = now?.say ?? say;
  return (
    <div className={`live-pet ${className}`}>
      {bubble && (
        <p key={bubble + (trick?.id ?? 0)} className="live-say" aria-live="polite">
          {bubble}
        </p>
      )}
      <button className="live-pet-btn" data-sound="none" aria-label={label ?? `Fazer carinho no ${s.pet.name}`} onClick={tap} onContextMenu={(e) => e.preventDefault()}>
        <span key={trick?.id ?? 0} className={`live-body ${trick ? (trick.t === 'choro' ? 'fx-sob' : 'gest-carinho') : fx}`}>
          {asleep ? (
            <SleepingHami fur={s.pet.fur} size={size * 0.72} place="chao" outfit={s.pet.outfit} />
          ) : (
            <Hamster
              fur={s.pet.fur}
              grams={s.pet.grams}
              phase={s.pet.phase}
              outfit={wear ? { ...s.pet.outfit, ...wear } : s.pet.outfit}
              mood={petMood}
              cond={cond ?? undefined}
              condFace={!trick}
              prop={trick?.t === 'carinho' ? undefined : prop}
              size={size}
              label={s.pet.name}
              pose={trick?.t === 'carinho' ? 'festa' : undefined}
              growth={growth}
              turn
            />
          )}
        </span>
        {trick?.t === 'carinho' && (
          <span key={`h${trick.id}`} className="pet-hearts" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        )}
      </button>
      {children}
    </div>
  );
}
