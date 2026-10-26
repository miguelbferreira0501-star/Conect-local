import { Car, Home, KeyRound, MapPin, Navigation, Package } from 'lucide-react';

/** Detalhes que cada área pede no agendamento (endereço, destino, busca e entrega, saída da hospedagem…). */
export function BookingExtras({ endsAt, mode, address, destination, details, fromPackage, showHouseNotes = true }: {
  endsAt?: string | null; mode?: string | null; address?: string | null; destination?: string | null;
  details?: { pickup?: boolean; atHome?: boolean; roundTrip?: boolean; returnTime?: string; houseNotes?: string } | null;
  fromPackage?: boolean; showHouseNotes?: boolean;
}) {
  const d = details ?? {};
  const items: Array<{ icon: typeof MapPin; text: string }> = [];
  if (mode === 'day' && endsAt) items.push({ icon: Home, text: `Saída: ${new Date(endsAt).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}` });
  if (d.pickup) items.push({ icon: Car, text: 'Buscar e levar o pet em casa' });
  if (d.atHome) items.push({ icon: Home, text: 'Aula na casa do tutor' });
  if (address) items.push({ icon: MapPin, text: destination ? `Buscar em: ${address}` : address });
  if (destination) items.push({ icon: Navigation, text: `Levar para: ${destination}${d.roundTrip ? ` · ida e volta${d.returnTime ? ` (volta às ${d.returnTime})` : ''}` : ''}` });
  if (showHouseNotes && d.houseNotes) items.push({ icon: KeyRound, text: d.houseNotes });
  if (fromPackage) items.push({ icon: Package, text: 'Sessão do pacote' });
  if (!items.length) return null;
  return (
    <ul className="mt-1.5 space-y-1 text-sm text-muted">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-1.5"><it.icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> <span className="whitespace-pre-line">{it.text}</span></li>
      ))}
    </ul>
  );
}
