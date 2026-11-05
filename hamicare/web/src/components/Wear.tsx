// Peças desenhadas no Hami. Cada item da loja aponta para um modelo (`base`) e cores (`c1`, `c2`),
// então as variações de cor usam o mesmo desenho. Coordenadas no quadro 0–200 do Hamster.
import { itemById } from '../data/items';

const INK = '#2B2224';
export type Geo = { top: number; w: number; h: number; eyeY: number };

function look(id: string | null | undefined, c1: string, c2: string) {
  const it = id ? itemById(id) : undefined;
  return { base: it?.base ?? id ?? null, c1: it?.c1 ?? c1, c2: it?.c2 ?? c2 };
}

function heartPath(x: number, y: number, s: number) {
  const k = s / 12;
  return `M${x} ${y + 9 * k} C${x - 14 * k} ${y - 1 * k} ${x - 9 * k} ${y - 11 * k} ${x} ${y - 4 * k} C${x + 9 * k} ${y - 11 * k} ${x + 14 * k} ${y - 1 * k} ${x} ${y + 9 * k} Z`;
}
const star = (x: number, y: number, r: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
};
const sparkle = (x: number, y: number, r: number) => `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`;

/** A roupa esconde o coração da barriga? */
export function hidesHeart(roupa: string | null | undefined): boolean {
  const base = look(roupa, '', '').base;
  return !!base && !['tutu', 'capa', 'avental'].includes(base);
}

/** Capa: fica atrás do corpo. */
export function Cape({ id, geo }: { id: string | null | undefined; geo: Geo }) {
  const { base, c1 } = look(id, '#D7263D', '#A81C2E');
  if (base !== 'capa') return null;
  const { top, w, h } = geo;
  return <path d={`M${100 - w * 0.7} ${top + h * 0.5} L${100 - w - 10} 182 L${100 + w + 10} 182 L${100 + w * 0.7} ${top + h * 0.5} Z`} fill={c1} />;
}

