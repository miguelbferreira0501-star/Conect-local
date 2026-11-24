// Peças do quintal largo (Outdoors): árvores de vários tipos, horta, moinho, ponte, lago, balanço…
// Tudo plano, sem contorno, com luz em cima, no mesmo estilo dos móveis e da casa.
import type { ReactNode } from 'react';

export type YardPal = {
  sky: [string, string];
  far: string;
  hill1: string;
  hill2: string;
  ground: string;
  meadow: string;
  path: string;
  leaf: string;
  leaf2: string;
  leafHi: string;
  pine: string;
  trunk: string;
  water: string;
  sun: string;
  dim: number;
};

const G = ({ x, y, s = 1, children, cls, style }: { x: number; y: number; s?: number; children: ReactNode; cls?: string; style?: React.CSSProperties }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <g className={cls} style={style}>
      {children}
    </g>
  </g>
);

const shadow = (rx: number, ry = rx * 0.2) => <ellipse cx="0" cy="2" rx={rx} ry={ry} fill="#000" opacity="0.1" />;

/** Árvore redonda (copa de bolas), com frutinhas opcionais. */
export function RoundTree({ x, y, s = 1, p, fruit, sway = true }: { x: number; y: number; s?: number; p: YardPal; fruit?: string; sway?: boolean }) {
  return (
    <G x={x} y={y} s={s} cls={sway ? 'od-sway' : undefined}>
      {shadow(34)}
      <path d="M-7 0 L-5 -44 Q0 -48 5 -44 L7 0Z" fill={p.trunk} />
      <path d="M-2 -30 L-16 -46 M2 -36 L14 -50" stroke={p.trunk} strokeWidth="4" strokeLinecap="round" />
      <circle cx="-24" cy="-56" r="26" fill={p.leaf2} />
      <circle cx="24" cy="-58" r="26" fill={p.leaf2} />
      <circle cx="0" cy="-80" r="32" fill={p.leaf} />
      <circle cx="-16" cy="-62" r="24" fill={p.leaf} />
      <circle cx="18" cy="-64" r="24" fill={p.leaf} />
      <circle cx="-10" cy="-92" r="12" fill={p.leafHi} opacity="0.8" />
      <circle cx="14" cy="-84" r="6" fill={p.leafHi} opacity="0.6" />
      {fruit &&
        [
          [-22, -58],
          [8, -70],
          [24, -54],
          [-6, -50],
          [-14, -80],
          [16, -90],
        ].map(([fx, fy], i) => <circle key={i} cx={fx} cy={fy} r="4.2" fill={fruit} />)}
    </G>
  );
}

/** Pinheiro de três andares. */
export function Pine({ x, y, s = 1, p, snow }: { x: number; y: number; s?: number; p: YardPal; snow?: boolean }) {
  return (
    <G x={x} y={y} s={s}>
      {shadow(26)}
      <rect x="-4" y="-14" width="8" height="16" rx="2" fill={p.trunk} />
      <path d="M0 -100 L28 -52 H-28Z" fill={p.pine} />
      <path d="M0 -78 L34 -30 H-34Z" fill={p.pine} />
      <path d="M0 -58 L40 -10 H-40Z" fill={p.pine} />
      <path d="M0 -100 L10 -82 L-4 -74Z M0 -78 L12 -60 L-4 -54Z M0 -58 L14 -40 L-4 -34Z" fill="#FFFFFF" opacity="0.12" />
      {snow && <path d="M0 -100 L9 -85 Q0 -80 -9 -85Z" fill="#FFFFFF" />}
    </G>
  );
}

/** Bétula: tronco branquinho com manchas e copa alta. */
export function Birch({ x, y, s = 1, p }: { x: number; y: number; s?: number; p: YardPal }) {
  return (
    <G x={x} y={y} s={s} cls="od-sway">
      {shadow(22)}
      <rect x="-5" y="-70" width="10" height="72" rx="4" fill="#F4F1EA" />
      {[-60, -44, -28, -14].map((yy, i) => (
        <rect key={yy} x={i % 2 ? -5 : 0} y={yy} width="5" height="3" rx="1.5" fill="#5E5250" />
      ))}
      <ellipse cx="0" cy="-96" rx="26" ry="36" fill={p.leaf2} />
      <ellipse cx="-6" cy="-104" rx="18" ry="24" fill={p.leaf} />
      <ellipse cx="-10" cy="-116" rx="7" ry="9" fill={p.leafHi} opacity="0.7" />
    </G>
  );
}

