import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, ShieldAlert } from 'lucide-react';
import { formatCents, PLANS, type PlanId } from '@conecta/shared';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Alert, EmptyState, PageLoader } from '@/components/ui/Feedback';
import { TextArea } from '@/components/ui/Form';
import { Sheet } from '@/components/ui/Sheet';
import { DemoTag, Tag } from '@/components/ui/Tags';
import { useToast } from '@/components/ui/Toast';

interface AdminBiz { plan: 'free' | 'pro' | 'team'; planUntil: string | null; id: string; slug: string; name: string; status: string; suspendedReason: string | null; verifiedAt: string | null; isDemo: boolean; createdAt: string; category: string; city: string; uf: string; reviewCount: number }

/** Moderação: suspender/reativar empresas e conceder o selo "Perfil verificado". */
export function AdminPage() {
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const qc = useQueryClient();
  const toast = useToast();
  const [suspending, setSuspending] = useState<AdminBiz | null>(null);
  const [reason, setReason] = useState('');
  const access = useQuery({ queryKey: ['admin', 'me'], queryFn: () => api.get('/admin/me'), retry: false });
  const list = useQuery({ queryKey: ['admin', 'businesses', term], queryFn: () => api.get<AdminBiz[]>(`/admin/businesses?q=${encodeURIComponent(term)}`), enabled: access.isSuccess });
  const update = async (b: AdminBiz, patch: { status?: string; verified?: boolean; reason?: string }) => {
    try {
      await api.patch(`/admin/businesses/${b.id}`, { status: patch.status ?? b.status, verified: patch.verified ?? !!b.verifiedAt, reason: patch.reason });
      await qc.invalidateQueries({ queryKey: ['admin', 'businesses'] });
      qc.invalidateQueries({ queryKey: ['search'] });
      toast('Empresa atualizada.');
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };
  if (access.isLoading) return <PageLoader />;
  if (access.isError) return <div className="container-app py-8"><EmptyState icon={<ShieldAlert className="h-8 w-8" />} title="Área restrita">Somente administradores acessam esta página.</EmptyState></div>;
  return (
    <div className="container-app max-w-4xl py-6">
      <h1 className="text-2xl font-bold">Administração</h1>
      <p className="mb-4 text-muted">Empresas aparecem no app assim que se cadastram. Aqui você suspende perfis falsos ou irregulares e concede o selo “Perfil verificado” depois de conferir documentos.</p>
      <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); setTerm(q.trim()); }} role="search">
        <label htmlFor="admin-q" className="sr-only">Buscar empresa</label>
        <input id="admin-q" className="field" placeholder="Buscar empresa pelo nome" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button type="submit">Buscar</Button>
      </form>
      {list.isLoading && <PageLoader />}
      <ul className="space-y-2">
        {list.data?.map((b) => (
          <li key={b.id} className="card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <a href={`/empresa/${b.slug}`} target="_blank" rel="noopener" className="font-semibold hover:underline">{b.name}</a>
              {b.isDemo && <DemoTag />}
              {b.status === 'suspended' ? <Tag tone="warning">Suspensa</Tag> : <Tag tone="accent">Ativa</Tag>}
              {b.verifiedAt && <Tag tone="brand" icon={<BadgeCheck className="h-3.5 w-3.5" />}>Verificada</Tag>}
            </div>
            <p className="text-sm text-muted">{b.category} · {b.city}, {b.uf} · {b.reviewCount} avaliações · cadastrada em {new Date(b.createdAt).toLocaleDateString('pt-BR')}</p>
            {b.suspendedReason && <p className="text-sm text-warning-700">Motivo: {b.suspendedReason}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {b.status === 'suspended'
                ? <Button size="sm" variant="secondary" onClick={() => update(b, { status: 'active' })}>Reativar</Button>
                : <Button size="sm" variant="danger" onClick={() => { setReason(''); setSuspending(b); }}>Suspender</Button>}
              <Button size="sm" variant="secondary" onClick={() => update(b, { verified: !b.verifiedAt })}>{b.verifiedAt ? 'Remover verificação' : 'Marcar como verificada'}</Button>
            </div>
            <PlanEditor b={b} onSaved={() => qc.invalidateQueries({ queryKey: ['admin', 'businesses'] })} />
          </li>
        ))}
      </ul>
      {list.data?.length === 0 && <p className="py-6 text-center text-muted">Nenhuma empresa encontrada.</p>}
      <Sheet open={!!suspending} onClose={() => setSuspending(null)} title={`Suspender ${suspending?.name ?? ''}`}
        footer={<Button block variant="danger" onClick={async () => { if (suspending) await update(suspending, { status: 'suspended', reason }); setSuspending(null); }}>Suspender empresa</Button>}>
        <div className="space-y-3">
          <p>A empresa deixa de aparecer para os clientes. O dono continua vendo o painel, com o motivo abaixo.</p>
          <TextArea label="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} className="field min-h-[80px]" placeholder="Ex.: fotos copiadas de outra empresa" />
          <Alert tone="warning">Use “Marcar como verificada” somente depois de conferir CNPJ ou documento do responsável, endereço e telefone.</Alert>
        </div>
      </Sheet>
    </div>
  );
}

function PlanEditor({ b, onSaved }: { b: AdminBiz; onSaved: () => void }) {
  const toast = useToast();
  const [plan, setPlan] = useState(b.plan);
  const [until, setUntil] = useState(b.planUntil ? b.planUntil.slice(0, 10) : '');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/businesses/${b.id}/plan`, { plan, until: plan === 'free' ? null : until || null });
      toast('Plano atualizado.');
      onSaved();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl bg-surface p-3">
      <label className="text-sm">
        <span className="block text-muted">Plano</span>
        <select className="field w-auto py-2" value={plan} onChange={(e) => setPlan(e.target.value as AdminBiz['plan'])}>
          {(Object.keys(PLANS) as PlanId[]).map((id) => <option key={id} value={id}>{PLANS[id].name}{PLANS[id].priceCents ? ` (${formatCents(PLANS[id].priceCents)}/mês)` : ''}</option>)}
        </select>
      </label>
      {plan !== 'free' && (
        <label className="text-sm">
          <span className="block text-muted">Pago até</span>
          <input type="date" className="field w-auto py-2" value={until} onChange={(e) => setUntil(e.target.value)} />
        </label>
      )}
      <Button size="sm" variant="secondary" loading={saving} onClick={save}>Salvar plano</Button>
    </div>
  );
}
