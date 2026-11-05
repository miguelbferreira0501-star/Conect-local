import type { ReactNode } from 'react';

// Kit de móveis da casa (desenhos próprios do HamiCare). Cada peça aceita duas cores (c1 principal, c2 detalhe),
// então a mesma cama vira rosa, azul ou lilás na loja. Desenhados de frente, com um pouquinho de profundidade.

export type Place = 'chao' | 'parede' | 'tapete';

/** Mistura duas cores hex (t = 0 → a, t = 1 → b). */
export function mix(a: string, b: string, t: number) {
  const p = (h: string) => {
    const x = h.replace('#', '');
    const f = x.length === 3 ? x.split('').map((c) => c + c).join('') : x;
    return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
  };
  const [r1, g1, b1] = p(a);
  const [r2, g2, b2] = p(b);
  const h = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  return `#${h(r1 + (r2 - r1) * t)}${h(g1 + (g2 - g1) * t)}${h(b1 + (b2 - b1) * t)}`;
}
const dk = (c: string, t = 0.2) => mix(c, '#2B1A14', t);
const lt = (c: string, t = 0.3) => mix(c, '#FFFFFF', t);

const WOOD = '#C98A5B';
const GOLD = '#F2C14E';
const INK = '#5A3B2E';

const S = ({ w, h, children }: { w: number; h: number; children: ReactNode }) => (
  <svg viewBox={`0 0 ${w} ${h}`} className="block h-auto w-full overflow-visible" aria-hidden="true">
    {children}
  </svg>
);

/** Perninhas de móvel. */
const Legs = ({ xs, y, h, c = dk(WOOD) }: { xs: number[]; y: number; h: number; c?: string }) => (
  <>
    {xs.map((x) => (
      <rect key={x} x={x} y={y} width="7" height={h} rx="2.5" fill={c} />
    ))}
  </>
);

/** Livros numa prateleira. */
function Books({ x, y, n, h = 22, seed = 0 }: { x: number; y: number; n: number; h?: number; seed?: number }) {
  const cs = ['#E2547A', '#5B8DEF', '#F2C14E', '#5FBF77', '#A57CF0', '#FF9A4D', '#6FD8C0'];
  let cx = x;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const w = 6 + ((i + seed) % 3) * 2;
        const hh = h - ((i * 7 + seed) % 3) * 3;
        const el = (
          <g key={i}>
            <rect x={cx} y={y - hh} width={w} height={hh} rx="1.2" fill={cs[(i + seed) % cs.length]} />
            <rect x={cx + 1.2} y={y - hh + 3} width={w - 2.4} height="1.6" fill="#fff" opacity="0.6" />
          </g>
        );
        cx += w + 1;
        return el;
      })}
    </>
  );
}

/** Plantinha num vaso (usada em várias peças). */
function Plant({ x, y, s = 1, pot = '#E58FAE' }: { x: number; y: number; s?: number; pot?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 C-12 -8 -14 -22 -4 -26 C-2 -16 0 -10 0 0 Z" fill="#5FAE84" />
      <path d="M0 0 C12 -10 16 -24 6 -28 C2 -18 0 -10 0 0 Z" fill="#7CC39A" />
      <path d="M0 0 C-4 -14 0 -30 2 -34 C6 -24 4 -10 0 0 Z" fill="#4F9A63" />
      <path d="M-9 0 H9 L7 12 H-7 Z" fill={pot} />
      <rect x="-10" y="-2" width="20" height="4" rx="2" fill={dk(pot, 0.12)} />
    </g>
  );
}

