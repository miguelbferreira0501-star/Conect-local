import { Gift } from 'lucide-react';
import { formatCents, loyaltyProgress } from '@conecta/shared';
import { useDepositPaid } from '@/lib/benefits';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

/** Sinal do pedido: a empresa confere no extrato do banco e marca como recebido. */
export function PanelDeposit({ businessId, bookingId, deposit }: { businessId: string; bookingId: string; deposit?: { cents: number; status: 'pending' | 'paid' } | null }) {
  const toast = useToast();
  const paid = useDepositPaid(businessId);
  if (!deposit) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-line p-2.5 text-sm">
      {deposit.status === 'paid' ? (
        <span className="text-success-700">Sinal de {formatCents(deposit.cents)} recebido ✓</span>
      ) : (
        <>
          <span className="flex-1">Sinal de <strong>{formatCents(deposit.cents)}</strong> pelo Pix — confira no seu banco.</span>
          <Button size="sm" variant="secondary" loading={paid.isPending}
            onClick={() => paid.mutate(bookingId, { onSuccess: () => toast('Sinal marcado como recebido.'), onError: (e) => toast(e.message, 'error') })}>
            Sinal recebido
          </Button>
        </>
      )}
    </div>
  );
}

/** Cartão fidelidade no pedido: avisa quando este atendimento é o grátis. */
export function PanelLoyalty({ every, visits }: { every: number | null; visits?: number }) {
  if (!every || visits == null) return null;
  const p = loyaltyProgress(visits, every);
  return (
    <p className={`mt-1 inline-flex items-center gap-1 text-sm ${p.nextIsFree ? 'font-semibold text-accent-600' : 'text-muted'}`}>
      <Gift className="h-4 w-4" aria-hidden />
      {p.nextIsFree ? 'Este atendimento é o grátis do cartão fidelidade!' : `Fidelidade: ${p.stamps}/${every} carimbos`}
    </p>
  );
}
