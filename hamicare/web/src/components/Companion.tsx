// Desenhos dos pets companheiros e do ovo misterioso (quadro 100 x 100, chão em y = 93).
import type { Companion, CompanionKind } from '../data/companions';

const INK = '#2B2224';

function Eyes({ y, dx = 10, cx = 50, r = 4, white }: { y: number; dx?: number; cx?: number; r?: number; white?: boolean }) {
  return (
    <g>
      {[-1, 1].map((s) => (
        <g key={s}>
          {white && <circle cx={cx + s * dx} cy={y} r={r * 1.45} fill="#FFFFFF" />}
          <ellipse cx={cx + s * dx} cy={y} rx={r} ry={r * 1.15} fill={INK} />
          <circle cx={cx + s * dx + r * 0.32} cy={y - r * 0.4} r={r * 0.38} fill="#FFFFFF" />
        </g>
      ))}
    </g>
  );
}
const Blush = ({ y, dx = 18, cx = 50 }: { y: number; dx?: number; cx?: number }) => (
  <g fill="#FF8FA8" opacity="0.55">
    <ellipse cx={cx - dx} cy={y} rx="5" ry="3" />
    <ellipse cx={cx + dx} cy={y} rx="5" ry="3" />
  </g>
);
const Smile = ({ y, cx = 50, c = INK }: { y: number; cx?: number; c?: string }) => <path d={`M${cx - 4} ${y} q4 4 8 0`} stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" />;
const Shadow = ({ w = 26 }: { w?: number }) => <ellipse cx="50" cy="93" rx={w} ry="4.5" fill="#000000" opacity="0.13" />;

