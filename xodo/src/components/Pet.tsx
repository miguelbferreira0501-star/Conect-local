import { PET_COLORS, type PetColor } from '../data/colors';

export type PetMood = 'feliz' | 'calmo' | 'sono' | 'animado';

interface Props {
  color: PetColor;
  stage: number;
  mood?: PetMood;
  hat?: string | null;
  acc?: string | null;
  size?: number;
  idle?: boolean;
  label?: string;
}

const INK = '#2A2320';
const STAGE_SCALE = [0.7, 0.82, 0.92, 1];

/** O xodó: uma criatura redonda com um broto na cabeça, que cresce com o cuidado. */
export function Pet({ color, stage, mood = 'feliz', hat, acc, size = 180, idle = true, label }: Props) {
  const c = PET_COLORS[color];
  const s = STAGE_SCALE[stage] ?? 1;
  // Escala a partir do chão (100, 184), assim o bichinho "cresce para cima".
  const grow = `translate(${100 - 100 * s} ${184 - 184 * s}) scale(${s})`;

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={label ?? 'Seu xodó'} className="block overflow-visible">
      <ellipse cx="100" cy="185" rx={46 * s} ry="7" fill="rgba(0,0,0,0.13)" />
      <g transform={grow}>
        <g className={idle ? 'pet-idle' : undefined}>
          <Sprout stage={stage} leaf={c.leaf} />
          <ellipse cx="78" cy="172" rx="15" ry="9" fill={c.shade} />
          <ellipse cx="122" cy="172" rx="15" ry="9" fill={c.shade} />
          <path d="M100 52 C147 52 166 92 164 128 C162 161 136 177 100 177 C64 177 38 161 36 128 C34 92 53 52 100 52 Z" fill={c.body} />
          <path d="M44 132 C50 162 76 174 100 174 C124 174 150 162 156 132 C146 158 126 168 100 168 C74 168 54 158 44 132 Z" fill={c.shade} opacity="0.45" />
          <ellipse cx="76" cy="80" rx="15" ry="9" fill="#fff" opacity="0.35" transform="rotate(-20 76 80)" />
          <ellipse cx="66" cy="130" rx="10" ry="6" fill={c.cheek} opacity="0.55" />
          <ellipse cx="134" cy="130" rx="10" ry="6" fill={c.cheek} opacity="0.55" />
          <Face mood={mood} />
          <Accessory id={acc} />
          <Hat id={hat} />
        </g>
      </g>
    </svg>
  );
}

function Sprout({ stage, leaf }: { stage: number; leaf: string }) {
  const top = stage >= 2 ? 26 : 36;
  const k = stage >= 2 ? 1.25 : 1;
  return (
    <g>
      <path d={`M100 58 Q99 46 101 ${top}`} stroke={leaf} strokeWidth="4" strokeLinecap="round" fill="none" />
      <path
        d={`M101 ${top + 2} C${101 + 10 * k} ${top - 10 * k} ${101 + 24 * k} ${top - 8 * k} ${101 + 27 * k} ${top - 2} C${101 + 18 * k} ${top + 7 * k} ${101 + 8 * k} ${top + 7 * k} 101 ${top + 2} Z`}
        fill={leaf}
      />
      {stage >= 1 && (
        <path
          d={`M100 ${top + 6} C${100 - 10 * k} ${top - 6 * k} ${100 - 24 * k} ${top - 4 * k} ${100 - 27 * k} ${top + 2} C${100 - 18 * k} ${top + 11 * k} ${100 - 8 * k} ${top + 11 * k} 100 ${top + 6} Z`}
          fill={leaf}
          opacity="0.85"
        />
      )}
      {stage >= 3 && (
        <g transform={`translate(101 ${top - 4})`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 6} cy={Math.sin((a * Math.PI) / 180) * 6} r="5" fill="#FFB3C7" />
          ))}
          <circle r="4" fill="#FFD660" />
        </g>
      )}
    </g>
  );
}

