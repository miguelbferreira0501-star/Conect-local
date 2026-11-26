// Mais coleções temáticas da casa, no estilo plano dos quartos ilustrados (sem contorno, luz em cima):
// Assombrado fofo (rosa, abóbora, caldeirão e morcego), Amor (corações, lareira e aquário),
// Festa neon (globo de luz, jukebox e vinil) e Doceria (cama de cupcake, pirulito e donut).
import { S, mix } from './kit';

const dk = (c: string, t = 0.2) => mix(c, '#2B1A14', t);
const lt = (c: string, t = 0.3) => mix(c, '#FFFFFF', t);
const INK = '#3B2A3A';

const starD = (x: number, y: number, r: number) => {
  const p = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${x + Math.cos(a) * rr} ${y + Math.sin(a) * rr}`;
  });
  return `M${p.join(' L')} Z`;
};
const heartD = (x: number, y: number, s: number) =>
  `M${x} ${y + s * 0.9} C${x - s} ${y + s * 0.25} ${x - s} ${y - s * 0.55} ${x - s * 0.45} ${y - s * 0.6} C${x - s * 0.15} ${y - s * 0.62} ${x} ${y - s * 0.35} ${x} ${y - s * 0.2} C${x} ${y - s * 0.35} ${x + s * 0.15} ${y - s * 0.62} ${x + s * 0.45} ${y - s * 0.6} C${x + s} ${y - s * 0.55} ${x + s} ${y + s * 0.25} ${x} ${y + s * 0.9} Z`;

/** Teia de aranha num canto (raio a partir de x,y). */
function Web({ x, y, r, flip }: { x: number; y: number; r: number; flip?: boolean }) {
  const sx = flip ? -1 : 1;
  const angs = [0, 30, 60, 90];
  const pt = (a: number, k: number) => [x + sx * Math.cos((a * Math.PI) / 180) * r * k, y + Math.sin((a * Math.PI) / 180) * r * k];
  return (
    <g stroke="#FFFFFF" strokeWidth="1.6" fill="none" opacity="0.9" strokeLinecap="round">
      {angs.map((a) => {
        const [ex, ey] = pt(a, 1);
        return <path key={a} d={`M${x} ${y} L${ex} ${ey}`} />;
      })}
      {[0.35, 0.65, 0.95].map((k) => (
        <path key={k} d={angs.map((a, i) => `${i ? 'L' : 'M'}${pt(a, k).join(' ')}`).join(' ')} />
      ))}
    </g>
  );
}

/** Abóbora fofa com carinha (opcional chapéu de bruxa). */
function Pumpkin({ x, y, r, c = '#F28AAE', hat }: { x: number; y: number; r: number; c?: string; hat?: boolean }) {
  return (
    <g>
      <ellipse cx={x - r * 0.45} cy={y} rx={r * 0.62} ry={r * 0.82} fill={dk(c, 0.06)} />
      <ellipse cx={x + r * 0.45} cy={y} rx={r * 0.62} ry={r * 0.82} fill={dk(c, 0.06)} />
      <ellipse cx={x} cy={y} rx={r * 0.7} ry={r * 0.86} fill={c} />
      <path d={`M${x - r * 0.4} ${y - r * 0.15} l${r * 0.16} ${-r * 0.2} l${r * 0.16} ${r * 0.2} Z M${x + r * 0.08} ${y - r * 0.15} l${r * 0.16} ${-r * 0.2} l${r * 0.16} ${r * 0.2} Z`} fill="#FFFFFF" />
      <path d={`M${x - r * 0.42} ${y + r * 0.2} Q${x} ${y + r * 0.58} ${x + r * 0.42} ${y + r * 0.2} Q${x} ${y + r * 0.34} ${x - r * 0.42} ${y + r * 0.2} Z`} fill="#FFFFFF" />
      {hat ? (
        <g>
          <ellipse cx={x} cy={y - r * 0.78} rx={r * 1.05} ry={r * 0.2} fill="#2B2340" />
          <path d={`M${x - r * 0.55} ${y - r * 0.8} Q${x - r * 0.1} ${y - r * 1.9} ${x + r * 0.6} ${y - r * 2.05} Q${x + r * 0.2} ${y - r * 1.5} ${x + r * 0.5} ${y - r * 0.8} Z`} fill="#2B2340" />
          <rect x={x - r * 0.52} y={y - r * 1.02} width={r * 1.02} height={r * 0.16} fill="#E85A8A" />
        </g>
      ) : (
        <rect x={x - r * 0.08} y={y - r * 1.05} width={r * 0.16} height={r * 0.3} rx={r * 0.06} fill="#5E8C4A" />
      )}
    </g>
  );
}

export function ThemeKit2({ id, c1, c2 }: { id: string; c1: string; c2: string }) {
  switch (id) {
    /* ===================== Assombrado fofo ===================== */
    case 'k-ass-cama':
      return (
        <S w={200} h={150}>
          <path d="M14 140 V44 Q14 10 58 12 Q100 -6 142 12 Q186 10 186 44 V140 Z" fill={c1} />
          <path d="M26 46 Q26 24 60 24 Q100 10 140 24 Q174 24 174 46" stroke={lt(c1, 0.3)} strokeWidth="5" fill="none" strokeLinecap="round" />
          <Web x={186} y={14} r={40} flip />
          <Web x={16} y={18} r={30} />
          <rect x="8" y="92" width="184" height="26" rx="12" fill="#F7EEF4" />
          <rect x="30" y="74" width="62" height="26" rx="12" fill={c2} transform="rotate(-8 61 87)" />
          <path d="M48 82 l5 -5 l5 5 Z M66 80 l5 -5 l5 5 Z" fill="#FFFFFF" transform="rotate(-8 61 87)" />
          <path d="M50 92 q11 6 22 0" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" transform="rotate(-8 61 87)" />
          <path d="M70 100 H192 V128 Q192 138 182 138 H70 Z" fill="#2B2340" />
          <path d="M70 100 H192 V108 H70 Z" fill="#3D3358" />
          <path d="M150 116 a8 8 0 1 0 8 10 a6 6 0 1 1 -8 -10 Z" fill="#FFF3B0" />
          {[[90, 118, 3.4], [112, 128, 2.6], [128, 114, 3], [176, 126, 2.6], [100, 108 + 22, 2]].map(([x, y, r], i) => (
            <path key={i} d={starD(x, y, r * 1.6)} fill="#FFFFFF" />
          ))}
          <rect x="8" y="118" width="62" height="20" rx="8" fill={dk(c1, 0.08)} />
          <rect x="88" y="136" width="18" height="6" rx="2" fill="#F2C14E" />
          <rect x="16" y="138" width="10" height="10" rx="3" fill={dk(c1, 0.3)} />
          <rect x="174" y="138" width="10" height="10" rx="3" fill={dk(c1, 0.3)} />
        </S>
      );
    case 'k-ass-lareira':
      return (
        <S w={170} h={160}>
          <rect x="6" y="54" width="158" height="16" rx="4" fill="#E9B98A" />
          {[18, 52, 86, 120].map((x) => (
            <rect key={x} x={x} y="56" width="30" height="12" rx="2" fill="#F2C99E" />
          ))}
          <rect x="14" y="70" width="142" height="80" fill={c1} />
          {Array.from({ length: 5 }, (_, r) =>
            Array.from({ length: 5 }, (_, k) => <rect key={`${r}-${k}`} x={16 + k * 28 + (r % 2 ? 14 : 0)} y={74 + r * 15} width="24" height="11" rx="2" fill={lt(c1, 0.12)} />),
          )}
          <path d="M48 150 V112 Q48 90 85 90 Q122 90 122 112 V150 Z" fill="#3A2238" />
          <path d="M66 148 Q60 128 74 116 Q74 128 82 130 Q80 112 92 102 Q92 120 102 126 Q110 116 106 106 Q120 124 106 148 Z" fill="#FF9A3D" />
          <path d="M76 148 Q72 134 82 128 Q84 138 90 138 Q90 128 98 122 Q104 136 96 148 Z" fill="#FFD34D" />
          <rect x="40" y="146" width="90" height="10" rx="3" fill="#E9B98A" />
          <path d="M120 72 l10 6 l-6 10 M30 120 l-8 8" stroke={dk(c1, 0.25)} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <Pumpkin x={48} y={38} r={17} c={c2} hat />
        </S>
      );
    case 'k-ass-caldeirao':
      return (
        <S w={110} h={120}>
          <path className="ki-steam" d="M50 46 Q40 32 52 22 Q62 12 54 2 M64 44 Q74 34 66 24" stroke={lt(c2, 0.2)} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.85" />
          {[[34, 30], [78, 22], [86, 40]].map(([x, y], i) => (
            <path key={i} d={starD(x, y, 4)} fill="#FFE27A" />
          ))}
          <ellipse cx="55" cy="56" rx="44" ry="11" fill="#2B2632" />
          <ellipse cx="55" cy="56" rx="36" ry="7" fill={c2} />
          <circle cx="44" cy="54" r="4" fill={lt(c2, 0.4)} />
          <circle cx="62" cy="56" r="3" fill={lt(c2, 0.4)} />
          <path d="M14 60 Q8 108 55 110 Q102 108 96 60 Z" fill="#2E2A36" />
          <path d="M24 66 Q22 92 40 100" stroke="#45404F" strokeWidth="5" fill="none" strokeLinecap="round" />
          <rect x="22" y="104" width="12" height="12" rx="3" fill="#2B2632" />
          <rect x="76" y="104" width="12" height="12" rx="3" fill="#2B2632" />
          <ellipse cx="8" cy="66" rx="6" ry="9" fill="none" stroke="#2B2632" strokeWidth="4" />
          <ellipse cx="102" cy="66" rx="6" ry="9" fill="none" stroke="#2B2632" strokeWidth="4" />
        </S>
      );
    case 'k-ass-lustre':
      return (
        <S w={160} h={130}>
          <rect x="78" y="0" width="4" height="40" fill={dk(c1, 0.15)} />
          <path d="M80 70 Q40 74 26 54 M80 70 Q120 74 134 54 M80 70 Q58 78 54 60 M80 70 Q102 78 106 60" stroke={c1} strokeWidth="6" fill="none" strokeLinecap="round" />
          <ellipse cx="80" cy="72" rx="12" ry="8" fill={c1} />
          <path d="M70 46 H90 L84 66 H76 Z" fill={c1} />
          {[26, 54, 106, 134].map((x, i) => (
            <g key={x}>
              <rect x={x - 9} y={i % 3 ? 58 : 52} width="18" height="6" rx="2" fill={dk(c1, 0.1)} />
              <rect x={x - 6} y={(i % 3 ? 58 : 52) - 30} width="12" height="30" rx="2" fill="#FBF6EC" />
              <path className="ki-flame" d={`M${x} ${(i % 3 ? 58 : 52) - 44} Q${x + 6} ${(i % 3 ? 58 : 52) - 36} ${x} ${(i % 3 ? 58 : 52) - 31} Q${x - 6} ${(i % 3 ? 58 : 52) - 36} ${x} ${(i % 3 ? 58 : 52) - 44} Z`} fill="#FFB43A" />
            </g>
          ))}
        </S>
      );
    case 'k-ass-relogio':
      return (
        <S w={150} h={90}>
          <path d="M50 42 Q30 18 4 26 Q14 34 12 44 Q22 40 28 50 Q34 44 44 52 Z" fill="#2B2340" />
          <path d="M100 42 Q120 18 146 26 Q136 34 138 44 Q128 40 122 50 Q116 44 106 52 Z" fill="#2B2340" />
          <path d="M60 14 l4 -12 l8 10 Z M90 14 l-4 -12 l-8 10 Z" fill="#2B2340" />
          <circle cx="75" cy="46" r="34" fill={c1} />
          <circle cx="75" cy="46" r="27" fill="#FFFFFF" />
          <path d="M75 46 L75 28 M75 46 L88 54" stroke={INK} strokeWidth="4" strokeLinecap="round" />
          <circle cx="75" cy="46" r="3.5" fill={INK} />
        </S>
      );
    case 'k-ass-tapete':
      return (
        <S w={220} h={100}>
          <path d="M110 6 C40 6 8 30 8 52 C8 70 30 78 52 80 L60 96 H160 L168 80 C190 78 212 70 212 52 C212 30 180 6 110 6 Z" fill={c1} />
          <path d="M110 14 C50 14 20 34 20 52 C20 66 38 72 60 74 L66 88 H154 L160 74 C182 72 200 66 200 52 C200 34 170 14 110 14 Z" fill="#FFFFFF" />
          <ellipse cx="78" cy="48" rx="20" ry="14" fill="#2B2340" />
          <ellipse cx="142" cy="48" rx="20" ry="14" fill="#2B2340" />
          <path d="M104 66 L110 56 L116 66 Z" fill="#2B2340" />
          {[86, 102, 118, 134].map((x) => (
            <rect key={x} x={x - 6} y="76" width="12" height="10" rx="2" fill="#EEE6EE" />
          ))}
        </S>
      );
    case 'k-ass-quadro':
      return (
        <S w={90} h={110}>
          <ellipse cx="45" cy="55" rx="42" ry="52" fill={c1} />
          <ellipse cx="45" cy="55" rx="33" ry="42" fill="#FBE6EF" />
          <path d="M28 82 Q26 44 45 38 Q64 44 62 82 l-6 -6 l-6 6 l-5 -6 l-5 6 l-6 -6 Z" fill="#FFFFFF" />
          <circle cx="39" cy="58" r="3.4" fill={INK} />
          <circle cx="51" cy="58" r="3.4" fill={INK} />
          <ellipse cx="45" cy="66" rx="3" ry="2.4" fill={INK} />
          <ellipse cx="34" cy="64" rx="3.4" ry="2.2" fill="#FFB3C7" />
          <ellipse cx="56" cy="64" rx="3.4" ry="2.2" fill="#FFB3C7" />
          {[[45, 4], [10, 30], [80, 30], [10, 80], [80, 80], [45, 106]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4" fill={lt(c1, 0.3)} />
          ))}
        </S>
      );

    /* ===================== Amor ===================== */
    case 'k-amor-cama':
      return (
        <S w={200} h={140}>
          <rect x="10" y="10" width="180" height="96" rx="16" fill={c1} />
          {Array.from({ length: 3 }, (_, r) =>
            Array.from({ length: 6 }, (_, k) => <circle key={`${r}-${k}`} cx={30 + k * 28 + (r % 2 ? 14 : 0)} cy={30 + r * 20} r="3" fill="#FFFFFF" opacity="0.85" />),
          )}
          <rect x="6" y="80" width="188" height="24" rx="11" fill="#FBF3F3" />
          <rect x="20" y="66" width="56" height="22" rx="10" fill="#FFFFFF" />
          <path d="M60 92 H194 V122 Q194 132 184 132 H60 Z" fill={c2} />
          <path d="M60 92 H194 V100 H60 Z" fill={lt(c2, 0.25)} />
          <path d={heartD(150, 114, 8)} fill={lt(c2, 0.4)} />
          <rect x="6" y="104" width="54" height="26" rx="9" fill={dk(c2, 0.05)} />
          <rect x="14" y="130" width="10" height="8" rx="3" fill={dk(c1, 0.3)} />
          <rect x="176" y="130" width="10" height="8" rx="3" fill={dk(c1, 0.3)} />
        </S>
      );
    case 'k-amor-lareira':
      return (
        <S w={170} h={160}>
          <rect x="34" y="8" width="56" height="44" rx="22" fill="#CFEFFF" opacity="0.85" />
          <path d="M40 36 Q62 46 84 36 V40 Q84 52 62 52 Q40 52 40 40 Z" fill="#7FD3F0" opacity="0.8" />
          <path d="M60 30 q8 -6 14 0 q-6 6 -14 0 Z M74 30 l6 -4 l0 8 Z" fill="#FF6F61" />
          <path d="M46 50 q-2 -10 3 -16 M52 50 q2 -8 -2 -14" stroke="#4FB36A" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <rect x="8" y="52" width="154" height="14" rx="4" fill={dk(c1, 0.05)} />
          <rect x="16" y="66" width="138" height="78" fill={c1} />
          {[[30, 82], [30, 108], [140, 82], [140, 108]].map(([x, y], i) => (
            <g key={i} stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.9">
              <path d={`M${x - 6} ${y} H${x + 6} M${x} ${y - 6} V${y + 6} M${x - 4} ${y - 4} L${x + 4} ${y + 4} M${x + 4} ${y - 4} L${x - 4} ${y + 4}`} />
            </g>
          ))}
          <rect x="50" y="88" width="70" height="56" rx="4" fill="#3C2A2E" />
          <path d="M66 142 Q62 124 74 114 Q76 126 84 126 Q84 110 96 102 Q100 120 104 126 Q112 120 108 142 Z" fill="#FF9A3D" />
          <path d="M76 142 Q74 132 82 128 Q86 136 92 134 Q94 126 100 124 Q104 136 98 142 Z" fill="#FFD34D" />
          <rect x="44" y="140" width="82" height="10" rx="3" fill={dk(c1, 0.12)} />
          <rect x="10" y="144" width="150" height="10" rx="3" fill={dk(c1, 0.2)} />
        </S>
      );
    case 'k-amor-estante':
      return (
        <S w={90} h={150}>
          <path d="M14 146 L28 8 M76 146 L62 8" stroke={c1} strokeWidth="8" strokeLinecap="round" />
          {[44, 84, 124].map((y) => (
            <rect key={y} x="14" y={y} width="62" height="7" rx="2" fill={dk(c1, 0.12)} />
          ))}
          <rect x="30" y="22" width="9" height="22" rx="2" fill="#5E8C4A" />
          <rect x="41" y="18" width="9" height="26" rx="2" fill="#F2C14E" />
          <rect x="52" y="26" width="10" height="18" rx="2" fill="#E8736A" transform="rotate(10 57 35)" />
          <rect x="24" y="64" width="40" height="8" rx="2" fill="#4A7FC1" />
          <rect x="22" y="72" width="44" height="12" rx="2" fill="#F2C14E" />
          <path d="M34 124 Q30 100 40 96 Q46 104 44 124 Z M46 124 Q48 104 58 100 Q60 110 52 124 Z" fill="#6CB85C" />
          <rect x="32" y="112" width="26" height="12" rx="3" fill="#E88A5A" />
        </S>
      );
    case 'k-amor-lustre':
      return (
        <S w={140} h={120}>
          <rect x="68" y="0" width="4" height="34" fill="#FFFFFF" opacity="0.9" />
          <path d="M28 34 H112 L120 60 H20 Z" fill={c1} />
          <rect x="20" y="58" width="100" height="6" rx="2" fill={dk(c1, 0.12)} />
          {Array.from({ length: 13 }, (_, i) => (
            <rect key={i} x={24 + i * 7.4} y="64" width="2.6" height={40 + (i % 2) * 6} fill="#FFFFFF" opacity="0.85" />
          ))}
          <path d="M34 40 H106" stroke={lt(c1, 0.3)} strokeWidth="3" strokeLinecap="round" />
        </S>
      );
    case 'k-amor-tapete':
      return (
        <S w={220} h={80}>
          <ellipse cx="110" cy="40" rx="106" ry="36" fill={c1} />
          <ellipse cx="110" cy="40" rx="86" ry="28" fill={c2} />
          <ellipse cx="110" cy="40" rx="64" ry="20" fill={c1} />
          <ellipse cx="110" cy="40" rx="42" ry="12" fill={lt(c2, 0.15)} />
          <ellipse cx="110" cy="40" rx="20" ry="5" fill={c1} />
        </S>
      );
    case 'k-amor-almofadas':
      return (
        <S w={140} h={70}>
          <path d={starD(44, 40, 30)} fill={c1} transform="rotate(-12 44 40)" />
          <path d={starD(98, 42, 28)} fill={c2} transform="rotate(14 98 42)" />
          <circle cx="44" cy="40" r="4" fill={lt(c1, 0.3)} />
          <circle cx="98" cy="42" r="4" fill={lt(c2, 0.3)} />
        </S>
      );
    case 'k-amor-prateleira':
      return (
        <S w={180} h={110}>
          <rect x="10" y="50" width="160" height="8" rx="3" fill="#B98A5A" />
          <path d="M20 58 Q60 70 100 62 Q140 56 166 66" stroke="#8B6A4A" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M10 46 Q60 58 110 46 Q150 38 170 48" stroke="#5E4A3A" strokeWidth="1.6" fill="none" />
          {[20, 40, 60, 80, 100, 120, 140, 160].map((x, i) => (
            <circle key={x} cx={x} cy={i % 2 ? 50 : 52} r="2.6" fill="#FFE27A" />
          ))}
          <rect x="26" y="34" width="22" height="16" rx="3" fill="#E88A5A" />
          <path d="M30 34 Q22 16 34 8 Q36 22 37 34 Z M37 34 Q38 12 50 6 Q50 22 44 34 Z" fill="#4FA35A" />
          <rect x="70" y="30" width="12" height="20" rx="2" fill="#FBF6EC" />
          <rect x="86" y="24" width="12" height="26" rx="2" fill={c1} />
          <path d="M76 24 q3 -6 0 -10 q-3 4 0 10 Z M92 18 q3 -6 0 -10 q-3 4 0 10 Z" fill="#FFB43A" />
          <path d="M60 58 V76 M120 60 V82" stroke="#E6D3B0" strokeWidth="1.6" />
          <path d="M64 82 a8 8 0 1 1 -8 -8 a6 6 0 1 0 8 8 Z" fill="#FFE27A" />
          <path d={starD(120, 90, 8)} fill="#FFE27A" />
        </S>
      );

    /* ===================== Festa neon ===================== */
    case 'k-neon-cama':
      return (
        <S w={200} h={140}>
          <rect x="10" y="14" width="180" height="90" rx="12" fill={c1} />
          <rect x="10" y="14" width="180" height="90" rx="12" fill="none" stroke={c2} strokeWidth="4" />
          <rect x="22" y="60" width="54" height="30" rx="5" fill="#F4F6FF" />
          <rect x="82" y="60" width="54" height="30" rx="5" fill="#F4F6FF" />
          {[36, 62, 96, 122].map((x) => (
            <g key={x}>
              <circle cx={x} cy="76" r="7" fill="#F2C14E" />
              <circle cx={x} cy="76" r="3" fill="#3A3F7A" />
            </g>
          ))}
          <path d="M6 92 H194 V124 Q194 134 184 134 H16 Q6 134 6 124 Z" fill="#4630A8" />
          <path d="M6 92 H194 V100 H6 Z" fill="#8FC6FF" />
          {[40, 80, 120, 160].map((x) => (
            <path key={x} d={`M${x} 100 V134`} stroke="#6E5BE0" strokeWidth="3" />
          ))}
          <path d="M6 116 H194" stroke="#6E5BE0" strokeWidth="3" />
          <path d="M6 134 H194" stroke={c2} strokeWidth="4" strokeLinecap="round" />
        </S>
      );
    case 'k-neon-som':
      return (
        <S w={190} h={150}>
          <rect x="54" y="4" width="82" height="52" rx="8" fill="#34407A" stroke="#E86A5A" strokeWidth="3" />
          <rect x="62" y="12" width="66" height="36" rx="4" fill="#1D2450" />
          {[0, 1, 2, 3].map((r) => (
            <rect key={r} x="66" y={16 + r * 8} width={20 + ((r * 13) % 30)} height="4" rx="2" fill={['#7CFFB2', '#F2C14E', '#FF6F8A', '#7CE7FF'][r]} />
          ))}
          {[0, 1, 2].map((r) => (
            <circle key={r} cx="118" cy={20 + r * 10} r="3" fill={['#7CFFB2', '#FF6F8A', '#F2C14E'][r]} />
          ))}
          <rect x="8" y="58" width="174" height="10" rx="3" fill="#1D2450" />
          <rect x="12" y="68" width="166" height="70" rx="6" fill={c1} />
          {[42, 148].map((x) => (
            <g key={x}>
              <circle cx={x} cy="96" r="22" fill="#26306A" />
              <circle cx={x} cy="96" r="13" fill={c2} opacity="0.85" />
              <circle cx={x} cy="96" r="5" fill="#26306A" />
            </g>
          ))}
          <rect x="70" y="76" width="50" height="40" rx="4" fill="#26306A" />
          {Array.from({ length: 7 }, (_, i) => (
            <rect key={i} className="ki-eq" style={{ animationDelay: `${i * 0.12}s` }} x={74 + i * 6.4} y={96 - (i % 3) * 6} width="4" height={16 + (i % 3) * 6} rx="1" fill={c2} />
          ))}
          <rect x="14" y="138" width="162" height="8" rx="3" fill="#F2E07A" />
        </S>
      );
    case 'k-neon-jukebox':
      return (
        <S w={100} h={150}>
          <path d="M8 146 V50 Q8 6 50 6 Q92 6 92 50 V146 Z" fill="#3A3F9A" />
          <path d="M16 146 V52 Q16 14 50 14 Q84 14 84 52 V146 Z" fill={c1} />
          <path d="M24 52 Q24 24 50 24 Q76 24 76 52 Z" fill="#B79CF2" />
          <rect x="22" y="56" width="56" height="14" rx="3" fill="#1D2450" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={26 + i * 8.6} y="60" width="5" height="6" rx="1" fill="#F4F6FF" />
          ))}
          <path d="M26 76 Q26 70 50 70 Q74 70 74 76 V100 Q74 108 50 108 Q26 108 26 100 Z" fill="#1D2450" />
          {Array.from({ length: 5 }, (_, i) => (
            <path key={i} d={`M${30 + i * 10} 76 V104`} stroke="#4E56A8" strokeWidth="3" />
          ))}
          <rect x="22" y="112" width="56" height="8" rx="3" fill={c2} />
          {Array.from({ length: 6 }, (_, i) => (
            <rect key={i} x={28 + i * 8} y="124" width="4" height="18" rx="2" fill="#F4F6FF" />
          ))}
        </S>
      );
    case 'k-neon-globo':
      return (
        <S w={100} h={140}>
          <rect x="48" y="0" width="4" height="40" fill={c2} />
          <circle cx="50" cy="88" r="44" fill="#6FA8E8" />
          {Array.from({ length: 7 }, (_, r) =>
            Array.from({ length: 7 }, (_, k) => {
              const x = 14 + k * 12;
              const y = 52 + r * 12;
              if ((x + 6 - 50) ** 2 + (y + 6 - 88) ** 2 > 40 ** 2) return null;
              return <rect key={`${r}-${k}`} x={x} y={y} width="11" height="11" rx="1.5" fill={(r + k) % 2 ? c2 : lt('#6FA8E8', 0.35)} opacity="0.9" />;
            }),
          )}
          <path d="M24 72 Q30 58 44 54" stroke="#FFFFFF" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8" />
        </S>
      );
    case 'k-neon-letreiro':
      return (
        <S w={150} h={110}>
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M28 78 V56 Q28 14 75 14 Q122 14 122 56 V78" stroke={c1} strokeWidth="7" opacity="0.35" />
            <path d="M28 78 V56 Q28 14 75 14 Q122 14 122 56 V78" stroke={lt(c1, 0.4)} strokeWidth="3.4" />
            <rect x="16" y="60" width="22" height="34" rx="10" stroke={lt(c1, 0.4)} strokeWidth="3.4" />
            <rect x="112" y="60" width="22" height="34" rx="10" stroke={lt(c1, 0.4)} strokeWidth="3.4" />
            <path d="M46 62 H104 Q104 80 90 80 H60 Q46 80 46 62 Z" stroke={c2} strokeWidth="3.4" />
            <path d="M52 68 H98 M54 74 H96" stroke={lt(c2, 0.3)} strokeWidth="2.4" />
          </g>
        </S>
      );
    case 'k-neon-disco':
      return (
        <S w={220} h={90}>
          <ellipse cx="110" cy="45" rx="104" ry="40" fill={c1} />
          {[88, 70, 52].map((rx) => (
            <ellipse key={rx} cx="110" cy="45" rx={rx} ry={rx * 0.38} fill="none" stroke={lt(c1, 0.12)} strokeWidth="2" />
          ))}
          <ellipse cx="110" cy="45" rx="30" ry="12" fill={c2} />
          <ellipse cx="110" cy="45" rx="10" ry="4" fill="#1D2450" />
          <path d="M40 30 Q70 14 110 12" stroke="#FFFFFF" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.35" />
        </S>
      );
    case 'k-neon-microfone':
      return (
        <S w={60} h={150}>
          <path d="M30 40 L30 120 M30 120 L10 146 M30 120 L50 146 M30 120 V146" stroke="#2B2F44" strokeWidth="4" strokeLinecap="round" />
          <path d="M30 40 L40 18" stroke="#2B2F44" strokeWidth="4" strokeLinecap="round" />
          <rect x="34" y="2" width="16" height="26" rx="8" fill="#2B2F44" transform="rotate(22 42 15)" />
          <rect x="35" y="4" width="14" height="12" rx="7" fill={c1} transform="rotate(22 42 15)" />
        </S>
      );

    /* ===================== Doceria ===================== */
    case 'k-doce-cama':
      return (
        <S w={200} h={150}>
          <path d="M14 70 Q8 40 40 34 Q48 10 80 16 Q100 0 120 16 Q152 10 160 34 Q192 40 186 70 Z" fill={c2} />
          <path d="M20 62 Q22 46 44 44 Q54 26 80 30 Q100 18 120 30 Q146 26 156 44 Q178 46 180 62" stroke="#FFFFFF" strokeWidth="5" fill="none" opacity="0.7" strokeLinecap="round" />
          {[[50, 50, '#FFE27A'], [76, 36, '#7FD3F0'], [104, 30, '#FFFFFF'], [130, 40, '#7CC765'], [150, 54, '#FF8FB8'], [64, 58, '#B79CF2']].map(([x, y, c], i) => (
            <rect key={i} x={x as number} y={y as number} width="9" height="3.4" rx="1.7" fill={c as string} transform={`rotate(${i * 37} ${(x as number) + 4} ${y as number})`} />
          ))}
          <circle cx="100" cy="8" r="9" fill="#E8344A" />
          <path d="M100 0 Q104 -8 112 -10" stroke="#5E8C4A" strokeWidth="2.4" fill="none" />
          <circle cx="96" cy="5" r="2.6" fill="#FFFFFF" opacity="0.7" />
          <rect x="8" y="84" width="184" height="22" rx="10" fill="#FFF7EC" />
          <rect x="28" y="70" width="56" height="22" rx="10" fill="#FFFFFF" />
          <path d="M10 98 L24 148 H176 L190 98 Z" fill={c1} />
          {Array.from({ length: 9 }, (_, i) => (
            <path key={i} d={`M${22 + i * 19} 100 L${30 + i * 17.4} 146`} stroke={lt(c1, 0.35)} strokeWidth="5" />
          ))}
          <path d="M60 94 H192 V112 Q192 118 186 118 H66 Q60 118 60 112 Z" fill={lt(c2, 0.2)} />
        </S>
      );
    case 'k-doce-pirulito':
      return (
        <S w={70} h={150}>
          <rect x="32" y="50" width="6" height="90" rx="3" fill="#FFFFFF" />
          <ellipse cx="35" cy="142" rx="22" ry="6" fill={dk(c1, 0.2)} />
          <circle cx="35" cy="34" r="30" fill={c1} />
          <path d="M35 34 m-22 0 a22 22 0 1 1 22 22 a16 16 0 1 1 -16 -16 a10 10 0 1 1 10 10" stroke={c2} strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M16 18 Q24 8 36 6" stroke="#FFFFFF" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7" />
          <path d="M28 58 l7 6 l7 -6" stroke={c2} strokeWidth="3" fill="none" strokeLinecap="round" />
        </S>
      );
    case 'k-doce-estante':
      return (
        <S w={130} h={150}>
          <rect x="6" y="10" width="118" height="136" rx="8" fill={c1} />
          <rect x="14" y="18" width="102" height="120" rx="4" fill={lt(c1, 0.5)} />
          {[74, 132].map((y) => (
            <rect key={y} x="10" y={y} width="110" height="8" rx="2" fill={dk(c1, 0.08)} />
          ))}
          {[[36, 40], [80, 40], [36, 98], [80, 98]].map(([x, y], i) => (
            <g key={i}>
              <rect x={x - 16} y={y - 14} width="32" height="40" rx="8" fill="#E8F6FF" opacity="0.85" />
              <rect x={x - 12} y={y - 20} width="24" height="8" rx="3" fill={i % 2 ? c2 : '#FFB3CF'} />
              {[[-6, 6], [5, 10], [-2, 16], [7, 18], [-8, 18]].map(([dx, dy], j) => (
                <circle key={j} cx={x + dx} cy={y + dy} r="4.4" fill={['#FF8FB8', '#FFE27A', '#7FD3F0', '#7CC765', '#B79CF2'][(i + j) % 5]} />
              ))}
            </g>
          ))}
        </S>
      );
    case 'k-doce-tapete':
      return (
        <S w={210} h={90}>
          <ellipse cx="105" cy="45" rx="100" ry="40" fill="#E2A15E" />
          <path d="M14 42 Q20 14 105 10 Q190 14 196 42 Q186 52 170 46 Q156 60 136 50 Q120 62 104 52 Q86 62 70 50 Q50 60 38 48 Q22 54 14 42 Z" fill={c1} />
          <ellipse cx="105" cy="40" rx="30" ry="11" fill="#C9844A" />
          <ellipse cx="105" cy="38" rx="24" ry="8" fill="#F5E1C8" />
          {[[44, 30, 20], [68, 22, -30], [140, 22, 40], [162, 32, -20], [56, 40, 70], [150, 42, 10], [90, 18, 60], [122, 18, -50]].map(([x, y, a], i) => (
            <rect key={i} x={x} y={y} width="10" height="3.4" rx="1.7" fill={['#FFFFFF', '#FFE27A', '#7FD3F0', '#7CC765'][i % 4]} transform={`rotate(${a} ${x + 5} ${y})`} />
          ))}
        </S>
      );
    case 'k-doce-relogio':
      return (
        <S w={100} h={100}>
          <circle cx="50" cy="50" r="46" fill="#E2A15E" />
          <circle cx="50" cy="50" r="38" fill={lt('#E2A15E', 0.35)} />
          {[[30, 30], [70, 34], [28, 66], [72, 70], [50, 80], [50, 20]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4.4" fill="#6B4A3A" />
          ))}
          <path d="M50 50 V28 M50 50 L64 58" stroke={c1} strokeWidth="5" strokeLinecap="round" />
          <circle cx="50" cy="50" r="4" fill={c1} />
        </S>
      );
    case 'k-doce-guirlanda':
      return (
        <S w={210} h={70}>
          <path d="M4 10 Q105 50 206 10" stroke="#FFFFFF" strokeWidth="2.4" fill="none" />
          {[[24, 18], [62, 30], [105, 34], [148, 30], [186, 18]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y + 8}) rotate(${(i - 2) * 8})`}>
              <path d="M-16 -6 L-8 0 L-16 6 Z M16 -6 L8 0 L16 6 Z" fill={i % 2 ? c2 : c1} />
              <ellipse cx="0" cy="0" rx="10" ry="8" fill={i % 2 ? c1 : c2} />
              <path d="M-5 -6 Q0 0 -5 6 M3 -7 Q8 0 3 7" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.8" />
            </g>
          ))}
        </S>
      );
    default:
      return null;
  }
}
