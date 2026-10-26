import { BookingExtras } from '@/components/BookingExtras';
import { PanelDeposit } from './PanelBookingBits';
import { useEffect, useRef, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, CalendarDays, Check, Copy, Crown, Lightbulb, ListPlus, MessageCircle, MessageSquareText, Radio, PenLine, Plus, Send, Trash2, UserRound, Users } from 'lucide-react';
import {
  bookingProfile, checkoutSchema, reminderMessage, reviewRequestMessage, whatsappLink, formatCents, PERIODS, PLANS, WEEKDAY_NAMES, type BillingStatusDTO, type CheckoutResultDTO, type PanelAgendaItemDTO, type PanelBusinessDTO, type PanelStaffDTO, type Period, type PlanId,
} from '@conecta/shared';
import { api, ApiError } from '@/lib/api';
import { usePanelMutation } from '@/lib/panelQueries';
import { useConfig } from '@/lib/queries';
import { isStoreApp } from '@/lib/platform';
import { Button, buttonClass } from '@/components/ui/Button';
import { Alert, EmptyState, PageLoader } from '@/components/ui/Feedback';
import { Checkbox, ChipToggle, TextArea, TextField } from '@/components/ui/Form';
import { Sheet } from '@/components/ui/Sheet';
import { Tag } from '@/components/ui/Tags';
import { LiveSheet, type LiveTarget } from './LiveSheet';
import { useToast } from '@/components/ui/Toast';

const useBiz = () => useOutletContext<PanelBusinessDTO>();

// ── Equipe ──
type StaffForm = { name: string; roleTitle: string; kind: 'person' | 'resource'; serviceIds: string[]; ownHours: boolean; hours: Record<string, Array<[string, string]>> };

