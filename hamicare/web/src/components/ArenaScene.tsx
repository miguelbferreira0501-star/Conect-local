// Os cenários das 12 arenas: cada uma com casa própria, paisagem, clima e bichinhos.
// O céu acompanha a hora do dia. Toque em árvores, flores, cogumelos e na casa: eles reagem.
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode, type MouseEvent } from 'react';
import { skyOf, type SkyTime } from './Scene';
import { ARENA_DETAILS } from './arenaDetails';
import { CompanionShape, EggShape } from './Companion';
import { companionOfArena, eggWarmth, HATCH_DAYS, PET_VOICE } from '../data/companions';
import { gameCfg } from '../lib/game';
import { play, type SoundId } from '../lib/sound';
import { useApp } from '../lib/store';

type Sky = [string, string];
interface ArenaLook {
  sky: { dia: Sky; noite: Sky; amanhecer?: Sky; entardecer?: Sky };
  /** Céu que não muda com a hora (fundo do mar, espaço). */
  fixedSky?: boolean;
  draw: (t: { night: boolean; time: SkyTime; id: string }) => ReactNode;
  ambient: 'borboletas' | 'petalas' | 'fumaca' | 'folhas' | 'ondas' | 'neve' | 'cidade' | 'bolhas' | 'brilhos' | 'bandeiras' | 'estrelas' | 'celeste';
}

// ---------- Peças que se repetem ----------

const Pine = ({ x, y, s = 1, c = '#2F7A4A', snow }: { x: number; y: number; s?: number; c?: string; snow?: boolean }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} className="tree-sway" data-tap="arvore">
    <rect x="-3" y="-2" width="6" height="14" fill="#6E4A30" />
    <path d="M0 -60 L18 -30 H10 L24 -6 H-24 L-10 -30 H-18Z" fill={c} />
    {snow && <path d="M0 -60 L9 -45 Q4 -42 0 -46 Q-4 -42 -9 -45Z M-14 -28 Q-8 -24 -2 -28 Q4 -24 10 -28 L14 -24 Q6 -20 0 -23 Q-6 -20 -16 -24Z" fill="#fff" />}
  </g>
);

const Palm = ({ x, y, s = 1, flip }: { x: number; y: number; s?: number; flip?: boolean }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} className="tree-sway" data-tap="arvore">
    <path d="M0 0 Q-4 -40 6 -78" stroke="#B07A52" strokeWidth="7" fill="none" strokeLinecap="round" />
    <path d="M0 -10 L5 -12 M-1 -24 L4 -26 M0 -38 L5 -40 M2 -52 L7 -54 M4 -66 L9 -67" stroke="#8A5A3B" strokeWidth="2" />
    <path d="M6 -78 Q-20 -94 -42 -76 Q-18 -82 6 -78Z" fill="#3FB27F" />
    <path d="M6 -78 Q30 -96 52 -78 Q28 -84 6 -78Z" fill="#4CC28B" />
    <path d="M6 -78 Q-14 -72 -26 -50 Q-6 -66 6 -78Z" fill="#4CC28B" />
    <path d="M6 -78 Q26 -72 36 -50 Q18 -66 6 -78Z" fill="#3FB27F" />
    <circle cx="2" cy="-74" r="4" fill="#7A4E32" />
    <circle cx="9" cy="-73" r="4" fill="#7A4E32" />
  </g>
);

const Flower = ({ x, y, c, d = 0 }: { x: number; y: number; c: string; d?: number }) => (
  <g className="flower" style={{ transformOrigin: `${x}px ${y + 14}px`, animationDelay: `${d}s` }} data-tap="flor">
    <path d={`M${x} ${y + 14} L${x} ${y}`} stroke="#3E8F4A" strokeWidth="2" />
    {[0, 72, 144, 216, 288].map((a) => (
      <circle key={a} cx={x + Math.cos((a * Math.PI) / 180) * 4} cy={y + Math.sin((a * Math.PI) / 180) * 4} r="3.4" fill={c} />
    ))}
    <circle cx={x} cy={y} r="2.4" fill="#FFE066" />
  </g>
);

const Mushroom = ({ x, y, s = 1, c = '#F26D6D' }: { x: number; y: number; s?: number; c?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} data-tap="cogumelo">
    <path d="M-6 0 V-12 H6 V0Z" fill="#FFF3DC" />
    <path d="M-16 -10 Q-16 -30 0 -30 Q16 -30 16 -10Z" fill={c} />
    <circle cx="-7" cy="-20" r="3" fill="#fff" />
    <circle cx="6" cy="-23" r="2.4" fill="#fff" />
    <circle cx="8" cy="-14" r="2" fill="#fff" />
  </g>
);

const Cloud = ({ x, y, s = 1, o = 0.92, cls = '' }: { x: number; y: number; s?: number; o?: number; cls?: string }) => (
  <g className={cls} opacity={o}>
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fff">
      <ellipse cx="0" cy="0" rx="34" ry="13" />
      <ellipse cx="-14" cy="-8" rx="16" ry="13" />
      <ellipse cx="12" cy="-11" rx="19" ry="15" />
    </g>
  </g>
);

const Stars = ({ list }: { list: [number, number][] }) => (
  <>
    {list.map(([x, y], i) => (
      <circle key={i} className="twinkle" style={{ animationDelay: `${i * 0.37}s` }} cx={x} cy={y} r={i % 3 === 0 ? 1.8 : 1.2} fill="#fff" />
    ))}
  </>
);

const NIGHT_STARS: [number, number][] = [[40, 40], [96, 22], [150, 54], [210, 30], [262, 66], [360, 26], [380, 88], [120, 92], [230, 96], [300, 40]];

const SunMoon = ({ night, time, x = 330, y = 60 }: { night: boolean; time: SkyTime; x?: number; y?: number }) => (
  <g className="sun-bob">
    <circle cx={x} cy={y} r="44" fill={night ? '#FFF6C9' : '#FFF3B0'} opacity="0.25" />
    {night ? (
      <>
        <circle cx={x} cy={y} r="20" fill="#FFF3C4" />
        <circle cx={x + 10} cy={y - 6} r="17" fill="#2A3270" />
      </>
    ) : (
      <circle cx={x} cy={y} r="22" fill={time === 'entardecer' ? '#FFC36B' : '#FFE066'} />
    )}
  </g>
);

const Window = ({ x, y, w = 14, h = 14, night }: { x: number; y: number; w?: number; h?: number; night: boolean }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx="3" fill={night ? '#FFD36B' : '#BFE8FF'} />
    <path d={`M${x + w / 2} ${y} V${y + h} M${x} ${y + h / 2} H${x + w}`} stroke="#fff" strokeWidth="1.6" opacity="0.8" />
    {night && <rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx="6" fill="#FFD36B" opacity="0.18" />}
  </g>
);

const Butterflies = ({ list }: { list: [number, number, string][] }) => (
  <>
    {list.map(([x, y, c], i) => (
      <g key={i} className="butterfly" style={{ animationDelay: `${i * 2.2}s` }}>
        <g transform={`translate(${x} ${y})`}>
          <ellipse className="wing" cx="-4" cy="0" rx="5" ry="6.5" fill={c} />
          <ellipse className="wing wing-r" cx="4" cy="0" rx="5" ry="6.5" fill={c} />
          <rect x="-0.8" y="-4" width="1.6" height="8" rx="0.8" fill="#4A3B55" />
        </g>
      </g>
    ))}
  </>
);

const Fireflies = ({ list }: { list: [number, number][] }) => (
  <>
    {list.map(([x, y], i) => (
      <circle key={i} className="firefly" style={{ animationDelay: `${i * 0.8}s` }} cx={x} cy={y} r="2.6" fill="#FFF49A" />
    ))}
  </>
);

// ---------- A casinha inicial (o cenário do Início): bem detalhada ----------

