import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';

export function Spinner({ className = 'h-6 w-6', label }: { className?: string; label?: string }) {
  return (
    <span role={label ? 'status' : undefined} className="inline-flex items-center gap-2">
      <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {label && <span className="text-sm text-muted">{label}</span>}
    </span>
  );
}

export function PageLoader({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-brand-fg">
      <Spinner className="h-8 w-8" label={label} />
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  // Carregando: o layout final com blocos cinza lisos no tamanho real (sem brilho piscando).
  return <div className={`rounded-xl bg-raised ${className}`} aria-hidden="true" />;
}

export function CardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <Skeleton className="h-28 rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}

type Tone = 'info' | 'success' | 'warning' | 'error';
const tones: Record<Tone, { cls: string; Icon: typeof Info }> = {
  info: { cls: 'bg-brand-50 text-brand-900 border-brand-100', Icon: Info },
  success: { cls: 'bg-success-50 text-success-700 border-success-700/20', Icon: CheckCircle2 },
  warning: { cls: 'bg-warning-50 text-warning-700 border-warning-200', Icon: TriangleAlert },
  error: { cls: 'bg-danger-50 text-danger-700 border-danger-700/20', Icon: AlertCircle },
};

export function Alert({ tone = 'info', title, children, action }: { tone?: Tone; title?: string; children?: ReactNode; action?: ReactNode }) {
  const { cls, Icon } = tones[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex gap-3 rounded-2xl border p-3.5 text-sm ${cls}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5' : ''}>{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-3 text-muted">{icon}</div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {children && <div className="mt-1.5 max-w-sm text-muted">{children}</div>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : 'Não foi possível carregar.';
  return (
    <EmptyState
      icon={<AlertCircle className="h-8 w-8" />}
      title="Não foi possível carregar"
      action={
        onRetry && (
          <button className="min-h-[44px] rounded-xl border border-line bg-card px-5 font-semibold text-brand-fg" onClick={onRetry}>
            Tentar novamente
          </button>
        )
      }
    >
      {message}
    </EmptyState>
  );
}
