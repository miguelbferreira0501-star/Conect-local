/** Imagens de empresa. Sem foto cadastrada, mostramos uma ilustração neutra (nunca uma foto inventada). */
import { CategoryIcon } from '../CategoryIcon';

const PALETTES = [
  // Tema escuro: fundo profundo + cor viva para as iniciais e o ícone.
  ['#272250', '#B3A8FF'], ['#13312C', '#5FE0C6'], ['#3A2614', '#FFB27A'], ['#33203F', '#E3A8FF'],
  ['#14283A', '#7CC4FF'], ['#3A1A24', '#FF9BB3'], ['#22301A', '#B6E37A'], ['#26262E', '#C9C9D6'],
];

export function paletteFor(key: string) {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

export function initials(name: string) {
  return name
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 || /^[A-ZÀ-Ú]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

export function BusinessLogo({ name, logoUrl, size = 56, className = '' }: { name: string; logoUrl: string | null; size?: number; className?: string }) {
  const [bg, fg] = paletteFor(name);
  if (logoUrl) {
    return <img src={logoUrl} alt="" width={size} height={size} loading="lazy" className={`shrink-0 rounded-xl object-cover ${className}`} style={{ width: size, height: size }} />;
  }
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-xl font-bold ${className}`}
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  );
}

export function BusinessCover({ name, coverUrl, icon, className = '' }: { name: string; coverUrl: string | null; icon: string; className?: string }) {
  const [bg, fg] = paletteFor(name + icon);
  if (coverUrl) return <img src={coverUrl} alt="" loading="lazy" className={`w-full object-cover ${className}`} />;
  return (
    <div aria-hidden="true" className={`relative w-full overflow-hidden ${className}`} style={{ background: bg }}>
      <svg className="absolute inset-0 h-full w-full opacity-[0.35]" preserveAspectRatio="none" viewBox="0 0 400 120">
        <circle cx="340" cy="10" r="90" fill={fg} opacity="0.12" />
        <circle cx="40" cy="130" r="70" fill={fg} opacity="0.08" />
      </svg>
      <CategoryIcon icon={icon} className="absolute bottom-3 right-4 h-10 w-10 opacity-40" style={{ color: fg }} />
    </div>
  );
}