export function Hat({ id, geo }: { id: string | null; geo: Geo }) {
  const { top, w, h } = geo;
  const L = look(id, '#FF5E7E', '#E2416A');
  const { c1, c2 } = L;
  const it = id ? itemById(id) : undefined;
  switch (L.base) {
    case 'laco':
      return (
        <g transform={`translate(${100 + w * 0.42} ${top + 8})`}>
          <path d="M0 0 L-16 -11 L-14 12 Z" fill={c1} />
          <path d="M0 0 L16 -11 L14 12 Z" fill={c1} />
          <circle r="5.5" fill={c2} />
        </g>
      );
    case 'bone': {
      const a = it?.c1 ?? '#3D6FD8';
      const b = it?.c2 ?? '#2F59B3';
      return (
        <g>
          <path d={`M${100 - w * 0.66} ${top + 18} C${100 - w * 0.6} ${top - 16} ${100 + w * 0.6} ${top - 16} ${100 + w * 0.66} ${top + 18} Z`} fill={a} />
          <path d={`M${100 + w * 0.5} ${top + 14} C${100 + w * 0.9} ${top + 8} ${100 + w * 1.15} ${top + 14} ${100 + w * 1.15} ${top + 20} C${100 + w * 0.9} ${top + 22} ${100 + w * 0.6} ${top + 20} ${100 + w * 0.5} ${top + 18} Z`} fill={b} />
          <circle cx="100" cy={top - 6} r="3.5" fill={b} />
        </g>
      );
    }
    case 'gorro': {
      const a = it?.c1 ?? '#4C9F9F';
      const b = it?.c2 ?? '#3B8686';
      return (
        <g>
          <path d={`M${100 - w * 0.7} ${top + 18} C${100 - w * 0.66} ${top - 22} ${100 + w * 0.66} ${top - 22} ${100 + w * 0.7} ${top + 18} Z`} fill={a} />
          <rect x={100 - w * 0.74} y={top + 10} width={w * 1.48} height="11" rx="5.5" fill={b} />
          <circle cx="100" cy={top - 15} r="9" fill={it?.c1 ? '#FFFFFF' : '#F2C14E'} />
        </g>
      );
    }
    case 'coroa':
      return (
        <g>
          {[-0.6, -0.35, -0.12, 0.12, 0.35, 0.6].map((k, i) => (
            <g key={k} transform={`translate(${100 + w * k} ${top + 6 + Math.abs(k) * 14})`}>
              <circle r="7" fill={['#FF8FB4', '#FFD660', '#FFFFFF', '#B39AE6', '#FF8FB4', '#FFD660'][i]} />
              <circle r="2.6" fill="#E8879E" />
            </g>
          ))}
        </g>
      );
    case 'chef':
      return (
        <g>
          <rect x={100 - w * 0.4} y={top - 6} width={w * 0.8} height="18" fill="#FFFFFF" stroke="#E6E6E6" />
          {[-0.28, 0, 0.28].map((k) => (
            <circle key={k} cx={100 + w * k} cy={top - 16} r="15" fill="#FFFFFF" stroke="#E6E6E6" />
          ))}
        </g>
      );
    case 'cartola':
      return (
        <g>
          <ellipse cx="100" cy={top + 8} rx={w * 0.62} ry="7" fill="#2B2224" />
          <rect x={100 - w * 0.38} y={top - 34} width={w * 0.76} height="42" rx="4" fill="#2B2224" />
          <rect x={100 - w * 0.38} y={top - 2} width={w * 0.76} height="7" fill="#D1495B" />
        </g>
      );
    case 'capacete':
      return <circle cx="100" cy={top + h * 0.42} r={w * 1.02} fill="#BFE3FF" fillOpacity="0.25" stroke="#FFFFFF" strokeWidth="4" />;
    case 'palha':
      return (
        <g>
          <ellipse cx="100" cy={top + 10} rx={w * 1.02} ry="11" fill="#E3B65C" />
          <path d={`M${100 - w * 0.5} ${top + 10} C${100 - w * 0.48} ${top - 20} ${100 + w * 0.48} ${top - 20} ${100 + w * 0.5} ${top + 10} Z`} fill="#F0CF7C" />
          <rect x={100 - w * 0.5} y={top + 1} width={w} height="7" fill="#D1495B" />
        </g>
      );
    case 'gorro-natal':
      return (
        <g>
          <path d={`M${100 - w * 0.7} ${top + 16} C${100 - w * 0.6} ${top - 18} ${100 + w * 0.2} ${top - 34} ${100 + w * 0.95} ${top - 18} C${100 + w * 0.6} ${top - 8} ${100 + w * 0.55} ${top + 2} ${100 + w * 0.68} ${top + 16} Z`} fill="#D7263D" />
          <rect x={100 - w * 0.76} y={top + 8} width={w * 1.5} height="13" rx="6.5" fill="#FFFFFF" />
          <circle cx={100 + w * 0.98} cy={top - 18} r="8" fill="#FFFFFF" />
        </g>
      );
    case 'boina':
      return (
        <g transform={`rotate(-12 100 ${top + 8})`}>
          <ellipse cx={100 - w * 0.08} cy={top + 6} rx={w * 0.66} ry="14" fill={c1} />
          <ellipse cx={100 - w * 0.08} cy={top + 10} rx={w * 0.6} ry="6" fill={c2} opacity="0.45" />
          <circle cx={100 - w * 0.08} cy={top - 9} r="4" fill={c2} />
        </g>
      );
    case 'fone':
      return (
        <g>
          <path d={`M${100 - w * 0.86} ${top + h * 0.3} C${100 - w * 0.9} ${top - 26} ${100 + w * 0.9} ${top - 26} ${100 + w * 0.86} ${top + h * 0.3}`} fill="none" stroke={c1} strokeWidth="7" strokeLinecap="round" />
          {[-1, 1].map((s) => (
            <g key={s}>
              <rect x={100 + s * w * 0.92 - 9} y={top + h * 0.3 - 14} width="18" height="28" rx="8" fill={c1} />
              <rect x={100 + s * w * 0.92 - 5} y={top + h * 0.3 - 9} width="10" height="18" rx="5" fill={c2} />
            </g>
          ))}
        </g>
      );
    case 'flor': {
      const cx = 100 - w * 0.55;
      const cy = top + 10;
      return (
        <g>
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={cx + Math.cos((a * Math.PI) / 180) * 6.5} cy={cy + Math.sin((a * Math.PI) / 180) * 6.5} r="6.5" fill={c1} />
          ))}
          <circle cx={cx} cy={cy} r="4.8" fill={c1 === '#FFD34D' ? '#FF9A4D' : '#FFD34D'} />
        </g>
      );
    }
    case 'faixa': {
      const d = `M${100 - w * 0.86} ${top + 26} Q100 ${top + 4} ${100 + w * 0.86} ${top + 26}`;
      return (
        <g fill="none" strokeLinecap="round">
          <path d={d} stroke={c1} strokeWidth="11" />
          <path d={d} stroke="#FFFFFF" strokeWidth="2.4" opacity="0.85" />
        </g>
      );
    }
    case 'orelhas-coelho':
      return (
        <g>
          {[-1, 1].map((s) => (
            <g key={s} transform={`rotate(${s * 12} ${100 + s * w * 0.28} ${top})`}>
              <ellipse cx={100 + s * w * 0.28} cy={top - 20} rx="8.5" ry="25" fill={c1} stroke={c1 === '#FFFFFF' ? '#E6E2EC' : 'none'} />
              <ellipse cx={100 + s * w * 0.28} cy={top - 18} rx="4" ry="17" fill="#FFB3C7" />
            </g>
          ))}
          <path d={`M${100 - w * 0.6} ${top + 14} Q100 ${top - 6} ${100 + w * 0.6} ${top + 14}`} fill="none" stroke={c2} strokeWidth="5" strokeLinecap="round" />
        </g>
      );
    case 'festa':
      return (
        <g transform={`rotate(10 100 ${top})`}>
          <path d={`M84 ${top + 6} L100 ${top - 34} L116 ${top + 6} Z`} fill={c1} />
          <path d={`M89 ${top - 6} L111 ${top - 6} M93 ${top - 18} L107 ${top - 18}`} stroke={c2} strokeWidth="4" />
          <circle cx="100" cy={top - 36} r="5.5" fill="#FFFFFF" />
        </g>
      );
    case 'touca-urso':
      return (
        <g>
          {[-1, 1].map((s) => (
            <g key={s}>
              <circle cx={100 + s * w * 0.56} cy={top - 4} r="11" fill={c1} stroke={c1 === '#FFFFFF' ? '#E6E2EC' : 'none'} />
              <circle cx={100 + s * w * 0.56} cy={top - 4} r="5.5" fill="#FFE2CF" />
            </g>
          ))}
          <path d={`M${100 - w * 0.8} ${top + 22} C${100 - w * 0.76} ${top - 18} ${100 + w * 0.76} ${top - 18} ${100 + w * 0.8} ${top + 22} Z`} fill={c1} stroke={c1 === '#FFFFFF' ? '#E6E2EC' : 'none'} />
        </g>
      );
    case 'chapeu-sol':
      return (
        <g>
          <ellipse cx="100" cy={top + 10} rx={w * 1.12} ry="12" fill={c1} />
          <path d={`M${100 - w * 0.5} ${top + 10} C${100 - w * 0.48} ${top - 20} ${100 + w * 0.48} ${top - 20} ${100 + w * 0.5} ${top + 10} Z`} fill={c1} />
          <path d={`M${100 - w * 0.5} ${top + 10} C${100 - w * 0.48} ${top - 20} ${100 + w * 0.48} ${top - 20} ${100 + w * 0.5} ${top + 10} Z`} fill="#000000" opacity="0.06" />
          <rect x={100 - w * 0.5} y={top + 1} width={w} height="6" fill={c2} />
          <circle cx={100 + w * 0.45} cy={top + 4} r="5" fill={c2} />
        </g>
      );
    case 'tiara':
      return (
        <g>
          <path d={`M82 ${top + 7} L82 ${top - 8} L91 ${top} L100 ${top - 13} L109 ${top} L118 ${top - 8} L118 ${top + 7} Z`} fill={c1} stroke="#D99E1E" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="100" cy={top - 2} r="3.6" fill={c2} />
          <circle cx="89" cy={top + 2} r="2.4" fill="#7BD3F0" />
          <circle cx="111" cy={top + 2} r="2.4" fill="#7BD3F0" />
        </g>
      );
    case 'coroa-rei':
      return (
        <g>
          <path d={`M74 ${top + 10} L74 ${top - 16} L87 ${top - 4} L100 ${top - 24} L113 ${top - 4} L126 ${top - 16} L126 ${top + 10} Z`} fill={c1} stroke="#D99E1E" strokeWidth="2" strokeLinejoin="round" />
          <rect x="74" y={top + 2} width="52" height="8" fill={c2} />
          {[74, 100, 126].map((x, i) => (
            <circle key={x} cx={x} cy={[top - 17, top - 25, top - 17][i]} r="3.6" fill="#FFF3B0" />
          ))}
          <circle cx="100" cy={top - 6} r="4" fill="#5B8DEF" />
        </g>
      );
    case 'aureola':
      return (
        <g className="sparkle">
          <ellipse cx="100" cy={top - 16} rx={w * 0.55} ry="8" fill="none" stroke={c2} strokeWidth="10" opacity="0.35" />
          <ellipse cx="100" cy={top - 16} rx={w * 0.55} ry="8" fill="none" stroke={c1} strokeWidth="5" />
        </g>
      );
    case 'cowboy':
      return (
        <g>
          <path d={`M${100 - w * 1.05} ${top + 4} Q100 ${top + 26} ${100 + w * 1.05} ${top + 4} Q100 ${top + 14} ${100 - w * 1.05} ${top + 4} Z`} fill={c2} />
          <path d={`M${100 - w * 0.46} ${top + 10} C${100 - w * 0.46} ${top - 24} ${100 - w * 0.1} ${top - 14} 100 ${top - 20} C${100 + w * 0.1} ${top - 14} ${100 + w * 0.46} ${top - 24} ${100 + w * 0.46} ${top + 10} Z`} fill={c1} />
          <rect x={100 - w * 0.46} y={top + 2} width={w * 0.92} height="5" fill="#5C3A24" />
        </g>
      );
    case 'viking':
      return (
        <g>
          {[-1, 1].map((s) => (
            <path key={s} transform={s === 1 ? 'translate(200 0) scale(-1 1)' : undefined} d={`M${100 - w * 0.62} ${top + 6} C${100 - w * 1.05} ${top - 2} ${100 - w * 1.08} ${top - 26} ${100 - w * 0.95} ${top - 36} C${100 - w * 0.86} ${top - 18} ${100 - w * 0.78} ${top - 6} ${100 - w * 0.5} ${top + 2} Z`} fill={c2} stroke="#E3CFA8" strokeWidth="1.5" />
          ))}
          <path d={`M${100 - w * 0.72} ${top + 18} C${100 - w * 0.68} ${top - 22} ${100 + w * 0.68} ${top - 22} ${100 + w * 0.72} ${top + 18} Z`} fill={c1} />
          <rect x={100 - w * 0.76} y={top + 10} width={w * 1.52} height="10" rx="5" fill="#9AA3B2" />
          {[-0.45, 0, 0.45].map((k) => (
            <circle key={k} cx={100 + w * k} cy={top + 15} r="2.2" fill="#E7ECF3" />
          ))}
        </g>
      );
    case 'sapo':
      return (
        <g>
          <path d={`M${100 - w * 0.72} ${top + 18} C${100 - w * 0.68} ${top - 18} ${100 + w * 0.68} ${top - 18} ${100 + w * 0.72} ${top + 18} Z`} fill={c1} />
          {[-1, 1].map((s) => (
            <g key={s}>
              <circle cx={100 + s * w * 0.34} cy={top - 12} r="10" fill={c1} />
              <circle cx={100 + s * w * 0.34} cy={top - 12} r="6.5" fill="#FFFFFF" />
              <circle cx={100 + s * w * 0.34} cy={top - 11} r="3.4" fill={INK} />
            </g>
          ))}
          <path d={`M${100 - w * 0.3} ${top + 6} Q100 ${top + 14} ${100 + w * 0.3} ${top + 6}`} fill="none" stroke={c2} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case 'antenas':
      return (
        <g fill="none" stroke={c1} strokeWidth="3" strokeLinecap="round">
          <path d={`M92 ${top + 2} Q86 ${top - 12} 80 ${top - 22}`} />
          <path d={`M108 ${top + 2} Q114 ${top - 12} 120 ${top - 22}`} />
          <circle cx="80" cy={top - 24} r="5.5" fill={c2} stroke={c1} strokeWidth="2" />
          <circle cx="120" cy={top - 24} r="5.5" fill={c2} stroke={c1} strokeWidth="2" />
        </g>
      );
    case 'unicornio':
      return (
        <g>
          <path d={`M92 ${top + 4} L100 ${top - 32} L108 ${top + 4} Z`} fill={c1} stroke="#E8B020" strokeWidth="1.5" strokeLinejoin="round" />
          <path d={`M94 ${top - 4} L106 ${top - 8} M95.5 ${top - 14} L104.5 ${top - 18}`} stroke={c2} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx={100 - w * 0.45} cy={top + 8} r="5" fill={c2} />
          <circle cx={100 + w * 0.45} cy={top + 8} r="5" fill="#B9A6F2" />
        </g>
      );
    case 'pirata': {
      const d = `M${100 - w * 0.92} ${top + 12} Q${100 - w * 0.6} ${top - 24} 100 ${top - 10} Q${100 + w * 0.6} ${top - 24} ${100 + w * 0.92} ${top + 12} Q100 ${top + 2} ${100 - w * 0.92} ${top + 12} Z`;
      return (
        <g>
          <path d={d} fill={c1} />
          <path d={d} fill="none" stroke={c2} strokeWidth="2.5" />
          <circle cx="100" cy={top - 3} r="4.5" fill="#FFFFFF" />
          <path d={`M94 ${top + 3} L106 ${top - 1} M94 ${top - 1} L106 ${top + 3}`} stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    }
    case 'formatura':
      return (
        <g>
          <rect x={100 - w * 0.42} y={top - 4} width={w * 0.84} height="14" rx="3" fill={c1} />
          <path d={`M${100 - w * 0.84} ${top - 4} L100 ${top - 18} L${100 + w * 0.84} ${top - 4} L100 ${top + 8} Z`} fill="#3A3440" />
          <path d={`M100 ${top - 6} L${100 + w * 0.7} ${top - 1} L${100 + w * 0.7} ${top + 16}`} fill="none" stroke={c2} strokeWidth="2.5" />
          <rect x={100 + w * 0.7 - 3} y={top + 14} width="6" height="9" rx="2" fill={c2} />
        </g>
      );
    case 'bruxa':
      return (
        <g>
          <ellipse cx="100" cy={top + 10} rx={w * 1.05} ry="9" fill={c1} />
          <path d={`M${100 - w * 0.42} ${top + 9} Q${100 - w * 0.1} ${top - 20} ${100 + w * 0.15} ${top - 40} Q${100 + w * 0.5} ${top - 48} ${100 + w * 0.64} ${top - 30} Q${100 + w * 0.36} ${top - 30} ${100 + w * 0.3} ${top - 12} L${100 + w * 0.42} ${top + 9} Z`} fill={c1} />
          <rect x={100 - w * 0.42} y={top} width={w * 0.84} height="6" fill={c2} />
        </g>
      );
    default:
      return null;
  }
}

