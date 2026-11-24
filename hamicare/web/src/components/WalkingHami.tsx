// O Hami de lado (virado para a direita) passeando com uma cestinha de vime: desenhado no mesmo jeito do Hami
// realista — corpo redondinho de pelúcia com volume (luz em cima, sombra embaixo), pelo caramelo nas costas e na
// cabeça, carinha branca, olho castanho brilhante, bochecha rosada e contorno fofinho de pelo.
// A patinha segura a alça da cesta de verdade (a cesta balança pendurada nela), as patinhas de baixo alternam o
// passo, o corpo sobe e desce a cada passo e a orelha balança.
import { useId } from 'react';
import { furById } from '../data/fur';
import { costumeOf, garmentColor } from './Wear';
import type { Outfit } from '../types';

const mixHex = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `#${x
    .map((v, i) =>
      Math.round(v + (y[i] - v) * t)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
};

/** Contorno do Hami de lado (corpo + cabeça numa forma só). */
const BODY =
  'M64 180 C42 170 34 142 42 116 C52 88 80 72 110 70 C122 50 146 38 172 40 C204 42 224 64 228 94 C232 116 222 136 204 146 C190 154 178 160 170 168 C156 182 132 188 108 188 C88 188 74 186 64 180 Z';
/** Pelo caramelo: costas e alto da cabeça (a carinha, a bochecha e a barriga ficam branquinhas). */
const PATCH = 'M20 160 C22 110 60 74 112 72 C126 52 150 38 178 40 C200 42 214 52 222 66 C208 66 196 66 186 70 C172 76 164 92 162 108 C156 128 136 138 110 138 C82 138 60 150 50 182 Z';

export function WalkingHami({ fur: furId, outfit, size = 170, still = false }: { fur: string; outfit?: Outfit; size?: number; still?: boolean }) {
  const f = furById(furId);
  const id = useId().replace(/:/g, '');
  const cream = mixHex(f.belly, '#FFFFFF', 0.35);
  const caramel = f.body;
  const deep = f.shade;
  const costume = costumeOf(outfit?.roupa);
  const shirt = costume ? costume.c1 : garmentColor(outfit?.roupa);
  const u = (s: string) => `url(#${s}${id})`;
  return (
    <span className={`wkh ${still ? 'is-still' : ''}`} style={{ width: size, height: (size * 210) / 240 }} role="img" aria-label="Hami passeando com a cestinha">
      <svg viewBox="0 0 240 210" width={size} height={(size * 210) / 240} aria-hidden="true" style={{ overflow: 'visible', display: 'block' }}>
        <defs>
          <clipPath id={`c${id}`}>
            <path d={BODY} />
          </clipPath>
          {/* contorno de pelo (bordinha fofa e irregular) e textura fininha de fios */}
          <filter id={`p${id}`} x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="3.6" xChannelSelector="R" yChannelSelector="G" result="fuzz" />
            <feTurbulence type="fractalNoise" baseFrequency="0.55 1.6" numOctaves="2" seed="9" result="t" />
            <feColorMatrix in="t" type="matrix" values="0 0 0 0.07 0.93  0 0 0 0.07 0.93  0 0 0 0.07 0.93  0 0 0 0 1" result="tex" />
            <feBlend in="fuzz" in2="tex" mode="multiply" result="b" />
            <feComposite in="b" in2="fuzz" operator="in" />
          </filter>
          <filter id={`s${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.2" />
          </filter>
          <filter id={`s2${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
          <linearGradient id={`k${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mixHex(caramel, '#FFFFFF', 0.2)} />
            <stop offset="0.7" stopColor={caramel} />
            <stop offset="1" stopColor={mixHex(caramel, deep, 0.5)} />
          </linearGradient>
          <radialGradient id={`e${id}`} cx="45%" cy="35%" r="70%">
            <stop offset="0" stopColor="#4A2614" />
            <stop offset="0.55" stopColor="#24110A" />
            <stop offset="1" stopColor="#140805" />
          </radialGradient>
          <radialGradient id={`r${id}`} cx="50%" cy="40%" r="60%">
            <stop offset="0" stopColor="#FFC2CF" />
            <stop offset="1" stopColor={f.ear} />
          </radialGradient>
          <linearGradient id={`w${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E0A56A" />
            <stop offset="1" stopColor="#B87A45" />
          </linearGradient>
        </defs>

        <ellipse cx="128" cy="203" rx="86" ry="6.5" fill="rgba(40,30,50,0.18)" />

        <g className="wkh-bob">
          {/* patinhas do outro lado (atrás, mais escurinhas) */}
          <g className="wkh-foot wkh-b" style={{ transformOrigin: '106px 196px' }}>
            <ellipse cx="106" cy="195" rx="11" ry="6" fill={mixHex(cream, '#9C7B78', 0.3)} />
          </g>
          <g className="wkh-foot wkh-a" style={{ transformOrigin: '172px 194px' }}>
            <ellipse cx="172" cy="193" rx="10" ry="5.5" fill={mixHex(cream, '#9C7B78', 0.3)} />
          </g>
          {/* orelha do outro lado e rabinho */}
          <g className="wkh-ear2" style={{ transformOrigin: '186px 50px' }}>
            <ellipse cx="188" cy="38" rx="12" ry="14" transform="rotate(14 188 38)" fill={mixHex(caramel, '#7A5040', 0.25)} />
            <ellipse cx="189" cy="39" rx="7.5" ry="9" transform="rotate(14 189 39)" fill={mixHex(f.ear, '#7A5040', 0.3)} />
          </g>
          <circle cx="40" cy="150" r="7" fill={caramel} filter={u('p')} />

          {/* corpo de pelúcia */}
          <g filter={u('p')}>
            <path d={BODY} fill={cream} />
            <g clipPath={u('c')}>
              <path d={PATCH} fill={u('k')} filter={u('s')} />
              {/* roupinha (quando ele está vestido) */}
              {shirt && (
                <>
                  <path d="M10 112 C60 96 120 104 166 128 C176 134 182 146 184 160 L184 230 L10 230 Z" fill={shirt} />
                  <path d="M166 128 C176 134 182 146 184 160" stroke={mixHex(shirt, '#FFFFFF', 0.4)} strokeWidth="5" fill="none" />
                </>
              )}
              {/* volume: luz em cima, sombra embaixo e no meio da barriga */}
              <ellipse cx="108" cy="80" rx="50" ry="13" fill="#FFFFFF" opacity="0.3" filter={u('s')} />
              <ellipse cx="174" cy="50" rx="26" ry="8" fill="#FFFFFF" opacity="0.42" filter={u('s')} />
              <ellipse cx="124" cy="198" rx="110" ry="26" fill="#6A3A2C" opacity="0.14" filter={u('s')} />
              <ellipse cx="44" cy="150" rx="12" ry="30" fill="#6A3A2C" opacity="0.08" filter={u('s')} />
              <ellipse cx="208" cy="118" rx="22" ry="18" fill="#FFFFFF" opacity="0.4" filter={u('s')} />
            </g>
          </g>

          {/* orelha deste lado (balança no passo) */}
          <g className="wkh-ear" style={{ transformOrigin: '156px 58px' }} filter={u('p')}>
            <ellipse cx="152" cy="40" rx="16" ry="19" transform="rotate(-18 152 40)" fill={mixHex(caramel, '#FFFFFF', 0.25)} />
            <ellipse cx="153" cy="42" rx="10.5" ry="13" transform="rotate(-18 153 42)" fill={u('r')} />
            <ellipse cx="149" cy="36" rx="4" ry="6" transform="rotate(-18 149 36)" fill="#FFFFFF" opacity="0.4" />
          </g>

          {/* olho castanho brilhante (pisca de vez em quando) */}
          <g className="wkh-eye" style={{ transformOrigin: '196px 92px' }}>
            <ellipse cx="196" cy="92" rx="11" ry="12.6" fill={u('e')} />
            <ellipse cx="196" cy="92" rx="11" ry="12.6" fill="none" stroke="#120604" strokeOpacity="0.5" strokeWidth="1" />
            <circle cx="200" cy="86.6" r="4.4" fill="#FFFFFF" />
            <circle cx="191.6" cy="98.8" r="1.9" fill="#FFFFFF" opacity="0.9" />
          </g>
          {/* bochecha rosada, narizinho e boquinha sorrindo */}
          <ellipse cx="202" cy="118" rx="12" ry="7" fill="#FF8FA8" opacity="0.5" filter={u('s2')} />
          <path d="M197 119 l2 -3.4 M201.6 119 l2 -3.4" stroke="#FFFFFF" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" />
          <ellipse cx="227" cy="102" rx="5" ry="3.8" fill="#F293A9" />
          <ellipse cx="226" cy="100.6" rx="1.8" ry="1.1" fill="#FFFFFF" opacity="0.7" />
          <path d="M214 120 Q219 129 225 121" stroke="#5A2A22" strokeWidth="2" strokeLinecap="round" fill="#E86F86" />

          {/* rabinho e patinhas deste lado */}
          <g className="wkh-foot wkh-a" style={{ transformOrigin: '88px 196px' }}>
            <ellipse cx="88" cy="196" rx="13" ry="7" fill={cream} filter={u('p')} />
            <ellipse cx="97" cy="197" rx="3.6" ry="2.8" fill="#F6A9B6" />
          </g>
          <g className="wkh-foot wkh-b" style={{ transformOrigin: '156px 196px' }}>
            <ellipse cx="156" cy="196" rx="12.5" ry="6.6" fill={cream} filter={u('p')} />
            <ellipse cx="165" cy="197" rx="3.6" ry="2.8" fill="#F6A9B6" />
          </g>

          {/* cestinha de vime pendurada na patinha (balança presa na alça) */}
          <g className="wkh-basket" style={{ transformOrigin: '204px 146px' }}>
            <path d="M188 166 C188 142 220 142 220 166" stroke="#9C6436" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M188 166 C188 142 220 142 220 166" stroke="#E7B27C" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            {/* o que tem dentro: paninho rosa e uma florzinha */}
            <path d="M186 166 C190 156 200 154 206 160 C212 154 220 156 224 164 Z" fill="#FF9FB8" />
            <circle cx="212" cy="158" r="4.6" fill="#FFFFFF" />
            <circle cx="212" cy="158" r="1.8" fill="#FFD45C" />
            <path d="M184 165 H224 L220 183 Q219 187 214 187 H194 Q189 187 188 183 Z" fill={u('w')} />
            <path d="M185 171 H223 M186.5 177 H221.5" stroke="#9C6436" strokeWidth="1.4" opacity="0.7" />
            <path d="M192 166 L194 187 M200 166 L201 187 M208 166 L207 187 M216 166 L214 187" stroke="#F2C28E" strokeWidth="1.3" opacity="0.8" />
            <rect x="182" y="163" width="44" height="5" rx="2.5" fill="#C8884E" />
            <rect x="184" y="163.6" width="40" height="1.6" rx="0.8" fill="#F2C28E" opacity="0.8" />
          </g>
          {/* bracinho segurando a alça (a patinha fecha por cima da alça) */}
          <g className="wkh-arm" style={{ transformOrigin: '168px 138px' }}>
            <path d="M164 137 C176 141 190 147 198 149" stroke="#6A3A2C" strokeOpacity="0.22" strokeWidth="13" strokeLinecap="round" fill="none" filter={u('s2')} />
            <path d="M164 134 C176 138 190 144 198 146" stroke={shirt ?? cream} strokeWidth="13" strokeLinecap="round" fill="none" filter={u('p')} />
            <circle cx="203" cy="147" r="7" fill={cream} filter={u('p')} />
            <path d="M200 152 q3 1.6 6 0" stroke="#E7A6B2" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </g>
        </g>
      </svg>
    </span>
  );
}
