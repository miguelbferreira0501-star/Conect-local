// O mascote: o cachorrinho creme de orelhas caramelo, montado em partes recortadas dos desenhos dele
// (cabeça, orelhas, corpo, bracinhos e rabo). Cada parte tem o seu pivô, então ele respira, mexe a cabeça,
// abana o rabo, balança as orelhas e acena de verdade. O rostinho é desenhado no mesmo traço da folha de
// expressões, e as roupas vestem o contorno do corpo dele (com manga nos bracinhos).
import { createContext, useContext, useId, type CSSProperties, type ReactNode } from 'react';
import dogHead from '../assets/dog/dog-cabeca.webp';
import dogBody from '../assets/dog/dog-corpo.webp';
import dogEarL from '../assets/dog/dog-orelhaE.webp';
import dogEarR from '../assets/dog/dog-orelhaD.webp';
import dogArmL from '../assets/dog/dog-bracoE.webp';
import dogArmR from '../assets/dog/dog-bracoD.webp';
import dogTail from '../assets/dog/dog-rabo.webp';
import { LAYERS, PATH_BRACOD, PATH_BRACOE, PATH_CABECA, PATH_CORPO } from './dogRig';
import { furById, type Fur } from '../data/fur';
import { itemById } from '../data/items';
import { NECK_ITEMS, Accessory, AccessoryBack, Cape, Clothes, CostumeBack, CostumeFront, costumeOf, EffectBack, EffectFront, garmentColor, garmentShape, Glasses, Hat, sleeveOf } from './Wear';
import type { Outfit, PetMood } from '../types';
import type { Condition, HamiProp } from '../lib/hamiDay';

/** Tinta do rostinho (olhos, focinho e boca), tirada do desenho. */
export const DOG_INK = '#5B3D2F';
const BLUSH = '#FEB587';

/** Escurece uma cor #rrggbb (para punhos, bainhas e dobras). */
export function shadeHex(hex: string, t: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const c = (sh: number) =>
    Math.round(((n >> sh) & 255) * (1 - t))
      .toString(16)
      .padStart(2, '0');
  return `#${c(16)}${c(8)}${c(0)}`;
}
function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number) {
  const A = rgb(a);
  const B = rgb(b);
  return `#${A.map((v, i) =>
    Math.round(v + (B[i] - v) * t)
      .toString(16)
      .padStart(2, '0'),
  ).join('')}`;
}

/** Tamanho do mascote da pessoa (cresce com os dias de cuidado). O App informa; o padrão é o tamanho máximo. */
export const GrowthContext = createContext(1);
const NO_OUTFIT: Outfit = { chapeu: null, oculos: null, roupa: null, acessorio: null };

export type DogPose = 'tchau' | 'festa' | 'pular' | 'rolar' | 'comer' | 'segurar';

export interface HamsterProps {
  fur: string;
  grams?: number;
  phase?: number;
  mood?: PetMood;
  outfit?: Outfit;
  size?: number;
  idle?: boolean;
  label?: string;
  /** Mascote de outra pessoa (feed, visitas): sempre no tamanho adulto. */
  neutral?: boolean;
  /** Molhado no banho: pelo escurece e pinga. */
  wet?: boolean;
  /** Brilhando depois de escovar ou do banho. */
  shine?: boolean;
  /** Tamanho (0,5 = filhote, 1 = adulto). Sem valor, usa o tamanho atual do mascote da pessoa. */
  growth?: number;
  /** Gesto: 'tchau' acena; 'festa' bate os bracinhos; 'pular' dá pulinhos; 'rolar' deita de lado e se mexe;
   *  'comer' mastiga; 'segurar' junta as patinhas na frente. */
  pose?: DogPose;
  /** Situação do dia (frio, calor, gripado…): muda o rostinho e põe suor, sujeira, nariz vermelho etc. */
  cond?: Condition;
  /** Mostrar o rostinho da situação (desligado enquanto ele reage a um toque). */
  condFace?: boolean;
  /** O que ele segura na atividade (livro, fones, desenho, halteres, varinha de bolhas). */
  prop?: HamiProp;
}

