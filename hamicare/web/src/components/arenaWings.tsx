// Laterais das arenas: cada arena fica bem mais larga (o dobro), com morros, vegetação e decoração do tema
// dos dois lados. Desenho plano, no mesmo estilo das arenas. As peças grandes nas emendas (x = 0 e x = 400)
// fazem a moldura e escondem a junção com o desenho do meio.
import type { ReactNode } from 'react';

type Veg = 'prado' | 'jardim' | 'vila' | 'floresta' | 'tropical' | 'neve' | 'cidade' | 'mar' | 'sonhos' | 'castelo' | 'espaco' | 'celeste' | 'lua';
type Band = [string, string];
interface WingLook {
  veg: Veg;
  /** faixas de chão (de trás para a frente): [dia, noite] */
  bands: [Band, Band, Band];
  /** altura (y) de cada faixa */
  ys: [number, number, number];
}

const LOOK: Record<string, WingLook> = {
  casinha: { veg: 'prado', bands: [['#C4E9B4', '#33584D'], ['#A6D791', '#2F5A4C'], ['#7FC26E', '#2A5244']], ys: [166, 195, 238] },
  jardim: { veg: 'jardim', bands: [['#B9E5A4', '#355E52'], ['#82C887', '#2F5A4C'], ['#6AB469', '#2A5244']], ys: [198, 227, 254] },
  vila: { veg: 'vila', bands: [['#D3C3A8', '#4E4860'], ['#C2B196', '#4A4458'], ['#A9947D', '#3E3A48']], ys: [182, 210, 250] },
  floresta: { veg: 'floresta', bands: [['#7CC07C', '#284A40'], ['#5AA668', '#22443A'], ['#498E58', '#1C3A31']], ys: [170, 190, 262] },
  tropical: { veg: 'tropical', bands: [['#45B7E5', '#2E5A86'], ['#E8CD98', '#9C8B6A'], ['#DFC08A', '#8A7A5C']], ys: [186, 236, 262] },
  neve: { veg: 'neve', bands: [['#9CB1D7', '#3D4E86'], ['#E7ECF2', '#B9C3DE'], ['#D2D8E7', '#A8B3D2']], ys: [150, 206, 224] },
  cidade: { veg: 'cidade', bands: [['#B9C1D6', '#3A3F58'], ['#B5BBD1', '#4E5470'], ['#CFD3DE', '#5A6080']], ys: [190, 210, 244] },
  mar: { veg: 'mar', bands: [['#2F86B8', '#1C3E66'], ['#CFBC8C', '#8A7A5C'], ['#C4AF7E', '#7A6A4E']], ys: [200, 236, 262] },
  sonhos: { veg: 'sonhos', bands: [['#F2D9FF', '#5A4A8E'], ['#F9F9FA', '#C9B8E6'], ['#E8DAE4', '#D8C6EA']], ys: [196, 211, 239] },
  castelo: { veg: 'castelo', bands: [['#C9E0B8', '#3D4E70'], ['#B3D0A0', '#35503F'], ['#72B964', '#2E4B3A']], ys: [190, 209, 252] },
  espaco: { veg: 'espaco', bands: [['#5A4F9A', '#5A4F9A'], ['#8288A1', '#8288A1'], ['#767C96', '#767C96']], ys: [200, 220, 254] },
  celeste: { veg: 'celeste', bands: [['#FFFFFF', '#D8DCF2'], ['#F4F2F6', '#CFC7E6'], ['#E8E8EA', '#B9AED6']], ys: [226, 240, 248] },
  lua: { veg: 'lua', bands: [['#6F7592', '#6F7592'], ['#898EA9', '#898EA9'], ['#A9ACBC', '#A9ACBC']], ys: [209, 231, 256] },
};