function Body({ kind, c1, c2 }: { kind: CompanionKind; c1: string; c2: string }) {
  switch (kind) {
    case 'passarinho':
      return (
        <g>
          <Shadow w={22} />
          <path d="M72 66 l16 -8 l-5 11 l7 2 l-16 4 Z" fill={c1} />
          <path d="M43 86 v6 M57 86 v6 M40 92 h6 M54 92 h6" stroke={c2} strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="50" cy="60" r="28" fill={c1} />
          <ellipse cx="50" cy="71" rx="17" ry="14" fill="#FFFFFF" opacity="0.7" />
          <ellipse cx="25" cy="64" rx="7" ry="12" fill={c1} stroke="#000000" strokeOpacity="0.1" transform="rotate(18 25 64)" />
          <ellipse cx="75" cy="64" rx="7" ry="12" fill={c1} stroke="#000000" strokeOpacity="0.1" transform="rotate(-18 75 64)" />
          <path d="M45 34 q2 -11 6 -2 q4 -9 6 2" stroke={c1} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <ellipse cx="40" cy="44" rx="7" ry="4" fill="#FFFFFF" opacity="0.4" transform="rotate(-25 40 44)" />
          <Eyes y={54} dx={10} />
          <path d="M45 60 L55 60 L50 67 Z" fill={c2} />
          <Blush y={62} dx={19} />
        </g>
      );
    case 'joaninha':
      return (
        <g>
          <Shadow />
          <path d="M44 32 Q40 22 36 18 M56 32 Q60 22 64 18" stroke={c2} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <circle cx="36" cy="17" r="3.4" fill={c2} />
          <circle cx="64" cy="17" r="3.4" fill={c2} />
          {[-1, 1].map((s) => (
            <path key={s} d={`M${50 + s * 26} 70 l${s * 8} 4 M${50 + s * 24} 80 l${s * 8} 6`} stroke={c2} strokeWidth="2.6" strokeLinecap="round" />
          ))}
          <ellipse cx="50" cy="68" rx="30" ry="24" fill={c1} />
          <path d="M50 46 V92" stroke={c2} strokeWidth="2.2" />
          {[[36, 64, 5.5], [64, 64, 5.5], [38, 80, 4.5], [62, 80, 4.5], [30, 72, 3]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={c2} />)}
          <ellipse cx="35" cy="54" rx="7" ry="3.5" fill="#FFFFFF" opacity="0.45" transform="rotate(-20 35 54)" />
          <circle cx="50" cy="42" r="16" fill={c2} />
          <Eyes y={41} dx={6.5} r={3.3} white />
          <Smile y={48} c="#FFFFFF" />
          <Blush y={47} dx={12} />
        </g>
      );
    case 'gatinho':
      return (
        <g>
          <Shadow />
          <path d="M68 84 Q88 80 84 62 Q82 54 76 58" stroke={c1} strokeWidth="7" fill="none" strokeLinecap="round" />
          <ellipse cx="50" cy="74" rx="22" ry="17" fill={c1} />
          <ellipse cx="50" cy="78" rx="12" ry="11" fill={c2} />
          <ellipse cx="42" cy="89" rx="6" ry="4" fill={c2} />
          <ellipse cx="58" cy="89" rx="6" ry="4" fill={c2} />
          <path d="M30 40 L32 18 L48 30 Z M70 40 L68 18 L52 30 Z" fill={c1} />
          <path d="M34 34 L35 24 L43 30 Z M66 34 L65 24 L57 30 Z" fill="#FFB3C7" />
          <circle cx="50" cy="46" r="22" fill={c1} />
          <path d="M44 26 l1 7 M50 25 v8 M56 26 l-1 7" stroke="#000000" strokeOpacity="0.15" strokeWidth="2.4" strokeLinecap="round" />
          <ellipse cx="50" cy="55" rx="10" ry="7" fill={c2} />
          <Eyes y={45} dx={9} />
          <path d="M48 51 h4 l-2 2.5 Z" fill="#FF8FA8" />
          <path d="M46 56 q2 2 4 0 q2 2 4 0" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M28 52 h9 M28 56 l9 -1 M72 52 h-9 M72 56 l-9 -1" stroke={INK} strokeOpacity="0.5" strokeWidth="1" />
          <Blush y={53} dx={17} />
        </g>
      );
    case 'ourico': {
      const pts = Array.from({ length: 26 }, (_, i) => {
        const a = (i / 26) * Math.PI * 2;
        const r = i % 2 ? 24 : 34;
        return `${(50 + Math.cos(a) * r).toFixed(1)},${(60 + Math.sin(a) * r * 0.92).toFixed(1)}`;
      });
      return (
        <g>
          <Shadow />
          <path d={`M${pts.join(' L')} Z`} fill={c1} strokeLinejoin="round" />
          <circle cx="50" cy="60" r="26" fill={c1} />
          <ellipse cx="50" cy="66" rx="21" ry="19" fill={c2} />
          <circle cx="33" cy="48" r="5" fill={c2} />
          <circle cx="67" cy="48" r="5" fill={c2} />
          <Eyes y={62} dx={8.5} r={3.6} />
          <circle cx="50" cy="70" r="3.4" fill={INK} />
          <Smile y={74} />
          <Blush y={70} dx={15} />
          <ellipse cx="40" cy="88" rx="6" ry="3.5" fill={c2} />
          <ellipse cx="60" cy="88" rx="6" ry="3.5" fill={c2} />
        </g>
      );
    }
    case 'tartaruga':
      return (
        <g>
          <Shadow w={30} />
          {[[24, 86], [76, 86], [28, 76], [72, 76]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="7" ry="5" fill="#B8E6C4" />)}
          <path d="M20 72 Q20 36 50 36 Q80 36 80 72 Z" fill={c1} />
          <path d="M50 38 L40 50 L44 64 H56 L60 50 Z M40 50 L24 56 M60 50 L76 56 M44 64 L34 72 M56 64 L66 72" stroke={c2} strokeWidth="2.2" fill="none" strokeLinejoin="round" />
          <ellipse cx="38" cy="46" rx="8" ry="4" fill="#FFFFFF" opacity="0.35" transform="rotate(-25 38 46)" />
          <rect x="16" y="68" width="68" height="9" rx="4.5" fill={c2} />
          <circle cx="50" cy="76" r="14" fill="#B8E6C4" />
          <Eyes y={74} dx={6} r={3} />
          <Smile y={80} />
          <Blush y={79} dx={10} />
        </g>
      );
    case 'pinguim':
      return (
        <g>
          <Shadow />
          <ellipse cx="40" cy="91" rx="7" ry="3.5" fill="#FFB347" />
          <ellipse cx="60" cy="91" rx="7" ry="3.5" fill="#FFB347" />
          <ellipse cx="25" cy="64" rx="7" ry="15" fill={c1} transform="rotate(20 25 64)" />
          <ellipse cx="75" cy="64" rx="7" ry="15" fill={c1} transform="rotate(-20 75 64)" />
          <ellipse cx="50" cy="60" rx="25" ry="31" fill={c1} />
          <ellipse cx="50" cy="70" rx="17" ry="20" fill={c2} />
          <circle cx="43" cy="47" r="9.5" fill={c2} />
          <circle cx="57" cy="47" r="9.5" fill={c2} />
          <Eyes y={47} dx={7} r={3.4} />
          <path d="M46 53 L54 53 L50 59 Z" fill="#FFB347" />
          <Blush y={55} dx={14} />
          <path d="M30 36 q20 -10 40 0" stroke="#7FB8F0" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'cachorro':
      return (
        <g>
          <Shadow />
          <path d="M66 82 q12 -4 14 -18" stroke={c1} strokeWidth="6" fill="none" strokeLinecap="round" />
          <ellipse cx="50" cy="76" rx="19" ry="15" fill={c1} />
          <ellipse cx="42" cy="89" rx="6" ry="4" fill="#FFF4E3" />
          <ellipse cx="58" cy="89" rx="6" ry="4" fill="#FFF4E3" />
          <circle cx="50" cy="46" r="22" fill={c1} />
          <ellipse cx="29" cy="48" rx="8" ry="15" fill={c2} transform="rotate(18 29 48)" />
          <ellipse cx="71" cy="48" rx="8" ry="15" fill={c2} transform="rotate(-18 71 48)" />
          <ellipse cx="40" cy="43" rx="8" ry="7" fill={c2} opacity="0.55" />
          <ellipse cx="50" cy="57" rx="11" ry="8" fill="#FFF4E3" />
          <Eyes y={44} dx={9} />
          <ellipse cx="50" cy="53" rx="4.2" ry="3" fill={INK} />
          <path d="M46 58 q2 2 4 0 q2 2 4 0" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M48 60 q2 6 4 0 Z" fill="#FF8FA8" />
          <Blush y={54} dx={17} />
        </g>
      );
    case 'polvo':
      return (
        <g>
          <Shadow w={28} />
          {Array.from({ length: 6 }, (_, i) => {
            const x = 27 + i * 9.2;
            const side = i < 3 ? -1 : 1;
            return (
              <g key={i}>
                <path d={`M${x} 56 C${x - 5 * side} 70 ${x + 5 * side} 78 ${x + 4 * side} 88`} stroke={c1} strokeWidth="8" fill="none" strokeLinecap="round" />
                <circle cx={x + 2 * side} cy="78" r="1.6" fill={c2} />
                <circle cx={x + 3 * side} cy="84" r="1.4" fill={c2} />
              </g>
            );
          })}
          <path d="M22 62 Q20 22 50 22 Q80 22 78 62 Q50 70 22 62 Z" fill={c1} />
          <circle cx="40" cy="32" r="4" fill={c2} />
          <circle cx="62" cy="30" r="3" fill={c2} />
          <circle cx="68" cy="40" r="2.4" fill={c2} />
          <ellipse cx="36" cy="38" rx="7" ry="4" fill="#FFFFFF" opacity="0.4" transform="rotate(-25 36 38)" />
          <Eyes y={47} dx={10} />
          <Smile y={54} />
          <Blush y={53} dx={18} />
          <circle cx="84" cy="30" r="4" fill="none" stroke="#9FD8F0" strokeWidth="1.6" />
          <circle cx="90" cy="20" r="2.6" fill="none" stroke="#9FD8F0" strokeWidth="1.4" />
        </g>
      );
    case 'ovelha':
      return (
        <g>
          <Shadow />
          {[38, 46, 54, 62].map((x) => <rect key={x} x={x - 3} y="78" width="6" height="14" rx="3" fill={c2} />)}
          <g fill={c1} stroke="#E3DDF2" strokeWidth="1.5">
            {[[32, 58, 14], [50, 46, 16], [68, 58, 14], [38, 72, 13], [62, 72, 13], [50, 66, 16]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
          </g>
          <ellipse cx="36" cy="58" rx="4" ry="8" fill={c2} transform="rotate(-50 36 58)" />
          <ellipse cx="64" cy="58" rx="4" ry="8" fill={c2} transform="rotate(50 64 58)" />
          <ellipse cx="50" cy="62" rx="13" ry="12" fill={c2} />
          <Eyes y={61} dx={5.5} r={2.8} />
          <Smile y={67} />
          <path d="M80 30 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5 Z" fill="#FFD34D" />
          <path d="M20 36 l1 3 3 1 -3 1 -1 3 -1 -3 -3 -1 3 -1 Z" fill="#FFD34D" />
        </g>
      );
    case 'dragao':
      return (
        <g>
          <Shadow />
          <path d="M68 80 Q86 82 88 66 l-6 2 l2 -7 l-6 4" fill={c1} />
          <path d="M30 58 Q10 46 14 30 Q24 40 34 44 Z M70 58 Q90 46 86 30 Q76 40 66 44 Z" fill="#B399F0" />
          <ellipse cx="50" cy="74" rx="20" ry="17" fill={c1} />
          <ellipse cx="50" cy="78" rx="12" ry="11" fill="#FFF1B8" />
          <path d="M44 72 h12 M43 78 h14 M44 84 h12" stroke={c2} strokeOpacity="0.5" strokeWidth="1.4" />
          <ellipse cx="41" cy="90" rx="6" ry="3.6" fill={c1} />
          <ellipse cx="59" cy="90" rx="6" ry="3.6" fill={c1} />
          <path d="M38 30 L36 18 L44 27 Z M62 30 L64 18 L56 27 Z" fill={c2} />
          <circle cx="50" cy="46" r="20" fill={c1} />
          <path d="M46 27 l4 -6 l4 6 Z" fill={c2} />
          <Eyes y={45} dx={8} />
          <circle cx="47" cy="53" r="1.2" fill={INK} />
          <circle cx="53" cy="53" r="1.2" fill={INK} />
          <path d="M44 56 q6 5 12 0" stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M53 57 l1.5 3 l1.5 -3.4 Z" fill="#FFFFFF" />
          <Blush y={53} dx={15} />
        </g>
      );
    case 'robo':
      return (
        <g>
          <Shadow />
          <path d="M50 24 V12" stroke="#8A90A0" strokeWidth="2.4" />
          <circle cx="50" cy="11" r="4.2" fill="#FF6F91" />
          <rect x="30" y="62" width="40" height="24" rx="8" fill={c1} />
          <path d={`M50 80 C42 74 44 68 50 72 C56 68 58 74 50 80 Z`} fill="#FF86AC" />
          <path d="M30 70 l-8 6 M70 70 l8 6" stroke="#8A90A0" strokeWidth="4" strokeLinecap="round" />
          <circle cx="21" cy="77" r="3.6" fill={c2} />
          <circle cx="79" cy="77" r="3.6" fill={c2} />
          <rect x="35" y="85" width="10" height="7" rx="3" fill="#8A90A0" />
          <rect x="55" y="85" width="10" height="7" rx="3" fill="#8A90A0" />
          <rect x="26" y="24" width="48" height="38" rx="11" fill={c1} />
          <rect x="32" y="30" width="36" height="26" rx="8" fill="#3A3F5C" />
          <path d="M38 44 q4 -6 8 0 M54 44 q4 -6 8 0" stroke={c2} strokeWidth="2.8" fill="none" strokeLinecap="round" />
          <path d="M45 49 q5 4 10 0" stroke={c2} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <circle cx="24" cy="43" r="3.4" fill="#8A90A0" />
          <circle cx="76" cy="43" r="3.4" fill="#8A90A0" />
          <ellipse cx="36" cy="27" rx="6" ry="2.6" fill="#FFFFFF" opacity="0.5" />
        </g>
      );
    case 'unicornio':
      return (
        <g>
          <Shadow />
          <path d="M66 52 Q86 40 92 24 Q80 30 70 30 Q78 38 64 46 Z" fill="#FFFFFF" stroke="#EADFF2" strokeWidth="1.5" />
          <path d="M88 28 Q82 32 76 31" stroke={c2} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M70 78 q14 -2 14 -14 q-6 4 -8 2" stroke={c2} strokeWidth="6" fill="none" strokeLinecap="round" />
          {[40, 48, 58, 66].map((x) => <rect key={x} x={x - 3} y="78" width="6" height="14" rx="3" fill="#FFFFFF" stroke="#EADFF2" strokeWidth="1" />)}
          <ellipse cx="54" cy="72" rx="20" ry="14" fill={c1} stroke="#EADFF2" strokeWidth="1.5" />
          <circle cx="44" cy="48" r="18" fill={c1} stroke="#EADFF2" strokeWidth="1.5" />
          <path d="M54 34 q10 4 8 16 q6 4 2 12 q-8 -2 -8 -10 q-6 -6 -2 -18 Z" fill={c2} />
          <path d="M36 32 L34 22 L42 30 Z" fill={c1} stroke="#EADFF2" strokeWidth="1.2" />
          <path d="M40 32 L45 12 L50 32 Z" fill="#FFD34D" />
          <path d="M42 26 l6 -2 M41 30 l8 -2 M43 21 l4 -1.5" stroke="#E8B020" strokeWidth="1.2" />
          <Eyes y={49} dx={7} cx={42} r={3.3} />
          <Smile y={56} cx={42} />
          <Blush y={55} dx={12} cx={42} />
          <path d="M18 34 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5 Z" fill="#FFD34D" />
        </g>
      );
  }
}

/** O pet desenhado. */
export function CompanionArt({ pet, size = 72, label }: { pet: Companion; size?: number; label?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={label ?? `${pet.name}, ${pet.species.toLowerCase()}`} className="block overflow-visible">
      <Body kind={pet.kind} c1={pet.c1} c2={pet.c2} />
    </svg>
  );
}

/** Só o desenho do pet (para pôr dentro de outro SVG, no quadro 0–100). */
export const CompanionShape = ({ pet }: { pet: Companion }) => <Body kind={pet.kind} c1={pet.c1} c2={pet.c2} />;

/** Ovo misterioso: as rachaduras aparecem com os dias de cuidado. */
export function Egg({ colors, warmth = 0, size = 72, locked, label }: { colors: [string, string]; warmth?: number; size?: number; locked?: boolean; label?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={label ?? 'Ovo misterioso'} className="block overflow-visible">
      <EggShape colors={colors} warmth={warmth} locked={locked} />
    </svg>
  );
}

export function EggShape({ colors, warmth = 0, locked }: { colors: [string, string]; warmth?: number; locked?: boolean }) {
  const [a, b] = locked ? ['#D9D6E2', '#C2BED0'] : colors;
  return (
    <g>
      <ellipse cx="50" cy="93" rx="24" ry="4.5" fill="#000000" opacity="0.13" />
      <path d="M50 10 C70 10 80 42 80 60 C80 80 67 92 50 92 C33 92 20 80 20 60 C20 42 30 10 50 10 Z" fill={a} stroke="#000000" strokeOpacity="0.08" strokeWidth="2" />
      {[[38, 36, 6], [62, 44, 8], [44, 66, 9], [66, 72, 5], [30, 58, 4]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={b} opacity={locked ? 0.6 : 0.9} />)}
      <ellipse cx="38" cy="28" rx="7" ry="11" fill="#FFFFFF" opacity="0.45" transform="rotate(20 38 28)" />
      {locked && <text x="50" y="64" textAnchor="middle" fontSize="26" fontWeight="900" fill="#FFFFFF">?</text>}
      {!locked && warmth >= 1 && <path d="M58 22 l-4 6 l5 3 l-3 6" stroke={INK} strokeOpacity="0.7" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      {!locked && warmth >= 2 && <path d="M26 54 l7 -2 l3 5 l6 -3 l4 4" stroke={INK} strokeOpacity="0.7" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      {!locked && warmth >= 3 && <path d="M22 62 l8 -4 l5 5 l7 -6 l6 6 l7 -5 l6 5 l8 -4 l9 4" stroke={INK} strokeOpacity="0.8" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
    </g>
  );
}