// ---------- Geometria (quadro 0–200; pezinhos em y≈192) ----------
/** Olhos e rosto no desenho. */
const EYE = { l: 69.2, r: 126.2, y: 62.6, rx: 6.25, ry: 8.65 };
const FACE_CX = 97.7;
/** Quadro do rosto para chapéus, óculos, fones e capuz: olhos em 100 ± 25 na altura 80. */
const FACE = { cx: FACE_CX, cy: EYE.y, k: (EYE.r - EYE.l) / 50, eyeY: 80, ex: 25 };
const FACE_T = `translate(${FACE.cx} ${FACE.cy}) scale(${FACE.k}) translate(-100 ${-FACE.eyeY})`;
/** Cabeça (no quadro do rosto) para chapéus e orelhas de fantasia. */
const HEAD_GEO = { top: 36, w: 50, h: 150, eyeY: 80 };
/** Corpo (no quadro normal) para estampas das roupas, capas e efeitos: a gola fica logo abaixo do queixo. */
const BODY_GEO = { top: 10, w: 48, h: 163, eyeY: 62 };
const HEAD = { cx: FACE_CX, cy: 58, rx: 58, top: 12 };
/** Pivôs: pescoço, ombros, base das orelhas e do rabo. */
const PIV = {
  head: [100.4, 106] as const,
  earL: [58, 27] as const,
  earR: [143, 25] as const,
  armL: [62.6, 111] as const,
  armR: [134.6, 110.4] as const,
  tail: [141, 160] as const,
};
/** Barra das roupas: blusas acabam no quadril; vestidos descem mais. */
const HEM_TOP = 'M0 0 H200 V164 C160 170 130 171.5 100 171.5 C70 171.5 40 170 0 164 Z';
const HEM_DRESS = 'M0 0 H200 V185 C160 186 130 187 100 187 C70 187 40 186 0 185 Z';
/** Saia do vestido: abre um pouco para os lados (as perninhas aparecem embaixo). */
const SKIRT = 'M66 146 C60 160 54 172 50 183 Q100 191 150 183 C146 172 140 160 134 146 Z';
/** Mangas: do ombro até o pulso (a patinha fica de fora). */
const SLEEVE = {
  l: 'M20 90 L80 90 L80 126 L56 141.5 L28 128 Z',
  r: 'M120 90 L180 90 L172 128 L142.5 141.5 L118 126 Z',
};
const CUFF = { l: 'M41.5 134.5 Q49 142 58 139.8', r: 'M139.5 139.6 Q148.5 142 156 134' };
/** Patinhas (pontas dos bracinhos), para coisas seguras na mão. */
const PAW = { l: [46, 146.5] as const, r: [151.5, 146.5] as const };
/** Roupas sem manga (o bracinho fica de fora). */
const NO_SLEEVE = new Set(['regata', 'avental', 'jardineira', 'tutu', 'capa', 'avental-costura', 'avental-vendinha', 'colete-obra', 'babado']);

// ---------- Pelagens ----------
/** Cores do cachorro em cada pelagem: corpo, contorno, orelhas/rabo e manchas. A 'caramelo' é o desenho original. */
export function dogColors(fur: Fur): { body: string; line: string; ear: string; patch?: string } | null {
  if (fur.id === 'caramelo') return null;
  const body = fur.body;
  const line = shadeHex(fur.shade, 0.06);
  let ear = shadeHex(fur.shade, 0.3);
  if (fur.pattern === 'panda' || fur.id === 'vaquinha' || fur.id === 'cookies') ear = fur.patch ?? ear;
  else if (fur.pattern === 'manchas') ear = fur.patch ?? ear;
  else if (fur.id === 'creme') ear = '#C98A55';
  else if (fur.id === 'mel') ear = '#A8622C';
  else if (fur.id === 'dourado') ear = '#C9862A';
  else if (fur.id === 'neve') ear = '#E8C9A8';
  return { body, line, ear, patch: fur.patch };
}

/** Filtro que repinta o desenho pela luz de cada pixel: o creme vira a cor do corpo, o contorno vira o tom
 *  do contorno e o caramelo das orelhas vira a cor das orelhas (as sombras e bordas acompanham). */
export function FurFilter({ id, c }: { id: string; c: { body: string; line: string; ear: string } }) {
  const knots: [number, string][] = [
    [0, shadeHex(c.ear, 0.6)],
    [0.53, c.ear],
    [0.64, mix(c.ear, c.line, 0.55)],
    [0.744, c.line],
    [0.936, c.body],
    [1, mix(c.body, '#FFFFFF', 0.35)],
  ];
  const N = 26;
  const at = (L: number) => {
    let i = 0;
    while (i < knots.length - 2 && L > knots[i + 1][0]) i++;
    const [a, ca] = knots[i];
    const [b, cb] = knots[i + 1];
    const t = Math.max(0, Math.min(1, (L - a) / (b - a)));
    return rgb(mix(ca, cb, t));
  };
  const vals = Array.from({ length: N }, (_, i) => at(i / (N - 1)));
  const tv = (ch: number) => vals.map((v) => (v[ch] / 255).toFixed(3)).join(' ');
  return (
    <filter id={id} colorInterpolationFilters="sRGB">
      <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0" />
      <feComponentTransfer>
        <feFuncR type="table" tableValues={tv(0)} />
        <feFuncG type="table" tableValues={tv(1)} />
        <feFuncB type="table" tableValues={tv(2)} />
      </feComponentTransfer>
    </filter>
  );
}

const img = (href: string, key: keyof typeof LAYERS, style?: CSSProperties, filter?: string) => {
  const L = LAYERS[key];
  return <image href={href} x={L.x} y={L.y} width={L.w} height={L.h} preserveAspectRatio="none" style={style} filter={filter} />;
};
const pivot = (p: readonly [number, number]): CSSProperties => ({ transformOrigin: `${p[0]}px ${p[1]}px`, transformBox: 'view-box' });

/**
 * O cachorrinho (mascote do app). As expressões vêm da folha de expressões dele; as roupas vestem o corpo e
 * os bracinhos; chapéus, óculos e fantasias acompanham a cabeça quando ela mexe.
 */
