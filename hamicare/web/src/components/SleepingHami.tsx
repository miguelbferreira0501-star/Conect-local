// O Hami dormindo de bruços num tapetinho redondo: um "pãozinho" fofo, cabeça grande e redonda apoiada
// nas patinhas, bumbum redondinho com rabinho, a roupa que a pessoa escolheu e "zzz". Respira devagar.
import { furById } from '../data/fur';
import { costumeOf, garmentColor } from './Wear';
import type { Outfit } from '../types';

function darken(hex: string, t: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const ch = (v: number) => Math.round(v * (1 - t)).toString(16).padStart(2, '0');
  return `#${ch(n >> 16)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

let uid = 0;

// corpo deitado (atrás da cabeça) e cabeça redonda e larga, como um mochi
const BODY = 'M92 162 C84 124 112 80 162 78 C214 76 244 104 242 132 C241 152 228 164 204 165 L100 165 C96 165 93 164 92 162 Z';
const HEAD = 'M34 124 C32 90 60 66 94 66 C128 66 154 88 154 120 C154 148 130 166 96 166 C60 166 36 152 34 124 Z';

export function SleepingHami({ fur: furId, size = 230, outfit }: { fur: string; size?: number; outfit?: Outfit }) {
  const fur = furById(furId);
  const line = darken(fur.shade, 0.15);
  // A roupa que a pessoa escolheu continua no corpo enquanto ele dorme.
  const costume = costumeOf(outfit?.roupa);
  const cloth = costume ? costume.c1 : garmentColor(outfit?.roupa);
  const clothLine = cloth ? darken(cloth, 0.2) : line;
  const id = `sh${(uid = (uid + 1) % 1e6)}`;
  return (
    <svg viewBox="0 0 260 186" width={size} height={(size * 186) / 260} role="img" aria-label="Hami dormindo" className="block overflow-visible">
      <defs>
        <clipPath id={`${id}-b`}>
          <path d={BODY} />
        </clipPath>
        <radialGradient id={`${id}-g`} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* tapetinho redondo lilás */}
      <ellipse cx="136" cy="164" rx="122" ry="22" fill="#B79BE6" />
      <ellipse cx="136" cy="162" rx="104" ry="15" fill="#D6C5F4" />
      <ellipse cx="136" cy="162" rx="104" ry="15" fill="none" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="1.6" strokeDasharray="1 7" strokeLinecap="round" />
      <ellipse cx="140" cy="163" rx="100" ry="8" fill="#6E4FB8" opacity="0.16" />

      <g className="sleep-breathe">
        {/* rabinho */}
        <circle cx="238" cy="110" r="10" fill={fur.body} stroke={line} strokeWidth="2.4" />

        {/* contorno único do corpo + cabeça (sem linha no meio) */}
        <path d={BODY} fill="none" stroke={cloth ? clothLine : line} strokeWidth="5" strokeLinejoin="round" />
        <path d={BODY} fill={fur.body} />
        {/* barriguinha clara embaixo do bumbum */}
        <path d="M196 165 C192 150 204 140 220 142 C234 144 240 154 236 162 C226 166 210 166 196 165 Z" fill={fur.belly} />
        {cloth && (
          <g clipPath={`url(#${id}-b)`}>
            {/* moletom cobrindo as costas; a barra arredondada termina antes do bumbum */}
            <path d="M60 60 H204 C192 92 192 134 208 170 H60 Z" fill={cloth} />
            <path d="M204 60 C192 92 192 134 208 170" stroke={clothLine} strokeWidth="6" fill="none" />
            <path d="M198 64 C187 94 187 132 201 168" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="3" fill="none" />
            {/* ursinho bordado */}
            <g transform="translate(176 112)">
              <circle cx="-5" cy="-6" r="3" fill="#FFFFFF" />
              <circle cx="5" cy="-6" r="3" fill="#FFFFFF" />
              <circle r="7.5" fill="#FFFFFF" />
              <circle cx="-2.6" cy="-1" r="1" fill={clothLine} />
              <circle cx="2.6" cy="-1" r="1" fill={clothLine} />
              <path d="M-1.6 2 q1.6 1.6 3.2 0" stroke={clothLine} strokeWidth="0.9" fill="none" strokeLinecap="round" />
            </g>
          </g>
        )}
        <path d={BODY} fill={`url(#${id}-g)`} />

        {/* pezinho de trás com almofadinha rosa */}
        <ellipse cx="226" cy="163" rx="12" ry="7" fill={fur.belly} stroke={line} strokeWidth="2" />
        <ellipse cx="228" cy="163" rx="5" ry="3.4" fill={fur.ear} />

        {/* cabeça inclinada de leve, encostada nas patinhas */}
        <g transform="rotate(-6 94 150)">
        {/* orelhas redondinhas */}
        <circle cx="62" cy="76" r="17" fill={fur.body} stroke={line} strokeWidth="2.6" />
        <circle cx="63" cy="77" r="10.5" fill={fur.ear} />
        <circle cx="128" cy="74" r="17" fill={fur.body} stroke={line} strokeWidth="2.6" />
        <circle cx="127" cy="75" r="10.5" fill={fur.ear} />

        {/* cabeça */}
        <path d={HEAD} fill={fur.body} stroke={line} strokeWidth="2.6" />
        <path d={HEAD} fill={`url(#${id}-g)`} />
        {/* topetinho */}
        <path d="M84 70 C86 60 92 58 94 66 C96 58 104 58 104 68" fill={fur.body} stroke={line} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
        {/* máscara clara do focinho */}
        <path d="M48 138 C48 120 64 112 80 116 C88 110 100 110 108 116 C124 112 142 120 140 138 C138 156 118 164 94 164 C70 164 50 156 48 138 Z" fill={fur.belly} />

        {/* olhinhos fechados, bem curvinhos */}
        <path d="M62 120 q9 8 18 0" stroke="#3A2016" strokeWidth="3.4" strokeLinecap="round" fill="none" />
        <path d="M108 120 q9 8 18 0" stroke="#3A2016" strokeWidth="3.4" strokeLinecap="round" fill="none" />
        {/* bochechas */}
        <ellipse cx="60" cy="136" rx="10" ry="6.5" fill={fur.ear} opacity="0.75" />
        <ellipse cx="128" cy="136" rx="10" ry="6.5" fill={fur.ear} opacity="0.75" />
        {/* focinho, boquinha e dentinho */}
        <ellipse cx="94" cy="130" rx="4.6" ry="3.4" fill="#F08A9A" />
        <path d="M86 137 q4 4 8 0 q4 4 8 0" stroke="#6B3A2A" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <rect x="91.6" y="138.6" width="4.8" height="4.4" rx="1.3" fill="#FFFFFF" stroke="#6B3A2A" strokeWidth="0.9" />

        </g>
        {/* patinhas da frente aparecendo embaixo do queixo */}
        <ellipse cx="76" cy="164" rx="11" ry="6.5" fill={fur.belly} stroke={line} strokeWidth="2" />
        <ellipse cx="112" cy="164" rx="11" ry="6.5" fill={fur.belly} stroke={line} strokeWidth="2" />
        <path d="M73 166 v-3 M79 166 v-3 M109 166 v-3 M115 166 v-3" stroke={line} strokeWidth="1.3" strokeLinecap="round" />
      </g>

      {/* zzz roxo com contorno branco */}
      <g className="sleep-z" fill="#9B6FE0" stroke="#FFFFFF" strokeWidth="4" paintOrder="stroke" strokeLinejoin="round" fontWeight="900" fontFamily="sans-serif">
        <text x="146" y="62" fontSize="18">z</text>
        <text x="162" y="48" fontSize="23">z</text>
        <text x="182" y="34" fontSize="29">Z</text>
      </g>
    </svg>
  );
}
