// Lá fora: o Hami no quintal, numa paisagem viva (céu que muda com a hora, nuvens andando,
// árvores, a casinha dele ao fundo, laguinho, flores e borboletas; de noite, estrelas e vagalumes).
// Ilustração plana própria, mais larga que a tela (arrasta para os lados como a casa).
import type { ReactNode } from 'react';
import type { Period } from '../data/lines';
import { prefersReducedMotion } from '../lib/util';

type Pal = { sky: [string, string]; far: string; hill1: string; hill2: string; ground: string; meadow: string; path: string; leaf: string; leaf2: string; leafHi: string; pine: string; trunk: string; water: string; sun: string; dim: number };

const PAL: Record<Period, Pal> = {
  manha: { sky: ['#7FCBFF', '#DDF4FF'], far: '#BFE6F5', hill1: '#A8E092', hill2: '#86D27A', ground: '#7FCF6E', meadow: '#9BDD82', path: '#F6E7B8', leaf: '#4FB063', leaf2: '#3E9E58', leafHi: '#7DD488', pine: '#3A9A5C', trunk: '#A0714F', water: '#7FD3F7', sun: '#FFE066', dim: 0 },
  tarde: { sky: ['#8EC5FF', '#FFE2BC'], far: '#C9DDF0', hill1: '#B3DE8C', hill2: '#8FD176', ground: '#86CF6C', meadow: '#A4DC80', path: '#F8E2B0', leaf: '#56B062', leaf2: '#449F55', leafHi: '#86D58A', pine: '#3F9A5A', trunk: '#A0714F', water: '#86CDF2', sun: '#FFC36B', dim: 0 },
  noite: { sky: ['#17204E', '#3B3C84'], far: '#2E3A72', hill1: '#2C5A5E', hill2: '#24504F', ground: '#2F6A55', meadow: '#377A5E', path: '#7C8AA8', leaf: '#2E6B55', leaf2: '#245A49', leafHi: '#3E8268', pine: '#1F4F45', trunk: '#5E4A52', water: '#3E5FA8', sun: '#FFF3C2', dim: 1 },
};

/** Árvore redonda (copa de três bolas) com tronco. */
function Tree({ x, y, s = 1, p }: { x: number; y: number; s?: number; p: Pal }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="2" rx="30" ry="6" fill="#000" opacity="0.1" />
      <path d="M-6 0 L-4 -40 Q0 -44 4 -40 L6 0Z" fill={p.trunk} />
      <circle cx="-20" cy="-52" r="24" fill={p.leaf2} />
      <circle cx="20" cy="-54" r="24" fill={p.leaf2} />
      <circle cx="0" cy="-74" r="30" fill={p.leaf} />
      <circle cx="-14" cy="-58" r="22" fill={p.leaf} />
      <circle cx="16" cy="-60" r="22" fill={p.leaf} />
      <circle cx="-10" cy="-84" r="11" fill={p.leafHi} opacity="0.8" />
      <circle cx="10" cy="-66" r="3" fill="#FF8FB8" />
      <circle cx="-18" cy="-60" r="3" fill="#FFE066" />
    </g>
  );
}

/** Pinheiro de três andares. */
function Pine({ x, y, s = 1, p }: { x: number; y: number; s?: number; p: Pal }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-4" y="-14" width="8" height="16" rx="2" fill={p.trunk} />
      <path d="M0 -96 L26 -50 H-26Z" fill={p.pine} />
      <path d="M0 -76 L32 -30 H-32Z" fill={p.pine} />
      <path d="M0 -56 L38 -10 H-38Z" fill={p.pine} />
      <path d="M0 -96 L10 -78 L-4 -70Z M0 -76 L12 -58 L-4 -52Z" fill="#FFFFFF" opacity="0.12" />
    </g>
  );
}