export function Hamster({
  fur: furId,
  mood = 'feliz',
  outfit = NO_OUTFIT,
  size = 180,
  idle = true,
  label,
  neutral,
  wet: wetProp,
  shine,
  growth,
  pose,
  cond,
  condFace = true,
  prop,
  phase = 0,
}: HamsterProps) {
  const wet = wetProp || cond === 'chuva';
  const fur = furById(furId);
  const colors = dogColors(fur);
  const current = useContext(GrowthContext);
  const k = Math.min(1, Math.max(0.4, neutral ? 1 : (growth ?? current)));
  const young = Math.min(1, Math.max(0, (1 - k) / 0.3));
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const asleep = mood === 'dormindo';
  const faceCond = condFace && cond && cond !== 'terra' ? cond : undefined;

  const costume = costumeOf(outfit.roupa);
  const shape = costume ? null : garmentShape(outfit.roupa);
  const garment = costume ? costume.c1 : shape ? garmentColor(outfit.roupa) : (sleeveOf(outfit.roupa) ?? (outfit.roupa ? (itemById(outfit.roupa)?.c1 ?? null) : null));
  const dress = shape === 'dress';
  const holds = (!!prop && prop !== 'fones') || pose === 'segurar';
  const neckItem = !!outfit.acessorio && NECK_ITEMS.has(itemById(outfit.acessorio)?.base ?? outfit.acessorio);
  const sleeve = costume ? costume.c1 : outfit.roupa && !NO_SLEEVE.has(itemById(outfit.roupa)?.base ?? '') ? garment : null;
  const seam = garment ? shadeHex(garment, 0.16) : null;
  const furF = colors ? `url(#f${uid})` : undefined;
  const wetStyle: CSSProperties | undefined = wet ? { filter: 'saturate(0.88) brightness(0.94)' } : undefined;
  const armsBusy = holds || (!!outfit.acessorio && itemById(outfit.acessorio)?.base === 'segurar');
  const happy = !asleep && (mood === 'feliz' || mood === 'animado' || mood === 'risada' || mood === 'comendo' || mood === 'amor' || pose === 'festa' || pose === 'pular' || pose === 'rolar');

  // classes de animação de cada parte
  const armCls = (side: 'l' | 'r') =>
    pose === 'festa' || pose === 'pular'
      ? `dog-arm dog-cheer-${side}`
      : pose === 'rolar'
        ? `dog-arm dog-paddle-${side}`
        : pose === 'tchau'
          ? side === 'l'
            ? 'dog-arm dog-wave'
            : 'dog-arm'
          : holds
            ? `dog-arm dog-hold-${side}`
            : idle && !asleep && !armsBusy
              ? `dog-arm dog-arm-idle-${side}`
              : 'dog-arm';
  const tailCls = asleep ? 'dog-tail' : happy ? 'dog-tail dog-wag-fast' : idle ? 'dog-tail dog-wag' : 'dog-tail';
  const headCls = asleep ? 'dog-head' : pose === 'comer' ? 'dog-head dog-chew' : idle || pose ? 'dog-head dog-head-idle' : 'dog-head';
  const earCls = (side: 'l' | 'r') => (asleep ? 'dog-ear' : pose === 'pular' || pose === 'festa' || pose === 'rolar' ? `dog-ear dog-flap-${side}` : idle ? `dog-ear dog-ear-${side}` : 'dog-ear');
  const bodyCls = pose === 'pular' ? 'dog-hop' : pose === 'rolar' ? 'dog-roll' : idle && !asleep ? 'hami-breathe' : asleep ? 'hami-sleep' : '';

  const clothFill = (children: ReactNode) => (
    <g clipPath={`url(#cb${uid})`}>
      <g clipPath={costume ? undefined : `url(#ch${uid})`}>{children}</g>
    </g>
  );

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={label ?? 'Mascote'} className="block overflow-visible">
      <defs>
        {colors && <FurFilter id={`f${uid}`} c={colors} />}
        <clipPath id={`cb${uid}`}>
          <path d={PATH_CORPO} />
          {dress && <path d={SKIRT} />}
        </clipPath>
        <clipPath id={`ch${uid}`}>
          <path d={dress ? HEM_DRESS : HEM_TOP} />
        </clipPath>
        <clipPath id={`hd${uid}`}>
          <path d={PATH_CABECA} />
        </clipPath>
        {(['l', 'r'] as const).map((s) => (
          <clipPath key={s} id={`a${s}${uid}`}>
            <path d={s === 'l' ? PATH_BRACOE : PATH_BRACOD} />
          </clipPath>
        ))}
        {(['l', 'r'] as const).map((s) => (
          <clipPath key={`s${s}`} id={`sl${s}${uid}`}>
            <path d={SLEEVE[s]} />
          </clipPath>
        ))}
        {/* tudo abaixo do queixo: os colares saem de trás da cabeça */}
        <clipPath id={`n${uid}`}>
          <path d="M0 200 V100 H40 Q100 116 160 100 H200 V200 Z" />
        </clipPath>
        <linearGradient id={`c${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000000" stopOpacity="0.12" />
          <stop offset="0.3" stopColor="#000000" stopOpacity="0" />
          <stop offset="0.7" stopColor="#FFFFFF" stopOpacity="0.08" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.14" />
        </linearGradient>
        <radialGradient id={`g${uid}`}>
          <stop offset="0%" stopColor="#FFE07A" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFE07A" stopOpacity="0" />
        </radialGradient>
        <FabricFilter id={`t${uid}`} />
      </defs>
      <g transform={k < 1 ? `translate(100 192) scale(${k}) translate(-100 -192)` : undefined}>
        {phase >= 3 && <circle cx="100" cy="104" r="96" fill={`url(#g${uid})`} />}
        <EffectBack id={outfit.efeito} geo={BODY_GEO} uid={uid} />
        <ellipse className={pose === 'pular' ? 'dog-hop-shadow' : undefined} cx="100" cy="192.5" rx="48" ry="5" fill="rgba(60,30,40,0.14)" />
        <g className={bodyCls} style={{ transformOrigin: '100px 192px' }}>
          <g filter={`url(#t${uid})`}>
            <Cape id={outfit.roupa} geo={BODY_GEO} />
            <AccessoryBack id={outfit.acessorio} geo={BODY_GEO} />
          </g>

          {/* rabo (atrás do corpo) */}
          <g className={tailCls} style={pivot(PIV.tail)}>
            {img(dogTail, 'rabo', wetStyle, furF)}
          </g>

          {/* corpo */}
          {img(dogBody, 'corpo', wetStyle, furF)}
          {fur.pattern === 'manchas' && fur.patch && (
            <g clipPath={`url(#cb${uid})`} fill={fur.patch} opacity="0.9">
              <ellipse cx="80" cy="150" rx="9" ry="7.5" transform="rotate(-20 80 150)" />
              <ellipse cx="121" cy="133" rx="7" ry="6" />
              <ellipse cx="112" cy="176" rx="6" ry="4.5" />
            </g>
          )}

          {/* roupa vestindo o corpo, com cara de tecido */}
          {outfit.roupa && (
            <g filter={`url(#t${uid})`}>
              {clothFill(
                <g>
                  {garment && <rect x="0" y="80" width="200" height="120" fill={garment} />}
                  <Clothes id={outfit.roupa} geo={costume ? { top: 10, w: 60, h: 163, eyeY: 62, hole: { cx: FACE_CX, cy: 70, rx: 47, ry: 28 } } : BODY_GEO} />
                  <rect x="0" y="80" width="200" height="120" fill={`url(#c${uid})`} />
                </g>,
              )}
            </g>
          )}
          {outfit.roupa && garment && (
            <g clipPath={`url(#cb${uid})`}>
              {/* contorno e bainha da roupa, um tom mais escuro */}
              <g clipPath={costume ? undefined : `url(#ch${uid})`}>
                <path d={PATH_CORPO} fill="none" stroke={seam ?? garment} strokeWidth="4.4" />
                {dress && <path d={SKIRT} fill="none" stroke={seam ?? garment} strokeWidth="4.4" />}
              </g>
              {!costume && <path d={dress ? 'M0 185 C40 186 70 187 100 187 C130 187 160 186 200 185' : 'M0 164 C40 170 70 171.5 100 171.5 C130 171.5 160 170 200 164'} fill="none" stroke={seam ?? garment} strokeWidth="2.6" />}
              {/* sombrinha do queixo na roupa */}
              <ellipse cx="100" cy="108" rx="34" ry="6" fill="#5A2E14" opacity="0.1" />
            </g>
          )}

          {cond === 'terra' && (
            <g fill="#8A5A3B" opacity="0.4">
              <ellipse cx="78" cy="160" rx="7" ry="4.5" />
              <ellipse cx="118" cy="176" rx="6" ry="4" />
              <circle cx="128" cy="140" r="3" />
            </g>
          )}
          <PropInHands prop={pose === 'segurar' ? undefined : prop} />

          {/* bracinhos (com manga, se a roupa tiver) */}
          {(['l', 'r'] as const).map((s) => (
            <g key={s} className={armCls(s)} style={pivot(s === 'l' ? PIV.armL : PIV.armR)}>
              {img(s === 'l' ? dogArmL : dogArmR, s === 'l' ? 'bracoE' : 'bracoD', wetStyle, furF)}
              {sleeve && (
                <g clipPath={`url(#a${s}${uid})`}>
                  <g clipPath={`url(#sl${s}${uid})`} filter={`url(#t${uid})`}>
                    <rect x="20" y="90" width="160" height="70" fill={sleeve} />
                    <path d={s === 'l' ? PATH_BRACOE : PATH_BRACOD} fill="none" stroke={shadeHex(sleeve, 0.16)} strokeWidth="4.4" />
                  </g>
                  <path d={CUFF[s]} fill="none" stroke={shadeHex(sleeve, 0.2)} strokeWidth="3.2" strokeLinecap="round" />
                </g>
              )}
            </g>
          ))}

          {/* cabeça: rostinho, orelhas, chapéu e óculos acompanham */}
          <g className={headCls} style={pivot(PIV.head)}>
            {img(dogHead, 'cabeca', wetStyle, furF)}
            {fur.pattern === 'manchas' && fur.patch && (
              <g clipPath={`url(#hd${uid})`} fill={fur.patch} opacity="0.9">
                <ellipse cx="131" cy="56" rx="17" ry="15" transform="rotate(18 131 56)" />
              </g>
            )}
            {fur.pattern === 'panda' && fur.patch && (
              <g fill={fur.patch} opacity="0.92">
                <ellipse cx={EYE.l} cy={EYE.y + 1} rx="12" ry="14" transform={`rotate(20 ${EYE.l} ${EYE.y})`} />
                <ellipse cx={EYE.r} cy={EYE.y + 1} rx="12" ry="14" transform={`rotate(-20 ${EYE.r} ${EYE.y})`} />
              </g>
            )}
            {wet && <path d={PATH_CABECA} fill="#5B8FD6" opacity="0.07" />}
            <DogFace mood={mood} cond={faceCond} young={young} light={fur.pattern === 'panda'} />
            {/* orelhas (por cima da cabeça, escondidas no capuz da fantasia) */}
            {!costume &&
              (['l', 'r'] as const).map((s) => (
                <g key={s} className={earCls(s)} style={pivot(s === 'l' ? PIV.earL : PIV.earR)}>
                  {img(s === 'l' ? dogEarL : dogEarR, s === 'l' ? 'orelhaE' : 'orelhaD', wetStyle, furF)}
                </g>
              ))}
            {cond === 'gripado' && condFace && <SickProps />}
            <g filter={`url(#t${uid})`}>
              {costume && (
                <path d={PATH_CABECA} fill={costume.c1} />
              )}
              <g transform={FACE_T}>
                {costume && <CostumeBack id={outfit.roupa} geo={{ ...HEAD_GEO, top: 33, w: 60 }} />}
              </g>
            </g>
            {costume && (
              <g>
                {/* abertura do capuz: o rostinho aparece */}
                <clipPath id={`fh${uid}`}>
                  <ellipse cx={FACE_CX} cy="70" rx="46" ry="29" />
                </clipPath>
                <g clipPath={`url(#fh${uid})`}>
                  {img(dogHead, 'cabeca', wetStyle, furF)}
                  <DogFace mood={mood} cond={faceCond} young={young} light={false} />
                </g>
                <ellipse cx={FACE_CX} cy="70" rx="46" ry="29" fill="none" stroke={shadeHex(costume.c1, 0.18)} strokeWidth="3" />
              </g>
            )}
            <g filter={`url(#t${uid})`}>
              <g transform={FACE_T}>
                <CostumeFront id={outfit.roupa} geo={HEAD_GEO} />
                <Glasses id={outfit.oculos} eyeY={FACE.eyeY} ex={FACE.ex} />
                <Hat id={outfit.chapeu} geo={HEAD_GEO} />
                {prop === 'fones' && (
                  <g>
                    <path d={`M44 ${FACE.eyeY - 4} C42 ${HEAD_GEO.top - 22} 158 ${HEAD_GEO.top - 22} 156 ${FACE.eyeY - 4}`} stroke="#5B6BD6" strokeWidth="5.5" strokeLinecap="round" fill="none" />
                    {[-1, 1].map((sd) => (
                      <g key={sd}>
                        <rect x={100 + sd * 56 - 8} y={FACE.eyeY - 16} width="16" height="22" rx="8" fill="#FF8FB1" />
                        <rect x={100 + sd * 56 - 5} y={FACE.eyeY - 13} width="10" height="16" rx="5" fill="#FFFFFF" opacity="0.45" />
                      </g>
                    ))}
                  </g>
                )}
              </g>
            </g>
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
                  d={`M${HEAD.cx + sd * (HEAD.rx - 10)} ${HEAD.top + 26 + dy * 40} q-4 7 0 10.5 q4 -3.5 0 -10.5 Z`}
                  fill="#BFE6FF"
                  stroke="#7CC4F0"
                  strokeWidth="1"
                />
              ))}
            {wet &&
              [
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
                  d={`M${HEAD.cx + dx * HEAD.rx} ${HEAD.top + 12 + dy * 80} q-3.5 6 0 9 q3.5 -3 0 -9 Z`}
                  fill="#8FD0FF"
                  stroke="#5BA9E8"
                  strokeWidth="0.8"
                />
              ))}
          </g>

          {/* colares no pescoço e coisinhas na patinha */}
          <g filter={`url(#t${uid})`}>
            <g clipPath={neckItem ? `url(#n${uid})` : undefined}>
              <Accessory id={outfit.acessorio} geo={{ top: 93.5, h: 64, w: neckItem ? 44 : 52.6, eyeY: 62 }} paw="#FDEBD2" head={{ cx: 99, cy: 62, rx: 50, ry: 43 }} />
            </g>
          </g>
          {shine && (
            <g fill="#FFF3A6">
              <path className="sparkle" d={`M${HEAD.cx - HEAD.rx - 4} ${HEAD.top + 34} l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 Z`} />
              <path className="sparkle" style={{ animationDelay: '0.5s' }} d={`M${HEAD.cx + HEAD.rx + 4} ${HEAD.top + 74} l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z`} />
              <path className="sparkle" style={{ animationDelay: '1s' }} d={`M${HEAD.cx + 30} ${HEAD.top - 2} l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z`} />
            </g>
          )}
          {phase >= 3 && <Sparkles top={HEAD.top} w={HEAD.rx} />}
          <EffectFront id={outfit.efeito} geo={BODY_GEO} />
        </g>
      </g>
      <MoodMarks mood={mood} />
    </svg>
  );
}

