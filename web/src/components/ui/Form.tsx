import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface FieldProps { label: string; error?: string; hint?: ReactNode; optional?: boolean }

function Wrapper({ id, label, error, hint, optional, children }: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label} {optional && <span className="font-normal text-muted">(opcional)</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="mt-1 text-sm text-muted">{hint}</p>}
      {error && <p id={`${id}-err`} className="mt-1 text-sm text-danger-700">{error}</p>}
    </div>
  );
}

export function TextField({ label, error, hint, optional, ...rest }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} optional={optional}>
      <input
        id={id}
        className={`field ${error ? 'field-error' : ''}`}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        {...rest}
      />
    </Wrapper>
  );
}

export function TextArea({ label, error, hint, optional, ...rest }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} optional={optional}>
      <textarea
        id={id}
        className={`field min-h-[120px] resize-y ${error ? 'field-error' : ''}`}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        {...rest}
      />
    </Wrapper>
  );
}

export function SelectField({ label, error, hint, optional, children, ...rest }: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} optional={optional}>
      <select id={id} className={`field appearance-none bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10 ${error ? 'field-error' : ''}`}
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23545F6E' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
        aria-invalid={!!error || undefined} {...rest}>
        {children}
      </select>
    </Wrapper>
  );
}

export function Checkbox({ label, description, ...rest }: { label: ReactNode; description?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-start gap-3 py-1">
      <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 rounded border-line text-brand-700 accent-[rgb(var(--brand-700))]" {...rest} />
      <span>
        <span className="text-[15px] text-ink">{label}</span>
        {description && <span className="block text-sm text-muted">{description}</span>}
      </span>
    </label>
  );
}

/** Opções em "pílulas" selecionáveis (filtros, nota mínima etc.). */
export function ChipToggle({ selected, onClick, children, icon }: { selected: boolean; onClick: () => void; children: ReactNode; icon?: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition ${
        selected ? 'border-brand-700 bg-brand-700 text-white' : 'border-line bg-white text-ink hover:border-brand-200 hover:bg-brand-50'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
