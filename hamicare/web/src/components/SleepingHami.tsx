// O Hami dormindo de bruços num tapetinho redondo: cabeça apoiada nas patinhas, bumbum redondinho,
// pezinho de trás aparecendo com a almofadinha rosa, roupa no corpo e "zzz" roxo. Respira devagar.
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

export function SleepingHami({ fur: furId, size = 230, outfit }: { fur: string; size?: number; outfit?: Outfit }) {
  const fur = furById(furId);
  const line = darken(fur.shade, 0.18);
  // A roupa que a pessoa escolheu continua no corpo enquanto ele dorme.
  const costume = costumeOf(outfit?.roupa);
  const cloth = costume ? costume.c1 : garmentColor(outfit?.roupa);
  const clothLine = cloth ? darken(cloth, 0.22) : line;
  const arm = cloth ?? fur.body;
  const armLine = cloth ? clothLine : line;
  const id = `sh${(uid = (uid + 1) % 1e6)}`;
  // corpo deitado de bruços: começa atrás da cabeça e termina no bumbum redondo à direita
  const body = 'M104 142 C98 104 124 76 166 72 C208 68 240 92 238 124 C236 148 216 156 192 156 L118 156 C108 154 105 150 104 142 Z';
  // tufinhos de pelo da cabeça (contorno fofo)
  const head =
    'M44 126 C34 108 38 86 52 74 C50 66 56 60 62 62 C66 54 74 52 80 56 C84 48 94 48 98 54 C104 50 112 52 114 58 ' +
    'C134 62 150 80 152 102 C154 128 136 152 104 156 C78 159 54 150 44 126 Z';
  return (
    <svg viewBox="0 0 260 186" width={size} height={(size * 186) / 260} role="img" aria-label="Hami dormindo" className="block overflow-visible">
      <defs>
        <clipPath id={`${id}-b`}>
          <path d={body} />
        </clipPath>
      </defs>
      {/* tapetinho redondo lilás */}
      <ellipse cx="132" cy="160" rx="124" ry="24" fill="#B79BE6" stroke="#9D7FD6" strokeWidth="2" />
      <ellipse cx="132" cy="158" rx="104" ry="17" fill="#D6C5F4" />
      <ellipse cx="132" cy="158" rx="104" ry="17" fill="none" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="1.6" strokeDasharray="1 7" strokeLinecap="round" />
      <ellipse cx="140" cy="157" rx="98" ry="9" fill="#7A5BC0" opacity="0.18" />

      <g className="sleep-breathe">
        {/* rabinho redondo para cima */}
        <circle cx="222" cy="80" r="12" fill={fur.body} stroke={line} strokeWidth="2" />
        <path d="M216 74 q5 -4 10 -1" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" fill="none" />

        {/* corpo */}
        <path d={body} fill={fur.body} stroke={line} strokeWidth="2.2" />
        <path d="M196 156 C186 144 192 130 208 130 C224 130 232 142 226 156 Z" fill={fur.belly} opacity="0.9" />
        <path d="M200 92 C212 86 226 92 230 104" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="4" strokeLinecap="round" fill="none" />
        {cloth && (
          <g clipPath={`url(#${id}-b)`}>
            {/* moletom cobrindo as costas; a barra termina antes do bumbum */}
            <path d="M80 50 H196 C184 82 186 122 200 162 H80 Z" fill={cloth} />
            <path d="M196 50 C184 82 186 122 200 162" stroke={clothLine} strokeWidth="5" fill="none" />
            <path d="M190 54 C178 86 180 122 193 160" stroke="#FFFFFF" strokeOpacity="0.22" strokeWidth="3" fill="none" />
            <path d="M130 84 C150 76 170 76 186 80" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="5" strokeLinecap="round" fill="none" />
            {/* ursinho bordado */}
            <g transform="translate(162 100)">
              <circle cx="-5" cy="-6" r="3" fill="#FFFFFF" />
              <circle cx="5" cy="-6" r="3" fill="#FFFFFF" />
              <circle r="7.5" fill="#FFFFFF" />
              <circle cx="-2.6" cy="-1" r="1" fill={clothLine} />
              <circle cx="2.6" cy="-1" r="1" fill={clothLine} />
              <path d="M-1.6 2 q1.6 1.6 3.2 0" stroke={clothLine} strokeWidth="0.9" fill="none" strokeLinecap="round" />
            </g>
          </g>
        )}
        <path d={body} fill="none" stroke={cloth ? clothLine : line} strokeWidth="2.2" />

        {/* pezinho de trás com almofadinha rosa */}
        <g transform="rotate(-28 230 150)">
          <ellipse cx="230" cy="150" rx="12" ry="15" fill={fur.belly} stroke={line} strokeWidth="2" />
          <ellipse cx="230" cy="153" rx="5.5" ry="6.5" fill={fur.ear} />
          <circle cx="223.5" cy="142" r="2.2" fill={fur.ear} />
          <circle cx="230" cy="139.5" r="2.2" fill={fur.ear} />
          <circle cx="236.5" cy="142" r="2.2" fill={fur.ear} />
        </g>

        {/* orelhas (atrás da cabeça) */}
        <ellipse cx="128" cy="58" rx="20" ry="18" fill={fur.body} stroke={line} strokeWidth="2.2" transform="rotate(18 128 58)" />
        <ellipse cx="129" cy="59" rx="12" ry="11" fill={fur.ear} transform="rotate(18 129 59)" />
        <ellipse cx="38" cy="106" rx="18" ry="20" fill={fur.body} stroke={line} strokeWidth="2.2" transform="rotate(-20 38 106)" />
        <ellipse cx="39" cy="107" rx="11" ry="12.5" fill={fur.ear} transform="rotate(-20 39 107)" />

        {/* cabeça fofa apoiada nas patinhas */}
        <path d={head} fill={fur.body} stroke={line} strokeWidth="2.2" strokeLinejoin="round" />
        {/* máscara clara do focinho e da bochecha */}
        <path d="M50 132 C50 116 64 110 80 114 C90 106 112 106 124 116 C138 112 150 120 146 136 C140 152 118 158 96 157 C72 157 54 150 50 132 Z" fill={fur.belly} />
        {/* tufinhos claros na testa */}
        <path d="M76 68 q4 -6 9 -4 M86 66 q3 -5 8 -3" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path d="M96 78 q6 -4 12 -1" stroke={line} strokeOpacity="0.45" strokeWidth="1.6" strokeLinecap="round" fill="none" />

        {/* olhinhos fechados com cílios */}
        <path d="M58 122 q11 10 23 1" stroke="#3A2016" strokeWidth="3.6" strokeLinecap="round" fill="none" />
        <path d="M58 122 l-4 -2 M60 125.5 l-4 1" stroke="#3A2016" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M104 116 q12 9 24 -1" stroke="#3A2016" strokeWidth="3.6" strokeLinecap="round" fill="none" />
        <path d="M128 115 l4 -3 M126.5 118.5 l4.5 0" stroke="#3A2016" strokeWidth="1.8" strokeLinecap="round" />
        {/* sobrancelhas suaves */}
        <path d="M64 108 q7 -4 13 -1 M108 102 q7 -4 14 -1" stroke={line} strokeOpacity="0.6" strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* bochechas */}
        <ellipse cx="60" cy="138" rx="11" ry="7" fill={fur.ear} opacity="0.65" />
        <ellipse cx="134" cy="130" rx="10" ry="7" fill={fur.ear} opacity="0.65" />

        {/* focinho, boquinha e dentinhos */}
        <path d="M89 128 C89 124 99 124 99 128 C99 131 95 133 94 133 C93 133 89 131 89 128 Z" fill="#F08A9A" stroke="#C9606F" strokeWidth="1" />
        <path d="M94 133 v3" stroke="#6B3A2A" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M85 136 q4.5 4.5 9 0 q4.5 4.5 9 0" stroke="#6B3A2A" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <rect x="91.2" y="137" width="5.6" height="5" rx="1.4" fill="#FFFFFF" stroke="#6B3A2A" strokeWidth="1" />
        <path d="M94 137.3 v4.4" stroke="#6B3A2A" strokeWidth="0.7" />

        {/* braço com manga vindo do corpo para a frente, por baixo do queixo */}
        <path d="M194 108 C178 100 158 108 148 124 C140 136 136 150 141 157 C147 164 162 163 171 156 C182 146 194 134 200 124 C203 116 200 111 194 108 Z" fill={arm} stroke={armLine} strokeWidth="2.2" strokeLinejoin="round" />
        {cloth && <path d="M150 142 C154 132 162 122 174 116" stroke="#FFFFFF" strokeOpacity="0.28" strokeWidth="3" strokeLinecap="round" fill="none" />}
        {cloth && <path d="M142 148 C148 154 158 156 168 152" stroke={clothLine} strokeWidth="2" fill="none" />}

        {/* patinhas da frente na beirada */}
        <g>
          <ellipse cx="84" cy="157" rx="15" ry="9" fill={fur.belly} stroke={line} strokeWidth="2" />
          <path d="M79 160 v-4 M85 161 v-4" stroke={line} strokeWidth="1.4" strokeLinecap="round" />
          <ellipse cx="140" cy="158" rx="15" ry="9" fill={fur.belly} stroke={line} strokeWidth="2" />
          <path d="M135 161 v-4 M141 162 v-4" stroke={line} strokeWidth="1.4" strokeLinecap="round" />
        </g>
      </g>

      {/* zzz roxo com contorno branco */}
      <g className="sleep-z" fill="#9B6FE0" stroke="#FFFFFF" strokeWidth="4" paintOrder="stroke" strokeLinejoin="round" fontWeight="900" fontFamily="sans-serif">
        <text x="132" y="48" fontSize="18">z</text>
        <text x="148" y="36" fontSize="23">z</text>
        <text x="168" y="24" fontSize="29">Z</text>
      </g>
    </svg>
  );
}
