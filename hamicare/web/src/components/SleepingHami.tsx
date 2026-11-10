// O Hami dormindo enroladinho numa almofada: respira devagar, faz bolinha de ranho e solta "zzz".
import { furById } from '../data/fur';
import { costumeOf, garmentColor } from './Wear';
import type { Outfit } from '../types';

export function SleepingHami({ fur: furId, size = 230, outfit }: { fur: string; size?: number; outfit?: Outfit }) {
  const fur = furById(furId);
  const line = '#B8743C';
  // A roupa que a pessoa escolheu continua no corpo enquanto ele dorme.
  const costume = costumeOf(outfit?.roupa);
  const cloth = costume ? costume.c1 : garmentColor(outfit?.roupa);
  const body = 'M60 106 C58 70 92 52 124 54 C160 56 182 74 180 100 C178 120 150 126 120 124 C88 122 62 122 60 106 Z';
  return (
    <svg viewBox="0 0 240 170" width={size} height={(size * 170) / 240} role="img" aria-label="Hami dormindo" className="block overflow-visible">
      {/* tapetinho e almofada */}
      <path d="M18 150 L60 118 H200 L226 150 Z" fill="#E9D9B8" stroke="#CDB98F" strokeWidth="2" />
      {[34, 48, 62].map((_, i) => <path key={i} d={`M${30 + i * 12} ${150 - i * 10} H${214 - i * 6}`} stroke="#D9C69E" strokeWidth="1.5" />)}
      <ellipse cx="122" cy="122" rx="92" ry="34" fill="#9DBB6E" />
      <ellipse cx="122" cy="114" rx="78" ry="26" fill="#B5CF84" />
      <ellipse cx="122" cy="116" rx="58" ry="17" fill="#A3C176" />
      <g className="sleep-breathe">
        {/* rabinho */}
        <ellipse cx="62" cy="108" rx="11" ry="8" fill={fur.body} stroke={line} strokeWidth="1.8" />
        {/* corpo enroladinho */}
        <defs>
          <clipPath id="sleep-body">
            <path d={body} />
          </clipPath>
        </defs>
        <path d={body} fill={fur.body} stroke={line} strokeWidth="2" />
        {cloth && (
          <g clipPath="url(#sleep-body)">
            <path d="M40 40 H150 C146 70 146 100 154 140 H40 Z" fill={cloth} />
            <path d="M150 40 C146 70 146 100 154 140" stroke="#000" strokeOpacity="0.15" strokeWidth="5" fill="none" />
            <path d="M70 108 C96 116 124 118 150 112" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="4" fill="none" />
          </g>
        )}
        {cloth && <path d={body} fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="2" />}
        <path d="M80 70 C96 60 118 58 134 62" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity="0.35" fill="none" />
        <path d="M76 110 C98 116 130 117 156 112" stroke={line} strokeWidth="1.6" fill="none" opacity="0.5" />
        {/* orelha de trás (aparece atrás da cabeça) */}
        <ellipse cx="176" cy="64" rx="11" ry="10" fill={fur.body} stroke={line} strokeWidth="1.8" transform="rotate(20 176 64)" />
        <ellipse cx="176" cy="65" rx="6.5" ry="6" fill={fur.ear} transform="rotate(20 176 65)" />
        {/* cabeça encostada */}
        <path d="M128 96 C126 74 146 62 166 64 C188 66 200 82 196 100 C192 116 172 122 152 120 C138 118 129 110 128 96 Z" fill={fur.body} stroke={line} strokeWidth="2" />
        <path d="M134 104 C140 96 150 96 156 102 C164 96 176 96 184 104 C188 114 172 120 158 119 C144 118 136 114 134 104 Z" fill={fur.belly} />
        {/* orelha */}
        <ellipse cx="150" cy="66" rx="12" ry="11" fill={fur.body} stroke={line} strokeWidth="1.8" transform="rotate(-25 150 66)" />
        <ellipse cx="151" cy="67" rx="7" ry="6.5" fill={fur.ear} transform="rotate(-25 151 67)" />
        {/* olhinhos fechados e bochecha */}
        <path d="M150 92 q5 4 10 0 M172 92 q5 4 10 0" stroke="#3A2016" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        <ellipse cx="146" cy="102" rx="7" ry="4.5" fill={fur.ear} opacity="0.7" />
        <ellipse cx="188" cy="101" rx="6" ry="4" fill={fur.ear} opacity="0.7" />
        <path d="M164 101 l4 0 l-2 2.6 Z" fill="#F08A9A" />
        {/* patinhas encolhidas */}
        <ellipse cx="132" cy="118" rx="8" ry="5.5" fill={fur.body} stroke={line} strokeWidth="1.6" />
        <ellipse cx="114" cy="120" rx="8" ry="5.5" fill={fur.body} stroke={line} strokeWidth="1.6" />
        {/* bolinha de ranho */}
        <circle className="sleep-bubble" cx="176" cy="108" r="7" fill="#BFE8FF" stroke="#8FCBEA" strokeWidth="1.2" opacity="0.9" />
        <circle cx="174" cy="105.5" r="1.8" fill="#FFFFFF" />
      </g>
      <g fill="#FFFFFF" fontWeight="900" fontFamily="sans-serif" className="sleep-z">
        <text x="196" y="58" fontSize="16">z</text>
        <text x="208" y="42" fontSize="20">z</text>
        <text x="222" y="24" fontSize="24">Z</text>
      </g>
    </svg>
  );
}
