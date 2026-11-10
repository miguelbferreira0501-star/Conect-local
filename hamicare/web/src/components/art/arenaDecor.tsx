// Móveis e decoração exclusivos das arenas (prêmios ao abrir cada arena).
import { C, Face, Hi, Sh, heart, sparkle, star, type Draw } from './kit';

export const ARENA_DECOR: Record<string, Draw> = {
  // Jardim Encantado
  'art:banco-galho': () => (
    <g>
      <path d="M8 34 Q32 28 56 34" stroke={C.brown} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M10 26 Q32 20 54 26" stroke={C.woodD} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M14 36 L10 56 M50 36 L54 56 M22 36 L20 54 M42 36 L44 54" stroke={C.brownD} strokeWidth="4.4" strokeLinecap="round" />
      <path d="M12 26 L10 14 M52 26 L54 14" stroke={C.brownD} strokeWidth="4" strokeLinecap="round" />
      <path d="M10 14 Q4 10 6 6 Q12 8 10 14Z M54 14 Q60 10 58 6 Q52 8 54 14Z" fill={C.leaf} />
      <circle cx="30" cy="18" r="3" fill={C.pink} />
      <circle cx="36" cy="20" r="2.4" fill={C.yellow} />
    </g>
  ),
  'art:casa-passaro': () => (
    <g>
      <rect x="29" y="40" width="6" height="22" rx="2" fill={C.brownD} />
      <path d="M14 24 L32 8 L50 24Z" fill={C.red} />
      <rect x="17" y="22" width="30" height="22" rx="3" fill={C.wood} />
      <circle cx="32" cy="32" r="5" fill={C.choc} />
      <rect x="29" y="38" width="6" height="2.4" rx="1" fill={C.brownD} />
      <ellipse cx="44" cy="14" rx="6" ry="4.4" fill={C.blue} />
      <circle cx="47" cy="12.6" r="1" fill={C.dark} />
      <path d="M50 14 L53 13 L50 15.4Z" fill={C.orange} />
      <Sh d="M40 22 H47 V41 Q47 44 44 44 H40Z" o={0.1} />
    </g>
  ),
  // Vila Aconchegante
  'art:balcao-cafe': () => (
    <g>
      <rect x="6" y="30" width="52" height="28" rx="4" fill={C.brown} />
      <rect x="4" y="26" width="56" height="7" rx="3" fill={C.woodD} />
      <path d="M12 38 H52 M12 46 H52" stroke={C.brownD} strokeWidth="1.6" opacity="0.6" />
      <rect x="12" y="10" width="14" height="16" rx="3" fill={C.grayD} />
      <rect x="15" y="6" width="8" height="5" rx="1.5" fill={C.dark} />
      <path d="M26 16 H30 V22 H26" stroke={C.dark} strokeWidth="2" fill="none" />
      <path d="M38 18 H50 V24 Q50 27 47 27 H41 Q38 27 38 24Z" fill="#fff" />
      <path d="M50 20 Q54 20 53 23 Q52 25 50 24" stroke="#fff" strokeWidth="2" fill="none" />
      <path d="M42 14 Q40 11 42 8 M46 14 Q44 11 46 8" stroke={C.grayD} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.8" />
    </g>
  ),
  'art:lampiao': () => (
    <g>
      <rect x="29" y="22" width="6" height="36" rx="2" fill={C.dark} />
      <path d="M22 60 H42" stroke={C.dark} strokeWidth="5" strokeLinecap="round" />
      <path d="M24 10 H40 L37 24 H27Z" fill={C.dark} />
      <path d="M26 12 H38 L35.6 22 H28.4Z" fill={C.yellow} />
      <ellipse cx="32" cy="17" rx="14" ry="12" fill={C.yellow} opacity="0.25" />
      <path d="M22 10 L32 4 L42 10Z" fill={C.dark} />
    </g>
  ),
  // Refúgio na Floresta
  'art:luminaria-cogumelo': () => (
    <g>
      <ellipse cx="32" cy="26" rx="26" ry="20" fill={C.yellow} opacity="0.22" />
      <path d="M26 34 H38 L40 56 Q40 60 32 60 Q24 60 24 56Z" fill={C.cream} />
      <path d="M8 36 Q8 10 32 10 Q56 10 56 36Z" fill={C.red} />
      <circle cx="20" cy="26" r="4" fill="#FFF7D6" />
      <circle cx="36" cy="18" r="3.4" fill="#FFF7D6" />
      <circle cx="46" cy="28" r="3.6" fill="#FFF7D6" />
      <ellipse cx="32" cy="36" rx="20" ry="3" fill={C.yellow} />
    </g>
  ),
  'art:cama-tronco': () => (
    <g>
      <rect x="4" y="14" width="10" height="42" rx="5" fill={C.brown} />
      <circle cx="9" cy="14" r="5" fill={C.wood} />
      <circle cx="9" cy="14" r="2.4" fill={C.woodD} />
      <rect x="8" y="42" width="52" height="10" rx="5" fill={C.brown} />
      <rect x="12" y="34" width="48" height="10" rx="4" fill="#fff" />
      <path d="M28 30 H58 Q60 30 60 32 V44 H28Z" fill={C.leaf} />
      <path d="M32 34 L40 40 M44 32 L52 40" stroke="#fff" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
      <ellipse cx="20" cy="33" rx="7" ry="4.4" fill="#fff" />
      <rect x="10" y="52" width="5" height="6" rx="1.5" fill={C.brownD} />
      <rect x="54" y="52" width="5" height="6" rx="1.5" fill={C.brownD} />
    </g>
  ),
  // Paraíso Tropical
  'art:guarda-sol': () => (
    <g>
      <path d="M32 14 V60" stroke={C.woodD} strokeWidth="3" strokeLinecap="round" />
      <path d="M4 28 Q32 0 60 28Z" fill={C.red} />
      <path d="M14 26 Q20 8 32 6 Q24 12 23 27Z M41 27 Q40 12 32 6 Q44 8 50 26Z" fill="#fff" />
      <path d="M4 28 Q11 24 18 28 Q25 24 32 28 Q39 24 46 28 Q53 24 60 28" stroke={C.redD} strokeWidth="2" fill="none" />
      <ellipse cx="32" cy="60" rx="14" ry="3" fill={C.wood} opacity="0.6" />
    </g>
  ),
  'art:cadeira-praia': () => (
    <g>
      <path d="M14 20 L24 50 M44 50 L50 34" stroke={C.woodD} strokeWidth="4" strokeLinecap="round" />
      <path d="M16 18 L26 46 H46 L40 30 Z" fill={C.blue} />
      <path d="M19 26 L41 26 M22 34 L43 34 M25 42 L46 42" stroke="#fff" strokeWidth="3" opacity="0.85" />
      <path d="M10 56 L24 50 L46 50 L56 56" stroke={C.woodD} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  'art:tapete-tropical': () => (
    <g>
      <ellipse cx="32" cy="38" rx="30" ry="14" fill={C.teal} />
      <ellipse cx="32" cy="38" rx="22" ry="9" fill={C.yellow} />
      <path d="M20 38 Q26 30 32 38 Q38 46 44 38" stroke={C.orange} strokeWidth="3" fill="none" />
      <path d="M2 38 L-2 40 M62 38 L66 40" stroke={C.tealD} strokeWidth="2" />
      <circle cx="32" cy="38" r="3" fill={C.pink} />
    </g>
  ),
  // Montanhas Nevadas
  'art:lareira': () => (
    <g>
      <rect x="6" y="14" width="52" height="46" rx="4" fill="#C7826A" />
      {[18, 28, 38, 48].map((y) => (
        <path key={y} d={`M6 ${y} H58`} stroke="#A9654F" strokeWidth="1.6" />
      ))}
      <rect x="2" y="10" width="60" height="7" rx="2" fill={C.brown} />
      <path d="M16 60 V38 Q16 28 32 28 Q48 28 48 38 V60Z" fill={C.dark} />
      <path d="M32 58 Q22 52 26 42 Q28 48 32 46 Q30 38 36 34 Q36 42 40 44 Q44 52 32 58Z" fill={C.orange} />
      <path d="M32 58 Q27 54 29 49 Q31 52 33 51 Q34 47 37 46 Q38 52 32 58Z" fill={C.yellow} />
      <rect x="20" y="56" width="24" height="4" rx="2" fill={C.brownD} />
      <rect x="40" y="2" width="10" height="9" rx="2" fill="#fff" />
      <path d="M45 4 V9" stroke={C.red} strokeWidth="2" />
    </g>
  ),
  'art:tapete-neve': () => (
    <g>
      <ellipse cx="32" cy="38" rx="30" ry="14" fill="#fff" />
      <ellipse cx="32" cy="38" rx="30" ry="14" fill="none" stroke={C.sky} strokeWidth="3" />
      <g stroke={C.blue} strokeWidth="2" strokeLinecap="round">
        <path d="M32 30 V46 M24 34 L40 42 M40 34 L24 42" />
        <path d="M29 31 L32 33 L35 31 M29 45 L32 43 L35 45" fill="none" />
      </g>
      <circle cx="14" cy="38" r="2" fill={C.sky} />
      <circle cx="50" cy="38" r="2" fill={C.sky} />
    </g>
  ),
  // Cidade Moderna
  'art:luminaria-neon': () => (
    <g>
      <rect x="20" y="52" width="24" height="8" rx="3" fill={C.dark} />
      <path d="M32 52 V40" stroke={C.dark} strokeWidth="3" />
      <path d="M18 8 H46 Q50 8 50 12 V36 Q50 40 46 40 H18 Q14 40 14 36 V12 Q14 8 18 8Z" fill="none" stroke="#3AE0D0" strokeWidth="5" />
      <path d="M18 8 H46 Q50 8 50 12 V36 Q50 40 46 40 H18 Q14 40 14 36 V12 Q14 8 18 8Z" fill="none" stroke="#3AE0D0" strokeWidth="12" opacity="0.2" />
      <path d={star(32, 24, 9, 4)} fill="none" stroke={C.pink} strokeWidth="3.4" strokeLinejoin="round" />
    </g>
  ),
  'art:poltrona-moderna': () => (
    <g>
      <path d="M10 20 Q10 10 20 10 H44 Q54 10 54 20 V40 H10Z" fill={C.purple} />
      <rect x="6" y="30" width="52" height="16" rx="8" fill={C.purpleD} />
      <rect x="14" y="32" width="36" height="10" rx="5" fill={C.lilac} />
      <path d="M16 46 L12 58 M48 46 L52 58" stroke={C.dark} strokeWidth="3.4" strokeLinecap="round" />
      <Hi x={22} y={17} rx={7} ry={2.4} o={0.4} />
    </g>
  ),
  // Fundo do Mar
  'art:cama-concha': () => (
    <g>
      <path d="M4 44 Q4 10 32 8 Q60 10 60 44Z" fill={C.rose} />
      {[14, 24, 32, 40, 50].map((x) => (
        <path key={x} d={`M32 44 L${x} ${x === 32 ? 10 : 14}`} stroke={C.pink} strokeWidth="2.4" />
      ))}
      <rect x="4" y="40" width="56" height="12" rx="6" fill={C.sky} />
      <circle cx="32" cy="40" r="6" fill="#fff" />
      <Hi x={30} y={38} rx={2} ry={1.4} />
      <rect x="10" y="52" width="6" height="6" rx="2" fill={C.pinkD} />
      <rect x="48" y="52" width="6" height="6" rx="2" fill={C.pinkD} />
    </g>
  ),
  'art:coral': () => (
    <g>
      <path d="M32 60 V36 M32 44 Q20 40 18 26 M32 40 Q44 36 46 22 M18 26 Q12 20 14 12 M18 30 Q24 22 22 16 M46 22 Q52 16 50 8 M46 26 Q40 20 42 14" stroke={C.pink} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M32 60 V36" stroke={C.pinkD} strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="32" cy="60" rx="16" ry="3" fill={C.wood} />
      <circle cx="52" cy="40" r="3" fill="#fff" opacity="0.7" />
      <circle cx="12" cy="36" r="2" fill="#fff" opacity="0.7" />
    </g>
  ),
  // Reino dos Sonhos
  'art:cama-nuvem': () => (
    <g>
      <path d="M8 46 A10 10 0 0 1 10 28 A12 12 0 0 1 30 20 A14 14 0 0 1 52 26 A10 10 0 0 1 56 46Z" fill="#fff" />
      <Sh d="M8 46 H56 A10 10 0 0 0 60 38 Q58 44 50 44 H10 Q6 44 4 41 Q5 46 8 46Z" o={0.07} />
      <ellipse cx="20" cy="32" rx="8" ry="5" fill={C.rose} />
      <path d="M26 34 H52 V44 H26Z" fill={C.lilac} opacity="0.9" />
      <path d={star(46, 12, 5, 2.2)} fill={C.yellow} />
      <path d={sparkle(14, 12, 4)} fill={C.pink} />
      <path d="M14 46 L12 54 M50 46 L52 54" stroke={C.lilac} strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  'art:luminaria-lua': () => (
    <g>
      <path d="M32 2 V12" stroke={C.grayD} strokeWidth="1.6" />
      <circle cx="32" cy="34" r="24" fill={C.yellow} opacity="0.2" />
      <path d="M40 12 A22 22 0 1 0 54 44 A18 18 0 1 1 40 12Z" fill={C.yellow} />
      <Face x={30} y={36} w={8} />
      <path d={star(50, 18, 4, 1.8)} fill="#fff" />
    </g>
  ),
  // Castelo Encantado
  'art:trono': () => (
    <g>
      <path d="M14 30 V10 L20 4 L26 10 L32 2 L38 10 L44 4 L50 10 V30Z" fill={C.yellow} />
      <path d="M18 30 V14 H46 V30Z" fill={C.red} />
      <circle cx="32" cy="10" r="2.6" fill={C.blue} />
      <rect x="8" y="28" width="10" height="20" rx="4" fill={C.yellowD} />
      <rect x="46" y="28" width="10" height="20" rx="4" fill={C.yellowD} />
      <rect x="14" y="34" width="36" height="12" rx="4" fill={C.redD} />
      <rect x="12" y="44" width="40" height="6" rx="2" fill={C.yellow} />
      <path d="M16 50 V60 M48 50 V60" stroke={C.yellowD} strokeWidth="5" strokeLinecap="round" />
      <Hi x={22} y={20} rx={1.6} ry={5} o={0.4} />
    </g>
  ),
  'art:tapete-vermelho': () => (
    <g>
      <path d="M2 30 H62 L56 46 H8Z" fill={C.red} />
      <path d="M2 30 H62 L60 34 H4Z" fill={C.redD} />
      <path d="M8 46 L4 50 M56 46 L60 50" stroke={C.yellow} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M10 38 H54" stroke={C.yellow} strokeWidth="2" strokeDasharray="4 3" />
    </g>
  ),
  // Estação Espacial
  'art:cama-estrelas': () => (
    <g>
      <path d="M4 50 V20 Q4 12 12 12 Q20 12 20 20 V34 H60 V50Z" fill="#3E2F7A" />
      {[[10, 18], [14, 26], [8, 30]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.4" fill="#fff" />
      ))}
      <rect x="18" y="32" width="42" height="10" rx="4" fill="#fff" />
      <path d="M30 30 H58 Q60 30 60 32 V42 H30Z" fill={C.purple} />
      <path d={star(44, 36, 4, 1.8)} fill={C.yellow} />
      <path d={star(54, 38, 3, 1.3)} fill={C.yellow} />
      <ellipse cx="24" cy="31" rx="6" ry="3.6" fill="#fff" />
      <path d="M8 50 V58 M56 50 V58" stroke={C.grayD} strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  'art:luminaria-estrelas': () => (
    <g>
      <rect x="22" y="52" width="20" height="8" rx="3" fill={C.dark} />
      <circle cx="32" cy="30" r="22" fill="#3E2F7A" />
      <circle cx="32" cy="30" r="26" fill={C.purple} opacity="0.2" />
      {[[22, 22, 4], [40, 18, 3], [36, 36, 5], [24, 38, 2.6], [44, 30, 2.4]].map(([x, y, r], i) => (
        <path key={i} d={star(x, y, r, r * 0.45)} fill={C.yellow} />
      ))}
      <Hi x={22} y={16} rx={5} ry={2.4} r={-30} o={0.3} />
    </g>
  ),
  'art:mobile-planetas': () => (
    <g>
      <path d="M8 6 H56" stroke={C.grayD} strokeWidth="3" strokeLinecap="round" />
      <path d="M16 6 V26 M32 6 V40 M48 6 V22" stroke={C.grayD} strokeWidth="1.4" />
      <circle cx="16" cy="32" r="7" fill={C.orange} />
      <ellipse cx="16" cy="32" rx="11" ry="3" fill="none" stroke={C.yellow} strokeWidth="2" />
      <circle cx="32" cy="48" r="9" fill={C.blue} />
      <path d="M26 46 Q30 42 34 46 Q38 50 36 54" fill={C.green} />
      <circle cx="48" cy="28" r="6" fill={C.pink} />
      <path d={star(40, 18, 3, 1.3)} fill={C.yellow} />
    </g>
  ),
  // Casa na Lua
  'art:foguete': () => (
    <g>
      <path d="M32 4 C44 14 46 30 44 46 H20 C18 30 20 14 32 4Z" fill={C.white} />
      <path d="M32 4 C38 10 41 18 42 26 H22 C23 18 26 10 32 4Z" fill={C.red} />
      <circle cx="32" cy="34" r="6" fill={C.sky} stroke={C.grayD} strokeWidth="2" />
      <path d="M20 38 L10 52 L20 50Z M44 38 L54 52 L44 50Z" fill={C.red} />
      <path d="M24 46 H40 L37 52 H27Z" fill={C.grayD} />
      <path d="M27 52 Q32 64 37 52Z" fill={C.orange} />
      <path d="M29 52 Q32 59 35 52Z" fill={C.yellow} />
      <Hi x={26} y={20} rx={2.5} ry={8} r={10} />
    </g>
  ),
  'art:bandeira-lua': () => (
    <g>
      <path d="M18 60 V8" stroke={C.grayD} strokeWidth="3" strokeLinecap="round" />
      <path d="M19 9 H50 V30 H19Z" fill={C.pink} />
      <path d={heart(34, 20, 6)} fill="#fff" />
      <ellipse cx="18" cy="60" rx="10" ry="3" fill="#000" opacity="0.15" />
    </g>
  ),
  'art:cama-cratera': () => (
    <g>
      <ellipse cx="32" cy="44" rx="30" ry="14" fill={C.grayD} />
      <ellipse cx="32" cy="41" rx="25" ry="10" fill={C.gray} />
      <ellipse cx="32" cy="40" rx="20" ry="7" fill={C.lilac} />
      <ellipse cx="22" cy="37" rx="8" ry="4" fill="#fff" />
      <path d={star(46, 36, 4, 1.8)} fill={C.yellow} />
      <path d={star(38, 42, 3, 1.3)} fill={C.yellow} />
    </g>
  ),
  // Ilha Celestial
  'art:fonte-celeste': () => (
    <g>
      <ellipse cx="32" cy="54" rx="26" ry="7" fill={C.yellowD} />
      <ellipse cx="32" cy="51" rx="22" ry="5" fill={C.sky} />
      <rect x="27" y="24" width="10" height="28" rx="3" fill={C.yellow} />
      <ellipse cx="32" cy="24" rx="14" ry="4" fill={C.yellowD} />
      <path d="M32 20 Q20 6 12 22 M32 20 Q44 6 52 22" stroke={C.sky} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M12 22 Q10 34 14 48 M52 22 Q54 34 50 48" stroke={C.sky} strokeWidth="2" fill="none" opacity="0.7" />
      <path d={sparkle(32, 12, 5)} fill="#fff" />
      <Hi x={30} y={34} rx={1.2} ry={6} o={0.5} />
    </g>
  ),
  'art:portal-celeste': () => (
    <g>
      <path d="M10 60 V26 Q10 4 32 4 Q54 4 54 26 V60" stroke={C.yellow} strokeWidth="7" fill="none" />
      <path d="M16 60 V28 Q16 10 32 10 Q48 10 48 28 V60Z" fill="#FFE9F5" />
      <path d="M16 60 V28 Q16 10 32 10 Q48 10 48 28 V60Z" fill={C.lilac} opacity="0.6" />
      <circle cx="32" cy="34" r="10" fill="#fff" opacity="0.8" />
      <path d={sparkle(32, 34, 8)} fill={C.yellow} />
      <path d={star(32, 4, 5, 2.2)} fill={C.yellowD} />
      <ellipse cx="32" cy="60" rx="26" ry="3.4" fill="#fff" opacity="0.8" />
    </g>
  ),
};
