// Tipos centrais do HamiCare (estado salvo no aparelho e no backup da conta).

export type AgeGroup = 'ate12' | '13a17' | '18mais';
/** Missão principal. emagrecer/ganhar/manter mexem no peso do Hami (só 18+). */
export type GoalId = 'emagrecer' | 'ganhar' | 'manter' | 'habitos' | 'calma' | 'condicionamento' | 'ativo' | 'cuidar';
/** Para onde o peso do Hami vai na jornada. */
export type Direction = 'perder' | 'ganhar' | 'manter';
export type BodyStart = 'fofinho' | 'equilibrado' | 'mignon';
export type Category = 'fitness' | 'autocuidado' | 'habitos' | 'emocional';
export type Mood = 1 | 2 | 3 | 4 | 5;
export type Battery = 1 | 2 | 3;
export type Incentive = 'carinho' | 'conquistas' | 'desafios' | 'calma';
export type TraitId = 'curioso' | 'carinhoso' | 'brincalhao' | 'sonhador' | 'corajoso';
export type ThemePref = 'auto' | 'claro' | 'escuro';
export type CareId = 'carinho' | 'comida' | 'banho' | 'brincar' | 'escovar' | 'dormir' | 'conversar' | 'foto';
export type WearSlot = 'chapeu' | 'oculos' | 'roupa' | 'acessorio' | 'efeito';

export type Freq = { kind: 'diaria' } | { kind: 'dias'; days: number[] } | { kind: 'hoje'; date: string };

export interface Task {
  id: string;
  title: string;
  emoji: string;
  cat: Category;
  freq: Freq;
  reward: number;
  createdAt: string;
  /** 1 = cabe num dia difícil. Tarefas 2 e 3 somem no modo dia difícil. */
  energy: 1 | 2 | 3;
  /** Gasto estimado: intensidade (MET) e minutos. */
  met?: number;
  min?: number;
  /** Calorias economizadas numa troca saudável (para quem quer emagrecer). */
  swap?: number;
  /** Calorias a mais de um lanche nutritivo (para quem quer ganhar peso). */
  gain?: number;
}

export interface DayLog {
  /** id da tarefa → categoria no momento em que foi feita. */
  done: Record<string, Category>;
  mood?: Mood;
  emotions?: string[];
  battery?: Battery;
  /** Dia de descanso marcado pela pessoa. */
  rest?: boolean;
  /** Dia consertado com o martelinho: não quebra a ofensiva (e não conta como dia ativo). */
  repaired?: boolean;
  care: CareId[];
  /** Outros acontecimentos do dia: 'diario', 'pote', 'vibe', 'aventura', 'respirar'… */
  events?: string[];
  /** Copos de água do dia. */
  water?: number;
  /** id da tarefa → calorias da jornada que ela contou (para desfazer certinho). */
  kcal?: Record<string, number>;
  /** Cardápio do dia: o que a pessoa vai comer (privado, nunca compartilhado). */
  meals?: MealEntry[];
}

export interface MealEntry {
  id: string;
  meal: 'cafe' | 'almoco' | 'lanche' | 'jantar' | 'ceia';
  name: string;
  qty: string;
  kcal: number;
  eaten: boolean;
}

/** Jornada de peso do Hami: ele emagrece ou ganha peso junto com a pessoa. */
export interface Journey {
  dir: Direction;
  startedAt: string;
  /** Peso do Hami no começo e na meta (gramas de hamster). */
  startGrams: number;
  goalGrams: number;
  /** Calorias que a pessoa precisa somar nas missões para chegar à meta. */
  needKcal: number;
  reachedAt: string | null;
}

export interface Outfit {
  chapeu: string | null;
  oculos: string | null;
  roupa: string | null;
  acessorio: string | null;
  /** Brilhos, corações, aura… em volta do Hami. */
  efeito?: string | null;
}

export interface PetStats {
  felicidade: number;
  energia: number;
  saciedade: number;
  limpeza: number;
}

