// Lá fora: uma clareira simples e ilustrada (sem casa, sem excesso de coisas). Árvores grandes
// emoldurando as bordas, arbustos e morrinhos ao fundo, pedra com cogumelos e flores. O chão da
// frente tem exatamente a cor da página do Início, então cenário e página viram uma coisa só.
import { useId, type ReactNode } from 'react';
import type { Period } from '../data/lines';
import { prefersReducedMotion } from '../lib/util';

/** Largura da clareira (um pouco mais larga que a tela: arrasta de leve para os lados). */
export const OUTDOOR_W = 480;

export type YardTheme = 'prado' | 'jardim' | 'neve' | 'praia';

type Pal = {
  sky: [string, string];
  hill1: string;
  hill2: string;
  meadow: string;
  ground: string;
  bush1: string;
  bush2: string;
  bush3: string;
  pine: [string, string];
  trunk: [string, string];
  canopy: [string, string];
  rock: [string, string];
  dim: number;
};

const GREEN: Record<Period, Pal> = {
  manha: { sky: ['#9ED5F5', '#E9F6EC'], hill1: '#BFDDA0', hill2: '#A6D08A', meadow: '#9CCB72', ground: '#8DC264', bush1: '#2E7563', bush2: '#4E9A5C', bush3: '#B9C94C', pine: ['#3F8A5A', '#2F7550'], trunk: ['#9A6A48', '#B88660'], canopy: ['#A8BE3E', '#C6D35A'], rock: ['#A89C92', '#C9BFB4'], dim: 0 },
  tarde: { sky: ['#C99BD6', '#F4C6C2'], hill1: '#B9CF94', hill2: '#A2C47E', meadow: '#97C26C', ground: '#8BBA62', bush1: '#2F6F5E', bush2: '#4A925A', bush3: '#B5C64A', pine: ['#3D8459', '#2E704E'], trunk: ['#94654A', '#B3815E'], canopy: ['#A4B83C', '#C2CF58'], rock: ['#A3978E', '#C6BBB0'], dim: 0 },
  noite: { sky: ['#1B2350', '#4A3E7C'], hill1: '#2F5260', hill2: '#294B55', meadow: '#2E5F52', ground: '#2C5A4C', bush1: '#173F3A', bush2: '#21503F', bush3: '#3E6A3E', pine: ['#1F4B3E', '#183E34'], trunk: ['#4E3C40', '#62494C'], canopy: ['#3A5E36', '#4A7040'], rock: ['#5A5670', '#706C88'], dim: 1 },
};
const SNOW: Record<Period, Pal> = {
  manha: { sky: ['#A9CDF2', '#EEF6FF'], hill1: '#E3ECF8', hill2: '#D6E2F2', meadow: '#E8EFF9', ground: '#F1F5FB', bush1: '#2F6E5E', bush2: '#3F8268', bush3: '#DDE7F4', pine: ['#3A7E62', '#2C6A52'], trunk: ['#8A6A58', '#A8866F'], canopy: ['#FFFFFF', '#E6EEF8'], rock: ['#A7AEBE', '#C8CFDC'], dim: 0 },
  tarde: { sky: ['#B9B4E6', '#F7D9D6'], hill1: '#E4E8F6', hill2: '#D7DDF0', meadow: '#E9EDF8', ground: '#F2F4FA', bush1: '#2F6E5E', bush2: '#3F8268', bush3: '#DEE4F2', pine: ['#3A7E62', '#2C6A52'], trunk: ['#8A6A58', '#A8866F'], canopy: ['#FFFFFF', '#E8ECF7'], rock: ['#A9AEC0', '#CACFDD'], dim: 0 },
  noite: { sky: ['#1B2350', '#3E4A82'], hill1: '#6C7CAE', hill2: '#6272A4', meadow: '#7686B6', ground: '#8090BE', bush1: '#1E4A40', bush2: '#285A4A', bush3: '#8A98C4', pine: ['#22503F', '#1A4234'], trunk: ['#5E4A52', '#6E5862'], canopy: ['#C9D2EE', '#B5C0E2'], rock: ['#5E6488', '#767CA0'], dim: 1 },
};
const SAND: Record<Period, Pal> = {
  manha: { sky: ['#8FD3F7', '#E8F7F4'], hill1: '#5FC4DE', hill2: '#7FD3E6', meadow: '#F3DCA8', ground: '#EFD49C', bush1: '#2E8A62', bush2: '#3FA06A', bush3: '#8FCB5A', pine: ['#3FA066', '#2F8A58'], trunk: ['#B07E52', '#C99A6C'], canopy: ['#3FA066', '#6CC27A'], rock: ['#B5A28E', '#D2C1AE'], dim: 0 },
  tarde: { sky: ['#C6A2DA', '#F8CDB8'], hill1: '#58B7D6', hill2: '#78C9E0', meadow: '#F2D8A2', ground: '#EDCF94', bush1: '#2E8A62', bush2: '#3FA06A', bush3: '#8FCB5A', pine: ['#3FA066', '#2F8A58'], trunk: ['#AD7B50', '#C6976A'], canopy: ['#3B9A62', '#66BC76'], rock: ['#B2A08C', '#CFBFAC'], dim: 0 },
  noite: { sky: ['#1B2350', '#3B3C84'], hill1: '#2E5A86', hill2: '#3A6A94', meadow: '#8E7E60', ground: '#867658', bush1: '#1E4A3C', bush2: '#24553F', bush3: '#3E6A40', pine: ['#24553F', '#1C4634'], trunk: ['#6E5040', '#7E5E4C'], canopy: ['#2A5A48', '#3A6E58'], rock: ['#6A6070', '#827888'], dim: 1 },
};
const palOf = (theme: YardTheme, period: Period) => (theme === 'neve' ? SNOW : theme === 'praia' ? SAND : GREEN)[period];
/** Chão da Lua (a página do Início usa a mesma cor quando a casa é na Lua). */
export const MOON_GROUND = '#A9AEC6';

