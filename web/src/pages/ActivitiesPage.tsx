import { BookingExtras } from '@/components/BookingExtras';
import { DepositCard } from '@/components/DepositCard';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarClock, CalendarDays, ChevronDown, FileText, PawPrint, Radio, Repeat, Star } from 'lucide-react';
import { LIVE_STAGES, PERIODS, type ActivityDTO, type LiveStage, type Period } from '@conecta/shared';
import { useLive } from '@/lib/pets';
import { LiveTimeline } from '@/components/pets';
import { api } from '@/lib/api';
import { useActivities } from '@/lib/queries';
import { PageHeader } from '@/components/Layout';
import { RequireAuth } from '@/components/RequireAuth';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback';
import { ChipToggle } from '@/components/ui/Form';
import { Sheet } from '@/components/ui/Sheet';
import { Tag } from '@/components/ui/Tags';
import { useToast } from '@/components/ui/Toast';
import { BusinessLogo } from '@/components/ui/Visual';

const STATUS: Record<string, { label: string; tone: 'neutral' | 'brand' | 'accent' | 'warning' }> = {
  requested: { label: 'Aguardando confirmação', tone: 'warning' },
  confirmed: { label: 'Confirmado', tone: 'brand' },
  completed: { label: 'Realizado', tone: 'accent' },
  cancelled: { label: 'Cancelado', tone: 'neutral' },
  declined: { label: 'Recusado pela empresa', tone: 'neutral' },
  sent: { label: 'Pedido enviado', tone: 'warning' },
  answered: { label: 'Respondido', tone: 'brand' },
  hired: { label: 'Contratado', tone: 'accent' },
  closed: { label: 'Encerrado', tone: 'neutral' },
};

export function ActivitiesPage() {
  return (
    <div>
      <PageHeader title="Agenda" back={false} />
      <div className="container-app max-w-3xl py-5">
        <RequireAuth title="Acompanhe seus pedidos" reason="Entre para ver seus agendamentos, pedidos de orçamento e avaliar os serviços contratados.">
          <ActivityList />
        </RequireAuth>
      </div>
    </div>
  );
}

function ActivityList() {
  const acts = useActivities();
  const [filter, setFilter] = useState<'open' | 'history'>('open');
  if (acts.isLoading) return <PageLoader />;
  if (acts.isError) return <ErrorState error={acts.error} onRetry={() => acts.refetch()} />;
  const all = acts.data ?? [];
  const isOpen = (a: ActivityDTO) => ['requested', 'confirmed', 'sent', 'answered'].includes(a.status) || a.canReview;
  const list = all.filter((a) => (filter === 'open' ? isOpen(a) : !isOpen(a)));
  const toReview = all.filter((a) => a.canReview).length;

  if (all.length === 0) {
    return (
      <EmptyState icon={<CalendarClock className="h-8 w-8" />} title="Nenhuma atividade ainda" action={<ButtonLink to="/buscar">Encontrar uma empresa</ButtonLink>}>
        Quando você agendar um horário ou pedir um orçamento, ele aparece aqui.
      </EmptyState>
    );
  }
  return (
    <>
      {toReview > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-star/40 bg-warning-50 p-4">
          <Star className="h-6 w-6 shrink-0 text-star" fill="currentColor" strokeWidth={0} aria-hidden="true" />
          <p className="text-sm"><strong>{toReview === 1 ? '1 serviço aguarda' : `${toReview} serviços aguardam`} sua avaliação.</strong> Sua opinião ajuda outras pessoas a decidir.</p>
        </div>
      )}
      <div className="mb-4 flex gap-2">
        <ChipToggle selected={filter === 'open'} onClick={() => setFilter('open')}>Em andamento</ChipToggle>
        <ChipToggle selected={filter === 'history'} onClick={() => setFilter('history')}>Histórico</ChipToggle>
      </div>
      {list.length === 0 ? (
        <p className="py-8 text-center text-muted">{filter === 'open' ? 'Nada em andamento no momento.' : 'Seu histórico aparecerá aqui.'}</p>
      ) : (
        <ul className="space-y-3">{list.map((a) => <li key={`${a.type}-${a.id}`}><ActivityCard a={a} /></li>)}</ul>
      )}
    </>
  );
}