export interface PetState {
  name: string;
  fur: string;
  trait: TraitId;
  body: BodyStart;
  grams: number;
  startGrams: number;
  lastWeighIn: string;
  weighIns: { date: string; grams: number }[];
  /** Maior fase alcançada (0 a 3). Nunca diminui. */
  phase: number;
  /** Maior fase de crescimento já comemorada (logic/growth.ts). */
  growStage?: number;
  stats: PetStats;
  statsAt: number;
  sleeping: boolean;
  outfit: Outfit;
  facts: string[];
}

export interface BodyData {
  tracking: boolean;
  sync: boolean;
  consentAt: string | null;
  heightCm: number | null;
  logs: { date: string; kg: number }[];
  baselineKg: number | null;
  goalKg: number | null;
  goalWeeks: number | null;
  hideNumbers: boolean;
}

export interface Profile {
  name: string;
  ageGroup: AgeGroup;
  goal: GoalId;
  focus: Category[];
  minutes: number;
  likes: string[];
  incentive: Incentive;
  feeling: Mood;
}

export interface HouseItem {
  uid: string;
  itemId: string;
  /** Posição em % da largura e da altura do cômodo. */
  x: number;
  y: number;
  z: number;
}

export interface House {
  wallpaper: string;
  floor: string;
  items: HouseItem[];
}

export interface Adventure {
  placeId: string;
  missionId: string;
  startedAt: number;
  endsAt: number;
}

export interface PetSnap {
  fur: string;
  grams: number;
  phase: number;
  outfit: Outfit;
  mood: PetMood;
}

export type PetMood = 'feliz' | 'calmo' | 'sono' | 'animado' | 'dormindo' | 'comendo' | 'risada' | 'boca' | 'surpreso';

export interface CompanionState {
  /** Ovos e pets: quando o ovo chegou e quando chocou. */
  got: Record<string, { at: string; hatched?: string }>;
  /** Quem anda junto com o Hami agora. */
  active: string | null;
}

export interface Photo {
  id: string;
  date: string;
  caption: string;
  snap: PetSnap;
  scene: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  text: string;
  prompt?: string;
}

export interface JarNote {
  id: string;
  text: string;
  date: string;
}

export type NotifKind = 'agua' | 'hami' | 'tarefas' | 'pausa' | 'dormir' | 'aventura' | 'missoes' | 'amigos';

export interface Settings {
  theme: ThemePref;
  accent: string;
  /** Lembretes: horário das missões, plano de água e hora de dormir. */
  notif: { enabled: boolean; time: string; kinds: Record<NotifKind, boolean>; water?: 'pouco' | 'normal' | 'muito'; bedtime?: string };
  sound: boolean;
  /** Volume dos efeitos sonoros. */
  volume?: 'baixo' | 'medio' | 'alto';
  /** Meta de água por dia, em copinhos de 250 ml (4 = 1 litro), escolhida pela pessoa em litros. */
  waterGoal?: number;
  /** Meta de missões por dia (escolhida pela pessoa). */
  dayGoal?: number;
}

/** Economia do jogo guardada no aparelho (com conta, o servidor confere e manda os valores certos). */
export interface GameState {
  /** Uso de cada dia (limites de XP e sementes); só os últimos dias. */
  usage: Record<string, import('./shared/game').DayUsage>;
  /** Ganhos já pagos (referência → quanto), para não pagar duas vezes e devolver certinho. */
  paid: Record<string, { xp: number; coins: number }>;
  /** Carteira: últimos movimentos de sementes e XP. */
  ledger: import('./shared/game').LedgerEntry[];
  fragments: number;
  pity: import('./shared/game').Pity;
  /** Baús grátis esperando para abrir (prêmio de arena). */
  pendingChests: import('./shared/game').ChestId[];
  /** Maior nível já alcançado (nível nunca cai). */
  maxLevel: number;
  /** Baú revelado (menores de 18, sem conta): o item que cada baú vai dar, mostrado antes da compra. */
  offers?: Partial<Record<import('./shared/game').ChestId, { itemId: string; rarity: import('./shared/game').Rarity; pity: import('./shared/game').Pity }>>;
}

