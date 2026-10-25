import { useEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bot, CalendarDays, Check, Copy, Crown, Lightbulb, ListPlus, MessageSquareText, PenLine, Plus, Send, Trash2, UserRound, Users } from 'lucide-react';
import {
  bookingProfile, formatCents, PERIODS, PLANS, WEEKDAY_NAMES, type AiTask, type PanelAgendaItemDTO, type PanelBusinessDTO, type PanelStaffDTO, type Period, type PlanId,
} from '@conecta/shared';
import { api, ApiError } from '@/lib/api';
import { streamAssistant } from '@/lib/ai';
import { usePanelMutation } from '@/lib/panelQueries';
import { isStoreApp } from '@/lib/platform';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Alert, EmptyState, PageLoader } from '@/components/ui/Feedback';
import { Checkbox, ChipToggle, TextArea, TextField } from '@/components/ui/Form';
import { Sheet } from '@/components/ui/Sheet';
import { Tag } from '@/components/ui/Tags';
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
          Cada {profile.staffLabel.toLowerCase()} tem a própria agenda: dois clientes podem marcar o mesmo horário com pessoas (ou {profile.staffKind === 'resource' ? 'quadras/salas' : 'recursos'}) diferentes.
          O cliente pode escolher ou marcar “sem preferência”. Sem ninguém cadastrado, a empresa tem uma agenda única.
        </p>
        <p className="mt-2 text-sm">Seu plano ({plan.name}) permite <strong>{plan.maxStaff}</strong> {plan.maxStaff === 1 ? 'agenda' : 'agendas'}. <Link to="../plano" className="font-semibold text-brand-700 hover:underline">Ver planos</Link></p>
      </div>
      <div className="flex justify-end">
        <Button size="sm" icon={<Plus className="h-4 w-4" />} disabled={atLimit} onClick={() => open()}>Adicionar {profile.staffLabel.toLowerCase()}</Button>
      </div>
      {atLimit && b.staff.length > 0 && <Alert tone="info">Você atingiu o limite do plano. Para mais agendas, mude de plano.</Alert>}
      {b.staff.length === 0 ? (
        <EmptyState icon={<Users className="h-8 w-8" />} title="Agenda única">Cadastre {profile.staffLabelPlural.toLowerCase()} para o cliente poder escolher com quem (ou onde) agendar.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {b.staff.map((s) => (
            <li key={s.id} className="card flex flex-wrap items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700"><UserRound className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{s.name}{s.roleTitle ? <span className="font-normal text-muted"> · {s.roleTitle}</span> : null}</p>
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
                    <p className="font-medium">{i.serviceName}{i.staffName ? <span className="font-normal text-muted"> · {i.staffName}</span> : null}</p>
                    <p className="text-sm text-muted">{i.customerName ?? 'Cliente'}{i.customerPhone ? ` · ${i.customerPhone}` : ''}</p>
                  </div>
                  {i.status === 'requested' ? <Tag tone="warning">Aguardando você</Tag> : i.status === 'confirmed' ? <Tag tone="brand">Confirmado</Tag> : <Tag tone="accent">Realizado</Tag>}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

// ── Assistente de IA ──
const TASKS: Array<{ id: AiTask; label: string; hint: string; Icon: typeof Bot }> = [
  { id: 'description', label: 'Escrever meu perfil', hint: 'Frase curta e descrição a partir dos seus dados', Icon: PenLine },
  { id: 'services', label: 'Sugerir serviços', hint: 'Serviços comuns no seu ramo, com faixa de preço de referência', Icon: ListPlus },
  { id: 'tips', label: 'Como conseguir mais clientes', hint: '5 ações práticas para o seu perfil', Icon: Lightbulb },
  { id: 'chat', label: 'Perguntar outra coisa', hint: 'Ideias de promoções, posts, atendimento…', Icon: MessageSquareText },
];

export function useAiStatus() {
  return useQuery({ queryKey: ['panel', 'ai-status'], queryFn: () => api.get<{ enabled: boolean }>('/panel/ai/status'), staleTime: 5 * 60_000 });
}

export function PanelAssistantPage() {
  const b = useBiz();
  const status = useAiStatus();
  const plan = PLANS[b.plan.effective];
  const [task, setTask] = useState<AiTask>('description');
  const [message, setMessage] = useState('');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [used, setUsed] = useState(b.plan.aiUsedThisMonth);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);

  const run = async () => {
    setOutput('');
    setErr(null);
    setRunning(true);
    abort.current = new AbortController();
    try {
      await streamAssistant(b.id, { task, message: message.trim() || undefined }, (t) => setOutput((o) => o + t), abort.current.signal);
      setUsed((u) => u + 1);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setErr((e as ApiError).message);
    } finally {
      setRunning(false);
    }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* sem permissão */ }
  };

  if (status.data && !status.data.enabled) {
    return <Alert tone="info" title="Assistente em breve">O assistente de IA ainda não foi ativado nesta plataforma.</Alert>;
  }
  const remaining = Math.max(0, plan.aiRequestsPerMonth - used);
  return (
    <div className="space-y-4">
      <div className="card flex items-start gap-3 p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-700"><Bot className="h-6 w-6" /></span>
        <div>
          <h2 className="font-semibold">Assistente do seu negócio</h2>
          <p className="text-sm text-muted">Ele usa os dados do seu perfil para sugerir textos e ideias. Revise sempre antes de usar: você é quem conhece o seu negócio.</p>
          <p className="mt-1 text-sm">{remaining} de {plan.aiRequestsPerMonth} usos restantes neste mês ({plan.name}).</p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="O que você quer?">
        {TASKS.map(({ id, label, hint, Icon }) => (
          <button key={id} type="button" role="radio" aria-checked={task === id} onClick={() => setTask(id)}
            className={`card flex items-start gap-3 p-4 text-left transition ${task === id ? 'border-brand-700 ring-2 ring-brand-500/20' : 'hover:border-brand-200'}`}>
            <Icon className="mt-0.5 h-5 w-5 text-brand-600" aria-hidden="true" />
            <span><span className="block font-semibold">{label}</span><span className="text-sm text-muted">{hint}</span></span>
          </button>
        ))}
      </div>
      <TextArea label={task === 'chat' ? 'Sua pergunta' : 'Algo a mais que o assistente deve saber?'} optional={task !== 'chat'} value={message} maxLength={1500}
        onChange={(e) => setMessage(e.target.value)} className="field min-h-[90px]"
        placeholder={task === 'chat' ? 'Ex.: Que promoção posso fazer para o Dia das Mães?' : 'Ex.: Atendo há 8 anos, sou especialista em noivas, tenho estacionamento.'} />
      <Button block size="lg" loading={running} disabled={remaining === 0 || (task === 'chat' && !message.trim())} onClick={run} icon={<Send className="h-5 w-5" />}>
        {running ? 'Escrevendo…' : 'Pedir ao assistente'}
      </Button>
      {remaining === 0 && <Alert tone="warning">Os usos deste mês acabaram. Eles renovam no dia 1º, ou mude de plano para ter mais.</Alert>}
      {err && <Alert tone="error">{err}</Alert>}
      {(output || running) && (
        <section className="card p-5" aria-live="polite">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">Sugestão</h3>
            {!running && output && <Button size="sm" variant="secondary" icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} onClick={copy}>{copied ? 'Copiado' : 'Copiar'}</Button>}
          </div>
          <div className="whitespace-pre-wrap leading-relaxed">{output}{running && <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-brand-500 align-middle" />}</div>
          {!running && output && (
            <p className="mt-3 text-sm text-muted">
              Para usar: copie e cole em {task === 'description' ? <Link to="../perfil" className="font-medium text-brand-700 hover:underline">Perfil</Link> : task === 'services' ? <Link to="../servicos" className="font-medium text-brand-700 hover:underline">Serviços</Link> : 'onde quiser'}. Confira preços e informações antes de publicar.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

/** Botão "Sugerir resposta com IA" usado na tela de avaliações. */
export function AiReplyButton({ businessId, reviewId, onStart, onText, onDone }: { businessId: string; reviewId: string; onStart: () => void; onText: (t: string) => void; onDone: (err?: string) => void }) {
  const status = useAiStatus();
  const [running, setRunning] = useState(false);
  if (!status.data?.enabled) return null;
  return (
    <Button size="sm" variant="ghost" loading={running} icon={<Bot className="h-4 w-4" />}
      onClick={async () => {
        setRunning(true);
        onStart();
        try {
          await streamAssistant(businessId, { task: 'reply', reviewId }, onText);
          onDone();
        } catch (e) {
          onDone((e as Error).message);
        } finally {
          setRunning(false);
        }
      }}>
      Sugerir resposta com IA
    </Button>
  );
}

// ── Plano ──
export function PanelPlanPage() {
  const b = useBiz();
  const current = b.plan.effective;
  const inStoreApp = isStoreApp();
  return (
    <div className="space-y-4">
      <Alert tone="info">O plano não muda a sua posição na busca nem dá selos — isso depende só das avaliações e do perfil. Os planos pagos dão mais agendas, mais uso do assistente e ferramentas de gestão.</Alert>
      {b.plan.id !== 'free' && b.plan.until && <p className="text-sm">Seu plano {PLANS[b.plan.id].name} vale até <strong>{new Date(b.plan.until).toLocaleDateString('pt-BR')}</strong>.</p>}
      <div className="grid gap-3 md:grid-cols-3">
        {(Object.keys(PLANS) as PlanId[]).map((id) => {
          const p = PLANS[id];
          const active = id === current;
          return (
            <section key={id} className={`card flex flex-col p-5 ${active ? 'border-brand-700 ring-2 ring-brand-500/20' : ''}`}>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{p.name}</h2>
                {id === 'pro' && <Tag tone="accent" icon={<Crown className="h-3.5 w-3.5" />}>Mais escolhido</Tag>}
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">{p.priceCents ? formatCents(p.priceCents) : 'R$ 0'}<span className="text-sm font-normal text-muted">{p.priceCents ? '/mês' : ''}</span></p>
              <ul className="mt-3 flex-1 space-y-1.5 text-sm">
                {p.highlights.map((h) => <li key={h} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />{h}</li>)}
              </ul>
              <div className="mt-4">
                {active ? <Tag tone="brand">Seu plano atual</Tag> : id === 'free' || inStoreApp ? null : (
                  <ButtonLink to="#assinar" size="sm" variant={id === 'pro' ? 'primary' : 'secondary'} onClick={(e) => { e.preventDefault(); document.getElementById('assinar')?.scrollIntoView({ behavior: 'smooth' }); }}>Quero o {p.name}</ButtonLink>
                )}
              </div>
            </section>
          );
        })}
      </div>
      {inStoreApp ? (
        <p className="text-sm text-muted">A mudança de plano é feita pelo site do Conecta Local, no navegador.</p>
      ) : (
        <section id="assinar" className="card p-5">
          <h2 className="font-semibold">Como assinar</h2>
          <p className="mt-1 text-sm text-muted">O pagamento on-line (Pix e cartão) está chegando. Por enquanto, fale com a equipe pelo e-mail do suporte informando o nome da empresa e o plano: liberamos na hora após o Pix.</p>
        </section>
      )}
    </div>
  );
}