/** Salgueiro chorão (perto da água). */
export function Willow({ x, y, s = 1, p }: { x: number; y: number; s?: number; p: YardPal }) {
  return (
    <G x={x} y={y} s={s} cls="od-sway">
      {shadow(40)}
      <path d="M-8 0 Q-4 -40 -2 -70 L4 -70 Q6 -40 10 0Z" fill={p.trunk} />
      <ellipse cx="0" cy="-86" rx="46" ry="30" fill={p.leaf2} />
      {[-40, -26, -12, 2, 16, 30, 42].map((dx, i) => (
        <path key={dx} d={`M${dx} -80 Q${dx + (i % 2 ? 4 : -4)} -40 ${dx + (i % 2 ? 2 : -2)} ${-12 - (i % 3) * 6}`} stroke={i % 2 ? p.leaf : p.leaf2} strokeWidth="9" strokeLinecap="round" fill="none" />
      ))}
      <ellipse cx="-10" cy="-98" rx="22" ry="12" fill={p.leafHi} opacity="0.5" />
    </G>
  );
}

/** Moita com frutinhas. */
export function Bush({ x, y, s = 1, p, berry }: { x: number; y: number; s?: number; p: YardPal; berry?: string }) {
  return (
    <G x={x} y={y} s={s}>
      {shadow(30, 5)}
      <circle cx="-18" cy="-12" r="16" fill={p.leaf2} />
      <circle cx="16" cy="-12" r="16" fill={p.leaf2} />
      <circle cx="0" cy="-22" r="20" fill={p.leaf} />
      <circle cx="-8" cy="-30" r="6" fill={p.leafHi} opacity="0.8" />
      {berry &&
        [
          [-16, -14],
          [10, -22],
          [18, -10],
          [-2, -12],
        ].map(([bx, by], i) => <circle key={i} cx={bx} cy={by} r="3" fill={berry} />)}
    </G>
  );
}

/** Florzinha de cinco pétalas. */
export function Flower({ x, y, c, s = 1 }: { x: number; y: number; c: string; s?: number }) {
  return (
    <G x={x} y={y} s={s}>
      <path d="M0 0 V10" stroke="#3E9E58" strokeWidth="2" strokeLinecap="round" />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy="-4.5" rx="3.4" ry="4.6" fill={c} transform={`rotate(${a})`} />
      ))}
      <circle r="2.6" fill="#FFD34D" />
    </G>
  );
}

export function Tulip({ x, y, c, s = 1 }: { x: number; y: number; c: string; s?: number }) {
  return (
    <G x={x} y={y} s={s}>
      <path d="M0 0 V-16" stroke="#3E9E58" strokeWidth="2.2" />
      <path d="M0 -6 q-7 -2 -8 -10 q6 2 8 8" fill="#4FB063" />
      <path d="M-6 -24 L-6 -16 Q0 -10 6 -16 L6 -24 L3 -20 L0 -25 L-3 -20 Z" fill={c} />
    </G>
  );
}

export function Sunflower({ x, y, s = 1, h = 60 }: { x: number; y: number; s?: number; h?: number }) {
  return (
    <G x={x} y={y} s={s} cls="od-sway">
      <path d={`M0 0 V${-h}`} stroke="#4E9A4A" strokeWidth="4" />
      <path d={`M0 ${-h * 0.4} q-14 -4 -18 -14 q12 0 18 10 M0 ${-h * 0.6} q14 -4 18 -14 q-12 0 -18 10`} fill="#5FAE5A" />
      {Array.from({ length: 12 }, (_, i) => (
        <ellipse key={i} cx="0" cy={-h - 12} rx="4.5" ry="9" fill="#FFD25A" transform={`rotate(${i * 30} 0 ${-h})`} />
      ))}
      <circle cx="0" cy={-h} r="8" fill="#7A4E32" />
      <circle cx="-2" cy={-h - 2} r="2" fill="#9A6A48" />
    </G>
  );
}

