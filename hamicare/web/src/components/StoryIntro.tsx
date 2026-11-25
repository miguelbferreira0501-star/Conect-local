// História do começo: "a estrelinha cadente". Numa noite na clareira, uma estrela cai bem pertinho,
// fica brilhando na grama e, quando a pessoa chega perto, se abre em faíscas: dentro dela está o
// filhotinho dormindo. A pessoa toca nele com carinho, ele acorda, abana o rabo e escolhe ela.
// Ilustração plana própria (o mesmo cenário de fora do app); o texto aparece letra por letra.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Hamster } from './Hamster';
import { DogPose } from './DogPose';
import { Outdoors } from './Outdoors';
import { play } from '../lib/sound';
import { prefersReducedMotion } from '../lib/util';

type Scene = 'ceu' | 'brilho' | 'dorme' | 'oi';
const NO_OUTFIT = { chapeu: null, oculos: null, roupa: null, acessorio: null, efeito: null };

/** Texto que aparece letra por letra. */
function useTyped(text: string, speed = 32) {
  const [n, setN] = useState(prefersReducedMotion() ? text.length : 0);
  useEffect(() => setN(prefersReducedMotion() ? text.length : 0), [text]);
  useEffect(() => {
    if (n >= text.length) return;
    const t = setTimeout(() => setN((v) => v + 1), n === 0 ? 400 : speed);
    return () => clearTimeout(t);
  }, [n, text, speed]);
  return { shown: text.slice(0, n), done: n >= text.length };
}

const LINES: Record<Scene, string> = {
  ceu: 'Dizem que, toda noite, uma estrelinha cai pertinho de quem precisa de companhia…',
  brilho: 'Olha! Tem alguma coisa brilhando na grama.',
  dorme: 'É um filhotinho! Ele está dormindo. Toque nele com carinho.',
  oi: 'Ele acordou… e escolheu você!',
};

/** Estrela de cinco pontas arredondada. */
function Star({ size = 60, color = '#FFE27A' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="-50 -50 100 100" width={size} height={size} aria-hidden="true">
      <path d="M0 -44 Q7 -18 13 -14 Q20 -12 42 -13 Q24 0 21 6 Q19 13 26 36 Q7 22 0 21 Q-7 22 -26 36 Q-19 13 -21 6 Q-24 0 -42 -13 Q-20 -12 -13 -14 Q-7 -18 0 -44Z" fill={color} />
      <path d="M-8 -20 Q-4 -30 0 -34" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.8" />
    </svg>
  );
}

export function StoryIntro({ fur, onDone }: { fur: string; onDone: () => void }) {
  const [scene, setScene] = useState<Scene>('ceu');
  const [pop, setPop] = useState(false);
  const [hearts, setHearts] = useState(0);
  const typed = useTyped(LINES[scene]);

  // A estrela cai sozinha; depois do texto da noite, ela pousa na grama brilhando.
  useEffect(() => {
    if (scene !== 'ceu') return;
    const t = window.setTimeout(() => (play('brilho'), setScene('brilho')), prefersReducedMotion() ? 0 : 4200);
    return () => clearTimeout(t);
  }, [scene]);

  const open = () => {
    play('magia');
    setPop(true);
    window.setTimeout(() => setScene('dorme'), prefersReducedMotion() ? 0 : 650);
  };
  const wake = () => {
    if (scene !== 'dorme') return;
    play('latido');
    setHearts((h) => h + 1);
    setScene('oi');
  };
  const pet = () => {
    play('coracao');
    setHearts((h) => h + 1);
  };

  return createPortal(
    <div className={`sx sy sy-${scene}`} role="dialog" aria-modal="true" aria-label="Como tudo começou">
      <div className="sy-bg" aria-hidden="true">
        <span className="sy-moon" />
        {Array.from({ length: 34 }, (_, i) => (
          <span key={i} className="sy-star" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 23) % 52}%`, animationDelay: `${(i * 0.31) % 3}s`, width: i % 4 ? 2 : 3, height: i % 4 ? 2 : 3 }} />
        ))}
        <div className="sy-land">
          <Outdoors period="noite" height="100%" />
        </div>
      </div>

      {scene === 'ceu' && (
        <span className="sy-falling" aria-hidden="true">
          <span className="sy-trail" />
          <Star size={34} />
        </span>
      )}

      {scene === 'brilho' && (
        <button className={`sy-glow ${pop ? 'is-pop' : ''}`} onClick={open} aria-label="Chegar mais perto da estrela">
          <span className="sy-halo" />
          <Star size={86} />
          {pop && Array.from({ length: 12 }, (_, i) => <span key={i} className="sy-spark" style={{ ['--a' as string]: `${i * 30}deg` }} />)}
        </button>
      )}

      {scene === 'dorme' && (
        <button className="sy-pet sy-sleep" onClick={wake} aria-label="Fazer carinho no filhote">
          <span className="sy-halo is-soft" />
          <DogPose kind="dorme" fur={fur} width={200} label="" />
          <span className="sy-z" aria-hidden="true">z</span>
          <span className="sy-z is-2" aria-hidden="true">z</span>
          <span className="sy-tap" aria-hidden="true" />
        </button>
      )}

      {scene === 'oi' && (
        <button className="sy-pet sy-awake" onClick={pet} aria-label="Fazer mais carinho">
          <Hamster fur={fur} size={190} mood={hearts > 1 ? 'amor' : 'animado'} outfit={NO_OUTFIT} grams={110} growth={0.9} label="" />
          {Array.from({ length: Math.min(hearts, 6) }, (_, i) => (
            <span key={`${hearts}-${i}`} className="sy-heart" style={{ left: `${30 + ((i * 23) % 50)}%`, animationDelay: `${i * 0.12}s` }}>
              ♥
            </span>
          ))}
        </button>
      )}

      <p className="sx-text" aria-live="polite">
        {typed.shown}
        <span className="sx-caret" aria-hidden="true" />
      </p>

      <button className="sx-skip" onClick={onDone}>
        Pular
      </button>

      <div className="sx-actions">
        {scene === 'brilho' && typed.done && !pop && (
          <button className="sx-btn" onClick={open}>
            Chegar mais perto
          </button>
        )}
        {scene === 'oi' && typed.done && (
          <button className="sx-btn" onClick={() => (play('pulo'), onDone())}>
            Continuar
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