export function Glasses({ id, eyeY }: { id: string | null; eyeY: number }) {
  const it = id ? itemById(id) : undefined;
  const base = it?.base ?? id;
  const c1 = it?.c1;
  const c2 = it?.c2;
  switch (base) {
    case 'redondos':
      return (
        <g stroke={c1 ?? INK} strokeWidth="2.8" fill="#FFFFFF" fillOpacity="0.15">
          <circle cx="81" cy={eyeY} r="11.5" />
          <circle cx="119" cy={eyeY} r="11.5" />
          <path d={`M92.5 ${eyeY - 1} Q100 ${eyeY - 5} 107.5 ${eyeY - 1}`} fill="none" />
        </g>
      );
    case 'sol':
      return (
        <g>
          <rect x="68" y={eyeY - 8} width="26" height="16" rx="7" fill={c1 ?? '#2B2224'} opacity={c1 ? 0.92 : 1} />
          <rect x="106" y={eyeY - 8} width="26" height="16" rx="7" fill={c1 ?? '#2B2224'} opacity={c1 ? 0.92 : 1} />
          <path d={`M94 ${eyeY - 2} L106 ${eyeY - 2}`} stroke={c2 ?? '#2B2224'} strokeWidth="3" />
          <path d={`M72 ${eyeY - 4} l6 0`} stroke="#fff" strokeWidth="2" opacity="0.6" />
        </g>
      );
    case 'coracao':
      return (
        <g>
          <path d={heartPath(81, eyeY - 1, 15)} fill="#FF5E7E" opacity="0.9" />
          <path d={heartPath(119, eyeY - 1, 15)} fill="#FF5E7E" opacity="0.9" />
          <path d={`M93 ${eyeY - 3} L107 ${eyeY - 3}`} stroke="#E2416A" strokeWidth="2.5" />
        </g>
      );
    case 'quadrado':
      return (
        <g stroke={c1} strokeWidth="4" fill="#FFFFFF" fillOpacity="0.12" strokeLinejoin="round">
          <rect x="67" y={eyeY - 10} width="27" height="20" rx="4" />
          <rect x="106" y={eyeY - 10} width="27" height="20" rx="4" />
          <path d={`M94 ${eyeY - 3} L106 ${eyeY - 3}`} fill="none" />
        </g>
      );
    case 'gatinho': {
      const lens = `M68 ${eyeY - 4} Q78 ${eyeY - 13} 94 ${eyeY - 8} L93 ${eyeY + 5} Q82 ${eyeY + 12} 71 ${eyeY + 5} Z`;
      return (
        <g stroke={c1} strokeWidth="3.5" fill="#FFFFFF" fillOpacity="0.12" strokeLinejoin="round">
          <path d={lens} />
          <path d={lens} transform="translate(200 0) scale(-1 1)" />
          <path d={`M94 ${eyeY - 3} L106 ${eyeY - 3}`} fill="none" />
        </g>
      );
    }
    case 'estrela':
      return (
        <g>
          <path d={star(81, eyeY, 14)} fill={c1} opacity="0.92" stroke={c2} strokeWidth="1.5" strokeLinejoin="round" />
          <path d={star(119, eyeY, 14)} fill={c1} opacity="0.92" stroke={c2} strokeWidth="1.5" strokeLinejoin="round" />
          <path d={`M94 ${eyeY - 2} L106 ${eyeY - 2}`} stroke={c2} strokeWidth="2.5" />
        </g>
      );
    case 'aviador': {
      const lens = `M68 ${eyeY - 8} L94 ${eyeY - 8} Q95 ${eyeY + 10} 81 ${eyeY + 11} Q67 ${eyeY + 9} 68 ${eyeY - 8} Z`;
      return (
        <g>
          <path d={lens} fill={c1} opacity="0.9" stroke={c2} strokeWidth="2" />
          <path d={lens} transform="translate(200 0) scale(-1 1)" fill={c1} opacity="0.9" stroke={c2} strokeWidth="2" />
          <path d={`M94 ${eyeY - 7} L106 ${eyeY - 7} M95 ${eyeY - 3} Q100 ${eyeY - 6} 105 ${eyeY - 3}`} stroke={c2} strokeWidth="2" fill="none" />
        </g>
      );
    }
    case 'monoculo':
      return (
        <g>
          <circle cx="119" cy={eyeY} r="12" fill="#FFFFFF" fillOpacity="0.15" stroke={c1} strokeWidth="3" />
          <path d={`M131 ${eyeY + 2} Q138 ${eyeY + 18} 134 ${eyeY + 32}`} fill="none" stroke={c2} strokeWidth="1.6" strokeDasharray="2 2" />
        </g>
      );
    case 'mascara': {
      const hole = (x: number) => `M${x - 10} ${eyeY} a10 9 0 1 0 20 0 a10 9 0 1 0 -20 0 Z`;
      return <path fillRule="evenodd" d={`M58 ${eyeY - 10} Q100 ${eyeY - 17} 142 ${eyeY - 10} L140 ${eyeY + 9} Q100 ${eyeY + 13} 60 ${eyeY + 9} Z ${hole(81)} ${hole(119)}`} fill={c1} />;
    }
    case 'natacao':
      return (
        <g>
          <path d={`M56 ${eyeY} L69 ${eyeY} M131 ${eyeY} L144 ${eyeY}`} stroke={c2} strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="81" cy={eyeY} rx="12.5" ry="10.5" fill={c1} fillOpacity="0.45" stroke={c2} strokeWidth="3" />
          <ellipse cx="119" cy={eyeY} rx="12.5" ry="10.5" fill={c1} fillOpacity="0.45" stroke={c2} strokeWidth="3" />
          <path d={`M93 ${eyeY - 1} L107 ${eyeY - 1}`} stroke={c2} strokeWidth="3" />
        </g>
      );
    default:
      return null;
  }
}

