import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { BarChart3, Gift, MessageCircle, Package, Pencil, Plus, QrCode, Trash2 } from 'lucide-react';
import {
  formatCents, packageSavings, planIsActive, whatsappLink, type PackageDTO, type PackageInput, type PanelBusinessDTO,
} from '@conecta/shared';
import {
  useCustomerPackageAction, useCustomerPackages, usePanelPackages, useRemovePackage, useReport, useSavePackage, useSaveSettings,
} from '@/lib/benefits';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Alert, EmptyState, PageLoader } from '@/components/ui/Feedback';
import { Checkbox, SelectField, TextField } from '@/components/ui/Form';
import { Sheet } from '@/components/ui/Sheet';
import { Tag } from '@/components/ui/Tags';
import { useToast } from '@/components/ui/Toast';

const useBiz = () => useOutletContext<PanelBusinessDTO>();

/** Clube e Pix: sinal pelo Pix, cartão fidelidade, pacotes e relatórios do mês. */
export function PanelBenefitsPage() {
  const b = useBiz();
  const active = planIsActive(b.plan.effective);
  return (
    <div className="space-y-4">
      {!active && (
        <Alert tone="warning" title="Recursos do Plano Pataí" action={<ButtonLink size="sm" to="../plano">Ver plano</ButtonLink>}>
          Assine para ativar o sinal pelo Pix, o clube de pacotes, o cartão fidelidade e os relatórios.
        </Alert>
      )}
      <SettingsCard />
      <PackagesCard />
      <CustomerPackagesCard />
      <ReportCard />
    </div>
  );
}

function SettingsCard() {
  const b = useBiz();
  const toast = useToast();
  const save = useSaveSettings(b.id);
  const [pix, setPix] = useState(b.settings.pixKey ?? '');
  const [loyalty, setLoyalty] = useState(b.settings.loyaltyEvery != null);
  const [every, setEvery] = useState(String(b.settings.loyaltyEvery ?? 10));
  const [err, setErr] = useState<string | null>(null);
  const submit = () => {
    setErr(null);
    save.mutate({ pixKey: pix.trim() || null, loyaltyEvery: loyalty ? Number(every) : null } as never, {
      onSuccess: (r) => { setPix(r.pixKey ?? ''); toast('Salvo.'); },
      onError: (e) => setErr(e.message),
    });
  };
  return (
    <section className="card space-y-4 p-5">
      <div>
        <h2 className="flex items-center gap-2 font-semibold"><QrCode className="h-5 w-5 text-accent-600" aria-hidden /> Sinal pelo Pix</h2>
        <p className="mt-1 text-sm text-muted">
          Peça um sinal para garantir o horário e diminuir as faltas. O cliente paga direto na sua chave Pix (o app não fica com nada).
          Defina o valor do sinal em cada serviço, na aba Serviços.
        </p>
      </div>
      <TextField label="Sua chave Pix" optional placeholder="CPF, CNPJ, e-mail, celular ou chave aleatória" value={pix} onChange={(e) => setPix(e.target.value)} />
      <div>
        <h3 className="flex items-center gap-2 font-semibold"><Gift className="h-5 w-5 text-accent-600" aria-hidden /> Cartão fidelidade</h3>
        <Checkbox label="Ativar cartão fidelidade" description="O cliente vê os carimbos no seu perfil e você vê no pedido quando o próximo é grátis." checked={loyalty} onChange={(e) => setLoyalty(e.target.checked)} />
        {loyalty && (
          <SelectField label="A cada quantos atendimentos o próximo é grátis?" value={every} onChange={(e) => setEvery(e.target.value)}>
            {[5, 6, 8, 10, 12, 15, 20].map((n) => <option key={n} value={n}>{n} atendimentos</option>)}
          </SelectField>
        )}
      </div>
      {err && <Alert tone="error">{err}</Alert>}
      <Button loading={save.isPending} onClick={submit}>Salvar</Button>
    </section>
  );
}

type PkgForm = { id: string | null; serviceId: string; name: string; sessions: string; price: string; validityDays: string; active: boolean };