export function Kit({ id, c1 = '#FF9FC2', c2 = '#FFFFFF' }: { id: string; c1?: string; c2?: string }) {
  switch (id) {
    // ---------------- Quarto ----------------
    case 'k-cama':
      return (
        <S w={200} h={150}>
          {/* cabeceira em arco, estofada */}
          <path d="M20 78 V32 Q20 6 46 6 H154 Q180 6 180 32 V78 Z" fill={dk(c2, 0.08)} />
          <path d="M30 76 V36 Q30 16 50 16 H150 Q170 16 170 36 V76 Z" fill={c2} />
          {[60, 100, 140].map((x) => [36, 56].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.6" fill={dk(c2, 0.18)} />))}
          <path d="M20 32 Q20 6 46 6 H154 Q180 6 180 32" stroke={lt(c2, 0.5)} strokeWidth="3" fill="none" opacity="0.7" />
          {/* colchão e travesseiros */}
          <path d="M26 74 H174 L188 104 H12 Z" fill="#FFFFFF" />
          <rect x="40" y="58" width="52" height="26" rx="12" fill="#FFFFFF" stroke={dk('#FFFFFF', 0.08)} strokeWidth="2" />
          <rect x="108" y="58" width="52" height="26" rx="12" fill="#FFFFFF" stroke={dk('#FFFFFF', 0.08)} strokeWidth="2" />
          <rect x="48" y="64" width="36" height="5" rx="2.5" fill={lt(c1, 0.55)} />
          <rect x="116" y="64" width="36" height="5" rx="2.5" fill={lt(c1, 0.55)} />
          {/* colcha */}
          <path d="M18 88 H182 L194 116 H6 Z" fill={c1} />
          <path d="M22 86 H178 L182 96 H18 Z" fill={lt(c1, 0.45)} />
          {[30, 60, 90, 120, 150].map((x) => <path key={x} d={`M${x} 100 l6 8 l6 -8`} stroke={lt(c1, 0.35)} strokeWidth="2" fill="none" />)}
          <path d="M6 116 H194 V128 Q184 134 174 128 Q164 134 154 128 Q144 134 134 128 Q124 134 114 128 Q104 134 94 128 Q84 134 74 128 Q64 134 54 128 Q44 134 34 128 Q24 134 14 128 Q8 132 6 128 Z" fill={dk(c1, 0.12)} />
          {/* estrado e pés */}
          <rect x="4" y="128" width="192" height="10" rx="4" fill={WOOD} />
          <rect x="4" y="128" width="192" height="3" rx="1.5" fill={lt(WOOD, 0.3)} />
          <Legs xs={[10, 183]} y={136} h={12} />
        </S>
      );
    case 'k-criado':
      return (
        <S w={80} h={130}>
          {/* abajur em cima */}
          <ellipse cx="40" cy="22" rx="30" ry="14" fill="#FFF3B0" opacity="0.35" />
          <path d="M22 34 L28 10 H52 L58 34 Z" fill={c2} />
          <path d="M22 34 L28 10 H34 L30 34 Z" fill={lt(c2, 0.4)} opacity="0.8" />
          <rect x="37" y="34" width="6" height="12" fill={GOLD} />
          <ellipse cx="40" cy="48" rx="10" ry="3.5" fill={dk(GOLD, 0.15)} />
          {/* móvel */}
          <rect x="6" y="50" width="68" height="8" rx="3" fill={lt(c1, 0.15)} />
          <rect x="9" y="56" width="62" height="58" rx="4" fill={c1} />
          <rect x="14" y="62" width="52" height="20" rx="3" fill={lt(c1, 0.22)} />
          <rect x="14" y="88" width="52" height="20" rx="3" fill={lt(c1, 0.22)} />
          <circle cx="40" cy="72" r="3.2" fill={GOLD} />
          <circle cx="40" cy="98" r="3.2" fill={GOLD} />
          <Legs xs={[12, 61]} y={113} h={12} c={dk(c1, 0.3)} />
        </S>
      );
    case 'k-guarda-roupa':
      return (
        <S w={110} h={200}>
          <path d="M8 22 Q55 2 102 22 V30 H8 Z" fill={dk(c1, 0.1)} />
          <rect x="4" y="26" width="102" height="8" rx="3" fill={lt(c1, 0.15)} />
          <rect x="8" y="32" width="94" height="148" rx="4" fill={c1} />
          {/* portas */}
          <rect x="13" y="38" width="40" height="104" rx="4" fill={lt(c1, 0.2)} />
          <rect x="57" y="38" width="40" height="104" rx="4" fill={lt(c1, 0.2)} />
          <rect x="18" y="44" width="30" height="92" rx="12" fill="#CFE9F7" />
          <path d="M22 60 L36 46 M24 74 L44 54" stroke="#FFFFFF" strokeWidth="3" opacity="0.8" strokeLinecap="round" />
          <rect x="62" y="44" width="30" height="40" rx="3" fill={lt(c1, 0.35)} />
          <rect x="62" y="90" width="30" height="46" rx="3" fill={lt(c1, 0.35)} />
          <circle cx="50" cy="92" r="3" fill={GOLD} />
          <circle cx="60" cy="92" r="3" fill={GOLD} />
          {/* gavetas */}
          <rect x="13" y="146" width="84" height="14" rx="3" fill={lt(c1, 0.2)} />
          <rect x="13" y="162" width="84" height="14" rx="3" fill={lt(c1, 0.2)} />
          <rect x="47" y="151" width="16" height="4" rx="2" fill={GOLD} />
          <rect x="47" y="167" width="16" height="4" rx="2" fill={GOLD} />
          <rect x="4" y="178" width="102" height="6" rx="3" fill={dk(c1, 0.15)} />
          <Legs xs={[10, 93]} y={183} h={14} c={dk(c1, 0.35)} />
          {/* caixinhas em cima */}
          <rect x="18" y="12" width="26" height="14" rx="2" fill="#F7D9A8" />
          <rect x="18" y="12" width="26" height="4" fill="#E8B07C" />
          <rect x="66" y="8" width="22" height="18" rx="2" fill={c2} />
          <rect x="66" y="8" width="22" height="5" fill={dk(c2, 0.15)} />
        </S>
      );
    case 'k-comoda':
      return (
        <S w={160} h={130}>
          {/* coisinhas em cima */}
          <Plant x={28} y={34} s={0.8} pot={c2} />
          <rect x="62" y="12" width="28" height="24" rx="3" fill={GOLD} />
          <rect x="66" y="16" width="20" height="16" rx="2" fill="#BFE3FF" />
          <path d="M70 30 l5 -7 4 4 3 -3 4 6 Z" fill="#7CC39A" />
          <rect x="104" y="22" width="30" height="14" rx="3" fill={c2} />
          <path d="M104 22 Q119 10 134 22" fill={lt(c2, 0.3)} />
          <circle cx="119" cy="18" r="2.5" fill={GOLD} />
          {/* móvel */}
          <rect x="4" y="34" width="152" height="9" rx="4" fill={lt(c1, 0.12)} />
          <rect x="8" y="42" width="144" height="70" rx="5" fill={c1} />
          {[48, 70, 92].map((y) => (
            <g key={y}>
              <rect x="14" y={y} width="62" height="17" rx="3" fill={lt(c1, 0.22)} />
              <rect x="84" y={y} width="62" height="17" rx="3" fill={lt(c1, 0.22)} />
              <circle cx="45" cy={y + 8.5} r="3" fill={GOLD} />
              <circle cx="115" cy={y + 8.5} r="3" fill={GOLD} />
            </g>
          ))}
          <path d="M8 112 H152 L146 118 H14 Z" fill={dk(c1, 0.18)} />
          <Legs xs={[16, 137]} y={116} h={12} c={dk(c1, 0.35)} />
        </S>
      );
    case 'k-espelho':
      return (
        <S w={70} h={170}>
          <path d="M14 168 L26 120 M56 168 L44 120" stroke={dk(c1, 0.2)} strokeWidth="5" strokeLinecap="round" />
          <ellipse cx="35" cy="66" rx="30" ry="58" fill={c1} />
          <ellipse cx="35" cy="66" rx="23" ry="50" fill="#D7EEFA" />
          <path d="M22 40 L40 22 M22 62 L48 34" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
          <ellipse cx="35" cy="66" rx="30" ry="58" fill="none" stroke={lt(c1, 0.35)} strokeWidth="2" />
          <circle cx="35" cy="8" r="5" fill={c2} />
        </S>
      );
    case 'k-penteadeira':
      return (
        <S w={150} h={170}>
          <path d="M45 76 V36 Q45 6 75 6 Q105 6 105 36 V76 Z" fill={c1} />
          <path d="M52 74 V38 Q52 14 75 14 Q98 14 98 38 V74 Z" fill="#D7EEFA" />
          <path d="M60 40 L78 22 M60 58 L88 30" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" opacity="0.85" />
          <rect x="18" y="62" width="10" height="16" rx="3" fill="#BFA3F2" />
          <rect x="21" y="56" width="4" height="7" fill={GOLD} />
          <rect x="114" y="66" width="14" height="12" rx="6" fill="#FF8FB4" />
          <circle cx="132" cy="74" r="4" fill="#FFFFFF" />
          <rect x="6" y="76" width="138" height="9" rx="4" fill={lt(c1, 0.15)} />
          <rect x="10" y="84" width="130" height="34" rx="4" fill={c1} />
          <rect x="16" y="90" width="50" height="22" rx="3" fill={lt(c1, 0.25)} />
          <rect x="84" y="90" width="50" height="22" rx="3" fill={lt(c1, 0.25)} />
          <circle cx="41" cy="101" r="3" fill={GOLD} />
          <circle cx="109" cy="101" r="3" fill={GOLD} />
          <Legs xs={[14, 129]} y={117} h={48} c={dk(c1, 0.3)} />
          <ellipse cx="75" cy="146" rx="20" ry="7" fill={c2} />
          <rect x="58" y="146" width="34" height="14" rx="5" fill={dk(c2, 0.12)} />
        </S>
      );

    // ---------------- Sala ----------------
    case 'k-sofa':
      return (
        <S w={200} h={120}>
          <rect x="22" y="14" width="156" height="56" rx="22" fill={dk(c1, 0.06)} />
          <rect x="30" y="20" width="68" height="46" rx="16" fill={lt(c1, 0.12)} />
          <rect x="102" y="20" width="68" height="46" rx="16" fill={lt(c1, 0.12)} />
          {/* almofadinhas */}
          <rect x="36" y="34" width="36" height="30" rx="10" fill={c2} transform="rotate(-8 54 49)" />
          <rect x="128" y="34" width="36" height="30" rx="10" fill={c2} transform="rotate(8 146 49)" />
          <circle cx="54" cy="49" r="4" fill={dk(c2, 0.15)} />
          <circle cx="146" cy="49" r="4" fill={dk(c2, 0.15)} />
          {/* assento */}
          <rect x="24" y="62" width="76" height="22" rx="10" fill={lt(c1, 0.22)} />
          <rect x="100" y="62" width="76" height="22" rx="10" fill={lt(c1, 0.22)} />
          <rect x="22" y="80" width="156" height="20" rx="6" fill={dk(c1, 0.12)} />
          {/* braços */}
          <rect x="4" y="40" width="30" height="62" rx="15" fill={c1} />
          <rect x="166" y="40" width="30" height="62" rx="15" fill={c1} />
          <ellipse cx="19" cy="46" rx="13" ry="7" fill={lt(c1, 0.25)} />
          <ellipse cx="181" cy="46" rx="13" ry="7" fill={lt(c1, 0.25)} />
          <Legs xs={[16, 177]} y={100} h={14} />
          <Legs xs={[96]} y={100} h={10} />
        </S>
      );
    case 'k-poltrona':
      return (
        <S w={120} h={130}>
          <path d="M22 70 V30 Q22 6 60 6 Q98 6 98 30 V70 Z" fill={dk(c1, 0.05)} />
          <path d="M30 68 V34 Q30 16 60 16 Q90 16 90 34 V68 Z" fill={lt(c1, 0.14)} />
          <rect x="46" y="38" width="28" height="22" rx="8" fill={c2} />
          <rect x="26" y="66" width="68" height="22" rx="10" fill={lt(c1, 0.25)} />
          <rect x="24" y="84" width="72" height="20" rx="6" fill={dk(c1, 0.12)} />
          <rect x="6" y="46" width="26" height="60" rx="13" fill={c1} />
          <rect x="88" y="46" width="26" height="60" rx="13" fill={c1} />
          <Legs xs={[18, 95]} y={104} h={20} />
        </S>
      );
    case 'k-mesa-centro':
      return (
        <S w={150} h={80}>
          <rect x="34" y="8" width="30" height="7" rx="2" fill="#5B8DEF" />
          <rect x="36" y="2" width="26" height="7" rx="2" fill="#F2C14E" />
          <rect x="92" y="2" width="16" height="14" rx="4" fill="#FFFFFF" />
          <path d="M108 6 q7 1 0 8" stroke="#FFFFFF" strokeWidth="3" fill="none" />
          <path d="M96 0 q2 -6 0 -10 M104 0 q2 -6 0 -10" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.7" fill="none" />
          <ellipse cx="75" cy="22" rx="72" ry="10" fill={lt(c1, 0.1)} />
          <rect x="3" y="20" width="144" height="12" rx="6" fill={c1} />
          <rect x="16" y="32" width="9" height="40" rx="3" fill={dk(c1, 0.25)} />
          <rect x="125" y="32" width="9" height="40" rx="3" fill={dk(c1, 0.25)} />
          <rect x="22" y="52" width="106" height="6" rx="3" fill={dk(c1, 0.15)} />
        </S>
      );
    case 'k-estante':
      return (
        <S w={120} h={180}>
          <rect x="4" y="4" width="112" height="170" rx="5" fill={dk(c1, 0.12)} />
          <rect x="10" y="10" width="100" height="158" rx="3" fill={dk(c1, 0.32)} />
          {[48, 88, 128, 168].map((y) => (
            <rect key={y} x="8" y={y - 4} width="104" height="6" rx="2" fill={c1} />
          ))}
          <Books x={14} y={44} n={7} seed={1} />
          <Plant x={88} y={30} s={0.75} pot={c2} />
          <Books x={56} y={84} n={6} seed={3} />
          <circle cx="32" cy="70" r="12" fill="#5BA9E8" />
          <path d="M24 66 q8 -4 10 4 q4 4 10 0" stroke="#7CC39A" strokeWidth="4" fill="none" />
          <rect x="28" y="82" width="8" height="4" fill={GOLD} />
          <Books x={14} y={124} n={4} seed={5} />
          <rect x="66" y="104" width="34" height="20" rx="3" fill={c2} />
          <rect x="70" y="108" width="26" height="12" rx="2" fill={lt(c2, 0.4)} />
          <rect x="16" y="146" width="40" height="18" rx="3" fill="#F7D9A8" />
          <rect x="62" y="140" width="40" height="24" rx="3" fill="#E8B07C" />
          <rect x="62" y="140" width="40" height="5" fill="#C98A5B" />
        </S>
      );
    case 'k-rack-tv':
      return (
        <S w={170} h={130}>
          <rect x="34" y="4" width="102" height="66" rx="10" fill="#4A4A5A" />
          <rect x="40" y="10" width="90" height="54" rx="6" fill="#6FB7E8" />
          <path d="M44 56 Q70 30 100 46 T128 30 V60 H44 Z" fill="#9FD3F5" />
          <path d="M50 18 L70 18" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
          <rect x="78" y="70" width="14" height="10" fill="#3A3A48" />
          <rect x="4" y="80" width="162" height="9" rx="4" fill={lt(c1, 0.12)} />
          <rect x="8" y="88" width="154" height="30" rx="4" fill={c1} />
          <rect x="14" y="94" width="44" height="18" rx="3" fill={lt(c1, 0.22)} />
          <rect x="63" y="94" width="44" height="18" rx="3" fill={lt(c1, 0.22)} />
          <rect x="112" y="94" width="44" height="18" rx="3" fill={lt(c1, 0.22)} />
          {[36, 85, 134].map((x) => <rect key={x} x={x - 6} y="101" width="12" height="4" rx="2" fill={GOLD} />)}
          <Plant x={154} y={80} s={0.7} pot={c2} />
          <Legs xs={[12, 151]} y={117} h={10} c={dk(c1, 0.35)} />
        </S>
      );
    case 'k-luminaria':
      return (
        <S w={60} h={180}>
          <ellipse cx="30" cy="30" rx="32" ry="22" fill="#FFF3B0" opacity="0.32" />
          <path d="M8 44 L16 10 H44 L52 44 Z" fill={c1} />
          <path d="M8 44 L16 10 H24 L18 44 Z" fill={lt(c1, 0.4)} opacity="0.8" />
          <rect x="8" y="42" width="44" height="4" rx="2" fill={dk(c1, 0.15)} />
          <rect x="28" y="46" width="4" height="120" fill={dk(GOLD, 0.15)} />
          <ellipse cx="30" cy="170" rx="18" ry="6" fill={dk(GOLD, 0.2)} />
          <ellipse cx="30" cy="167" rx="14" ry="4" fill={GOLD} />
        </S>
      );
    case 'k-mesa-jantar':
      return (
        <S w={190} h={130}>
          {/* cadeiras */}
          {[22, 168].map((x) => (
            <g key={x}>
              <rect x={x - 16} y="30" width="32" height="44" rx="10" fill={c2} />
              <rect x={x - 11} y="36" width="22" height="30" rx="7" fill={lt(c2, 0.3)} />
              <rect x={x - 18} y="72" width="36" height="10" rx="4" fill={dk(c2, 0.12)} />
              <rect x={x - 14} y="82" width="6" height="40" rx="2" fill={dk(WOOD)} />
              <rect x={x + 8} y="82" width="6" height="40" rx="2" fill={dk(WOOD)} />
            </g>
          ))}
          {/* mesa com toalha */}
          <ellipse cx="95" cy="52" rx="62" ry="14" fill="#FFFFFF" />
          <path d="M33 52 Q36 86 46 92 Q58 84 70 92 Q82 84 95 92 Q108 84 120 92 Q132 84 144 92 Q154 86 157 52 Z" fill={c1} />
          <path d="M33 52 Q95 74 157 52" fill="none" stroke={lt(c1, 0.35)} strokeWidth="3" />
          <rect x="88" y="90" width="14" height="30" fill={dk(WOOD)} />
          <ellipse cx="95" cy="122" rx="28" ry="6" fill={dk(WOOD, 0.3)} />
          {/* vaso e frutas */}
          <path d="M88 48 H102 L100 32 H90 Z" fill="#BFE3FF" />
          <circle cx="90" cy="24" r="6" fill="#FF8FB4" />
          <circle cx="100" cy="22" r="6" fill="#FFD34D" />
          <circle cx="95" cy="16" r="6" fill="#FF8FB4" />
          <path d="M95 30 V20" stroke="#5FAE84" strokeWidth="2" />
          <ellipse cx="124" cy="48" rx="13" ry="4" fill={lt('#E8B07C', 0.2)} />
          <circle cx="120" cy="44" r="4.5" fill="#F0525F" />
          <circle cx="128" cy="44" r="4.5" fill="#FFB347" />
        </S>
      );
    case 'k-geladeira':
      return (
        <S w={80} h={180}>
          <rect x="6" y="4" width="68" height="166" rx="18" fill={c1} />
          <rect x="6" y="4" width="68" height="166" rx="18" fill="none" stroke={dk(c1, 0.12)} strokeWidth="2" />
          <path d="M6 64 H74" stroke={dk(c1, 0.18)} strokeWidth="3" />
          <rect x="60" y="22" width="5" height="30" rx="2.5" fill="#D6DBE3" />
          <rect x="60" y="76" width="5" height="44" rx="2.5" fill="#D6DBE3" />
          <ellipse cx="22" cy="20" rx="8" ry="20" fill="#FFFFFF" opacity="0.3" />
          <circle cx="26" cy="90" r="6" fill="#F0525F" />
          <path d="M34 100 l6 -10 6 10 Z" fill="#FFD34D" />
          <rect x="22" y="108" width="14" height="10" rx="2" fill="#7CC39A" />
          <rect x="14" y="168" width="10" height="8" rx="2" fill={dk(c1, 0.4)} />
          <rect x="56" y="168" width="10" height="8" rx="2" fill={dk(c1, 0.4)} />
        </S>
      );
    case 'k-fogao':
      return (
        <S w={130} h={140}>
          {/* panela com vapor */}
          <path d="M56 18 q4 -8 0 -16 M66 18 q4 -8 0 -16" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.8" fill="none" strokeLinecap="round" />
          <rect x="44" y="20" width="36" height="20" rx="5" fill={c2} />
          <rect x="40" y="18" width="44" height="5" rx="2.5" fill={dk(c2, 0.15)} />
          <rect x="4" y="38" width="122" height="10" rx="4" fill="#D6DBE3" />
          {[30, 98].map((x) => <ellipse key={x} cx={x} cy="42" rx="12" ry="3" fill="#3A3A48" />)}
          <rect x="8" y="46" width="114" height="84" rx="6" fill={c1} />
          <rect x="16" y="52" width="98" height="10" rx="3" fill={lt(c1, 0.25)} />
          {[30, 52, 74, 96].map((x) => <circle key={x} cx={x} cy="57" r="3.5" fill={dk(c1, 0.25)} />)}
          <rect x="18" y="68" width="94" height="52" rx="6" fill={dk(c1, 0.15)} />
          <rect x="28" y="78" width="74" height="34" rx="5" fill="#3A3A48" />
          <rect x="34" y="84" width="22" height="6" rx="3" fill="#FF9A4D" opacity="0.7" />
          <rect x="30" y="70" width="70" height="5" rx="2.5" fill="#D6DBE3" />
        </S>
      );

    // ---------------- Cantinho do hamster ----------------
    case 'k-torre':
      return (
        <S w={130} h={200}>
          {/* telhadinho */}
          <path d="M56 26 L88 4 L120 26 Z" fill={c2} />
          <path d="M60 26 H116 V54 H60 Z" fill={lt(c1, 0.2)} />
          <path d="M80 54 V40 Q88 30 96 40 V54 Z" fill={dk(c1, 0.4)} />
          {/* postes com corda */}
          {[26, 104].map((x) => (
            <g key={x}>
              <rect x={x - 6} y="54" width="12" height="134" rx="4" fill="#E8C99B" />
              {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${x - 6} ${62 + i * 10} L${x + 6} ${58 + i * 10}`} stroke="#C9A06A" strokeWidth="2" />)}
            </g>
          ))}
          {/* plataformas */}
          <rect x="48" y="52" width="80" height="10" rx="5" fill={c1} />
          <rect x="4" y="104" width="76" height="10" rx="5" fill={c1} />
          <rect x="52" y="146" width="76" height="10" rx="5" fill={c1} />
          <rect x="2" y="186" width="126" height="10" rx="5" fill={dk(c1, 0.12)} />
          {/* escadinha */}
          <path d="M78 156 L96 114 M88 158 L106 116" stroke={WOOD} strokeWidth="3" />
          {[0, 1, 2, 3].map((i) => <path key={i} d={`M${82 + i * 4.5} ${148 - i * 10} H${92 + i * 4.5}`} stroke={WOOD} strokeWidth="3" />)}
          {/* bolinha pendurada */}
          <path d="M30 114 V134" stroke="#8A6A4F" strokeWidth="1.5" />
          <circle cx="30" cy="138" r="7" fill={c2} />
          <path d="M26 135 q4 4 8 0" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
        </S>
      );
    case 'k-casinha':
      return (
        <S w={130} h={120}>
          <path d="M6 54 L65 8 L124 54 Z" fill={c1} />
          {[20, 32, 44].map((y, i) => (
            <path key={y} d={`M${24 - i * 6} ${y + 10} Q${65} ${y - 22 + i * 4} ${106 + i * 6} ${y + 10}`} stroke={dk(c1, 0.15)} strokeWidth="2.5" fill="none" />
          ))}
          <rect x="18" y="50" width="94" height="62" rx="6" fill="#F7D9A8" />
          <rect x="18" y="50" width="94" height="62" rx="6" fill="none" stroke="#E8B07C" strokeWidth="3" />
          <path d="M50 112 V84 Q65 66 80 84 V112 Z" fill="#6A4229" />
          <circle cx="94" cy="72" r="9" fill="#BFE3FF" stroke="#E8B07C" strokeWidth="3" />
          <rect x="22" y="70" width="18" height="8" rx="2" fill={c2} />
          {[25, 31, 37].map((x) => <circle key={x} cx={x} cy="68" r="3" fill={['#FF8FB4', '#FFD34D', '#FF8FB4'][(x - 25) / 6]} />)}
          <rect x="12" y="110" width="106" height="6" rx="3" fill={dk('#E8B07C', 0.15)} />
        </S>
      );
    case 'k-rodinha':
      return (
        <S w={120} h={130}>
          <path d="M30 124 L60 66 L90 124" stroke={dk(c2, 0.25)} strokeWidth="7" fill="none" strokeLinecap="round" />
          <circle cx="60" cy="62" r="54" fill={lt(c1, 0.75)} />
          <circle cx="60" cy="62" r="54" fill="none" stroke={c1} strokeWidth="9" />
          <circle cx="60" cy="62" r="44" fill="none" stroke={lt(c1, 0.4)} strokeWidth="3" strokeDasharray="5 6" />
          {[0, 30, 60, 90, 120, 150].map((a) => (
            <path key={a} d={`M60 62 L${60 + Math.cos((a * Math.PI) / 180) * 50} ${62 + Math.sin((a * Math.PI) / 180) * 50}`} stroke={c1} strokeWidth="3" />
          ))}
          <circle cx="60" cy="62" r="9" fill={c2} />
          <rect x="20" y="120" width="80" height="8" rx="4" fill={dk(c2, 0.2)} />
          <path d="M26 30 A44 44 0 0 1 46 16" stroke="#FFFFFF" strokeWidth="4" fill="none" opacity="0.7" strokeLinecap="round" />
        </S>
      );
    case 'k-tubo':
      return (
        <S w={170} h={100}>
          {Array.from({ length: 7 }, (_, i) => {
            const a = Math.PI - (i * Math.PI) / 6;
            const x = 85 + Math.cos(a) * 64;
            const y = 86 - Math.sin(a) * 64;
            return <circle key={i} cx={x} cy={y} r="18" fill={i % 2 ? c2 : c1} opacity="0.92" />;
          })}
          {Array.from({ length: 7 }, (_, i) => {
            const a = Math.PI - (i * Math.PI) / 6;
            return <circle key={i} cx={85 + Math.cos(a) * 64} cy={86 - Math.sin(a) * 64} r="10" fill="#FFFFFF" opacity="0.28" />;
          })}
          <ellipse cx="21" cy="88" rx="16" ry="10" fill={dk(c1, 0.35)} />
          <ellipse cx="149" cy="88" rx="16" ry="10" fill={dk(c1, 0.35)} />
        </S>
      );
    case 'k-almofada':
      return (
        <S w={130} h={70}>
          <ellipse cx="65" cy="42" rx="62" ry="26" fill={dk(c1, 0.1)} />
          <ellipse cx="65" cy="36" rx="54" ry="20" fill={c1} />
          <ellipse cx="65" cy="38" rx="40" ry="12" fill={lt(c1, 0.35)} />
          <path d="M40 36 q25 10 50 0" stroke={lt(c1, 0.6)} strokeWidth="2" fill="none" />
          <path d="M60 30 c-3 -4 -8 -1 -5 3 l5 5 5 -5 c3 -4 -2 -7 -5 -3 Z" fill={c2} />
        </S>
      );

    // ---------------- Parede ----------------
    case 'k-relogio':
      return (
        <S w={70} h={140}>
          <path d="M6 34 L35 4 L64 34 Z" fill={dk(WOOD, 0.1)} />
          <path d="M2 36 L35 6" stroke={c2} strokeWidth="5" strokeLinecap="round" />
          <path d="M68 36 L35 6" stroke={c2} strokeWidth="5" strokeLinecap="round" />
          <rect x="12" y="32" width="46" height="50" rx="4" fill={WOOD} />
          <circle cx="35" cy="56" r="17" fill="#FFF8EC" stroke={GOLD} strokeWidth="3" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * Math.PI) / 6;
            return <circle key={i} cx={35 + Math.sin(a) * 13} cy={56 - Math.cos(a) * 13} r="1.3" fill={INK} />;
          })}
          <path d="M35 56 V45 M35 56 L43 60" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="35" cy="22" r="6" fill="#3A2A22" />
          <path d="M33 82 V112" stroke={GOLD} strokeWidth="2" />
          <circle cx="33" cy="116" r="7" fill={GOLD} className="room-pendulum" />
          <path d="M22 82 V122 M48 82 V130" stroke="#8A6A4F" strokeWidth="1.5" />
          <rect x="18" y="122" width="8" height="14" rx="3" fill={dk(GOLD, 0.2)} />
          <rect x="44" y="130" width="8" height="10" rx="3" fill={dk(GOLD, 0.2)} />
          <path d="M44 38 l4 -4 2 6" fill={c1} />
        </S>
      );
    case 'k-prateleira':
      return (
        <S w={160} h={80}>
          <Plant x={22} y={58} s={0.75} pot={c2} />
          <Books x={44} y={60} n={5} seed={2} h={24} />
          <rect x="94" y="36" width="22" height="24" rx="6" fill="#BFE3FF" opacity="0.85" />
          <rect x="96" y="32" width="18" height="6" rx="2" fill={c1} />
          {[0, 1, 2].map((i) => <circle key={i} cx={100 + i * 5} cy={50 - (i % 2) * 4} r="3" fill={['#FF8FB4', '#FFD34D', '#7CC39A'][i]} />)}
          <rect x="122" y="34" width="26" height="26" rx="3" fill={GOLD} />
          <rect x="126" y="38" width="18" height="18" rx="2" fill={lt(c1, 0.4)} />
          <path d="M135 52 c-5 -6 -9 -1 -5 3 l5 4 5 -4 c4 -4 0 -9 -5 -3 Z" fill={c1} />
          <rect x="4" y="60" width="152" height="8" rx="3" fill={c1} />
          <rect x="4" y="60" width="152" height="3" rx="1.5" fill={lt(c1, 0.3)} />
          <path d="M20 68 v10 h10 M140 68 v10 h-10" stroke={dk(c1, 0.25)} strokeWidth="4" fill="none" />
        </S>
      );
    case 'k-quadro':
      // c1: moldura, c2: céu do quadro (paisagem)
      return (
        <S w={110} h={90}>
          <rect x="2" y="2" width="106" height="86" rx="6" fill={c1} />
          <rect x="10" y="10" width="90" height="70" rx="3" fill={c2} />
          <circle cx="78" cy="28" r="9" fill="#FFE27A" />
          <path d="M10 64 Q34 42 56 58 T100 50 V80 H10 Z" fill="#7CC39A" />
          <path d="M10 72 Q40 60 64 70 T100 66 V80 H10 Z" fill="#5FAE84" />
          <path d="M28 52 l6 -10 6 10 Z" fill="#FFFFFF" opacity="0.7" />
          <rect x="2" y="2" width="106" height="86" rx="6" fill="none" stroke={lt(c1, 0.3)} strokeWidth="2" />
        </S>
      );
    case 'k-quadro-coracao':
      return (
        <S w={80} h={96}>
          <ellipse cx="40" cy="48" rx="36" ry="44" fill={c1} />
          <ellipse cx="40" cy="48" rx="28" ry="36" fill={c2} />
          <path d="M40 66 C22 54 22 38 32 36 C37 35 39 39 40 41 C41 39 43 35 48 36 C58 38 58 54 40 66 Z" fill={c1} />
          <path d="M14 22 l4 -4 M66 22 l-4 -4" stroke={lt(c1, 0.4)} strokeWidth="3" strokeLinecap="round" />
        </S>
      );
    case 'k-quadro-hami':
      return (
        <S w={84} h={100}>
          <rect x="2" y="2" width="80" height="96" rx="8" fill={c1} />
          <rect x="10" y="10" width="64" height="80" rx="4" fill={c2} />
          <circle cx="30" cy="40" r="7" fill="#E8B07C" />
          <circle cx="54" cy="40" r="7" fill="#E8B07C" />
          <ellipse cx="42" cy="62" rx="24" ry="22" fill="#F2C08C" />
          <ellipse cx="42" cy="70" rx="15" ry="11" fill="#FFF3E2" />
          <circle cx="34" cy="56" r="3" fill={INK} />
          <circle cx="50" cy="56" r="3" fill={INK} />
          <path d="M39 62 h6 l-3 3 Z" fill="#F07A93" />
          <path d="M42 74 c-4 -5 -9 -1 -5 3 l5 4 5 -4 c4 -4 -1 -8 -5 -3 Z" fill="#FF8FB4" />
        </S>
      );
    case 'k-planta-pendurada':
      return (
        <S w={80} h={170}>
          <path d="M40 0 V60 M40 4 L22 70 M40 4 L58 70" stroke="#C9A06A" strokeWidth="2" />
          <path d="M18 66 H62 L56 92 H24 Z" fill={c1} />
          <rect x="16" y="62" width="48" height="8" rx="4" fill={dk(c1, 0.12)} />
          {[[24, 1], [40, 0], [56, 1], [32, 2], [50, 2]].map(([x, k], i) => (
            <g key={i}>
              <path d={`M${x} 70 C${x - 8} ${100 + k * 10} ${x + 6} ${120 + k * 12} ${x - 2} ${150 + k * 6}`} stroke="#5FAE84" strokeWidth="2.5" fill="none" />
              {[0, 1, 2, 3].map((j) => (
                <ellipse key={j} cx={x - 2 + (j % 2 ? 5 : -5)} cy={86 + j * 16 + k * 6} rx="6" ry="4" fill={j % 2 ? '#7CC39A' : '#4F9A63'} transform={`rotate(${j % 2 ? 30 : -30} ${x - 2 + (j % 2 ? 5 : -5)} ${86 + j * 16 + k * 6})`} />
              ))}
            </g>
          ))}
          {[30, 46].map((x) => <ellipse key={x} cx={x} cy="62" rx="10" ry="6" fill="#5FAE84" />)}
        </S>
      );
    case 'k-luminaria-teto':
      return (
        <S w={70} h={130}>
          <path d="M35 0 V70" stroke="#5A4A3E" strokeWidth="2" />
          <ellipse cx="35" cy="108" rx="40" ry="22" fill="#FFF3B0" opacity="0.35" />
          <path d="M10 98 Q10 70 35 70 Q60 70 60 98 Z" fill={c1} />
          <path d="M14 96 Q16 76 28 72" stroke={lt(c1, 0.45)} strokeWidth="3" fill="none" strokeLinecap="round" />
          <ellipse cx="35" cy="98" rx="25" ry="5" fill={dk(c1, 0.15)} />
          <ellipse cx="35" cy="100" rx="9" ry="5" fill="#FFF6C8" />
        </S>
      );
    case 'k-varal':
      return (
        <S w={220} h={70}>
          <path d="M4 10 Q110 46 216 10" stroke="#8A6A4F" strokeWidth="1.8" fill="none" />
          {[30, 70, 110, 150, 190].map((x, i) => {
            const y = 10 + 36 * (1 - Math.pow((x - 110) / 106, 2)) * 0.98;
            return (
              <g key={x} transform={`rotate(${(i - 2) * 5} ${x} ${y})`}>
                <rect x={x - 12} y={y} width="24" height="28" rx="2" fill="#FFFFFF" />
                <rect x={x - 9} y={y + 3} width="18" height="16" rx="1" fill={[c1, '#BFE3FF', c2, '#FFE27A', '#C9F0C9'][i]} />
                <rect x={x - 3} y={y - 3} width="6" height="6" rx="1" fill={dk(WOOD)} />
              </g>
            );
          })}
        </S>
      );

    // ---------------- Chão: plantas, tapetes e fofuras ----------------
    case 'k-planta-grande':
      return (
        <S w={100} h={180}>
          {[
            [-40, 28, '#4F9A63'], [-18, 36, '#5FAE84'], [8, 38, '#7CC39A'], [32, 30, '#4F9A63'], [-30, 52, '#7CC39A'], [22, 54, '#5FAE84'],
          ].map(([a, r, c], i) => {
            const rad = (((a as number) - 90) * Math.PI) / 180;
            const x = 50 + Math.cos(rad) * 70;
            const y = 120 + Math.sin(rad) * 70 + (r as number) * 0.3;
            return (
              <g key={i}>
                <path d={`M50 120 Q${(50 + x) / 2} ${y + 30} ${x} ${y}`} stroke="#3E8C55" strokeWidth="3" fill="none" />
                <path d={`M${x} ${y} c-${r} -6 -${(r as number) * 0.6} -${r} 0 -${(r as number) * 1.2} c${(r as number) * 0.6} ${r} ${r} ${(r as number) * 0.6} 0 ${(r as number) * 1.2} Z`} fill={c as string} transform={`rotate(${a} ${x} ${y})`} />
                <path d={`M${x} ${y} l0 -${(r as number) * 1.1}`} stroke="#FFFFFF" strokeWidth="1.2" opacity="0.4" transform={`rotate(${a} ${x} ${y})`} />
              </g>
            );
          })}
          <path d="M24 124 H76 L70 176 H30 Z" fill={c1} />
          <rect x="20" y="118" width="60" height="10" rx="5" fill={dk(c1, 0.12)} />
          <path d="M30 140 H70" stroke={lt(c1, 0.35)} strokeWidth="3" />
        </S>
      );
    case 'k-vaso-flores':
      return (
        <S w={70} h={100}>
          {[[20, '#FF8FB4'], [35, c2], [50, '#FFD34D'], [28, '#FF6F91'], [44, '#FF8FB4']].map(([x, c], i) => (
            <g key={i}>
              <path d={`M35 62 Q${x} 40 ${x} ${18 + (i % 2) * 10}`} stroke="#5FAE84" strokeWidth="2.5" fill="none" />
              <path d={`M${(x as number) - 6} ${18 + (i % 2) * 10} q6 -14 12 0 q-6 6 -12 0 Z`} fill={c as string} />
              <circle cx={x as number} cy={14 + (i % 2) * 10} r="3" fill={dk(c as string, 0.1)} />
            </g>
          ))}
          <ellipse cx="22" cy="48" rx="8" ry="4" fill="#7CC39A" transform="rotate(-30 22 48)" />
          <ellipse cx="48" cy="46" rx="8" ry="4" fill="#5FAE84" transform="rotate(30 48 46)" />
          <path d="M18 60 H52 Q56 80 46 96 H24 Q14 80 18 60 Z" fill={c1} />
          <path d="M22 66 Q20 80 26 90" stroke={lt(c1, 0.4)} strokeWidth="3" fill="none" strokeLinecap="round" />
        </S>
      );
    case 'k-tapete':
      return (
        <S w={240} h={70}>
          <ellipse cx="120" cy="35" rx="118" ry="33" fill={dk(c1, 0.1)} />
          <ellipse cx="120" cy="34" rx="112" ry="30" fill={c1} />
          <ellipse cx="120" cy="34" rx="88" ry="22" fill={c2} />
          <ellipse cx="120" cy="34" rx="64" ry="15" fill={c1} />
          <ellipse cx="120" cy="34" rx="38" ry="8" fill={lt(c2, 0.2)} />
          {Array.from({ length: 18 }, (_, i) => {
            const a = (i / 18) * Math.PI * 2;
            return <circle key={i} cx={120 + Math.cos(a) * 100} cy={34 + Math.sin(a) * 26} r="3" fill={lt(c1, 0.45)} />;
          })}
        </S>
      );
    case 'k-tapete-retangulo':
      return (
        <S w={260} h={80}>
          <path d="M40 8 H220 L252 70 H8 Z" fill={c1} />
          <path d="M52 16 H208 L234 62 H26 Z" fill={c2} />
          <path d="M70 26 H190 L206 52 H54 Z" fill={lt(c1, 0.25)} />
          <path d="M130 28 L150 39 L130 50 L110 39 Z" fill={c1} />
          {Array.from({ length: 22 }, (_, i) => <path key={i} d={`M${12 + i * 11} 70 v8`} stroke={lt(c2, 0.2)} strokeWidth="2.5" strokeLinecap="round" />)}
        </S>
      );
    case 'k-tapete-coracao':
      return (
        <S w={200} h={80}>
          <path d="M100 76 C36 60 4 40 22 18 C38 0 72 6 100 26 C128 6 162 0 178 18 C196 40 164 60 100 76 Z" fill={c1} />
          <path d="M100 64 C52 52 30 38 42 24 C54 12 78 16 100 32 C122 16 146 12 158 24 C170 38 148 52 100 64 Z" fill={lt(c1, 0.35)} />
          <path d="M100 50 C76 44 66 36 72 30 C78 24 90 26 100 34 C110 26 122 24 128 30 C134 36 124 44 100 50 Z" fill={c2} />
        </S>
      );
    case 'k-ursinho':
      return (
        <S w={90} h={100}>
          <circle cx="24" cy="18" r="11" fill={dk(c1, 0.1)} />
          <circle cx="66" cy="18" r="11" fill={dk(c1, 0.1)} />
          <circle cx="24" cy="18" r="6" fill={lt(c1, 0.35)} />
          <circle cx="66" cy="18" r="6" fill={lt(c1, 0.35)} />
          <ellipse cx="45" cy="76" rx="30" ry="22" fill={c1} />
          <ellipse cx="45" cy="80" rx="17" ry="13" fill={lt(c1, 0.35)} />
          <circle cx="45" cy="36" r="26" fill={c1} />
          <ellipse cx="45" cy="44" rx="11" ry="8" fill={lt(c1, 0.4)} />
          <circle cx="36" cy="33" r="3" fill={INK} />
          <circle cx="54" cy="33" r="3" fill={INK} />
          <ellipse cx="45" cy="41" rx="4" ry="3" fill={INK} />
          <path d="M42 47 q3 3 6 0" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <ellipse cx="20" cy="88" rx="11" ry="9" fill={dk(c1, 0.08)} />
          <ellipse cx="70" cy="88" rx="11" ry="9" fill={dk(c1, 0.08)} />
          <ellipse cx="20" cy="89" rx="6" ry="5" fill={lt(c1, 0.4)} />
          <ellipse cx="70" cy="89" rx="6" ry="5" fill={lt(c1, 0.4)} />
          <path d="M33 60 L45 56 L57 60 L45 64 Z" fill={c2} />
          <path d="M33 54 L45 60 L33 66 Z M57 54 L45 60 L57 66 Z" fill={c2} />
          <circle cx="45" cy="60" r="3" fill={dk(c2, 0.2)} />
        </S>
      );
    case 'k-cesto':
      return (
        <S w={100} h={84}>
          <circle cx="34" cy="30" r="14" fill={c1} />
          <path d="M22 26 q12 -6 24 4 M24 36 q10 -8 22 -2" stroke={lt(c1, 0.4)} strokeWidth="2" fill="none" />
          <circle cx="62" cy="26" r="13" fill={c2} />
          <path d="M52 22 q10 -4 20 6" stroke={lt(c2, 0.4)} strokeWidth="2" fill="none" />
          <path d="M70 36 q14 10 6 30" stroke={c2} strokeWidth="1.5" fill="none" />
          <path d="M6 38 H94 L84 80 H16 Z" fill="#D9A766" />
          {[48, 58, 68].map((y) => <path key={y} d={`M${8 + (y - 38) * 0.2} ${y} H${92 - (y - 38) * 0.2}`} stroke="#B8854A" strokeWidth="2.5" />)}
          {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${16 + i * 10} 40 L${20 + i * 8.5} 78`} stroke="#C9965A" strokeWidth="2" />)}
          <rect x="4" y="34" width="92" height="8" rx="4" fill="#E8BC80" />
        </S>
      );
    case 'k-bau':
      return (
        <S w={140} h={110}>
          <circle cx="44" cy="30" r="12" fill="#FF8FB4" />
          <path d="M62 34 L74 12 L86 34 Z" fill="#FFD34D" />
          <rect x="90" y="18" width="18" height="18" rx="3" fill="#7FB8F0" />
          <path d="M8 36 Q70 8 132 36 V44 H8 Z" fill={dk(c1, 0.1)} />
          <rect x="8" y="42" width="124" height="60" rx="6" fill={c1} />
          <rect x="8" y="42" width="124" height="8" fill={dk(c1, 0.15)} />
          <rect x="16" y="56" width="108" height="38" rx="4" fill={lt(c1, 0.2)} />
          <path d="M60 64 l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1 Z" fill={c2} />
          <rect x="62" y="44" width="16" height="10" rx="2" fill={GOLD} />
          <rect x="10" y="100" width="12" height="6" rx="2" fill={dk(c1, 0.35)} />
          <rect x="118" y="100" width="12" height="6" rx="2" fill={dk(c1, 0.35)} />
        </S>
      );
    case 'k-pufe':
      return (
        <S w={80} h={70}>
          <ellipse cx="40" cy="58" rx="36" ry="10" fill={dk(c1, 0.15)} />
          <rect x="4" y="22" width="72" height="38" rx="16" fill={c1} />
          <ellipse cx="40" cy="22" rx="36" ry="12" fill={lt(c1, 0.25)} />
          <circle cx="40" cy="22" r="3.5" fill={c2} />
          {[16, 28, 52, 64].map((x) => <path key={x} d={`M40 22 L${x} ${x < 40 ? 16 : 28}`} stroke={lt(c1, 0.05)} strokeWidth="1.5" />)}
          <path d="M10 40 H70" stroke={c2} strokeWidth="4" opacity="0.7" />
        </S>
      );
    default:
      return null;
  }
}

/** Onde cada peça fica: na parede, no chão ou estendida no chão (tapetes). */
export const KIT_PLACE: Record<string, Place> = {
  'k-relogio': 'parede',
  'k-prateleira': 'parede',
  'k-quadro': 'parede',
  'k-quadro-coracao': 'parede',
  'k-quadro-hami': 'parede',
  'k-planta-pendurada': 'parede',
  'k-luminaria-teto': 'parede',
  'k-varal': 'parede',
  'k-tapete': 'tapete',
  'k-tapete-retangulo': 'tapete',
  'k-tapete-coracao': 'tapete',
};
