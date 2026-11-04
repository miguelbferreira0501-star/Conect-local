// Os 5 baús do HamiCare, desenhados à mão em SVG. A tampa pode abrir (animação de abertura).
import type { ChestId } from '../shared/game/config';

interface Look {
  body: string;
  dark: string;
  band: string;
  bandDark: string;
  lock: string;
  glow?: string;
  gem?: string;
}

const LOOKS: Record<ChestId, Look> = {
  madeira: { body: '#C98A55', dark: '#9B6337', band: '#8D96A8', bandDark: '#69728A', lock: '#FFD25A' },
  prata: { body: '#C5CEDD', dark: '#98A3B8', band: '#7FA7D9', bandDark: '#5A82B5', lock: '#EAF2FF', gem: '#7FC8F8' },
  ouro: { body: '#F7C84A', dark: '#D69B1E', band: '#B5742A', bandDark: '#8E5A1C', lock: '#FFF3C9', gem: '#F26D6D', glow: '#FFE27A' },
  magico: { body: '#9A7BF0', dark: '#6F52C9', band: '#FFD25A', bandDark: '#D9A520', lock: '#FFF3C9', gem: '#3AE0D0', glow: '#C9A8FF' },
  lendario: { body: '#FF8FB1', dark: '#E0607F', band: '#FFD25A', bandDark: '#D9A520', lock: '#FFFFFF', gem: '#7FE0FF', glow: '#FFE27A' },
};

export function Chest({ kind, size = 64, open = false, className = '' }: { kind: ChestId; size?: number; open?: boolean; className?: string }) {
  const c = LOOKS[kind] ?? LOOKS.madeira;
  const legend = kind === 'lendario';
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={`chest-art ${open ? 'is-open' : ''} ${className}`} aria-hidden="true">
      {c.glow && <circle cx="32" cy="36" r="28" fill={c.glow} opacity="0.28" className="chest-glow" />}
      {/* Sombra */}
      <ellipse cx="32" cy="58" rx="22" ry="3.4" fill="#2B2240" opacity="0.14" />
      {/* Corpo */}
      <rect x="9" y="30" width="46" height="26" rx="5" fill={legend ? 'url(#chest-rainbow)' : c.body} />
      <rect x="9" y="46" width="46" height="10" rx="5" fill={c.dark} opacity="0.55" />
      {kind === 'madeira' && (
        <g stroke={c.dark} strokeWidth="1.4" opacity="0.7">
          <path d="M12 38 H52 M12 46 H52" />
        </g>
      )}
      <rect x="15" y="30" width="6" height="26" fill={c.band} />
      <rect x="43" y="30" width="6" height="26" fill={c.band} />
      <rect x="15" y="51" width="6" height="5" fill={c.bandDark} />
      <rect x="43" y="51" width="6" height="5" fill={c.bandDark} />
      {/* Brilho de dentro (tampa aberta) */}
      {open && <path d="M14 30 L6 4 H58 L50 30Z" fill={c.glow ?? '#FFF3C9'} opacity="0.55" className="chest-light" />}
      {/* Tampa */}
      <g className="chest-lid" style={{ transformOrigin: '32px 30px', transformBox: 'view-box' }}>
        <path d="M9 30 V24 Q9 12 32 12 Q55 12 55 24 V30Z" fill={legend ? 'url(#chest-rainbow)' : c.body} />
        <path d="M9 30 V26 H55 V30Z" fill={c.dark} opacity="0.5" />
        <path d="M15 30 V16 Q18 13.6 21 13.2 V30Z" fill={c.band} />
        <path d="M43 13.2 Q46 13.6 49 16 V30 H43Z" fill={c.band} />
        <path d="M16 18 Q24 14 32 14" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
      </g>
      {/* Fechadura */}
      <rect x="27" y="26" width="10" height="12" rx="3" fill={c.lock} stroke={c.bandDark} strokeWidth="1.4" />
      <circle cx="32" cy="31" r="1.8" fill={c.bandDark} />
      <path d="M32 32 V35" stroke={c.bandDark} strokeWidth="1.6" strokeLinecap="round" />
      {c.gem && (
        <>
          <path d="M32 40 l3 3 l-3 3 l-3 -3z" fill={c.gem} />
          {kind !== 'prata' && <circle cx="18" cy="22" r="2" fill={c.gem} />}
          {kind !== 'prata' && <circle cx="46" cy="22" r="2" fill={c.gem} />}
        </>
      )}
      {kind === 'magico' && (
        <g fill="#FFF3C9" opacity="0.9">
          <path d="M26 48 l1 2 l2 1 l-2 1 l-1 2 l-1 -2 l-2 -1 l2 -1z" />
          <path d="M38 48 l1 2 l2 1 l-2 1 l-1 2 l-1 -2 l-2 -1 l2 -1z" />
        </g>
      )}
      {(kind === 'ouro' || kind === 'lendario' || kind === 'magico') && (
        <g fill="#fff" className="twinkle">
          <path d="M56 12 l1.2 3 l3 1.2 l-3 1.2 l-1.2 3 l-1.2 -3 l-3 -1.2 l3 -1.2z" />
          <path d="M7 16 l0.8 2 l2 0.8 l-2 0.8 l-0.8 2 l-0.8 -2 l-2 -0.8 l2 -0.8z" />
        </g>
      )}
      {legend && (
        <defs>
          <linearGradient id="chest-rainbow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF9FC2" />
            <stop offset="0.35" stopColor="#FFD25A" />
            <stop offset="0.7" stopColor="#7FE0C9" />
            <stop offset="1" stopColor="#A98DFF" />
          </linearGradient>
        </defs>
      )}
    </svg>
  );
}
