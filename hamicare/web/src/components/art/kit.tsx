// Kit das ilustrações do HamiCare: paleta, sombra, brilho e formas que se repetem.
// Estilo: formas chapadas e arredondadas, uma sombra suave de um lado e um brilho branco.
// Tudo desenhado num quadro de 64 × 64.
import type { ReactElement } from 'react';

export type Draw = () => ReactElement;

export const C = {
  red: '#F26D6D',
  redD: '#D24E58',
  orange: '#FF9F4D',
  orangeD: '#E27E2C',
  yellow: '#FFD25A',
  yellowD: '#EDB234',
  green: '#72C97F',
  greenD: '#4FA862',
  leaf: '#5DBB6E',
  leafD: '#3E9550',
  teal: '#52C7B6',
  tealD: '#2FA594',
  blue: '#6AAEF5',
  blueD: '#4A8DDB',
  sky: '#C4E5FF',
  purple: '#A98BF2',
  purpleD: '#8669D9',
  lilac: '#DCCDFF',
  pink: '#FF92B4',
  pinkD: '#E8709A',
  rose: '#FFD3E1',
  brown: '#C98D5E',
  brownD: '#A56C42',
  choc: '#7A4E32',
  wood: '#E9BA86',
  woodD: '#CF9A62',
  dark: '#4B4F5E',
  gray: '#D3D9E2',
  grayD: '#A3AEBD',
  white: '#FFFFFF',
  cream: '#FFF3DC',
  peach: '#FFD5B4',
  peachD: '#F2B48A',
};

/** Sombra: escurece um lado da forma. */
export const Sh = ({ d, o = 0.13 }: { d: string; o?: number }) => <path d={d} fill="#000" opacity={o} />;

/** Brilho branco (elipse, podendo girar). */
export const Hi = ({ x, y, rx, ry, r = 0, o = 0.6 }: { x: number; y: number; rx: number; ry: number; r?: number; o?: number }) => (
  <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#fff" opacity={o} transform={r ? `rotate(${r} ${x} ${y})` : undefined} />
);

/** Coração com centro (cx, cy) e largura aproximada 2·s. */
export function heart(cx: number, cy: number, s: number) {
  const k = s / 10;
  return `M${cx} ${cy + 8 * k} C${cx - 13 * k} ${cy - 1 * k} ${cx - 9 * k} ${cy - 11 * k} ${cx - 4.5 * k} ${cy - 10 * k} C${cx - 2 * k} ${cy - 9.5 * k} ${cx} ${cy - 7 * k} ${cx} ${cy - 5 * k} C${cx} ${cy - 7 * k} ${cx + 2 * k} ${cy - 9.5 * k} ${cx + 4.5 * k} ${cy - 10 * k} C${cx + 9 * k} ${cy - 11 * k} ${cx + 13 * k} ${cy - 1 * k} ${cx} ${cy + 8 * k}Z`;
}

/** Estrela de n pontas (cantos arredondados quando desenhada com stroke da mesma cor). */
export function star(cx: number, cy: number, R: number, r: number, n = 5, rot = -90) {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = ((rot + (i * 180) / n) * Math.PI) / 180;
    const rad = i % 2 === 0 ? R : r;
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(1)} ${(cy + Math.sin(a) * rad).toFixed(1)}`);
  }
  return `M${pts.join(' L')}Z`;
}

/** Gota (ponta para cima). */
export function drop(cx: number, cy: number, s: number) {
  return `M${cx} ${cy - 1.6 * s} C${cx} ${cy - 1.6 * s} ${cx - s} ${cy - 0.3 * s} ${cx - s} ${cy + 0.35 * s} A${s} ${s} 0 0 0 ${cx + s} ${cy + 0.35 * s} C${cx + s} ${cy - 0.3 * s} ${cx} ${cy - 1.6 * s} ${cx} ${cy - 1.6 * s}Z`;
}

/** Brilhinho de 4 pontas. */
export function sparkle(cx: number, cy: number, s: number) {
  return `M${cx} ${cy - s} Q${cx + s * 0.18} ${cy - s * 0.18} ${cx + s} ${cy} Q${cx + s * 0.18} ${cy + s * 0.18} ${cx} ${cy + s} Q${cx - s * 0.18} ${cy + s * 0.18} ${cx - s} ${cy} Q${cx - s * 0.18} ${cy - s * 0.18} ${cx} ${cy - s}Z`;
}

/** Olhinhos e bochechas de personagem (sol, nuvem, fantasma…). */
export const Face = ({ x, y, w = 10, eye = C.dark, cheek = '#FF9FB5', smile = true }: { x: number; y: number; w?: number; eye?: string; cheek?: string | null; smile?: boolean }) => (
  <g>
    <circle cx={x - w / 2} cy={y} r={w * 0.16} fill={eye} />
    <circle cx={x + w / 2} cy={y} r={w * 0.16} fill={eye} />
    {smile && <path d={`M${x - w * 0.2} ${y + w * 0.28} Q${x} ${y + w * 0.5} ${x + w * 0.2} ${y + w * 0.28}`} stroke={eye} strokeWidth={w * 0.11} fill="none" strokeLinecap="round" />}
    {cheek && (
      <>
        <ellipse cx={x - w * 0.82} cy={y + w * 0.32} rx={w * 0.2} ry={w * 0.12} fill={cheek} opacity={0.8} />
        <ellipse cx={x + w * 0.82} cy={y + w * 0.32} rx={w * 0.2} ry={w * 0.12} fill={cheek} opacity={0.8} />
      </>
    )}
  </g>
);

/** Vasinho de planta (usado por várias plantas da casa). */
export const Pot = ({ color = C.orange, y = 44 }: { color?: string; y?: number }) => (
  <g>
    <path d={`M18 ${y} H46 L42 ${y + 16} Q41.5 ${y + 18} 39.5 ${y + 18} H24.5 Q22.5 ${y + 18} 22 ${y + 16}Z`} fill={color} />
    <rect x="16" y={y - 3} width="32" height="7" rx="3" fill={color} />
    <Sh d={`M38 ${y + 4} H44 L41 ${y + 16} Q40.6 ${y + 18} 38.5 ${y + 18} H35Z`} />
    <rect x="16" y={y + 2} width="32" height="2" fill="#000" opacity="0.08" />
  </g>
);