export function Rock({ x, y, s = 1, c = '#B8B2AE' }: { x: number; y: number; s?: number; c?: string }) {
  return (
    <G x={x} y={y} s={s}>
      <path d="M-18 0 Q-20 -12 -8 -16 Q4 -22 14 -12 Q20 -4 18 0Z" fill={c} />
      <path d="M-8 -14 Q2 -18 8 -12" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="3" fill="none" strokeLinecap="round" />
    </G>
  );
}

export function Grass({ x, y, c, s = 1 }: { x: number; y: number; c: string; s?: number }) {
  return <path transform={`translate(${x} ${y}) scale(${s})`} d="M-8 0 q2 -12 4 0 q2 -16 4 0 q2 -11 4 0 q2 -14 4 0" fill={c} />;
}

export function Mushroom({ x, y, s = 1, c = '#FF6F6F' }: { x: number; y: number; s?: number; c?: string }) {
  return (
    <G x={x} y={y} s={s}>
      <rect x="-4" y="-12" width="8" height="12" rx="3" fill="#FFF4E2" />
      <path d="M-13 -11 Q0 -28 13 -11Z" fill={c} />
      <circle cx="-4" cy="-17" r="2" fill="#FFFFFF" />
      <circle cx="5" cy="-14" r="1.6" fill="#FFFFFF" />
    </G>
  );
}

/** Moinho de vento com as pás girando. */
export function Windmill({ x, y, s = 1, night }: { x: number; y: number; s?: number; night: boolean }) {
  return (
    <G x={x} y={y} s={s}>
      <path d="M-18 0 L-12 -70 H12 L18 0Z" fill={night ? '#B9B3CF' : '#FFF4E2'} />
      <path d="M-16 -66 Q0 -92 16 -66Z" fill={night ? '#9E5A64' : '#E46F5F'} />
      <rect x="-6" y="-22" width="12" height="22" rx="6" fill={night ? '#6E5A52' : '#B07A52'} />
      <rect x="-5" y="-50" width="10" height="10" rx="3" fill={night ? '#FFE9A8' : '#9FD6FF'} />
      <g transform="translate(0 -72)">
        <g className="od-mill">
          {[0, 90, 180, 270].map((a) => (
            <g key={a} transform={`rotate(${a})`}>
              <rect x="-2" y="-46" width="4" height="46" fill="#8B6A50" />
              <rect x="2" y="-44" width="12" height="34" rx="2" fill={night ? '#D6D0E6' : '#FFFFFF'} />
            </g>
          ))}
          <circle r="5" fill="#8B6A50" />
        </g>
      </g>
    </G>
  );
}

