// As fotos do Hami em situações especiais (dormindo de barriguinha e no banho de espuma), do jeitinho da
// imagem de referência. A cor do pelo escolhida pela pessoa é pintada por cima só onde é pelo caramelo
// (máscara tirada da própria foto), igual ao Hami de pé.
import { useId } from 'react';
import sleepSrc from '../assets/hami/hami-dormindo.webp';
import sleepFur from '../assets/hami/hami-dormindo-pelo.webp';
import bathSrc from '../assets/hami/hami-banho.webp';
import bathFur from '../assets/hami/hami-banho-pelo.webp';
import { furById } from '../data/fur';

const PHOTOS = {
  dormindo: { src: sleepSrc, fur: sleepFur, w: 841, h: 520 },
  banho: { src: bathSrc, fur: bathFur, w: 600, h: 593 },
} as const;

export type PhotoKind = keyof typeof PHOTOS;
export const photoRatio = (kind: PhotoKind) => PHOTOS[kind].h / PHOTOS[kind].w;

/** A foto, com a pelagem da pessoa. `width` em px. */
export function HamiPhoto({ kind, fur: furId, width, className }: { kind: PhotoKind; fur: string; width: number; className?: string }) {
  const p = PHOTOS[kind];
  const uid = useId().replace(/:/g, '');
  const fur = furById(furId);
  const recolor = fur.id !== 'caramelo';
  return (
    <svg className={className} viewBox={`0 0 ${p.w} ${p.h}`} width={width} height={(width * p.h) / p.w} aria-hidden="true" style={{ overflow: 'visible', display: 'block' }}>
      {recolor && (
        <defs>
          <mask id={`pm${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width={p.w} height={p.h}>
            <image href={p.fur} x="0" y="0" width={p.w} height={p.h} />
          </mask>
        </defs>
      )}
      <image href={p.src} x="0" y="0" width={p.w} height={p.h} />
      {recolor && (
        <g mask={`url(#pm${uid})`}>
          <rect width={p.w} height={p.h} fill={fur.body} style={{ mixBlendMode: 'color' }} />
          <rect width={p.w} height={p.h} fill={fur.body} opacity="0.32" />
        </g>
      )}
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

/** O Hami tomando banho de espuma na tina de madeira (com patinho e toalha), balançando de leve. */
export function BathPhoto({ fur, width }: { fur: string; width: number }) {
  return (
    <span className="bath-photo" style={{ width, height: width * photoRatio('banho') }} role="img" aria-label="Hami tomando banho de espuma">
      <span className="bath-photo-bob">
        <HamiPhoto kind="banho" fur={fur} width={width} />
      </span>
      <BathBubbles />
    </span>
  );
}
