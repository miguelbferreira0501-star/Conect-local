// Detalhes a mais de cada arena (desenhados por cima do cenário, nas laterais, longe de onde o Hami fica):
// tufos de grama, pedrinhas e um bichinho ou objeto que reage ao toque. Quadro 400 x 300.
import type { ReactNode } from 'react';

/** Tufos de grama e pedrinhas no chão, nas laterais. */
function Ground({ tuft, pebble, night }: { tuft?: string; pebble?: string; night: boolean }) {
  const spots: [number, number][] = [[14, 290], [52, 272], [98, 294], [126, 266], [278, 292], [312, 270], [350, 294], [388, 276]];
  return (
    <g pointerEvents="none">
      {tuft &&
        spots.map(([x, y], i) => (
          <path key={i} d={`M${x - 6} ${y} q2 -9 4 -1 q1 -11 3 0 q2 -8 5 1`} stroke={night ? '#1F3E33' : tuft} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        ))}
      {pebble &&
        [[36, 296], [114, 284], [292, 284], [372, 288]].map(([x, y], i) => (
          <g key={i}>
            <ellipse cx={x} cy={y} rx={4 + (i % 2) * 2} ry="2.6" fill={night ? '#555' : pebble} />
            <ellipse cx={x - 1} cy={y - 1} rx="1.6" ry="0.9" fill="#FFFFFF" opacity="0.5" />
          </g>
        ))}
    </g>
  );
}

const Bee = ({ x, y, d }: { x: number; y: number; d: number }) => (
  <g className="butterfly" style={{ animationDelay: `${d}s` }}>
    <g transform={`translate(${x} ${y})`} data-tap="bicho">
      <ellipse className="wing" cx="-2" cy="-5" rx="3.4" ry="4.4" fill="#FFFFFF" opacity="0.85" />
      <ellipse className="wing wing-r" cx="3" cy="-5" rx="3.4" ry="4.4" fill="#FFFFFF" opacity="0.85" />
      <ellipse cx="0" cy="0" rx="6" ry="4.4" fill="#FFD34D" />
      <path d="M-1.5 -4 V4 M2 -4 V4" stroke="#2B2224" strokeWidth="1.6" />
      <circle cx="4.6" cy="-0.6" r="0.9" fill="#2B2224" />
    </g>
  </g>
);

const SnowPine = ({ x, y, s }: { x: number; y: number; s: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} className="tree-sway" data-tap="arvore">
    <rect x="-3" y="-2" width="6" height="14" fill="#6E4A30" />
    <path d="M0 -60 L18 -30 H10 L24 -6 H-24 L-10 -30 H-18Z" fill="#2F6E5A" />
    <path d="M0 -60 L9 -45 Q4 -42 0 -46 Q-4 -42 -9 -45Z M-14 -28 Q-8 -24 -2 -28 Q4 -24 10 -28 L14 -24 Q6 -20 0 -23 Q-6 -20 -16 -24Z" fill="#FFFFFF" />
    {[[-8, -18, '#FF6F91'], [8, -12, '#FFD34D'], [0, -34, '#7FB8F0']].map(([lx, ly, c], i) => <circle key={i} className="twinkle" style={{ animationDelay: `${i * 0.5}s` }} cx={lx} cy={ly} r="2.2" fill={c as string} />)}
  </g>
);

