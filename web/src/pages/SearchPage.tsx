import { useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronDown, MapPin, SearchX, SlidersHorizontal } from 'lucide-react';
import {
  PRICE_LEVEL_LABELS, SERVICE_MODE_LABELS, SERVICE_MODES, SORT_LABELS, SORT_OPTIONS, type SearchResponse, type ServiceMode, type SortOption,
} from '@conecta/shared';
import { api, qs } from '@/lib/api';
import { useUserLocation } from '@/lib/location';
import { fetchCity, useCategories } from '@/lib/queries';
import { BusinessCard } from '@/components/BusinessCard';
import { SearchBox } from '@/components/SearchBox';
import { Button } from '@/components/ui/Button';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/Feedback';
import { Checkbox, ChipToggle, TextField } from '@/components/ui/Form';
import { Sheet } from '@/components/ui/Sheet';

/** Filtros ficam na URL: a busca pode ser compartilhada e o botão voltar funciona. */
function useFilters() {
  const [sp, setSp] = useSearchParams();
  const { slug } = useParams();
  const list = (k: string) => (sp.get(k) ? sp.get(k)!.split(',').filter(Boolean) : []);
  const f = {
    q: sp.get('q') ?? '',
    category: slug ?? sp.get('categoria') ?? '',
    neighborhood: sp.get('bairro') ?? '',
    minRating: sp.get('nota') ? Number(sp.get('nota')) : undefined,
    minReviews: sp.get('min_aval') ? Number(sp.get('min_aval')) : undefined,
    priceLevels: list('preco').map(Number),
    modes: list('modo') as ServiceMode[],
    bookable: sp.get('agenda') === '1',
    sort: (SORT_OPTIONS as readonly string[]).includes(sp.get('ordem') ?? '') ? (sp.get('ordem') as SortOption) : 'relevance',
  };
  const update = (patch: Partial<typeof f>) => {
    const next = { ...f, ...patch };
    const p = new URLSearchParams();
    if (next.q) p.set('q', next.q);
    if (next.category && !slug) p.set('categoria', next.category);
    if (next.neighborhood) p.set('bairro', next.neighborhood);
    if (next.minRating) p.set('nota', String(next.minRating));
    if (next.minReviews) p.set('min_aval', String(next.minReviews));
    if (next.priceLevels.length) p.set('preco', next.priceLevels.join(','));
    if (next.modes.length) p.set('modo', next.modes.join(','));
    if (next.bookable) p.set('agenda', '1');
    if (next.sort !== 'relevance') p.set('ordem', next.sort);
    setSp(p, { replace: true });
  };
  const activeCount =
    (f.category && !slug ? 1 : 0) + (f.neighborhood ? 1 : 0) + (f.minRating ? 1 : 0) + (f.minReviews ? 1 : 0) +
    (f.priceLevels.length ? 1 : 0) + (f.modes.length ? 1 : 0) + (f.bookable ? 1 : 0);
  return { f, update, activeCount, slugFixed: !!slug };
}

