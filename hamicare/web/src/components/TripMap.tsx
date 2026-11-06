// Mapa dos passeios: cada lugar é uma ilhinha desenhada, com rio, lagos, trilhas e balões passando.
// O desenho é só enfeite (aria-hidden); os botões por cima de cada ilha são o que dá para tocar.
// Quadro 400 x 780.
import type { ReactNode } from 'react';

export const MAP_W = 400;
export const MAP_H = 780;

/** Onde fica cada ilha (centro do chão da ilha). */
export const ISLAND_AT: Record<string, [number, number]> = {
  casa: [92, 712],
  jardim: [282, 690],
  parque: [104, 585],
  praia: [300, 566],
  floresta: [92, 448],
  cafeteria: [276, 446],
  montanhas: [112, 318],
  cidade: [298, 322],
  castelo: [100, 196],
  'vila-inverno': [296, 196],
  espaco: [202, 78],
};

// ---------- Peças ----------

/** Ilha com espessura (o chão por cima e a beirada mais escura embaixo). */
function Island({ x, y, rx, ry, top, side, children }: { x: number; y: number; rx: number; ry: number; top: string; side: string; children?: ReactNode }) {
  const blob = (dy: number) =>
    `M${x - rx} ${y + dy} C${x - rx} ${y - ry * 0.9 + dy} ${x - rx * 0.35} ${y - ry * 1.15 + dy} ${x + rx * 0.05} ${y - ry + dy} C${x + rx * 0.6} ${y - ry * 1.05 + dy} ${x + rx * 1.02} ${y - ry * 0.55 + dy} ${x + rx} ${y + dy} C${x + rx * 0.98} ${y + ry * 0.75 + dy} ${x + rx * 0.4} ${y + ry * 1.05 + dy} ${x - rx * 0.1} ${y + ry * 0.95 + dy} C${x - rx * 0.6} ${y + ry * 0.9 + dy} ${x - rx * 1.02} ${y + ry * 0.6 + dy} ${x - rx} ${y + dy} Z`;
  return (
    <g>
      <path d={blob(12)} fill="#000000" opacity="0.12" />
      <path d={blob(8)} fill={side} />
      <path d={blob(0)} fill={top} />
      <path d={blob(0)} fill="none" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="2" />
      <g transform={`translate(${x} ${y})`}>{children}</g>
    </g>
  );
}

const Pine = ({ x, y, s = 1, c = '#2F7A4A', snow }: { x: number; y: number; s?: number; c?: string; snow?: boolean }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="-2" y="-4" width="4" height="7" fill="#6E4A30" />
    <path d="M0 -34 L11 -16 H6 L14 -3 H-14 L-6 -16 H-11 Z" fill={c} />
    {snow && <path d="M0 -34 L5.5 -25 Q2 -23 0 -26 Q-2 -23 -5.5 -25 Z M-8 -15 Q-3 -12 1 -15 Q5 -12 9 -15 L10 -13 Q4 -10 0 -12 Q-5 -10 -10 -13 Z" fill="#FFFFFF" />}
  </g>
);

