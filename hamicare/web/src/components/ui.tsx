import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { play, playSoft } from '../lib/sound';

/** Som de abrir e fechar janelas (não toca ao montar já fechada). */
function useOpenSound(open: boolean) {
  const was = useRef(open);
  useEffect(() => {
    if (was.current === open) return;
    was.current = open;
    play(open ? 'abrir' : 'fechar');
  }, [open]);
}

/** Gaveta que sobe da parte de baixo da tela. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  useOpenSound(open);

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

/** Janela central para momentos raros: comemorações e confirmações. */
export function Modal({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  const [shown, setShown] = useState(false);
  useOpenSound(open);
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

const TONE_CLASS = { leaf: 'bar-leaf', gold: 'bar-gold', accent: 'bar-accent', sky: 'bar-sky' } as const;

export function Bar({ value, max = 100, tone = 'leaf', label, thin }: { value: number; max?: number; tone?: keyof typeof TONE_CLASS; label: string; thin?: boolean }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className={`bar ${thin ? 'bar-thin' : ''}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)}>
      <div className={`bar-fill ${TONE_CLASS[tone]}`} style={{ transform: `scaleX(${pct / 100})` }} />
    </div>
  );
}

/** Semente de girassol: a moeda do HamiCare. */
export function Seed({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      <path d="M8 1 C12.6 3.6 13.2 10.4 8 15 C2.8 10.4 3.4 3.6 8 1 Z" fill="#3B3330" />
      <path d="M8 3.2 L8 13" stroke="#F4EBD8" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5.6 5 L6.2 11 M10.4 5 L9.8 11" stroke="#F4EBD8" strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function Coins({ value }: { value: number }) {
  return (
    <span className="chip chip-gold tabular-nums" aria-label={`${value} sementes de girassol`}>
      <Seed /> {value}
    </span>
  );
}

export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className={`seg ${options.length > 4 ? 'seg-many' : ''}`} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 className="font-display text-[21px] font-bold leading-tight">{children}</h2>
      {action}
    </div>
  );
}

/** Gráfico de linha simples (área suave, grade leve, ponto final em destaque). */
export function LineChart({
  points,
  height = 140,
  label,
  unit = '',
  min,
  max,
  tone = 'var(--accent)',
  band,
}: {
  points: { label: string; value: number }[];
  height?: number;
  label: string;
  unit?: string;
  min?: number;
  max?: number;
  tone?: string;
  band?: [number, number];
}) {
  if (points.length < 2) return <p className="rounded-2xl bg-surface2 p-4 text-[14px] text-muted">Ainda não há registros suficientes para o gráfico.</p>;
  const W = 320;
  const H = height;
  const pad = { l: 34, r: 12, t: 12, b: 22 };
  const vals = points.map((p) => p.value);
  const lo = min ?? Math.floor(Math.min(...vals, ...(band ?? [])) - 1);
  const hi = max ?? Math.ceil(Math.max(...vals, ...(band ?? [])) + 1);
  const x = (i: number) => pad.l + (i / (points.length - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo || 1)) * (H - pad.t - pad.b);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1)} ${H - pad.b} L${x(0)} ${H - pad.b} Z`;
  const ticks = [lo, (lo + hi) / 2, hi];
  const last = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`${label}: último valor ${last.value}${unit}`}>
      {band && <rect x={pad.l} y={y(band[1])} width={W - pad.l - pad.r} height={Math.max(0, y(band[0]) - y(band[1]))} fill="var(--leaf-soft)" />}
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1" />
          <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="var(--muted)" className="tabular-nums">
            {Math.round(t)}
          </text>
        </g>
      ))}
      <path d={area} fill={tone} opacity="0.12" />
      <path d={line} fill="none" stroke={tone} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(points.length - 1)} cy={y(last.value)} r="4.5" fill={tone} stroke="var(--surface)" strokeWidth="2" />
      <text x={pad.l} y={H - 6} fontSize="10" fill="var(--muted)">
        {points[0].label}
      </text>
      <text x={W - pad.r} y={H - 6} fontSize="10" fill="var(--muted)" textAnchor="end">
        {last.label}
      </text>
    </svg>
  );
}

// ---------- Avisos rápidos ----------

type ToastMsg = { id: number; text: string };
let pushToast: ((text: string) => void) | null = null;

export function toast(text: string) {
  pushToast?.(text);
  playSoft('aviso', 400);
}

export function Toaster() {
  const [items, setItems] = useState<ToastMsg[]>([]);
  useEffect(() => {
    pushToast = (text) => {
      const id = Date.now() + Math.random();
      setItems((list) => [...list.slice(-2), { id, text }]);
      setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 2400);
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

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border-2 border-dashed border-line p-5 text-center text-[15px] text-muted">{children}</p>;
}