const T = ({ x, y, s = 1, children, cls }: { x: number; y: number; s?: number; children: ReactNode; cls?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>{cls ? <g className={cls}>{children}</g> : children}</g>
);

// ---------- peças ----------
const RoundTree = ({ x, y, s = 1, n, fruit }: { x: number; y: number; s?: number; n: boolean; fruit?: string }) => (
  <T x={x} y={y} s={s} cls="tree-sway">
    <path d="M-6 0 L-4 -40 H4 L6 0Z" fill={n ? '#4E3426' : '#9A6A48'} />
    <circle cx="-20" cy="-52" r="22" fill={n ? '#1C3E33' : '#46994F'} />
    <circle cx="20" cy="-54" r="22" fill={n ? '#1C3E33' : '#46994F'} />
    <circle cx="0" cy="-72" r="28" fill={n ? '#1F4338' : '#55AA5F'} />
    <circle cx="-10" cy="-82" r="10" fill={n ? '#2A5244' : '#7DD488'} opacity="0.8" />
    {fruit && [[-18, -54], [8, -66], [20, -50], [-4, -46]].map(([fx, fy], i) => <circle key={i} cx={fx} cy={fy} r="3.6" fill={fruit} />)}
  </T>
);
const PineT = ({ x, y, s = 1, n, snow, c }: { x: number; y: number; s?: number; n: boolean; snow?: boolean; c?: string }) => {
  const g = c ?? (n ? '#1F4F45' : '#3A9A5C');
  return (
    <T x={x} y={y} s={s}>
      <rect x="-4" y="-12" width="8" height="14" rx="2" fill={n ? '#4E3426' : '#8C5A3A'} />
      <path d="M0 -96 L26 -50 H-26Z" fill={g} />
      <path d="M0 -74 L32 -28 H-32Z" fill={g} />
      <path d="M0 -54 L38 -8 H-38Z" fill={g} />
      {snow && <path d="M0 -96 L10 -80 Q0 -76 -10 -80Z M0 -74 L12 -56 Q0 -52 -12 -56Z M0 -54 L14 -36 Q0 -32 -14 -36Z" fill="#FFFFFF" />}
    </T>
  );
};
const BushT = ({ x, y, s = 1, n, berry }: { x: number; y: number; s?: number; n: boolean; berry?: string }) => (
  <T x={x} y={y} s={s}>
    <circle cx="-16" cy="-10" r="14" fill={n ? '#1C3E33' : '#46994F'} />
    <circle cx="14" cy="-10" r="14" fill={n ? '#1C3E33' : '#46994F'} />
    <circle cx="0" cy="-18" r="18" fill={n ? '#22493C' : '#5DB36A'} />
    {berry && [[-12, -12], [8, -20], [16, -8]].map(([bx, by], i) => <circle key={i} cx={bx} cy={by} r="2.8" fill={berry} />)}
  </T>
);
const FlowerT = ({ x, y, c, s = 1 }: { x: number; y: number; c: string; s?: number }) => (
  <T x={x} y={y} s={s}>
    <path d="M0 0 V9" stroke="#3E9E58" strokeWidth="2" />
    {[0, 72, 144, 216, 288].map((a) => (
      <ellipse key={a} cx="0" cy="-4" rx="3" ry="4.2" fill={c} transform={`rotate(${a})`} />
    ))}
    <circle r="2.4" fill="#FFD34D" />
  </T>
);
const Tufts = ({ xs, y, c }: { xs: number[]; y: number; c: string }) => (
  <>
    {xs.map((x) => (
      <path key={x} d={`M${x - 7} ${y} q2 -10 4 0 q2 -13 4 0 q2 -9 4 0`} fill={c} />
    ))}
  </>
);
const Mush = ({ x, y, s = 1, c = '#F26D6D' }: { x: number; y: number; s?: number; c?: string }) => (
  <T x={x} y={y} s={s}>
    <rect x="-3.5" y="-11" width="7" height="11" rx="3" fill="#FFF4E2" />
    <path d="M-12 -10 Q0 -26 12 -10Z" fill={c} />
    <circle cx="-4" cy="-15" r="1.8" fill="#FFFFFF" />
    <circle cx="4" cy="-13" r="1.5" fill="#FFFFFF" />
  </T>
);
const RockT = ({ x, y, s = 1, c = '#B8B2AE' }: { x: number; y: number; s?: number; c?: string }) => (
  <T x={x} y={y} s={s}>
    <path d="M-16 0 Q-18 -11 -7 -14 Q4 -20 12 -11 Q18 -4 16 0Z" fill={c} />
    <path d="M-7 -12 Q2 -16 7 -11" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="2.6" fill="none" strokeLinecap="round" />
  </T>
);
const Palm = ({ x, y, s = 1, n }: { x: number; y: number; s?: number; n: boolean }) => (
  <T x={x} y={y} s={s} cls="tree-sway">
    {[0, 1, 2, 3, 4].map((i) => (
      <path key={i} d={`M${-5 + i * 2} ${-i * 20} l12 -1 l-1 -20 l-11 1Z`} fill={i % 2 ? (n ? '#6E5040' : '#B07A4F') : n ? '#7A5A48' : '#C28A5C'} />
    ))}
    {[-160, -20, -120, -60, 170, 10].map((a, i) => (
      <g key={i} transform={`translate(8 -100) rotate(${a})`}>
        <path d="M0 0 C14 -10 36 -8 48 0 C36 8 14 10 0 0Z" fill={n ? '#2A5A48' : i % 2 ? '#3FA866' : '#4FB873'} />
      </g>
    ))}
    <circle cx="4" cy="-96" r="5" fill="#8B5A35" />
    <circle cx="12" cy="-94" r="5" fill="#7A4D2C" />
  </T>
);
const House = ({ x, y, s = 1, n, wall, roof }: { x: number; y: number; s?: number; n: boolean; wall: string; roof: string }) => (
  <T x={x} y={y} s={s}>
    <rect x="-26" y="-40" width="52" height="40" rx="5" fill={n ? '#8A8298' : wall} />
    <path d="M-32 -38 L0 -66 L32 -38Z" fill={n ? '#6E4850' : roof} />
    <rect x="-7" y="-22" width="14" height="22" rx="4" fill={n ? '#4E3A38' : '#A9713F'} />
    <rect x="11" y="-32" width="10" height="10" rx="2" fill={n ? '#FFE9A8' : '#9FD6FF'} />
    <rect x="-21" y="-32" width="10" height="10" rx="2" fill={n ? '#FFE9A8' : '#9FD6FF'} />
    <rect x="-24" y="-20" width="14" height="5" rx="2" fill="#5FBF77" />
  </T>
);
const LampT = ({ x, y, n }: { x: number; y: number; n: boolean }) => (
  <T x={x} y={y}>
    {n && <circle cx="0" cy="-48" r="18" fill="#FFE9A8" opacity="0.3" />}
    <rect x="-2" y="-46" width="4" height="46" fill="#4E4A63" />
    <rect x="-6" y="-56" width="12" height="12" rx="3" fill={n ? '#FFE27A' : '#FFF6D6'} />
    <path d="M-8 -56 L0 -62 L8 -56Z" fill="#4E4A63" />
  </T>
);
const Building = ({ x, y, w, h, n, c }: { x: number; y: number; w: number; h: number; n: boolean; c: string }) => (
  <T x={x} y={y}>
    <rect x={-w / 2} y={-h} width={w} height={h} rx="3" fill={n ? '#3E4460' : c} />
    {Array.from({ length: Math.floor((h - 14) / 16) }, (_, r) =>
      Array.from({ length: Math.floor((w - 8) / 12) }, (_, k) => (
        <rect key={`${r}-${k}`} x={-w / 2 + 6 + k * 12} y={-h + 8 + r * 16} width="6" height="8" rx="1.5" fill={n ? ((r + k) % 3 ? '#FFE27A' : '#5A6080') : '#E9F4FF'} />
      )),
    )}
  </T>
);
const Coral = ({ x, y, s = 1, c }: { x: number; y: number; s?: number; c: string }) => (
  <T x={x} y={y} s={s} cls="tree-sway">
    <path d="M0 0 V-26 M0 -14 Q-12 -18 -14 -34 M0 -20 Q12 -24 12 -40 M-14 -34 V-42 M12 -40 Q18 -44 18 -50" stroke={c} strokeWidth="7" strokeLinecap="round" fill="none" />
  </T>
);
const Weed = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <T x={x} y={y} s={s} cls="tree-sway">
    <path d="M0 0 Q-8 -16 0 -30 Q8 -44 0 -58" stroke="#3FAF7A" strokeWidth="6" strokeLinecap="round" fill="none" />
    <path d="M8 0 Q2 -14 8 -26 Q14 -38 8 -48" stroke="#2F9A68" strokeWidth="5" strokeLinecap="round" fill="none" />
  </T>
);
const Puff = ({ x, y, s = 1, c = '#FFFFFF' }: { x: number; y: number; s?: number; c?: string }) => (
  <T x={x} y={y} s={s}>
    <circle cx="-16" cy="-10" r="14" fill={c} />
    <circle cx="14" cy="-10" r="15" fill={c} />
    <circle cx="0" cy="-20" r="18" fill={c} />
  </T>
);
const Lolly = ({ x, y, s = 1, c }: { x: number; y: number; s?: number; c: string }) => (
  <T x={x} y={y} s={s} cls="tree-sway">
    <rect x="-2.5" y="-50" width="5" height="50" rx="2" fill="#FFFFFF" />
    <circle cx="0" cy="-62" r="18" fill={c} />
    <path d="M0 -62 m-12 0 a12 12 0 1 0 24 0 a8 8 0 1 0 -16 0 a4 4 0 1 0 8 0" stroke="#FFFFFF" strokeWidth="3" fill="none" />
  </T>
);
const Star = ({ x, y, r, c }: { x: number; y: number; r: number; c: string }) => {
  const p = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${x + Math.cos(a) * rr} ${y + Math.sin(a) * rr}`;
  });
  return <path d={`M${p.join(' L')} Z`} fill={c} />;
};
const Tower = ({ x, y, s = 1, n, c }: { x: number; y: number; s?: number; n: boolean; c: string }) => (
  <T x={x} y={y} s={s}>
    <rect x="-16" y="-80" width="32" height="80" rx="3" fill={n ? '#8E86A8' : '#EDE6F7'} />
    <path d="M-20 -78 L0 -118 L20 -78Z" fill={n ? '#5E4E86' : c} />
    <path d="M0 -118 V-132" stroke="#8B5A35" strokeWidth="2" />
    <path d="M0 -132 L14 -127 L0 -122Z" fill="#FFD34D" />
    <rect x="-5" y="-60" width="10" height="14" rx="5" fill={n ? '#FFE9A8' : '#8FA8E8'} />
    <path d="M-6 0 V-16 Q0 -24 6 -16 V0Z" fill={n ? '#4E3A38' : '#A9713F'} />
  </T>
);
const Hedge = ({ x, y, w, n }: { x: number; y: number; w: number; n: boolean }) => (
  <T x={x} y={y}>
    <rect x={-w / 2} y="-18" width={w} height="18" rx="9" fill={n ? '#22493C' : '#4FA35C'} />
    {Array.from({ length: Math.max(1, Math.floor(w / 18)) }, (_, i) => (
      <circle key={i} cx={-w / 2 + 9 + i * 18} cy="-18" r="7" fill={n ? '#2A5244' : '#5DB36A'} />
    ))}
  </T>
);
const Planet = ({ x, y, r, c, ring }: { x: number; y: number; r: number; c: string; ring?: string }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={c} />
    <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.3} fill="#FFFFFF" opacity="0.25" />
    {ring && <ellipse cx={x} cy={y} rx={r * 1.7} ry={r * 0.45} fill="none" stroke={ring} strokeWidth="3" transform={`rotate(-18 ${x} ${y})`} />}
  </g>
);
const Crystal = ({ x, y, s = 1, c }: { x: number; y: number; s?: number; c: string }) => (
  <T x={x} y={y} s={s}>
    <path d="M-10 0 L-12 -22 L-4 -36 L2 -20 Z" fill={c} />
    <path d="M0 0 L2 -30 L10 -46 L16 -26 L12 0Z" fill={c} opacity="0.85" />
    <path d="M4 -28 L10 -42" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" />
  </T>
);
const Crater = ({ x, y, rx, c }: { x: number; y: number; rx: number; c: string }) => (
  <g>
    <ellipse cx={x} cy={y} rx={rx} ry={rx * 0.32} fill={c} />
    <ellipse cx={x} cy={y - 1} rx={rx * 0.72} ry={rx * 0.2} fill="#000" opacity="0.12" />
  </g>
);
const Column = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <T x={x} y={y} s={s}>
    <rect x="-12" y="-74" width="24" height="70" fill="#FFF7E6" />
    {[-6, 0, 6].map((dx) => (
      <path key={dx} d={`M${dx} -70 V-8`} stroke="#EBDDB8" strokeWidth="2" />
    ))}
    <rect x="-16" y="-80" width="32" height="8" rx="3" fill="#F2DFA8" />
    <rect x="-16" y="-6" width="32" height="8" rx="3" fill="#F2DFA8" />
  </T>
);
const Snowman = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <T x={x} y={y} s={s}>
    <circle cx="0" cy="-16" r="16" fill="#FFFFFF" />
    <circle cx="0" cy="-42" r="12" fill="#FFFFFF" />
    <circle cx="-4" cy="-44" r="1.6" fill="#3B2A2A" />
    <circle cx="4" cy="-44" r="1.6" fill="#3B2A2A" />
    <path d="M0 -40 l9 2 l-9 1Z" fill="#FF8A3D" />
    <rect x="-12" y="-33" width="24" height="5" rx="2.5" fill="#E85A5A" />
    <path d="M-10 -52 H10 L7 -62 H-7Z" fill="#3E5B9A" />
  </T>
);

/** Um lado (o esquerdo). O direito é o mesmo desenho espelhado. */
function Side({ veg, n, look, flip }: { veg: Veg; n: boolean; look: WingLook; flip?: boolean }) {
  const [far, mid, near] = look.bands.map((b) => (n ? b[1] : b[0]));
  const [y0, y1, y2] = look.ys;
  const grass = n ? '#1C3A31' : '#3E9E58';
  const fl = ['#FF7FA0', '#FFD34D', '#B48CFF', '#FFFFFF', '#FF9D5C'];
  const bands = (
    <>
      <path d={`M0 ${y0 + 6} Q50 ${y0 - 22} 100 ${y0} T200 ${y0} V300 H0Z`} fill={far} />
      <path d={`M0 ${y1 + 4} Q60 ${y1 - 14} 120 ${y1 + 2} T200 ${y1} V300 H0Z`} fill={mid} />
      <path d={`M0 ${y2} Q70 ${y2 - 10} 140 ${y2 + 2} T200 ${y2} V300 H0Z`} fill={near} />
    </>
  );
  const flowers = (ys: number) => (
    <>
      {[16, 52, 88, 118, 150].map((x, i) => (
        <FlowerT key={x} x={x} y={ys + (i % 2) * 6} c={fl[(i + (flip ? 2 : 0)) % fl.length]} s={0.9} />
      ))}
    </>
  );
  let props: ReactNode = null;
  switch (veg) {
    case 'prado':
      props = (
        <>
          <PineT x={40} y={y0 + 10} s={0.5} n={n} />
          <PineT x={70} y={y0 + 4} s={0.6} n={n} />
          <RoundTree x={140} y={y1 + 6} s={0.6} n={n} fruit={n ? undefined : '#FF6F6F'} />
          <House x={66} y={y1 + 10} s={0.6} n={n} wall="#FFF3DC" roof="#F07B5A" />
          <BushT x={30} y={y2 + 14} s={0.9} n={n} berry="#E2547A" />
          <RoundTree x={188} y={292} s={1.25} n={n} />
          <Mush x={110} y={y2 + 22} s={0.8} />
          {flowers(284)}
        </>
      );
      break;
    case 'jardim':
      props = (
        <>
          <Hedge x={60} y={y0 + 8} w={90} n={n} />
          <Hedge x={150} y={y0 + 12} w={70} n={n} />
          {[30, 70, 110, 150].map((x, i) => (
            <T key={x} x={x} y={y1 + 14} s={0.8} cls="tree-sway">
              <path d="M0 0 V-34" stroke="#3E8F4A" strokeWidth="3" />
              {Array.from({ length: 10 }, (_, k) => (
                <ellipse key={k} cx="0" cy="-46" rx="3.4" ry="7" fill={i % 2 ? '#FFD25A' : '#FF9FC2'} transform={`rotate(${k * 36} 0 -36)`} />
              ))}
              <circle cx="0" cy="-36" r="5" fill="#7A4E32" />
            </T>
          ))}
          <T x={100} y={y2 + 10}>
            <path d="M-30 0 Q0 -40 30 0" stroke={n ? '#8A8298' : '#FFFFFF'} strokeWidth="5" fill="none" />
            {[-24, -12, 0, 12, 24].map((dx) => (
              <circle key={dx} cx={dx} cy={-Math.sqrt(Math.max(0, 900 - dx * dx)) + 6} r="5" fill={dx % 24 ? '#FF7FA0' : '#FFD34D'} />
            ))}
          </T>
          <BushT x={26} y={y2 + 18} s={1} n={n} berry="#FF7FA0" />
          <RoundTree x={190} y={294} s={1.2} n={n} fruit="#FF9FC2" />
          {flowers(282)}
          {flowers(296)}
        </>
      );
      break;
    case 'vila':
      props = (
        <>
          <House x={40} y={y0 + 14} s={0.55} n={n} wall="#FFE9C9" roof="#5B8DEF" />
          <House x={110} y={y0 + 10} s={0.65} n={n} wall="#FFF3DC" roof="#E0685F" />
          <House x={160} y={y1 + 14} s={0.7} n={n} wall="#FFE3EC" roof="#8A63D2" />
          <LampT x={70} y={y2 + 6} n={n} />
          <RoundTree x={24} y={y2 + 20} s={0.8} n={n} />
          <RoundTree x={190} y={292} s={1.2} n={n} fruit={n ? undefined : '#FFB347'} />
          <path d={`M90 300 Q110 ${y2 + 10} 140 ${y2 + 4}`} stroke={n ? '#6E6880' : '#E8D9BC'} strokeWidth="14" fill="none" strokeLinecap="round" />
          {flowers(288)}
        </>
      );
      break;
    case 'floresta':
      props = (
        <>
          {[14, 44, 74, 104, 134, 164].map((x, i) => (
            <PineT key={x} x={x} y={y0 + 12 + (i % 2) * 6} s={0.55 + (i % 3) * 0.08} n={n} />
          ))}
          <PineT x={60} y={y1 + 20} s={0.85} n={n} />
          <PineT x={130} y={y1 + 24} s={0.75} n={n} />
          <RoundTree x={190} y={294} s={1.3} n={n} />
          <Mush x={30} y={y2 + 20} />
          <Mush x={44} y={y2 + 24} s={0.7} c="#FF9F4D" />
          <RockT x={100} y={y2 + 24} s={1.1} c={n ? '#5E6070' : '#9E9A96'} />
          {[80, 120, 150].map((x) => (
            <T key={x} x={x} y={292} s={0.9}>
              {[-40, -20, 0, 20, 40].map((a) => (
                <path key={a} d="M0 0 Q2 -14 0 -26" stroke={n ? '#22443A' : '#3E8F4A'} strokeWidth="4" fill="none" strokeLinecap="round" transform={`rotate(${a})`} />
              ))}
            </T>
          ))}
        </>
      );
      break;
    case 'tropical':
      props = (
        <>
          <path d={`M0 ${y0 + 8} H200`} stroke="#FFFFFF" strokeWidth="2" strokeDasharray="10 14" opacity="0.6" className="wave-bob" />
          <T x={60} y={y0 + 2} s={0.8}>
            <path d="M-12 0 L0 -24 L12 0Z" fill="#FFFFFF" />
            <rect x="-16" y="0" width="32" height="6" rx="3" fill="#E0685F" />
          </T>
          <Palm x={40} y={y2 + 16} s={0.8} n={n} />
          <Palm x={188} y={296} s={1.2} n={n} />
          <RockT x={110} y={y2 + 20} c={n ? '#6E6A64' : '#C9BFA9'} />
          <T x={140} y={286}>
            <path d="M-10 0 C-10 -12 10 -12 10 0Z" fill="#FFB3CF" />
            <path d="M-6 -1 L-4 -8 M0 -1 L0 -10 M6 -1 L4 -8" stroke="#FFFFFF" strokeWidth="1.4" />
          </T>
          <Star x={80} y={290} r={7} c="#FF9A6B" />
          <T x={20} y={290}>
            <rect x="-2" y="-46" width="3" height="46" fill="#C9A27A" />
            <path d="M-26 -44 Q0 -64 26 -44Z" fill="#FF8A7A" />
          </T>
        </>
      );
      break;
    case 'neve':
      props = (
        <>
          <path d={`M0 ${y0 + 40} L40 ${y0 - 10} L80 ${y0 + 30} L130 ${y0 - 20} L200 ${y0 + 34} V300 H0Z`} fill={n ? '#3D4E86' : '#9AB0D8'} />
          <path d={`M40 ${y0 - 10} L52 ${y0 + 4} L40 ${y0} L28 ${y0 + 4}Z M130 ${y0 - 20} L144 ${y0 - 4} L130 ${y0 - 8} L116 ${y0 - 4}Z`} fill="#FFFFFF" />
          <path d={`M0 ${y1 + 4} Q60 ${y1 - 14} 120 ${y1 + 2} T200 ${y1} V300 H0Z`} fill={mid} />
          <path d={`M0 ${y2} Q70 ${y2 - 10} 140 ${y2 + 2} T200 ${y2} V300 H0Z`} fill={near} />
          {[20, 60, 100, 140].map((x, i) => (
            <PineT key={x} x={x} y={y1 + 8 + (i % 2) * 6} s={0.55 + (i % 2) * 0.1} n={n} snow />
          ))}
          <Snowman x={80} y={y2 + 22} s={0.9} />
          <PineT x={188} y={296} s={1.15} n={n} snow />
          <RockT x={30} y={290} c="#FFFFFF" />
        </>
      );
      break;
    case 'cidade':
      props = (
        <>
          <Building x={30} y={y0 + 18} w={40} h={90} n={n} c="#C9D3E8" />
          <Building x={80} y={y0 + 18} w={36} h={120} n={n} c="#E8D3C9" />
          <Building x={130} y={y0 + 18} w={44} h={80} n={n} c="#D3E8D9" />
          <Building x={176} y={y0 + 18} w={34} h={104} n={n} c="#E8E1C9" />
          <rect x="0" y="254" width="200" height="46" fill={n ? '#2E3248' : '#72798F'} />
          <path d="M6 277 H200" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="16 14" opacity="0.8" />
          <LampT x={50} y={y2 + 6} n={n} />
          <LampT x={150} y={y2 + 6} n={n} />
          <T x={100} y={y2 + 8}>
            <rect x="-18" y="-10" width="36" height="12" rx="3" fill={n ? '#5E5246' : '#B07A52'} />
            <BushT x={0} y={-8} s={0.7} n={n} />
          </T>
          <RoundTree x={190} y={252} s={1.15} n={n} />
          <BushT x={18} y={252} s={0.8} n={n} berry="#FF7FA0" />
        </>
      );
      break;
    case 'mar':
      props = (
        <>
          {[[30, 0], [90, 1], [150, 2]].map(([x, i]) => (
            <circle key={x} className="bubble-up" style={{ animationDelay: `${i * 0.9}s` }} cx={x} cy={y0 + 20} r={3 + (i as number)} fill="#FFFFFF" opacity="0.6" />
          ))}
          <Coral x={30} y={y2 + 10} s={0.9} c="#FF7FA0" />
          <Coral x={70} y={y2 + 14} s={0.7} c="#FFB347" />
          <Weed x={120} y={y2 + 16} />
          <Weed x={150} y={y2 + 12} s={0.8} />
          <Coral x={188} y={298} s={1.4} c="#FF8A7A" />
          <RockT x={100} y={292} c="#8E9AAE" />
          <Star x={50} y={290} r={8} c="#FF9A6B" />
          <T x={140} y={292}>
            <path d="M-10 0 C-10 -12 10 -12 10 0Z" fill="#FFE2EC" />
          </T>
        </>
      );
      break;
    case 'sonhos':
      props = (
        <>
          <Puff x={40} y={y0 + 10} s={0.9} c={n ? '#C9B8E6' : '#FFFFFF'} />
          <Puff x={130} y={y0 + 4} s={0.7} c={n ? '#C9B8E6' : '#FFFFFF'} />
          <Lolly x={60} y={y1 + 20} s={0.8} c="#FF9FC2" />
          <Lolly x={120} y={y1 + 22} s={0.65} c="#B9A3F0" />
          <Lolly x={188} y={294} s={1.2} c="#7FD3F0" />
          <Star x={30} y={y1 - 30} r={8} c="#FFE27A" />
          <Star x={160} y={y0 - 40} r={6} c="#FFE27A" />
          <Puff x={30} y={298} s={0.8} c={n ? '#D8C6EA' : '#FFF0F8'} />
          {flowers(288)}
        </>
      );
      break;
    case 'castelo':
      props = (
        <>
          <Tower x={50} y={y0 + 12} s={0.55} n={n} c="#8A63D2" />
          <Tower x={130} y={y0 + 16} s={0.45} n={n} c="#E0685F" />
          <Hedge x={60} y={y1 + 14} w={100} n={n} />
          <Hedge x={150} y={y1 + 18} w={60} n={n} />
          <T x={100} y={y2 + 12}>
            <rect x="-1.5" y="-50" width="3" height="50" fill="#8B5A35" />
            <path d="M1.5 -50 H26 L20 -42 L26 -34 H1.5Z" fill="#FF7FA0" />
          </T>
          <RoundTree x={190} y={294} s={1.2} n={n} />
          <BushT x={24} y={296} s={0.9} n={n} berry="#FFD34D" />
          {flowers(288)}
        </>
      );
      break;
    case 'espaco':
      props = (
        <>
          <Planet x={60} y={70} r={18} c="#FF9FC2" ring="#FFE27A" />
          <Planet x={150} y={40} r={9} c="#7FD3F0" />
          <Crater x={50} y={y1 + 14} rx={22} c="#6E7590" />
          <Crater x={140} y={y2 + 14} rx={28} c="#6E7590" />
          <Crystal x={100} y={y2 + 18} c="#B48CFF" />
          <Crystal x={186} y={298} s={1.5} c="#7FD3F0" />
          <Crystal x={24} y={296} s={1.1} c="#FF9FC2" />
        </>
      );
      break;
    case 'celeste':
      props = (
        <>
          <Puff x={50} y={y0 + 6} s={1.1} c={n ? '#D8DCF2' : '#FFFFFF'} />
          <Puff x={150} y={y0 + 10} s={0.9} c={n ? '#D8DCF2' : '#FFFFFF'} />
          <Column x={70} y={y1 + 14} s={0.7} />
          <Column x={130} y={y1 + 16} s={0.6} />
          <Star x={40} y={y0 - 60} r={7} c="#FFE27A" />
          <Star x={170} y={y0 - 80} r={5} c="#FFE27A" />
          <Column x={188} y={298} s={1.1} />
          <Puff x={30} y={300} s={0.9} c={n ? '#D8DCF2' : '#FFFFFF'} />
        </>
      );
      break;
    case 'lua':
      props = (
        <>
          <Crater x={50} y={y1 + 10} rx={26} c="#7A809C" />
          <Crater x={150} y={y2 + 10} rx={30} c="#9EA3B8" />
          <RockT x={100} y={y2 + 20} c="#7A809C" />
          <RockT x={190} y={298} s={1.6} c="#9EA3B8" />
          <RockT x={20} y={298} s={1.2} c="#7A809C" />
          <Crystal x={70} y={292} s={0.9} c="#B48CFF" />
        </>
      );
      break;
  }
  return (
    <>
      {veg !== 'neve' ? bands : null}
      {props}
      {['prado', 'jardim', 'vila', 'floresta', 'castelo'].includes(veg) && <Tufts xs={[30, 70, 110, 160]} y={298} c={grass} />}
    </>
  );
}

/** As duas laterais da arena (de -200 a 0 e de 400 a 600). */
export function ArenaWings({ arena, night }: { arena: string; night: boolean }) {
  const look = LOOK[arena] ?? LOOK.casinha;
  return (
    <g className="arena-wings">
      <g transform="translate(-200 0)">
        <Side veg={look.veg} n={night} look={look} />
      </g>
      <g transform="translate(600 0) scale(-1 1)">
        <Side veg={look.veg} n={night} look={look} flip />
      </g>
    </g>
  );
}
