import { BookingExtras } from '@/components/BookingExtras';
import { PanelDeposit, PanelLoyalty } from './PanelBookingBits';
import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useOutletContext } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  CalendarCheck, CheckCircle2, Circle, Clock, FileText, ImagePlus, MessageCircle, Phone, Plus, Star, Store, Trash2,
} from 'lucide-react';
import {
  BOOKING_MODE_LABELS, bookingProfile, describeDayHours, isReservationCategory, formatDuration, PERIODS, type BookingMode, type Period, formatPhoneBR, formatRating, formatServicePrice, relativeTime, serviceInputSchema, WEEKDAY_NAMES,
  type PanelBusinessDTO, type PanelRequestDTO, type ServiceInput,
} from '@conecta/shared';
import { PetCard } from '@/components/pets';
import { api, ApiError } from '@/lib/api';
import { resizeImage } from '@/lib/image';
import { useMyBusinesses, usePanelMutation, usePanelRequests, usePanelReviews } from '@/lib/panelQueries';
import { useConfig } from '@/lib/queries';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Alert, EmptyState, PageLoader, Spinner } from '@/components/ui/Feedback';
import { Checkbox, ChipToggle, SelectField, TextArea, TextField } from '@/components/ui/Form';
import { Stars } from '@/components/ui/Rating';
import { Sheet } from '@/components/ui/Sheet';
import { Tag } from '@/components/ui/Tags';
import { useToast } from '@/components/ui/Toast';
import { BusinessProfileForm, EMPTY_PROFILE, type ProfileForm } from './BusinessProfileForm';

const useBiz = () => useOutletContext<PanelBusinessDTO>();

// ── Entrada do painel ──
export function PanelHomeRedirect() {
  const mine = useMyBusinesses();
  const config = useConfig() as { data?: { preview?: boolean } };
  if (config.data?.preview) {
    return <div className="container-app py-8"><Alert tone="info" title="Painel indisponível na prévia">O painel das empresas funciona no site publicado.</Alert></div>;
  }
  if (mine.isLoading) return <PageLoader />;
  if (mine.data && mine.data.length > 0) return <Navigate to={`/empresas/${mine.data[0].id}`} replace />;
  return (
    <div className="container-app max-w-2xl py-8">
      <div className="card p-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 text-accent-700"><Store className="h-6 w-6" /></span>
        <h1 className="mt-4 text-2xl font-bold">Cadastre sua empresa</h1>
        <p className="mt-2 text-muted">Apareça para clientes da sua cidade, receba pedidos de orçamento e agendamentos e mostre suas avaliações. O cadastro é grátis e sua empresa aparece na hora.</p>
        <ul className="mt-4 space-y-2 text-sm">
          {['Perfil com fotos, serviços, preços e horários', 'Pedidos de orçamento e agendamentos em um só lugar', 'Responda às avaliações publicamente', 'Sua posição na busca depende das avaliações — não pode ser comprada'].map((t) => (
            <li key={t} className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0 text-accent-600" />{t}</li>
          ))}
        </ul>
        <ButtonLink to="/empresas/nova" size="lg" className="mt-6">Cadastrar minha empresa</ButtonLink>
      </div>
    </div>
  );
}

export function CreateBusinessPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  return (
    <div className="container-app max-w-3xl py-6">
      <h1 className="mb-1 text-2xl font-bold">Cadastrar empresa</h1>
      <p className="mb-5 text-muted">Você poderá adicionar fotos, serviços e horários logo em seguida.</p>
      <BusinessProfileForm initial={EMPTY_PROFILE} submitLabel="Cadastrar empresa"
        onSubmit={async (v) => {
          const r = await api.post<{ id: string }>('/panel/businesses', v);
          await qc.invalidateQueries({ queryKey: ['panel', 'mine'] });
          toast('Empresa cadastrada! Agora complete o perfil.');
          nav(`/empresas/${r.id}`);
        }} />
    </div>
  );
}

