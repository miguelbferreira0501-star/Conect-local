/**
 * Pataí: ficha do pet, repetição de agendamentos e "Pet ao Vivo".
 */
import { z } from 'zod';

const optText = (max: number, msg: string) =>
  z.string().trim().max(max, msg).optional().nullable().transform((v) => (v ? v : null));

export const PET_SPECIES = { dog: 'Cachorro', cat: 'Gato', other: 'Outro' } as const;
export type PetSpecies = keyof typeof PET_SPECIES;

export const PET_SIZES = { mini: 'Mini (até 4 kg)', small: 'Pequeno (até 10 kg)', medium: 'Médio (até 25 kg)', large: 'Grande (até 45 kg)', giant: 'Gigante (mais de 45 kg)' } as const;
export type PetSize = keyof typeof PET_SIZES;
export const PET_SIZE_SHORT: Record<PetSize, string> = { mini: 'Mini', small: 'Pequeno', medium: 'Médio', large: 'Grande', giant: 'Gigante' };

/** Etiquetas de comportamento: ajudam quem vai atender a se preparar. */
export const PET_TEMPERAMENTS = ['Calmo', 'Agitado', 'Medroso', 'Ansioso', 'Sociável com cães', 'Não gosta de outros cães', 'Morde quando assustado', 'Medo de secador', 'Idoso', 'Filhote'] as const;

export const petInputSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do pet.').max(40, 'Use no máximo 40 caracteres.'),
  species: z.enum(['dog', 'cat', 'other'], { errorMap: () => ({ message: 'Escolha a espécie.' }) }),
  breed: optText(60, 'Use no máximo 60 caracteres.'),
  size: z.enum(['mini', 'small', 'medium', 'large', 'giant']).optional().nullable().transform((v) => v ?? null),
  sex: z.enum(['male', 'female']).optional().nullable().transform((v) => v ?? null),
  birthYear: z.coerce.number().int().min(1990, 'Ano inválido.').max(new Date().getFullYear(), 'Ano inválido.').optional().nullable()
    .transform((v) => v ?? null),
  weightKg: z.coerce.number().positive('Peso inválido.').max(149, 'Peso inválido.').optional().nullable().transform((v) => v ?? null),
  temperament: z.array(z.enum(PET_TEMPERAMENTS)).max(10).default([]),
  healthNotes: optText(500, 'Use no máximo 500 caracteres.'),
  careNotes: optText(500, 'Use no máximo 500 caracteres.'),
  groomingNotes: optText(300, 'Use no máximo 300 caracteres.'),
  vaccinesUpToDate: z.boolean().optional().nullable().transform((v) => v ?? null),
});
export type PetInput = z.input<typeof petInputSchema>;
export type PetValues = z.output<typeof petInputSchema>;

export interface PetDTO {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  size: PetSize | null;
  sex: 'male' | 'female' | null;
  birthYear: number | null;
  weightKg: number | null;
  temperament: string[];
  healthNotes: string | null;
  careNotes: string | null;
  groomingNotes: string | null;
  vaccinesUpToDate: boolean | null;
  photoUrl: string | null;
}

export function petSummary(p: Pick<PetDTO, 'species' | 'breed' | 'size' | 'birthYear'>, now = new Date()): string {
  const parts: string[] = [p.breed || PET_SPECIES[p.species]];
  if (p.size) parts.push(PET_SIZE_SHORT[p.size]);
  if (p.birthYear) {
    const age = now.getFullYear() - p.birthYear;
    parts.push(age <= 0 ? 'menos de 1 ano' : `${age} ${age === 1 ? 'ano' : 'anos'}`);
  }
  return parts.join(' · ');
}

// ── Repetição ("toda semana nesse horário") ──
export const repeatSchema = z.object({
  everyWeeks: z.union([z.literal(1), z.literal(2), z.literal(4)]),
  count: z.coerce.number().int().min(2, 'Escolha pelo menos 2 vezes.').max(12, 'No máximo 12 vezes de uma vez.'),
});
export type RepeatInput = z.infer<typeof repeatSchema>;
export const REPEAT_OPTIONS = [
  { everyWeeks: 1, label: 'Toda semana' },
  { everyWeeks: 2, label: 'A cada 15 dias' },
  { everyWeeks: 4, label: 'A cada 4 semanas' },
] as const;

