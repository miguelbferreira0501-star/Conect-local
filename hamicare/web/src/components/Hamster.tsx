import { createContext, useContext, useId } from 'react';
import { furById } from '../data/fur';
import { itemById } from '../data/items';
import { fluffOf } from '../logic/evolution';
import { Accessory, AccessoryBack, Cape, Clothes, CostumeBack, CostumeFront, costumeOf, EffectBack, EffectFront, garmentColor, garmentShape, Glasses, Hat, sleeveOf } from './Wear';
import type { Outfit, PetMood } from '../types';
import type { Condition, HamiProp } from '../lib/hamiDay';

const INK = '#3B2418';

/** Tamanho do Hami da pessoa (cresce com os dias de cuidado). O App informa; o padrão é o tamanho máximo. */
export const GrowthContext = createContext(1);
const NO_OUTFIT: Outfit = {
  chapeu: null,
  oculos: null,
  roupa: null,
  acessorio: null,
};

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
  /** Situação do dia (frio, calor, gripado…): muda o rostinho e põe suor, sujeira, nariz vermelho etc. */
  cond?: Condition;
  /** Mostrar o rostinho da situação (desligado enquanto ele reage a um toque). */
  condFace?: boolean;
  /** O que ele segura na atividade (livro, fones, desenho, halteres, varinha de bolhas). */
  prop?: HamiProp;
}

/** Tronco de pera: fininho acima da cintura, barriga e quadril largos e base redonda. */
function torso(w: number, bottom: number, flare = 0) {
  const L = (k: number) => (100 - k).toFixed(1);
  const R = (k: number) => (100 + k).toFixed(1);
  return (
    `M${L(w * 0.48)} 104 C${L(w * 0.78)} 114 ${L(w * 1.04)} 140 ${L(w + flare * 0.5)} 164 ` +
    `C${L(w * 0.98 + flare)} ${bottom - 10} ${L(w * 0.62 + flare)} ${bottom} 100 ${bottom} ` +
    `C${R(w * 0.62 + flare)} ${bottom} ${R(w * 0.98 + flare)} ${bottom - 10} ${R(w + flare * 0.5)} 164 ` +
    `C${R(w * 1.04)} 140 ${R(w * 0.78)} 114 ${R(w * 0.48)} 104 Z`
  );
}

/** Cabeça de pãozinho: testa mais estreita em cima e bochechas largas embaixo. */
function headPath(cx: number, cy: number, rx: number, ry: number) {
  const T = cy - ry;
  const B = cy + ry;
  return (
    `M${cx} ${T} C${cx + rx * 0.46} ${T} ${cx + rx * 0.84} ${cy - ry * 0.52} ${cx + rx} ${cy + ry * 0.12} ` +
    `C${cx + rx * 1.02} ${cy + ry * 0.66} ${cx + rx * 0.62} ${B} ${cx} ${B} ` +
    `C${cx - rx * 0.62} ${B} ${cx - rx * 1.02} ${cy + ry * 0.66} ${cx - rx} ${cy + ry * 0.12} ` +
    `C${cx - rx * 0.84} ${cy - ry * 0.52} ${cx - rx * 0.46} ${T} ${cx} ${T} Z`
  );
}

/**
 * Focinho e bochechas creme: sobe num montinho entre os olhos (até o nariz), passa por baixo de cada olho
 * e incha para os lados em duas bochechas bem fofas, sempre por dentro do contorno da cabeça.
 */
function muzzlePath(eyeY: number, ex: number, rx: number, puff: number) {
  const pts = (s: 1 | -1): number[][] => {
    const X = (d: number) => 100 + s * d;
    return [
      [X(7), eyeY + 1, X(ex * 0.5), eyeY + 8, X(ex), eyeY + 8],
      [X(ex * 1.55), eyeY + 8, X(rx * 0.74), eyeY - 1, X(rx * (0.88 + puff)), eyeY + 6],
      [X(rx * (0.97 + puff)), eyeY + 16, X(rx * (0.92 + puff)), eyeY + 35, X(rx * 0.66), eyeY + 44],
      [X(rx * 0.42), eyeY + 52, X(18), eyeY + 52, 100, eyeY + 52],
    ];
  };
  const fmt = (n: number) => n.toFixed(1);
  const start = [100, eyeY + 1];
  const right = pts(1)
    .map((c) => `C${c.map(fmt).join(' ')}`)
    .join(' ');
  // lado esquerdo percorrido de volta (do queixo ao topo), para fechar o contorno
  const left = pts(-1);
  const ends = [start, ...left.map((c) => [c[4], c[5]])];
  const back = left
    .map((c, i) => `C${fmt(c[2])} ${fmt(c[3])} ${fmt(c[0])} ${fmt(c[1])} ${fmt(ends[i][0])} ${fmt(ends[i][1])}`)
    .reverse()
    .join(' ');
  return `M${start[0]} ${start[1]} ${right} ${back} Z`;
}

