// Peças comuns do parque de jogos: moldura com início/placar/fim, laço de animação,
// tamanho do palco e o Hami "congelado" (memo) para não redesenhar o SVG a cada quadro.
import { memo, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { Hamster } from '../Hamster';
import { Glyph } from '../art';
import { finishGame, gamePrizesLeft, useApp, type GameId } from '../../lib/store';
import { play } from '../../lib/sound';
import type { Outfit, PetMood } from '../../types';

export interface GameMeta {
  id: GameId;
  name: string;
  hint: string;
  how: string;
  icon: string;
  /** Pontos para 1, 2 e 3 estrelas. */
  stars: [number, number, number];
  unit: string;
  tone: string;
}

export const starsOf = (meta: GameMeta, score: number) => (score >= meta.stars[2] ? 3 : score >= meta.stars[1] ? 2 : 1);

/** Laço de animação: chama step(dt) a cada quadro enquanto run for true e redesenha o componente. */
export function useLoop(run: boolean, step: (dt: number) => void) {
  const [, setTick] = useState(0);
  const ref = useRef(step);
  ref.current = step;
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    let prev = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.034, (now - prev) / 1000);
      prev = now;
      ref.current(dt);
      setTick((t) => (t + 1) % 1e6);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [run]);
}

/** Tamanho do palco em pixels (atualiza ao girar o celular). */
export function useBox<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const size = useRef({ w: 340, h: 420 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => (size.current = { w: el.clientWidth || 340, h: el.clientHeight || 420 });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, size };
}

/** O Hami desenhado uma vez só; quem se mexe é a caixa de fora. */
export const Sprite = memo(function Sprite({ fur, outfit, size, mood = 'feliz' }: { fur: string; outfit?: Outfit; size: number; mood?: PetMood }) {
  return <Hamster fur={fur} outfit={outfit} size={size} idle={false} mood={mood} growth={1} label="" />;
});

export function Me({ size, mood }: { size: number; mood?: PetMood }) {
  const s = useApp();
  return <Sprite fur={s.pet.fur} outfit={s.pet.outfit} size={size} mood={mood} />;
}

export function Ball({ r, kind = 'futebol' }: { r: number; kind?: 'futebol' | 'volei' }) {
  return (
    <svg width={r * 2} height={r * 2} viewBox="0 0 40 40" aria-hidden="true" className="block">
      <circle cx="20" cy="20" r="18" fill="#fff" stroke="#3a2f55" strokeWidth="2.4" />
      {kind === 'futebol' ? (
        <>
          <path d="M20 12 l7 5 -3 8 h-8 l-3 -8z" fill="#3a2f55" />
          <path d="M20 12 V3 M27 17 l8-3 M24 25 l5 7 M16 25 l-5 7 M13 17 l-8-3" stroke="#3a2f55" strokeWidth="2" />
        </>
      ) : (
        <>
          <path d="M20 2 C12 12 12 28 20 38" stroke="#FFC75F" strokeWidth="5" fill="none" />
          <path d="M3 14 C14 18 28 16 37 10" stroke="#6FB7FF" strokeWidth="5" fill="none" />
          <path d="M6 31 C16 24 28 26 36 30" stroke="#FF8FAB" strokeWidth="5" fill="none" />
          <circle cx="20" cy="20" r="18" fill="none" stroke="#3a2f55" strokeWidth="2.4" />
        </>
      )}
    </svg>
  );
}

type Phase = 'intro' | 'play' | 'end';

