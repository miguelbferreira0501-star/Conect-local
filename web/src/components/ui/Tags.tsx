import type { ReactNode } from 'react';
import { BadgeCheck, CalendarCheck, MessageSquareReply, ShieldCheck, Users } from 'lucide-react';
import { BADGES, type BadgeId } from '@conecta/shared';

export function Tag({ children, tone = 'neutral', icon }: { children: ReactNode; tone?: 'neutral' | 'brand' | 'accent' | 'warning'; icon?: ReactNode }) {
  const tones = {
    neutral: 'bg-surface text-muted border-line',
    brand: 'bg-brand-50 text-brand-fg border-brand-100',
    accent: 'bg-accent-50 text-accent-700 border-accent-100',
    warning: 'bg-warning-50 text-warning-700 border-warning-700/20',
  };
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
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
      <Tag tone={id === 'verified' ? 'brand' : 'accent'} icon={<Icon className="h-3.5 w-3.5" aria-hidden="true" />}>
        {def.label}
      </Tag>
    </span>
  );
}