function Face({ mood }: { mood: PetMood }) {
  const closed = mood === 'sono' || mood === 'calmo';
  return (
    <g>
      {closed ? (
        <g stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none">
          {mood === 'sono' ? (
            <>
              <path d="M74 114 Q82 118 90 114" />
              <path d="M110 114 Q118 118 126 114" />
            </>
          ) : (
            <>
              <path d="M74 115 Q82 109 90 115" />
              <path d="M110 115 Q118 109 126 115" />
            </>
          )}
        </g>
      ) : (
        <g className="pet-eyes">
          <ellipse cx="82" cy="112" rx="6.5" ry="8.5" fill={INK} />
          <ellipse cx="118" cy="112" rx="6.5" ry="8.5" fill={INK} />
          <circle cx="84.5" cy="108.5" r="2.4" fill="#fff" />
          <circle cx="120.5" cy="108.5" r="2.4" fill="#fff" />
        </g>
      )}
      {mood === 'animado' ? (
        <path d="M92 126 Q100 140 108 126 Z" fill={INK} />
      ) : (
        <path d="M94 127 Q100 133 106 127" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      )}
    </g>
  );
}

function Hat({ id }: { id?: string | null }) {
  switch (id) {
    case 'palha':
      return (
        <g>
          <ellipse cx="100" cy="62" rx="58" ry="11" fill="#E3B65C" />
          <path d="M72 62 C73 34 127 34 128 62 Z" fill="#F0CF7C" />
          <path d="M73 54 L127 54 L128 62 L72 62 Z" fill="#D1495B" />
        </g>
      );
    case 'gorro-natal':
      return (
        <g>
          <path d="M68 64 C70 34 112 20 148 34 C134 42 130 52 134 64 Z" fill="#D7263D" />
          <rect x="64" y="56" width="74" height="13" rx="6.5" fill="#FFFFFF" />
          <circle cx="150" cy="34" r="8" fill="#FFFFFF" />
        </g>
      );
    case 'gorro':
      return (
        <g>
          <path d="M70 64 C70 30 130 30 130 64 Z" fill="#4C9F9F" />
          <path d="M84 40 L84 64 M100 34 L100 64 M116 40 L116 64" stroke="#3B8686" strokeWidth="3" />
          <rect x="66" y="56" width="68" height="12" rx="6" fill="#3B8686" />
          <circle cx="100" cy="30" r="9" fill="#F2C14E" />
        </g>
      );
    case 'bone':
      return (
        <g>
          <path d="M72 64 C72 34 128 34 128 64 Z" fill="#3D6FD8" />
          <path d="M120 60 C140 56 158 60 160 67 C142 70 126 68 118 66 Z" fill="#2F59B3" />
          <circle cx="100" cy="37" r="3.5" fill="#2F59B3" />
        </g>
      );
    case 'coroa':
      return (
        <g>
          {[66, 79, 92, 108, 121, 134].map((x, i) => (
            <g key={x} transform={`translate(${x} ${i === 0 || i === 5 ? 66 : i === 1 || i === 4 ? 59 : 56})`}>
              <circle r="7" fill={['#FF8FB4', '#FFD660', '#FFFFFF', '#B39AE6', '#FF8FB4', '#FFD660'][i]} />
              <circle r="2.6" fill="#E8879E" />
            </g>
          ))}
        </g>
      );
    case 'laco':
      return (
        <g>
          <path d="M132 62 L114 50 L116 74 Z" fill="#FF5E7E" />
          <path d="M132 62 L150 50 L148 74 Z" fill="#FF5E7E" />
          <circle cx="132" cy="62" r="5.5" fill="#E2416A" />
        </g>
      );
    default:
      return null;
  }
}

function Accessory({ id }: { id?: string | null }) {
  switch (id) {
    case 'oculos':
      return (
        <g stroke={INK} strokeWidth="3" fill="#FFFFFF" fillOpacity="0.18">
          <circle cx="82" cy="112" r="13" />
          <circle cx="118" cy="112" r="13" />
          <path d="M95 111 Q100 107 105 111" fill="none" />
        </g>
      );
    case 'cachecol':
      return (
        <g>
          <path d="M46 140 C80 154 120 154 154 140 L156 153 C120 168 80 168 44 153 Z" fill="#D1495B" />
          <path d="M118 154 L128 186 L114 188 L108 157 Z" fill="#B83A4B" />
          <path d="M60 146 L62 159 M80 150 L80 163 M100 151 L100 164" stroke="#F4A3AE" strokeWidth="3" />
        </g>
      );
    case 'gravata':
      return (
        <g>
          <path d="M100 150 L84 141 L84 159 Z" fill="#3D6FD8" />
          <path d="M100 150 L116 141 L116 159 Z" fill="#3D6FD8" />
          <circle cx="100" cy="150" r="4.5" fill="#2F59B3" />
        </g>
      );
    default:
      return null;
  }
}
