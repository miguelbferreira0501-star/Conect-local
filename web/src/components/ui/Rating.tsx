import { useId, useState } from 'react';
import { Star } from 'lucide-react';
import { formatRating, MIN_REVIEWS_FOR_CONFIDENT_RATING, reviewCountLabel, type RatingSummary } from '@conecta/shared';

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star className="absolute inset-0 text-line" style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="text-star" style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** "4,8 ★ · 126 avaliações" — ou "Sem avaliações ainda". Nunca exibe nota inventada. */
export function RatingInline({ rating, compact = false }: { rating: RatingSummary; compact?: boolean }) {
  if (rating.count === 0 || rating.average == null) {
    return <span className="text-sm text-muted">Sem avaliações ainda</span>;
  }
  const value = formatRating(rating.average);
  const few = rating.count < MIN_REVIEWS_FOR_CONFIDENT_RATING;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 text-sm" aria-label={`Nota ${value} de 5, ${reviewCountLabel(rating.count)}`}>
      <Star className="h-4 w-4 text-star" fill="currentColor" strokeWidth={0} aria-hidden="true" />
      <span className="font-semibold text-ink">{value}</span>
      <span className="text-muted" aria-hidden="true">· {compact ? rating.count : reviewCountLabel(rating.count)}</span>
      {few && !compact && <span className="text-xs text-muted" aria-hidden="true">(poucas avaliações)</span>}
    </span>
  );
}

const LABELS = ['', 'Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'];

export function StarInput({ value, onChange, label, size = 36, error }: { value: number; onChange: (v: number) => void; label: string; size?: number; error?: string }) {
  const [hover, setHover] = useState(0);
  const id = useId();
  const shown = hover || value;
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="flex items-center gap-1" role="radiogroup" aria-describedby={error ? `${id}-err` : undefined} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <label key={i} className="cursor-pointer rounded-lg p-1 focus-within:ring-2 focus-within:ring-brand-500" onMouseEnter={() => setHover(i)}>
            <input type="radio" name={id} value={i} checked={value === i} onChange={() => onChange(i)} className="sr-only" aria-label={`${i} ${i === 1 ? 'estrela' : 'estrelas'} — ${LABELS[i]}`} />
            <Star className={i <= shown ? 'text-star' : 'text-line'} style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />
          </label>
        ))}
        <span className="ml-2 text-sm font-medium text-muted" aria-hidden="true">{LABELS[shown]}</span>
      </div>
      {error && <p id={`${id}-err`} className="mt-1 text-sm text-danger-700">{error}</p>}
    </fieldset>
  );
}
