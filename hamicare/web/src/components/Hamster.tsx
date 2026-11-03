import { useId } from 'react';
import { furById } from '../data/fur';
import { fluffOf } from '../logic/evolution';
import type { Outfit, PetMood } from '../types';

const INK = '#2B2224';
const NO_OUTFIT: Outfit = { chapeu: null, oculos: null, roupa: null, acessorio: null };

export interface HamsterProps {
  fur: string;
  grams?: number;
  phase?: number;
  mood?: PetMood;
  outfit?: Outfit;
  size?: number;
  idle?: boolean;
  label?: string;
  /** Hamster de outra pessoa (feed, visitas): sempre no formato padrão, sem comparação de corpo. */
  neutral?: boolean;
}

/**
 * O Hami: hamster redondo com uma mancha de coração na barriga (a marca do HamiCare).
 * O peso virtual muda a "fofura" (largura e bochechas); as fases mudam postura e detalhes.
 */
export function Hamster({ fur: furId, grams = 135, phase = 0, mood = 'feliz', outfit = NO_OUTFIT, size = 180, idle = true, label, neutral }: HamsterProps) {
  const fur = furById(furId);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const f = fluffOf(neutral ? 135 : grams);
  const w = 54 + f * 26;
  const h = 104 + phase * 3 - f * 6;
  const top = 178 - h;
  const eyeY = top + h * 0.4;
  const noseY = eyeY + 12;
  const eating = mood === 'comendo';
  const asleep = mood === 'dormindo' || mood === 'sono';
  const body = `M${100 - w} 150 C${100 - w} ${top + 22} ${100 - w * 0.56} ${top} 100 ${top} C${100 + w * 0.56} ${top} ${100 + w} ${top + 22} ${100 + w} 150 C${100 + w} 172 ${100 + w * 0.6} 179 100 179 C${100 - w * 0.6} 179 ${100 - w} 172 ${100 - w} 150 Z`;
  const earR = 14 + (phase >= 1 ? 2.5 : 0);
  const pouchR = 8 + f * 7 + (eating ? 9 : 0);
  const geo = { top, w, h, eyeY };

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={label ?? 'Hami'} className="block overflow-visible">
      <defs>
        <clipPath id={`b${uid}`}>
          <path d={body} />
        </clipPath>
        <radialGradient id={`g${uid}`}>
          <stop offset="0%" stopColor="#FFE07A" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFE07A" stopOpacity="0" />
        </radialGradient>
      </defs>
      {phase >= 3 && <circle cx="100" cy={top + h * 0.55} r="92" fill={`url(#g${uid})`} />}
      <ellipse cx="100" cy="186" rx={w * 0.85} ry="6.5" fill="rgba(0,0,0,0.13)" />
      <g className={idle && !asleep ? 'pet-idle' : asleep ? 'pet-sleep' : undefined}>
        {outfit.roupa === 'capa' && <path d={`M${100 - w * 0.7} ${top + h * 0.5} L${100 - w - 10} 182 L${100 + w + 10} 182 L${100 + w * 0.7} ${top + h * 0.5} Z`} fill="#D7263D" />}
        {/* Orelhas */}
        {[-1, 1].map((s) => (
          <g key={s}>
            <circle cx={100 + s * w * 0.6} cy={top + 12} r={earR} fill={fur.pattern === 'panda' ? fur.patch : fur.shade} />
            <circle cx={100 + s * w * 0.6} cy={top + 13} r={earR * 0.55} fill={fur.ear} />
          </g>
        ))}
        {/* Bochechas para fora (crescem com a fofura e quando come) */}
        {!eating && [-1, 1].map((s) => <circle key={s} cx={100 + s * (w - 3)} cy={top + h * 0.52} r={pouchR} fill={fur.body} />)}
        <path d={body} fill={fur.body} />
        <g clipPath={`url(#b${uid})`}>
          <path d={`M${100 - w} 150 C${100 - w} 172 ${100 - w * 0.6} 179 100 179 C${100 + w * 0.6} 179 ${100 + w} 172 ${100 + w} 150 C${100 + w * 0.8} 168 ${100 - w * 0.8} 168 ${100 - w} 150 Z`} fill={fur.shade} opacity="0.5" />
          <ellipse cx="100" cy={top + h * 0.76} rx={w * 0.62} ry={h * 0.3} fill={fur.belly} />
          {fur.pattern === 'manchas' && (
            <>
              <ellipse cx={100 - w * 0.55} cy={top + h * 0.3} rx="22" ry="17" fill={fur.patch} opacity="0.85" />
              <ellipse cx={100 + w * 0.75} cy={top + h * 0.75} rx="16" ry="20" fill={fur.patch} opacity="0.85" />
            </>
          )}
          {phase === 2 && !outfit.chapeu && (
            <g>
              <rect x={100 - w} y={top + 14} width={w * 2} height="9" fill="#FF6F91" />
              <rect x={100 - w} y={top + 17.5} width={w * 2} height="2" fill="#FFFFFF" opacity="0.8" />
            </g>
          )}
          <Clothes id={outfit.roupa} geo={geo} />
        </g>
        <ellipse cx={100 - w * 0.36} cy={top + 18} rx="13" ry="7" fill="#fff" opacity="0.32" transform={`rotate(-22 ${100 - w * 0.36} ${top + 18})`} />
        {phase === 0 && <path d={`M94 ${top + 4} q3 -11 6 -1 q3 -11 6 0`} stroke={fur.shade} strokeWidth="3.5" strokeLinecap="round" fill="none" />}
        {/* Coração na barriga: a marca do HamiCare */}
        {outfit.roupa !== 'moletom' && outfit.roupa !== 'pijama' && outfit.roupa !== 'regata' && (
          <Heart x={100} y={top + h * 0.74} s={phase >= 3 ? 15 : 12} fill={phase >= 3 ? '#F6C445' : fur.ear} opacity={phase >= 3 ? 1 : 0.5} />
        )}
        {/* Bracinhos e pezinhos */}
        {[-1, 1].map((s) => (
          <g key={s}>
            <ellipse cx={100 + s * w * 0.27} cy={top + h * 0.68} rx="7.5" ry="5.5" fill={fur.shade} transform={`rotate(${s * 30} ${100 + s * w * 0.27} ${top + h * 0.68})`} />
            <ellipse cx={100 + s * 24} cy="180" rx="11" ry="6" fill={fur.ear} />
          </g>
        ))}
        {fur.pattern === 'panda' && [-1, 1].map((s) => <ellipse key={s} cx={100 + s * 19} cy={eyeY} rx="11" ry="12" fill={fur.patch} opacity="0.9" />)}
        <Face mood={mood} eyeY={eyeY} noseY={noseY} cheek={fur.ear} whisker={fur.shade} />
        {eating && [-1, 1].map((s) => (
          <g key={s}>
            <circle cx={100 + s * (w - 6)} cy={top + h * 0.55} r={pouchR} fill={fur.body} />
            <ellipse cx={100 + s * (w - 6)} cy={top + h * 0.58} rx="8" ry="5" fill={fur.ear} opacity="0.5" />
          </g>
        ))}
        <Accessory id={outfit.acessorio} geo={geo} />
        <Glasses id={outfit.oculos} eyeY={eyeY} />
        <Hat id={outfit.chapeu} geo={geo} />
        {phase >= 3 && <Sparkles top={top} w={w} />}
      </g>
      {asleep && (
        <text x={100 + w * 0.7} y={top - 2} className="zzz" fontSize="18" fontWeight="800" fill={INK} opacity="0.6">
          z z
        </text>
      )}
    </svg>
  );
}

