/** Esquemas e tipos do painel das empresas (validados no navegador e no servidor). */
import { z } from 'zod';
import { ibgeCode, phoneSchema, uuid } from './schemas';

const text = (max: number) => z.string().trim().max(max, `Use no máximo ${max} caracteres.`);
const optionalText = (max: number) => text(max).optional().transform((v) => (v ? v : null));
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido (use HH:MM).');

const urlField = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((v) => (v ? (/^https?:\/\//i.test(v) ? v : `https://${v}`) : null))
  .refine((v) => v == null || /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v), 'Informe um endereço de site válido.');

export const openingHoursSchema = z
  .record(z.enum(['0', '1', '2', '3', '4', '5', '6']), z.array(z.tuple([time, time])).max(3))
  .superRefine((h, ctx) => {
    for (const [day, ranges] of Object.entries(h)) {
      for (const [a, b] of ranges ?? []) {
        if (a >= b) ctx.addIssue({ code: 'custom', path: [day], message: 'O horário de fechamento precisa ser depois da abertura.' });
      }
    }
  });

export const businessProfileSchema = z
  .object({
    name: text(80).min(2, 'Informe o nome da empresa.'),
    professionalName: optionalText(80),
    categorySlug: z.string().min(1, 'Escolha uma categoria.'),
    shortDescription: text(160).min(10, 'Escreva uma frase curta sobre a empresa (mínimo de 10 caracteres).'),
    description: optionalText(2000),
    cityIbge: ibgeCode,
    neighborhood: optionalText(80),
    street: optionalText(120),
    postalCode: z.string().trim().optional().transform((v) => (v ? v.replace(/\D/g, '') : null))
      .refine((v) => v == null || /^\d{8}$/.test(v), 'CEP deve ter 8 números.'),
    addressPublic: z.boolean().default(true),
    serviceAreaCities: z.array(ibgeCode).max(60, 'Escolha no máximo 60 cidades.').default([]),
    modeInPerson: z.boolean(),
    modeAtCustomer: z.boolean(),
    modeOnline: z.boolean(),
    phone: phoneSchema.optional().transform((v) => v || null),
    whatsapp: phoneSchema.optional().transform((v) => v || null),
    website: urlField,
    instagram: z.string().trim().max(60).optional().transform((v) => (v ? v.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/$/, '') : null))
      .refine((v) => v == null || /^[A-Za-z0-9._]{1,30}$/.test(v), 'Usuário do Instagram inválido.'),
    email: z.string().trim().toLowerCase().email('E-mail inválido.').optional().or(z.literal('')).transform((v) => v || null),
    priceLevel: z.number().int().min(1).max(4).nullable().default(null),
    acceptsBooking: z.boolean(),
    acceptsQuote: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (!v.modeInPerson && !v.modeAtCustomer && !v.modeOnline) {
      ctx.addIssue({ code: 'custom', path: ['modeInPerson'], message: 'Escolha pelo menos uma forma de atendimento.' });
    }
    if (!v.phone && !v.whatsapp && !v.email) {
      ctx.addIssue({ code: 'custom', path: ['whatsapp'], message: 'Informe pelo menos um contato: WhatsApp, telefone ou e-mail.' });
    }
    if (v.modeInPerson && !v.street) {
      ctx.addIssue({ code: 'custom', path: ['street'], message: 'Informe o endereço do estabelecimento.' });
    }
  });
export type BusinessProfileInput = z.input<typeof businessProfileSchema>;

export const serviceInputSchema = z
  .object({
    name: text(80).min(2, 'Informe o nome do serviço.'),
    description: optionalText(300),
    priceType: z.enum(['fixed', 'from', 'range', 'quote']),
    priceMin: z.number().min(0).max(1_000_000).nullable().default(null),
    priceMax: z.number().min(0).max(1_000_000).nullable().default(null),
    durationMinutes: z.number().int().min(5, 'Duração mínima de 5 minutos.').max(1440).nullable().default(null),
    bookable: z.boolean().default(false),
    notes: optionalText(200),
  })
  .superRefine((v, ctx) => {
    if ((v.priceType === 'fixed' || v.priceType === 'from' || v.priceType === 'range') && v.priceMin == null) {
      ctx.addIssue({ code: 'custom', path: ['priceMin'], message: 'Informe o valor.' });
    }
    if (v.priceType === 'range' && (v.priceMax == null || v.priceMin == null || v.priceMax < v.priceMin)) {
      ctx.addIssue({ code: 'custom', path: ['priceMax'], message: 'O valor máximo precisa ser maior que o mínimo.' });
    }
    if (v.bookable && !v.durationMinutes) {
      ctx.addIssue({ code: 'custom', path: ['durationMinutes'], message: 'Para aceitar agendamento, informe a duração.' });
    }
  });
export type ServiceInput = z.input<typeof serviceInputSchema>;

export const requestActionSchema = z.object({
  action: z.enum(['confirm', 'decline', 'answer', 'close']),
  message: z.string().trim().max(500, 'Use no máximo 500 caracteres.').optional(),
});

export const replySchema = z.object({
  body: z.string().trim().min(2, 'Escreva a resposta.').max(1000, 'Use no máximo 1000 caracteres.'),
});

export const imageUploadSchema = z.object({
  kind: z.enum(['logo', 'cover', 'photo']),
  /** data:image/jpeg;base64,... já redimensionada no navegador */
  dataUrl: z.string().regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, 'Imagem inválida.').max(800_000, 'Imagem muito grande.'),
});

export const adminBusinessUpdateSchema = z.object({
  status: z.enum(['active', 'suspended']),
  verified: z.boolean(),
  reason: z.string().trim().max(300).optional(),
});

export const PANEL_LIMITS = { maxServices: 40, maxPhotos: 12, maxBusinessesPerUser: 5 } as const;

export interface PanelBusinessDTO {
  id: string;
  slug: string;
  name: string;
  status: 'active' | 'suspended' | 'pending';
  suspendedReason: string | null;
  verifiedAt: string | null;
  isDemo: boolean;
  profile: {
    name: string; professionalName: string | null; categorySlug: string; shortDescription: string | null; description: string | null;
    cityIbge: number; neighborhood: string | null; street: string | null; postalCode: string | null; addressPublic: boolean;
    serviceAreaCities: number[]; modeInPerson: boolean; modeAtCustomer: boolean; modeOnline: boolean;
    phone: string | null; whatsapp: string | null; website: string | null; instagram: string | null; email: string | null;
    priceLevel: number | null; acceptsBooking: boolean; acceptsQuote: boolean;
  };
  logoUrl: string | null;
  coverUrl: string | null;
  photos: Array<{ id: string; url: string }>;
  openingHours: Record<string, Array<[string, string]>> | null;
  hoursUpdatedAt: string | null;
  services: Array<{ id: string; name: string; description: string | null; priceType: 'fixed' | 'from' | 'range' | 'quote'; priceMin: number | null; priceMax: number | null; durationMinutes: number | null; bookable: boolean; notes: string | null }>;
  stats: { reviewCount: number; average: number | null; pendingRequests: number; requestsReceived: number; requestsAnswered: number };
}

export interface PanelRequestDTO {
  id: string;
  type: 'booking' | 'quote';
  status: string;
  serviceName: string | null;
  startsAt: string | null;
  preferredDate: string | null;
  description: string | null;
  contactPreference: string | null;
  neighborhood: string | null;
  createdAt: string;
  businessResponse: string | null;
  customer: { name: string; email: string | null; phone: string | null } | null;
}

export interface PanelReviewDTO {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  serviceName: string | null;
  createdAt: string;
  reply: { body: string; createdAt: string } | null;
}
