// Janela da casa com cortinas: o céu acompanha a hora do dia.
import { useId } from 'react';
import type { Period } from '../../data/lines';
import { mix } from './kit';
import type { WallTrim } from './theme';

const SKY: Record<Period, [string, string]> = {
  manha: ['#8FD0F7', '#DDF2FF'],
  tarde: ['#7FB8F0', '#FFD9B0'],
  noite: ['#141A44', '#33306E'],
};

export function RoomWindow({ trim, period, lunar = false }: { trim: WallTrim; period: Period; lunar?: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  // Na casa lunar, a janela dá para o espaço: sempre noite, com a Terra no céu e chão de Lua.
  const [a, b] = lunar ? (['#0D1030', '#262A5C'] as [string, string]) : SKY[period];
  const night = lunar || period === 'noite';
  const frame = '#FFFFFF';
  const shape = trim.window;
  // Vão da janela (onde aparece o céu)
  const pane = shape === 'vigia' ? <circle cx="60" cy="52" r="34" /> : shape === 'arco' ? <path d="M26 92 V48 Q26 14 60 14 Q94 14 94 48 V92 Z" /> : <rect x="24" y="16" width="72" height="76" rx="4" />;
  const c = trim.curtain;
  const c2 = trim.curtain2;
  return (
    <svg viewBox="0 0 120 120" className="block h-auto w-full overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={`s${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
        <clipPath id={`p${uid}`}>{pane}</clipPath>
      </defs>
      {/* moldura e céu */}
      <g transform="translate(0 0)">
        <g clipPath={`url(#p${uid})`}>
          <rect x="0" y="0" width="120" height="120" fill={`url(#s${uid})`} />
          {lunar ? (
            <>
              <circle cx="76" cy="36" r="11" fill="#5FB4F5" />
              <path d="M70 31 q5 -3 8 1 q-2 5 -7 3 Z M77 40 q5 -1 6 3 q-4 3 -7 0 Z" fill="#6FC46A" />
              <circle cx="76" cy="36" r="11" fill="none" stroke="#BFE6FF" strokeOpacity="0.5" strokeWidth="1.5" />
              {[[36, 28], [48, 50], [92, 60], [40, 66], [58, 24]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.4" fill="#FFFFFF" opacity="0.9" />)}
            </>
          ) : night ? (
            <>
              <circle cx="78" cy="34" r="9" fill="#FFF3C2" />
              <circle cx="82" cy="31" r="8" fill={a} />
              {[[36, 30], [50, 50], [70, 62], [40, 70], [86, 52]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.4" fill="#FFFFFF" opacity="0.9" />)}
            </>
          ) : (
            <>
              <circle cx="80" cy="34" r="9" fill={period === 'tarde' ? '#FFC36B' : '#FFE27A'} />
              <ellipse cx="44" cy="44" rx="14" ry="6" fill="#FFFFFF" opacity="0.9" />
              <ellipse cx="54" cy="40" rx="9" ry="6" fill="#FFFFFF" opacity="0.9" />
            </>
          )}
          {/* morrinhos lá fora */}
          <path d="M20 96 Q44 70 66 84 T104 76 V100 H20 Z" fill={lunar ? '#8E94AE' : night ? '#2A3C5E' : '#8FD08A'} />
          <path d="M20 100 Q50 84 80 94 T104 90 V100 H20 Z" fill={lunar ? '#B9BDCB' : night ? '#22314E' : '#6FBF77'} />
          {lunar && <><ellipse cx="46" cy="95" rx="7" ry="2" fill="#8E94AE" /><ellipse cx="78" cy="96" rx="5" ry="1.6" fill="#8E94AE" /></>}
        </g>
        {shape === 'vigia' ? (
          <>
            <circle cx="60" cy="52" r="34" fill="none" stroke={frame} strokeWidth="6" />
            <path d="M26 52 H94 M60 18 V86" stroke={frame} strokeWidth="3" />
          </>
        ) : (
          <>
            <g fill="none" stroke={frame} strokeWidth="6" strokeLinejoin="round">{pane}</g>
            <path d={shape === 'arco' ? 'M60 15 V92 M26 54 H94' : 'M60 16 V92 M24 54 H96'} stroke={frame} strokeWidth="3" />
          </>
        )}
        {/* reflexo */}
        <path d="M34 40 L46 28 M34 52 L52 34" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity={night ? 0.2 : 0.55} />
        {/* parapeito */}
        <rect x="14" y="90" width="92" height="7" rx="3" fill={frame} />
        <rect x="14" y="95" width="92" height="3" rx="1.5" fill={mix(frame, '#2B1A14', 0.12)} />
      </g>
      {/* cortinas presas com lacinho */}
      <rect x="4" y="2" width="112" height="5" rx="2.5" fill={mix(c, '#2B1A14', 0.3)} />
      <circle cx="4" cy="4.5" r="4" fill={mix(c, '#2B1A14', 0.3)} />
      <circle cx="116" cy="4.5" r="4" fill={mix(c, '#2B1A14', 0.3)} />
      {[-1, 1].map((s) => {
        const x0 = s < 0 ? 6 : 114;
        const d =
          s < 0
            ? `M${x0} 6 H34 Q30 40 22 58 Q30 80 34 112 H${x0} Z`
            : `M${x0} 6 H86 Q90 40 98 58 Q90 80 86 112 H${x0} Z`;
        return (
          <g key={s}>
            <path d={d} fill={c} />
            {[0.3, 0.6].map((t) => (
              <path key={t} d={s < 0 ? `M${6 + 26 * t} 8 Q${6 + 22 * t} 40 ${6 + 14 * t} 58 Q${6 + 20 * t} 82 ${6 + 26 * t} 110` : `M${114 - 26 * t} 8 Q${114 - 22 * t} 40 ${114 - 14 * t} 58 Q${114 - 20 * t} 82 ${114 - 26 * t} 110`} stroke={mix(c, '#2B1A14', 0.14)} strokeWidth="2" fill="none" opacity="0.6" />
            ))}
            <path d={s < 0 ? 'M6 108 H34 V112 H6 Z' : 'M86 108 H114 V112 H86 Z'} fill={mix(c, '#2B1A14', 0.12)} />
            <ellipse cx={s < 0 ? 22 : 98} cy="58" rx="9" ry="4" fill={c2} />
            <circle cx={s < 0 ? 22 : 98} cy="58" r="3" fill={mix(c2, '#2B1A14', 0.15)} />
          </g>
        );
      })}
      {/* bandô */}
      <path d="M6 6 H114 V16 Q104 22 94 16 Q84 22 74 16 Q64 22 54 16 Q44 22 34 16 Q24 22 14 16 Q8 20 6 16 Z" fill={c2} />
      <path d="M6 6 H114 V9 H6 Z" fill={mix(c2, '#2B1A14', 0.08)} />
    </svg>
  );
}

