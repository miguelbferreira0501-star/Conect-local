import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastItem { id: number; message: string; tone: 'success' | 'error' }
const Ctx = createContext<(message: string, tone?: ToastItem['tone']) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((message: string, tone: ToastItem['tone'] = 'success') => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, message, tone }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 4500);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-8">
        {items.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl border border-line bg-card px-4 py-3 text-sm text-ink shadow-raised"
            role={t.tone === 'error' ? 'alert' : 'status'}
          >
            {t.tone === 'success' ? <CheckCircle2 className="h-5 w-5 text-accent-100" /> : <AlertCircle className="h-5 w-5 text-red-300" />}
            <span className="flex-1">{t.message}</span>
            <button aria-label="Fechar aviso" className="rounded p-1 hover:bg-white/10" onClick={() => setItems((s) => s.filter((x) => x.id !== t.id))}>
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
