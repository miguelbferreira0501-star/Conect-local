import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Info, MapPin, Sparkle, Wifi } from 'lucide-react';
import { formatDistanceKm, PRICE_LEVEL_LABELS, type BusinessCardDTO } from '@conecta/shared';
import { RatingInline } from './ui/Rating';
import { DemoTag, Tag, TrustBadge } from './ui/Tags';
import { BusinessCover, BusinessLogo } from './ui/Visual';
import { Sheet } from './ui/Sheet';

export function locationLabel(b: BusinessCardDTO) {
  if (b.locationMatch === 'onlineOnly') return `Atende on-line · sede em ${b.city.name}, ${b.city.uf}`;
  const where = b.locationMatch === 'servesCity' ? `Atende sua cidade · sede em ${b.city.name}, ${b.city.uf}` : [b.neighborhood, b.city.name].filter(Boolean).join(', ');
  return b.distanceKm != null ? `${where} · ${formatDistanceKm(b.distanceKm)} de você` : where;
}

/** No máximo 3 etiquetas por cartão, por ordem de utilidade, para o cartão não parecer um anúncio. */
function cardTags(b: BusinessCardDTO) {
  const tags = [];
  if (b.openNow === true) tags.push(<Tag key="open" tone="accent">Aberto agora</Tag>);
  if (b.badges.includes('verified')) tags.push(<TrustBadge key="verified" id="verified" />);
  if (b.badges.includes('consistent_history')) tags.push(<TrustBadge key="ch" id="consistent_history" />);
  if (b.acceptsBooking) tags.push(<Tag key="agenda" tone="brand" icon={<CalendarCheck className="h-3.5 w-3.5" />}>Agenda on-line</Tag>);
  if (b.isNewcomer) tags.push(<Tag key="new" icon={<Sparkle className="h-3.5 w-3.5" />}>Nova na plataforma</Tag>);
  if (b.openNow === false) tags.push(<Tag key="closed">Fechado agora</Tag>);
  if (b.priceLevel) tags.push(<Tag key="price">{PRICE_LEVEL_LABELS[b.priceLevel]}</Tag>);
  return tags;
}

export function BusinessCard({ b, layout = 'list' }: { b: BusinessCardDTO; layout?: 'list' | 'compact' }) {
  const [why, setWhy] = useState(false);
  if (layout === 'compact') {
    return (
      <Link to={`/empresa/${b.slug}`} className="card group flex w-[260px] shrink-0 snap-start flex-col overflow-hidden transition hover:shadow-raised md:w-auto">
        <BusinessCover name={b.name} coverUrl={b.coverUrl} icon={b.category.icon} className="h-20" />
        <div className="flex flex-1 flex-col p-3.5">
          <div className="-mt-9 mb-2 flex items-end justify-between">
            <BusinessLogo name={b.name} logoUrl={b.logoUrl} size={48} className="ring-4 ring-white" />
            {b.isDemo && <DemoTag />}
          </div>
          <h3 className="line-clamp-1 font-semibold group-hover:text-brand-fg">{b.name}</h3>
          <p className="text-sm text-muted">{b.category.shortName}</p>
          <div className="mt-1.5"><RatingInline rating={b.rating} compact /></div>
          <p className="mt-1 line-clamp-1 text-xs text-muted">{locationLabel(b)}</p>
        </div>
      </Link>
    );
  }
  return (
    <article className="card relative overflow-hidden transition hover:shadow-raised">
      <Link to={`/empresa/${b.slug}`} className="flex gap-3.5 p-4" aria-label={`${b.name}, ${b.category.name}`}>
        <BusinessLogo name={b.name} logoUrl={b.logoUrl} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 pr-8">
            <h3 className="line-clamp-2 text-[17px] font-semibold leading-snug">{b.name}</h3>
            {b.isDemo && <DemoTag />}
          </div>
          <p className="text-sm text-muted">
            {b.category.name}
            {b.professionalName && b.professionalName !== b.name ? ` · ${b.professionalName}` : ''}
          </p>
          <div className="mt-1"><RatingInline rating={b.rating} /></div>
          <p className="mt-1 flex items-start gap-1 text-sm text-muted">
            {b.locationMatch === 'onlineOnly' ? <Wifi className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
            <span>{locationLabel(b)}</span>
          </p>
          {b.shortDescription && <p className="mt-2 line-clamp-2 text-sm text-ink/90">{b.shortDescription}</p>}
          {b.topServices.length > 0 && (
            <p className="mt-2 line-clamp-1 text-sm text-muted">
              <span className="sr-only">Serviços: </span>
              {b.topServices.join(' · ')}
            </p>
          )}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {cardTags(b).slice(0, 3)}
          </div>
        </div>
      </Link>
      {b.rankingExplanation && (
        <>
          <button
            onClick={() => setWhy(true)}
            className="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-ink"
            aria-label={`Por que ${b.name} aparece nesta posição?`}
            title="Por que aparece aqui?"
          >
            <Info className="h-[18px] w-[18px]" />
          </button>
          <Sheet open={why} onClose={() => setWhy(false)} title="Por que aparece aqui?">
            <ul className="space-y-2.5">
              {b.rankingExplanation.map((line) => (
                <li key={line} className="flex gap-2 text-[15px]"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />{line}</li>
              ))}
            </ul>
            {b.isNewcomer && <p className="mt-3 text-sm text-muted">“Nova na plataforma” indica que a empresa chegou há pouco tempo. Não é um selo de qualidade.</p>}
            <Link to="/como-funciona" className="mt-4 inline-block font-semibold text-brand-fg underline-offset-2 hover:underline">Como ordenamos os resultados</Link>
          </Sheet>
        </>
      )}
    </article>
  );
}
