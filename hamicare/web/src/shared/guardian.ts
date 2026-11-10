// Guardiões do Hami: quem pode pagar dá HamiCare+ para quem não pode (ideia vista no Finch, do nosso jeito).
// Pagamento único (não renova sozinho): 1 mês ou 1 ano de Plus para cada pessoa ajudada.
// Usado pelo app (tela) e pelo servidor (preço e quantas pessoas cada pedido ajuda).

export type GuardianTier = 'aliado' | 'protetor' | 'heroi';
export type GuardianPeriod = 'mes' | 'ano';

/** Preço social de 1 pessoa por mês de Plus (bem abaixo da assinatura). Em centavos. */
export const SEAT_CENTS: Record<GuardianPeriod, number> = { mes: 990, ano: 9900 };
export const PERIOD_MONTHS: Record<GuardianPeriod, number> = { mes: 1, ano: 12 };
/** Sementes de agradecimento por pessoa ajudada (até 3000 por pedido). */
export const GUARDIAN_BONUS_PER_SEAT = 100;
export const GUARDIAN_BONUS_MAX = 3000;
/** Valor livre do Super-herói: mínimo de 1 pessoa, máximo de R$ 5.000 por pedido. */
export const HERO_MAX_CENTS = 500_000;

export const TIERS: Record<GuardianTier, { name: string; seats: number | null; about: string }> = {
  aliado: { name: 'Aliado', seats: 1, about: 'Dá HamiCare+ para 1 pessoa' },
  protetor: { name: 'Protetor', seats: 3, about: 'Dá HamiCare+ para 3 pessoas' },
  heroi: { name: 'Super-herói', seats: null, about: 'Você escolhe o valor' },
};

export interface GuardianQuote {
  seats: number;
  months: number;
  cents: number;
}

/** Quanto custa e quantas pessoas ajuda. Super-herói: as pessoas saem do valor escolhido. null = valor inválido. */
export function guardianQuote(tier: GuardianTier, period: GuardianPeriod, heroCents?: number): GuardianQuote | null {
  const seat = SEAT_CENTS[period];
  const months = PERIOD_MONTHS[period];
  if (tier === 'heroi') {
    const cents = Math.round(heroCents ?? 0);
    if (!Number.isFinite(cents) || cents < seat || cents > HERO_MAX_CENTS) return null;
    return { seats: Math.floor(cents / seat), months, cents };
  }
  const seats = TIERS[tier].seats!;
  return { seats, months, cents: seats * seat };
}

export const guardianBonus = (seats: number) => Math.min(GUARDIAN_BONUS_MAX, seats * GUARDIAN_BONUS_PER_SEAT);

export const brl = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