function Casinha({ night, time }: { night: boolean; time: SkyTime }) {
  const n = (day: string, nite: string) => (night ? nite : day);
  return (
    <>
      <SunMoon night={night} time={time} x={322} y={54} />
      {!night && <Cloud x={120} y={50} cls="cloud cloud-1" />}
      {!night && <Cloud x={250} y={86} s={0.7} o={0.85} cls="cloud cloud-2" />}
      {!night && [[180, 70], [196, 62]].map(([x, y], i) => <path key={i} className="bird-fly" style={{ animationDelay: `${i * 1.5}s` }} d={`M${x} ${y} q4 -4 8 0 q4 -4 8 0`} stroke="#4B4F5E" strokeWidth="1.6" fill="none" />)}
      {/* morros ao longe, com arvorezinhas e um moinho */}
      <path d="M0 168 C50 140 110 146 160 160 C220 176 270 140 330 146 C360 150 384 158 400 164 V300 H0 Z" fill={n('#C3E8B4', '#33584D')} />
      {[[30, 156], [52, 150], [262, 150], [282, 146], [300, 150]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x - 1} y={y} width="2" height="6" fill={n('#7A9A6A', '#22403A')} />
          <circle cx={x} cy={y - 2} r="5" fill={n('#8CCB7E', '#2A4E44')} />
        </g>
      ))}
      <g transform="translate(352 150)" data-tap="brilho">
        <path d="M-6 0 L-3 -26 H3 L6 0 Z" fill={n('#F2E6D0', '#6E6658')} />
        <path d="M-4 -26 L0 -32 L4 -26 Z" fill={n('#D9825B', '#5E3B30')} />
        <g className="spin-slow" style={{ transformOrigin: '0px -24px' }}>
          {[0, 90, 180, 270].map((a) => (
            <rect key={a} x="-1.6" y="-44" width="3.2" height="20" rx="1" fill={n('#FFFFFF', '#A8A094')} transform={`rotate(${a} 0 -24)`} />
          ))}
        </g>
        <circle cx="0" cy="-24" r="2" fill={n('#8A5A3B', '#3E2A20')} />
      </g>
      <path d="M0 196 C60 176 130 182 190 192 C250 202 320 180 400 186 V300 H0 Z" fill={n('#A8DB92', '#2F5A4C')} />
      {/* árvore grande com balanço */}
      <g transform="translate(332 228)" className="tree-sway" data-tap="arvore">
        <path d="M-6 0 Q-4 -40 -10 -64 M-8 -46 Q-28 -56 -40 -52" stroke={n('#8A5A3B', '#4E3426')} strokeWidth="10" fill="none" strokeLinecap="round" />
        <circle cx="-8" cy="-84" r="34" fill={n('#4FA35C', '#1F4338')} />
        <circle cx="-38" cy="-66" r="22" fill={n('#5DB36A', '#22493C')} />
        <circle cx="20" cy="-70" r="24" fill={n('#46994F', '#1C3E33')} />
        <circle cx="-20" cy="-100" r="10" fill="#FFFFFF" opacity="0.12" />
        {[[-24, -78], [4, -92], [16, -64], [-40, -60], [-8, -60]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.4" fill={n('#FF6F6F', '#8A3A3A')} />)}
      </g>
      <g data-tap="bola">
        <path d="M290 178 V214 M306 178 V214" stroke={n('#8A6A4F', '#4E3E30')} strokeWidth="1.4" />
        <rect x="286" y="212" width="24" height="5" rx="2.5" fill={n('#F26D6D', '#7A3A3A')} />
      </g>
      {/* a casinha */}
      <g transform="translate(108 230)" data-tap="casa">
        <ellipse cx="0" cy="2" rx="62" ry="6" fill="#000000" opacity="0.12" />
        <rect x="30" y="-104" width="14" height="30" fill={n('#B85B4A', '#5E2F2A')} />
        <rect x="28" y="-108" width="18" height="6" rx="2" fill={n('#8A3E33', '#401E1A')} />
        <rect x="-50" y="-62" width="100" height="62" rx="3" fill={n('#FFF1DC', '#8C7B6C')} />
        <path d="M-50 -14 H50" stroke={n('#EBD6B8', '#6E5E52')} strokeWidth="1.5" />
        <path d="M-60 -58 L0 -106 L60 -58 Z" fill={n('#F26D6D', '#6A2E30')} />
        {[-92, -80, -68].map((y, i) => <path key={y} d={`M${-46 + i * 13} ${y + 22} H${46 - i * 13}`} stroke={n('#D9545A', '#55242A')} strokeWidth="2" />)}
        <path d="M-64 -56 L0 -108 L64 -56" stroke={n('#D9545A', '#55242A')} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="0" cy="-76" r="9" fill={n('#BFE8FF', '#FFD36B')} stroke={n('#FFFFFF', '#C9A86A')} strokeWidth="2.6" />
        <path d="M0 -85 V-67 M-9 -76 H9" stroke={n('#FFFFFF', '#C9A86A')} strokeWidth="1.6" />
        {[-34, 22].map((x) => (
          <g key={x}>
            <rect x={x - 4} y="-50" width="4" height="20" rx="1.5" fill={n('#7FB8F0', '#3E4E6E')} />
            <rect x={x + 16} y="-50" width="4" height="20" rx="1.5" fill={n('#7FB8F0', '#3E4E6E')} />
            <rect x={x} y="-50" width="16" height="20" rx="2" fill={n('#BFE8FF', '#FFD36B')} />
            <path d={`M${x + 8} -50 V-30 M${x} -40 H${x + 16}`} stroke={n('#FFFFFF', '#C9A86A')} strokeWidth="1.6" />
            <rect x={x - 3} y="-30" width="22" height="6" rx="2" fill={n('#B07A52', '#5E3B27')} />
            {[2, 7, 12, 17].map((dx, i) => <circle key={dx} cx={x - 2 + dx} cy="-31" r="2.6" fill={['#FF7FA0', '#FFD34D', '#FFFFFF', '#B48CFF'][i]} />)}
            {night && <rect x={x - 6} y="-54" width="28" height="28" rx="8" fill="#FFD36B" opacity="0.15" />}
          </g>
        ))}
        <path d="M-12 0 V-30 Q-12 -42 0 -42 Q12 -42 12 -30 V0 Z" fill={n('#7FB8F0', '#2E3A56')} />
        <path d="M-8 -4 V-28 Q-8 -37 0 -37 Q8 -37 8 -28 V-4" stroke={n('#5B8DEF', '#24304A')} strokeWidth="1.4" fill="none" />
        <circle cx="7" cy="-18" r="1.8" fill="#F6C445" />
        <rect x="-16" y="0" width="32" height="4" rx="1.5" fill={n('#D9C6A6', '#5E5448')} />
        <g transform="translate(18 -40)">
          <path d="M0 0 V-6" stroke={n('#4B4F5E', '#2A2E38')} strokeWidth="1.4" />
          <rect x="-3.4" y="-1" width="6.8" height="8" rx="2" fill={n('#FFF3B0', '#FFD36B')} />
          {night && <circle cx="0" cy="3" r="12" fill="#FFD36B" opacity="0.25" />}
        </g>
      </g>
      {/* arbustos com frutinhas nos cantos da casa */}
      {[[50, 232, 1], [168, 232, 0.9]].map(([x, y, sc], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${sc})`} className="tree-sway" data-tap="arvore">
          <circle cx="-8" cy="-8" r="11" fill={n('#4FA35C', '#1F4338')} />
          <circle cx="8" cy="-9" r="12" fill={n('#5DB36A', '#22493C')} />
          <circle cx="0" cy="-16" r="10" fill={n('#56AA62', '#20463A')} />
          {[[-8, -10], [6, -14], [10, -4], [-2, -2]].map(([bx, by], k) => <circle key={k} cx={bx} cy={by} r="2" fill={n('#B48CFF', '#5A4A7A')} />)}
        </g>
      ))}
      <path d="M0 238 C80 228 150 232 220 236 C290 240 340 230 400 232 V300 H0 Z" fill={n('#86CF72', '#2A5244')} />
      {/* cerquinha com portãozinho */}
      <g>
        <path d="M30 244 H96 M30 254 H96 M140 244 H178 M140 254 H178" stroke={n('#FFFBF4', '#8D8378')} strokeWidth="3" />
        {[34, 48, 62, 76, 90, 144, 158, 172].map((x) => (
          <path key={x} d={`M${x - 4} 262 V240 l4 -5 l4 5 V262 Z`} fill={n('#FFFFFF', '#9A8F86')} stroke={n('#E8DCCB', '#6E655D')} strokeWidth="1" />
        ))}
      </g>
      {/* caminho de pedras até o Hami */}
      <path d="M108 236 C120 252 150 262 180 270 C196 276 204 286 206 300 H150 C152 290 146 280 130 272 C116 266 100 254 98 240 Z" fill={n('#EFDDB5', '#5E5448')} opacity="0.9" />
      {[[110, 246, 7], [126, 258, 8], [148, 268, 9], [172, 276, 10], [188, 290, 11]].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.45} fill={n('#E2D2B4', '#6E6658')} stroke={n('#CDBB98', '#4E4840')} strokeWidth="1" />
      ))}
      {/* caixa de correio e poste */}
      <g transform="translate(232 262)" data-tap="carta">
        <rect x="-1.6" y="-16" width="3.2" height="18" fill={n('#8A5A3B', '#4E3426')} />
        <path d="M-10 -16 V-25 Q-10 -30 -5 -30 H5 Q10 -30 10 -25 V-16 Z" fill={n('#F26D6D', '#7A3A3A')} />
        <path d="M8 -26 V-36 H15 V-31 H10" fill="#FFD34D" />
      </g>
      <g transform="translate(268 252)" data-tap="sino">
        <rect x="-2" y="-46" width="4" height="48" fill={n('#4B4F5E', '#2A2E38')} />
        <path d="M-9 -54 H9 L7 -44 H-7 Z" fill={n('#FFF3B0', '#FFD36B')} />
        <path d="M-11 -54 L0 -61 L11 -54 Z" fill={n('#4B4F5E', '#2A2E38')} />
        {night && <circle cx="0" cy="-49" r="22" fill="#FFD36B" opacity="0.22" />}
      </g>
      {/* hortinha */}
      <g transform="translate(300 262)">
        <rect x="-24" y="-6" width="48" height="12" rx="5" fill={n('#9C6B45', '#4E3426')} />
        {[-16, -6, 4, 14].map((x, i) => (
          <g key={x} data-tap="flor">
            {i % 2 ? (
              <>
                <circle cx={x} cy="-6" r="5" fill={n('#7CC39A', '#2E5A40')} />
                <circle cx={x} cy="-6" r="2.4" fill={n('#B8E6C4', '#3E6A50')} />
              </>
            ) : (
              <>
                <path d={`M${x} -4 l-3 -8 M${x} -4 l0 -9 M${x} -4 l3 -8`} stroke={n('#5FAE84', '#2E5A40')} strokeWidth="2" strokeLinecap="round" />
                <path d={`M${x - 2} -3 h4 l-2 6 Z`} fill="#FF8A3D" />
              </>
            )}
          </g>
        ))}
      </g>
      {/* laguinho com patinho */}
      <g data-tap="agua">
        <ellipse cx="352" cy="282" rx="44" ry="13" fill={n('#7FC4EC', '#2C4E76')} />
        <ellipse cx="352" cy="280" rx="30" ry="6" fill="#FFFFFF" opacity="0.3" className="wave-bob" />
        <path d="M322 284 a6 2.4 0 1 0 0.1 0 Z M372 278 a7 2.6 0 1 0 0.1 0 Z" fill={n('#5FBF77', '#2E5A40')} />
      </g>
      <g transform="translate(346 276)" data-tap="bicho" className="float-bob">
        <ellipse cx="0" cy="0" rx="8" ry="5" fill="#FFE066" />
        <circle cx="6" cy="-5" r="4" fill="#FFE066" />
        <path d="M9 -5 l4 1 l-4 1.4 Z" fill="#FF9D5C" />
        <circle cx="7" cy="-6" r="0.9" fill="#2B2224" />
        <path d="M-6 -2 q-4 -2 -4 2" stroke="#F2C94C" strokeWidth="1.6" fill="none" />
      </g>
      {/* flores, cogumelos e moitas na frente */}
      {[[24, 274, '#FF7FA0'], [70, 282, '#FFD34D'], [112, 288, '#B48CFF'], [248, 288, '#FF9D5C'], [282, 292, '#FFFFFF']].map(([x, y, c], i) => (
        <Flower key={i} x={x as number} y={y as number} c={c as string} d={i * 0.4} />
      ))}
      <Mushroom x={86} y={274} s={0.55} />
      <Mushroom x={98} y={278} s={0.4} c="#FF9F4D" />
      <g className="tree-sway" data-tap="arvore">
        <circle cx="-4" cy="300" r="26" fill={n('#3E9C55', '#1A3F30')} />
        <circle cx="22" cy="306" r="18" fill={n('#4FA35C', '#1F4338')} />
      </g>
      <g className="tree-sway" data-tap="arvore">
        <circle cx="404" cy="296" r="24" fill={n('#3E9C55', '#1A3F30')} />
        <circle cx="380" cy="306" r="16" fill={n('#4FA35C', '#1F4338')} />
      </g>
      {/* fumacinha da chaminé */}
      {[0, 1, 2].map((i) => (
        <circle key={i} className="smoke-rise" style={{ animationDelay: `${i * 1.2}s` }} cx="145" cy="118" r="6" fill="#FFFFFF" opacity="0.7" />
      ))}
    </>
  );
}

// ---------- As 12 arenas ----------

const LOOKS: Record<string, ArenaLook> = {
  casinha: {
    sky: { dia: ['#7CC8FF', '#DDF4FF'], noite: ['#1C2357', '#4B4C9A'], amanhecer: ['#9FD2FF', '#FFE2C4'], entardecer: ['#8C7BE0', '#FFB38A'] },
    ambient: 'borboletas',
    draw: ({ night, time }) => <Casinha night={night} time={time} />,
  },

  jardim: {
    sky: { dia: ['#9FDFFF', '#F4FFE6'], noite: ['#22305E', '#5B4D8F'], amanhecer: ['#B5E2FF', '#FFE6D2'], entardecer: ['#B08CE8', '#FFC2A3'] },
    ambient: 'petalas',
    draw: ({ night, time }) => (
      <>
        <SunMoon night={night} time={time} x={320} y={58} />
        {!night && <Cloud x={120} y={60} s={0.9} cls="cloud cloud-1" />}
        <path d="M0 200 Q50 160 100 190 Q150 150 210 186 Q270 160 320 188 Q360 166 400 184 V300 H0Z" fill={night ? '#355E52' : '#B9E6A4'} />
        {[[40, 186], [150, 178], [250, 176], [350, 180]].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="18" fill={night ? '#2D5446' : '#8FD39A'} />
            <circle cx={x - 6} cy={y - 6} r="3" fill="#FF9FC2" />
            <circle cx={x + 7} cy={y - 2} r="3" fill="#FFE27A" />
          </g>
        ))}
        <path d="M0 228 C80 208 160 216 230 222 C300 228 350 214 400 216 V300 H0Z" fill={night ? '#2F5A4C' : '#86D08A'} />
        {/* Casa de flor */}
        <g transform="translate(78 182)" data-tap="casa">
          <ellipse cx="0" cy="40" rx="44" ry="36" fill={night ? '#D9C6B5' : '#FFF3DC'} />
          {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((a) => (
            <ellipse key={a} cx="0" cy="-12" rx="12" ry="26" fill={a % 80 ? '#FF9FC2' : '#FF7FA8'} transform={`rotate(${a} 0 6)`} />
          ))}
          <circle cx="0" cy="6" r="14" fill="#FFD34D" />
          <path d="M-12 76 V54 Q-12 42 0 42 Q12 42 12 54 V76Z" fill={night ? '#5E3B27' : '#B07A52'} />
          <Window x={18} y={44} w={14} h={12} night={night} />
          <Window x={-34} y={44} w={14} h={12} night={night} />
          <rect x="-38" y="58" width="22" height="6" rx="3" fill="#5FBF77" />
          <circle cx="-32" cy="57" r="2.6" fill="#FF7FA0" />
          <circle cx="-24" cy="57" r="2.6" fill="#FFE27A" />
        </g>
        <path d="M0 254 C90 240 180 246 260 250 C320 253 360 244 400 246 V300 H0Z" fill={night ? '#2A5244' : '#73C670'} />
        <path d="M140 300 C150 272 176 260 200 256 C226 260 248 272 258 300Z" fill={night ? '#6F6152' : '#F7E7C4'} opacity="0.8" />
        {/* Girassol gigante e tulipas */}
        <g transform="translate(330 200)" className="tree-sway" data-tap="">
          <path d="M0 0 V60" stroke="#3E8F4A" strokeWidth="5" />
          {Array.from({ length: 12 }).map((_, i) => (
            <ellipse key={i} cx="0" cy="-16" rx="5" ry="10" fill="#FFD25A" transform={`rotate(${i * 30} 0 0)`} />
          ))}
          <circle cx="0" cy="0" r="9" fill="#7A4E32" />
        </g>
        {[[20, 260, '#FF7FA0'], [110, 254, '#B48CFF'], [280, 262, '#FFD34D'], [372, 258, '#FF9D5C'], [240, 266, '#FFFFFF']].map(([x, y, c], i) => (
          <Flower key={i} x={x as number} y={y as number} c={c as string} d={i * 0.5} />
        ))}
        {/* Joaninha e caracol */}
        <g transform="translate(300 274)" data-tap="bicho">
          <ellipse cx="0" cy="0" rx="7" ry="6" fill="#F26D6D" />
          <circle cx="-6" cy="-2" r="3" fill="#4B4F5E" />
          <circle cx="2" cy="-2" r="1.4" fill="#4B4F5E" />
          <circle cx="3" cy="3" r="1.4" fill="#4B4F5E" />
        </g>
        <g transform="translate(60 276)" data-tap="bicho">
          <path d="M-10 4 H12 Q16 -6 12 -8" fill="#C9E8B5" stroke="#C9E8B5" strokeWidth="3" strokeLinecap="round" />
          <circle cx="-2" cy="-4" r="7" fill="#FF9F4D" />
          <circle cx="-2" cy="-4" r="3" fill="none" stroke="#E27E2C" strokeWidth="1.6" />
        </g>
      </>
    ),
  },

  vila: {
    sky: { dia: ['#8FD0FF', '#FFF0DA'], noite: ['#1E2452', '#4C3F7E'], amanhecer: ['#A8D8FF', '#FFDAB8'], entardecer: ['#9B7FD8', '#FFB38A'] },
    ambient: 'fumaca',
    draw: ({ night, time }) => (
      <>
        <SunMoon night={night} time={time} x={330} y={56} />
        {!night && <Cloud x={200} y={64} s={0.8} cls="cloud cloud-1" />}
        {/* Casinhas da vila ao fundo */}
        {[[150, 168, '#F2B48A'], [196, 160, '#FFD3A3'], [240, 170, '#E8A0A0'], [290, 162, '#C9D6F2'], [338, 168, '#FFE0A3'], [380, 160, '#D8C3F0']].map(([x, y, c], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <rect x="-18" y="0" width="36" height="34" fill={night ? '#3E3A5E' : (c as string)} />
            <path d="M-22 2 L0 -18 L22 2Z" fill={night ? '#2D2948' : '#C0694A'} />
            <rect x="-6" y="10" width="12" height="10" rx="2" fill={night ? '#FFD36B' : '#FFF'} opacity={night ? 0.9 : 0.8} />
          </g>
        ))}
        <path d="M0 210 C80 196 160 202 240 206 C320 210 360 200 400 202 V300 H0Z" fill={night ? '#4A4458' : '#C9B79A'} />
        {/* Casa de madeira com chaminé */}
        <g transform="translate(72 150)" data-tap="casa">
          <rect x="22" y="-26" width="12" height="26" fill="#8A5A3B" />
          <rect x="-44" y="10" width="88" height="88" rx="4" fill={night ? '#7A5848' : '#D7A574'} />
          {[24, 40, 56, 72, 88].map((y) => (
            <path key={y} d={`M-44 ${y} H44`} stroke={night ? '#5B4036' : '#B07A52'} strokeWidth="2" />
          ))}
          <path d="M-52 14 L0 -30 L52 14Z" fill={night ? '#5E2F2A' : '#C0694A'} />
          <path d="M-12 98 V68 Q-12 58 0 58 Q12 58 12 68 V98Z" fill={night ? '#3A2620' : '#7A4E32'} />
          <Window x={-36} y={30} w={18} h={16} night={night} />
          <Window x={18} y={30} w={18} h={16} night={night} />
          <rect x="-38" y="46" width="22" height="6" rx="3" fill="#5FBF77" />
        </g>
        {/* Cafeteria */}
        <g transform="translate(300 184)" data-tap="">
          <rect x="-36" y="0" width="72" height="56" rx="4" fill={night ? '#5E5470' : '#FFF3DC'} />
          <path d="M-42 0 H42 L36 -16 H-36Z" fill="#F26D6D" />
          {[-30, -14, 2, 18].map((x) => (
            <path key={x} d={`M${x} -16 L${x + 6} 0`} stroke="#fff" strokeWidth="6" opacity="0.9" />
          ))}
          <rect x="-26" y="14" width="24" height="18" rx="3" fill={night ? '#FFD36B' : '#BFE8FF'} />
          <rect x="6" y="18" width="20" height="38" rx="3" fill="#7A4E32" />
          <rect x="-20" y="-34" width="40" height="14" rx="4" fill="#7A4E32" />
          <text x="0" y="-24" textAnchor="middle" fontSize="10" fontWeight="800" fill="#FFF3DC" fontFamily="sans-serif">CAFÉ</text>
        </g>
        <path d="M0 250 C90 238 180 244 260 248 C320 251 360 242 400 244 V300 H0Z" fill={night ? '#3E3A48' : '#B8A285'} />
        {Array.from({ length: 12 }, (_, i) => (
          <ellipse key={i} cx={20 + i * 34} cy={276 + (i % 2) * 8} rx="12" ry="5" fill={night ? '#4E4858' : '#D9C6A6'} />
        ))}
        {/* Lampião */}
        <g transform="translate(200 210)" data-tap="">
          <rect x="-2" y="0" width="4" height="50" fill="#4B4F5E" />
          <path d="M-8 -14 H8 L6 0 H-6Z" fill={night ? '#FFD36B' : '#FFF3B0'} />
          {night && <circle cx="0" cy="-7" r="18" fill="#FFD36B" opacity="0.25" />}
          <path d="M-10 -14 L0 -20 L10 -14Z" fill="#4B4F5E" />
        </g>
      </>
    ),
  },

  floresta: {
    sky: { dia: ['#9FD8C4', '#E8F7E0'], noite: ['#142A2C', '#2E4F4A'], amanhecer: ['#A9DCC9', '#FFE2C4'], entardecer: ['#6F8FB8', '#FFB38A'] },
    ambient: 'folhas',
    draw: ({ night, time }) => (
      <>
        <SunMoon night={night} time={time} x={300} y={50} />
        {[20, 60, 100, 140, 190, 240, 290, 340, 380].map((x, i) => (
          <Pine key={i} x={x} y={196 - (i % 3) * 6} s={1.1 + (i % 2) * 0.2} c={night ? '#16362E' : i % 2 ? '#2F7A4A' : '#3B8C58'} />
        ))}
        <path d="M0 214 C80 198 170 206 240 210 C320 214 360 204 400 206 V300 H0Z" fill={night ? '#22443A' : '#5DAE6B'} />
        {/* Lago */}
        <ellipse cx="300" cy="250" rx="90" ry="20" fill={night ? '#2C4E76' : '#7FC8E8'} />
        <ellipse cx="290" cy="246" rx="40" ry="5" fill="#fff" opacity="0.35" className="wave-bob" />
        {/* Casa na árvore */}
        <g transform="translate(80 120)" data-tap="casa">
          <rect x="-12" y="40" width="24" height="110" rx="6" fill="#7A4E32" />
          <circle cx="0" cy="18" r="46" fill={night ? '#1F4A38' : '#3E9C55'} />
          <circle cx="-34" cy="34" r="26" fill={night ? '#1A3F30' : '#4FA35C'} />
          <circle cx="36" cy="30" r="28" fill={night ? '#1A3F30' : '#4FA35C'} />
          <rect x="-28" y="34" width="56" height="40" rx="4" fill={night ? '#8A6448' : '#D7A574'} />
          <path d="M-36 38 L0 12 L36 38Z" fill="#A86E44" />
          <circle cx="-12" cy="52" r="7" fill={night ? '#FFD36B' : '#BFE8FF'} stroke="#8A5A3B" strokeWidth="2.4" />
          <rect x="6" y="48" width="14" height="26" rx="3" fill="#5E3B27" />
          <rect x="-40" y="74" width="80" height="6" rx="2" fill="#8A5A3B" />
          {[84, 98, 112, 126].map((y) => (
            <path key={y} d={`M22 ${y} H34`} stroke="#B07A52" strokeWidth="3" />
          ))}
          <path d="M22 80 V140 M34 80 V140" stroke="#B07A52" strokeWidth="3" />
        </g>
        <path d="M0 262 C90 250 180 256 260 262 C320 266 360 258 400 260 V300 H0Z" fill={night ? '#1C3A31' : '#4E9C5D'} />
        <Mushroom x={176} y={272} s={1.1} />
        <Mushroom x={196} y={278} s={0.7} c="#FF9F4D" />
        <Mushroom x={30} y={282} s={0.8} />
        {/* Tronco caído e pedras */}
        <g transform="translate(230 280)">
          <rect x="-24" y="-8" width="48" height="14" rx="7" fill="#8A5A3B" />
          <circle cx="24" cy="-1" r="7" fill="#C98D5E" />
        </g>
        <ellipse cx="360" cy="286" rx="16" ry="9" fill="#9AA6B5" />
      </>
    ),
  },

  tropical: {
    sky: { dia: ['#52C3F5', '#D8F6FF'], noite: ['#18295E', '#3F5BA0'], amanhecer: ['#7FD0FF', '#FFD6B0'], entardecer: ['#7F6FD8', '#FFA98A'] },
    ambient: 'ondas',
    draw: ({ night, time }) => (
      <>
        <SunMoon night={night} time={time} x={320} y={70} />
        {!night && <Cloud x={130} y={62} s={0.8} cls="cloud cloud-1" />}
        {/* Mar e ilhazinha */}
        <rect x="0" y="170" width="400" height="80" fill={night ? '#22408A' : '#3FB7E8'} />
        <path d="M250 172 Q280 150 310 172Z" fill={night ? '#2D5A4C' : '#5FBF77'} />
        {[0, 1, 2].map((i) => (
          <path key={i} className="wave-bob" style={{ animationDelay: `${i * 0.7}s` }} d={`M${-20 + i * 30} ${186 + i * 16} q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0`} stroke="#fff" strokeWidth="2.4" fill="none" opacity="0.6" />
        ))}
        {/* Areia */}
        <path d="M0 236 C80 220 170 228 250 232 C320 236 360 226 400 228 V300 H0Z" fill={night ? '#9C8B6A' : '#FFE2A3'} />
        {/* Bangalô sobre a água */}
        <g transform="translate(88 150)" data-tap="casa">
          {[-34, -12, 12, 34].map((x) => (
            <rect key={x} x={x - 3} y="56" width="6" height="40" fill="#8A5A3B" />
          ))}
          <rect x="-44" y="50" width="88" height="8" rx="2" fill="#B07A52" />
          <rect x="-36" y="14" width="72" height="38" rx="3" fill={night ? '#B89A78' : '#F7DDB0'} />
          <path d="M-52 18 L0 -24 L52 18Z" fill="#E8C060" />
          {[-40, -24, -8, 8, 24, 40].map((x) => (
            <path key={x} d={`M${x} 18 L${x * 0.2} -18`} stroke="#C9A040" strokeWidth="2" />
          ))}
          <rect x="-8" y="24" width="16" height="28" rx="3" fill="#7A4E32" />
          <Window x={-30} y={24} w={14} h={12} night={night} />
          <Window x={16} y={24} w={14} h={12} night={night} />
        </g>
        <Palm x={250} y={244} s={1} />
        <Palm x={372} y={238} s={0.85} flip />
        {/* Guarda-sol, bola e estrela-do-mar */}
        <g transform="translate(200 236)" data-tap="">
          <path d="M0 0 V30" stroke="#8A5A3B" strokeWidth="3" />
          <path d="M-30 4 Q0 -24 30 4Z" fill="#F26D6D" />
          <path d="M-14 2 Q-8 -16 0 -18 Q-6 -10 -6 3Z M8 3 Q8 -10 0 -18 Q10 -16 16 2Z" fill="#fff" />
        </g>
        <g transform="translate(320 282)" data-tap="bola">
          <circle r="10" fill="#fff" />
          <path d="M0 -10 A10 10 0 0 1 10 0 L0 0Z" fill="#F26D6D" />
          <path d="M0 10 A10 10 0 0 1 -10 0 L0 0Z" fill="#6AAEF5" />
        </g>
        <path d="M40 284 l3 -7 l3 7 l7 1 l-5 4 l2 7 l-7 -4 l-7 4 l2 -7 l-5 -4z" fill="#FF9F4D" data-tap="bicho" />
      </>
    ),
  },

  neve: {
    sky: { dia: ['#9FCBF5', '#EAF4FF'], noite: ['#141C48', '#3A4A8E'], amanhecer: ['#B8D8FF', '#FFE0D0'], entardecer: ['#8C8FE0', '#FFC3B0'] },
    ambient: 'neve',
    draw: ({ night, time }) => (
      <>
        <SunMoon night={night} time={time} x={80} y={56} />
        {/* Montanhas nevadas */}
        <path d="M0 200 L70 110 L120 160 L190 80 L260 170 L320 110 L400 190 V300 H0Z" fill={night ? '#3D4E86' : '#9AB0D8'} />
        <path d="M70 110 L88 132 L76 130 L64 140 L56 128Z M190 80 L212 108 L198 104 L186 116 L174 102Z M320 110 L340 134 L326 130 L314 140 L304 128Z" fill="#fff" />
        <path d="M0 224 C80 206 170 214 240 218 C320 222 360 210 400 212 V300 H0Z" fill="#F4F8FF" />
        {/* Chalé */}
        <g transform="translate(86 160)" data-tap="casa">
          <rect x="22" y="-24" width="12" height="26" fill="#8A5A3B" />
          <rect x="-44" y="20" width="88" height="70" rx="3" fill={night ? '#6E4A30' : '#A86E44'} />
          {[34, 48, 62, 76].map((y) => (
            <path key={y} d={`M-44 ${y} H44`} stroke="#7A4E32" strokeWidth="2" />
          ))}
          <path d="M-56 26 L0 -28 L56 26Z" fill="#7A4E32" />
          <path d="M-60 28 L0 -32 L60 28 L52 30 L0 -20 L-52 30Z" fill="#fff" />
          <path d="M-12 90 V60 Q-12 50 0 50 Q12 50 12 60 V90Z" fill="#5E3B27" />
          <Window x={-36} y={40} w={18} h={16} night={night} />
          <Window x={18} y={40} w={18} h={16} night={night} />
          {/* Lenha */}
          <g transform="translate(56 76)">
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={i * 9} cy="0" r="5" fill="#C98D5E" stroke="#8A5A3B" strokeWidth="2" />
            ))}
            <circle cx="4.5" cy="-8" r="5" fill="#C98D5E" stroke="#8A5A3B" strokeWidth="2" />
          </g>
        </g>
        <Pine x={260} y={236} s={1.2} c={night ? '#1E4A3A' : '#2F7A4A'} snow />
        <Pine x={370} y={232} s={1} c={night ? '#1E4A3A' : '#3B8C58'} snow />
        {/* Boneco de neve */}
        <g transform="translate(320 250)" data-tap="boneco">
          <circle cx="0" cy="16" r="16" fill="#fff" />
          <circle cx="0" cy="-8" r="11" fill="#fff" />
          <circle cx="-4" cy="-10" r="1.6" fill="#4B4F5E" />
          <circle cx="4" cy="-10" r="1.6" fill="#4B4F5E" />
          <path d="M0 -7 L8 -5 L0 -4Z" fill="#FF9F4D" />
          <path d="M-10 0 Q0 5 10 0" stroke="#F26D6D" strokeWidth="4" fill="none" />
          <rect x="-8" y="-28" width="16" height="10" rx="2" fill="#4B4F5E" />
        </g>
        <path d="M0 262 C90 252 180 256 260 260 C320 263 360 256 400 258 V300 H0Z" fill="#E6EEFB" />
        {/* Trenó */}
        <g transform="translate(200 284)" data-tap="">
          <rect x="-18" y="-10" width="36" height="8" rx="3" fill="#F26D6D" />
          <path d="M-20 0 H22 Q28 0 26 -6" stroke="#8A5A3B" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      </>
    ),
  },

  cidade: {
    sky: { dia: ['#8EC5FF', '#E3EEFF'], noite: ['#101640', '#3A2F7A'], amanhecer: ['#A8C8FF', '#FFD6C9'], entardecer: ['#7F6FD8', '#FF9FA0'] },
    ambient: 'cidade',
    draw: ({ night, time }) => (
      <>
        <SunMoon night={night} time={time} x={340} y={52} />
        {/* Prédios ao fundo */}
        {[[140, 90, 40, '#7C93B8'], [186, 70, 44, '#8E9BB8'], [234, 100, 36, '#6E86B0'], [276, 60, 46, '#A3AEC8'], [326, 96, 40, '#7C93B8'], [370, 80, 40, '#8E9BB8']].map(([x, top, w, c], i) => (
          <g key={i}>
            <rect x={x} y={top} width={w} height={210 - (top as number)} fill={night ? '#252C5A' : (c as string)} />
            {Array.from({ length: 5 }).map((_, r) =>
              [0, 1].map((col) => (
                <rect key={`${r}${col}`} x={(x as number) + 6 + col * ((w as number) / 2)} y={(top as number) + 10 + r * 20} width="8" height="10" rx="1.5" fill={night ? ((r + col + i) % 3 ? '#FFD36B' : '#3A4170') : '#DDE8FF'} className={night && (r + col) % 4 === 0 ? 'twinkle' : undefined} />
              )),
            )}
          </g>
        ))}
        <rect x="0" y="210" width="400" height="90" fill={night ? '#3A3F58' : '#B9C1D6'} />
        {/* Prédio da casa do Hami */}
        <g transform="translate(20 70)" data-tap="casa">
          <rect x="0" y="0" width="110" height="170" rx="6" fill={night ? '#5B4F94' : '#FF9FB5'} />
          {[20, 60, 100].map((y) => (
            <g key={y}>
              <Window x={14} y={y} w={30} h={24} night={night} />
              <Window x={66} y={y} w={30} h={24} night={night} />
              <rect x="60" y={y + 26} width="42" height="5" rx="2" fill="#fff" opacity="0.7" />
            </g>
          ))}
          <rect x="40" y="134" width="30" height="36" rx="3" fill="#3A3F58" />
          <rect x="16" y="-14" width="78" height="18" rx="5" fill={night ? '#2A2F55' : '#4B4F5E'} />
          <text x="55" y="-1" textAnchor="middle" fontSize="11" fontWeight="900" fill={night ? '#3AE0D0' : '#FFE27A'} fontFamily="sans-serif">HAMI</text>
          <circle cx="102" cy="124" r="8" fill="#5FBF77" />
        </g>
        {/* Calçada e rua */}
        <rect x="0" y="244" width="400" height="10" fill={night ? '#4E5470' : '#D8DCE6'} />
        <rect x="0" y="254" width="400" height="46" fill={night ? '#2E3248' : '#7C8499'} />
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={10 + i * 52} y="276" width="26" height="4" rx="2" fill="#fff" opacity="0.7" />
        ))}
        {/* Poste, árvore e bicicleta */}
        <g transform="translate(170 196)" data-tap="">
          <rect x="-2" y="0" width="4" height="50" fill="#4B4F5E" />
          <path d="M0 0 Q0 -10 10 -10 H16" stroke="#4B4F5E" strokeWidth="4" fill="none" />
          <ellipse cx="18" cy="-8" rx="7" ry="4" fill={night ? '#FFE27A' : '#fff'} />
          {night && <circle cx="18" cy="-4" r="20" fill="#FFE27A" opacity="0.2" />}
        </g>
        <g transform="translate(330 214)" data-tap="">
          <rect x="-16" y="16" width="32" height="16" rx="3" fill="#A86E44" />
          <circle cx="0" cy="0" r="20" fill={night ? '#245A44' : '#5FBF77'} />
        </g>
        <g transform="translate(250 236)" data-tap="">
          <circle cx="-12" cy="0" r="8" stroke="#4B4F5E" strokeWidth="2.4" fill="none" />
          <circle cx="12" cy="0" r="8" stroke="#4B4F5E" strokeWidth="2.4" fill="none" />
          <path d="M-12 0 L-4 -10 H6 L12 0 M-4 -10 L0 0 L6 -10" stroke="#F26D6D" strokeWidth="2.4" fill="none" />
        </g>
      </>
    ),
  },

  mar: {
    sky: { dia: ['#5FC7E8', '#1F6FA8'], noite: ['#2A6AA0', '#0E2F5E'] },
    fixedSky: true,
    ambient: 'bolhas',
    draw: ({ night }) => (
      <>
        {/* Raios de luz */}
        {[60, 160, 260, 350].map((x, i) => (
          <path key={i} d={`M${x} 0 L${x + 30} 0 L${x + 70} 240 L${x + 10} 240Z`} fill="#fff" opacity={night ? 0.04 : 0.1} />
        ))}
        {/* Peixes */}
        {[[300, 90, '#FFD25A'], [240, 130, '#FF9F4D'], [340, 150, '#FF92B4']].map(([x, y, c], i) => (
          <g key={i} className="fish-swim" style={{ animationDelay: `${i * 1.6}s` }} data-tap="agua">
            <g transform={`translate(${x} ${y})`}>
              <ellipse cx="0" cy="0" rx="12" ry="7" fill={c as string} />
              <path d="M10 0 L20 -7 V7Z" fill={c as string} />
              <circle cx="-6" cy="-1" r="1.6" fill="#4B4F5E" />
            </g>
          </g>
        ))}
        {/* Areia e pedras */}
        <path d="M0 236 C80 220 170 228 250 232 C320 236 360 226 400 228 V300 H0Z" fill="#E3CF96" />
        <ellipse cx="350" cy="252" rx="34" ry="14" fill="#8E9BB8" />
        {/* Casa em bolha de vidro */}
        <g transform="translate(92 170)" data-tap="casa">
          <ellipse cx="0" cy="66" rx="70" ry="10" fill="#C9B47E" />
          <path d="M-62 66 Q-62 -40 0 -40 Q62 -40 62 66Z" fill="#DDF6FF" opacity="0.45" />
          <rect x="-34" y="10" width="68" height="56" rx="10" fill="#FF92B4" />
          <path d="M-40 14 Q0 -24 40 14Z" fill="#E8709A" />
          <path d="M-8 66 V44 Q-8 36 0 36 Q8 36 8 44 V66Z" fill="#7A3B5E" />
          <circle cx="-20" cy="30" r="7" fill={night ? '#FFD36B' : '#BFE8FF'} stroke="#fff" strokeWidth="2" />
          <circle cx="20" cy="30" r="7" fill={night ? '#FFD36B' : '#BFE8FF'} stroke="#fff" strokeWidth="2" />
          <path d="M-50 20 Q-46 -10 -24 -26" stroke="#fff" strokeWidth="4" opacity="0.6" fill="none" strokeLinecap="round" />
        </g>
        {/* Algas e corais */}
        {[[200, 260], [222, 266], [380, 262], [20, 268]].map(([x, y], i) => (
          <path key={i} className="tree-sway" style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${i * 0.5}s` }} d={`M${x} ${y} q-8 -16 0 -30 q8 -14 0 -30`} stroke="#3FB27F" strokeWidth="6" fill="none" strokeLinecap="round" data-tap="" />
        ))}
        <g transform="translate(300 262)" data-tap="">
          <path d="M0 0 V-20 M0 -12 Q-10 -16 -12 -28 M0 -16 Q10 -20 12 -32" stroke="#FF7FA8" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
        {/* Baú do tesouro */}
        <g transform="translate(250 282)" data-tap="bau">
          <rect x="-16" y="-14" width="32" height="18" rx="3" fill="#A86E44" />
          <path d="M-16 -14 Q0 -28 16 -14Z" fill="#C98D5E" />
          <rect x="-3" y="-12" width="6" height="8" fill="#FFD25A" />
        </g>
        <path d="M40 286 q6 -10 12 0 q-6 6 -12 0" fill="#FFD3E1" />
      </>
    ),
  },

  sonhos: {
    sky: { dia: ['#F2C9FF', '#FFE3F1'], noite: ['#3A2A6E', '#8A5FB8'], amanhecer: ['#F7D0FF', '#FFE6C9'], entardecer: ['#C99BFF', '#FFC2C9'] },
    ambient: 'brilhos',
    draw: ({ night }) => (
      <>
        {/* Arco-íris */}
        <g opacity="0.85">
          {['#FF9FB5', '#FFD25A', '#9FE3A5', '#9FCBFF', '#C9A8FF'].map((c, i) => (
            <path key={c} d={`M${60 + i * 10} 220 A${150 - i * 10} ${150 - i * 10} 0 0 1 ${360 - i * 10} 220`} stroke={c} strokeWidth="10" fill="none" />
          ))}
        </g>
        <circle cx="320" cy="60" r="18" fill="#FFF3B0" />
        <circle cx="328" cy="54" r="15" fill={night ? '#3A2A6E' : '#F2C9FF'} />
        {/* Montanhas de nuvem */}
        <path d="M0 214 Q30 180 70 200 Q110 160 160 196 Q210 170 250 198 Q300 166 350 196 Q380 182 400 196 V300 H0Z" fill="#fff" />
        <path d="M0 240 Q60 220 120 236 Q190 220 250 236 Q320 222 400 238 V300 H0Z" fill="#FFF0F8" />
        {/* Casa de doce */}
        <g transform="translate(86 150)" data-tap="casa">
          <rect x="-40" y="24" width="80" height="70" rx="12" fill="#FFF3DC" />
          <path d="M-52 30 Q-52 -20 0 -24 Q52 -20 52 30 Q40 22 26 30 Q13 22 0 30 Q-13 22 -26 30 Q-40 22 -52 30Z" fill="#FF92B4" />
          <circle cx="-26" cy="0" r="4" fill="#fff" />
          <circle cx="14" cy="-8" r="3" fill="#FFE27A" />
          <circle cx="30" cy="8" r="3" fill="#9FCBFF" />
          <path d="M-12 94 V64 Q-12 54 0 54 Q12 54 12 64 V94Z" fill="#C9A8FF" />
          <circle cx="-24" cy="50" r="9" fill={night ? '#FFD36B' : '#BFE8FF'} stroke="#FF92B4" strokeWidth="3" />
          <circle cx="24" cy="50" r="9" fill={night ? '#FFD36B' : '#BFE8FF'} stroke="#FF92B4" strokeWidth="3" />
        </g>
        {/* Árvores de pirulito */}
        {[[220, 236, '#FF92B4'], [340, 230, '#9FCBFF'], [380, 246, '#FFD25A']].map(([x, y, c], i) => (
          <g key={i} transform={`translate(${x} ${y})`} className="tree-sway" data-tap="">
            <rect x="-2" y="0" width="4" height="34" fill="#fff" />
            <circle cx="0" cy="-10" r="16" fill={c as string} />
            <path d="M-10 -10 A10 10 0 0 1 10 -10 A6 6 0 0 1 -2 -10" stroke="#fff" strokeWidth="3" fill="none" />
          </g>
        ))}
        {/* Estrelas em hastes */}
        {[[270, 246], [190, 260]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`} data-tap="brilho">
            <path d="M0 0 V30" stroke="#FFE27A" strokeWidth="2.4" />
            <path d="M0 -12 l4 8 l9 1 l-7 6 l2 9 l-8 -5 l-8 5 l2 -9 l-7 -6 l9 -1z" fill="#FFE27A" />
          </g>
        ))}
      </>
    ),
  },

  castelo: {
    sky: { dia: ['#9FC8FF', '#F2EBFF'], noite: ['#1E1C52', '#4A3A8E'], amanhecer: ['#B8D0FF', '#FFE0D0'], entardecer: ['#8F7FE0', '#FFB8B0'] },
    ambient: 'bandeiras',
    draw: ({ night, time }) => (
      <>
        <SunMoon night={night} time={time} x={340} y={50} />
        {!night && <Cloud x={250} y={70} s={0.9} cls="cloud cloud-1" />}
        <path d="M0 210 C60 180 140 190 200 200 C270 210 330 182 400 196 V300 H0Z" fill={night ? '#3D4E70' : '#B9D8A4'} />
        {/* Castelo */}
        <g transform="translate(110 90)" data-tap="casa">
          <rect x="-70" y="60" width="140" height="110" fill={night ? '#8A84B0' : '#E6E2F5'} />
          {[-70, -44, -18, 8, 34, 60].map((x) => (
            <rect key={x} x={x} y="50" width="14" height="14" fill={night ? '#8A84B0' : '#E6E2F5'} />
          ))}
          {[-86, 58].map((x) => (
            <g key={x}>
              <rect x={x} y="20" width="28" height="150" fill={night ? '#9D95C4' : '#D8D0EC'} />
              <path d={`M${x - 6} 22 L${x + 14} -18 L${x + 34} 22Z`} fill="#A98DDF" />
              <path d={`M${x + 14} -18 V-34`} stroke="#4B4F5E" strokeWidth="2" />
              <path d={`M${x + 14} -34 L${x + 30} -28 L${x + 14} -22Z`} fill="#F26D6D" className="flag-wave" />
              <Window x={x + 7} y={50} w={14} h={18} night={night} />
            </g>
          ))}
          <rect x="-18" y="0" width="36" height="70" fill={night ? '#9D95C4' : '#D8D0EC'} />
          <path d="M-24 2 L0 -40 L24 2Z" fill="#A98DDF" />
          <path d="M0 -40 V-56 M0 -56 L16 -50 L0 -44Z" stroke="#4B4F5E" strokeWidth="2" fill="#FFD25A" className="flag-wave" />
          <circle cx="0" cy="30" r="9" fill={night ? '#FFD36B' : '#BFE8FF'} />
          <path d="M-22 170 V130 Q-22 108 0 108 Q22 108 22 130 V170Z" fill="#7A4E32" />
          <path d="M-22 130 H22 M-11 112 V170 M11 112 V170" stroke="#5E3B27" strokeWidth="2" />
          <Window x={-50} y={90} w={16} h={22} night={night} />
          <Window x={34} y={90} w={16} h={22} night={night} />
        </g>
        <path d="M0 252 C90 240 180 246 260 250 C320 253 360 244 400 246 V300 H0Z" fill={night ? '#2E4B3A' : '#7CCB6A'} />
        <path d="M84 300 L98 260 H122 L136 300Z" fill={night ? '#6F6152' : '#F2DDB0'} />
        {/* Arbustos podados */}
        {[[260, 256], [340, 252], [20, 266]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`} data-tap="">
            <rect x="-3" y="0" width="6" height="16" fill="#8A5A3B" />
            <circle cx="0" cy="-10" r="16" fill={night ? '#245A44' : '#4FA35C'} />
            <circle cx="0" cy="-34" r="10" fill={night ? '#245A44' : '#4FA35C'} />
          </g>
        ))}
        <Flower x={300} y={272} c="#FF7FA0" />
        <Flower x={380} y={276} c="#FFD34D" d={0.4} />
      </>
    ),
  },

  espaco: {
    sky: { dia: ['#141A44', '#3E2F7A'], noite: ['#0B0F2E', '#2A1F5E'] },
    fixedSky: true,
    ambient: 'estrelas',
    draw: () => (
      <>
        <Stars list={[...NIGHT_STARS, [70, 120], [180, 130], [330, 140], [20, 90]]} />
        {/* Planeta com anel e Terra */}
        <g transform="translate(320 70)" data-tap="">
          <circle r="30" fill="#FF9F4D" />
          <path d="M-28 -8 Q0 -14 28 -8 M-26 8 Q0 14 26 8" stroke="#E27E2C" strokeWidth="4" fill="none" opacity="0.6" />
          <ellipse rx="52" ry="12" fill="none" stroke="#C9A8FF" strokeWidth="5" transform="rotate(-15)" />
        </g>
        <g transform="translate(80 60)" data-tap="">
          <circle r="18" fill="#6AAEF5" />
          <path d="M-12 -6 Q-4 -12 2 -6 Q4 2 -6 4 Z M4 6 Q12 2 14 8 Q8 14 4 10Z" fill="#72C97F" />
        </g>
        <path className="shooting" d="M150 40 L190 30" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        {/* Chão da lua */}
        <path d="M0 220 C80 204 170 212 240 216 C320 220 360 208 400 210 V300 H0Z" fill="#8E95AE" />
        {[[60, 250, 18], [220, 240, 12], [330, 262, 20], [150, 280, 10]].map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx={r} ry={(r as number) * 0.4} fill="#6E7590" />
        ))}
        {/* Base espacial */}
        <g transform="translate(96 170)" data-tap="casa">
          <path d="M-56 56 Q-56 -14 0 -14 Q56 -14 56 56Z" fill="#E9EEF8" />
          <path d="M-40 56 Q-40 2 0 2 Q40 2 40 56" fill="none" stroke="#C9D2E6" strokeWidth="3" />
          <path d="M-56 30 H56" stroke="#C9D2E6" strokeWidth="3" />
          <rect x="-10" y="30" width="20" height="26" rx="8" fill="#A57CF0" />
          <circle cx="-30" cy="16" r="8" fill="#3AE0D0" opacity="0.8" />
          <circle cx="30" cy="16" r="8" fill="#3AE0D0" opacity="0.8" />
          <rect x="56" y="36" width="50" height="14" rx="7" fill="#C9D2E6" />
          {/* Antena */}
          <path d="M20 -14 V-40" stroke="#C9D2E6" strokeWidth="3" />
          <path d="M6 -40 Q20 -60 34 -40Z" fill="#E9EEF8" />
          <circle cx="20" cy="-42" r="3" fill="#F26D6D" className="twinkle" />
        </g>
        {/* Foguete */}
        <g transform="translate(300 234)" data-tap="foguete">
          <path d="M0 -60 Q14 -44 12 -10 H-12 Q-14 -44 0 -60Z" fill="#fff" />
          <circle cx="0" cy="-36" r="5" fill="#6AAEF5" />
          <path d="M-12 -20 L-22 -4 L-12 -6Z M12 -20 L22 -4 L12 -6Z" fill="#F26D6D" />
          <rect x="-16" y="-10" width="32" height="6" rx="2" fill="#8E95AE" />
        </g>
        <g transform="translate(200 250)" data-tap="">
          <path d="M0 0 V-30" stroke="#C9D2E6" strokeWidth="2" />
          <path d="M0 -30 H18 V-20 H0Z" fill="#FF92B4" />
        </g>
      </>
    ),
  },

  celeste: {
    sky: { dia: ['#FFE9A3', '#BFE6FF'], noite: ['#2A2470', '#7F6FD8'], amanhecer: ['#FFD9A3', '#C9E6FF'], entardecer: ['#FFB38A', '#C9A8FF'] },
    ambient: 'celeste',
    draw: ({ night }) => (
      <>
        {night && <Stars list={NIGHT_STARS} />}
        {/* Aurora */}
        <path d="M0 80 Q100 40 200 80 T400 70" stroke="#9FE3C9" strokeWidth="18" fill="none" opacity="0.35" />
        <path d="M0 100 Q120 60 220 100 T400 90" stroke="#C9A8FF" strokeWidth="12" fill="none" opacity="0.3" />
        {/* Nuvens de baixo */}
        <path d="M0 250 Q40 226 80 244 Q120 222 170 244 Q220 224 270 244 Q320 222 360 244 Q384 232 400 240 V300 H0Z" fill="#fff" />
        {/* Ilhas flutuantes pequenas */}
        {[[330, 120, 0.6], [40, 140, 0.45]].map(([x, y, s], i) => (
          <g key={i} className="float-bob" style={{ animationDelay: `${i * 1.3}s` }}>
            <g transform={`translate(${x} ${y}) scale(${s})`} data-tap="">
              <path d="M-40 0 H40 L20 30 L0 50 L-20 30Z" fill="#B07A52" />
              <path d="M-42 0 Q0 -10 42 0 Q20 6 0 4 Q-20 6 -42 0Z" fill="#72C97F" />
              <path d={`M-10 -2 l4 -14 l4 14`} fill="#9FE3C9" />
            </g>
          </g>
        ))}
        {/* A ilha principal */}
        <g className="float-bob">
          <path d="M20 214 H380 L330 262 L260 292 L200 300 L140 292 L70 262Z" fill="#A86E44" />
          <path d="M70 262 L140 292 L200 300 L260 292 L330 262 L300 256 L200 270 L100 256Z" fill="#7A4E32" opacity="0.5" />
          <path d="M16 214 Q200 194 384 214 Q300 222 200 220 Q100 222 16 214Z" fill="#72C97F" />
          {/* Cachoeira */}
          <path d="M330 216 V300" stroke="#BFE6FF" strokeWidth="10" opacity="0.9" />
          <path d="M330 216 V300" stroke="#fff" strokeWidth="3" opacity="0.8" strokeDasharray="6 8" className="water-fall" />
          {/* Templo dourado */}
          <g transform="translate(100 110)" data-tap="casa">
            <rect x="-56" y="94" width="112" height="10" rx="3" fill="#E8B020" />
            {[-44, -22, 0, 22, 44].map((x) => (
              <rect key={x} x={x - 5} y="40" width="10" height="56" rx="3" fill="#FFF3C9" />
            ))}
            <rect x="-56" y="30" width="112" height="12" rx="3" fill="#F2C94C" />
            <path d="M-50 30 Q0 -40 50 30Z" fill="#F2C94C" />
            <path d="M-34 28 Q0 -20 34 28" fill="none" stroke="#FFF3C9" strokeWidth="3" />
            <circle cx="0" cy="-16" r="6" fill="#FFF3C9" />
            <path d="M0 -30 l3 7 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1z" fill="#FFD25A" className="twinkle" />
            <rect x="-10" y="60" width="20" height="34" rx="10" fill="#C9A8FF" opacity="0.8" />
          </g>
          {/* Cristais */}
          {[[240, 206], [270, 210]].map(([x, y], i) => (
            <path key={i} d={`M${x} ${y} l8 -24 l8 24z`} fill={i ? '#C9A8FF' : '#9FE3C9'} data-tap="brilho" />
          ))}
          <Flower x={210} y={200} c="#FF9FC2" />
          <Flower x={300} y={198} c="#FFE27A" d={0.5} />
        </g>
      </>
    ),
  },

  // Fora da casa lunar: chão de Lua, crateras, a Terra no céu e o foguete.
  lua: {
    sky: { dia: ['#0D1030', '#262A5C'], noite: ['#0D1030', '#262A5C'], amanhecer: ['#0D1030', '#262A5C'], entardecer: ['#0D1030', '#262A5C'] },
    ambient: 'estrelas',
    draw: () => (
      <>
        <Stars list={NIGHT_STARS} />
        <g data-tap="">
          <circle cx="320" cy="64" r="30" fill="#5FB4F5" />
          <path d="M304 50 q14 -8 22 2 q-4 14 -18 10 Z M322 74 q14 -4 18 6 q-10 10 -20 2 Z" fill="#6FC46A" />
          <circle cx="320" cy="64" r="30" fill="none" stroke="#BFE6FF" strokeOpacity="0.45" strokeWidth="3" />
        </g>
        <path d="M0 210 Q70 176 140 200 Q210 170 290 198 Q350 180 400 196 V300 H0Z" fill="#6D7392" />
        <path d="M0 232 Q100 206 200 226 T400 220 V300 H0Z" fill="#8E94AE" />
        <path d="M0 256 Q120 240 240 252 T400 248 V300 H0Z" fill="#B9BDCB" />
        {[[70, 268, 26], [200, 280, 34], [330, 266, 22], [130, 244, 14], [280, 240, 12]].map(([x, y, r], i) => (
          <g key={i} data-tap="">
            <ellipse cx={x} cy={y} rx={r} ry={r * 0.28} fill="#8E94AE" />
            <ellipse cx={x} cy={y - 1.5} rx={r * 0.7} ry={r * 0.16} fill="#6D7392" />
          </g>
        ))}
        <g transform="translate(92 150)" data-tap="casa">
          <path d="M0 -70 C22 -44 22 0 16 34 H-16 C-22 0 -22 -44 0 -70 Z" fill="#F4F5F8" />
          <path d="M0 -70 C10 -58 14 -48 15 -40 H-15 C-14 -48 -10 -58 0 -70 Z" fill="#E0554F" />
          <circle cx="0" cy="-14" r="10" fill="#7FB8F0" stroke="#fff" strokeWidth="3" />
          <path d="M-16 14 L-34 40 H-16 Z M16 14 L34 40 H16 Z" fill="#E0554F" />
        </g>
        <g transform="translate(250 196)" data-tap="">
          <rect x="-2" y="-46" width="4" height="46" fill="#D5D8E6" />
          <path d="M2 -46 H30 L23 -36 L30 -26 H2 Z" fill="#FF8FA8" />
        </g>
      </>
    ),
  },
};

