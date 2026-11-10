import { createContext, useContext, useId } from 'react';
import { furById } from '../data/fur';
import { itemById } from '../data/items';
import { fluffOf } from '../logic/evolution';
import { Accessory, AccessoryBack, Cape, Clothes, CostumeBack, CostumeFront, costumeOf, EffectBack, EffectFront, Glasses, Hat, hidesHeart, sleeveOf } from './Wear';
import type { Outfit, PetMood } from '../types';

const INK = '#2B2224';

/** Tamanho do Hami da pessoa (cresce com os dias de cuidado). O App informa; o padrão é o tamanho máximo. */
export const GrowthContext = createContext(1);
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
  /** Tamanho (0,5 = recém-nascido, 1 = adulto). Sem valor, usa o tamanho atual do Hami da pessoa. */
  growth?: number;
  /** Gesto do bracinho: 'tchau' levanta e acena. */
  pose?: 'tchau';
}

/**
 * O Hami: hamster redondo com uma mancha de coração na barriga (a marca do HamiCare).
 * O peso virtual muda a "fofura" (largura e bochechas); as fases mudam postura e detalhes.
 */
export function Hamster({ fur: furId, grams = 135, phase = 0, mood = 'feliz', outfit = NO_OUTFIT, size = 180, idle = true, label, neutral, wet, shine, growth, pose }: HamsterProps) {
  const fur = furById(furId);
  const current = useContext(GrowthContext);
  const k = Math.min(1, Math.max(0.4, neutral ? 1 : growth ?? current));
  /** Quanto ainda é filhote (0 = adulto, 1 = recém-nascido): olhos maiores e orelhas menores. */
  const young = Math.min(1, Math.max(0, (1 - k) / 0.3));
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const f = fluffOf(neutral ? 135 : grams);
  // Corpo de feijãozinho: mais alto que largo, cabeça e corpo juntinhos. Mais fofo = mais largo e um pouco mais alto.
  const w = 50 + f * 13;
  const h = 124 + phase * 2 + f * 6;
  const top = 180 - h;
  const eyeY = top + h * 0.36;
  const noseY = eyeY + 13;
  const eating = mood === 'comendo';
  const asleep = mood === 'dormindo' || mood === 'sono';
  const body = `M${100 - w} 152 C${100 - w} ${top + 30} ${100 - w * 0.72} ${top} 100 ${top} C${100 + w * 0.72} ${top} ${100 + w} ${top + 30} ${100 + w} 152 C${100 + w} 174 ${100 + w * 0.6} 182 100 182 C${100 - w * 0.6} 182 ${100 - w} 174 ${100 - w} 152 Z`;
  const earR = (15 + (phase >= 1 ? 2 : 0)) * (1 - young * 0.12);
  const pouchR = 5 + f * 6 + (eating ? 10 : 0);
  const geo = { top, w, h, eyeY };
  // Fantasia de corpo inteiro: capuz com orelhinhas no lugar das orelhas e patinhas da cor da fantasia.
  const costume = costumeOf(outfit.roupa);
  const arm = costume ? costume.paw : fur.shade;
  const foot = costume ? costume.foot : fur.ear;
  const holding = !!outfit.acessorio && itemById(outfit.acessorio)?.base === 'segurar';
  const sleeve = costume ? null : sleeveOf(outfit.roupa);

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={label ?? 'Hami'} className="block overflow-visible">
      <defs>
        <clipPath id={`b${uid}`}>
          <path d={body} />
        </clipPath>
        <radialGradient id={`f${uid}`} cx="40%" cy="28%" r="78%">
          <stop offset="0%" stopColor={fur.belly} stopOpacity="0.55" />
          <stop offset="38%" stopColor={fur.body} stopOpacity="0" />
          <stop offset="100%" stopColor={fur.shade} stopOpacity="0.55" />
        </radialGradient>
        <linearGradient id={`c${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000000" stopOpacity="0.16" />
          <stop offset="0.3" stopColor="#000000" stopOpacity="0" />
          <stop offset="0.7" stopColor="#FFFFFF" stopOpacity="0.08" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.16" />
        </linearGradient>
        <radialGradient id={`g${uid}`}>
          <stop offset="0%" stopColor="#FFE07A" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFE07A" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Encolhe a partir dos pés: o filhote fica no chão, no mesmo lugar do adulto. */}
      <g transform={k < 1 ? `translate(100 188) scale(${k}) translate(-100 -188)` : undefined}>
      {phase >= 3 && <circle cx="100" cy={top + h * 0.55} r="92" fill={`url(#g${uid})`} />}
      <EffectBack id={outfit.efeito} geo={geo} uid={uid} />
      <ellipse cx="100" cy="186" rx={w * 0.85} ry="6.5" fill="rgba(0,0,0,0.13)" />
      <g className={idle && !asleep ? 'pet-idle' : asleep ? 'pet-sleep' : undefined}>
        <Cape id={outfit.roupa} geo={geo} />
        <AccessoryBack id={outfit.acessorio} geo={geo} />
        {/* Orelhas (ou o capuz da fantasia) */}
        <CostumeBack id={outfit.roupa} geo={geo} />
        {!costume && [-1, 1].map((s) => (
          <g key={s}>
            <g className={s === 1 ? 'pet-ear' : undefined} style={{ transformOrigin: `${100 + s * w * 0.58}px ${top + 18}px` }}>
              <ellipse cx={100 + s * w * 0.6} cy={top + 10} rx={earR} ry={earR * 0.92} fill={fur.pattern === 'panda' ? fur.patch : fur.body} stroke={fur.shade} strokeOpacity="0.45" strokeWidth="1.4" transform={`rotate(${s * 18} ${100 + s * w * 0.6} ${top + 10})`} />
              <ellipse cx={100 + s * w * 0.6} cy={top + 11} rx={earR * 0.6} ry={earR * 0.55} fill={fur.ear} transform={`rotate(${s * 18} ${100 + s * w * 0.6} ${top + 11})`} />
            </g>
          </g>
        ))}
        {/* Bochechas para fora (crescem com a fofura e quando come) */}
        {!eating && [-1, 1].map((s) => <circle key={s} cx={100 + s * (w - 4)} cy={top + h * 0.47} r={pouchR} fill={costume ? costume.c1 : fur.body} />)}
        {/* tufinhos de pelo nas bochechas */}
        {!costume && [-1, 1].map((s) => {
          const x = 100 + s * (w + pouchR - 6);
          const y = top + h * 0.4;
          return <path key={`t${s}`} d={`M${x - s * 6} ${y} l${s * 9} 4 l${-s * 4} 3 l${s * 8} 5 l${-s * 5} 3 l${s * 6} 6 l${-s * 12} 1 Z`} fill={fur.body} />;
        })}
        {/* rabinho */}
        {!costume && <ellipse className="pet-tail" cx={100 + w * 0.82} cy="168" rx="9" ry="6.5" fill={fur.shade} style={{ transformOrigin: `${100 + w * 0.7}px 168px` }} />}
        <path d={body} fill={fur.body} stroke={fur.shade} strokeOpacity="0.45" strokeWidth="1.6" />
        <g clipPath={`url(#b${uid})`}>
          <path d={`M${100 - w} 150 C${100 - w} 172 ${100 - w * 0.6} 179 100 179 C${100 + w * 0.6} 179 ${100 + w} 172 ${100 + w} 150 C${100 + w * 0.8} 168 ${100 - w * 0.8} 168 ${100 - w} 150 Z`} fill={fur.shade} opacity="0.5" />
          <ellipse cx="100" cy={top + h * 0.75} rx={w * 0.66} ry={h * 0.3} fill={fur.belly} />
          {!costume && (
            <g fill={fur.belly}>
              <ellipse cx="100" cy={eyeY + 25} rx={w * 0.5} ry="15" />
              <ellipse cx={100 - w * 0.42} cy={eyeY + 22} rx="13" ry="11" />
              <ellipse cx={100 + w * 0.42} cy={eyeY + 22} rx="13" ry="11" />
            </g>
          )}
          {/* sombrinha e brilho (volume, como pelúcia) */}
          <path d={body} fill={`url(#f${uid})`} />
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
          {sleeve && <rect x="0" y={top + h * 0.6} width="200" height="100" fill={`url(#c${uid})`} />}
        </g>
        <ellipse cx={100 - w * 0.36} cy={top + 18} rx="13" ry="7" fill="#fff" opacity="0.32" transform={`rotate(-22 ${100 - w * 0.36} ${top + 18})`} />
        {!costume && !outfit.chapeu && (
          <g fill={fur.body} stroke={fur.shade} strokeOpacity="0.5" strokeWidth="1.3" strokeLinejoin="round">
            <path d={`M93 ${top + 4} Q92 ${top - 6} 99 ${top - 9} Q96 ${top - 3} 99 ${top + 3} Z`} />
            <path d={`M99 ${top + 3} Q101 ${top - 9} 108 ${top - 7} Q103 ${top - 3} 106 ${top + 4} Z`} />
          </g>
        )}
        {/* Coração na barriga: a marca do HamiCare */}
        {!hidesHeart(outfit.roupa) && (
          <Heart x={100} y={top + h * 0.84} s={phase >= 3 ? 15 : 11} fill={phase >= 3 ? '#F6C445' : fur.ear} opacity={phase >= 3 ? 1 : 0.5} />
        )}
        {/* Bracinhos e pezinhos (segurando alguma coisa, a patinha direita sobe para a lateral) */}
        {[-1, 1].map((s) => (
          <g key={s}>
            {/* pezinhos com a linha das perninhas */}
            <path d={`M${100 + s * 14} 166 Q${100 + s * 15} 174 ${100 + s * 16} 179`} stroke={fur.shade} strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.55" />
            <ellipse cx={100 + s * 22} cy="181" rx="11.5" ry="6.4" fill={costume ? foot : fur.belly} stroke={fur.shade} strokeOpacity="0.35" strokeWidth="1.2" />
            {!costume && [-4, 0, 4].map((dx) => <circle key={dx} cx={100 + s * 22 + dx} cy="183" r="1.4" fill={fur.ear} opacity="0.8" />)}
            {/* bracinho descansando na barriga */}
            {!(s === 1 && holding) && (
              <g className={s === -1 ? (pose === 'tchau' ? 'pet-wave' : 'pet-arm') : undefined} style={{ transformOrigin: `${100 + s * (w - 5)}px ${top + h * 0.63}px` }}>
                <path d={`M${100 + s * (w - 6)} ${top + h * 0.64} Q${100 + s * (w * 0.7)} ${top + h * 0.75} ${100 + s * w * 0.42} ${top + h * 0.72}`} stroke={sleeve ?? arm} strokeWidth={sleeve ? 11 : 7.5} strokeLinecap="round" fill="none" />
                {sleeve && <path d={`M${100 + s * (w - 6)} ${top + h * 0.64} Q${100 + s * (w * 0.7)} ${top + h * 0.75} ${100 + s * w * 0.42} ${top + h * 0.72}`} stroke="#000000" strokeOpacity="0.1" strokeWidth="11" strokeLinecap="round" fill="none" strokeDasharray="0 18 40" />}
                <ellipse cx={100 + s * w * 0.38} cy={top + h * 0.72} rx="5.6" ry="4.8" fill={sleeve ? fur.body : arm} stroke={sleeve ? fur.shade : 'none'} strokeOpacity="0.5" />
              </g>
            )}
          </g>
        ))}
        {fur.pattern === 'panda' && [-1, 1].map((s) => <ellipse key={s} cx={100 + s * 19} cy={eyeY} rx="11" ry="12" fill={fur.patch} opacity="0.9" />)}
        <Face mood={mood} eyeY={eyeY} noseY={noseY} cheek={fur.ear} whisker={fur.shade} eyeK={1.36 + young * 0.12} />
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
        <CostumeFront id={outfit.roupa} geo={geo} />
        <Accessory id={outfit.acessorio} geo={geo} paw={arm} />
        <Glasses id={outfit.oculos} eyeY={eyeY} />
        <Hat id={outfit.chapeu} geo={geo} />
        {phase >= 3 && <Sparkles top={top} w={w} />}
        <EffectFront id={outfit.efeito} geo={geo} />
      </g>
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

function Face({ mood, eyeY, noseY, cheek, whisker, eyeK = 1 }: { mood: PetMood; eyeY: number; noseY: number; cheek: string; whisker: string; eyeK?: number }) {
  const closed = mood === 'calmo' || mood === 'sono' || mood === 'dormindo';
  const happy = mood === 'animado' || mood === 'comendo' || mood === 'risada';
  const wide = mood === 'surpreso' || mood === 'boca';
  return (
    <g>
      <g transform={eyeK !== 1 ? `translate(100 ${eyeY}) scale(${eyeK}) translate(-100 ${-eyeY})` : undefined}>
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
          {[81, 119].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy={eyeY} rx="6.6" ry="7.8" fill="#2A1A16" />
              <ellipse cx={x} cy={eyeY + 2.8} rx="4.6" ry="3.8" fill="#7A4A36" opacity="0.75" />
              <circle cx={x + 2.4} cy={eyeY - 3.2} r="2.9" fill="#fff" />
              <circle cx={x - 2.4} cy={eyeY + 3.4} r="1.2" fill="#fff" />
            </g>
          ))}
        </g>
      )}
      </g>
      <ellipse cx="68" cy={eyeY + 14} rx="9.5" ry="6" fill={cheek} opacity={mood === 'risada' ? 0.95 : 0.7} />
      <ellipse cx="132" cy={eyeY + 14} rx="9.5" ry="6" fill={cheek} opacity={mood === 'risada' ? 0.95 : 0.7} />
      <path d={`M96.5 ${noseY - 2} L103.5 ${noseY - 2} L100 ${noseY + 2.5} Z`} fill="#F07A93" stroke="#F07A93" strokeWidth="2" strokeLinejoin="round" />
      <g transform={`translate(100 ${noseY + 3}) scale(1.35) translate(-100 ${-(noseY + 3)})`}>
      {mood === 'animado' ? (
        <ellipse cx="100" cy={noseY + 8} rx="4.5" ry="5" fill={INK} />
      ) : mood === 'risada' ? (
        <g>
          <path d={`M91 ${noseY + 4} Q100 ${noseY + 18} 109 ${noseY + 4} Z`} fill="#5A2A2A" />
          <path d={`M95 ${noseY + 10} Q100 ${noseY + 15} 105 ${noseY + 10} Z`} fill="#FF8FA8" />
          <rect x="97" y={noseY + 3.8} width="2.8" height="4" rx="0.9" fill="#FFFFFF" />
          <rect x="100.2" y={noseY + 3.8} width="2.8" height="4" rx="0.9" fill="#FFFFFF" />
        </g>
      ) : mood === 'boca' ? (
        <g>
          <ellipse cx="100" cy={noseY + 10} rx="7" ry="8" fill={INK} />
          <ellipse cx="100" cy={noseY + 13} rx="4" ry="3.5" fill="#FF8FA8" />
        </g>
      ) : mood === 'surpreso' ? (
        <ellipse cx="100" cy={noseY + 8} rx="3" ry="3.6" fill={INK} />
      ) : mood === 'feliz' ? (
        // sorrisinho aberto com os dois dentinhos de hamster
        <g>
          <path d={`M93.5 ${noseY + 4.5} Q100 ${noseY + 16} 106.5 ${noseY + 4.5} Z`} fill="#5A2A2A" />
          <path d={`M96.5 ${noseY + 11.5} Q100 ${noseY + 14.6} 103.5 ${noseY + 11.5} Q100 ${noseY + 9.6} 96.5 ${noseY + 11.5} Z`} fill="#FF8FA8" />
          <rect x="97.1" y={noseY + 4.2} width="2.7" height="3.8" rx="0.9" fill="#FFFFFF" />
          <rect x="100.2" y={noseY + 4.2} width="2.7" height="3.8" rx="0.9" fill="#FFFFFF" />
          <path d={`M93 ${noseY + 4.5} q3.5 2.2 7 0 q3.5 2.2 7 0`} stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" />
        </g>
      ) : (
        <path d={`M93 ${noseY + 4} q3.5 4 7 0 q3.5 4 7 0`} stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      )}
      </g>
      <g stroke={whisker} strokeWidth="1.2" strokeLinecap="round" opacity="0.3">
        <path d={`M84 ${noseY + 2} L68 ${noseY - 1}`} />
        <path d={`M116 ${noseY + 2} L132 ${noseY - 1}`} />
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
