import { createContext, useContext, useId, type CSSProperties } from 'react';
import hamiFurMask from '../assets/hami/hami-pelo.webp';
import hamiBody from '../assets/hami/hami-corpo.webp';
import hamiBodyBlank from '../assets/hami/hami-corpo-sem-rosto.webp';
import hamiArmL from '../assets/hami/hami-braco-l.webp';
import hamiArmR from '../assets/hami/hami-braco-r.webp';
import { furById } from '../data/fur';
import { itemById } from '../data/items';
import { NECK_ITEMS, Accessory, AccessoryBack, Cape, Clothes, CostumeBack, CostumeFront, costumeOf, EffectBack, EffectFront, garmentColor, garmentShape, Glasses, Hat, sleeveOf } from './Wear';
import type { Outfit, PetMood } from '../types';
import type { Condition, HamiProp } from '../lib/hamiDay';

const INK = '#3B2418';

/** Escurece uma cor #rrggbb (para punhos e dobras). */
function shadeHex(hex: string, t: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const c = (sh: number) =>
    Math.round(((n >> sh) & 255) * (1 - t))
      .toString(16)
      .padStart(2, '0');
  return `#${c(16)}${c(8)}${c(0)}`;
}

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
  /** Gesto dos bracinhos: 'tchau' levanta e acena; 'festa' bate os dois de alegria (no carinho). */
  pose?: 'tchau' | 'festa';
  /** Situação do dia (frio, calor, gripado…): muda o rostinho e põe suor, sujeira, nariz vermelho etc. */
  cond?: Condition;
  /** Mostrar o rostinho da situação (desligado enquanto ele reage a um toque). */
  condFace?: boolean;
  /** O que ele segura na atividade (livro, fones, desenho, halteres, varinha de bolhas). */
  prop?: HamiProp;
}

// ---------- O Hami realista (foto) ----------
// A foto fica no quadro 0–200: pezinhos em y≈192, centro do corpo em x≈99.
const IMG = { x: 27.8, y: 14, w: 144.4, h: 180 };
/** Quadro do rosto: os olhos da foto ficam em (72, 77) e (132, 81), levemente inclinados. Dentro dele o rosto é "reto",
 *  com os olhos em 100 ± 25 e na altura 80 — é onde desenhamos expressões, óculos e chapéus. */
const FACE = { cx: 101.9, cy: 78.8, rot: 4.2, k: 1.2, eyeY: 80, ex: 25 };
const FACE_T = `translate(${FACE.cx} ${FACE.cy}) rotate(${FACE.rot}) scale(${FACE.k}) translate(-100 ${-FACE.eyeY})`;
/** Cabeça (no quadro do rosto) para chapéus, orelhas de fantasia e fones. */
const HEAD_GEO = { top: 40, w: 46, h: 150, eyeY: 70 };
/** Corpo (no quadro normal) para roupas, colares, capas e efeitos. */
const BODY_GEO = { top: 30, w: 52, h: 163, eyeY: 72 };
/** Contorno da barriga (logo abaixo do queixo até em cima dos pezinhos), tirado da foto até a pontinha do pelo:
 *  as roupas vestem este contorno e cobrem o corpo todo, sem sobrar pelo dos lados. */
const BODY =
  'M49.5 123.0 C49.5 123.0 65.8 125.8 74.0 126.6 C82.2 127.4 90.7 128.0 99.0 128.0 C107.3 128.0 115.5 127.4 124.0 126.6 C132.5 125.8 150.0 123.0 150.0 123.0 C150.0 123.0 150.2 124.8 150.8 126.0 C151.4 127.2 153.0 128.7 153.8 130.0 C154.6 131.3 155.3 132.7 155.8 134.0 C156.3 135.3 156.8 136.7 157.0 138.0 C157.2 139.3 156.9 140.7 156.8 142.0 C156.7 143.3 156.7 144.7 156.6 146.0 C156.5 147.3 156.2 148.7 156.2 150.0 C156.2 151.3 156.3 152.7 156.4 154.0 C156.5 155.3 156.7 156.7 156.6 158.0 C156.5 159.3 156.2 160.7 155.8 162.0 C155.4 163.3 154.8 164.7 154.2 166.0 C153.6 167.3 152.8 168.7 152.0 170.0 C151.2 171.3 150.2 172.7 149.2 174.0 C148.2 175.3 147.4 176.8 146.0 178.0 C142.0 179.3 132.8 180.8 125.0 181.6 C117.2 182.4 107.7 182.6 99.0 182.6 C90.3 182.6 80.8 182.4 73.0 181.6 C65.2 180.8 55.8 179.3 52.0 178.0 C50.6 176.8 50.8 175.3 50.0 174.0 C49.2 172.7 47.9 171.3 47.0 170.0 C46.1 168.7 45.2 167.3 44.6 166.0 C44.0 164.7 43.6 163.3 43.2 162.0 C42.8 160.7 42.4 159.3 42.2 158.0 C42.0 156.7 42.1 155.3 42.0 154.0 C41.9 152.7 41.8 151.3 41.6 150.0 C41.4 148.7 40.9 147.3 40.8 146.0 C40.7 144.7 40.8 143.3 40.8 142.0 C40.8 140.7 40.6 139.3 40.8 138.0 C41.0 136.7 41.3 135.3 41.8 134.0 C42.3 132.7 42.9 131.3 43.6 130.0 C44.3 128.7 45.0 127.2 46.0 126.0 C47.0 124.8 49.5 123.0 49.5 123.0 Z';