export const ARENA_SCENE_IDS = Object.keys(LOOKS);

function skyFor(look: ArenaLook, time: SkyTime): Sky {
  if (look.fixedSky) return time === 'noite' ? look.sky.noite : look.sky.dia;
  return look.sky[time] ?? (time === 'noite' ? look.sky.noite : look.sky.dia);
}

/** Partículas do clima de cada arena. */
function Ambient({ kind, night }: { kind: ArenaLook['ambient']; night: boolean }) {
  switch (kind) {
    case 'borboletas':
    case 'petalas':
      return night ? (
        <Fireflies list={[[110, 200], [300, 214], [250, 186], [356, 232]]} />
      ) : (
        <>
          <Butterflies list={[[150, 150, '#B7A6FF'], [300, 176, '#FFB3C7']]} />
          {kind === 'petalas' && [40, 140, 240, 340].map((x, i) => <ellipse key={i} className="fall-slow" style={{ animationDelay: `${i * 1.4}s` }} cx={x} cy="-10" rx="4" ry="2.4" fill="#FFB3C7" />)}
        </>
      );
    case 'fumaca':
      return (
        <>
          {[0, 1, 2].map((i) => (
            <circle key={i} className="smoke-rise" style={{ animationDelay: `${i * 1.2}s` }} cx="100" cy="118" r="7" fill="#fff" opacity="0.7" />
          ))}
          {night && <Fireflies list={[[220, 230], [360, 220]]} />}
        </>
      );
    case 'folhas':
      return night ? (
        <Fireflies list={[[150, 220], [210, 200], [330, 230], [380, 210], [60, 240]]} />
      ) : (
        <>{[60, 160, 260, 360].map((x, i) => <path key={i} className="fall-slow" style={{ animationDelay: `${i * 1.3}s` }} d={`M${x} -10 q5 -6 10 0 q-5 6 -10 0`} fill={i % 2 ? '#FF9F4D' : '#FFD25A'} />)}</>
      );
    case 'ondas':
      return night ? <Stars list={NIGHT_STARS} /> : <>{[[180, 120], [210, 110]].map(([x, y], i) => <path key={i} className="bird-fly" style={{ animationDelay: `${i * 2}s` }} d={`M${x} ${y} q5 -5 10 0 q5 -5 10 0`} stroke="#4B4F5E" strokeWidth="2" fill="none" />)}</>;
    case 'neve':
      return <>{Array.from({ length: 14 }, (_, i) => <circle key={i} className="snow-fall" style={{ animationDelay: `${(i * 0.53) % 6}s`, animationDuration: `${6 + (i % 4)}s` }} cx={(i * 29) % 400} cy="-6" r={1.6 + (i % 3)} fill="#fff" />)}</>;
    case 'cidade':
      return night ? <Stars list={NIGHT_STARS.slice(0, 5)} /> : null;
    case 'bolhas':
      return <>{Array.from({ length: 9 }, (_, i) => <circle key={i} className="bubble-rise" style={{ animationDelay: `${i * 0.7}s` }} cx={40 + i * 42} cy="300" r={2 + (i % 3) * 2} fill="none" stroke="#fff" strokeWidth="1.6" opacity="0.8" />)}</>;
    case 'brilhos':
    case 'bandeiras':
    case 'celeste':
      return <>{[[40, 60], [130, 40], [220, 70], [300, 30], [370, 110], [180, 120]].map(([x, y], i) => <path key={i} className="twinkle" style={{ animationDelay: `${i * 0.45}s` }} d={`M${x} ${y - 5} Q${x + 1} ${y - 1} ${x + 5} ${y} Q${x + 1} ${y + 1} ${x} ${y + 5} Q${x - 1} ${y + 1} ${x - 5} ${y} Q${x - 1} ${y - 1} ${x} ${y - 5}Z`} fill={night ? '#FFF3B0' : '#fff'} />)}</>;
    case 'estrelas':
      return null;
  }
}

