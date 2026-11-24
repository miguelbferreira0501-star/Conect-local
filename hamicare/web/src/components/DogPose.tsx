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
const pivot = (p: readonly number[]): CSSProperties => ({ transformOrigin: `${p[0]}px ${p[1]}px`, transformBox: 'view-box' });
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
}: {
  kind: DogPoseKind;
  fur: string;
  outfit?: Outfit;
  width?: number;
  still?: boolean;
  wet?: boolean;
  label?: string;
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
        {kind === 'anda' && (
          <clipPath id={`mg${uid}`}>
            <path d={SPRITES.anda.manga} />
          </clipPath>
        )}
        <FabricFilter id={`t${uid}`} />
      </defs>
      <ellipse cx={S.w * 0.5} cy={S.h - 4} rx={S.w * 0.34} ry="4.6" fill="rgba(60,30,40,0.13)" />
      <g className={anim ? (kind === 'anda' ? 'dogp-bob' : kind === 'dorme' ? 'hami-sleep' : 'hami-breathe') : undefined} style={{ transformOrigin: `${S.w / 2}px ${S.h}px` }}>
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
          <g>
            <g clipPath={`url(#cl${uid})`} filter={`url(#t${uid})`}>
              <rect x="0" y="0" width={S.w} height={S.h} fill={garment} />
              <g transform={`translate(${print.dx} 0)`}>
                <Clothes id={roupa} geo={{ top: print.top, w: 48, h: 163, eyeY: 62 }} />
              </g>
            </g>
            <g clipPath={`url(#cl${uid})`}>
              <path d={S.clothes} fill="none" stroke={seam ?? garment} strokeWidth="4.4" />
            </g>
          </g>
        )}
        {kind === 'anda' && garment && (costume || !['regata', 'avental', 'jardineira', 'tutu', 'capa', 'babado'].includes(itemById(roupa)?.base ?? '')) && (
          <g clipPath={`url(#mg${uid})`}>
            <rect x="0" y="80" width="80" height="70" fill={garment} filter={`url(#t${uid})`} />
            <path d={SPRITES.anda.manga} fill="none" stroke={seam ?? garment} strokeWidth="4" />
          </g>
        )}
        {kind === 'anda' && (
          <g className={anim ? 'dogp-leg-front' : undefined} style={pivot(SPRITES.anda.pivF)}>
            {im(andaPernaF, SPRITES.anda.pernaF, furF, wetStyle)}
          </g>
        )}
        {im(kind === 'dorme' ? dormeRosto : kind === 'senta' ? sentaRosto : andaRosto, S.face)}
      </g>
    </svg>
  );
}
