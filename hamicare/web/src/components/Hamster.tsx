import { createContext, useContext, useId } from 'react';
import { furById } from '../data/fur';
import { itemById } from '../data/items';
import { fluffOf } from '../logic/evolution';
import { Accessory, AccessoryBack, Cape, Clothes, CostumeBack, CostumeFront, costumeOf, EffectBack, EffectFront, garmentColor, garmentShape, Glasses, Hat, hidesHeart, sleeveOf } from './Wear';
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
  // Cabeça grande (a referência: mais larga nas bochechas, olhos baixos e afastados)
  const hcx = 100;
  const hcy = 76;
  const hrx = 60 + f * 6 + (eating ? 5 : 0);
  const hry = 51 + f * 2;
  const head = headPath(hcx, hcy, hrx, hry);
  // Corpo em formato de pera (o pescoço fica escondido atrás da cabeça)
  const bw = 45 + f * 10;
  const body = `M${100 - 30} 104 C${100 - bw + 4} 114 ${100 - bw - 4} 146 ${100 - bw} 168 C${100 - bw + 3} 183 ${100 - bw * 0.5} 189 100 189 C${100 + bw * 0.5} 189 ${100 + bw - 3} 183 ${100 + bw} 168 C${100 + bw + 4} 146 ${100 + bw - 4} 114 ${100 + 30} 104 Z`;
  const top = hcy - hry;
  const h = 188 - top;
  const w = hrx * 0.86;
  const eyeY = hcy + 9;
  const ex = Math.round(hrx * 0.45);
  const noseY = eyeY + 7;
  const geo = { top, w, h, eyeY };
  const costume = costumeOf(outfit.roupa);
  const holding = !!outfit.acessorio && itemById(outfit.acessorio)?.base === 'segurar';
  const sleeve = costume ? null : sleeveOf(outfit.roupa);
  const garment = costume ? null : garmentShape(outfit.roupa) ? garmentColor(outfit.roupa) : sleeve ?? (outfit.roupa ? itemById(outfit.roupa)?.c1 ?? null : null);
  // contorno suave, num tom quente do próprio pelo (a referência quase não tem linha escura)
  const line = darken(fur.shade, 0.12);
  const arm = costume ? costume.paw : fur.body;
  const foot = costume ? costume.foot : fur.body;
  const chin = hcy + hry * 0.9;
  // A peça veste por cima: um pouco mais larga que o corpo (tecido fofinho) e termina antes das perninhas.
  const shape = costume ? null : garmentShape(outfit.roupa);
  const hem = shape === 'dress' ? 185 : 177;
  const cw = bw + 4;
  const cloth =
    shape === 'dress'
      ? `M${100 - 32} 104 C${100 - cw + 3} 112 ${100 - cw - 2} 134 ${100 - cw + 1} 148 C${100 - cw - 5} 162 ${100 - cw - 11} 176 ${100 - cw - 10} ${hem} Q100 ${hem + 7} ${100 + cw + 10} ${hem} C${100 + cw + 11} 176 ${100 + cw + 5} 162 ${100 + cw - 1} 148 C${100 + cw + 2} 134 ${100 + cw - 3} 112 ${100 + 32} 104 Z`
      : `M${100 - 32} 104 C${100 - cw + 3} 113 ${100 - cw - 4} 146 ${100 - cw} 166 Q${100 - cw + 1} ${hem} ${100 - cw + 9} ${hem} Q100 ${hem + 4} ${100 + cw - 9} ${hem} Q${100 + cw - 1} ${hem} ${100 + cw} 166 C${100 + cw + 4} 146 ${100 + cw - 3} 113 ${100 + 32} 104 Z`;
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={label ?? 'Hami'} className="block overflow-visible">
      <defs>
        <clipPath id={`b${uid}`}>
          <path d={body} />
          {costume && <path d={head} />}
        </clipPath>
        <clipPath id={`k${uid}`}>
          <path d={cloth} />
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
          {!costume && <ellipse className="pet-tail" cx={100 - bw + 2} cy="176" rx="9" ry="7" fill={fur.body} stroke={line} strokeWidth="1.6" style={{ transformOrigin: `${100 - bw + 10}px 176px` }} />}
          {/* pezinhos (aparecem embaixo do corpo) */}
          {[-1, 1].map((s) => (
            <g key={s}>
              <ellipse cx={100 + s * 22} cy="187" rx="13.5" ry="7.5" fill={foot} stroke={costume ? 'none' : line} strokeWidth="1.6" />
              {!costume && <ellipse cx={100 + s * 22} cy="188.5" rx="8" ry="3.6" fill={fur.belly} opacity="0.75" />}
              {!costume && <path d={`M${100 + s * 22 - 4.5} 192 v-2.6 M${100 + s * 22} 192.6 v-3 M${100 + s * 22 + 4.5} 192 v-2.6`} stroke={line} strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />}
            </g>
          ))}
          {/* corpo */}
          <path d={body} fill={fur.body} />
          <g clipPath={`url(#b${uid})`}>
            <ellipse cx="100" cy="178" rx={bw * 0.62} ry="26" fill={fur.belly} />
            {fur.pattern === 'manchas' && <ellipse cx={100 + bw * 0.6} cy="150" rx="15" ry="18" fill={fur.patch} opacity="0.85" />}
            {!costume && <path d={body} fill={`url(#f${uid})`} />}
            {!shape && <Clothes id={outfit.roupa} geo={geo} />}
            {garment && !shape && <rect x="0" y={chin - 14} width="200" height="100" fill={`url(#c${uid})`} />}
            {/* sombrinha da cabeça no corpo */}
            <ellipse cx="100" cy={chin + 3} rx={hrx * 0.7} ry="9" fill="#000000" opacity="0.08" />
          </g>
          <path d={body} fill="none" stroke={costume ? darken(costume.c1, 0.22) : garment && !shape ? darken(garment, 0.22) : line} strokeWidth="1.8" />
          {shape && garment && (
            <g>
              <path d={cloth} fill={garment} />
              <g clipPath={`url(#k${uid})`}>
                <Clothes id={outfit.roupa} geo={geo} />
                <rect x="0" y={chin - 14} width="200" height="100" fill={`url(#c${uid})`} />
                {/* sombra da cabeça no tecido e brilho de tecido no ombro */}
                <ellipse cx="100" cy={chin + 3} rx={hrx * 0.72} ry="10" fill="#000000" opacity="0.12" />
                <path d={`M${100 - cw + 6} 150 Q${100 - cw + 3} 160 ${100 - cw + 7} ${hem - 6}`} stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.18" />
                {/* costura da barra */}
                <path d={shape === 'dress' ? `M${100 - cw - 8} ${hem - 4} Q100 ${hem + 3} ${100 + cw + 8} ${hem - 4}` : `M${100 - cw + 6} ${hem - 4} Q100 ${hem} ${100 + cw - 6} ${hem - 4}`} stroke={darken(garment, 0.3)} strokeWidth="1.1" strokeDasharray="2.6 2.2" fill="none" opacity="0.5" />
              </g>
              <path d={cloth} fill="none" stroke={darken(garment, 0.25)} strokeWidth="1.8" strokeLinejoin="round" />
            </g>
          )}
          {/* Coração na barriga: a marca do HamiCare */}
          {!hidesHeart(outfit.roupa) && <Heart x={100} y={170} s={phase >= 3 ? 13 : 10} fill={phase >= 3 ? '#F6C445' : fur.ear} opacity={phase >= 3 ? 1 : 0.6} />}
          {/* bracinhos fofos: descem do ombro e as patinhas se encontram na barriga (com manga, quando a roupa tem) */}
          {[-1, 1].map((s) => {
            if (s === 1 && holding) return null;
            const fill = sleeve ?? arm;
            const edge = sleeve ? darken(sleeve, 0.3) : costume ? darken(costume.c1, 0.22) : line;
            const d = sleeve
              ? `M${100 + s * (bw - 12)} 120 C${100 + s * (bw + 3)} 128 ${100 + s * (bw + 1)} 146 ${100 + s * (bw - 10)} 151 C${100 + s * (bw - 18)} 154 ${100 + s * 26} 153 ${100 + s * 19} 151`
              : `M${100 + s * (bw - 11)} 138 C${100 + s * (bw - 7)} 145 ${100 + s * (bw - 12)} 151 ${100 + s * (bw - 18)} 151.5 C${100 + s * (bw - 22)} 152 ${100 + s * 24} 152 ${100 + s * 19} 151`;
            return (
              <g key={s} className={s === -1 ? (pose === 'tchau' ? 'pet-wave' : 'pet-arm') : undefined} style={{ transformOrigin: `${100 + s * (bw - 10)}px 122px` }}>
                {sleeve || costume ? (
                  <>
                    <path d={d} stroke={edge} strokeWidth={sleeve ? 19.5 : 15.5} strokeLinecap="round" fill="none" />
                    <path d={d} stroke={fill} strokeWidth={sleeve ? 16.5 : 12.5} strokeLinecap="round" fill="none" />
                  </>
                ) : (
                  // sem roupa: só a dobrinha do bracinho e as patinhas na barriga
                  <path d={`M${100 + s * (bw - 4)} 132 C${100 + s * (bw - 3)} 142 ${100 + s * (bw - 10)} 149 ${100 + s * 22} 150`} stroke={line} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.55" />
                )}
                {sleeve && <path d={`M${100 + s * (bw - 16)} 132 C${100 + s * (bw - 10)} 140 ${100 + s * (bw - 12)} 145 ${100 + s * (bw - 20)} 146`} stroke={darken(sleeve, 0.2)} strokeOpacity="0.45" strokeWidth="2.2" strokeLinecap="round" fill="none" />}
                {sleeve && <path d={`M${100 + s * (bw - 3)} 128 C${100 + s * (bw + 1)} 136 ${100 + s * (bw)} 144 ${100 + s * (bw - 6)} 148`} stroke="#FFFFFF" strokeOpacity="0.22" strokeWidth="3" strokeLinecap="round" fill="none" />}
                {sleeve && <ellipse cx={100 + s * 23} cy="151" rx="5.5" ry="7.6" fill={darken(sleeve, 0.1)} />}
                <ellipse cx={100 + s * 16} cy="151.5" rx="7.2" ry="6.4" fill={costume ? costume.paw : fur.body} stroke={edge} strokeWidth="1.5" />
                {!costume && <path d={`M${100 + s * 13} 154.5 v-2 M${100 + s * 16.5} 155.4 v-2.2`} stroke={line} strokeWidth="1.1" strokeLinecap="round" opacity="0.5" />}
              </g>
            );
          })}
          {/* orelhas (ou o capuz da fantasia) */}
          <CostumeBack id={outfit.roupa} geo={geo} />
          {!costume &&
            [-1, 1].map((s) => {
              const ex0 = hcx + s * hrx * 0.74;
              const ey0 = hcy - hry * 0.8;
              return (
                <g key={s} className={s === 1 ? 'pet-ear' : undefined} style={{ transformOrigin: `${ex0}px ${ey0 + 14}px` }}>
                  <ellipse cx={ex0} cy={ey0} rx="16" ry="15" fill={fur.pattern === 'panda' ? fur.patch : fur.body} stroke={line} strokeWidth="1.8" transform={`rotate(${s * 28} ${ex0} ${ey0})`} />
                  <ellipse cx={ex0 - s * 0.5} cy={ey0 + 1.5} rx="9.5" ry="9" fill={fur.ear} transform={`rotate(${s * 28} ${ex0} ${ey0})`} />
                  <ellipse cx={ex0 - s * 2} cy={ey0 - 2} rx="3.2" ry="2.4" fill="#FFFFFF" opacity="0.35" transform={`rotate(${s * 28} ${ex0} ${ey0})`} />
                </g>
              );
            })}
          {/* cabeça */}
          <path d={head} fill={fur.body} />
          <g clipPath={`url(#h${uid})`}>
            {/* focinho e bochechas creme: sobem arredondados entre os olhos, como na referência */}
            <path
              d={`M${hcx - hrx - 12} ${hcy + hry * 0.36} C${hcx - hrx * 0.78} ${hcy + hry * 0.16} ${hcx - ex - 13} ${eyeY + 15} ${hcx - ex} ${eyeY + 14} C${hcx - ex + 11} ${eyeY + 13} ${hcx - 11} ${eyeY - 3} ${hcx} ${eyeY - 4} C${hcx + 11} ${eyeY - 3} ${hcx + ex - 11} ${eyeY + 13} ${hcx + ex} ${eyeY + 14} C${hcx + ex + 13} ${eyeY + 15} ${hcx + hrx * 0.78} ${hcy + hry * 0.16} ${hcx + hrx + 12} ${hcy + hry * 0.36} V200 H${hcx - hrx - 12} Z`}
              fill={fur.belly}
            />
            {fur.pattern === 'manchas' && <ellipse cx={hcx - hrx * 0.5} cy={hcy - hry * 0.45} rx="20" ry="15" fill={fur.patch} opacity="0.85" />}
            {phase === 2 && !outfit.chapeu && <rect x="0" y={top + 16} width="200" height="8" fill="#FF6F91" />}
            {!costume && <path d={head} fill={`url(#f${uid})`} />}
            {/* brilho do pelo no alto da cabeça */}
            {!costume && <ellipse cx={hcx - hrx * 0.28} cy={top + 15} rx={hrx * 0.3} ry="7" fill="#FFFFFF" opacity="0.22" transform={`rotate(-12 ${hcx - hrx * 0.28} ${top + 15})`} />}
          </g>
          <path d={head} fill="none" stroke={costume ? darken(costume.c1, 0.22) : line} strokeWidth="1.9" strokeLinejoin="round" />
          {costume && (
            <g clipPath={`url(#h${uid})`}>
              <Clothes id={outfit.roupa} geo={geo} />
            </g>
          )}
          {/* topete: três mechinhas macias */}
          {!costume && !outfit.chapeu && (
            <g fill={fur.body} stroke={line} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round">
              <path d={`M${hcx - 16} ${top + 7} C${hcx - 20} ${top - 2} ${hcx - 13} ${top - 7} ${hcx - 6} ${top - 5} C${hcx - 11} ${top - 2} ${hcx - 10} ${top + 3} ${hcx - 7} ${top + 7}`} />
              <path d={`M${hcx - 8} ${top + 7} C${hcx - 9} ${top - 6} ${hcx + 2} ${top - 12} ${hcx + 9} ${top - 8} C${hcx + 3} ${top - 6} ${hcx + 1} ${top} ${hcx + 3} ${top + 7}`} />
              <path d={`M${hcx + 2} ${top + 7} C${hcx + 5} ${top - 2} ${hcx + 14} ${top - 4} ${hcx + 18} ${top + 1} C${hcx + 13} ${top + 1} ${hcx + 11} ${top + 4} ${hcx + 12} ${top + 8}`} />
              <path d={`M${hcx - 17} ${top + 8.5} Q${hcx} ${top + 4} ${hcx + 13} ${top + 9}`} stroke={fur.body} strokeWidth="4" fill="none" />
            </g>
          )}
          {fur.pattern === 'panda' && [-1, 1].map((s) => <ellipse key={s} cx={hcx + s * ex} cy={eyeY} rx="15" ry="14" fill={fur.patch} opacity="0.9" transform={`rotate(${s * -18} ${hcx + s * ex} ${eyeY})`} />)}
          <Face mood={mood} eyeY={eyeY} noseY={noseY} ex={ex} cheekX={Math.round(hrx * 0.58)} cheek={fur.ear} brow={darken(fur.shade, 0.2)} eyeK={1 + young * 0.12} uid={uid} />
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
          <Accessory id={outfit.acessorio} geo={{ ...geo, top: chin - 36, h: 64, w: bw }} paw={arm} head={{ cx: hcx, cy: hcy, rx: hrx, ry: hry }} />
          <Glasses id={outfit.oculos} eyeY={eyeY} ex={ex} />
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