function PackagesCard() {
  const b = useBiz();
  const toast = useToast();
  const list = usePanelPackages(b.id);
  const save = useSavePackage(b.id);
  const remove = useRemovePackage(b.id);
  const [f, setF] = useState<PkgForm | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const services = b.services.filter((s) => s.bookable);
  const open = (p?: PackageDTO) => {
    setErr(null);
    const svc = services[0];
    setF(p
      ? { id: p.id, serviceId: p.serviceId, name: p.name, sessions: String(p.sessions), price: String(p.priceCents / 100), validityDays: String(p.validityDays), active: p.active }
      : { id: null, serviceId: svc?.id ?? '', name: svc ? `4 ${svc.name.toLowerCase()} por mês` : '', sessions: '4', price: svc?.priceMin ? String(Math.round(svc.priceMin * 4 * 0.85)) : '', validityDays: '30', active: true });
  };
  const submit = () => {
    if (!f) return;
    const data: PackageInput = { serviceId: f.serviceId, name: f.name, sessions: Number(f.sessions), price: Number(f.price.replace(',', '.')), validityDays: Number(f.validityDays), active: f.active };
    save.mutate({ id: f.id, data }, { onSuccess: () => { toast('Pacote salvo.'); setF(null); }, onError: (e) => setErr(e.message) });
  };
  return (
    <section className="card p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold"><Package className="h-5 w-5 text-accent-600" aria-hidden /> Clube de pacotes</h2>
        <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => open()} disabled={!services.length}>Novo pacote</Button>
      </div>
      <p className="mt-1 text-sm text-muted">Ex.: "4 banhos por mês". O cliente paga adiantado e agenda cada sessão pelo app — renda garantida e cliente fiel.</p>
      {list.isLoading ? <PageLoader /> : !list.data?.length ? (
        <p className="mt-3 text-sm text-muted">Nenhum pacote ainda.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {list.data.map((p) => {
            const saving = packageSavings(p);
            return (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{p.name} {!p.active && <Tag tone="neutral">Pausado</Tag>}</p>
                  <p className="text-sm text-muted">{p.sessions}× {p.serviceName} · {formatCents(p.priceCents)} · {p.validityDays} dias{saving ? ` · ${saving}% off` : ''}</p>
                </div>
                <Button size="sm" variant="ghost" aria-label={`Editar ${p.name}`} onClick={() => open(p)}><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" aria-label={`Remover ${p.name}`} onClick={() => remove.mutate(p.id, { onSuccess: () => toast('Pacote removido.') })}><Trash2 className="h-4 w-4" /></Button>
              </li>
            );
          })}
        </ul>
      )}
      <Sheet open={!!f} onClose={() => setF(null)} title={f?.id ? 'Editar pacote' : 'Novo pacote'}>
        {f && (
          <div className="space-y-4">
            <SelectField label="Serviço" value={f.serviceId} onChange={(e) => setF({ ...f, serviceId: e.target.value })}>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </SelectField>
            <TextField label="Nome do pacote" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <div className="grid grid-cols-3 gap-3">
              <TextField label="Sessões" inputMode="numeric" value={f.sessions} onChange={(e) => setF({ ...f, sessions: e.target.value })} />
              <TextField label="Preço (R$)" inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
              <TextField label="Validade (dias)" inputMode="numeric" value={f.validityDays} onChange={(e) => setF({ ...f, validityDays: e.target.value })} />
            </div>
            <Checkbox label="Pacote disponível no perfil" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />
            {err && <Alert tone="error">{err}</Alert>}
            <Button block loading={save.isPending} onClick={submit}>Salvar pacote</Button>
          </div>
        )}
      </Sheet>
    </section>
  );
}

const CP_STATUS = { requested: { label: 'Aguardando pagamento', tone: 'warning' }, active: { label: 'Ativo', tone: 'accent' }, cancelled: { label: 'Cancelado', tone: 'neutral' } } as const;