type Geo = { top: number; w: number; h: number; eyeY: number };

function Heart({ x, y, s, fill, opacity = 1 }: { x: number; y: number; s: number; fill: string; opacity?: number }) {
  const k = s / 12;
  return (
    <path
      d={`M${x} ${y + 9 * k} C${x - 14 * k} ${y - 1 * k} ${x - 9 * k} ${y - 11 * k} ${x} ${y - 4 * k} C${x + 9 * k} ${y - 11 * k} ${x + 14 * k} ${y - 1 * k} ${x} ${y + 9 * k} Z`}
      fill={fill}
      opacity={opacity}
    />
  );
}

function Face({ mood, eyeY, noseY, cheek, whisker }: { mood: PetMood; eyeY: number; noseY: number; cheek: string; whisker: string }) {
  const closed = mood === 'calmo' || mood === 'sono' || mood === 'dormindo';
  const happy = mood === 'animado' || mood === 'comendo';
  return (
    <g>
      {closed ? (
        <g stroke={INK} strokeWidth="3.2" strokeLinecap="round" fill="none">
          <path d={`M75 ${eyeY} Q81 ${eyeY + 4} 87 ${eyeY}`} />
          <path d={`M113 ${eyeY} Q119 ${eyeY + 4} 125 ${eyeY}`} />
        </g>
      ) : happy ? (
        <g stroke={INK} strokeWidth="3.4" strokeLinecap="round" fill="none">
          <path d={`M75 ${eyeY + 2} Q81 ${eyeY - 5} 87 ${eyeY + 2}`} />
          <path d={`M113 ${eyeY + 2} Q119 ${eyeY - 5} 125 ${eyeY + 2}`} />
        </g>
      ) : (
        <g className="pet-eyes">
          <ellipse cx="81" cy={eyeY} rx="6.2" ry="7.6" fill={INK} />
          <ellipse cx="119" cy={eyeY} rx="6.2" ry="7.6" fill={INK} />
          <circle cx="83.3" cy={eyeY - 3} r="2.3" fill="#fff" />
          <circle cx="121.3" cy={eyeY - 3} r="2.3" fill="#fff" />
        </g>
      )}
      <ellipse cx="67" cy={eyeY + 15} rx="9" ry="5.5" fill={cheek} opacity="0.55" />
      <ellipse cx="133" cy={eyeY + 15} rx="9" ry="5.5" fill={cheek} opacity="0.55" />
      <path d={`M96.5 ${noseY - 2} L103.5 ${noseY - 2} L100 ${noseY + 2.5} Z`} fill="#F07A93" stroke="#F07A93" strokeWidth="2" strokeLinejoin="round" />
      {mood === 'animado' ? (
        <ellipse cx="100" cy={noseY + 8} rx="4.5" ry="5" fill={INK} />
      ) : (
        <path d={`M93 ${noseY + 4} q3.5 4 7 0 q3.5 4 7 0`} stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      )}
      <g stroke={whisker} strokeWidth="1.6" strokeLinecap="round" opacity="0.7">
        <path d={`M86 ${noseY + 1} L64 ${noseY - 3}`} />
        <path d={`M86 ${noseY + 5} L64 ${noseY + 7}`} />
        <path d={`M114 ${noseY + 1} L136 ${noseY - 3}`} />
        <path d={`M114 ${noseY + 5} L136 ${noseY + 7}`} />
      </g>
    </g>
  );
}

