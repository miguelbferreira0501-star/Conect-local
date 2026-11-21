// História do começo, em cenas de ilustração plana (como uma pequena animação):
// 1. as nuvens se abrem numa noite de chuva; 2. o Hami está encolhido, molhado, com uma folhinha na cabeça;
// 3. duas mãos levam ele com cuidado; 4. em casa ele está molhadinho; 5. a toalha embrulha ele e ele sorri.
// O texto aparece letra por letra, e só um botão por cena.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Hamster } from './Hamster';
import { CozyRoom, CurledHami, Hands, Leaf, WrappedHami } from './StoryArt';
import { play } from '../lib/sound';
import { prefersReducedMotion } from '../lib/util';

type Scene = 'nuvens' | 'chuva' | 'maos' | 'casa' | 'toalha';
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
  nuvens: '',
  chuva: 'A chuva está forte… Vamos encontrar um lugar seco para ele.',
  maos: '',
  casa: 'Ah, ele se molhou bastante!',
  toalha: 'Bem melhor! Obrigado por cuidar de mim.',
};

export function StoryIntro({ fur, onDone }: { fur: string; onDone: () => void }) {
  const [scene, setScene] = useState<Scene>('nuvens');
  const [eyes, setEyes] = useState<'fechados' | 'tristes' | 'acima'>('fechados');
  const typed = useTyped(LINES[scene]);
  const night = scene === 'nuvens' || scene === 'chuva' || scene === 'maos';

  // Sequências automáticas: nuvens se abrem; ele abre os olhinhos; as mãos levam ele para casa.
  useEffect(() => {
    const ts: number[] = [];
    const at = (ms: number, fn: () => void) => ts.push(window.setTimeout(fn, prefersReducedMotion() ? 0 : ms));
    if (scene === 'nuvens') at(1700, () => setScene('chuva'));
    if (scene === 'chuva') at(1400, () => setEyes('tristes'));
    if (scene === 'maos') {
      at(700, () => setEyes('acima'));
      at(2600, () => setScene('casa'));
    }
    return () => ts.forEach(clearTimeout);
  }, [scene]);

  const go = (s: Scene) => {
    play(s === 'toalha' ? 'toalha' : 'pulo');
    setScene(s);
  };

  return createPortal(
    <div className={`sx sx-${scene} ${night ? 'is-night' : 'is-home'}`} role="dialog" aria-modal="true" aria-label="Como tudo começou">
      {night ? (
        <div className="sx-night" aria-hidden="true">
          <div className="sx-sky" />
          <svg className="sx-hills" viewBox="0 0 390 120" preserveAspectRatio="none">
            <path d="M0 120 V70 Q60 40 120 66 T240 60 T390 54 V120Z" fill="#1B2148" />
            <path d="M0 120 V92 Q90 70 190 90 T390 84 V120Z" fill="#161B3D" />
          </svg>
          {!prefersReducedMotion() && (
            <div className="sx-rain">
              {Array.from({ length: 40 }, (_, i) => (
                <span key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${((i * 53) % 100) / 100}s`, animationDuration: `${0.7 + ((i * 17) % 40) / 100}s` }} />
              ))}
            </div>
          )}
          {!prefersReducedMotion() &&
            [12, 70, 38, 86].map((x, i) => (
              <span key={i} className="sx-leaf" style={{ left: `${x}%`, animationDelay: `${i * 1.3}s` }}>
                <Leaf size={22 + (i % 2) * 6} color={i % 2 ? '#4FA36B' : '#63B57E'} />
              </span>
            ))}
          <div className="sx-cloud sx-cloud-l" />
          <div className="sx-cloud sx-cloud-r" />
          <div className="sx-cloud sx-cloud-b" />
        </div>
      ) : (
        <CozyRoom />
      )}

      {(scene === 'chuva' || scene === 'maos') && (
        <div className="sx-stage">
          <div className={`sx-lift ${scene === 'maos' ? 'is-up' : ''}`}>
            <div className={`sx-curled ${scene === 'chuva' ? 'is-shiver' : ''}`}>
              <CurledHami fur={fur} eyes={eyes} size={250} />
            </div>
            <div className={`sx-hands ${scene === 'maos' ? 'is-in' : ''}`}>
              <Hands width={400} />
            </div>
          </div>
        </div>
      )}

      {scene === 'casa' && (
        <div className="sx-home-pet">
          <Hamster fur={fur} size={190} mood="surpreso" wet idle={false} growth={0.9} outfit={NO_OUTFIT} grams={110} label="" />
        </div>
      )}
      {scene === 'toalha' && (
        <div className="sx-home-pet sx-wrapped">
          <WrappedHami fur={fur} size={200} />
        </div>
      )}

      {LINES[scene] && (
        <p className="sx-text" aria-live="polite">
          {typed.shown}
          <span className="sx-caret" aria-hidden="true" />
        </p>
      )}

      <button className="sx-skip" onClick={onDone}>
        Pular
      </button>

      <div className="sx-actions">
        {scene === 'chuva' && typed.done && (
          <button className="sx-btn" onClick={() => go('maos')}>
            Levar para casa
          </button>
        )}
        {scene === 'casa' && typed.done && (
          <button className="sx-btn" onClick={() => go('toalha')}>
            Secar com cuidado
          </button>
        )}
        {scene === 'toalha' && typed.done && (
          <button className="sx-btn" onClick={() => (play('pulo'), onDone())}>
            Continuar
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
