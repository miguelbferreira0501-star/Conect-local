/** Imagens de empresa. Sem foto cadastrada, mostramos uma ilustração neutra (nunca uma foto inventada). */
import { CategoryIcon } from '../CategoryIcon';

// Tons de identidade: fundo bem claro e tinta escura do mesmo tom, tons distantes entre si.
const PALETTES = [
  ['#fdf2f7', '#6b1d3e'], ['#ecfdf5', '#065f46'], ['#eff6ff', '#1e3a8a'], ['#fff7ed', '#7c2d12'],
  ['#f0fdfa', '#134e4a'], ['#fefce8', '#713f12'], ['#fef2f2', '#7f1d1d'], ['#f1f5f9', '#334155'],
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
      <CategoryIcon icon={icon} className="absolute bottom-3 right-4 h-9 w-9 opacity-30" style={{ color: fg }} />
    </div>
  );
}
