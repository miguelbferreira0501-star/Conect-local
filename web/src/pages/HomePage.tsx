import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, MapPin, MapPinOff, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useUserLocation } from '@/lib/location';
import { fetchCity, useCategories, useDiscover, useSearch } from '@/lib/queries';
import { BusinessCard } from '@/components/BusinessCard';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Logo } from '@/components/Layout';
import { SearchBox } from '@/components/SearchBox';
import { Button } from '@/components/ui/Button';
import { CardSkeleton, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { useFirstRunLocation } from '@/hooks/useFirstRunLocation';

export function HomePage() {
  const { city, openPicker } = useUserLocation();
  const { user } = useAuth();
  const categories = useCategories();
  const discover = useDiscover(city?.ibge);
  useFirstRunLocation();

  return (
    <div>
      <header className="bg-white">
        <div className="container-app flex items-center gap-3 pt-3 md:pt-6">
          <Link to="/" className="md:hidden" aria-label="Início"><Logo /></Link>
          <div className="flex-1" />
          <Link to="/perfil" aria-label={user ? `Perfil de ${user.name}` : 'Entrar ou criar conta'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 font-semibold text-brand-700 hover:bg-brand-100">
            {user ? user.name.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
          </Link>
        </div>
        <div className="container-app pb-6 pt-3 md:pb-8">
          <button onClick={openPicker} className="group -ml-1 inline-flex min-h-[44px] items-center gap-2 rounded-xl px-1 text-left" aria-label={city ? `Localização: ${city.name}, ${city.uf}. Alterar localização` : 'Escolher localização'}>
            <MapPin className="h-5 w-5 text-accent-600" aria-hidden="true" />
            <span>
              <span className="block font-semibold leading-tight">{city ? `${city.name}, ${city.uf}` : 'Escolha sua cidade'}</span>
              <span className="text-sm text-brand-600 group-hover:underline">{city ? 'Alterar localização' : 'Toque para selecionar'}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-muted" aria-hidden="true" />
          </button>
          <h1 className="mt-4 max-w-2xl text-[26px] font-bold leading-tight md:text-4xl">
            Encontre empresas confiáveis{city ? <> em <span className="text-brand-700">{city.name}</span></> : ' perto de você'}
          </h1>
          <p className="mt-1.5 text-muted">Compare avaliações reais, veja preços e agende em poucos toques.</p>
          <div className="mt-5 max-w-2xl"><SearchBox /></div>
        </div>
      </header>

      <div className="container-app space-y-9 py-7">
        {!city && (
          <EmptyState icon={<MapPin className="h-8 w-8" />} title="Para começar, escolha sua cidade" action={<Button onClick={openPicker}>Escolher cidade</Button>}>
            Mostramos as empresas que atendem a sua região. Você pode mudar a cidade quando quiser.
          </EmptyState>
        )}

        <section aria-labelledby="cat-title">
          <h2 id="cat-title" className="section-title mb-3">Categorias</h2>
          {categories.isLoading ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">{Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-[92px]" />)}</div>
          ) : categories.isError ? (
            <ErrorState error={categories.error} onRetry={() => categories.refetch()} />
          ) : (
            <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
              {categories.data?.map((c) => (
                <li key={c.slug}>
                  <Link to={`/categoria/${c.slug}`} className="flex h-full min-h-[92px] flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-white p-2.5 text-center transition hover:border-brand-200 hover:bg-brand-50" title={c.name}>
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><CategoryIcon icon={c.icon} /></span>
                    <span className="text-[13px] font-medium leading-tight">{c.shortName}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {city && discover.isLoading && (
          <div className="grid gap-3 md:grid-cols-3">{[0, 1, 2].map((i) => <CardSkeleton key={i} />)}</div>
        )}
        {city && discover.isError && <ErrorState error={discover.error} onRetry={() => discover.refetch()} />}
        {city && discover.data && discover.data.totalBusinesses === 0 && <NoBusinessesHere />}

        {discover.data?.popularServices && discover.data.popularServices.length > 0 && (
          <section aria-labelledby="pop-title">
            <h2 id="pop-title" className="section-title">Serviços procurados em {city?.name}</h2>
            <p className="mb-3 text-sm text-muted">Com base em agendamentos e orçamentos pedidos na plataforma nos últimos 90 dias.</p>
            <ul className="flex flex-wrap gap-2">
              {discover.data.popularServices.map((p) => (
                <li key={p.name}>
                  <Link to={`/buscar?q=${encodeURIComponent(p.name)}`} className="inline-flex min-h-[40px] items-center rounded-full border border-line bg-white px-4 text-sm font-medium hover:border-brand-200 hover:bg-brand-50">
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {discover.data?.sections.map((s) => (
          <section key={s.id} aria-labelledby={`sec-${s.id}`}>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 id={`sec-${s.id}`} className="section-title">{s.title}</h2>
                {s.subtitle && <p className="text-sm text-muted">{s.subtitle}</p>}
              </div>
              {s.id === 'top-rated' && (
                <Link to="/buscar?ordem=rating" className="inline-flex min-h-[44px] shrink-0 items-center text-sm font-semibold text-brand-700 hover:underline">
                  Ver todas <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
            <div className="scroll-row md:grid md:grid-cols-3 md:overflow-visible xl:grid-cols-4">
              {s.items.slice(0, 8).map((b) => <BusinessCard key={b.id} b={b} layout="compact" />)}
            </div>
          </section>
        ))}

        <section className="card flex flex-col gap-3 p-5 md:flex-row md:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-700"><ShieldCheck className="h-6 w-6" /></span>
          <div className="flex-1">
            <h2 className="font-semibold">Como garantimos avaliações confiáveis</h2>
            <p className="text-sm text-muted">Só avalia quem contratou pela plataforma. A ordem dos resultados não pode ser comprada.</p>
          </div>
          <Link to="/como-funciona" className="font-semibold text-brand-700 hover:underline">Saiba como funciona</Link>
        </section>
      </div>
    </div>
  );
}

function NoBusinessesHere() {
  const { city, setCity, openPicker } = useUserLocation();
  const nearby = useSearch(city ? { city: city.ibge } : null);
  return (
    <EmptyState icon={<MapPinOff className="h-8 w-8" />} title={`Ainda não há empresas cadastradas em ${city?.name}`}
      action={<Button variant="secondary" onClick={openPicker}>Escolher outra cidade</Button>}>
      <p>Estamos crescendo. Enquanto isso, você pode pesquisar em uma cidade próxima:</p>
      <ul className="mt-3 flex flex-wrap justify-center gap-2">
        {nearby.data?.nearbyCities?.map((c) => (
          <li key={c.ibge}>
            <button
              className="inline-flex min-h-[40px] items-center rounded-full border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-brand-50"
              onClick={async () => setCity(await fetchCity(c.ibge))}
            >
              {c.name}, {c.uf} · {c.distanceKm} km
            </button>
          </li>
        ))}
      </ul>
    </EmptyState>
  );
}
