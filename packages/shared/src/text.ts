/** Utilitários de texto para busca tolerante a acentos e maiúsculas. */

const STOPWORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'pra', 'a', 'o', 'as', 'os', 'no', 'na', 'com', 'um', 'uma', 'perto', 'mim']);

export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** Remove um "s" final simples para aproximar plural/singular (fotógrafos → fotografo). */
function stem(token: string): string {
  if (token.length > 4 && token.endsWith('es')) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('s')) return token.slice(0, -1);
  return token;
}

export interface SearchableDocument {
  name: string;
  professionalName?: string | null;
  categoryName: string;
  categoryKeywords: string[];
  services: string[];
  neighborhood?: string | null;
  description?: string | null;
}

/**
 * Relevância textual entre 0 e 1.
 * Cada termo da busca recebe a melhor pontuação encontrada:
 *  - nome da empresa/profissional: 1.0
 *  - categoria ou palavra-chave da categoria: 0.85
 *  - nome de serviço: 0.8
 *  - bairro: 0.6
 *  - descrição: 0.4
 * A frase completa contida em nome, categoria ou serviço também conta.
 * Retorna 0 se algum termo não for encontrado em lugar nenhum (busca "E").
 */
export function textRelevance(query: string, doc: SearchableDocument): number {
  const tokens = tokenize(query).map(stem);
  if (tokens.length === 0) return 1;
  const fields: Array<[string, number]> = [
    [normalize(`${doc.name} ${doc.professionalName ?? ''}`), 1],
    [normalize([doc.categoryName, ...doc.categoryKeywords].join(' | ')), 0.85],
    [normalize(doc.services.join(' | ')), 0.8],
    [normalize(doc.neighborhood ?? ''), 0.6],
    [normalize(doc.description ?? ''), 0.4],
  ];
  let total = 0;
  for (const token of tokens) {
    let best = 0;
    for (const [field, weight] of fields) {
      if (weight > best && field.includes(token)) best = weight;
    }
    if (best === 0) return 0;
    total += best;
  }
  let score = total / tokens.length;
  const phrase = normalize(query);
  if (tokens.length > 1 && fields.slice(0, 3).some(([f]) => f.includes(phrase))) {
    score = Math.min(1, score + 0.1);
  }
  return score;
}
