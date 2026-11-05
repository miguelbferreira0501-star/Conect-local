// Ilustrações de comidas: cardápio da pessoa e lanchinhos do Hami.
import { C, Hi, Sh, heart, type Draw } from './kit';

/** Tigela vista de lado, com o que estiver dentro desenhado antes. */
const Bowl = ({ color = '#fff', band = C.blue }: { color?: string; band?: string }) => (
  <g>
    <path d="M6 32 H58 Q58 56 32 56 Q6 56 6 32Z" fill={color} />
    <path d="M9 42 H55" stroke={band} strokeWidth="3" opacity="0.7" />
    <Sh d="M46 32 H58 Q58 56 32 56 Q50 48 46 32Z" o={0.08} />
    <rect x="22" y="55" width="20" height="4" rx="2" fill={C.gray} />
  </g>
);

/** Prato raso visto de cima. */
const Plate = () => (
  <g>
    <ellipse cx="32" cy="40" rx="28" ry="16" fill="#fff" />
    <ellipse cx="32" cy="40" rx="20" ry="10.5" fill={C.gray} opacity="0.45" />
  </g>
);

export const FOOD: Record<string, Draw> = {
  '🍎': () => (
    <g>
      <path d="M32 16 Q30 8 34 4" stroke={C.choc} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M34 12 Q42 4 50 8 Q44 16 34 12Z" fill={C.leaf} />
      <path d="M32 18 Q20 10 12 20 Q4 32 12 46 Q20 60 32 54 Q44 60 52 46 Q60 32 52 20 Q44 10 32 18Z" fill={C.red} />
      <Sh d="M46 15 Q56 20 56 34 Q56 54 32 54 Q48 46 46 15Z" />
      <Hi x={20} y={28} rx={3.4} ry={6} r={25} />
    </g>
  ),
  '☕': () => (
    <g>
      <path d="M24 6 Q20 10 24 14 Q28 18 24 22 M34 4 Q30 8 34 12 Q38 16 34 20" stroke={C.grayD} strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M46 32 Q58 32 56 42 Q54 50 44 48" stroke={C.red} strokeWidth="5" fill="none" />
      <path d="M10 26 H48 V44 Q48 56 36 56 H22 Q10 56 10 44Z" fill={C.red} />
      <ellipse cx="29" cy="27" rx="19" ry="4" fill={C.choc} />
      <Sh d="M40 28 H48 V44 Q48 56 36 56 H32 Q42 50 40 28Z" o={0.12} />
      <ellipse cx="32" cy="58" rx="26" ry="4" fill={C.gray} />
      <path d={heart(29, 41, 6)} fill="#fff" opacity="0.85" />
    </g>
  ),
  '🍛': () => (
    <g>
      <ellipse cx="32" cy="40" rx="28" ry="16" fill="#fff" />
      <ellipse cx="24" cy="38" rx="14" ry="9" fill={C.cream} />
      <path d="M30 34 Q44 28 54 38 Q52 48 38 48 Q30 46 30 34Z" fill={C.orange} />
      <circle cx="42" cy="38" r="3" fill={C.yellow} />
      <circle cx="48" cy="42" r="2.4" fill={C.green} />
      <circle cx="37" cy="43" r="2.4" fill={C.red} />
    </g>
  ),
  '🍲': () => (
    <g>
      <path d="M22 10 Q18 14 22 18 M32 8 Q28 12 32 16 M42 10 Q38 14 42 18" stroke={C.grayD} strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.7" />
      <rect x="4" y="28" width="8" height="5" rx="2.5" fill={C.dark} />
      <rect x="52" y="28" width="8" height="5" rx="2.5" fill={C.dark} />
      <path d="M10 26 H54 V44 Q54 56 42 56 H22 Q10 56 10 44Z" fill={C.red} />
      <ellipse cx="32" cy="26" rx="22" ry="5" fill={C.orange} />
      <circle cx="24" cy="25.5" r="2.6" fill={C.green} />
      <circle cx="34" cy="24.5" r="2.6" fill={C.yellow} />
      <circle cx="42" cy="26" r="2.4" fill={C.orangeD} />
      <Sh d="M44 28 H54 V44 Q54 56 42 56 H38 Q48 48 44 28Z" o={0.12} />
    </g>
  ),
  '🥖': () => (
    <g transform="rotate(-35 32 32)">
      <rect x="2" y="22" width="60" height="20" rx="10" fill={C.wood} />
      <Sh d="M2 34 Q4 42 12 42 H52 Q60 42 62 34Z" o={0.1} />
      <path d="M14 26 L20 34 M26 25 L32 33 M38 25 L44 33 M50 26 L54 32" stroke={C.cream} strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  '🍞': () => (
    <g>
      <path d="M10 26 Q6 10 22 10 H42 Q58 10 54 26 Q52 30 50 30 V54 Q50 58 46 58 H18 Q14 58 14 54 V30 Q12 30 10 26Z" fill={C.woodD} />
      <path d="M15 27 Q12 15 24 15 H40 Q52 15 49 27 Q48 30 46 30 V52 Q46 54 44 54 H20 Q18 54 18 52 V30 Q16 30 15 27Z" fill={C.cream} />
      <circle cx="26" cy="32" r="1.4" fill={C.wood} />
      <circle cx="36" cy="40" r="1.4" fill={C.wood} />
      <circle cx="30" cy="46" r="1.4" fill={C.wood} />
    </g>
  ),
  '🫓': () => (
    <g>
      <path d="M8 42 H56 Q54 50 32 50 Q10 50 8 42Z" fill={C.red} />
      <path d="M12 43 H52" stroke={C.yellow} strokeWidth="3" strokeLinecap="round" />
      <path d="M8 42 Q8 14 32 14 Q56 14 56 42Z" fill="#FFFDF4" />
      <Sh d="M44 17 Q56 24 56 42 H46 Q50 28 44 17Z" o={0.06} />
      {[[20, 30], [30, 24], [40, 30], [26, 36], [46, 36], [36, 20]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="1.3" fill={C.wood} opacity="0.6" />
      ))}
    </g>
  ),
  '🌽': () => (
    <g transform="rotate(30 32 32)">
      <path d="M32 4 Q44 6 44 30 Q44 50 32 54 Q20 50 20 30 Q20 6 32 4Z" fill={C.yellow} />
      {[12, 20, 28, 36, 44].map((y) => (
        <path key={y} d={`M22 ${y} H42`} stroke={C.yellowD} strokeWidth="1.6" />
      ))}
      <path d="M27 6 V50 M37 6 V50" stroke={C.yellowD} strokeWidth="1.4" />
      <path d="M32 60 Q14 50 18 22 Q24 40 32 46Z" fill={C.leaf} />
      <path d="M32 60 Q50 50 46 22 Q40 40 32 46Z" fill={C.green} />
    </g>
  ),
  '🥚': () => (
    <g>
      <path d="M32 6 Q50 6 52 34 Q52 58 32 58 Q12 58 12 34 Q14 6 32 6Z" fill="#FFF6E8" />
      <Sh d="M44 12 Q52 22 52 34 Q52 58 32 58 Q48 48 44 12Z" o={0.08} />
      <Hi x={23} y={22} rx={3} ry={6} r={20} o={0.9} />
    </g>
  ),
  '🍳': () => (
    <g>
      <rect x="40" y="38" width="24" height="8" rx="4" fill={C.brown} transform="rotate(35 40 42)" />
      <circle cx="28" cy="30" r="24" fill={C.red} />
      <circle cx="28" cy="30" r="19" fill="#FFE9E2" />
      <path d="M14 30 Q12 18 24 17 Q36 12 40 24 Q44 34 36 40 Q26 46 19 41 Q13 37 14 30Z" fill="#fff" />
      <circle cx="28" cy="29" r="7" fill={C.yellow} />
      <Hi x={26} y={27} rx={2} ry={1.4} />
      <Sh d="M40 11 A24 24 0 0 1 28 54 A24 24 0 0 0 40 11Z" o={0.12} />
    </g>
  ),
  '🧀': () => (
    <g>
      <path d="M6 44 L48 18 Q58 24 58 34 V50 H6Z" fill={C.yellow} />
      <path d="M6 44 L48 18 Q58 24 58 34 L16 44Z" fill="#FFE38F" />
      <path d="M6 44 H58 V50 H6Z" fill={C.yellowD} opacity="0.5" />
      <circle cx="20" cy="48" r="2.4" fill={C.yellowD} />
      <circle cx="36" cy="47" r="3.4" fill={C.yellowD} />
      <circle cx="50" cy="42" r="2.4" fill={C.yellowD} />
      <ellipse cx="38" cy="32" rx="3" ry="1.6" fill={C.yellowD} />
    </g>
  ),
  '🧈': () => (
    <g>
      <ellipse cx="32" cy="48" rx="28" ry="9" fill={C.sky} />
      <path d="M14 30 L40 22 L54 30 V40 L28 48 L14 40Z" fill="#FFE58A" />
      <path d="M14 30 L40 22 L54 30 L28 38Z" fill="#FFF0B0" />
      <path d="M28 38 L54 30 V40 L28 48Z" fill={C.yellow} />
    </g>
  ),
  '🥛': () => (
    <g>
      <path d="M16 8 H48 L44 56 Q43.6 60 40 60 H24 Q20.4 60 20 56Z" fill="#E9F5FF" />
      <path d="M17.4 22 H46.6 L44 56 Q43.6 60 40 60 H24 Q20.4 60 20 56Z" fill="#fff" />
      <Sh d="M40 22 H46.6 L44 56 Q43.6 60 40 60 H37Z" o={0.07} />
      <Hi x={22} y={36} rx={1.4} ry={10} o={0.9} />
      <path d="M17.4 22 Q32 26 46.6 22" stroke={C.gray} strokeWidth="1.4" fill="none" />
    </g>
  ),
  '🥣': () => (
    <g>
      <ellipse cx="32" cy="32" rx="26" ry="6" fill={C.cream} />
      <circle cx="22" cy="30" r="3" fill={C.wood} />
      <circle cx="30" cy="33" r="3" fill={C.woodD} />
      <circle cx="40" cy="30" r="3" fill={C.wood} />
      <circle cx="35" cy="28" r="2.6" fill={C.red} />
      <path d="M44 26 L58 8" stroke={C.grayD} strokeWidth="4" strokeLinecap="round" />
      <Bowl band={C.teal} />
    </g>
  ),
  '🍌': () => (
    <g>
      <path d="M10 22 Q12 52 40 54 Q56 54 58 44 Q40 48 28 38 Q18 30 16 18Z" fill={C.yellow} />
      <path d="M16 18 Q18 30 28 38 Q40 48 58 44 Q54 48 44 48 Q24 46 16 18Z" fill={C.yellowD} opacity="0.5" />
      <path d="M10 22 L12 14 L17 16 L16 20Z" fill={C.choc} />
      <Hi x={18} y={36} rx={2} ry={7} r={-30} />
    </g>
  ),
  '🍈': () => (
    <g>
      <path d="M32 6 Q52 8 56 30 Q58 54 32 58 Q6 54 8 30 Q12 8 32 6Z" fill={C.orange} />
      <path d="M32 14 Q46 16 48 32 Q48 48 32 50 Q16 48 16 32 Q18 16 32 14Z" fill="#FFB774" />
      <ellipse cx="32" cy="32" rx="8" ry="11" fill={C.choc} opacity="0.85" />
      <circle cx="30" cy="28" r="1.4" fill={C.dark} />
      <circle cx="34" cy="33" r="1.4" fill={C.dark} />
      <circle cx="30" cy="37" r="1.4" fill={C.dark} />
    </g>
  ),
  '🍊': () => (
    <g>
      <path d="M32 12 Q36 4 44 6 Q40 14 32 12Z" fill={C.leaf} />
      <circle cx="32" cy="36" r="23" fill={C.orange} />
      <Sh d="M46 18 A23 23 0 0 1 32 59 A23 23 0 0 0 46 18Z" o={0.12} />
      <circle cx="32" cy="13.5" r="2" fill={C.leafD} />
      <Hi x={22} y={28} rx={3.4} ry={5.4} r={30} />
      <circle cx="40" cy="40" r="1" fill={C.orangeD} />
      <circle cx="26" cy="46" r="1" fill={C.orangeD} />
    </g>
  ),
  '🧃': () => (
    <g>
      <path d="M36 14 L40 2 L46 4" stroke={C.pink} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 18 L22 12 H42 L48 18Z" fill={C.orangeD} />
      <rect x="16" y="18" width="32" height="42" rx="3" fill={C.orange} />
      <circle cx="32" cy="38" r="9" fill={C.yellow} />
      <path d="M32 29 V47 M23 38 H41 M26 32 L38 44 M38 32 L26 44" stroke={C.orange} strokeWidth="1.2" />
      <Sh d="M40 18 H48 V57 Q48 60 45 60 H40Z" o={0.1} />
    </g>
  ),
  '🍚': () => (
    <g>
      <path d="M8 34 Q8 16 32 16 Q56 16 56 34Z" fill="#fff" />
      <path d="M18 22 l3 1 M28 19 l3 1 M38 21 l3 1 M24 28 l3 1 M44 27 l3 1 M14 30 l3 1 M34 26 l3 1" stroke={C.gray} strokeWidth="2" strokeLinecap="round" />
      <Bowl band={C.red} />
    </g>
  ),
  '🫘': () => (
    <g>
      <ellipse cx="32" cy="32" rx="26" ry="7" fill="#7A3B2E" />
      {[
        [18, 31], [26, 29], [34, 32], [42, 29], [48, 32], [30, 34],
      ].map(([x, y]) => (
        <ellipse key={`${x}${y}`} cx={x} cy={y} rx="3.6" ry="2.4" fill="#9B4A3A" />
      ))}
      <Bowl band={C.orange} />
    </g>
  ),
  '🍗': () => (
    <g transform="rotate(-30 32 32)">
      <path d="M30 40 L50 56" stroke={C.cream} strokeWidth="7" strokeLinecap="round" />
      <circle cx="51" cy="52" r="5" fill={C.cream} />
      <circle cx="55" cy="58" r="5" fill={C.cream} />
      <path d="M24 6 Q44 8 42 30 Q40 46 26 46 Q8 44 8 26 Q8 6 24 6Z" fill={C.orange} />
      <Sh d="M36 10 Q44 16 42 30 Q40 46 26 46 Q40 36 36 10Z" o={0.12} />
      <Hi x={18} y={18} rx={3} ry={5} r={30} />
    </g>
  ),
  '🥩': () => (
    <g>
      <path d="M10 30 Q8 14 26 12 Q48 10 56 24 Q62 40 46 50 Q30 58 18 50 Q10 44 10 30Z" fill={C.red} />
      <path d="M14 30 Q14 18 28 16 Q46 15 52 26 Q56 38 44 46 Q30 52 20 46 Q14 40 14 30Z" fill="#F58C8C" />
      <path d="M24 26 Q32 22 40 28 M22 36 Q32 32 44 38" stroke="#fff" strokeWidth="2.4" fill="none" opacity="0.7" strokeLinecap="round" />
      <circle cx="44" cy="28" r="4" fill="#fff" />
    </g>
  ),
  '🐟': () => (
    <g>
      <path d="M6 32 Q20 14 40 22 L56 12 Q52 32 56 52 L40 42 Q20 50 6 32Z" fill={C.blue} />
      <path d="M6 32 Q20 46 40 42 L56 52 Q53 42 54 32 H6Z" fill={C.blueD} opacity="0.5" />
      <circle cx="17" cy="29" r="2.6" fill={C.dark} />
      <path d="M26 24 Q30 32 26 40" stroke="#fff" strokeWidth="2" fill="none" opacity="0.7" />
    </g>
  ),
  '🥗': () => (
    <g>
      <circle cx="18" cy="26" r="9" fill={C.green} />
      <circle cx="30" cy="22" r="9" fill={C.leaf} />
      <circle cx="44" cy="24" r="9" fill={C.green} />
      <circle cx="24" cy="28" r="4" fill={C.red} />
      <circle cx="40" cy="27" r="3.4" fill={C.red} />
      <circle cx="33" cy="29" r="3" fill={C.yellow} />
      <Bowl band={C.green} />
    </g>
  ),
  '🥦': () => (
    <g>
      <path d="M26 58 L28 36 H36 L38 58Z" fill={C.greenD} />
      <path d="M28 44 L22 36 M36 44 L42 36" stroke={C.greenD} strokeWidth="4" strokeLinecap="round" />
      <circle cx="20" cy="30" r="11" fill={C.leaf} />
      <circle cx="44" cy="30" r="11" fill={C.leaf} />
      <circle cx="32" cy="20" r="13" fill={C.green} />
      <circle cx="28" cy="16" r="3" fill={C.leaf} />
      <circle cx="38" cy="24" r="3" fill={C.leaf} />
      <circle cx="18" cy="28" r="2.4" fill={C.green} />
      <circle cx="46" cy="32" r="2.4" fill={C.green} />
    </g>
  ),
  '🍠': () => (
    <g transform="rotate(-25 32 32)">
      <path d="M4 32 Q10 18 32 18 Q54 18 60 32 Q54 46 32 46 Q10 46 4 32Z" fill="#B65A6E" />
      <path d="M32 18 Q54 18 60 32 Q54 46 32 46Z" fill="#FFAE63" />
      <path d="M32 18 Q38 32 32 46" stroke="#B65A6E" strokeWidth="2" fill="none" />
      <Hi x={18} y={26} rx={6} ry={2} o={0.35} />
    </g>
  ),
  '🍝': () => (
    <g>
      <Plate />
      <path d="M14 38 Q22 26 32 30 Q42 24 50 38 Q42 50 32 46 Q20 50 14 38Z" fill="#FFE08A" />
      <path d="M18 38 Q26 32 32 38 Q38 32 46 38 M20 42 Q28 38 34 42 Q40 38 44 42" stroke="#F5C860" strokeWidth="2" fill="none" />
      <circle cx="28" cy="34" r="5" fill={C.red} />
      <circle cx="37" cy="36" r="4.4" fill={C.redD} />
      <path d="M32 24 Q34 18 38 20" stroke={C.leaf} strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  ),
  '🥄': () => (
    <g>
      <ellipse cx="32" cy="40" rx="26" ry="14" fill="#fff" />
      <path d="M12 40 Q14 30 32 30 Q50 30 52 40 Q48 48 32 48 Q16 48 12 40Z" fill="#F2CF8A" />
      <circle cx="22" cy="38" r="1.6" fill={C.woodD} />
      <circle cx="30" cy="42" r="1.6" fill={C.woodD} />
      <circle cx="40" cy="38" r="1.6" fill={C.woodD} />
      <circle cx="44" cy="42" r="1.6" fill={C.woodD} />
      <path d="M42 22 L58 6" stroke={C.grayD} strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="38" cy="26" rx="7" ry="5" fill={C.gray} transform="rotate(-45 38 26)" />
    </g>
  ),
  '🥜': () => (
    <g transform="rotate(-25 32 32)">
      <path d="M32 6 Q46 6 46 20 Q46 28 42 32 Q46 36 46 44 Q46 58 32 58 Q18 58 18 44 Q18 36 22 32 Q18 28 18 20 Q18 6 32 6Z" fill={C.wood} />
      <path d="M24 16 l3 2 M36 14 l3 2 M26 26 l3 2 M38 24 l3 2 M24 42 l3 2 M36 40 l3 2 M30 50 l3 2" stroke={C.woodD} strokeWidth="2" strokeLinecap="round" />
      <Sh d="M38 7 Q46 10 46 20 Q46 28 42 32 Q46 36 46 44 Q46 58 32 58 Q42 50 40 32 Q44 20 38 7Z" o={0.1} />
    </g>
  ),
  '🍕': () => (
    <g>
      <path d="M8 14 Q32 2 56 14 L32 60Z" fill="#FFD27A" />
      <path d="M8 14 Q32 2 56 14 L53 20 Q32 9 11 20Z" fill={C.woodD} />
      <circle cx="24" cy="24" r="4.4" fill={C.red} />
      <circle cx="38" cy="22" r="4" fill={C.red} />
      <circle cx="32" cy="36" r="4" fill={C.red} />
      <path d="M22 34 Q24 30 26 34 M38 32 Q40 28 42 32" stroke={C.leaf} strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  ),
  '🍔': () => (
    <g>
      <path d="M8 28 Q8 8 32 8 Q56 8 56 28Z" fill={C.orange} />
      <path d="M20 16 l2 1 M30 13 l2 1 M40 16 l2 1 M26 21 l2 1 M44 22 l2 1" stroke={C.cream} strokeWidth="2" strokeLinecap="round" />
      <path d="M6 30 Q12 26 18 31 Q24 26 30 31 Q36 26 42 31 Q48 26 54 31 Q57 28 58 30 V34 H6Z" fill={C.leaf} />
      <rect x="8" y="33" width="48" height="8" rx="4" fill={C.choc} />
      <path d="M6 40 H58 L52 46 L46 41 L40 46 L34 41 Z" fill={C.yellow} />
      <path d="M8 44 H56 Q56 56 44 56 H20 Q8 56 8 44Z" fill={C.orange} />
    </g>
  ),
  '🍫': () => (
    <g transform="rotate(-15 32 32)">
      <rect x="12" y="6" width="40" height="52" rx="4" fill={C.choc} />
      {[0, 1].map((c) =>
        [0, 1, 2].map((r) => <rect key={`${c}${r}`} x={16 + c * 17} y={10 + r * 11} width="14" height="8" rx="2" fill="#94624A" />),
      )}
      <path d="M10 36 L54 30 V58 Q54 62 50 62 H14 Q10 62 10 58Z" fill={C.red} />
      <rect x="20" y="44" width="24" height="6" rx="3" fill="#fff" opacity="0.85" transform="rotate(-8 32 47)" />
    </g>
  ),
  '🍰': () => (
    <g>
      <path d="M6 36 L44 20 L58 30 V52 L20 60 L6 52Z" fill={C.cream} />
      <path d="M6 36 L44 20 L58 30 L20 44Z" fill="#fff" />
      <path d="M20 44 L58 30 V52 L20 60Z" fill={C.wood} />
      <path d="M20 50 L58 38" stroke={C.pink} strokeWidth="4" />
      <circle cx="40" cy="26" r="5" fill={C.red} />
      <path d="M40 21 Q42 16 46 16" stroke={C.leaf} strokeWidth="2" fill="none" />
    </g>
  ),
  '🍪': () => (
    <g>
      <circle cx="32" cy="32" r="25" fill={C.wood} />
      <Sh d="M46 12 A25 25 0 0 1 32 57 A25 25 0 0 0 46 12Z" o={0.1} />
      {[
        [22, 22], [38, 18], [44, 34], [28, 40], [18, 34], [36, 48],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="3.4" fill={C.choc} />
      ))}
    </g>
  ),
  '🥕': () => (
    <g transform="rotate(35 32 32)">
      <path d="M32 18 Q24 6 20 10 Q24 14 30 20Z M32 18 Q32 2 36 4 Q36 12 34 20Z M32 18 Q42 8 44 12 Q40 16 34 20Z" fill={C.leaf} />
      <path d="M22 20 H42 Q42 40 34 60 Q32 62 30 60 Q22 40 22 20Z" fill={C.orange} />
      <path d="M26 30 H32 M30 40 H36 M28 48 H33" stroke={C.orangeD} strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  '🍓': () => (
    <g>
      <path d="M32 18 Q44 14 52 22 Q58 34 46 50 Q38 60 32 60 Q26 60 18 50 Q6 34 12 22 Q20 14 32 18Z" fill={C.red} />
      <path d="M32 18 L22 10 L28 18 L18 18 L30 22 L32 28 L34 22 L46 18 L36 18 L42 10Z" fill={C.leaf} />
      {[
        [22, 30], [32, 32], [42, 30], [26, 42], [38, 42], [32, 51],
      ].map(([x, y]) => (
        <ellipse key={`${x}${y}`} cx={x} cy={y} rx="1.4" ry="2" fill={C.yellow} />
      ))}
    </g>
  ),
  '🫐': () => (
    <g>
      {[
        [22, 26, 12], [42, 24, 11], [32, 42, 13],
      ].map(([x, y, r]) => (
        <g key={`${x}`}>
          <circle cx={x} cy={y} r={r} fill="#5468C8" />
          <path d={`M${x - 3} ${y - r + 3} L${x} ${y - r + 6} L${x + 3} ${y - r + 3}`} stroke="#2E3C8C" strokeWidth="2" fill="none" />
          <Hi x={x - r / 2} y={y} rx={1.6} ry={3} o={0.4} />
        </g>
      ))}
    </g>
  ),
  '🍢': () => (
    <g transform="rotate(35 32 32)">
      <path d="M32 2 V62" stroke={C.woodD} strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="14" r="8" fill={C.red} />
      <rect x="24" y="23" width="16" height="12" rx="4" fill={C.yellow} />
      <circle cx="32" cy="44" r="8" fill={C.green} />
    </g>
  ),
  '🥐': () => (
    <g>
      <path d="M4 40 Q8 20 32 16 Q56 20 60 40 Q50 44 44 38 Q40 48 32 48 Q24 48 20 38 Q14 44 4 40Z" fill={C.woodD} />
      <path d="M20 38 Q22 22 32 20 Q42 22 44 38" stroke={C.wood} strokeWidth="3" fill="none" />
      <path d="M26 44 Q28 28 32 26 Q36 28 38 44" stroke={C.wood} strokeWidth="2" fill="none" />
    </g>
  ),
  '🍽️': () => (
    <g>
      {/* Sombra */}
      <ellipse cx="32.5" cy="54" rx="16" ry="2.4" fill="#2B2240" opacity="0.08" />
      {/* Prato: borda com contorno para aparecer em fundo branco */}
      <circle cx="32.5" cy="32" r="19" fill="#FFFFFF" stroke="#C9D1DF" strokeWidth="2.2" />
      <circle cx="32.5" cy="32" r="15.8" fill="none" stroke="#FFB8CB" strokeWidth="1.3" strokeDasharray="2.2 2.6" />
      <circle cx="32.5" cy="32" r="12.5" fill="#EEF2F8" stroke="#DCE2EC" strokeWidth="1.6" />
      <path d="M24.5 25 Q28 21 33 20.5" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      {/* Garfo */}
      <g fill="#8E98AC">
        <rect x="5.6" y="9" width="1.8" height="10" rx="0.9" />
        <rect x="8.4" y="9" width="1.8" height="10" rx="0.9" />
        <rect x="11.2" y="9" width="1.8" height="10" rx="0.9" />
        <path d="M5.6 17.5 H13 Q13 22.5 10.6 24 L10.9 52.5 Q10.9 54.5 9.3 54.5 Q7.7 54.5 7.7 52.5 L8 24 Q5.6 22.5 5.6 17.5Z" />
      </g>
      {/* Faca */}
      <path d="M53.6 9 Q59.6 12 59.4 31 H53.6Z" fill="#B9C2D2" />
      <path d="M55 12 Q57.4 16 57.6 28" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.8" />
      <rect x="53.4" y="30" width="6" height="24.5" rx="3" fill="#8E98AC" />
    </g>
  ),
};
