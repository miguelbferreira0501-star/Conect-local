import type { ReactNode } from 'react';
import { BadgeCheck, CalendarCheck, MessageSquareReply, ShieldCheck, Users } from 'lucide-react';
import { BADGES, type BadgeId } from '@conecta/shared';

export function Tag({ children, tone = 'neutral', icon }: { children: ReactNode; tone?: 'neutral' | 'brand' | 'accent' | 'warning'; icon?: ReactNode }) {
  // Selos: fundo pálido com texto escuro do mesmo tom, cantos de 4px, sem borda.
  const tones = {
    neutral: 'bg-raised text-[#374151]',
    brand: 'bg-brand-50 text-brand-900',
    accent: 'bg-brand-50 text-brand-900',
    warning: 'bg-warning-50 text-warning-700',
  };
  return (
    <span className={`inline-flex flex-none items-center gap-1 whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {icon}
      {children}
    </span>
  );
}

export function DemoTag() {
  return <Tag tone="warning">Exemplo</Tag>;
}

const BADGE_ICONS: Record<BadgeId, typeof BadgeCheck> = {
  verified: BadgeCheck,
  consistent_history: ShieldCheck,
  many_reviews: Users,
  responsive: MessageSquareReply,
  booking_available: CalendarCheck,
};

export function TrustBadge({ id, withTitle = true }: { id: BadgeId; withTitle?: boolean }) {
  const Icon = BADGE_ICONS[id];
  const def = BADGES[id];
  return (
    <span title={withTitle ? def.criteria : undefined}>
      <Tag tone={id === 'verified' ? 'brand' : 'neutral'} icon={<Icon className="h-3.5 w-3.5" aria-hidden="true" />}>
        {def.label}
      </Tag>
    </span>
  );
}
