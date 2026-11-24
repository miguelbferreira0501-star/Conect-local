import { createContext, useContext, useId, type ReactNode } from 'react';
import { ThemeKit } from './themeKit';

/** Ícones pequenos (listas, lojas): desenha sem o filtro de contorno, que pesa muito no celular. */
export const KitLite = createContext(false);

// Kit de móveis da casa (desenhos próprios do HamiCare). Cada peça aceita duas cores (c1 principal, c2 detalhe),
// então a mesma cama vira rosa, azul ou lilás na loja. Desenhados de frente, com um pouquinho de profundidade.

export type Place = 'chao' | 'parede' | 'tapete';

/** Mistura duas cores hex (t = 0 → a, t = 1 → b). */
export function mix(a: string, b: string, t: number) {
  const p = (h: string) => {
    const x = h.replace('#', '');
    const f =
      x.length === 3
        ? x
            .split('')
            .map((c) => c + c)
            .join('')
        : x;
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

/**
 * Acabamento de toda peça: sem contorno (desenho liso, como os quartos dos apps de pet), com luz em cima,
 * sombrinha embaixo e um pouco de volume. Vale para todos os móveis de uma vez.
 */
export function S({ w, h, children }: { w: number; h: number; children: ReactNode }) {
  const id = `kf${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const lite = useContext(KitLite);
  const r = Math.max(1.6, Math.min(3, w / 75));
  if (lite) {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="block h-auto w-full" aria-hidden="true">
        {children}
      </svg>
    );
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="block h-auto w-full overflow-visible" aria-hidden="true">
      <defs>
        <filter id={id} x="-8%" y="-8%" width="116%" height="120%" colorInterpolationFilters="sRGB">
          {/* só as partes "sólidas" ganham contorno (brilhos e luzes transparentes ficam de fora) */}
          <feComponentTransfer in="SourceAlpha" result="solid">
            <feFuncA type="discrete" tableValues="0 0 1 1" />
          </feComponentTransfer>
          {/* luz na borda de cima */}
          <feOffset in="solid" dy={r * 1.4} result="down" />
          <feComposite in="solid" in2="down" operator="out" result="topRim" />
          <feFlood floodColor="#FFFFFF" floodOpacity="0.42" />
          <feComposite in2="topRim" operator="in" result="light" />
          {/* sombra na borda de baixo */}
          <feOffset in="solid" dy={-r * 1.8} result="up" />
          <feComposite in="solid" in2="up" operator="out" result="botRim" />
          <feFlood floodColor="#2B1A14" floodOpacity="0.2" />
          <feComposite in2="botRim" operator="in" result="dark" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="light" />
            <feMergeNode in="dark" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${id})`}>{children}</g>
    </svg>
  );
}

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

/** Coraçãozinho, estrela e brilho (usados em várias peças). */
const heart = (x: number, y: number, s: number) => {
  const k = s / 12;
  return `M${x} ${y + 9 * k} C${x - 14 * k} ${y - 1 * k} ${x - 9 * k} ${y - 11 * k} ${x} ${y - 4 * k} C${x + 9 * k} ${y - 11 * k} ${x + 14 * k} ${y - 1 * k} ${x} ${y + 9 * k} Z`;
};
const starD = (x: number, y: number, r: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
};
const sparkleD = (x: number, y: number, r: number) => `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`;