const DRESS =
  'M49.5 123.0 C49.5 123.0 65.8 125.8 74.0 126.6 C82.2 127.4 90.7 128.0 99.0 128.0 C107.3 128.0 115.5 127.4 124.0 126.6 C132.5 125.8 150.0 123.0 150.0 123.0 C150.0 123.0 150.2 124.8 150.8 126.0 C151.4 127.2 153.0 128.7 153.8 130.0 C154.6 131.3 155.3 132.7 155.8 134.0 C156.3 135.3 156.8 136.7 157.0 138.0 C157.2 139.3 156.9 140.7 156.8 142.0 C156.7 143.3 156.6 144.7 156.6 146.0 C156.6 147.3 156.4 148.3 156.6 150.0 C156.8 151.7 157.3 153.7 157.6 156.0 C157.9 158.3 158.3 161.3 158.6 164.0 C158.9 166.7 159.2 169.0 159.4 172.0 C159.6 175.0 160.0 182.0 160.0 182.0 C160.0 182.0 140.2 185.3 130.0 186.2 C119.8 187.1 109.3 187.2 99.0 187.2 C88.7 187.2 78.2 187.1 68.0 186.2 C57.8 185.3 38.0 182.0 38.0 182.0 C38.0 182.0 38.4 175.0 38.6 172.0 C38.8 169.0 39.1 166.7 39.4 164.0 C39.7 161.3 40.1 158.3 40.4 156.0 C40.7 153.7 41.3 151.7 41.4 150.0 C41.5 148.3 40.9 147.3 40.8 146.0 C40.7 144.7 40.8 143.3 40.8 142.0 C40.8 140.7 40.6 139.3 40.8 138.0 C41.0 136.7 41.3 135.3 41.8 134.0 C42.3 132.7 42.9 131.3 43.6 130.0 C44.3 128.7 45.0 127.2 46.0 126.0 C47.0 124.8 49.5 123.0 49.5 123.0 Z';
/** Cabeça inteira com as orelhas (para o capuz das fantasias e efeitos na cabeça). */
const HOOD = 'M99 20 C141 20 169 42 167 76 C166 104 148 124 99 127 C50 124 32 104 31 76 C29 42 57 20 99 20 Z';
/** Corpo inteiro da fantasia (até os pezinhos). */
const SUIT = 'M50 122 Q99 132 148 122 C156 130 158 142 157.5 152 C157 165 152 176 140 183 C126 190 112 191 99 191 C86 191 72 190 58 183 C46 176 41 165 40.5 152 C40 142 42 130 50 122 Z';
const HEAD = { cx: 99, cy: 76, rx: 66, ry: 48, top: 27 };
/** As patinhas brancas da foto: são redesenhadas por cima das roupas e dos objetos (saindo da manga). */
const PAWS = [
  { cx: 59.6, cy: 141.6, rx: 9.6, ry: 10.4 },
  { cx: 138.6, cy: 142, rx: 9.6, ry: 10.4 },
];
/** Os bracinhos (recortados da foto, contorno liso tirado da própria foto) giram no ombro; a manga segue esse contorno. */
const ARM_L =
  'M52.8 120.1 C51.8 120.3 51.3 121.6 50.4 122.5 C49.5 123.5 48.4 124.7 47.6 125.8 C46.7 126.8 45.9 127.8 45.1 128.9 C44.4 130.0 43.4 131.2 43.0 132.5 C42.6 133.7 42.5 135.1 42.6 136.4 C42.8 137.6 43.3 138.7 43.9 140.0 C44.5 141.3 45.2 142.8 46.1 144.2 C46.9 145.6 47.8 147.2 48.9 148.5 C50.1 149.8 51.6 151.0 53.0 151.8 C54.4 152.6 55.9 152.8 57.2 153.2 C58.5 153.6 59.6 154.0 60.8 154.0 C62.0 154.0 63.2 153.5 64.4 152.9 C65.7 152.3 67.6 151.5 68.5 150.4 C69.5 149.3 69.7 147.7 70.2 146.4 C70.7 145.1 71.5 143.8 71.6 142.6 C71.7 141.3 71.0 140.3 70.8 139.0 C70.5 137.7 70.5 136.2 70.0 134.8 C69.5 133.4 68.7 132.0 67.8 130.6 C66.9 129.2 65.7 127.6 64.5 126.4 C63.3 125.2 61.9 124.4 60.6 123.6 C59.3 122.7 57.7 121.9 56.4 121.4 C55.1 120.8 53.8 119.9 52.8 120.1 Z';
