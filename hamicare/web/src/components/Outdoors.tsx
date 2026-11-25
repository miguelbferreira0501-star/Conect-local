// Lá fora: o Hami no quintal, numa paisagem viva (céu que muda com a hora, nuvens andando,
// árvores, a casinha dele ao fundo, laguinho, flores e borboletas; de noite, estrelas e vagalumes).
// Ilustração plana própria, mais larga que a tela (arrasta para os lados como a casa).
import type { ReactNode } from 'react';
import type { Period } from '../data/lines';
import { prefersReducedMotion } from '../lib/util';
import { BeachBall, Bench, Birch, Boat, Bush, Crab, Duck, Fence, Flower, Garden, Grass, Hive, Lamp, Lighthouse, Lounger, Mailbox, Mushroom, Palm, Penguin, Picnic, Pine, Rock, RoseArch, RoundTree, Shell, Sled, Snowman, SnowMound, Starfish, Sunflower, SwingTree, Tulip, TulipBed, Umbrella, Willow, Windmill, type YardPal } from './yardArt';

/** Largura do quintal (o Início mostra numa faixa que arrasta para os lados). */
export const OUTDOOR_W = 1300;

type Pal = YardPal;

const PAL: Record<Period, Pal> = {
  manha: { sky: ['#7FCBFF', '#DDF4FF'], far: '#BFE6F5', hill1: '#A8E092', hill2: '#86D27A', ground: '#7FCF6E', meadow: '#9BDD82', path: '#F6E7B8', leaf: '#4FB063', leaf2: '#3E9E58', leafHi: '#7DD488', pine: '#3A9A5C', trunk: '#A0714F', water: '#7FD3F7', sun: '#FFE066', dim: 0 },
  tarde: { sky: ['#8EC5FF', '#FFE2BC'], far: '#C9DDF0', hill1: '#B3DE8C', hill2: '#8FD176', ground: '#86CF6C', meadow: '#A4DC80', path: '#F8E2B0', leaf: '#56B062', leaf2: '#449F55', leafHi: '#86D58A', pine: '#3F9A5A', trunk: '#A0714F', water: '#86CDF2', sun: '#FFC36B', dim: 0 },
  noite: { sky: ['#17204E', '#3B3C84'], far: '#2E3A72', hill1: '#2C5A5E', hill2: '#24504F', ground: '#2F6A55', meadow: '#377A5E', path: '#7C8AA8', leaf: '#2E6B55', leaf2: '#245A49', leafHi: '#3E8268', pine: '#1F4F45', trunk: '#5E4A52', water: '#3E5FA8', sun: '#FFF3C2', dim: 1 },
};
/** Quintal de neve (casa de inverno ou arena das montanhas nevadas). */
const PAL_NEVE: Record<Period, Pal> = {
  manha: { sky: ['#9CC8F2', '#EAF5FF'], far: '#C3D4EE', hill1: '#E6EEF9', hill2: '#DCE6F4', ground: '#EEF3FB', meadow: '#FFFFFF', path: '#D2DCEC', leaf: '#3F8E6A', leaf2: '#2F7A5A', leafHi: '#FFFFFF', pine: '#2F7A5A', trunk: '#8A6A58', water: '#CDE6F7', sun: '#FFF1C2', dim: 0 },
  tarde: { sky: ['#A6C6F0', '#FFE9D6'], far: '#C6D2EC', hill1: '#E9EEF8', hill2: '#DFE6F3', ground: '#F0F3FA', meadow: '#FFFFFF', path: '#D6DCEA', leaf: '#3F8E6A', leaf2: '#2F7A5A', leafHi: '#FFFFFF', pine: '#2F7A5A', trunk: '#8A6A58', water: '#D0E6F6', sun: '#FFD9A0', dim: 0 },
  noite: { sky: ['#18204C', '#3A467E'], far: '#3D4E86', hill1: '#7383B4', hill2: '#6A7AAC', ground: '#8392BE', meadow: '#93A2CC', path: '#6E7AA0', leaf: '#2A5E4E', leaf2: '#22503F', leafHi: '#C9D4EE', pine: '#22503F', trunk: '#5E4A52', water: '#8FA8D6', sun: '#FFF3C2', dim: 1 },
};
/** Quintal de praia (casa de praia ou arena tropical). */
const PAL_PRAIA: Record<Period, Pal> = {
  manha: { sky: ['#6FCDFF', '#E3F7FF'], far: '#4FBDE3', hill1: '#F6E3B4', hill2: '#F1D8A0', ground: '#F3D9A0', meadow: '#F8E6BC', path: '#C98A5B', leaf: '#3FA866', leaf2: '#2F9058', leafHi: '#7FD8A6', pine: '#2F9058', trunk: '#B07A4F', water: '#5FD0E8', sun: '#FFE066', dim: 0 },
  tarde: { sky: ['#7CC4FF', '#FFE2BC'], far: '#55B6E0', hill1: '#F6E0AE', hill2: '#F0D49A', ground: '#F2D69A', meadow: '#F7E3B6', path: '#C98A5B', leaf: '#3FA866', leaf2: '#2F9058', leafHi: '#7FD8A6', pine: '#2F9058', trunk: '#B07A4F', water: '#62CBE6', sun: '#FFC36B', dim: 0 },
  noite: { sky: ['#17204E', '#3B3C84'], far: '#2E5A86', hill1: '#8E7E60', hill2: '#837456', ground: '#8A7A5C', meadow: '#978868', path: '#6E5246', leaf: '#2A5A48', leaf2: '#224C3C', leafHi: '#3E7A62', pine: '#224C3C', trunk: '#6E5040', water: '#3E6FA8', sun: '#FFF3C2', dim: 1 },
};
export type YardTheme = 'prado' | 'jardim' | 'neve' | 'praia';
const palOf = (theme: YardTheme, period: Period) => (theme === 'neve' ? PAL_NEVE : theme === 'praia' ? PAL_PRAIA : PAL)[period];


