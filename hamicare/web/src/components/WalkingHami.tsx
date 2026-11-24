// O Hami passeando de mochilinha, igualzinho à imagem de referência (olhinhos fechados de alegria, florzinha e
// mochila rosa de patinha). A imagem foi separada em partes — corpo, as duas perninhas e o bracinho levantado —
// e o pelo que ficava atrás delas foi refeito, para ele andar de verdade: as perninhas dão o passo (a de trás vem
// para a frente levantando o pezinho), o bracinho balança, o corpo sobe e desce a cada passo e solta tracinhos de
// alegria. A cor da pelagem escolhida pinta só o pelo caramelo (máscara de cada parte).
import { useId, type ReactNode } from 'react';
import body from '../assets/hami/hami-anda-corpo.webp';
import bodyFur from '../assets/hami/hami-anda-corpo-pelo.webp';
import legF from '../assets/hami/hami-anda-perna-frente.webp';
import legFFur from '../assets/hami/hami-anda-perna-frente-pelo.webp';
import legB from '../assets/hami/hami-anda-perna-tras.webp';
import legBFur from '../assets/hami/hami-anda-perna-tras-pelo.webp';
import arm from '../assets/hami/hami-anda-braco.webp';
import armFur from '../assets/hami/hami-anda-braco-pelo.webp';
import { furById } from '../data/fur';
import { WalkClothes } from './WalkWear';
import type { Outfit } from '../types';

/** Quadro da imagem (pontos). */
const W = 524;
const H = 617;
/** Partes: onde ficam no quadro e onde giram (quadril e ombro). */
const PARTS = {
  legB: { href: legB, fur: legBFur, x: 94, y: 534, w: 124, h: 82, pivot: '154px 548px' },
  legF: { href: legF, fur: legFFur, x: 308, y: 511, w: 133, h: 105, pivot: '357px 535px' },
  arm: { href: arm, fur: armFur, x: 403, y: 350, w: 84, h: 102, pivot: '420px 398px' },
};

function Layer({ href, fur, x, y, w, h, color, id }: { href: string; fur: string; x: number; y: number; w: number; h: number; color: string | null; id: string }) {
  return (
    <>
      <image href={href} x={x} y={y} width={w} height={h} />
      {color && (
        <>
          <mask id={id} maskUnits="userSpaceOnUse" x={x} y={y} width={w} height={h}>
            <image href={fur} x={x} y={y} width={w} height={h} />
          </mask>
          <g mask={`url(#${id})`}>
            <rect x={x} y={y} width={w} height={h} fill={color} style={{ mixBlendMode: 'color' }} />
            <rect x={x} y={y} width={w} height={h} fill={color} opacity="0.32" />
          </g>
        </>
      )}
    </>
  );
}

export function WalkingHami({ fur: furId, outfit, size = 170, still = false }: { fur: string; outfit?: Outfit; size?: number; still?: boolean }) {
  const f = furById(furId);
  const uid = useId().replace(/:/g, '');
  const color = f.id === 'caramelo' ? null : f.body;
  const part = (k: keyof typeof PARTS, cls: string, extra?: ReactNode) => {
    const p = PARTS[k];
    return (
      <g className={cls} style={{ transformOrigin: p.pivot }}>
        <Layer {...p} color={color} id={`${k}${uid}`} />
        {extra}
      </g>
    );
  };
  const h = (size * H) / W;
  return (
    <span className={`wkp ${still ? 'is-still' : ''}`} style={{ width: size, height: h }} role="img" aria-label="Hami passeando de mochilinha">
      <svg viewBox={`0 0 ${W} ${H}`} width={size} height={h} aria-hidden="true" style={{ overflow: 'visible', display: 'block' }}>
        <ellipse className="wkp-shadow" cx="268" cy="612" rx="168" ry="12" fill="rgba(40,30,50,0.2)" style={{ transformOrigin: '268px 612px' }} />
        <g className="wkp-bob" style={{ transformOrigin: '268px 610px' }}>
          {/* perninha de trás (dá o passo para a frente) */}
          {part('legB', 'wkp-leg-b')}
          <g>
            <Layer href={body} fur={bodyFur} x={0} y={0} w={W} h={H} color={color} id={`b${uid}`} />
            <WalkClothes outfit={outfit} uid={uid} fur={furId} />
          </g>
          {/* perninha da frente e o bracinho que balança */}
          {part('legF', 'wkp-leg-f')}
          {part('arm', 'wkp-arm')}
          {/* tracinhos de alegria */}
          <g className="wkp-joy" style={{ transformOrigin: '470px 150px' }}>
            <path d="M474 96 L486 128" stroke="#FFD45C" strokeWidth="13" strokeLinecap="round" />
            <path d="M506 128 L478 146" stroke="#FFD45C" strokeWidth="13" strokeLinecap="round" />
            <path d="M510 170 L480 168" stroke="#FFD45C" strokeWidth="13" strokeLinecap="round" />
          </g>
        </g>
      </svg>
    </span>
  );
}