/** Cor do gramado da frente (a página do Início usa a mesma, para o chão se fundir com ela). */
export const outdoorGround = (period: Period, moon = false, theme: YardTheme = 'prado') => (moon ? MOON_GROUND : palOf(theme, period).ground);

/** Lá fora na Lua: céu de estrelas, a Terra enorme, a base lunar (a casa do Lumbi) ao fundo, crateras, foguete e bandeira. */
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
        {/* a base lunar: a casa do Lumbi */}
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
        {/* bandeirinha do Lumbi */}
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

/** Moita arredondada feita de bolhas sobrepostas. */
function Blob({ x, y, r, c, n = 4, flat }: { x: number; y: number; r: number; c: string; n?: number; flat?: boolean }) {
  return (
    <g fill={c}>
      {Array.from({ length: n }, (_, i) => {
        const t = n === 1 ? 0.5 : i / (n - 1);
        return <circle key={i} cx={x + (t - 0.5) * r * 2.2} cy={y - Math.sin(t * Math.PI) * r * 0.55} r={r * (0.7 + Math.sin(t * Math.PI) * 0.35)} />;
      })}
      {flat && <rect x={x - r * 1.5} y={y - r * 0.2} width={r * 3} height={r * 1.4} rx={r * 0.3} />}
    </g>
  );
}

/** Pinheiro grande de camadas com pontas arredondadas (corta no alto da cena). */
function BigPine({ x, y, s, p, snow }: { x: number; y: number; s: number; p: Pal; snow?: boolean }) {
  const layer = (yy: number, w: number, k: number) => (
    <g key={k}>
      <path d={`M${x} ${yy - 70 * s} Q${x + w * 0.2} ${yy - 40 * s} ${x + w} ${yy} Q${x} ${yy + 12 * s} ${x - w} ${yy} Q${x - w * 0.2} ${yy - 40 * s} ${x} ${yy - 70 * s}Z`} fill={k % 2 ? p.pine[1] : p.pine[0]} />
      {snow && <path d={`M${x} ${yy - 70 * s} Q${x + w * 0.16} ${yy - 46 * s} ${x + w * 0.5} ${yy - 30 * s} Q${x} ${yy - 36 * s} ${x - w * 0.5} ${yy - 30 * s} Q${x - w * 0.16} ${yy - 46 * s} ${x} ${yy - 70 * s}Z`} fill="#FFFFFF" />}
    </g>
  );
  return (
    <g className="od-sway">
      <rect x={x - 7 * s} y={y - 20 * s} width={14 * s} height={30 * s} fill={p.trunk[0]} />
      {[0, 1, 2, 3].map((k) => layer(y - k * 52 * s, (78 - k * 14) * s, k))}
    </g>
  );
}