/** Datas das repetições (a primeira é o próprio horário escolhido). */
export function repeatDates(startsAt: Date, r: RepeatInput): Date[] {
  return Array.from({ length: r.count }, (_, i) => new Date(startsAt.getTime() + i * r.everyWeeks * 7 * 86_400_000));
}

// ── Pet ao Vivo ──
export const LIVE_STAGES = {
  checkin: { label: 'Chegou', emoji: '🐾' },
  bath: { label: 'No banho', emoji: '🛁' },
  drying: { label: 'Secando', emoji: '💨' },
  grooming: { label: 'Na tosa', emoji: '✂️' },
  ready: { label: 'Pronto para buscar', emoji: '✅' },
  walk_start: { label: 'Saiu para passear', emoji: '🦮' },
  walk_end: { label: 'Voltou do passeio', emoji: '🏠' },
  visit_start: { label: 'Chegou na sua casa', emoji: '🔑' },
  visit_end: { label: 'Visita concluída', emoji: '✅' },
  pickup: { label: 'Buscou o pet', emoji: '🚗' },
  dropoff: { label: 'Entregou o pet', emoji: '✅' },
  photo: { label: 'Foto', emoji: '📸' },
  done: { label: 'Atendimento concluído', emoji: '✅' },
} as const;
export type LiveStage = keyof typeof LIVE_STAGES;
export const LIVE_STAGE_IDS = Object.keys(LIVE_STAGES) as LiveStage[];

/** Etapas finais: concluem o atendimento (e liberam a avaliação do tutor). */
export const FINAL_LIVE_STAGES = new Set<LiveStage>(['ready', 'walk_end', 'visit_end', 'dropoff', 'done']);

/** Sequência de etapas sugerida para cada serviço (o botão "Foto" vale para todos). */
export const LIVE_FLOWS: Record<string, LiveStage[]> = {
  'banho-e-tosa': ['checkin', 'bath', 'drying', 'grooming', 'ready'],
  passeador: ['walk_start', 'walk_end'],
  'pet-sitter': ['visit_start', 'visit_end'],
  'hospedagem-e-creche': ['checkin', 'done'],
  adestramento: ['checkin', 'done'],
  'pet-taxi': ['pickup', 'dropoff'],
};
export const liveFlow = (categorySlug: string): LiveStage[] => LIVE_FLOWS[categorySlug] ?? ['checkin', 'done'];

/** Itens marcáveis em cada etapa (relatório do passeio, checklist da visita). */
export const LIVE_DETAILS = {
  pee: 'Fez xixi',
  poop: 'Fez cocô',
  food: 'Comida',
  water: 'Água fresca',
  litter: 'Caixinha limpa',
  meds: 'Remédio dado',
  play: 'Brincou',
} as const;
export type LiveDetail = keyof typeof LIVE_DETAILS;
export const LIVE_STAGE_DETAILS: Partial<Record<LiveStage, LiveDetail[]>> = {
  walk_end: ['pee', 'poop', 'water'],
  visit_end: ['food', 'water', 'litter', 'meds', 'play'],
};

export const liveUpdateSchema = z.object({
  stage: z.enum(LIVE_STAGE_IDS as [LiveStage, ...LiveStage[]]),
  note: z.string().trim().max(300, 'Use no máximo 300 caracteres.').optional().transform((v) => v || null),
  details: z.record(z.enum(Object.keys(LIVE_DETAILS) as [LiveDetail, ...LiveDetail[]]), z.boolean()).default({}),
  /** data:image/jpeg;base64,... já reduzida no navegador */
  photo: z.string().regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, 'Imagem inválida.').max(800_000, 'Imagem muito grande.').optional(),
});
export type LiveUpdateInput = z.input<typeof liveUpdateSchema>;

export interface LiveUpdateDTO {
  id: string;
  stage: LiveStage;
  note: string | null;
  details: Partial<Record<LiveDetail, boolean>>;
  photoUrl: string | null;
  createdAt: string;
}
