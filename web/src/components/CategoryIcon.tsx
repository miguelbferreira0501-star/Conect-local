import type { CSSProperties } from 'react';
import { Camera, Car, Hammer, House, Laptop, LayoutGrid, PartyPopper, PawPrint, PenTool, Sparkles, SprayCan, Trophy, type LucideIcon } from 'lucide-react';

/** Mapeia o nome de ícone salvo na categoria (banco) para o componente Lucide. */
const ICONS: Record<string, LucideIcon> = { Camera, Car, Hammer, House, Laptop, LayoutGrid, PartyPopper, PawPrint, PenTool, Sparkles, SprayCan, Trophy };

export function CategoryIcon({ icon, className = 'h-6 w-6', style }: { icon: string; className?: string; style?: CSSProperties }) {
  const Icon = ICONS[icon] ?? LayoutGrid;
  return <Icon className={className} style={style} aria-hidden="true" strokeWidth={1.9} />;
}
