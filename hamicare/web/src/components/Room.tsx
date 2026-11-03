import type { ReactNode } from 'react';
import type { DecorSpot } from '../data/items';
import { itemById } from '../data/items';
import type { Period } from '../data/lines';

interface Props {
  period: Period;
  decor: Partial<Record<DecorSpot, string>>;
  children?: ReactNode;
  height?: number;
}

const ROOM_CLASS: Record<Period, string> = { manha: 'room-manha', tarde: 'room-tarde', noite: 'room-noite' };

const SPOT_POS: Record<Exclude<DecorSpot, 'teto'>, string> = {
  paredeEsq: 'left-[9%] top-[30%] text-[34px]',
  paredeDir: 'right-[9%] top-[30%] text-[34px]',
  chaoEsq: 'left-[6%] bottom-[10%] text-[44px]',
  chaoDir: 'right-[6%] bottom-[10%] text-[40px]',
};

/** O cantinho do xodó: parede muda com a hora do dia, e a decoração fica nos cantos. */
export function Room({ period, decor, children, height = 250 }: Props) {
  return (
    <div className={`room ${ROOM_CLASS[period]}`} style={{ height }}>
      <div className="room-floor" />
      <div className="room-window" aria-hidden="true">
        <span>{period === 'noite' ? '🌙' : '☀️'}</span>
      </div>
      {decor.teto && <Garland id={decor.teto} />}
      {(Object.keys(SPOT_POS) as Array<keyof typeof SPOT_POS>).map((spot) => {
        const item = itemById(decor[spot]);
        return item?.emoji ? (
          <span key={spot} className={`absolute select-none leading-none ${SPOT_POS[spot]}`} aria-label={item.name} role="img">
            {item.emoji}
          </span>
        ) : null;
      })}
      <div className="absolute inset-x-0 bottom-[4%] flex justify-center">{children}</div>
    </div>
  );
}

function Garland({ id }: { id: string }) {
  if (id === 'bandeirinhas') {
    const colors = ['#E2547A', '#F2C14E', '#3D9BD8', '#4FA36B', '#B39AE6'];
    return (
      <svg className="absolute inset-x-0 top-0 h-10 w-full" viewBox="0 0 300 40" preserveAspectRatio="none" aria-label="Bandeirinhas" role="img">
        <path d="M0 6 Q150 26 300 6" stroke="#8A6A4F" strokeWidth="1.5" fill="none" />
        {Array.from({ length: 13 }, (_, i) => {
          const x = 12 + i * 23;
          const y = 6 + 20 * (1 - Math.pow((x - 150) / 150, 2)) * 0.5;
          return <path key={i} d={`M${x - 8} ${y} L${x + 8} ${y} L${x} ${y + 14} Z`} fill={colors[i % colors.length]} />;
        })}
      </svg>
    );
  }
  if (id === 'luzinhas') {
    const colors = ['#FF5E7E', '#FFD660', '#6CCB92', '#7FB8F0'];
    return (
      <svg className="absolute inset-x-0 top-0 h-9 w-full" viewBox="0 0 300 36" preserveAspectRatio="none" aria-label="Pisca-pisca" role="img">
        <path d="M0 8 Q75 22 150 8 Q225 22 300 8" stroke="#3E4A43" strokeWidth="1.2" fill="none" />
        {Array.from({ length: 16 }, (_, i) => {
          const x = 10 + i * 18.6;
          const local = (x % 150) / 150;
          const y = 8 + 14 * Math.sin(local * Math.PI) * 0.9;
          return <circle key={i} className="bulb" style={{ animationDelay: `${(i % 4) * 0.35}s` }} cx={x} cy={y + 5} r="4" fill={colors[i % colors.length]} />;
        })}
      </svg>
    );
  }
  // Varal de fotos
  return (
    <svg className="absolute inset-x-0 top-0 h-12 w-full" viewBox="0 0 300 48" preserveAspectRatio="none" aria-label="Varal de fotos" role="img">
      <path d="M0 8 Q150 22 300 8" stroke="#8A6A4F" strokeWidth="1.5" fill="none" />
      {[40, 105, 170, 235].map((x, i) => (
        <g key={x} transform={`translate(${x} ${12 + (i === 1 || i === 2 ? 4 : 0)}) rotate(${i % 2 ? 4 : -4})`}>
          <rect x="-11" y="0" width="22" height="26" rx="2" fill="#FFFFFF" />
          <rect x="-8" y="3" width="16" height="15" fill={['#F2B880', '#93CCF5', '#93D6A9', '#FF9AB0'][i]} />
        </g>
      ))}
    </svg>
  );
}