export const ARENA_DETAILS: Record<string, (night: boolean) => ReactNode> = {
  casinha: (night) => (
    <g>
      {/* cerquinha */}
      <g>
        <path d="M232 222 H330 M232 232 H330" stroke={night ? '#8D8378' : '#FFF6E8'} strokeWidth="3.5" />
        {[236, 252, 268, 284, 300, 316].map((x) => (
          <path key={x} d={`M${x - 4} 240 V218 l4 -5 l4 5 V240 Z`} fill={night ? '#9A8F86' : '#FFFBF4'} stroke={night ? '#6E655D' : '#E8DCCB'} strokeWidth="1" />
        ))}
      </g>
      {/* caixa de correio */}
      <g transform="translate(128 246)" data-tap="carta">
        <rect x="-2" y="-14" width="4" height="22" fill="#8A5A3B" />
        <path d="M-12 -14 V-26 Q-12 -32 -6 -32 H6 Q12 -32 12 -26 V-14 Z" fill="#F26D6D" />
        <path d="M-12 -14 V-26 Q-12 -32 -6 -32" fill="none" stroke="#D84F55" strokeWidth="1.6" />
        <path d="M10 -28 V-40 H18 V-35 H12" fill="#FFD34D" />
        <rect x="-8" y="-24" width="10" height="2.4" rx="1" fill="#FFFFFF" opacity="0.7" />
      </g>
      {/* pedras do caminho */}
      {[[200, 292, 13], [186, 276, 10], [212, 266, 9]].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.42} fill={night ? '#7B7368' : '#E8DCC6'} stroke={night ? '#5E574F' : '#D4C4A6'} strokeWidth="1" />
      ))}
      <Ground tuft="#4FA35C" pebble="#C9C2B4" night={night} />
    </g>
  ),
  jardim: (night) => (
    <g>
      {/* regador */}
      <g transform="translate(266 282) scale(0.9)" data-tap="agua">
        <path d="M-12 0 V-18 H12 V0 Z" fill={night ? '#5C7FA8' : '#7FB8F0'} />
        <path d="M12 -14 L26 -24 L28 -21 L14 -8" fill={night ? '#5C7FA8' : '#7FB8F0'} />
        <path d="M-12 -14 Q-22 -14 -20 -4 Q-18 2 -12 -2" stroke={night ? '#4A6A90' : '#5B8DEF'} strokeWidth="3" fill="none" />
        <rect x="-13" y="-21" width="26" height="4" rx="2" fill={night ? '#4A6A90' : '#5B8DEF'} />
        <ellipse cx="-4" cy="-10" rx="3" ry="5" fill="#FFFFFF" opacity="0.35" />
      </g>
      {!night && <Bee x={130} y={226} d={0.4} />}
      {!night && <Bee x={280} y={232} d={2.6} />}
      <Ground tuft="#5DB36A" night={night} />
    </g>
  ),
  vila: (night) => (
    <g>
      {/* varal de bandeirinhas entre as casas */}
      <path d="M134 132 Q260 154 396 128" stroke={night ? '#6E6680' : '#9A7A62'} strokeWidth="1.2" fill="none" />
      {Array.from({ length: 11 }, (_, i) => {
        const t = (i + 0.5) / 11;
        const x = 134 + t * 262;
        const y = 132 + Math.sin(t * Math.PI) * 18 - t * 4;
        return <path key={i} className="flag-wave" d={`M${x - 6} ${y} L${x + 6} ${y} L${x} ${y + 11} Z`} fill={night ? ['#7A5A8A', '#5A6A8A', '#8A7A5A'][i % 3] : ['#FF86AC', '#FFD34D', '#7FB8F0', '#7CC39A'][i % 4]} />;
      })}
      {/* gatinho dormindo em cima da placa do café */}
      <g transform="translate(306 150)" data-tap="gato">
        <path d="M14 -2 Q26 -4 22 -14" stroke="#9AA0B4" strokeWidth="4" fill="none" strokeLinecap="round" />
        <ellipse cx="0" cy="-5" rx="15" ry="7" fill="#B8BCCB" />
        <circle cx="-10" cy="-9" r="7" fill="#B8BCCB" />
        <path d="M-16 -13 L-15 -20 L-11 -15 Z M-8 -15 L-5 -21 L-3 -14 Z" fill="#B8BCCB" />
        <path d="M-14 -9 q2 1.6 4 0 M-8 -9 q2 1.6 4 0" stroke="#2B2224" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        <text x="6" y="-18" fontSize="8" fontWeight="800" fill={night ? '#E9E3F5' : '#6B6480'} fontFamily="sans-serif" className="zzz">z</text>
      </g>
      {/* vasinhos de flor */}
      {[[350, 246, '#FF7FA0'], [366, 248, '#FFD34D']].map(([x, y, c], i) => (
        <g key={i} data-tap="flor">
          <path d={`M${(x as number) - 6} ${y} h12 l-2 9 h-8 Z`} fill="#D9825B" />
          <circle cx={x as number} cy={(y as number) - 4} r="4" fill={c as string} />
          <circle cx={(x as number) - 4} cy={(y as number) - 1} r="2.4" fill="#5FBF77" />
        </g>
      ))}
    </g>
  ),
  floresta: (night) => (
    <g>
      {/* vitórias-régias e um sapinho no lago */}
      {[[268, 254], [350, 246]].map(([x, y], i) => <path key={i} d={`M${x} ${y} a9 3.6 0 1 0 0.1 0 Z`} fill={night ? '#2E5A40' : '#5FBF77'} />)}
      <g transform="translate(316 248)" data-tap="bicho">
        <ellipse cx="0" cy="2" rx="11" ry="3.6" fill={night ? '#2E5A40' : '#4FA35C'} />
        <ellipse cx="0" cy="-3" rx="8" ry="6" fill={night ? '#4C8A5A' : '#7BD389'} />
        <circle cx="-4" cy="-8" r="3.2" fill={night ? '#4C8A5A' : '#7BD389'} />
        <circle cx="4" cy="-8" r="3.2" fill={night ? '#4C8A5A' : '#7BD389'} />
        <circle cx="-4" cy="-8.4" r="1.5" fill="#2B2224" />
        <circle cx="4" cy="-8.4" r="1.5" fill="#2B2224" />
        <path d="M-3 -2 q3 2 6 0" stroke="#2B2224" strokeWidth="1" fill="none" />
      </g>
      {/* samambaias */}
      {[[128, 270], [276, 274]].map(([x, y], i) => (
        <g key={i} className="tree-sway" data-tap="arvore">
          {[-50, -25, 0, 25, 50].map((a) => (
            <path key={a} d={`M${x} ${y} q${a * 0.2} -12 ${a * 0.36} -20`} stroke={night ? '#24503E' : '#3E9C55'} strokeWidth="3.4" fill="none" strokeLinecap="round" />
          ))}
        </g>
      ))}
      <Ground tuft="#3E8F4A" pebble="#9AA6B5" night={night} />
    </g>
  ),
  tropical: (night) => (
    <g>
      {/* castelinho de areia */}
      <g transform="translate(118 284)" data-tap="bola">
        <path d="M-16 4 V-8 H-10 V-12 H-4 V-8 H4 V-12 H10 V-8 H16 V4 Z" fill={night ? '#B8A07A' : '#F2C77A'} />
        <path d="M-6 -8 V-20 H6 V-8" fill={night ? '#C9B08A' : '#F7D48E'} />
        <path d="M0 -20 V-28 L7 -25 L0 -22" fill="#F26D6D" stroke="#8A5A3B" strokeWidth="0.8" />
        <path d="M-3 4 V-2 Q0 -5 3 -2 V4" fill={night ? '#8A7552' : '#D9A766'} />
      </g>
      {/* caranguejo */}
      <g className="crab-walk">
      <g transform="translate(276 284)" data-tap="bicho">
        <ellipse cx="0" cy="0" rx="10" ry="6.5" fill="#F0525F" />
        <path d="M-10 -2 l-6 -6 M10 -2 l6 -6" stroke="#F0525F" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="-17" cy="-9" r="3.4" fill="#F0525F" />
        <circle cx="17" cy="-9" r="3.4" fill="#F0525F" />
        <path d="M-4 -6 V-10 M4 -6 V-10" stroke="#F0525F" strokeWidth="1.6" />
        <circle cx="-4" cy="-11" r="2" fill="#FFFFFF" />
        <circle cx="4" cy="-11" r="2" fill="#FFFFFF" />
        <circle cx="-4" cy="-11" r="1" fill="#2B2224" />
        <circle cx="4" cy="-11" r="1" fill="#2B2224" />
        <path d="M-8 4 l-4 4 M-4 5 l-2 4 M8 4 l4 4 M4 5 l2 4" stroke="#F0525F" strokeWidth="1.6" strokeLinecap="round" />
      </g>
      </g>
      {/* conchinhas */}
      {[[350, 270], [24, 268], [160, 296]].map(([x, y], i) => (
        <g key={i} data-tap="brilho">
          <path d={`M${x - 6} ${y} Q${x} ${y - 10} ${x + 6} ${y} Z`} fill={i % 2 ? '#FFB3C7' : '#FFF1DE'} stroke="#E8B97A" strokeWidth="0.8" />
          <path d={`M${x} ${y} V${y - 7} M${x - 3} ${y} L${x - 2} ${y - 6} M${x + 3} ${y} L${x + 2} ${y - 6}`} stroke="#E8B97A" strokeWidth="0.8" />
        </g>
      ))}
    </g>
  ),
  neve: (night) => (
    <g>
      <SnowPine x={22} y={270} s={0.6} />
      <SnowPine x={382} y={262} s={0.55} />
      {/* pegadinhas na neve */}
      {[[146, 296], [158, 288], [168, 280], [180, 274]].map(([x, y], i) => (
        <g key={i} fill={night ? '#9AA8C8' : '#D3E0F2'} pointerEvents="none">
          <ellipse cx={x - 3} cy={y} rx="2" ry="3" />
          <ellipse cx={x + 3} cy={y - 2} rx="2" ry="3" />
        </g>
      ))}
    </g>
  ),
  cidade: (night) => (
    <g>
      {/* pombinhos */}
      {[[118, 282], [134, 286]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${i ? -1 : 1} 1)`} data-tap="bicho">
          <ellipse cx="0" cy="0" rx="7" ry="5" fill="#A9B0C2" />
          <circle cx="6" cy="-5" r="3.6" fill="#8C93A8" />
          <path d="M9 -5 l3 1 l-3 1" fill="#F6B94A" />
          <circle cx="7" cy="-6" r="0.9" fill="#2B2224" />
          <path d="M-6 -2 q-5 0 -8 3 q4 1 8 0" fill="#8C93A8" />
          <path d="M-1 5 v3 M2 5 v3" stroke="#F6B94A" strokeWidth="1.2" />
        </g>
      ))}
      {/* hidrante */}
      <g transform="translate(372 270)" data-tap="agua">
        <rect x="-6" y="-16" width="12" height="18" rx="3" fill="#F0525F" />
        <path d="M-7 -16 Q0 -24 7 -16 Z" fill="#D84F55" />
        <rect x="-10" y="-11" width="20" height="5" rx="2.4" fill="#D84F55" />
        <rect x="-8" y="1" width="16" height="4" rx="1.6" fill="#B03A44" />
      </g>
      {/* semáforo */}
      <g transform="translate(108 232)" data-tap="sino">
        <rect x="-2" y="0" width="4" height="40" fill="#4B4F5E" />
        <rect x="-7" y="-28" width="14" height="30" rx="4" fill="#3A3F4A" />
        <circle cx="0" cy="-21" r="3.6" fill={night ? '#5A2A2A' : '#F0525F'} />
        <circle cx="0" cy="-13" r="3.6" fill="#6A5A2A" />
        <circle cx="0" cy="-5" r="3.6" fill={night ? '#5BD38A' : '#2A5A3A'} className={night ? 'twinkle' : undefined} />
      </g>
    </g>
  ),
  mar: (night) => (
    <g>
      {/* águas-vivas */}
      {[[340, 116, '#FFB3E6'], [236, 84, '#C9B5FF']].map(([x, y, c], i) => (
        <g key={i} className="float-bob" style={{ animationDelay: `${i * 1.8}s` }}>
          <g transform={`translate(${x} ${y})`} data-tap="agua">
            <path d="M-12 0 Q-12 -14 0 -14 Q12 -14 12 0 Q6 3 0 0 Q-6 3 -12 0 Z" fill={c as string} opacity="0.85" />
            {[-7, -2, 3, 8].map((dx) => <path key={dx} d={`M${dx} 1 q-3 6 0 12 q3 6 0 12`} stroke={c as string} strokeWidth="1.6" fill="none" opacity="0.8" />)}
            <circle cx="-4" cy="-6" r="1.4" fill="#2B2224" />
            <circle cx="4" cy="-6" r="1.4" fill="#2B2224" />
            <ellipse cx="-5" cy="-10" rx="3" ry="1.6" fill="#FFFFFF" opacity="0.5" />
          </g>
        </g>
      ))}
      {/* estrela-do-mar e concha */}
      <path d="M38 286 l3 -7 l3 7 l7 1 l-5 4 l2 7 l-7 -4 l-7 4 l2 -7 l-5 -4z" fill={night ? '#B86A8A' : '#FF86AC'} data-tap="bicho" />
      <g data-tap="brilho">
        <path d="M352 292 Q358 280 364 292 Z" fill="#FFF1DE" stroke="#E8B97A" strokeWidth="0.8" />
        <circle cx="358" cy="289" r="2.2" fill="#FFFFFF" />
      </g>
    </g>
  ),
  sonhos: (night) => (
    <g>
      {/* balões de coração */}
      {[[352, 132, '#FF86AC'], [372, 146, '#B399F0']].map(([x, y, c], i) => (
        <g key={i} className="float-bob" style={{ animationDelay: `${i * 1.2}s` }}>
          <g data-tap="brilho">
            <path d={`M${x} ${(y as number) + 14} q-4 20 2 40`} stroke="#FFFFFF" strokeWidth="1" fill="none" opacity="0.8" />
            <path d={`M${x} ${(y as number) + 14} C${(x as number) - 16} ${(y as number) + 2} ${(x as number) - 10} ${(y as number) - 12} ${x} ${(y as number) - 4} C${(x as number) + 10} ${(y as number) - 12} ${(x as number) + 16} ${(y as number) + 2} ${x} ${(y as number) + 14} Z`} fill={c as string} />
            <ellipse cx={(x as number) - 5} cy={(y as number) - 3} rx="2.4" ry="3.6" fill="#FFFFFF" opacity="0.5" />
          </g>
        </g>
      ))}
      {/* balinhas no chão */}
      {[[30, 290, '#FF86AC'], [124, 284, '#7FD8F0'], [286, 292, '#FFD34D'], [370, 286, '#7CC39A']].map(([x, y, c], i) => (
        <g key={i} data-tap="brilho">
          <path d={`M${(x as number) - 12} ${y} l5 -4 v8 Z M${(x as number) + 12} ${y} l-5 -4 v8 Z`} fill={c as string} opacity="0.85" />
          <ellipse cx={x as number} cy={y as number} rx="7" ry="5" fill={c as string} />
          <path d={`M${(x as number) - 3} ${(y as number) - 4} l3 8 M${(x as number) + 1} ${(y as number) - 5} l3 8`} stroke="#FFFFFF" strokeWidth="1.4" opacity={night ? 0.5 : 0.8} />
        </g>
      ))}
    </g>
  ),
  castelo: (night) => (
    <g>
      {/* estandartes */}
      {[[26, 250, '#7E57D6'], [374, 246, '#F0525F']].map(([x, y, c], i) => (
        <g key={i} data-tap="sino">
          <path d={`M${x} ${y} V${(y as number) - 64}`} stroke="#8A6A4F" strokeWidth="3" />
          <circle cx={x as number} cy={(y as number) - 66} r="3" fill="#F6C445" />
          <path className="flag-wave" d={`M${(x as number) + 1.5} ${(y as number) - 62} h22 l-6 9 l6 9 h-22 Z`} fill={night ? '#4A3E6E' : (c as string)} />
          <path d={`M${(x as number) + 9} ${(y as number) - 56} l2 4 l4 0.5 l-3 3 l1 4 l-4 -2 l-4 2 l1 -4 l-3 -3 l4 -0.5 Z`} fill="#F6C445" />
        </g>
      ))}
      <Ground tuft="#3E9C55" pebble="#B8B0A2" night={night} />
    </g>
  ),
  espaco: () => (
    <g>
      {/* crateras */}
      {[[146, 290, 16], [362, 282, 12], [40, 296, 10]].map(([x, y, r], i) => (
        <g key={i} pointerEvents="none">
          <ellipse cx={x} cy={y} rx={r} ry={r * 0.32} fill="#000000" opacity="0.18" />
          <ellipse cx={x} cy={y - 1} rx={r * 0.8} ry={r * 0.22} fill="#FFFFFF" opacity="0.12" />
        </g>
      ))}
      {/* disco voador que passa */}
      <g className="ufo-fly">
        <g transform="translate(60 112)" data-tap="brilho">
          <ellipse cx="0" cy="0" rx="16" ry="5" fill="#C9D3E6" />
          <path d="M-8 -2 Q0 -14 8 -2 Z" fill="#9FE3F0" opacity="0.9" />
          {[-10, 0, 10].map((x) => <circle key={x} cx={x} cy="1" r="1.6" fill="#FFD34D" className="twinkle" />)}
          <circle cx="0" cy="-7" r="2.2" fill="#7BD389" />
        </g>
      </g>
    </g>
  ),
  celeste: (night) => (
    <g>
      {/* sino dourado num pilar de nuvem */}
      <g transform="translate(352 246)" data-tap="sino">
        <path d="M-12 30 Q-14 18 -6 16 Q-8 6 2 6 Q12 4 12 16 Q18 18 14 30 Z" fill="#FFFFFF" opacity={night ? 0.7 : 0.95} />
        <path d="M0 6 V-30" stroke="#F6C445" strokeWidth="3" />
        <path d="M-14 -32 Q0 -40 14 -32" stroke="#F6C445" strokeWidth="3" fill="none" />
        <path d="M-10 -12 Q-10 -28 0 -28 Q10 -28 10 -12 L13 -8 H-13 Z" fill="#FFD34D" stroke="#E8B020" strokeWidth="1.2" />
        <circle cx="0" cy="-6" r="2.6" fill="#E8B020" />
        <ellipse cx="-4" cy="-20" rx="2" ry="4" fill="#FFFFFF" opacity="0.6" />
      </g>
    </g>
  ),
};
