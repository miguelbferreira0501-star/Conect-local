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

// ---------------- Quintal de neve ----------------

/** Montinho de neve (com frutinhas de azevinho opcionais). */
export function SnowMound({ x, y, s = 1, holly }: { x: number; y: number; s?: number; holly?: boolean }) {
  return (
    <G x={x} y={y} s={s}>
      <path d="M-30 0 Q-28 -16 -12 -18 Q-2 -30 12 -20 Q28 -18 30 0Z" fill="#FFFFFF" />
      <path d="M-14 -16 Q-4 -24 8 -18" stroke="#DDE8F6" strokeWidth="3" fill="none" strokeLinecap="round" />
      {holly && (
        <g transform="translate(6 -20)">
          <path d="M-8 0 q4 -6 8 0 q-4 4 -8 0Z M0 0 q4 -6 8 0 q-4 4 -8 0Z" fill="#3E8F5A" />
          <circle cx="0" cy="-1" r="2.4" fill="#E2453C" />
          <circle cx="3" cy="1" r="2.2" fill="#E2453C" />
        </g>
      )}
    </G>
  );
}

export function Snowman({ x, y, s = 1, scarf = '#E85A5A', hat = '#3E5B9A' }: { x: number; y: number; s?: number; scarf?: string; hat?: string }) {
  return (
    <G x={x} y={y} s={s}>
      {shadow(26, 5)}
      <path d="M-18 -40 L-36 -54 M18 -40 L36 -56" stroke="#8B5A35" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="0" cy="-20" r="22" fill="#FFFFFF" />
      <circle cx="0" cy="-54" r="16" fill="#FFFFFF" />
      <circle cx="0" cy="-26" r="2.6" fill={hat} />
      <circle cx="0" cy="-16" r="2.6" fill={hat} />
      <circle cx="-5" cy="-57" r="2" fill="#3B2A2A" />
      <circle cx="5" cy="-57" r="2" fill="#3B2A2A" />
      <path d="M0 -53 L12 -50 L0 -49Z" fill="#FF8A3D" />
      <path d="M-5 -47 q5 3 10 0" stroke="#3B2A2A" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <rect x="-16" y="-42" width="32" height="7" rx="3.5" fill={scarf} />
      <path d="M8 -38 l4 14 l-6 0 l-3 -12Z" fill={scarf} />
      <path d="M-14 -66 H14 L10 -82 H-10Z" fill={hat} />
      <rect x="-17" y="-68" width="34" height="5" rx="2.5" fill={hat} />
    </G>
  );
}

export function Sled({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G x={x} y={y} s={s}>
      <path d="M-30 0 H26 Q36 0 36 -10" stroke="#8B5A35" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <rect x="-28" y="-14" width="52" height="9" rx="3" fill="#E2453C" />
      <path d="M-20 -5 V0 M14 -5 V0" stroke="#8B5A35" strokeWidth="3" />
      <rect x="-20" y="-28" width="16" height="14" rx="2" fill="#7FB8F0" />
      <path d="M-12 -28 V-14 M-20 -21 H-4" stroke="#FFE27A" strokeWidth="2.4" />
      <rect x="0" y="-24" width="14" height="10" rx="2" fill="#FF9FC2" />
      <path d="M7 -24 V-14" stroke="#FFFFFF" strokeWidth="2.2" />
    </G>
  );
}

export function Penguin({ x, y, s = 1, flip }: { x: number; y: number; s?: number; flip?: boolean }) {
  return (
    <G x={x} y={y} s={s} cls="od-bob">
      <g transform={flip ? 'scale(-1 1)' : undefined}>
        <ellipse cx="0" cy="-12" rx="10" ry="13" fill="#2F3E66" />
        <ellipse cx="1" cy="-10" rx="6.5" ry="9" fill="#FFFFFF" />
        <circle cx="2" cy="-18" r="1.4" fill="#2B2224" />
        <path d="M5 -16 l5 1.2 l-5 1.4Z" fill="#FF9D3C" />
        <ellipse cx="-3" cy="1" rx="4" ry="1.8" fill="#FF9D3C" />
        <ellipse cx="4" cy="1" rx="4" ry="1.8" fill="#FF9D3C" />
      </g>
    </G>
  );
}

// ---------------- Quintal de praia ----------------

