// As fotos do Hami em situações especiais (dormindo de barriguinha e no banho de espuma), do jeitinho da
// imagem de referência. A cor do pelo escolhida pela pessoa é pintada por cima só onde é pelo caramelo
// (máscara tirada da própria foto), igual ao Hami de pé.
// Para não parecer uma figurinha colada, ele respira de verdade: um mapa de deformação suave sobe só as costas
// (e um tiquinho a cabeça), deixando a barriga e as patinhas paradas no chão — e o que estiver por cima (a coberta)
// sobe junto.
import { useId, type ReactNode } from 'react';
import sleepSrc from '../assets/hami/hami-dormindo.webp';
import sleepFur from '../assets/hami/hami-dormindo-pelo.webp';
import sleepBreath from '../assets/hami/hami-dormindo-respira.png';
import bathSrc from '../assets/hami/hami-banho.webp';
import bathFur from '../assets/hami/hami-banho-pelo.webp';
import bathBreath from '../assets/hami/hami-banho-respira.png';
import { furById } from '../data/fur';

const PHOTOS = {
  // `rise`: quanto as costas sobem no fôlego (em pontos da foto)
  dormindo: { src: sleepSrc, fur: sleepFur, breath: sleepBreath, w: 841, h: 520, rise: 26, beat: 4.6 },
  banho: { src: bathSrc, fur: bathFur, breath: bathBreath, w: 600, h: 593, rise: 14, beat: 3.4 },
} as const;

const still = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export type PhotoKind = keyof typeof PHOTOS;
export const photoRatio = (kind: PhotoKind) => PHOTOS[kind].h / PHOTOS[kind].w;

/** A foto, com a pelagem da pessoa. `width` em px; `over` é desenhado por cima (e respira junto); `clip` recorta um pedaço. */
export function HamiPhoto({
  kind,
  fur: furId,
  width,
  className,
  breathe = false,
  over,
  clip,
}: {
  kind: PhotoKind;
  fur: string;
  width: number;
  className?: string;
  breathe?: boolean;
  over?: ReactNode;
  clip?: ReactNode;
}) {
  const p = PHOTOS[kind];
  const uid = useId().replace(/:/g, '');
  const fur = furById(furId);
  const recolor = fur.id !== 'caramelo';
  const alive = breathe && !still();
  return (
    <svg className={className} viewBox={`0 0 ${p.w} ${p.h}`} width={width} height={(width * p.h) / p.w} aria-hidden="true" style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        {recolor && (
          <mask id={`pm${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width={p.w} height={p.h}>
            <image href={p.fur} x="0" y="0" width={p.w} height={p.h} />
          </mask>
        )}
        {clip && <clipPath id={`pc${uid}`}>{clip}</clipPath>}
        {alive && (
          <filter id={`pb${uid}`} filterUnits="userSpaceOnUse" x="0" y={-p.h * 0.08} width={p.w} height={p.h * 1.1} colorInterpolationFilters="sRGB">
            <feImage href={p.breath} x="0" y="0" width={p.w} height={p.h} preserveAspectRatio="none" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale="0" xChannelSelector="R" yChannelSelector="G">
              <animate
                attributeName="scale"
                values={`0;${p.rise};${p.rise};0;0`}
                keyTimes="0;0.42;0.5;0.92;1"
                dur={`${p.beat}s`}
                repeatCount="indefinite"
                calcMode="spline"
                keySplines="0.45 0 0.55 1;0 0 1 1;0.45 0 0.55 1;0 0 1 1"
              />
            </feDisplacementMap>
          </filter>
        )}
      </defs>
      <g filter={alive ? `url(#pb${uid})` : undefined} clipPath={clip ? `url(#pc${uid})` : undefined}>
        <image href={p.src} x="0" y="0" width={p.w} height={p.h} />
        {recolor && (
          <g mask={`url(#pm${uid})`}>
            <rect width={p.w} height={p.h} fill={fur.body} style={{ mixBlendMode: 'color' }} />
            <rect width={p.w} height={p.h} fill={fur.body} opacity="0.32" />
          </g>
        )}
        {over}
      </g>
    </svg>
  );
}

/** Os "z" subindo devagar. */
export function Zzz({ size = 54 }: { size?: number }) {
  return (
    <svg className="zz-float" viewBox="-4 -40 50 48" width={size} height={size * 0.96} aria-hidden="true" fill="#7C83C9" fontWeight="900" fontFamily="inherit" style={{ overflow: 'visible' }}>
      <text x="0" y="0" fontSize="16" className="zz-1">
        z
      </text>
      <text x="12" y="-14" fontSize="20" className="zz-2">
        z
      </text>
      <text x="26" y="-32" fontSize="25" className="zz-3">
        Z
      </text>
    </svg>
  );
}

/** Bolhinhas de sabão subindo e estourando em volta do banho. */
export function BathBubbles({ n = 7 }: { n?: number }) {
  return (
    <span className="photo-bubbles" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <i
          key={i}
          style={{ left: `${8 + ((i * 37) % 84)}%`, width: 8 + ((i * 5) % 11), height: 8 + ((i * 5) % 11), animationDelay: `${(i * 0.53) % 3}s`, animationDuration: `${2.6 + ((i * 0.37) % 1.4)}s` }}
        />
      ))}
    </span>
  );
}

/** O Hami tomando banho de espuma na tina de madeira (com patinho e toalha), respirando feliz na espuma. */
export function BathPhoto({ fur, width }: { fur: string; width: number }) {
  return (
    <span className="bath-photo" style={{ width, height: width * photoRatio('banho') }} role="img" aria-label="Hami tomando banho de espuma">
      <HamiPhoto kind="banho" fur={fur} width={width} breathe />
      <BathBubbles />
    </span>
  );
}
