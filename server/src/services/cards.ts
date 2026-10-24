/** Converte linhas do banco em DTOs públicos e calcula ranking/selos com as regras compartilhadas. */
import { RANKING_PARAMS } from '@conecta/shared';
import { businessesRepo } from '../repositories/businesses';

export { badgesOf, completenessOf, modesOf, scoreRows, toCard, type Scored } from '@conecta/shared';

let globalCache: { value: number; at: number } | null = null;

/** Média geral (prior bayesiano). Usa valor padrão até haver 50 avaliações na plataforma. */
export async function globalMean(): Promise<number> {
  if (globalCache && Date.now() - globalCache.at < 5 * 60_000) return globalCache.value;
  const s = await businessesRepo.globalStats();
  const value = s.n >= 50 && s.avg != null ? s.avg : RANKING_PARAMS.fallbackGlobalMean;
  globalCache = { value, at: Date.now() };
  return value;
}