export function Palm({ x, y, s = 1, p, flip }: { x: number; y: number; s?: number; p: YardPal; flip?: boolean }) {
  return (
    <G x={x} y={y} s={s} cls="od-sway">
      {shadow(30, 5)}
      <g transform={flip ? 'scale(-1 1)' : undefined}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M${-6 + i * 2.4} ${-i * 22} l14 -1 l-1 -22 l-13 1Z`} fill={i % 2 ? p.trunk : mixDark(p.trunk)} />
        ))}
        {[-165, -20, -125, -55, 172, 8].map((a, i) => (
          <g key={i} transform={`translate(12 -132) rotate(${a})`}>
            <path d="M0 0 C18 -12 46 -10 62 0 C46 10 18 12 0 0Z" fill={i % 2 ? p.leaf : p.leaf2} />
            <path d="M6 0 H54" stroke={p.leafHi} strokeWidth="1.6" opacity="0.6" />
          </g>
        ))}
        <circle cx="6" cy="-126" r="6" fill="#8B5A35" />
        <circle cx="16" cy="-124" r="6" fill="#7A4D2C" />
        <circle cx="11" cy="-118" r="5.4" fill="#8B5A35" />
      </g>
    </G>
  );
}
const mixDark = (c: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(c);
  if (!m) return c;
  const n = parseInt(m[1], 16);
  const ch = (v: number) => Math.round(v * 0.86).toString(16).padStart(2, '0');
  return `#${ch(n >> 16)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
};

export function Umbrella({ x, y, s = 1, c = '#FF8A7A', c2 = '#FFFFFF' }: { x: number; y: number; s?: number; c?: string; c2?: string }) {
  return (
    <G x={x} y={y} s={s}>
      {shadow(36, 5)}
      <rect x="-2" y="-78" width="4" height="78" rx="2" fill="#E9E2D6" />
      <path d="M-46 -66 C-42 -96 -14 -110 0 -110 C14 -110 42 -96 46 -66 Z" fill={c} />
      <path d="M0 -110 C-8 -100 -14 -84 -16 -66 L-30 -66 C-28 -86 -16 -102 0 -110 Z M0 -110 C8 -100 14 -84 16 -66 L30 -66 C28 -86 16 -102 0 -110 Z" fill={c2} />
      <path d="M-46 -66 q8 7 15 0 q8 7 15 0 q8 7 16 0 q8 7 15 0 q8 7 15 0 q8 7 15 0" fill={mixDark(c)} />
    </G>
  );
}

export function Lounger({ x, y, s = 1, c = '#3CC6C9' }: { x: number; y: number; s?: number; c?: string }) {
  return (
    <G x={x} y={y} s={s}>
      {shadow(40, 4)}
      <path d="M-40 0 L-30 -14 M36 0 L30 -14 M-12 0 L-8 -12" stroke="#C98A5B" strokeWidth="4" strokeLinecap="round" />
      <path d="M-46 -40 L-30 -14 H40 V-22 H-26 L-38 -44 Z" fill="#C98A5B" />
      <path d="M-44 -40 L-30 -17 H38 V-20 H-28 L-40 -42 Z" fill={c} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={-14 + i * 14} y="-21" width="6" height="5" fill="#FFFFFF" />
      ))}
    </G>
  );
}

export function BeachBall({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G x={x} y={y} s={s}>
      {shadow(10, 2)}
      <circle cx="0" cy="-9" r="9" fill="#FFFFFF" />
      <path d="M0 -18 A9 9 0 0 1 9 -9 L0 -9Z" fill="#E2453C" />
      <path d="M0 0 A9 9 0 0 1 -9 -9 L0 -9Z" fill="#3C9CE6" />
      <path d="M-9 -9 A9 9 0 0 1 0 -18 L0 -9Z" fill="#FFD34D" />
      <circle cx="0" cy="-9" r="2" fill="#FFFFFF" />
    </G>
  );
}

export function Shell({ x, y, s = 1, c = '#FFB3CF' }: { x: number; y: number; s?: number; c?: string }) {
  return (
    <G x={x} y={y} s={s}>
      <path d="M-9 0 C-9 -12 9 -12 9 0Z" fill={c} />
      <path d="M-5 -1 L-3 -8 M0 -1 L0 -10 M5 -1 L3 -8" stroke="#FFFFFF" strokeWidth="1.4" />
    </G>
  );
}

