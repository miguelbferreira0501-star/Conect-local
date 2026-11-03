import { useId } from 'react';
import { furById } from '../data/fur';
import { fluffOf } from '../logic/evolution';
import { Accessory, AccessoryBack, Cape, Clothes, EffectBack, EffectFront, Glasses, Hat, hidesHeart } from './Wear';
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
  /** Molhado no banho: pelo escurece e pinga. */
  wet?: boolean;
  /** Brilhando depois de escovar ou do banho. */
  shine?: boolean;
}

/**
 * O Hami: hamster redondo com uma mancha de coração na barriga (a marca do HamiCare).
 * O peso virtual muda a "fofura" (largura e bochechas); as fases mudam postura e detalhes.
 */
export function Hamster({ fur: furId, grams = 135, phase = 0, mood = 'feliz', outfit = NO_OUTFIT, size = 180, idle = true, label, neutral, wet, shine }: HamsterProps) {
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
      <EffectBack id={outfit.efeito} geo={geo} uid={uid} />
      <ellipse cx="100" cy="186" rx={w * 0.85} ry="6.5" fill="rgba(0,0,0,0.13)" />
      <g className={idle && !asleep ? 'pet-idle' : asleep ? 'pet-sleep' : undefined}>
        <Cape id={outfit.roupa} geo={geo} />
        <AccessoryBack id={outfit.acessorio} geo={geo} />
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
        {!hidesHeart(outfit.roupa) && (
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
        {wet && (
          <g>
            <path d={body} fill="#5B8FD6" opacity="0.16" />
            {[
              [-0.5, 0.18], [0.35, 0.1], [0.62, 0.42], [-0.7, 0.5], [0.1, 0.02],
            ].map(([dx, dy], i) => (
              <path key={i} className="drip" style={{ animationDelay: `${i * 0.3}s` }} d={`M${100 + dx * w} ${top + dy * h} q-3.5 6 0 9 q3.5 -3 0 -9 Z`} fill="#8FD0FF" stroke="#5BA9E8" strokeWidth="0.8" />
            ))}
          </g>
        )}
        {shine && (
          <g fill="#FFFFFF">
            <ellipse cx={100 + w * 0.42} cy={top + h * 0.3} rx="7" ry="3.5" opacity="0.55" transform={`rotate(30 ${100 + w * 0.42} ${top + h * 0.3})`} />
            <path className="sparkle" d={`M${100 - w - 2} ${top + 20} l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 Z`} fill="#FFF3A6" />
            <path className="sparkle" style={{ animationDelay: '0.5s' }} d={`M${100 + w + 4} ${top + h * 0.6} l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z`} fill="#FFF3A6" />
          </g>
        )}
        <Accessory id={outfit.acessorio} geo={geo} />
        <Glasses id={outfit.oculos} eyeY={eyeY} />
        <Hat id={outfit.chapeu} geo={geo} />
        {phase >= 3 && <Sparkles top={top} w={w} />}
        <EffectFront id={outfit.efeito} geo={geo} />
      </g>
      {asleep && (
        <text x={100 + w * 0.7} y={top - 2} className="zzz" fontSize="18" fontWeight="800" fill={INK} opacity="0.6">
          z z
        </text>
      )}
    </svg>
  );
}


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
  const happy = mood === 'animado' || mood === 'comendo' || mood === 'risada';
  const wide = mood === 'surpreso' || mood === 'boca';
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
      ) : wide ? (
        <g>
          <ellipse cx="81" cy={eyeY - 1} rx="7.6" ry="9.2" fill={INK} />
          <ellipse cx="119" cy={eyeY - 1} rx="7.6" ry="9.2" fill={INK} />
          <circle cx="84" cy={eyeY - 5} r="3" fill="#fff" />
          <circle cx="122" cy={eyeY - 5} r="3" fill="#fff" />
          <circle cx="79" cy={eyeY + 2} r="1.3" fill="#fff" />
          <circle cx="117" cy={eyeY + 2} r="1.3" fill="#fff" />
        </g>
      ) : (
        <g className="pet-eyes">
          <ellipse cx="81" cy={eyeY} rx="6.2" ry="7.6" fill={INK} />
          <ellipse cx="119" cy={eyeY} rx="6.2" ry="7.6" fill={INK} />
          <circle cx="83.3" cy={eyeY - 3} r="2.3" fill="#fff" />
          <circle cx="121.3" cy={eyeY - 3} r="2.3" fill="#fff" />
        </g>
      )}
      <ellipse cx="67" cy={eyeY + 15} rx="9" ry="5.5" fill={cheek} opacity={mood === 'risada' ? 0.95 : 0.55} />
      <ellipse cx="133" cy={eyeY + 15} rx="9" ry="5.5" fill={cheek} opacity={mood === 'risada' ? 0.95 : 0.55} />
      <path d={`M96.5 ${noseY - 2} L103.5 ${noseY - 2} L100 ${noseY + 2.5} Z`} fill="#F07A93" stroke="#F07A93" strokeWidth="2" strokeLinejoin="round" />
      {mood === 'animado' ? (
        <ellipse cx="100" cy={noseY + 8} rx="4.5" ry="5" fill={INK} />
      ) : mood === 'risada' ? (
        <g>
          <path d={`M91 ${noseY + 4} Q100 ${noseY + 18} 109 ${noseY + 4} Z`} fill={INK} />
          <path d={`M95 ${noseY + 10} Q100 ${noseY + 15} 105 ${noseY + 10} Z`} fill="#FF8FA8" />
        </g>
      ) : mood === 'boca' ? (
        <g>
          <ellipse cx="100" cy={noseY + 10} rx="7" ry="8" fill={INK} />
          <ellipse cx="100" cy={noseY + 13} rx="4" ry="3.5" fill="#FF8FA8" />
        </g>
      ) : mood === 'surpreso' ? (
        <ellipse cx="100" cy={noseY + 8} rx="3" ry="3.6" fill={INK} />
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
