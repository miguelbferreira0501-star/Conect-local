import { Link } from 'react-router-dom';
import { useState } from 'react';
import { BellRing, ChevronDown, ChevronRight, MapPin, MapPinOff, Plus, ShieldCheck, User } from 'lucide-react';
import { LIVE_STAGES, type ActivityDTO, type LiveStage, type PetDTO } from '@conecta/shared';
import { useAuth } from '@/lib/auth';
import { useUserLocation } from '@/lib/location';
import { fetchCity, useActivities, useCategories, useDiscover, useSearch } from '@/lib/queries';
import { useLive, usePets } from '@/lib/pets';
import { useReminders } from '@/lib/benefits';
import { BusinessCard } from '@/components/BusinessCard';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Logo } from '@/components/Layout';
import { SearchBox } from '@/components/SearchBox';
import { PetAvatar, PetFormSheet } from '@/components/pets';
import { PushPrompt } from '@/components/PushPrompt';
import { LiveTrack, flowFor } from '@/components/LiveTrack';
import { Button } from '@/components/ui/Button';
import { CardSkeleton, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Tag } from '@/components/ui/Tags';
import { BusinessLogo } from '@/components/ui/Visual';
import { useFirstRunLocation } from '@/hooks/useFirstRunLocation';

const hm = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export function HomePage() {
  const { city, openPicker } = useUserLocation();
  const { user } = useAuth();
  const categories = useCategories();
  const discover = useDiscover(city?.ibge);
  useFirstRunLocation();
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div>
      <header className="container-app pt-3 md:pt-8">
        <div className="flex items-center gap-2">
          <Link to="/" className="mr-1 md:hidden" aria-label="Início"><Logo /></Link>
          <button onClick={openPicker} aria-label={city ? `Localização: ${city.name}, ${city.uf}. Alterar localização` : 'Escolher localização'}
            className="pressable inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-2 text-[15px] font-medium text-ink hover:bg-raised md:-ml-2">
            <MapPin className="h-4 w-4 text-muted" aria-hidden="true" />
            <span className="max-w-[46vw] truncate">{city ? `${city.name}, ${city.uf}` : 'Escolher cidade'}</span>
            <ChevronDown className="h-4 w-4 text-muted" aria-hidden="true" />
          </button>
          <div className="flex-1" />
          <Link to="/perfil" aria-label={user ? `Perfil de ${user.name}` : 'Entrar ou criar conta'}
            className="pressable inline-flex h-10 w-10 items-center justify-center rounded-full bg-raised text-[15px] font-semibold text-ink hover:bg-line">
            {user ? user.name.charAt(0).toUpperCase() : <User className="h-5 w-5" aria-hidden="true" />}
          </Link>
        </div>
        <div className="mt-5 max-w-2xl md:mt-6">
          {user ? (
            <>
              <h1 className="text-2xl font-bold leading-tight md:text-[28px]">Olá, {user.name.split(' ')[0]}</h1>
              <p className="mt-1 text-[15px] text-muted first-letter:uppercase">{today}</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold leading-tight md:text-[28px]">Cuidado para o seu pet{city ? ` em ${city.name}` : ''}</h1>
              <p className="mt-1.5 text-[15px] text-muted">Banho e tosa, passeador e pet sitter com avaliações de quem foi atendido. Você acompanha cada etapa pelo celular.</p>
            </>
          )}
          <div className="mt-5"><SearchBox /></div>
        </div>
      </header>

      <div className="container-app space-y-10 pb-10 pt-8">
        {user && <TodayOrNext />}
        {user && <ReturnReminders />}
        {user && <HomePets />}
        {user && <PushPrompt variant="tutor" />}
        {!user && <LiveExample />}
        {!city && (
          <EmptyState icon={<MapPin className="h-8 w-8" />} title="Para começar, escolha sua cidade" action={<Button onClick={openPicker}>Escolher cidade</Button>}>
            Mostramos as empresas que atendem a sua região. Você pode mudar a cidade quando quiser.
          </EmptyState>
        )}

        <section aria-labelledby="cat-title">
          <h2 id="cat-title" className="section-title mb-3">Serviços</h2>
          {categories.isLoading ? (
            <Skeleton className="h-[180px] rounded-2xl" />
          ) : categories.isError ? (
            <ErrorState error={categories.error} onRetry={() => categories.refetch()} />
          ) : (
            <div className="card overflow-hidden"><ul className="-mb-px grid sm:grid-cols-2 lg:grid-cols-3">
              {categories.data!.map((c) => (
                <li key={c.slug} className="border-b border-rule">
                  <Link to={`/categoria/${c.slug}`} className="group flex min-h-[64px] items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-raised">
                    <CategoryIcon icon={c.icon} className="h-5 w-5 shrink-0 text-ink" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium leading-snug">{c.name}</span>
                      {c.description && <span className="line-clamp-1 text-[13px] text-muted">{c.description}</span>}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted transition-transform duration-150 ease-out group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul></div>
          )}
        </section>

        {city && discover.isLoading && (
          <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <CardSkeleton key={i} />)}</div>
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
                <Link to="/categoria/banho-e-tosa?ordem=rating" className="inline-flex min-h-[44px] shrink-0 items-center gap-0.5 text-sm font-semibold text-brand-fg hover:underline">
                  Ver todos <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
              {s.id === 'top-rated' && (
                <Link to="/buscar?ordem=rating" className="inline-flex min-h-[44px] shrink-0 items-center gap-0.5 text-sm font-semibold text-brand-fg hover:underline">
                  Ver todas <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </div>
            <div className="scroll-row md:grid md:grid-cols-3 md:gap-4 md:overflow-visible xl:grid-cols-4">
              {s.items.slice(0, 8).map((b) => <BusinessCard key={b.id} b={b} layout="compact" />)}
            </div>
          </section>
        ))}

        {discover.data?.popularServices && discover.data.popularServices.length > 0 && (
          <section aria-labelledby="pop-title">
            <h2 id="pop-title" className="section-title">Mais procurados em {city?.name}</h2>
            <p className="mb-3 text-sm text-muted">Pelos agendamentos e orçamentos dos últimos 90 dias.</p>
            <ul className="flex flex-wrap gap-2">
              {discover.data.popularServices.map((p) => (
                <li key={p.name}>
                  <Link to={`/buscar?q=${encodeURIComponent(p.name)}`} className="pressable inline-flex min-h-[40px] items-center rounded-full border border-control bg-card px-4 text-sm font-medium hover:bg-raised">
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="flex flex-col gap-1 border-t border-line pt-6 md:flex-row md:items-center md:gap-6">
          <div className="flex-1">
            <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-[18px] w-[18px] text-muted" aria-hidden="true" /> Avaliações de quem foi atendido</h2>
            <p className="text-sm text-muted">Só avalia quem contratou pelo app, e a ordem dos resultados não pode ser comprada.</p>
          </div>
          <Link to="/como-funciona" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-brand-fg hover:underline">Como funciona</Link>
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
              className="pressable inline-flex min-h-[40px] items-center rounded-full border border-control bg-card px-4 text-sm font-medium text-ink hover:bg-raised"
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
          <Link key={p.id} to="/pets" className="pressable flex w-[84px] shrink-0 flex-col items-center gap-1.5 text-center">
            <PetAvatar pet={p} size={64} />
            <span className="w-full truncate text-sm font-medium">{p.name}</span>
          </Link>
        ))}
        <button onClick={() => setAdding(null)} className="pressable flex w-[84px] shrink-0 flex-col items-center gap-1.5 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-control text-muted"><Plus className="h-6 w-6" aria-hidden="true" /></span>
          <span className="text-sm font-medium text-ink">{pets.data?.length ? 'Adicionar' : 'Cadastrar pet'}</span>
        </button>
      </div>
      <PetFormSheet pet={adding} onClose={() => setAdding(undefined)} />
    </section>
  );
}

/** O que está acontecendo com o pet: o atendimento de hoje (com o Pet ao Vivo) ou o próximo horário marcado. */
function TodayOrNext() {
  const acts = useActivities();
  const list = acts.data ?? [];
  const now = Date.now();
  const todayBk = list.find((a) => a.type === 'booking' && (a.status === 'confirmed' || (a.status === 'completed' && a.live)) && a.startsAt
    && Math.abs(now - new Date(a.startsAt).getTime()) < 12 * 3_600_000);
  if (todayBk) return <TodayCard a={todayBk} />;
  const next = list
    .filter((a) => a.type === 'booking' && (a.status === 'requested' || a.status === 'confirmed') && a.startsAt && new Date(a.startsAt).getTime() > now)
    .sort((x, y) => new Date(x.startsAt!).getTime() - new Date(y.startsAt!).getTime())[0];
  if (!next) return null;
  const when = new Date(next.startsAt!).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' });
  return (
    <section aria-labelledby="next-title">
      <h2 id="next-title" className="section-title mb-3">Próximo horário</h2>
      <Link to="/atividades" className="card flex items-center gap-3 p-4 transition-colors duration-150 hover:border-control">
        <BusinessLogo name={next.business.name} logoUrl={next.business.logoUrl} size={44} />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{next.pet ? `${next.pet.name} · ` : ''}{next.serviceName}</span>
          <span className="block text-sm text-muted first-letter:uppercase">{when}, {hm(next.startsAt!)} · {next.business.name}</span>
        </span>
        <Tag tone={next.status === 'confirmed' ? 'brand' : 'warning'}>{next.status === 'confirmed' ? 'Confirmado' : 'Aguardando'}</Tag>
      </Link>
    </section>
  );
}

function TodayCard({ a }: { a: ActivityDTO }) {
  const live = useLive(a.id, { live: a.status === 'confirmed' });
  const updates = live.data ?? [];
  const stages = flowFor(a.live?.lastStage ?? updates.at(-1)?.stage);
  const current = (updates.filter((u) => stages.includes(u.stage as LiveStage)).at(-1)?.stage as LiveStage | undefined) ?? null;
  const times: Partial<Record<LiveStage, string>> = {};
  for (const u of updates) if (stages.includes(u.stage as LiveStage)) times[u.stage as LiveStage] = hm(u.createdAt);
  const lastPhoto = [...updates].reverse().find((u) => u.photoUrl);
  const isLive = !!a.live && a.status === 'confirmed';
  return (
    <section aria-labelledby="today-title">
      <h2 id="today-title" className="section-title mb-3">{isLive ? 'Acontecendo agora' : 'Hoje'}</h2>
      <Link to="/atividades" className="card block overflow-hidden transition-colors duration-150 hover:border-control">
        <div className="flex gap-4 p-4 md:p-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold leading-snug">{a.pet ? `${a.pet.name} · ` : ''}{a.serviceName}</p>
              {isLive && <Tag tone="brand">Ao vivo</Tag>}
            </div>
            <p className="text-sm text-muted">{a.business.name} · {hm(a.startsAt!)}</p>
            <div className="mt-5"><LiveTrack stages={stages} current={current} times={times} /></div>
            <p className="mt-4 text-sm text-ink">
              {current ? `${LIVE_STAGES[current].label}${updates.at(-1)?.note ? `: ${updates.at(-1)!.note}` : ''}` : 'Quando começar, cada etapa chega aqui com foto.'}
            </p>
          </div>
          {lastPhoto?.photoUrl && (
            <img src={lastPhoto.photoUrl} alt={`Foto: ${LIVE_STAGES[lastPhoto.stage as LiveStage]?.label ?? 'etapa'}`}
              className="hidden h-[148px] w-[148px] shrink-0 rounded-2xl object-cover sm:block" />
          )}
        </div>
      </Link>
    </section>
  );
}

/** Para quem ainda não entrou: como o tutor acompanha um banho (exemplo da interface real). */
function LiveExample() {
  const stages = flowFor('bath');
  return (
    <section aria-labelledby="live-title" className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center">
      <div>
        <h2 id="live-title" className="text-xl font-semibold tracking-tight">Pet ao Vivo</h2>
        <p className="mt-1.5 max-w-md text-[15px] text-ink">
          Durante o banho, o passeio ou a visita, a empresa manda cada etapa com foto. Você recebe no celular e vê tudo aqui.
        </p>
      </div>
      <div className="card p-4 md:p-5" data-ui>
        <div className="flex items-center gap-2">
          <p className="font-semibold">Thor · Banho e tosa</p>
          <Tag tone="brand">Ao vivo</Tag>
        </div>
        <p className="text-sm text-muted">Exemplo de atendimento · hoje, 09:00</p>
        <div className="mt-5"><LiveTrack stages={stages} current="drying" times={{ checkin: '09:02', bath: '09:14', drying: '09:41' }} /></div>
        <p className="mt-4 text-sm text-ink">Secando: tomou banho calminho, agora no secador baixo.</p>
      </div>
    </section>
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
          className="card flex items-center gap-3 p-4 transition-colors duration-150 hover:border-control">
          <BellRing className="h-5 w-5 shrink-0 text-brand-700" aria-hidden />
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
