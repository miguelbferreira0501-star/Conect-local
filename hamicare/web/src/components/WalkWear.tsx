// A roupa que o Hami está usando, vestida nas fotos dele andando e dormindo: o mesmo desenho e as mesmas cores da
// roupa do Hami de pé (estampa, capuz, barrado…), só que encaixada no corpo da foto — recortada pelo contorno do
// pelo (até a pontinha) e começando logo abaixo do queixo, com cara de tecido (luz, volume e sombrinha).
import type { ReactNode } from 'react';
import walkBody from '../assets/hami/hami-anda.webp';
import sleepSrc from '../assets/hami/hami-dormindo.webp';
import walkShade from '../assets/hami/hami-anda-sombra.webp';
import sleepShade from '../assets/hami/hami-dormindo-sombra.webp';
import walkFront from '../assets/hami/hami-anda-frente.webp';
import walkFrontFur from '../assets/hami/hami-anda-frente-pelo.webp';
import { itemById } from '../data/items';
import { furById } from '../data/fur';
import { Clothes, costumeOf, garmentColor } from './Wear';
import { FabricFilter } from './Hamster';
import type { Outfit } from '../types';

/** Corpo do Hami de pé (quadro 0–200), onde as roupas são desenhadas. */
const STAND_GEO = { top: 30, w: 52, h: 163, eyeY: 72 };

const shadeHex = (hex: string, t: number) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const c = (sh: number) =>
    Math.round(((n >> sh) & 255) * (1 - t))
      .toString(16)
      .padStart(2, '0');
  return `#${c(16)}${c(8)}${c(0)}`;
};

/** A cor de base da roupa (fantasia, blusa ou peça). */
export function outfitColor(roupa: string | null | undefined): string | null {
  if (!roupa) return null;
  const costume = costumeOf(roupa);
  return costume ? costume.c1 : (garmentColor(roupa) ?? itemById(roupa)?.c1 ?? null);
}

/**
 * Roupa vestida numa foto. `src` é a foto (o contorno do pelo vira o molde), `torso` a região do corpo que a roupa
 * cobre (abaixo do queixo) e `place` leva o desenho da roupa do Hami de pé até esse corpo.
 */
export function PhotoClothes({
  roupa,
  uid,
  src,
  w,
  h,
  torso,
  place,
  collar,
  shade,
  children,
}: {
  roupa: string | null | undefined;
  uid: string;
  src: string;
  /** Luz e sombra do próprio corpo da foto (multiplicada na roupa, para ela ter o volume do corpo). */
  shade?: string;
  w: number;
  h: number;
  torso: string;
  place: string;
  collar?: string;
  children?: ReactNode;
}) {
  const color = outfitColor(roupa);
  if (!roupa || !color) return null;
  return (
    <g>
      <defs>
        {/* o contorno do pelo: branco onde é Hami (até onde o pelo é bem cheio) */}
        <filter id={`pa${uid}`} x="0" y="0" width="1" height="1">
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 3.2 -1" />
        </filter>
        <clipPath id={`pt${uid}`}>
          <path d={torso} />
        </clipPath>
        <mask id={`ps${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}>
          <image href={src} x="0" y="0" width={w} height={h} filter={`url(#pa${uid})`} />
        </mask>
        <filter id={`pb${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={w / 110} />
        </filter>
        <mask id={`pm${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}>
          <g clipPath={`url(#pt${uid})`}>
            <image href={src} x="0" y="0" width={w} height={h} filter={`url(#pa${uid})`} />
          </g>
        </mask>
        <linearGradient id={`pg${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.12" />
          <stop offset="0.6" stopColor="#000000" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.16" />
        </linearGradient>
        <FabricFilter id={`pf${uid}`} />
      </defs>
      {/* sombrinha macia no pelo, logo na beirada da gola */}
      {collar && (
        <g mask={`url(#ps${uid})`}>
          <path d={collar} stroke="#5A2E24" strokeOpacity="0.28" strokeWidth={w / 26} fill="none" filter={`url(#pb${uid})`} />
        </g>
      )}
      <g filter={`url(#pf${uid})`}>
        <g mask={`url(#pm${uid})`}>
          <rect x="0" y="0" width={w} height={h} fill={color} />
          <g transform={place}>
            <Clothes id={roupa} geo={STAND_GEO} />
          </g>
          {shade && <image href={shade} x="0" y="0" width={w} height={h} style={{ mixBlendMode: 'multiply' }} />}
          <rect x="0" y="0" width={w} height={h} fill={`url(#pg${uid})`} />
          {collar && <path d={collar} stroke={shadeHex(color, 0.18)} strokeWidth={w / 48} fill="none" strokeLinecap="round" />}
        </g>
      </g>
      {children}
    </g>
  );
}

/** A roupa no Hami andando de mochilinha: por baixo da mochila, das alças e do bracinho que segura a alça. */
export function WalkClothes({ outfit, uid, fur }: { outfit?: Outfit; uid: string; fur?: string }) {
  const roupa = outfit?.roupa;
  if (!roupa || !outfitColor(roupa)) return null;
  const f = fur ? furById(fur) : null;
  const color = f && f.id !== 'caramelo' ? f.body : null;
  return (
    <PhotoClothes
      roupa={roupa}
      uid={`w${uid}`}
      src={walkBody}
      shade={walkShade}
      w={524}
      h={617}
      torso="M0 350 C100 372 200 374 300 366 C350 362 390 358 420 356 C450 354 486 360 524 372 V526 C470 520 420 512 372 522 C330 532 300 548 262 552 C226 556 200 546 170 542 C130 538 90 540 0 548 Z"
      collar="M40 356 C120 374 210 376 300 368 C350 363 390 359 420 357 C450 355 480 360 500 366"
      place="translate(262 368) scale(3.6) translate(-100 -128)"
    >
      {/* mochila, alças e o bracinho que segura a alça ficam por cima da roupa */}
      <image href={walkFront} x="2" y="328" width="444" height="178" />
      {color && (
        <>
          <mask id={`wfm${uid}`} maskUnits="userSpaceOnUse" x="2" y="328" width="444" height="178">
            <image href={walkFrontFur} x="2" y="328" width="444" height="178" />
          </mask>
          <g mask={`url(#wfm${uid})`}>
            <rect x="2" y="328" width="444" height="178" fill={color} style={{ mixBlendMode: 'color' }} />
            <rect x="2" y="328" width="444" height="178" fill={color} opacity="0.32" />
          </g>
        </>
      )}
    </PhotoClothes>
  );
}

/** A roupa no Hami dormindo de barriguinha: veste as costas e o bumbum (a cabeça e as patinhas da frente ficam de fora),
 *  com a gola atrás da bochecha. Fica dentro da foto, então sobe e desce junto com a respiração. */
export function SleepClothes({ outfit, uid }: { outfit?: Outfit; uid: string }) {
  return (
    <PhotoClothes
      roupa={outfit?.roupa}
      uid={`s${uid}`}
      src={sleepSrc}
      shade={sleepShade}
      w={841}
      h={520}
      torso="M512 118 C556 188 568 276 580 356 C590 428 606 488 622 540 L900 540 L900 70 Z"
      collar="M514 122 C556 190 568 276 580 356 C590 428 606 488 620 532"
      place="translate(578 332) rotate(-90) scale(3.6) translate(-100 -128)"
    />
  );
}