const ARM_R =
  'M143.6 120.1 C142.4 120.3 141.2 121.5 139.8 122.3 C138.4 123.0 136.7 123.6 135.4 124.6 C134.1 125.6 133.1 127.0 131.9 128.4 C130.8 129.8 129.3 131.4 128.6 132.8 C127.9 134.2 128.0 135.7 127.6 137.0 C127.3 138.3 126.5 139.6 126.4 140.8 C126.4 142.1 127.0 143.1 127.3 144.4 C127.6 145.7 127.7 147.6 128.4 148.8 C129.2 150.0 130.6 151.0 131.8 151.9 C133.0 152.7 134.3 153.7 135.6 154.0 C136.9 154.3 138.1 153.8 139.5 153.6 C140.8 153.4 142.2 153.4 143.6 152.8 C145.0 152.1 146.6 150.8 147.8 149.6 C149.0 148.5 150.1 147.0 151.1 145.6 C152.0 144.2 152.9 142.7 153.6 141.4 C154.3 140.1 154.9 138.8 155.1 137.5 C155.3 136.2 155.2 135.0 154.8 133.7 C154.4 132.4 153.8 130.9 153.0 129.7 C152.2 128.5 150.8 127.5 150.1 126.4 C149.5 125.2 149.4 123.5 148.9 122.6 C148.4 121.7 148.1 121.3 147.2 120.9 C146.3 120.5 144.9 119.9 143.6 120.1 Z';
const ARMS = [
  { href: hamiArmL, x: 42.6, y: 119.8, w: 29.2, h: 34.4, pivot: '51px 127px', side: 'l', path: ARM_L },
  { href: hamiArmR, x: 126.4, y: 119.8, w: 29, h: 34.4, pivot: '147.2px 127px', side: 'r', path: ARM_R },
] as const;
/** Os olhos da foto (para piscar por cima). */
const EYES = [
  { cx: 72, cy: 76.6 },
  { cx: 131.8, cy: 81 },
];
/** Expressões que usam o rosto da própria foto (olhões e a boquinha aberta). */
const PHOTO_MOODS: PetMood[] = ['feliz', 'animado', 'comendo'];
/** Roupas sem manga (o bracinho fica de fora). */
const NO_SLEEVE = new Set(['regata', 'avental', 'jardineira', 'tutu', 'capa', 'avental-costura', 'avental-vendinha', 'colete-obra', 'babado']);