/** Moldura de todo jogo: tela de início, o jogo em si e o fim com estrelas e sementes. */
export function GameFrame({ meta, onExit, onClose, hud, children }: { meta: GameMeta; onExit: () => void; onClose: () => void; hud?: ReactNode; children: (end: (score: number) => void) => ReactNode }) {
  const s = useApp();
  const [phase, setPhase] = useState<Phase>('intro');
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<{ score: number; stars: number; coins: number } | null>(null);
  const end = (score: number) => {
    const stars = starsOf(meta, score);
    const coins = finishGame(meta.id, stars);
    play('fim-jogo');
    setResult({ score, stars, coins });
    setPhase('end');
  };
  const again = () => {
    setResult(null);
    setRound((r) => r + 1);
    setPhase('play');
  };
  const left = gamePrizesLeft(s);
  return (
    <div className={`fullscreen arc-game arc-${meta.tone}`} role="dialog" aria-modal="true" aria-label={meta.name}>
      <div className="arc-top">
        <button className="icon-btn" onClick={onExit} aria-label="Voltar aos jogos">
          <ChevronLeft size={22} />
        </button>
        <h2 className="arc-title">{meta.name}</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Sair">
          <X size={20} />
        </button>
      </div>
      {phase === 'play' && hud}
      <div className="arc-body">
        {phase === 'play' && <div key={round} className="arc-play">{children(end)}</div>}
        {phase === 'intro' && (
          <div className="arc-intro">
            <span className="arc-intro-pet">
              <Me size={130} mood="animado" />
              <span className="arc-intro-icon">
                <Glyph e={meta.icon} size={54} />
              </span>
            </span>
            <p className="arc-how">{meta.how}</p>
            <p className="arc-prize">
              <Glyph e="🌻" size={22} /> {left > 0 ? `Vale sementes! Ainda ${left} ${left === 1 ? 'partida premiada' : 'partidas premiadas'} hoje` : 'Hoje as partidas premiadas acabaram, mas brincar continua valendo carinho'}
            </p>
            <button className="arc-go" onClick={() => (play('pulo'), setPhase('play'))}>
              Jogar!
            </button>
          </div>
        )}
        {phase === 'end' && result && (
          <div className="arc-end">
            <p className="arc-end-title">{result.stars === 3 ? 'Incrível!' : result.stars === 2 ? 'Muito bem!' : 'Boa tentativa!'}</p>
            <p className="arc-stars" aria-label={`${result.stars} de 3 estrelas`}>
              {[0, 1, 2].map((i) => (
                <span key={i} className={i < result.stars ? 'is-on' : ''} style={{ animationDelay: `${i * 160}ms` }}>
                  ★
                </span>
              ))}
            </p>
            <span className="arc-end-pet">
              <Me size={120} mood={result.stars >= 2 ? 'animado' : 'feliz'} />
            </span>
            <p className="arc-score">
              {result.score} {result.score === 1 ? meta.unit.replace(/s$/, '') : meta.unit}
            </p>
            <p className="arc-coins">
              {result.coins > 0 ? (
                <>
                  <Glyph e="🌻" size={26} /> +{result.coins} sementes
                </>
              ) : (
                <>O {s.pet.name} adorou brincar! As sementes de jogo de hoje acabaram, amanhã tem mais.</>
              )}
            </p>
            <p className="arc-next">
              Mais estrelas, mais sementes: {meta.stars[1]} {meta.unit} = ★★ · {meta.stars[2]} {meta.unit} = ★★★
            </p>
            <div className="arc-end-btns">
              <button className="arc-go" onClick={again}>
                Jogar de novo
              </button>
              <button className="arc-soft" onClick={onExit}>
                Outros jogos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Placar simples no topo do jogo. */
export function Hud({ items }: { items: { icon: string; text: ReactNode; label: string }[] }) {
  return (
    <div className="arc-hud">
      {items.map((it) => (
        <span key={it.label} className="arc-chip" aria-label={it.label}>
          <Glyph e={it.icon} size={22} /> {it.text}
        </span>
      ))}
    </div>
  );
}

/** Botão que fica "apertado" enquanto o dedo está em cima (para andar e pular). */
export function HoldPad({ label, onChange, children, className = '' }: { label: string; onChange: (down: boolean) => void; children: ReactNode; className?: string }) {
  return (
    <button
      className={`arc-pad ${className}`}
      aria-label={label}
      onPointerDown={(e) => (e.currentTarget.setPointerCapture(e.pointerId), onChange(true))}
      onPointerUp={() => onChange(false)}
      onPointerCancel={() => onChange(false)}
      onPointerLeave={() => onChange(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}
