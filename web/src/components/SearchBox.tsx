import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, LayoutGrid, Search, Wrench, X } from 'lucide-react';
import type { SuggestionDTO } from '@conecta/shared';
import { useSuggest } from '@/lib/queries';
import { useUserLocation } from '@/lib/location';

/** Campo de busca com sugestões (combobox acessível, setas + Enter). */
export function SearchBox({ initial = '', autoFocus = false, size = 'lg', onSubmit }: { initial?: string; autoFocus?: boolean; size?: 'lg' | 'md'; onSubmit?: (q: string) => void }) {
  const [value, setValue] = useState(initial);
  const [debounced, setDebounced] = useState(initial);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const { city } = useUserLocation();
  const nav = useNavigate();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestions = useSuggest(city?.ibge, debounced);

  useEffect(() => setValue(initial), [initial]);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), 200);
    return () => clearTimeout(t);
  }, [value]);

  const items = open && value.trim().length >= 2 ? suggestions.data ?? [] : [];

  const go = (q: string) => {
    setOpen(false);
    inputRef.current?.blur();
    if (onSubmit) onSubmit(q);
    else nav(`/buscar?q=${encodeURIComponent(q)}`);
  };
  const pick = (s: SuggestionDTO) => {
    setOpen(false);
    if (s.type === 'business' && s.slug) nav(`/empresa/${s.slug}`);
    else if (s.type === 'category' && s.slug) nav(`/categoria/${s.slug}`);
    else { setValue(s.value); go(s.value); }
  };

  const icon = (t: SuggestionDTO['type']) =>
    t === 'category' ? <LayoutGrid className="h-4 w-4" /> : t === 'business' ? <Building2 className="h-4 w-4" /> : <Wrench className="h-4 w-4" />;

  return (
    <form
      role="search"
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        if (active >= 0 && items[active]) pick(items[active]);
        else go(value.trim());
      }}
    >
      <label htmlFor={`${listId}-input`} className="sr-only">Qual serviço você está procurando?</label>
      <Search className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted ${size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'}`} aria-hidden="true" />
      <input
        ref={inputRef}
        id={`${listId}-input`}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        autoFocus={autoFocus}
        role="combobox"
        aria-expanded={items.length > 0}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        placeholder="Banho, passeio, pet sitter…"
        value={value}
        onChange={(e) => { setValue(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(-1, a - 1)); }
          if (e.key === 'Escape') setOpen(false);
        }}
        className={`w-full rounded-2xl border border-control bg-card pr-24 text-ink placeholder:text-muted focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/15 [&::-webkit-search-cancel-button]:hidden ${
          size === 'lg' ? 'h-[60px] pl-14 text-[17px]' : 'h-[52px] pl-12 text-base'
        }`}
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {value && (
          <button type="button" aria-label="Limpar busca" onClick={() => { setValue(''); inputRef.current?.focus(); }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-raised">
            <X className="h-5 w-5" />
          </button>
        )}
        <button type="submit" aria-label="Buscar" className={`pressable inline-flex items-center justify-center rounded-xl bg-brand-700 text-white hover:bg-brand-800 ${size === 'lg' ? 'h-11 w-11' : 'h-10 w-10'}`}>
          <Search className="h-5 w-5" />
        </button>
      </div>
      {items.length > 0 && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-line bg-card py-1 shadow-float">
          {items.map((s, i) => (
            <li key={`${s.type}-${s.label}`} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(s)}
                className={`flex min-h-[48px] w-full items-center gap-3 px-4 text-left ${i === active ? "bg-raised" : "hover:bg-raised"}`}>
                <span className="text-muted">{icon(s.type)}</span>
                <span className="flex-1 truncate">{s.label}</span>
                <span className="text-xs text-muted">{s.type === 'category' ? 'Categoria' : s.type === 'business' ? 'Empresa' : 'Serviço'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