/** A casinha do Hami lá no fundo: parede creme, telhado coral, porta redonda amarela. */
function Cottage({ x, y, p, theme = 'prado' }: { x: number; y: number; p: Pal; theme?: YardTheme }) {
  const night = p.dim > 0;
  const roof = theme === 'praia' ? (night ? '#3E7A8A' : '#3CC6C9') : night ? '#B05A62' : '#FF7F6E';
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="4" rx="74" ry="9" fill="#000" opacity="0.1" />
      <rect x="-54" y="-70" width="108" height="72" rx="10" fill={night ? '#C9C4D6' : '#FFF4E2'} />
      <path d="M-68 -66 Q0 -132 68 -66 Q72 -58 62 -58 H-62 Q-72 -58 -68 -66Z" fill={roof} />
      {theme === 'neve' && <path d="M-70 -64 Q0 -134 70 -64 Q60 -70 52 -62 Q44 -72 34 -64 Q22 -74 10 -66 Q-2 -76 -14 -66 Q-26 -74 -36 -64 Q-46 -72 -54 -62 Q-62 -70 -70 -64Z" fill="#FFFFFF" />}
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

/** Chão da Lua (a página do Início usa a mesma cor quando a casa é na Lua). */
export const MOON_GROUND = '#A9AEC6';

/** Cor do gramado da frente (a página do Início usa a mesma, para o chão se fundir com ela). */
export const outdoorGround = (period: Period, moon = false, theme: YardTheme = 'prado') => (moon ? MOON_GROUND : palOf(theme, period).ground);

/** Lá fora na Lua: céu de estrelas, a Terra enorme, a base lunar (a casa do Hami) ao fundo, crateras, foguete e bandeira. */
export function MoonOutdoors({ height = 430, children }: { height?: number; children?: ReactNode }) {
  const still = prefersReducedMotion();
  const stars = Array.from({ length: 46 }, (_, i) => [((i * 157) % 740) + ((i * 7) % 11), ((i * 89) % 230) + 6, i % 4 === 0 ? 2.2 : i % 3 ? 1.2 : 1.7]);
  return (
    <div className={`outdoors is-night is-moon ${still ? 'is-still' : ''}`} style={{ height, background: '#0D1030' }}>
      <svg className="od-art" viewBox="0 0 740 430" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="mo-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#090B26" />
            <stop offset="0.7" stopColor="#1E2257" />
            <stop offset="1" stopColor="#2E3170" />
          </linearGradient>
          <radialGradient id="mo-earth" cx="40%" cy="35%" r="70%">
            <stop offset="0" stopColor="#8FD3FF" />
            <stop offset="0.7" stopColor="#3E8FE0" />
            <stop offset="1" stopColor="#2A5FB0" />
          </radialGradient>
          <radialGradient id="mo-glow">
            <stop offset="0.6" stopColor="#7FC4FF" stopOpacity="0.35" />
            <stop offset="1" stopColor="#7FC4FF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mo-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#C9CDE0" />
            <stop offset="1" stopColor={MOON_GROUND} />
          </linearGradient>
          <linearGradient id="mo-dome" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F4F6FF" />
            <stop offset="1" stopColor="#B9BEDA" />
          </linearGradient>
          <radialGradient id="mo-glass" cx="35%" cy="30%" r="80%">
            <stop offset="0" stopColor="#FFF6C9" />
            <stop offset="1" stopColor="#FFC870" />
          </radialGradient>
        </defs>
        <rect width="740" height="430" fill="url(#mo-sky)" />
        {stars.map(([x, y, r], i) => (
          <circle key={i} className="od-star" style={{ animationDelay: `${(i % 7) * 0.5}s` }} cx={x} cy={y} r={r} fill="#FFFFFF" />
        ))}
        {/* estrela cadente */}
        <path className="mo-shoot" d="M520 40 l-70 26" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
        {/* a Terra */}
        <circle cx="600" cy="92" r="78" fill="url(#mo-glow)" />
        <circle cx="600" cy="92" r="48" fill="url(#mo-earth)" />
        <path d="M570 70 q14 -10 26 0 q8 10 -4 18 q-14 6 -10 18 q-16 -6 -12 -36Z M612 104 q12 -4 20 4 q-2 14 -14 18 q-10 -10 -6 -22Z M616 58 q12 0 20 10 q-12 4 -20 -10Z" fill="#6FCF7C" />
        <path d="M556 92 a44 44 0 0 0 88 0 a48 48 0 0 1 -88 0Z" fill="#1E4A8F" opacity="0.35" />
        <ellipse cx="584" cy="70" rx="14" ry="7" fill="#FFFFFF" opacity="0.35" transform="rotate(-25 584 70)" />
        {/* planetinha com anel */}
        <g transform="translate(110 78)">
          <circle r="16" fill="#FFB3CF" />
          <ellipse rx="28" ry="7" fill="none" stroke="#FFE07A" strokeWidth="3" transform="rotate(-18)" />
        </g>
        {/* morros lunares ao fundo */}
        <path d="M0 250 Q80 214 170 236 Q260 206 360 232 Q460 204 560 230 Q650 210 740 228 V300 H0Z" fill="#7C82A8" />
        <path d="M0 272 Q120 246 240 264 Q380 240 520 262 Q640 246 740 258 V320 H0Z" fill="#9499BC" />
        {/* a base lunar: a casa do Hami */}
        <g transform="translate(212 300)">
          <ellipse cx="0" cy="2" rx="96" ry="12" fill="#000" opacity="0.18" />
          <rect x="-96" y="-18" width="192" height="20" rx="8" fill="#9EA4C4" />
          <path d="M-86 -16 A86 76 0 0 1 86 -16Z" fill="url(#mo-dome)" />
          <path d="M-86 -16 A86 76 0 0 1 86 -16" fill="none" stroke="#8E94B8" strokeWidth="3" />
          <path d="M-60 -16 A60 66 0 0 1 0 -88 M60 -16 A60 66 0 0 0 0 -88 M-86 -40 H86" stroke="#C6CAE2" strokeWidth="2.5" fill="none" />
          {/* janelas redondas acesas */}
          {[[-48, -40], [0, -54], [48, -40]].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="13" fill="#7A80A6" />
              <circle cx={x} cy={y} r="10" fill="url(#mo-glass)" />
              <circle cx={x - 3} cy={y - 3} r="3" fill="#FFFFFF" opacity="0.7" />
            </g>
          ))}
          {/* porta */}
          <path d="M-14 0 V-22 a14 14 0 0 1 28 0 V0Z" fill="#FF8FB1" />
          <circle cx="0" cy="-22" r="6" fill="#FFE2EC" />
          {/* antena */}
          <path d="M40 -76 L52 -104" stroke="#8E94B8" strokeWidth="3" />
          <circle cx="53" cy="-106" r="5" className="mo-blink" fill="#FF6F91" />
          {/* túnel até a garagem do foguete */}
          <rect x="86" y="-14" width="60" height="16" rx="8" fill="#B4B9D6" />
          <path d="M98 -14 v16 M114 -14 v16 M130 -14 v16" stroke="#9EA4C4" strokeWidth="2" />
        </g>
        {/* foguete */}
        <g transform="translate(400 300)">
          <ellipse cx="0" cy="2" rx="34" ry="6" fill="#000" opacity="0.18" />
          <path className="mo-flame" d="M-8 -6 Q0 22 8 -6Z" fill="#FFB347" opacity="0" />
          <path d="M-18 -6 L-30 2 L-22 -26Z M18 -6 L30 2 L22 -26Z" fill="#FF6F91" />
          <path d="M0 -108 C22 -86 24 -40 18 -6 H-18 C-24 -40 -22 -86 0 -108Z" fill="#F7F8FF" />
          <path d="M0 -108 C10 -98 15 -88 17 -78 H-17 C-15 -88 -10 -98 0 -108Z" fill="#FF6F91" />
          <circle cx="0" cy="-54" r="11" fill="#8E94B8" />
          <circle cx="0" cy="-54" r="8" fill="#8FD3FF" />
          <circle cx="-3" cy="-57" r="2.5" fill="#FFFFFF" opacity="0.8" />
        </g>
        {/* chão da Lua com crateras */}
        <path d="M0 300 Q200 286 370 296 T740 292 V430 H0Z" fill="url(#mo-ground)" />
        {[[90, 340, 40, 10], [300, 410, 58, 13], [520, 350, 44, 10], [660, 404, 52, 12], [180, 392, 26, 7], [620, 322, 22, 5], [440, 384, 20, 5]].map(([x, y, rx, ry], i) => (
          <g key={i}>
            <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#8E93B2" />
            <ellipse cx={x} cy={y + ry * 0.25} rx={rx * 0.82} ry={ry * 0.7} fill="#9DA2C0" />
            <path d={`M${x - rx} ${y} A${rx} ${ry} 0 0 0 ${x + rx} ${y}`} fill="none" stroke="#D5D8EA" strokeWidth="2" opacity="0.7" />
          </g>
        ))}
        {/* pedrinhas */}
        {[[40, 380], [250, 330], [470, 322], [560, 420], [720, 360], [150, 312]].map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx={7 + (i % 3) * 3} ry={4 + (i % 2) * 2} fill="#8A8FAE" />
        ))}
        {/* bandeirinha do Hami */}
        <g transform="translate(560 318)">
          <path d="M0 0 V-46" stroke="#C6CAE2" strokeWidth="3" />
          <path className="mo-flag" d="M0 -46 h30 l-6 9 6 9 h-30Z" fill="#FF8FB1" />
          <path d="M12 -38 c-3 -3 -7 0 -3 4 l3 3 3 -3 c4 -4 0 -7 -3 -4Z" fill="#FFFFFF" />
        </g>
        {/* pegadinhas no chão */}
        {[[300, 350], [318, 362], [336, 352], [354, 366], [372, 356]].map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx="5" ry="2.6" fill="#8E93B2" opacity="0.7" />
        ))}
      </svg>
      {children && <div className="od-pet">{children}</div>}
    </div>
  );
}