/**
 * O Hami: o hamster realista da foto, com pelo de verdade. A expressão padrão é a da própria foto; as outras
 * (sono, choro, frio…) são desenhadas por cima do rosto. A cor da pelagem muda só no pelo laranja.
 * As roupas vestem o contorno do corpo, e as patinhas ficam por cima delas.
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
  const current = useContext(GrowthContext);
  const k = Math.min(1, Math.max(0.4, neutral ? 1 : (growth ?? current)));
  const young = Math.min(1, Math.max(0, (1 - k) / 0.3));
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const asleep = mood === 'dormindo';
  const faceCond = condFace && cond && cond !== 'terra' ? cond : undefined;
  const photoFace = PHOTO_MOODS.includes(mood) && !faceCond;
  const recolor = fur.id !== 'caramelo';

  const costume = costumeOf(outfit.roupa);
  const shape = costume ? null : garmentShape(outfit.roupa);
  const garment = costume ? null : shape ? garmentColor(outfit.roupa) : (sleeveOf(outfit.roupa) ?? (outfit.roupa ? (itemById(outfit.roupa)?.c1 ?? null) : null));
  const cloth = shape === 'dress' ? DRESS : BODY;
  const holds = !!prop && prop !== 'fones';
  const neckItem = !!outfit.acessorio && NECK_ITEMS.has(itemById(outfit.acessorio)?.base ?? outfit.acessorio);
  // cor do punho da manga (um tom mais escuro da roupa)
  const cuff = costume ? shadeHex(costume.c1, 0.12) : garment ? shadeHex(garment, 0.14) : null;
  // manga do bracinho: só em roupas que cobrem o braço (fantasias, moletons, camisetas, vestidos…)
  const sleeve = costume ? costume.c1 : outfit.roupa && !NO_SLEEVE.has(itemById(outfit.roupa)?.base ?? '') ? garment : null;
  // bracinhos: acenam de vez em quando (como dando "oi"), batem de alegria e acenam quando pedem; seguram as coisas paradinhos
  const armsBusy = holds || (!!outfit.acessorio && itemById(outfit.acessorio)?.base === 'segurar');
  const armClass = (side: 'l' | 'r') =>
    pose === 'festa'
      ? `hami-arm hami-cheer-${side}`
      : pose === 'tchau'
        ? side === 'l'
          ? 'hami-arm hami-wave'
          : 'hami-arm'
        : idle && !asleep && !armsBusy
          ? `hami-arm hami-arm-idle-${side}`
          : 'hami-arm';
  const img = (href: string, style?: CSSProperties) => <image href={href} x={IMG.x} y={IMG.y} width={IMG.w} height={IMG.h} preserveAspectRatio="xMidYMid meet" style={style} />;

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={label ?? 'Hami'} className="block overflow-visible">
      <defs>
        <clipPath id={`b${uid}`}>
          <path d={costume ? SUIT : BODY} />
          {costume && <path d={HOOD} />}
        </clipPath>
        <clipPath id={`k${uid}`}>
          <path d={cloth} />
        </clipPath>
        {ARMS.map((arm, i) => (
          <g key={arm.side}>
            <clipPath id={`ac${i}${uid}`}>
              <path d={arm.path} />
            </clipPath>
            <mask id={`am${i}${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
              <g clipPath={`url(#ac${i}${uid})`}>{img(hamiFurMask)}</g>
            </mask>
            {/* manga: do ombro até o pulso; a patinha sai pela ponta (nada de manga embaixo dela) */}
            <mask id={`sl${i}${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
              <path d={arm.path} fill="#FFFFFF" />
              <ellipse cx={PAWS[i].cx} cy={PAWS[i].cy + 1.6} rx={PAWS[i].rx + 0.2} ry={PAWS[i].ry + 0.4} fill={`url(#pk${uid})`} />
              <rect x={PAWS[i].cx - PAWS[i].rx * 0.9} y={PAWS[i].cy + 4} width={PAWS[i].rx * 1.8} height="30" fill="#000000" />
            </mask>
            <mask id={`sa${i}${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
              <path d={arm.path} fill="#FFFFFF" />
            </mask>
          </g>
        ))}
        <radialGradient id={`pk${uid}`}>
          <stop offset="0.8" stopColor="#000000" />
          <stop offset="1" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`ey${uid}`}>
          {EYES.map((e, i) => (
            <ellipse key={i} cx={e.cx} cy={e.cy} rx="14" ry="14.5" />
          ))}
        </clipPath>
        {/* tudo abaixo do queixo: os colares saem de trás da cabeça */}
        <clipPath id={`n${uid}`}>
          <path d="M0 200 V112 H34 Q99 138 164 112 H200 V200 Z" />
        </clipPath>
        <mask id={`m${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
          {img(hamiFurMask)}
        </mask>
        <radialGradient id={`e${uid}`} cx="50%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#1A0C06" />
          <stop offset="60%" stopColor="#331A0E" />
          <stop offset="100%" stopColor="#7A4526" />
        </radialGradient>
        <radialGradient id={`s${uid}`}>
          <stop offset="0%" stopColor="#5A2E14" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#5A2E14" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`c${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000000" stopOpacity="0.18" />
          <stop offset="0.3" stopColor="#000000" stopOpacity="0" />
          <stop offset="0.68" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.2" />
        </linearGradient>
        <radialGradient id={`g${uid}`}>
          <stop offset="0%" stopColor="#FFE07A" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFE07A" stopOpacity="0" />
        </radialGradient>
        <FabricFilter id={`t${uid}`} />
      </defs>
      <g transform={k < 1 ? `translate(100 192) scale(${k}) translate(-100 -192)` : undefined}>
        {phase >= 3 && <circle cx="100" cy="110" r="94" fill={`url(#g${uid})`} />}
        <EffectBack id={outfit.efeito} geo={BODY_GEO} uid={uid} />
        <ellipse cx="99" cy="192.5" rx="50" ry="5.5" fill="rgba(60,30,40,0.16)" />
        <g className={idle && !asleep ? 'hami-breathe' : asleep ? 'hami-sleep' : ''} style={{ transformOrigin: '100px 192px' }}>
          <g filter={`url(#t${uid})`}>
            <Cape id={outfit.roupa} geo={BODY_GEO} />
            <AccessoryBack id={outfit.acessorio} geo={BODY_GEO} />
          </g>

          {/* a foto do Hami (com o rosto da foto, ou sem rosto para desenhar outra expressão por cima) */}
          {img(photoFace ? hamiBody : hamiBodyBlank, wet ? { filter: 'saturate(0.85) brightness(0.93)' } : undefined)}
          {recolor && (
            <g mask={`url(#m${uid})`}>
              <rect x="0" y="0" width="200" height="200" fill={fur.body} style={{ mixBlendMode: 'color' }} />
              <rect x="0" y="0" width="200" height="200" fill={fur.body} opacity="0.32" />
            </g>
          )}
          {wet && <path d={HOOD} fill="#5B8FD6" opacity="0.08" />}

          {/* roupa vestindo o contorno do corpo, com cara de tecido */}
          <g filter={`url(#t${uid})`}>
            {costume ? (
              <g clipPath={`url(#b${uid})`}>
                <Clothes id={outfit.roupa} geo={{ top: 30, w: 66, h: 158, eyeY: 77.5, hole: { cx: 101.5, cy: 89, rx: 50, ry: 35 } }} />
                <rect x="0" y="0" width="200" height="200" fill={`url(#c${uid})`} />
              </g>
            ) : null}
            {costume && (
              <g transform={FACE_T}>
                <CostumeBack id={outfit.roupa} geo={{ ...HEAD_GEO, top: 37, w: 62 }} />
              </g>
            )}
            {costume ? null : shape && garment ? (
              <g>
                <path d={cloth} fill={garment} />
                <g clipPath={`url(#k${uid})`}>
                  <Clothes id={outfit.roupa} geo={BODY_GEO} />
                  <rect x="0" y="110" width="200" height="90" fill={`url(#c${uid})`} />
                </g>
              </g>
            ) : (
              outfit.roupa && (
                <g clipPath={`url(#k${uid})`}>
                  <Clothes id={outfit.roupa} geo={BODY_GEO} />
                  <rect x="0" y="110" width="200" height="90" fill={`url(#c${uid})`} />
                </g>
              )
            )}
          </g>
          {outfit.roupa && !costume && (
            <g clipPath={`url(#k${uid})`}>
              {/* sombra macia do queixo na roupa */}
              <ellipse cx="100" cy="128" rx="54" ry="9" fill={`url(#s${uid})`} />
            </g>
          )}

          {cond === 'terra' && (
            <g fill="#8A5A3B" opacity="0.4">
              <ellipse cx="70" cy="166" rx="8" ry="5" />
              <ellipse cx="122" cy="176" rx="6" ry="4" />
              <circle cx="140" cy="160" r="3" />
              <ellipse cx="128" cy="44" rx="7" ry="4.5" transform="rotate(-20 128 44)" />
              <circle cx="78" cy="38" r="2.6" />
            </g>
          )}
          <PropInHands prop={prop} />
          {/* as patinhas da foto ficam por cima da roupa e do que ele segura */}
          {/* os bracinhos da foto, por cima da roupa e do que ele segura (com a manga, se estiver vestido) */}
          {ARMS.map((arm, i) => (
            <g key={arm.side} className={armClass(arm.side)} style={{ transformOrigin: arm.pivot }}>
              <image href={arm.href} x={arm.x} y={arm.y} width={arm.w} height={arm.h} preserveAspectRatio="none" style={wet ? { filter: 'saturate(0.85) brightness(0.93)' } : undefined} />
              {recolor && (
                <g mask={`url(#am${i}${uid})`}>
                  <rect x={arm.x} y={arm.y} width={arm.w} height={arm.h} fill={fur.body} style={{ mixBlendMode: 'color' }} />
                  <rect x={arm.x} y={arm.y} width={arm.w} height={arm.h} fill={fur.body} opacity="0.32" />
                </g>
              )}
              {sleeve && (
                <g filter={`url(#t${uid})`}>
                  <path d={arm.path} fill={sleeve} mask={`url(#sl${i}${uid})`} />
                  {/* punho: arco em volta do pulso, por cima do comecinho da patinha */}
                  <path
                    d={`M${PAWS[i].cx - PAWS[i].rx - 1.2} ${PAWS[i].cy - 1} A${PAWS[i].rx + 1.2} ${PAWS[i].ry + 0.6} 0 0 1 ${PAWS[i].cx + PAWS[i].rx + 1.2} ${PAWS[i].cy - 1}`}
                    stroke={cuff ?? sleeve}
                    strokeWidth="3.4"
                    strokeLinecap="round"
                    fill="none"
                    mask={`url(#sa${i}${uid})`}
                  />
                </g>
              )}
            </g>
          ))}

          {/* piscadinha de vez em quando (no rosto da foto) */}
          {photoFace && idle && (
            <g className="hami-blink">
              <g clipPath={`url(#ey${uid})`}>{img(hamiBodyBlank)}</g>
              <g transform={FACE_T}>
                {[-1, 1].map((sd) => (
                  <path
                    key={sd}
                    d={`M${100 + sd * 25 - 9} ${FACE.eyeY - 1} Q${100 + sd * 25} ${FACE.eyeY + 5.5} ${100 + sd * 25 + 9} ${FACE.eyeY - 1}`}
                    stroke={INK}
                    strokeWidth="3.6"
                    strokeLinecap="round"
                    fill="none"
                  />
                ))}
              </g>
            </g>
          )}
          {/* expressão desenhada por cima do rosto (quando não é a da foto) */}
          {!photoFace && (
            <g transform={FACE_T}>
              <Face mood={mood} cond={faceCond} eyeY={FACE.eyeY} noseY={FACE.eyeY + 8.2} ex={FACE.ex} blush={fur.ear} eyeK={1 + young * 0.08} uid={uid} photoBlush />
            </g>
          )}
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
                d={`M${HEAD.cx + sd * (HEAD.rx - 8)} ${HEAD.top + 24 + dy * 40} q-4 7 0 10.5 q4 -3.5 0 -10.5 Z`}
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
                d={`M${HEAD.cx + dx * HEAD.rx} ${HEAD.top + 12 + dy * 90} q-3.5 6 0 9 q3.5 -3 0 -9 Z`}
                fill="#8FD0FF"
                stroke="#5BA9E8"
                strokeWidth="0.8"
              />
            ))}
          {shine && (
            <g fill="#FFF3A6">
              <path className="sparkle" d={`M${HEAD.cx - HEAD.rx - 4} ${HEAD.top + 34} l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 Z`} />
              <path className="sparkle" style={{ animationDelay: '0.5s' }} d={`M${HEAD.cx + HEAD.rx + 4} ${HEAD.top + 74} l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z`} />
              <path className="sparkle" style={{ animationDelay: '1s' }} d={`M${HEAD.cx + 30} ${HEAD.top - 2} l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z`} />
            </g>
          )}

          {/* acessórios da cabeça e do pescoço, com cara de tecido/objeto de verdade */}
          <g filter={`url(#t${uid})`}>
            <g transform={FACE_T}>
              <CostumeFront id={outfit.roupa} geo={HEAD_GEO} />
              <Glasses id={outfit.oculos} eyeY={FACE.eyeY} ex={FACE.ex} />
              <Hat id={outfit.chapeu} geo={HEAD_GEO} />
              {prop === 'fones' && (
                <g>
                  <path
                    d={`M${100 - 56} ${FACE.eyeY - 4} C${100 - 58} ${HEAD_GEO.top - 22} ${100 + 58} ${HEAD_GEO.top - 22} ${100 + 56} ${FACE.eyeY - 4}`}
                    stroke="#5B6BD6"
                    strokeWidth="5.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {[-1, 1].map((sd) => (
                    <g key={sd}>
                      <rect x={100 + sd * 56 - 8} y={FACE.eyeY - 16} width="16" height="22" rx="8" fill="#FF8FB1" />
                      <rect x={100 + sd * 56 - 5} y={FACE.eyeY - 13} width="10" height="16" rx="5" fill="#FFFFFF" opacity="0.45" />
                    </g>
                  ))}
                </g>
              )}
            </g>
            <g clipPath={neckItem ? `url(#n${uid})` : undefined}>
              <Accessory id={outfit.acessorio} geo={{ top: 86, h: 64, w: neckItem ? 52 : 39, eyeY: 72 }} paw="#FFF4EE" head={{ cx: HEAD.cx, cy: 78, rx: HEAD.rx, ry: 45 }} />
            </g>
          </g>
          {phase >= 3 && <Sparkles top={HEAD.top} w={HEAD.rx} />}
          <EffectFront id={outfit.efeito} geo={BODY_GEO} />
        </g>
      </g>
      {asleep && (
        <text x="150" y={HEAD.top + 4} className="zzz" fontSize="18" fontWeight="800" fill={INK} opacity="0.6">
          z z
        </text>
      )}
    </svg>
  );
}