export function Starfish({ x, y, s = 1, c = '#FF9A6B' }: { x: number; y: number; s?: number; c?: string }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 ? 4 : 9;
    return `${Math.cos(a) * r} ${Math.sin(a) * r - 6}`;
  });
  return (
    <G x={x} y={y} s={s}>
      <path d={`M${pts.join(' L')} Z`} fill={c} strokeLinejoin="round" />
    </G>
  );
}

export function Crab({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G x={x} y={y} s={s} cls="od-bob">
      <ellipse cx="0" cy="-6" rx="10" ry="6.5" fill="#F0605A" />
      <path d="M-10 -6 l-6 -6 M10 -6 l6 -6 M-8 -2 l-6 3 M8 -2 l6 3" stroke="#F0605A" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="-17" cy="-13" r="3.4" fill="#F0605A" />
      <circle cx="17" cy="-13" r="3.4" fill="#F0605A" />
      <circle cx="-3.4" cy="-12" r="1.6" fill="#2B2224" />
      <circle cx="3.4" cy="-12" r="1.6" fill="#2B2224" />
    </G>
  );
}

export function Lighthouse({ x, y, s = 1, night }: { x: number; y: number; s?: number; night: boolean }) {
  return (
    <G x={x} y={y} s={s}>
      {night && <path d="M0 -84 L-90 -110 L-90 -60Z M0 -84 L90 -110 L90 -60Z" fill="#FFF3B0" opacity="0.18" />}
      <path d="M-14 0 L-9 -74 H9 L14 0Z" fill="#FFFFFF" />
      {[-62, -40, -18].map((yy) => (
        <path key={yy} d={`M${-9 - (yy + 74) * 0.07} ${yy} H${9 + (yy + 74) * 0.07} L${10 + (yy + 84) * 0.07} ${yy + 10} H${-10 - (yy + 84) * 0.07}Z`} fill="#E2453C" />
      ))}
      <rect x="-11" y="-88" width="22" height="14" rx="3" fill={night ? '#FFE27A' : '#BFE6FF'} />
      <path d="M-13 -88 L0 -100 L13 -88Z" fill="#E2453C" />
      <rect x="-5" y="-14" width="10" height="14" rx="5" fill="#8B5A35" />
    </G>
  );
}

export function Boat({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G x={x} y={y} s={s} cls="od-bob">
      <path d="M-22 0 H22 L16 8 H-16Z" fill="#E46F5F" />
      <path d="M0 0 V-34" stroke="#8B5A35" strokeWidth="2" />
      <path d="M2 -32 L20 -4 H2Z" fill="#FFFFFF" />
      <path d="M-2 -26 L-14 -4 H-2Z" fill="#FFE27A" />
    </G>
  );
}

// ---------------- Quintal de jardim ----------------

export function TulipBed({ x, y, n = 6, colors }: { x: number; y: number; n?: number; colors: string[] }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-6" y="-4" width={n * 16 + 12} height="12" rx="6" fill="#A8714F" />
      {Array.from({ length: n }, (_, i) => (
        <Tulip key={i} x={i * 16 + 2} y={0} c={colors[i % colors.length]} s={1.1} />
      ))}
    </g>
  );
}

export function RoseArch({ x, y, s = 1, night }: { x: number; y: number; s?: number; night: boolean }) {
  const w = night ? '#B9B3CF' : '#FFFFFF';
  return (
    <G x={x} y={y} s={s}>
      <path d="M-30 0 V-50 Q-30 -82 0 -82 Q30 -82 30 -50 V0" stroke={w} strokeWidth="6" fill="none" />
      <path d="M-30 -10 V-50 Q-30 -82 0 -82 Q30 -82 30 -50 V-10" stroke="#4FB063" strokeWidth="4" strokeDasharray="6 6" fill="none" />
      {[
        [-30, -40],
        [-26, -64],
        [-12, -80],
        [8, -80],
        [24, -66],
        [30, -42],
        [-30, -18],
        [30, -20],
      ].map(([rx, ry], i) => (
        <circle key={i} cx={rx} cy={ry} r="5" fill={i % 3 ? '#FF7FA0' : '#FFD34D'} />
      ))}
    </G>
  );
}
