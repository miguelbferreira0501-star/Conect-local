import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Gift, Package, Stamp } from 'lucide-react';
import { formatCents, loyaltyProgress, packageSavings, type BusinessDetailDTO } from '@conecta/shared';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useMyPackages, useRequestPackage } from '@/lib/benefits';
import { usePets } from '@/lib/pets';
import { Button } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/Form';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { DepositCard } from '@/components/DepositCard';

/** Cartão fidelidade: carimbos dos atendimentos concluídos. */
export function LoyaltyCard({ every, visits, compact }: { every: number; visits: number | null; compact?: boolean }) {
  const p = loyaltyProgress(visits ?? 0, every);
  return (
    <section className={compact ? '' : 'card p-5'} data-testid="loyalty-card">
      {!compact && <h2 className="mb-1 flex items-center gap-2 font-semibold"><Stamp className="h-5 w-5 text-muted" aria-hidden /> Cartão fidelidade</h2>}
      <p className="text-sm text-muted">A cada {every} atendimentos, o próximo é grátis.</p>
      <div className="mt-3 flex flex-wrap gap-1.5" aria-label={`${p.stamps} de ${every} carimbos`}>
        {Array.from({ length: every }, (_, i) => (
          <span key={i} className={`grid h-7 w-7 place-items-center rounded-full border text-xs ${i < p.stamps ? 'border-brand-700 bg-brand-700 text-white' : 'border-line text-muted'}`}>
            {i < p.stamps ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-label="carimbado" /> : i + 1}
          </span>
        ))}
        <span className="grid h-7 w-7 place-items-center rounded-full border border-dashed border-accent-600 text-accent-600"><Gift className="h-3.5 w-3.5" aria-hidden /></span>
      </div>
      {visits == null ? (
        <p className="mt-2 text-xs text-muted">Entre na sua conta para ver seus carimbos.</p>
      ) : p.nextIsFree ? (
        <p className="mt-2 text-sm font-semibold text-accent-600">Seu próximo atendimento é grátis.</p>
      ) : (
        <p className="mt-2 text-xs text-muted">{p.stamps} de {every} carimbos{p.rewardsEarned ? ` · ${p.rewardsEarned} prêmio(s) já ganhos` : ''}</p>
      )}
    </section>
  );
}

/** Clube de pacotes da empresa: o tutor pede e paga direto para a empresa (Pix). */
export function PackagesSection({ b }: { b: BusinessDetailDTO }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const mine = useMyPackages();
  const pets = usePets();
  const request = useRequestPackage();
  const [open, setOpen] = useState<BusinessDetailDTO['packages'][number] | null>(null);
  const [petId, setPetId] = useState<string | null>(null);
  const [requested, setRequested] = useState<{ cents: number } | null>(null);
  if (!b.packages?.length) return null;

  const ask = (pkg: BusinessDetailDTO['packages'][number]) => {
    if (!user) return navigate(`/entrar?voltar=${encodeURIComponent(`/empresa/${b.slug}`)}`);
    setRequested(null);
    setPetId(pets.data?.[0]?.id ?? null);
    setOpen(pkg);
  };
  const confirm = async () => {
    if (!open) return;
    try {
      await request.mutateAsync({ packageId: open.id, petId });
      setRequested({ cents: open.priceCents });
      toast('Pedido enviado! A empresa ativa o pacote quando receber o pagamento.');
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Não foi possível pedir o pacote.', 'error');
    }
  };

  return (
    <section className="card p-5" data-testid="packages">
      <h2 className="mb-1 flex items-center gap-2 font-semibold"><Package className="h-5 w-5 text-muted" aria-hidden /> Clube de pacotes</h2>
      <p className="mb-3 text-sm text-muted">Pague uma vez e agende cada sessão pelo app.</p>
      <ul className="space-y-3">
        {b.packages.map((p) => {
          const saving = packageSavings(p);
          const has = mine.data?.find((m) => m.serviceId === p.serviceId && m.business.id === b.id);
          return (
            <li key={p.id} className="rounded-xl border border-line p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-muted">{p.sessions}× {p.serviceName} · válido por {p.validityDays} dias</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCents(p.priceCents)}</p>
                  {saving && <p className="text-xs font-semibold text-accent-600">economize {saving}%</p>}
                </div>
              </div>
              {has ? (
                <p className="mt-2 text-sm text-muted">{has.status === 'requested' ? 'Pedido enviado, aguardando a empresa confirmar o pagamento.' : `Você tem ${has.remaining} de ${has.sessions} sessões.`}</p>
              ) : (
                <Button size="sm" variant="secondary" className="mt-2" onClick={() => ask(p)}>Quero este pacote</Button>
              )}
            </li>
          );
        })}
      </ul>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.name ?? ''}>
        {open && (requested ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">Pedido enviado. Pague para {b.name}; quando a empresa confirmar, as sessões aparecem para você agendar.</p>
            <DepositCard cents={requested.cents} pixKey={b.pixKey} businessName={b.name} city={b.city.name} title="Pagamento do pacote" note="Depois a empresa ativa o pacote no app." />
            <Button block onClick={() => setOpen(null)}>Fechar</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">{open.sessions}× {open.serviceName} por <strong>{formatCents(open.priceCents)}</strong>. Válido por {open.validityDays} dias a partir da confirmação.</p>
            {!!pets.data?.length && (
              <SelectField label="Para qual pet?" value={petId ?? ''} onChange={(e) => setPetId(e.target.value || null)}>
                {pets.data.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}
                <option value="">Sem pet definido</option>
              </SelectField>
            )}
            <Button block loading={request.isPending} onClick={confirm}>Pedir pacote</Button>
          </div>
        ))}
      </Sheet>
    </section>
  );
}
