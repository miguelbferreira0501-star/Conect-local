import { Link, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ChevronRight, Circle } from 'lucide-react';
import { formatRating, PERIODS, type PanelAgendaItemDTO, type PanelBusinessDTO, type Period } from '@conecta/shared';
import { api } from '@/lib/api';
import { usePanelMutation, usePanelRequests } from '@/lib/panelQueries';
import { PushPrompt } from '@/components/PushPrompt';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';

const useBiz = () => useOutletContext<PanelBusinessDTO>();
const hm = (d: Date | string) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const minutesOf = (d: Date) => d.getHours() * 60 + d.getMinutes();

/** Início do painel: "Como está o dia?" — o que espera confirmação e a agenda de hoje por profissional. */
export function PanelDashboard() {
  const b = useBiz();
  const reqs = usePanelRequests(b.id);
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const agenda = useQuery({
    queryKey: ['panel', 'agenda', b.id, 'today'],
    queryFn: () => api.get<PanelAgendaItemDTO[]>(`/panel/businesses/${b.id}/agenda?days=1&from=${encodeURIComponent(start.toISOString())}`),
    refetchInterval: 60_000,
  });
  const waiting = (reqs.data ?? []).filter((r) => r.status === 'requested' || r.status === 'sent')
    .sort((x, y) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime());
  const today = (agenda.data ?? []).filter((i) => i.status !== 'cancelled' && i.status !== 'declined')
    .sort((x, y) => new Date(x.startsAt).getTime() - new Date(y.startsAt).getTime());
  const now = Date.now();
  const next = today.find((i) => new Date(i.startsAt).getTime() > now);
  const oldestH = waiting[0] ? Math.max(1, Math.round((now - new Date(waiting[0].createdAt).getTime()) / 3_600_000)) : 0;
  const finding = waiting.length
    ? `${waiting.length} ${waiting.length === 1 ? 'pedido espera' : 'pedidos esperam'} sua resposta; o mais antigo chegou há ${oldestH} h.`
    : today.length ? `${today.length} ${today.length === 1 ? 'atendimento' : 'atendimentos'} hoje${next ? `, o próximo às ${hm(next.startsAt)}` : ''}.`
      : 'Nenhum atendimento marcado para hoje.';
  const dateLine = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">Hoje</h1>
          <p className="mt-1 text-[15px] text-muted"><span className="first-letter:uppercase">{dateLine}</span> · {finding}</p>
        </div>
        {waiting.length > 0
          ? <ButtonLink to="pedidos">Responder pedidos</ButtonLink>
          : <ButtonLink to="agenda" variant="secondary">Ver a semana</ButtonLink>}
      </div>

      {/* Números do dia: um cartão dividido por linhas finas (sem ícones, sem tiles soltos) */}
      <dl className="card grid grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Esperando você', value: String(waiting.length), sub: waiting.length ? 'pedidos para responder' : 'nada pendente', to: 'pedidos' },
          { label: 'Atendimentos hoje', value: String(today.length), sub: (() => { const n = today.filter((i) => i.status === 'completed').length; return `${n} ${n === 1 ? 'concluído' : 'concluídos'}`; })() },
          { label: 'Próximo horário', value: next ? hm(next.startsAt) : '—', sub: next ? `${next.pet?.name ? `${next.pet.name} · ` : ''}${next.serviceName}` : 'sem mais horários hoje' },
          { label: 'Avaliação', value: b.stats.average != null ? formatRating(b.stats.average) : '—', sub: `${b.stats.reviewCount} ${b.stats.reviewCount === 1 ? 'avaliação' : 'avaliações'}`, to: 'avaliacoes' },
        ].map((k, i) => (
          <div key={k.label} className={`min-w-0 p-4 md:p-5 ${i % 2 ? 'border-l border-line' : ''} ${i >= 2 ? 'border-t border-line md:border-t-0' : ''} ${i === 2 ? 'md:border-l' : ''}`}>
            <dt className="text-sm text-muted">{k.label}</dt>
            <dd className="num mt-1 text-2xl font-semibold leading-tight">{k.to ? <Link to={k.to} className="hover:underline">{k.value}</Link> : k.value}</dd>
            <dd className="mt-0.5 truncate text-xs text-muted">{k.sub}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <section aria-labelledby="day-title" className="card min-w-0 p-4 md:p-5">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 id="day-title" className="text-base font-semibold">Agenda de hoje</h2>
            <Link to="agenda" className="text-sm font-medium text-brand-fg hover:underline">Semana</Link>
          </div>
          {agenda.isLoading ? <Skeleton className="h-40" /> : <DayTimeline b={b} items={today} />}
        </section>

        <section aria-labelledby="wait-title" className="min-w-0">
          <h2 id="wait-title" className="mb-2 text-base font-semibold">Esperando você</h2>
          <div className="card">
            {reqs.isLoading ? <Skeleton className="m-4 h-24" /> : waiting.length === 0 ? (
              <p className="p-4 text-sm text-muted">Nenhum pedido esperando. Os novos aparecem aqui e no seu celular.</p>
            ) : (
              <ul>
                {waiting.slice(0, 4).map((r) => <WaitingRow key={r.id} businessId={b.id} r={r} />)}
              </ul>
            )}
            {waiting.length > 4 && (
              <Link to="pedidos" className="flex min-h-[44px] items-center justify-center gap-1 border-t border-line text-sm font-medium hover:bg-raised">
                Ver todos os {waiting.length} <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
          </div>
        </section>
      </div>

      <PushPrompt variant="business" />
      <ProfileChecklist b={b} />
    </div>
  );
}

function WaitingRow({ businessId, r }: { businessId: string; r: NonNullable<ReturnType<typeof usePanelRequests>['data']>[number] }) {
  const toast = useToast();
  const act = usePanelMutation(businessId, (body: { action: string }) => api.post(`/panel/businesses/${businessId}/requests/${r.type}/${r.id}`, body), ['requests']);
  const when = r.startsAt
    ? new Date(r.startsAt).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : r.preferredDate ? `para ${new Date(r.preferredDate + 'T12:00:00').toLocaleDateString('pt-BR')}` : 'orçamento';
  return (
    <li className="flex items-center gap-3 border-b border-rule px-4 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{r.pet ? `${r.pet.name} · ` : ''}{r.serviceName ?? 'Orçamento'}</p>
        <p className="truncate text-xs text-muted"><span className="first-letter:uppercase">{when}</span>{r.customer?.name ? ` · ${r.customer.name}` : ''}</p>
      </div>
      {r.type === 'booking' && r.status === 'requested' ? (
        <Button size="sm" variant="secondary" loading={act.isPending}
          onClick={() => act.mutate({ action: 'confirm' }, { onSuccess: () => toast('Horário confirmado.'), onError: (e) => toast(e.message, 'error') })}>
          Confirmar
        </Button>
      ) : (
        <Link to="pedidos" className="text-sm font-medium text-brand-fg hover:underline">Responder</Link>
      )}
    </li>
  );
}

/**
 * Elemento próprio do Pataí: a agenda de hoje por profissional (ou recurso), com as horas na horizontal.
 * Cada tipo de horário tem sua marca: confirmado em tom claro com borda na cor da marca, pedido aguardando
 * em contorno tracejado (pede decisão), em atendimento ao vivo na cor cheia, concluído em cinza.
 */
function DayTimeline({ b, items }: { b: PanelBusinessDTO; items: PanelAgendaItemDTO[] }) {
  if (!items.length) {
    return <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">Nenhum horário hoje. Quando um cliente agendar, ele aparece aqui.</p>;
  }
  const dow = String(new Date().getDay()) as keyof NonNullable<PanelBusinessDTO['openingHours']>;
  const ranges = b.openingHours?.[dow] ?? [];
  const itemMins = items.flatMap((i) => [minutesOf(new Date(i.startsAt)), minutesOf(new Date(i.endsAt))]);
  let open = Math.min(ranges[0] ? toMin(ranges[0][0]) : 8 * 60, ...itemMins);
  let close = Math.max(ranges.length ? toMin(ranges[ranges.length - 1][1]) : 19 * 60, ...itemMins);
  open = Math.floor(open / 60) * 60;
  close = Math.min(24 * 60, Math.ceil(close / 60) * 60);
  const span = Math.max(60, close - open);
  const pct = (m: number) => `${((Math.min(close, Math.max(open, m)) - open) / span) * 100}%`;
  const hours = Array.from({ length: span / 60 + 1 }, (_, k) => open + k * 60);
  const step = hours.length > 10 ? 2 : 1;
  const rows = new Map<string, { name: string; items: PanelAgendaItemDTO[] }>();
  for (const i of items) {
    const key = i.staffId ?? 'geral';
    if (!rows.has(key)) rows.set(key, { name: i.staffName ?? 'Agenda', items: [] });
    rows.get(key)!.items.push(i);
  }
  const nowMin = minutesOf(new Date());
  const span_ = (i: PanelAgendaItemDTO) => {
    if (i.mode === 'day') return [open, close];
    if (i.mode === 'period' && i.period) { const p = PERIODS[i.period as Period]; return [toMin(p.start), toMin(p.end)]; }
    return [minutesOf(new Date(i.startsAt)), minutesOf(new Date(i.endsAt))];
  };
  const kind = (i: PanelAgendaItemDTO) =>
    i.status === 'requested' ? 'border border-dashed border-brand-700 bg-card text-brand-900'
      : i.status === 'completed' ? 'bg-raised text-muted'
        : i.liveCount ? 'bg-brand-700 text-white'
          : 'border-l-[3px] border-brand-700 bg-brand-50 text-brand-900';

  return (
    <div>
      {/* Celular: lista do dia na ordem dos horários */}
      <ul className="md:hidden">
        {items.map((i) => (
          <li key={i.id} className="flex items-center gap-3 border-b border-rule py-2.5 last:border-b-0">
            <time className="w-12 shrink-0 text-sm font-semibold">{i.mode === 'slot' ? hm(i.startsAt) : i.mode === 'day' ? 'Dia' : PERIODS[i.period as Period]?.label}</time>
            <span className={`h-8 w-1 shrink-0 rounded-full ${i.status === 'requested' ? 'border border-dashed border-brand-700' : i.status === 'completed' ? 'bg-line' : 'bg-brand-700'}`} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{i.pet ? `${i.pet.name} · ` : ''}{i.serviceName}</span>
              <span className="block truncate text-xs text-muted">{[i.staffName, i.customerName].filter(Boolean).join(' · ')}{i.status === 'requested' ? ' · aguardando você' : i.liveCount ? ' · ao vivo' : ''}</span>
            </span>
          </li>
        ))}
      </ul>

      {/* Computador: linha do tempo por profissional */}
      <div className="hidden md:block">
        <div className="relative ml-[132px] h-5 text-xs text-muted">
          {hours.filter((_, k) => k % step === 0).map((h) => (
            <span key={h} className="num absolute -translate-x-1/2" style={{ left: pct(h) }}>{h / 60}h</span>
          ))}
        </div>
        <div className="relative">
          {[...rows.entries()].map(([key, row]) => (
            <div key={key} className="flex h-11 items-center border-t border-rule first:border-t-0">
              <span className="w-[132px] shrink-0 truncate pr-3 text-sm font-medium">{row.name}</span>
              <div className="relative h-full flex-1">
                {hours.map((h) => <span key={h} aria-hidden className="absolute bottom-0 top-0 w-px bg-rule" style={{ left: pct(h) }} />)}
                {row.items.map((i) => {
                  const [a, z] = span_(i);
                  return (
                    <div key={i.id} title={`${hm(i.startsAt)} · ${i.serviceName}${i.customerName ? ` · ${i.customerName}` : ''}`}
                      className={`absolute top-1/2 flex h-7 -translate-y-1/2 items-center overflow-hidden rounded px-2 text-xs font-medium ${kind(i)}`}
                      style={{ left: pct(a), width: `calc(${pct(z)} - ${pct(a)} - 2px)` }}>
                      <span className="truncate">{i.pet?.name ?? i.customerName ?? i.serviceName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {nowMin > open && nowMin < close && (
            <span aria-hidden className="pointer-events-none absolute bottom-0 top-0 w-px bg-brand-700" style={{ left: `calc(132px + (100% - 132px) * ${(nowMin - open) / span})` }} />
          )}
        </div>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted" aria-label="Legenda">
          {/* Só os tipos que estão na tela; cada amostra é a própria marca em tamanho pequeno */}
          {items.some((i) => i.status === 'confirmed' && !i.liveCount) && <li className="flex items-center gap-1.5"><span className="h-3 w-4 rounded-sm border-l-[3px] border-brand-700 bg-brand-50" aria-hidden />Confirmado</li>}
          {items.some((i) => i.status === 'requested') && <li className="flex items-center gap-1.5"><span className="h-3 w-4 rounded-sm border border-dashed border-brand-700" aria-hidden />Aguardando você</li>}
          {items.some((i) => i.status === 'confirmed' && i.liveCount) && <li className="flex items-center gap-1.5"><span className="h-3 w-4 rounded-sm bg-brand-700" aria-hidden />Ao vivo</li>}
          {items.some((i) => i.status === 'completed') && <li className="flex items-center gap-1.5"><span className="h-3 w-4 rounded-sm bg-raised" aria-hidden />Concluído</li>}
          <li className="flex items-center gap-1.5"><span className="h-3 w-px bg-brand-700" aria-hidden />Agora, {hm(new Date())}</li>
        </ul>
      </div>
    </div>
  );
}

function ProfileChecklist({ b }: { b: PanelBusinessDTO }) {
  const checklist = [
    { done: !!b.logoUrl, label: 'Adicionar logotipo', to: 'fotos' },
    { done: !!b.coverUrl, label: 'Adicionar foto de capa', to: 'fotos' },
    { done: b.photos.length >= 3, label: 'Adicionar pelo menos 3 fotos', to: 'fotos' },
    { done: b.services.length >= 3, label: 'Cadastrar pelo menos 3 serviços', to: 'servicos' },
    { done: b.services.some((s) => s.priceType !== 'quote'), label: 'Informar preço em algum serviço', to: 'servicos' },
    { done: !!b.openingHours && Object.keys(b.openingHours).length > 0, label: 'Cadastrar horários de funcionamento', to: 'horarios' },
    { done: (b.profile.description ?? '').length >= 60, label: 'Escrever uma descrição completa', to: 'perfil' },
  ];
  const done = checklist.filter((c) => c.done).length;
  if (done === checklist.length) return null;
  const pct = Math.round((done / checklist.length) * 100);
  return (
    <section className="card p-4 md:p-5" aria-labelledby="check-title">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="check-title" className="text-base font-semibold">Perfil completo atrai mais clientes</h2>
        <span className="num text-sm text-muted">{done} de {checklist.length}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Perfil completo">
        <div className="h-full rounded-full bg-brand-700" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-sm text-muted">Perfis completos aparecem melhor na busca.</p>
      <ul className="mt-2 grid md:grid-cols-2 md:gap-x-6">
        {checklist.map((c) => (
          <li key={c.label} className="border-b border-rule">
            <Link to={c.to} className="flex min-h-[44px] items-center gap-2.5 text-sm hover:text-brand-fg">
              {c.done ? <CheckCircle2 className="h-[18px] w-[18px] text-success-700" aria-hidden /> : <Circle className="h-[18px] w-[18px] text-control" aria-hidden />}
              <span className={c.done ? 'text-muted line-through' : ''}>{c.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
