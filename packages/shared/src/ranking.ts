/**
 * Classificação de empresas — regra documentada em docs/RANKING.md.
 *
 * Princípios:
 *  1. A nota média sozinha não decide a posição. Usamos média bayesiana:
 *     poucas avaliações "puxam" a nota para a média geral da plataforma.
 *  2. Volume, recência, consistência e completude do perfil também contam.
 *  3. Relevância textual e compatibilidade de localização multiplicam o resultado.
 *  4. Nenhum dado é inventado: empresa sem avaliações recebe apenas o "prior".
 *  5. Pagamento não altera esta pontuação. Patrocínio (futuro) é exibido separado.
 */

export const RANKING_PARAMS = {
  /** Peso do "prior": equivale a 10 avaliações imaginárias com a média geral. */
  priorWeight: 10,
  /** Média usada quando a plataforma ainda não tem avaliações suficientes. */
  fallbackGlobalMean: 3.8,
  weights: {
    quality: 0.5,
    volume: 0.15,
    recency: 0.1,
    consistency: 0.1,
    completeness: 0.15,
  },
  /** Volume satura em 200 avaliações (escala logarítmica) e é multiplicado pela qualidade. */
  volumeSaturation: 200,
  /** Recência: valor cai pela metade a cada 180 dias sem novas avaliações. */
  recencyHalfLifeDays: 180,
  /** Consistência só é calculada a partir de 3 avaliações. */
  consistencyMinReviews: 3,
  /** Empresas "novas": cadastradas há até 90 dias e com menos de 5 avaliações. */
  newcomerMaxDays: 90,
  newcomerMaxReviews: 5,
  /** Em "Mais relevantes", uma vaga de descoberta a cada 6 posições. */
  newcomerSlotEvery: 6,
  locationFactor: {
    establishmentInCity: 1,
    servesCity: 0.95,
    onlineOnly: 0.9,
  },
} as const;

export interface ReviewStats {
  count: number;
  average: number | null;
  stddev: number | null;
  lastReviewAt: string | Date | null;
}

export type LocationMatch = 'establishmentInCity' | 'servesCity' | 'onlineOnly';

export interface RankingInput {
  stats: ReviewStats;
  completeness: number;
  textRelevance: number;
  location: LocationMatch;
}

export interface RankingBreakdown {
  bayesianRating: number;
  quality: number;
  volume: number;
  recency: number;
  consistency: number;
  completeness: number;
  textRelevance: number;
  locationFactor: number;
  base: number;
  score: number;
}

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export function bayesianRating(stats: ReviewStats, globalMean: number): number {
  const m = RANKING_PARAMS.priorWeight;
  const n = stats.count;
  if (n === 0 || stats.average == null) return globalMean;
  return (n / (n + m)) * stats.average + (m / (n + m)) * globalMean;
}

export function rankBusiness(input: RankingInput, globalMean: number, now: Date = new Date()): RankingBreakdown {
  const { stats } = input;
  const p = RANKING_PARAMS;
  const bayes = bayesianRating(stats, globalMean);
  const quality = clamp((bayes - 1) / 4);
  const volume = clamp(Math.log1p(stats.count) / Math.log1p(p.volumeSaturation));
  let recency = 0;
  if (stats.count > 0 && stats.lastReviewAt) {
    const days = (now.getTime() - new Date(stats.lastReviewAt).getTime()) / 86_400_000;
    recency = clamp(Math.pow(0.5, Math.max(0, days) / p.recencyHalfLifeDays));
  }
  const consistency =
    stats.count >= p.consistencyMinReviews && stats.stddev != null ? clamp(1 - stats.stddev / 2) : 0;
  const completeness = clamp(input.completeness);
  const w = p.weights;
  // O volume reforça a qualidade (multiplicado por ela): muitas avaliações medianas não viram vantagem.
  const base =
    w.quality * quality + w.volume * volume * quality + w.recency * recency + w.consistency * consistency + w.completeness * completeness;
  const textFactor = 0.4 + 0.6 * clamp(input.textRelevance);
  const locationFactor = p.locationFactor[input.location];
  return {
    bayesianRating: bayes,
    quality,
    volume,
    recency,
    consistency,
    completeness,
    textRelevance: input.textRelevance,
    locationFactor,
    base,
    score: base * textFactor * locationFactor,
  };
}

export function isNewcomer(createdAt: string | Date, reviewCount: number, now: Date = new Date()): boolean {
  const days = (now.getTime() - new Date(createdAt).getTime()) / 86_400_000;
  return days <= RANKING_PARAMS.newcomerMaxDays && reviewCount < RANKING_PARAMS.newcomerMaxReviews;
}

/**
 * Garante espaço de descoberta para empresas novas sem tratá-las como
 * "melhores": a cada N posições, se houver uma empresa nova mais abaixo,
 * ela é trazida para essa vaga e marcada como "Nova na plataforma".
 */
export function interleaveNewcomers<T>(sorted: T[], isNew: (item: T) => boolean, every = RANKING_PARAMS.newcomerSlotEvery): T[] {
  const result: T[] = [];
  const pending = [...sorted];
  while (pending.length > 0) {
    const position = result.length + 1;
    if (position % every === 0) {
      const idx = pending.findIndex(isNew);
      if (idx > 0) {
        result.push(pending.splice(idx, 1)[0]);
        continue;
      }
    }
    result.push(pending.shift() as T);
  }
  return result;
}

/** Explicação em linguagem simples, exibida em "Por que aparece aqui?". */
export function explainRanking(b: RankingBreakdown, stats: ReviewStats): string[] {
  const lines: string[] = [];
  if (stats.count === 0) {
    lines.push('Ainda não tem avaliações. A posição considera apenas a relevância e as informações do perfil.');
  } else {
    lines.push(
      `Nota ajustada de ${b.bayesianRating.toFixed(2).replace('.', ',')}: combina a média de ${String(stats.average?.toFixed(1)).replace('.', ',')} com a quantidade de avaliações (${stats.count}).`,
    );
    if (b.recency >= 0.7) lines.push('Recebeu avaliações recentemente.');
    else if (b.recency < 0.3) lines.push('Não recebe avaliações há algum tempo.');
    if (stats.count >= RANKING_PARAMS.consistencyMinReviews) {
      lines.push(b.consistency >= 0.6 ? 'As notas são consistentes entre os clientes.' : 'As notas variam bastante entre os clientes.');
    }
  }
  lines.push(`Perfil ${Math.round(b.completeness * 100)}% completo.`);
  if (b.locationFactor < 1) {
    lines.push(b.locationFactor === RANKING_PARAMS.locationFactor.servesCity ? 'Atende a sua cidade, mas fica em outra.' : 'Atende on-line.');
  }
  lines.push('Empresas não pagam para mudar esta posição.');
  return lines;
}