/**
 * Acabamento de tecido para roupas e acessórios: textura de feltro bem fininha, volume macio nas bordas
 * (como pano estofado) e uma sombrinha leve.
 */
export function FabricFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3.2" result="blur" />
      <feDiffuseLighting in="blur" surfaceScale="3" diffuseConstant="1" lightingColor="#FFFFFF" result="light">
        <feDistantLight azimuth="235" elevation="58" />
      </feDiffuseLighting>
      <feComposite in="SourceGraphic" in2="light" operator="arithmetic" k1="0.92" k2="0.2" k3="0" k4="0" result="lit" />
      <feSpecularLighting in="blur" surfaceScale="3" specularConstant="0.42" specularExponent="22" lightingColor="#FFFFFF" result="spec">
        <feDistantLight azimuth="235" elevation="58" />
      </feSpecularLighting>
      <feComposite in="lit" in2="spec" operator="arithmetic" k1="0" k2="1" k3="0.22" k4="0" result="shiny" />
      <feComposite in="shiny" in2="SourceAlpha" operator="in" result="fabric" />
      <feDropShadow in="fabric" dx="0" dy="1.4" stdDeviation="1.4" floodColor="#5A2E14" floodOpacity="0.22" />
    </filter>
  );
}

// ---------- Rostinho ----------
const SW = 3.7;
const NOSE = 'M94.7 69.6 C92.6 68.8 91.6 67.6 91.6 66.2 C91.6 63.9 94.3 62.8 97.4 62.8 C100.5 62.8 102.3 64 102.3 65.9 C102.3 67.4 101.2 68.8 99.2 69.5 C98.1 69.9 95.8 70 94.7 69.6 Z';
const OMEGA = 'M84.1 70.6 C84.1 75.2 86.6 77.2 89.2 77.2 C92.4 77.2 95.6 75.8 97 73.6 C98.4 75.8 101.2 77.2 104 77.2 C107 77.2 110.1 75.2 110.1 70.6';
const STEM = 'M97 68.6 V73.6';

