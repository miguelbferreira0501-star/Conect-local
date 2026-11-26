// Coleções temáticas da casa (Inverno, Praia e Jardim): cada tema tem móveis próprios desenhados para combinar
// entre si e com uma roupinha do mesmo tema. Mesmo acabamento liso do resto do kit (sem contorno, luz em cima).
import { S, mix } from './kit';
import { ThemeKit2 } from './themeKit2';

const dk = (c: string, t = 0.2) => mix(c, '#2B1A14', t);
const lt = (c: string, t = 0.3) => mix(c, '#FFFFFF', t);
const INK = '#3B2A2A';
const SNOW = '#FBFDFF';

/** Floco de neve de seis pontas. */
function Flake({ x, y, r, c = '#FFFFFF', w = 2.2 }: { x: number; y: number; r: number; c?: string; w?: number }) {
  const arms = [0, 60, 120].map((a) => {
    const rad = (a * Math.PI) / 180;
    const dx = Math.cos(rad) * r;
    const dy = Math.sin(rad) * r;
    return `M${x - dx} ${y - dy} L${x + dx} ${y + dy}`;
  });
  const tips = [0, 60, 120, 180, 240, 300].map((a) => {
    const rad = (a * Math.PI) / 180;
    const px = x + Math.cos(rad) * r * 0.62;
    const py = y + Math.sin(rad) * r * 0.62;
    const l = rad + Math.PI * 0.75;
    const rr = rad - Math.PI * 0.75;
    const k = r * 0.3;
    return `M${px} ${py} L${px + Math.cos(l) * k} ${py + Math.sin(l) * k} M${px} ${py} L${px + Math.cos(rr) * k} ${py + Math.sin(rr) * k}`;
  });
  return <path d={[...arms, ...tips].join(' ')} stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />;
}

/** Florzinha de cinco pétalas. */
function Flower({ x, y, r, c, mid = '#FFD34D' }: { x: number; y: number; r: number; c: string; mid?: string }) {
  return (
    <g>
      {[0, 72, 144, 216, 288].map((a) => {
        const rad = ((a - 90) * Math.PI) / 180;
        return <circle key={a} cx={x + Math.cos(rad) * r * 0.62} cy={y + Math.sin(rad) * r * 0.62} r={r * 0.5} fill={c} />;
      })}
      <circle cx={x} cy={y} r={r * 0.36} fill={mid} />
    </g>
  );
}

/** Folha com nervura. */
function Leaf({ x, y, l, a, c }: { x: number; y: number; l: number; a: number; c: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${a})`}>
      <path d={`M0 0 C${l * 0.3} ${-l * 0.34} ${l * 0.78} ${-l * 0.3} ${l} 0 C${l * 0.78} ${l * 0.3} ${l * 0.3} ${l * 0.34} 0 0 Z`} fill={c} />
      <path d={`M${l * 0.08} 0 L${l * 0.86} 0`} stroke={lt(c, 0.35)} strokeWidth={Math.max(1.2, l * 0.05)} strokeLinecap="round" />
    </g>
  );
}

const starD = (x: number, y: number, r: number) => {
  const p = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${x + Math.cos(a) * rr} ${y + Math.sin(a) * rr}`;
  });
  return `M${p.join(' L')} Z`;
};

