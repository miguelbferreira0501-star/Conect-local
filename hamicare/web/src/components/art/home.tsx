// Ilustrações da casa do Hami: móveis, decoração e brinquedos.
import { C, Face, Hi, Pot, Sh, heart, sparkle, star, type Draw } from './kit';

export const HOME: Record<string, Draw> = {
  // ---------- Móveis ----------
  '🪑': () => (
    <g>
      <rect x="18" y="4" width="28" height="30" rx="7" fill={C.woodD} />
      <rect x="22" y="9" width="20" height="20" rx="4" fill={C.wood} />
      <rect x="14" y="32" width="36" height="9" rx="4" fill={C.wood} />
      <path d="M18 41 V60 M46 41 V60" stroke={C.woodD} strokeWidth="5" strokeLinecap="round" />
      <path d="M24 41 V54 M40 41 V54" stroke={C.brownD} strokeWidth="3.4" strokeLinecap="round" />
      <rect x="14" y="38" width="36" height="3" fill="#000" opacity="0.1" />
    </g>
  ),

  // ---------- Martelinho (conserta a ofensiva) e escudo do Guardião ----------
  '🔨': () => (
    <g>
      <path d="M34 26 L50 58" stroke={C.woodD} strokeWidth="9" strokeLinecap="round" />
      <path d="M34 26 L50 58" stroke={C.wood} strokeWidth="5" strokeLinecap="round" />
      <path d="M12 22 Q10 12 20 9 L40 4 Q48 2 50 10 L52 16 Q54 24 46 26 L24 32 Q14 34 12 22Z" fill={C.pink} transform="rotate(-18 32 18)" />
      <path d="M14 23 L46 15" stroke={C.pinkD} strokeWidth="3" opacity="0.6" transform="rotate(-18 32 18)" />
      <Hi x={26} y={12} rx={9} ry={3} r={-30} />
      <path d={heart(31, 19, 4.5)} fill="#fff" opacity="0.9" />
      <path d={sparkle(54, 32, 5)} fill={C.yellow} />
      <path d={sparkle(8, 40, 4)} fill={C.yellow} />
    </g>
  ),
  '🛡️': () => (
    <g>
      <path d="M32 4 L54 12 V30 Q54 50 32 60 Q10 50 10 30 V12Z" fill={C.purpleD} />
      <path d="M32 9 L49 15.5 V30 Q49 46 32 54.5 Q15 46 15 30 V15.5Z" fill={C.purple} />
      <Sh d="M32 9 L49 15.5 V30 Q49 46 32 54.5Z" o={0.12} />
      <path d={heart(32, 32, 11)} fill={C.pink} />
      <path d={heart(32, 32, 11)} fill="none" stroke="#fff" strokeWidth="2" opacity="0.7" />
      <Hi x={24} y={20} rx={6} ry={3} r={-30} />
      <path d={sparkle(52, 8, 4.5)} fill={C.yellow} />
    </g>
  ),

  // ---------- Plantas ----------
  '🪴': () => (
    <g>
      <path d="M32 44 V22" stroke={C.leafD} strokeWidth="3" />
      <path d="M32 30 Q14 30 8 14 Q26 10 32 30Z" fill={C.leaf} />
      <path d="M32 26 Q48 22 56 8 Q36 4 32 26Z" fill={C.green} />
      <path d="M32 40 Q50 40 58 28 Q40 22 32 40Z" fill={C.leaf} />
      <path d="M32 40 Q16 42 6 32 Q22 24 32 40Z" fill={C.green} />
      <path d="M14 16 L22 22 M48 12 L42 18 M52 30 L44 34 M12 33 L20 36" stroke="#fff" strokeWidth="1.6" opacity="0.5" strokeLinecap="round" />
      <Pot color={C.orange} />
    </g>
  ),
  '🌵': () => (
    <g>
      <path d="M26 46 V16 Q26 8 32 8 Q38 8 38 16 V46Z" fill={C.green} />
      <path d="M26 34 H18 Q14 34 14 30 V22 Q14 18 17 18 Q20 18 20 22 V28 H26Z" fill={C.green} />
      <path d="M38 28 H44 V18 Q44 14 47 14 Q50 14 50 18 V28 Q50 34 44 34 H38Z" fill={C.green} />
      <Sh d="M34 8.6 Q38 10 38 16 V46 H34Z" o={0.12} />
      <path d="M30 14 v2 M30 24 v2 M33 19 v2 M30 34 v2 M17 24 v2 M47 21 v2" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="32" cy="8" r="3.4" fill={C.pink} />
      <Pot color={C.purple} y={46} />
    </g>
  ),
  '🌷': () => (
    <g>
      <path d="M32 40 V22 M24 40 Q22 30 20 24 M40 40 Q42 30 44 24" stroke={C.leafD} strokeWidth="2.6" fill="none" />
      <path d="M26 36 Q16 34 14 26 Q24 26 26 36Z" fill={C.leaf} />
      <path d="M38 36 Q48 34 50 26 Q40 26 38 36Z" fill={C.leaf} />
      {[
        [20, 18, C.pink],
        [44, 18, C.yellow],
        [32, 14, C.red],
      ].map(([x, y, col]) => (
        <path key={String(x)} d={`M${Number(x) - 6} ${Number(y) - 4} L${Number(x) - 3} ${Number(y) - 1} L${x} ${Number(y) - 6} L${Number(x) + 3} ${Number(y) - 1} L${Number(x) + 6} ${Number(y) - 4} V${Number(y) + 2} Q${Number(x) + 6} ${Number(y) + 8} ${x} ${Number(y) + 8} Q${Number(x) - 6} ${Number(y) + 8} ${Number(x) - 6} ${Number(y) + 2}Z`} fill={String(col)} />
      ))}
      <path d="M20 40 H44 Q46 40 46 43 Q48 60 32 60 Q16 60 18 43 Q18 40 20 40Z" fill={C.sky} />
      <Sh d="M40 40 H44 Q46 40 46 43 Q48 60 32 60 Q42 54 40 40Z" o={0.1} />
      <Hi x={23} y={48} rx={1.6} ry={5} />
    </g>
  ),
  '🌺': () => (
    <g>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="32" cy="16" rx="10" ry="13" fill={a % 144 ? C.red : '#F5828A'} transform={`rotate(${a} 32 30)`} />
      ))}
      <circle cx="32" cy="30" r="6" fill={C.redD} />
      <path d="M32 30 Q40 22 44 12" stroke={C.yellowD} strokeWidth="2" fill="none" />
      <circle cx="44" cy="12" r="2.6" fill={C.yellow} />
      <path d="M14 54 Q24 44 32 52 Q22 60 14 54Z M50 54 Q40 44 32 52 Q42 60 50 54Z" fill={C.leaf} />
    </g>
  ),
  '🌴': () => (
    <g>
      <path d="M32 46 Q30 30 34 18" stroke={C.brown} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M34 18 Q20 8 6 18 Q20 16 34 18Z" fill={C.leaf} />
      <path d="M34 18 Q48 6 60 16 Q46 14 34 18Z" fill={C.green} />
      <path d="M34 18 Q22 20 14 32 Q26 22 34 18Z" fill={C.green} />
      <path d="M34 18 Q46 20 54 32 Q42 22 34 18Z" fill={C.leaf} />
      <path d="M34 18 Q32 6 38 2 Q36 10 34 18Z" fill={C.leafD} />
      <circle cx="31" cy="21" r="3" fill={C.choc} />
      <circle cx="36" cy="22" r="3" fill={C.choc} />
      <Pot color={C.wood} y={46} />
    </g>
  ),
  '🍄': () => (
    <g>
      <path d="M24 34 H40 L42 54 Q42 60 32 60 Q22 60 22 54Z" fill={C.cream} />
      <Sh d="M36 34 H40 L42 54 Q42 60 32 60 Q38 56 36 34Z" o={0.1} />
      <path d="M6 36 Q6 8 32 8 Q58 8 58 36Z" fill={C.red} />
      <Sh d="M44 11 Q58 18 58 36 H46 Q50 22 44 11Z" o={0.12} />
      <circle cx="20" cy="24" r="5" fill="#fff" />
      <circle cx="36" cy="17" r="4" fill="#fff" />
      <circle cx="45" cy="29" r="4.6" fill="#fff" />
      <circle cx="29" cy="31" r="3" fill="#fff" />
    </g>
  ),

  // ---------- Decoração ----------
  '🖼️': () => (
    <g>
      <rect x="6" y="10" width="52" height="44" rx="4" fill={C.woodD} />
      <rect x="12" y="16" width="40" height="32" rx="2" fill={C.sky} />
      <circle cx="42" cy="25" r="5" fill={C.yellow} />
      <path d="M12 48 L24 30 L32 40 L38 33 L52 48Z" fill={C.green} />
      <path d="M12 48 L24 30 L28 35 L22 48Z" fill={C.leafD} opacity="0.5" />
      <path d="M32 2 L22 10 M32 2 L42 10" stroke={C.grayD} strokeWidth="1.6" />
    </g>
  ),
  '🕰️': () => (
    <g>
      <path d="M18 14 Q18 4 32 4 Q46 4 46 14 V60 H18Z" fill={C.brown} />
      <circle cx="32" cy="17" r="10" fill={C.cream} />
      <path d="M32 17 V11 M32 17 L36 20" stroke={C.dark} strokeWidth="2" strokeLinecap="round" />
      <rect x="23" y="31" width="18" height="24" rx="3" fill={C.choc} />
      <path d="M32 33 V46" stroke={C.yellowD} strokeWidth="1.6" />
      <circle cx="32" cy="47" r="4" fill={C.yellow} />
      <Sh d="M40 5.5 Q46 8 46 14 V60 H41Z" o={0.12} />
    </g>
  ),
  '🕯️': () => (
    <g>
      <ellipse cx="32" cy="16" rx="10" ry="12" fill={C.yellow} opacity="0.25" />
      <path d="M32 6 Q38 14 32 22 Q26 14 32 6Z" fill={C.orange} />
      <path d="M32 11 Q35 16 32 20 Q29 16 32 11Z" fill={C.yellow} />
      <path d="M32 22 V26" stroke={C.dark} strokeWidth="1.6" />
      <rect x="22" y="26" width="20" height="28" rx="4" fill={C.rose} />
      <path d="M22 30 Q26 34 28 30 Q30 36 32 30" stroke="#fff" strokeWidth="2" fill="none" opacity="0.8" />
      <ellipse cx="32" cy="56" rx="18" ry="5" fill={C.grayD} />
      <ellipse cx="32" cy="54.5" rx="14" ry="3" fill={C.gray} />
    </g>
  ),
  '🌈': () => (
    <g fill="none" strokeLinecap="round">
      <path d="M8 46 A24 24 0 0 1 56 46" stroke={C.red} strokeWidth="6" />
      <path d="M14 46 A18 18 0 0 1 50 46" stroke={C.yellow} strokeWidth="6" />
      <path d="M20 46 A12 12 0 0 1 44 46" stroke={C.blue} strokeWidth="6" />
      <g fill="#fff">
        <circle cx="10" cy="48" r="6" />
        <circle cx="17" cy="46" r="6" />
        <circle cx="5" cy="51" r="4" />
        <rect x="4" y="48" width="18" height="6" rx="3" />
        <circle cx="54" cy="48" r="6" />
        <circle cx="47" cy="46" r="6" />
        <circle cx="59" cy="51" r="4" />
        <rect x="42" y="48" width="18" height="6" rx="3" />
      </g>
    </g>
  ),
  '☁️': () => (
    <g>
      <path d="M14 46 A10 10 0 0 1 14 26 A12 12 0 0 1 34 18 A14 14 0 0 1 52 30 A8 8 0 0 1 52 46Z" fill="#fff" />
      <Sh d="M14 46 H52 A8 8 0 0 0 58 34 Q56 42 48 42 H12 Q8 42 6 39 Q8 46 14 46Z" o={0.07} />
      <Face x={32} y={34} w={10} />
    </g>
  ),
  '🐠': () => (
    <g>
      <path d="M14 18 H50 Q60 28 58 42 Q55 58 32 58 Q9 58 6 42 Q4 28 14 18Z" fill="#CFEFFF" />
      <path d="M7 30 H57 Q60 36 58 42 Q55 58 32 58 Q9 58 6 42 Q4 36 7 30Z" fill={C.sky} />
      <rect x="12" y="14" width="40" height="5" rx="2.5" fill={C.blue} opacity="0.5" />
      <path d="M22 44 Q30 36 38 44 Q30 52 22 44Z" fill={C.orange} />
      <path d="M38 44 L46 38 V50Z" fill={C.orange} />
      <path d="M28 40 V48" stroke="#fff" strokeWidth="2" />
      <circle cx="26" cy="43" r="1.4" fill={C.dark} />
      <path d="M14 58 Q14 48 18 46 Q16 52 20 58 M50 58 Q50 50 46 47 Q48 52 44 58" fill={C.leaf} />
      <circle cx="44" cy="30" r="2" fill="#fff" />
      <circle cx="48" cy="24" r="1.4" fill="#fff" />
      <Hi x={12} y={36} rx={2} ry={8} o={0.7} />
    </g>
  ),
  '🎄': () => (
    <g>
      <rect x="28" y="50" width="8" height="10" fill={C.brown} />
      <path d="M32 8 L50 30 H42 L54 46 H10 L22 30 H14Z" fill={C.leaf} />
      <path d="M32 8 L50 30 H42 L54 46 H40Z" fill={C.leafD} opacity="0.4" />
      <path d={star(32, 8, 6, 2.6)} fill={C.yellow} stroke={C.yellow} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="26" cy="26" r="2.6" fill={C.red} />
      <circle cx="36" cy="34" r="2.6" fill={C.yellow} />
      <circle cx="22" cy="40" r="2.6" fill={C.blue} />
      <circle cx="42" cy="42" r="2.6" fill={C.red} />
      <rect x="18" y="46" width="28" height="5" rx="2" fill={C.red} />
    </g>
  ),
  '🪞': () => (
    <g>
      <ellipse cx="32" cy="28" rx="18" ry="24" fill={C.yellowD} />
      <ellipse cx="32" cy="28" rx="13" ry="19" fill={C.sky} />
      <path d="M24 16 L36 38 M30 12 L40 30" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <path d="M26 52 L22 60 M38 52 L42 60" stroke={C.yellowD} strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  '📺': () => (
    <g>
      <path d="M24 4 L32 14 L40 4" stroke={C.dark} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <rect x="6" y="14" width="52" height="38" rx="8" fill={C.orange} />
      <rect x="12" y="20" width="32" height="26" rx="6" fill="#7FC8E8" />
      <path d="M16 26 Q20 22 24 26" stroke="#fff" strokeWidth="2" fill="none" opacity="0.7" />
      <circle cx="51" cy="26" r="3" fill={C.cream} />
      <circle cx="51" cy="36" r="3" fill={C.cream} />
      <path d="M14 52 L12 58 M50 52 L52 58" stroke={C.brownD} strokeWidth="3.4" strokeLinecap="round" />
      <Sh d="M50 14 a8 8 0 0 1 8 8 v22 a8 8 0 0 1 -8 8 h-2 Q54 34 50 14Z" o={0.1} />
    </g>
  ),
  '🎹': () => (
    <g>
      <rect x="6" y="10" width="52" height="34" rx="4" fill={C.choc} />
      <rect x="10" y="14" width="44" height="12" rx="2" fill={C.brown} />
      <rect x="8" y="30" width="48" height="12" rx="1.5" fill="#fff" />
      {[14, 20, 26, 32, 38, 44, 50].map((x) => (
        <path key={x} d={`M${x} 30 V42`} stroke={C.gray} strokeWidth="1" />
      ))}
      {[12, 18, 30, 36, 42].map((x) => (
        <rect key={x} x={x} y="30" width="3.6" height="7" rx="1" fill={C.dark} />
      ))}
      <path d="M10 44 V58 M54 44 V58" stroke={C.choc} strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  '🎸': () => (
    <g transform="rotate(30 32 32)">
      <rect x="29" y="2" width="6" height="30" rx="1.5" fill={C.choc} />
      <rect x="27" y="0" width="10" height="7" rx="2" fill={C.choc} />
      <path d="M32 26 Q22 26 22 36 Q16 40 16 48 Q16 60 32 60 Q48 60 48 48 Q48 40 42 36 Q42 26 32 26Z" fill={C.orange} />
      <circle cx="32" cy="42" r="5" fill={C.choc} />
      <rect x="27" y="51" width="10" height="3" rx="1" fill={C.choc} />
      <path d="M31 6 V52 M33 6 V52" stroke="#fff" strokeWidth="0.6" />
      <Sh d="M40 28 Q42 30 42 36 Q48 40 48 48 Q48 60 32 60 Q44 52 40 28Z" o={0.12} />
    </g>
  ),
  '📻': () => (
    <g>
      <path d="M14 18 L46 6" stroke={C.grayD} strokeWidth="2.4" strokeLinecap="round" />
      <rect x="6" y="18" width="52" height="36" rx="8" fill={C.teal} />
      <circle cx="22" cy="36" r="10" fill={C.tealD} />
      {[30, 34, 38, 42].map((y) => (
        <path key={y} d={`M14 ${y} H30`} stroke={C.teal} strokeWidth="1.6" />
      ))}
      <rect x="38" y="26" width="14" height="8" rx="2" fill={C.cream} />
      <circle cx="41" cy="44" r="3.4" fill={C.yellow} />
      <circle cx="50" cy="44" r="3.4" fill={C.yellow} />
      <Sh d="M50 18 a8 8 0 0 1 8 8 v20 a8 8 0 0 1 -8 8 h-2 Q54 34 50 18Z" o={0.1} />
    </g>
  ),
  '🏮': () => (
    <g>
      <path d="M32 2 V8" stroke={C.dark} strokeWidth="2" />
      <rect x="24" y="8" width="16" height="5" rx="2" fill={C.yellowD} />
      <ellipse cx="32" cy="32" rx="20" ry="20" fill={C.red} />
      <path d="M32 12 Q20 32 32 52 M32 12 Q44 32 32 52 M14 24 H50 M13 32 H51 M14 40 H50" stroke={C.redD} strokeWidth="1.6" fill="none" />
      <rect x="24" y="51" width="16" height="5" rx="2" fill={C.yellowD} />
      <path d="M30 56 V62 M34 56 V62" stroke={C.yellow} strokeWidth="2" />
      <Hi x={22} y={26} rx={3} ry={6} r={20} o={0.4} />
    </g>
  ),
  '🎐': () => (
    <g>
      <path d="M32 2 V10" stroke={C.dark} strokeWidth="2" />
      <path d="M18 24 Q18 10 32 10 Q46 10 46 24Z" fill={C.sky} />
      <path d="M22 18 Q26 14 30 18" stroke={C.blue} strokeWidth="2" fill="none" />
      <path d="M32 24 V40" stroke={C.dark} strokeWidth="1.4" />
      <rect x="26" y="40" width="12" height="20" rx="2" fill={C.pink} transform="rotate(8 32 50)" />
      <path d="M22 24 V32 M42 24 V34" stroke={C.grayD} strokeWidth="1.4" />
      <rect x="20" y="31" width="4" height="7" rx="2" fill={C.yellowD} />
      <rect x="40" y="33" width="4" height="7" rx="2" fill={C.yellowD} />
    </g>
  ),
  '🏆': () => (
    <g>
      <path d="M18 12 H8 Q8 28 20 28 M46 12 H56 Q56 28 44 28" stroke={C.yellowD} strokeWidth="4" fill="none" />
      <path d="M16 6 H48 V20 Q48 38 32 38 Q16 38 16 20Z" fill={C.yellow} />
      <Sh d="M40 6 H48 V20 Q48 38 32 38 Q44 30 40 6Z" o={0.12} />
      <rect x="28" y="38" width="8" height="10" fill={C.yellowD} />
      <rect x="18" y="48" width="28" height="10" rx="3" fill={C.brown} />
      <rect x="24" y="51" width="16" height="4" rx="1.5" fill={C.yellow} />
      <path d={star(32, 20, 7, 3)} fill="#fff" opacity="0.85" />
      <Hi x={21} y={14} rx={1.8} ry={5} />
    </g>
  ),
  '🎀': () => (
    <g>
      <path d="M32 30 L8 14 Q2 22 6 34 Q10 46 32 34Z" fill={C.pink} />
      <path d="M32 30 L56 14 Q62 22 58 34 Q54 46 32 34Z" fill={C.pink} />
      <path d="M28 34 L20 58 L26 54 L30 60 L32 36Z M36 34 L44 58 L38 54 L34 60 L32 36Z" fill={C.pinkD} />
      <Sh d="M32 32 L8 14 Q4 18 4 24 Q20 26 32 32Z" o={0.1} />
      <rect x="26" y="26" width="12" height="12" rx="4" fill={C.pinkD} />
    </g>
  ),
  '🎂': () => (
    <g>
      <rect x="10" y="32" width="44" height="24" rx="5" fill={C.wood} />
      <path d="M10 36 Q10 30 16 30 H48 Q54 30 54 36 V40 Q49 46 44 40 Q39 46 34 40 Q29 46 24 40 Q19 46 14 40 Q12 42 10 40Z" fill={C.rose} />
      <rect x="10" y="48" width="44" height="3" fill={C.pink} />
      <ellipse cx="32" cy="58" rx="26" ry="3.4" fill={C.gray} />
      {[22, 32, 42].map((x, i) => (
        <g key={x}>
          <rect x={x - 2} y="18" width="4" height="12" rx="1.5" fill={[C.blue, C.yellow, C.purple][i]} />
          <path d={`M${x} 10 Q${x + 3.4} 14 ${x} 17 Q${x - 3.4} 14 ${x} 10Z`} fill={C.orange} />
        </g>
      ))}
    </g>
  ),
  '🧁': () => (
    <g>
      <path d="M16 34 H48 L44 58 H20Z" fill={C.blue} />
      <path d="M22 34 L24 58 M30 34 L30 58 M38 34 L36 58 M44 34 L41 58" stroke={C.blueD} strokeWidth="1.6" />
      <path d="M12 34 Q10 26 18 24 Q18 12 30 14 Q36 6 44 14 Q54 16 52 26 Q56 30 52 34Z" fill={C.rose} />
      <path d="M18 26 Q26 22 30 26 M36 22 Q42 18 46 24" stroke="#fff" strokeWidth="2" fill="none" opacity="0.6" strokeLinecap="round" />
      <circle cx="32" cy="8" r="4.4" fill={C.red} />
      <circle cx="22" cy="20" r="1.4" fill={C.yellow} />
      <circle cx="40" cy="28" r="1.4" fill={C.blue} />
      <circle cx="28" cy="30" r="1.4" fill={C.green} />
    </g>
  ),
  '🌞': () => (
    <g>
      <path d={star(32, 32, 29, 19, 10)} fill={C.orange} stroke={C.orange} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="32" cy="32" r="18" fill={C.yellow} />
      <Face x={32} y={31} w={12} />
    </g>
  ),
  '🦋': () => (
    <g>
      <path d="M31 30 Q20 4 8 12 Q2 20 12 30 Q4 40 14 48 Q24 50 31 34Z" fill={C.purple} />
      <path d="M33 30 Q44 4 56 12 Q62 20 52 30 Q60 40 50 48 Q40 50 33 34Z" fill={C.purple} />
      <path d="M31 30 Q22 14 14 18 Q12 24 18 28Z M33 30 Q42 14 50 18 Q52 24 46 28Z" fill={C.lilac} />
      <circle cx="16" cy="40" r="3" fill={C.yellow} />
      <circle cx="48" cy="40" r="3" fill={C.yellow} />
      <rect x="29.5" y="20" width="5" height="26" rx="2.5" fill={C.dark} />
      <path d="M31 21 Q28 12 24 10 M33 21 Q36 12 40 10" stroke={C.dark} strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </g>
  ),
  '🐚': () => (
    <g>
      <path d="M32 8 L8 40 Q8 54 20 56 H44 Q56 54 56 40Z" fill={C.rose} />
      <path d="M32 8 L16 52 M32 8 L26 56 M32 8 L38 56 M32 8 L48 52" stroke={C.pink} strokeWidth="2.4" fill="none" />
      <rect x="22" y="52" width="20" height="8" rx="4" fill={C.pink} />
      <Sh d="M32 8 L56 40 Q56 54 44 56 H40Z" o={0.08} />
    </g>
  ),
  '🗺️': () => (
    <g>
      <path d="M6 14 L22 8 L42 14 L58 8 V50 L42 56 L22 50 L6 56Z" fill={C.cream} />
      <path d="M22 8 V50 M42 14 V56" stroke={C.wood} strokeWidth="1.6" />
      <path d="M6 14 L22 8 V50 L6 56Z" fill="#000" opacity="0.05" />
      <path d="M42 14 L58 8 V50 L42 56Z" fill="#000" opacity="0.05" />
      <path d="M12 44 Q20 30 30 36 Q38 40 44 26" stroke={C.red} strokeWidth="2.4" fill="none" strokeDasharray="3 3" strokeLinecap="round" />
      <path d="M44 20 L52 28 M52 20 L44 28" stroke={C.red} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M10 22 Q14 18 18 22 Q14 26 10 22Z" fill={C.green} />
    </g>
  ),
  '📷': () => (
    <g>
      <rect x="6" y="18" width="52" height="36" rx="7" fill={C.dark} />
      <path d="M22 18 L26 10 H38 L42 18Z" fill={C.dark} />
      <rect x="6" y="24" width="52" height="6" fill={C.wood} />
      <circle cx="32" cy="36" r="13" fill={C.gray} />
      <circle cx="32" cy="36" r="9" fill={C.blueD} />
      <circle cx="35" cy="33" r="3" fill="#fff" opacity="0.8" />
      <rect x="46" y="20" width="7" height="3" rx="1" fill={C.yellow} />
    </g>
  ),
  '📸': () => (
    <g>
      {HOME['📷']()}
      <path d={sparkle(54, 10, 7)} fill={C.yellow} />
    </g>
  ),
  '🎁': () => (
    <g>
      <rect x="10" y="28" width="44" height="30" rx="4" fill={C.purple} />
      <rect x="6" y="20" width="52" height="11" rx="3" fill={C.purpleD} />
      <rect x="28" y="20" width="8" height="38" fill={C.yellow} />
      <path d="M32 20 Q20 6 14 12 Q12 20 32 20Z M32 20 Q44 6 50 12 Q52 20 32 20Z" fill={C.yellow} />
      <Sh d="M46 31 H54 V54 Q54 58 50 58 H46Z" o={0.1} />
    </g>
  ),
  '🌍': () => (
    <g>
      <path d="M14 30 A20 20 0 0 0 46 46" stroke={C.yellowD} strokeWidth="3" fill="none" />
      <circle cx="32" cy="28" r="20" fill={C.blue} />
      <path d="M18 16 Q24 14 26 20 Q30 24 26 30 Q20 30 18 24Z M34 10 Q42 10 46 18 Q40 22 36 18Z M36 30 Q44 28 48 34 Q44 44 36 44 Q32 38 36 30Z" fill={C.green} />
      <Sh d="M44 12 A20 20 0 0 1 32 48 A20 20 0 0 0 44 12Z" o={0.12} />
      <path d="M32 48 V54" stroke={C.yellowD} strokeWidth="3" />
      <rect x="20" y="54" width="24" height="6" rx="3" fill={C.yellowD} />
    </g>
  ),
  '⛺': () => (
    <g>
      <path d="M32 6 L58 56 H6Z" fill={C.orange} />
      <path d="M32 6 L58 56 H44Z" fill={C.orangeD} />
      <path d="M32 24 L42 56 H22Z" fill={C.choc} />
      <path d="M32 24 L40 50 L32 46Z" fill={C.cream} />
      <path d="M32 6 L28 2 M32 6 L36 2" stroke={C.brownD} strokeWidth="2" strokeLinecap="round" />
      <path d="M2 56 H62" stroke={C.green} strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  '🏰': () => (
    <g>
      <rect x="10" y="26" width="44" height="32" fill="#E6E2F5" />
      <rect x="6" y="18" width="14" height="40" fill={C.lilac} />
      <rect x="44" y="18" width="14" height="40" fill={C.lilac} />
      <path d="M4 18 L13 4 L22 18Z M42 18 L51 4 L60 18Z" fill={C.pink} />
      <path d="M22 26 V20 H26 V24 H30 V20 H34 V24 H38 V20 H42 V26Z" fill="#E6E2F5" />
      <path d="M26 58 V46 Q32 38 38 46 V58Z" fill={C.purpleD} />
      <rect x="10" y="28" width="6" height="8" rx="3" fill={C.purpleD} />
      <rect x="48" y="28" width="6" height="8" rx="3" fill={C.purpleD} />
      <path d="M51 4 V0 L56 2Z" fill={C.yellow} />
      <Sh d="M50 18 H58 V58 H50Z" o={0.08} />
    </g>
  ),
  '🚀': () => (
    <g transform="rotate(35 32 32)">
      <path d="M32 2 Q46 14 44 40 H20 Q18 14 32 2Z" fill="#fff" />
      <Sh d="M36 6 Q46 14 44 40 H38 Q42 20 36 6Z" o={0.1} />
      <path d="M32 2 Q40 8 42 14 H22 Q24 8 32 2Z" fill={C.red} />
      <circle cx="32" cy="24" r="6" fill={C.blue} />
      <circle cx="32" cy="24" r="3.6" fill={C.sky} />
      <path d="M20 32 L10 46 L20 44Z M44 32 L54 46 L44 44Z" fill={C.red} />
      <path d="M24 40 H40 L36 48 H28Z" fill={C.grayD} />
      <path d="M28 48 Q32 62 36 48Z" fill={C.orange} />
      <path d="M30 48 Q32 56 34 48Z" fill={C.yellow} />
    </g>
  ),
  '🛸': () => (
    <g>
      <path d="M20 30 Q20 12 32 12 Q44 12 44 30Z" fill={C.sky} opacity="0.9" />
      <circle cx="32" cy="24" r="5" fill={C.green} />
      <circle cx="30" cy="23" r="1.2" fill={C.dark} />
      <circle cx="34" cy="23" r="1.2" fill={C.dark} />
      <ellipse cx="32" cy="34" rx="28" ry="9" fill={C.grayD} />
      <ellipse cx="32" cy="31" rx="24" ry="6" fill={C.gray} />
      {[14, 24, 34, 44].map((x, i) => (
        <circle key={x} cx={x + 3} cy="36" r="2.2" fill={i % 2 ? C.yellow : C.pink} />
      ))}
      <path d="M22 44 L14 60 H50 L42 44Z" fill={C.yellow} opacity="0.3" />
    </g>
  ),
  '🪐': () => (
    <g>
      <circle cx="32" cy="32" r="17" fill={C.orange} />
      <path d="M17 26 Q32 22 47 26 M16 34 Q32 38 48 34" stroke={C.orangeD} strokeWidth="3" fill="none" opacity="0.6" />
      <ellipse cx="32" cy="34" rx="30" ry="8" fill="none" stroke={C.purple} strokeWidth="4" transform="rotate(-15 32 34)" />
      <path d="M15 28 A17 17 0 0 1 49 28" fill={C.orange} transform="rotate(-15 32 34)" />
      <Hi x={24} y={22} rx={3} ry={4.4} r={-30} />
    </g>
  ),
  '🪩': () => (
    <g>
      <path d="M32 2 V12" stroke={C.grayD} strokeWidth="2.4" />
      <circle cx="32" cy="34" r="22" fill="#B9C6DB" />
      {[-14, -6, 2, 10].map((y) => (
        <path key={y} d={`M${32 - Math.sqrt(484 - (y + 2) * (y + 2))} ${34 + y + 2} H${32 + Math.sqrt(484 - (y + 2) * (y + 2))}`} stroke="#fff" strokeWidth="1.4" opacity="0.55" />
      ))}
      {[-14, -6, 2, 10].map((x) => (
        <path key={x} d={`M${32 + x + 2} ${34 - Math.sqrt(484 - (x + 2) * (x + 2))} V${34 + Math.sqrt(484 - (x + 2) * (x + 2))}`} stroke="#fff" strokeWidth="1.4" opacity="0.55" />
      ))}
      <rect x="20" y="22" width="8" height="8" fill={C.pink} opacity="0.75" />
      <rect x="36" y="38" width="8" height="8" fill={C.blue} opacity="0.7" />
      <rect x="40" y="22" width="6" height="8" fill={C.yellow} opacity="0.8" />
      <path d={sparkle(54, 14, 5)} fill={C.yellow} />
      <path d={sparkle(10, 52, 4)} fill={C.pink} />
    </g>
  ),
  '🎠': () => (
    <g>
      <path d="M4 20 L32 4 L60 20Z" fill={C.pink} />
      <path d="M4 20 Q11 26 18 20 Q25 26 32 20 Q39 26 46 20 Q53 26 60 20Z" fill={C.yellow} />
      <path d="M32 4 V0" stroke={C.yellowD} strokeWidth="2" />
      <path d="M14 22 V54 M32 22 V54 M50 22 V54" stroke={C.yellowD} strokeWidth="2.4" />
      <path d="M22 38 Q22 32 28 32 H36 Q40 30 42 34 L38 38 Q36 44 30 44 H26 L24 48 M28 44 L26 50" fill={C.cream} stroke={C.cream} strokeWidth="2" strokeLinejoin="round" />
      <rect x="4" y="52" width="56" height="8" rx="3" fill={C.purple} />
    </g>
  ),
  '⛄': () => (
    <g>
      <circle cx="32" cy="44" r="16" fill="#fff" />
      <circle cx="32" cy="22" r="11" fill="#fff" />
      <Sh d="M44 34 A16 16 0 0 1 32 60 A16 16 0 0 0 44 34Z" o={0.07} />
      <rect x="25" y="0" width="14" height="10" rx="2" fill={C.dark} />
      <rect x="21" y="9" width="22" height="4" rx="2" fill={C.dark} />
      <circle cx="28" cy="20" r="1.6" fill={C.dark} />
      <circle cx="36" cy="20" r="1.6" fill={C.dark} />
      <path d="M32 23 L40 25 L32 26Z" fill={C.orange} />
      <path d="M22 31 Q32 36 42 31 V35 Q32 40 22 35Z" fill={C.red} />
      <circle cx="32" cy="42" r="1.8" fill={C.dark} />
      <circle cx="32" cy="49" r="1.8" fill={C.dark} />
    </g>
  ),
  '🧦': () => (
    <g>
      <path d="M20 4 H40 V36 Q40 40 44 42 L52 46 Q60 50 56 56 Q52 62 44 58 L26 50 Q20 46 20 40Z" fill={C.red} />
      <rect x="18" y="4" width="24" height="10" rx="3" fill="#fff" />
      <path d="M44 42 L52 46 Q60 50 56 56 Q52 62 44 58 L40 56Z" fill="#fff" />
      <path d="M22 22 H38 M22 30 H38" stroke="#fff" strokeWidth="2.4" opacity="0.7" />
    </g>
  ),
  '🎃': () => (
    <g>
      <path d="M32 14 Q32 6 38 4" stroke={C.leafD} strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="22" cy="36" rx="14" ry="20" fill={C.orange} />
      <ellipse cx="42" cy="36" rx="14" ry="20" fill={C.orange} />
      <ellipse cx="32" cy="36" rx="12" ry="21" fill="#FFAE63" />
      <Sh d="M50 20 Q58 28 56 40 Q54 56 40 56 Q52 44 50 20Z" o={0.12} />
      <path d="M20 30 L26 30 L23 25Z M38 30 L44 30 L41 25Z" fill={C.choc} />
      <path d="M20 40 Q32 50 44 40 L40 42 L36 40 L32 43 L28 40 L24 42Z" fill={C.choc} />
    </g>
  ),
  '👻': () => (
    <g>
      <path d="M12 30 Q12 6 32 6 Q52 6 52 30 V54 Q48 60 44 54 Q40 60 36 54 Q32 60 28 54 Q24 60 20 54 Q16 60 12 54Z" fill="#fff" />
      <Sh d="M42 9 Q52 16 52 30 V54 Q48 60 44 54 Q46 30 42 9Z" o={0.08} />
      <ellipse cx="25" cy="28" rx="3.2" ry="4.4" fill={C.dark} />
      <ellipse cx="39" cy="28" rx="3.2" ry="4.4" fill={C.dark} />
      <ellipse cx="32" cy="38" rx="3" ry="2.4" fill={C.dark} />
      <ellipse cx="20" cy="35" rx="3" ry="2" fill={C.pink} opacity="0.7" />
      <ellipse cx="44" cy="35" rx="3" ry="2" fill={C.pink} opacity="0.7" />
    </g>
  ),
  '🔥': () => (
    <g>
      <path d="M32 4 Q36 16 46 22 Q56 30 54 42 Q52 58 32 60 Q12 58 10 42 Q9 32 16 26 Q18 34 24 34 Q20 18 32 4Z" fill={C.orange} />
      <path d="M32 26 Q36 36 42 40 Q46 46 42 52 Q38 58 32 58 Q24 58 22 50 Q20 42 28 38 Q28 32 32 26Z" fill={C.yellow} />
      <Sh d="M46 22 Q56 30 54 42 Q52 58 32 60 Q48 50 46 22Z" o={0.1} />
    </g>
  ),

  // ---------- Brinquedos ----------
  '🧶': () => (
    <g>
      <circle cx="30" cy="32" r="22" fill={C.pink} />
      <path d="M12 22 Q30 26 44 14 M9 34 Q30 38 50 20 M14 46 Q34 46 52 30 M24 52 Q40 48 52 40" stroke={C.pinkD} strokeWidth="2.4" fill="none" />
      <path d="M18 14 Q28 30 22 52 M34 10 Q42 30 36 54" stroke={C.rose} strokeWidth="2" fill="none" />
      <path d="M50 44 Q60 48 58 58 Q54 62 46 58" stroke={C.pinkD} strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  ),
  '🧸': () => (
    <g>
      <circle cx="18" cy="12" r="7" fill={C.brown} />
      <circle cx="46" cy="12" r="7" fill={C.brown} />
      <circle cx="18" cy="12" r="3.4" fill={C.wood} />
      <circle cx="46" cy="12" r="3.4" fill={C.wood} />
      <ellipse cx="32" cy="46" rx="16" ry="14" fill={C.brown} />
      <ellipse cx="32" cy="48" rx="9" ry="8" fill={C.wood} />
      <circle cx="14" cy="42" r="6" fill={C.brown} />
      <circle cx="50" cy="42" r="6" fill={C.brown} />
      <circle cx="20" cy="58" r="6" fill={C.brownD} />
      <circle cx="44" cy="58" r="6" fill={C.brownD} />
      <circle cx="32" cy="22" r="15" fill={C.brown} />
      <ellipse cx="32" cy="27" rx="7" ry="5.4" fill={C.wood} />
      <ellipse cx="32" cy="25" rx="2.4" ry="1.8" fill={C.choc} />
      <circle cx="26" cy="19" r="2" fill={C.choc} />
      <circle cx="38" cy="19" r="2" fill={C.choc} />
      <path d="M26 34 L32 37 L38 34 L38 39 L32 37 L26 39Z" fill={C.red} />
    </g>
  ),
  '🪀': () => (
    <g>
      <path d="M32 2 V22" stroke={C.dark} strokeWidth="1.6" />
      <circle cx="32" cy="2" r="2.4" fill={C.dark} />
      <circle cx="32" cy="40" r="20" fill={C.red} />
      <circle cx="32" cy="40" r="11" fill={C.redD} />
      <circle cx="32" cy="40" r="4" fill={C.yellow} />
      <Hi x={22} y={30} rx={3} ry={5} r={35} o={0.45} />
    </g>
  ),
  '🎈': () => (
    <g>
      <path d="M32 46 Q28 54 34 58 Q38 62 32 64" stroke={C.grayD} strokeWidth="1.6" fill="none" />
      <path d="M32 4 Q52 4 52 24 Q52 40 32 46 Q12 40 12 24 Q12 4 32 4Z" fill={C.red} />
      <path d="M29 46 L35 46 L32 50Z" fill={C.redD} />
      <Sh d="M42 7 Q52 12 52 24 Q52 40 32 46 Q46 34 42 7Z" o={0.12} />
      <Hi x={22} y={16} rx={3} ry={6} r={25} />
    </g>
  ),
  '🎮': () => (
    <g>
      <path d="M14 18 H50 Q60 18 60 30 Q62 52 50 52 Q44 52 40 44 H24 Q20 52 14 52 Q2 52 4 30 Q4 18 14 18Z" fill={C.purple} />
      <Sh d="M50 18 Q60 18 60 30 Q62 52 50 52 Q58 40 50 18Z" o={0.12} />
      <path d="M17 28 V38 M12 33 H22" stroke={C.dark} strokeWidth="4" strokeLinecap="round" />
      <circle cx="44" cy="29" r="3" fill={C.yellow} />
      <circle cx="50" cy="35" r="3" fill={C.red} />
      <circle cx="38" cy="35" r="3" fill={C.blue} />
      <circle cx="44" cy="41" r="3" fill={C.green} />
    </g>
  ),
  '🪁': () => (
    <g>
      <path d="M30 4 L54 26 L30 50 L6 26Z" fill={C.yellow} />
      <path d="M30 4 L54 26 L30 26Z" fill={C.red} />
      <path d="M30 26 L30 50 L6 26Z" fill={C.blue} />
      <path d="M30 4 V50 M6 26 H54" stroke="#fff" strokeWidth="1.6" />
      <path d="M30 50 Q36 56 30 60 Q26 62 32 64" stroke={C.grayD} strokeWidth="1.6" fill="none" />
      <path d="M33 56 L39 54 L37 59Z M27 60 L22 58 L24 63Z" fill={C.pink} />
    </g>
  ),
  '🛹': () => (
    <g>
      <path d="M6 32 Q4 26 10 26 H54 Q60 26 58 32 Q56 36 52 36 H12 Q8 36 6 32Z" fill={C.teal} />
      <path d="M14 28 L22 34 M26 28 L34 34 M38 28 L46 34" stroke={C.yellow} strokeWidth="2.4" strokeLinecap="round" />
      <rect x="14" y="36" width="10" height="4" rx="1" fill={C.grayD} />
      <rect x="40" y="36" width="10" height="4" rx="1" fill={C.grayD} />
      <circle cx="16" cy="44" r="5" fill={C.orange} />
      <circle cx="24" cy="44" r="5" fill={C.orange} />
      <circle cx="40" cy="44" r="5" fill={C.orange} />
      <circle cx="48" cy="44" r="5" fill={C.orange} />
    </g>
  ),
  '🕹️': () => (
    <g>
      <rect x="10" y="4" width="44" height="56" rx="6" fill={C.blue} />
      <rect x="14" y="8" width="36" height="22" rx="3" fill={C.dark} />
      <path d="M20 22 L24 16 L28 22 M34 14 H42 M36 20 H44" stroke={C.green} strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="10" y="34" width="44" height="10" fill={C.blueD} />
      <path d="M22 38 V30" stroke={C.dark} strokeWidth="2.4" />
      <circle cx="22" cy="29" r="3.4" fill={C.red} />
      <circle cx="38" cy="39" r="2.6" fill={C.yellow} />
      <circle cx="45" cy="39" r="2.6" fill={C.pink} />
      <rect x="18" y="48" width="28" height="4" rx="2" fill={C.dark} opacity="0.4" />
    </g>
  ),
  '🪆': () => (
    <g>
      <path d="M32 4 Q20 4 20 18 Q12 26 14 42 Q16 60 32 60 Q48 60 50 42 Q52 26 44 18 Q44 4 32 4Z" fill={C.red} />
      <circle cx="32" cy="17" r="9" fill={C.peach} />
      <path d="M23 14 Q32 6 41 14 Q36 10 32 12 Q28 10 23 14Z" fill={C.choc} />
      <circle cx="29" cy="17" r="1.4" fill={C.dark} />
      <circle cx="35" cy="17" r="1.4" fill={C.dark} />
      <ellipse cx="32" cy="42" rx="11" ry="11" fill="#fff" />
      <circle cx="32" cy="42" r="5" fill={C.yellow} />
      <circle cx="26" cy="38" r="3" fill={C.pink} />
      <circle cx="38" cy="38" r="3" fill={C.pink} />
      <circle cx="32" cy="49" r="3" fill={C.pink} />
    </g>
  ),
  '🎲': () => (
    <g>
      <path d="M32 6 L56 18 V44 L32 58 L8 44 V18Z" fill="#fff" />
      <path d="M32 30 L56 18 V44 L32 58Z" fill="#000" opacity="0.08" />
      <path d="M8 18 L32 30 V58 L8 44Z" fill="#000" opacity="0.03" />
      <circle cx="32" cy="18" r="3" fill={C.red} />
      <circle cx="16" cy="32" r="2.6" fill={C.dark} />
      <circle cx="24" cy="44" r="2.6" fill={C.dark} />
      <circle cx="40" cy="40" r="2.6" fill={C.dark} />
      <circle cx="48" cy="30" r="2.6" fill={C.dark} />
      <circle cx="44" cy="35" r="2.6" fill={C.dark} />
    </g>
  ),
  '🏐': () => (
    <g>
      <circle cx="32" cy="32" r="24" fill="#fff" />
      <path d="M32 8 A24 24 0 0 1 56 32 L32 32Z" fill={C.red} />
      <path d="M56 32 A24 24 0 0 1 32 56 L32 32Z" fill={C.yellow} />
      <path d="M32 56 A24 24 0 0 1 8 32 L32 32Z" fill={C.blue} />
      <circle cx="32" cy="32" r="5" fill="#fff" />
      <Sh d="M48 14 A24 24 0 0 1 32 56 A24 24 0 0 0 48 14Z" o={0.1} />
      <Hi x={20} y={18} rx={4} ry={2.4} r={-35} />
    </g>
  ),
  '🎯': () => (
    <g>
      <circle cx="30" cy="34" r="24" fill={C.red} />
      <circle cx="30" cy="34" r="17" fill="#fff" />
      <circle cx="30" cy="34" r="10" fill={C.red} />
      <circle cx="30" cy="34" r="4" fill="#fff" />
      <path d="M30 34 L54 10" stroke={C.dark} strokeWidth="3" strokeLinecap="round" />
      <path d="M50 8 L58 6 L56 14Z" fill={C.blue} />
    </g>
  ),
  '🎾': () => (
    <g>
      <circle cx="32" cy="32" r="24" fill="#D7EB4F" />
      <path d="M12 18 Q28 28 14 48 M52 16 Q36 34 52 46" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Sh d="M48 14 A24 24 0 0 1 32 56 A24 24 0 0 0 48 14Z" o={0.1} />
    </g>
  ),
  '🎉': () => (
    <g>
      <path d="M8 58 L22 18 L46 42Z" fill={C.yellow} />
      <path d="M8 58 L14 41 L25 52Z" fill={C.orange} />
      <path d="M30 14 Q34 6 40 10 M46 22 Q54 18 56 26 M38 4 L40 8 M54 12 L58 10" stroke={C.pink} strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="40" r="3" fill={C.blue} />
      <circle cx="28" cy="6" r="2.4" fill={C.green} />
      <path d={heart(52, 52, 5)} fill={C.red} />
    </g>
  ),
};
