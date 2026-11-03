// Cenário vivo do Início: o jardim do Hami com céu que acompanha a hora do dia.
// Arte própria do HamiCare: colinas, a toca no tronco, nuvens, flores, borboletas e vaga-lumes.
import type { ReactNode } from 'react';

export type SkyTime = 'amanhecer' | 'dia' | 'entardecer' | 'noite';

export function skyOf(d = new Date()): SkyTime {
  const h = d.getHours();
  if (h >= 5 && h < 8) return 'amanhecer';
  if (h >= 8 && h < 17) return 'dia';
  if (h >= 17 && h < 19) return 'entardecer';
  return 'noite';
}

const SKY: Record<SkyTime, { top: string; bottom: string; far: string; near: string; ground: string; tree: string; light: boolean }> = {
  amanhecer: { top: '#9FD2FF', bottom: '#FFE2C4', far: '#A9D99A', near: '#86C977', ground: '#7BBE6B', tree: '#4FA35C', light: true },
  dia: { top: '#7CC8FF', bottom: '#D9F2FF', far: '#A3DB8E', near: '#7CCB6A', ground: '#6FBF5E', tree: '#3E9C55', light: true },
  entardecer: { top: '#8C7BE0', bottom: '#FFB38A', far: '#9CBF83', near: '#79A866', ground: '#6C9C59', tree: '#3F7F4C', light: true },
  noite: { top: '#1C2357', bottom: '#4B4C9A', far: '#3D6B5C', near: '#2F5A4C', ground: '#2A5244', tree: '#1F4338', light: false },
};

interface Props {
  time?: SkyTime;
  height?: number;
  children?: ReactNode;
  /** Algo por cima de tudo (fala do Hami, avisos). */
  overlay?: ReactNode;
  /** O chão se funde com a cor da tela (Início). */
  fade?: boolean;
}