/** Cabeça de pãozinho: topo arredondado, mais larga nas bochechas, com três tufinhos macios de cada lado. */
function headPath(cx: number, cy: number, rx: number, ry: number) {
  const T = cy - ry;
  const B = cy + ry;
  const side = (s: 1 | -1) => {
    const X = (k: number) => (cx + s * rx * k).toFixed(1);
    const Y = (k: number) => (cy + ry * k).toFixed(1);
    // do topo até o começo das bochechas
    let d = `C${X(0.6)} ${T.toFixed(1)} ${X(0.98)} ${Y(-0.66)} ${X(1)} ${Y(0.02)}`;
    // tufinhos de pelo nas bochechas (pontinhas para fora e um pouco para baixo)
    d += ` Q${X(1.03)} ${Y(0.12)} ${X(1.09)} ${Y(0.2)} Q${X(1.02)} ${Y(0.24)} ${X(1.02)} ${Y(0.3)}`;
    d += ` Q${X(1.06)} ${Y(0.38)} ${X(1.1)} ${Y(0.47)} Q${X(1.02)} ${Y(0.5)} ${X(1)} ${Y(0.56)}`;
    d += ` Q${X(1.02)} ${Y(0.64)} ${X(1.05)} ${Y(0.72)} Q${X(0.96)} ${Y(0.73)} ${X(0.92)} ${Y(0.74)}`;
    // queixo arredondado
    d += ` C${X(0.8)} ${Y(0.95)} ${X(0.5)} ${B.toFixed(1)} ${cx.toFixed(1)} ${B.toFixed(1)}`;
    return d;
  };
  // lado direito (topo → queixo) e lado esquerdo espelhado (queixo → topo)
  const right = side(1);
  const leftPts = side(-1);
  // o lado esquerdo precisa ser percorrido ao contrário: refazemos na ordem inversa
  const rev = reversePath(`M${cx} ${T} ${leftPts}`);
  return `M${cx} ${T} ${right} ${rev} Z`;
}

