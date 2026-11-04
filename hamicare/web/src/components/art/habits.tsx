// Ilustrações das missões (hábitos) e do bem-estar.
import { C, Face, Hi, Sh, drop, heart, sparkle, star, type Draw } from './kit';

const shoe = (body: string, sole: string, lace = C.white): Draw => () => (
  <g>
    <path d="M8 40 Q8 26 18 24 L26 22 Q30 30 38 31 L50 33 Q58 35 58 43 L58 46 H8Z" fill={body} />
    <path d="M8 44 H58 Q58 52 50 52 H14 Q8 52 8 46Z" fill={sole} />
    <rect x="8" y="44" width="50" height="3" fill="#000" opacity="0.08" />
    <path d="M24 27 L30 33 M28 25 L34 31 M32 27 L37 32" stroke={lace} strokeWidth="2.6" strokeLinecap="round" />
    <Hi x={16} y={31} rx={3} ry={5} r={-20} />
    <Sh d="M40 33 L50 33 Q58 35 58 43 L58 44 H44 Q46 38 40 33Z" />
  </g>
);

export const HABITS: Record<string, Draw> = {
  // ---------- Corpo em movimento ----------
  '🚶': () => (
    <g>
      <g transform="rotate(-14 22 40)">
        <ellipse cx="22" cy="44" rx="8" ry="12" fill={C.brown} />
        {[0, 1, 2, 3, 4].map((i) => (
          <circle key={i} cx={14.5 + i * 3.8} cy={28.5 - Math.abs(2 - i) * 1.2} r={i === 0 ? 2.8 : 2.1} fill={C.brown} />
        ))}
      </g>
      <g transform="rotate(10 44 24)">
        <ellipse cx="44" cy="28" rx="8" ry="12" fill={C.brownD} />
        {[0, 1, 2, 3, 4].map((i) => (
          <circle key={i} cx={36.5 + i * 3.8} cy={12.5 - Math.abs(2 - i) * 1.2} r={i === 4 ? 2.8 : 2.1} fill={C.brownD} />
        ))}
      </g>
    </g>
  ),
  '🏃': () => (
    <g>
      {shoe(C.orange, C.white)()}
      <path d="M2 30 H12 M4 36 H11 M2 24 H9" stroke={C.orangeD} strokeWidth="3" strokeLinecap="round" opacity="0.8" />
    </g>
  ),
  '👟': shoe(C.teal, C.white, C.white),
  '🙆': () => (
    <g>
      <path d="M14 16 Q32 34 50 16" stroke={C.pink} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M14 48 Q32 30 50 48" stroke={C.pinkD} strokeWidth="6" fill="none" strokeLinecap="round" />
      <rect x="6" y="10" width="10" height="44" rx="5" fill={C.purple} />
      <rect x="48" y="10" width="10" height="44" rx="5" fill={C.purple} />
      <Sh d="M11 10 h0 a5 5 0 0 1 5 5 v34 a5 5 0 0 1 -5 5Z" />
      <Sh d="M53 10 a5 5 0 0 1 5 5 v34 a5 5 0 0 1 -5 5Z" />
      <Hi x={9.5} y={22} rx={1.4} ry={6} />
      <Hi x={51.5} y={22} rx={1.4} ry={6} />
    </g>
  ),
  '🚲': () => (
    <g>
      <circle cx="16" cy="42" r="11" stroke={C.dark} strokeWidth="4" fill="none" />
      <circle cx="48" cy="42" r="11" stroke={C.dark} strokeWidth="4" fill="none" />
      <circle cx="16" cy="42" r="2.5" fill={C.grayD} />
      <circle cx="48" cy="42" r="2.5" fill={C.grayD} />
      <path d="M16 42 L26 24 L42 24 L48 42 M26 24 L32 42 L42 24 M32 42 L16 42" stroke={C.red} strokeWidth="3.6" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M42 24 L40 16 L46 14" stroke={C.dark} strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="20" y="18" width="12" height="4.5" rx="2.2" fill={C.dark} />
    </g>
  ),
  '🤸': () => (
    <g>
      <path d="M22 22 Q22 10 32 10 Q42 10 42 22" stroke={C.orangeD} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M12 38 Q12 22 32 22 Q52 22 52 38 Q52 56 32 56 Q12 56 12 38Z" fill={C.orange} />
      <Sh d="M40 24 Q52 28 52 38 Q52 56 32 56 Q44 50 44 38 Q44 28 40 24Z" />
      <Hi x={22} y={32} rx={4} ry={6} r={-25} />
      <rect x="24" y="36" width="16" height="9" rx="4.5" fill="#fff" opacity="0.85" />
      <path d="M29 40.5 h6" stroke={C.orangeD} strokeWidth="2.4" strokeLinecap="round" />
    </g>
  ),
  '🏋️': () => (
    <g>
      <rect x="6" y="29" width="52" height="6" rx="3" fill={C.grayD} />
      <rect x="10" y="16" width="8" height="32" rx="3" fill={C.dark} />
      <rect x="46" y="16" width="8" height="32" rx="3" fill={C.dark} />
      <rect x="4" y="21" width="6" height="22" rx="3" fill={C.red} />
      <rect x="54" y="21" width="6" height="22" rx="3" fill={C.red} />
      <Hi x={13} y={24} rx={1.4} ry={5} o={0.35} />
      <Hi x={49} y={24} rx={1.4} ry={5} o={0.35} />
    </g>
  ),
  '💪': () => (
    <g transform="rotate(-30 32 32)">
      <rect x="20" y="28" width="24" height="8" rx="4" fill={C.grayD} />
      <rect x="8" y="16" width="14" height="32" rx="6" fill={C.blue} />
      <rect x="42" y="16" width="14" height="32" rx="6" fill={C.blue} />
      <Sh d="M16 16 h0 a6 6 0 0 1 6 6 v20 a6 6 0 0 1 -6 6Z" />
      <Sh d="M50 16 a6 6 0 0 1 6 6 v20 a6 6 0 0 1 -6 6Z" />
      <Hi x={12} y={25} rx={2} ry={6} />
      <Hi x={46} y={25} rx={2} ry={6} />
    </g>
  ),
  '🧘‍♀️': () => (
    <g>
      <rect x="6" y="36" width="44" height="14" rx="3" fill={C.purple} transform="skewX(-12)" />
      <circle cx="49" cy="34" r="13" fill={C.purpleD} />
      <circle cx="49" cy="34" r="9" fill={C.purple} />
      <circle cx="49" cy="34" r="5" fill={C.purpleD} />
      <circle cx="49" cy="34" r="2" fill={C.purple} />
      <path d="M10 40 H40" stroke="#fff" strokeWidth="2" opacity="0.45" strokeLinecap="round" transform="skewX(-12)" />
    </g>
  ),
  '🧘': () => (
    <g>
      <ellipse cx="32" cy="50" rx="24" ry="5" fill={C.sky} />
      <path d="M32 46 Q20 40 22 22 Q32 28 32 46Z" fill={C.pink} />
      <path d="M32 46 Q44 40 42 22 Q32 28 32 46Z" fill={C.pink} />
      <path d="M32 46 Q24 32 32 14 Q40 32 32 46Z" fill={C.pinkD} />
      <path d="M32 46 Q12 46 8 34 Q22 32 32 46Z" fill={C.rose} />
      <path d="M32 46 Q52 46 56 34 Q42 32 32 46Z" fill={C.rose} />
      <Hi x={29} y={30} rx={1.6} ry={6} o={0.5} />
    </g>
  ),
  '💃': () => (
    <g>
      <path d="M32 2 V12" stroke={C.grayD} strokeWidth="2.4" />
      <circle cx="32" cy="32" r="20" fill="#B9C6DB" />
      {[-12, -4, 4, 12].map((y) => (
        <path key={y} d={`M${32 - Math.sqrt(400 - y * y)} ${32 + y} H${32 + Math.sqrt(400 - y * y)}`} stroke="#fff" strokeWidth="1.4" opacity="0.55" />
      ))}
      {[-12, -4, 4, 12].map((x) => (
        <path key={x} d={`M${32 + x} ${32 - Math.sqrt(400 - x * x)} V${32 + Math.sqrt(400 - x * x)}`} stroke="#fff" strokeWidth="1.4" opacity="0.55" />
      ))}
      <rect x="24" y="22" width="8" height="8" fill={C.pink} opacity="0.75" />
      <rect x="32" y="38" width="8" height="8" fill={C.blue} opacity="0.7" />
      <rect x="40" y="26" width="6" height="8" fill={C.yellow} opacity="0.8" />
      <Sh d="M40 14 A20 20 0 0 1 32 52 A26 26 0 0 0 40 14Z" o={0.15} />
      <path d={sparkle(52, 12, 5)} fill={C.yellow} />
      <path d={sparkle(10, 48, 4)} fill={C.pink} />
    </g>
  ),
  '🪢': () => (
    <g>
      <path d="M14 22 Q10 58 32 58 Q54 58 50 22" stroke={C.pink} strokeWidth="3.6" fill="none" strokeLinecap="round" />
      <rect x="9" y="6" width="9" height="18" rx="4.5" fill={C.teal} transform="rotate(-10 13 15)" />
      <rect x="46" y="6" width="9" height="18" rx="4.5" fill={C.teal} transform="rotate(10 51 15)" />
      <Hi x={12} y={12} rx={1.4} ry={4} r={-10} />
      <Hi x={49} y={12} rx={1.4} ry={4} r={10} />
    </g>
  ),
  '⚽': () => (
    <g>
      <circle cx="32" cy="32" r="24" fill="#fff" />
      {[0, 72, 144, 216, 288].map((a) => {
        const r = ((a - 90) * Math.PI) / 180;
        const x = 32 + Math.cos(r) * 19;
        const y = 32 + Math.sin(r) * 19;
        return (
          <g key={a}>
            <path d={`M${32 + Math.cos(r) * 8} ${32 + Math.sin(r) * 8} L${x} ${y}`} stroke={C.grayD} strokeWidth="1.6" />
            <path d={star(x, y, 5.2, 4.2, 5, a - 90)} fill={C.dark} />
          </g>
        );
      })}
      <path d={star(32, 32, 8.4, 6.8, 5)} fill={C.dark} />
      <Sh d="M44 11 A24 24 0 0 1 32 56 A24 24 0 0 0 44 11Z" o={0.12} />
      <Hi x={20} y={17} rx={4} ry={2.4} r={-35} />
    </g>
  ),
  '🪜': () => (
    <g>
      <path d="M20 6 L14 58 M44 6 L50 58" stroke={C.woodD} strokeWidth="6" strokeLinecap="round" />
      {[14, 25, 36, 47].map((y, i) => (
        <path key={y} d={`M${19.2 - i * 1.2} ${y} H${44.8 + i * 1.2}`} stroke={C.wood} strokeWidth="5" strokeLinecap="round" />
      ))}
    </g>
  ),

  // ---------- Autocuidado ----------
  '🚿': () => (
    <g>
      <path d="M10 58 V16 Q10 8 18 8 H30 Q38 8 38 16 V19" stroke={C.grayD} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M24 26 Q24 17 38 17 Q52 17 52 26Z" fill={C.gray} />
      <rect x="22" y="25" width="32" height="5" rx="2.5" fill={C.grayD} />
      {[
        [28, 38], [36, 36], [44, 38], [52, 36], [32, 48], [40, 46], [48, 48], [36, 57], [44, 56],
      ].map(([x, y]) => (
        <path key={`${x}-${y}`} d={drop(x, y, 2.6)} fill={C.blue} />
      ))}
    </g>
  ),
  '🧴': () => (
    <g>
      <path d="M22 8 H36 V12 H22Z" fill={C.grayD} />
      <rect x="29" y="10" width="5" height="8" fill={C.grayD} />
      <rect x="24" y="16" width="16" height="6" rx="2" fill={C.gray} />
      <rect x="16" y="21" width="32" height="37" rx="10" fill={C.pink} />
      <Sh d="M38 21 h0 a10 10 0 0 1 10 10 v17 a10 10 0 0 1 -10 10 h-4 Q42 40 38 21Z" />
      <rect x="22" y="31" width="20" height="15" rx="5" fill="#fff" opacity="0.9" />
      <path d="M32 42 Q26 38 28 33 Q34 35 32 42Z" fill={C.leaf} />
      <Hi x={21} y={30} rx={2} ry={5} />
    </g>
  ),
  '🪥': () => (
    <g transform="rotate(-38 32 32)">
      <rect x="28" y="22" width="8" height="40" rx="4" fill={C.teal} />
      <rect x="27" y="4" width="10" height="20" rx="5" fill={C.teal} />
      <rect x="36" y="6" width="7" height="16" rx="2" fill="#fff" />
      <path d="M39.5 7 V21" stroke={C.sky} strokeWidth="1.6" />
      <path d="M42 7 Q50 6 50 11 Q50 15 44 15 Q49 17 46 21 H42Z" fill={C.sky} />
      <Sh d="M32 22 h4 v36 a4 4 0 0 1 -4 4Z" />
      <Hi x={30} y={36} rx={1.2} ry={8} />
    </g>
  ),
  '🧹': () => (
    <g>
      <path d="M48 6 L28 36" stroke={C.brown} strokeWidth="5" strokeLinecap="round" />
      <path d="M22 32 L36 41 L28 60 Q14 56 8 46Z" fill={C.yellow} />
      <path d="M21 31 L37 41.5 L34 46 L18 35.5Z" fill={C.red} />
      <path d="M16 46 L12 51 M21 49 L17 56 M27 51 L24 58" stroke={C.yellowD} strokeWidth="2" strokeLinecap="round" />
      <Sh d="M36 41 L28 60 Q24 59 21 57.5 L30 41Z" o={0.1} />
    </g>
  ),
  '🛏️': () => (
    <g>
      <rect x="6" y="16" width="9" height="40" rx="4" fill={C.woodD} />
      <rect x="10" y="44" width="48" height="8" rx="3" fill={C.wood} />
      <rect x="12" y="36" width="46" height="10" rx="3" fill="#fff" />
      <path d="M26 31 H55 Q58 31 58 34 V46 H26Z" fill={C.blue} />
      <path d="M26 31 H32 V46 H26Z" fill={C.blueD} opacity="0.55" />
      <ellipse cx="20" cy="33" rx="8" ry="5" fill="#fff" />
      <Sh d="M14 34 Q20 40 28 34 Q26 38 20 38 Q15 38 14 34Z" o={0.08} />
      <rect x="11" y="52" width="4" height="6" rx="1" fill={C.brownD} />
      <rect x="53" y="52" width="4" height="6" rx="1" fill={C.brownD} />
    </g>
  ),
  '🛋️': () => (
    <g>
      <rect x="12" y="18" width="40" height="22" rx="8" fill={C.teal} />
      <rect x="14" y="34" width="36" height="14" rx="5" fill="#7BD8C9" />
      <path d="M32 35 V47" stroke={C.tealD} strokeWidth="1.6" opacity="0.6" />
      <rect x="5" y="28" width="13" height="22" rx="6" fill={C.tealD} />
      <rect x="46" y="28" width="13" height="22" rx="6" fill={C.tealD} />
      <rect x="10" y="49" width="4" height="7" rx="1.5" fill={C.brownD} />
      <rect x="50" y="49" width="4" height="7" rx="1.5" fill={C.brownD} />
      <Hi x={20} y={24} rx={5} ry={2} />
    </g>
  ),
  '📵': () => (
    <g>
      <rect x="16" y="4" width="32" height="56" rx="7" fill={C.dark} />
      <rect x="19" y="10" width="26" height="42" rx="3" fill="#8FA2E6" />
      <path d="M36 18 a9 9 0 1 0 6 15 a7 7 0 1 1 -6 -15Z" fill={C.yellow} />
      <path d="M24 38 h7 l-7 7 h7" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="28" y="54.5" width="8" height="2.2" rx="1.1" fill="#fff" opacity="0.6" />
    </g>
  ),

  // ---------- Hábitos ----------
  '💧': () => (
    <g>
      <path d={drop(32, 36, 17)} fill={C.blue} />
      <Sh d="M45 26 Q49 33 49 42 A17 17 0 0 1 32 59 Q44 52 45 26Z" />
      <Hi x={24} y={40} rx={3.6} ry={7} r={15} />
    </g>
  ),
  '🚰': () => (
    <g>
      <rect x="24" y="4" width="16" height="7" rx="3" fill={C.tealD} />
      <rect x="26" y="10" width="12" height="6" fill="#D6EEF7" />
      <path d="M18 24 Q18 16 26 15 H38 Q46 16 46 24 V52 Q46 60 38 60 H26 Q18 60 18 52Z" fill="#DDF1FF" />
      <path d="M18 34 H46 V52 Q46 60 38 60 H26 Q18 60 18 52Z" fill={C.blue} />
      <rect x="18" y="26" width="28" height="6" fill={C.teal} />
      <Sh d="M40 16 Q46 18 46 24 V52 Q46 60 38 60 H36 Q41 50 40 16Z" o={0.1} />
      <Hi x={23.5} y={44} rx={1.6} ry={9} />
    </g>
  ),
  '🥤': () => (
    <g>
      <path d="M36 2 L40 2 L34 22" stroke={C.pink} strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 20 H48 L44 58 Q43.6 61 40.6 61 H23.4 Q20.4 61 20 58Z" fill={C.orange} />
      <rect x="14" y="16" width="36" height="7" rx="3" fill="#fff" />
      <Sh d="M40 23 H47.7 L44 58 Q43.6 61 40.6 61 H37Z" />
      <rect x="21" y="34" width="22" height="10" rx="3" fill="#fff" opacity="0.85" />
      <Hi x={22} y={50} rx={1.4} ry={4} />
    </g>
  ),
  '🌙': () => (
    <g>
      <path d="M38 6 A26 26 0 1 0 58 44 A21 21 0 1 1 38 6Z" fill={C.yellow} />
      <Sh d="M14 42 A26 26 0 0 0 58 44 A21 21 0 0 1 34 52 Q20 50 14 42Z" o={0.1} />
      <circle cx="22" cy="30" r="3" fill={C.yellowD} opacity="0.6" />
      <circle cx="30" cy="44" r="2" fill={C.yellowD} opacity="0.6" />
      <path d={star(50, 16, 6, 2.6)} fill={C.yellow} stroke={C.yellow} strokeWidth="1.5" strokeLinejoin="round" />
    </g>
  ),
  '🌅': () => (
    <g>
      {[0, 30, 60, 90, 120, 150, 180].map((a) => {
        const r = (Math.PI * (180 + a)) / 180;
        return <path key={a} d={`M${32 + Math.cos(r) * 20} ${40 + Math.sin(r) * 20} L${32 + Math.cos(r) * 27} ${40 + Math.sin(r) * 27}`} stroke={C.orange} strokeWidth="4" strokeLinecap="round" />;
      })}
      <path d="M16 40 A16 16 0 0 1 48 40Z" fill={C.yellow} />
      <path d="M4 44 Q18 34 32 42 Q46 50 60 40 V58 H4Z" fill={C.green} />
      <path d="M4 52 Q22 44 36 52 Q48 58 60 50 V60 H4Z" fill={C.greenD} />
    </g>
  ),
  '⏰': () => (
    <g>
      <circle cx="16" cy="12" r="7" fill={C.yellow} />
      <circle cx="48" cy="12" r="7" fill={C.yellow} />
      <path d="M18 56 L14 61 M46 56 L50 61" stroke={C.redD} strokeWidth="4" strokeLinecap="round" />
      <circle cx="32" cy="35" r="22" fill={C.red} />
      <circle cx="32" cy="35" r="16" fill="#fff" />
      <path d="M32 35 V24 M32 35 L40 40" stroke={C.dark} strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="35" r="2.4" fill={C.dark} />
      <Sh d="M44 18 A22 22 0 0 1 32 57 A22 22 0 0 0 44 18Z" o={0.12} />
      <Hi x={19} y={24} rx={3} ry={5} r={35} o={0.45} />
    </g>
  ),
  '☀️': () => (
    <g>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        return <path key={i} d={`M${32 + Math.cos(a) * 21} ${32 + Math.sin(a) * 21} L${32 + Math.cos(a) * 28} ${32 + Math.sin(a) * 28}`} stroke={C.orange} strokeWidth="5" strokeLinecap="round" />;
      })}
      <circle cx="32" cy="32" r="16" fill={C.yellow} />
      <Sh d="M42 20 A16 16 0 0 1 32 48 A16 16 0 0 0 42 20Z" o={0.08} />
      <Face x={32} y={31} w={10} />
    </g>
  ),

  // ---------- Emocional ----------
  '📔': () => (
    <g>
      <rect x="14" y="6" width="38" height="52" rx="5" fill={C.purple} />
      <rect x="46" y="9" width="6" height="46" fill="#fff" />
      <path d="M47.5 12 V52 M50 12 V52" stroke={C.gray} strokeWidth="1" />
      <rect x="14" y="6" width="9" height="52" rx="4" fill={C.purpleD} />
      <path d="M36 6 V20 L39.5 17 L43 20 V6Z" fill={C.red} />
      <path d={heart(35, 36, 7)} fill="#fff" opacity="0.9" />
      <Hi x={28} y={14} rx={4} ry={1.6} o={0.4} />
    </g>
  ),
  '🫶': () => (
    <g>
      <path d={heart(32, 34, 23)} fill={C.pink} />
      <Sh d="M50 17 Q58 26 50 38 Q42 50 32 52.4 Q48 40 50 17Z" />
      <Hi x={20} y={22} rx={3.4} ry={5} r={-35} />
      <path d={sparkle(53, 9, 5)} fill={C.yellow} />
      <path d={sparkle(9, 46, 4)} fill={C.yellow} />
    </g>
  ),
  '💛': () => (
    <g>
      <path d={heart(32, 34, 25)} fill={C.yellow} />
      <Sh d="M52 16 Q60 26 51 39 Q43 51 32 54 Q49 41 52 16Z" />
      <Hi x={19} y={22} rx={3.6} ry={5.4} r={-35} />
    </g>
  ),
  '🌻': () => (
    <g>
      <path d="M32 36 V60" stroke={C.leafD} strokeWidth="4" strokeLinecap="round" />
      <path d="M32 52 Q22 42 14 48 Q22 56 32 52Z" fill={C.leaf} />
      <path d="M32 48 Q42 38 50 44 Q42 52 32 48Z" fill={C.leaf} />
      {Array.from({ length: 12 }).map((_, i) => (
        <ellipse key={i} cx="32" cy="9" rx="4.6" ry="8" fill={i % 2 ? C.yellow : C.yellowD} transform={`rotate(${i * 30} 32 24)`} />
      ))}
      <circle cx="32" cy="24" r="9" fill={C.choc} />
      <circle cx="29" cy="22" r="1.2" fill={C.brown} />
      <circle cx="34" cy="21" r="1.2" fill={C.brown} />
      <circle cx="33" cy="27" r="1.2" fill={C.brown} />
      <circle cx="28" cy="27" r="1.2" fill={C.brown} />
    </g>
  ),
  '🎨': () => (
    <g>
      <path d="M32 6 C16 6 4 18 6 32 C8 46 22 58 34 56 C40 55 40 49 36 46 C32 43 35 38 41 38 H48 C56 38 60 32 58 24 C56 14 46 6 32 6Z" fill={C.wood} />
      <Sh d="M58 24 C60 32 56 38 48 38 H41 C46 34 54 32 58 24Z" o={0.1} />
      <circle cx="20" cy="22" r="5" fill={C.red} />
      <circle cx="32" cy="16" r="5" fill={C.yellow} />
      <circle cx="45" cy="20" r="5" fill={C.blue} />
      <circle cx="17" cy="37" r="5" fill={C.green} />
      <circle cx="26" cy="47" r="4" fill={C.purple} />
    </g>
  ),
  '💬': () => (
    <g>
      <path d="M8 12 H38 Q44 12 44 18 V32 Q44 38 38 38 H20 L12 45 V38 H8 Q2 38 2 32 V18 Q2 12 8 12Z" fill={C.blue} />
      <path d="M28 26 H56 Q62 26 62 32 V44 Q62 50 56 50 H54 V57 L46 50 H28 Q22 50 22 44 V32 Q22 26 28 26Z" fill="#fff" />
      <Sh d="M54 50 V57 L46 50Z" o={0.08} />
      <circle cx="34" cy="38" r="2.6" fill={C.blueD} />
      <circle cx="42" cy="38" r="2.6" fill={C.blueD} />
      <circle cx="50" cy="38" r="2.6" fill={C.blueD} />
    </g>
  ),
  '🌬️': () => (
    <g fill="none" strokeLinecap="round" strokeWidth="5">
      <path d="M6 24 H38 A8 8 0 1 0 30 16" stroke={C.blue} />
      <path d="M6 36 H48 A8 8 0 1 1 40 44" stroke={C.sky} />
      <path d="M12 48 H26" stroke={C.blue} />
    </g>
  ),
  '⭐': () => (
    <g>
      <path d={star(32, 34, 25, 11)} fill={C.yellow} stroke={C.yellow} strokeWidth="5" strokeLinejoin="round" />
      <Sh d="M32 47 L46.7 55 L44 39 L55 27 Q46 40 32 47Z" o={0.1} />
      <Hi x={24} y={28} rx={2.4} ry={4} r={30} />
    </g>
  ),
  '🌟': () => (
    <g>
      <path d={star(32, 34, 25, 11)} fill={C.yellow} stroke={C.yellow} strokeWidth="5" strokeLinejoin="round" />
      <path d={sparkle(54, 8, 6)} fill={C.orange} />
      <path d={sparkle(8, 12, 4)} fill={C.orange} />
      <Face x={32} y={33} w={9} />
    </g>
  ),
  '📚': () => (
    <g>
      <rect x="8" y="44" width="46" height="12" rx="3" fill={C.blue} />
      <rect x="49" y="46" width="5" height="8" fill="#fff" />
      <rect x="12" y="32" width="42" height="12" rx="3" fill={C.red} />
      <rect x="12" y="34" width="5" height="8" fill="#fff" />
      <rect x="10" y="20" width="40" height="12" rx="3" fill={C.yellow} />
      <rect x="45" y="22" width="5" height="8" fill="#fff" />
      <path d="M24 44 V56 M30 32 V44 M22 20 V32" stroke="#000" strokeWidth="1.6" opacity="0.15" />
      <path d="M40 8 L50 18 L46 22 L36 12Z" fill={C.leaf} />
    </g>
  ),
  '🐶': () => (
    <g>
      <ellipse cx="32" cy="34" rx="20" ry="19" fill={C.wood} />
      <path d="M12 18 Q6 30 12 42 Q18 40 18 26Z" fill={C.brownD} />
      <path d="M52 18 Q58 30 52 42 Q46 40 46 26Z" fill={C.brownD} />
      <ellipse cx="32" cy="42" rx="11" ry="8" fill={C.cream} />
      <ellipse cx="32" cy="37" rx="4" ry="3" fill={C.dark} />
      <path d="M32 40 V44 M28 45 Q32 48 36 45" stroke={C.dark} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="24" cy="29" r="2.6" fill={C.dark} />
      <circle cx="40" cy="29" r="2.6" fill={C.dark} />
      <ellipse cx="40" cy="27" rx="5" ry="4" fill={C.brownD} opacity="0.35" />
    </g>
  ),
  '💊': () => (
    <g transform="rotate(-40 32 32)">
      <rect x="8" y="21" width="48" height="22" rx="11" fill="#fff" />
      <path d="M32 21 H19 A11 11 0 0 0 19 43 H32Z" fill={C.pink} />
      <Sh d="M8.5 35 Q12 43 19 43 H45 Q52 43 55.5 35Z" o={0.1} />
      <Hi x={20} y={26} rx={6} ry={1.8} />
      <Hi x={42} y={26} rx={6} ry={1.8} o={0.9} />
    </g>
  ),
  '🎵': () => (
    <g>
      <path d="M24 46 V14 L50 8 V40" stroke={C.purpleD} strokeWidth="5" fill="none" strokeLinejoin="round" />
      <path d="M24 14 L50 8 V18 L24 24Z" fill={C.purpleD} />
      <ellipse cx="18" cy="47" rx="8" ry="6.4" fill={C.purple} transform="rotate(-20 18 47)" />
      <ellipse cx="44" cy="41" rx="8" ry="6.4" fill={C.purple} transform="rotate(-20 44 41)" />
      <Hi x={15} y={45} rx={2.4} ry={1.4} r={-20} />
    </g>
  ),
  '💼': () => (
    <g>
      <path d="M24 18 V12 Q24 8 28 8 H36 Q40 8 40 12 V18" stroke={C.choc} strokeWidth="4" fill="none" />
      <rect x="6" y="17" width="52" height="38" rx="7" fill={C.brown} />
      <path d="M6 30 H58" stroke={C.brownD} strokeWidth="3" />
      <rect x="27" y="26" width="10" height="9" rx="2" fill={C.yellow} />
      <Sh d="M50 17 h1 a7 7 0 0 1 7 7 v24 a7 7 0 0 1 -7 7 h-6 Q52 36 50 17Z" o={0.1} />
    </g>
  ),
  '🌱': () => (
    <g>
      <ellipse cx="32" cy="54" rx="20" ry="6" fill={C.brown} />
      <path d="M32 54 V30" stroke={C.leafD} strokeWidth="4" strokeLinecap="round" />
      <path d="M32 34 Q30 16 12 16 Q12 34 32 34Z" fill={C.leaf} />
      <path d="M32 30 Q34 10 54 10 Q54 30 32 30Z" fill={C.green} />
      <path d="M32 33 Q22 26 17 20 M33 29 Q42 22 49 15" stroke="#fff" strokeWidth="1.4" opacity="0.5" fill="none" />
    </g>
  ),
  '💌': () => (
    <g>
      <rect x="6" y="16" width="52" height="36" rx="5" fill="#fff" />
      <path d="M8 18 L32 36 L56 18" stroke={C.gray} strokeWidth="3" fill="none" strokeLinejoin="round" />
      <path d="M8 50 L26 34 M56 50 L38 34" stroke={C.gray} strokeWidth="2" />
      <path d={heart(32, 37, 9)} fill={C.red} />
      <Sh d="M6 44 H58 V47 Q58 52 53 52 H11 Q6 52 6 47Z" o={0.06} />
    </g>
  ),
  '🐹': () => (
    <g>
      <circle cx="16" cy="18" r="7" fill="#E9A15E" />
      <circle cx="48" cy="18" r="7" fill="#E9A15E" />
      <circle cx="16" cy="18" r="3.6" fill="#FFB7A8" />
      <circle cx="48" cy="18" r="3.6" fill="#FFB7A8" />
      <ellipse cx="32" cy="36" rx="23" ry="21" fill="#F4B26C" />
      <ellipse cx="32" cy="44" rx="15" ry="11" fill={C.cream} />
      <circle cx="24" cy="33" r="3" fill={C.dark} />
      <circle cx="40" cy="33" r="3" fill={C.dark} />
      <circle cx="25" cy="32" r="1" fill="#fff" />
      <circle cx="41" cy="32" r="1" fill="#fff" />
      <ellipse cx="32" cy="38.5" rx="2.4" ry="1.7" fill="#E5737F" />
      <ellipse cx="17" cy="41" rx="4" ry="2.6" fill="#FF9FB5" opacity="0.8" />
      <ellipse cx="47" cy="41" rx="4" ry="2.6" fill="#FF9FB5" opacity="0.8" />
    </g>
  ),

  // ---------- Bem-estar ----------
  '🖐️': () => (
    <g>
      {[
        [17, 22, -18, 16],
        [26, 14, -6, 20],
        [36, 13, 4, 20],
        [45, 18, 14, 17],
      ].map(([x, y, r, h]) => (
        <rect key={x} x={x - 4.5} y={y - 4} width="9" height={h + 8} rx="4.5" fill={C.peach} transform={`rotate(${r} ${x} ${y + h})`} />
      ))}
      <rect x="6" y="34" width="9" height="20" rx="4.5" fill={C.peach} transform="rotate(-48 10 48)" />
      <path d="M14 36 Q14 30 22 30 H44 Q50 30 50 36 V46 Q50 60 32 60 Q14 60 14 46Z" fill={C.peach} />
      <Sh d="M50 36 V46 Q50 60 32 60 Q44 54 45 36Z" o={0.08} />
      <path d="M26 44 Q32 48 38 44" stroke={C.peachD} strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  ),
  '🍅': () => (
    <g>
      <ellipse cx="32" cy="38" rx="24" ry="21" fill={C.red} />
      <Sh d="M46 21 Q56 28 56 38 Q56 56 32 59 Q50 50 46 21Z" />
      <path d="M32 18 L24 12 L30 20 L18 20 L30 23 L24 30 L32 24 L40 30 L34 23 L46 20 L34 20 L40 12Z" fill={C.leaf} />
      <path d="M32 18 V8" stroke={C.leafD} strokeWidth="3" strokeLinecap="round" />
      <Hi x={19} y={34} rx={3.4} ry={6} r={20} />
    </g>
  ),
  '🛁': () => (
    <g>
      <path d="M50 30 V12 Q50 6 44 6 Q38 6 38 12" stroke={C.grayD} strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="18" cy="22" r="6" fill="#fff" />
      <circle cx="27" cy="18" r="7.5" fill="#fff" />
      <circle cx="36" cy="23" r="5.5" fill="#fff" />
      <circle cx="12" cy="28" r="4" fill="#fff" />
      <path d="M4 30 H60 V36 Q60 50 46 50 H18 Q4 50 4 36Z" fill="#fff" />
      <path d="M4 30 H60 V34 H4Z" fill={C.gray} />
      <Sh d="M60 36 Q60 50 46 50 H18 Q8 50 5 42 Q30 46 60 36Z" o={0.1} />
      <path d="M14 50 L10 58 M50 50 L54 58" stroke={C.yellowD} strokeWidth="4" strokeLinecap="round" />
      <circle cx="18" cy="22" r="6" fill={C.sky} opacity="0.4" />
    </g>
  ),
  '🛀': () => HABITS['🛁'](),
  '💐': () => (
    <g>
      <path d="M32 40 L22 34 M32 40 L40 30 M32 40 L32 26" stroke={C.leafD} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="20" cy="28" r="7" fill={C.pink} />
      <circle cx="20" cy="28" r="2.6" fill={C.yellow} />
      <circle cx="42" cy="24" r="7" fill={C.purple} />
      <circle cx="42" cy="24" r="2.6" fill={C.yellow} />
      <circle cx="31" cy="18" r="7.5" fill={C.yellow} />
      <circle cx="31" cy="18" r="2.8" fill={C.orange} />
      <path d="M16 36 Q32 30 48 36 L36 60 H28Z" fill={C.blue} />
      <path d="M28 60 L22 50 L34 46 Z" fill={C.blueD} opacity="0.5" />
      <path d="M26 44 Q32 48 38 44" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  ),
  '🫙': () => (
    <g>
      <rect x="18" y="6" width="28" height="8" rx="3" fill={C.woodD} />
      <path d="M16 18 Q16 14 20 14 H44 Q48 14 48 18 V20 Q54 24 54 32 V50 Q54 58 46 58 H18 Q10 58 10 50 V32 Q10 24 16 20Z" fill="#DDF1FF" />
      <path d={heart(25, 44, 6)} fill={C.pink} />
      <path d={star(40, 38, 6, 2.6)} fill={C.yellow} stroke={C.yellow} strokeWidth="1.4" strokeLinejoin="round" />
      <path d={heart(38, 51, 4.4)} fill={C.red} />
      <circle cx="26" cy="31" r="3" fill={C.purple} />
      <Sh d="M46 20 Q54 24 54 32 V50 Q54 58 46 58 H40 Q48 50 46 20Z" o={0.07} />
      <Hi x={15} y={36} rx={1.6} ry={9} o={0.8} />
    </g>
  ),
  '🧩': () => (
    <g>
      <path d="M10 20 H22 A6 6 0 1 1 34 20 H46 V32 A6 6 0 1 1 46 44 V56 H34 A6 6 0 1 0 22 56 H10 V44 A6 6 0 1 0 10 32Z" fill={C.green} />
      <Sh d="M46 32 A6 6 0 1 1 46 44 V56 H40 V24 H46Z" o={0.1} />
      <Hi x={16} y={26} rx={2.4} ry={3.4} />
    </g>
  ),
  '💡': () => (
    <g>
      <path d="M32 6 A18 18 0 0 0 20 37 Q24 41 24 46 H40 Q40 41 44 37 A18 18 0 0 0 32 6Z" fill={C.yellow} />
      <Sh d="M40 8 A18 18 0 0 1 44 37 Q40 41 40 46 H36 Q37 38 42 32 Q46 18 40 8Z" o={0.08} />
      <rect x="24" y="46" width="16" height="6" rx="2" fill={C.grayD} />
      <rect x="25" y="52" width="14" height="5" rx="2" fill={C.gray} />
      <path d="M28 58 H36" stroke={C.grayD} strokeWidth="3" strokeLinecap="round" />
      <path d="M28 40 V30 L32 34 L36 30 V40" stroke={C.orangeD} strokeWidth="2" fill="none" strokeLinejoin="round" />
      <Hi x={25} y={18} rx={3} ry={6} r={30} />
    </g>
  ),
  '📝': () => (
    <g>
      <rect x="8" y="8" width="38" height="48" rx="5" fill="#fff" />
      <rect x="8" y="8" width="38" height="8" rx="4" fill={C.yellow} />
      <path d="M15 26 H39 M15 34 H39 M15 42 H30" stroke={C.gray} strokeWidth="3" strokeLinecap="round" />
      <g transform="rotate(40 46 38)">
        <rect x="42" y="18" width="8" height="32" rx="2" fill={C.orange} />
        <path d="M42 50 L46 58 L50 50Z" fill={C.wood} />
        <path d="M45 55 L46 58 L47 55Z" fill={C.dark} />
        <rect x="42" y="16" width="8" height="5" rx="2" fill={C.pink} />
      </g>
      <Sh d="M8 50 H46 V51 Q46 56 41 56 H13 Q8 56 8 51Z" o={0.06} />
    </g>
  ),
  '👀': () => (
    <g>
      <ellipse cx="20" cy="32" rx="12" ry="16" fill="#fff" />
      <ellipse cx="44" cy="32" rx="12" ry="16" fill="#fff" />
      <Sh d="M30 24 Q34 32 30 42 Q28 47 20 48 A12 16 0 0 0 30 24Z" o={0.08} />
      <circle cx="23" cy="35" r="6" fill={C.dark} />
      <circle cx="47" cy="35" r="6" fill={C.dark} />
      <circle cx="25" cy="32.6" r="2" fill="#fff" />
      <circle cx="49" cy="32.6" r="2" fill="#fff" />
    </g>
  ),
  '👂': () => (
    <g>
      <path d="M22 26 Q22 8 36 8 Q50 8 50 24 Q50 34 42 40 Q36 44 36 52 Q36 58 30 58 Q24 58 22 52" fill={C.peach} />
      <path d="M30 26 Q30 16 37 16 Q43 16 43 23 Q43 29 38 32 Q34 34 34 40" stroke={C.peachD} strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <path d="M8 28 Q4 34 8 40 M14 24 Q8 34 14 44" stroke={C.purple} strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  ),
  '👃': () => (
    <g>
      <path d="M22 50 V38" stroke={C.leafD} strokeWidth="3" strokeLinecap="round" />
      <path d="M22 46 Q14 42 12 48 Q18 52 22 46Z" fill={C.leaf} />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="22" cy="24" rx="5" ry="8" fill={C.pink} transform={`rotate(${a} 22 32)`} />
      ))}
      <circle cx="22" cy="32" r="4.4" fill={C.yellow} />
      <path d="M36 30 Q40 26 36 22 Q32 18 36 14 M44 34 Q48 30 44 26 Q40 22 44 18 M52 30 Q56 26 52 22" stroke={C.purple} strokeWidth="2.8" fill="none" strokeLinecap="round" />
    </g>
  ),
  '👅': () => (
    <g>
      <path d="M22 30 L32 60 L42 30Z" fill={C.wood} />
      <path d="M24 34 L40 34 M26 40 L38 40 M28 46 L36 46" stroke={C.woodD} strokeWidth="1.6" />
      <circle cx="26" cy="24" r="10" fill={C.pink} />
      <circle cx="38" cy="24" r="10" fill={C.rose} />
      <circle cx="32" cy="16" r="10" fill="#FFF0C9" />
      <circle cx="33" cy="6" r="3.4" fill={C.red} />
      <Hi x={28} y={13} rx={2.4} ry={1.4} />
    </g>
  ),

  // ---------- Humor ----------
  '😣': () => (
    <g>
      <circle cx="32" cy="34" r="24" fill="#9FA8F0" />
      <Sh d="M48 16 A24 24 0 0 1 32 58 A24 24 0 0 0 48 16Z" o={0.1} />
      <path d="M18 30 L25 33 L18 36 M46 30 L39 33 L46 36" stroke={C.dark} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 46 L28 43 L32 46 L36 43 L40 46" stroke={C.dark} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  '😕': () => (
    <g>
      <circle cx="32" cy="34" r="24" fill="#8FCDF5" />
      <Sh d="M48 16 A24 24 0 0 1 32 58 A24 24 0 0 0 48 16Z" o={0.1} />
      <circle cx="24" cy="32" r="3" fill={C.dark} />
      <circle cx="40" cy="32" r="3" fill={C.dark} />
      <path d="M25 46 Q32 41 39 44" stroke={C.dark} strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </g>
  ),
  '😐': () => (
    <g>
      <circle cx="32" cy="34" r="24" fill="#A9DEC0" />
      <Sh d="M48 16 A24 24 0 0 1 32 58 A24 24 0 0 0 48 16Z" o={0.1} />
      <circle cx="24" cy="32" r="3" fill={C.dark} />
      <circle cx="40" cy="32" r="3" fill={C.dark} />
      <path d="M25 44 H39" stroke={C.dark} strokeWidth="2.6" strokeLinecap="round" />
    </g>
  ),
  '🙂': () => (
    <g>
      <circle cx="32" cy="34" r="24" fill="#C5E58A" />
      <Sh d="M48 16 A24 24 0 0 1 32 58 A24 24 0 0 0 48 16Z" o={0.1} />
      <Face x={32} y={32} w={16} />
    </g>
  ),
  '😄': () => (
    <g>
      <circle cx="32" cy="34" r="24" fill={C.yellow} />
      <Sh d="M48 16 A24 24 0 0 1 32 58 A24 24 0 0 0 48 16Z" o={0.1} />
      <path d="M20 31 Q24 26 28 31 M36 31 Q40 26 44 31" stroke={C.dark} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M22 38 H42 Q42 50 32 50 Q22 50 22 38Z" fill={C.dark} />
      <path d="M26 46 Q32 42 38 46 Q36 50 32 50 Q28 50 26 46Z" fill="#FF8FA3" />
      <ellipse cx="17" cy="40" rx="3.4" ry="2.2" fill="#FF9FB5" />
      <ellipse cx="47" cy="40" rx="3.4" ry="2.2" fill="#FF9FB5" />
    </g>
  ),
  '😌': () => (
    <g>
      <circle cx="32" cy="34" r="24" fill="#D9C6FF" />
      <path d="M20 32 Q24 36 28 32 M36 32 Q40 36 44 32" stroke={C.dark} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M27 43 Q32 47 37 43" stroke={C.dark} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <ellipse cx="17" cy="39" rx="3.4" ry="2.2" fill="#FF9FB5" />
      <ellipse cx="47" cy="39" rx="3.4" ry="2.2" fill="#FF9FB5" />
    </g>
  ),
};

/** Corações coloridos e brilhos (comemorações e reações). */
const hearts: Record<string, string> = { '💗': C.pink, '💖': C.pink, '💙': C.blue, '💜': C.purple, '❤️': C.red, '🧡': C.orange, '💚': C.green };
for (const [e, color] of Object.entries(hearts)) {
  HABITS[e] = () => (
    <g>
      <path d={heart(32, 34, 25)} fill={color} />
      <Sh d="M52 16 Q60 26 51 39 Q43 51 32 54 Q49 41 52 16Z" />
      <Hi x={19} y={22} rx={3.6} ry={5.4} r={-35} />
      {e === '💖' && <path d={sparkle(52, 10, 6)} fill={C.yellow} />}
      {e === '💗' && <path d={heart(50, 12, 6)} fill={C.pinkD} />}
    </g>
  );
}
HABITS['✨'] = () => (
  <g>
    <path d={sparkle(28, 36, 20)} fill={C.yellow} />
    <path d={sparkle(50, 14, 9)} fill={C.yellow} />
    <path d={sparkle(52, 48, 6)} fill={C.orange} />
  </g>
);