// ---------- Toques: cada coisa reage do seu jeito (som, partículas e um pulinho) ----------

type Fx = 'folhas' | 'petalas' | 'coracoes' | 'bolhas' | 'brilhos' | 'notas';
const TAP: Record<string, { sound: SoundId; fx: Fx; anim?: string }> = {
  arvore: { sound: 'sacudir', fx: 'folhas' },
  flor: { sound: 'brilho', fx: 'petalas' },
  casa: { sound: 'pronto', fx: 'coracoes' },
  cogumelo: { sound: 'quica', fx: 'brilhos', anim: 'is-boing' },
  bola: { sound: 'quica', fx: 'brilhos', anim: 'is-boing' },
  agua: { sound: 'bolha', fx: 'bolhas' },
  brilho: { sound: 'brilho', fx: 'brilhos' },
  bau: { sound: 'bau-abre', fx: 'brilhos' },
  foguete: { sound: 'magia', fx: 'brilhos', anim: 'is-launch' },
  boneco: { sound: 'risada', fx: 'coracoes' },
  bicho: { sound: 'iii', fx: 'coracoes', anim: 'is-boing' },
  carta: { sound: 'enviar', fx: 'coracoes' },
  sino: { sound: 'pronto', fx: 'notas' },
  gato: { sound: 'ronrom', fx: 'coracoes' },
  '': { sound: 'pega', fx: 'brilhos' },
};

