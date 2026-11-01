import { useEffect, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

/** Gaveta que sobe da parte de baixo da tela. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), 220);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;
  return (
    <div className="fixed inset-0 z-40">
      <div className={`overlay ${shown ? 'is-open' : ''}`} onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className={`sheet ${shown ? 'is-open' : ''}`}>
        <div className="mx-auto mb-1 mt-2 h-1.5 w-10 rounded-full bg-line" />
        <div className="flex items-center justify-between gap-3 pb-2 pt-1">
          <h2 className="font-display text-[22px] font-bold leading-tight text-ink">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

/** Janela central para momentos raros: cartão-postal, crescimento. */
export function Modal({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!open) return setShown(false);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    return () => cancelAnimationFrame(id);
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className={`overlay ${shown ? 'is-open' : ''}`} onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={label} className={`modal ${shown ? 'is-open' : ''}`}>
        {children}
      </div>
    </div>
  );
}

// Nomes completos para o Tailwind não descartar as classes no build.
const TONE_CLASS = { leaf: 'bar-leaf', gold: 'bar-gold', accent: 'bar-accent' } as const;

export function Bar({ value, max = 100, tone = 'leaf', label }: { value: number; max?: number; tone?: 'leaf' | 'gold' | 'accent'; label: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)}>
      <div className={`bar-fill ${TONE_CLASS[tone]}`} style={{ transform: `scaleX(${pct / 100})` }} />
    </div>
  );
}

export function Seeds({ value }: { value: number }) {
  return (
    <span className="chip chip-gold tabular-nums" aria-label={`${value} sementinhas`}>
      <Seed /> {value}
    </span>
  );
}

export function Seed({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      <path d="M8 1.5 C12.5 4 13 10.5 8 14.5 C3 10.5 3.5 4 8 1.5 Z" fill="var(--gold)" />
      <path d="M8 4 L8 12" stroke="var(--surface)" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

// ---------- Avisos rápidos ----------

type ToastMsg = { id: number; text: string };
let pushToast: ((text: string) => void) | null = null;

export function toast(text: string) {
  pushToast?.(text);
}

export function Toaster() {
  const [items, setItems] = useState<ToastMsg[]>([]);
  useEffect(() => {
    pushToast = (text) => {
      const id = Date.now() + Math.random();
      setItems((list) => [...list.slice(-2), { id, text }]);
      setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 2200);
    };
    return () => {
      pushToast = null;
    };
  }, []);
  return (
    <div className="toaster" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="toast">
          {t.text}
        </div>
      ))}
    </div>
  );
}
