// Poses inteiras do cachorro, tiradas da folha de poses: dormindo enroladinho, sentadinho e andando de lado.
// Cada pose tem as partes que mexem separadas (rabo que abana, perninhas que andam) e a roupa que ele está usando
// veste o corpo dele também nessas poses. O rostinho fica por cima, sem mudar de cor com a pelagem.
import { useId, type CSSProperties } from 'react';
import dorme from '../assets/dog/dog-dorme.webp';
import dormeRosto from '../assets/dog/dog-dorme-rosto.webp';
import senta from '../assets/dog/dog-senta.webp';
import sentaRabo from '../assets/dog/dog-senta-rabo.webp';
import sentaRosto from '../assets/dog/dog-senta-rosto.webp';
import anda from '../assets/dog/dog-anda.webp';
import andaRosto from '../assets/dog/dog-anda-rosto.webp';
import andaRabo from '../assets/dog/dog-anda-rabo.webp';
import andaPernaF from '../assets/dog/dog-anda-pernaF.webp';
import andaPernaT from '../assets/dog/dog-anda-pernaT.webp';
import { SPRITES } from './dogSprites';
import { FabricFilter, FurFilter, dogColors, shadeHex } from './Hamster';
import { Clothes, costumeOf, garmentColor, garmentShape, sleeveOf } from './Wear';
import { furById } from '../data/fur';
import { itemById } from '../data/items';
import type { Outfit } from '../types';

export type DogPoseKind = 'dorme' | 'senta' | 'anda';

type Box = { x: number; y: number; w: number; h: number };
const im = (href: string, b: Box, filter?: string, style?: CSSProperties) => <image href={href} x={b.x} y={b.y} width={b.w} height={b.h} preserveAspectRatio="none" filter={filter} style={style} />;
const pivot = (p: readonly number[]): CSSProperties => ({
  transformOrigin: `${p[0]}px ${p[1]}px`,
  transformBox: 'view-box',
});
/** Onde a estampa da roupa fica em cada pose (desloca o desenho da frente para o corpo da pose). */
const PRINT: Record<DogPoseKind, { dx: number; top: number }> = {
  dorme: { dx: 19, top: -36 },
  senta: { dx: -4, top: 2 },
  anda: { dx: -25, top: 2 },
};