/** Roupas: desenhadas dentro do contorno do corpo (o recorte fica no Hamster). */
export function Clothes({ id, geo }: { id: string | null; geo: Geo }) {
  const { top, h } = geo;
  const y = top + h * 0.6;
  const it = id ? itemById(id) : undefined;
  const base = it?.base ?? id;
  const c1 = it?.c1;
  const c2 = it?.c2;
  const full = (fill: string, dy = 0) => <rect x="0" y={y + dy} width="200" height="100" fill={fill} />;
  switch (base) {
    case 'moletom':
      return (
        <g>
          {full(c1 ?? '#8FA8E8')}
          <rect x="82" y={y + 22} width="36" height="16" rx="5" fill={c2 ?? '#7A93D6'} />
          <path d={`M92 ${y} l0 14 M108 ${y} l0 14`} stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    case 'regata':
      return (
        <g>
          {full(c1 ?? '#FF6F91', 2)}
          <path d={`M78 ${y + 2} Q100 ${y + 16} 122 ${y + 2}`} fill="#FFFFFF" opacity="0.9" />
          <text x="100" y={y + 34} textAnchor="middle" fontSize="16" fontWeight="900" fill="#FFFFFF">
            1
          </text>
        </g>
      );
    case 'pijama':
      return (
        <g>
          {full('#3E4C8A')}
          {[[78, 14], [112, 24], [92, 34], [126, 12], [70, 32]].map(([x, dy], i) => (
            <circle key={i} cx={x} cy={y + dy} r="2.6" fill="#FFE07A" />
          ))}
        </g>
      );
    case 'tutu':
      return <path d={`M30 ${y + 30} L45 ${y + 18} L58 ${y + 30} L72 ${y + 18} L86 ${y + 30} L100 ${y + 18} L114 ${y + 30} L128 ${y + 18} L142 ${y + 30} L156 ${y + 18} L170 ${y + 30} L170 ${y + 44} L30 ${y + 44} Z`} fill={c1 ?? '#FFB3CF'} opacity="0.9" />;
    case 'capa':
      return <circle cx="100" cy={y - 2} r="4.5" fill="#F6C445" stroke="#D99E1E" strokeWidth="1.5" />;
    case 'camiseta': {
      const print = c1 === '#FFFFFF' ? '#FF6F91' : '#FFFFFF';
      return (
        <g>
          {full(c1 ?? '#FFFFFF', 2)}
          <path d={`M84 ${y + 2} Q100 ${y + 13} 116 ${y + 2}`} fill="none" stroke={c2 ?? '#DADAE2'} strokeWidth="3" />
          <path d={heartPath(100, y + 25, 10)} fill={print} />
        </g>
      );
    }
    case 'listrada':
      return (
        <g>
          {full('#FFFFFF')}
          {[4, 16, 28, 40, 52].map((dy) => (
            <rect key={dy} x="0" y={y + dy} width="200" height="6" fill={c1} />
          ))}
        </g>
      );
    case 'vestido':
      return (
        <g>
          {full(c1 ?? '#FFB3CF', -2)}
          <rect x="0" y={y + 14} width="200" height="5" fill={c2} />
          {[[74, 30], [98, 38], [122, 28], [86, 48], [112, 50], [64, 46], [136, 44]].map(([x, dy], i) => (
            <circle key={i} cx={x} cy={y + dy} r="2.3" fill="#FFFFFF" opacity="0.9" />
          ))}
        </g>
      );
    case 'jaqueta':
      return (
        <g>
          {full(c1 ?? '#3A3440')}
          <path d={`M100 ${y} L100 182`} stroke={c2} strokeWidth="2.5" />
          <rect x="97.5" y={y + 10} width="5" height="7" rx="1.5" fill="#D9D9E0" />
          <path d={`M82 ${y} L100 ${y + 13} L90 ${y} Z M118 ${y} L100 ${y + 13} L110 ${y} Z`} fill={c2} />
          <path d={`M70 ${y + 30} l14 0 M116 ${y + 30} l14 0`} stroke={c2} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    case 'kimono':
      return (
        <g>
          {full(c1 ?? '#F0525F')}
          <path d={`M80 ${y - 2} L100 ${y + 22} L120 ${y - 2}`} fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinejoin="round" />
          <rect x="0" y={y + 26} width="200" height="8" fill={c2} />
          <path d={`M100 ${y + 30} l-7 10 M100 ${y + 30} l7 10`} stroke={c2} strokeWidth="3.5" strokeLinecap="round" />
        </g>
      );
    case 'florida':
      return (
        <g>
          {full(c1 ?? '#5B8DEF')}
          {[[72, 14], [104, 10], [132, 22], [88, 32], [118, 40], [66, 42], [100, 52]].map(([x, dy], i) => (
            <g key={i}>
              {[0, 90, 180, 270].map((a) => (
                <circle key={a} cx={x + Math.cos((a * Math.PI) / 180) * 3.2} cy={y + dy + Math.sin((a * Math.PI) / 180) * 3.2} r="2.6" fill="#FFFFFF" />
              ))}
              <circle cx={x} cy={y + dy} r="2" fill="#FFD34D" />
            </g>
          ))}
          <path d={`M88 ${y} L100 ${y + 10} L112 ${y}`} fill="none" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.8" />
        </g>
      );
    case 'jardineira':
      return (
        <g>
          <rect x="0" y={y + 16} width="200" height="100" fill={c1} />
          <rect x="82" y={y + 2} width="36" height="18" rx="3" fill={c1} />
          <path d={`M84 ${y + 4} L76 ${y - 16} M116 ${y + 4} L124 ${y - 16}`} stroke={c1} strokeWidth="5" strokeLinecap="round" />
          <circle cx="86" cy={y + 6} r="2.4" fill="#F6C445" />
          <circle cx="114" cy={y + 6} r="2.4" fill="#F6C445" />
          <rect x="91" y={y + 8} width="18" height="9" rx="2" fill={c2} />
        </g>
      );
    case 'futebol':
      return (
        <g>
          {full(c1 ?? '#FFD34D', 2)}
          <path d={`M88 ${y + 2} L100 ${y + 12} L112 ${y + 2}`} fill="none" stroke={c2} strokeWidth="4" strokeLinejoin="round" />
          <text x="100" y={y + 36} textAnchor="middle" fontSize="15" fontWeight="900" fill={c2}>
            10
          </text>
        </g>
      );
    case 'abelha':
      return (
        <g>
          {full(c1 ?? '#FFD34D')}
          {[10, 26, 42].map((dy) => (
            <rect key={dy} x="0" y={y + dy} width="200" height="7" fill={c2} />
          ))}
        </g>
      );
    case 'avental':
      return (
        <g>
          <path d={`M30 ${y + 2} L170 ${y + 2}`} stroke={c2} strokeWidth="2.5" />
          <rect x="76" y={y - 2} width="48" height="64" rx="10" fill={c1} stroke="#ECE8F2" strokeWidth="1.5" />
          <rect x="88" y={y + 22} width="24" height="13" rx="4" fill={c2} />
        </g>
      );
    case 'smoking':
      return (
        <g>
          {full(c1 ?? '#2B2224')}
          <path d={`M87 ${y - 2} L100 ${y + 40} L113 ${y - 2} Z`} fill={c2} />
          <path d={`M100 ${y + 4} L92 ${y - 1} L92 ${y + 9} Z M100 ${y + 4} L108 ${y - 1} L108 ${y + 9} Z`} fill="#D7263D" />
          <circle cx="100" cy={y + 18} r="1.6" fill="#2B2224" />
          <circle cx="100" cy={y + 26} r="1.6" fill="#2B2224" />
        </g>
      );
    case 'astronauta':
      return (
        <g>
          {full(c1 ?? '#F4F6FA')}
          <path d={`M70 ${y + 1} Q100 ${y + 10} 130 ${y + 1}`} fill="none" stroke="#B8C0CC" strokeWidth="5" />
          <rect x="85" y={y + 14} width="30" height="17" rx="4" fill={c2} />
          <circle cx="92" cy={y + 22} r="2.4" fill="#FF6F91" />
          <circle cx="100" cy={y + 22} r="2.4" fill="#FFD34D" />
          <circle cx="108" cy={y + 22} r="2.4" fill="#7BD389" />
        </g>
      );
    case 'princesa':
      return (
        <g>
          {full(c1 ?? '#FFB3CF', -2)}
          <path d={`M30 ${y + 18} Q50 ${y + 24} 70 ${y + 18} Q90 ${y + 24} 110 ${y + 18} Q130 ${y + 24} 150 ${y + 18} Q160 ${y + 22} 170 ${y + 18}`} fill="none" stroke={c2} strokeWidth="3" />
          {[[80, 34], [120, 36], [100, 48]].map(([x, dy], i) => (
            <path key={i} d={sparkle(x, y + dy, 4.5)} fill="#FFFFFF" />
          ))}
        </g>
      );
    case 'sueter':
      return (
        <g>
          {full(c1 ?? '#D7263D')}
          <path d={`M30 ${y + 16} l10 -7 l10 7 l10 -7 l10 7 l10 -7 l10 7 l10 -7 l10 7 l10 -7 l10 7 l10 -7 l10 7 l10 -7 l10 7`} fill="none" stroke={c2} strokeWidth="3" strokeLinejoin="round" />
          {[78, 100, 122].map((x) => (
            <path key={x} d={star(x, y + 32, 4.5)} fill={c2} />
          ))}
        </g>
      );
    case 'abobora':
      return (
        <g>
          {full(c1 ?? '#FF9A3D')}
          {[70, 88, 112, 130].map((x) => (
            <path key={x} d={`M${x} ${y + 4} Q${x + (x < 100 ? -6 : 6)} ${y + 30} ${x} ${y + 60}`} fill="none" stroke="#E07A2E" strokeWidth="2.5" />
          ))}
          <path d={`M90 ${y} Q100 ${y + 10} 110 ${y}`} fill="none" stroke={c2} strokeWidth="5" strokeLinecap="round" />
        </g>
      );
    case 'xadrez':
      return (
        <g>
          {full(c1 ?? '#F0525F')}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <rect key={`v${i}`} x={30 + i * 15} y={y} width="6" height="100" fill={c2} opacity="0.35" />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={`h${i}`} x="0" y={y + 4 + i * 13} width="200" height="5" fill={c2} opacity="0.35" />
          ))}
        </g>
      );
    // ---------- Fantasias de corpo inteiro (capuz com orelhinhas: CostumeBack/CostumeFront) ----------
    case 'fantasia-coelho':
    case 'fantasia-urso':
    case 'fantasia-gato':
    case 'fantasia-sapo':
    case 'fantasia-dino':
    case 'fantasia-unicornio':
    case 'fantasia-pintinho':
    case 'fantasia-pinguim': {
      const suit = c1 ?? '#FFB3CF';
      const belly = c2 ?? '#FFFFFF';
      const { eyeY, w } = geo;
      const fx = 100;
      const fy = eyeY + 9;
      const rx = Math.min(44, w * 0.66);
      const ry = 27;
      const hole = `M0 0 H200 V200 H0 Z M${fx - rx} ${fy} A${rx} ${ry} 0 1 0 ${fx + rx} ${fy} A${rx} ${ry} 0 1 0 ${fx - rx} ${fy} Z`;
      return (
        <g>
          <path d={hole} fill={suit} fillRule="evenodd" />
          {/* sombra do lado e brilho do tecido */}
          <path d={`M${100 + w * 0.55} ${top} Q${100 + w * 1.05} ${top + h * 0.6} ${100 + w * 0.5} 182 L200 182 L200 ${top} Z`} fill="#000" opacity="0.06" />
          <ellipse cx={fx} cy={fy} rx={rx + 2} ry={ry + 2} fill="none" stroke={belly} strokeWidth="5" opacity="0.95" />
          <ellipse cx={fx} cy={fy} rx={rx + 5} ry={ry + 5} fill="none" stroke="#000" strokeWidth="1.5" opacity="0.08" />
          {base === 'fantasia-pinguim' ? (
            <ellipse cx="100" cy={top + h * 0.82} rx={w * 0.62} ry={h * 0.26} fill={belly} />
          ) : (
            <ellipse cx="100" cy={top + h * 0.84} rx={w * 0.5} ry={h * 0.2} fill={belly} opacity="0.95" />
          )}
          {base === 'fantasia-dino' && [0.2, 0.4, 0.6].map((t) => <circle key={t} cx={100 - w * 0.6 + t * w * 0.4} cy={top + h * (0.7 + t * 0.2)} r="4" fill={belly} opacity="0.6" />)}
          {base === 'fantasia-sapo' && <path d={`M${100 - w * 0.3} ${top + h * 0.9} q${w * 0.3} 8 ${w * 0.6} 0`} stroke={belly} strokeWidth="3" fill="none" opacity="0.7" />}
          {/* zíper de brincadeira */}
          <path d={`M100 ${fy + ry + 6} V${top + h * 0.72}`} stroke="#000" strokeWidth="1.5" opacity="0.12" strokeDasharray="2 3" />
        </g>
      );
    }
    // ---------- Vestidos ----------
    case 'babado': {
      const cc = c1 ?? '#FF9FC2';
      const cd = c2 ?? '#FFFFFF';
      return (
        <g>
          {full(cc)}
          <path d={`M60 ${y + 2} Q100 ${y + 14} 140 ${y + 2} L140 ${y - 4} Q100 ${y + 8} 60 ${y - 4} Z`} fill={cd} />
          {[0, 1, 2].map((r) => (
            <path key={r} d={`M20 ${y + 30 + r * 13} ${'q10 8 20 0 '.repeat(8)}`} stroke={cd} strokeWidth="3" fill="none" opacity={0.9 - r * 0.15} />
          ))}
          <path d={`M90 ${y + 8} L100 ${y + 14} L90 ${y + 20} Z M110 ${y + 8} L100 ${y + 14} L110 ${y + 20} Z`} fill={cd} />
          <circle cx="100" cy={y + 14} r="3.5" fill={cd} />
          {[70, 130].map((x) => <circle key={x} cx={x} cy={y + 22} r="2.5" fill={cd} opacity="0.8" />)}
        </g>
      );
    }
    case 'estrelado': {
      const cc = c1 ?? '#7E57D6';
      const cd = c2 ?? '#FFE27A';
      return (
        <g>
          {full(cc)}
          <path d={`M0 ${y + 40} Q50 ${y + 34} 100 ${y + 40} T200 ${y + 40} V200 H0 Z`} fill="#FFFFFF" opacity="0.12" />
          {[[64, 14, 4], [86, 30, 3], [118, 18, 4.5], [138, 36, 3], [100, 48, 3.5], [74, 44, 3]].map(([x, dy, r], i) => <path key={i} d={star(x, y + dy, r)} fill={cd} />)}
          <path d={`M62 ${y} Q100 ${y + 12} 138 ${y}`} stroke={cd} strokeWidth="3" fill="none" />
        </g>
      );
    }
    default:
      return null;
  }
}

