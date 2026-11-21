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
  const asleep = mood === 'dormindo';
  // Cabeça grande (a referência: mais larga nas bochechas, olhos baixos e afastados)
  const hcx = 100;
  const hcy = 85;
  const hrx = 62 + f * 5 + (eating ? 5 : 0);
  const hry = 41 + f * 2;
  const head = headPath(hcx, hcy, hrx, hry);
  // Corpo em formato de pera (o pescoço fica escondido atrás da cabeça)
  const bw = 55 + f * 8;
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
  const line = darken(fur.shade, 0.04);
  const arm = costume ? costume.paw : fur.body;
  const foot = costume ? costume.foot : fur.body;
  const chin = hcy + hry * 0.9;
  // A peça veste colada: segue o mesmo contorno do corpo (só cobre a linha dele) e termina numa barra
  // arredondada que acompanha a barriga, como roupinha de bichinho de pelúcia. O vestido abre um pouco embaixo.
  const shape = costume ? null : garmentShape(outfit.roupa);
  const hem = shape === 'dress' ? 186 : 181;
  const cw = bw + 1.2;
  const L0 = 100 - cw;
  const R0 = 100 + cw;
  const cloth =
    shape === 'dress'
      ? `M${100 - 31} 103.4 C${L0 + 4} 113.4 ${L0 - 4} 140 ${L0 - 0.5} 156 C${L0 - 2} 168 ${L0 - 5} 178 ${L0 - 4} ${hem - 2} Q100 ${hem + 6} ${R0 + 4} ${hem - 2} C${R0 + 5} 178 ${R0 + 2} 168 ${R0 + 0.5} 156 C${R0 + 4} 140 ${R0 - 4} 113.4 ${100 + 31} 103.4 Z`
      : `M${100 - 31} 103.4 C${L0 + 4} 113.4 ${L0 - 4} 146 ${L0} 168 C${L0 + 1.5} 176 ${100 - cw * 0.62} ${hem} 100 ${hem + 0.5} C${100 + cw * 0.62} ${hem} ${R0 - 1.5} 176 ${R0} 168 C${R0 + 4} 146 ${R0 - 4} 113.4 ${100 + 31} 103.4 Z`;
  const hemSeam =
    shape === 'dress'
      ? `M${L0 - 5} ${hem - 5} Q100 ${hem + 2} ${R0 + 5} ${hem - 5}`
      : `M${L0 + 3} ${172} C${L0 + 6} 178 ${100 - cw * 0.58} ${hem - 3.6} 100 ${hem - 3.2} C${100 + cw * 0.58} ${hem - 3.6} ${R0 - 6} 178 ${R0 - 3} ${172}`;
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
        <ellipse cx="100" cy="193" rx={bw * 1.25} ry="6.5" fill="rgba(0,0,0,0.13)" />
        <g className={idle && !asleep ? 'pet-idle' : asleep ? 'pet-sleep' : undefined}>
          <Cape id={outfit.roupa} geo={geo} />
          <AccessoryBack id={outfit.acessorio} geo={geo} />
          {/* rabinho */}
          {!costume && <ellipse className="pet-tail" cx={100 - bw + 2} cy="176" rx="9" ry="7" fill={fur.body} stroke={line} strokeWidth="1.6" style={{ transformOrigin: `${100 - bw + 10}px 176px` }} />}
          {/* corpo */}
          <path d={body} fill={fur.body} />
          <g clipPath={`url(#b${uid})`}>
            <ellipse cx="100" cy="168" rx={bw * 0.66} ry="32" fill={fur.belly} />
            {fur.pattern === 'manchas' && <ellipse cx={100 + bw * 0.6} cy="150" rx="15" ry="18" fill={fur.patch} opacity="0.85" />}
            {!costume && <path d={body} fill={`url(#f${uid})`} />}
            {!shape && <Clothes id={outfit.roupa} geo={geo} />}
            {garment && !shape && <rect x="0" y={chin - 14} width="200" height="100" fill={`url(#c${uid})`} />}
            {/* sombrinha da cabeça no corpo */}
            <ellipse cx="100" cy={chin + 3} rx={hrx * 0.7} ry="9" fill="#000000" opacity="0.04" />
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
                <path d={`M${R0 - 7} 122 Q${R0 - 3} 140 ${R0 - 5} 160`} stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.2" />
                {/* costura da barra, acompanhando a barriga */}
                <path d={hemSeam} stroke={darken(garment, 0.3)} strokeWidth="1.1" strokeDasharray="2.6 2.2" fill="none" opacity="0.55" />
              </g>
              <path d={cloth} fill="none" stroke={darken(garment, 0.25)} strokeWidth="1.8" strokeLinejoin="round" />
            </g>
          )}
          {/* Coração na barriga: a marca do HamiCare */}
          {!hidesHeart(outfit.roupa) && <Heart x={100} y={170} s={phase >= 3 ? 13 : 10} fill={phase >= 3 ? '#F6C445' : fur.ear} opacity={phase >= 3 ? 1 : 0.6} />}
          {/* sentado: perninhas para a frente, com a sola e os dedinhos cor-de-rosa aparecendo (como na imagem) */}
          {[-1, 1].map((s) => {
            const tx = 100 + s * 33;
            const fx = 100 + s * 39;
            const pad = '#F49AAE';
            const edge = costume ? darken(costume.foot, 0.22) : line;
            return (
              <g key={`perna${s}`}>
                <ellipse cx={tx} cy="177" rx="19" ry="14" fill={foot} stroke={edge} strokeWidth="1.7" />
                <g transform={`rotate(${s * 16} ${fx} 184)`}>
                  <ellipse cx={fx} cy="184" rx="13" ry="14.5" fill={foot} stroke={edge} strokeWidth="1.7" />
                  {!costume && <ellipse cx={fx} cy="184.5" rx="9" ry="10.5" fill={fur.belly} opacity="0.55" />}
                  <ellipse cx={fx} cy="188" rx="6.8" ry="5.6" fill={pad} />
                  {[-4.6, 0, 4.6].map((dx) => (
                    <circle key={dx} cx={fx + dx * 1.1} cy={dx === 0 ? 176.4 : 178} r="2.6" fill={pad} />
                  ))}
                </g>
              </g>
            );
          })}
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
            {!costume && <ellipse cx={hcx - hrx * 0.28} cy={top + 15} rx={hrx * 0.3} ry="7" fill="#FFFFFF" opacity="0.12" transform={`rotate(-12 ${hcx - hrx * 0.28} ${top + 15})`} />}
          </g>
          <path d={head} fill="none" stroke={costume ? darken(costume.c1, 0.22) : line} strokeWidth="1.9" strokeLinejoin="round" />
          {costume && (
            <g clipPath={`url(#h${uid})`}>
              <Clothes id={outfit.roupa} geo={geo} />
            </g>
          )}
          {/* bochechas creme bem fofas, saindo um pouquinho para os lados (como a referência) */}
          {!costume && (
            <g fill={fur.belly}>
              {[-1, 1].map((s) => (
                <ellipse key={s} cx={hcx + s * hrx * 0.6} cy={eyeY + 16} rx={hrx * 0.43} ry="20" />
              ))}
              <ellipse cx={hcx} cy={eyeY + 21} rx={hrx * 0.5} ry="16" />
            </g>
          )}
          {/* um tufinho macio no alto da cabeça */}
          {!costume && !outfit.chapeu && (
            <path
              d={`M${hcx - 9} ${top + 5} C${hcx - 10} ${top - 4} ${hcx - 1} ${top - 9} ${hcx + 6} ${top - 5} C${hcx + 1} ${top - 3} ${hcx} ${top + 1} ${hcx + 3} ${top + 5}`}
              fill={fur.body}
              stroke={line}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
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

/** Cabeça de pãozinho: topo redondo e liso, bochechas fofas que saem para os lados e um queixo macio. */
function headPath(cx: number, cy: number, rx: number, ry: number) {
  const T = cy - ry;
  const B = cy + ry;
  const side = (s: 1 | -1) => {
    const X = (k: number) => (cx + s * rx * k).toFixed(1);
    const Y = (k: number) => (cy + ry * k).toFixed(1);
    // do topo até a altura dos olhos
    let d = `C${X(0.7)} ${T.toFixed(1)} ${X(1.0)} ${Y(-0.55)} ${X(0.99)} ${Y(-0.04)}`;
    // bochecha gordinha (sai para fora) com um tufinho macio
    d += ` C${X(1.01)} ${Y(0.18)} ${X(1.09)} ${Y(0.38)} ${X(1.02)} ${Y(0.58)}`;
    d += ` Q${X(1.03)} ${Y(0.68)} ${X(0.92)} ${Y(0.72)}`;
    // queixo arredondado
    d += ` C${X(0.8)} ${Y(0.95)} ${X(0.48)} ${B.toFixed(1)} ${cx.toFixed(1)} ${B.toFixed(1)}`;
    return d;
  };
  const right = side(1);
  const rev = reversePath(`M${cx} ${T} ${side(-1)}`);
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

function Face({ mood, eyeY, noseY, ex, cheekX, cheek, eyeK = 1 }: { mood: PetMood; eyeY: number; noseY: number; ex: number; cheekX: number; cheek: string; brow: string; eyeK?: number; uid: string }) {
  // Rosto minimalista: olhinhos pequenos com um brilho só, bochechas, narizinho e uma boquinha simples.
  const closed = mood === 'sono' || mood === 'dormindo';
  // olhinhos sorrindo (^ ^): contente e calmo, sem parecer sono
  const smiley = mood === 'calmo' || mood === 'animado' || mood === 'risada';
  const happy = mood === 'animado' || mood === 'comendo' || mood === 'risada';
  const wide = mood === 'surpreso' || mood === 'boca';
  const n = noseY;
  const ink = '#3A2620';
  return (
    <g>
      <g transform={eyeK !== 1 ? `translate(100 ${eyeY}) scale(${eyeK}) translate(-100 ${-eyeY})` : undefined}>
        {closed ? (
          <g stroke={ink} strokeWidth="3" strokeLinecap="round" fill="none">
            {[-1, 1].map((s) => (
              <path key={s} d={`M${100 + s * ex - 6} ${eyeY} Q${100 + s * ex} ${eyeY + 4.5} ${100 + s * ex + 6} ${eyeY}`} />
            ))}
          </g>
        ) : smiley ? (
          <g stroke={ink} strokeWidth="3.2" strokeLinecap="round" fill="none">
            {[-1, 1].map((s) => (
              <path key={s} d={`M${100 + s * ex - 6} ${eyeY + 2} Q${100 + s * ex} ${eyeY - 5} ${100 + s * ex + 6} ${eyeY + 2}`} />
            ))}
          </g>
        ) : (
          <g className="pet-eyes">
            {[-1, 1].map((s) => {
              const x = 100 + s * ex;
              const r = wide ? 1.15 : 1;
              return (
                <g key={s}>
                  <ellipse cx={x} cy={eyeY} rx={5.6 * r} ry={6.6 * r} fill={ink} />
                  <circle cx={x + 1.9} cy={eyeY - 2.3} r={2 * r} fill="#FFFFFF" />
                </g>
              );
            })}
          </g>
        )}
      </g>
      {/* bochechas rosadas */}
      {[-1, 1].map((s) => (
        <ellipse key={s} cx={100 + s * cheekX} cy={eyeY + 13} rx="10" ry="6.4" fill={cheek} opacity={mood === 'risada' ? 0.85 : 0.55} />
      ))}
      {/* narizinho */}
      <path d={`M96 ${n - 3.6} Q100 ${n - 4.6} 104 ${n - 3.6} Q103 ${n - 0.4} 100 ${n + 0.6} Q97 ${n - 0.4} 96 ${n - 3.6} Z`} fill="#F28C9A" />
      {happy ? (
        <g>
          <path d={`M100 ${n + 1} V${n + 3.2}`} stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
          <path d={`M93.6 ${n + 3.4} Q100 ${n + 3} 106.4 ${n + 3.4} Q105.4 ${n + 11.6} 100 ${n + 11.6} Q94.6 ${n + 11.6} 93.6 ${n + 3.4} Z`} fill="#B9404D" />
          <path d={`M96.2 ${n + 8.8} Q100 ${n + 6.6} 103.8 ${n + 8.8} Q102.6 ${n + 11} 100 ${n + 11} Q97.4 ${n + 11} 96.2 ${n + 8.8} Z`} fill="#FF8FA0" />
          <rect x="98" y={n + 3.4} width="4" height="3" rx="0.8" fill="#FFFFFF" />
        </g>
      ) : mood === 'boca' || mood === 'surpreso' ? (
        <g>
          <path d={`M100 ${n + 1} V${n + 3.4}`} stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
          <ellipse cx="100" cy={n + 8} rx={mood === 'boca' ? 4.6 : 3.2} ry={mood === 'boca' ? 5 : 3.8} fill="#B9404D" />
        </g>
      ) : (
        <g>
          <path d={`M100 ${n + 0.6} V${n + 3} M94.4 ${n + 3} q2.8 3.2 5.6 0 q2.8 3.2 5.6 0`} stroke={ink} strokeWidth="1.9" strokeLinecap="round" fill="none" />
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