interface Burst {
  id: number;
  x: number;
  y: number;
  fx: Fx;
}

function Particle({ fx, x, y, i }: { fx: Fx; x: number; y: number; i: number }) {
  switch (fx) {
    case 'folhas':
      return <path d={`M${x} ${y} q4 -5 8 0 q-4 5 -8 0`} fill={i % 2 ? '#FFB347' : '#5FBF77'} />;
    case 'petalas':
      return <ellipse cx={x} cy={y} rx="3.4" ry="2.2" fill={i % 2 ? '#FFB3C7' : '#FFFFFF'} />;
    case 'coracoes':
      return <path d={`M${x} ${y + 4} C${x - 6} ${y} ${x - 4} ${y - 5} ${x} ${y - 2} C${x + 4} ${y - 5} ${x + 6} ${y} ${x} ${y + 4} Z`} fill={i % 2 ? '#FF6F91' : '#FF9FC2'} />;
    case 'bolhas':
      return <circle cx={x} cy={y} r={2 + (i % 3)} fill="none" stroke="#FFFFFF" strokeWidth="1.4" />;
    case 'notas':
      return (
        <text x={x} y={y} fontSize="12" fontWeight="800" fill={i % 2 ? '#7E57D6' : '#F6B94A'} fontFamily="sans-serif">
          {i % 2 ? '♪' : '♫'}
        </text>
      );
    default:
      return <path d={`M${x} ${y - 4} Q${x + 1} ${y - 1} ${x + 4} ${y} Q${x + 1} ${y + 1} ${x} ${y + 4} Q${x - 1} ${y + 1} ${x - 4} ${y} Q${x - 1} ${y - 1} ${x} ${y - 4} Z`} fill={i % 2 ? '#FFE27A' : '#FFFFFF'} />;
  }
}