function Sparkles({ top, w }: { top: number; w: number }) {
  const star = (x: number, y: number, r: number) => `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`;
  return (
    <g fill="#F6C445" className="sparkle">
      <path d={star(100 - w - 8, top + 30, 7)} />
      <path d={star(100 + w + 6, top + 50, 6)} />
      <path d={star(100 + w * 0.5, top - 8, 5)} />
    </g>
  );
}

function Hat({ id, geo }: { id: string | null; geo: Geo }) {
  const { top, w, h } = geo;
  switch (id) {
    case 'laco':
      return (
        <g transform={`translate(${100 + w * 0.42} ${top + 8})`}>
          <path d="M0 0 L-16 -11 L-14 12 Z" fill="#FF5E7E" />
          <path d="M0 0 L16 -11 L14 12 Z" fill="#FF5E7E" />
          <circle r="5.5" fill="#E2416A" />
        </g>
      );
    case 'bone':
      return (
        <g>
          <path d={`M${100 - w * 0.66} ${top + 18} C${100 - w * 0.6} ${top - 16} ${100 + w * 0.6} ${top - 16} ${100 + w * 0.66} ${top + 18} Z`} fill="#3D6FD8" />
          <path d={`M${100 + w * 0.5} ${top + 14} C${100 + w * 0.9} ${top + 8} ${100 + w * 1.15} ${top + 14} ${100 + w * 1.15} ${top + 20} C${100 + w * 0.9} ${top + 22} ${100 + w * 0.6} ${top + 20} ${100 + w * 0.5} ${top + 18} Z`} fill="#2F59B3" />
          <circle cx="100" cy={top - 6} r="3.5" fill="#2F59B3" />
        </g>
      );
    case 'gorro':
      return (
        <g>
          <path d={`M${100 - w * 0.7} ${top + 18} C${100 - w * 0.66} ${top - 22} ${100 + w * 0.66} ${top - 22} ${100 + w * 0.7} ${top + 18} Z`} fill="#4C9F9F" />
          <rect x={100 - w * 0.74} y={top + 10} width={w * 1.48} height="11" rx="5.5" fill="#3B8686" />
          <circle cx="100" cy={top - 15} r="9" fill="#F2C14E" />
        </g>
      );
    case 'coroa':
      return (
        <g>
          {[-0.6, -0.35, -0.12, 0.12, 0.35, 0.6].map((k, i) => (
            <g key={k} transform={`translate(${100 + w * k} ${top + 6 + Math.abs(k) * 14})`}>
              <circle r="7" fill={['#FF8FB4', '#FFD660', '#FFFFFF', '#B39AE6', '#FF8FB4', '#FFD660'][i]} />
              <circle r="2.6" fill="#E8879E" />
            </g>
          ))}
        </g>
      );
    case 'chef':
      return (
        <g>
          <rect x={100 - w * 0.4} y={top - 6} width={w * 0.8} height="18" fill="#FFFFFF" stroke="#E6E6E6" />
          {[-0.28, 0, 0.28].map((k) => <circle key={k} cx={100 + w * k} cy={top - 16} r="15" fill="#FFFFFF" stroke="#E6E6E6" />)}
        </g>
      );
    case 'cartola':
      return (
        <g>
          <ellipse cx="100" cy={top + 8} rx={w * 0.62} ry="7" fill="#2B2224" />
          <rect x={100 - w * 0.38} y={top - 34} width={w * 0.76} height="42" rx="4" fill="#2B2224" />
          <rect x={100 - w * 0.38} y={top - 2} width={w * 0.76} height="7" fill="#D1495B" />
        </g>
      );
    case 'capacete':
      return <circle cx="100" cy={top + h * 0.42} r={w * 1.02} fill="#BFE3FF" fillOpacity="0.25" stroke="#FFFFFF" strokeWidth="4" />;
    case 'palha':
      return (
        <g>
          <ellipse cx="100" cy={top + 10} rx={w * 1.02} ry="11" fill="#E3B65C" />
          <path d={`M${100 - w * 0.5} ${top + 10} C${100 - w * 0.48} ${top - 20} ${100 + w * 0.48} ${top - 20} ${100 + w * 0.5} ${top + 10} Z`} fill="#F0CF7C" />
          <rect x={100 - w * 0.5} y={top + 1} width={w} height="7" fill="#D1495B" />
        </g>
      );
    case 'gorro-natal':
      return (
        <g>
          <path d={`M${100 - w * 0.7} ${top + 16} C${100 - w * 0.6} ${top - 18} ${100 + w * 0.2} ${top - 34} ${100 + w * 0.95} ${top - 18} C${100 + w * 0.6} ${top - 8} ${100 + w * 0.55} ${top + 2} ${100 + w * 0.68} ${top + 16} Z`} fill="#D7263D" />
          <rect x={100 - w * 0.76} y={top + 8} width={w * 1.5} height="13" rx="6.5" fill="#FFFFFF" />
          <circle cx={100 + w * 0.98} cy={top - 18} r="8" fill="#FFFFFF" />
        </g>
      );
    default:
      return null;
  }
}