/** Olhinho de bolinha com o brilho embaixo (o do desenho). */
function DotEye({ x, k = 1, y = EYE.y }: { x: number; k?: number; y?: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx={EYE.rx * k} ry={EYE.ry * k} fill={DOG_INK} />
      <circle cx={x + 0.3 * k} cy={y + 4.4 * k} r={1.95 * k} fill="#FFFFFF" />
    </g>
  );
}
const heart = (x: number, y: number, s: number) =>
  `M${x} ${y + 9 * s} C${x - 14 * s} ${y - 1 * s} ${x - 9 * s} ${y - 11 * s} ${x} ${y - 4 * s} C${x + 9 * s} ${y - 11 * s} ${x + 14 * s} ${y - 1 * s} ${x} ${y + 9 * s} Z`;

function DogFace({ mood, cond, young, light }: { mood: PetMood; cond?: Condition; young: number; light: boolean }) {
  const sleepy = mood === 'sono' || mood === 'dormindo';
  const cry = mood === 'choro';
  const sad = mood === 'manha';
  const face = cond && !sleepy && !cry && !sad ? cond : null;
  const laugh = !face && (mood === 'animado' || mood === 'risada');
  const open = !face && (mood === 'surpreso' || mood === 'boca');
  const calm = !face && mood === 'calmo';
  const love = !face && mood === 'amor';
  const eat = !face && mood === 'comendo';
  const k = 1 + young * 0.1;
  const line = { stroke: DOG_INK, strokeWidth: SW, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const xs = [EYE.l, EYE.r];
  const y = EYE.y;

  const eyes = () => {
    if (cry || laugh || face === 'frio')
      // > <
      return (
        <g {...line} strokeWidth={SW + 0.3}>
          <path d={`M${EYE.l - 6} ${y - 6.5} L${EYE.l + 5} ${y} L${EYE.l - 6} ${y + 6.5}`} />
          <path d={`M${EYE.r + 6} ${y - 6.5} L${EYE.r - 5} ${y} L${EYE.r + 6} ${y + 6.5}`} />
        </g>
      );
    if (sleepy)
      // ︶ ︶ (olhinhos fechados de sono)
      return <g {...line}>{xs.map((x) => <path key={x} d={`M${x - 7.5} ${y - 0.5} Q${x} ${y + 7} ${x + 7.5} ${y - 0.5}`} />)}</g>;
    if (calm)
      // ^ ^ (fechadinhos de alegria)
      return <g {...line}>{xs.map((x) => <path key={x} d={`M${x - 7.5} ${y + 3} Q${x} ${y - 7} ${x + 7.5} ${y + 3}`} />)}</g>;
    if (love)
      return (
        <g className="dog-heart-eyes">
          {xs.map((x) => (
            <g key={x}>
              <path d={heart(x, y - 1.5, 1)} fill="#E8504C" />
              <ellipse cx={x - 4.2} cy={y - 4.6} rx="2.4" ry="1.6" fill="#FFFFFF" opacity="0.55" />
            </g>
          ))}
        </g>
      );
    if (open || face === 'medo' || face === 'chuva')
      return (
        <g className="pet-eyes">
          {xs.map((x) => (
            <g key={x}>
              <ellipse cx={x} cy={y} rx={5.6} ry={6.6} fill={DOG_INK} />
              <circle cx={x + 1.3} cy={y - 2.3} r="1.9" fill="#FFFFFF" />
            </g>
          ))}
        </g>
      );
    if (sad || face === 'gripado' || face === 'saudade')
      // olhinhos caídos (pálpebra inclinada para fora)
      return (
        <g>
          {xs.map((x, i) => {
            const s = i === 0 ? -1 : 1;
            const id = `sad${i}`;
            return (
              <g key={x}>
                <clipPath id={id}>
                  <path d={`M${x - 12} ${y - 2 + (s < 0 ? 1 : -6)} L${x + 12} ${y - 2 + (s < 0 ? -6 : 1)} L${x + 12} ${y + 14} L${x - 12} ${y + 14} Z`} />
                </clipPath>
                <ellipse cx={x} cy={y + 0.5} rx={EYE.rx} ry={EYE.ry - 0.6} fill={DOG_INK} clipPath={`url(#${id})`} />
                <circle cx={x - s * 1.6} cy={y + 4} r="1.6" fill="#FFFFFF" />
              </g>
            );
          })}
          {sad && <path className="tear-drop" d={`M${EYE.r + 6} ${y + 7} q-3 5 0 7.6 q3 -2.6 0 -7.6 Z`} fill="#8FD0FF" stroke="#5BA9E8" strokeWidth="0.8" />}
        </g>
      );
    if (face === 'tedio' || face === 'calor')
      // meio fechados
      return (
        <g>
          {xs.map((x) => (
            <g key={x}>
              <path d={`M${x - 6.4} ${y} A6.4 7.4 0 0 0 ${x + 6.4} ${y} Z`} fill={DOG_INK} />
              <path d={`M${x - 8} ${y - 0.4} H${x + 8}`} {...line} strokeWidth="3" />
            </g>
          ))}
        </g>
      );
    return (
      <g className="dog-blink" style={{ transformOrigin: `${FACE_CX}px ${y}px`, transformBox: 'view-box' }}>
        {xs.map((x) => (
          <DotEye key={x} x={x} k={k} />
        ))}
      </g>
    );
  };

  const mouth = () => {
    if (laugh)
      return (
        <g>
          <path d="M89 72.5 C89 84 92.6 88.6 97 88.6 C101.4 88.6 105 84 105 72.5 C102.5 74.4 100 75 97 73.8 C94 75 91.5 74.4 89 72.5 Z" fill="#B24A44" />
          <path d="M91.6 80.6 C93 78 101 78 102.4 80.6 C102 85.6 99.6 87.4 97 87.4 C94.4 87.4 92 85.6 91.6 80.6 Z" fill="#F58C8E" />
          <path d={OMEGA} {...line} />
          <path d={STEM} {...line} />
        </g>
      );
    if (cry || face === 'chuva')
      return <path d="M89.5 77.6 Q97 70.6 104.5 77.6" {...line} />;
    if (open || face === 'medo')
      return (
        <g>
          <ellipse cx="97" cy="78.6" rx={mood === 'boca' ? 5.6 : 4.8} ry={mood === 'boca' ? 6.2 : 5.4} fill="#C9474D" />
          <ellipse cx="97" cy="80.2" rx="2.8" ry="2.6" fill="#F7848A" />
        </g>
      );
    if (face === 'calor')
      return (
        <g>
          <path d={OMEGA} {...line} />
          <path d="M93.4 76 C93.4 84 95 86.6 97 86.6 C99 86.6 100.6 84 100.6 76 Z" fill="#F58C8E" stroke="#B24A44" strokeWidth="1.2" />
        </g>
      );
    if (face === 'tedio') return <path d="M90 75 H104" {...line} />;
    if (face === 'frio')
      return <path d="M86.6 75.6 q2.6 -2.8 5.2 0 q2.6 2.8 5.2 0 q2.6 -2.8 5.2 0 q2.6 2.8 5.2 0" {...line} strokeWidth="3" />;
    if (sad || sleepy || face === 'saudade' || face === 'gripado')
      return (
        <g transform="translate(97 72) scale(0.72) translate(-97 -72)">
          <path d={OMEGA} {...line} />
          <path d={STEM} {...line} />
        </g>
      );
    if (eat)
      return (
        <g className="dog-chomp" style={{ transformOrigin: '97px 74px', transformBox: 'view-box' }}>
          <path d={OMEGA} {...line} />
          <path d={STEM} {...line} />
        </g>
      );
    return (
      <g>
        <path d={OMEGA} {...line} />
        <path d={STEM} {...line} />
      </g>
    );
  };

  const cheek = face === 'frio' ? '#9EC2F5' : face === 'calor' || face === 'gripado' ? '#FF8A7A' : BLUSH;
  return (
    <g>
      {/* bochechas */}
      <ellipse cx="58" cy="75.2" rx="11.6" ry="13" fill={cheek} opacity={face === 'frio' ? 0.75 : 1} />
      <ellipse cx="137.3" cy="74.7" rx="11.6" ry="13.1" fill={cheek} opacity={face === 'frio' ? 0.75 : 1} />
      {light ? (
        <g>
          {xs.map((x) => (
            <ellipse key={x} cx={x} cy={y} rx={EYE.rx + 1.6} ry={EYE.ry + 1.6} fill="#FFFFFF" />
          ))}
          {eyes()}
        </g>
      ) : (
        eyes()
      )}
      {/* focinho */}
      <path d={NOSE} fill={face === 'gripado' ? '#E0605E' : DOG_INK} />
      {mouth()}
      {cry &&
        [-1, 1].map((s) => {
          const x = s < 0 ? EYE.l + 1 : EYE.r - 1;
          return (
            <g key={s}>
              <path d={`M${x - 3.6} ${y + 6} L${x - 4.4} ${y + 44} L${x + 4.4} ${y + 44} L${x + 3.6} ${y + 6} Z`} fill="#A8D8F5" />
              <path className="tear-flow" d={`M${x} ${y + 7} V${y + 43}`} stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
              <path d={`M${x - 3.6} ${y + 6} L${x - 4.4} ${y + 44} M${x + 3.6} ${y + 6} L${x + 4.4} ${y + 44}`} stroke="#6FB6E6" strokeWidth="1.4" />
            </g>
          );
        })}
      {face === 'frio' && (
        <g stroke="#6E93D6" strokeWidth="1.4" strokeLinecap="round" opacity="0.8">
          <path d="M53 79 l3 -6 M57 79 l3 -6 M61 79 l3 -6" />
          <path d="M132 79 l3 -6 M136 79 l3 -6 M140 79 l3 -6" />
        </g>
      )}
    </g>
  );
}

/** Marcas em cima da cabeça (zZ de sono, !! de susto, corações de amor) — iguais às da folha de expressões. */
function MoodMarks({ mood }: { mood: PetMood }) {
  if (mood === 'dormindo' || mood === 'sono')
    return (
      <g className="zzz" fill="none" stroke="#7FB0EE" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        {mood === 'dormindo' && <path d="M138 16 h7 l-7 8 h7" />}
        <path d="M150 6 h8.5 l-8.5 10 h8.5" />
        {mood === 'dormindo' && <path d="M163 -6 h11 l-11 13 h11" strokeWidth="3.6" />}
      </g>
    );
  if (mood === 'surpreso')
    return (
      <g fill="#FFC53D" className="sparkle">
        <path d="M146 6 L153 4 L150 24 L145 24 Z" />
        <path d="M160 12 L166 16 L155 30 L151 27 Z" />
      </g>
    );
  if (mood === 'amor')
    return (
      <g fill="#FF7A8E" className="dog-float-hearts">
        <path d={heart(150, 8, 0.7)} />
        <path d={heart(163, 22, 0.5)} />
      </g>
    );
  return null;
}

/** Gripado: bolsa de gelo na cabeça e termômetro na boca. */
function SickProps() {
  return (
    <g>
      <g transform="translate(97 13)">
        <ellipse cx="0" cy="6" rx="26" ry="10" fill="#A9D4F2" stroke="#7FB4DE" strokeWidth="2.4" />
        <ellipse cx="0" cy="-4" rx="9" ry="4.5" fill="#A9D4F2" stroke="#7FB4DE" strokeWidth="2.4" />
        <ellipse cx="-8" cy="3" rx="7" ry="2.4" fill="#FFFFFF" opacity="0.6" />
      </g>
      <g transform="rotate(-38 108 78)">
        <rect x="104" y="74" width="26" height="6" rx="3" fill="#F4F6F9" stroke="#C9CFD8" strokeWidth="1.4" />
        <rect x="108" y="76" width="14" height="2.2" rx="1.1" fill="#F0525F" />
        <circle cx="128" cy="77" r="4.2" fill="#F0525F" stroke="#C9CFD8" strokeWidth="1.2" />
      </g>
    </g>
  );
}

/** O objeto da atividade, seguro entre as patinhas (os bracinhos ficam por cima dele). */
function PropInHands({ prop }: { prop?: HamiProp }) {
  if (!prop || prop === 'fones') return null;
  if (prop === 'livro')
    return (
      <g transform="rotate(-4 99 146)">
        <path d="M66 132 Q99 125 132 132 L133 160 Q99 153 65 160 Z" fill="#5B8DEF" />
        <path d="M70 132 Q85 128 99 133 L99 156 Q85 151 70 155 Z" fill="#FFFFFF" />
        <path d="M128 132 Q113 128 99 133 L99 156 Q113 151 128 155 Z" fill="#F7F3EE" />
        <path d="M75 139 Q86 136 94 139 M75 145 Q86 142 94 145 M104 139 Q113 136 123 139 M104 145 Q113 142 123 145" stroke="#C9CDD6" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M99 133 V156" stroke="#D9DCE4" strokeWidth="1.2" />
      </g>
    );
  if (prop === 'desenho')
    return (
      <g>
        <g transform="rotate(4 99 146)">
          <rect x="68" y="128" width="62" height="38" rx="4" fill="#FFFFFF" stroke="#E6E1DA" strokeWidth="1" />
          <path d="M88 146 c-6 -7 -15 0 -7 7 l7 6 l7 -6 c8 -7 -1 -14 -7 -7 Z" fill="#FF8FB1" />
          <path d="M104 140 l14 0 M104 147 l15 0 M105 156 q6 4 12 0" stroke="#7FB8F0" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </g>
        <path d="M130 150 L144 130" stroke="#FFC94D" strokeWidth="5" strokeLinecap="round" />
        <path d="M144 130 l2.6 -3.4" stroke="#3B2418" strokeWidth="3" strokeLinecap="round" />
      </g>
    );
  if (prop === 'halteres')
    return (
      <g>
        {[73, 125].map((x) => (
          <g key={x}>
            <rect x={x - 13} y="142" width="26" height="5" rx="2.5" fill="#8E8C97" />
            <rect x={x - 17} y="134" width="7" height="21" rx="3" fill="#7A5AE0" />
            <rect x={x + 10} y="134" width="7" height="21" rx="3" fill="#7A5AE0" />
          </g>
        ))}
      </g>
    );
  return (
    <g>
      <path d="M126 148 L152 126" stroke="#B9A3F0" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="158" cy="121" r="9" fill="#DDF3FF" fillOpacity="0.55" stroke="#9B84E6" strokeWidth="2.8" />
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

export { PAW as DOG_PAWS };
