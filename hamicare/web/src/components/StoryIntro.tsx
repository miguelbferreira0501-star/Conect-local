// História do começo: o filhotinho da caixa de papelão. Numa esquina fria, à noite, embaixo de um
// poste, alguém deixou uma caixinha com um bilhete "me leva?". Dentro está um filhote bem pequeno,
// tremendo e triste. A pessoa chega perto, faz carinho devagar (ele tem medo no começo), ele confia,
// abana o rabo e pula da caixa. Ilustração plana própria; o texto aparece letra por letra.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Hamster } from './Hamster';
import { Leaf } from './StoryArt';
import { play } from '../lib/sound';
import { prefersReducedMotion } from '../lib/util';
import type { PetMood } from '../types';

type Scene = 'rua' | 'caixa' | 'medo' | 'confia' | 'feliz';
const NO_OUTFIT = { chapeu: null, oculos: null, roupa: null, acessorio: null, efeito: null };

/** Texto que aparece letra por letra. */
function useTyped(text: string, speed = 34) {
  const [n, setN] = useState(prefersReducedMotion() ? text.length : 0);
  useEffect(() => setN(prefersReducedMotion() ? text.length : 0), [text]);
  useEffect(() => {
    if (n >= text.length) return;
    const t = setTimeout(() => setN((v) => v + 1), n === 0 ? 450 : speed);
    return () => clearTimeout(t);
  }, [n, text, speed]);
  return { shown: text.slice(0, n), done: n >= text.length };
}

const LINES: Record<Scene, string> = {
  rua: 'Numa esquina fria, alguém deixou uma caixinha de papelão…',
  caixa: 'Dentro dela, um filhotinho. Sozinho, com frio e com fome. Faz dias que ninguém para.',
  medo: 'Ele está com medo… Faça carinho bem devagar.',
  confia: 'Mais um pouquinho…',
  feliz: 'Ele confiou em você. Agora ele tem alguém.',
};

/** A rua de noite: muro de tijolinho, janelas acesas ao longe, calçada e o poste com a luz amarela. */
function Street({ lit }: { lit: boolean }) {
  return (
    <svg className="sb-street" viewBox="0 0 390 844" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="sb-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141a3a" />
          <stop offset="1" stopColor="#2a2f5c" />
        </linearGradient>
        <radialGradient id="sb-lamp" cx="0.5" cy="0" r="1">
          <stop offset="0" stopColor="#FFE7A3" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#FFE7A3" stopOpacity="0.12" />
          <stop offset="1" stopColor="#FFE7A3" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="390" height="844" fill="url(#sb-sky)" />
      {[[40, 60], [120, 110], [300, 70], [350, 150], [210, 40], [80, 190]].map(([x, y], i) => (
        <circle key={i} className="od-star" style={{ animationDelay: `${i * 0.5}s` }} cx={x} cy={y} r="1.6" fill="#FFFFFF" />
      ))}
      {/* prédios ao longe */}
      <path d="M0 330 V230 H70 V190 H130 V250 H190 V170 H260 V220 H320 V200 H390 V330Z" fill="#232850" />
      {[[16, 250], [40, 280], [90, 210], [150, 270], [206, 190], [230, 230], [280, 240], [340, 220], [360, 260]].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="12" height="14" rx="2" fill={i % 3 ? '#3A4070' : '#F6D27A'} opacity={i % 3 ? 1 : 0.8} />
      ))}
      {/* muro de tijolinho */}
      <rect x="0" y="330" width="390" height="330" fill="#7A4E4E" />
      {Array.from({ length: 11 }, (_, r) =>
        Array.from({ length: 9 }, (_, c) => <rect key={`${r}-${c}`} x={c * 48 - (r % 2 ? 24 : 0)} y={334 + r * 30} width="44" height="26" rx="3" fill={(r + c) % 4 ? '#865858' : '#8F6262'} />),
      )}
      <rect x="0" y="640" width="390" height="22" fill="#5E3C40" />
      {/* calçada */}
      <rect x="0" y="660" width="390" height="184" fill="#8C8FA8" />
      <path d="M0 660 H390" stroke="#A9ACC2" strokeWidth="6" />
      {[70, 190, 310].map((x) => (
        <path key={x} d={`M${x} 664 L${x - 40} 844`} stroke="#7B7E98" strokeWidth="3" />
      ))}
      {/* poste */}
      <rect x="318" y="250" width="12" height="412" rx="4" fill="#3B3F5E" />
      <path d="M324 254 Q324 220 280 218 H262" stroke="#3B3F5E" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M244 214 H282 L276 232 H250Z" fill="#3B3F5E" />
      <ellipse cx="263" cy="234" rx="12" ry="5" fill={lit ? '#FFE7A3' : '#C9B98A'} />
      {lit && <path className="sb-cone" d="M250 234 L276 234 L370 700 L150 700Z" fill="url(#sb-lamp)" />}
      <ellipse cx="263" cy="704" rx="120" ry="20" fill="#FFE7A3" opacity={lit ? 0.18 : 0.06} />
    </svg>
  );
}