function Glasses({ id, eyeY }: { id: string | null; eyeY: number }) {
  if (id === 'redondos') {
    return (
      <g stroke={INK} strokeWidth="2.8" fill="#FFFFFF" fillOpacity="0.15">
        <circle cx="81" cy={eyeY} r="11.5" />
        <circle cx="119" cy={eyeY} r="11.5" />
        <path d={`M92.5 ${eyeY - 1} Q100 ${eyeY - 5} 107.5 ${eyeY - 1}`} fill="none" />
      </g>
    );
  }
  if (id === 'sol') {
    return (
      <g>
        <rect x="68" y={eyeY - 8} width="26" height="16" rx="7" fill="#2B2224" />
        <rect x="106" y={eyeY - 8} width="26" height="16" rx="7" fill="#2B2224" />
        <path d={`M94 ${eyeY - 2} L106 ${eyeY - 2}`} stroke="#2B2224" strokeWidth="3" />
        <path d={`M72 ${eyeY - 4} l6 0`} stroke="#fff" strokeWidth="2" opacity="0.6" />
      </g>
    );
  }
  if (id === 'coracao') {
    return (
      <g>
        <Heart x={81} y={eyeY - 1} s={15} fill="#FF5E7E" opacity={0.9} />
        <Heart x={119} y={eyeY - 1} s={15} fill="#FF5E7E" opacity={0.9} />
        <path d={`M93 ${eyeY - 3} L107 ${eyeY - 3}`} stroke="#E2416A" strokeWidth="2.5" />
      </g>
    );
  }
  return null;
}