/** Árvore grande de tronco curvo na borda, com galho e copa saindo pelo alto. */
function CurvyTree({ x, p, palm }: { x: number; p: Pal; palm?: boolean }) {
  if (palm)
    return (
      <g>
        <path d={`M${x + 40} 430 Q${x + 10} 300 ${x - 10} 150 Q${x - 18} 90 ${x - 6} 40 L${x + 14} 44 Q${x + 4} 120 ${x + 22} 200 Q${x + 44} 320 ${x + 76} 430Z`} fill={p.trunk[0]} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M${x + 4} ${70 + i * 46} q12 -4 18 2`} stroke={p.trunk[1]} strokeWidth="4" fill="none" strokeLinecap="round" />
        ))}
        <g className="od-sway">
          {[-150, -115, -70, -30, 10, 40].map((a, i) => (
            <path key={i} transform={`translate(${x + 2} 42) rotate(${a})`} d="M0 0 Q40 -26 96 -6 Q50 -6 0 6Z" fill={i % 2 ? p.canopy[0] : p.canopy[1]} />
          ))}
          <circle cx={x - 4} cy="50" r="8" fill="#8A5A3B" />
          <circle cx={x + 10} cy="54" r="8" fill="#7A4E33" />
        </g>
      </g>
    );
  return (
    <g>
      <path d={`M${x + 20} 430 Q${x - 4} 330 ${x + 12} 240 Q${x + 24} 150 ${x - 2} 60 Q${x - 10} 20 ${x} -10 L${x + 64} -10 Q${x + 60} 110 ${x + 66} 230 Q${x + 72} 340 ${x + 96} 430Z`} fill={p.trunk[0]} />
      <path d={`M${x + 24} 380 q10 -40 2 -70 M${x + 34} 220 q14 -30 6 -60 M${x + 38} 300 q-10 -20 0 -30 q14 6 8 22`} stroke={p.trunk[1]} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d={`M${x + 14} 130 Q${x - 60} 96 ${x - 150} 96 L${x - 150} 110 Q${x - 60} 112 ${x + 10} 154Z`} fill={p.trunk[0]} />
      <path d={`M${x - 60} 104 Q${x - 80} 80 ${x - 104} 72 L${x - 102} 64 Q${x - 74} 72 ${x - 54} 98Z`} fill={p.trunk[0]} />
      <g className="od-sway">
        {[[-150, 84, 30, 0], [-104, 56, 34, 1], [-40, 40, 40, 0], [30, 14, 52, 1], [90, 40, 40, 0], [-180, 110, 20, 1], [-120, 100, 22, 0], [-6, 78, 28, 1], [60, 80, 30, 0]].map(([dx, cy, r, k], i) => (
          <circle key={i} cx={x + dx} cy={cy} r={r} fill={k ? p.canopy[1] : p.canopy[0]} />
        ))}
        {[[-140, 72], [-70, 40], [10, 6], [80, 26]].map(([dx, cy], i) => (
          <path key={`h${i}`} d={`M${x + dx - 14} ${cy} q14 -12 28 0`} stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="5" fill="none" strokeLinecap="round" />
        ))}
      </g>
    </g>
  );
}

export function Outdoors({ period = 'tarde', height = 430, children, theme = 'prado' }: { period?: Period; height?: number | string; children?: ReactNode; theme?: YardTheme }) {
  const p = palOf(theme, period);
  const night = p.dim > 0;
  const still = prefersReducedMotion();
  const snow = theme === 'neve';
  const beach = theme === 'praia';
  const garden = theme === 'jardim';
  const W = OUTDOOR_W;
  const sky = `od-sky-${useId().replace(/:/g, '')}`;
  const flower = (x: number, y: number, c: string, r = 5) => (
    <g key={`f${x}-${y}`} transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={Math.cos((a * Math.PI) / 180) * r} cy={Math.sin((a * Math.PI) / 180) * r} r={r * 0.75} fill={c} />
      ))}
      <circle r={r * 0.55} fill="#FFFFFF" />
    </g>
  );
  return (
    <div className={`outdoors ${night ? 'is-night' : ''} ${still ? 'is-still' : ''}`} style={{ height, background: p.ground }}>
      <svg className="od-art" viewBox={`0 0 ${W} 430`} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.sky[0]} />
            <stop offset="1" stopColor={p.sky[1]} />
          </linearGradient>
        </defs>
        <rect width={W} height="430" fill={`url(#${sky})`} />
        {night &&
          Array.from({ length: 26 }, (_, i) => <circle key={i} className="od-star" style={{ animationDelay: `${(i * 0.37) % 3}s` }} cx={(i * 113) % W} cy={((i * 71) % 170) + 8} r={i % 4 ? 1.2 : 2} fill="#FFFFFF" />)}

        {/* fundo: morrinhos (ou o mar, na praia) */}
        {beach ? (
          <>
            <rect x="0" y="236" width={W} height="90" fill={p.hill1} />
            <path d={`M0 236 H${W}`} stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="3" />
            {[90, 190, 300, 400].map((x) => (
              <path key={x} d={`M${x} 262 q10 -6 20 0 q10 6 20 0`} stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="3" fill="none" strokeLinecap="round" />
            ))}
          </>
        ) : (
          <>
            <path d={`M0 250 Q110 190 220 226 Q310 252 390 206 Q440 186 ${W} 200 V330 H0Z`} fill={p.hill1} />
            <path d={`M0 282 Q130 236 260 266 Q370 288 ${W} 252 V330 H0Z`} fill={p.hill2} />
          </>
        )}

        {/* faixa de grama do fundo e moitas */}
        <path d={`M0 300 Q120 286 240 294 T${W} 290 V340 H0Z`} fill={p.meadow} />
        <Blob x={128} y={306} r={42} c={p.bush1} n={4} flat />
        <Blob x={214} y={316} r={24} c={p.bush2} n={3} flat />
        <Blob x={318} y={300} r={40} c={p.bush3} n={4} flat />
        {!snow && !beach && [[300, 270, '#E2553C'], [326, 292, '#E2553C'], [118, 284, '#F7B6C8']].map(([x, y, c]) => flower(x as number, y as number, c as string, 5.5))}

        {/* esquerda: pinheiro grande (ou coqueiro) + toco */}
        {beach ? <CurvyTree x={80} p={p} palm /> : <BigPine x={44} y={300} s={1.5} p={p} snow={snow} />}
        {!beach && (
          <g>
            <path d="M40 272 L38 336 H118 L114 272Z" fill={p.trunk[0]} />
            <ellipse cx="77" cy="272" rx="38" ry="11" fill={snow ? '#FFFFFF' : '#D9B48A'} />
            <ellipse cx="77" cy="272" rx="24" ry="6" fill="none" stroke={snow ? '#DDE4F0' : '#B98E62'} strokeWidth="2" />
            {!snow && <path d="M112 290 q24 -8 30 6 q-14 10 -30 4z" fill="#C98A52" />}
          </g>
        )}

        {/* direita: árvore curva emoldurando, pedra com cogumelos/flores */}
        <CurvyTree x={beach ? 420 : 392} p={p} palm={beach} />
        <path d="M318 336 Q312 268 356 252 Q404 238 428 276 Q440 306 436 336Z" fill={p.rock[0]} />
        <path d="M332 278 Q350 256 380 256 Q366 266 358 284Z" fill={p.rock[1]} />
        {beach ? (
          <g>
            <circle cx="320" cy="328" r="13" fill="#FFFFFF" />
            <path d="M307 328 A13 13 0 0 1 333 328Z" fill="#FF6F7A" />
            <path d="M314 317 q6 -4 12 0" stroke="#4FB3E8" strokeWidth="4" fill="none" />
            <path d="M384 340 l4 -10 l4 10 l10 1 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6z" fill="#FF9A5C" />
          </g>
        ) : snow ? (
          <g>
            <circle cx="322" cy="324" r="15" fill="#FFFFFF" />
            <circle cx="322" cy="300" r="11" fill="#FFFFFF" />
            <path d="M322 300 l10 2 l-10 2z" fill="#FF8A3D" />
            <circle cx="318" cy="296" r="1.6" fill="#2B2F55" />
            <circle cx="326" cy="296" r="1.6" fill="#2B2F55" />
            <path d="M311 310 h22" stroke="#E2553C" strokeWidth="4" strokeLinecap="round" />
          </g>
        ) : (
          <g>
            <path d="M392 262 q-6 -30 6 -48 M404 264 q8 -26 26 -34" stroke={p.bush2} strokeWidth="6" fill="none" strokeLinecap="round" />
            {flower(398, 212, '#F2A6C8', 7)}
            {flower(430, 228, '#F2A6C8', 6)}
            <rect x="364" y="294" width="20" height="38" rx="8" fill="#FBEFD9" />
            <path d="M336 300 Q338 262 374 260 Q410 262 412 300 Q374 308 336 300Z" fill="#D6403A" />
            {[[354, 282, 5], [374, 272, 6], [394, 286, 5], [370, 292, 3.5], [346, 294, 3]].map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill="#FFFFFF" />)}
            <rect x="320" y="308" width="9" height="22" rx="4" fill="#FBEFD9" />
            <path d="M308 312 Q310 294 324 294 Q338 294 340 312Z" fill="#F7F1E6" />
            <rect x="340" y="318" width="7" height="14" rx="3" fill="#FBEFD9" />
            <path d="M332 322 Q333 310 343 310 Q353 310 354 322Z" fill="#F7F1E6" />
          </g>
        )}

        {/* chão da frente: a mesma cor da página, sem linha */}
        <path d={`M0 330 Q130 318 250 326 Q380 334 ${W} 322 V430 H0Z`} fill={p.ground} />
        {garden && [[70, 360, '#FF8FB8'], [110, 392, '#FFD34D'], [380, 366, '#B9A3F0'], [420, 398, '#FF8FB8'], [60, 412, '#FFFFFF'], [400, 420, '#FFD34D']].map(([x, y, c]) => flower(x as number, y as number, c as string, 4.5))}
        {!snow && !beach && !garden && [[70, 396, '#FFFFFF'], [414, 404, '#FFD34D']].map(([x, y, c]) => flower(x as number, y as number, c as string, 3.5))}
        {beach && <path d="M64 400 q8 -10 16 0 q-8 6 -16 0z M408 384 q8 -10 16 0 q-8 6 -16 0z" fill="#FFF3E0" />}

        {/* vida: neve caindo, borboletas, vagalumes */}
        {snow &&
          Array.from({ length: 22 }, (_, i) => <circle key={i} className="od-snow" style={{ animationDelay: `-${(i * 0.7) % 8}s` }} cx={(i * 97) % W} cy={-20 - ((i * 37) % 120)} r={i % 3 ? 2 : 3} fill="#FFFFFF" opacity="0.9" />)}
        {night &&
          Array.from({ length: 8 }, (_, i) => <circle key={i} className="od-firefly" style={{ animationDelay: `${(i * 0.6) % 2.6}s` }} cx={40 + ((i * 61) % 400)} cy={240 + ((i * 29) % 120)} r="2.4" fill="#FFF07A" />)}
        {!night && !snow &&
          [
            [150, 230, '#FFFFFF', 0],
            [280, 200, '#FFD34D', 3],
            ...(garden ? [[230, 220, '#FF9FC2', 5] as [number, number, string, number]] : []),
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