export function SearchPage() {
  const { city, coords, openPicker, setCity } = useUserLocation();
  const { f, update, activeCount, slugFixed } = useFilters();
  const categories = useCategories();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const categoryName = categories.data?.find((c) => c.slug === f.category)?.name;

  const params = city ? { city: city.ibge, ...f, category: f.category || undefined, neighborhood: f.neighborhood || undefined, lat: coords?.lat, lon: coords?.lon } : null;
  const query = useInfiniteQuery({
    queryKey: ['search', params],
    enabled: !!params,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<SearchResponse>(`/search${qs({ ...params!, page: pageParam, pageSize: 20 })}`),
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
  });
  const first = query.data?.pages[0];
  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const neighborhoods = useMemo(() => [...new Set(items.map((i) => i.neighborhood).filter(Boolean) as string[])].sort(), [items]);
  const hasQuery = !!(f.q || f.category);
  const title = slugFixed && categoryName ? categoryName : f.q ? `“${f.q}”` : 'Buscar';

  return (
    <div>
      <div className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="container-app space-y-2.5 py-3">
          <SearchBox size="md" initial={f.q} onSubmit={(q) => update({ q })} autoFocus={!hasQuery && !slugFixed} />
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={openPicker} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-sm font-medium hover:bg-brand-50">
              <MapPin className="h-4 w-4 text-accent-600" aria-hidden="true" />
              {city ? `${city.name}, ${city.uf}` : 'Escolher cidade'}
              <span className="sr-only">— alterar localização</span>
            </button>
            <button onClick={() => setFiltersOpen(true)} className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium ${activeCount ? 'border-brand-700 bg-brand-50 text-brand-800' : 'border-line bg-white hover:bg-brand-50'}`}>
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Filtros{activeCount ? ` (${activeCount})` : ''}
            </button>
            <label className="relative inline-flex min-h-[40px] items-center rounded-full border border-line bg-white pl-3.5 pr-8 text-sm font-medium hover:bg-brand-50">
              <span className="sr-only">Ordenar por</span>
              <select value={f.sort} onChange={(e) => update({ sort: e.target.value as SortOption })} className="appearance-none bg-transparent focus:outline-none">
                {SORT_OPTIONS.map((s) => (
                  <option key={s} value={s} disabled={s === 'distance' && !coords}>
                    {SORT_LABELS[s]}{s === 'distance' && !coords ? ' (ative a localização)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-muted" aria-hidden="true" />
            </label>
          </div>
        </div>
      </div>

      <div className="container-app py-5">
        {!city ? (
          <EmptyState icon={<MapPin className="h-8 w-8" />} title="Escolha sua cidade" action={<Button onClick={openPicker}>Escolher cidade</Button>}>
            Precisamos saber onde você está para mostrar empresas da sua região.
          </EmptyState>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h1 className="text-xl font-semibold md:text-2xl">{title}</h1>
              {first && (
                <p className="text-sm text-muted" aria-live="polite">
                  {first.total === 1 ? '1 resultado' : `${first.total} resultados`} em {city.name}, {city.uf}
                  {first.appliedSort !== 'relevance' && ` · ${SORT_LABELS[first.appliedSort as SortOption]}`}
                </p>
              )}
            </div>
            {f.sort === 'relevance' && first && first.total > 0 && (
              <p className="mb-4 text-sm text-muted">
                Ordenados por nota ajustada, quantidade e recência das avaliações, perfil e relevância.{' '}
                <Link to="/como-funciona" className="font-medium text-brand-700 hover:underline">Entenda</Link>
              </p>
            )}

            {query.isLoading && <div className="grid gap-3 lg:grid-cols-2">{[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>}
            {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}

            {first && first.total === 0 && (
              <EmptyState
                icon={<SearchX className="h-8 w-8" />}
                title={hasQuery || activeCount ? 'Nenhuma empresa encontrada' : `Ainda não há empresas em ${city.name}`}
                action={
                  <>
                    {activeCount > 0 && <Button variant="secondary" onClick={() => update({ neighborhood: '', minRating: undefined, minReviews: undefined, priceLevels: [], modes: [], bookable: false, category: slugFixed ? f.category : '' })}>Limpar filtros</Button>}
                    <Button variant="secondary" onClick={openPicker}>Mudar cidade</Button>
                  </>
                }
              >
                <p>{hasQuery ? 'Tente outras palavras, remova filtros ou pesquise em uma cidade próxima.' : 'Pesquise em uma cidade próxima:'}</p>
                {first.nearbyCities && first.nearbyCities.length > 0 && (
                  <ul className="mt-3 flex flex-wrap justify-center gap-2">
                    {first.nearbyCities.map((c) => (
                      <li key={c.ibge}>
                        <button onClick={async () => setCity(await fetchCity(c.ibge))} className="inline-flex min-h-[40px] items-center rounded-full border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-brand-50">
                          {c.name}, {c.uf} · {c.distanceKm} km
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </EmptyState>
            )}

            {items.length > 0 && (
              <ul className="grid gap-3 lg:grid-cols-2">
                {items.map((b) => <li key={b.id}><BusinessCard b={b} /></li>)}
              </ul>
            )}
            {query.hasNextPage && (
              <div className="mt-6 flex justify-center">
                <Button variant="secondary" loading={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>Mostrar mais resultados</Button>
              </div>
            )}
          </>
        )}
      </div>

      <FiltersSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} filters={f} slugFixed={slugFixed} neighborhoods={neighborhoods} categories={categories.data ?? []}
        onApply={(patch) => { update(patch); setFiltersOpen(false); }} />
    </div>
  );
}

type Filters = ReturnType<typeof useFilters>['f'];

function FiltersSheet({ open, onClose, filters, onApply, slugFixed, neighborhoods, categories }: {
  open: boolean; onClose: () => void; filters: Filters; onApply: (f: Partial<Filters>) => void; slugFixed: boolean;
  neighborhoods: string[]; categories: Array<{ slug: string; shortName: string }>;
}) {
  const [draft, setDraft] = useState(filters);
  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) { setLastOpen(open); if (open) setDraft(filters); }
  const set = (p: Partial<Filters>) => setDraft((d) => ({ ...d, ...p }));
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const clear = { category: slugFixed ? filters.category : '', neighborhood: '', minRating: undefined, minReviews: undefined, priceLevels: [], modes: [], bookable: false };

  return (
    <Sheet open={open} onClose={onClose} title="Filtros"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" className="whitespace-nowrap" onClick={() => onApply(clear)}>Limpar tudo</Button>
          <Button block onClick={() => onApply(draft)}>Aplicar filtros</Button>
        </div>
      }>
      <div className="space-y-6">
        {!slugFixed && (
          <fieldset>
            <legend className="label">Categoria</legend>
            <div className="flex flex-wrap gap-2">
              <ChipToggle selected={!draft.category} onClick={() => set({ category: '' })}>Todas</ChipToggle>
              {categories.map((c) => <ChipToggle key={c.slug} selected={draft.category === c.slug} onClick={() => set({ category: c.slug })}>{c.shortName}</ChipToggle>)}
            </div>
          </fieldset>
        )}
        <fieldset>
          <legend className="label">Nota mínima</legend>
          <div className="flex flex-wrap gap-2">
            {[undefined, 3, 4, 4.5].map((n) => (
              <ChipToggle key={String(n)} selected={draft.minRating === n} onClick={() => set({ minRating: n })}>{n ? `${String(n).replace('.', ',')}+ ★` : 'Qualquer'}</ChipToggle>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="label">Quantidade de avaliações</legend>
          <div className="flex flex-wrap gap-2">
            {[undefined, 5, 20, 50].map((n) => (
              <ChipToggle key={String(n)} selected={draft.minReviews === n} onClick={() => set({ minReviews: n })}>{n ? `${n} ou mais` : 'Qualquer'}</ChipToggle>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="label">Tipo de atendimento</legend>
          <div className="flex flex-wrap gap-2">
            {SERVICE_MODES.map((m) => <ChipToggle key={m} selected={draft.modes.includes(m)} onClick={() => set({ modes: toggle(draft.modes, m) })}>{SERVICE_MODE_LABELS[m]}</ChipToggle>)}
          </div>
        </fieldset>
        <fieldset>
          <legend className="label">Faixa de preço <span className="font-normal text-muted">(quando informada)</span></legend>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((p) => <ChipToggle key={p} selected={draft.priceLevels.includes(p)} onClick={() => set({ priceLevels: toggle(draft.priceLevels, p) })}>{PRICE_LEVEL_LABELS[p]}</ChipToggle>)}
          </div>
        </fieldset>
        <Checkbox label="Aceita agendamento on-line" description="Mostrar só empresas com horários disponíveis na plataforma" checked={draft.bookable} onChange={(e) => set({ bookable: e.target.checked })} />
        <div>
          <TextField label="Bairro" optional list="bairros" value={draft.neighborhood} onChange={(e) => set({ neighborhood: e.target.value })} placeholder="Ex.: Centro" />
          <datalist id="bairros">{neighborhoods.map((n) => <option key={n} value={n} />)}</datalist>
        </div>
      </div>
    </Sheet>
  );
}
