// Configuração do jogo do HamiCare: níveis, XP, limites, arenas, raridades e baús.
// Tudo aqui é editável (o painel de administração grava uma versão nova no servidor).
// O app e o servidor usam as mesmas regras.

export type Rarity = 'comum' | 'incomum' | 'raro' | 'epico' | 'lendario';
export const RARITY_ORDER: Rarity[] = ['comum', 'incomum', 'raro', 'epico', 'lendario'];
export const rarityRank = (r: Rarity) => RARITY_ORDER.indexOf(r);

export type ChestId = 'madeira' | 'prata' | 'ouro' | 'magico' | 'lendario';
export const CHEST_ORDER: ChestId[] = ['madeira', 'prata', 'ouro', 'magico', 'lendario'];

export type TaskCat = 'fitness' | 'autocuidado' | 'habitos' | 'emocional';

export interface ArenaDef {
  n: number;
  /** Nível em que a arena abre. */
  level: number;
  id: string;
  name: string;
  desc: string;
  /** Lugar do Mundo ligado a esta arena (aventuras). */
  place?: string;
  /** Cores do cenário (céu e chão) para mapas e prévias. */
  colors: [string, string];
  reward: { coins: number; chest?: ChestId; items?: string[] };
}

export interface ChestDef {
  name: string;
  price: number;
  /** Chance de cada raridade, em %. Soma 100. */
  odds: Record<Rarity, number>;
}

export interface GameConfig {
  version: number;
  levels: {
    /** XP para passar do nível 1 para o 2, do 2 para o 3… (o resto cresce pelo `growth`). */
    first: number[];
    growth: number;
  };
  /** Prêmio por subir de nível (sementes = base + porNivel × nível). */
  levelUp: { base: number; perLevel: number };
  task: {
    /** XP e sementes por energia da missão (1 leve, 2 normal, 3 puxada). */
    xp: [number, number, number];
    coins: [number, number, number];
    /** XP próprio de algumas missões da biblioteca. */
    xpById: Record<string, number>;
  };
  small: Record<'cuidado' | 'diario' | 'pote' | 'humor' | 'bemestar', { xp: number; coins: number }>;
  quest: Record<'dia' | 'semana' | 'mes', { xp: number; coins: number }>;
  achievementXp: number;
  caps: {
    /** Teto do dia para a rotina (missões, cuidados, diário, humor, bem-estar). */
    day: { xp: number; coins: number };
    /** Quantas missões contam por dia. */
    tasks: number;
    /** Teto de XP por categoria de missão no dia (movimento tem teto para não incentivar exagero). */
    category: Record<TaskCat, number>;
    /** Teto de XP de aventuras no dia. */
    adventureXp: number;
  };
  arenas: ArenaDef[];
  rarities: Record<Rarity, { label: string; color: string; fragments: number; craft: number }>;
  chests: Record<ChestId, ChestDef>;
  pity: {
    /** Depois de tantos baús seguidos sem item raro ou melhor, o próximo garante raro ou melhor. */
    rareAfter: number;
    /** A partir de quantos baús sem raro a chance de raro começa a subir. */
    softFrom: number;
    /** Quanto a chance de raro sobe a cada baú (em pontos percentuais). */
    softStep: number;
    /** Depois de tantos baús sem lendário, o próximo garante lendário. */
    legendaryAfter: number;
  };
}