function Bush({ x, y, s = 1, p }: { x: number; y: number; s?: number; p: Pal }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="-18" cy="-12" r="16" fill={p.leaf2} />
      <circle cx="16" cy="-12" r="16" fill={p.leaf2} />
      <circle cx="0" cy="-22" r="20" fill={p.leaf} />
      <circle cx="-8" cy="-28" r="6" fill={p.leafHi} opacity="0.8" />
    </g>
  );
}

/** Florzinha de cinco pétalas. */
function Flower({ x, y, c, s = 1 }: { x: number; y: number; c: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 V10" stroke="#3E9E58" strokeWidth="2" strokeLinecap="round" />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy="-4.5" rx="3.4" ry="4.6" fill={c} transform={`rotate(${a})`} />
      ))}
      <circle r="2.6" fill="#FFD34D" />
    </g>
  );
}

/** A casinha do Hami lá no fundo: parede creme, telhado coral, porta redonda amarela. */
function Cottage({ x, y, p }: { x: number; y: number; p: Pal }) {
  const night = p.dim > 0;
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="4" rx="74" ry="9" fill="#000" opacity="0.1" />
      <rect x="-54" y="-70" width="108" height="72" rx="10" fill={night ? '#C9C4D6' : '#FFF4E2'} />
      <path d="M-68 -66 Q0 -132 68 -66 Q72 -58 62 -58 H-62 Q-72 -58 -68 -66Z" fill={night ? '#B05A62' : '#FF7F6E'} />
      <path d="M-50 -76 Q0 -118 50 -76" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="28" y="-120" width="14" height="30" rx="3" fill={night ? '#8E8AA6' : '#FFE0CC'} />
      <path d="M-14 2 V-24 Q-14 -40 0 -40 Q14 -40 14 -24 V2Z" fill={night ? '#C9A040' : '#FFC94D'} />
      <circle cx="8" cy="-18" r="2" fill="#8A5A3B" />
      <circle cx="-34" cy="-34" r="12" fill={night ? '#FFE9A0' : '#9FDBFF'} />
      <path d="M-34 -46 V-22 M-46 -34 H-22" stroke="#FFFFFF" strokeWidth="3" />
      <circle cx="34" cy="-34" r="12" fill={night ? '#FFE9A0' : '#9FDBFF'} />
      <path d="M34 -46 V-22 M22 -34 H46" stroke="#FFFFFF" strokeWidth="3" />
      <path d="M-46 -18 h24 M22 -18 h24" stroke={night ? '#9A8FB8' : '#FFB3C7'} strokeWidth="5" strokeLinecap="round" />
      {[-40, -30, 30, 40].map((fx) => (
        <circle key={fx} cx={fx} cy="-22" r="3" fill="#FF8FB8" />
      ))}
    </g>
  );
}

/** Cor do gramado da frente (a página do Início usa a mesma, para o chão se fundir com ela). */
export const outdoorGround = (period: Period) => PAL[period].ground;

