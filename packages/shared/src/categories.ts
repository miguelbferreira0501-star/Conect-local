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
    slug: 'estetica-e-beleza',
    name: 'Estética e beleza',
    shortName: 'Estética',
    icon: 'Sparkles',
    description: 'Clínicas de estética, salões, manicure, depilação e maquiagem.',
    keywords: ['estética', 'clínica de estética', 'salão de beleza', 'manicure', 'pedicure', 'depilação', 'maquiagem', 'sobrancelha', 'cílios', 'limpeza de pele', 'massagem', 'cabeleireiro', 'unhas'],
  },
  {
    slug: 'automotivo',
    name: 'Oficinas e serviços automotivos',
    shortName: 'Automotivo',
    icon: 'Car',
    description: 'Mecânica, funilaria, auto elétrica, lavagem e manutenção.',
    keywords: ['oficina', 'oficina mecânica', 'mecânico', 'mecânica', 'funilaria', 'pintura automotiva', 'lava-jato', 'lavagem', 'troca de óleo', 'alinhamento', 'balanceamento', 'auto elétrica', 'freio', 'carro', 'moto'],
  },
  {
    slug: 'pet',
    name: 'Pet shops e cuidados com animais',
    shortName: 'Pets',
    icon: 'PawPrint',
    description: 'Banho e tosa, veterinários, adestramento e hospedagem.',
    keywords: ['pet shop', 'banho e tosa', 'tosa', 'veterinário', 'veterinária', 'adestrador', 'adestramento', 'hotel para cães', 'creche canina', 'passeador', 'cachorro', 'gato'],
  },
  {
    slug: 'tatuagem-e-piercing',
    name: 'Tatuagem e piercing',
    shortName: 'Tatuagem',
    icon: 'PenTool',
    description: 'Estúdios de tatuagem, piercing e remoção.',
    keywords: ['tatuagem', 'tatuador', 'tattoo', 'piercing', 'estúdio de tatuagem', 'fine line', 'cobertura'],
  },
  {
    slug: 'esportes',
    name: 'Quadras e espaços esportivos',
    shortName: 'Esportes',
    icon: 'Trophy',
    description: 'Aluguel de quadras, campos society, beach tennis e padel.',
    keywords: ['quadra', 'futebol society', 'society', 'beach tennis', 'padel', 'tênis', 'vôlei', 'futsal', 'campo', 'aluguel de quadra'],
  },
  {
    slug: 'limpeza',
    name: 'Limpeza e conservação',
    shortName: 'Limpeza',
    icon: 'SprayCan',
    description: 'Limpeza residencial, pós-obra, higienização e dedetização.',
    keywords: ['limpeza residencial', 'limpeza', 'diarista', 'faxina', 'faxineira', 'pós-obra', 'higienização de sofá', 'higienização', 'dedetização', 'limpeza de caixa d’água', 'lavagem de estofados'],
  },
  {
    slug: 'fotografia',
    name: 'Fotografia e audiovisual',
    shortName: 'Fotografia',
    icon: 'Camera',
    description: 'Fotógrafos, filmagem, ensaios e eventos.',
    keywords: ['fotógrafo', 'fotografia', 'filmagem', 'vídeo', 'ensaio', 'ensaio fotográfico', 'casamento', 'drone', 'videomaker', 'book'],
  },
  {
    slug: 'espacos-para-eventos',
    name: 'Espaços para eventos',
    shortName: 'Eventos',
    icon: 'PartyPopper',
    description: 'Salões de festas, chácaras e espaços para casamentos.',
    keywords: ['salão para eventos', 'salão de festas', 'espaço para eventos', 'chácara', 'casamento', 'festa infantil', 'aniversário', 'formatura', 'buffet'],
  },
  {
    slug: 'reformas-e-manutencao',
    name: 'Reformas e manutenção residencial',
    shortName: 'Reformas',
    icon: 'Hammer',
    description: 'Eletricistas, encanadores, pedreiros, pintores e marceneiros.',
    keywords: ['eletricista', 'encanador', 'pedreiro', 'pintor', 'pintura', 'reforma', 'marceneiro', 'gesseiro', 'drywall', 'telhado', 'azulejista', 'manutenção residencial', 'instalação elétrica', 'vazamento'],
  },
  {
    slug: 'servicos-para-casa',
    name: 'Serviços para casa',
    shortName: 'Casa',
    icon: 'House',
    description: 'Chaveiro, montagem de móveis, ar-condicionado e mudanças.',
    keywords: ['chaveiro', 'montador de móveis', 'montagem de móveis', 'ar-condicionado', 'instalação de ar-condicionado', 'desentupidora', 'desentupimento', 'vidraceiro', 'mudança', 'frete', 'jardinagem', 'jardineiro', 'lavanderia'],
  },
  {
    slug: 'informatica',
    name: 'Informática e assistência técnica',
    shortName: 'Informática',
    icon: 'Laptop',
    description: 'Conserto de celulares, computadores, redes e impressoras.',
    keywords: ['assistência técnica', 'conserto de celular', 'celular', 'troca de tela', 'notebook', 'computador', 'formatação', 'informática', 'impressora', 'rede', 'wi-fi', 'videogame'],
  },
  {
    slug: 'outros-servicos',
    name: 'Outros serviços',
    shortName: 'Outros',
    icon: 'LayoutGrid',
    description: 'Aulas, costura, consertos e outros serviços.',
    keywords: ['aulas particulares', 'professor particular', 'costureira', 'costura', 'ajustes de roupa', 'sapateiro', 'consertos', 'contador', 'tradução'],
  },
];
