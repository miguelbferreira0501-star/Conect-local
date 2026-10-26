import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ChevronDown, ChevronRight, LayoutGrid, MapPin, MapPinOff, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useUserLocation } from '@/lib/location';
import { fetchCity, useActivities, useCategories, useDiscover, useSearch } from '@/lib/queries';
import { BusinessCard } from '@/components/BusinessCard';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Logo } from '@/components/Layout';
import { SearchBox } from '@/components/SearchBox';
import { Button } from '@/components/ui/Button';
import { CardSkeleton, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { useFirstRunLocation } from '@/hooks/useFirstRunLocation';
import { Sheet } from '@/components/ui/Sheet';
import { LIVE_STAGES, type LiveStage, type PetDTO } from '@conecta/shared';
import { usePets } from '@/lib/pets';
import { PetAvatar, PetFormSheet } from '@/components/pets';
import { BellRing, Camera, Plus, Radio } from 'lucide-react';
import { useReminders } from '@/lib/benefits';

export function HomePage() {
  const { city, openPicker } = useUserLocation();
  const { user } = useAuth();
  const categories = useCategories();
  const discover = useDiscover(city?.ibge);
  const [allOpen, setAllOpen] = useState(false);
  useFirstRunLocation();

  return (
    <div>
      <header className="bg-card">
        <div className="container-app flex items-center gap-3 pt-3 md:pt-6">
          <Link to="/" className="md:hidden" aria-label="Início"><Logo /></Link>
          <div className="flex-1" />
          <Link to="/perfil" aria-label={user ? `Perfil de ${user.name}` : 'Entrar ou criar conta'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 font-semibold text-brand-fg hover:bg-brand-100">
            {user ? user.name.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
          </Link>
        </div>
        <div className="container-app pb-6 pt-3 md:pb-8">
          <button onClick={openPicker} className="group -ml-1 inline-flex min-h-[44px] items-center gap-2 rounded-xl px-1 text-left" aria-label={city ? `Localização: ${city.name}, ${city.uf}. Alterar localização` : 'Escolher localização'}>
            <MapPin className="h-5 w-5 text-accent-600" aria-hidden="true" />
            <span>
              <span className="block font-semibold leading-tight">{city ? `${city.name}, ${city.uf}` : 'Escolha sua cidade'}</span>
              <span className="text-sm text-brand-fg group-hover:underline">{city ? 'Alterar localização' : 'Toque para selecionar'}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-muted" aria-hidden="true" />
          </button>
          {user ? (
            <div className="mt-4">
              <h1 className="text-[26px] font-bold leading-tight md:text-4xl">Olá, <span className="text-brand-fg">{user.name.split(' ')[0]}</span></h1>
              <p className="text-muted first-letter:uppercase">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
          ) : (
            <>
              <h1 className="mt-4 max-w-2xl text-[26px] font-bold leading-tight md:text-4xl">
                Cuidado de confiança para o seu pet{city ? <> em <span className="text-brand-fg">{city.name}</span></> : ''}
              </h1>
              <p className="mt-1.5 text-muted">Banho e tosa, passeador e pet sitter com avaliações reais — e você acompanha tudo ao vivo.</p>
            </>
          )}
          <div className="mt-5 max-w-2xl"><SearchBox /></div>
        </div>
      </header>

      <div className="container-app space-y-9 py-7">
        {user && <HomePets />}
        {user && <ReturnReminders />}
        {user ? <LiveNowOrBanner /> : <LiveBanner />}
        {!city && (
          <EmptyState icon={<MapPin className="h-8 w-8" />} title="Para começar, escolha sua cidade" action={<Button onClick={openPicker}>Escolher cidade</Button>}>
            Mostramos as empresas que atendem a sua região. Você pode mudar a cidade quando quiser.
          </EmptyState>
        )}

        <section aria-labelledby="cat-title">
          <h2 id="cat-title" className="section-title mb-3">Serviços</h2>
          {categories.isLoading ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">{Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-[92px]" />)}</div>
          ) : categories.isError ? (
            <ErrorState error={categories.error} onRetry={() => categories.refetch()} />
          ) : (
            <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
              {(categories.data!.length > 12 ? categories.data!.slice(0, 11) : categories.data!).map((c) => (
                <li key={c.slug}>
                  <Link to={`/categoria/${c.slug}`} className="flex h-full min-h-[92px] flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-card p-2.5 text-center transition hover:border-brand-200 hover:bg-brand-50" title={c.name}>
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-fg"><CategoryIcon icon={c.icon} /></span>
                    <span className="text-[13px] font-medium leading-tight">{c.shortName}</span>
                  </Link>
                </li>
              ))}
              {categories.data!.length > 12 && (
                <li>
                  <button onClick={() => setAllOpen(true)} className="flex h-full min-h-[92px] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-brand-200 bg-card p-2.5 text-center transition hover:bg-brand-50">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-brand-fg"><LayoutGrid className="h-6 w-6" aria-hidden="true" /></span>
                    <span className="text-[13px] font-medium leading-tight">Ver todas</span>
                  </button>
                </li>
              )}
            </ul>
          )}
        </section>

        <Sheet open={allOpen} onClose={() => setAllOpen(false)} title="Todas as categorias">
          <ul className="divide-y divide-line">
            {categories.data?.map((c) => (
              <li key={c.slug}>
                <Link to={`/categoria/${c.slug}`} className="flex min-h-[56px] items-center gap-3 py-2 hover:text-brand-fg">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-fg"><CategoryIcon icon={c.icon} className="h-5 w-5" /></span>
                  <span><span className="block font-medium">{c.name}</span><span className="text-sm text-muted">{c.description}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </Sheet>

        {city && discover.isLoading && (
          <div className="grid gap-3 md:grid-cols-3">{[0, 1, 2].map((i) => <CardSkeleton key={i} />)}</div>
        )}
        {city && discover.isError && <ErrorState error={discover.error} onRetry={() => discover.refetch()} />}
        {city && discover.data && discover.data.totalBusinesses === 0 && <NoBusinessesHere />}

        {discover.data?.sections.map((s) => (
          <section key={s.id} aria-labelledby={`sec-${s.id}`}>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 id={`sec-${s.id}`} className="section-title">{s.title}</h2>
                {s.subtitle && <p className="text-sm text-muted">{s.subtitle}</p>}
              </div>
              {s.id === 'grooming' && (
                <Link to="/categoria/banho-e-tosa?ordem=rating" className="inline-flex min-h-[44px] shrink-0 items-center text-sm font-semibold text-brand-fg hover:underline">
                  Ver todos <ChevronRight className="h-4 w-4" />
                </Link>
              )}
              {s.id === 'top-rated' && (
                <Link to="/buscar?ordem=rating" className="inline-flex min-h-[44px] shrink-0 items-center text-sm font-semibold text-brand-fg hover:underline">
                  Ver todas <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
            <div className="scroll-row md:grid md:grid-cols-3 md:overflow-visible xl:grid-cols-4">
              {s.items.slice(0, 8).map((b) => <BusinessCard key={b.id} b={b} layout="compact" />)}
            </div>
          </section>
        ))}

        {discover.data?.popularServices && discover.data.popularServices.length > 0 && (
          <section aria-labelledby="pop-title">
            <h2 id="pop-title" className="section-title">Serviços procurados em {city?.name}</h2>
            <p className="mb-3 text-sm text-muted">Com base em agendamentos e orçamentos pedidos na plataforma nos últimos 90 dias.</p>
            <ul className="flex flex-wrap gap-2">
              {discover.data.popularServices.map((p) => (
                <li key={p.name}>
                  <Link to={`/buscar?q=${encodeURIComponent(p.name)}`} className="inline-flex min-h-[40px] items-center rounded-full border border-line bg-card px-4 text-sm font-medium hover:border-brand-200 hover:bg-brand-50">
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="card flex flex-col gap-3 p-5 md:flex-row md:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-700"><ShieldCheck className="h-6 w-6" /></span>
          <div className="flex-1">
            <h2 className="font-semibold">Como garantimos avaliações confiáveis</h2>
            <p className="text-sm text-muted">Só avalia quem contratou pela plataforma. A ordem dos resultados não pode ser comprada.</p>
          </div>
          <Link to="/como-funciona" className="font-semibold text-brand-fg hover:underline">Saiba como funciona</Link>
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
              className="inline-flex min-h-[40px] items-center rounded-full border border-line bg-card px-4 text-sm font-medium text-ink hover:bg-brand-50"
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

function HomePets() {
  const pets = usePets();
  const [adding, setAdding] = useState<PetDTO | null | undefined>(undefined);
  if (pets.isLoading) return null;
  return (
    <section aria-labelledby="pets-title">
      <div className="mb-3 flex items-end justify-between">
        <h2 id="pets-title" className="section-title">Meus pets</h2>
        {!!pets.data?.length && <Link to="/pets" className="text-sm font-semibold text-brand-fg hover:underline">Editar</Link>}
      </div>
      <div className="scroll-row">
        {pets.data?.map((p) => (
          <Link key={p.id} to="/pets" className="flex w-[84px] shrink-0 flex-col items-center gap-1.5 text-center">
            <PetAvatar pet={p} size={72} />
            <span className="w-full truncate text-sm font-medium">{p.name}</span>
          </Link>
        ))}
        <button onClick={() => setAdding(null)} className="flex w-[84px] shrink-0 flex-col items-center gap-1.5 text-center">
          <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-dashed border-brand-200 text-brand-fg"><Plus className="h-7 w-7" /></span>
          <span className="text-sm font-medium text-brand-fg">{pets.data?.length ? 'Adicionar' : 'Cadastrar pet'}</span>
        </button>
      </div>
      <PetFormSheet pet={adding} onClose={() => setAdding(undefined)} />
    </section>
  );
}

/** Se tem atendimento hoje, mostra o "ao vivo"; senão, apresenta o recurso. */
function LiveNowOrBanner() {
  const acts = useActivities();
  const today = (acts.data ?? []).find((a) => a.type === 'booking' && (a.status === 'confirmed' || (a.status === 'completed' && a.live)) && a.startsAt
    && Math.abs(Date.now() - new Date(a.startsAt).getTime()) < 12 * 3_600_000);
  if (!today) return <LiveBanner />;
  const last = today.live ? LIVE_STAGES[today.live.lastStage as LiveStage] : null;
  return (
    <Link to="/atividades" className="block rounded-2xl border border-accent-600/40 bg-accent-50 p-4 transition hover:border-accent-600">
      <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-accent-700">
        <Radio className={`h-4 w-4 ${today.live ? 'animate-pulse' : ''}`} aria-hidden="true" /> {today.live ? 'Ao vivo agora' : 'Hoje'}
      </p>
      <p className="mt-1 text-lg font-semibold">{today.pet ? `${today.pet.name} · ` : ''}{today.serviceName}</p>
      <p className="text-sm text-muted">{today.business.name} · {new Date(today.startsAt!).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
      <p className="mt-2 text-sm">{last ? `${last.emoji} ${last.label} — toque para ver as fotos` : 'Quando começar, as fotos de cada etapa aparecem aqui.'}</p>
    </Link>
  );
}

function LiveBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-5 text-white">
      <span className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-accent-600/30" aria-hidden="true" />
      <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/85"><Radio className="h-4 w-4" aria-hidden="true" /> Pet ao Vivo</p>
      <p className="mt-1 max-w-md text-xl font-bold leading-snug">Acompanhe cada etapa do banho, do passeio e da visita — com fotos.</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-white/85"><Camera className="h-4 w-4 shrink-0" aria-hidden="true" /> 🛁 No banho → 💨 Secando → ✂️ Na tosa → ✅ Pronto</p>
    </div>
  );
}

/** Lembrete automático de retorno: "faz 16 dias do último banho do Thor". */
function ReturnReminders() {
  const r = useReminders();
  if (!r.data?.length) return null;
  return (
    <section className="space-y-2" aria-label="Lembretes de retorno" data-testid="reminders">
      {r.data.map((x) => (
        <Link key={`${x.petId}-${x.serviceId}`} to={`/empresa/${x.business.slug}/agendar?servico=${x.serviceId}`}
          className="card flex items-center gap-3 p-4 transition hover:border-brand-600">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-600/15 text-accent-600"><BellRing className="h-5 w-5" aria-hidden /></span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{x.petName ? `Hora de agendar para ${x.petName}?` : 'Hora de agendar de novo?'}</span>
            <span className="block text-sm text-muted">Faz {x.daysSince} dias do último {x.serviceName.toLowerCase()} em {x.business.name}.</span>
          </span>
          <ChevronRight className="h-5 w-5 text-muted" aria-hidden />
        </Link>
      ))}
    </section>
  );
}
