// O Hami passeando de mochilinha, igualzinho à imagem de referência (olhinhos fechados de alegria, florzinha e
// mochila rosa de patinha) — e andando como personagem de verdade, sem peças duras girando: a imagem inteira é
// deformada aos pouquinhos (do jeito dos personagens 2D animados), com mapas de deformação suaves:
// - passo: o quadril fica parado e só a perninha dobra (o pezinho vai para trás e o outro vem para a frente),
//   e o bracinho balança junto;
// - pezinho: o que vem para a frente levanta do chão;
// - corpo: estica quando o pé sai do chão e amassa quando pisa, as orelhinhas pulam e a cabeça balança um tiquinho.
// A cor da pelagem escolhida pinta só o pelo caramelo, e a roupa vestida deforma junto com o corpo.
import { useId } from 'react';
import photo from '../assets/hami/hami-anda.webp';
import photoFur from '../assets/hami/hami-anda-pelo.webp';
import mapStep from '../assets/hami/hami-anda-passo.png';
import mapFoot from '../assets/hami/hami-anda-pe.png';
import mapBody from '../assets/hami/hami-anda-corpo-mapa.png';
import { furById } from '../data/fur';
import { WalkClothes } from './WalkWear';
import type { Outfit } from '../types';

/** Quadro da imagem (pontos). */
const W = 524;
const H = 617;
/** Um passo inteiro (as duas perninhas), em segundos. */
const BEAT = 0.9;
const still = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Uma camada de deformação: mapa suave (com margem neutra em volta) + quanto ele empurra ao longo do passo. */
function Warp({ map, values, keyTimes, inId, out, moving }: { map: string; values: string; keyTimes: string; inId: string; out: string; moving: boolean }) {
  return (
    <>
      <feImage href={map} x={-48} y={-48} width={W + 96} height={H + 80} preserveAspectRatio="none" result={`${out}m`} />
      <feDisplacementMap in={inId} in2={`${out}m`} scale="0" xChannelSelector="R" yChannelSelector="G" result={out}>
        {moving && (
          <animate
            attributeName="scale"
            values={values}
            keyTimes={keyTimes}
            dur={`${BEAT}s`}
            repeatCount="indefinite"
            calcMode="spline"
            keySplines={keyTimes
              .split(';')
              .slice(1)
              .map(() => '0.45 0 0.55 1')
              .join(';')}
          />
        )}
      </feDisplacementMap>
    </>
  );
}

export function WalkingHami({ fur: furId, outfit, size = 150, still: stopped = false }: { fur: string; outfit?: Outfit; size?: number; still?: boolean }) {
  const f = furById(furId);
  const uid = useId().replace(/:/g, '');
  const color = f.id === 'caramelo' ? null : f.body;
  const moving = !stopped && !still();
  const h = (size * H) / W;
  return (
    <span className={`wkp ${moving ? '' : 'is-still'}`} style={{ width: size, height: h }} role="img" aria-label="Hami passeando de mochilinha">
      <svg viewBox={`0 0 ${W} ${H}`} width={size} height={h} aria-hidden="true" style={{ overflow: 'visible', display: 'block' }}>
        <defs>
          <filter id={`wk${uid}`} filterUnits="userSpaceOnUse" x={-44} y={-44} width={W + 88} height={H + 72} colorInterpolationFilters="sRGB">
            {/* passo: perna da frente e bracinho vão para trás enquanto a de trás vem para a frente (e volta) */}
            <Warp map={mapStep} inId="SourceGraphic" out="a" values="0;56;0" keyTimes="0;0.5;1" moving={moving} />
            {/* o pezinho que vem para a frente levanta (o de trás na 1ª metade, o da frente na 2ª) */}
            <Warp map={mapFoot} inId="a" out="b" values="0;-34;0;34;0" keyTimes="0;0.25;0.5;0.75;1" moving={moving} />
            {/* corpo estica no meio do passo e amassa ao pisar; orelhinhas pulam */}
            <Warp map={mapBody} inId="b" out="c" values="-10;22;-10;22;-10" keyTimes="0;0.25;0.5;0.75;1" moving={moving} />
          </filter>
          {color && (
            <mask id={`wf${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
              <image href={photoFur} x="0" y="0" width={W} height={H} />
            </mask>
          )}
        </defs>
        <ellipse className="wkp-shadow" cx="262" cy="612" rx="150" ry="11" fill="rgba(40,30,50,0.2)" style={{ transformOrigin: '262px 612px' }} />
        <g className="wkp-bob" style={{ transformOrigin: '262px 612px' }}>
          <g filter={`url(#wk${uid})`}>
            <image href={photo} x="0" y="0" width={W} height={H} />
            {color && (
              <g mask={`url(#wf${uid})`}>
                <rect width={W} height={H} fill={color} style={{ mixBlendMode: 'color' }} />
                <rect width={W} height={H} fill={color} opacity="0.32" />
              </g>
            )}
            <WalkClothes outfit={outfit} uid={uid} fur={furId} />
          </g>
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