// ── Início ──
export function PanelDashboard() {
  const b = useBiz();
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
  const rate = b.stats.requestsReceived ? Math.round((b.stats.requestsAnswered / b.stats.requestsReceived) * 100) : null;
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Link to="pedidos" className="card p-4 hover:shadow-raised">
          <p className="text-sm text-muted">Pedidos aguardando você</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{b.stats.pendingRequests}</p>
        </Link>
        <Link to="avaliacoes" className="card p-4 hover:shadow-raised">
          <p className="text-sm text-muted">Avaliações</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{b.stats.average != null ? formatRating(b.stats.average) : '—'}</p>
          <p className="text-sm text-muted">{b.stats.reviewCount} no total</p>
        </Link>
        <div className="card p-4">
          <p className="text-sm text-muted">Pedidos respondidos</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{rate != null ? `${rate}%` : '—'}</p>
          <p className="text-sm text-muted">{b.stats.requestsAnswered} de {b.stats.requestsReceived}</p>
        </div>
      </div>
      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Perfil completo atrai mais clientes</h2>
          <span className="text-sm font-medium text-muted">{done}/{checklist.length}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-accent-600" style={{ width: `${(done / checklist.length) * 100}%` }} /></div>
        <p className="mt-2 text-sm text-muted">Perfis completos ficam mais bem posicionados na busca.</p>
        <ul className="mt-3 divide-y divide-line">
          {checklist.map((c) => (
            <li key={c.label}>
              <Link to={c.to} className="flex min-h-[48px] items-center gap-3 hover:text-brand-fg">
                {c.done ? <CheckCircle2 className="h-5 w-5 text-accent-600" /> : <Circle className="h-5 w-5 text-muted" />}
                <span className={c.done ? 'text-muted line-through' : ''}>{c.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <p className="text-sm text-muted">
        Sua posição na busca depende de nota ajustada, quantidade e recência das avaliações, perfil completo e relevância —
        <Link to="/como-funciona" className="ml-1 font-medium text-brand-fg hover:underline">veja como funciona</Link>. O selo “Perfil verificado” é concedido pela equipe após conferência de documentos.
      </p>
    </div>
  );
}

// ── Pedidos ──
const REQ_STATUS: Record<string, { label: string; tone: 'neutral' | 'brand' | 'accent' | 'warning' }> = {
  requested: { label: 'Aguardando você', tone: 'warning' },
  confirmed: { label: 'Confirmado', tone: 'brand' },
  completed: { label: 'Realizado', tone: 'accent' },
  cancelled: { label: 'Cancelado pelo cliente', tone: 'neutral' },
  declined: { label: 'Recusado', tone: 'neutral' },
  sent: { label: 'Aguardando resposta', tone: 'warning' },
  answered: { label: 'Respondido', tone: 'brand' },
  hired: { label: 'Contratado', tone: 'accent' },
  closed: { label: 'Encerrado', tone: 'neutral' },
};

export function PanelRequestsPage() {
  const b = useBiz();
  const reqs = usePanelRequests(b.id);
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  if (reqs.isLoading) return <PageLoader />;
  const all = reqs.data ?? [];
  const open = (r: PanelRequestDTO) => r.status === 'requested' || r.status === 'sent' || (r.status === 'confirmed' && r.startsAt && new Date(r.startsAt) > new Date()) || r.status === 'answered';
  const list = filter === 'open' ? all.filter(open) : all;
  return (
    <div>
      <div className="mb-4 flex gap-2">
        <ChipToggle selected={filter === 'open'} onClick={() => setFilter('open')}>Em aberto</ChipToggle>
        <ChipToggle selected={filter === 'all'} onClick={() => setFilter('all')}>Todos</ChipToggle>
      </div>
      {list.length === 0 ? (
        <EmptyState icon={<CalendarCheck className="h-8 w-8" />} title={all.length ? 'Nada em aberto' : 'Nenhum pedido ainda'}>
          Quando um cliente pedir um orçamento ou agendar um horário, ele aparece aqui. Esta lista se atualiza sozinha.
        </EmptyState>
      ) : (
        <ul className="space-y-3">{list.map((r) => <li key={r.id}><RequestCard r={r} businessId={b.id} /></li>)}</ul>
      )}
    </div>
  );
}

function RequestCard({ r, businessId }: { r: PanelRequestDTO; businessId: string }) {
  const toast = useToast();
  const biz = useOutletContext<PanelBusinessDTO>();
  const [sheet, setSheet] = useState<null | 'decline' | 'answer'>(null);
  const [msg, setMsg] = useState('');
  const act = usePanelMutation(businessId, (body: { action: string; message?: string }) => api.post(`/panel/businesses/${businessId}/requests/${r.type}/${r.id}`, body), ['requests']);
  const run = (action: string, message?: string) =>
    act.mutate({ action, message }, {
      onSuccess: () => { toast('Pedido atualizado.'); setSheet(null); setMsg(''); },
      onError: (e) => toast(e.message, 'error'),
    });
  const s = REQ_STATUS[r.status] ?? { label: r.status, tone: 'neutral' as const };
  const phone = r.customer?.phone;
  const wa = phone ? `https://wa.me/55${phone.replace(/\D/g, '')}` : null;
  return (
    <article className="card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Tag tone={s.tone}>{s.label}</Tag>
        <span className="inline-flex items-center gap-1 text-xs text-muted">
          {r.type === 'booking' ? <CalendarCheck className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
          {r.type === 'booking' ? 'Agendamento' : 'Orçamento'} · {relativeTime(r.createdAt)}
        </span>
      </div>
      <h3 className="mt-2 font-semibold">{r.serviceName ?? 'Serviço não especificado'}</h3>
      {r.startsAt && (
        <p className="font-medium text-brand-fg">
          {r.bookingMode === 'day'
            ? `${new Date(r.startsAt).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })} · diária`
            : r.bookingMode === 'period'
              ? `${new Date(r.startsAt).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })} · ${PERIODS[r.period as Period]?.label ?? ''} (combine a hora com o cliente)`
              : new Date(r.startsAt).toLocaleString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
      {r.partySize && <p className="text-sm"><strong>{r.partySize} {r.partySize === 1 ? 'pessoa' : 'pessoas'}</strong></p>}
      {r.type === 'booking' && <BookingExtras endsAt={r.endsAt} mode={r.bookingMode} address={r.address} destination={r.destination} details={r.details} fromPackage={r.fromPackage} />}
      {r.type === 'booking' && <PanelLoyalty every={biz?.settings?.loyaltyEvery ?? null} visits={r.customerVisits} />}
      {r.type === 'booking' && r.status !== 'declined' && r.status !== 'cancelled' && <PanelDeposit businessId={businessId} bookingId={r.id} deposit={r.deposit} />}
      {r.pet && <div className="mt-2"><PetCard pet={r.pet} /></div>}
      {r.type === 'booking' && r.status === 'confirmed' && <p className="mt-2 text-sm text-accent-700">Na Agenda, use “Pet ao Vivo” para mandar as fotos de cada etapa ao tutor.</p>}
      {r.staffName && <p className="text-sm">{r.partySize ? 'Mesa/ambiente' : 'Com'}: <strong>{r.staffName}</strong></p>}
      {r.preferredDate && <p className="text-sm">Data desejada: {new Date(r.preferredDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p>}
      {r.description && <p className="mt-1 whitespace-pre-line text-sm">{r.description}</p>}
      {r.neighborhood && <p className="text-sm text-muted">Bairro: {r.neighborhood}</p>}
      {r.customer && (
        <div className="mt-3 rounded-xl bg-surface p-3 text-sm">
          <p className="font-semibold">{r.customer.name}</p>
          {phone && <p>{formatPhoneBR(phone)}</p>}
          {(r.contactPreference === 'email' || !phone) && r.customer.email && <p>{r.customer.email}</p>}
          {r.contactPreference && <p className="text-muted">Prefere contato por {{ whatsapp: 'WhatsApp', phone: 'ligação', email: 'e-mail' }[r.contactPreference]}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-line bg-card px-3 font-semibold text-brand-fg"><MessageCircle className="h-4 w-4" />Abrir WhatsApp</a>}
            {phone && <a href={`tel:+55${phone}`} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-line bg-card px-3 font-semibold text-brand-fg"><Phone className="h-4 w-4" />Ligar</a>}
          </div>
        </div>
      )}
      {r.businessResponse && <p className="mt-2 text-sm"><span className="font-medium">Sua resposta:</span> {r.businessResponse}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {r.type === 'booking' && r.status === 'requested' && <Button size="sm" loading={act.isPending} onClick={() => run('confirm')}>Confirmar horário</Button>}
        {r.type === 'booking' && (r.status === 'requested' || r.status === 'confirmed') && r.startsAt && new Date(r.startsAt) > new Date() && (
          <Button size="sm" variant="danger" onClick={() => setSheet('decline')}>Recusar</Button>
        )}
        {r.type === 'quote' && (r.status === 'sent' || r.status === 'answered') && (
          <>
            <Button size="sm" onClick={() => { setMsg(r.businessResponse ?? ''); setSheet('answer'); }}>{r.status === 'sent' ? 'Responder' : 'Editar resposta'}</Button>
            <Button size="sm" variant="ghost" loading={act.isPending} onClick={() => run('close')}>Encerrar</Button>
          </>
        )}
      </div>
      <Sheet open={!!sheet} onClose={() => setSheet(null)} title={sheet === 'decline' ? 'Recusar agendamento' : 'Responder orçamento'}
        footer={<Button block loading={act.isPending} variant={sheet === 'decline' ? 'danger' : 'primary'} onClick={() => run(sheet === 'decline' ? 'decline' : 'answer', msg)}>{sheet === 'decline' ? 'Recusar e avisar o cliente' : 'Enviar resposta'}</Button>}>
        <TextArea label={sheet === 'decline' ? 'Motivo (o cliente verá)' : 'Resposta para o cliente'} optional={sheet === 'decline'} value={msg} maxLength={500} onChange={(e) => setMsg(e.target.value)}
          placeholder={sheet === 'decline' ? 'Ex.: Não teremos profissional disponível neste horário. Que tal às 15h?' : 'Ex.: O valor fica R$ 350,00 e consigo atender na próxima terça. Posso confirmar?'} />
        <p className="mt-2 text-sm text-muted">A mensagem aparece em “Atividades” para o cliente. Para combinar detalhes, use também o WhatsApp ou telefone dele.</p>
      </Sheet>
    </article>
  );
}

// ── Perfil ──
export function PanelProfilePage() {
  const b = useBiz();
  const toast = useToast();
  const save = usePanelMutation(b.id, (v: ProfileForm) => api.put(`/panel/businesses/${b.id}/profile`, v));
  const p = b.profile;
  const initial: ProfileForm = {
    ...EMPTY_PROFILE, ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v ?? (typeof EMPTY_PROFILE[k as keyof ProfileForm] === 'string' ? '' : v)])),
  } as ProfileForm;
  return <BusinessProfileForm initial={initial} submitLabel="Salvar alterações" onSubmit={async (v) => { await save.mutateAsync(v); toast('Perfil atualizado.'); }} />;
}

// ── Serviços ──
type ServiceForm = { name: string; description: string; priceType: ServiceInput['priceType']; priceMin: string; priceMax: string; durationMinutes: string; bookable: boolean; bookingMode: BookingMode; notes: string; deposit: string };
const EMPTY_SERVICE: ServiceForm = { name: '', description: '', priceType: 'fixed', priceMin: '', priceMax: '', durationMinutes: '', bookable: false, bookingMode: 'slot', notes: '', deposit: '' };

export function PanelServicesPage() {
  const b = useBiz();
  const toast = useToast();
  const [editing, setEditing] = useState<{ id: string | null; f: ServiceForm } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = usePanelMutation(b.id, ({ id, body }: { id: string | null; body: unknown }) =>
    id ? api.put(`/panel/businesses/${b.id}/services/${id}`, body) : api.post(`/panel/businesses/${b.id}/services`, body));
  const remove = usePanelMutation(b.id, (id: string) => api.delete(`/panel/businesses/${b.id}/services/${id}`));
  const num = (v: string) => (v.trim() === '' ? null : Number(v.replace(/\./g, '').replace(',', '.')));

  const submit = () => {
    if (!editing) return;
    const f = editing.f;
    const body = { name: f.name, description: f.description, priceType: f.priceType, priceMin: num(f.priceMin), priceMax: num(f.priceMax), durationMinutes: num(f.durationMinutes), bookable: f.bookable, bookingMode: f.bookingMode, notes: f.notes, deposit: f.bookable ? num(f.deposit) : null };
    const parsed = serviceInputSchema.safeParse(body);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      for (const i of parsed.error.issues) e[String(i.path[0])] ??= i.message;
      return setErrors(e);
    }
    save.mutate({ id: editing.id, body }, {
      onSuccess: () => { toast('Serviço salvo.'); setEditing(null); },
      onError: (e) => { setErrors((e as ApiError).fields ?? {}); toast(e.message, 'error'); },
    });
  };
  const set = (p: Partial<ServiceForm>) => editing && setEditing({ ...editing, f: { ...editing.f, ...p } });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {isReservationCategory(b.profile.categorySlug)
            ? 'Cadastre os pratos do cardápio com preço e um serviço “Reserva de mesa” agendável (duração média da refeição).'
            : `${b.services.length} serviço(s). Preços ajudam o cliente a decidir.`}
        </p>
        <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => { setErrors({}); setEditing({ id: null, f: { ...EMPTY_SERVICE, bookingMode: bookingProfile(b.profile.categorySlug).mode } }); }}>Adicionar serviço</Button>
      </div>
      {b.services.length === 0 && <EmptyState icon={<FileText className="h-8 w-8" />} title="Nenhum serviço cadastrado">Cadastre o que você oferece, com preço e duração quando possível.</EmptyState>}
      <ul className="space-y-2">
        {b.services.map((s) => (
          <li key={s.id} className="card flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{s.name}</p>
              <p className="text-sm text-muted">
                {s.priceType === 'fixed' && s.priceMin === 0 ? 'Gratuito' : formatServicePrice({ priceType: s.priceType, priceMinCents: s.priceMin == null ? null : s.priceMin * 100, priceMaxCents: s.priceMax == null ? null : s.priceMax * 100 })}
                {s.durationMinutes ? ` · ${formatDuration(s.durationMinutes)}` : ''}{s.bookable ? ` · agendável (${BOOKING_MODE_LABELS[s.bookingMode].title.toLowerCase()})` : ''}
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => { setErrors({}); setEditing({ id: s.id, f: { name: s.name, description: s.description ?? '', priceType: s.priceType, priceMin: s.priceMin?.toString().replace('.', ',') ?? '', priceMax: s.priceMax?.toString().replace('.', ',') ?? '', durationMinutes: s.durationMinutes?.toString() ?? '', bookable: s.bookable, bookingMode: s.bookingMode, notes: s.notes ?? '', deposit: s.deposit?.toString().replace('.', ',') ?? '' } }); }}>Editar</Button>
            <button aria-label={`Remover ${s.name}`} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-danger-50 hover:text-danger-700"
              onClick={() => remove.mutate(s.id, { onSuccess: () => toast('Serviço removido.'), onError: (e) => toast(e.message, 'error') })}><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
      <Sheet open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Editar serviço' : 'Novo serviço'} footer={<Button block loading={save.isPending} onClick={submit}>Salvar serviço</Button>}>
        {editing && (
          <div className="space-y-4">
            <TextField label="Nome do serviço" value={editing.f.name} onChange={(e) => set({ name: e.target.value })} error={errors.name} maxLength={80} />
            <TextArea label="Descrição" optional value={editing.f.description} onChange={(e) => set({ description: e.target.value })} maxLength={300} className="field min-h-[80px]" />
            <SelectField label="Preço" value={editing.f.priceType} onChange={(e) => set({ priceType: e.target.value as ServiceForm['priceType'] })}>
              <option value="fixed">Valor fixo</option>
              <option value="from">A partir de</option>
              <option value="range">Faixa (mínimo e máximo)</option>
              <option value="quote">Sob orçamento</option>
            </SelectField>
            {editing.f.priceType !== 'quote' && (
              <div className="grid grid-cols-2 gap-3">
                <TextField label={editing.f.priceType === 'range' ? 'Mínimo (R$)' : 'Valor (R$)'} inputMode="decimal" value={editing.f.priceMin} onChange={(e) => set({ priceMin: e.target.value })} error={errors.priceMin} placeholder="120,00" />
                {editing.f.priceType === 'range' && <TextField label="Máximo (R$)" inputMode="decimal" value={editing.f.priceMax} onChange={(e) => set({ priceMax: e.target.value })} error={errors.priceMax} />}
              </div>
            )}
            <TextField label="Duração (minutos)" optional inputMode="numeric" value={editing.f.durationMinutes} onChange={(e) => set({ durationMinutes: e.target.value })} error={errors.durationMinutes} placeholder="60" />
            <Checkbox label="Clientes podem agendar este serviço pelo app" description="Usa os horários de funcionamento (e os da equipe, se houver)." checked={editing.f.bookable} onChange={(e) => set({ bookable: e.target.checked })} />
            {editing.f.bookable && (
              <fieldset>
                <legend className="label">Tipo de agenda</legend>
                <div className="space-y-2">
                  {(Object.keys(BOOKING_MODE_LABELS) as BookingMode[]).map((m) => (
                    <label key={m} className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${editing.f.bookingMode === m ? 'border-brand-700 bg-brand-50' : 'border-line'}`}>
                      <input type="radio" name="booking-mode" className="mt-1 h-4 w-4 accent-[rgb(var(--brand-700))]" checked={editing.f.bookingMode === m} onChange={() => set({ bookingMode: m })} />
                      <span><span className="block font-medium">{BOOKING_MODE_LABELS[m].title}</span><span className="text-sm text-muted">{BOOKING_MODE_LABELS[m].description}</span></span>
                    </label>
                  ))}
                </div>
                {errors.durationMinutes && editing.f.bookingMode === 'slot' && <p className="mt-1 text-sm text-danger-700">{errors.durationMinutes}</p>}
              </fieldset>
            )}
            {editing.f.bookable && (
              <TextField label={editing.f.bookingMode === 'day' ? 'Sinal por diária (R$)' : 'Sinal para garantir o horário (R$)'} optional inputMode="decimal" value={editing.f.deposit}
                onChange={(e) => set({ deposit: e.target.value })} error={errors.deposit} placeholder="Ex.: 20,00"
                hint={b.settings.pixKey ? 'O cliente paga pelo Pix na sua chave e você confirma no pedido.' : 'Cadastre sua chave Pix em "Clube e Pix" para cobrar sinal.'} />
            )}
            <TextField label="Observações" optional value={editing.f.notes} onChange={(e) => set({ notes: e.target.value })} maxLength={200} placeholder="Ex.: material incluso" />
          </div>
        )}
      </Sheet>
    </div>
  );
}

// ── Horários ──
export function PanelHoursPage() {
  const b = useBiz();
  const toast = useToast();
  const [hours, setHours] = useState<Record<string, Array<[string, string]>>>(() => JSON.parse(JSON.stringify(b.openingHours ?? {})));
  const [err, setErr] = useState<string | null>(null);
  const save = usePanelMutation(b.id, (h: unknown) => api.put(`/panel/businesses/${b.id}/hours`, h));
  const setDay = (d: string, ranges: Array<[string, string]>) => setHours((h) => ({ ...h, [d]: ranges }));
  const copyToWeekdays = (d: string) => setHours((h) => ({ ...h, ...Object.fromEntries(['1', '2', '3', '4', '5'].map((k) => [k, JSON.parse(JSON.stringify(h[d] ?? []))])) }));
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">Usados para “Aberto agora” e para os horários livres de agendamento. Confirme-os sempre que mudarem: horários sem confirmação há mais de 6 meses aparecem como “podem estar desatualizados”.</p>
      {b.hoursUpdatedAt && <p className="text-sm text-muted">Última confirmação: {relativeTime(b.hoursUpdatedAt)}.</p>}
      <ul className="space-y-2">
        {[1, 2, 3, 4, 5, 6, 0].map((n) => {
          const d = String(n);
          const ranges = hours[d] ?? [];
          const open = ranges.length > 0;
          return (
            <li key={d} className="card p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="w-20 font-semibold">{WEEKDAY_NAMES[n]}</span>
                <Checkbox label="Aberto" checked={open} onChange={(e) => setDay(d, e.target.checked ? [['08:00', '18:00']] : [])} />
                {open && n === 1 && <button className="ml-auto text-sm font-medium text-brand-fg hover:underline" onClick={() => copyToWeekdays(d)}>Copiar para seg. a sex.</button>}
              </div>
              {open && (
                <div className="mt-2 space-y-2">
                  {ranges.map(([a, z], i) => (
                    <div key={i} className="flex items-center gap-2">
                      <label className="sr-only" htmlFor={`h-${d}-${i}-a`}>Abre</label>
                      <input id={`h-${d}-${i}-a`} type="time" className="field w-auto" value={a} onChange={(e) => setDay(d, ranges.map((r, j) => (j === i ? [e.target.value, r[1]] : r)))} />
                      <span className="text-muted">às</span>
                      <label className="sr-only" htmlFor={`h-${d}-${i}-z`}>Fecha</label>
                      <input id={`h-${d}-${i}-z`} type="time" className="field w-auto" value={z} onChange={(e) => setDay(d, ranges.map((r, j) => (j === i ? [r[0], e.target.value] : r)))} />
                      {ranges.length > 1 && <button aria-label="Remover intervalo" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface" onClick={() => setDay(d, ranges.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></button>}
                    </div>
                  ))}
                  {ranges.length < 2 && <button className="text-sm font-medium text-brand-fg hover:underline" onClick={() => setDay(d, [...ranges, ['13:00', '18:00']])}>+ Intervalo (ex.: depois do almoço)</button>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {err && <Alert tone="error">{err}</Alert>}
      <Button block size="lg" loading={save.isPending} icon={<Clock className="h-5 w-5" />}
        onClick={() => { setErr(null); save.mutate(hours, { onSuccess: () => toast('Horários salvos e confirmados.'), onError: (e) => setErr(e.message) }); }}>
        Salvar e confirmar horários
      </Button>
      <p className="text-center text-sm text-muted">{Object.values(hours).some((r) => r.length) ? [1, 2, 3, 4, 5, 6, 0].map((n) => `${WEEKDAY_NAMES[n].slice(0, 3)}: ${describeDayHours(hours[String(n)])}`).join(' · ') : 'Nenhum dia aberto.'}</p>
    </div>
  );
}

// ── Fotos ──
export function PanelPhotosPage() {
  const b = useBiz();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const upload = usePanelMutation(b.id, (body: { kind: string; dataUrl: string }) => api.post(`/panel/businesses/${b.id}/images`, body));
  const remove = usePanelMutation(b.id, ({ kind, id }: { kind: string; id?: string }) => api.delete(`/panel/businesses/${b.id}/images/${kind}${id ? `?id=${id}` : ''}`));
  const send = async (kind: 'logo' | 'cover' | 'photo', file: File | undefined) => {
    if (!file) return;
    setBusy(kind);
    try {
      const dataUrl = await resizeImage(file, kind === 'logo' ? 512 : 1600);
      await upload.mutateAsync({ kind, dataUrl });
      toast('Imagem enviada.');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="space-y-5">
      <Alert tone="info">Use fotos reais do seu trabalho e do seu espaço. Imagens de outras empresas ou da internet podem levar à suspensão do perfil.</Alert>
      <div className="grid gap-4 sm:grid-cols-2">
        <ImageSlot title="Logotipo" hint="Quadrado, de preferência" url={b.logoUrl} square busy={busy === 'logo'} onPick={(f) => send('logo', f)} onRemove={() => remove.mutate({ kind: 'logo' })} />
        <ImageSlot title="Foto de capa" hint="Horizontal, aparece no topo do perfil" url={b.coverUrl} busy={busy === 'cover'} onPick={(f) => send('cover', f)} onRemove={() => remove.mutate({ kind: 'cover' })} />
      </div>
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Galeria ({b.photos.length}/12)</h2>
          {b.photos.length < 12 && <FilePick label="Adicionar foto" busy={busy === 'photo'} onPick={(f) => send('photo', f)} />}
        </div>
        {b.photos.length === 0 ? <p className="text-sm text-muted">Mostre trabalhos realizados, o ambiente e a equipe.</p> : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {b.photos.map((p) => (
              <li key={p.id} className="relative">
                <img src={p.url} alt="" className="aspect-square w-full rounded-xl object-cover" />
                <button aria-label="Remover foto" className="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-card/95 text-danger-700 shadow-card"
                  onClick={() => remove.mutate({ kind: 'photo', id: p.id })}><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function FilePick({ label, busy, onPick }: { label: string; busy: boolean; onPick: (f: File | undefined) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={ref} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = ''; }} />
      <Button size="sm" variant="secondary" loading={busy} icon={<ImagePlus className="h-4 w-4" />} onClick={() => ref.current?.click()}>{label}</Button>
    </>
  );
}

function ImageSlot({ title, hint, url, square, busy, onPick, onRemove }: { title: string; hint: string; url: string | null; square?: boolean; busy: boolean; onPick: (f: File | undefined) => void; onRemove: () => void }) {
  return (
    <div className="card p-4">
      <h2 className="font-semibold">{title}</h2>
      <p className="text-sm text-muted">{hint}</p>
      <div className={`mt-3 overflow-hidden rounded-xl bg-surface ${square ? 'aspect-square w-32' : 'aspect-[16/7] w-full'}`}>
        {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted"><ImagePlus className="h-6 w-6" /></div>}
      </div>
      <div className="mt-3 flex gap-2">
        <FilePick label={url ? 'Trocar' : 'Enviar'} busy={busy} onPick={onPick} />
        {url && <Button size="sm" variant="ghost" onClick={onRemove}>Remover</Button>}
      </div>
    </div>
  );
}

// ── Avaliações ──
export function PanelReviewsPage() {
  const b = useBiz();
  const reviews = usePanelReviews(b.id);
  const toast = useToast();
  const [editing, setEditing] = useState<{ id: string; body: string } | null>(null);
  const reply = usePanelMutation(b.id, ({ id, body }: { id: string; body: string | null }) =>
    body ? api.put(`/panel/businesses/${b.id}/reviews/${id}/reply`, { body }) : api.delete(`/panel/businesses/${b.id}/reviews/${id}/reply`), ['reviews']);
  if (reviews.isLoading) return <PageLoader />;
  if (!reviews.data?.length) return <EmptyState icon={<Star className="h-8 w-8" />} title="Nenhuma avaliação ainda">As avaliações aparecem depois que clientes contratam pelo app e confirmam o atendimento.</EmptyState>;
  return (
    <div className="space-y-3">
      <Alert tone="info">Responda com educação, inclusive às críticas: outras pessoas leem a sua resposta. Avaliações não podem ser apagadas pela empresa; se uma violar as regras, denuncie pelo perfil público.</Alert>
      <ul className="space-y-3">
        {reviews.data.map((r) => (
          <li key={r.id} className="card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Stars value={r.rating} />
              <span className="font-semibold">{r.authorName}</span>
              <span className="text-sm text-muted">{relativeTime(r.createdAt)}{r.serviceName ? ` · ${r.serviceName}` : ''}</span>
            </div>
            <p className="mt-2">{r.comment}</p>
            {r.reply && editing?.id !== r.id && (
              <div className="mt-3 rounded-xl bg-surface p-3 text-sm"><p className="font-semibold">Sua resposta</p><p>{r.reply.body}</p></div>
            )}
            {editing?.id === r.id ? (
              <div className="mt-3 space-y-2">
                <TextArea label="Resposta pública" value={editing.body} maxLength={1000} onChange={(e) => setEditing({ id: r.id, body: e.target.value })} className="field min-h-[90px]" />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" loading={reply.isPending} onClick={() => reply.mutate({ id: r.id, body: editing.body.trim() }, { onSuccess: () => { toast('Resposta publicada.'); setEditing(null); }, onError: (e) => toast(e.message, 'error') })}>Publicar resposta</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setEditing({ id: r.id, body: r.reply?.body ?? '' })}>{r.reply ? 'Editar resposta' : 'Responder'}</Button>
                {r.reply && <Button size="sm" variant="ghost" onClick={() => reply.mutate({ id: r.id, body: null }, { onSuccess: () => toast('Resposta removida.') })}>Remover resposta</Button>}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