/** Acessórios da frente (no pescoço e na barriga). */
export function Accessory({ id, geo, paw }: { id: string | null; geo: Geo; paw?: string }) {
  const { top, w, h } = geo;
  const y = top + h * 0.6;
  const it = id ? itemById(id) : undefined;
  const base = it?.base ?? id;
  const c1 = it?.c1;
  const c2 = it?.c2;
  const arc = (n: number, depth: number) =>
    Array.from({ length: n }, (_, i) => {
      const t = i / (n - 1);
      const x = 100 - w * 0.55 + t * w * 1.1;
      const yy = y - 6 + Math.sin(t * Math.PI) * depth;
      return [x, yy] as const;
    });
  switch (base) {
    case 'cachecol':
      return (
        <g>
          <path d={`M${100 - w * 0.86} ${y - 6} C${100 - w * 0.4} ${y + 8} ${100 + w * 0.4} ${y + 8} ${100 + w * 0.86} ${y - 6} L${100 + w * 0.88} ${y + 6} C${100 + w * 0.4} ${y + 20} ${100 - w * 0.4} ${y + 20} ${100 - w * 0.88} ${y + 6} Z`} fill={c1 ?? '#D1495B'} />
          <path d={`M${100 + w * 0.3} ${y + 10} L${100 + w * 0.42} ${y + 42} L${100 + w * 0.22} ${y + 44} L${100 + w * 0.14} ${y + 12} Z`} fill={c2 ?? '#B83A4B'} />
        </g>
      );
    case 'gravata':
      return (
        <g>
          <path d={`M100 ${y} L86 ${y - 8} L86 ${y + 8} Z`} fill={c1 ?? '#3D6FD8'} />
          <path d={`M100 ${y} L114 ${y - 8} L114 ${y + 8} Z`} fill={c1 ?? '#3D6FD8'} />
          <circle cx="100" cy={y} r="4.5" fill={c2 ?? '#2F59B3'} />
        </g>
      );
    case 'mochila':
      return (
        <g stroke={c1 ?? '#E2894B'} strokeWidth="5" strokeLinecap="round" fill="none">
          <path d={`M${100 - w * 0.55} ${top + h * 0.3} Q${100 - w * 0.62} ${y} ${100 - w * 0.5} ${y + 22}`} />
          <path d={`M${100 + w * 0.55} ${top + h * 0.3} Q${100 + w * 0.62} ${y} ${100 + w * 0.5} ${y + 22}`} />
        </g>
      );
    case 'medalha':
      return (
        <g>
          <path d={`M88 ${y - 8} L100 ${y + 10} L112 ${y - 8}`} stroke="#3D6FD8" strokeWidth="5" fill="none" />
          <circle cx="100" cy={y + 16} r="9" fill="#F6C445" stroke="#E0A92A" strokeWidth="2" />
        </g>
      );
    case 'lenco':
      return (
        <g>
          <path d={`M${100 - w * 0.5} ${y - 6} L${100 + w * 0.5} ${y - 6} L100 ${y + 20} Z`} fill={c1} />
          {[[92, y], [106, y + 1], [99, y + 9]].map(([x, yy], i) => (
            <circle key={i} cx={x} cy={yy} r="1.8" fill="#FFFFFF" />
          ))}
        </g>
      );
    case 'gravata-longa':
      return (
        <g>
          <path d={`M95 ${y - 5} L105 ${y - 5} L103 ${y + 2} L97 ${y + 2} Z`} fill={c2} />
          <path d={`M97 ${y + 2} L103 ${y + 2} L107 ${y + 32} L100 ${y + 40} L93 ${y + 32} Z`} fill={c1} />
          <path d={`M95 ${y + 14} L105 ${y + 10} M94 ${y + 24} L106 ${y + 20}`} stroke={c2} strokeWidth="2" />
        </g>
      );
    case 'bolsa':
      return (
        <g>
          <path d={`M${100 - w * 0.62} ${top + h * 0.32} L${100 + w * 0.48} ${y + 22}`} stroke={c2} strokeWidth="3.5" strokeLinecap="round" />
          <rect x={100 + w * 0.34} y={y + 16} width="20" height="15" rx="5" fill={c1} />
          <circle cx={100 + w * 0.34 + 10} cy={y + 21} r="2.2" fill="#F6C445" />
        </g>
      );
    case 'pochete':
      return (
        <g>
          <path d={`M${100 - w * 0.95} ${y + 30} Q100 ${y + 36} ${100 + w * 0.95} ${y + 30}`} fill="none" stroke={c2} strokeWidth="4" />
          <rect x="86" y={y + 24} width="28" height="15" rx="7" fill={c1} />
          <path d={`M90 ${y + 29} L110 ${y + 29}`} stroke="#FFFFFF" strokeWidth="1.6" opacity="0.8" />
        </g>
      );
    case 'colar-perolas':
      return (
        <g>
          {arc(11, 12).map(([x, yy], i) => (
            <circle key={i} cx={x} cy={yy} r="3.3" fill={c1} stroke={c2} strokeWidth="1" />
          ))}
        </g>
      );
    case 'colar-flores':
      return (
        <g>
          {arc(9, 12).map(([x, yy], i) => (
            <g key={i}>
              {[0, 90, 180, 270].map((a) => (
                <circle key={a} cx={x + Math.cos((a * Math.PI) / 180) * 3.4} cy={yy + Math.sin((a * Math.PI) / 180) * 3.4} r="3" fill={[c1, c2, '#FFFFFF', '#B39AE6'][i % 4]} />
              ))}
              <circle cx={x} cy={yy} r="2" fill="#FF9A4D" />
            </g>
          ))}
        </g>
      );
    case 'broche':
      return <path d={heartPath(100 + w * 0.36, y + 8, 10)} fill={c1} stroke={c2} strokeWidth="1.5" />;
    // ---------- Colares com pingente ----------
    case 'colar-pingente': {
      const chain = c2 ?? '#F6C445';
      const pts = arc(11, 13);
      const [px, py] = pts[5];
      return (
        <g>
          <path d={`M${pts.map(([x, yy]) => `${x} ${yy}`).join(' L')}`} stroke={chain} strokeWidth="2.6" fill="none" strokeDasharray="3 1.5" strokeLinecap="round" />
          {it?.id?.includes('estrela') ? <path d={star(px, py + 9, 8)} fill={c1 ?? '#FFD34D'} stroke={chain} strokeWidth="1.5" /> : <path d={heartPath(px, py + 8, 10)} fill={c1 ?? '#FF5E7E'} stroke={chain} strokeWidth="1.5" />}
          <circle cx={px - 3} cy={py + 5} r="1.6" fill="#FFFFFF" opacity="0.8" />
        </g>
      );
    }
    case 'colar-ouro': {
      const pts = arc(13, 14);
      return (
        <g>
          {pts.map(([x, yy], i) => <ellipse key={i} cx={x} cy={yy} rx="3.6" ry="2.6" fill="none" stroke={c1 ?? '#F6C445'} strokeWidth="2" transform={`rotate(${(i - 6) * 8} ${x} ${yy})`} />)}
          <path d={star(pts[6][0], pts[6][1] + 10, 7)} fill={c2 ?? '#7FB8F0'} stroke={c1 ?? '#F6C445'} strokeWidth="1.5" />
        </g>
      );
    }
    // ---------- Coisinhas de segurar (na patinha direita) ----------
    case 'segurar': {
      // Patinha direita levantada na lateral do corpo; a coisinha fica maior para dar para ver.
      const px = 100 + w * 0.5;
      const py = top + h * 0.6;
      const kind = it?.id?.replace(/^m-/, '') ?? '';
      const hold = <ellipse cx={px} cy={py + 2} rx="7.5" ry="5.5" fill={paw ?? '#E9A86C'} />;
      const body = (() => {
        switch (kind) {
          case 'suco':
            return (
              <g>
                <path d={`M${px - 9} ${py - 20} H${px + 9} L${px + 7} ${py + 6} H${px - 7} Z`} fill="#DDF0FF" opacity="0.9" />
                <path d={`M${px - 8} ${py - 12} H${px + 8} L${px + 7} ${py + 6} H${px - 7} Z`} fill={c1 ?? '#FFB347'} />
                <path d={`M${px + 2} ${py - 20} L${px + 8} ${py - 36}`} stroke={c2 ?? '#FF5E7E'} strokeWidth="3" strokeLinecap="round" />
                <circle cx={px - 7} cy={py - 20} r="6" fill="#FFD34D" />
                <circle cx={px - 7} cy={py - 20} r="3.6" fill="#FFE98A" />
              </g>
            );
          case 'microfone':
            return (
              <g>
                <rect x={px - 3.5} y={py - 16} width="7" height="24" rx="3" fill={c2 ?? '#3A3440'} />
                <circle cx={px} cy={py - 22} r="9" fill={c1 ?? '#C9CED8'} />
                <path d={`M${px - 7} ${py - 25} h14 M${px - 8} ${py - 21} h16 M${px - 7} ${py - 17} h14`} stroke="#8A90A0" strokeWidth="1.2" />
                <circle cx={px - 3} cy={py - 26} r="2" fill="#FFFFFF" opacity="0.8" />
              </g>
            );
          case 'cestinha':
            return (
              <g>
                <path d={`M${px - 12} ${py - 16} Q${px} ${py - 36} ${px + 12} ${py - 16}`} stroke="#B8854A" strokeWidth="2.5" fill="none" />
                {[-6, 0, 6].map((dx, i) => <path key={i} d={`M${px + dx} ${py - 22} q-5 4 0 10 q5 -6 0 -10 Z`} fill={c1 ?? '#F0525F'} />)}
                <path d={`M${px - 13} ${py - 16} H${px + 13} L${px + 10} ${py + 4} H${px - 10} Z`} fill="#D9A766" />
                <path d={`M${px - 12} ${py - 9} H${px + 12} M${px - 11} ${py - 3} H${px + 11}`} stroke="#B8854A" strokeWidth="1.5" />
                <path d={`M${px - 13} ${py - 16} H${px + 13}`} stroke={c2 ?? '#FFFFFF'} strokeWidth="3" />
              </g>
            );
          case 'pirulito':
            return (
              <g>
                <path d={`M${px} ${py + 4} V${py - 22}`} stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
                <circle cx={px} cy={py - 32} r="12" fill={c1 ?? '#FF86AC'} />
                <path d={`M${px} ${py - 32} m-8 0 a8 8 0 1 1 8 8 a5 5 0 1 1 -5 -5 a2 2 0 1 1 2 2`} stroke={c2 ?? '#FFFFFF'} strokeWidth="2.5" fill="none" />
              </g>
            );
          case 'balao':
            return (
              <g>
                <path d={`M${px} ${py} Q${px + 8} ${py - 24} ${px + 2} ${py - 46}`} stroke="#8A6A4F" strokeWidth="1.2" fill="none" />
                <ellipse cx={px + 4} cy={py - 62} rx="14" ry="17" fill={c1 ?? '#FF5E7E'} />
                <path d={`M${px + 1} ${py - 45} l3 -4 3 4 Z`} fill={c1 ?? '#FF5E7E'} />
                <ellipse cx={px - 1} cy={py - 68} rx="4" ry="6" fill="#FFFFFF" opacity="0.45" />
              </g>
            );
          case 'varinha':
            return (
              <g>
                <path d={`M${px} ${py + 4} L${px + 10} ${py - 26}`} stroke={c2 ?? '#FFFFFF'} strokeWidth="3" strokeLinecap="round" />
                <path d={star(px + 12, py - 32, 11)} fill={c1 ?? '#FFD34D'} />
                <path d={sparkle(px + 26, py - 44, 4)} fill={c1 ?? '#FFD34D'} />
                <path d={sparkle(px - 2, py - 44, 3)} fill={c1 ?? '#FFD34D'} />
              </g>
            );
          case 'girassol':
            return (
              <g>
                <path d={`M${px} ${py + 4} Q${px + 2} ${py - 14} ${px} ${py - 26}`} stroke="#5FAE84" strokeWidth="3" fill="none" />
                <ellipse cx={px + 6} cy={py - 12} rx="6" ry="3" fill="#7CC39A" transform={`rotate(-30 ${px + 6} ${py - 12})`} />
                {Array.from({ length: 10 }, (_, i) => {
                  const a = (i / 10) * Math.PI * 2;
                  return <ellipse key={i} cx={px + Math.cos(a) * 9} cy={py - 34 + Math.sin(a) * 9} rx="5.5" ry="3" fill={c1 ?? '#FFD34D'} transform={`rotate(${(a * 180) / Math.PI} ${px + Math.cos(a) * 9} ${py - 34 + Math.sin(a) * 9})`} />;
                })}
                <circle cx={px} cy={py - 34} r="6" fill={c2 ?? '#8A5A3B'} />
              </g>
            );
          case 'chaveiro':
            return (
              <g>
                <path d={`M${px} ${py} V${py + 10}`} stroke="#8A6A4F" strokeWidth="1.5" />
                <path d={star(px, py + 22, 12)} fill={c1 ?? '#FFD34D'} stroke={c2 ?? '#E8B020'} strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx={px - 4} cy={py + 21} r="1.6" fill={INK} />
                <circle cx={px + 4} cy={py + 21} r="1.6" fill={INK} />
                <path d={`M${px - 2} ${py + 25} q2 2 4 0`} stroke={INK} strokeWidth="1.2" fill="none" />
              </g>
            );
          default:
            return null;
        }
      })();
      return (
        <g transform={`translate(${px} ${py}) scale(1.45) translate(${-px} ${-py})`}>
          {body}
          {hold}
        </g>
      );
    }
    default:
      return null;
  }
}

