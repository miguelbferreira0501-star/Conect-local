import { HeartHandshake } from 'lucide-react';
import { BRAND } from '@conecta/shared';

/** Cliente indica uma empresa de confiança: o cadastro é grátis e ela aparece na hora. */
export function InviteBusiness({ cityName, compact = false }: { cityName?: string; compact?: boolean }) {
  const link = `${window.location.origin}/empresas`;
  const text = `Oi! Sou seu cliente e indiquei você no ${BRAND.name}${cityName ? `, o app para achar empresas de confiança em ${cityName}` : ''}. O cadastro é grátis e dá para receber agendamentos e avaliações: ${link}`;
  return (
    <div className={`card flex flex-wrap items-center gap-3 ${compact ? 'p-4' : 'p-5'}`}>
      <HeartHandshake className="h-7 w-7 shrink-0 text-accent-700" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Conhece uma empresa boa que não está aqui?</p>
        <p className="text-sm text-muted">Indique pelo WhatsApp. O cadastro é grátis e ajuda outras pessoas da cidade.</p>
      </div>
      <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer"
        className="inline-flex min-h-[44px] items-center rounded-xl bg-accent-700 px-4 font-semibold text-white hover:bg-accent-600">
        Indicar empresa
      </a>
    </div>
  );
}