const Tree = ({ x, y, s = 1, c = '#4FA35C', fruit }: { x: number; y: number; s?: number; c?: string; fruit?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="-2.5" y="-10" width="5" height="12" rx="2" fill="#8A5A3B" />
    <circle cx="0" cy="-20" r="12" fill={c} />
    <circle cx="-8" cy="-13" r="8" fill={c} />
    <circle cx="8" cy="-13" r="8.5" fill={c} />
    <circle cx="-4" cy="-25" r="4" fill="#FFFFFF" opacity="0.15" />
    {fruit && [[-6, -18], [5, -22], [6, -12]].map(([fx, fy], i) => <circle key={i} cx={fx} cy={fy} r="2" fill={fruit} />)}
  </g>
);

const Flowers = ({ x, y, n = 5, w = 40 }: { x: number; y: number; n?: number; w?: number }) => (
  <g>
    {Array.from({ length: n }, (_, i) => (
      <g key={i} transform={`translate(${x - w / 2 + (i * w) / Math.max(1, n - 1)} ${y + (i % 2) * 3})`}>
        <path d="M0 0 V-5" stroke="#3E8F4A" strokeWidth="1.4" />
        <circle cx="0" cy="-6" r="3" fill={['#FF7FA0', '#FFD34D', '#B48CFF', '#FFFFFF', '#FF9D5C'][i % 5]} />
        <circle cx="0" cy="-6" r="1.1" fill="#FFE066" />
      </g>
    ))}
  </g>
);

const Balloon = ({ x, y, a, b, cls }: { x: number; y: number; a: string; b: string; cls?: string }) => (
  <g className={cls}>
    <g transform={`translate(${x} ${y})`}>
      <path d="M-15 0 Q-15 -26 0 -26 Q15 -26 15 0 Q12 10 4 16 H-4 Q-12 10 -15 0 Z" fill={a} />
      <path d="M-5 -25.5 Q-9 -6 -4 16 M5 -25.5 Q9 -6 4 16" stroke={b} strokeWidth="4" fill="none" opacity="0.9" />
      <path d="M-4 16 L-3 22 M4 16 L3 22" stroke="#8A6A4F" strokeWidth="1" />
      <rect x="-4.5" y="22" width="9" height="7" rx="1.5" fill="#B07A52" />
      <ellipse cx="-7" cy="-14" rx="3" ry="6" fill="#FFFFFF" opacity="0.35" />
    </g>
  </g>
);

const Cloud = ({ x, y, s = 1, cls }: { x: number; y: number; s?: number; cls?: string }) => (
  <g className={cls}>
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#FFFFFF" opacity="0.92">
      <ellipse cx="0" cy="0" rx="30" ry="11" />
      <ellipse cx="-12" cy="-7" rx="14" ry="11" />
      <ellipse cx="10" cy="-9" rx="16" ry="13" />
    </g>
  </g>
);

// ---------- Os lugares ----------

function Casa() {
  return (
    <g>
      <Flowers x={-24} y={14} n={3} w={16} />
      <Flowers x={26} y={16} n={3} w={16} />
      <rect x="-22" y="-26" width="44" height="30" rx="2" fill="#F26D6D" />
      <path d="M-28 -24 L0 -46 L28 -24 Z" fill="#7FB8F0" />
      <path d="M-28 -24 L0 -46 L28 -24" stroke="#5B8DEF" strokeWidth="3" fill="none" strokeLinejoin="round" />
      <rect x="10" y="-44" width="7" height="12" fill="#5B8DEF" />
      <path d="M-6 4 V-10 Q-6 -16 0 -16 Q6 -16 6 -10 V4 Z" fill="#FFD9A6" />
      <path d="M0 -16 V4 M-6 -6 H6" stroke="#E8B97A" strokeWidth="1.2" />
      <rect x="-18" y="-18" width="9" height="9" rx="1.5" fill="#BFE8FF" stroke="#FFFFFF" strokeWidth="1.4" />
      <rect x="10" y="-18" width="9" height="9" rx="1.5" fill="#BFE8FF" stroke="#FFFFFF" strokeWidth="1.4" />
    </g>
  );
}

function Jardim() {
  return (
    <g>
      {/* estufa de vidro */}
      <path d="M-40 -2 V-22 Q-40 -40 -22 -40 Q-4 -40 -4 -22 V-2 Z" fill="#DDF3FF" opacity="0.9" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M-22 -40 V-2 M-40 -20 H-4" stroke="#FFFFFF" strokeWidth="1.6" />
      <Flowers x={-22} y={-4} n={4} w={26} />
      {/* canteiros */}
      {[[14, -6], [30, 6]].map(([cx, cy], i) => (
        <g key={i}>
          <rect x={cx - 16} y={cy - 4} width="32" height="7" rx="3" fill="#8A5A3B" />
          <Flowers x={cx} y={cy - 4} n={5} w={26} />
        </g>
      ))}
      {/* cerquinha */}
      {[-46, -36, -26].map((fx) => <path key={fx} d={`M${fx} 14 V4 l3 -3 l3 3 V14 Z`} fill="#FFFBF4" />)}
      <path d="M-48 8 H-20" stroke="#FFFBF4" strokeWidth="2" />
      {/* regador */}
      <g transform="translate(40 -10)">
        <path d="M-5 0 V-8 H5 V0 Z" fill="#7FB8F0" />
        <path d="M5 -6 L11 -11" stroke="#7FB8F0" strokeWidth="2.4" />
      </g>
    </g>
  );
}

function Parque() {
  return (
    <g>
      <Tree x={-38} y={-2} s={1.2} c="#3E9C55" />
      <Tree x={36} y={-6} s={1} c="#5FB86A" fruit="#FF7F7F" />
      {/* balanço */}
      <path d="M-14 4 L-6 -30 L2 4 M22 4 L14 -30 L6 4 M-6 -30 H14" stroke="#B07A52" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M0 -30 V-10 M8 -30 V-10" stroke="#8A90A0" strokeWidth="1.2" />
      <rect x="-2" y="-11" width="12" height="3" rx="1.5" fill="#F26D6D" />
      {/* banquinho e pipa */}
      <rect x="-30" y="10" width="20" height="3" rx="1.5" fill="#C98A5B" />
      <path d="M-27 13 v4 M-13 13 v4" stroke="#8A5A3B" strokeWidth="1.6" />
      <path d="M44 -52 l7 7 l-7 9 l-7 -9 Z" fill="#FF9D5C" />
      <path d="M44 -36 q-4 12 -14 22" stroke="#8A6A4F" strokeWidth="0.8" fill="none" />
    </g>
  );
}

function Praia() {
  return (
    <g>
      {/* quiosque */}
      <rect x="-40" y="-20" width="34" height="20" fill="#F7DDB0" />
      <path d="M-46 -20 L-23 -36 L0 -20 Z" fill="#E8C060" />
      {[-42, -34, -26, -18, -10, -4].map((sx) => <path key={sx} d={`M${sx} -20 L${(sx + 23) * 0.3 - 23} -33`} stroke="#C9A040" strokeWidth="1.2" />)}
      <rect x="-28" y="-14" width="10" height="14" fill="#7A4E32" />
      {/* coqueiros */}
      {[[18, 0, 1], [44, -4, 0.8]].map(([px, py, s], i) => (
        <g key={i} transform={`translate(${px} ${py}) scale(${s})`}>
          <path d="M0 0 Q-3 -22 4 -42" stroke="#B07A52" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M4 -42 Q-12 -52 -24 -40 Q-10 -44 4 -42 Z M4 -42 Q20 -52 30 -40 Q16 -46 4 -42 Z M4 -42 Q-8 -36 -14 -24 Q-2 -34 4 -42 Z M4 -42 Q16 -36 20 -24 Q10 -34 4 -42 Z" fill="#3FB27F" />
        </g>
      ))}
      {/* guarda-sol e boia */}
      <path d="M4 10 V-6" stroke="#8A5A3B" strokeWidth="1.6" />
      <path d="M-10 -5 Q4 -17 18 -5 Z" fill="#F26D6D" />
      <path d="M-3 -6 Q1 -14 4 -15 Q2 -10 2 -6 Z M7 -6 Q7 -11 4 -15 Q9 -13 11 -6 Z" fill="#FFFFFF" />
      <circle cx="36" cy="14" r="6" fill="none" stroke="#FFFFFF" strokeWidth="3.6" />
      <path d="M31.5 10 a6 6 0 0 1 4 -2 M40.5 18 a6 6 0 0 1 -4 2" stroke="#F26D6D" strokeWidth="3.6" fill="none" />
      <path d="M-30 14 l2 -5 l2 5 l5 0.6 l-4 3 l1.4 5 l-4.4 -3 l-4.4 3 l1.4 -5 l-4 -3 Z" fill="#FF9F4D" />
    </g>
  );
}

function Floresta() {
  return (
    <g>
      {[[-40, 2, 1.1], [-24, -6, 1.3], [-6, 0, 1], [24, -8, 1.25], [42, 0, 1]].map(([px, py, s], i) => (
        <Pine key={i} x={px} y={py} s={s} c={i % 2 ? '#2F7A4A' : '#3B8C58'} />
      ))}
      {/* cabana */}
      <rect x="2" y="-4" width="22" height="16" fill="#A86E44" />
      <path d="M-2 -4 L13 -16 L28 -4 Z" fill="#7A4E32" />
      <rect x="10" y="2" width="6" height="10" fill="#5E3B27" />
      <path d="M2 0 H24 M2 4 H24 M2 8 H24" stroke="#8A5A3B" strokeWidth="1" />
      {/* cogumelos */}
      <g transform="translate(-30 16)">
        <path d="M-3 0 V-5 H3 V0 Z" fill="#FFF3DC" />
        <path d="M-7 -4 Q-7 -12 0 -12 Q7 -12 7 -4 Z" fill="#F26D6D" />
        <circle cx="-2" cy="-8" r="1.4" fill="#FFFFFF" />
      </g>
    </g>
  );
}

function Cafeteria() {
  return (
    <g>
      <rect x="-30" y="-30" width="44" height="32" rx="2" fill="#FFF3DC" />
      <path d="M-34 -30 H18 L14 -40 H-30 Z" fill="#F26D6D" />
      {[-28, -18, -8, 2, 12].map((sx) => <path key={sx} d={`M${sx} -40 L${sx + 3} -30`} stroke="#FFFFFF" strokeWidth="4" opacity="0.9" />)}
      <path d="M-34 -30 q4 4 8 0 q4 4 8 0 q4 4 8 0 q4 4 8 0 q4 4 8 0 q4 4 8 0 q4 4 8 0" fill="#F26D6D" />
      <rect x="-24" y="-20" width="16" height="12" rx="2" fill="#BFE8FF" />
      <rect x="0" y="-18" width="9" height="20" rx="2" fill="#7A4E32" />
      {/* xícara na placa */}
      <g transform="translate(-8 -50)">
        <rect x="-8" y="-6" width="16" height="10" rx="3" fill="#7A4E32" />
        <path d="M-4 -2 h7 v3 q0 2 -2 2 h-3 q-2 0 -2 -2 Z" fill="#FFF3DC" />
      </g>
      {/* mesinhas com guarda-sol */}
      {[[30, 0, '#7FD8BE'], [44, 14, '#FFD34D']].map(([tx, ty, c], i) => (
        <g key={i} transform={`translate(${tx} ${ty})`}>
          <path d="M0 0 V-14" stroke="#8A5A3B" strokeWidth="1.4" />
          <path d="M-9 -12 Q0 -20 9 -12 Z" fill={c as string} />
          <ellipse cx="0" cy="0" rx="6" ry="2" fill="#FFFFFF" />
        </g>
      ))}
    </g>
  );
}

function Cidade() {
  const B: [number, number, number, string][] = [[-44, 16, 34, '#C9D6F2'], [-28, 18, 50, '#FFD3A3'], [-8, 16, 40, '#E8A0A0'], [10, 20, 60, '#9FB4E8'], [32, 16, 38, '#D8C3F0']];
  return (
    <g>
      {B.map(([bx, w, h, c], i) => (
        <g key={i}>
          <rect x={bx} y={-h} width={w} height={h + 4} rx="2" fill={c} />
          {Array.from({ length: Math.floor(h / 10) }, (_, r) => (
            <g key={r} fill="#FFFFFF" opacity="0.85">
              <rect x={bx + 3} y={-h + 5 + r * 10} width="4" height="5" rx="1" />
              <rect x={bx + w - 7} y={-h + 5 + r * 10} width="4" height="5" rx="1" />
            </g>
          ))}
        </g>
      ))}
      <path d="M20 -60 V-72" stroke="#8A90A0" strokeWidth="1.6" />
      <circle cx="20" cy="-73" r="2" fill="#F26D6D" />
      <rect x="-50" y="6" width="100" height="6" rx="3" fill="#8A90A0" />
      <path d="M-44 9 H-34 M-24 9 H-14 M-4 9 H6 M16 9 H26 M36 9 H46" stroke="#FFFFFF" strokeWidth="1.4" />
    </g>
  );
}

function Montanhas() {
  return (
    <g>
      <path d="M-50 6 L-22 -46 L0 -14 L18 -62 L50 6 Z" fill="#8FA3C8" />
      <path d="M-22 -46 L-14 -32 L-18 -30 L-22 -36 L-27 -30 L-30 -32 Z M18 -62 L28 -42 L22 -40 L18 -46 L13 -40 L8 -42 Z" fill="#FFFFFF" />
      <path d="M18 -62 V-76" stroke="#8A6A4F" strokeWidth="1.4" />
      <path d="M18 -76 h10 l-3 3 l3 3 h-10" fill="#F26D6D" />
      <Pine x={-40} y={10} s={0.7} />
      <Pine x={-30} y={14} s={0.6} c="#3B8C58" />
      <Pine x={40} y={12} s={0.7} />
      {/* trilha */}
      <path d="M-8 14 Q4 2 -2 -8 Q-8 -16 4 -26" stroke="#E8DCC6" strokeWidth="2.4" fill="none" strokeDasharray="3 3" />
    </g>
  );
}

function VilaInverno() {
  return (
    <g>
      {[[-30, 0, '#B85B4A'], [6, -6, '#7A5848'], [34, 4, '#B85B4A']].map(([hx, hy, c], i) => (
        <g key={i} transform={`translate(${hx} ${hy})`}>
          <rect x="-12" y="-14" width="24" height="16" fill={c as string} />
          <path d="M-16 -13 L0 -27 L16 -13 Z" fill="#FFFFFF" />
          <rect x="-4" y="-8" width="8" height="8" rx="1.5" fill="#FFD36B" />
        </g>
      ))}
      <Pine x={-46} y={10} s={0.75} c="#2F6E5A" snow />
      <Pine x={50} y={-6} s={0.7} c="#2F6E5A" snow />
      {/* boneco de neve */}
      <g transform="translate(-6 16)">
        <circle cx="0" cy="-4" r="6" fill="#FFFFFF" />
        <circle cx="0" cy="-13" r="4.4" fill="#FFFFFF" />
        <path d="M0 -12.6 l4 1" stroke="#FF9F4D" strokeWidth="1.6" />
        <rect x="-4" y="-20" width="8" height="3" fill="#3A3F4A" />
      </g>
      {/* varal de luzinhas */}
      <path d="M-30 -14 Q-12 -6 6 -20 Q20 -8 34 -10" stroke="#6E655D" strokeWidth="0.8" fill="none" />
      {[-24, -16, -6, 12, 22, 30].map((lx, i) => <circle key={lx} className="twinkle" style={{ animationDelay: `${i * 0.3}s` }} cx={lx} cy={-12 + (i % 2) * 2} r="1.6" fill={['#FFD34D', '#FF6F91', '#7FB8F0'][i % 3]} />)}
    </g>
  );
}

function Castelo() {
  return (
    <g>
      <rect x="-30" y="-36" width="60" height="40" fill="#F4E4FF" />
      {[-34, 22].map((tx) => (
        <g key={tx}>
          <rect x={tx} y="-52" width="12" height="56" fill="#E9D3FF" />
          <path d={`M${tx - 2} -52 L${tx + 6} -66 L${tx + 14} -52 Z`} fill="#B48CFF" />
          <path d={`M${tx + 6} -66 V-74`} stroke="#8A6A4F" strokeWidth="1" />
          <path d={`M${tx + 6} -74 h8 l-2 2 l2 2 h-8`} fill="#FF7FA0" className="flag-wave" />
        </g>
      ))}
      <rect x="-8" y="-58" width="16" height="22" fill="#E9D3FF" />
      <path d="M-11 -58 L0 -74 L11 -58 Z" fill="#FF9FC2" />
      {[-26, -16, 8, 18].map((wx) => <rect key={wx} x={wx} y="-28" width="6" height="8" rx="3" fill="#BFE8FF" />)}
      <path d="M-8 4 V-12 Q-8 -20 0 -20 Q8 -20 8 -12 V4 Z" fill="#8A5A3B" />
      {/* jardim do castelo */}
      <circle cx="-44" cy="0" r="8" fill="#5FB86A" />
      <circle cx="44" cy="0" r="8" fill="#5FB86A" />
      <Flowers x={0} y={14} n={6} w={50} />
    </g>
  );
}

function Espaco() {
  return (
    <g>
      {/* planeta com anel */}
      <g transform="translate(-30 -20)">
        <circle r="16" fill="#FFB066" />
        <path d="M-12 -4 Q0 2 12 -6" stroke="#FF8A3D" strokeWidth="3" fill="none" opacity="0.6" />
        <ellipse rx="27" ry="7" fill="none" stroke="#B48CFF" strokeWidth="3" transform="rotate(-18)" />
      </g>
      {/* foguete */}
      <g transform="translate(26 4)">
        <path d="M0 -50 Q12 -36 10 -8 H-10 Q-12 -36 0 -50 Z" fill="#FFFFFF" />
        <circle cx="0" cy="-30" r="5" fill="#7FC4F5" stroke="#B8C0CC" strokeWidth="2" />
        <path d="M-10 -16 L-18 -2 L-10 -6 Z M10 -16 L18 -2 L10 -6 Z" fill="#F26D6D" />
        <path d="M-6 -8 Q0 6 6 -8 Z" fill="#FFB347" className="twinkle" />
      </g>
      {[[-8, -40], [40, -44], [-46, 4], [10, 12]].map(([sx, sy], i) => (
        <path key={i} className="twinkle" style={{ animationDelay: `${i * 0.4}s` }} d={`M${sx} ${sy - 4} Q${sx + 1} ${sy - 1} ${sx + 4} ${sy} Q${sx + 1} ${sy + 1} ${sx} ${sy + 4} Q${sx - 1} ${sy + 1} ${sx - 4} ${sy} Q${sx - 1} ${sy - 1} ${sx} ${sy - 4} Z`} fill="#FFF3B0" />
      ))}
    </g>
  );
}

const LOOK: Record<string, { rx: number; ry: number; top: string; side: string; draw: () => ReactNode }> = {
  casa: { rx: 58, ry: 26, top: '#7CCB6A', side: '#8A5A3B', draw: Casa },
  jardim: { rx: 70, ry: 30, top: '#9EDB86', side: '#7A5236', draw: Jardim },
  parque: { rx: 70, ry: 30, top: '#86C977', side: '#6E4A30', draw: Parque },
  praia: { rx: 72, ry: 30, top: '#FFE2A3', side: '#E3B56E', draw: Praia },
  floresta: { rx: 70, ry: 30, top: '#5DAE6B', side: '#4A3324', draw: Floresta },
  cafeteria: { rx: 70, ry: 30, top: '#D9C6A6', side: '#9C7B57', draw: Cafeteria },
  montanhas: { rx: 70, ry: 30, top: '#B9CBA0', side: '#7E6A55', draw: Montanhas },
  cidade: { rx: 70, ry: 30, top: '#C9C2D8', side: '#7F7896', draw: Cidade },
  castelo: { rx: 70, ry: 30, top: '#C9B5F0', side: '#8C72C9', draw: Castelo },
  'vila-inverno': { rx: 72, ry: 30, top: '#F2F7FF', side: '#9CC3E8', draw: VilaInverno },
  espaco: { rx: 66, ry: 28, top: '#3B3F7E', side: '#22264F', draw: Espaco },
};

/** O mapa inteiro. `locked` deixa a ilha acinzentada. */
export function TripMapArt({ locked }: { locked: Record<string, boolean> }) {
  const trail = Object.keys(ISLAND_AT)
    .map((id) => ISLAND_AT[id])
    .sort((a, b) => b[1] - a[1]);
  return (
    <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="trip-art" aria-hidden="true">
      <defs>
        <linearGradient id="trip-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2C2F6E" />
          <stop offset="0.16" stopColor="#7C8FD8" />
          <stop offset="0.24" stopColor="#B9E3C8" />
          <stop offset="1" stopColor="#A6D695" />
        </linearGradient>
      </defs>
      <rect width={MAP_W} height={MAP_H} fill="url(#trip-sky)" />
      {/* campos de outra cor, como num mapa de verdade */}
      <path d="M0 250 Q80 220 160 260 Q240 300 400 250 V430 Q300 470 200 430 Q100 390 0 440 Z" fill="#B4DE9F" opacity="0.7" />
      <path d="M0 520 Q120 480 220 520 Q320 560 400 520 V780 H0 Z" fill="#9CCF8A" opacity="0.6" />
      {/* rio com lagos */}
      <path d="M210 130 C240 200 160 230 200 300 C240 370 170 400 196 470 C220 540 170 600 210 660 C236 700 200 740 220 780" stroke="#7FC4EC" strokeWidth="26" fill="none" strokeLinecap="round" />
      <path d="M210 130 C240 200 160 230 200 300 C240 370 170 400 196 470 C220 540 170 600 210 660 C236 700 200 740 220 780" stroke="#A9DCF5" strokeWidth="12" fill="none" strokeLinecap="round" />
      <ellipse cx="196" cy="390" rx="36" ry="16" fill="#7FC4EC" />
      <ellipse cx="196" cy="388" rx="22" ry="8" fill="#BFE8FF" opacity="0.8" />
      <ellipse cx="350" cy="630" rx="40" ry="16" fill="#7FC4EC" />
      {/* pontes */}
      {[[208, 520], [204, 250]].map(([bx, by], i) => (
        <g key={i} transform={`translate(${bx} ${by}) rotate(-8)`}>
          <rect x="-22" y="-6" width="44" height="12" rx="3" fill="#C98A5B" />
          {[-16, -8, 0, 8, 16].map((px) => <path key={px} d={`M${px} -6 V6`} stroke="#A8703F" strokeWidth="1.4" />)}
        </g>
      ))}
      {/* trilha pontilhada ligando os lugares */}
      <path d={`M${trail.map(([x, y]) => `${x} ${y}`).join(' L')}`} stroke="#FFF6E0" strokeWidth="4" fill="none" strokeDasharray="2 9" strokeLinecap="round" opacity="0.9" />
      {/* estrelas no alto (perto do espaço) */}
      {[[30, 30], [90, 60], [150, 20], [260, 40], [330, 24], [370, 80], [60, 110], [340, 130]].map(([sx, sy], i) => (
        <circle key={i} className="twinkle" style={{ animationDelay: `${i * 0.35}s` }} cx={sx} cy={sy} r={i % 3 ? 1.4 : 2} fill="#FFFFFF" />
      ))}
      {/* enfeites: árvores soltas, pedras, flores */}
      {[[30, 360], [372, 410], [24, 640], [380, 760], [170, 600], [240, 720], [372, 270], [20, 520]].map(([tx, ty], i) => (i % 2 ? <Tree key={i} x={tx} y={ty} s={0.7} c="#5FB86A" /> : <Pine key={i} x={tx} y={ty} s={0.7} c="#3B8C58" />))}
      {[[150, 760], [330, 470], [60, 270]].map(([fx, fy], i) => <Flowers key={i} x={fx} y={fy} n={4} w={22} />)}
      {Object.entries(LOOK).map(([id, l]) => {
        const [x, y] = ISLAND_AT[id];
        return (
          <g key={id} className={locked[id] ? 'trip-locked' : undefined}>
            <Island x={x} y={y} rx={l.rx} ry={l.ry} top={l.top} side={l.side}>
              {l.draw()}
            </Island>
          </g>
        );
      })}
      <Cloud x={340} y={360} s={0.9} cls="cloud cloud-1" />
      <Cloud x={60} y={520} s={0.7} cls="cloud cloud-2" />
      <Balloon x={350} y={250} a="#FF9FC2" b="#FFFFFF" cls="float-bob" />
      <Balloon x={40} y={620} a="#B48CFF" b="#FFFFFF" cls="float-bob" />
    </svg>
  );
}