/** Asas: ficam atrás do corpo. */
export function AccessoryBack({ id, geo }: { id: string | null | undefined; geo: Geo }) {
  const { top, w, h } = geo;
  const it = id ? itemById(id) : undefined;
  const base = it?.base ?? id;
  const c1 = it?.c1 ?? '#BFE3FF';
  const c2 = it?.c2 ?? '#E6D2FF';
  const cy = top + h * 0.48;
  const side = (s: number, el: React.ReactNode) => (
    <g key={s} transform={s === 1 ? 'translate(200 0) scale(-1 1)' : undefined}>
      <g className="wing-flutter">{el}</g>
    </g>
  );
  switch (base) {
    case 'asas-fada':
      return (
        <g>
          {[-1, 1].map((s) =>
            side(
              s,
              <>
                <ellipse cx={100 - w - 14} cy={cy - 10} rx="26" ry="17" transform={`rotate(-28 ${100 - w - 14} ${cy - 10})`} fill={c1} opacity="0.78" stroke="#FFFFFF" strokeWidth="2" />
                <ellipse cx={100 - w - 6} cy={cy + 16} rx="17" ry="12" transform={`rotate(24 ${100 - w - 6} ${cy + 16})`} fill={c2} opacity="0.78" stroke="#FFFFFF" strokeWidth="2" />
              </>,
            ),
          )}
        </g>
      );
    case 'asas-anjo':
      return (
        <g>
          {[-1, 1].map((s) =>
            side(
              s,
              <>
                {[0, 1, 2].map((k) => (
                  <ellipse key={k} cx={100 - w - 6 - k * 9} cy={cy - 6 + k * 9} rx={22 - k * 4} ry={12 - k * 2} transform={`rotate(${-20 + k * 14} ${100 - w - 6 - k * 9} ${cy - 6 + k * 9})`} fill={c1} stroke={c2} strokeWidth="1.8" />
                ))}
              </>,
            ),
          )}
        </g>
      );
    case 'asas-borboleta':
      return (
        <g>
          {[-1, 1].map((s) =>
            side(
              s,
              <>
                <ellipse cx={100 - w - 12} cy={cy - 8} rx="24" ry="19" transform={`rotate(-20 ${100 - w - 12} ${cy - 8})`} fill={c1} stroke={c2} strokeWidth="3" />
                <ellipse cx={100 - w - 4} cy={cy + 18} rx="15" ry="12" transform={`rotate(20 ${100 - w - 4} ${cy + 18})`} fill={c1} stroke={c2} strokeWidth="3" />
                <circle cx={100 - w - 20} cy={cy - 12} r="3.4" fill="#FFFFFF" />
                <circle cx={100 - w - 8} cy={cy + 20} r="2.6" fill="#FFFFFF" />
              </>,
            ),
          )}
        </g>
      );
    default:
      return null;
  }
}

