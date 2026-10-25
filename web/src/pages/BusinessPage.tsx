import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, CalendarCheck, Clock, ExternalLink, Flag, Globe, Instagram, Mail, MapPin, MessageCircle, Phone, ShieldCheck, Share2, Star, Store, Truck, Wifi,
} from 'lucide-react';
import {
  BADGES, comparePriceWithCity, formatCents, describeDayHours, formatDuration, formatPhoneBR, formatRating, formatServicePrice, isOpenAt, PRICE_LEVEL_LABELS, REPORT_REASONS, REVIEW_ASPECT_LABELS,
  relativeTime, reviewCountLabel, WEEKDAY_NAMES, type BusinessDetailDTO, type ReviewAspect, type ServiceMode,
} from '@conecta/shared';
import { BRAND, isReservationCategory } from '@conecta/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useBusiness, useReviews } from '@/lib/queries';
import { FavoriteButton } from '@/components/FavoriteButton';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Alert, EmptyState, ErrorState, PageLoader, Spinner } from '@/components/ui/Feedback';
import { ChipToggle, TextArea } from '@/components/ui/Form';
import { RatingInline, Stars } from '@/components/ui/Rating';
import { Sheet } from '@/components/ui/Sheet';
import { DemoTag, Tag, TrustBadge } from '@/components/ui/Tags';
import { useToast } from '@/components/ui/Toast';
import { BusinessCover, BusinessLogo } from '@/components/ui/Visual';
import { locationLabel } from '@/components/BusinessCard';

type TabId = 'visao-geral' | 'servicos' | 'avaliacoes' | 'fotos' | 'contato';

const MODE_ICON: Record<ServiceMode, typeof Store> = { in_person: Store, at_customer: Truck, online: Wifi };
const MODE_TEXT: Record<ServiceMode, string> = {
  in_person: 'Atende no estabelecimento',
  at_customer: 'Vai até o seu endereço',
  online: 'Atende on-line',
};

/** Preço exibido; na reserva de mesa sem valor definido não mostramos "orçamento". */
export function priceLabel(s: BusinessDetailDTO['services'][number], reservation: boolean) {
  if (s.priceType === 'fixed' && s.priceMinCents === 0) return 'Gratuito';
  if (reservation && s.bookable && s.priceType === 'quote') return '';
  return formatServicePrice(s);
}

const PRICE_TONE = { below: 'bg-accent-50 text-accent-700', average: 'bg-surface text-muted', above: 'bg-warning-50 text-warning-700' } as const;