function BurstFx({ b }: { b: Burst }) {
  const n = 6;
  return (
    <g pointerEvents="none">
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + (b.id % 7) * 0.4;
        const dx = Math.cos(a) * (14 + (i % 3) * 8);
        const dy = b.fx === 'folhas' ? 24 + (i % 3) * 10 : -20 - (i % 3) * 9 + Math.sin(a) * 6;
        return (
          <g key={i} className="burst-p" style={{ '--dx': `${dx.toFixed(1)}px`, '--dy': `${dy.toFixed(1)}px`, animationDelay: `${i * 30}ms` } as CSSProperties}>
            <Particle fx={b.fx} x={b.x} y={b.y} i={i} />
          </g>
        );
      })}
    </g>
  );
}

interface Peek {
  id: number;
  x: number;
  y: number;
}

/** O pet desta arena (ou o ovo dele) espia do lado da casa. */
function PeekPet({ arenaN, peek }: { arenaN: number; peek: Peek }) {
  const s = useApp();
  const pet = companionOfArena(arenaN);
  const got = pet ? s.companions?.got[pet.id] : undefined;
  if (!pet || !got) return null;
  const warmth = got.hatched ? HATCH_DAYS : eggWarmth(s.days, got.at);
  const say = got.hatched ? `Oi! Sou ${pet.name}` : warmth >= HATCH_DAYS ? 'Vou nascer!' : '?';
  const w = say.length * 5.6 + 14;
  return (
    <g key={peek.id} className="peek-pop" style={{ transformOrigin: `${peek.x}px ${peek.y}px` }} pointerEvents="none">
      <svg x={peek.x - 24} y={peek.y - 46} width="48" height="48" viewBox="0 0 100 100" overflow="visible">
        {got.hatched ? <CompanionShape pet={pet} /> : <EggShape colors={pet.egg} warmth={warmth} />}
      </svg>
      <g transform={`translate(${Math.min(398 - w, peek.x + 10)} ${peek.y - 62})`}>
        <rect x="0" y="-12" width={w} height="17" rx="8.5" fill="#FFFFFF" opacity="0.95" />
        <text x={w / 2} y="0.5" textAnchor="middle" fontSize="10" fontWeight="800" fill="#4B3F66" fontFamily="sans-serif">
          {say}
        </text>
      </g>
    </g>
  );
}