function ActivityCard({ a }: { a: ActivityDTO }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [confirm, setConfirm] = useState<null | { action: string; title: string; text: string; button: string; danger?: boolean }>(null);
  const [loading, setLoading] = useState(false);
  const s = STATUS[a.status];
  const run = async (action: string) => {
    setLoading(true);
    try {
      const path = a.type === 'booking' ? `/bookings/${a.id}/${action}` : `/quotes/${a.id}/${action}`;
      await api.post(path);
      await qc.invalidateQueries({ queryKey: ['activities'] });
      toast(action === 'complete' || action === 'hired' ? 'Pronto! Agora você já pode avaliar.' : 'Atualizado.');
      setConfirm(null);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };
  const when = a.startsAt
    ? a.bookingMode === 'day'
      ? `${new Date(a.startsAt).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })} · diária`
      : a.bookingMode === 'period'
        ? `${new Date(a.startsAt).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })} · ${PERIODS[a.period as Period]?.label.toLowerCase() ?? ''}`
        : new Date(a.startsAt).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : a.preferredDate
      ? `Data desejada: ${new Date(a.preferredDate + 'T12:00:00').toLocaleDateString('pt-BR')}`
      : `Pedido em ${new Date(a.createdAt).toLocaleDateString('pt-BR')}`;

  return (
    <article className="card p-4">
      <div className="flex gap-3">
        <Link to={`/empresa/${a.business.slug}`} aria-hidden="true" tabIndex={-1}><BusinessLogo name={a.business.name} logoUrl={a.business.logoUrl} size={48} /></Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone={s.tone}>{s.label}</Tag>
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              {a.type === 'booking' ? <CalendarDays className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
              {a.type === 'booking' ? 'Agendamento' : 'Orçamento'}
            </span>
            {a.seriesId && <span className="inline-flex items-center gap-1 text-xs text-muted"><Repeat className="h-3.5 w-3.5" /> Repete</span>}
          </div>
          <h3 className="mt-1 font-semibold"><Link to={`/empresa/${a.business.slug}`} className="hover:underline">{a.business.name}</Link></h3>
          <p className="text-sm text-muted">{a.serviceName ?? a.business.categoryName}</p>
          {a.pet && <p className="mt-0.5 flex items-center gap-1 text-sm font-medium text-accent-700"><PawPrint className="h-4 w-4" aria-hidden="true" /> {a.pet.name}</p>}
          <p className="mt-0.5 text-sm">{when}{a.partySize ? ` · ${a.partySize} ${a.partySize === 1 ? 'pessoa' : 'pessoas'}` : ''}{a.staffName ? ` · ${a.partySize ? '' : 'com '}${a.staffName}` : ''}</p>
          {a.type === 'booking' && <BookingExtras endsAt={a.endsAt} mode={a.bookingMode} address={a.address} destination={a.destination} details={a.details} fromPackage={a.fromPackage} />}
          {a.type === 'quote' && a.status === 'sent' && <p className="mt-1 text-xs text-muted">A empresa responde pelo contato que você informou.</p>}
          {a.businessMessage && (
            <div className="mt-2 rounded-xl bg-surface p-3 text-sm">
              <p className="font-semibold">Mensagem da empresa</p>
              <p className="whitespace-pre-line">{a.businessMessage}</p>
            </div>
          )}
        </div>
      </div>
      {a.type === 'booking' && a.deposit && (a.status === 'requested' || a.status === 'confirmed' || a.deposit.status === 'paid') && (
        <div className="mt-3"><DepositCard cents={a.deposit.cents} status={a.deposit.status} pixKey={a.deposit.pixKey} businessName={a.business.name} city={a.deposit.city} txid={a.id.replace(/-/g, '').slice(0, 25)} /></div>
      )}
      {a.type === 'booking' && (a.live || a.status === 'confirmed') && <LiveSection a={a} />}
      <div className="mt-3 flex flex-wrap gap-2">
        {a.canReview && <ButtonLink size="sm" to={`/avaliar/${a.type}/${a.id}`} icon={<Star className="h-4 w-4" />}>Avaliar</ButtonLink>}
        {a.reviewId && <ButtonLink size="sm" variant="secondary" to="/perfil/avaliacoes">Ver minha avaliação</ButtonLink>}
        {a.canMarkDone && a.type === 'booking' && (
          <Button size="sm" variant="secondary" onClick={() => setConfirm({ action: 'complete', title: 'O serviço foi realizado?', text: 'Confirme apenas se o atendimento aconteceu. Depois disso, você poderá avaliar a empresa.', button: 'Sim, foi realizado' })}>O serviço foi realizado</Button>
        )}
        {a.canMarkDone && a.type === 'quote' && (
          <Button size="sm" variant="secondary" onClick={() => setConfirm({ action: 'hired', title: 'Você contratou esta empresa?', text: 'Marque como contratado se fechou o serviço. Assim você poderá avaliar a experiência.', button: 'Sim, contratei' })}>Contratei</Button>
        )}
        {a.canCancel && a.type === 'booking' && (
          <Button size="sm" variant="danger" onClick={() => setConfirm({ action: 'cancel', title: 'Cancelar agendamento?', text: 'O horário será liberado para outras pessoas.', button: 'Cancelar agendamento', danger: true })}>Cancelar</Button>
        )}
        {a.canCancel && a.type === 'booking' && a.seriesId && (
          <Button size="sm" variant="ghost" onClick={() => setConfirm({ action: 'cancel-series', title: 'Cancelar este e os próximos?', text: 'Todos os agendamentos repetidos a partir deste serão cancelados. Os anteriores continuam no histórico.', button: 'Cancelar os próximos', danger: true })}>Cancelar os próximos</Button>
        )}
        {a.canCancel && a.type === 'quote' && (
          <Button size="sm" variant="ghost" onClick={() => setConfirm({ action: 'close', title: 'Encerrar pedido?', text: 'Use se você desistiu ou contratou outra empresa.', button: 'Encerrar pedido' })}>Encerrar</Button>
        )}
      </div>
      <Sheet open={!!confirm} onClose={() => setConfirm(null)} title={confirm?.title ?? ''}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setConfirm(null)}>Voltar</Button>
            <Button block variant={confirm?.danger ? 'danger' : 'primary'} loading={loading} onClick={() => confirm && run(confirm.action)}>{confirm?.button}</Button>
          </div>
        }>
        <p>{confirm?.text}</p>
      </Sheet>
    </article>
  );
}

