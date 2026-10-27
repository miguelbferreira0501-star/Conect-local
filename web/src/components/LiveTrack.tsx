import { LIVE_FLOWS, LIVE_STAGES, type LiveStage } from '@conecta/shared';
import { StageIcon } from './StageIcon';

/** A sequência de etapas do serviço em que a etapa informada aparece (banho e tosa por padrão). */
export function flowFor(stage?: string | null): LiveStage[] {
  const f = stage ? Object.values(LIVE_FLOWS).find((x) => x.includes(stage as LiveStage)) : null;
  return f ?? LIVE_FLOWS['banho-e-tosa'];
}

/**
 * Trilha do Pet ao Vivo: as etapas do atendimento lado a lado; as já feitas na cor da marca,
 * a atual em destaque e as próximas em cinza. Os horários vêm das etapas enviadas pela empresa.
 */
export function LiveTrack({ stages, current, times = {}, size = 'md' }: {
  stages: LiveStage[]; current: LiveStage | null; times?: Partial<Record<LiveStage, string>>; size?: 'sm' | 'md';
}) {
  const at = current ? stages.indexOf(current) : -1;
  return (
    <ol className="grid" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }} aria-label="Etapas do atendimento">
      {stages.map((s, i) => {
        const done = i <= at;
        const now = i === at;
        return (
          <li key={s} className="relative flex flex-col items-start" aria-current={now ? 'step' : undefined}>
            {/* trilho até a próxima etapa */}
            {i < stages.length - 1 && (
              <span aria-hidden="true" className={`absolute left-3 right-0 top-3 h-0.5 ${i < at ? 'bg-brand-700' : 'bg-line'}`} />
            )}
            <span aria-hidden="true"
              className={`relative z-[1] flex h-6 w-6 items-center justify-center rounded-full ${done ? 'bg-brand-700 text-white' : 'border border-line bg-card text-muted'} ${now ? 'ring-4 ring-brand-100' : ''}`}>
              <StageIcon stage={s} className="h-3.5 w-3.5" />
            </span>
            <span className={`mt-2 pr-1 leading-tight ${size === 'sm' ? 'text-xs' : 'text-[13px]'} ${done ? 'font-medium text-ink' : 'text-muted'}`}>
              {LIVE_STAGES[s].label}
            </span>
            {times[s] && <time className="text-xs text-muted">{times[s]}</time>}
            <span className="sr-only">{done ? (now ? ' (etapa atual)' : ' (feita)') : ' (a seguir)'}</span>
          </li>
        );
      })}
    </ol>
  );
}