/** Cerquinha de madeira branca. */
export function Fence({ x, y, n, night, gap = 16 }: { x: number; y: number; n: number; night: boolean; gap?: number }) {
  const c = night ? '#A9A6C2' : '#FFFFFF';
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M-4 -12 H${(n - 1) * gap + 4} M-4 -4 H${(n - 1) * gap + 4}`} stroke={c} strokeWidth="4" strokeLinecap="round" />
      {Array.from({ length: n }, (_, i) => (
        <path key={i} d={`M${i * gap - 3} 2 V-20 L${i * gap} -24 L${i * gap + 3} -20 V2Z`} fill={c} />
      ))}
    </g>
  );
}

/** Poste de luz (acende de noite). */
export function Lamp({ x, y, night }: { x: number; y: number; night: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {night && <circle cx="0" cy="-62" r="26" fill="#FFE9A8" opacity="0.28" />}
      <rect x="-2.5" y="-58" width="5" height="58" rx="2" fill="#4E4A63" />
      <rect x="-8" y="-72" width="16" height="16" rx="4" fill={night ? '#FFE27A' : '#FFF6D6'} />
      <path d="M-10 -72 L0 -80 L10 -72Z" fill="#4E4A63" />
      <rect x="-6" y="-2" width="12" height="4" rx="2" fill="#4E4A63" />
    </g>
  );
}

export function Mailbox({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-2" y="-30" width="4" height="30" fill="#8B5A35" />
      <rect x="-12" y="-44" width="24" height="16" rx="8" fill="#5B8DEF" />
      <rect x="10" y="-50" width="3" height="12" fill="#E2547A" />
      <rect x="10" y="-50" width="8" height="5" fill="#E2547A" />
    </g>
  );
}

export function Bench({ x, y, night }: { x: number; y: number; night: boolean }) {
  const w = night ? '#8A6A58' : '#C98A5B';
  return (
    <g transform={`translate(${x} ${y})`}>
      {shadow(30, 4)}
      <rect x="-30" y="-28" width="60" height="7" rx="3" fill={w} />
      <rect x="-30" y="-18" width="60" height="7" rx="3" fill={w} />
      <rect x="-30" y="-8" width="60" height="6" rx="3" fill={w} />
      <rect x="-26" y="-6" width="5" height="8" fill="#4E4A63" />
      <rect x="21" y="-6" width="5" height="8" fill="#4E4A63" />
    </g>
  );
}

/** Horta: canteiros com cenouras, alfaces e abóboras, e um espantalho fofo. */
export function Garden({ x, y, p, night }: { x: number; y: number; p: YardPal; night: boolean }) {
  const soil = night ? '#5A4A50' : '#A8714F';
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 1, 2].map((r) => (
        <g key={r} transform={`translate(${r * 8} ${r * 20})`}>
          <rect x="0" y="0" width="150" height="14" rx="7" fill={soil} />
          {Array.from({ length: 7 }, (_, i) => {
            const cx = 12 + i * 21;
            return r === 0 ? (
              <g key={i}>
                <path d={`M${cx} 4 q-5 -10 -2 -14 M${cx} 4 q0 -12 2 -15 M${cx} 4 q5 -10 3 -13`} stroke="#4FB063" strokeWidth="2.6" fill="none" strokeLinecap="round" />
                <path d={`M${cx - 3} 5 L${cx} 12 L${cx + 3} 5Z`} fill="#FF8A3D" />
              </g>
            ) : r === 1 ? (
              <g key={i}>
                <circle cx={cx} cy="2" r="7" fill={p.leafHi} />
                <circle cx={cx - 3} cy="0" r="4" fill={p.leaf} />
              </g>
            ) : i % 2 ? (
              <g key={i}>
                <ellipse cx={cx} cy="2" rx="8" ry="6" fill="#FF9A3D" />
                <path d={`M${cx} -4 q2 -4 5 -4`} stroke="#4E9A4A" strokeWidth="2" fill="none" />
              </g>
            ) : (
              <path key={i} d={`M${cx - 6} 4 q6 -12 12 0`} fill={p.leaf2} />
            );
          })}
        </g>
      ))}
      {/* espantalho */}
      <g transform="translate(176 52)" className="od-sway">
        <rect x="-2" y="-70" width="4" height="70" fill="#8B5A35" />
        <rect x="-26" y="-56" width="52" height="4" fill="#8B5A35" />
        <path d="M-14 -58 H14 L16 -30 H-16Z" fill="#7FB8F0" />
        <path d="M-14 -58 H14 L14 -50 H-14Z" fill="#5B8DEF" />
        <circle cx="0" cy="-70" r="11" fill="#F7E3B5" />
        <circle cx="-4" cy="-71" r="1.6" fill="#3B2A2A" />
        <circle cx="4" cy="-71" r="1.6" fill="#3B2A2A" />
        <path d="M-3 -66 q3 2 6 0" stroke="#3B2A2A" strokeWidth="1.4" fill="none" />
        <path d="M-16 -78 H16 L10 -88 H-10Z" fill="#E3B65C" />
        <rect x="-18" y="-80" width="36" height="4" rx="2" fill="#D1495B" />
        <path d="M-28 -54 l-4 6 M28 -54 l4 6" stroke="#E3B65C" strokeWidth="3" strokeLinecap="round" />
      </g>
    </g>
  );
}

/** Toalha de piquenique com cesta. */
export function Picnic({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-50 0 L-30 -24 H44 L58 0Z" fill="#FF8A8A" />
      {[-34, -14, 6, 26, 46].map((xx) => (
        <path key={xx} d={`M${xx} 0 L${xx + 8} -24`} stroke="#FFFFFF" strokeWidth="5" opacity="0.85" />
      ))}
      <path d="M-44 -8 H54 M-38 -16 H50" stroke="#FFFFFF" strokeWidth="4" opacity="0.85" />
      <g transform="translate(10 -22)">
        <path d="M-14 0 H14 L11 14 H-11Z" fill="#C98A5B" />
        <path d="M-10 0 Q0 -16 10 0" stroke="#A9713F" strokeWidth="3" fill="none" />
        <path d="M-14 4 H14" stroke="#A9713F" strokeWidth="2" />
        <circle cx="-6" cy="-1" r="4" fill="#E2547A" />
        <circle cx="2" cy="-2" r="3.6" fill="#FFD34D" />
      </g>
    </g>
  );
}

/** Árvore grande com balanço de corda. */
export function SwingTree({ x, y, s = 1, p }: { x: number; y: number; s?: number; p: YardPal }) {
  return (
    <G x={x} y={y} s={s}>
      {shadow(50)}
      <path d="M-10 0 Q-6 -60 -4 -96 L8 -96 Q10 -60 14 0Z" fill={p.trunk} />
      <path d="M2 -88 Q30 -100 58 -96" stroke={p.trunk} strokeWidth="9" strokeLinecap="round" fill="none" />
      <g className="od-swing" style={{ transformOrigin: '46px -96px' }}>
        <path d="M38 -96 V-26 M56 -96 V-26" stroke="#C9A27A" strokeWidth="2.4" />
        <rect x="32" y="-28" width="30" height="7" rx="3" fill="#E46F5F" />
      </g>
      <circle cx="-30" cy="-110" r="34" fill={p.leaf2} />
      <circle cx="34" cy="-114" r="36" fill={p.leaf2} />
      <circle cx="0" cy="-140" r="42" fill={p.leaf} />
      <circle cx="-22" cy="-118" r="30" fill={p.leaf} />
      <circle cx="26" cy="-122" r="30" fill={p.leaf} />
      <circle cx="-14" cy="-154" r="14" fill={p.leafHi} opacity="0.8" />
    </G>
  );
}

/** Colmeia pendurada com abelhinhas. */
export function Hive({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 -14 V-4" stroke="#8B5A35" strokeWidth="2" />
      <ellipse cx="0" cy="8" rx="11" ry="13" fill="#F2B84B" />
      <path d="M-10 2 H10 M-11 9 H11 M-9 16 H9" stroke="#D9962A" strokeWidth="2.4" />
      <circle cx="0" cy="18" r="2.4" fill="#7A4E32" />
      <g className="od-bee">
        <ellipse cx="20" cy="4" rx="4" ry="3" fill="#FFD34D" />
        <path d="M19 2 V6 M21 2 V6" stroke="#3B2A2A" strokeWidth="1.2" />
        <ellipse cx="19" cy="0.5" rx="2.4" ry="1.6" fill="#FFFFFF" opacity="0.8" />
      </g>
    </g>
  );
}

/** Patinho nadando. */
export function Duck({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G x={x} y={y} s={s} cls="od-bob">
      <ellipse cx="0" cy="0" rx="10" ry="6" fill="#FFFFFF" />
      <circle cx="7" cy="-7" r="5" fill="#FFFFFF" />
      <path d="M11 -7 l5 1.4 l-5 1.6Z" fill="#FF9D3C" />
      <circle cx="8.4" cy="-8" r="1" fill="#2B2224" />
      <path d="M-8 -2 q-4 -3 -4 2" stroke="#E3E3EA" strokeWidth="2" fill="none" />
    </G>
  );
}