/** Pet ao Vivo: etapas e fotos que a empresa manda durante o atendimento. */
function LiveSection({ a }: { a: ActivityDTO }) {
  const happening = a.status === 'confirmed' && !!a.startsAt && Math.abs(Date.now() - new Date(a.startsAt).getTime()) < 12 * 3_600_000;
  const [open, setOpen] = useState(happening && !!a.live);
  const live = useLive(open ? a.id : undefined, { live: happening });
  const last = a.live ? LIVE_STAGES[a.live.lastStage as LiveStage] : null;
  return (
    <div className="mt-3 rounded-xl border border-accent-600/30 bg-accent-50 p-3">
      <button className="flex w-full items-center gap-2 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Radio className={`h-5 w-5 text-accent-600 ${happening && a.live ? 'animate-pulse' : ''}`} aria-hidden="true" />
        <span className="flex-1">
          <span className="block font-semibold">{happening && a.live ? 'Ao vivo agora' : 'Pet ao Vivo'}</span>
          <span className="block text-sm text-muted">
            {last ? `${last.emoji} ${last.label} · ${new Date(a.live!.lastAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'As fotos de cada etapa aparecem aqui durante o atendimento.'}
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 text-muted transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && <div className="mt-3">{live.isLoading ? <p className="text-sm text-muted">Carregando…</p> : <LiveTimeline updates={live.data ?? []} />}</div>}
    </div>
  );
}
