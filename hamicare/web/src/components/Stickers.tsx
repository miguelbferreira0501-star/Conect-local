// Ícones-adesivo dos botões (contorno branco grosso e sombrinha, como figurinhas): desenhos próprios do Lumbi.
// O contorno branco vem do CSS (.stk), então qualquer desenho daqui vira adesivo.
type P = { size?: number };
const box = (size: number) => ({ width: size, height: size, viewBox: '0 0 64 64', 'aria-hidden': true as const, focusable: false as const });

export function StickerClothes({ size = 44 }: P) {
  return (
    <svg {...box(size)}>
      <path d="M17 13c0-4 6-4 6 0 0 3-4 3-4 6" fill="none" stroke="#8a5a3b" strokeWidth="3" strokeLinecap="round" />
      <path d="M41 13c0-4 6-4 6 0 0 3-4 3-4 6" fill="none" stroke="#8a5a3b" strokeWidth="3" strokeLinecap="round" />
      <path d="M8 26 19 19l11 7-4 6v20H12V32Z" fill="#c9c4ff" stroke="#8f86e8" strokeWidth="2" strokeLinejoin="round" />
      <path d="M34 26l9-7 13 7-4 7v19H38V33Z" fill="#ff8fb4" stroke="#e8628f" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="45" cy="34" r="2.6" fill="#fff" opacity="0.9" />
    </svg>
  );
}

export function StickerHouse({ size = 44 }: P) {
  return (
    <svg {...box(size)}>
      <path d="M8 30 32 10l24 20" fill="none" stroke="#7a4a2c" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 29 32 14l18 15v24H14Z" fill="#ffb24c" />
      <rect x="22" y="33" width="20" height="17" rx="6" fill="#fff2dc" />
      <circle cx="32" cy="43" r="3.4" fill="#f28c38" />
      <circle cx="27.5" cy="38.5" r="1.8" fill="#f28c38" />
      <circle cx="32" cy="36.6" r="1.8" fill="#f28c38" />
      <circle cx="36.5" cy="38.5" r="1.8" fill="#f28c38" />
    </svg>
  );
}

export function StickerTree({ size = 44 }: P) {
  return (
    <svg {...box(size)}>
      <rect x="28" y="38" width="8" height="16" rx="3" fill="#9a6440" />
      <circle cx="32" cy="24" r="14" fill="#6cc46a" />
      <circle cx="21" cy="32" r="10" fill="#58b25a" />
      <circle cx="43" cy="32" r="10" fill="#58b25a" />
      <circle cx="27" cy="20" r="3" fill="#a5e39a" />
      <circle cx="41" cy="27" r="2.2" fill="#ff8fb4" />
      <circle cx="24" cy="31" r="2.2" fill="#ffd34d" />
    </svg>
  );
}

export function StickerInvite({ size = 44 }: P) {
  return (
    <svg {...box(size)}>
      <rect x="8" y="18" width="48" height="34" rx="7" fill="#ffe7a8" />
      <path d="M9 21 32 38l23-17" fill="none" stroke="#e8b248" strokeWidth="3" strokeLinejoin="round" />
      <path d="M32 30c-4-6-12-2-8 4l8 7 8-7c4-6-4-10-8-4Z" fill="#ff6f91" />
      <circle cx="50" cy="16" r="9" fill="#5fc27a" />
      <path d="M50 11.5v9M45.5 16h9" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function StickerCamera({ size = 44 }: P) {
  return (
    <svg {...box(size)}>
      <rect x="8" y="18" width="48" height="34" rx="7" fill="#efe6d8" />
      <rect x="8" y="18" width="48" height="10" rx="5" fill="#3a3440" />
      <rect x="40" y="13" width="10" height="7" rx="2" fill="#e8574a" />
      <circle cx="32" cy="38" r="11" fill="#3a3440" />
      <circle cx="32" cy="38" r="6.5" fill="#6b6475" />
      <circle cx="29.5" cy="35.5" r="2" fill="#fff" />
      <rect x="12" y="47" width="4" height="3" fill="#ff6f91" />
      <rect x="16" y="47" width="4" height="3" fill="#ffd34d" />
      <rect x="20" y="47" width="4" height="3" fill="#5fc27a" />
    </svg>
  );
}

export function StickerGlobe({ size = 44 }: P) {
  return (
    <svg {...box(size)}>
      <circle cx="32" cy="32" r="21" fill="#6fc3f2" />
      <path d="M17 24c6 1 8 6 13 5s4 8 0 11-9 1-11-4-6-3-2-12Z" fill="#7bd36b" />
      <path d="M38 16c5 2 10 6 12 12-5 0-7 4-11 2s-4-10-1-14Z" fill="#7bd36b" />
      <path d="M40 42c3-2 7-1 8 2-2 4-6 7-10 8 0-4-1-8 2-10Z" fill="#7bd36b" />
      <ellipse cx="32" cy="32" rx="27" ry="8" fill="none" stroke="#ffd34d" strokeWidth="3" transform="rotate(-18 32 32)" />
    </svg>
  );
}

export function StickerMenu({ size = 44 }: P) {
  return (
    <svg {...box(size)}>
      <rect x="10" y="10" width="44" height="46" rx="9" fill="#e8dcc6" />
      <rect x="10" y="10" width="44" height="14" rx="7" fill="#c9b493" />
      <rect x="27" y="5" width="10" height="12" rx="3" fill="#8a6a4a" />
      <path d="M32 44c-5-4-11-7-8-12 2-3 6-2 8 1 2-3 6-4 8-1 3 5-3 8-8 12Z" fill="#a98f6c" />
      <rect x="18" y="49" width="28" height="3" rx="1.5" fill="#c9b493" />
    </svg>
  );
}

/** Cara do cachorro (aba "Lumbi" lá embaixo). */
export function StickerDogFace({ size = 44 }: P) {
  return (
    <svg {...box(size)}>
      <ellipse cx="14" cy="30" rx="9" ry="15" fill="#c98a52" transform="rotate(14 14 30)" />
      <ellipse cx="50" cy="30" rx="9" ry="15" fill="#c98a52" transform="rotate(-14 50 30)" />
      <ellipse cx="32" cy="34" rx="20" ry="19" fill="#fdebd0" />
      <circle cx="25" cy="33" r="2.8" fill="#4a2c1d" />
      <circle cx="39" cy="33" r="2.8" fill="#4a2c1d" />
      <ellipse cx="32" cy="39" rx="3" ry="2.2" fill="#4a2c1d" />
      <path d="M28 42c2 2 6 2 8 0" fill="none" stroke="#4a2c1d" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="21" cy="40" r="3" fill="#f7a9a0" opacity="0.7" />
      <circle cx="43" cy="40" r="3" fill="#f7a9a0" opacity="0.7" />
    </svg>
  );
}

/** Menu: três tracinhos gordinhos (adesivo). */
export function StickerLines({ size = 44 }: P) {
  return (
    <svg {...box(size)}>
      {[18, 32, 46].map((y, i) => (
        <rect key={y} x="10" y={y - 5} width="44" height="10" rx="5" fill={['#7B6CF0', '#FF7AA2', '#FFB547'][i]} />
      ))}
    </svg>
  );
}