/** Caixa de papelão aberta, com a fita e o bilhete "me leva?". Duas camadas: o fundo (atrás do filhote) e a frente. */
function BoxBack() {
  return (
    <svg className="sb-box-back" viewBox="0 0 260 190" aria-hidden="true">
      <path d="M30 70 L60 40 H210 L232 70Z" fill="#8E5E36" />
      <path d="M60 40 L28 6 L22 44 L30 70Z" fill="#C48A55" />
      <path d="M210 40 L246 12 L250 48 L232 70Z" fill="#B67D4A" />
    </svg>
  );
}
function BoxFront() {
  return (
    <svg className="sb-box-front" viewBox="0 0 260 190" aria-hidden="true">
      <path d="M22 72 H238 L230 184 H30Z" fill="#D49B62" />
      <path d="M22 72 H238 L236 86 H24Z" fill="#B98049" />
      <path d="M22 72 L-4 104 L14 112 L30 84Z" fill="#E2AC72" />
      <path d="M238 72 L264 100 L248 110 L232 84Z" fill="#C8905A" />
      <rect x="112" y="86" width="36" height="98" fill="#E9D3A8" opacity="0.8" />
      <path d="M40 150 q10 4 20 0 M190 120 q12 6 22 0" stroke="#B98049" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* bilhete escrito à mão */}
      <g transform="rotate(-6 70 128)">
        <rect x="34" y="104" width="74" height="44" rx="4" fill="#F4E6C6" />
        <text x="71" y="122" textAnchor="middle" fontFamily="'Comic Sans MS', 'Baloo 2', cursive" fontWeight="700" fontSize="13" fill="#4A3A40">
          me leva?
        </text>
        <path d="M58 132 q4 -6 8 0 q4 -6 8 0 l-8 8z" fill="#E86A7A" />
      </g>
    </svg>
  );
}

export function StoryIntro({ fur, onDone }: { fur: string; onDone: () => void }) {
  const [scene, setScene] = useState<Scene>('rua');
  const [hearts, setHearts] = useState(0);
  const typed = useTyped(LINES[scene]);
  const still = prefersReducedMotion();

  // A rua aparece e a câmera "chega" na caixinha sozinha.
  useEffect(() => {
    if (scene !== 'rua') return;
    const t = window.setTimeout(() => setScene('caixa'), still ? 0 : 4600);
    return () => clearTimeout(t);
  }, [scene, still]);

  const tapPup = () => {
    if (scene === 'medo') {
      play('choro');
      setScene('confia');
    } else if (scene === 'confia') {
      play('latido');
      setHearts(1);
      setScene('feliz');
    } else if (scene === 'feliz') {
      play('coracao');
      setHearts((h) => h + 1);
    }
  };

  const mood: PetMood = scene === 'feliz' ? (hearts > 1 ? 'amor' : 'animado') : scene === 'confia' ? 'surpreso' : 'choro';
  const close = scene !== 'rua';
  const out = scene === 'feliz';

  return createPortal(
    <div className={`sx sb sb-${scene}`} role="dialog" aria-modal="true" aria-label="Como tudo começou">
      <div className={`sb-world ${close ? 'is-close' : ''}`} aria-hidden="true">
        <Street lit />
      </div>
      {!still && (
        <div className="sb-wind" aria-hidden="true">
          {[46, 62, 52, 70, 58].map((y, i) => (
            <span key={i} className="sb-leaf" style={{ top: `${y}%`, animationDelay: `${i * 1.4}s` }}>
              <Leaf size={18 + (i % 2) * 6} color={i % 2 ? '#B9824A' : '#D49A55'} />
            </span>
          ))}
        </div>
      )}

      <div className={`sb-box ${close ? 'is-close' : ''}`}>
        <BoxBack />
        <button
          className={`sb-pup ${out ? 'is-out' : scene === 'confia' ? 'is-calm' : 'is-shiver'}`}
          onClick={tapPup}
          disabled={scene === 'rua' || scene === 'caixa'}
          aria-label="Fazer carinho no filhote"
        >
          <Hamster fur={fur} size={out ? 170 : 160} mood={mood} outfit={NO_OUTFIT} grams={90} growth={0.78} idle={out} label="" />
          {(scene === 'medo' || scene === 'confia') && <span className="sb-tap" aria-hidden="true" />}
          {out &&
            Array.from({ length: Math.min(hearts + 2, 7) }, (_, i) => (
              <span key={`${hearts}-${i}`} className="sb-heart" style={{ left: `${24 + ((i * 19) % 56)}%`, animationDelay: `${i * 0.15}s` }}>
                ♥
              </span>
            ))}
        </button>
        <BoxFront />
        {/* patinhas na beirada da caixa */}
        {!out && (
          <svg className="sb-paws" viewBox="0 0 80 20" aria-hidden="true">
            <ellipse cx="18" cy="10" rx="13" ry="8" fill="#FFF3E2" stroke="#E8B98A" strokeWidth="2" />
            <ellipse cx="62" cy="10" rx="13" ry="8" fill="#FFF3E2" stroke="#E8B98A" strokeWidth="2" />
          </svg>
        )}
        {/* tigelinha vazia */}
        <svg className="sb-bowl" viewBox="0 0 60 26" aria-hidden="true">
          <path d="M4 8 H56 Q54 24 30 24 Q6 24 4 8Z" fill="#9AA0BE" />
          <ellipse cx="30" cy="8" rx="26" ry="5" fill="#B8BDD6" />
          <ellipse cx="30" cy="8" rx="19" ry="3" fill="#7E84A2" />
        </svg>
        {!out && scene !== 'rua' && <span className="sb-breath" aria-hidden="true" />}
      </div>

      <p className="sx-text" aria-live="polite">
        {typed.shown}
        <span className="sx-caret" aria-hidden="true" />
      </p>

      <button className="sx-skip" onClick={onDone}>
        Pular
      </button>

      <div className="sx-actions">
        {scene === 'caixa' && typed.done && (
          <button className="sx-btn" onClick={() => (play('pulo'), setScene('medo'))}>
            Chegar perto
          </button>
        )}
        {scene === 'feliz' && typed.done && (
          <button className="sx-btn" onClick={() => (play('pulo'), onDone())}>
            Levar ele para casa
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
