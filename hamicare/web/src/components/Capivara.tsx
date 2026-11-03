// Dona Capivara, a vendedora da lojinha (desenho próprio do HamiCare).
export function Capivara({ size = 96 }: { size?: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label="Dona Capivara" className="capivara">
      <ellipse cx="60" cy="112" rx="38" ry="5" fill="rgba(0,0,0,0.12)" />
      {/* corpo */}
      <path d="M22 108 C18 74 34 52 60 52 C86 52 102 74 98 108 Z" fill="#B9825A" />
      {/* avental */}
      <path d="M38 76 L82 76 L86 108 L34 108 Z" fill="#FFE2EC" />
      <path d="M38 76 L82 76" stroke="#FF8FB1" strokeWidth="4" strokeLinecap="round" />
      <circle cx="60" cy="92" r="5" fill="#FF8FB1" />
      {/* cabeça */}
      <path d="M26 44 C26 22 44 12 62 12 C84 12 98 26 96 44 C95 58 84 64 62 64 C40 64 26 60 26 44 Z" fill="#C68E63" />
      {/* orelhas */}
      <ellipse cx="38" cy="16" rx="7" ry="6" fill="#A06C47" />
      <ellipse cx="78" cy="14" rx="7" ry="6" fill="#A06C47" />
      {/* focinho */}
      <path d="M58 34 C60 26 96 26 98 40 C99 52 86 58 72 56 C62 55 56 46 58 34 Z" fill="#A87450" />
      <ellipse cx="90" cy="36" rx="3" ry="2" fill="#4A3020" />
      <path d="M78 48 q6 4 12 0" stroke="#4A3020" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      {/* olho fechadinho e bochecha */}
      <path d="M48 34 q5 -5 10 0" stroke="#2B2224" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="50" cy="45" rx="6" ry="3.5" fill="#FF9FB6" opacity="0.6" />
      {/* laranjinha na cabeça */}
      <circle cx="58" cy="9" r="9" fill="#FFA43A" />
      <path d="M58 0 q4 -3 7 1 q-4 2 -7 -1 Z" fill="#5DB36A" />
      <circle cx="55" cy="6" r="2" fill="#FFFFFF" opacity="0.5" />
      {/* bracinhos */}
      <ellipse cx="30" cy="84" rx="7" ry="10" fill="#A06C47" transform="rotate(20 30 84)" />
      <ellipse cx="90" cy="84" rx="7" ry="10" fill="#A06C47" transform="rotate(-20 90 84)" />
    </svg>
  );
}