let tapSeq = 0;

interface Props {
  arena: string;
  time?: SkyTime;
  height?: number | string;
  children?: ReactNode;
  overlay?: ReactNode;
  fade?: boolean;
  /** Miniatura (mapa): sem partículas e sem toques. */
  mini?: boolean;
  /** Arena ainda bloqueada: aparece em silhueta. */
  locked?: boolean;
  /** 'meet' mostra o cenário inteiro (sem cortar as laterais). */
  fit?: 'slice' | 'meet';
  className?: string;
}

export function ArenaScene({ arena, time = skyOf(), height = 300, children, overlay, fade, mini, locked, fit = 'slice', className = '' }: Props) {
  const look = LOOKS[arena] ?? LOOKS.casinha;
  const uid = useId().replace(/:/g, '');
  const night = time === 'noite';
  const [top, bottom] = skyFor(look, time);
  const arenaN = gameCfg().arenas.find((a) => a.id === arena)?.n ?? 0;
  const s = useApp();
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [peek, setPeek] = useState<Peek | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  function onTap(e: MouseEvent<SVGSVGElement>) {
    const el = (e.target as Element).closest('[data-tap]') as SVGGraphicsElement | null;
    if (!el) return;
    const kind = el.getAttribute('data-tap') ?? '';
    const t = TAP[kind] ?? TAP[''];
    const anim = t.anim ?? 'is-tapped';
    el.classList.remove(anim);
    void el.getBBox?.();
    el.classList.add(anim);
    later(() => el.classList.remove(anim), 700);
    const svg = e.currentTarget;
    const m = svg.getScreenCTM();
    if (!m) return;
    const inv = m.inverse();
    const toSvg = (x: number, y: number) => {
      const pt = svg.createSVGPoint();
      pt.x = x;
      pt.y = y;
      return pt.matrixTransform(inv);
    };
    const p = toSvg(e.clientX, e.clientY);
    const id = ++tapSeq;
    play(t.sound, { step: id % 5 });
    setBursts((b) => [...b.slice(-5), { id, x: p.x, y: p.y, fx: t.fx }]);
    later(() => setBursts((b) => b.filter((x) => x.id !== id)), 1100);
    // Tocou na casa: o pet desta arena (ou o ovo dele) espia do lado.
    if (kind === 'casa' && arenaN && !locked) {
      const r = el.getBoundingClientRect();
      const corner = toSvg(r.right, r.bottom);
      const x = Math.max(28, Math.min(372, corner.x - 6));
      const y = Math.max(70, Math.min(294, corner.y - 2));
      setPeek({ id, x, y });
      const pet = companionOfArena(arenaN);
      const got = pet ? s.companions?.got[pet.id] : undefined;
      if (pet && got) later(() => play(got.hatched ? PET_VOICE[pet.kind] : 'bau-treme'), 380);
      later(() => setPeek((cur) => (cur?.id === id ? null : cur)), 3400);
    }
  }

  return (
    <div className={`scene arena-scene ${locked ? 'is-locked' : ''} ${className}`} style={{ height }} data-arena={arena}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 300" preserveAspectRatio={`xMidYMax ${fit}`} aria-hidden="true" onClick={mini ? undefined : onTap}>
        <defs>
          <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={top} />
            <stop offset="1" stopColor={bottom} />
          </linearGradient>
          <radialGradient id={`lt-${uid}`} cx="0.82" cy="0.08" r="0.95">
            <stop offset="0" stopColor="#FFF4CF" stopOpacity={night ? 0 : 0.3} />
            <stop offset="1" stopColor="#FFF4CF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`vg-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.72" stopColor="#1A1430" stopOpacity="0" />
            <stop offset="1" stopColor="#1A1430" stopOpacity={night ? 0.26 : 0.1} />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill={`url(#sky-${uid})`} />
        {night && !look.fixedSky && look.ambient !== 'celeste' && <Stars list={NIGHT_STARS} />}
        {look.draw({ night, time, id: uid })}
        {ARENA_DETAILS[arena]?.(night)}
        <rect width="400" height="300" fill={`url(#lt-${uid})`} pointerEvents="none" />
        <rect width="400" height="300" fill={`url(#vg-${uid})`} pointerEvents="none" />
        {!mini && <Ambient kind={look.ambient} night={night} />}
        {!mini && peek && <PeekPet arenaN={arenaN} peek={peek} />}
        {!mini && bursts.map((b) => <BurstFx key={b.id} b={b} />)}
      </svg>
      {fade && <div className="scene-fade" aria-hidden="true" />}
      {children && <div className="pointer-events-none relative z-[1] flex h-full items-end justify-center pb-3"><div className="pointer-events-auto">{children}</div></div>}
      {overlay && <div className="absolute inset-x-3 top-3 z-[2]">{overlay}</div>}
    </div>
  );
}
