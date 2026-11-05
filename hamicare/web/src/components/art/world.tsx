// Ilustrações do Mundo (lugares e achados das aventuras), dos cuidados e dos selos.
import { C, Face, Hi, Sh, drop, heart, sparkle, star, type Draw } from './kit';

const animalEye = (x: number, y: number, r = 2.2) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={C.dark} />
    <circle cx={x + r * 0.35} cy={y - r * 0.35} r={r * 0.35} fill="#fff" />
  </g>
);

export const WORLD: Record<string, Draw> = {
  // ---------- Lugares ----------
  '🌳': () => (
    <g>
      <rect x="28" y="38" width="8" height="22" rx="2" fill={C.brown} />
      <circle cx="20" cy="30" r="13" fill={C.leaf} />
      <circle cx="44" cy="30" r="13" fill={C.leaf} />
      <circle cx="32" cy="20" r="16" fill={C.green} />
      <circle cx="32" cy="36" r="12" fill={C.green} />
      <Sh d="M46 20 Q58 26 56 36 Q52 44 40 44 Q50 34 46 20Z" o={0.1} />
      <circle cx="24" cy="18" r="2.4" fill={C.red} />
      <circle cx="40" cy="26" r="2.4" fill={C.red} />
      <circle cx="28" cy="34" r="2.4" fill={C.red} />
    </g>
  ),
  '🌲': () => (
    <g>
      <rect x="28" y="48" width="8" height="12" rx="2" fill={C.brown} />
      <path d="M32 4 L48 24 H40 L52 38 H42 L56 52 H8 L22 38 H12 L24 24 H16Z" fill={C.leafD} />
      <path d="M32 4 L48 24 H40 L52 38 H42 L56 52 H36Z" fill="#000" opacity="0.1" />
    </g>
  ),
  '🏖️': () => (
    <g>
      <path d="M2 44 Q16 38 32 44 Q48 50 62 42 V62 H2Z" fill="#FFE3A3" />
      <path d="M2 50 Q14 46 24 52 Q36 58 62 50 V62 H2Z" fill={C.sky} opacity="0.9" />
      <path d="M40 46 L46 14" stroke={C.dark} strokeWidth="2.4" />
      <path d="M22 18 Q46 0 64 22 Q56 18 50 22 Q44 16 36 20 Q30 16 22 18Z" fill={C.red} />
      <path d="M36 20 Q44 16 50 22 Q46 8 44 6 Q40 10 36 20Z" fill="#fff" />
      <circle cx="12" cy="14" r="7" fill={C.yellow} />
    </g>
  ),
  '🏙️': () => (
    <g>
      <rect x="6" y="24" width="16" height="36" rx="2" fill={C.blue} />
      <rect x="22" y="10" width="18" height="50" rx="2" fill={C.purple} />
      <rect x="40" y="30" width="18" height="30" rx="2" fill={C.teal} />
      {[16, 24, 32, 40, 48].map((y) =>
        [26, 33].map((x) => <rect key={`${x}${y}`} x={x} y={y} width="4" height="4" rx="1" fill={C.yellow} opacity={(x + y) % 3 ? 1 : 0.5} />),
      )}
      {[30, 38, 46].map((y) => (
        <rect key={y} x="10" y={y} width="8" height="3" rx="1" fill="#fff" opacity="0.7" />
      ))}
      {[36, 44, 52].map((y) => (
        <rect key={y} x="44" y={y} width="10" height="3" rx="1" fill="#fff" opacity="0.7" />
      ))}
    </g>
  ),
  '⛰️': () => (
    <g>
      <path d="M2 56 L24 18 L36 36 L44 26 L62 56Z" fill="#8E9BB8" />
      <path d="M24 18 L30 28 L26 26 L22 30 L18 28Z" fill="#fff" />
      <path d="M44 26 L49 34 L45 33 L41 36Z" fill="#fff" />
      <path d="M24 18 L44 52 H62 L44 26 L36 36Z" fill="#000" opacity="0.1" />
      <path d="M2 56 H62" stroke={C.green} strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  '❄️': () => (
    <g stroke={C.blue} strokeWidth="4" strokeLinecap="round" fill="none">
      {[0, 60, 120].map((a) => (
        <g key={a} transform={`rotate(${a} 32 32)`}>
          <path d="M32 6 V58" />
          <path d="M26 12 L32 18 L38 12 M26 52 L32 46 L38 52" />
        </g>
      ))}
      <circle cx="32" cy="32" r="4" fill={C.sky} stroke="none" />
    </g>
  ),

  // ---------- Achados ----------
  '🐞': () => (
    <g>
      <path d="M26 14 L22 6 M38 14 L42 6" stroke={C.dark} strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="18" r="8" fill={C.dark} />
      <ellipse cx="32" cy="38" rx="20" ry="20" fill={C.red} />
      <path d="M32 18 V58" stroke={C.dark} strokeWidth="2.4" />
      <circle cx="22" cy="32" r="4" fill={C.dark} />
      <circle cx="42" cy="32" r="4" fill={C.dark} />
      <circle cx="24" cy="46" r="3.4" fill={C.dark} />
      <circle cx="40" cy="46" r="3.4" fill={C.dark} />
      <Hi x={20} y={24} rx={2} ry={4} r={30} o={0.4} />
    </g>
  ),
  '🐌': () => (
    <g>
      <path d="M4 52 Q4 44 14 44 H46 Q52 30 56 32 Q60 34 56 44 Q54 52 46 54 H8 Q4 54 4 52Z" fill="#B9E0A8" />
      <path d="M50 32 L48 22 M56 32 L58 22" stroke="#9CC98C" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="48" cy="22" r="2.4" fill={C.dark} />
      <circle cx="58" cy="22" r="2.4" fill={C.dark} />
      <circle cx="26" cy="32" r="16" fill={C.orange} />
      <path d="M26 32 m0 -4 a4 4 0 1 1 -4 4 a8 8 0 1 1 8 8 a12 12 0 1 1 -12 -12" stroke={C.orangeD} strokeWidth="2.4" fill="none" />
    </g>
  ),
  '🍀': () => (
    <g>
      <path d="M32 34 Q36 50 44 58" stroke={C.leafD} strokeWidth="3.4" fill="none" strokeLinecap="round" />
      {[0, 90, 180, 270].map((a) => (
        <path key={a} d={heart(32, 22, 11)} fill={a % 180 ? C.leaf : C.green} transform={`rotate(${a + 45} 32 32)`} />
      ))}
      <circle cx="32" cy="32" r="3" fill={C.leafD} />
    </g>
  ),
  '🌰': () => (
    <g>
      <path d="M12 28 Q12 46 32 58 Q52 46 52 28Z" fill={C.brown} />
      <Sh d="M44 28 H52 Q52 46 32 58 Q46 42 44 28Z" o={0.12} />
      <path d="M8 28 Q8 12 32 12 Q56 12 56 28Z" fill={C.choc} />
      <path d="M14 20 l4 4 M24 16 l4 4 M34 16 l4 4 M44 18 l4 4" stroke={C.brown} strokeWidth="2" strokeLinecap="round" />
      <path d="M32 12 V4" stroke={C.choc} strokeWidth="3" strokeLinecap="round" />
      <Hi x={20} y={36} rx={2} ry={5} r={-20} o={0.35} />
    </g>
  ),
  '🪶': () => (
    <g transform="rotate(35 32 32)">
      <path d="M32 2 Q50 16 44 40 Q40 54 32 56 Q24 54 20 40 Q14 16 32 2Z" fill={C.teal} />
      <path d="M32 2 Q50 16 44 40 Q40 54 32 56Z" fill={C.blue} />
      <path d="M32 10 V62" stroke={C.dark} strokeWidth="2" strokeLinecap="round" />
      <path d="M32 22 L24 18 M32 30 L22 26 M32 38 L24 36 M32 22 L40 18 M32 30 L42 26 M32 38 L40 36" stroke="#fff" strokeWidth="1.4" opacity="0.6" />
    </g>
  ),
  '🍂': () => (
    <g>
      <path d="M10 54 Q8 20 50 8 Q58 40 24 54Z" fill={C.orange} />
      <path d="M10 54 Q30 34 50 8" stroke={C.orangeD} strokeWidth="2.4" fill="none" />
      <path d="M20 42 L14 34 M28 34 L24 24 M36 26 L34 16 M24 44 L34 46 M32 36 L44 36" stroke={C.orangeD} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10 54 L4 60" stroke={C.brown} strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  '🐢': () => (
    <g>
      <circle cx="54" cy="36" r="7" fill="#9CD08C" />
      {animalEye(56, 34, 1.6)}
      <ellipse cx="16" cy="48" rx="6" ry="4" fill="#9CD08C" />
      <ellipse cx="44" cy="48" rx="6" ry="4" fill="#9CD08C" />
      <path d="M6 44 Q6 18 30 18 Q50 18 50 44Z" fill={C.leafD} />
      <path d="M18 30 L24 24 H36 L42 30 L36 38 H24Z" fill={C.leaf} />
      <path d="M6 44 H50 V46 Q50 48 48 48 H8 Q6 48 6 46Z" fill={C.yellowD} />
    </g>
  ),
  '🦔': () => (
    <g>
      <path d="M8 48 L4 36 L12 34 L8 24 L18 24 L18 14 L28 18 L32 8 L38 18 L46 12 L46 24 L54 24 Q60 36 56 48Z" fill={C.choc} />
      <path d="M40 30 Q56 30 60 44 Q58 52 46 52 H36Z" fill={C.wood} />
      <circle cx="60" cy="44" r="2.4" fill={C.dark} />
      {animalEye(50, 40, 2)}
      <ellipse cx="46" cy="46" rx="3" ry="1.8" fill={C.pink} opacity="0.8" />
      <path d="M12 52 H50" stroke={C.brownD} strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  '🎫': () => (
    <g transform="rotate(-12 32 32)">
      <path d="M4 18 H60 V28 A4 4 0 0 0 60 36 V46 H4 V36 A4 4 0 0 0 4 28Z" fill={C.yellow} />
      <path d="M44 18 V46" stroke={C.yellowD} strokeWidth="2" strokeDasharray="3 3" />
      <rect x="10" y="25" width="26" height="4" rx="2" fill={C.orangeD} />
      <rect x="10" y="33" width="18" height="4" rx="2" fill={C.orangeD} opacity="0.6" />
      <path d={star(52, 32, 5, 2.2)} fill={C.red} />
    </g>
  ),
  '🐦': () => (
    <g>
      <path d="M8 34 Q8 16 28 16 Q44 16 48 30 L60 26 L52 36 Q50 52 30 52 Q8 52 8 34Z" fill={C.blue} />
      <path d="M22 36 Q30 30 40 38 Q32 46 22 36Z" fill={C.blueD} />
      <path d="M8 30 L2 28 L8 26Z" fill={C.orange} />
      {animalEye(18, 28, 2.4)}
      <path d="M26 52 V58 M34 52 V58" stroke={C.orange} strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="22" cy="40" rx="6" ry="4" fill="#fff" opacity="0.5" />
    </g>
  ),
  '💎': () => (
    <g>
      <path d="M8 24 L20 8 H44 L56 24 L32 58Z" fill={C.sky} />
      <path d="M8 24 H56 L32 58Z" fill={C.blue} />
      <path d="M20 8 L26 24 L32 8 L38 24 L44 8" stroke="#fff" strokeWidth="1.6" fill="none" opacity="0.8" />
      <path d="M26 24 L32 58 L38 24" stroke="#fff" strokeWidth="1.4" fill="none" opacity="0.4" />
      <path d={sparkle(52, 8, 5)} fill={C.yellow} />
    </g>
  ),
  '🌼': () => (
    <g>
      {Array.from({ length: 10 }).map((_, i) => (
        <ellipse key={i} cx="32" cy="14" rx="5.4" ry="11" fill="#fff" transform={`rotate(${i * 36} 32 32)`} />
      ))}
      <circle cx="32" cy="32" r="9" fill={C.yellow} />
      <circle cx="35" cy="29" r="2.4" fill="#fff" opacity="0.6" />
    </g>
  ),
  '🌸': () => (
    <g>
      {[0, 72, 144, 216, 288].map((a) => (
        <path key={a} d="M32 30 Q20 18 26 8 Q32 12 32 16 Q32 12 38 8 Q44 18 32 30Z" fill={C.pink} transform={`rotate(${a} 32 32)`} />
      ))}
      <circle cx="32" cy="32" r="6" fill={C.rose} />
      <circle cx="32" cy="32" r="2.6" fill={C.yellowD} />
    </g>
  ),
  '🐐': () => (
    <g>
      <path d="M22 14 Q14 6 10 12 M42 14 Q50 6 54 12" stroke={C.grayD} strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="14" cy="24" rx="7" ry="4" fill="#E8E4DC" transform="rotate(-20 14 24)" />
      <ellipse cx="50" cy="24" rx="7" ry="4" fill="#E8E4DC" transform="rotate(20 50 24)" />
      <path d="M18 22 Q18 10 32 10 Q46 10 46 22 Q46 44 32 50 Q18 44 18 22Z" fill="#F6F3EE" />
      <ellipse cx="32" cy="42" rx="8" ry="6" fill={C.peach} />
      <path d="M28 50 Q32 62 36 50" fill="#E8E4DC" />
      {animalEye(25, 26, 2.4)}
      {animalEye(39, 26, 2.4)}
      <circle cx="29" cy="41" r="1.2" fill={C.dark} />
      <circle cx="35" cy="41" r="1.2" fill={C.dark} />
    </g>
  ),
  '🧤': () => (
    <g>
      <path d="M16 54 V24 Q16 16 22 16 Q26 16 26 22 V12 Q26 6 32 6 Q38 6 38 12 V20 Q38 14 43 14 Q48 14 48 20 V40 Q48 54 36 54Z" fill={C.red} />
      <path d="M16 34 Q8 30 6 36 Q6 42 16 46Z" fill={C.red} />
      <rect x="14" y="50" width="36" height="10" rx="3" fill="#fff" />
      <path d="M22 28 Q32 34 42 28" stroke="#fff" strokeWidth="2.4" fill="none" opacity="0.7" strokeLinecap="round" />
      <Sh d="M42 14 Q48 14 48 20 V40 Q48 50 40 50 Q44 30 42 14Z" o={0.1} />
    </g>
  ),
  '🐧': () => (
    <g>
      <path d="M32 4 Q52 4 52 30 Q54 56 32 58 Q10 56 12 30 Q12 4 32 4Z" fill={C.dark} />
      <path d="M32 18 Q46 18 46 34 Q46 54 32 54 Q18 54 18 34 Q18 18 32 18Z" fill="#fff" />
      {animalEye(26, 20, 2.4)}
      {animalEye(38, 20, 2.4)}
      <path d="M28 26 H36 L32 31Z" fill={C.orange} />
      <ellipse cx="24" cy="59" rx="6" ry="3" fill={C.orange} />
      <ellipse cx="40" cy="59" rx="6" ry="3" fill={C.orange} />
      <ellipse cx="22" cy="28" rx="3" ry="2" fill={C.pink} opacity="0.7" />
      <ellipse cx="42" cy="28" rx="3" ry="2" fill={C.pink} opacity="0.7" />
    </g>
  ),
  '🗝️': () => (
    <g transform="rotate(-35 32 32)">
      <circle cx="16" cy="32" r="12" fill="none" stroke={C.yellowD} strokeWidth="6" />
      <path d="M28 32 H60 M50 32 V42 M58 32 V40" stroke={C.yellowD} strokeWidth="6" strokeLinecap="round" />
      <circle cx="16" cy="32" r="3" fill={C.red} />
    </g>
  ),
  '👑': () => (
    <g>
      <path d="M6 22 L18 36 L32 12 L46 36 L58 22 L52 52 H12Z" fill={C.yellow} />
      <Sh d="M46 36 L58 22 L52 52 H40Z" o={0.1} />
      <rect x="12" y="48" width="40" height="8" rx="2" fill={C.yellowD} />
      <circle cx="6" cy="20" r="4" fill={C.yellow} />
      <circle cx="58" cy="20" r="4" fill={C.yellow} />
      <circle cx="32" cy="10" r="4" fill={C.yellow} />
      <circle cx="22" cy="44" r="3" fill={C.red} />
      <circle cx="32" cy="42" r="3.4" fill={C.blue} />
      <circle cx="42" cy="44" r="3" fill={C.green} />
    </g>
  ),
  '🐉': () => (
    <g>
      <path d="M14 26 L4 14 L20 18Z M28 20 L22 8 L34 16Z" fill={C.yellow} />
      <path d="M44 50 Q60 48 58 36 Q54 30 48 34" stroke={C.green} strokeWidth="6" fill="none" strokeLinecap="round" />
      <ellipse cx="34" cy="44" rx="18" ry="14" fill={C.green} />
      <path d="M26 46 Q34 52 42 46 Q40 56 34 56 Q28 56 26 46Z" fill="#CFEFB0" />
      <circle cx="22" cy="28" r="14" fill={C.green} />
      <ellipse cx="14" cy="34" rx="7" ry="5" fill="#8FDC9A" />
      <circle cx="11" cy="33" r="1.2" fill={C.dark} />
      <circle cx="16" cy="33" r="1.2" fill={C.dark} />
      {animalEye(24, 24, 2.6)}
      <path d="M38 34 L44 28 L46 36 M46 40 L54 36 L52 44" fill={C.yellow} />
    </g>
  ),
  '🌠': () => (
    <g>
      <path d="M4 56 L36 24" stroke={C.yellow} strokeWidth="6" strokeLinecap="round" opacity="0.4" />
      <path d="M12 54 L38 28" stroke={C.yellow} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <path d={star(42, 22, 16, 7)} fill={C.yellow} stroke={C.yellow} strokeWidth="3" strokeLinejoin="round" />
      <Face x={42} y={22} w={7} cheek={null} />
    </g>
  ),
  '👽': () => (
    <g>
      <path d="M32 6 Q56 6 54 30 Q52 52 32 58 Q12 52 10 30 Q8 6 32 6Z" fill={C.green} />
      <ellipse cx="22" cy="30" rx="8" ry="5" fill={C.dark} transform="rotate(25 22 30)" />
      <ellipse cx="42" cy="30" rx="8" ry="5" fill={C.dark} transform="rotate(-25 42 30)" />
      <circle cx="20" cy="28" r="1.6" fill="#fff" />
      <circle cx="40" cy="28" r="1.6" fill="#fff" />
      <path d="M28 46 Q32 49 36 46" stroke={C.dark} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <Sh d="M46 10 Q56 18 54 30 Q52 52 32 58 Q48 44 46 10Z" o={0.1} />
    </g>
  ),

  // ---------- Cuidados ----------
  '⚡': () => (
    <g>
      <path d="M36 4 L12 36 H30 L26 60 L52 26 H34Z" fill={C.yellow} stroke={C.yellow} strokeWidth="3" strokeLinejoin="round" />
      <Sh d="M36 4 L34 26 H52 L26 60 L30 36Z" o={0.1} />
    </g>
  ),
  '🫧': () => (
    <g>
      <circle cx="24" cy="36" r="16" fill={C.sky} opacity="0.7" />
      <circle cx="46" cy="20" r="10" fill={C.lilac} opacity="0.8" />
      <circle cx="48" cy="46" r="7" fill={C.rose} opacity="0.8" />
      <Hi x={18} y={28} rx={3.4} ry={5} r={30} o={0.9} />
      <Hi x={42} y={16} rx={2} ry={3} r={30} o={0.9} />
      <Hi x={46} y={43} rx={1.4} ry={2} r={30} o={0.9} />
    </g>
  ),
  '🤲': () => (
    <g>
      <path d="M6 34 Q6 26 12 28 L20 38 Q24 42 30 44 V58 H18 Q8 52 6 34Z" fill={C.peach} />
      <path d="M58 34 Q58 26 52 28 L44 38 Q40 42 34 44 V58 H46 Q56 52 58 34Z" fill={C.peach} />
      <Sh d="M34 44 Q40 42 44 38 L52 28 Q58 26 58 34 Q56 52 46 58 H40 Q50 46 44 44Z" o={0.08} />
      <path d={heart(32, 24, 14)} fill={C.pink} />
      <Hi x={26} y={18} rx={2.4} ry={3.4} r={-35} />
    </g>
  ),
  '🪮': () => (
    <g transform="rotate(-20 32 32)">
      <rect x="6" y="18" width="52" height="14" rx="5" fill={C.purple} />
      {Array.from({ length: 10 }).map((_, i) => (
        <rect key={i} x={10 + i * 4.6} y="30" width="2.6" height="16" rx="1.3" fill={C.purple} />
      ))}
      <Hi x={20} y={22} rx={8} ry={1.6} o={0.5} />
    </g>
  ),
  '🧽': () => (
    <g>
      <path d="M8 28 L48 16 L58 26 V40 L18 54 L8 44Z" fill={C.yellow} />
      <path d="M8 28 L48 16 L58 26 L18 38Z" fill="#FFE38F" />
      <path d="M8 28 L18 38 V54 L8 44Z" fill={C.green} />
      <circle cx="30" cy="44" r="2" fill={C.yellowD} />
      <circle cx="42" cy="38" r="2.6" fill={C.yellowD} />
      <circle cx="50" cy="40" r="1.6" fill={C.yellowD} />
      <circle cx="54" cy="10" r="5" fill={C.sky} opacity="0.8" />
      <circle cx="44" cy="6" r="3" fill={C.sky} opacity="0.8" />
    </g>
  ),
  '💨': () => (
    <g fill="none" strokeLinecap="round">
      <path d="M6 22 H34 A7 7 0 1 0 27 15" stroke={C.grayD} strokeWidth="5" />
      <path d="M6 34 H46 A7 7 0 1 1 39 41" stroke={C.gray} strokeWidth="5" />
      <path d="M10 46 H24" stroke={C.grayD} strokeWidth="5" />
    </g>
  ),
  '🧣': () => (
    <g>
      <path d="M8 22 Q32 32 56 22 V32 Q32 42 8 32Z" fill={C.red} />
      <path d="M36 34 L44 60 H32 L28 36Z" fill={C.redD} />
      <path d="M32 60 V64 M36 60 V64 M40 60 V64" stroke={C.redD} strokeWidth="2" />
      <path d="M14 26 V34 M22 28 V36 M30 30 V38 M40 30 V38 M48 28 V36" stroke="#fff" strokeWidth="2" opacity="0.6" />
    </g>
  ),
  '👩‍🍳': () => (
    <g>
      <circle cx="20" cy="22" r="11" fill="#fff" />
      <circle cx="32" cy="16" r="13" fill="#fff" />
      <circle cx="44" cy="22" r="11" fill="#fff" />
      <rect x="16" y="26" width="32" height="24" rx="3" fill="#fff" />
      <rect x="16" y="46" width="32" height="10" rx="3" fill={C.gray} />
      <Sh d="M40 14 Q56 18 54 28 Q52 32 48 32 V50 H42 Q46 30 40 14Z" o={0.06} />
      <path d="M24 34 V44 M32 32 V44 M40 34 V44" stroke={C.gray} strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  '⏱️': () => (
    <g>
      <rect x="26" y="2" width="12" height="7" rx="2" fill={C.redD} />
      <path d="M48 14 L53 9" stroke={C.grayD} strokeWidth="4" strokeLinecap="round" />
      <circle cx="32" cy="36" r="24" fill={C.teal} />
      <circle cx="32" cy="36" r="18" fill="#fff" />
      <path d="M32 36 L40 26" stroke={C.red} strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="32" cy="36" r="3" fill={C.dark} />
      <path d="M32 20 V23 M48 36 H45 M32 52 V49 M16 36 H19" stroke={C.grayD} strokeWidth="2.4" strokeLinecap="round" />
    </g>
  ),
  '💦': () => (
    <g>
      <path d={drop(22, 38, 12)} fill={C.blue} transform="rotate(-25 22 38)" />
      <path d={drop(46, 22, 8)} fill={C.sky} transform="rotate(20 46 22)" />
      <Hi x={17} y={40} rx={2.4} ry={4.4} r={-10} />
    </g>
  ),
  '🌿': () => (
    <g>
      <path d="M12 58 Q28 40 52 6" stroke={C.leafD} strokeWidth="3" fill="none" strokeLinecap="round" />
      {[
        [20, 46, -60], [30, 34, -60], [40, 22, -60], [24, 48, 30], [34, 36, 30], [44, 22, 30],
      ].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx="9" ry="4.6" fill={i % 2 ? C.green : C.leaf} transform={`rotate(${r} ${x} ${y})`} />
      ))}
    </g>
  ),
  '🍃': () => (
    <g>
      <path d="M8 50 Q10 20 46 10 Q50 40 18 52Z" fill={C.leaf} />
      <path d="M8 50 Q26 34 46 10" stroke="#fff" strokeWidth="2" fill="none" opacity="0.6" />
      <path d="M30 56 Q36 36 58 32 Q58 52 36 56Z" fill={C.green} />
      <path d="M30 56 Q42 44 58 32" stroke="#fff" strokeWidth="1.6" fill="none" opacity="0.6" />
    </g>
  ),

  // ---------- Selos e interface ----------
  '🏅': () => (
    <g>
      <path d="M20 4 L32 24 L44 4 H54 L38 30 H26 L10 4Z" fill={C.blue} />
      <path d="M20 4 H28 L36 18 L32 24Z" fill={C.red} />
      <circle cx="32" cy="40" r="18" fill={C.yellow} />
      <circle cx="32" cy="40" r="13" fill={C.yellowD} />
      <path d={star(32, 40, 8, 3.6)} fill={C.yellow} stroke={C.yellow} strokeWidth="1.4" strokeLinejoin="round" />
      <Hi x={22} y={32} rx={2} ry={4} r={35} o={0.5} />
    </g>
  ),
  '🏁': () => (
    <g>
      <path d="M12 4 V60" stroke={C.dark} strokeWidth="4" strokeLinecap="round" />
      <path d="M14 6 Q30 2 38 8 Q46 14 58 8 V36 Q46 42 38 36 Q30 30 14 34Z" fill="#fff" />
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2, 3, 4, 5].map((c) =>
          (r + c) % 2 ? null : <rect key={`${r}${c}`} x={14 + c * 7.4} y={7 + r * 7} width="7.4" height="7" fill={C.dark} opacity="0.85" />,
        ),
      )}
    </g>
  ),
  '📅': () => (
    <g>
      <rect x="6" y="10" width="52" height="48" rx="7" fill="#fff" />
      <path d="M6 17 Q6 10 13 10 H51 Q58 10 58 17 V24 H6Z" fill={C.red} />
      <rect x="16" y="4" width="5" height="12" rx="2.5" fill={C.dark} />
      <rect x="43" y="4" width="5" height="12" rx="2.5" fill={C.dark} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => <rect key={`${r}${c}`} x={13 + c * 10} y={30 + r * 9} width="7" height="5" rx="1.5" fill={r === 1 && c === 2 ? C.orange : C.gray} />),
      )}
    </g>
  ),
  '⚖️': () => (
    <g>
      <path d="M32 8 V54" stroke={C.yellowD} strokeWidth="4" strokeLinecap="round" />
      <path d="M10 16 H54" stroke={C.yellowD} strokeWidth="4" strokeLinecap="round" />
      <circle cx="32" cy="8" r="4" fill={C.yellow} />
      <path d="M12 16 L4 36 M12 16 L20 36 M52 16 L44 36 M52 16 L60 36" stroke={C.grayD} strokeWidth="1.6" />
      <path d="M2 36 H22 Q22 44 12 44 Q2 44 2 36Z" fill={C.yellow} />
      <path d="M42 36 H62 Q62 44 52 44 Q42 44 42 36Z" fill={C.yellow} />
      <rect x="20" y="54" width="24" height="6" rx="3" fill={C.yellowD} />
    </g>
  ),
  '💤': () => (
    <g fill="none" stroke={C.purple} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M30 10 H46 L30 28 H46" />
      <path d="M12 32 H24 L12 46 H24" stroke={C.blue} />
      <path d="M40 40 H50 L40 52 H50" stroke={C.lilac} />
    </g>
  ),
  '🔒': () => (
    <g>
      <path d="M20 28 V20 Q20 8 32 8 Q44 8 44 20 V28" stroke={C.grayD} strokeWidth="6" fill="none" />
      <rect x="12" y="26" width="40" height="32" rx="7" fill={C.yellow} />
      <Sh d="M44 26 h1 a7 7 0 0 1 7 7 v18 a7 7 0 0 1 -7 7 h-5 Q48 40 44 26Z" o={0.12} />
      <circle cx="32" cy="40" r="4.4" fill={C.choc} />
      <rect x="30" y="42" width="4" height="8" rx="2" fill={C.choc} />
    </g>
  ),
  '🔟': () => (
    <g>
      <rect x="6" y="6" width="52" height="52" rx="12" fill={C.blue} />
      <path d="M18 22 L24 18 V46" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="40" cy="32" rx="8" ry="13" stroke="#fff" strokeWidth="5" fill="none" />
    </g>
  ),
  '💯': () => (
    <g>
      <path d="M8 18 L14 14 V40 M26 27 a6 12 0 1 0 0.1 0 M46 27 a6 12 0 1 0 0.1 0" stroke={C.red} strokeWidth="5" fill="none" strokeLinecap="round" transform="translate(0 0)" />
      <path d="M8 50 Q32 44 58 50 M14 56 Q34 52 52 56" stroke={C.red} strokeWidth="4" fill="none" strokeLinecap="round" />
    </g>
  ),
  '👏': () => (
    <g>
      <g transform="rotate(-20 26 36)">
        <rect x="14" y="16" width="22" height="36" rx="11" fill={C.peachD} />
      </g>
      <g transform="rotate(15 38 36)">
        <rect x="27" y="14" width="22" height="38" rx="11" fill={C.peach} />
        <path d="M33 22 V32 M38 20 V32 M43 22 V32" stroke={C.peachD} strokeWidth="1.6" strokeLinecap="round" />
      </g>
      <path d="M8 14 L4 8 M14 10 L13 3 M54 12 L60 6 M50 8 L52 2" stroke={C.yellowD} strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  '🤗': () => (
    <g>
      <circle cx="32" cy="30" r="22" fill={C.yellow} />
      <path d="M22 26 Q25 22 28 26 M36 26 Q39 22 42 26" stroke={C.dark} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M26 34 Q32 40 38 34" stroke={C.dark} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <ellipse cx="18" cy="32" rx="3.4" ry="2.2" fill="#FF9FB5" />
      <ellipse cx="46" cy="32" rx="3.4" ry="2.2" fill="#FF9FB5" />
      <ellipse cx="16" cy="48" rx="10" ry="8" fill={C.yellowD} />
      <ellipse cx="48" cy="48" rx="10" ry="8" fill={C.yellowD} />
    </g>
  ),
  '🏡': () => (
    <g>
      <path d="M6 30 L32 8 L58 30Z" fill={C.red} />
      <rect x="12" y="28" width="40" height="30" rx="2" fill={C.cream} />
      <path d="M26 58 V42 Q32 36 38 42 V58Z" fill={C.orange} />
      <rect x="16" y="34" width="8" height="8" rx="2" fill={C.sky} />
      <rect x="40" y="34" width="8" height="8" rx="2" fill={C.sky} />
      <rect x="42" y="12" width="6" height="12" fill={C.redD} />
      <path d="M2 58 H62" stroke={C.green} strokeWidth="4" strokeLinecap="round" />
      <circle cx="56" cy="50" r="6" fill={C.leaf} />
    </g>
  ),
  // Turma: três Hamis lado a lado.
  'art:turma': () => (
    <g>
      {[
        [16, 36, '#C9CDD6', '#A3A9B6', 0.86],
        [48, 36, '#F7DFB9', '#E2C08E', 0.86],
        [32, 30, '#F2B46D', '#D98E45', 1],
      ].map(([x, y, body, shade, k], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${k})`}>
          <circle cx="-11" cy="-12" r="5" fill={shade as string} />
          <circle cx="11" cy="-12" r="5" fill={shade as string} />
          <circle cx="-11" cy="-12" r="2.4" fill="#FF9EAA" />
          <circle cx="11" cy="-12" r="2.4" fill="#FF9EAA" />
          <ellipse cx="0" cy="2" rx="16" ry="15" fill={body as string} stroke={shade as string} strokeWidth="1.5" />
          <ellipse cx="0" cy="7" rx="9" ry="7" fill="#FFF6EA" />
          <circle cx="-5.5" cy="-1" r="1.9" fill="#2B2240" />
          <circle cx="5.5" cy="-1" r="1.9" fill="#2B2240" />
          <circle cx="-9" cy="3" r="2.2" fill="#FF9EAA" opacity="0.7" />
          <circle cx="9" cy="3" r="2.2" fill="#FF9EAA" opacity="0.7" />
          <path d="M-2 3 Q0 5 2 3" stroke="#2B2240" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </g>
      ))}
    </g>
  ),
  '👥': () => (
    <g>
      <circle cx="42" cy="22" r="10" fill={C.purple} />
      <path d="M26 56 Q26 36 42 36 Q58 36 58 56Z" fill={C.purple} />
      <circle cx="22" cy="24" r="11" fill={C.teal} />
      <path d="M4 58 Q4 38 22 38 Q40 38 40 58Z" fill={C.teal} />
    </g>
  ),
  '✅': () => (
    <g>
      <rect x="6" y="6" width="52" height="52" rx="14" fill={C.green} />
      <path d="M18 33 L28 43 L46 22" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  '🎭': () => (
    <g>
      <path d="M6 10 H32 V30 Q32 46 19 46 Q6 46 6 30Z" fill={C.yellow} />
      <path d="M32 18 H58 V38 Q58 54 45 54 Q32 54 32 38Z" fill={C.purple} />
      <path d="M12 24 Q15 20 18 24 M22 24 Q25 20 28 24 M13 34 Q19 40 25 34" stroke={C.dark} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M38 34 Q41 30 44 34 M48 34 Q51 30 54 34 M40 46 Q46 40 52 46" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  ),
  '🌊': () => (
    <g>
      <path d="M4 40 Q10 14 32 14 Q48 14 50 28 Q40 22 34 30 Q30 38 40 42 Q50 44 58 36 V58 H4Z" fill={C.blue} />
      <path d="M4 50 Q18 42 32 50 Q46 58 60 48 V60 H4Z" fill={C.blueD} />
      <path d="M50 28 Q40 22 34 30 Q30 38 40 42" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  ),
  '🔍': () => (
    <g>
      <path d="M40 40 L56 56" stroke={C.brown} strokeWidth="8" strokeLinecap="round" />
      <circle cx="26" cy="26" r="18" fill={C.sky} stroke={C.yellowD} strokeWidth="6" />
      <Hi x={20} y={20} rx={3} ry={6} r={45} o={0.9} />
    </g>
  ),
  '🦸': () => (
    <g>
      <path d="M14 20 L6 58 L32 48 L58 58 L50 20Z" fill={C.red} />
      <path d="M32 48 L58 58 L50 20 H42Z" fill={C.redD} opacity="0.6" />
      <path d="M20 16 H44 L32 34Z" fill={C.yellow} />
      <path d={star(32, 22, 5, 2.2)} fill={C.red} />
    </g>
  ),
  '🫁': () => (
    <g>
      <path d="M32 6 V24 M32 24 Q26 28 24 32 M32 24 Q38 28 40 32" stroke={C.peachD} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M24 22 Q8 22 8 42 Q8 56 18 56 Q28 56 28 44 V30 Q28 22 24 22Z" fill={C.pink} />
      <path d="M40 22 Q56 22 56 42 Q56 56 46 56 Q36 56 36 44 V30 Q36 22 40 22Z" fill={C.pink} />
      <Hi x={16} y={36} rx={2.4} ry={6} r={10} o={0.45} />
      <Hi x={48} y={36} rx={2.4} ry={6} r={-10} o={0.45} />
    </g>
  ),
  '💭': () => (
    <g>
      <path d="M14 34 A10 10 0 0 1 14 14 A12 12 0 0 1 34 8 A12 12 0 0 1 52 18 A9 9 0 0 1 52 36 Z" fill="#fff" />
      <circle cx="20" cy="44" r="5" fill="#fff" />
      <circle cx="12" cy="54" r="3" fill="#fff" />
      <Sh d="M14 34 H52 A9 9 0 0 0 60 26 Q58 32 50 32 H12 Z" o={0.07} />
    </g>
  ),
  '📖': () => (
    <g>
      <path d="M4 14 Q18 8 32 14 V56 Q18 50 4 56Z" fill="#fff" />
      <path d="M60 14 Q46 8 32 14 V56 Q46 50 60 56Z" fill="#F4F1FA" />
      <path d="M10 22 Q18 19 26 22 M10 30 Q18 27 26 30 M10 38 Q18 35 26 38 M38 22 Q46 19 54 22 M38 30 Q46 27 54 30" stroke={C.gray} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M4 56 Q18 50 32 56 Q46 50 60 56 V60 Q46 54 32 60 Q18 54 4 60Z" fill={C.purple} />
    </g>
  ),
  '📒': () => (
    <g>
      <rect x="12" y="6" width="42" height="52" rx="5" fill={C.yellow} />
      <rect x="12" y="6" width="9" height="52" rx="4" fill={C.yellowD} />
      <rect x="26" y="16" width="22" height="10" rx="2" fill="#fff" opacity="0.85" />
      {[12, 22, 32, 42, 52].map((y) => (
        <circle key={y} cx="16.5" cy={y} r="1.6" fill={C.choc} />
      ))}
    </g>
  ),
  '🙈': () => (
    <g>
      <circle cx="32" cy="34" r="22" fill={C.brown} />
      <ellipse cx="32" cy="40" rx="15" ry="12" fill={C.peach} />
      <circle cx="10" cy="32" r="6" fill={C.peach} />
      <circle cx="54" cy="32" r="6" fill={C.peach} />
      <rect x="14" y="22" width="16" height="12" rx="6" fill={C.brownD} />
      <rect x="34" y="22" width="16" height="12" rx="6" fill={C.brownD} />
      <path d="M28 46 Q32 49 36 46" stroke={C.dark} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  ),
  '🧑': () => (
    <g>
      <path d="M8 60 Q8 44 32 44 Q56 44 56 60Z" fill={C.teal} />
      <circle cx="32" cy="26" r="16" fill={C.peach} />
      <path d="M16 24 Q14 8 32 8 Q50 8 48 24 Q42 16 32 18 Q22 16 16 24Z" fill={C.choc} />
      <Face x={32} y={28} w={10} />
    </g>
  ),
  '🧒': () => (
    <g>
      <path d="M12 60 Q12 46 32 46 Q52 46 52 60Z" fill={C.orange} />
      <circle cx="32" cy="30" r="15" fill={C.peach} />
      <path d="M16 26 Q14 12 32 12 Q50 12 48 26 L44 20 L38 24 L32 18 L26 24 L20 20Z" fill={C.brown} />
      <circle cx="18" cy="18" r="5" fill={C.brown} />
      <circle cx="46" cy="18" r="5" fill={C.brown} />
      <Face x={32} y={32} w={10} />
    </g>
  ),
  '👶': () => (
    <g>
      <circle cx="32" cy="34" r="20" fill={C.peach} />
      <path d="M30 14 Q32 6 38 10 Q34 10 34 14" stroke={C.brown} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <Face x={32} y={34} w={11} />
      <circle cx="32" cy="45" r="3.4" fill={C.pink} />
    </g>
  ),

  '🐝': () => (
    <g>
      <ellipse cx="22" cy="18" rx="10" ry="8" fill="#fff" opacity="0.85" transform="rotate(-25 22 18)" />
      <ellipse cx="38" cy="16" rx="10" ry="8" fill="#fff" opacity="0.85" transform="rotate(25 38 16)" />
      <ellipse cx="32" cy="38" rx="20" ry="16" fill={C.yellow} />
      <path d="M26 23 Q22 38 26 53 M38 23 Q42 38 38 53" stroke={C.dark} strokeWidth="5" fill="none" />
      <path d="M52 38 L60 38" stroke={C.dark} strokeWidth="3" strokeLinecap="round" />
      <circle cx="16" cy="34" r="2.4" fill={C.dark} />
      <ellipse cx="17" cy="42" rx="3" ry="2" fill={C.pink} opacity="0.8" />
    </g>
  ),
  '🎩': () => (
    <g>
      <rect x="18" y="8" width="28" height="36" rx="4" fill={C.dark} />
      <rect x="18" y="34" width="28" height="7" fill={C.red} />
      <ellipse cx="32" cy="46" rx="26" ry="7" fill={C.dark} />
      <Hi x={23} y={20} rx={1.6} ry={8} o={0.25} />
    </g>
  ),
  '🧚': () => (
    <g>
      <path d="M30 30 Q8 8 6 28 Q8 40 30 34Z M34 30 Q56 8 58 28 Q56 40 34 34Z" fill={C.lilac} opacity="0.9" />
      <path d="M30 36 Q14 46 18 54 Q26 54 30 40Z M34 36 Q50 46 46 54 Q38 54 34 40Z" fill={C.sky} opacity="0.9" />
      <path d="M32 18 L48 4" stroke={C.yellowD} strokeWidth="2.6" strokeLinecap="round" />
      <path d={star(50, 4, 6, 2.6)} fill={C.yellow} />
      <path d="M26 26 L32 60 L38 26Z" fill={C.pink} />
      <circle cx="32" cy="22" r="7" fill={C.peach} />
      <path d={sparkle(14, 50, 4)} fill={C.yellow} />
    </g>
  ),
  '🎓': () => (
    <g>
      <path d="M18 30 V44 Q32 52 46 44 V30" fill={C.dark} />
      <path d="M2 24 L32 10 L62 24 L32 38Z" fill={C.dark} />
      <path d="M32 24 L52 30 V44" stroke={C.yellow} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="52" cy="46" r="3.4" fill={C.yellow} />
      <path d="M2 24 L32 10 L62 24 L32 18Z" fill="#fff" opacity="0.1" />
    </g>
  ),
  '🟪': () => (
    <g>
      <rect x="10" y="10" width="44" height="44" rx="10" fill="none" stroke={C.purple} strokeWidth="6" />
      <circle cx="10" cy="10" r="5" fill={C.purpleD} />
      <path d="M22 32 H42" stroke={C.lilac} strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
};

WORLD['🏠'] = WORLD['🏡'];