function Clothes({ id, geo }: { id: string | null; geo: Geo }) {
  const { top, h } = geo;
  const y = top + h * 0.6;
  switch (id) {
    case 'moletom':
      return (
        <g>
          <rect x="0" y={y} width="200" height="100" fill="#8FA8E8" />
          <rect x="82" y={y + 22} width="36" height="16" rx="5" fill="#7A93D6" />
          <path d={`M92 ${y} l0 14 M108 ${y} l0 14`} stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    case 'regata':
      return (
        <g>
          <rect x="0" y={y + 2} width="200" height="100" fill="#FF6F91" />
          <path d={`M78 ${y + 2} Q100 ${y + 16} 122 ${y + 2}`} fill="#FFFFFF" opacity="0.9" />
          <text x="100" y={y + 34} textAnchor="middle" fontSize="16" fontWeight="900" fill="#FFFFFF">
            1
          </text>
        </g>
      );
    case 'pijama':
      return (
        <g>
          <rect x="0" y={y} width="200" height="100" fill="#3E4C8A" />
          {[[78, 14], [112, 24], [92, 34], [126, 12], [70, 32]].map(([x, dy], i) => (
            <circle key={i} cx={x} cy={y + dy} r="2.6" fill="#FFE07A" />
          ))}
        </g>
      );
    case 'tutu':
      return <path d={`M30 ${y + 30} L45 ${y + 18} L58 ${y + 30} L72 ${y + 18} L86 ${y + 30} L100 ${y + 18} L114 ${y + 30} L128 ${y + 18} L142 ${y + 30} L156 ${y + 18} L170 ${y + 30} L170 ${y + 44} L30 ${y + 44} Z`} fill="#FFB3CF" opacity="0.9" />;
    default:
      return null;
  }
}

function Accessory({ id, geo }: { id: string | null; geo: Geo }) {
  const { top, w, h } = geo;
  const y = top + h * 0.6;
  switch (id) {
    case 'cachecol':
      return (
        <g>
          <path d={`M${100 - w * 0.86} ${y - 6} C${100 - w * 0.4} ${y + 8} ${100 + w * 0.4} ${y + 8} ${100 + w * 0.86} ${y - 6} L${100 + w * 0.88} ${y + 6} C${100 + w * 0.4} ${y + 20} ${100 - w * 0.4} ${y + 20} ${100 - w * 0.88} ${y + 6} Z`} fill="#D1495B" />
          <path d={`M${100 + w * 0.3} ${y + 10} L${100 + w * 0.42} ${y + 42} L${100 + w * 0.22} ${y + 44} L${100 + w * 0.14} ${y + 12} Z`} fill="#B83A4B" />
        </g>
      );
    case 'gravata':
      return (
        <g>
          <path d={`M100 ${y} L86 ${y - 8} L86 ${y + 8} Z`} fill="#3D6FD8" />
          <path d={`M100 ${y} L114 ${y - 8} L114 ${y + 8} Z`} fill="#3D6FD8" />
          <circle cx="100" cy={y} r="4.5" fill="#2F59B3" />
        </g>
      );
    case 'mochila':
      return (
        <g stroke="#E2894B" strokeWidth="5" strokeLinecap="round" fill="none">
          <path d={`M${100 - w * 0.55} ${top + h * 0.3} Q${100 - w * 0.62} ${y} ${100 - w * 0.5} ${y + 22}`} />
          <path d={`M${100 + w * 0.55} ${top + h * 0.3} Q${100 + w * 0.62} ${y} ${100 + w * 0.5} ${y + 22}`} />
        </g>
      );
    case 'medalha':
      return (
        <g>
          <path d={`M88 ${y - 8} L100 ${y + 10} L112 ${y - 8}`} stroke="#3D6FD8" strokeWidth="5" fill="none" />
          <circle cx="100" cy={y + 16} r="9" fill="#F6C445" stroke="#E0A92A" strokeWidth="2" />
        </g>
      );
    default:
      return null;
  }
}