/** Efeitos atrás do Hami (aura, arco-íris, raios). */
export function EffectBack({ id, geo, uid }: { id: string | null | undefined; geo: Geo; uid: string }) {
  const { top, h } = geo;
  const it = id ? itemById(id) : undefined;
  const base = it?.base;
  const c1 = it?.c1 ?? '#FFE27A';
  const cy = top + h * 0.55;
  switch (base) {
    case 'aura':
      return (
        <g className="fx-pulse">
          <defs>
            <radialGradient id={`fx${uid}`}>
              <stop offset="40%" stopColor={c1} stopOpacity="0.7" />
              <stop offset="100%" stopColor={c1} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="100" cy={cy} r="96" fill={`url(#fx${uid})`} />
        </g>
      );
    case 'arco-iris':
      return (
        <g fill="none" strokeWidth="7" opacity="0.9">
          {['#FF6F91', '#FF9A4D', '#FFD34D', '#7BD389', '#6FB7FF', '#A57CF0'].map((c, i) => (
            <path key={c} d={`M${14 + i * 7} ${cy + 20} A${86 - i * 7} ${86 - i * 7} 0 0 1 ${186 - i * 7} ${cy + 20}`} stroke={c} />
          ))}
        </g>
      );
    case 'raios':
      return (
        <g className="fx-spin" opacity="0.5">
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d={`M100 ${cy} L${100 + Math.cos((i * Math.PI) / 6 - 0.12) * 110} ${cy + Math.sin((i * Math.PI) / 6 - 0.12) * 110} L${100 + Math.cos((i * Math.PI) / 6 + 0.12) * 110} ${cy + Math.sin((i * Math.PI) / 6 + 0.12) * 110} Z`} fill={c1} />
          ))}
        </g>
      );
    default:
      return null;
  }
}

