/**
 * Categorias iniciais. São carregadas no banco (tabela categories) pelo seed;
 * o app sempre lê as categorias da API, então novas categorias podem ser
 * adicionadas sem alterar código de interface.
 *
 * `icon` é o nome de um ícone do conjunto Lucide (mapeado no front-end).
 * `keywords` alimentam a busca ("eletricista" → Reformas e manutenção).
 */
export interface CategoryDefinition {
  slug: string;
  name: string;
  shortName: string;
  icon: string;
  description: string;
  keywords: string[];
}

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    slug: 'banho-e-tosa',
    name: 'Banho e tosa',
    shortName: 'Banho e tosa',
    icon: 'Bath',
    description: 'Pet shops e profissionais de banho, tosa, hidratação e estética animal.',
    keywords: ['banho', 'tosa', 'banho e tosa', 'pet shop', 'petshop', 'tosa higiênica', 'tosa na tesoura', 'tosa bebê', 'hidratação', 'escovação', 'corte de unhas', 'cachorro', 'cão', 'gato', 'estética animal', 'groomer'],
  },
  {
    slug: 'passeador',
    name: 'Passeador de cães',
    shortName: 'Passeador',
    icon: 'Footprints',
    description: 'Passeios avulsos ou toda semana, sozinho ou em grupo, com relatório do passeio.',
    keywords: ['passeador', 'passeio', 'dog walker', 'passear com cachorro', 'passeio de cachorro', 'caminhada', 'cão', 'cachorro'],
  },
  {
    slug: 'pet-sitter',
    name: 'Pet sitter (cuidado em casa)',
    shortName: 'Pet sitter',
    icon: 'HeartHandshake',
    description: 'Visitas na sua casa para alimentar, brincar e cuidar do pet enquanto você viaja ou trabalha.',
    keywords: ['pet sitter', 'cuidador', 'cuidadora', 'cuidar do gato', 'cuidar do cachorro', 'visita', 'viagem', 'babá de pet', 'gato', 'cão', 'cachorro'],
  },
  {
    slug: 'hospedagem-e-creche',
    name: 'Hospedagem e creche',
    shortName: 'Hospedagem',
    icon: 'BedDouble',
    description: 'Hotelzinho, hospedagem domiciliar e creche (day care) para cães e gatos.',
    keywords: ['hospedagem', 'hotel', 'hotelzinho', 'hotel para cães', 'creche', 'day care', 'daycare', 'creche canina', 'hospedagem de gato'],
  },
  {
    slug: 'adestramento',
    name: 'Adestramento',
    shortName: 'Adestramento',
    icon: 'Award',
    description: 'Adestradores para obediência, comportamento e socialização, em casa ou no centro de treinamento.',
    keywords: ['adestrador', 'adestramento', 'comportamento', 'obediência', 'socialização', 'filhote', 'treinamento'],
  },
  {
    slug: 'pet-taxi',
    name: 'Táxi dog (leva e traz)',
    shortName: 'Táxi dog',
    icon: 'Car',
    description: 'Transporte seguro do pet para o banho, veterinário, hotel ou aeroporto.',
    keywords: ['táxi dog', 'taxi dog', 'pet táxi', 'leva e traz', 'transporte de pet', 'transporte'],
  },
];

/** Categorias de versões anteriores: ficam no banco (inativas) para não quebrar cadastros antigos. */
export const RETIRED_CATEGORY_SLUGS = ['restaurantes', 'estetica-e-beleza', 'automotivo', 'pet', 'tatuagem-e-piercing', 'esportes', 'limpeza', 'fotografia', 'espacos-para-eventos', 'reformas-e-manutencao', 'servicos-para-casa', 'informatica', 'outros-servicos'];