/** "Preço justo": compara com a mediana do mesmo serviço na cidade (3+ empresas). */
function CityPriceTag({ s }: { s: BusinessDetailDTO['services'][number] }) {
  const cmp = comparePriceWithCity(s, s.cityPrice);
  if (!cmp || !s.cityPrice) return null;
  return (
    <p className="mt-1 flex flex-col items-end gap-0.5">
      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRICE_TONE[cmp.tone]}`}>{cmp.label}</span>
      <span className="text-xs text-muted">Média: {formatCents(s.cityPrice.medianCents)} ({s.cityPrice.businesses} empresas)</span>
    </p>
  );
}

function hasContact(b: BusinessDetailDTO) {
  const c = b.contact;
  return !!(c.whatsapp || c.phone || c.website || c.instagram || c.facebook || c.email);
}

export function BusinessPage() {
  const { slug } = useParams();
  const nav = useNavigate();
  const loc = useLocation();
  const [sp, setSp] = useSearchParams();
  const { data: b, isLoading, error, refetch } = useBusiness(slug);
  const toast = useToast();

  if (isLoading) return <PageLoader />;
  if (error || !b) return <ErrorState error={error} onRetry={() => refetch()} />;

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'visao-geral', label: 'Visão geral' },
    ...(b.services.length ? [{ id: 'servicos' as const, label: isReservationCategory(b.category.slug) ? 'Cardápio' : 'Serviços' }] : []),
    { id: 'avaliacoes', label: `Avaliações${b.rating.count ? ` (${b.rating.count})` : ''}` },
    ...(b.photos.length ? [{ id: 'fotos' as const, label: 'Fotos' }] : []),
    ...(hasContact(b) ? [{ id: 'contato' as const, label: 'Contato' }] : []),
  ];
  const current = (tabs.find((t) => t.id === sp.get('aba'))?.id ?? 'visao-geral') as TabId;
  const setTab = (id: TabId) => setSp(id === 'visao-geral' ? {} : { aba: id }, { replace: true });
  const primary = b.acceptsBooking ? 'booking' : b.acceptsQuote ? 'quote' : 'contact';

  const share = async () => {
    const url = window.location.href.split('?')[0];
    try {
      if (navigator.share) await navigator.share({ title: b.name, url });
      else { await navigator.clipboard.writeText(url); toast('Link copiado.'); }
    } catch { /* cancelado */ }
  };

  return (
    <div className="pb-24 md:pb-0">
      <div className="relative">
        <BusinessCover name={b.name} coverUrl={b.coverUrl} icon={b.category.icon} className="h-36 md:h-52" />
        <div className="absolute inset-x-0 top-0">
          <div className="container-app flex items-center justify-between py-3">
            <button aria-label="Voltar" onClick={() => (loc.key !== 'default' ? nav(-1) : nav('/'))} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-card hover:bg-white">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-2">
              <button aria-label="Compartilhar" onClick={share} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-card hover:bg-white"><Share2 className="h-5 w-5" /></button>
              <FavoriteButton businessId={b.id} isFavorite={b.isFavorite} name={b.name} variant="overlay" />
            </div>
          </div>
        </div>
      </div>

      <div className="container-app">
        <div className="relative z-10 -mt-10 flex items-end gap-3">
          <BusinessLogo name={b.name} logoUrl={b.logoUrl} size={84} className="ring-4 ring-surface" />
        </div>
        <div className="mt-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold leading-tight md:text-3xl">{b.name}</h1>
            {b.isDemo && <DemoTag />}
          </div>
          <p className="mt-0.5 text-muted">
            {b.category.name}{b.professionalName && b.professionalName !== b.name ? ` · ${b.professionalName}` : ''}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <button onClick={() => setTab('avaliacoes')} className="rounded hover:underline"><RatingInline rating={b.rating} /></button>
            <span className="inline-flex items-center gap-1 text-sm text-muted"><MapPin className="h-4 w-4" aria-hidden="true" />{locationLabel(b)}</span>
          </div>
          {(b.badges.length > 0 || b.openNow != null || b.priceLevel) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {b.openNow === true && <Tag tone="accent">Aberto agora</Tag>}
              {b.openNow === false && <Tag>Fechado agora</Tag>}
              {b.badges.map((id) => <TrustBadge key={id} id={id} />)}
              {b.priceLevel && <Tag>{PRICE_LEVEL_LABELS[b.priceLevel]}</Tag>}
            </div>
          )}
          {b.isDemo && (
            <div className="mt-4"><Alert tone="warning">Esta é uma empresa fictícia, criada para demonstrar o aplicativo. Contatos e pedidos não chegam a nenhuma empresa real.</Alert></div>
          )}
          <div className="mt-4 hidden flex-wrap gap-3 md:flex">
            <PrimaryActions b={b} primary={primary} onContact={() => setTab('contato')} />
          </div>
        </div>

        <div role="tablist" aria-label="Seções da empresa" className="scroll-row sticky top-0 z-20 mt-5 border-b border-line bg-surface/95 pb-0 backdrop-blur">
          {tabs.map((t) => (
            <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={current === t.id} aria-controls={`panel-${t.id}`} onClick={() => setTab(t.id)}
              className={`min-h-[48px] shrink-0 border-b-2 px-3 text-[15px] font-medium transition ${current === t.id ? 'border-brand-700 text-brand-700' : 'border-transparent text-muted hover:text-ink'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${current}`} aria-labelledby={`tab-${current}`} className="py-5">
          {current === 'visao-geral' && <Overview b={b} onTab={setTab} />}
          {current === 'servicos' && <Services b={b} />}
          {current === 'avaliacoes' && <Reviews b={b} />}
          {current === 'fotos' && (
            <ul className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {b.photos.map((p) => <li key={p.id}><img src={p.url} alt={p.caption ?? `Foto de ${b.name}`} loading="lazy" className="aspect-square w-full rounded-xl object-cover" /></li>)}
            </ul>
          )}
          {current === 'contato' && <Contact b={b} />}
        </div>
      </div>

      {/* Barra de ação fixa no celular */}
      <div className="fixed inset-x-0 bottom-[60px] z-30 border-t border-line bg-white/95 px-4 py-2.5 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg gap-2.5">
          <PrimaryActions b={b} primary={primary} onContact={() => setTab('contato')} compact />
        </div>
      </div>
    </div>
  );
}

function PrimaryActions({ b, primary, onContact, compact }: { b: BusinessDetailDTO; primary: string; onContact: () => void; compact?: boolean }) {
  const contact = hasContact(b);
  const reservation = isReservationCategory(b.category.slug);
  return (
    <>
      {b.acceptsBooking && (
        <ButtonLink to={`/empresa/${b.slug}/agendar`} icon={<CalendarCheck className="h-5 w-5" />} className={compact ? 'flex-1 whitespace-nowrap' : ''}>
          {isReservationCategory(b.category.slug) ? (compact ? 'Reservar' : 'Reservar mesa') : compact ? 'Agendar' : 'Agendar horário'}
        </ButtonLink>
      )}
      {b.acceptsQuote && !reservation && (
        <ButtonLink to={`/empresa/${b.slug}/orcamento`} variant={primary === 'quote' ? 'primary' : 'secondary'} className={compact ? 'flex-1 whitespace-nowrap' : ''}>
          {compact && b.acceptsBooking ? 'Orçamento' : 'Solicitar orçamento'}
        </ButtonLink>
      )}
      {contact && !(compact && b.acceptsBooking && b.acceptsQuote && !reservation) && (
        <Button variant="secondary" onClick={onContact} icon={<MessageCircle className="h-5 w-5" />} className={compact ? 'flex-1' : ''}>Contato</Button>
      )}
    </>
  );
}

function Overview({ b, onTab }: { b: BusinessDetailDTO; onTab: (t: TabId) => void }) {
  const today = new Date();
  const todayIdx = Number(new Intl.DateTimeFormat('en-US', { timeZone: b.timezone, weekday: 'short' }).format(today).replace(/Sun|Mon|Tue|Wed|Thu|Fri|Sat/, (d) => String(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(d))));
  const mapUrl = b.coordinates ? `https://www.openstreetmap.org/?mlat=${b.coordinates.lat}&mlon=${b.coordinates.lon}#map=17/${b.coordinates.lat}/${b.coordinates.lon}` : null;
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        {b.description && (
          <section className="card p-5">
            <h2 className="mb-2 font-semibold">Sobre</h2>
            <p className="whitespace-pre-line leading-relaxed text-ink/90">{b.description}</p>
          </section>
        )}
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">Como atende</h2>
          <ul className="space-y-2.5">
            {b.modes.map((m) => {
              const Icon = MODE_ICON[m];
              return <li key={m} className="flex items-center gap-3"><Icon className="h-5 w-5 text-brand-600" aria-hidden="true" />{MODE_TEXT[m]}</li>;
            })}
          </ul>
          {(b.serviceAreaCities.length > 0 || b.modes.includes('at_customer')) && (
            <p className="mt-3 text-sm text-muted">
              <strong className="font-medium text-ink">Área atendida:</strong> {[`${b.city.name}`, ...b.serviceAreaCities.map((c) => c.name)].join(', ')}
            </p>
          )}
        </section>
        {b.services.length > 0 && (
          <section className="card p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold">{isReservationCategory(b.category.slug) ? 'Destaques do cardápio' : 'Principais serviços'}</h2>
              <button className="min-h-[44px] text-sm font-semibold text-brand-700 hover:underline" onClick={() => onTab('servicos')}>Ver todos</button>
            </div>
            <ul className="divide-y divide-line">
              {b.services.slice(0, 3).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span>{s.name}</span>
                  <span className="shrink-0 text-sm font-medium text-ink">{priceLabel(s, isReservationCategory(b.category.slug))}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <aside className="space-y-5">
        {(b.address.street || b.address.neighborhood) && b.modes.includes('in_person') && (
          <section className="card p-5">
            <h2 className="mb-2 font-semibold">Endereço</h2>
            <p className="text-ink/90">{[b.address.street, b.address.neighborhood].filter(Boolean).join(' – ')}</p>
            <p className="text-ink/90">{b.city.name}, {b.city.uf}</p>
            {mapUrl && (
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-brand-700 hover:underline">
                <MapPin className="h-4 w-4" /> Ver no mapa <ExternalLink className="h-3.5 w-3.5" /><span className="sr-only">(abre em nova aba)</span>
              </a>
            )}
          </section>
        )}
        {b.openingHours && Object.keys(b.openingHours).length > 0 && (
          <section className="card p-5">
            <h2 className="mb-1 flex items-center gap-2 font-semibold"><Clock className="h-5 w-5 text-brand-600" aria-hidden="true" /> Horários</h2>
            {b.hoursFresh ? (
              b.modes.includes('in_person') && (
                <p className={`mb-2 text-sm font-medium ${isOpenAt(b.openingHours, today, b.timezone) ? 'text-accent-700' : 'text-muted'}`}>
                  {isOpenAt(b.openingHours, today, b.timezone) ? 'Aberto agora' : 'Fechado agora'}
                </p>
              )
            ) : (
              <p className="mb-2 text-sm text-warning-700">Horários podem estar desatualizados{b.hoursUpdatedAt ? ` (confirmados ${relativeTime(b.hoursUpdatedAt)})` : ''}. Confirme com a empresa.</p>
            )}
            <table className="w-full text-sm">
              <tbody>
                {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                  <tr key={d} className={d === todayIdx ? 'font-semibold' : ''}>
                    <th scope="row" className="py-1 pr-3 text-left font-normal text-muted">{WEEKDAY_NAMES[d]}{d === todayIdx ? ' (hoje)' : ''}</th>
                    <td className="py-1 text-right">{describeDayHours(b.openingHours?.[String(d) as '0'])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
        <section className="card p-5">
          <h2 className="mb-2 flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-accent-600" aria-hidden="true" /> Confiança</h2>
          {b.badges.length === 0 ? (
            <p className="text-sm text-muted">Esta empresa ainda não cumpre os critérios de nenhum selo.</p>
          ) : (
            <ul className="space-y-3">
              {b.badges.map((id) => (
                <li key={id}>
                  <TrustBadge id={id} withTitle={false} />
                  <p className="mt-1 text-sm text-muted">{BADGES[id].criteria}</p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-sm text-muted">Na plataforma desde {new Date(b.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}.</p>
          <Link to="/como-funciona" className="mt-1 inline-block text-sm font-semibold text-brand-700 hover:underline">Como funcionam os selos</Link>
        </section>
      </aside>
    </div>
  );
}

function Services({ b }: { b: BusinessDetailDTO }) {
  return (
    <ul className="space-y-3">
      {b.services.map((s) => (
        <li key={s.id} className="card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">{s.name}</h3>
              {s.description && <p className="mt-0.5 text-sm text-muted">{s.description}</p>}
              <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-muted">
                {s.durationMinutes && <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" aria-hidden="true" />{formatDuration(s.durationMinutes)}</span>}
                {s.bookable && <span className="inline-flex items-center gap-1 text-accent-700"><CalendarCheck className="h-4 w-4" aria-hidden="true" />Agendamento on-line</span>}
              </p>
              {s.notes && <p className="mt-1 text-sm text-ink/80">{s.notes}</p>}
            </div>
            <div className="text-right">
              <p className="font-semibold">{priceLabel(s, isReservationCategory(b.category.slug))}</p>
              <CityPriceTag s={s} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {s.bookable && b.acceptsBooking && <ButtonLink size="sm" to={`/empresa/${b.slug}/agendar?servico=${s.id}`}>{isReservationCategory(b.category.slug) ? 'Reservar' : 'Agendar'}</ButtonLink>}
            {b.acceptsQuote && !isReservationCategory(b.category.slug) && <ButtonLink size="sm" variant="secondary" to={`/empresa/${b.slug}/orcamento?servico=${s.id}`}>{s.priceType === 'quote' ? 'Solicitar orçamento' : 'Tirar dúvidas / orçamento'}</ButtonLink>}
          </div>
        </li>
      ))}
      <li className="text-sm text-muted">Preços informados pela empresa. O valor final pode variar; confirme antes de contratar.</li>
    </ul>
  );
}

function Reviews({ b }: { b: BusinessDetailDTO }) {
  const [sort, setSort] = useState<'recent' | 'highest' | 'lowest'>('recent');
  const [rating, setRating] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const reviews = useReviews(b.id, sort, page, rating);
  const [reportId, setReportId] = useState<string | null>(null);
  const { user } = useAuth();
  const max = Math.max(1, ...Object.values(b.ratingDistribution));
  const aspects = Object.entries(b.aspectAverages) as Array<[ReviewAspect, number]>;

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4">
        <div className="card p-5">
          {b.rating.count > 0 && b.rating.average != null ? (
            <>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold">{formatRating(b.rating.average)}</span>
                <div><Stars value={b.rating.average} size={18} /><p className="text-sm text-muted">{reviewCountLabel(b.rating.count)}</p></div>
              </div>
              <ul className="mt-4 space-y-1.5" aria-label="Distribuição das notas">
                {[5, 4, 3, 2, 1].map((n) => {
                  const count = b.ratingDistribution[n as 1];
                  return (
                    <li key={n}>
                      <button className={`flex w-full items-center gap-2 rounded-lg px-1 py-1 text-sm hover:bg-surface ${rating === n ? 'bg-brand-50' : ''}`} onClick={() => { setRating(rating === n ? undefined : n); setPage(1); }}
                        aria-label={`${n} estrelas: ${count} avaliações. ${rating === n ? 'Remover filtro' : 'Filtrar'}`} aria-pressed={rating === n}>
                        <span className="w-3 text-muted">{n}</span>
                        <Star className="h-3.5 w-3.5 text-star" fill="currentColor" strokeWidth={0} aria-hidden="true" />
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-line"><span className="block h-full rounded-full bg-star" style={{ width: `${(count / max) * 100}%` }} /></span>
                        <span className="w-8 text-right text-muted">{count}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {aspects.length > 0 && (
                <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
                  {aspects.map(([k, v]) => (
                    <div key={k} className="flex justify-between"><dt className="text-muted">{REVIEW_ASPECT_LABELS[k]}</dt><dd className="font-medium">{formatRating(v)}</dd></div>
                  ))}
                </dl>
              )}
            </>
          ) : (
            <p className="text-muted">Sem avaliações ainda. Seja a primeira pessoa a avaliar depois de contratar.</p>
          )}
        </div>
        <div className="card p-5 text-sm">
          <h3 className="font-semibold">Quer avaliar?</h3>
          <p className="mt-1 text-muted">Só avalia quem contratou pela plataforma: depois do atendimento, a opção aparece em <strong>Atividades</strong>.</p>
          <ButtonLink to={user ? '/atividades' : `/entrar?voltar=/atividades`} variant="secondary" size="sm" className="mt-3">Ir para Atividades</ButtonLink>
        </div>
      </aside>

      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {(['recent', 'highest', 'lowest'] as const).map((s) => (
            <ChipToggle key={s} selected={sort === s} onClick={() => { setSort(s); setPage(1); }}>{{ recent: 'Mais recentes', highest: 'Maiores notas', lowest: 'Menores notas' }[s]}</ChipToggle>
          ))}
        </div>
        {reviews.isLoading && <Spinner label="Carregando avaliações…" />}
        {reviews.data && reviews.data.total === 0 && <EmptyState icon={<Star className="h-8 w-8" />} title="Nenhuma avaliação aqui">{rating ? 'Nenhuma avaliação com essa nota.' : 'Esta empresa ainda não recebeu avaliações.'}</EmptyState>}
        <ul className="space-y-3">
          {reviews.data?.items.map((r) => (
            <li key={r.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 font-semibold text-brand-700" aria-hidden="true">{r.authorName.charAt(0)}</span>
                  <div>
                    <p className="font-semibold">{r.authorName}{r.isMine && <span className="ml-1 text-sm font-normal text-muted">(você)</span>}</p>
                    <p className="text-sm text-muted">{relativeTime(r.createdAt)}{r.serviceName ? ` · ${r.serviceName}` : ''}</p>
                  </div>
                </div>
                {!r.isMine && (
                  <button aria-label="Denunciar avaliação" title="Denunciar" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface" onClick={() => setReportId(r.id)}>
                    <Flag className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span role="img" aria-label={`${r.rating} de 5 estrelas`}><Stars value={r.rating} /></span>
                {r.verifiedInteraction && <Tag tone="accent" icon={<ShieldCheck className="h-3.5 w-3.5" />}>Contratou pela plataforma</Tag>}
              </div>
              <p className="mt-2 leading-relaxed">{r.comment}</p>
              {r.replyBody && (
                <div className="mt-3 rounded-xl bg-surface p-3 text-sm">
                  <p className="font-semibold">Resposta da empresa</p>
                  <p className="mt-0.5">{r.replyBody}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
        {reviews.data && reviews.data.total > reviews.data.page * reviews.data.pageSize && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {page > 1 && <Button variant="secondary" onClick={() => setPage(page - 1)}>Anteriores</Button>}
            <span className="text-sm text-muted">Página {page} de {Math.ceil(reviews.data.total / reviews.data.pageSize)}</span>
            <Button variant="secondary" onClick={() => setPage(page + 1)} loading={reviews.isFetching}>Próximas</Button>
          </div>
        )}
        {page > 1 && reviews.data && reviews.data.total <= reviews.data.page * reviews.data.pageSize && (
          <div className="mt-4 flex justify-center"><Button variant="secondary" onClick={() => setPage(page - 1)}>Anteriores</Button></div>
        )}
        <p className="mt-4 text-xs text-muted">Empresas não podem apagar avaliações nem pagar para escondê-las. Denúncias são analisadas pela moderação.</p>
      </div>
      <ReportSheet reviewId={reportId} onClose={() => setReportId(null)} />
    </div>
  );
}

function ReportSheet({ reviewId, onClose }: { reviewId: string | null; onClose: () => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const [reason, setReason] = useState<keyof typeof REPORT_REASONS | ''>('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!reviewId || !reason) return;
    setLoading(true);
    try {
      const res = await api.post<{ alreadyReported: boolean }>(`/reviews/${reviewId}/report`, { reason, details });
      toast(res.alreadyReported ? 'Você já tinha denunciado esta avaliação.' : 'Denúncia enviada para a moderação. Obrigado!');
      onClose();
      setReason('');
      setDetails('');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Sheet open={!!reviewId} onClose={onClose} title="Denunciar avaliação"
      footer={user ? <Button block onClick={submit} disabled={!reason} loading={loading}>Enviar denúncia</Button> : undefined}>
      {!user ? (
        <div className="space-y-3">
          <p>Entre na sua conta para denunciar uma avaliação.</p>
          <ButtonLink to={`/entrar?voltar=${encodeURIComponent(window.location.pathname + window.location.search)}`}>Entrar</ButtonLink>
        </div>
      ) : (
        <div className="space-y-4">
          <fieldset className="space-y-1">
            <legend className="label">Qual é o problema?</legend>
            {Object.entries(REPORT_REASONS).map(([k, label]) => (
              <label key={k} className="flex min-h-[44px] cursor-pointer items-center gap-3">
                <input type="radio" name="reason" checked={reason === k} onChange={() => setReason(k as keyof typeof REPORT_REASONS)} className="h-5 w-5 accent-[rgb(var(--brand-700))]" />
                {label}
              </label>
            ))}
          </fieldset>
          <TextArea label="Detalhes" optional maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} className="field min-h-[90px]" />
          <p className="text-sm text-muted">A avaliação continua visível enquanto é analisada. Avaliações só são removidas se violarem as regras.</p>
        </div>
      )}
    </Sheet>
  );
}

function Contact({ b }: { b: BusinessDetailDTO }) {
  const c = b.contact;
  const wa = c.whatsapp ? `https://wa.me/55${c.whatsapp.replace(/\D/g, '').replace(/^55/, '')}?text=${encodeURIComponent(`Olá! Encontrei a ${b.name} no ${BRAND.name} e gostaria de mais informações.`)}` : null;
  const items = [
    wa && { icon: MessageCircle, label: 'WhatsApp', value: formatPhoneBR(c.whatsapp!), href: wa, action: 'Abrir WhatsApp' },
    c.phone && { icon: Phone, label: 'Telefone', value: formatPhoneBR(c.phone), href: `tel:+55${c.phone}`, action: 'Ligar' },
    c.website && { icon: Globe, label: 'Site', value: c.website.replace(/^https?:\/\//, '').replace(/\/$/, ''), href: c.website, action: 'Abrir site' },
    c.instagram && { icon: Instagram, label: 'Instagram', value: `@${c.instagram}`, href: `https://instagram.com/${c.instagram}`, action: 'Abrir Instagram' },
    c.email && { icon: Mail, label: 'E-mail', value: c.email, href: `mailto:${c.email}`, action: 'Escrever e-mail' },
  ].filter(Boolean) as Array<{ icon: typeof Phone; label: string; value: string; href: string; action: string }>;
  return (
    <div className="max-w-xl space-y-3">
      {b.isDemo && <Alert tone="warning">Empresa de exemplo: os contatos estão desativados para não direcionar você a números ou sites reais.</Alert>}
      <ul className="card divide-y divide-line">
        {items.map((i) => (
          <li key={i.label} className="flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"><i.icon className="h-5 w-5" aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted">{i.label}</p>
              <p className="truncate font-medium">{i.value}</p>
            </div>
            {b.isDemo ? (
              <span className="text-sm text-muted">Desativado</span>
            ) : (
              <a href={i.href} target={i.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center rounded-xl border border-line px-3.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                {i.action}
              </a>
            )}
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted">Esses botões abrem outro aplicativo. A conversa acontece fora do {BRAND.name} e não fica registrada aqui.</p>
    </div>
  );
}