function CustomerPackagesCard() {
  const b = useBiz();
  const toast = useToast();
  const list = useCustomerPackages(b.id);
  const act = useCustomerPackageAction(b.id);
  if (!list.data?.length) return null;
  return (
    <section className="card p-5" data-testid="customer-packages">
      <h2 className="font-semibold">Pacotes dos clientes</h2>
      <p className="mt-1 text-sm text-muted">Ative quando receber o pagamento. As sessões passam a aparecer para o cliente agendar.</p>
      <ul className="mt-3 divide-y divide-line">
        {list.data.map((p) => (
          <li key={p.id} className="py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone={CP_STATUS[p.status].tone}>{CP_STATUS[p.status].label}</Tag>
              <span className="font-medium">{p.packageName}</span>
            </div>
            <p className="mt-1 text-sm text-muted">
              {p.customerName ?? 'Cliente'}{p.petName ? ` · ${p.petName}` : ''} · {formatCents(p.priceCents)}
              {p.status === 'active' && ` · ${p.used}/${p.sessions} usadas${p.expiresAt ? ` · vence ${new Date(p.expiresAt).toLocaleDateString('pt-BR')}` : ''}`}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {p.status === 'requested' && (
                <Button size="sm" loading={act.isPending} onClick={() => act.mutate({ id: p.id, action: 'activate' }, { onSuccess: () => toast('Pacote ativado.'), onError: (e) => toast(e.message, 'error') })}>Recebi o pagamento</Button>
              )}
              {p.status !== 'cancelled' && (
                <Button size="sm" variant="ghost" onClick={() => act.mutate({ id: p.id, action: 'cancel' }, { onSuccess: () => toast('Pacote cancelado.') })}>Cancelar</Button>
              )}
              {p.customerPhone && (
                <a className="inline-flex min-h-[40px] items-center gap-1 text-sm font-semibold text-brand-fg hover:underline" target="_blank" rel="noopener noreferrer"
                  href={whatsappLink(p.customerPhone, `Olá, ${p.customerName ?? ''}! Sobre o pacote "${p.packageName}" na ${b.name}:`) ?? undefined}>
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function monthOptions() {
  const out: Array<{ value: string; label: string }> = [];
  const d = new Date();
  for (let i = 0; i < 6; i++) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push({ value: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`, label: m.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) });
  }
  return out;
}

function ReportCard() {
  const b = useBiz();
  const months = monthOptions();
  const [month, setMonth] = useState(months[0].value);
  const r = useReport(b.id, month);
  return (
    <section className="card p-5" data-testid="report">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold"><BarChart3 className="h-5 w-5 text-accent-600" aria-hidden /> Relatório do mês</h2>
        <div className="w-48"><SelectField label="Mês" value={month} onChange={(e) => setMonth(e.target.value)}>{months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</SelectField></div>
      </div>
      {r.isLoading ? <PageLoader /> : r.error ? <Alert tone="warning">{(r.error as Error).message}</Alert> : r.data && (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Atendimentos', String(r.data.completed)],
              ['Faturamento estimado', formatCents(r.data.revenueCents)],
              ['Clientes novos', String(r.data.newCustomers)],
              ['Clientes que voltaram', String(r.data.returningCustomers)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-line p-3"><dt className="text-xs text-muted">{k}</dt><dd className="mt-1 text-xl font-semibold">{v}</dd></div>
            ))}
          </dl>
          <p className="mt-2 text-xs text-muted">Faturamento estimado pelos preços cadastrados e pacotes ativados no mês. Cancelados/recusados: {r.data.cancelled}.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold">Serviços mais feitos</h3>
              {r.data.topServices.length ? (
                <ul className="space-y-1.5 text-sm">{r.data.topServices.map((s) => <Bar key={s.name} label={s.name} value={s.count} max={r.data!.topServices[0].count} />)}</ul>
              ) : <p className="text-sm text-muted">Sem atendimentos concluídos.</p>}
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Horários mais cheios</h3>
              {r.data.busiestHours.length ? (
                <ul className="space-y-1.5 text-sm">{r.data.busiestHours.map((h) => <Bar key={h.hour} label={`${String(h.hour).padStart(2, '0')}h`} value={h.count} max={r.data!.busiestHours[0].count} />)}</ul>
              ) : <p className="text-sm text-muted">Sem dados ainda.</p>}
            </div>
          </div>
          <div className="mt-5">
            <h3 className="text-sm font-semibold">Clientes sumidos (mais de 45 dias)</h3>
            {r.data.missingCustomers.length ? (
              <ul className="mt-2 divide-y divide-line">
                {r.data.missingCustomers.map((c, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span>{c.name}{c.petName ? ` · ${c.petName}` : ''} <span className="text-muted">· {c.daysSince} dias</span></span>
                    {whatsappLink(c.phone) && (
                      <a className="inline-flex min-h-[40px] items-center gap-1 font-semibold text-brand-fg hover:underline" target="_blank" rel="noopener noreferrer"
                        href={whatsappLink(c.phone, `Oi, ${c.name}! Sentimos falta ${c.petName ? `do(a) ${c.petName}` : 'de vocês'} aqui na ${b.name}. Quer agendar? Pelo app Pataí é rapidinho 🐾`) ?? undefined}>
                        <MessageCircle className="h-4 w-4" /> Chamar
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : <EmptyState icon={<Gift className="h-6 w-6" />} title="Ninguém sumido">Todos os clientes voltaram nos últimos 45 dias.</EmptyState>}
          </div>
        </>
      )}
    </section>
  );
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <li>
      <div className="flex justify-between"><span>{label}</span><span className="text-muted">{value}</span></div>
      <div className="mt-1 h-2 rounded-full bg-brand-50"><div className="h-2 rounded-full bg-accent-600" style={{ width: `${Math.max(6, (value / max) * 100)}%` }} /></div>
    </li>
  );
}