function mix(hex: string, to: string, t: number) {
  const a = /^#?([0-9a-f]{6})$/i.exec(hex);
  const b = /^#?([0-9a-f]{6})$/i.exec(to);
  if (!a || !b) return hex;
  const n = parseInt(a[1], 16);
  const m = parseInt(b[1], 16);
  const ch = (sh: number) =>
    Math.round(((n >> sh) & 255) * (1 - t) + ((m >> sh) & 255) * t)
      .toString(16)
      .padStart(2, '0');
  return `#${ch(16)}${ch(8)}${ch(0)}`;
}
const darken = (hex: string, t: number) => mix(hex, '#000000', t);
const lighten = (hex: string, t: number) => mix(hex, '#FFFFFF', t);

/** Pelo da cor do hamster no alto da cabeça, descendo pelos lados até a altura dos olhos (o rosto fica branquinho). */
function patchPath(hcx: number, hcy: number, hrx: number, top: number, eyeY: number) {
  const P = (x: number, y: number) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  return (
    `M${P(hcx - hrx - 4, hcy + 6)} C${P(hcx - hrx - 4, top - 10)} ${P(hcx + hrx + 4, top - 10)} ${P(hcx + hrx + 4, hcy + 6)} ` +
    `C${P(hcx + hrx * 0.8, eyeY - 8)} ${P(hcx + hrx * 0.45, top + 29)} ${P(hcx, top + 28)} ` +
    `C${P(hcx - hrx * 0.45, top + 29)} ${P(hcx - hrx * 0.8, eyeY - 8)} ${P(hcx - hrx - 4, hcy + 6)} Z`
  );
}

/**
 * O Hami: um hamster gordinho em pé, de cabeça de pãozinho e corpo de feijão (como um bonequinho de pelúcia),
 * rosto branquinho com a mancha da cor do pelo no alto da cabeça, olhões castanhos brilhando, bochechas rosadas
 * e a boquinha "ω". O volume (bem 3D) vem da luz por cima, da sombra nas bordas e do pelo felpudo no contorno.
 * As roupas vestem o mesmo contorno do corpo.
 */
