import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { Spinner } from './Feedback';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
type Size = 'md' | 'lg' | 'sm';

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition select-none disabled:cursor-not-allowed disabled:opacity-55';
const variants: Record<Variant, string> = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900',
  accent: 'bg-accent-600 text-[#1f1005] hover:bg-accent-700',
  secondary: 'border border-line bg-card text-brand-fg hover:bg-brand-50 active:bg-brand-100',
  ghost: 'text-brand-fg hover:bg-brand-50',
  danger: 'border border-danger-700/30 bg-card text-danger-700 hover:bg-danger-50',
};
const sizes: Record<Size, string> = {
  sm: 'min-h-[40px] px-3.5 text-sm',
  md: 'min-h-[48px] px-5 text-[15px]',
  lg: 'min-h-[54px] px-6 text-base',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra = '') {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, block, className = '', children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass(variant, size, `${block ? 'w-full' : ''} ${className}`)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner className="h-5 w-5" /> : icon}
      {children}
    </button>
  );
});

export function ButtonLink({
  variant = 'primary', size = 'md', block, className = '', icon, children, ...rest
}: LinkProps & { variant?: Variant; size?: Size; block?: boolean; icon?: ReactNode }) {
  return (
    <Link className={buttonClass(variant, size, `${block ? 'w-full' : ''} ${className}`)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}

export function IconButton({ label, className = '', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink transition hover:bg-brand-50 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