export function Scene({ time = skyOf(), height = 300, children, overlay, fade }: Props) {
  const c = SKY[time];
  const night = time === 'noite';
  return (
    <div className="scene" style={{ height }}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c.top} />
            <stop offset="1" stopColor={c.bottom} />
          </linearGradient>
          <radialGradient id="sunGlow">
            <stop offset="0" stopColor={night ? '#FFF6C9' : '#FFF3B0'} stopOpacity="0.9" />
            <stop offset="1" stopColor={night ? '#FFF6C9' : '#FFF3B0'} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="300" fill="url(#sky)" />
        {/* Sol ou lua */}
        <g className="sun-bob">
          <circle cx={night ? 318 : 70} cy={night ? 58 : 62} r="46" fill="url(#sunGlow)" />
          {night ? (
            <g>
              <circle cx="318" cy="58" r="20" fill="#FFF3C4" />
              <circle cx="328" cy="52" r="17" fill={c.top} />
            </g>
          ) : (
            <circle cx="70" cy="62" r="22" fill={time === 'entardecer' ? '#FFC36B' : '#FFE066'} />
          )}
        </g>
        {night &&
          [
            [40, 40], [96, 22], [150, 54], [210, 30], [262, 66], [360, 26], [380, 88], [120, 92], [230, 96],
          ].map(([x, y], i) => <circle key={i} className="twinkle" style={{ animationDelay: `${i * 0.37}s` }} cx={x} cy={y} r={i % 3 === 0 ? 1.8 : 1.2} fill="#FFFFFF" />)}
        {/* Nuvens */}
        {!night && (
          <g fill="#FFFFFF" opacity="0.92">
            <g className="cloud cloud-1">
              <ellipse cx="160" cy="58" rx="34" ry="13" />
              <ellipse cx="146" cy="50" rx="16" ry="13" />
              <ellipse cx="172" cy="47" rx="19" ry="15" />
            </g>
            <g className="cloud cloud-2" opacity="0.8">
              <ellipse cx="300" cy="96" rx="28" ry="10" />
              <ellipse cx="292" cy="89" rx="13" ry="10" />
              <ellipse cx="310" cy="86" rx="15" ry="12" />
            </g>
          </g>
        )}
        {/* Colinas */}
        <path d="M0 190 C60 150 120 160 180 178 C240 196 300 150 400 168 L400 300 L0 300 Z" fill={c.far} />
        {/* Árvores do fundo */}
        {[
          [28, 172, 1], [62, 166, 0.8], [342, 160, 1.1], [382, 164, 0.85],
        ].map(([x, y, k], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${k})`} className="tree-sway" style={{ animationDelay: `${i * 0.6}s` }}>
            <rect x="-3" y="-4" width="6" height="22" rx="2" fill={night ? '#3A2C2A' : '#8A5A3B'} />
            <circle cx="0" cy="-16" r="18" fill={c.tree} />
            <circle cx="-11" cy="-6" r="12" fill={c.tree} />
            <circle cx="11" cy="-7" r="13" fill={c.tree} />
            <circle cx="-5" cy="-22" r="6" fill="#FFFFFF" opacity="0.12" />
          </g>
        ))}
        <path d="M0 222 C70 196 150 206 210 214 C280 224 330 200 400 206 L400 300 L0 300 Z" fill={c.near} />
        {/* A toca do Hami: um tronco com portinha redonda */}
        <g transform="translate(66 156)">
          <path d="M-36 66 C-38 34 -34 6 -28 -6 L28 -6 C34 6 38 34 36 66 Z" fill={night ? '#5B4036' : '#B07A52'} />
          <ellipse cx="0" cy="-6" rx="28" ry="8" fill={night ? '#7A5848' : '#D7A574'} />
          <ellipse cx="0" cy="-6" rx="19" ry="4.5" fill="none" stroke={night ? '#5B4036' : '#B07A52'} strokeWidth="2" />
          <path d="M-14 66 L-14 40 C-14 26 14 26 14 40 L14 66 Z" fill={night ? '#2B1E1A' : '#5E3B27'} />
          <circle cx="8" cy="50" r="2" fill="#F6C445" />
          <circle cx="-16" cy="16" r="8" fill={night ? '#FFD36B' : '#BFE8FF'} stroke={night ? '#7A5848' : '#8A5A3B'} strokeWidth="3" />
          {night && <circle cx="-16" cy="16" r="16" fill="#FFD36B" opacity="0.18" />}
          <path d="M-30 -10 C-20 -26 -6 -22 -2 -12" stroke="#5DB36A" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="-2" cy="-14" r="5" fill="#FF7FA0" />
          <circle cx="-2" cy="-14" r="2" fill="#FFE066" />
        </g>
        {/* Chão e caminho */}
        <path d="M0 252 C90 238 180 244 260 248 C320 251 360 242 400 244 L400 300 L0 300 Z" fill={c.ground} />
        <path d="M150 300 C160 270 180 258 200 254 C222 258 240 270 250 300 Z" fill={night ? '#6F6152' : '#F2DDB0'} opacity="0.85" />
        {/* Flores que balançam */}
        {[
          [24, 262, '#FF7FA0'], [118, 252, '#FFD34D'], [292, 256, '#B48CFF'], [352, 266, '#FF9D5C'], [380, 248, '#FFFFFF'], [8, 244, '#FFD34D'],
        ].map(([x, y, col], i) => (
          <g key={i} className="flower" style={{ transformOrigin: `${x}px ${Number(y) + 14}px`, animationDelay: `${i * 0.4}s` }}>
            <path d={`M${x} ${Number(y) + 14} L${x} ${y}`} stroke="#3E8F4A" strokeWidth="2" />
            {[0, 72, 144, 216, 288].map((a) => (
              <circle key={a} cx={Number(x) + Math.cos((a * Math.PI) / 180) * 4} cy={Number(y) + Math.sin((a * Math.PI) / 180) * 4} r="3.4" fill={col as string} />
            ))}
            <circle cx={x} cy={y} r="2.4" fill="#FFE066" />
          </g>
        ))}
        {/* Grama */}
        {Array.from({ length: 14 }, (_, i) => {
          const x = 10 + i * 29;
          return <path key={i} d={`M${x} 290 q2 -10 4 0 q2 -8 4 0`} stroke={night ? '#21463A' : '#4FA35C'} strokeWidth="2" fill="none" />;
        })}
        {/* Borboletas de dia, vaga-lumes à noite */}
        {night
          ? [
              [110, 200], [300, 214], [250, 186], [356, 232],
            ].map(([x, y], i) => <circle key={i} className="firefly" style={{ animationDelay: `${i * 0.8}s` }} cx={x} cy={y} r="2.6" fill="#FFF49A" />)
          : [
              [120, 150], [310, 176],
            ].map(([x, y], i) => (
              <g key={i} className="butterfly" style={{ animationDelay: `${i * 2.2}s` }}>
                <g transform={`translate(${x} ${y})`}>
                  <ellipse className="wing" cx="-4" cy="0" rx="5" ry="6.5" fill={i ? '#FFB3C7' : '#B7A6FF'} />
                  <ellipse className="wing wing-r" cx="4" cy="0" rx="5" ry="6.5" fill={i ? '#FFB3C7' : '#B7A6FF'} />
                  <rect x="-0.8" y="-4" width="1.6" height="8" rx="0.8" fill="#4A3B55" />
                </g>
              </g>
            ))}
      </svg>
      {fade && <div className="scene-fade" aria-hidden="true" />}
      <div className="relative z-[1] flex h-full items-end justify-center pb-3">{children}</div>
      {overlay && <div className="absolute inset-x-3 top-3 z-[2]">{overlay}</div>}
    </div>
  );
}