export function Kit({ id, c1 = '#FF9FC2', c2 = '#FFFFFF' }: { id: string; c1?: string; c2?: string }) {
  switch (id) {
    // ---------------- Quarto ----------------
    case 'k-cama':
      return (
        <S w={200} h={150}>
          {/* cabeceira de madeira arredondada */}
          <rect x="18" y="14" width="164" height="96" rx="26" fill={WOOD} />
          <rect x="30" y="26" width="140" height="72" rx="18" fill={lt(WOOD, 0.22)} />
          {/* colchão e travesseiro */}
          <rect x="8" y="84" width="184" height="30" rx="12" fill="#FFFFFF" />
          <rect x="30" y="62" width="70" height="32" rx="15" fill="#FFFFFF" />
          <path d="M50 76 q10 -7 20 0" stroke="#E9E4DC" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* coberta */}
          <rect x="8" y="94" width="184" height="36" rx="14" fill={c1} />
          <rect x="8" y="94" width="184" height="11" rx="5.5" fill={lt(c1, 0.32)} />
          <rect x="12" y="126" width="176" height="9" rx="4.5" fill={dk(WOOD, 0.08)} />
          <rect x="18" y="132" width="12" height="14" rx="4" fill={dk(WOOD, 0.18)} />
          <rect x="170" y="132" width="12" height="14" rx="4" fill={dk(WOOD, 0.18)} />
        </S>
      );

    case 'k-criado':
      return (
        <S w={80} h={130}>
          <ellipse cx="40" cy="24" rx="30" ry="16" fill="#FFF3B0" opacity="0.35" />
          <path d="M22 38 L28 10 H52 L58 38 Z" fill={c2} />
          <rect x="37" y="38" width="6" height="14" rx="2" fill={dk(c2, 0.3)} />
          <ellipse cx="40" cy="54" rx="12" ry="4" fill={dk(c2, 0.3)} />
          <rect x="6" y="58" width="68" height="58" rx="12" fill={c1} />
          <rect x="6" y="58" width="68" height="11" rx="5.5" fill={lt(c1, 0.28)} />
          <rect x="14" y="78" width="52" height="28" rx="8" fill={dk(c1, 0.07)} />
          <circle cx="40" cy="92" r="3.6" fill={lt(c1, 0.55)} />
          <rect x="14" y="114" width="9" height="13" rx="3" fill={dk(c1, 0.22)} />
          <rect x="57" y="114" width="9" height="13" rx="3" fill={dk(c1, 0.22)} />
        </S>
      );

    case 'k-guarda-roupa':
      return (
        <S w={110} h={200}>
          <rect x="6" y="8" width="98" height="176" rx="16" fill={c1} />
          <rect x="6" y="8" width="98" height="16" rx="8" fill={lt(c1, 0.28)} />
          <rect x="14" y="30" width="38" height="144" rx="10" fill={dk(c1, 0.06)} />
          <rect x="58" y="30" width="38" height="144" rx="10" fill={dk(c1, 0.06)} />
          <rect x="44" y="92" width="4" height="22" rx="2" fill={lt(c1, 0.6)} />
          <rect x="62" y="92" width="4" height="22" rx="2" fill={lt(c1, 0.6)} />
          <rect x="16" y="182" width="12" height="14" rx="4" fill={dk(c1, 0.22)} />
          <rect x="82" y="182" width="12" height="14" rx="4" fill={dk(c1, 0.22)} />
        </S>
      );

    case 'k-comoda':
      return (
        <S w={160} h={130}>
          {/* plantinha em cima */}
          <path d="M120 30 Q108 18 112 4 Q122 14 124 28Z" fill="#6CB884" />
          <path d="M124 30 Q132 14 146 12 Q140 26 128 32Z" fill="#5AA673" />
          <rect x="114" y="28" width="22" height="16" rx="5" fill="#D9895E" />
          <rect x="34" y="26" width="26" height="18" rx="4" fill={lt(c2, 0.2)} />
          <rect x="38" y="30" width="18" height="10" rx="2" fill="#BFE0F5" />
          {/* corpo e gavetas */}
          <rect x="6" y="44" width="148" height="72" rx="14" fill={c1} />
          <rect x="6" y="44" width="148" height="11" rx="5.5" fill={lt(c1, 0.28)} />
          {[60, 84].map((y) => (
            <g key={y}>
              <rect x="16" y={y} width="128" height="20" rx="7" fill={dk(c1, 0.06)} />
              <rect x="70" y={y + 8} width="20" height="4.5" rx="2.2" fill={lt(c1, 0.6)} />
            </g>
          ))}
          <rect x="16" y="114" width="10" height="13" rx="3" fill={dk(c1, 0.22)} />
          <rect x="134" y="114" width="10" height="13" rx="3" fill={dk(c1, 0.22)} />
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

    case 'k-banheira':
      // banheira de madeira (ofurô) com água e uma frutinha boiando
      return (
        <S w={170} h={110}>
          <ellipse cx="85" cy="22" rx="80" ry="18" fill={dk(c1, 0.35)} />
          <path d="M6 22 Q10 96 30 102 Q85 112 140 102 Q160 96 164 22 Z" fill={c1} />
          {[34, 60, 85, 110, 136].map((x) => (
            <path key={x} d={`M${x} 34 Q${x + (x - 85) * 0.04} 70 ${x + (x - 85) * 0.08} 104`} stroke={dk(c1, 0.12)} strokeWidth="2.4" fill="none" />
          ))}
          <path d="M9 48 Q85 64 161 48" stroke={c2} strokeWidth="7" fill="none" />
          <path d="M13 82 Q85 98 157 82" stroke={c2} strokeWidth="7" fill="none" />
          <path d="M9 48 Q85 64 161 48" stroke="#fff" strokeOpacity="0.35" strokeWidth="2" fill="none" />
          <ellipse cx="85" cy="22" rx="74" ry="14" fill={lt(c1, 0.15)} />
          <ellipse cx="85" cy="24" rx="66" ry="10" fill="#8FD4F2" />
          <ellipse cx="70" cy="22" rx="30" ry="4" fill="#fff" opacity="0.35" />
          <circle cx="120" cy="22" r="6" fill="#FFA43A" />
          <path d="M120 16 q2 -4 6 -4" stroke="#5DBB6E" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </S>
      );
    case 'k-cadeira':
      return (
        <S w={90} h={130}>
          <rect x="16" y="6" width="58" height="54" rx="10" fill={c1} />
          <rect x="24" y="14" width="42" height="10" rx="5" fill={lt(c1, 0.25)} />
          <rect x="8" y="58" width="74" height="16" rx="6" fill={lt(c1, 0.12)} />
          <rect x="8" y="70" width="74" height="8" rx="3" fill={dk(c1, 0.15)} />
          <rect x="14" y="76" width="9" height="50" rx="3" fill={dk(c1, 0.2)} />
          <rect x="67" y="76" width="9" height="50" rx="3" fill={dk(c1, 0.2)} />
          <rect x="18" y="100" width="54" height="6" rx="3" fill={dk(c1, 0.12)} />
        </S>
      );
    case 'k-banquinho':
      return (
        <S w={90} h={70}>
          <ellipse cx="45" cy="16" rx="40" ry="12" fill={lt(c1, 0.15)} />
          <rect x="5" y="14" width="80" height="12" rx="6" fill={c1} />
          <rect x="14" y="26" width="9" height="40" rx="3" fill={dk(c1, 0.22)} />
          <rect x="67" y="26" width="9" height="40" rx="3" fill={dk(c1, 0.22)} />
          <rect x="40" y="26" width="9" height="34" rx="3" fill={dk(c1, 0.3)} />
        </S>
      );

    // ---------------- Sala ----------------
    case 'k-sofa':
      return (
        <S w={200} h={120}>
          <rect x="22" y="12" width="156" height="62" rx="24" fill={dk(c1, 0.04)} />
          <rect x="44" y="30" width="44" height="34" rx="12" fill={c2} transform="rotate(-6 66 47)" />
          <rect x="22" y="62" width="156" height="30" rx="12" fill={lt(c1, 0.2)} />
          <rect x="99" y="66" width="2" height="22" rx="1" fill={dk(c1, 0.08)} />
          <rect x="4" y="38" width="32" height="64" rx="16" fill={c1} />
          <rect x="164" y="38" width="32" height="64" rx="16" fill={c1} />
          <rect x="18" y="90" width="164" height="12" rx="6" fill={dk(c1, 0.12)} />
          <rect x="22" y="100" width="10" height="14" rx="3" fill={WOOD} />
          <rect x="168" y="100" width="10" height="14" rx="3" fill={WOOD} />
        </S>
      );

    case 'k-poltrona':
      return (
        <S w={120} h={130}>
          <path d="M20 74 V34 Q20 8 60 8 Q100 8 100 34 V74 Z" fill={dk(c1, 0.04)} />
          <rect x="44" y="40" width="32" height="24" rx="9" fill={c2} />
          <rect x="22" y="66" width="76" height="26" rx="11" fill={lt(c1, 0.2)} />
          <rect x="4" y="46" width="26" height="60" rx="13" fill={c1} />
          <rect x="90" y="46" width="26" height="60" rx="13" fill={c1} />
          <rect x="18" y="90" width="84" height="14" rx="6" fill={dk(c1, 0.12)} />
          <rect x="22" y="102" width="9" height="22" rx="3" fill={WOOD} />
          <rect x="89" y="102" width="9" height="22" rx="3" fill={WOOD} />
        </S>
      );

    case 'k-mesa-centro':
      return (
        <S w={150} h={80}>
          <rect x="56" y="4" width="18" height="16" rx="5" fill="#FFFFFF" />
          <path d="M74 8 q8 2 0 9" stroke="#FFFFFF" strokeWidth="3" fill="none" />
          <rect x="88" y="12" width="30" height="7" rx="2.5" fill={c2} />
          <ellipse cx="75" cy="24" rx="72" ry="10" fill={lt(c1, 0.15)} />
          <rect x="3" y="22" width="144" height="12" rx="6" fill={c1} />
          <rect x="18" y="34" width="10" height="40" rx="4" fill={dk(c1, 0.2)} />
          <rect x="122" y="34" width="10" height="40" rx="4" fill={dk(c1, 0.2)} />
        </S>
      );

    case 'k-estante':
      return (
        <S w={120} h={180}>
          <rect x="6" y="6" width="108" height="164" rx="12" fill={c1} />
          <rect x="16" y="16" width="88" height="144" rx="6" fill={dk(c1, 0.12)} />
          {[56, 104].map((y) => (
            <rect key={y} x="16" y={y} width="88" height="7" fill={c1} />
          ))}
          {/* livros simples e uma plantinha */}
          {[
            [22, '#E9A0A8'],
            [32, '#9CC8E8'],
            [42, '#F2D27A'],
            [52, '#A8D8B0'],
          ].map(([x, c]) => (
            <rect key={x as number} x={x as number} y="26" width="9" height="30" rx="2" fill={c as string} />
          ))}
          <rect x="74" y="40" width="20" height="16" rx="5" fill="#D9895E" />
          <path d="M84 40 Q74 30 76 20 Q84 28 86 38Z M84 40 Q92 28 100 26 Q96 36 86 40Z" fill="#6CB884" />
          {[
            [24, '#B9A8E8'],
            [36, '#F4B183'],
          ].map(([x, c]) => (
            <rect key={x as number} x={x as number} y="72" width="10" height="32" rx="2" fill={c as string} />
          ))}
          <rect x="58" y="88" width="36" height="16" rx="4" fill="#F7F1E8" />
          <rect x="24" y="128" width="30" height="26" rx="6" fill="#F7F1E8" />
          <rect x="62" y="134" width="32" height="20" rx="6" fill={lt(c1, 0.3)} />
          <rect x="12" y="168" width="10" height="10" rx="3" fill={dk(c1, 0.25)} />
          <rect x="98" y="168" width="10" height="10" rx="3" fill={dk(c1, 0.25)} />
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
          {[36, 85, 134].map((x) => (
            <rect key={x} x={x - 6} y="101" width="12" height="4" rx="2" fill={GOLD} />
          ))}
          <Plant x={154} y={80} s={0.7} pot={c2} />
          <Legs xs={[12, 151]} y={117} h={10} c={dk(c1, 0.35)} />
        </S>
      );
    case 'k-luminaria':
      return (
        <S w={60} h={180}>
          <ellipse cx="30" cy="40" rx="30" ry="24" fill="#FFF3B0" opacity="0.3" />
          <path d="M8 46 Q8 10 30 10 Q52 10 52 46 Z" fill={c1} />
          <rect x="8" y="40" width="44" height="7" rx="3.5" fill={dk(c1, 0.1)} />
          <rect x="28" y="46" width="4" height="118" rx="2" fill="#6E6170" />
          <ellipse cx="30" cy="168" rx="18" ry="6" fill="#6E6170" />
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
          {[30, 98].map((x) => (
            <ellipse key={x} cx={x} cy="42" rx="12" ry="3" fill="#3A3A48" />
          ))}
          <rect x="8" y="46" width="114" height="84" rx="6" fill={c1} />
          <rect x="16" y="52" width="98" height="10" rx="3" fill={lt(c1, 0.25)} />
          {[30, 52, 74, 96].map((x) => (
            <circle key={x} cx={x} cy="57" r="3.5" fill={dk(c1, 0.25)} />
          ))}
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
              {Array.from({ length: 12 }, (_, i) => (
                <path key={i} d={`M${x - 6} ${62 + i * 10} L${x + 6} ${58 + i * 10}`} stroke="#C9A06A" strokeWidth="2" />
              ))}
            </g>
          ))}
          {/* plataformas */}
          <rect x="48" y="52" width="80" height="10" rx="5" fill={c1} />
          <rect x="4" y="104" width="76" height="10" rx="5" fill={c1} />
          <rect x="52" y="146" width="76" height="10" rx="5" fill={c1} />
          <rect x="2" y="186" width="126" height="10" rx="5" fill={dk(c1, 0.12)} />
          {/* escadinha */}
          <path d="M78 156 L96 114 M88 158 L106 116" stroke={WOOD} strokeWidth="3" />
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${82 + i * 4.5} ${148 - i * 10} H${92 + i * 4.5}`} stroke={WOOD} strokeWidth="3" />
          ))}
          {/* bolinha pendurada */}
          <path d="M30 114 V134" stroke="#8A6A4F" strokeWidth="1.5" />
          <circle cx="30" cy="138" r="7" fill={c2} />
          <path d="M26 135 q4 4 8 0" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
        </S>
      );
    case 'k-casinha':
      return (
        <S w={130} h={120}>
          <path d="M6 54 L65 8 L124 54 Q124 60 118 60 H12 Q6 60 6 54Z" fill={c1} />
          <rect x="16" y="52" width="98" height="64" rx="10" fill={c2} />
          <path d="M44 116 V90 Q44 72 65 72 Q86 72 86 90 V116Z" fill={dk(c2, 0.45)} />
          <circle cx="98" cy="74" r="7" fill="#BFE0F5" />
          <rect x="16" y="52" width="98" height="8" fill={dk(c2, 0.08)} />
        </S>
      );

    case 'k-rodinha':
      return (
        <S w={120} h={130}>
          <rect x="54" y="66" width="12" height="54" rx="4" fill={dk(c2, 0.35)} />
          <rect x="24" y="116" width="72" height="10" rx="5" fill={dk(c2, 0.35)} />
          <circle cx="60" cy="58" r="52" fill={c1} />
          <circle cx="60" cy="58" r="42" fill={lt(c1, 0.45)} />
          {[0, 45, 90, 135].map((a) => (
            <rect key={a} x="58" y="18" width="4" height="80" rx="2" fill={lt(c1, 0.15)} transform={`rotate(${a} 60 58)`} />
          ))}
          <circle cx="60" cy="58" r="8" fill={c1} />
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
          <ellipse cx="65" cy="42" rx="62" ry="26" fill={c1} />
          <ellipse cx="65" cy="36" rx="48" ry="16" fill={lt(c1, 0.35)} />
          <ellipse cx="65" cy="40" rx="40" ry="11" fill={c2} />
        </S>
      );

    // ---------------- Parede ----------------

    case 'k-relogio':
      return (
        <S w={70} h={140}>
          <path d="M6 44 L35 10 L64 44 Z" fill={dk(WOOD, 0.1)} />
          <rect x="10" y="40" width="50" height="58" rx="10" fill={WOOD} />
          <circle cx="35" cy="66" r="18" fill="#FFF8EE" />
          <path d="M35 66 V54 M35 66 L44 70" stroke="#5A4036" strokeWidth="3" strokeLinecap="round" />
          <circle cx="35" cy="66" r="2.5" fill="#5A4036" />
          <rect x="33" y="98" width="4" height="26" rx="2" fill={GOLD} />
          <circle cx="35" cy="126" r="7" fill={GOLD} />
        </S>
      );

    case 'k-prateleira':
      return (
        <S w={160} h={80}>
          <Plant x={22} y={58} s={0.75} pot={c2} />
          <Books x={44} y={60} n={5} seed={2} h={24} />
          <rect x="94" y="36" width="22" height="24" rx="6" fill="#BFE3FF" opacity="0.85" />
          <rect x="96" y="32" width="18" height="6" rx="2" fill={c1} />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={100 + i * 5} cy={50 - (i % 2) * 4} r="3" fill={['#FF8FB4', '#FFD34D', '#7CC39A'][i]} />
          ))}
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
          {[
            [24, 1],
            [40, 0],
            [56, 1],
            [32, 2],
            [50, 2],
          ].map(([x, k], i) => (
            <g key={i}>
              <path d={`M${x} 70 C${x - 8} ${100 + k * 10} ${x + 6} ${120 + k * 12} ${x - 2} ${150 + k * 6}`} stroke="#5FAE84" strokeWidth="2.5" fill="none" />
              {[0, 1, 2, 3].map((j) => (
                <ellipse
                  key={j}
                  cx={x - 2 + (j % 2 ? 5 : -5)}
                  cy={86 + j * 16 + k * 6}
                  rx="6"
                  ry="4"
                  fill={j % 2 ? '#7CC39A' : '#4F9A63'}
                  transform={`rotate(${j % 2 ? 30 : -30} ${x - 2 + (j % 2 ? 5 : -5)} ${86 + j * 16 + k * 6})`}
                />
              ))}
            </g>
          ))}
          {[30, 46].map((x) => (
            <ellipse key={x} cx={x} cy="62" rx="10" ry="6" fill="#5FAE84" />
          ))}
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
          <path d="M50 120 Q16 100 8 46 Q34 64 48 112Z" fill="#5AA673" />
          <path d="M50 120 Q84 100 94 50 Q66 66 52 112Z" fill="#5AA673" />
          <path d="M50 120 Q30 70 46 8 Q66 60 52 118Z" fill="#6CB884" />
          <path d="M50 120 Q70 84 84 22 Q90 70 54 120Z" fill="#7CC593" opacity="0.9" />
          <path d="M50 120 Q28 92 20 30 Q42 60 50 116Z" fill="#7CC593" opacity="0.9" />
          <path d="M18 120 H82 L74 172 Q73 178 66 178 H34 Q27 178 26 172 Z" fill={c1} />
          <rect x="14" y="114" width="72" height="14" rx="6" fill={dk(c1, 0.1)} />
        </S>
      );

    case 'k-vaso-flores':
      return (
        <S w={70} h={100}>
          {[
            [20, '#FF8FB4'],
            [35, c2],
            [50, '#FFD34D'],
            [28, '#FF6F91'],
            [44, '#FF8FB4'],
          ].map(([x, c], i) => (
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
          <ellipse cx="120" cy="35" rx="118" ry="33" fill={c1} />
          <ellipse cx="120" cy="35" rx="96" ry="24" fill={lt(c1, 0.3)} />
          <ellipse cx="120" cy="35" rx="106" ry="28.5" fill="none" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="2.4" strokeDasharray="2 9" strokeLinecap="round" />
        </S>
      );

    case 'k-tapete-retangulo':
      return (
        <S w={260} h={80}>
          <path d="M40 8 H220 L252 70 H8 Z" fill={c1} />
          <path d="M52 16 H208 L234 62 H26 Z" fill={c2} />
          <path d="M70 26 H190 L206 52 H54 Z" fill={lt(c1, 0.25)} />
          <path d="M130 28 L150 39 L130 50 L110 39 Z" fill={c1} />
          {Array.from({ length: 22 }, (_, i) => (
            <path key={i} d={`M${12 + i * 11} 70 v8`} stroke={lt(c2, 0.2)} strokeWidth="2.5" strokeLinecap="round" />
          ))}
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
          <circle cx="24" cy="18" r="12" fill={c1} />
          <circle cx="66" cy="18" r="12" fill={c1} />
          <circle cx="24" cy="18" r="6" fill={lt(c1, 0.35)} />
          <circle cx="66" cy="18" r="6" fill={lt(c1, 0.35)} />
          <ellipse cx="45" cy="74" rx="32" ry="24" fill={c1} />
          <circle cx="45" cy="38" r="28" fill={c1} />
          <ellipse cx="45" cy="46" rx="12" ry="9" fill={lt(c1, 0.4)} />
          <circle cx="36" cy="34" r="3" fill="#3A2620" />
          <circle cx="54" cy="34" r="3" fill="#3A2620" />
          <ellipse cx="45" cy="43" rx="3.6" ry="2.6" fill="#3A2620" />
          <ellipse cx="20" cy="92" rx="11" ry="7" fill={dk(c1, 0.08)} />
          <ellipse cx="70" cy="92" rx="11" ry="7" fill={dk(c1, 0.08)} />
          <ellipse cx="45" cy="78" rx="14" ry="11" fill={lt(c1, 0.3)} />
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
          {[48, 58, 68].map((y) => (
            <path key={y} d={`M${8 + (y - 38) * 0.2} ${y} H${92 - (y - 38) * 0.2}`} stroke="#B8854A" strokeWidth="2.5" />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d={`M${16 + i * 10} 40 L${20 + i * 8.5} 78`} stroke="#C9965A" strokeWidth="2" />
          ))}
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
          {[16, 28, 52, 64].map((x) => (
            <path key={x} d={`M40 22 L${x} ${x < 40 ? 16 : 28}`} stroke={lt(c1, 0.05)} strokeWidth="1.5" />
          ))}
          <path d="M10 40 H70" stroke={c2} strokeWidth="4" opacity="0.7" />
        </S>
      );
    // ---------------- Coleção Plus ----------------
    case 'k-cama-dossel':
      return (
        <S w={200} h={210}>
          {/* colunas e dossel com luzinhas */}
          <rect x="12" y="14" width="9" height="186" rx="4" fill={dk(c2, 0.1)} />
          <rect x="179" y="14" width="9" height="186" rx="4" fill={dk(c2, 0.1)} />
          <rect x="6" y="8" width="188" height="12" rx="6" fill={dk(c2, 0.05)} />
          <path d={`M8 18 H192 V30 ${Array.from({ length: 9 }, (_, i) => `Q${181 - i * 20} 42 ${171 - i * 20} 30`).join(' ')} Q14 42 8 30 Z`} fill={c1} />
          {Array.from({ length: 12 }, (_, i) => (
            <circle key={i} cx={16 + i * 15.5} cy={36 + (i % 2) * 4} r="2.6" fill="#FFE27A" className="bulb" style={{ animationDelay: `${(i % 4) * 0.3}s` }} />
          ))}
          <path d="M14 30 Q8 90 34 132 Q28 90 30 32 Z" fill={lt(c1, 0.35)} opacity="0.92" />
          <path d="M186 30 Q192 90 166 132 Q172 90 170 32 Z" fill={lt(c1, 0.35)} opacity="0.92" />
          <ellipse cx="30" cy="104" rx="7" ry="4" fill={c1} />
          <ellipse cx="170" cy="104" rx="7" ry="4" fill={c1} />
          <g transform="translate(0 58)">
            <path d="M24 78 V38 Q24 18 46 18 H154 Q176 18 176 38 V78 Z" fill={c2} />
            {[64, 100, 136].map((x) => (
              <circle key={x} cx={x} cy="44" r="2.6" fill={dk(c2, 0.18)} />
            ))}
            <path d="M26 74 H174 L188 104 H12 Z" fill="#FFFFFF" />
            <rect x="40" y="58" width="52" height="26" rx="12" fill="#FFFFFF" stroke="#EEE" strokeWidth="2" />
            <rect x="108" y="58" width="52" height="26" rx="12" fill="#FFFFFF" stroke="#EEE" strokeWidth="2" />
            <path d={heart(66, 71, 7)} fill={c1} />
            <path d={heart(134, 71, 7)} fill={c1} />
            <path d="M18 88 H182 L194 116 H6 Z" fill={c1} />
            <path d="M22 86 H178 L182 96 H18 Z" fill={lt(c1, 0.45)} />
            {[40, 80, 120, 160].map((x) => (
              <path key={x} d={sparkleD(x, 106, 4)} fill="#FFFFFF" opacity="0.8" />
            ))}
            <rect x="4" y="116" width="192" height="18" rx="6" fill={dk(c1, 0.12)} />
            <rect x="4" y="132" width="192" height="8" rx="4" fill={dk(c2, 0.1)} />
          </g>
        </S>
      );
    case 'k-castelinho':
      return (
        <S w={150} h={180}>
          {[
            [22, 40],
            [128, 40],
          ].map(([x, y]) => (
            <g key={x}>
              <rect x={x - 16} y={y + 18} width="32" height={150 - y} fill={lt(c2, 0.1)} />
              <path d={`M${x - 20} ${y + 20} L${x} ${y - 26} L${x + 20} ${y + 20} Z`} fill={c1} />
              <path d={`M${x} ${y - 26} V${y - 44}`} stroke="#8A6A4F" strokeWidth="2" />
              <path d={`M${x} ${y - 44} l14 5 -14 5 Z`} fill={dk(c1, 0.1)} />
              <path d={`M${x - 6} ${y + 50} V${y + 40} Q${x} ${y + 32} ${x + 6} ${y + 40} V${y + 50} Z`} fill="#4A3B5A" />
            </g>
          ))}
          <rect x="34" y="70" width="82" height="100" fill={c2} />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={34 + i * 18} y="60" width="10" height="12" fill={c2} />
          ))}
          {[86, 102, 118, 134, 150].map((y) => (
            <path key={y} d={`M34 ${y} H116`} stroke={dk(c2, 0.08)} strokeWidth="1.5" />
          ))}
          <path d="M58 170 V132 Q75 112 92 132 V170 Z" fill="#6A4229" />
          <circle cx="75" cy="94" r="10" fill="#FFF3B0" stroke={dk(c2, 0.15)} strokeWidth="3" />
          <path d={heart(75, 96, 7)} fill={c1} />
          <rect x="2" y="168" width="146" height="8" rx="4" fill={dk(c2, 0.2)} />
        </S>
      );
    case 'k-balanco':
      return (
        <S w={140} h={170}>
          <path d="M14 168 L40 8 L66 168 M74 168 L100 8 L126 168" stroke={WOOD} strokeWidth="8" strokeLinecap="round" fill="none" />
          <rect x="30" y="4" width="80" height="10" rx="5" fill={dk(WOOD, 0.1)} />
          <path d="M50 12 V118 M90 12 V118" stroke="#C9A06A" strokeWidth="2.5" />
          {[30, 60, 90].map((y) => (
            <circle key={y} cx="50" cy={y} r="4" fill={['#FF8FB4', '#FFD34D', '#7CC39A'][y / 30 - 1]} />
          ))}
          {[45, 75].map((y) => (
            <circle key={y} cx="90" cy={y} r="4" fill={['#FFD34D', '#FF8FB4'][(y - 45) / 30]} />
          ))}
          <rect x="40" y="116" width="60" height="10" rx="4" fill={WOOD} />
          <rect x="44" y="106" width="52" height="12" rx="6" fill={c1} />
          <path d={heart(70, 113, 5)} fill={c2} />
        </S>
      );
    case 'k-escorregador':
      return (
        <S w={160} h={130}>
          <path d="M18 126 V20 M48 126 V20" stroke={c2} strokeWidth="6" strokeLinecap="round" />
          {[36, 58, 80, 102].map((y) => (
            <path key={y} d={`M18 ${y} H48`} stroke={c2} strokeWidth="5" strokeLinecap="round" />
          ))}
          <rect x="10" y="14" width="46" height="10" rx="5" fill={dk(c2, 0.1)} />
          <path d="M50 20 Q90 24 110 80 Q122 112 156 118 L156 128 Q112 126 98 86 Q82 36 50 32 Z" fill={c1} />
          <path d="M54 24 Q88 30 104 78" stroke={lt(c1, 0.45)} strokeWidth="4" fill="none" strokeLinecap="round" />
        </S>
      );
    case 'k-poltrona-ovo':
      return (
        <S w={120} h={180}>
          <path d="M100 172 V20 Q100 6 86 6 H60" stroke="#B8BFCC" strokeWidth="6" fill="none" strokeLinecap="round" />
          <ellipse cx="100" cy="174" rx="18" ry="5" fill="#9AA2B4" />
          <path d="M60 6 V30" stroke="#8A90A0" strokeWidth="3" />
          <ellipse cx="54" cy="96" rx="46" ry="62" fill="#D9A766" />
          {Array.from({ length: 7 }, (_, i) => (
            <path key={i} d={`M${16 + i * 13} 52 Q54 ${96 + (i - 3) * 4} ${16 + i * 13} 146`} stroke="#B8854A" strokeWidth="1.5" fill="none" opacity="0.7" />
          ))}
          <ellipse cx="54" cy="104" rx="34" ry="44" fill={dk('#D9A766', 0.25)} />
          <ellipse cx="54" cy="122" rx="32" ry="20" fill={c1} />
          <ellipse cx="44" cy="96" rx="14" ry="12" fill={c2} />
          <ellipse cx="66" cy="98" rx="12" ry="10" fill={lt(c1, 0.3)} />
          <path d="M54 34 V40" stroke="#8A90A0" strokeWidth="3" />
        </S>
      );
    case 'k-tenda':
      return (
        <S w={150} h={160}>
          <path d="M60 4 L74 24 M90 4 L76 24" stroke={WOOD} strokeWidth="4" strokeLinecap="round" />
          <path d="M75 20 L8 154 H142 Z" fill={c1} />
          {[0.35, 0.6, 0.85].map((t) => (
            <path key={t} d={`M${75 - 67 * t} ${20 + 134 * t} H${75 + 67 * t}`} stroke={c2} strokeWidth="5" />
          ))}
          <path d="M75 52 L44 154 H106 Z" fill="#4A3B5A" />
          <path d="M75 52 L40 154 L30 154 Q48 110 75 52 Z" fill={lt(c1, 0.2)} />
          <path d="M75 52 L110 154 L120 154 Q102 110 75 52 Z" fill={lt(c1, 0.2)} />
          <ellipse cx="75" cy="146" rx="24" ry="7" fill={c2} />
          {Array.from({ length: 8 }, (_, i) => (
            <circle key={i} cx={58 + i * 5} cy={70 + Math.abs(i - 3.5) * 3} r="2" fill="#FFE27A" className="bulb" style={{ animationDelay: `${(i % 4) * 0.3}s` }} />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M${32 + i * 22} 104 l9 0 -4.5 10 Z`} fill={['#FF8FB4', '#FFD34D', '#7FB8F0', '#7CC39A', '#B399F0'][i]} />
          ))}
        </S>
      );
    case 'k-sofa-nuvem':
      return (
        <S w={200} h={120}>
          {[
            [34, 46, 26],
            [70, 34, 30],
            [110, 30, 32],
            [150, 36, 30],
            [176, 52, 22],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill={c1} />
          ))}
          {[
            [60, 30, 10],
            [104, 22, 12],
            [146, 28, 10],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#FFFFFF" opacity="0.45" />
          ))}
          <rect x="10" y="56" width="180" height="40" rx="20" fill={lt(c1, 0.2)} />
          <circle cx="20" cy="70" r="20" fill={c1} />
          <circle cx="180" cy="70" r="20" fill={c1} />
          <rect x="10" y="84" width="180" height="20" rx="10" fill={dk(c1, 0.06)} />
          <path d={starD(70, 58, 12)} fill={c2} />
          <path d={heart(130, 60, 11)} fill={c2} />
          <Legs xs={[30, 163]} y={102} h={12} c="#C9CED8" />
        </S>
      );
    case 'k-mesa-cha':
      return (
        <S w={180} h={130}>
          {/* bolo, bule e xícaras */}
          <rect x="74" y="20" width="32" height="20" rx="4" fill="#FFE3EC" />
          <rect x="74" y="20" width="32" height="7" rx="3" fill={c1} />
          <rect x="88" y="10" width="3" height="10" fill="#7FB8F0" />
          <path d="M89.5 6 q2 2 0 4 q-2 -2 0 -4 Z" fill="#FFB347" />
          <rect x="70" y="40" width="40" height="4" rx="2" fill="#FFFFFF" />
          <path d="M28 44 Q28 26 44 26 Q60 26 60 44 Z" fill={c2} />
          <path d="M60 32 q10 2 10 10" stroke={c2} strokeWidth="4" fill="none" />
          <path d="M28 34 q-8 -6 -12 2" stroke={c2} strokeWidth="4" fill="none" />
          <circle cx="44" cy="24" r="3" fill={dk(c2, 0.2)} />
          {[130, 150].map((x) => (
            <g key={x}>
              <path d={`M${x - 8} 36 H${x + 8} Q${x + 7} 46 ${x} 46 Q${x - 7} 46 ${x - 8} 36 Z`} fill="#FFFFFF" />
              <ellipse cx={x} cy="47" rx="9" ry="2" fill="#E8E2F0" />
            </g>
          ))}
          <ellipse cx="90" cy="48" rx="80" ry="12" fill="#FFFFFF" />
          <path d={`M10 48 Q10 82 22 88 ${Array.from({ length: 8 }, (_, i) => `Q${30 + i * 19} 80 ${40 + i * 19} 88`).join(' ')} Q170 82 170 48 Z`} fill={c1} />
          <path d="M10 48 Q90 70 170 48" stroke={lt(c1, 0.4)} strokeWidth="3" fill="none" />
          <rect x="84" y="86" width="12" height="32" fill={dk(WOOD)} />
          <ellipse cx="90" cy="120" rx="30" ry="6" fill={dk(WOOD, 0.3)} />
        </S>
      );
    case 'k-piano':
      return (
        <S w={200} h={160}>
          <path d="M30 40 L120 4 L130 12 L50 50 Z" fill={dk(c1, 0.1)} />
          <path d="M20 54 Q20 28 60 28 H130 Q190 28 190 70 V96 H20 Z" fill={c1} />
          <path d="M20 54 Q20 40 50 40" stroke={lt(c1, 0.5)} strokeWidth="3" fill="none" />
          <rect x="16" y="94" width="120" height="20" rx="3" fill="#FFFFFF" />
          {Array.from({ length: 14 }, (_, i) => (
            <path key={i} d={`M${24 + i * 8} 94 V114`} stroke="#D6DBE3" strokeWidth="1" />
          ))}
          {[0, 1, 3, 4, 5, 7, 8, 10, 11, 12].map((i) => (
            <rect key={i} x={29 + i * 8} y="94" width="5" height="12" fill="#2B2224" />
          ))}
          <rect x="16" y="112" width="174" height="10" rx="3" fill={dk(c1, 0.15)} />
          <Legs xs={[24, 120, 178]} y={120} h={36} c={dk(c1, 0.3)} />
          <rect x="40" y="132" width="70" height="10" rx="4" fill={c2} />
          <Legs xs={[46, 98]} y={140} h={16} c={dk(c1, 0.3)} />
          {[
            [150, 20],
            [168, 8],
          ].map(([x, y], i) => (
            <path key={i} d={`M${x} ${y} v12 a4 3 0 1 1 -3 -3`} stroke={dk(c1, 0.5)} strokeWidth="2" fill="none" />
          ))}
        </S>
      );
    case 'k-aquario':
      return (
        <S w={130} h={160}>
          <rect x="6" y="4" width="118" height="80" rx="8" fill="#BFE9F5" opacity="0.9" />
          <rect x="6" y="4" width="118" height="12" rx="6" fill="#DDF4FB" />
          <path d="M6 68 Q36 60 66 68 T124 66 V84 H6 Z" fill="#F2DDA8" />
          {[22, 40, 96, 110].map((x, i) => (
            <path key={x} d={`M${x} 72 Q${x - 6} ${52 - i * 2} ${x + 2} ${34 + i * 4}`} stroke="#5FAE84" strokeWidth="3" fill="none" />
          ))}
          {[
            [60, 36, '#FF9A4D'],
            [86, 54, c2],
          ].map(([x, y, col], i) => (
            <g key={i}>
              <ellipse cx={x as number} cy={y as number} rx="9" ry="6" fill={col as string} />
              <path d={`M${(x as number) + 8} ${y} l8 -6 v12 Z`} fill={col as string} />
              <circle cx={(x as number) - 4} cy={(y as number) - 1} r="1.4" fill={INK} />
            </g>
          ))}
          {[
            [48, 26],
            [52, 18],
            [50, 10],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={2 + i * 0.5} fill="none" stroke="#FFFFFF" strokeWidth="1.2" />
          ))}
          <path d="M14 14 L30 30" stroke="#FFFFFF" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
          <rect x="2" y="84" width="126" height="10" rx="4" fill={dk(c1, 0.1)} />
          <rect x="8" y="92" width="114" height="56" rx="4" fill={c1} />
          <rect x="16" y="100" width="46" height="40" rx="3" fill={lt(c1, 0.2)} />
          <rect x="68" y="100" width="46" height="40" rx="3" fill={lt(c1, 0.2)} />
          <Legs xs={[12, 111]} y={146} h={10} c={dk(c1, 0.35)} />
        </S>
      );
    case 'k-neon-coracao':
    case 'k-neon-estrela':
    case 'k-neon-lua': {
      const d = id === 'k-neon-coracao' ? heart(50, 44, 30) : id === 'k-neon-estrela' ? starD(50, 42, 30) : 'M60 12 A30 30 0 1 0 82 62 A24 24 0 1 1 60 12 Z';
      return (
        <S w={100} h={84}>
          <path d={d} fill="none" stroke={c1} strokeWidth="14" opacity="0.18" strokeLinejoin="round" />
          <path d={d} fill="none" stroke={c1} strokeWidth="8" opacity="0.35" strokeLinejoin="round" />
          <path d={d} fill="none" stroke={lt(c1, 0.6)} strokeWidth="3.5" strokeLinejoin="round" className="neon-glow" />
        </S>
      );
    }
    case 'k-varal-luzes':
      return (
        <S w={240} h={60}>
          <path d="M4 8 Q60 34 120 14 Q180 34 236 8" stroke="#5A4A3E" strokeWidth="1.5" fill="none" />
          {Array.from({ length: 13 }, (_, i) => {
            const x = 12 + i * 18;
            const y = i < 7 ? 8 + 22 * Math.sin((x / 120) * Math.PI) * 0.9 : 14 + 18 * Math.sin(((x - 120) / 116) * Math.PI);
            return i % 3 === 1 ? (
              <path key={i} d={starD(x, y + 10, 7)} fill={c2} className="bulb" style={{ animationDelay: `${(i % 4) * 0.3}s` }} />
            ) : (
              <g key={i}>
                <rect x={x - 2} y={y} width="4" height="4" fill="#5A4A3E" />
                <ellipse cx={x} cy={y + 9} rx="4" ry="6" fill={i % 2 ? c1 : '#FFE27A'} className="bulb" style={{ animationDelay: `${(i % 4) * 0.3}s` }} />
              </g>
            );
          })}
        </S>
      );
    case 'k-estante-casinha':
      return (
        <S w={130} h={180}>
          <path d="M65 4 L126 54 V176 H4 V54 Z" fill={c1} />
          <path d="M65 16 L114 56 V168 H16 V56 Z" fill={dk(c1, 0.3)} />
          <path d="M16 96 H114 M16 134 H114 M65 56 V96" stroke={c1} strokeWidth="6" />
          <Plant x={40} y={92} s={0.7} pot={c2} />
          <Books x={72} y={92} n={4} seed={2} h={22} />
          <circle cx="40" cy="118" r="12" fill="#C98A5B" />
          <circle cx="32" cy="108" r="5" fill="#C98A5B" />
          <circle cx="48" cy="108" r="5" fill="#C98A5B" />
          <ellipse cx="40" cy="122" rx="6" ry="4" fill="#F2D2B0" />
          <circle cx="36" cy="115" r="1.6" fill={INK} />
          <circle cx="44" cy="115" r="1.6" fill={INK} />
          <rect x="74" y="108" width="28" height="22" rx="3" fill={c2} />
          <path d={heart(88, 120, 6)} fill="#FFFFFF" />
          <rect x="24" y="146" width="22" height="18" rx="3" fill="#7FB8F0" />
          <circle cx="78" cy="156" r="9" fill="#FF8FB4" />
          <circle cx="98" cy="158" r="7" fill="#FFD34D" />
          <circle cx="65" cy="38" r="9" fill="#FFF3B0" stroke={c1} strokeWidth="3" />
        </S>
      );
    case 'k-arco-flores':
      return (
        <S w={180} h={180}>
          <path d="M24 176 V80 Q24 14 90 14 Q156 14 156 80 V176" stroke="#FFFFFF" strokeWidth="10" fill="none" />
          <path d="M24 176 V80 Q24 14 90 14 Q156 14 156 80 V176" stroke="#5FAE84" strokeWidth="3" fill="none" strokeDasharray="10 8" />
          {Array.from({ length: 16 }, (_, i) => {
            const a = Math.PI - (i / 15) * Math.PI;
            const x = 90 + Math.cos(a) * 66;
            const y = 80 - Math.sin(a) * 66;
            const col = [c1, c2, '#FFFFFF', '#FFD34D'][i % 4];
            return (
              <g key={i}>
                <ellipse cx={x - 7} cy={y + 4} rx="6" ry="3" fill="#7CC39A" transform={`rotate(-30 ${x - 7} ${y + 4})`} />
                {[0, 72, 144, 216, 288].map((r) => (
                  <circle key={r} cx={x + Math.cos((r * Math.PI) / 180) * 4.5} cy={y + Math.sin((r * Math.PI) / 180) * 4.5} r="4" fill={col} />
                ))}
                <circle cx={x} cy={y} r="2.6" fill="#FFD34D" />
              </g>
            );
          })}
          {[100, 130, 160].map((y, i) => [24, 156].map((x) => <circle key={`${x}${y}`} cx={x + (i % 2 ? 6 : -6)} cy={y} r="5" fill={[c1, c2, '#FFFFFF'][i]} />))}
        </S>
      );
    case 'k-tapete-nuvem':
      return (
        <S w={220} h={80}>
          {[
            [50, 40, 34],
            [92, 30, 36],
            [140, 30, 34],
            [178, 42, 30],
            [110, 52, 34],
          ].map(([x, y, r], i) => (
            <ellipse key={i} cx={x} cy={y} rx={r * 1.4} ry={r * 0.6} fill={c1} />
          ))}
          {[
            [92, 34, 26],
            [140, 34, 22],
          ].map(([x, y, r], i) => (
            <ellipse key={i} cx={x} cy={y} rx={r * 1.4} ry={r * 0.5} fill={lt(c1, 0.5)} />
          ))}
          <path d={starD(118, 40, 8)} fill={c2} />
        </S>
      );
    case 'k-tapete-arcoiris':
      return (
        <S w={240} h={90}>
          {['#FF8FA8', '#FFB86B', '#FFE27A', '#9ED99B', '#8DBEF0', '#B9A3F0'].map((col, i) => (
            <path key={col} d={`M${10 + i * 14} 86 A${110 - i * 14} ${80 - i * 12} 0 0 1 ${230 - i * 14} 86 Z`} fill={col} />
          ))}
          <path d="M94 86 A26 18 0 0 1 146 86 Z" fill={c1} />
          {Array.from({ length: 16 }, (_, i) => (
            <path key={i} d={`M${16 + i * 14} 86 v4`} stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          ))}
        </S>
      );
    case 'k-pufe-gato':
      return (
        <S w={90} h={80}>
          <path d="M12 30 L18 4 L34 22 Z M78 30 L72 4 L56 22 Z" fill={c1} />
          <path d="M17 24 L20 12 L28 22 Z M73 24 L70 12 L62 22 Z" fill="#FF9FC2" />
          <ellipse cx="45" cy="72" rx="40" ry="8" fill={dk(c1, 0.15)} />
          <rect x="6" y="18" width="78" height="56" rx="26" fill={c1} />
          <ellipse cx="45" cy="22" rx="36" ry="8" fill={lt(c1, 0.25)} />
          <ellipse cx="32" cy="44" rx="4" ry="5" fill={INK} />
          <ellipse cx="58" cy="44" rx="4" ry="5" fill={INK} />
          <path d="M42 52 h6 l-3 3 Z" fill="#F07A93" />
          <path d="M38 57 q3.5 3 7 0 q3.5 3 7 0" stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <ellipse cx="24" cy="54" rx="6" ry="3.5" fill="#FF9FC2" opacity="0.7" />
          <ellipse cx="66" cy="54" rx="6" ry="3.5" fill="#FF9FC2" opacity="0.7" />
          <path d="M84 56 q14 -4 6 -24" stroke={c1} strokeWidth="7" fill="none" strokeLinecap="round" />
        </S>
      );
    // ---------- Peças novas (inspiradas nos quartinhos dos vídeos) ----------
    case 'k-alvo':
      return (
        <S w={80} h={80}>
          <circle cx="40" cy="40" r="38" fill={dk(WOOD, 0.2)} />
          {[34, 27, 20, 13, 6].map((r, i) => (
            <circle key={r} cx="40" cy="40" r={r} fill={i % 2 ? '#FFF8EC' : c1} />
          ))}
          <circle cx="40" cy="40" r="2.6" fill={INK} />
          <g transform="rotate(-30 40 40)">
            <path d="M40 40 L66 40" stroke="#8A90A0" strokeWidth="2.4" />
            <path d="M62 36 l8 4 l-8 4 Z" fill={c2} />
          </g>
          <ellipse cx="28" cy="22" rx="10" ry="5" fill="#FFFFFF" opacity="0.25" transform="rotate(-30 28 22)" />
        </S>
      );
    case 'k-janela':
      return (
        <S w={120} h={110}>
          <rect x="18" y="10" width="84" height="80" rx="6" fill={lt(c2, 0.5)} stroke="#FFFFFF" strokeWidth="6" />
          <path d="M60 10 V90 M18 50 H102" stroke="#FFFFFF" strokeWidth="5" />
          <ellipse cx="44" cy="30" rx="14" ry="6" fill="#FFFFFF" opacity="0.7" />
          <ellipse cx="82" cy="66" rx="10" ry="4" fill="#FFFFFF" opacity="0.6" />
          <rect x="6" y="2" width="108" height="8" rx="4" fill={dk(WOOD, 0.1)} />
          <path d="M8 8 Q14 50 6 96 Q20 92 30 96 Q24 50 34 8 Z" fill={c1} />
          <path d="M112 8 Q106 50 114 96 Q100 92 90 96 Q96 50 86 8 Z" fill={c1} />
          <path d="M14 20 Q18 60 12 92 M106 20 Q102 60 108 92" stroke={dk(c1, 0.15)} strokeWidth="2" fill="none" />
          <path d="M6 58 Q20 62 32 56 M114 58 Q100 62 88 56" stroke={GOLD} strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="14" y="90" width="92" height="8" rx="3" fill="#FFFFFF" />
          <path d="M40 90 v-8 a4 4 0 0 1 8 0 v8" fill="#7CC39A" />
        </S>
      );
    case 'k-colmeia':
      return (
        <S w={120} h={90}>
          {[
            [30, 26],
            [62, 26],
            [46, 54],
            [78, 54],
            [94, 26],
          ].map(([x, y], i) => {
            const hex = `M${x} ${y - 18} L${x + 15} ${y - 9} L${x + 15} ${y + 9} L${x} ${y + 18} L${x - 15} ${y + 9} L${x - 15} ${y - 9} Z`;
            return (
              <g key={i}>
                <path d={hex} fill={lt(c1, 0.15)} stroke={dk(c1, 0.15)} strokeWidth="3" strokeLinejoin="round" />
                {i === 0 && <path d={`M${x - 6} ${y + 9} v-12 h4 v12 M${x} ${y + 9} v-15 h4 v15 M${x + 6} ${y + 9} v-10 h4 v10`} stroke={c2} strokeWidth="3" />}
                {i === 1 && (
                  <>
                    <circle cx={x} cy={y + 2} r="7" fill="#7CC39A" />
                    <rect x={x - 5} y={y + 6} width="10" height="7" rx="2" fill="#D9825B" />
                  </>
                )}
                {i === 2 && <path d={`M${x - 7} ${y + 8} Q${x} ${y - 10} ${x + 7} ${y + 8} Z`} fill={GOLD} />}
                {i === 3 && <circle cx={x} cy={y + 2} r="6" fill="#FF9FC2" />}
                {i === 4 && <rect x={x - 6} y={y - 4} width="12" height="14" rx="2" fill="#7FB8F0" />}
              </g>
            );
          })}
        </S>
      );
    case 'k-luminaria-chao':
      return (
        <S w={60} h={170}>
          <ellipse cx="30" cy="164" rx="20" ry="5" fill={dk(c2, 0.2)} />
          <path d="M30 162 V50" stroke={dk(c2, 0.1)} strokeWidth="4" />
          <path d="M8 52 L16 14 H44 L52 52 Z" fill={c1} />
          <path d="M8 52 H52" stroke={dk(c1, 0.15)} strokeWidth="3" />
          <path d="M18 22 L14 48" stroke="#FFFFFF" strokeWidth="3" opacity="0.4" strokeLinecap="round" />
          <ellipse cx="30" cy="58" rx="14" ry="4" fill="#FFF3B0" opacity="0.8" />
        </S>
      );
    case 'k-mesa-estudo':
      return (
        <S w={140} h={110}>
          <rect x="6" y="50" width="128" height="10" rx="3" fill={c1} />
          <rect x="96" y="60" width="34" height="46" rx="3" fill={dk(c1, 0.08)} />
          <rect x="100" y="66" width="26" height="10" rx="2" fill={lt(c1, 0.25)} />
          <rect x="100" y="82" width="26" height="10" rx="2" fill={lt(c1, 0.25)} />
          <path d="M14 60 V106 M90 60 V106" stroke={dk(c1, 0.15)} strokeWidth="5" strokeLinecap="round" />
          <path d="M30 50 L36 22 H78 L72 50 Z" fill="#4A4458" />
          <path d="M38 26 H74 L69 46 H33 Z" fill={lt(c2, 0.4)} />
          <path d="M24 50 H84" stroke="#8A90A0" strokeWidth="4" strokeLinecap="round" />
          <rect x="88" y="36" width="10" height="14" rx="3" fill="#FFFFFF" />
          <path d="M98 40 q5 1 0 6" stroke="#FFFFFF" strokeWidth="2" fill="none" />
          <path d="M110 50 V30 l10 -8" stroke="#8A90A0" strokeWidth="3" fill="none" />
          <path d="M116 18 l12 2 -4 8 Z" fill={c2} />
        </S>
      );
    case 'k-cabideiro':
      return (
        <S w={70} h={170}>
          <path d="M35 160 V16" stroke={WOOD} strokeWidth="5" />
          <path d="M18 166 L35 150 L52 166" stroke={WOOD} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M35 26 l-14 -8 M35 26 l14 -8 M35 40 l-12 -6 M35 40 l12 -6" stroke={dk(WOOD, 0.2)} strokeWidth="4" strokeLinecap="round" />
          <circle cx="35" cy="12" r="5" fill={dk(WOOD, 0.2)} />
          <path d="M20 18 Q8 40 14 74 L30 74 Q30 44 22 20 Z" fill={c1} />
          <path d="M48 32 Q62 50 56 66 Q46 62 44 40 Z" fill={c2} />
          <ellipse cx="50" cy="30" rx="10" ry="5" fill={c2} />
        </S>
      );
    // ---------- Casa na Lua: móveis lunares ----------
    case 'k-lua-cama': {
      // cama flutuante com cabeceira de lua crescente (de carinha dormindo) e coberta de estrelas
      const moon = c2;
      return (
        <S w={200} h={160}>
          <ellipse cx="100" cy="152" rx="78" ry="6" fill="#7FE3FF" opacity="0.45" />
          <path d="M70 4 C22 8 2 54 18 92 C30 120 74 132 108 118 C74 116 46 94 44 62 C42 36 52 16 70 4 Z" fill={moon} />
          <path d="M60 14 C34 24 22 52 30 80" stroke={lt(moon, 0.55)} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.8" />
          <path d="M24 66 q5 4 10 0 M40 84 q5 4 10 0" stroke={dk(moon, 0.55)} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <ellipse cx="34" cy="80" rx="4.5" ry="3" fill="#FF9FB8" opacity="0.7" />
          <path d={starD(150, 28, 9)} fill={moon} />
          <path d={starD(178, 54, 6)} fill={lt(moon, 0.25)} />
          <path d={sparkleD(126, 14, 6)} fill="#FFFFFF" />
          {/* base flutuante */}
          <rect x="14" y="116" width="178" height="22" rx="11" fill="#D9DCEF" />
          <rect x="14" y="116" width="178" height="7" rx="3.5" fill="#F4F5FB" />
          <rect x="40" y="130" width="126" height="5" rx="2.5" fill="#7FE3FF" />
          {/* colchão, travesseiro e coberta */}
          <rect x="20" y="92" width="170" height="28" rx="12" fill="#FFFFFF" />
          <rect x="52" y="74" width="58" height="28" rx="13" fill="#FFFFFF" />
          <path d="M68 86 q10 -6 20 0" stroke="#E4E6F2" strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="70" y="98" width="122" height="32" rx="13" fill={c1} />
          <rect x="70" y="98" width="122" height="10" rx="5" fill={lt(c1, 0.3)} />
          {[
            [96, 116, 5],
            [130, 112, 4],
            [160, 120, 5.5],
            [178, 108, 3.5],
            [112, 124, 3],
          ].map(([x, y, r], i) => (
            <path key={i} d={starD(x, y, r)} fill="#FFE27A" />
          ))}
        </S>
      );
    }
    case 'k-lua-poltrona':
      // poltrona-ovo de nave, com almofada fofinha e pé cromado
      return (
        <S w={120} h={160}>
          <ellipse cx="60" cy="64" rx="54" ry="60" fill="#F4F5FB" />
          <path d="M60 4 C92 4 114 30 114 64" stroke="#FFFFFF" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.9" />
          <path d="M18 70 C18 38 36 22 60 22 C84 22 102 38 102 70 C102 98 84 112 60 112 C36 112 18 98 18 70 Z" fill={dk(c1, 0.28)} />
          <path d="M24 72 C24 44 40 30 60 30 C80 30 96 44 96 72 C96 94 82 104 60 104 C38 104 24 94 24 72 Z" fill={c1} />
          <ellipse cx="60" cy="96" rx="36" ry="12" fill={lt(c1, 0.28)} />
          <ellipse cx="44" cy="64" rx="10" ry="12" fill={lt(c1, 0.18)} />
          <path d={starD(74, 58, 6)} fill={c2} />
          <rect x="55" y="122" width="10" height="24" rx="4" fill="#A9AECB" />
          <ellipse cx="60" cy="148" rx="30" ry="8" fill="#C9CDE3" />
          <ellipse cx="60" cy="146" rx="22" ry="4" fill="#E9EBF6" />
        </S>
      );
    case 'k-lua-mesa':
      // mesinha com tampo de meteorito (crateras) num pé de cristal que brilha
      return (
        <S w={130} h={110}>
          <ellipse cx="65" cy="58" rx="20" ry="8" fill="#7FE3FF" opacity="0.4" />
          <path d="M52 50 L46 100 H84 L78 50 Z" fill="#B7F0FF" />
          <path d="M60 50 L58 100 M70 50 L72 100" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.7" />
          <ellipse cx="65" cy="102" rx="34" ry="7" fill="#C9CDE3" />
          <path d="M8 34 C6 18 26 8 48 10 C62 4 86 6 100 12 C118 12 128 24 122 36 C126 48 108 56 88 54 C70 60 40 58 24 52 C10 50 4 42 8 34 Z" fill={c1} />
          <path d="M10 34 C14 26 30 20 50 20 C76 18 104 20 120 32" stroke={lt(c1, 0.3)} strokeWidth="4" fill="none" strokeLinecap="round" />
          <ellipse cx="38" cy="36" rx="11" ry="5" fill={dk(c1, 0.2)} />
          <ellipse cx="38" cy="35" rx="8" ry="3.4" fill={dk(c1, 0.08)} />
          <ellipse cx="84" cy="40" rx="8" ry="3.6" fill={dk(c1, 0.2)} />
          <ellipse cx="104" cy="28" rx="5" ry="2.4" fill={dk(c1, 0.2)} />
          <ellipse cx="64" cy="26" rx="4" ry="2" fill={dk(c1, 0.16)} />
          <path d={sparkleD(110, 6, 5)} fill="#FFFFFF" />
        </S>
      );
    case 'k-lua-luminaria':
      // luminária de pé com um planetinha de anel que brilha
      return (
        <S w={90} h={180}>
          <circle cx="45" cy="40" r="38" fill={c2} opacity="0.22" />
          <rect x="42" y="66" width="6" height="96" rx="3" fill="#A9AECB" />
          <ellipse cx="45" cy="166" rx="26" ry="8" fill="#C9CDE3" />
          <ellipse cx="45" cy="164" rx="18" ry="4" fill="#E9EBF6" />
          <circle cx="45" cy="40" r="24" fill={c1} />
          <path d="M26 34 Q45 28 64 36 M24 46 Q45 40 66 48" stroke={lt(c1, 0.35)} strokeWidth="4" fill="none" strokeLinecap="round" />
          <ellipse cx="45" cy="42" rx="42" ry="10" fill="none" stroke={c2} strokeWidth="5" transform="rotate(-14 45 42)" />
          <path d="M14 40 A42 10 -14 0 0 86 32" stroke={lt(c2, 0.45)} strokeWidth="2" fill="none" />
          <ellipse cx="36" cy="30" rx="7" ry="4" fill="#FFFFFF" opacity="0.5" transform="rotate(-30 36 30)" />
        </S>
      );
    case 'k-lua-estante':
      // estante em forma de foguete, com vigias cheias de livros e pedrinhas da Lua
      return (
        <S w={120} h={210}>
          <path d="M60 4 C84 22 96 52 96 86 V172 H24 V86 C24 52 36 22 60 4 Z" fill="#F4F5FB" />
          <path d="M60 4 C74 14 84 30 90 48 H30 C36 30 46 14 60 4 Z" fill={c1} />
          <path d="M24 150 L4 186 L24 182 Z M96 150 L116 186 L96 182 Z" fill={c1} />
          <rect x="44" y="172" width="32" height="12" rx="3" fill="#A9AECB" />
          <path d="M48 184 Q60 204 72 184 Z" fill="#FFB347" />
          <path d="M53 184 Q60 196 67 184 Z" fill="#FFE27A" />
          <circle cx="60" cy="76" r="20" fill="#A9AECB" />
          <circle cx="60" cy="76" r="15" fill="#2C2F66" />
          <Books x={48} y={86} n={3} h={18} seed={2} />
          <circle cx="60" cy="126" r="20" fill="#A9AECB" />
          <circle cx="60" cy="126" r="15" fill="#2C2F66" />
          <ellipse cx="54" cy="134" rx="6" ry="4.5" fill="#B9BDCB" />
          <ellipse cx="66" cy="133" rx="5" ry="4" fill="#9DA2BC" />
          <path d={starD(62, 120, 5)} fill="#FFE27A" />
          <rect x="24" y="100" width="72" height="5" fill={c2} />
          <path d="M32 58 C34 46 40 36 46 28" stroke="#FFFFFF" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7" />
        </S>
      );
    case 'k-lua-tapete':
      // tapete de cratera, com anéis e pegadinhas
      return (
        <S w={220} h={70}>
          <ellipse cx="110" cy="36" rx="106" ry="30" fill={c1} />
          <ellipse cx="110" cy="36" rx="84" ry="22" fill={dk(c1, 0.1)} />
          <ellipse cx="110" cy="38" rx="60" ry="14" fill={lt(c1, 0.12)} />
          <ellipse cx="110" cy="40" rx="34" ry="7" fill={dk(c1, 0.08)} />
          {[
            [40, 30, 7, 3],
            [178, 44, 6, 2.6],
            [150, 20, 4, 1.8],
            [64, 52, 5, 2.2],
          ].map(([x, y, rx, ry], i) => (
            <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill={dk(c1, 0.16)} />
          ))}
          <path d={starD(196, 26, 5)} fill={c2} />
          <path d={starD(24, 44, 4)} fill={c2} />
        </S>
      );
    case 'k-lua-banheira':
      // banheira-cápsula de nave, com faixa que brilha e água cheia de bolhas
      return (
        <S w={170} h={120}>
          <path d="M8 30 Q8 108 52 108 H118 Q162 108 162 30 Z" fill="#F4F5FB" />
          <path d="M14 62 Q85 74 156 62" stroke={c1} strokeWidth="6" fill="none" />
          <path d="M14 62 Q85 74 156 62" stroke="#FFFFFF" strokeWidth="1.6" fill="none" opacity="0.6" />
          <ellipse cx="85" cy="30" rx="78" ry="14" fill="#D9DCEF" />
          <ellipse cx="85" cy="31" rx="70" ry="10" fill="#8FD4F2" />
          {[
            [40, 26, 6],
            [56, 22, 4],
            [120, 27, 7],
            [104, 22, 4],
            [136, 22, 3.5],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#FFFFFF" opacity="0.9" />
          ))}
          <path d="M150 28 V8 Q150 2 142 2 H130" stroke="#A9AECB" strokeWidth="5" fill="none" strokeLinecap="round" />
          <circle cx="128" cy="2" r="4" fill={c2} />
          <rect x="34" y="104" width="12" height="12" rx="4" fill="#A9AECB" />
          <rect x="124" y="104" width="12" height="12" rx="4" fill="#A9AECB" />
        </S>
      );
    case 'k-lua-planta':
      // plantinha espacial numa redoma de vidro
      return (
        <S w={90} h={140}>
          <path d="M14 104 V58 C14 30 28 14 45 14 C62 14 76 30 76 58 V104 Z" fill="#DDF4FF" opacity="0.55" />
          <path d="M45 104 C30 88 22 70 30 56 C38 66 42 82 45 104 Z" fill="#43C6B0" />
          <path d="M45 104 C58 86 70 72 62 54 C54 66 48 84 45 104 Z" fill="#6FD8C0" />
          <path d="M45 104 C42 84 44 60 48 44 C52 62 50 84 45 104 Z" fill="#2FA894" />
          <circle cx="30" cy="54" r="6" fill={c1} />
          <circle cx="62" cy="52" r="7" fill={c1} />
          <circle cx="48" cy="42" r="5" fill={lt(c1, 0.3)} />
          <circle cx="62" cy="52" r="12" fill={c1} opacity="0.18" />
          <path d="M22 50 C24 34 32 24 42 20" stroke="#FFFFFF" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8" />
          <rect x="8" y="100" width="74" height="16" rx="7" fill="#C9CDE3" />
          <rect x="14" y="114" width="62" height="18" rx="6" fill="#A9AECB" />
          <rect x="22" y="121" width="46" height="4" rx="2" fill="#7FE3FF" />
        </S>
      );
    case 'k-lua-telescopio':
      // telescópio no tripé, apontado para as estrelas
      return (
        <S w={120} h={160}>
          <g transform="rotate(-32 60 62)">
            <rect x="18" y="48" width="88" height="26" rx="12" fill="#F4F5FB" />
            <rect x="96" y="44" width="16" height="34" rx="7" fill={c1} />
            <rect x="40" y="48" width="9" height="26" fill={c1} />
            <rect x="10" y="54" width="12" height="14" rx="4" fill="#A9AECB" />
            <rect x="24" y="52" width="70" height="5" rx="2.5" fill="#FFFFFF" opacity="0.8" />
          </g>
          <circle cx="60" cy="74" r="7" fill="#A9AECB" />
          <path d="M60 78 L30 150 M60 78 L90 150 M60 78 V146" stroke="#A9AECB" strokeWidth="6" strokeLinecap="round" />
          <path d={starD(16, 18, 7)} fill={c2} />
          <path d={sparkleD(40, 8, 5)} fill={c2} />
        </S>
      );
    case 'k-lua-quadro':
      // quadro redondo com a Terra vista da Lua
      return (
        <S w={90} h={90}>
          <circle cx="45" cy="45" r="42" fill={c1} />
          <circle cx="45" cy="45" r="34" fill="#1B1F4A" />
          <circle cx="50" cy="40" r="16" fill="#5FB4F5" />
          <path d="M42 32 q8 -5 12 2 q-3 7 -11 4 Z M52 46 q7 -1 8 4 q-5 4 -9 0 Z" fill="#6FC46A" />
          <path d="M14 66 Q32 54 50 62 T80 60 V74 H14 Z" fill="#B9BDCB" />
          {[
            [22, 26],
            [70, 22],
            [28, 46],
            [72, 50],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.6" fill="#FFFFFF" />
          ))}
        </S>
      );
    case 'k-lua-rodinha':
      // rodinha de corrida como um planeta com anel de órbita
      return (
        <S w={140} h={140}>
          <path d="M40 132 L70 70 L100 132" stroke="#A9AECB" strokeWidth="7" fill="none" strokeLinecap="round" />
          <ellipse cx="70" cy="134" rx="40" ry="5" fill="#C9CDE3" />
          <circle cx="70" cy="64" r="56" fill="none" stroke={c1} strokeWidth="11" />
          <circle cx="70" cy="64" r="56" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="5 9" opacity="0.8" />
          <circle cx="70" cy="64" r="46" fill="#2C2F66" opacity="0.12" />
          {[0, 60, 120].map((a) => (
            <path
              key={a}
              d={`M${70 - Math.cos((a * Math.PI) / 180) * 50} ${64 - Math.sin((a * Math.PI) / 180) * 50} L${70 + Math.cos((a * Math.PI) / 180) * 50} ${64 + Math.sin((a * Math.PI) / 180) * 50}`}
              stroke={lt(c1, 0.25)}
              strokeWidth="3"
            />
          ))}
          <circle cx="70" cy="64" r="10" fill={c2} />
          <ellipse cx="70" cy="64" rx="20" ry="5" fill="none" stroke={lt(c2, 0.3)} strokeWidth="2.5" transform="rotate(-20 70 64)" />
        </S>
      );
    default:
      // coleções temáticas (Inverno, Praia, Jardim)
      return <ThemeKit id={id} c1={c1} c2={c2} />;
  }
}

/** Onde cada peça fica: na parede, no chão ou estendida no chão (tapetes). */
export const KIT_PLACE: Record<string, Place> = {
  'k-lua-tapete': 'tapete',
  'k-lua-quadro': 'parede',
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
  'k-tapete-nuvem': 'tapete',
  'k-tapete-arcoiris': 'tapete',
  'k-neon-coracao': 'parede',
  'k-neon-estrela': 'parede',
  'k-neon-lua': 'parede',
  'k-varal-luzes': 'parede',
  'k-alvo': 'parede',
  'k-janela': 'parede',
  'k-colmeia': 'parede',
  // coleções temáticas
  'k-inv-tapete-urso': 'tapete',
  'k-inv-flocos': 'parede',
  'k-praia-toalha': 'tapete',
  'k-jar-tapete-folha': 'tapete',
  'k-jar-guirlanda': 'parede',
};
