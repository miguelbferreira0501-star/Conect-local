// O mascote reage ao toque de um jeito natural: um latidinho, pulinho, rabo abanando e os bracinhos batendo.
// Sozinho, ele respira, pisca, mexe a cabeça e as orelhas e abana o rabo.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Hamster, type DogPose } from './Hamster';
import { SleepingHami } from './SleepingHami';
import { play, type SoundId } from '../lib/sound';
import { useApp } from '../lib/store';
import type { Outfit, PetMood } from '../types';
import type { Condition, HamiProp } from '../lib/hamiDay';

/**
 * Ações do Lumbi (tiradas da folha de poses que a dona do app desenhou): ele mesmo faz, com o corpo inteiro
 * animado. Um toque faz uma ação diferente; parado, de tempos em tempos ele faz uma sozinho.
 */
export type Trick = 'carinho' | 'choro' | 'acenar' | 'coracao' | 'danca' | 'musica' | 'travesseiro' | 'estrela' | 'comemora' | 'rola' | 'late' | 'curioso';

type TrickInfo = { mood: PetMood; sound: SoundId; ms: number; say?: string; pose?: DogPose; prop?: HamiProp; fx?: string };
export const TRICKS: Record<Trick, TrickInfo> = {
  // carinho: amassadinho, pulinho, olhinhos fechados de alegria, bracinhos batendo e coraçõezinhos
  carinho: { mood: 'risada', sound: 'latido', ms: 1400, fx: 'gest-pat' },
  // chorão fofinho (sozinho, de tempos em tempos, quando ele precisa de ajuda)
  choro: { mood: 'choro', sound: 'choro', ms: 2600, fx: 'fx-sob' },
  acenar: { mood: 'feliz', sound: 'iii', ms: 2400, pose: 'tchau', fx: 'lb-act-hello' },
  coracao: { mood: 'amor', sound: 'coracao', ms: 2800, prop: 'coracao', fx: 'lb-act-hug' },
  danca: { mood: 'risada', sound: 'festa', ms: 2800, pose: 'festa', fx: 'lb-act-dance' },
  musica: { mood: 'calmo', sound: 'cancao', ms: 3800, prop: 'fones', fx: 'lb-act-groove' },
  travesseiro: { mood: 'sono', sound: 'bocejo', ms: 3200, prop: 'travesseiro', fx: 'lb-act-cuddle' },
  estrela: { mood: 'animado', sound: 'brilho', ms: 2600, prop: 'estrela', fx: 'lb-act-proud' },
  comemora: { mood: 'risada', sound: 'pulo', ms: 1900, pose: 'pular' },
  rola: { mood: 'risada', sound: 'risada', ms: 2200, pose: 'rolar' },
  late: { mood: 'boca', sound: 'latido', ms: 1300, fx: 'lb-act-bark' },
  curioso: { mood: 'surpreso', sound: 'squeak', ms: 2200, fx: 'lb-act-tilt' },
};
/** O que ele faz quando alguém toca (cada toque, uma diferente). */
const TAP_TRICKS: Trick[] = ['carinho', 'coracao', 'acenar', 'danca', 'estrela', 'late', 'rola', 'musica', 'comemora', 'curioso'];
/** O que ele faz sozinho, de leve, quando está parado. */
const AUTO_TRICKS: Trick[] = ['acenar', 'curioso', 'coracao', 'musica', 'estrela', 'travesseiro', 'late'];

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
  /** Gesto contínuo do corpo (ex.: 'lua' = pulinhos lentos; a sombra fica no chão). */
  pose?: DogPose;
  /** Chorar sozinho a cada tantos milissegundos (0 = não chora). */
  cryEvery?: number;
  /** Fazer ações sozinho de tempos em tempos (Início, Bem-estar). */
  auto?: boolean;
  /** Pedir uma ação agora (muda o id para repetir). */
  act?: { t: Trick; id: number; quiet?: boolean } | null;
}

let seq = 0;

export function LivePet({ size = 200, mood = 'feliz', onTap, say, className = '', children, label, growth, cond, wear, prop, pose, fx = '', cryEvery = 0, auto = false, act = null }: Props) {
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

  // Ações sozinho: a cada 9 a 16 segundos, se não estiver fazendo nada.
  useEffect(() => {
    if (!auto || asleep) return;
    let id = 0;
    const next = () => {
      id = window.setTimeout(() => {
        if (!trickRef.current && !document.hidden) run(AUTO_TRICKS[Math.floor(Math.random() * AUTO_TRICKS.length)], true);
        next();
      }, 9000 + Math.random() * 7000);
    };
    next();
    return () => clearTimeout(id);
  }, [auto, asleep]); // eslint-disable-line react-hooks/exhaustive-deps
  // Ação pedida de fora (ex.: comemorar ao responder um quiz).
  useEffect(() => {
    if (act && !asleep) run(act.t, act.quiet);
  }, [act?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const lastTap = useRef(-1);

  function run(t: Trick, quiet = false) {
    const id = ++seq;
    setTrick({ t, id });
    if (!quiet || t === 'late') play(TRICKS[t].sound);
    later(() => setTrick((cur) => (cur?.id === id ? null : cur)), TRICKS[t].ms);
  }

  function tap() {
    if (onTap?.() === false) return;
    if (asleep) {
      play('ronco');
      return;
    }
    // cada toque, uma ação diferente da anterior
    let k = Math.floor(Math.random() * TAP_TRICKS.length);
    if (k === lastTap.current) k = (k + 1) % TAP_TRICKS.length;
    lastTap.current = k;
    run(TAP_TRICKS[k]);
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
        <span key={trick?.id ?? 0} className={`live-body ${trick ? (now?.fx ?? '') : fx}`}>
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
              prop={trick ? now?.prop : prop}
              size={size}
              label={s.pet.name}
              pose={trick ? now?.pose : pose}
              growth={growth}
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

/**
 * O Lumbi fazendo uma ação (ex.: comemorar), animado de verdade, para enfeitar uma tela: faz ao aparecer e,
 * com `every`, repete de tempos em tempos (sem som na repetição). Um toque faz outra ação.
 */
export function PetAct({ t, size = 140, every = 0, auto = false, className = '', quiet = false }: { t: Trick; size?: number; every?: number; auto?: boolean; className?: string; quiet?: boolean }) {
  const [act, setAct] = useState<{ t: Trick; id: number; quiet?: boolean }>({ t, id: 1, quiet });
  useEffect(() => setAct((a) => ({ t, id: a.id + 1, quiet })), [t]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!every) return;
    const i = window.setInterval(() => setAct((a) => ({ t: a.t, id: a.id + 1, quiet: true })), every);
    return () => clearInterval(i);
  }, [every]);
  return <LivePet size={size} act={act} auto={auto} className={className} />;
}
