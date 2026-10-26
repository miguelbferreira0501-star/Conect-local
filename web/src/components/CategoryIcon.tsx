import type { CSSProperties } from 'react';
import { Award, Bath, BedDouble, Camera, Car, Footprints, Hammer, HeartHandshake, House, Laptop, LayoutGrid, PartyPopper, PawPrint, PenTool, Sparkles, SprayCan, Trophy, UtensilsCrossed, type LucideIcon } from 'lucide-react';

/** Mapeia o nome de ícone salvo na categoria (banco) para o componente Lucide. */
const ICONS: Record<string, LucideIcon> = { Award, Bath, BedDouble, Footprints, HeartHandshake, Camera, Car, Hammer, House, Laptop, LayoutGrid, PartyPopper, PawPrint, PenTool, Sparkles, SprayCan, Trophy, UtensilsCrossed };

export function CategoryIcon({ icon, className = 'h-6 w-6', style }: { icon: string; className?: string; style?: CSSProperties }) {
  const Icon = ICONS[icon] ?? LayoutGrid;
  return <Icon className={className} style={style} aria-hidden="true" strokeWidth={1.9} />;
}