/** Inverte um caminho feito só de comandos C e Q absolutos (começando em M). */
function reversePath(d: string) {
  const tokens = d.match(/[MCQ]|-?\d+(?:\.\d+)?/g) ?? [];
  const segs: { cmd: string; pts: number[][] }[] = [];
  let cur: number[] = [];
  let i = 0;
  while (i < tokens.length) {
    const cmd = tokens[i++];
    const n = cmd === 'M' ? 1 : cmd === 'Q' ? 2 : 3;
    const pts: number[][] = [];
    for (let j = 0; j < n; j++) pts.push([Number(tokens[i++]), Number(tokens[i++])]);
    if (cmd === 'M') cur = pts[0];
    else {
      segs.push({ cmd, pts: [cur, ...pts] });
      cur = pts[pts.length - 1];
    }
  }
  return segs
    .reverse()
    .map(({ cmd, pts }) => {
      const r = [...pts].reverse().slice(1);
      return `${cmd}${r.map((p) => `${p[0]} ${p[1]}`).join(' ')}`;
    })
    .join(' ');
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

function Face({ mood, eyeY, noseY, ex, cheekX, cheek, brow, eyeK = 1, uid }: { mood: PetMood; eyeY: number; noseY: number; ex: number; cheekX: number; cheek: string; brow: string; eyeK?: number; uid: string }) {
  const closed = mood === 'calmo' || mood === 'sono' || mood === 'dormindo';
  const happy = mood === 'animado' || mood === 'comendo' || mood === 'risada';
  const wide = mood === 'surpreso' || mood === 'boca';
  const n = noseY;
  const smile = mood === 'feliz' || mood === 'animado' || mood === 'risada';
  const big = mood === 'risada' ? 1.3 : mood === 'animado' ? 1.2 : 1.12;
  return (
    <g>
      {/* sobrancelhinhas */}
      {[-1, 1].map((s) => (
        <path key={s} d={`M${100 + s * (ex + 6)} ${eyeY - 17} q${-s * 4.5} -3.4 ${-s * 9.5} -0.4`} stroke={brow} strokeWidth="3.2" strokeLinecap="round" fill="none" opacity="0.7" />
      ))}
      <g transform={eyeK !== 1 ? `translate(100 ${eyeY}) scale(${eyeK}) translate(-100 ${-eyeY})` : undefined}>
        {closed ? (
          <g stroke="#3A2016" strokeWidth="3.2" strokeLinecap="round" fill="none">
            {[-1, 1].map((s) => (
              <path key={s} d={`M${100 + s * ex - 8} ${eyeY} Q${100 + s * ex} ${eyeY + 5.5} ${100 + s * ex + 8} ${eyeY}`} />
            ))}
          </g>
        ) : happy ? (
          <g stroke="#3A2016" strokeWidth="3.4" strokeLinecap="round" fill="none">
            {[-1, 1].map((s) => (
              <path key={s} d={`M${100 + s * ex - 8} ${eyeY + 3} Q${100 + s * ex} ${eyeY - 7.5} ${100 + s * ex + 8} ${eyeY + 3}`} />
            ))}
          </g>
        ) : (
          <g className="pet-eyes">
            {[-1, 1].map((s) => {
              const x = 100 + s * ex;
              const r = wide ? 1.1 : 1;
              return (
                <g key={s}>
                  <ellipse cx={x} cy={eyeY} rx={11 * r} ry={12 * r} fill={`url(#e${uid})`} />
                  <ellipse cx={x} cy={eyeY} rx={11 * r} ry={12 * r} fill="none" stroke="#24110A" strokeWidth="1.1" />
                  {/* reflexo grande em cima, pontinho embaixo e um brilho suave na íris */}
                  <circle cx={x + 3.8} cy={eyeY - 4.4} r={4.4 * r} fill="#FFFFFF" />
                  <circle cx={x - 4.2} cy={eyeY + 4.8} r={1.9 * r} fill="#FFFFFF" opacity="0.9" />
                  <path d={`M${x - 7} ${eyeY + 5} Q${x} ${eyeY + 11} ${x + 7} ${eyeY + 5}`} stroke="#B87A52" strokeWidth="1.6" fill="none" opacity="0.45" strokeLinecap="round" />
                </g>
              );
            })}
          </g>
        )}
      </g>
      {/* bochechas rosadas */}
      {[-1, 1].map((s) => (
        <ellipse key={s} cx={100 + s * cheekX} cy={eyeY + 16} rx="11.5" ry="7.2" fill={cheek} opacity={mood === 'risada' ? 0.9 : 0.62} />
      ))}
      {/* narizinho */}
      <path d={`M95.8 ${n - 3.2} Q100 ${n - 5.4} 104.2 ${n - 3.2} Q103.4 ${n + 0.6} 100 ${n + 1.6} Q96.6 ${n + 0.6} 95.8 ${n - 3.2} Z`} fill="#F28C9A" stroke="#D96C7D" strokeWidth="0.9" />
      <ellipse cx="98.6" cy={n - 2.8} rx="1.4" ry="0.8" fill="#FFFFFF" opacity="0.7" />
      {smile ? (
        // boca aberta: lábio em "w" saindo do nariz, dois dentinhos e a linguinha
        <g transform={`translate(100 ${n}) scale(${big}) translate(-100 ${-n})`}>
          <path d={`M89.5 ${n + 4.6} Q94.8 ${n + 9} 100 ${n + 5} Q105.2 ${n + 9} 110.5 ${n + 4.6} C110 ${n + 18.5} 90 ${n + 18.5} 89.5 ${n + 4.6} Z`} fill="#C23B49" />
          <path d={`M92.6 ${n + 14} Q100 ${n + 9.4} 107.4 ${n + 14} Q104.6 ${n + 17.6} 100 ${n + 17.6} Q95.4 ${n + 17.6} 92.6 ${n + 14} Z`} fill="#FF8A9B" />
          <path d={`M96 ${n + 6.2} L99.6 ${n + 5.6} L99.6 ${n + 11} Q99.6 ${n + 11.8} 98.8 ${n + 11.8} L96.8 ${n + 11.8} Q96 ${n + 11.8} 96 ${n + 11} Z`} fill="#FFFFFF" />
          <path d={`M104 ${n + 6.2} L100.4 ${n + 5.6} L100.4 ${n + 11} Q100.4 ${n + 11.8} 101.2 ${n + 11.8} L103.2 ${n + 11.8} Q104 ${n + 11.8} 104 ${n + 11} Z`} fill="#FFFFFF" />
          <path d={`M89.5 ${n + 4.6} Q94.8 ${n + 9} 100 ${n + 5} Q105.2 ${n + 9} 110.5 ${n + 4.6} C110 ${n + 18.5} 90 ${n + 18.5} 89.5 ${n + 4.6} Z`} fill="none" stroke="#7E2630" strokeWidth="1.5" strokeLinejoin="round" />
          <path d={`M100 ${n + 1.6} V${n + 5}`} stroke="#7E2630" strokeWidth="1.4" strokeLinecap="round" />
          <path d={`M89.5 ${n + 4.6} q-2.2 -0.4 -3.2 -2.4 M110.5 ${n + 4.6} q2.2 -0.4 3.2 -2.4`} stroke="#7E2630" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </g>
      ) : mood === 'boca' ? (
        <g>
          <path d={`M100 ${n + 1.6} V${n + 4}`} stroke="#7E2630" strokeWidth="1.4" strokeLinecap="round" />
          <ellipse cx="100" cy={n + 11} rx="7" ry="8" fill="#C23B49" stroke="#7E2630" strokeWidth="1.4" />
          <ellipse cx="100" cy={n + 14.5} rx="4.4" ry="3.2" fill="#FF8A9B" />
          <rect x="97.2" y={n + 3.6} width="5.6" height="4" rx="1" fill="#FFFFFF" />
        </g>
      ) : mood === 'surpreso' ? (
        <g>
          <path d={`M100 ${n + 1.6} V${n + 4.5}`} stroke="#7E2630" strokeWidth="1.4" strokeLinecap="round" />
          <ellipse cx="100" cy={n + 9.5} rx="3.8" ry="4.6" fill="#C23B49" stroke="#7E2630" strokeWidth="1.2" />
        </g>
      ) : mood === 'comendo' ? (
        <g>
          <path d={`M100 ${n + 1.6} V${n + 4.5} M92.5 ${n + 5} q3.75 4.4 7.5 0 q3.75 4.4 7.5 0`} stroke="#7E2630" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <rect x="97.6" y={n + 5.6} width="4.8" height="4" rx="1" fill="#FFFFFF" stroke="#E8D8D8" strokeWidth="0.5" />
        </g>
      ) : (
        <g>
          <path d={`M100 ${n + 1.6} V${n + 4.5} M92.5 ${n + 4.6} q3.75 3.8 7.5 0 q3.75 3.8 7.5 0`} stroke="#7E2630" strokeWidth="2" strokeLinecap="round" fill="none" />
          <rect x="97.7" y={n + 5.4} width="4.6" height="3.6" rx="1" fill="#FFFFFF" stroke="#E8D8D8" strokeWidth="0.5" />
        </g>
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