export function PanelStaffPage() {
  const b = useBiz();
  const toast = useToast();
  const profile = bookingProfile(b.profile.categorySlug);
  const plan = PLANS[b.plan.effective];
  const [editing, setEditing] = useState<{ id: string | null; f: StaffForm } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const save = usePanelMutation(b.id, ({ id, body }: { id: string | null; body: unknown }) =>
    id ? api.put(`/panel/businesses/${b.id}/staff/${id}`, body) : api.post(`/panel/businesses/${b.id}/staff`, body));
  const remove = usePanelMutation(b.id, (id: string) => api.delete(`/panel/businesses/${b.id}/staff/${id}`));
  const bookable = b.services.filter((s) => s.bookable);
  const open = (s?: PanelStaffDTO) => {
    setErr(null);
    setEditing({
      id: s?.id ?? null,
      f: { name: s?.name ?? '', roleTitle: s?.roleTitle ?? '', kind: s?.kind ?? profile.staffKind, serviceIds: s?.serviceIds ?? [], ownHours: !!s?.openingHours,
        hours: JSON.parse(JSON.stringify(s?.openingHours ?? b.openingHours ?? {})) },
    });
  };
  const submit = () => {
    if (!editing) return;
    const f = editing.f;
    save.mutate({ id: editing.id, body: { name: f.name, roleTitle: f.roleTitle, kind: f.kind, serviceIds: f.serviceIds, openingHours: f.ownHours ? f.hours : null } }, {
      onSuccess: () => { toast('Salvo.'); setEditing(null); },
      onError: (e) => setErr(e.message),
    });
  };
  const set = (p: Partial<StaffForm>) => editing && setEditing({ ...editing, f: { ...editing.f, ...p } });
  const atLimit = b.staff.length >= plan.maxStaff;

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h2 className="font-semibold">{profile.staffLabelPlural} e agendas</h2>
        <p className="mt-1 text-sm text-muted">
          {profile.staffLabel === 'Mesa'
            ? <>Cadastre suas mesas ou ambientes (ex.: “Mesa 4 lugares”, “Varanda”). Cada um tem a própria agenda: várias reservas no mesmo horário, uma por mesa. O cliente pode escolher ou marcar “sem preferência”. Sem nada cadastrado, o restaurante aceita uma reserva por horário.</>
            : <>Cada {profile.staffLabel.toLowerCase()} tem a própria agenda: dois clientes podem marcar o mesmo horário com pessoas (ou {profile.staffKind === 'resource' ? 'quadras/salas' : 'recursos'}) diferentes.
          O cliente pode escolher ou marcar “sem preferência”. Sem ninguém cadastrado, a empresa tem uma agenda única.</>}
        </p>
        <p className="mt-2 text-sm">Seu plano ({plan.name}) permite <strong>{plan.maxStaff}</strong> {plan.maxStaff === 1 ? 'agenda' : 'agendas'}. <Link to="../plano" className="font-semibold text-brand-fg hover:underline">Ver planos</Link></p>
      </div>
      <div className="flex justify-end">
        <Button size="sm" icon={<Plus className="h-4 w-4" />} disabled={atLimit} onClick={() => open()}>Adicionar {profile.staffLabel.toLowerCase()}</Button>
      </div>
      {b.staff.some((s) => s.paused) ? (
        <Alert tone="warning" title="Algumas agendas estão pausadas">
          Seu plano atual permite {plan.maxStaff} {plan.maxStaff === 1 ? 'agenda' : 'agendas'}. As marcadas como “Pausada” não aparecem para os clientes. <Link to="../plano" className="font-semibold underline">Assine um plano</Link> para reativá-las.
        </Alert>
      ) : atLimit && b.staff.length > 0 && <Alert tone="info">Você atingiu o limite do plano. Para mais agendas, mude de plano.</Alert>}
      {b.staff.length === 0 ? (
        <EmptyState icon={<Users className="h-8 w-8" />} title="Agenda única">Cadastre {profile.staffLabelPlural.toLowerCase()} para o cliente poder escolher com quem (ou onde) agendar.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {b.staff.map((s) => (
            <li key={s.id} className="card flex flex-wrap items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-fg"><UserRound className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{s.name}{s.roleTitle ? <span className="font-normal text-muted"> · {s.roleTitle}</span> : null} {s.paused && <Tag tone="warning">Pausada</Tag>}</p>
                <p className="text-sm text-muted">
                  {s.serviceIds.length === 0 ? 'Faz todos os serviços agendáveis' : `${s.serviceIds.length} serviço(s)`} · {s.openingHours ? 'horário próprio' : 'horário da empresa'}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => open(s)}>Editar</Button>
              <button aria-label={`Remover ${s.name}`} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-danger-50 hover:text-danger-700"
                onClick={() => remove.mutate(s.id, { onSuccess: () => toast('Removido. Agendamentos já feitos continuam valendo.') })}><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
      <Sheet open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Editar' : `Novo(a) ${profile.staffLabel.toLowerCase()}`} footer={<Button block loading={save.isPending} onClick={submit}>Salvar</Button>}>
        {editing && (
          <div className="space-y-4">
            <TextField label="Nome" value={editing.f.name} onChange={(e) => set({ name: e.target.value })} maxLength={60} placeholder={profile.staffKind === 'resource' ? 'Ex.: Quadra 1' : 'Ex.: Ana'} />
            <TextField label="Função ou descrição" optional value={editing.f.roleTitle} onChange={(e) => set({ roleTitle: e.target.value })} maxLength={60} placeholder={profile.staffKind === 'resource' ? 'Ex.: Coberta, grama sintética' : 'Ex.: Manicure'} />
            <fieldset>
              <legend className="label">Tipo</legend>
              <div className="flex gap-2">
                <ChipToggle selected={editing.f.kind === 'person'} onClick={() => set({ kind: 'person' })}>Pessoa</ChipToggle>
                <ChipToggle selected={editing.f.kind === 'resource'} onClick={() => set({ kind: 'resource' })}>Recurso (quadra, sala, box)</ChipToggle>
              </div>
            </fieldset>
            <fieldset>
              <legend className="label">Serviços que faz</legend>
              {bookable.length === 0 ? <p className="text-sm text-muted">Cadastre serviços agendáveis primeiro.</p> : (
                <>
                  <p className="mb-1 text-sm text-muted">Sem nenhum marcado = faz todos.</p>
                  {bookable.map((s) => (
                    <Checkbox key={s.id} label={s.name} checked={editing.f.serviceIds.includes(s.id)}
                      onChange={(e) => set({ serviceIds: e.target.checked ? [...editing.f.serviceIds, s.id] : editing.f.serviceIds.filter((x) => x !== s.id) })} />
                  ))}
                </>
              )}
            </fieldset>
            <Checkbox label="Horário próprio (folgas, meio período)" description="Desmarcado: segue os horários da empresa." checked={editing.f.ownHours} onChange={(e) => set({ ownHours: e.target.checked })} />
            {editing.f.ownHours && (
              <ul className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 0].map((n) => {
                  const d = String(n);
                  const r = editing.f.hours[d]?.[0];
                  return (
                    <li key={d} className="flex flex-wrap items-center gap-2">
                      <span className="w-20 text-sm font-medium">{WEEKDAY_NAMES[n]}</span>
                      <Checkbox label="Trabalha" checked={!!r} onChange={(e) => set({ hours: { ...editing.f.hours, [d]: e.target.checked ? [['08:00', '18:00']] : [] } })} />
                      {r && (
                        <>
                          <input aria-label={`${WEEKDAY_NAMES[n]} entrada`} type="time" className="field w-auto py-2" value={r[0]} onChange={(e) => set({ hours: { ...editing.f.hours, [d]: [[e.target.value, r[1]]] } })} />
                          <span className="text-sm text-muted">às</span>
                          <input aria-label={`${WEEKDAY_NAMES[n]} saída`} type="time" className="field w-auto py-2" value={r[1]} onChange={(e) => set({ hours: { ...editing.f.hours, [d]: [[r[0], e.target.value]] } })} />
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {err && <Alert tone="error">{err}</Alert>}
          </div>
        )}
      </Sheet>
    </div>
  );
}

// ── Agenda da semana ──
export function PanelAgendaPage() {
  const b = useBiz();
  const [offset, setOffset] = useState(0);
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() + offset * 7);
  const agenda = useQuery({
    queryKey: ['panel', 'agenda', b.id, offset],
    queryFn: () => api.get<PanelAgendaItemDTO[]>(`/panel/businesses/${b.id}/agenda?days=7&from=${encodeURIComponent(from.toISOString())}`),
    refetchInterval: 60_000,
  });
  const [staffFilter, setStaffFilter] = useState<string | 'all'>('all');
  const [liveTarget, setLiveTarget] = useState<LiveTarget | null>(null);
  if (agenda.isLoading) return <PageLoader />;
  const items = (agenda.data ?? []).filter((i) => staffFilter === 'all' || i.staffId === staffFilter);
  const byDay = new Map<string, PanelAgendaItemDTO[]>();
  for (const i of items) {
    const key = new Date(i.startsAt).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    byDay.set(key, [...(byDay.get(key) ?? []), i]);
  }
  const when = (i: PanelAgendaItemDTO) =>
    i.mode === 'day' ? 'Dia inteiro' : i.mode === 'period' ? PERIODS[i.period as Period]?.label ?? 'Turno' : new Date(i.startsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" disabled={offset === 0} onClick={() => setOffset(offset - 1)}>Semana anterior</Button>
        <Button size="sm" variant="secondary" onClick={() => setOffset(offset + 1)}>Próxima semana</Button>
        <span className="text-sm text-muted">a partir de {from.toLocaleDateString('pt-BR')}</span>
      </div>
      {b.staff.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <ChipToggle selected={staffFilter === 'all'} onClick={() => setStaffFilter('all')}>Todos</ChipToggle>
          {b.staff.map((s) => <ChipToggle key={s.id} selected={staffFilter === s.id} onClick={() => setStaffFilter(s.id)}>{s.name}</ChipToggle>)}
        </div>
      )}
      {byDay.size === 0 ? (
        <EmptyState icon={<CalendarDays className="h-8 w-8" />} title="Nenhum agendamento nesta semana">Os pedidos de agendamento aparecem aqui. Confirme ou recuse em Pedidos.</EmptyState>
      ) : (
        [...byDay.entries()].map(([day, list]) => (
          <section key={day} className="card p-4">
            <h2 className="mb-2 font-semibold capitalize">{day}</h2>
            <ul className="divide-y divide-line">
              {list.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span className="w-20 font-semibold tabular-nums">{when(i)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{i.serviceName}{i.partySize ? <span className="font-normal"> · {i.partySize} pessoas</span> : null}{i.staffName ? <span className="font-normal text-muted"> · {i.staffName}</span> : null}</p>
                    <p className="text-sm text-muted">{i.pet ? <span className="font-medium text-accent-700">🐾 {i.pet.name} · </span> : null}{i.customerName ?? 'Cliente'}{i.customerPhone ? ` · ${i.customerPhone}` : ''}</p>
                    <BookingExtras endsAt={i.endsAt} mode={i.mode} address={i.address} destination={i.destination} details={i.details} />
                    {i.deposit && i.status !== 'cancelled' && i.status !== 'declined' && <PanelDeposit businessId={b.id} bookingId={i.id} deposit={i.deposit} />}
                  </div>
                  {i.status !== 'requested' && (
                    <button onClick={() => setLiveTarget({ id: i.id, title: `${i.serviceName} · ${when(i)}`, status: i.status, pet: i.pet })}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-accent-600 px-3 text-sm font-semibold text-[#1f1005] hover:bg-accent-700">
                      <Radio className="h-4 w-4" aria-hidden="true" />{i.liveCount ? `Ao vivo (${i.liveCount})` : 'Pet ao Vivo'}
                    </button>
                  )}
                  {i.status === 'requested' ? <Tag tone="warning">Aguardando você</Tag> : i.status === 'confirmed' ? <Tag tone="brand">Confirmado</Tag> : <Tag tone="accent">Realizado</Tag>}
                  <AgendaWhatsApp item={i} biz={b} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
      <LiveSheet businessId={b.id} categorySlug={b.profile.categorySlug} target={liveTarget} onClose={() => { setLiveTarget(null); agenda.refetch(); }} />
    </div>
  );
}

/** Lembrete (antes) ou pedido de avaliação (depois), com mensagem pronta no WhatsApp da empresa. */
function AgendaWhatsApp({ item: i, biz }: { item: PanelAgendaItemDTO; biz: PanelBusinessDTO }) {
  const upcoming = new Date(i.endsAt).getTime() > Date.now();
  if (i.status === 'requested' && !upcoming) return null;
  const text = upcoming
    ? reminderMessage({ businessName: biz.name, customerName: i.customerName, serviceName: i.serviceName, startsAt: i.startsAt, mode: i.mode, period: i.period, partySize: i.partySize })
    : reviewRequestMessage(biz.name, i.customerName, `${window.location.origin}/empresa/${biz.slug}`);
  const href = whatsappLink(i.customerPhone, text);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-line bg-card px-3 text-sm font-semibold text-brand-fg hover:bg-surface">
      <MessageCircle className="h-4 w-4" aria-hidden="true" />{upcoming ? 'Enviar lembrete' : 'Pedir avaliação'}
    </a>
  );
}

// ── Plano e assinatura ──
const SUB_STATUS: Record<string, string> = { pending: 'Aguardando pagamento', active: 'Ativa', canceled: 'Cancelada' };

export function PanelPlanPage() {
  const b = useBiz();
  const qc = useQueryClient();
  const toast = useToast();
  const config = useConfig() as { data?: { storePayments?: boolean } };
  const canBuy = !isStoreApp() || !!config.data?.storePayments;
  const status = useQuery({ queryKey: ['panel', 'billing', b.id], queryFn: () => api.get<BillingStatusDTO>(`/panel/businesses/${b.id}/billing`) });
  const [buying, setBuying] = useState<PlanId | null>(null);
  // Vindo do cadastro ("Já deixar a assinatura pronta"): abre o pagamento direto.
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    if (params.get('assinar') === '1' && status.data?.enabled && canBuy && !status.data.subscription) { setBuying('pro'); setParams({}, { replace: true }); }
  }, [params, status.data, canBuy, setParams]);
  const [canceling, setCanceling] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  if (status.isLoading) return <PageLoader />;
  const st = status.data;
  const current = st?.effectivePlan ?? b.plan.effective;
  const sub = st?.subscription;
  const refresh = () => { qc.invalidateQueries({ queryKey: ['panel', 'billing', b.id] }); qc.invalidateQueries({ queryKey: ['panel', 'business', b.id] }); };

  return (
    <div className="space-y-4">
      <Alert tone="info">O plano não muda a sua posição na busca nem dá selos — isso depende só das avaliações e do perfil.</Alert>

      {current !== 'free' && !sub && st?.planUntil && (
        <Alert tone="success" title={`Teste grátis até ${new Date(st.planUntil).toLocaleDateString('pt-BR')}`}>
          Aproveite todos os recursos. Depois dessa data, a empresa só continua no app com a assinatura — assine agora e a primeira cobrança só vem quando o teste acabar.
        </Alert>
      )}
      {current === 'free' && !b.isDemo && (
        <Alert tone="warning" title="Empresa fora do app">
          Sem assinatura, sua empresa não aparece na busca e o painel fica bloqueado. Assine para voltar na hora — nada do que você cadastrou foi apagado.
        </Alert>
      )}

      {sub && (
        <section className="card p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">Sua assinatura: {PLANS[sub.plan].name}</h2>
            <Tag tone={sub.status === 'active' ? 'accent' : sub.status === 'pending' ? 'warning' : 'neutral'}>{SUB_STATUS[sub.status]}</Tag>
          </div>
          <p className="mt-1 text-sm text-muted">
            {formatCents(sub.valueCents)}/mês · {sub.method === 'PIX' ? 'Pix' : 'Cartão de crédito'}
            {st?.planUntil && current !== 'free' ? ` · válido até ${new Date(st.planUntil).toLocaleDateString('pt-BR')}` : ''}
          </p>
          {sub.status === 'pending' && current !== 'free' && st?.lastPayment?.dueDate && new Date(`${st.lastPayment.dueDate}T23:59:59`) > new Date() && (
            <p className="mt-2 text-sm">Primeira cobrança em <strong>{new Date(`${st.lastPayment.dueDate}T12:00:00`).toLocaleDateString('pt-BR')}</strong>. Até lá, aproveite o teste grátis.</p>
          )}
          {sub.status === 'pending' && st?.lastPayment?.invoiceUrl && (
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={st.lastPayment.invoiceUrl} target="_blank" rel="noopener noreferrer" className={buttonClass('primary', 'sm')}>Pagar agora</a>
              <Button size="sm" variant="secondary" onClick={() => status.refetch()}>Já paguei — verificar</Button>
            </div>
          )}
          {sub.method === 'PIX' && sub.status === 'active' && <p className="mt-2 text-sm text-muted">Todo mês você recebe a cobrança Pix por e-mail. Também dá para pagar pelo link da fatura.</p>}
          {sub.status !== 'canceled' && canBuy && <Button size="sm" variant="ghost" className="mt-3" onClick={() => setCanceling(true)}>Cancelar assinatura</Button>}
          {sub.status === 'canceled' && current !== 'free' && <p className="mt-2 text-sm">O plano continua valendo até o fim do período já pago.</p>}
        </section>
      )}

      <section className="card relative overflow-hidden p-5">
        <span className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-accent-600/20" aria-hidden="true" />
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{PLANS.pro.name}</h2>
          <Tag tone="accent" icon={<Crown className="h-3.5 w-3.5" />}>Tudo incluído</Tag>
        </div>
        <p className="mt-1 text-3xl font-bold tabular-nums">{formatCents(PLANS.pro.priceCents)}<span className="text-sm font-normal text-muted">/mês</span></p>
        <p className="text-sm text-muted">Sem comissão por atendimento. Sem fidelidade: cancele quando quiser.</p>
        <ul className="mt-4 space-y-1.5 text-sm">
          {PLANS.pro.highlights.map((h) => <li key={h} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />{h}</li>)}
        </ul>
        <div className="mt-5">
          {sub && sub.status !== 'canceled' ? null
            : !canBuy ? null
            : st?.enabled
              ? <Button block onClick={() => setBuying('pro')}>{current === 'free' ? 'Assinar e reativar a agenda' : 'Assinar o Plano Pataí'}</Button>
              : <p className="text-sm text-muted">Assinatura on-line em breve.</p>}
        </div>
      </section>
      {!canBuy && <p className="text-sm text-muted">A mudança de plano é feita pelo site do Pataí, no navegador.</p>}
      {canBuy && !st?.enabled && (
        <section className="card p-5">
          <h2 className="font-semibold">Como assinar</h2>
          <p className="mt-1 text-sm text-muted">O pagamento on-line ainda não foi ativado. Fale com a equipe pelo e-mail do suporte informando a empresa e o plano.</p>
        </section>
      )}
      <p className="text-xs text-muted">Pagamentos processados pela Asaas. Seus dados de cartão e CPF/CNPJ ficam com o meio de pagamento — o Pataí não os armazena.</p>

      {buying && <CheckoutSheet businessId={b.id} plan={buying} startsAt={current !== 'free' ? st?.planUntil : null} onClose={() => { setBuying(null); refresh(); }} onPaid={() => { setBuying(null); refresh(); toast(`Pagamento confirmado! Plano ${PLANS[buying].name} ativo.`); }} />}
      <Sheet open={canceling} onClose={() => setCanceling(false)} title="Cancelar assinatura?"
        footer={<div className="flex gap-3"><Button variant="secondary" onClick={() => setCanceling(false)}>Voltar</Button><Button block variant="danger" loading={cancelBusy}
          onClick={async () => { setCancelBusy(true); try { await api.post(`/panel/businesses/${b.id}/billing/cancel`); toast('Assinatura cancelada.'); refresh(); setCanceling(false); } catch (e) { toast((e as Error).message, 'error'); } finally { setCancelBusy(false); } }}>Cancelar assinatura</Button></div>}>
        <p>Não haverá novas cobranças. O plano continua valendo até o fim do período já pago; depois, sua empresa sai do app (some da busca e o painel fica bloqueado) — sem perder perfil, avaliações ou histórico. Dá para voltar quando quiser.</p>
      </Sheet>
    </div>
  );
}

function CheckoutSheet({ businessId, plan, onClose, onPaid, startsAt }: { businessId: string; plan: PlanId; onClose: () => void; onPaid: () => void; startsAt?: string | null }) {
  const p = PLANS[plan];
  // No teste grátis, a primeira cobrança vence quando ele acabar.
  const later = startsAt && new Date(startsAt) > new Date() ? new Date(startsAt).toLocaleDateString('pt-BR') : null;
  const [method, setMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [doc, setDoc] = useState('');
  const [holder, setHolder] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckoutResultDTO | null>(null);
  const [copied, setCopied] = useState(false);

  // Depois de gerar a cobrança, confere a cada 5 s se o pagamento caiu.
  useEffect(() => {
    if (!result) return;
    const t = setInterval(async () => {
      try {
        const st = await api.get<BillingStatusDTO>(`/panel/businesses/${businessId}/billing`);
        if (st.subscription?.status === 'active' && st.effectivePlan === plan) { clearInterval(t); onPaid(); }
      } catch { /* tenta de novo */ }
    }, 5000);
    return () => clearInterval(t);
  }, [result, businessId, plan, onPaid]);

  const submit = async () => {
    setApiError(null);
    const parsed = checkoutSchema.safeParse({ plan, method, cpfCnpj: doc, holderName: holder });
    if (!parsed.success) {
      const e: Record<string, string> = {};
      for (const i of parsed.error.issues) e[String(i.path[0])] ??= i.message;
      return setErrors(e);
    }
    setErrors({});
    setLoading(true);
    try {
      const r = await api.post<CheckoutResultDTO>(`/panel/businesses/${businessId}/billing/checkout`, { plan, method, cpfCnpj: doc, holderName: holder });
      setResult(r);
      if (r.method === 'CREDIT_CARD' && r.invoiceUrl && !later) window.open(r.invoiceUrl, '_blank', 'noopener');
    } catch (e) {
      setApiError((e as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open onClose={onClose} title={result ? 'Finalize o pagamento' : `Assinar ${p.name} — ${formatCents(p.priceCents)}/mês`}
      footer={!result ? <Button block size="lg" loading={loading} onClick={submit}>{later ? 'Cadastrar assinatura' : method === 'PIX' ? 'Gerar Pix' : 'Ir para o pagamento com cartão'}</Button> : undefined}>
      {!result ? (
        <div className="space-y-4">
          <fieldset>
            <legend className="label">Forma de pagamento</legend>
            <div className="flex gap-2">
              <ChipToggle selected={method === 'PIX'} onClick={() => setMethod('PIX')}>Pix</ChipToggle>
              <ChipToggle selected={method === 'CREDIT_CARD'} onClick={() => setMethod('CREDIT_CARD')}>Cartão de crédito</ChipToggle>
            </div>
            <p className="mt-2 text-sm text-muted">{method === 'PIX' ? 'Pague agora com o QR Code. Nos próximos meses, a cobrança Pix chega por e-mail.' : 'Cobrança automática todo mês no cartão. Você digita o cartão na página segura do meio de pagamento.'}</p>
          </fieldset>
          <TextField label="Nome do responsável ou razão social" value={holder} onChange={(e) => { setHolder(e.target.value); setErrors(({ holderName: _h, ...r }) => r); }} error={errors.holderName} autoComplete="name" />
          <TextField label="CPF ou CNPJ" inputMode="numeric" value={doc} onChange={(e) => { setDoc(e.target.value); setErrors(({ cpfCnpj: _c, ...r }) => r); }} error={errors.cpfCnpj} hint="Exigido para emitir a cobrança. Não fica guardado no Pataí." />
          <p className="text-sm">{later
            ? <>Nada a pagar hoje. Primeira cobrança de <strong>{formatCents(p.priceCents)}</strong> em <strong>{later}</strong>, quando o teste grátis acaba. Renova todo mês; cancele quando quiser.</>
            : <>Total hoje: <strong>{formatCents(p.priceCents)}</strong>. Renova todo mês; cancele quando quiser.</>}</p>
          {apiError && <Alert tone="error">{apiError}</Alert>}
        </div>
      ) : later ? (
        <div className="space-y-3 text-center" data-testid="subscription-scheduled">
          <Check className="mx-auto h-10 w-10 text-accent-600" aria-hidden />
          <p className="text-lg font-semibold">Assinatura cadastrada!</p>
          <p className="text-muted">Aproveite o teste grátis. A primeira cobrança de {formatCents(p.priceCents)} vence em {later}
            {result.method === 'PIX'
              ? '. O Pix chega no seu e-mail antes do vencimento (se preferir, já dá para pagar pela fatura).'
              : '. O link para pagar com cartão chega no seu e-mail antes do vencimento; depois do primeiro pagamento, os próximos meses são cobrados no cartão automaticamente.'}</p>
          {result.invoiceUrl && <a href={result.invoiceUrl} target="_blank" rel="noopener noreferrer" className={buttonClass('secondary', 'md')}>Ver a fatura</a>}
          <Button block variant="ghost" onClick={onClose}>Fechar</Button>
        </div>
      ) : result.pix ? (
        <div className="space-y-4 text-center">
          <p>Abra o app do seu banco, escolha <strong>Pix → Ler QR Code</strong> ou use o “copia e cola”.</p>
          <img src={result.pix.qrCodeImage} alt="QR Code Pix" className="mx-auto h-56 w-56 rounded-xl border border-line bg-card p-2" />
          <div className="rounded-xl bg-surface p-3 text-left">
            <p className="break-all font-mono text-xs">{result.pix.copyPaste}</p>
          </div>
          <Button variant="secondary" icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            onClick={async () => { try { await navigator.clipboard.writeText(result.pix!.copyPaste); setCopied(true); } catch { /* sem permissão */ } }}>
            {copied ? 'Código copiado' : 'Copiar código Pix'}
          </Button>
          <p className="flex items-center justify-center gap-2 text-sm text-muted"><span className="h-2 w-2 animate-pulse rounded-full bg-accent-600" /> Aguardando a confirmação do pagamento…</p>
          <p className="text-xs text-muted">Assim que o Pix cair, o plano é ativado automaticamente. Pode fechar esta janela.</p>
        </div>
      ) : (
        <div className="space-y-4 text-center">
          <p>{result.method === 'PIX' ? 'Abra a fatura para pagar com Pix.' : 'Abrimos a página segura do meio de pagamento em uma nova aba. Se não abriu, toque abaixo.'}</p>
          {result.invoiceUrl && <a href={result.invoiceUrl} target="_blank" rel="noopener noreferrer" className={buttonClass('primary', 'lg', 'w-full')}>{result.method === 'PIX' ? 'Abrir a fatura' : 'Pagar com cartão'}</a>}
          <p className="flex items-center justify-center gap-2 text-sm text-muted"><span className="h-2 w-2 animate-pulse rounded-full bg-accent-600" /> Aguardando a confirmação do pagamento…</p>
        </div>
      )}
    </Sheet>
  );
}