export function Outdoors({ period = 'tarde', height = 430, children }: { period?: Period; height?: number; children?: ReactNode }) {
  const p = PAL[period];
  const night = p.dim > 0;
  const still = prefersReducedMotion();
  return (
    <div className={`outdoors ${night ? 'is-night' : ''} ${still ? 'is-still' : ''}`} style={{ height }}>
      <svg className="od-art" viewBox="0 0 740 430" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="od-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.sky[0]} />
            <stop offset="1" stopColor={p.sky[1]} />
          </linearGradient>
          <radialGradient id="od-sun">
            <stop offset="0.55" stopColor={p.sun} />
            <stop offset="1" stopColor={p.sun} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="740" height="430" fill="url(#od-sky)" />
        {/* sol ou lua, estrelas */}
        {night ? (
          <g>
            {[[60, 40], [140, 90], [230, 30], [330, 70], [420, 24], [520, 60], [640, 30], [700, 96], [600, 110], [90, 130]].map(([x, y], i) => (
              <circle key={i} className="od-star" style={{ animationDelay: `${(i % 5) * 0.6}s` }} cx={x} cy={y} r={i % 3 ? 1.6 : 2.4} fill="#FFFFFF" />
            ))}
            <circle cx="560" cy="70" r="26" fill="#FFF3C2" />
            <circle cx="572" cy="62" r="23" fill={p.sky[0]} />
          </g>
        ) : (
          <g>
            <circle cx="580" cy="78" r="58" fill="url(#od-sun)" opacity="0.6" />
            <circle cx="580" cy="78" r="30" fill={p.sun} />
          </g>
        )}
        {/* nuvens andando */}
        <g className="od-clouds" opacity={night ? 0.25 : 0.95}>
          <g className="od-cloud" style={{ animationDuration: '70s' }}>
            <ellipse cx="120" cy="80" rx="46" ry="16" fill="#FFFFFF" />
            <ellipse cx="140" cy="68" rx="26" ry="18" fill="#FFFFFF" />
          </g>
          <g className="od-cloud" style={{ animationDuration: '95s', animationDelay: '-30s' }}>
            <ellipse cx="380" cy="54" rx="56" ry="17" fill="#FFFFFF" />
            <ellipse cx="400" cy="40" rx="30" ry="20" fill="#FFFFFF" />
            <ellipse cx="364" cy="46" rx="20" ry="14" fill="#FFFFFF" />
          </g>
          <g className="od-cloud" style={{ animationDuration: '80s', animationDelay: '-55s' }}>
            <ellipse cx="660" cy="140" rx="40" ry="13" fill="#FFFFFF" />
            <ellipse cx="676" cy="130" rx="22" ry="14" fill="#FFFFFF" />
          </g>
        </g>
        {/* montanhas e morros */}
        <path d="M0 230 L80 170 L150 214 L240 150 L330 210 L420 160 L520 220 L610 168 L740 222 V300 H0Z" fill={p.far} />
        {!night && <path d="M240 150 L262 166 L250 170 L240 162 L228 170 L220 166Z M420 160 L440 175 L428 178 L420 172 L410 178 L402 174Z" fill="#FFFFFF" opacity="0.8" />}
        <path d="M0 262 Q90 214 190 246 T380 236 T560 244 T740 230 V320 H0Z" fill={p.hill1} />
        <path d="M0 290 Q120 254 250 280 T500 272 T740 268 V340 H0Z" fill={p.hill2} />
        {/* fileira de árvores ao fundo */}
        <Pine x={30} y={292} s={0.7} p={p} />
        <Pine x={70} y={286} s={0.85} p={p} />
        <Tree x={330} y={280} s={0.6} p={p} />
        <Pine x={420} y={282} s={0.7} p={p} />
        <Tree x={470} y={278} s={0.55} p={p} />
        <Pine x={700} y={282} s={0.8} p={p} />
        <Pine x={736} y={290} s={0.65} p={p} />
        {/* casinha do Hami com cerquinha */}
        <Cottage x={190} y={300} p={p} />
        <g stroke={night ? '#A9A6C2' : '#FFFFFF'} strokeWidth="5" strokeLinecap="round">
          {[96, 112, 128, 252, 268, 284].map((fx) => (
            <path key={fx} d={`M${fx} 306 V284`} />
          ))}
          <path d="M92 292 H132 M248 292 H288" strokeWidth="4" />
        </g>
        {/* gramado da frente com caminho */}
        <path d="M0 300 Q200 286 370 296 T740 294 V430 H0Z" fill={p.ground} />
        <path d="M190 302 Q220 330 300 350 Q370 368 370 430 H470 Q462 372 400 346 Q300 318 214 300Z" fill={p.path} opacity={night ? 0.5 : 1} />
        {[[230, 316], [282, 336], [352, 356], [412, 372], [438, 404]].map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx="9" ry="4" fill="#FFFFFF" opacity={night ? 0.15 : 0.45} />
        ))}
        {/* laguinho com vitórias-régias */}
        <g transform="translate(600 352)">
          <ellipse cx="0" cy="0" rx="78" ry="22" fill={night ? '#2B4A86' : '#5FB8E8'} />
          <ellipse cx="0" cy="-3" rx="72" ry="18" fill={p.water} />
          <path className="od-ripple" d="M-30 -4 q10 -4 20 0 M10 6 q10 -4 20 0" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M-46 2 a10 5 0 1 0 14 -6 L-40 0Z" fill="#4FB063" />
          <path d="M30 -6 a9 4.5 0 1 0 12 -5 L36 -6Z" fill="#4FB063" />
          <Flower x={-40} y={-2} c="#FFB3C7" s={0.8} />
        </g>
        {/* árvores grandes nas pontas (moldura) e arbustos */}
        <Tree x={44} y={372} s={1.25} p={p} />
        <Tree x={690} y={380} s={1.15} p={p} />
        <Bush x={120} y={400} s={1.1} p={p} />
        <Bush x={560} y={410} s={1} p={p} />
        <Bush x={470} y={300} s={0.6} p={p} />
        {/* cogumelos */}
        {[[150, 404, 1], [168, 410, 0.7]].map(([x, y, s], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <rect x="-4" y="-12" width="8" height="12" rx="3" fill="#FFF4E2" />
            <path d="M-13 -11 Q0 -28 13 -11Z" fill="#FF6F6F" />
            <circle cx="-4" cy="-17" r="2" fill="#FFFFFF" />
            <circle cx="5" cy="-14" r="1.6" fill="#FFFFFF" />
          </g>
        ))}
        {/* flores espalhadas */}
        {[
          [300, 318, '#FF8FB8'], [326, 384, '#FFFFFF'], [250, 396, '#FFD34D'], [212, 360, '#FF8FB8'], [480, 330, '#B9A3F0'], [508, 394, '#FFFFFF'],
          [530, 360, '#FF8FB8'], [96, 330, '#FFD34D'], [150, 350, '#FFFFFF'], [640, 404, '#FFD34D'], [700, 330, '#FF8FB8'], [410, 316, '#FFFFFF'],
        ].map(([x, y, c], i) => (
          <Flower key={i} x={x as number} y={y as number} c={c as string} s={0.9 + (i % 3) * 0.15} />
        ))}
        {/* tufinhos de grama */}
        {[[80, 420], [200, 418], [340, 412], [520, 424], [620, 418], [260, 340], [460, 352]].map(([x, y], i) => (
          <path key={i} d={`M${x - 6} ${y} q2 -10 4 0 q2 -14 4 0 q2 -9 4 0`} fill={p.leaf2} />
        ))}
        {/* borboletas de dia, vagalumes de noite */}
        {night
          ? [[120, 300], [260, 260], [400, 330], [520, 280], [640, 320], [330, 380], [580, 250]].map(([x, y], i) => (
              <circle key={i} className="od-firefly" style={{ animationDelay: `${i * 0.7}s` }} cx={x} cy={y} r="3" fill="#FFF07A" />
            ))
          : [[260, 250, '#FF9FC2', 0], [470, 230, '#FFD34D', 2.5], [600, 290, '#B9A3F0', 5]].map(([x, y, c, d], i) => (
              <g key={i} className="od-fly" style={{ animationDelay: `-${d}s` }}>
                <g transform={`translate(${x} ${y})`}>
                  <g className="od-wing">
                    <ellipse cx="-5" cy="-3" rx="6" ry="7" fill={c as string} />
                    <ellipse cx="5" cy="-3" rx="6" ry="7" fill={c as string} />
                    <ellipse cx="-4" cy="5" rx="4" ry="4.5" fill={c as string} opacity="0.85" />
                    <ellipse cx="4" cy="5" rx="4" ry="4.5" fill={c as string} opacity="0.85" />
                  </g>
                  <rect x="-1.2" y="-6" width="2.4" height="13" rx="1.2" fill="#3B2F45" />
                </g>
              </g>
            ))}
      </svg>
      {children && <div className="od-pet">{children}</div>}
    </div>
  );
}