/** De onde veio um item (para o inventário). */
export type ItemOrigin = 'loja' | 'bau' | 'arena' | 'oficina' | 'presente' | 'inicio';
export interface ItemMeta {
  at: number;
  from: ItemOrigin;
  /** Já foi visto no inventário (some o selo "Novo"). */
  seen?: boolean;
}

export interface State {
  v: 2;
  seed: number;
  createdAt: string;
  onboarded: boolean;
  profile: Profile;
  pet: PetState;
  body: BodyData;
  coins: number;
  xp: number;
  tasks: Task[];
  days: Record<string, DayLog>;
  journal: JournalEntry[];
  jar: JarNote[];
  /** id do item → quantidade (comidas são consumíveis; o resto é 1). */
  inventory: Record<string, number>;
  wishlist: string[];
  house: House;
  adventure: Adventure | null;
  /** Viagem do dia: o Hami sai andando depois de algumas missões e volta com um presente. */
  trek?: { startedAt: number; endsAt: number; day: string } | null;
  /** Cartões de lembrança das viagens: quantos de cada lugar. */
  trekCards?: Record<string, number>;
  /** Dia da última viagem (uma por dia). */
  trekDay?: string;
  /** Correio do Hami: cartas já lidas e cartas apagadas. */
  mail?: { read: string[]; gone: string[] };
  finds: string[];
  placesDone: Record<string, number>;
  achievements: Record<string, string>;
  claimed: Record<string, true>;
  photos: Photo[];
  settings: Settings;
  premium: { trialStart: string | null; until: string | null };
  /** ranking: aparecer no ranking dos amigos (padrão sim; dá para sair). */
  privacy: { requests: 'todos' | 'ninguem'; sharePhotos: boolean; ranking?: boolean };
  journey: Journey;
  /** Último dia em que a pessoa viu o cartão de boas-vindas. */
  welcomed: string | null;
  /** Bio do perfil público (passa pelo filtro de gentileza). */
  bio: string;
  /** Versão das preferências visuais (migração do tema padrão). */
  themeV?: number;
  /** Lista de missões já completada até o mínimo do plano (migração única). */
  missionsV?: number;
  /** Alimentos que a pessoa criou (para adicionar de novo rapidinho). */
  myFoods?: { name: string; qty: string; kcal: number }[];
  /** Referência diária de calorias escolhida pela pessoa (opcional). */
  mealRef?: number | null;
  lastGift: string | null;
  /** Economia do jogo (níveis, carteira, baús). */
  game: GameState;
  /** Arena onde o Hami mora (a casa principal). */
  homeArena?: number;
  /** As casas das outras arenas (a de agora fica em `house`). */
  houses?: Record<string, House>;
  /** Pets companheiros: um ovo por arena aberta; choca com dias de cuidado. */
  companions?: CompanionState;
  /** Comprou a casa na Lua (5.000 sementes). */
  moon?: boolean;
  /** Martelinhos para consertar a ofensiva (ganha 1 a cada 7 dias seguidos; até 3). */
  hammers?: number;
  /** Mês (AAAA-MM) em que o martelinho grátis do HamiCare+ já foi entregue. */
  plusHammerMonth?: string;
  /** Turno ("AAAA-MM-DD:n") em que uma missão foi feita: libera a missão rápida "complete uma meta". */
  quickMetaAt?: string;
  /** Quando e de onde veio cada item. */
  itemMeta?: Record<string, ItemMeta>;
  /** Curva de níveis nova aplicada (o XP antigo foi convertido sem perder nível). */
  xpV?: number;
  updatedAt: number;
  /** Veio do app antigo (Xodó): o onboarding mostra uma mensagem de boas-vindas. */
  from?: 'xodo';
}
