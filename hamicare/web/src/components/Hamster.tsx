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
 * O Hami (desenho da referência): cabeça grande e larga com bochechas fofas, focinho creme, sobrancelhinhas,
 * olhos castanhos enormes e dentinhos; corpo menor embaixo, onde a roupa veste certinho.
 * O peso virtual muda a "fofura" (largura); as fases mudam detalhes.
 */
export function Hamster({ fur: furId, grams = 135, phase = 0, mood = 'feliz', outfit = NO_OUTFIT, size = 180, idle = true, label, neutral, wet, shine, growth, pose }: HamsterProps) {
  const fur = furById(furId);
  const current = useContext(GrowthContext);
  const k = Math.min(1, Math.max(0.4, neutral ? 1 : growth ?? current));
  const young = Math.min(1, Math.max(0, (1 - k) / 0.3));
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const f = fluffOf(neutral ? 135 : grams);
  const eating = mood === 'comendo';
  const asleep = mood === 'dormindo' || mood === 'sono';
  // Cabeça
  const hcx = 100;
  const hcy = 82;
  const hrx = 64 + f * 6 + (eating ? 5 : 0);
  const hry = 52 + f * 2;
  const head = headPath(hcx, hcy, hrx, hry);
  // Corpo (pescoço escondido atrás da cabeça)
  const bw = 42 + f * 10;
  const body = `M${100 - 34} 112 C${100 - bw - 2} 128 ${100 - bw - 5} 160 ${100 - bw + 1} 176 Q100 194 ${100 + bw - 1} 176 C${100 + bw + 5} 160 ${100 + bw + 2} 128 ${100 + 34} 112 Z`;
  const top = hcy - hry;
  const h = 188 - top;
  const w = hrx * 0.86;
  const eyeY = hcy + 2;
  const noseY = eyeY + 15;
  const geo = { top, w, h, eyeY };
  const costume = costumeOf(outfit.roupa);
  const holding = !!outfit.acessorio && itemById(outfit.acessorio)?.base === 'segurar';
  const sleeve = costume ? null : sleeveOf(outfit.roupa);
  const garment = sleeve ?? (outfit.roupa && !costume ? itemById(outfit.roupa)?.c1 ?? null : null);
  const line = darken(fur.shade, 0.18);
  const arm = costume ? costume.paw : fur.body;
  const foot = costume ? costume.foot : fur.body;
  const chin = hcy + hry * 0.9;

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={label ?? 'Hami'} className="block overflow-visible">
      <defs>
        <clipPath id={`b${uid}`}>
          <path d={body} />
          {costume && <path d={head} />}
        </clipPath>
        <clipPath id={`h${uid}`}>
          <path d={head} />
        </clipPath>
        <radialGradient id={`f${uid}`} cx="38%" cy="26%" r="80%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
          <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="100%" stopColor={fur.shade} stopOpacity="0.5" />
        </radialGradient>
        <linearGradient id={`c${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000000" stopOpacity="0.18" />
          <stop offset="0.28" stopColor="#000000" stopOpacity="0" />
          <stop offset="0.68" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.2" />
        </linearGradient>
        <radialGradient id={`e${uid}`} cx="50%" cy="72%" r="60%">
          <stop offset="0%" stopColor="#8A5236" />
          <stop offset="100%" stopColor="#2A140C" />
        </radialGradient>
        <radialGradient id={`g${uid}`}>
          <stop offset="0%" stopColor="#FFE07A" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFE07A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform={k < 1 ? `translate(100 190) scale(${k}) translate(-100 -190)` : undefined}>
        {phase >= 3 && <circle cx="100" cy="110" r="94" fill={`url(#g${uid})`} />}
        <EffectBack id={outfit.efeito} geo={geo} uid={uid} />
        <ellipse cx="100" cy="190" rx={bw * 1.05} ry="6.5" fill="rgba(0,0,0,0.13)" />
        <g className={idle && !asleep ? 'pet-idle' : asleep ? 'pet-sleep' : undefined}>
          <Cape id={outfit.roupa} geo={geo} />
          <AccessoryBack id={outfit.acessorio} geo={geo} />
          {/* rabinho */}
          {!costume && <ellipse className="pet-tail" cx={100 - bw - 2} cy="174" rx="10" ry="7.5" fill={fur.body} stroke={line} strokeWidth="1.8" style={{ transformOrigin: `${100 - bw + 6}px 174px` }} />}
          {/* pezinhos */}
          {[-1, 1].map((s) => (
            <g key={s}>
              <ellipse cx={100 + s * 24} cy="186" rx="15" ry="8" fill={foot} stroke={costume ? 'none' : line} strokeWidth="1.8" />
              {!costume && <path d={`M${100 + s * 24 - 5} 189 v-3 M${100 + s * 24} 190 v-4 M${100 + s * 24 + 5} 189 v-3`} stroke={line} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />}
            </g>
          ))}
          {/* corpo */}
          <path d={body} fill={fur.body} />
          <g clipPath={`url(#b${uid})`}>
            <ellipse cx="100" cy="176" rx={bw * 0.6} ry="22" fill={fur.belly} />
            {fur.pattern === 'manchas' && <ellipse cx={100 + bw * 0.6} cy="150" rx="15" ry="18" fill={fur.patch} opacity="0.85" />}
            {!costume && <path d={body} fill={`url(#f${uid})`} />}
            <Clothes id={outfit.roupa} geo={geo} />
            {garment && <rect x="0" y={chin - 14} width="200" height="100" fill={`url(#c${uid})`} />}
          </g>
          <path d={body} fill="none" stroke={costume ? darken(costume.c1, 0.22) : garment ? darken(garment, 0.28) : line} strokeWidth="2" />
          {/* Coração na barriga: a marca do HamiCare */}
          {!hidesHeart(outfit.roupa) && <Heart x={100} y={164} s={phase >= 3 ? 14 : 11} fill={phase >= 3 ? '#F6C445' : fur.ear} opacity={phase >= 3 ? 1 : 0.6} />}
          {/* bracinhos (com manga, quando a roupa tem) */}
          {[-1, 1].map((s) =>
            s === 1 && holding ? null : (
              <g key={s} className={s === -1 ? (pose === 'tchau' ? 'pet-wave' : 'pet-arm') : undefined} style={{ transformOrigin: `${100 + s * (bw - 6)}px 132px` }}>
                <path d={`M${100 + s * (bw - 4)} 130 Q${100 + s * (bw - 2)} 150 ${100 + s * 18} 152`} stroke={sleeve ?? arm} strokeWidth={sleeve ? 15 : 12} strokeLinecap="round" fill="none" />
                <path d={`M${100 + s * (bw - 4)} 130 Q${100 + s * (bw - 2)} 150 ${100 + s * 18} 152`} stroke={sleeve ? darken(sleeve, 0.28) : line} strokeWidth={sleeve ? 15 : 12} strokeLinecap="round" fill="none" opacity="0.25" strokeDasharray="0.1 100" />
                {sleeve && <ellipse cx={100 + s * 22} cy="152" rx="6" ry="7" fill={darken(sleeve, 0.12)} />}
                <ellipse cx={100 + s * 17} cy="153" rx="7" ry="6" fill={costume ? costume.paw : fur.body} stroke={costume ? 'none' : line} strokeWidth="1.6" />
              </g>
            ),
          )}
          {/* orelhas (ou o capuz da fantasia) */}
          <CostumeBack id={outfit.roupa} geo={geo} />
          {!costume &&
            [-1, 1].map((s) => (
              <g key={s} className={s === 1 ? 'pet-ear' : undefined} style={{ transformOrigin: `${hcx + s * hrx * 0.62}px ${top + 22}px` }}>
                <ellipse cx={hcx + s * hrx * 0.66} cy={top + 6} rx="17" ry="16" fill={fur.pattern === 'panda' ? fur.patch : fur.body} stroke={line} strokeWidth="2" transform={`rotate(${s * 22} ${hcx + s * hrx * 0.66} ${top + 6})`} />
                <ellipse cx={hcx + s * hrx * 0.67} cy={top + 8} rx="10" ry="9.5" fill={fur.ear} transform={`rotate(${s * 22} ${hcx + s * hrx * 0.67} ${top + 8})`} />
              </g>
            ))}
          {/* cabeça */}
          <path d={head} fill={fur.body} />
          <g clipPath={`url(#h${uid})`}>
            {(
              <>
                {/* focinho e bochechas creme */}
                <path d={`M${hcx - hrx - 6} ${hcy + 10} C${hcx - 52} ${hcy - 2} ${hcx - 36} ${hcy + 14} ${hcx - 20} ${hcy + 12} C${hcx - 9} ${hcy + 10} ${hcx - 7} ${hcy - 3} ${hcx} ${hcy - 5} C${hcx + 7} ${hcy - 3} ${hcx + 9} ${hcy + 10} ${hcx + 20} ${hcy + 12} C${hcx + 36} ${hcy + 14} ${hcx + 52} ${hcy - 2} ${hcx + hrx + 6} ${hcy + 10} V200 H${hcx - hrx - 6} Z`} fill={fur.belly} />
                {fur.pattern === 'manchas' && <ellipse cx={hcx - hrx * 0.5} cy={hcy - hry * 0.45} rx="20" ry="15" fill={fur.patch} opacity="0.85" />}
                {phase === 2 && !outfit.chapeu && <rect x="0" y={top + 18} width="200" height="8" fill="#FF6F91" />}
                {!costume && <path d={head} fill={`url(#f${uid})`} />}
              </>
            )}
          </g>
          <path d={head} fill="none" stroke={costume ? darken(costume.c1, 0.22) : line} strokeWidth="2.2" strokeLinejoin="round" />
          {costume && (
            <g clipPath={`url(#h${uid})`}>
              <Clothes id={outfit.roupa} geo={geo} />
            </g>
          )}
          {/* topete */}
          {!costume && !outfit.chapeu && (
            <g fill={fur.body} stroke={line} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
              <path d={`M${hcx - 10} ${top + 6} C${hcx - 14} ${top - 6} ${hcx - 4} ${top - 12} ${hcx + 2} ${top - 8} C${hcx - 4} ${top - 6} ${hcx - 4} ${top + 2} ${hcx - 1} ${top + 6} Z`} />
              <path d={`M${hcx - 2} ${top + 6} C${hcx + 2} ${top - 8} ${hcx + 14} ${top - 10} ${hcx + 16} ${top - 2} C${hcx + 10} ${top - 4} ${hcx + 7} ${top + 1} ${hcx + 8} ${top + 7} Z`} />
            </g>
          )}
          {fur.pattern === 'panda' && [-1, 1].map((s) => <ellipse key={s} cx={hcx + s * 21} cy={eyeY} rx="15" ry="14" fill={fur.patch} opacity="0.9" transform={`rotate(${s * -18} ${hcx + s * 21} ${eyeY})`} />)}
          <Face mood={mood} eyeY={eyeY} noseY={noseY} cheek={fur.ear} brow={line} eyeK={1 + young * 0.12} uid={uid} />
          {wet && (
            <g>
              <path d={head} fill="#5B8FD6" opacity="0.16" />
              <path d={body} fill="#5B8FD6" opacity="0.16" />
              {[[-0.5, 0.1], [0.35, 0.05], [0.62, 0.42], [-0.7, 0.5], [0.1, 0.0]].map(([dx, dy], i) => (
                <path key={i} className="drip" style={{ animationDelay: `${i * 0.3}s` }} d={`M${100 + dx * hrx} ${top + 10 + dy * h} q-3.5 6 0 9 q3.5 -3 0 -9 Z`} fill="#8FD0FF" stroke="#5BA9E8" strokeWidth="0.8" />
              ))}
            </g>
          )}
          {shine && (
            <g fill="#FFFFFF">
              <ellipse cx={hcx + hrx * 0.42} cy={hcy - hry * 0.5} rx="8" ry="4" opacity="0.55" transform={`rotate(30 ${hcx + hrx * 0.42} ${hcy - hry * 0.5})`} />
              <path className="sparkle" d={`M${100 - hrx - 2} ${top + 30} l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 Z`} fill="#FFF3A6" />
              <path className="sparkle" style={{ animationDelay: '0.5s' }} d={`M${100 + hrx + 4} ${top + 70} l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z`} fill="#FFF3A6" />
            </g>
          )}
          <CostumeFront id={outfit.roupa} geo={geo} />
          <Accessory id={outfit.acessorio} geo={{ ...geo, top: chin - 36, h: 64, w: bw }} paw={arm} />
          <Glasses id={outfit.oculos} eyeY={eyeY} />
          <Hat id={outfit.chapeu} geo={geo} />
          {phase >= 3 && <Sparkles top={top} w={hrx} />}
          <EffectFront id={outfit.efeito} geo={geo} />
        </g>
      </g>
      {asleep && (
        <text x={100 + hrx * 0.8} y={top} className="zzz" fontSize="18" fontWeight="800" fill={INK} opacity="0.6">
          z z
        </text>
      )}
    </svg>
  );
}

/** Cabeça larga, mais cheinha embaixo, com a borda das bochechas em tufinhos de pelo. */
function headPath(cx: number, cy: number, rx: number, ry: number) {
  const pts: string[] = [];
  const n = 72;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const c = Math.cos(t);
    const sn = Math.sin(t);
    // mais larga embaixo (bochechas), topo arredondado
    const wide = sn > 0 ? 1 + 0.06 * sn : 1 - 0.04 * -sn;
    let r = 1;
    // tufinhos nas bochechas (lados, metade de baixo)
    if (sn > -0.1 && Math.abs(c) > 0.55) r += i % 2 ? 0.035 : -0.01;
    const x = cx + rx * c * wide * r;
    const y = cy + ry * sn * (sn > 0 ? 0.9 : 1) * (sn > 0 ? r : 1);
    pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
}

function darken(hex: string, t: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const ch = (v: number) => Math.round(v * (1 - t)).toString(16).padStart(2, '0');
  return `#${ch(n >> 16)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
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

function Face({ mood, eyeY, noseY, cheek, brow, eyeK = 1, uid }: { mood: PetMood; eyeY: number; noseY: number; cheek: string; brow: string; eyeK?: number; uid: string }) {
  const closed = mood === 'calmo' || mood === 'sono' || mood === 'dormindo';
  const happy = mood === 'animado' || mood === 'comendo' || mood === 'risada';
  const wide = mood === 'surpreso' || mood === 'boca';
  const ex = 22;
  return (
    <g>
      {/* sobrancelhinhas */}
      {[-1, 1].map((s) => (
        <path key={s} d={`M${100 + s * (ex + 5)} ${eyeY - 21} q${-s * 4} -2.6 ${-s * 8} 0.6`} stroke={brow} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.75" />
      ))}
      <g transform={eyeK !== 1 ? `translate(100 ${eyeY}) scale(${eyeK}) translate(-100 ${-eyeY})` : undefined}>
        {closed ? (
          <g stroke="#3A2016" strokeWidth="3.4" strokeLinecap="round" fill="none">
            <path d={`M${100 - ex - 8} ${eyeY} Q${100 - ex} ${eyeY + 5} ${100 - ex + 8} ${eyeY}`} />
            <path d={`M${100 + ex - 8} ${eyeY} Q${100 + ex} ${eyeY + 5} ${100 + ex + 8} ${eyeY}`} />
          </g>
        ) : happy ? (
          <g stroke="#3A2016" strokeWidth="3.6" strokeLinecap="round" fill="none">
            <path d={`M${100 - ex - 8} ${eyeY + 3} Q${100 - ex} ${eyeY - 7} ${100 - ex + 8} ${eyeY + 3}`} />
            <path d={`M${100 + ex - 8} ${eyeY + 3} Q${100 + ex} ${eyeY - 7} ${100 + ex + 8} ${eyeY + 3}`} />
          </g>
        ) : (
          <g className="pet-eyes">
            {[-1, 1].map((s) => {
              const x = 100 + s * ex;
              const r = wide ? 1.12 : 1;
              return (
                <g key={s}>
                  <ellipse cx={x} cy={eyeY} rx={10.5 * r} ry={11.5 * r} fill={`url(#e${uid})`} />
                  <ellipse cx={x} cy={eyeY} rx={10.5 * r} ry={11.5 * r} fill="none" stroke="#2A140C" strokeWidth="1.2" />
                  <circle cx={x + 3.6} cy={eyeY - 4.2} r={4.2 * r} fill="#FFFFFF" />
                  <circle cx={x - 3.8} cy={eyeY + 4.6} r={1.8 * r} fill="#FFFFFF" opacity="0.9" />
                </g>
              );
            })}
          </g>
        )}
      </g>
      {/* bochechas rosadas */}
      <ellipse cx={100 - 41} cy={eyeY + 15} rx="12" ry="8" fill={cheek} opacity={mood === 'risada' ? 0.95 : 0.72} />
      <ellipse cx={100 + 41} cy={eyeY + 15} rx="12" ry="8" fill={cheek} opacity={mood === 'risada' ? 0.95 : 0.72} />
      {/* narizinho */}
      <path d={`M95.5 ${noseY - 4} Q100 ${noseY - 6} 104.5 ${noseY - 4} Q103 ${noseY + 1} 100 ${noseY + 1.5} Q97 ${noseY + 1} 95.5 ${noseY - 4} Z`} fill="#F08A9A" stroke="#D86D7E" strokeWidth="1" />
      {mood === 'feliz' || mood === 'animado' || mood === 'risada' ? (
        <g>
          <path d={`M${mood === 'risada' ? 86 : 88} ${noseY + 4} C${mood === 'risada' ? 87 : 89} ${noseY + 24} ${mood === 'risada' ? 113 : 111} ${noseY + 24} ${mood === 'risada' ? 114 : 112} ${noseY + 4} Q100 ${noseY + 7} ${mood === 'risada' ? 86 : 88} ${noseY + 4} Z`} fill="#C8404C" stroke="#8E2A34" strokeWidth="1.3" strokeLinejoin="round" />
          <path d={`M91.5 ${noseY + 17} C94 ${noseY + 22} 106 ${noseY + 22} 108.5 ${noseY + 17} C106 ${noseY + 12} 94 ${noseY + 12} 91.5 ${noseY + 17} Z`} fill="#FF8FA3" />
          <rect x="95.6" y={noseY + 5.2} width="4.2" height="6" rx="1.2" fill="#FFFFFF" stroke="#E8D8D8" strokeWidth="0.6" />
          <rect x="100.2" y={noseY + 5.2} width="4.2" height="6" rx="1.2" fill="#FFFFFF" stroke="#E8D8D8" strokeWidth="0.6" />
          <path d={`M100 ${noseY + 1.5} V${noseY + 5}`} stroke="#8E2A34" strokeWidth="1.2" />
        </g>
      ) : mood === 'boca' ? (
        <g>
          <ellipse cx="100" cy={noseY + 12} rx="8" ry="9" fill="#C8404C" />
          <ellipse cx="100" cy={noseY + 15} rx="5" ry="4" fill="#FF8FA3" />
        </g>
      ) : mood === 'surpreso' ? (
        <ellipse cx="100" cy={noseY + 10} rx="4" ry="5" fill="#C8404C" />
      ) : mood === 'comendo' ? (
        <path d={`M93 ${noseY + 6} q3.5 4 7 0 q3.5 4 7 0`} stroke="#5A2A2A" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      ) : (
        <path d={`M93 ${noseY + 5} q3.5 3.6 7 0 q3.5 3.6 7 0`} stroke="#5A2A2A" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      )}
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