/** Efeitos na frente (brilhos, corações, notas…), animados de leve. */
export function EffectFront({ id, geo }: { id: string | null | undefined; geo: Geo }) {
  const { top, w } = geo;
  const it = id ? itemById(id) : undefined;
  const base = it?.base;
  const c1 = it?.c1 ?? '#FFE27A';
  const spots: [number, number][] = [
    [100 - w - 18, top + 30],
    [100 + w + 16, top + 18],
    [100 - w - 4, top - 10],
    [100 + w + 4, top + 70],
    [100 - w - 14, top + 82],
  ];
  const at = (i: number) => ({ style: { animationDelay: `${i * 0.45}s` } });
  switch (base) {
    case 'brilhos':
      return (
        <g fill={c1}>
          {spots.map(([x, y], i) => (
            <path key={i} className="sparkle" {...at(i)} d={sparkle(x, y, 7 - (i % 3))} />
          ))}
        </g>
      );
    case 'coracoes':
      return (
        <g fill={c1}>
          {spots.slice(0, 4).map(([x, y], i) => (
            <path key={i} className="fx-rise" {...at(i)} d={heartPath(x, y, 9)} />
          ))}
        </g>
      );
    case 'notas':
      return (
        <g fill={c1} fontSize="20" fontWeight="900">
          {spots.slice(0, 4).map(([x, y], i) => (
            <text key={i} className="fx-rise" {...at(i)} x={x} y={y}>
              {i % 2 ? '♫' : '♪'}
            </text>
          ))}
        </g>
      );
    case 'bolhas':
      return (
        <g fill="#FFFFFF" fillOpacity="0.35" stroke={c1} strokeWidth="2">
          {spots.map(([x, y], i) => (
            <circle key={i} className="fx-rise" {...at(i)} cx={x} cy={y + 20} r={5 + (i % 3) * 2} />
          ))}
        </g>
      );
    case 'flores':
      return (
        <g fill={c1}>
          {spots.map(([x, y], i) => (
            <ellipse key={i} className="fx-fall" {...at(i)} cx={x} cy={y - 20} rx="5" ry="3" />
          ))}
        </g>
      );
    case 'estrelas':
      return (
        <g className="fx-orbit" fill={c1}>
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i * Math.PI * 2) / 5;
            return <path key={i} d={star(100 + Math.cos(a) * (w + 26), top + 60 + Math.sin(a) * 62, 6)} />;
          })}
        </g>
      );
    case 'neve':
      return (
        <g fill={c1} stroke="#C9DDF2" strokeWidth="0.8">
          {spots.map(([x, y], i) => (
            <circle key={i} className="fx-fall" {...at(i)} cx={x} cy={y - 20} r={3 + (i % 2)} />
          ))}
        </g>
      );
    case 'morcegos':
      return (
        <g fill={c1}>
          {spots.slice(0, 3).map(([x, y], i) => (
            <path key={i} className="fx-rise" {...at(i)} d={`M${x} ${y} q-6 -6 -12 -2 q4 2 4 6 q4 -3 8 -1 q4 -2 8 1 q0 -4 4 -6 q-6 -4 -12 2 Z`} />
          ))}
        </g>
      );
    default:
      return null;
  }
}

// ---------- Fantasias: orelhas e detalhes do capuz ----------

const COSTUMES = new Set(['fantasia-coelho', 'fantasia-urso', 'fantasia-gato', 'fantasia-sapo', 'fantasia-dino', 'fantasia-unicornio', 'fantasia-pintinho', 'fantasia-pinguim']);

/** A roupa é uma fantasia de corpo inteiro? Então o Hami fica de capuz (sem as orelhinhas dele) e com patinhas da cor da fantasia. */
export function costumeOf(roupa: string | null | undefined): { base: string; c1: string; c2: string } | null {
  const L = look(roupa, '#FFB3CF', '#FFFFFF');
  return L.base && COSTUMES.has(L.base) ? { base: L.base, c1: L.c1, c2: L.c2 } : null;
}

/** Orelhas, espinhos e cristas: atrás do capuz. */
export function CostumeBack({ id, geo }: { id: string | null | undefined; geo: Geo }) {
  const c = costumeOf(id);
  if (!c) return null;
  const { top, w } = geo;
  const { base, c1, c2 } = c;
  const inner = base === 'fantasia-urso' ? c2 : '#FF9FC2';
  switch (base) {
    case 'fantasia-coelho':
      return (
        <g>
          {[-1, 1].map((s) => (
            <g key={s} transform={`rotate(${s * 14} ${100 + s * w * 0.32} ${top + 14})`}>
              <ellipse cx={100 + s * w * 0.32} cy={top - 22} rx="13" ry="36" fill={c1} />
              <ellipse cx={100 + s * w * 0.32} cy={top - 20} rx="6.5" ry="26" fill={inner} />
            </g>
          ))}
        </g>
      );
    case 'fantasia-urso':
      return (
        <g>
          {[-1, 1].map((s) => (
            <g key={s}>
              <circle cx={100 + s * w * 0.58} cy={top + 10} r="17" fill={c1} />
              <circle cx={100 + s * w * 0.58} cy={top + 11} r="9" fill={inner} />
            </g>
          ))}
        </g>
      );
    case 'fantasia-gato':
      return (
        <g>
          {[-1, 1].map((s) => (
            <g key={s}>
              <path d={`M${100 + s * w * 0.2} ${top + 12} L${100 + s * w * 0.62} ${top - 26} L${100 + s * w * 0.86} ${top + 24} Z`} fill={c1} strokeLinejoin="round" />
              <path d={`M${100 + s * w * 0.34} ${top + 10} L${100 + s * w * 0.6} ${top - 14} L${100 + s * w * 0.74} ${top + 16} Z`} fill={inner} />
            </g>
          ))}
        </g>
      );
    case 'fantasia-sapo':
      return (
        <g>
          {[-1, 1].map((s) => (
            <g key={s}>
              <circle cx={100 + s * w * 0.42} cy={top + 4} r="17" fill={c1} />
              <circle cx={100 + s * w * 0.42} cy={top + 2} r="10" fill="#FFFFFF" />
              <circle cx={100 + s * w * 0.42} cy={top + 4} r="5.5" fill={INK} />
              <circle cx={100 + s * w * 0.42 + 2} cy={top + 1} r="2" fill="#FFFFFF" />
            </g>
          ))}
        </g>
      );
    case 'fantasia-dino':
      return (
        <g>
          {[-0.5, -0.2, 0.12, 0.42].map((t, i) => (
            <path key={i} d={`M${100 + t * w * 1.4 - 12} ${top + 10 + Math.abs(t) * 12} L${100 + t * w * 1.4} ${top - 16 + Math.abs(t) * 14} L${100 + t * w * 1.4 + 12} ${top + 10 + Math.abs(t) * 12} Z`} fill={c2} strokeLinejoin="round" />
          ))}
          <path d={`M${100 + w * 0.8} 168 Q${100 + w + 30} 170 ${100 + w + 36} 150 Q${100 + w + 20} 166 ${100 + w * 0.7} 152 Z`} fill={c1} />
        </g>
      );
    case 'fantasia-unicornio':
      return (
        <g>
          {[-1, 1].map((s) => (
            <g key={s}>
              <path d={`M${100 + s * w * 0.3} ${top + 12} L${100 + s * w * 0.56} ${top - 16} L${100 + s * w * 0.78} ${top + 20} Z`} fill={c1} />
              <path d={`M${100 + s * w * 0.42} ${top + 10} L${100 + s * w * 0.56} ${top - 6} L${100 + s * w * 0.68} ${top + 14} Z`} fill={inner} />
            </g>
          ))}
          {['#FF9FC2', '#FFD34D', '#7FD8BE', '#7FB8F0', '#B399F0'].map((col, i) => (
            <ellipse key={col} cx={100 + w * 0.5 + i * 3} cy={top + 18 + i * 12} rx="11" ry="9" fill={col} />
          ))}
        </g>
      );
    case 'fantasia-pintinho':
      return (
        <g>
          {[-10, 0, 10].map((dx, i) => (
            <ellipse key={i} cx={100 + dx} cy={top - 6 - (i === 1 ? 6 : 0)} rx="5" ry="12" fill={c1} transform={`rotate(${dx * 2} ${100 + dx} ${top + 4})`} />
          ))}
        </g>
      );
    case 'fantasia-pinguim':
      return <ellipse cx="100" cy={top + 2} rx={w * 0.4} ry="8" fill={c1} />;
    default:
      return null;
  }
}

/** Detalhes na frente do capuz (chifre do unicórnio, bochechas do sapo, bico do pintinho). */
export function CostumeFront({ id, geo }: { id: string | null | undefined; geo: Geo }) {
  const c = costumeOf(id);
  if (!c) return null;
  const { top } = geo;
  switch (c.base) {
    case 'fantasia-unicornio':
      return (
        <g>
          <path d={`M93 ${top + 8} L100 ${top - 30} L107 ${top + 8} Z`} fill="#FFE27A" stroke="#F2C14E" strokeWidth="1.5" strokeLinejoin="round" />
          <path d={`M95 ${top - 2} L105 ${top - 6} M96 ${top - 12} L104 ${top - 15}`} stroke="#F2C14E" strokeWidth="1.5" />
        </g>
      );
    case 'fantasia-pintinho':
      return <path d={`M92 ${top + 16} L100 ${top + 6} L108 ${top + 16} Z`} fill="#FF9A4D" opacity="0.9" />;
    case 'fantasia-urso':
    case 'fantasia-gato':
    case 'fantasia-coelho':
      return <path d={heartPath(100, top + 16, 6)} fill={c.c2 === '#FFFFFF' ? '#FF9FC2' : c.c2} opacity="0.9" />;
    default:
      return null;
  }
}
