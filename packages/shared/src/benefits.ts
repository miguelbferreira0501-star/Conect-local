/**
 * Benefícios do Plano Pataí: clube de pacotes, cartão fidelidade, lembrete de retorno e relatórios.
 */
import { z } from 'zod';
import { pixKeySchema } from './pix';

const uuid = z.string().uuid('Identificador inválido.');

// ── Configurações da empresa (Pix do sinal e fidelidade) ──
export const businessSettingsSchema = z.object({
  pixKey: z.union([pixKeySchema, z.null()]).default(null),
  loyaltyEvery: z.coerce.number().int().min(3, 'Use de 3 a 30 atendimentos.').max(30, 'Use de 3 a 30 atendimentos.').nullable().default(null),
});
export type BusinessSettingsInput = z.input<typeof businessSettingsSchema>;

// ── Clube de pacotes ──
export const packageInputSchema = z.object({
  serviceId: uuid,
  name: z.string().trim().min(3, 'Dê um nome ao pacote.').max(80, 'Use no máximo 80 caracteres.'),
  sessions: z.coerce.number().int().min(2, 'Mínimo de 2 sessões.').max(30, 'Máximo de 30 sessões.'),
  price: z.coerce.number().min(1, 'Informe o preço.').max(10_000, 'Preço muito alto.'),
  validityDays: z.coerce.number().int().min(7, 'Validade mínima de 7 dias.').max(365, 'Validade máxima de 1 ano.').default(30),
  active: z.boolean().default(true),
});
export type PackageInput = z.input<typeof packageInputSchema>;

export interface PackageDTO {
  id: string;
  serviceId: string;
  serviceName: string;
  name: string;
  sessions: number;
  priceCents: number;
  validityDays: number;
  active: boolean;
  /** Preço avulso do serviço, para mostrar a economia */
  singlePriceCents: number | null;
}

export interface MyPackageDTO {
  id: string;
  name: string;
  serviceId: string;
  serviceName: string;
  business: { id: string; slug: string; name: string; pixKey: string | null; city: string };
  sessions: number;
  remaining: number;
  priceCents: number;
  status: 'requested' | 'active' | 'cancelled';
  expiresAt: string | null;
  createdAt: string;
  petName: string | null;
}

export interface PanelCustomerPackageDTO {
  id: string;
  packageName: string;
  customerName: string | null;
  customerPhone: string | null;
  petName: string | null;
  sessions: number;
  used: number;
  priceCents: number;
  status: 'requested' | 'active' | 'cancelled';
  expiresAt: string | null;
  createdAt: string;
}

export function packageSavings(p: Pick<PackageDTO, 'sessions' | 'priceCents' | 'singlePriceCents'>): number | null {
  if (!p.singlePriceCents) return null;
  const full = p.singlePriceCents * p.sessions;
  return full > p.priceCents ? Math.round(((full - p.priceCents) / full) * 100) : null;
}

// ── Cartão fidelidade ("a cada N atendimentos, o próximo é grátis") ──
export function loyaltyProgress(visits: number, every: number) {
  const stamps = visits % every;
  return { stamps, every, nextIsFree: stamps === every - 1, rewardsEarned: Math.floor(visits / every) };
}

// ── Lembrete de retorno ("faz 16 dias do último banho do Thor") ──
export const RETURN_AFTER_DAYS: Record<string, number> = {
  'banho-e-tosa': 15,
  passeador: 7,
  adestramento: 7,
  'hospedagem-e-creche': 30,
};

export interface ReturnReminderDTO {
  petId: string | null;
  petName: string | null;
  business: { slug: string; name: string };
  serviceId: string;
  serviceName: string;
  daysSince: number;
}

// ── Relatórios do mês ──
export interface PanelReportDTO {
  month: string; // AAAA-MM
  completed: number;
  cancelled: number;
  revenueCents: number;
  newCustomers: number;
  returningCustomers: number;
  topServices: Array<{ name: string; count: number }>;
  busiestHours: Array<{ hour: number; count: number }>;
  /** Clientes que não voltam há mais de 45 dias (para chamar de volta) */
  missingCustomers: Array<{ name: string; phone: string | null; petName: string | null; lastVisit: string; daysSince: number }>;
}