export const DEFAULT_GAME: GameConfig = {
  version: 1,
  levels: { first: [100, 150, 220, 300, 450, 700, 1000, 1450, 2000, 2700, 3500], growth: 1.1 },
  levelUp: { base: 10, perLevel: 5 },
  task: {
    xp: [5, 10, 15],
    coins: [3, 5, 8],
    xpById: { alongar: 10, caminhada: 15, mobilidade: 10, yoga: 10, meditar: 10, aterrar: 10 },
  },
  small: {
    cuidado: { xp: 2, coins: 1 },
    diario: { xp: 10, coins: 3 },
    pote: { xp: 5, coins: 2 },
    humor: { xp: 5, coins: 1 },
    bemestar: { xp: 5, coins: 2 },
  },
  quest: { dia: { xp: 20, coins: 5 }, semana: { xp: 50, coins: 30 }, mes: { xp: 100, coins: 100 } },
  achievementXp: 100,
  caps: {
    day: { xp: 100, coins: 45 },
    tasks: 12,
    category: { fitness: 45, autocuidado: 40, habitos: 40, emocional: 40 },
    adventureXp: 60,
  },
  arenas: [
    { n: 1, level: 1, id: 'casinha', name: 'Casinha Inicial', desc: 'Uma casinha aconchegante com jardim simples. Onde tudo começa.', place: 'parque', colors: ['#CFEFFF', '#9BD88A'], reward: { coins: 0 } },
    { n: 2, level: 2, id: 'jardim', name: 'Jardim Encantado', desc: 'Casa rodeada de flores, bichinhos e móveis de galho.', place: 'jardim', colors: ['#D9F5C9', '#7FCB8E'], reward: { coins: 40, chest: 'madeira' } },
    { n: 3, level: 3, id: 'vila', name: 'Vila Aconchegante', desc: 'Uma vila de madeira com cafeteria na esquina.', place: 'cafeteria', colors: ['#FCE8D2', '#C9A27A'], reward: { coins: 50, chest: 'madeira' } },
    { n: 4, level: 4, id: 'floresta', name: 'Refúgio na Floresta', desc: 'Casa entre árvores altas, cogumelos e um lago calmo.', place: 'floresta', colors: ['#CFEBD2', '#4F9A63'], reward: { coins: 60, chest: 'prata' } },
    { n: 5, level: 5, id: 'tropical', name: 'Paraíso Tropical', desc: 'Casa na praia, com palmeiras e uma lagoa azul.', place: 'praia', colors: ['#BFEAFF', '#FFE2A3'], reward: { coins: 80, chest: 'prata' } },
    { n: 6, level: 6, id: 'neve', name: 'Montanhas Nevadas', desc: 'Chalé com lareira no meio da neve.', place: 'vila-inverno', colors: ['#E3EEFF', '#FFFFFF'], reward: { coins: 90, chest: 'prata' } },
    { n: 7, level: 7, id: 'cidade', name: 'Cidade Moderna', desc: 'Apartamento estiloso com luzes da cidade.', place: 'cidade', colors: ['#C9D6F2', '#8E9BB8'], reward: { coins: 100, chest: 'ouro' } },
    { n: 8, level: 8, id: 'mar', name: 'Fundo do Mar', desc: 'Uma bolha de vidro entre corais e peixinhos.', colors: ['#7FD3E8', '#2F7FB8'], reward: { coins: 120, chest: 'ouro' } },
    { n: 9, level: 9, id: 'sonhos', name: 'Reino dos Sonhos', desc: 'Nuvens de algodão, arco-íris e coisas que brilham.', colors: ['#F2D9FF', '#FFC9E8'], reward: { coins: 140, chest: 'ouro' } },
    { n: 10, level: 10, id: 'castelo', name: 'Castelo Encantado', desc: 'Um castelo só seu, com salões e jardins reais.', place: 'castelo', colors: ['#E9DDFF', '#A98DDF'], reward: { coins: 160, chest: 'magico' } },
    { n: 11, level: 11, id: 'espaco', name: 'Estação Espacial', desc: 'Uma casa entre planetas, com vista para as estrelas.', place: 'espaco', colors: ['#2A2F6B', '#6B4FA8'], reward: { coins: 180, chest: 'magico' } },
    { n: 12, level: 12, id: 'celeste', name: 'Ilha Celestial', desc: 'Uma ilha flutuando acima das nuvens. O topo da jornada.', colors: ['#FFF3C9', '#BFE6FF'], reward: { coins: 250, chest: 'lendario' } },
  ],
  rarities: {
    comum: { label: 'Comum', color: '#9AA6B5', fragments: 5, craft: 25 },
    incomum: { label: 'Incomum', color: '#4CB86A', fragments: 12, craft: 60 },
    raro: { label: 'Raro', color: '#3D8BEB', fragments: 30, craft: 150 },
    epico: { label: 'Épico', color: '#9A5BE8', fragments: 75, craft: 375 },
    lendario: { label: 'Lendário', color: '#F2A516', fragments: 200, craft: 1000 },
  },
  chests: {
    madeira: { name: 'Baú de Madeira', price: 100, odds: { comum: 72, incomum: 23, raro: 5, epico: 0, lendario: 0 } },
    prata: { name: 'Baú de Prata', price: 300, odds: { comum: 40, incomum: 42, raro: 15, epico: 3, lendario: 0 } },
    ouro: { name: 'Baú de Ouro', price: 700, odds: { comum: 0, incomum: 50, raro: 38, epico: 10, lendario: 2 } },
    magico: { name: 'Baú Mágico', price: 1500, odds: { comum: 0, incomum: 0, raro: 60, epico: 33, lendario: 7 } },
    lendario: { name: 'Baú Lendário', price: 3000, odds: { comum: 0, incomum: 0, raro: 0, epico: 50, lendario: 50 } },
  },
  pity: { rareAfter: 8, softFrom: 5, softStep: 6, legendaryAfter: 40 },
};