export function Outdoors({ period = 'tarde', height = 430, children, theme = 'prado' }: { period?: Period; height?: number; children?: ReactNode; theme?: YardTheme }) {
  const p = palOf(theme, period);
  const night = p.dim > 0;
  const still = prefersReducedMotion();
  const snow = theme === 'neve';
  const beach = theme === 'praia';
  const garden = theme === 'jardim';
  const green = !snow && !beach;
  const W = OUTDOOR_W;
  const flowers: [number, number, string][] = [
    [96, 352, '#FF8FB8'], [180, 396, '#FFFFFF'], [228, 418, '#FFD34D'], [344, 330, '#FF8FB8'], [390, 382, '#B9A3F0'], [452, 410, '#FFFFFF'],
    [560, 352, '#FFD34D'], [596, 404, '#FF8FB8'], [716, 338, '#FFFFFF'], [742, 410, '#B9A3F0'], [880, 336, '#FF8FB8'], [960, 412, '#FFD34D'],
    [1046, 400, '#FFFFFF'], [1104, 420, '#FF8FB8'], [1236, 400, '#FFD34D'], [1290, 376, '#B9A3F0'], [30, 330, '#FFD34D'], [640, 330, '#B9A3F0'],
  ];
  const tufts: [number, number][] = [[70, 424], [200, 420], [316, 414], [470, 428], [610, 420], [700, 426], [820, 424], [990, 426], [1130, 426], [1250, 420], [260, 344], [430, 352], [780, 350], [940, 352], [1160, 332]];
  /** Árvore do tema: redonda no prado, pinheiro com neve, coqueiro na praia. */
  const tree = (x: number, y: number, s: number, fruit?: string) =>
    snow ? <Pine key={`t${x}`} x={x} y={y} s={s * 1.05} p={p} snow /> : beach ? <Palm key={`t${x}`} x={x} y={y} s={s * 0.85} p={p} flip={x > 650} /> : <RoundTree key={`t${x}`} x={x} y={y} s={s} p={p} fruit={fruit} />;
  return (
    <div className={`outdoors ${night ? 'is-night' : ''} ${still ? 'is-still' : ''}`} style={{ height, background: p.sky[0] }}>
      <svg className="od-art" viewBox={`0 0 ${W} 430`} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="od-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.sky[0]} />
            <stop offset="1" stopColor={p.sky[1]} />
          </linearGradient>
          <radialGradient id="od-sun">
            <stop offset="0.55" stopColor={p.sun} />
            <stop offset="1" stopColor={p.sun} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="od-haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.sky[1]} stopOpacity="0" />
            <stop offset="1" stopColor={p.sky[1]} stopOpacity={night ? 0.15 : 0.55} />
          </linearGradient>
        </defs>
        <rect width={W} height="430" fill="url(#od-sky)" />
        {/* sol ou lua, estrelas */}
        {night ? (
          <g>
            {Array.from({ length: 26 }, (_, i) => [((i * 211) % W) + 10, ((i * 67) % 150) + 14] as const).map(([x, y], i) => (
              <circle key={i} className="od-star" style={{ animationDelay: `${(i % 5) * 0.6}s` }} cx={x} cy={y} r={i % 3 ? 1.6 : 2.4} fill="#FFFFFF" />
            ))}
            <circle cx="1010" cy="74" r="28" fill="#FFF3C2" />
            <circle cx="1022" cy="66" r="25" fill={p.sky[0]} />
          </g>
        ) : (
          <g>
            <circle cx="1010" cy="80" r="70" fill="url(#od-sun)" opacity="0.6" />
            <circle cx="1010" cy="80" r="32" fill={p.sun} />
          </g>
        )}
        {/* nuvens andando e passarinhos (gaivotas na praia) */}
        <g opacity={night ? 0.25 : snow ? 0.85 : 0.95}>
          {[
            [120, 80, 1, '90s', '0s'],
            [420, 54, 1.2, '120s', '-40s'],
            [760, 120, 0.8, '100s', '-70s'],
            [1100, 150, 0.9, '110s', '-20s'],
            [1240, 60, 1.1, '130s', '-90s'],
          ].map(([x, y, s, d, dl], i) => (
            <g key={i} className="od-cloud od-cloud-wide" style={{ animationDuration: d as string, animationDelay: dl as string }}>
              <g transform={`translate(${x} ${y}) scale(${s})`}>
                <ellipse cx="0" cy="0" rx="50" ry="16" fill="#FFFFFF" />
                <ellipse cx="18" cy="-12" rx="28" ry="19" fill="#FFFFFF" />
                <ellipse cx="-18" cy="-6" rx="20" ry="14" fill="#FFFFFF" />
              </g>
            </g>
          ))}
        </g>
        {!night &&
          !snow &&
          [
            [300, 120, 0],
            [330, 108, 0.4],
            [860, 90, 1.2],
          ].map(([x, y, d], i) => (
            <g key={i} className="od-bird" style={{ animationDelay: `-${d}s` }}>
              <path d={`M${x - 8} ${y} q4 -5 8 0 q4 -5 8 0`} stroke={beach ? '#FFFFFF' : '#4E5570'} strokeWidth="2" fill="none" strokeLinecap="round" />
            </g>
          ))}
        {beach ? (
          <>
            {/* mar até o horizonte, ilhas e barquinho */}
            <path d="M120 214 Q170 186 230 214Z M880 214 Q950 176 1040 214Z" fill={night ? '#2B5A4E' : '#5FB98A'} />
            <rect x="0" y="212" width={W} height="110" fill={p.far} />
            <rect x="0" y="212" width={W} height="6" fill="#FFFFFF" opacity="0.35" />
            {[236, 252, 270].map((yy, k) => (
              <path key={yy} className="wave-bob" style={{ animationDelay: `-${k}s` }} d={Array.from({ length: 14 }, (_, j) => `M${40 + j * 92 + k * 30} ${yy} q10 -4 20 0`).join(' ')} stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            ))}
            <Boat x={420} y={240} s={0.9} />
          </>
        ) : (
          <>
            {/* montanhas com neve e cachoeira (congelada no inverno) */}
            <path d="M0 232 L70 186 L140 222 L230 148 L320 214 L420 168 L520 222 L640 160 L760 218 L860 172 L960 222 L1080 156 L1190 216 L1300 180 V310 H0Z" fill={p.far} />
            {(!night || snow) && (
              <path
                d={snow ? 'M70 186 L92 200 L70 196 L50 200Z M230 148 L262 172 L246 176 L230 166 L214 176 L198 172Z M420 168 L446 186 L420 182 L396 186Z M640 160 L670 182 L654 186 L640 176 L626 186 L610 182Z M860 172 L884 188 L860 184 L838 188Z M1080 156 L1110 178 L1094 182 L1080 172 L1066 182 L1050 178Z M1300 180 L1276 196 L1300 192Z' : 'M230 148 L252 166 L242 170 L230 162 L218 170 L210 166Z M640 160 L662 177 L650 180 L640 172 L630 180 L620 176Z M1080 156 L1102 173 L1090 176 L1080 168 L1070 176 L1060 172Z'}
                fill="#FFFFFF"
                opacity={night ? 0.7 : 0.9}
              />
            )}
            <path d="M226 172 Q222 210 230 250 L246 250 Q240 210 238 172Z" fill={snow ? '#E8F6FF' : night ? '#6C86C4' : '#E8F7FF'} />
            {!snow && <path className="od-fall" d="M232 176 V250 M240 176 V250" stroke={night ? '#9FB4E8' : '#FFFFFF'} strokeWidth="2.4" strokeDasharray="10 12" />}
            {snow && <path d="M228 178 L230 196 L232 178Z M236 180 L238 204 L240 180Z" fill="#BFE0F5" />}
          </>
        )}
        <rect width={W} height="430" fill="url(#od-haze)" />
        {/* morros do fundo (dunas na praia) */}
        <path d={beach ? 'M0 300 Q120 276 260 290 T520 284 T780 290 T1040 282 T1300 288 V340 H0Z' : 'M0 262 Q120 214 260 246 T520 236 T780 244 T1040 232 T1300 240 V330 H0Z'} fill={p.hill1} />
        {!beach &&
          Array.from({ length: 30 }, (_, i) => {
            const x = 10 + i * 44 + ((i * 13) % 17);
            if (x > 190 && x < 290) return null;
            const y = 246 - Math.sin(i * 0.9) * 8;
            return snow ? (
              <g key={i} opacity={night ? 0.7 : 0.55}>
                <path d={`M${x} ${y - 26 - (i % 3) * 5} L${x + 13} ${y + 6} H${x - 13}Z`} fill={p.leaf2} />
                <path d={`M${x} ${y - 26 - (i % 3) * 5} L${x + 5} ${y - 14 - (i % 3) * 5} H${x - 5}Z`} fill="#FFFFFF" />
              </g>
            ) : (
              <circle key={i} cx={x} cy={y} r={14 + (i % 3) * 4} fill={p.leaf2} opacity={night ? 0.6 : 0.45} />
            );
          })}
        {beach ? <Lighthouse x={1100} y={226} s={0.9} night={night} /> : <Windmill x={1080} y={250} s={0.8} night={night} />}
        {snow && <path d="M1066 182 Q1080 170 1094 182Z" fill="#FFFFFF" transform="translate(-8 50) scale(1)" />}
        <path d={beach ? 'M0 304 Q160 290 330 300 T660 296 T990 300 T1300 294 V340 H0Z' : 'M0 292 Q160 256 330 282 T660 274 T990 280 T1300 270 V340 H0Z'} fill={p.hill2} />
        {/* fileira de árvores ao fundo */}
        {beach ? (
          <>
            <Palm x={40} y={304} s={0.55} p={p} />
            <Palm x={330} y={300} s={0.5} p={p} flip />
            <Palm x={700} y={298} s={0.48} p={p} />
            <Palm x={930} y={300} s={0.5} p={p} flip />
            <Palm x={1270} y={300} s={0.55} p={p} flip />
          </>
        ) : (
          <>
            <Pine x={20} y={300} s={0.75} p={p} snow={snow} />
            <Pine x={60} y={292} s={0.9} p={p} snow={snow} />
            {snow ? <Pine x={150} y={296} s={0.65} p={p} snow /> : <RoundTree x={150} y={296} s={0.6} p={p} sway={false} />}
            {snow ? <Pine x={330} y={292} s={0.7} p={p} snow /> : <Birch x={330} y={292} s={0.7} p={p} />}
            <Pine x={372} y={288} s={0.7} p={p} snow={snow} />
            {snow ? <Pine x={640} y={286} s={0.6} p={p} snow /> : <RoundTree x={640} y={286} s={0.55} p={p} sway={false} />}
            {snow ? <Pine x={700} y={284} s={0.62} p={p} snow /> : <Birch x={700} y={284} s={0.65} p={p} />}
            <Pine x={900} y={290} s={0.75} p={p} snow={snow} />
            {snow ? <Pine x={950} y={292} s={0.6} p={p} snow /> : <RoundTree x={950} y={292} s={0.6} p={p} sway={false} />}
            <Pine x={1240} y={286} s={0.85} p={p} snow={snow} />
            <Pine x={1290} y={292} s={0.7} p={p} snow={snow} />
          </>
        )}
        {/* campo de lavanda (prado e jardim) */}
        {green &&
          [0, 1, 2, 3].map((r) => (
            <path key={r} d={`M${1150 + r * 6} ${300 + r * 8} Q1220 ${292 + r * 8} 1300 ${296 + r * 8}`} stroke={night ? '#6C5A9E' : garden ? '#FF9FC2' : '#B99AF0'} strokeWidth="6" strokeLinecap="round" strokeDasharray="3 5" fill="none" />
          ))}
        {/* gramado (neve, areia) da frente */}
        <path d="M0 300 Q300 286 650 296 T1300 294 V430 H0Z" fill={p.ground} />
        <path d="M0 336 Q260 322 520 332 T1040 330 T1300 334 V430 H0Z" fill={p.meadow} opacity={snow ? 0.7 : 0.35} />
        {/* riacho com ponte (congelado no inverno); na praia, a torre do salva-vidas */}
        {beach ? (
          <g transform="translate(262 372)">
            <rect x="-26" y="-74" width="52" height="8" rx="3" fill="#E46F5F" />
            <path d="M-22 -66 L-28 0 M22 -66 L28 0 M-25 -36 H25 M-27 -14 H27" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
            <path d="M-28 -74 Q0 -98 28 -74Z" fill="#FFD34D" />
            <rect x="-2" y="-112" width="3" height="26" fill="#8B5A35" />
            <path d="M1 -112 L22 -106 L1 -100Z" fill="#E2453C" />
          </g>
        ) : (
          <>
            <path d="M228 250 Q214 280 240 300 Q270 322 236 350 Q200 380 230 430 H300 Q272 386 302 352 Q330 320 298 296 Q270 276 250 250Z" fill={snow ? '#B9D7EE' : night ? '#2B4A86' : '#5FB8E8'} />
            <path d="M236 262 Q228 284 252 300 Q280 322 248 350 Q218 380 244 430 H286 Q262 384 290 352 Q316 322 286 298 Q262 280 246 262Z" fill={p.water} />
            {snow ? (
              <path d="M246 296 l14 6 M256 344 l-12 10 M250 392 l10 8" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" opacity="0.9" />
            ) : (
              <path className="od-flow" d="M244 300 q12 8 0 18 M262 348 q-10 10 2 20 M254 392 q-6 10 4 20" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeDasharray="6 10" />
            )}
            <Rock x={212} y={300} s={0.7} c={snow ? '#C9D2E0' : undefined} />
            <Rock x={312} y={360} s={0.8} c={snow ? '#C9D2E0' : undefined} />
            <Rock x={206} y={410} s={0.9} c={snow ? '#C9D2E0' : undefined} />
            <g transform="translate(266 346)">
              <path d="M-46 6 Q0 -26 46 6 L46 14 Q0 -16 -46 14Z" fill={night ? '#8A6A58' : '#C98A5B'} />
              {Array.from({ length: 9 }, (_, i) => (
                <path key={i} d={`M${-40 + i * 10} ${8 - Math.sin(((i + 0.5) / 9) * Math.PI) * 18} v8`} stroke={night ? '#6E5246' : '#A9713F'} strokeWidth="2" />
              ))}
              <path d="M-46 -4 Q0 -36 46 -4" stroke={night ? '#8A6A58' : '#C98A5B'} strokeWidth="3.4" fill="none" />
              {snow && <path d="M-46 -6 Q0 -38 46 -6" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />}
              {[-40, -20, 0, 20, 40].map((xx) => (
                <path key={xx} d={`M${xx} ${-4 - Math.cos((xx / 46) * (Math.PI / 2)) * 26} V${8 - Math.cos((xx / 46) * (Math.PI / 2)) * 18}`} stroke={night ? '#8A6A58' : '#C98A5B'} strokeWidth="3" />
              ))}
            </g>
          </>
        )}
        {/* à esquerda: pomar com colmeia (pinheiros no inverno, coqueiros na praia) */}
        {tree(70, 340, 0.85, '#FF6F6F')}
        {tree(150, 330, 0.7, '#FFB347')}
        {green && <Hive x={108} y={276} />}
        {/* casinha com cerquinha, caixa de correio e poste */}
        <Cottage x={500} y={304} p={p} theme={theme} />
        <Fence x={386} y={318} n={4} night={night} />
        <Fence x={566} y={318} n={4} night={night} />
        <Mailbox x={640} y={320} />
        <Lamp x={420} y={340} night={night} />
        {/* caminho até a frente (passarela de madeira na praia) */}
        <path d="M486 306 Q520 336 590 356 Q650 374 640 430 H730 Q730 370 660 346 Q580 322 516 304Z" fill={p.path} opacity={night ? 0.5 : 1} />
        {beach
          ? [318, 332, 346, 360, 376, 392, 410].map((yy, k) => <path key={yy} d={`M${516 + k * 24 - 26} ${yy} l46 ${2 + k}`} stroke="#A9713F" strokeWidth="2" opacity="0.6" />)
          : [[512, 316], [560, 336], [610, 352], [664, 372], [690, 404]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="9" ry="4" fill="#FFFFFF" opacity={night ? 0.15 : 0.45} />)}
        {garden && <RoseArch x={548} y={346} s={0.9} night={night} />}
        {/* meio da direita: horta (prado), canteiros de tulipas (jardim), bonecos de neve (inverno), guarda-sóis (praia) */}
        {snow ? (
          <>
            <Snowman x={800} y={356} s={1} />
            <Snowman x={860} y={350} s={0.7} scarf="#5B8DEF" hat="#E2547A" />
            {[[900, 360], [912, 364], [906, 354]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="6" fill="#FFFFFF" />
            ))}
            <SnowMound x={950} y={360} s={1} holly />
          </>
        ) : beach ? (
          <>
            <Umbrella x={800} y={356} s={0.9} />
            <Lounger x={860} y={360} s={0.9} />
            <Umbrella x={950} y={350} s={0.75} c="#3CC6C9" c2="#FFE27A" />
            <BeachBall x={900} y={372} />
            <Shell x={772} y={370} />
          </>
        ) : garden ? (
          <>
            <TulipBed x={760} y={322} n={9} colors={['#FF7FA0', '#FFD34D', '#B48CFF', '#FF9D5C']} />
            <TulipBed x={770} y={346} n={9} colors={['#FFFFFF', '#FF7FA0', '#FFB3CF']} />
            <TulipBed x={780} y={370} n={8} colors={['#FF9D5C', '#B48CFF', '#FFD34D']} />
          </>
        ) : (
          <Garden x={760} y={316} p={p} night={night} />
        )}
        {/* lago (congelado com pinguins no inverno; piscina natural com caranguejo na praia) e banquinho */}
        <Bench x={1066} y={334} night={night} />
        <g transform="translate(1150 372)">
          <ellipse cx="0" cy="0" rx="96" ry="26" fill={snow ? '#B9D7EE' : beach ? (night ? '#2B4A86' : '#3FB4D8') : night ? '#2B4A86' : '#5FB8E8'} />
          <ellipse cx="0" cy="-3" rx="88" ry="21" fill={p.water} />
          {snow ? (
            <>
              <path d="M-50 -6 q20 -10 40 0 t40 0 M-30 6 q16 -8 32 0" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.9" />
              <Penguin x={-20} y={2} />
              <Penguin x={18} y={-2} s={0.8} flip />
            </>
          ) : beach ? (
            <>
              <path className="od-ripple" d="M-40 -4 q10 -4 20 0 M10 6 q10 -4 20 0" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="2" fill="none" strokeLinecap="round" />
              <Rock x={-70} y={10} s={0.8} c="#C9BFA9" />
              <Rock x={76} y={6} s={0.7} c="#C9BFA9" />
            </>
          ) : (
            <>
              <path className="od-ripple" d="M-40 -4 q10 -4 20 0 M10 6 q10 -4 20 0 M40 -8 q8 -3 16 0" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M-60 2 a10 5 0 1 0 14 -6 L-54 0Z M46 -8 a9 4.5 0 1 0 12 -5 L52 -8Z" fill="#4FB063" />
              <Flower x={-54} y={-2} c="#FFB3C7" s={0.8} />
              <Duck x={-6} y={-2} />
              <Duck x={18} y={4} s={0.7} />
              {[-80, -72, 76, 84].map((rx) => (
                <path key={rx} d={`M${rx} 10 q-2 -18 2 -26`} stroke="#4E9A4A" strokeWidth="3" fill="none" strokeLinecap="round" />
              ))}
            </>
          )}
        </g>
        {beach && <Crab x={1060} y={404} />}
        {beach && <Starfish x={1236} y={410} />}
        {snow ? <Pine x={1250} y={362} s={1.05} p={p} snow /> : beach ? <Palm x={1250} y={360} s={0.9} p={p} flip /> : <Willow x={1250} y={360} s={0.95} p={p} />}
        {snow ? <Pine x={1000} y={392} s={1.1} p={p} snow /> : beach ? <Palm x={1000} y={392} s={0.95} p={p} /> : <SwingTree x={1000} y={392} s={0.85} p={p} />}
        {green && [0, 1, 2].map((i) => <Sunflower key={i} x={946 + i * 22} y={350 + (i % 2) * 8} s={0.9 - i * 0.05} h={56 + (i % 2) * 10} />)}
        {/* piquenique (trenó com presentes no inverno, toalha e boia na praia) */}
        {snow ? (
          <Sled x={856} y={404} s={1.1} />
        ) : beach ? (
          <g transform="translate(856 404)">
            <path d="M-50 0 L-30 -24 H44 L58 0Z" fill="#5B8DEF" />
            {[-34, -14, 6, 26, 46].map((xx) => (
              <path key={xx} d={`M${xx} 0 L${xx + 8} -24`} stroke="#FFFFFF" strokeWidth="5" opacity="0.85" />
            ))}
            <g transform="translate(14 -14)">
              <circle r="11" fill="#FF8A7A" />
              <circle r="5" fill={p.ground} />
              <path d="M-11 0 H-5 M5 0 H11 M0 -11 V-5 M0 5 V11" stroke="#FFFFFF" strokeWidth="3" />
            </g>
          </g>
        ) : (
          <Picnic x={856} y={404} />
        )}
        {/* moldura: árvores grandes nas pontas, moitas, pedras */}
        {tree(26, 420, 1.35)}
        {snow ? (
          <>
            <SnowMound x={150} y={424} s={1.2} holly />
            <SnowMound x={372} y={428} s={1} />
            <SnowMound x={940} y={430} s={1} holly />
            <SnowMound x={1180} y={430} s={1.1} />
          </>
        ) : (
          <>
            <Bush x={150} y={424} s={1.1} p={p} berry={beach ? undefined : '#E2547A'} />
            <Bush x={372} y={428} s={0.95} p={p} />
            <Bush x={940} y={430} s={0.9} p={p} berry={beach ? undefined : '#5B8DEF'} />
            <Bush x={1180} y={430} s={1.05} p={p} />
          </>
        )}
        <Rock x={520} y={422} s={0.8} c={snow ? '#C9D2E0' : beach ? '#C9BFA9' : undefined} />
        <Rock x={1290} y={430} s={1.1} c={snow ? '#C9D2E0' : beach ? '#C9BFA9' : undefined} />
        {green && (
          <>
            <Mushroom x={176} y={402} />
            <Mushroom x={192} y={408} s={0.7} c="#FF9F4D" />
            <Mushroom x={1210} y={410} s={0.8} />
          </>
        )}
        {/* chão: flores (prado e jardim), conchas e estrelas (praia), brilhinhos de neve (inverno) */}
        {green && flowers.map(([x, y, c], i) => <Flower key={i} x={x} y={y} c={c} s={0.9 + (i % 3) * 0.15} />)}
        {garden && flowers.map(([x, y], i) => <Flower key={`g${i}`} x={x + 22} y={y + 6} c={['#FF7FA0', '#FFD34D', '#FFFFFF', '#B48CFF'][i % 4]} s={0.8} />)}
        {beach && flowers.map(([x, y], i) => (i % 3 === 0 ? <Starfish key={i} x={x} y={y + 6} s={0.7} c={i % 2 ? '#FF9A6B' : '#FFB347'} /> : <Shell key={i} x={x} y={y + 4} s={0.8} c={['#FFB3CF', '#FFFFFF', '#FFE2C2'][i % 3]} />))}
        {snow && flowers.map(([x, y], i) => <path key={i} d={`M${x} ${y - 5} l1.6 3.4 l3.4 1.6 l-3.4 1.6 l-1.6 3.4 l-1.6 -3.4 l-3.4 -1.6 l3.4 -1.6Z`} fill="#FFFFFF" opacity="0.9" />)}
        {green && [[300, 418, '#FF7FA0'], [330, 424, '#FFD34D'], [770, 422, '#FF9D5C'], [790, 426, '#E2547A'], [1070, 424, '#B48CFF']].map(([x, y, c], i) => <Tulip key={i} x={x as number} y={y as number} c={c as string} />)}
        {!snow && tufts.map(([x, y], i) => <Grass key={i} x={x} y={y} c={beach ? (night ? '#5E6A40' : '#A7B86A') : p.leaf2} s={0.9 + (i % 3) * 0.2} />)}
        {/* neve caindo (inverno), borboletas (prado e jardim) ou vagalumes (de noite) */}
        {snow
          ? Array.from({ length: 34 }, (_, i) => (
              <circle key={i} className="od-snow" style={{ animationDelay: `-${(i * 0.73) % 9}s`, animationDuration: `${7 + (i % 5)}s` }} cx={(i * 397) % W} cy="-10" r={1.6 + (i % 3)} fill="#FFFFFF" opacity="0.9" />
            ))
          : night
            ? Array.from({ length: 14 }, (_, i) => [60 + i * 92 + ((i * 37) % 40), 250 + ((i * 53) % 130)] as const).map(([x, y], i) => (
                <circle key={i} className="od-firefly" style={{ animationDelay: `${(i % 7) * 0.7}s` }} cx={x} cy={y} r="3" fill="#FFF07A" />
              ))
            : !beach &&
              [
                [180, 250, '#FF9FC2', 0],
                [470, 230, '#FFD34D', 2.5],
                [820, 270, '#B9A3F0', 5],
                [1100, 250, '#FF9FC2', 3.5],
                [1230, 300, '#FFD34D', 1.2],
                ...(garden ? [[620, 280, '#FF7FA0', 4.2] as [number, number, string, number], [900, 240, '#7FD3F0', 6] as [number, number, string, number]] : []),
              ].map(([x, y, c, d], i) => (
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