export function DogPose({
  kind,
  fur: furId,
  outfit,
  width = 160,
  still = false,
  wet,
  label,
  flip,
  bag,
  carry,
  fast,
}: {
  kind: DogPoseKind;
  fur: string;
  outfit?: Outfit;
  width?: number;
  still?: boolean;
  wet?: boolean;
  label?: string;
  /** Virado para a direita (o desenho original olha para a esquerda). */
  flip?: boolean;
  /** Mochilinha nas costas (passeio e viagem). */
  bag?: boolean;
  /** Graveto na boca (buscando). */
  carry?: boolean;
  /** Correndo (passos mais rápidos). */
  fast?: boolean;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const S = SPRITES[kind];
  const colors = dogColors(furById(furId));
  const furF = colors ? `url(#f${uid})` : undefined;
  const wetStyle: CSSProperties | undefined = wet ? { filter: 'saturate(0.88) brightness(0.94)' } : undefined;
  const roupa = outfit?.roupa ?? null;
  const costume = costumeOf(roupa);
  const shape = costume ? null : garmentShape(roupa);
  const garment = costume ? costume.c1 : shape ? garmentColor(roupa) : (sleeveOf(roupa) ?? (roupa ? (itemById(roupa)?.c1 ?? null) : null));
  const seam = garment ? shadeHex(garment, 0.16) : null;
  const height = (width * S.h) / S.w;
  const print = PRINT[kind];
  const anim = !still;

  const tail = kind === 'senta' ? { href: sentaRabo, box: SPRITES.senta.rabo, piv: [150, 150] } : kind === 'anda' ? { href: andaRabo, box: SPRITES.anda.rabo, piv: SPRITES.anda.pivRabo } : null;

  return (
    <svg viewBox={`0 0 ${S.w} ${S.h}`} width={width} height={height} role="img" aria-label={label ?? 'Mascote'} className="block overflow-visible">
      <defs>
        {colors && <FurFilter id={`f${uid}`} c={colors} />}
        <clipPath id={`cl${uid}`}>
          <path d={S.clothes} />
        </clipPath>
        {/* a roupa acaba na cintura (sentado e andando, as perninhas ficam de fora) */}
        <clipPath id={`hm${uid}`}>
          <path d={kind === 'senta' ? `M0 0 H${S.w} V130 Q${S.w / 2} 141 0 130 Z` : kind === 'anda' ? `M0 0 H${S.w} V150 L0 150 Z` : `M0 0 H${S.w} V${S.h} H0 Z`} />
        </clipPath>
        {kind === 'anda' && (
          <clipPath id={`mg${uid}`}>
            <path d={SPRITES.anda.manga} />
          </clipPath>
        )}
        <FabricFilter id={`t${uid}`} />
      </defs>
      {/* virado: espelha por dentro do desenho (sem o volume de tecido, que escurece quando espelhado) */}
      <g transform={flip ? `translate(${S.w} 0) scale(-1 1)` : undefined}>
        <ellipse cx={S.w * 0.5} cy={S.h - 4} rx={S.w * 0.34} ry="4.6" fill="rgba(60,30,40,0.13)" />
        <g
          className={anim ? (kind === 'anda' ? (fast ? 'dogp-bob is-fast' : 'dogp-bob') : kind === 'dorme' ? 'hami-sleep' : 'hami-breathe') : undefined}
          style={{ transformOrigin: `${S.w / 2}px ${S.h}px` }}
        >
          {tail && (
            <g className={anim ? (kind === 'anda' ? 'dog-wag-fast' : 'dog-wag') : undefined} style={pivot(tail.piv)}>
              {im(tail.href, tail.box, furF, wetStyle)}
            </g>
          )}
          {kind === 'anda' && (
            <g className={anim ? 'dogp-leg-back' : undefined} style={pivot(SPRITES.anda.pivT)}>
              {im(andaPernaT, SPRITES.anda.pernaT, furF, wetStyle)}
            </g>
          )}
          {im(kind === 'dorme' ? dorme : kind === 'senta' ? senta : anda, S.base, furF, wetStyle)}
          {garment && (
            <g clipPath={costume ? undefined : `url(#hm${uid})`}>
              <g clipPath={`url(#cl${uid})`} filter={flip ? undefined : `url(#t${uid})`}>
                <rect x="0" y="0" width={S.w} height={S.h} fill={garment} />
                <g transform={`translate(${print.dx} 0)`}>
                  <Clothes id={roupa} geo={{ top: print.top, w: 48, h: 163, eyeY: 62 }} />
                </g>
              </g>
              <g clipPath={`url(#cl${uid})`}>
                <path d={S.clothes} fill="none" stroke={seam ?? garment} strokeWidth="4.4" />
                {!costume && kind === 'senta' && <path d={`M0 130 Q${S.w / 2} 141 ${S.w} 130`} fill="none" stroke={seam ?? garment} strokeWidth="2.6" />}
              </g>
            </g>
          )}
          {kind === 'anda' && bag && (
            <g>
              {/* mochilinha nas costas, com alça no ombro */}
              <path d="M92 104 C86 116 82 128 80 140" stroke="#C0563C" strokeWidth="4.4" strokeLinecap="round" fill="none" />
              <g transform="rotate(-8 124 122)">
                <rect x="106" y="98" width="36" height="46" rx="11" fill="#F07B5A" stroke="#C0563C" strokeWidth="2.4" />
                <path d="M106 112 Q124 104 142 112 V104 Q142 98 136 98 H112 Q106 98 106 104 Z" fill="#E0613F" />
                <rect x="113" y="120" width="22" height="16" rx="5" fill="#FFB49A" stroke="#C0563C" strokeWidth="1.8" />
                <circle cx="124" cy="112" r="2.4" fill="#FFD34D" />
              </g>
            </g>
          )}
          {kind === 'anda' && garment && (costume || !['regata', 'avental', 'jardineira', 'tutu', 'capa', 'babado'].includes(itemById(roupa)?.base ?? '')) && (
            <g clipPath={`url(#mg${uid})`}>
              <rect x="0" y="80" width="80" height="70" fill={garment} filter={flip ? undefined : `url(#t${uid})`} />
              <path d={SPRITES.anda.manga} fill="none" stroke={seam ?? garment} strokeWidth="4" />
            </g>
          )}
          {kind === 'anda' && (
            <g className={anim ? 'dogp-leg-front' : undefined} style={pivot(SPRITES.anda.pivF)}>
              {im(andaPernaF, SPRITES.anda.pernaF, furF, wetStyle)}
            </g>
          )}
          {im(kind === 'dorme' ? dormeRosto : kind === 'senta' ? sentaRosto : andaRosto, S.face)}
          {kind === 'anda' && carry && (
            <g transform="translate(-22 66) rotate(-6)">
              <path d="M4 15 C18 12 34 13 50 9 C56 8 62 7 66 6" stroke="#8B5A35" strokeWidth="6" strokeLinecap="round" fill="none" />
              <path d="M4 15 C18 12 34 13 50 9" stroke="#A9713F" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M50 9 C52 2 60 1 62 4 C58 8 54 9 50 9 Z" fill="#7CC765" />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}