export function ThemeKit({ id, c1, c2 }: { id: string; c1: string; c2: string }) {
  switch (id) {
    // ================= Inverno =================
    case 'k-inv-cama-pinguim': {
      // cama com cabeceira de pinguim (barriguinha branca, bico laranja, bochechas) e coberta de flocos
      const body = c1;
      return (
        <S w={200} h={170}>
          {/* asinhas */}
          <ellipse cx="18" cy="96" rx="16" ry="34" fill={dk(body, 0.08)} transform="rotate(18 18 96)" />
          <ellipse cx="182" cy="96" rx="16" ry="34" fill={dk(body, 0.08)} transform="rotate(-18 182 96)" />
          {/* corpo e barriga */}
          <path d="M100 6 C46 6 20 46 20 98 L20 132 L180 132 L180 98 C180 46 154 6 100 6 Z" fill={body} />
          <path d="M100 30 C64 30 46 60 46 96 L46 132 L154 132 L154 96 C154 60 136 30 100 30 Z" fill={SNOW} />
          <path d="M66 22 Q100 10 134 22" stroke={lt(body, 0.35)} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.7" />
          {/* rostinho */}
          <circle cx="80" cy="60" r="7.5" fill={INK} />
          <circle cx="120" cy="60" r="7.5" fill={INK} />
          <circle cx="82.6" cy="57.4" r="2.4" fill="#FFFFFF" />
          <circle cx="122.6" cy="57.4" r="2.4" fill="#FFFFFF" />
          <ellipse cx="68" cy="74" rx="8" ry="5" fill="#FFB3C4" opacity="0.8" />
          <ellipse cx="132" cy="74" rx="8" ry="5" fill="#FFB3C4" opacity="0.8" />
          <path d="M90 68 Q100 64 110 68 Q104 80 100 80 Q96 80 90 68 Z" fill="#FFA43A" />
          {/* colchão, travesseiro e coberta */}
          <rect x="12" y="104" width="176" height="28" rx="13" fill="#FFFFFF" />
          <rect x="54" y="88" width="92" height="26" rx="13" fill="#E3F2FF" />
          <path d="M80 100 q20 -7 40 0" stroke="#C9E2F8" strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="12" y="114" width="176" height="36" rx="15" fill={c2} />
          <rect x="12" y="114" width="176" height="11" rx="5.5" fill={lt(c2, 0.35)} />
          <Flake x={46} y={136} r={7} />
          <Flake x={100} y={140} r={6} />
          <Flake x={152} y={134} r={7.5} />
          {/* pezinhos */}
          <ellipse cx="46" cy="158" rx="22" ry="10" fill="#FFA43A" />
          <ellipse cx="154" cy="158" rx="22" ry="10" fill="#FFA43A" />
          <rect x="30" y="146" width="140" height="10" rx="5" fill={dk(body, 0.15)} />
        </S>
      );
    }
    case 'k-inv-boneco-neve':
      // boneco de neve com cachecol, gorro, nariz de cenoura e braços de galho
      return (
        <S w={110} h={170}>
          <ellipse cx="55" cy="160" rx="46" ry="9" fill="#E3F1FB" />
          <path d="M22 96 L2 78 M8 84 L4 72 M88 96 L108 76 M102 82 L106 70" stroke="#8B5A35" strokeWidth="4.4" strokeLinecap="round" fill="none" />
          <circle cx="55" cy="124" r="38" fill={SNOW} />
          <path d="M30 108 Q38 94 52 90" stroke="#FFFFFF" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.9" />
          <circle cx="55" cy="112" r="4" fill={c2} />
          <circle cx="55" cy="128" r="4" fill={c2} />
          <circle cx="55" cy="144" r="4" fill={c2} />
          <circle cx="55" cy="64" r="28" fill={SNOW} />
          {/* gorro */}
          <path d="M28 52 C28 22 82 22 82 52 Z" fill={c2} />
          <rect x="25" y="46" width="60" height="11" rx="5.5" fill={lt(c2, 0.45)} />
          <circle cx="55" cy="22" r="8" fill="#FFFFFF" />
          {/* rosto */}
          <circle cx="45" cy="64" r="3.6" fill={INK} />
          <circle cx="65" cy="64" r="3.6" fill={INK} />
          <path d="M55 70 L76 75 L55 76 Z" fill="#FF8A3D" />
          <ellipse cx="40" cy="74" rx="5" ry="3" fill="#FFB3C4" opacity="0.8" />
          <ellipse cx="70" cy="74" rx="5" ry="3" fill="#FFB3C4" opacity="0.8" />
          <path d="M47 81 q8 5 16 0" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          {/* cachecol */}
          <rect x="28" y="86" width="54" height="11" rx="5.5" fill={c1} />
          <path d="M68 94 L74 120 L64 121 L60 96 Z" fill={c1} />
          <path d="M66 112 L74 112 M65 116 L74 116" stroke={lt(c1, 0.5)} strokeWidth="2" />
          <path d="M36 91.5 H74" stroke={lt(c1, 0.4)} strokeWidth="2.4" strokeDasharray="5 5" />
        </S>
      );
    case 'k-inv-tapete-urso':
      // tapete de ursinho polar (visto de cima, deitado no chão)
      return (
        <S w={230} h={92}>
          <path
            d="M70 18 C96 10 150 10 176 20 C192 14 204 18 206 28 C210 40 198 46 190 46 C196 56 210 62 212 74 C212 84 198 88 188 80 C172 88 120 90 92 84 C82 90 66 90 62 80 C56 72 62 64 70 60 C64 54 58 48 62 38 C64 28 66 22 70 18 Z"
            fill={SNOW}
          />
          {/* cabeça */}
          <circle cx="44" cy="48" r="30" fill={SNOW} />
          <circle cx="24" cy="24" r="10" fill={SNOW} />
          <circle cx="24" cy="24" r="5" fill={lt(c1, 0.2)} />
          <circle cx="56" cy="22" r="10" fill={SNOW} />
          <circle cx="56" cy="22" r="5" fill={lt(c1, 0.2)} />
          <path d="M28 46 q5 4 10 0 M50 46 q5 4 10 0" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <ellipse cx="44" cy="58" rx="8" ry="6" fill={lt(c1, 0.55)} />
          <ellipse cx="44" cy="55.5" rx="3.6" ry="2.6" fill={INK} />
          <ellipse cx="24" cy="58" rx="5" ry="3" fill="#FFB3C4" opacity="0.8" />
          <ellipse cx="64" cy="58" rx="5" ry="3" fill="#FFB3C4" opacity="0.8" />
          {/* patinhas */}
          {[
            [76, 20],
            [196, 26],
            [74, 82],
            [200, 76],
          ].map(([x, y], i) => (
            <g key={i}>
              <ellipse cx={x} cy={y} rx="9" ry="7" fill={lt(c1, 0.3)} />
              <circle cx={x - 5} cy={y - 6} r="2.2" fill={lt(c1, 0.3)} />
              <circle cx={x} cy={y - 8} r="2.2" fill={lt(c1, 0.3)} />
              <circle cx={x + 5} cy={y - 6} r="2.2" fill={lt(c1, 0.3)} />
            </g>
          ))}
          <path d="M100 40 Q140 30 176 42" stroke={lt(c1, 0.6)} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M104 60 Q140 70 172 58" stroke={lt(c1, 0.6)} strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="216" cy="56" r="7" fill={SNOW} />
        </S>
      );
    case 'k-inv-banheira': {
      // ofurô de gelo: bloquinhos de gelo, neve na borda, água quentinha com vapor e um patinho
      const ice = c1;
      return (
        <S w={190} h={160}>
          <path d="M70 34 q-10 -12 0 -22 q10 -10 0 -22" stroke="#FFFFFF" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.45" />
          <path d="M112 38 q-10 -12 0 -22 q10 -10 0 -22" stroke="#FFFFFF" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.45" />
          <path d="M18 62 H172 L162 140 Q160 152 146 152 H44 Q30 152 28 140 Z" fill={ice} />
          {/* bloquinhos de gelo */}
          {[
            [34, 78, 40, 26],
            [78, 78, 36, 26],
            [118, 78, 38, 26],
            [40, 108, 34, 24],
            [78, 108, 40, 24],
            [122, 108, 30, 24],
          ].map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} rx="7" fill={lt(ice, 0.32)} />
          ))}
          <path d="M44 84 l10 0 M90 84 l8 0 M128 86 l10 0" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
          {/* água */}
          <ellipse cx="95" cy="62" rx="74" ry="14" fill={c2} />
          <ellipse cx="95" cy="60" rx="60" ry="8" fill={lt(c2, 0.4)} />
          {/* patinho */}
          <ellipse cx="128" cy="56" rx="13" ry="8" fill="#FFD34D" />
          <circle cx="122" cy="46" r="8" fill="#FFD34D" />
          <path d="M114 46 l-7 2 l7 3 Z" fill="#FF8A3D" />
          <circle cx="120.5" cy="44" r="1.6" fill={INK} />
          {/* neve na borda e pingentes */}
          <path d="M10 64 C14 50 30 52 36 58 C42 48 60 50 64 58 C72 48 92 50 96 58 C104 48 122 50 126 58 C134 48 152 50 156 58 C164 50 180 52 180 64 C180 72 10 72 10 64 Z" fill={SNOW} />
          <path d="M34 70 l4 12 l4 -12 Z M82 70 l3 9 l3 -9 Z M132 70 l4 13 l4 -13 Z M156 70 l3 8 l3 -8 Z" fill={SNOW} />
        </S>
      );
    }
    case 'k-inv-flocos':
      // varal de flocos de neve e estrelinhas (na parede)
      return (
        <S w={210} h={86}>
          <path d="M4 10 Q105 34 206 10" stroke="#9E7A5C" strokeWidth="3.4" fill="none" strokeLinecap="round" />
          {[
            [26, 18, 42, 'f'],
            [60, 24, 58, 's'],
            [92, 27, 46, 'f'],
            [124, 27, 62, 's'],
            [156, 23, 44, 'f'],
            [186, 17, 56, 's'],
          ].map(([x, y, end, kind], i) => (
            <g key={i}>
              <path d={`M${x} ${y} L${x} ${end}`} stroke="#DCE7F2" strokeWidth="1.8" />
              {kind === 'f' ? (
                <>
                  <circle cx={x as number} cy={(end as number) + 10} r="11" fill={lt(c1, 0.2)} />
                  <Flake x={x as number} y={(end as number) + 10} r={8.5} c="#FFFFFF" w={2.4} />
                </>
              ) : (
                <path d={starD(x as number, (end as number) + 9, 10)} fill={c2} />
              )}
            </g>
          ))}
        </S>
      );

    // ================= Praia =================
    case 'k-praia-espreguicadeira':
      // guarda-sol listrado e espreguiçadeira
      return (
        <S w={210} h={170}>
          <rect x="44" y="40" width="5" height="126" rx="2.5" fill="#E9E2D6" />
          <path d="M2 50 C6 18 34 4 47 4 C60 4 88 18 92 50 Z" fill={c1} />
          {[
            'M47 4 C40 12 34 28 32 50 L18 50 C20 28 32 12 47 4 Z',
            'M47 4 C54 12 60 28 62 50 L76 50 C74 28 62 12 47 4 Z',
          ].map((d, i) => (
            <path key={i} d={d} fill="#FFFFFF" />
          ))}
          <path d="M2 50 Q10 58 18 50 Q25 58 32 50 Q40 58 47 50 Q54 58 62 50 Q69 58 76 50 Q84 58 92 50" fill={dk(c1, 0.08)} />
          <circle cx="47" cy="4" r="4" fill={dk(c1, 0.2)} />
          {/* espreguiçadeira */}
          <path d="M92 150 L110 112 M192 150 L180 120 M118 150 L124 128" stroke="#C98A5B" strokeWidth="6" strokeLinecap="round" />
          <path d="M104 92 L126 128 L198 128 L198 116 L132 116 L116 86 Z" fill="#C98A5B" />
          <path d="M106 92 L126 124 L196 124 L196 118 L130 118 L114 88 Z" fill={c2} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={140 + i * 15} y="116" width="7" height="10" fill="#FFFFFF" />
          ))}
          <path d="M108 95 L111 100 M112 102 L115 107 M117 110 L120 115" stroke="#FFFFFF" strokeWidth="5" />
          {/* toalhinha e chinelos */}
          <ellipse cx="150" cy="160" rx="11" ry="5" fill="#FF8A7A" />
          <ellipse cx="168" cy="162" rx="11" ry="5" fill="#FF8A7A" />
          <path d="M146 158 l4 3 l4 -3 M164 160 l4 3 l4 -3" stroke="#FFFFFF" strokeWidth="2" fill="none" />
        </S>
      );
    case 'k-praia-castelo':
      // castelinho de areia com bandeirinha, conchas e estrela-do-mar
      return (
        <S w={150} h={140}>
          <ellipse cx="75" cy="130" rx="72" ry="9" fill={dk('#EBC27E', 0.06)} />
          <path d="M42 18 L42 4" stroke="#8B5A35" strokeWidth="2.4" />
          <path d="M42 4 L58 9 L42 14 Z" fill={c1} />
          {/* torres */}
          <path d="M26 30 H58 V128 H26 Z" fill="#EBC27E" />
          <path d="M24 30 h8 v-8 h7 v8 h6 v-8 h7 v8 h8 v10 h-36 Z" fill={lt('#EBC27E', 0.12)} />
          <path d="M96 46 H128 V128 H96 Z" fill="#EBC27E" />
          <path d="M94 46 h8 v-8 h7 v8 h6 v-8 h7 v8 h8 v10 h-36 Z" fill={lt('#EBC27E', 0.12)} />
          {/* muralha */}
          <path d="M14 70 H138 V128 H14 Z" fill={lt('#EBC27E', 0.06)} />
          <path d="M12 70 h12 v-9 h10 v9 h12 v-9 h10 v9 h12 v-9 h10 v9 h12 v-9 h10 v9 h12 v-9 h10 v9 h6 v8 h-128 Z" fill={lt('#EBC27E', 0.18)} />
          <path d="M62 128 V104 Q76 88 90 104 V128 Z" fill={dk('#EBC27E', 0.35)} />
          <rect x="37" y="46" width="10" height="14" rx="5" fill={dk('#EBC27E', 0.3)} />
          <rect x="107" y="62" width="10" height="14" rx="5" fill={dk('#EBC27E', 0.3)} />
          {[
            [30, 100],
            [44, 114],
            [112, 96],
            [124, 112],
            [74, 80],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2" fill={dk('#EBC27E', 0.18)} />
          ))}
          {/* conchinha e estrela */}
          <path d="M14 132 C14 120 32 120 32 132 Z" fill={c2} />
          <path d="M19 131 L21 123 M23 131 L23 122 M27 131 L25 123" stroke={lt(c2, 0.5)} strokeWidth="1.6" />
          <path d={starD(130, 128, 10)} fill="#FF9A6B" />
        </S>
      );
    case 'k-praia-coqueiro':
      // coqueiro com cocos num montinho de areia
      return (
        <S w={140} h={210}>
          <ellipse cx="70" cy="196" rx="56" ry="12" fill="#EBC27E" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <path key={i} d={`M${62 + i * 1.6} ${186 - i * 22} l${16 - i * 0.6} -2 l-2 -22 l${-14 + i * 0.4} 2 Z`} fill={i % 2 ? '#B07A4F' : '#C28A5C'} />
          ))}
          <Leaf x={78} y={44} l={62} a={-160} c={c1} />
          <Leaf x={78} y={44} l={64} a={-20} c={c1} />
          <Leaf x={78} y={44} l={56} a={-120} c={dk(c1, 0.08)} />
          <Leaf x={78} y={44} l={56} a={-60} c={dk(c1, 0.08)} />
          <Leaf x={78} y={44} l={50} a={160} c={lt(c1, 0.12)} />
          <Leaf x={78} y={44} l={50} a={20} c={lt(c1, 0.12)} />
          <circle cx="70" cy="52" r="8" fill="#8B5A35" />
          <circle cx="84" cy="54" r="8" fill="#7A4D2C" />
          <circle cx="77" cy="60" r="7" fill="#8B5A35" />
          <path d={starD(108, 194, 7)} fill={c2} />
        </S>
      );
    case 'k-praia-prancha':
      // prancha de surfe em pé, com faixa e flor
      return (
        <S w={70} h={190}>
          <ellipse cx="35" cy="182" rx="26" ry="6" fill="#EBC27E" />
          <path d="M35 4 C58 30 60 120 52 176 Q35 184 18 176 C10 120 12 30 35 4 Z" fill={c1} />
          <path d="M35 4 C46 20 50 60 50 96 L20 96 C20 60 24 20 35 4 Z" fill={lt(c1, 0.22)} />
          <rect x="14" y="104" width="42" height="10" fill={c2} />
          <rect x="14" y="118" width="42" height="5" fill="#FFFFFF" />
          <Flower x={35} y={64} r={11} c="#FFFFFF" mid="#FFD34D" />
          <path d="M35 132 L35 172" stroke={dk(c1, 0.12)} strokeWidth="2.4" strokeLinecap="round" />
        </S>
      );
    case 'k-praia-toalha':
      // toalha de praia listrada (no chão), com franjinha e óculos escuros
      return (
        <S w={230} h={92}>
          <rect x="16" y="10" width="198" height="72" rx="10" fill="#FFFFFF" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x="16" y={10 + i * 16} width="198" height="8" fill={i % 2 ? c2 : c1} />
          ))}
          <path d="M16 18 C16 13 20 10 26 10 H204 C210 10 214 13 214 18" fill="none" />
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d={`M${8} ${14 + i * 6} H16 M214 ${14 + i * 6} H222`} stroke={lt(c1, 0.3)} strokeWidth="2.4" strokeLinecap="round" />
          ))}
          <g transform="translate(150 50) rotate(-12)">
            <circle cx="-12" cy="0" r="9" fill={INK} />
            <circle cx="12" cy="0" r="9" fill={INK} />
            <path d="M-3 -1 Q0 -4 3 -1" stroke={INK} strokeWidth="2.4" fill="none" />
            <path d="M-16 -3 l5 -2 M8 -3 l5 -2" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          </g>
        </S>
      );

    // ================= Jardim =================
    case 'k-jar-cama-cogumelo': {
      // cama com cabeceira de cogumelo (chapéu de bolinhas) e coberta de folhinha
      const cap = c1;
      return (
        <S w={200} h={170}>
          <rect x="62" y="56" width="76" height="70" rx="18" fill="#F7E7CC" />
          <path d="M84 90 q16 6 32 0" stroke={dk('#F7E7CC', 0.12)} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M8 72 C8 24 52 4 100 4 C148 4 192 24 192 72 Q192 80 182 80 H18 Q8 80 8 72 Z" fill={cap} />
          <path d="M30 40 C42 22 62 14 82 12" stroke={lt(cap, 0.4)} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.8" />
          {[
            [52, 46, 11],
            [96, 28, 9],
            [140, 44, 12],
            [172, 64, 6],
            [26, 64, 6],
            [110, 58, 6],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#FFFFFF" />
          ))}
          <rect x="12" y="104" width="176" height="28" rx="13" fill="#FFFFFF" />
          <rect x="56" y="88" width="88" height="26" rx="13" fill="#FFF7E6" />
          <rect x="12" y="114" width="176" height="36" rx="15" fill={c2} />
          <rect x="12" y="114" width="176" height="11" rx="5.5" fill={lt(c2, 0.35)} />
          <Leaf x={36} y={138} l={18} a={-20} c={lt(c2, 0.45)} />
          <Leaf x={96} y={140} l={18} a={-160} c={lt(c2, 0.45)} />
          <Flower x={140} y={136} r={7} c="#FFFFFF" />
          <Flower x={70} y={134} r={6} c="#FFC2D6" />
          <rect x="22" y="148" width="12" height="16" rx="4" fill="#B07A4F" />
          <rect x="166" y="148" width="12" height="16" rx="4" fill="#B07A4F" />
          <path d="M6 166 q6 -12 10 0 q4 -10 8 0 M176 166 q6 -12 10 0 q4 -10 8 0" fill="#7CC765" />
        </S>
      );
    }
    case 'k-jar-abajur-flor':
      // abajur de tulipa com luz quentinha, num vasinho
      return (
        <S w={80} h={170}>
          <ellipse cx="40" cy="30" rx="34" ry="26" fill="#FFF3B0" opacity="0.4" />
          <path d="M40 54 C36 90 44 112 40 144" stroke="#5FAE5A" strokeWidth="5" fill="none" strokeLinecap="round" />
          <Leaf x={40} y={112} l={30} a={-30} c="#7CC765" />
          <Leaf x={40} y={92} l={26} a={-150} c="#6CB85C" />
          <path d="M16 18 C16 46 26 58 40 58 C54 58 64 46 64 18 L54 28 L47 10 L40 24 L33 10 L26 28 Z" fill={c1} />
          <path d="M24 30 C24 44 30 52 38 54" stroke={lt(c1, 0.45)} strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="40" cy="40" r="7" fill="#FFF7C2" opacity="0.85" />
          <path d="M20 140 H60 L56 166 H24 Z" fill={c2} />
          <rect x="16" y="136" width="48" height="10" rx="5" fill={lt(c2, 0.2)} />
        </S>
      );
    case 'k-jar-mesa-tronco':
      // mesinha de toco de árvore com xícara e cogumelinhos
      return (
        <S w={150} h={130}>
          <path d="M28 46 H122 L126 118 Q128 126 116 126 H34 Q22 126 24 118 Z" fill="#B07A4F" />
          <path d="M44 56 L42 118 M72 58 L72 120 M102 56 L104 118" stroke={dk('#B07A4F', 0.18)} strokeWidth="4" strokeLinecap="round" />
          <path d="M18 122 Q24 110 34 116 L34 126 H14 Z M132 122 Q126 110 116 116 L116 126 H136 Z" fill="#9C6B43" />
          <ellipse cx="75" cy="46" rx="50" ry="14" fill="#E6BE8A" />
          <ellipse cx="75" cy="46" rx="34" ry="9" fill="none" stroke={dk('#E6BE8A', 0.12)} strokeWidth="2.4" />
          <ellipse cx="75" cy="46" rx="18" ry="5" fill="none" stroke={dk('#E6BE8A', 0.12)} strokeWidth="2.4" />
          <path d="M40 52 q10 6 20 2" stroke="#7CC765" strokeWidth="5" fill="none" strokeLinecap="round" />
          {/* xícara */}
          <path d="M90 22 H112 L110 40 Q108 44 101 44 Q94 44 92 40 Z" fill={c2} />
          <path d="M112 26 q8 2 6 8 q-2 5 -8 4" stroke={c2} strokeWidth="3" fill="none" />
          <path d="M96 16 q-4 -6 0 -10 M104 16 q-4 -6 0 -10" stroke="#FFFFFF" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.6" />
          {/* cogumelinhos */}
          <rect x="136" y="110" width="6" height="14" rx="3" fill="#F7E7CC" />
          <path d="M130 112 C130 100 148 100 148 112 Z" fill={c1} />
          <circle cx="136" cy="106" r="1.8" fill="#FFFFFF" />
          <circle cx="143" cy="108" r="1.6" fill="#FFFFFF" />
        </S>
      );
    case 'k-jar-pufe-sapo':
      // pufe de sapinho
      return (
        <S w={120} h={100}>
          <ellipse cx="60" cy="66" rx="54" ry="32" fill={c1} />
          <ellipse cx="60" cy="74" rx="36" ry="20" fill={lt(c1, 0.45)} />
          <circle cx="34" cy="34" r="17" fill={c1} />
          <circle cx="86" cy="34" r="17" fill={c1} />
          <circle cx="34" cy="32" r="10" fill="#FFFFFF" />
          <circle cx="86" cy="32" r="10" fill="#FFFFFF" />
          <circle cx="35" cy="33" r="5.6" fill={INK} />
          <circle cx="87" cy="33" r="5.6" fill={INK} />
          <circle cx="37" cy="31" r="1.8" fill="#FFFFFF" />
          <circle cx="89" cy="31" r="1.8" fill="#FFFFFF" />
          <path d="M44 58 Q60 70 76 58" stroke={dk(c1, 0.45)} strokeWidth="3" fill="none" strokeLinecap="round" />
          <ellipse cx="28" cy="58" rx="7" ry="4.4" fill="#FF9FB8" opacity="0.85" />
          <ellipse cx="92" cy="58" rx="7" ry="4.4" fill="#FF9FB8" opacity="0.85" />
          <Flower x={60} y={22} r={7} c={c2} />
          <ellipse cx="22" cy="94" rx="14" ry="5" fill={dk(c1, 0.1)} />
          <ellipse cx="98" cy="94" rx="14" ry="5" fill={dk(c1, 0.1)} />
        </S>
      );
    case 'k-jar-tapete-folha':
      // tapete de folha (no chão) com florzinhas
      return (
        <S w={230} h={90}>
          <path d="M8 46 C40 4 150 -2 222 44 C150 92 40 88 8 46 Z" fill={c1} />
          <path d="M20 46 C80 40 150 42 210 44" stroke={lt(c1, 0.35)} strokeWidth="5" fill="none" strokeLinecap="round" />
          {[50, 90, 130, 170].map((x, i) => (
            <g key={x}>
              <path d={`M${x} 44 Q${x + 14} ${30 - (i % 2) * 2} ${x + 30} 22`} stroke={lt(c1, 0.35)} strokeWidth="3.4" fill="none" strokeLinecap="round" />
              <path d={`M${x} 46 Q${x + 14} ${60 + (i % 2) * 2} ${x + 30} 68`} stroke={lt(c1, 0.35)} strokeWidth="3.4" fill="none" strokeLinecap="round" />
            </g>
          ))}
          <Flower x={36} y={66} r={9} c={c2} />
          <Flower x={196} y={20} r={8} c="#FFFFFF" />
        </S>
      );
    case 'k-jar-guirlanda':
      // trepadeira com folhinhas e flores (na parede)
      return (
        <S w={210} h={80}>
          <path d="M4 10 Q52 30 104 14 Q156 0 206 18" stroke="#5FAE5A" strokeWidth="4" fill="none" strokeLinecap="round" />
          {[
            [20, 16, 140],
            [40, 22, 30],
            [66, 22, 150],
            [88, 18, 20],
            [120, 12, 160],
            [144, 10, 30],
            [172, 12, 150],
            [194, 16, 40],
          ].map(([x, y, a], i) => (
            <Leaf key={i} x={x} y={y} l={18} a={a} c={i % 2 ? '#7CC765' : '#6CB85C'} />
          ))}
          {[
            [30, 20, 34],
            [104, 15, 46],
            [176, 13, 30],
          ].map(([x, y, end], i) => (
            <g key={i}>
              <path d={`M${x} ${y} Q${x + 4} ${(y + end) / 2} ${x} ${end}`} stroke="#5FAE5A" strokeWidth="2.4" fill="none" />
              <Leaf x={x} y={end - 6} l={12} a={30} c="#7CC765" />
            </g>
          ))}
          <Flower x={52} y={26} r={9} c={c1} />
          <Flower x={104} y={46} r={10} c={c2} />
          <Flower x={156} y={10} r={8} c={c1} />
          <Flower x={30} y={36} r={7} c={c2} />
          <Flower x={176} y={32} r={8} c="#FFFFFF" />
        </S>
      );
    default:
      return <ThemeKit2 id={id} c1={c1} c2={c2} />;
  }
}