export function Hamster({ fur: furId, grams = 135, phase = 0, mood = 'feliz', outfit = NO_OUTFIT, size = 180, idle = true, label, neutral, wet: wetProp, shine, growth, pose, cond, condFace = true, prop }: HamsterProps) {
  const wet = wetProp || cond === 'chuva';
  const fur = furById(furId);
  const current = useContext(GrowthContext);
  const k = Math.min(1, Math.max(0.4, neutral ? 1 : (growth ?? current)));
  const young = Math.min(1, Math.max(0, (1 - k) / 0.3));
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const f = fluffOf(neutral ? 135 : grams);
  const eating = mood === 'comendo';
  const asleep = mood === 'dormindo';
  // Pelo felpudo no contorno só nos desenhos grandes (nos quadradinhos pequenos não aparece e pesa no celular).
  const fuzzy = size >= 110;

  // Cabeça de pãozinho (larga, base reta); olhos no meio do rosto, como na referência.
  const hcx = 100;
  const hcy = 80;
  const hrx = 60 + f * 3;
  const hry = 46;
  const top = hcy - hry;
  const head = headPath(hcx, hcy, hrx, hry);
  const eyeY = 82;
  const ex = 25;
  const noseY = eyeY + 11;
  const muzzle = muzzlePath(eyeY - 10, ex, hrx, eating ? 0.05 : 0);
  const patch = patchPath(hcx, hcy, hrx, top, eyeY);
  const chin = 118;
  // inclinação da cabecinha (fica reta dormindo)
  const tilt = asleep ? 0 : 5;
  // Corpo de feijão, em pé
  const bw = 55 + f * 7;
  const body = torso(bw, 190);
  const geo = { top, w: hrx * 0.86, h: 188 - top, eyeY: eyeY - 10 };

  const costume = costumeOf(outfit.roupa);
  const holding = !!outfit.acessorio && itemById(outfit.acessorio)?.base === 'segurar';
  const sleeve = costume ? null : sleeveOf(outfit.roupa);
  const shape = costume ? null : garmentShape(outfit.roupa);
  const garment = costume ? null : shape ? garmentColor(outfit.roupa) : (sleeve ?? (outfit.roupa ? (itemById(outfit.roupa)?.c1 ?? null) : null));
  const cloth = shape === 'dress' ? torso(bw + 1.4, 189, 6) : torso(bw + 1.4, 183);
  const hem = shape === 'dress' ? 189 : 183;
  const reach = !!prop && prop !== 'fones';

  // Cores com volume: luz por cima à esquerda, borda mais funda.
  const furLight = lighten(fur.body, 0.26);
  const furEdge = darken(fur.shade, 0.06);
  const cream = lighten(fur.belly, 0.35);
  const creamEdge = darken(fur.belly, 0.12);
  const arm = costume ? costume.paw : fur.body;
  const foot = costume ? costume.foot : fur.body;
  const edge = (c: string) => darken(c, 0.16);
  const fz = fuzzy ? `url(#z${uid})` : undefined;

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
        <radialGradient id={`f${uid}`} cx="36%" cy="22%" r="88%">
          <stop offset="0%" stopColor={furLight} />
          <stop offset="50%" stopColor={fur.body} />
          <stop offset="100%" stopColor={fur.shade} />
        </radialGradient>
        <radialGradient id={`m${uid}`} cx="45%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="62%" stopColor={cream} />
          <stop offset="100%" stopColor={darken(fur.belly, 0.05)} />
        </radialGradient>
        {/* volume: brilho no alto e sombra macia nas bordas, por cima de tudo */}
        <radialGradient id={`v${uid}`} cx="36%" cy="26%" r="82%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.42" />
          <stop offset="42%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="78%" stopColor="#7A4022" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#7A4022" stopOpacity="0.22" />
        </radialGradient>
        <radialGradient id={`e${uid}`} cx="50%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#1E0F08" />
          <stop offset="62%" stopColor="#3A1F12" />
          <stop offset="100%" stopColor="#6A3B22" />
        </radialGradient>
        <radialGradient id={`p${uid}`} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor={lighten(fur.ear, 0.15)} />
          <stop offset="100%" stopColor={fur.ear} />
        </radialGradient>
        <radialGradient id={`s${uid}`}>
          <stop offset="0%" stopColor="#5A2E14" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#5A2E14" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`c${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000000" stopOpacity="0.16" />
          <stop offset="0.3" stopColor="#000000" stopOpacity="0" />
          <stop offset="0.68" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.18" />
        </linearGradient>
        <radialGradient id={`g${uid}`}>
          <stop offset="0%" stopColor="#FFE07A" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFE07A" stopOpacity="0" />
        </radialGradient>
        {fuzzy && (
          <filter id={`z${uid}`} x="-8%" y="-8%" width="116%" height="116%">
            <feTurbulence type="fractalNoise" baseFrequency="1.05" numOctaves="2" seed="7" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2.3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        )}
        <filter id={`r${uid}`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={fuzzy ? 2.6 : 1.6} />
        </filter>
        {fuzzy && (
          /* textura de pelo: fiozinhos bem de leve, por cima da pelagem */
          <filter id={`t${uid}`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="1.6 0.55" numOctaves="2" seed="3" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.2  0 0 0 0 0.1  0 0 0 -1.6 1.05" />
          </filter>
        )}
      </defs>
      <g transform={k < 1 ? `translate(100 192) scale(${k}) translate(-100 -192)` : undefined}>
        {phase >= 3 && <circle cx="100" cy="110" r="94" fill={`url(#g${uid})`} />}
        <EffectBack id={outfit.efeito} geo={geo} uid={uid} />
        <ellipse cx="100" cy="195" rx={bw * 1.02} ry="6" fill="rgba(60,30,40,0.16)" />
        <g className={idle && !asleep ? 'pet-idle' : asleep ? 'pet-sleep' : undefined}>
          <Cape id={outfit.roupa} geo={geo} />
          <AccessoryBack id={outfit.acessorio} geo={geo} />

          {/* pezinhos embaixo do corpo (ele fica em pé) */}
          {[-1, 1].map((s) => {
            const fx = 100 + s * 23;
            return (
              <g key={`pe${s}`} filter={fz}>
                <ellipse cx={fx} cy="189" rx="15" ry="8.5" fill={costume ? foot : `url(#f${uid})`} />
                <ellipse cx={fx} cy="190.5" rx="11" ry="5.6" fill={costume ? lighten(foot, 0.55) : `url(#m${uid})`} />
                <path d={`M${fx - 4} 193.4 v-2.6 M${fx} 194 v-2.8 M${fx + 4} 193.4 v-2.6`} stroke={creamEdge} strokeWidth="1.1" strokeLinecap="round" opacity="0.55" />
              </g>
            );
          })}

          {/* corpo de feijão (com a barriga branquinha) */}
          <g filter={fz}>
            <path d={body} fill={costume ? fur.body : `url(#f${uid})`} />
            <g clipPath={`url(#b${uid})`}>
              <ellipse cx="100" cy="158" rx={bw * 0.7} ry="40" fill={`url(#m${uid})`} />
              {fur.pattern === 'manchas' && <ellipse cx={100 + bw * 0.66} cy="146" rx="15" ry="18" fill={fur.patch} opacity="0.85" />}
            </g>
            <path d={body} fill={`url(#v${uid})`} />
          </g>
          {fuzzy && (
            <g clipPath={`url(#b${uid})`} opacity="0.13">
              <rect x="20" y="96" width="160" height="100" filter={`url(#t${uid})`} />
            </g>
          )}
          {wet && <path d={body} fill="#5B8FD6" opacity="0.14" />}
          <g clipPath={`url(#b${uid})`}>
            {!shape && <Clothes id={outfit.roupa} geo={geo} />}
            {garment && !shape && <rect x="0" y={chin - 14} width="200" height="100" fill={`url(#c${uid})`} />}
            {/* sombra macia da cabeça no corpo */}
            <ellipse cx="100" cy={chin + 6} rx={hrx * 0.86} ry="12" fill={`url(#s${uid})`} />
          </g>
          {(garment || costume) && <path d={body} fill="none" stroke={costume ? edge(costume.c1) : edge(garment!)} strokeOpacity="0.9" strokeWidth="1.3" />}
          {shape && garment && (
            <g>
              <path d={cloth} fill={garment} />
              <g clipPath={`url(#k${uid})`}>
                <Clothes id={outfit.roupa} geo={geo} />
                <rect x="0" y={chin - 14} width="200" height="100" fill={`url(#c${uid})`} />
                <ellipse cx="100" cy={chin + 6} rx={hrx * 0.86} ry="12" fill={`url(#s${uid})`} />
                <path
                  d={`M${100 - bw * 0.62} ${hem - 4} Q100 ${hem + 3} ${100 + bw * 0.62} ${hem - 4}`}
                  stroke={darken(garment, 0.3)}
                  strokeWidth="1.1"
                  strokeDasharray="2.6 2.2"
                  fill="none"
                  opacity="0.5"
                />
              </g>
              <path d={cloth} fill="none" stroke={edge(garment)} strokeWidth="1.5" strokeLinejoin="round" />
            </g>
          )}

          {/* bracinhos curtos ao lado do corpo (ou segurando o objeto na frente); o esquerdo acena no "tchau" */}
          {[-1, 1].map((s) => {
            if (s === 1 && holding) return null;
            const fill = sleeve ?? arm;
            const line = sleeve ? darken(sleeve, 0.22) : costume ? edge(costume.c1) : furEdge;
            const sx = 100 + s * (bw - 13);
            const px = reach ? 100 + s * 19 : 100 + s * (bw - 4);
            const py = reach ? 147 : 152;
            const d = reach ? `M${sx} 124 C${sx + s * 6} 136 ${100 + s * (bw - 18)} 146 ${px} ${py}` : `M${sx} 124 C${sx + s * 9} 132 ${px + s * 3} 142 ${px} ${py}`;
            return (
              <g key={s} className={s === -1 ? (pose === 'tchau' ? 'pet-wave' : 'pet-arm') : undefined} style={{ transformOrigin: `${sx}px 124px` }}>
                <path d={d} stroke={line} strokeOpacity={sleeve || costume ? 0.8 : 0.28} strokeWidth="17.5" strokeLinecap="round" fill="none" />
                <path d={d} stroke={sleeve ? fill : costume ? fill : `url(#f${uid})`} strokeWidth="15.8" strokeLinecap="round" fill="none" />
                {sleeve && <ellipse cx={px - s * 1} cy={py - 5} rx="6.5" ry="5" fill={darken(sleeve, 0.1)} />}
                <ellipse cx={px} cy={py} rx="8.4" ry="7.8" fill={costume ? costume.paw : `url(#m${uid})`} />
                <path d={`M${px - 3} ${py + 4.6} v-2.4 M${px + 1.5} ${py + 5.2} v-2.6`} stroke={creamEdge} strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
              </g>
            );
          })}
          {cond === 'terra' && (
            <g fill="#8A5A3B" opacity="0.4">
              <ellipse cx={100 - bw * 0.4} cy="168" rx="8" ry="5" />
              <ellipse cx={100 + bw * 0.3} cy="178" rx="6" ry="4" />
              <circle cx={100 + 30} cy="184" r="3" />
            </g>
          )}
          <PropInHands prop={prop} cream={`url(#m${uid})`} paw={costume ? costume.paw : null} line={creamEdge} />

          {/* cabeça um pouquinho inclinada, com as orelhas */}
          <g transform={`rotate(${tilt} 100 ${chin})`}>
            <CostumeBack id={outfit.roupa} geo={geo} />
            {!costume &&
              [-1, 1].map((s) => {
                const cx = hcx + s * hrx * 0.66;
                const cy = top + 9;
                return (
                  <g key={s} className={s === 1 ? 'pet-ear' : undefined} style={{ transformOrigin: `${cx}px ${cy + 14}px` }}>
                    <g filter={fz}>
                      <circle cx={cx} cy={cy} r="17" fill={`url(#f${uid})`} />
                      <circle cx={cx} cy={cy} r="17" fill={`url(#v${uid})`} />
                    </g>
                    <ellipse cx={cx - s * 1.2} cy={cy + 1.6} rx="10" ry="9.6" fill={fur.pattern === 'panda' ? fur.patch : `url(#p${uid})`} />
                    <ellipse cx={cx - s * 2.6} cy={cy - 2.6} rx="4" ry="2.4" fill="#FFFFFF" opacity="0.35" />
                  </g>
                );
              })}

            {/* cabeça: rosto branquinho, mancha da cor do pelo no alto e o volume por cima */}
            <g filter={fz}>
              <path d={head} fill={costume ? fur.body : `url(#m${uid})`} />
              {!costume && (
                <g clipPath={`url(#h${uid})`}>
                  <path d={patch} fill={`url(#f${uid})`} filter={`url(#r${uid})`} />
                  {fur.pattern === 'manchas' && <ellipse cx={hcx - hrx * 0.5} cy={top + 18} rx="20" ry="14" fill={fur.patch} opacity="0.85" />}
                </g>
              )}
              {costume && (
                <g clipPath={`url(#h${uid})`}>
                  <path d={muzzle} fill={`url(#m${uid})`} />
                </g>
              )}
              <path d={head} fill={`url(#v${uid})`} />
              <path d={head} fill="none" stroke={costume ? edge(costume.c1) : creamEdge} strokeOpacity={costume ? 0.9 : 0.45} strokeWidth="1.2" />
            </g>
            {fuzzy && !costume && (
              <g clipPath={`url(#h${uid})`} opacity="0.11">
                <rect x="30" y={top - 2} width="140" height="100" filter={`url(#t${uid})`} />
              </g>
            )}
            {wet && <path d={head} fill="#5B8FD6" opacity="0.16" />}
            {phase === 2 && !outfit.chapeu && (
              <g clipPath={`url(#h${uid})`}>
                <rect x="0" y={top + 10} width="200" height="8" fill="#FF6F91" />
              </g>
            )}
            {costume && (
              <g clipPath={`url(#h${uid})`}>
                <Clothes id={outfit.roupa} geo={geo} />
              </g>
            )}
            {fur.pattern === 'panda' && [-1, 1].map((s) => <ellipse key={s} cx={hcx + s * ex} cy={eyeY - 1} rx="15" ry="13" fill={fur.patch} opacity="0.9" />)}
            <Face mood={mood} cond={condFace ? cond : undefined} eyeY={eyeY} noseY={noseY} ex={ex} blush={fur.ear} eyeK={1 + young * 0.1} uid={uid} />
            {/* efeitos da situação do dia no rosto e na cabeça */}
            {cond === 'calor' &&
              [
                [-1, 0.2, 0],
                [1, 0.05, 0.6],
                [1, 0.62, 1.2],
              ].map(([sd, dy, delay], i) => (
                <path
                  key={i}
                  className="drip"
                  style={{ animationDelay: `${delay}s` }}
                  d={`M${100 + sd * (hrx - 6)} ${top + 18 + dy * 40} q-4 7 0 10.5 q4 -3.5 0 -10.5 Z`}
                  fill="#BFE6FF"
                  stroke="#7CC4F0"
                  strokeWidth="1"
                />
              ))}
            {cond === 'terra' && (
              <g fill="#8A5A3B" opacity="0.45">
                <ellipse cx={hcx + hrx * 0.42} cy={top + 18} rx="7" ry="4.5" transform={`rotate(-20 ${hcx + hrx * 0.42} ${top + 18})`} />
                <ellipse cx={hcx - hrx * 0.62} cy={eyeY + 22} rx="5" ry="3.4" />
                <circle cx={hcx - hrx * 0.3} cy={top + 10} r="2.6" />
                <circle cx={hcx + hrx * 0.7} cy={eyeY + 14} r="2.2" />
              </g>
            )}
            {wet && (
              <g>
                {[
                  [-0.5, 0.1],
                  [0.35, 0.05],
                  [0.62, 0.42],
                  [-0.7, 0.5],
                  [0.1, 0.0],
                ].map(([dx, dy], i) => (
                  <path
                    key={i}
                    className="drip"
                    style={{ animationDelay: `${i * 0.3}s` }}
                    d={`M${100 + dx * hrx} ${top + 10 + dy * 90} q-3.5 6 0 9 q3.5 -3 0 -9 Z`}
                    fill="#8FD0FF"
                    stroke="#5BA9E8"
                    strokeWidth="0.8"
                  />
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
            <Glasses id={outfit.oculos} eyeY={eyeY} ex={ex} />
            <Hat id={outfit.chapeu} geo={geo} />
            {prop === 'fones' && (
              <g>
                <path d={`M${hcx - hrx + 4} ${eyeY - 6} C${hcx - hrx + 2} ${top - 18} ${hcx + hrx - 2} ${top - 18} ${hcx + hrx - 4} ${eyeY - 6}`} stroke="#5B6BD6" strokeWidth="5.5" strokeLinecap="round" fill="none" />
                {[-1, 1].map((sd) => (
                  <g key={sd}>
                    <rect x={hcx + sd * (hrx - 4) - 8} y={eyeY - 18} width="16" height="22" rx="8" fill="#FF8FB1" />
                    <rect x={hcx + sd * (hrx - 4) - 5} y={eyeY - 15} width="10" height="16" rx="5" fill="#FFFFFF" opacity="0.45" />
                  </g>
                ))}
              </g>
            )}
          </g>
          <Accessory id={outfit.acessorio} geo={{ ...geo, top: chin - 36, h: 64, w: bw - 8 }} paw={arm} head={{ cx: hcx, cy: hcy, rx: hrx, ry: hry }} />
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

function Face({ mood, cond, eyeY, noseY, ex, blush, eyeK = 1, uid }: { mood: PetMood; cond?: Condition; eyeY: number; noseY: number; ex: number; blush: string; eyeK?: number; uid: string }) {
  // Olhões castanhos redondos e brilhantes, bochechas rosadas com brilhinho e a boquinha "ω".
  // A situação do dia troca o rostinho: > < tremendo de frio, olhinhos caídos de calor, nariz vermelho de gripe…
  const sleepy = mood === 'sono' || mood === 'dormindo';
  // Chorão fofinho: 'manha' = olhinhos marejados de dó; 'choro' = chorando de soluçar, com rios de lágrimas.
  const cry = mood === 'choro';
  const teary = mood === 'manha';
  const face = cond && cond !== 'terra' && !sleepy && !cry && !teary ? cond : null;
  const open = !face && (mood === 'surpreso' || mood === 'boca');
  const laugh = !face && (mood === 'animado' || mood === 'risada');
  // olhinhos fechados de felicidade (^ ^) só no "calmo" e na risada
  const smiley = !face && (mood === 'calmo' || mood === 'risada');
  const n = noseY;
  /** O olhão: castanho escuro com reflexo embaixo e dois pontinhos de luz. */
  const bigEye = (x: number, rx = 9.6, ry = 10.6) => (
    <g key={x}>
      <ellipse cx={x} cy={eyeY} rx={rx} ry={ry} fill={`url(#e${uid})`} />
      <ellipse cx={x} cy={eyeY + ry * 0.48} rx={rx * 0.6} ry={ry * 0.3} fill="#8A5634" opacity="0.5" />
      <circle cx={x + rx * 0.3} cy={eyeY - ry * 0.34} r={rx * 0.36} fill="#FFFFFF" />
      <circle cx={x - rx * 0.36} cy={eyeY + ry * 0.36} r={rx * 0.16} fill="#FFFFFF" />
      <circle cx={x + rx * 0.5} cy={eyeY + ry * 0.24} r={rx * 0.08} fill="#FFFFFF" opacity="0.85" />
    </g>
  );
  const eyes = () => {
    if (cry)
      return (
        <g>
          <g stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none">
            {[-1, 1].map((s) => {
              const x = 100 + s * ex;
              return <path key={s} d={`M${x - 9} ${eyeY - 2} Q${x} ${eyeY + 5} ${x + 9} ${eyeY - 2}`} />;
            })}
          </g>
          {/* rios de lágrimas escorrendo pelas bochechas */}
          {[-1, 1].map((s) => {
            const x = 100 + s * ex;
            return (
              <g key={`t${s}`}>
                <path className="tear-flow" d={`M${x + s * 7} ${eyeY + 2} C${x + s * 11} ${eyeY + 14} ${x + s * 7} ${eyeY + 24} ${x + s * 12} ${eyeY + 36}`} stroke="#8FD0FF" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.9" />
                <path d={`M${x + s * 7} ${eyeY + 2} C${x + s * 11} ${eyeY + 14} ${x + s * 7} ${eyeY + 24} ${x + s * 12} ${eyeY + 36}`} stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.7" />
                <path className="tear-drop" style={{ animationDelay: s === 1 ? '0.35s' : '0s' }} d={`M${x + s * 13} ${eyeY - 2} q-3.2 5.4 0 8 q3.2 -2.6 0 -8 Z`} fill="#8FD0FF" stroke="#5BA9E8" strokeWidth="0.8" />
              </g>
            );
          })}
        </g>
      );
    if (teary)
      return (
        <g className="pet-eyes">
          {[-1, 1].map((s) => {
            const x = 100 + s * ex;
            return (
              <g key={s}>
                {bigEye(x)}
                {/* lágrima acumulada no olhinho */}
                <path d={`M${x - 8.6} ${eyeY + 3.4} Q${x} ${eyeY + 8} ${x + 8.6} ${eyeY + 3.4} Q${x + 7.2} ${eyeY + 9.8} ${x} ${eyeY + 10.8} Q${x - 7.2} ${eyeY + 9.8} ${x - 8.6} ${eyeY + 3.4} Z`} fill="#8FD0FF" opacity="0.85" />
              </g>
            );
          })}
          <path className="tear-drop" d={`M${100 + ex + 8} ${eyeY + 10} q-3 5 0 7.6 q3 -2.6 0 -7.6 Z`} fill="#8FD0FF" stroke="#5BA9E8" strokeWidth="0.8" />
        </g>
      );
    if (face === 'frio')
      return (
        <g stroke={INK} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {[-1, 1].map((s) => {
            const x = 100 + s * ex;
            return <path key={s} d={`M${x - s * 7} ${eyeY - 6} L${x + s * 4.5} ${eyeY} L${x - s * 7} ${eyeY + 6}`} />;
          })}
        </g>
      );
    if (face === 'calor' || face === 'gripado' || face === 'tedio')
      return (
        <g>
          {[-1, 1].map((s) => {
            const x = 100 + s * ex;
            return (
              <g key={s}>
                <path d={`M${x - 8} ${eyeY - 0.5} A8 8 0 0 0 ${x + 8} ${eyeY - 0.5} Z`} fill={`url(#e${uid})`} />
                <circle cx={x + 2.6} cy={eyeY + 2.4} r="1.7" fill="#FFFFFF" />
                <path d={`M${x - 10} ${eyeY - 1} H${x + 10}`} stroke={INK} strokeWidth="3" strokeLinecap="round" />
                {face === 'gripado' && s === 1 && <path d={`M${x + 6} ${eyeY + 5} q-2 4 0 6 q2 -2 0 -6 Z`} fill="#9FD6FF" />}
              </g>
            );
          })}
        </g>
      );
    if (face === 'chuva' || face === 'medo')
      return <g className="pet-eyes">{[-1, 1].map((s) => bigEye(100 + s * ex, face === 'medo' ? 8.6 : 8, face === 'medo' ? 10 : 9.2))}</g>;
    if (sleepy)
      return (
        <g stroke={INK} strokeWidth="3.8" strokeLinecap="round" fill="none">
          {[-1, 1].map((s) => {
            const x = 100 + s * ex;
            return <path key={s} d={`M${x - 9} ${eyeY - 1} Q${x} ${eyeY + 6} ${x + 9} ${eyeY - 1}`} />;
          })}
        </g>
      );
    if (smiley)
      return (
        <g stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none">
          {[-1, 1].map((s) => {
            const x = 100 + s * ex;
            return <path key={s} d={`M${x - 9.5} ${eyeY + 3.4} Q${x} ${eyeY - 8.5} ${x + 9.5} ${eyeY + 3.4}`} />;
          })}
        </g>
      );
    return <g className="pet-eyes">{[-1, 1].map((s) => bigEye(100 + s * ex, open ? 9 : 9.6, open ? 11.4 : 10.6))}</g>;
  };
  /** A boquinha "ω" aberta, com a linguinha rosa. */
  const omega = (w = 7) => (
    <g>
      <path d={`M${100 - w * 0.62} ${n + 3.4} Q${100 - w * 0.5} ${n + 10.6} 100 ${n + 10.6} Q${100 + w * 0.5} ${n + 10.6} ${100 + w * 0.62} ${n + 3.4} Q100 ${n + 5.4} ${100 - w * 0.62} ${n + 3.4} Z`} fill="#A23E4B" />
      <path d={`M${100 - w * 0.4} ${n + 8.2} Q100 ${n + 6.4} ${100 + w * 0.4} ${n + 8.2} Q${100 + w * 0.3} ${n + 10.3} 100 ${n + 10.4} Q${100 - w * 0.3} ${n + 10.3} ${100 - w * 0.4} ${n + 8.2} Z`} fill="#FF8DA1" />
      <path d={`M${100 - w} ${n + 2} Q${100 - w * 0.5} ${n + 6.6} 100 ${n + 2.6} Q${100 + w * 0.5} ${n + 6.6} ${100 + w} ${n + 2}`} stroke={INK} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
  );
  const mouth = () => {
    if (cry)
      return (
        <g>
          <path d={`M91.6 ${n + 6} Q93 ${n} 100 ${n} Q107 ${n} 108.4 ${n + 6} Q108 ${n + 12.5} 100 ${n + 12.5} Q92 ${n + 12.5} 91.6 ${n + 6} Z`} fill="#A8424E" />
          <path d={`M95 ${n + 9.6} Q100 ${n + 6.6} 105 ${n + 9.6} Q103.6 ${n + 12} 100 ${n + 12} Q96.4 ${n + 12} 95 ${n + 9.6} Z`} fill="#FF8FA0" />
        </g>
      );
    if (teary) return <path className="pout" d={`M94.6 ${n + 6} Q97.3 ${n + 2.6} 100 ${n + 4.4} Q102.7 ${n + 2.6} 105.4 ${n + 6}`} stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />;
    if (face === 'frio')
      return (
        <g>
          <path d={`M92.6 ${n + 3} q1.85 -2.4 3.7 0 q1.85 2.4 3.7 0 q1.85 -2.4 3.7 0 q1.85 2.4 3.7 0 L107.4 ${n + 8} Q100 ${n + 12} 92.6 ${n + 8} Z`} fill="#A8424E" />
          <path d={`M93.6 ${n + 4.4} q1.6 -1.6 3.2 0 q1.6 1.6 3.2 0 q1.6 -1.6 3.2 0 q1.6 1.6 3.2 0`} stroke="#FFFFFF" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </g>
      );
    if (face === 'calor')
      return (
        <g>
          <path d={`M93.6 ${n + 2} Q100 ${n + 1.4} 106.4 ${n + 2} Q105.4 ${n + 9.5} 100 ${n + 9.5} Q94.6 ${n + 9.5} 93.6 ${n + 2} Z`} fill="#A8424E" />
          <path d={`M96.4 ${n + 6} Q100 ${n + 4.6} 103.6 ${n + 6} L103.4 ${n + 11.5} Q100 ${n + 14} 96.6 ${n + 11.5} Z`} fill="#FF8FA0" />
        </g>
      );
    if (face === 'tedio') return <path d={`M95 ${n + 4} H105`} stroke={INK} strokeWidth="2.2" strokeLinecap="round" />;
    if (face === 'chuva') return <path d={`M95 ${n + 6} Q100 ${n + 2} 105 ${n + 6}`} stroke={INK} strokeWidth="2.2" strokeLinecap="round" fill="none" />;
    if (face === 'medo' || face === 'gripado') return <path d={`M93.4 ${n + 5} q2.2 -2.2 4.4 0 q2.2 2.2 4.4 0 q2.2 -2.2 4.4 0`} stroke={INK} strokeWidth="2.1" strokeLinecap="round" fill="none" />;
    if (laugh) return omega(9.5);
    if (open)
      return (
        <g>
          <ellipse cx="100" cy={n + 6} rx={mood === 'boca' ? 4.6 : 3.4} ry={mood === 'boca' ? 5 : 4} fill="#A23E4B" />
          <ellipse cx="100" cy={n + 8} rx={mood === 'boca' ? 2.8 : 2} ry="1.8" fill="#FF8DA1" />
        </g>
      );
    if (sleepy) return <path d={`M95.5 ${n + 3} Q97.8 ${n + 5.4} 100 ${n + 3.4} Q102.2 ${n + 5.4} 104.5 ${n + 3}`} stroke={INK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />;
    return omega(mood === 'comendo' ? 6 : 7.4);
  };
  const cheek = face === 'frio' ? '#8FB4F0' : face === 'calor' ? '#FF6F6F' : face === 'gripado' ? '#FF8A8A' : blush;
  const cheekOp = face === 'frio' ? 0.55 : face === 'calor' ? 0.55 : face === 'gripado' ? 0.45 : 0.55;
  return (
    <g>
      <g transform={eyeK !== 1 ? `translate(100 ${eyeY}) scale(${eyeK}) translate(-100 ${-eyeY})` : undefined}>{eyes()}</g>
      {/* bochechas rosadas com risquinhos de brilho */}
      {[-1, 1].map((s) => {
        const cx = 100 + s * (ex + 16);
        const cy = eyeY + 13;
        return (
          <g key={s}>
            <ellipse cx={cx} cy={cy} rx="10.5" ry="6.6" fill={cheek} opacity={cheekOp} />
            {face === 'frio' ? (
              <path d={`M${cx - 5} ${cy + 3} l3 -6 M${cx - 1} ${cy + 3} l3 -6 M${cx + 3} ${cy + 3} l3 -6`} stroke="#6E93D6" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
            ) : (
              <path d={`M${cx - 4.6} ${cy + 1.6} l2.2 -3.6 M${cx - 0.6} ${cy + 1.6} l2.2 -3.6`} stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
            )}
          </g>
        );
      })}
      {/* narizinho rosa (vermelhinho quando está gripado) */}
      {face === 'gripado' ? <ellipse cx="100" cy={n - 1.4} rx="5.4" ry="4" fill="#FF6F7E" /> : <ellipse cx="100" cy={n - 0.6} rx="2.6" ry="1.8" fill="#E9899A" />}
      {mouth()}
    </g>
  );
}

/** O objeto da atividade, seguro pelas patinhas (as patinhas são redesenhadas por cima para "segurar"). */
function PropInHands({ prop, cream, paw, line }: { prop?: HamiProp; cream: string; paw: string | null; line: string }) {
  if (!prop || prop === 'fones') return null;
  const paws = (
    <g>
      {[-1, 1].map((s) => (
        <g key={s}>
          <ellipse cx={100 + s * 19} cy="147" rx="8.6" ry="7.8" fill={paw ?? cream} />
          <path d={`M${100 + s * 15.5} 151 v-2.2 M${100 + s * 19.5} 152 v-2.4`} stroke={line} strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
        </g>
      ))}
    </g>
  );
  if (prop === 'livro')
    return (
      <g>
        <g transform="rotate(-5 100 150)">
          <path d="M74 136 Q100 131 126 136 L127 163 Q100 158 73 163 Z" fill="#5B8DEF" />
          <path d="M77 136 Q89 133 100 137 L100 160 Q89 156 77 159 Z" fill="#FFFFFF" />
          <path d="M123 136 Q111 133 100 137 L100 160 Q111 156 123 159 Z" fill="#F7F3EE" />
          <path d="M81 142 Q89 140 96 142 M81 147 Q89 145 96 147 M104 142 Q111 140 119 142 M104 147 Q111 145 119 147" stroke="#C9CDD6" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <path d="M100 137 V160" stroke="#D9DCE4" strokeWidth="1.2" />
        </g>
        {paws}
      </g>
    );
  if (prop === 'desenho')
    return (
      <g>
        <g transform="rotate(4 100 150)">
          <rect x="78" y="132" width="44" height="32" rx="3" fill="#FFFFFF" stroke="#E6E1DA" strokeWidth="1" />
          <path d="M93 146 c-5 -6 -12 0 -6 6 l6 5 l6 -5 c6 -6 -1 -12 -6 -6 Z" fill="#FF8FB1" />
          <path d="M106 142 l8 0 M106 148 l10 0 M107 155 q4 3 8 0" stroke="#7FB8F0" strokeWidth="2" strokeLinecap="round" fill="none" />
        </g>
        <path d="M121 140 L131 128" stroke="#FFC94D" strokeWidth="5" strokeLinecap="round" />
        <path d="M131 128 l2.6 -3.2" stroke="#3B2418" strokeWidth="3" strokeLinecap="round" />
        {paws}
      </g>
    );
  if (prop === 'halteres')
    return (
      <g>
        {[-1, 1].map((s) => (
          <g key={s}>
            <rect x={100 + s * 19 - 12} y="145" width="24" height="4" rx="2" fill="#8E8C97" />
            <rect x={100 + s * 19 - 15} y="139" width="6" height="16" rx="2.5" fill="#FF6F91" />
            <rect x={100 + s * 19 + 9} y="139" width="6" height="16" rx="2.5" fill="#FF6F91" />
          </g>
        ))}
        {paws}
      </g>
    );
  // varinha de bolhas
  return (
    <g>
      <path d="M117 147 L147 131" stroke="#B9A3F0" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="153" cy="127" r="8.5" fill="#DDF3FF" fillOpacity="0.55" stroke="#9B84E6" strokeWidth="2.8" />
      {paws}
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
