/**
 * Links de WhatsApp com mensagem pronta (sem API paga: abre o WhatsApp da própria empresa).
 * Lembrete de véspera reduz faltas; o pedido de avaliação traz o cliente de volta ao app.
 */
import { BRAND } from './brand';
import { PERIODS, type Period } from './booking';

export function whatsappLink(phone: string | null | undefined, text?: string): string | null {
  const digits = (phone ?? '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  if (digits.length < 10 || digits.length > 11) return null;
  return `https://wa.me/55${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export interface ReminderInput {
  businessName: string;
  customerName: string | null;
  serviceName: string;
  startsAt: string;
  mode: 'slot' | 'period' | 'day';
  period: string | null;
  partySize: number | null;
  timezone?: string;
}

export function describeWhen(i: Pick<ReminderInput, 'startsAt' | 'mode' | 'period' | 'timezone'>): string {
  const d = new Date(i.startsAt);
  const tz = i.timezone ? { timeZone: i.timezone } : {};
  const day = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', ...tz });
  if (i.mode === 'day') return `${day} (diária)`;
  if (i.mode === 'period') return `${day}, ${(PERIODS[i.period as Period]?.label ?? 'no turno combinado').toLowerCase()}`;
  return `${day} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', ...tz })}`;
}

export function reminderMessage(i: ReminderInput): string {
  const first = i.customerName?.split(' ')[0];
  const who = i.partySize ? ` para ${i.partySize} ${i.partySize === 1 ? 'pessoa' : 'pessoas'}` : '';
  return [
    `Olá${first ? `, ${first}` : ''}! Aqui é da ${i.businessName}.`,
    `Passando para lembrar: ${i.serviceName}${who} — ${describeWhen(i)}.`,
    'Podemos confirmar? Se precisar remarcar, é só responder esta mensagem. Até lá!',
  ].join('\n');
}

export function reviewRequestMessage(businessName: string, customerName: string | null, profileUrl: string): string {
  const first = customerName?.split(' ')[0];
  return [
    `Olá${first ? `, ${first}` : ''}! Obrigado pela preferência na ${businessName}.`,
    `Sua opinião ajuda muito: pode avaliar seu atendimento no ${BRAND.name}? Leva 1 minuto.`,
    profileUrl,
  ].join('\n');
}
