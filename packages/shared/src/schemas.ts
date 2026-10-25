/**
 * Esquemas de validação usados no cliente E no servidor.
 * O servidor sempre revalida — a validação do navegador é só conveniência.
 */
import { z } from 'zod';

const trimmed = (min: number, max: number, msg: string) =>
  z.string().trim().min(min, msg).max(max, `Use no máximo ${max} caracteres.`);

export const ibgeCode = z.coerce.number().int().min(1100000).max(5399999);
export const uuid = z.string().uuid('Identificador inválido.');

export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v === '' || /^\d{10,11}$/.test(v), 'Informe um telefone com DDD (10 ou 11 dígitos).');

export const registerSchema = z.object({
  name: trimmed(2, 80, 'Informe seu nome.'),
  email: z.string().trim().toLowerCase().email('Informe um e-mail válido.').max(160),
  password: z
    .string()
    .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
    .max(128, 'Use no máximo 128 caracteres.')
    .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'Use letras e números na senha.'),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'É preciso aceitar os termos e a política de privacidade.' }) }),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe sua senha.').max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const profileUpdateSchema = z.object({
  name: trimmed(2, 80, 'Informe seu nome.').optional(),
  phone: phoneSchema.optional(),
  cityIbge: ibgeCode.nullable().optional(),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const SORT_OPTIONS = ['relevance', 'rating', 'reviews', 'distance', 'newest'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];
export const SORT_LABELS: Record<SortOption, string> = {
  relevance: 'Mais relevantes',
  rating: 'Melhor avaliadas',
  reviews: 'Mais avaliações',
  distance: 'Mais próximas',
  newest: 'Mais recentes',
};

export const SERVICE_MODES = ['in_person', 'at_customer', 'online'] as const;
export type ServiceMode = (typeof SERVICE_MODES)[number];
export const SERVICE_MODE_LABELS: Record<ServiceMode, string> = {
  in_person: 'No estabelecimento',
  at_customer: 'No seu endereço',
  online: 'On-line',
};

const boolParam = z.preprocess((v) => v === true || v === 'true' || v === '1', z.boolean()).optional();
const csv = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess((v) => (typeof v === 'string' ? v.split(',').filter(Boolean) : v), z.array(item)).optional();

export const searchQuerySchema = z.object({
  city: ibgeCode,
  q: z.string().trim().max(80).optional().default(''),
  category: z.string().trim().max(60).optional(),
  neighborhood: z.string().trim().max(80).optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  minReviews: z.coerce.number().int().min(0).max(10000).optional(),
  priceLevels: csv(z.coerce.number().int().min(1).max(4)),
  modes: csv(z.enum(SERVICE_MODES)),
  bookable: boolParam,
  sort: z.enum(SORT_OPTIONS).optional().default('relevance'),
  lat: z.coerce.number().min(-35).max(6).optional(),
  lon: z.coerce.number().min(-75).max(-28).optional(),
  page: z.coerce.number().int().min(1).max(100).optional().default(1),
  pageSize: z.coerce.number().int().min(5).max(50).optional().default(20),
});
export type SearchQuery = z.infer<typeof searchQuerySchema>;

export const quoteRequestSchema = z.object({
  businessId: uuid,
  serviceId: uuid.nullable().optional(),
  description: trimmed(15, 1500, 'Descreva o que você precisa (mínimo de 15 caracteres).'),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.').nullable().optional(),
  contactPreference: z.enum(['whatsapp', 'phone', 'email']),
  contactPhone: phoneSchema.optional(),
  neighborhood: z.string().trim().max(80).optional(),
}).superRefine((v, ctx) => {
  if (v.contactPreference !== 'email' && !v.contactPhone) {
    ctx.addIssue({ code: 'custom', path: ['contactPhone'], message: 'Informe um telefone para a empresa entrar em contato.' });
  }
});
export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;

export const bookingRequestSchema = z.object({
  businessId: uuid,
  serviceId: uuid,
  /** Profissional/recurso escolhido; ausente = sem preferência */
  staffId: uuid.nullable().optional(),
  /** Reserva de restaurante: quantas pessoas */
  partySize: z.coerce.number().int().min(1, 'Informe quantas pessoas.').max(50, 'Para grupos com mais de 50 pessoas, peça um orçamento.').optional(),
  startsAt: z.string().datetime({ offset: true, message: 'Horário inválido.' }),
  notes: z.string().trim().max(500, 'Use no máximo 500 caracteres.').optional(),
  contactPhone: phoneSchema.optional(),
});
export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;

export const REVIEW_ASPECTS = ['atendimento', 'pontualidade', 'qualidade', 'preco'] as const;
export type ReviewAspect = (typeof REVIEW_ASPECTS)[number];
export const REVIEW_ASPECT_LABELS: Record<ReviewAspect, string> = {
  atendimento: 'Atendimento',
  pontualidade: 'Pontualidade',
  qualidade: 'Qualidade do serviço',
  preco: 'Preço justo',
};

const URL_OR_CONTACT = /(https?:\/\/|www\.|\.com\b|\.com\.br\b|@\w+\.\w+|\b\d{4,5}[-\s]?\d{4}\b)/i;

export const reviewInputSchema = z.object({
  businessId: uuid,
  activityType: z.enum(['booking', 'quote']),
  activityId: uuid,
  rating: z.coerce.number().int().min(1, 'Escolha de 1 a 5 estrelas.').max(5, 'Escolha de 1 a 5 estrelas.'),
  comment: z
    .string()
    .trim()
    .min(20, 'Conte um pouco mais sobre sua experiência (mínimo de 20 caracteres).')
    .max(1000, 'Use no máximo 1000 caracteres.')
    .refine((v) => !URL_OR_CONTACT.test(v), 'Não inclua links, e-mails ou telefones na avaliação.'),
  aspects: z.record(z.enum(REVIEW_ASPECTS), z.number().int().min(1).max(5)).optional().default({}),
});
export type ReviewInput = z.infer<typeof reviewInputSchema>;

export const reviewUpdateSchema = reviewInputSchema.pick({ rating: true, comment: true, aspects: true });
export type ReviewUpdateInput = z.infer<typeof reviewUpdateSchema>;

export const REPORT_REASONS = {
  fake: 'Parece falsa ou não é de um cliente',
  offensive: 'Linguagem ofensiva ou discriminatória',
  personal_data: 'Expõe dados pessoais',
  spam: 'Propaganda ou spam',
  other: 'Outro motivo',
} as const;
export const reviewReportSchema = z.object({
  reason: z.enum(Object.keys(REPORT_REASONS) as [keyof typeof REPORT_REASONS, ...Array<keyof typeof REPORT_REASONS>]),
  details: z.string().trim().max(500).optional(),
});
export type ReviewReportInput = z.infer<typeof reviewReportSchema>;

/** Regras de negócio das avaliações (documentadas em docs/AVALIACOES.md). */
export const REVIEW_RULES = {
  editableDays: 30,
  minDaysBetweenReviewsSameBusiness: 30,
  maxReviewsPerDay: 5,
} as const;