/**
 * Acabamento de tecido para roupas e acessórios: textura de feltro bem fininha, volume macio nas bordas
 * (como pano estofado) e uma sombrinha no pelo — para combinar com o Hami realista.
 */
export function FabricFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
      {/* volume de pano estofado: luz de cima à esquerda e borda que afunda (sem escurecer a cor) */}
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
      {/* sombrinha macia no pelo */}
      <feDropShadow in="fabric" dx="0" dy="1.8" stdDeviation="1.8" floodColor="#5A2E14" floodOpacity="0.28" />
    </filter>
  );
}

function Face({
  mood,
  cond,
  eyeY,
  noseY,
  ex,
  blush,
  eyeK = 1,
  uid,
  photoBlush,
}: {
  mood: PetMood;
  cond?: Condition;
  eyeY: number;
  noseY: number;
  ex: number;
  blush: string;
  eyeK?: number;
  uid: string;
  photoBlush?: boolean;
}) {
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
                <path
                  className="tear-flow"
                  d={`M${x + s * 7} ${eyeY + 2} C${x + s * 11} ${eyeY + 14} ${x + s * 7} ${eyeY + 24} ${x + s * 12} ${eyeY + 36}`}
                  stroke="#8FD0FF"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.9"
                />
                <path
                  d={`M${x + s * 7} ${eyeY + 2} C${x + s * 11} ${eyeY + 14} ${x + s * 7} ${eyeY + 24} ${x + s * 12} ${eyeY + 36}`}
                  stroke="#FFFFFF"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.7"
                />
                <path
                  className="tear-drop"
                  style={{ animationDelay: s === 1 ? '0.35s' : '0s' }}
                  d={`M${x + s * 13} ${eyeY - 2} q-3.2 5.4 0 8 q3.2 -2.6 0 -8 Z`}
                  fill="#8FD0FF"
                  stroke="#5BA9E8"
                  strokeWidth="0.8"
                />
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
                <path
                  d={`M${x - 8.6} ${eyeY + 3.4} Q${x} ${eyeY + 8} ${x + 8.6} ${eyeY + 3.4} Q${x + 7.2} ${eyeY + 9.8} ${x} ${eyeY + 10.8} Q${x - 7.2} ${eyeY + 9.8} ${x - 8.6} ${eyeY + 3.4} Z`}
                  fill="#8FD0FF"
                  opacity="0.85"
                />
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
    if (face === 'chuva' || face === 'medo') return <g className="pet-eyes">{[-1, 1].map((s) => bigEye(100 + s * ex, face === 'medo' ? 8.6 : 8, face === 'medo' ? 10 : 9.2))}</g>;
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
      <path
        d={`M${100 - w * 0.62} ${n + 3.4} Q${100 - w * 0.5} ${n + 10.6} 100 ${n + 10.6} Q${100 + w * 0.5} ${n + 10.6} ${100 + w * 0.62} ${n + 3.4} Q100 ${n + 5.4} ${100 - w * 0.62} ${n + 3.4} Z`}
        fill="#A23E4B"
      />
      <path
        d={`M${100 - w * 0.4} ${n + 8.2} Q100 ${n + 6.4} ${100 + w * 0.4} ${n + 8.2} Q${100 + w * 0.3} ${n + 10.3} 100 ${n + 10.4} Q${100 - w * 0.3} ${n + 10.3} ${100 - w * 0.4} ${n + 8.2} Z`}
        fill="#FF8DA1"
      />
      <path
        d={`M${100 - w} ${n + 2} Q${100 - w * 0.5} ${n + 6.6} 100 ${n + 2.6} Q${100 + w * 0.5} ${n + 6.6} ${100 + w} ${n + 2}`}
        stroke={INK}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
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
    if (teary)
      return (
        <path
          className="pout"
          d={`M94.6 ${n + 6} Q97.3 ${n + 2.6} 100 ${n + 4.4} Q102.7 ${n + 2.6} 105.4 ${n + 6}`}
          stroke={INK}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      );
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
    if (sleepy)
      return <path d={`M95.5 ${n + 3} Q97.8 ${n + 5.4} 100 ${n + 3.4} Q102.2 ${n + 5.4} 104.5 ${n + 3}`} stroke={INK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />;
    return omega(mood === 'comendo' ? 6 : 7.4);
  };
  const cheek = face === 'frio' ? '#8FB4F0' : face === 'calor' ? '#FF6F6F' : face === 'gripado' ? '#FF8A8A' : blush;
  const cheekOp = face === 'frio' ? 0.55 : face === 'calor' ? 0.55 : face === 'gripado' ? 0.45 : 0.55;
  return (
    <g>
      <g transform={eyeK !== 1 ? `translate(100 ${eyeY}) scale(${eyeK}) translate(-100 ${-eyeY})` : undefined}>{eyes()}</g>
      {/* bochechas rosadas com risquinhos de brilho (na foto elas já existem: só muda a cor no frio, calor e gripe) */}
      {(!photoBlush || face === 'frio' || face === 'calor' || face === 'gripado') &&
        [-1, 1].map((s) => {
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

/** O objeto da atividade, seguro entre as patinhas (as patinhas da foto são redesenhadas por cima dele). */
function PropInHands({ prop }: { prop?: HamiProp }) {
  if (!prop || prop === 'fones') return null;
  if (prop === 'livro')
    return (
      <g transform="rotate(-4 99 146)">
        <path d="M58 132 Q99 125 140 132 L141 162 Q99 155 57 162 Z" fill="#5B8DEF" />
        <path d="M62 132 Q81 128 99 133 L99 158 Q81 153 62 157 Z" fill="#FFFFFF" />
        <path d="M136 132 Q117 128 99 133 L99 158 Q117 153 136 157 Z" fill="#F7F3EE" />
        <path d="M68 139 Q81 136 93 139 M68 145 Q81 142 93 145 M105 139 Q117 136 130 139 M105 145 Q117 142 130 145" stroke="#C9CDD6" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M99 133 V158" stroke="#D9DCE4" strokeWidth="1.2" />
      </g>
    );
  if (prop === 'desenho')
    return (
      <g>
        <g transform="rotate(4 99 146)">
          <rect x="64" y="128" width="70" height="40" rx="4" fill="#FFFFFF" stroke="#E6E1DA" strokeWidth="1" />
          <path d="M86 146 c-6 -7 -15 0 -7 7 l7 6 l7 -6 c8 -7 -1 -14 -7 -7 Z" fill="#FF8FB1" />
          <path d="M104 140 l14 0 M104 147 l17 0 M105 156 q6 4 12 0" stroke="#7FB8F0" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </g>
        <path d="M134 150 L148 130" stroke="#FFC94D" strokeWidth="5" strokeLinecap="round" />
        <path d="M148 130 l2.6 -3.4" stroke="#3B2418" strokeWidth="3" strokeLinecap="round" />
      </g>
    );
  if (prop === 'halteres')
    return (
      <g>
        {[61, 136.5].map((x) => (
          <g key={x}>
            <rect x={x - 15} y="140" width="30" height="5" rx="2.5" fill="#8E8C97" />
            <rect x={x - 19} y="132" width="7" height="21" rx="3" fill="#7A5AE0" />
            <rect x={x + 12} y="132" width="7" height="21" rx="3" fill="#7A5AE0" />
          </g>
        ))}
      </g>
    );
  // varinha de bolhas
  return (
    <g>
      <path d="M138 146 L164 124" stroke="#B9A3F0" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="170" cy="119" r="9" fill="#DDF3FF" fillOpacity="0.55" stroke="#9B84E6" strokeWidth="2.8" />
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
