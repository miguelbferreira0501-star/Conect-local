// Tipos centrais do HamiCare (estado salvo no aparelho e no backup da conta).

export type AgeGroup = 'ate12' | '13a17' | '18mais';
export type GoalId = 'habitos' | 'condicionamento' | 'ativo' | 'peso' | 'equilibrio' | 'cuidar';
export type BodyStart = 'fofinho' | 'equilibrado' | 'mignon';
export type Category = 'fitness' | 'autocuidado' | 'habitos' | 'emocional';
export type Mood = 1 | 2 | 3 | 4 | 5;
export type Battery = 1 | 2 | 3;
export type Incentive = 'carinho' | 'conquistas' | 'desafios' | 'calma';
export type TraitId = 'curioso' | 'carinhoso' | 'brincalhao' | 'sonhador' | 'corajoso';
export type ThemePref = 'auto' | 'claro' | 'escuro';
export type CareId = 'carinho' | 'comida' | 'banho' | 'brincar' | 'escovar' | 'dormir' | 'conversar' | 'foto';
export type WearSlot = 'chapeu' | 'oculos' | 'roupa' | 'acessorio';

export type Freq = { kind: 'diaria' } | { kind: 'dias'; days: number[] } | { kind: 'hoje'; date: string };

export interface Task {
  id: string;
  title: string;
  emoji: string;
  cat: Category;
  freq: Freq;
  reward: number;
  createdAt: string;
}

export interface DayLog {
  /** id da tarefa → categoria no momento em que foi feita. */
  done: Record<string, Category>;
  mood?: Mood;
  emotions?: string[];
  battery?: Battery;
  /** Dia de descanso marcado pela pessoa. */
  rest?: boolean;
  care: CareId[];
  /** Outros acontecimentos do dia: 'diario', 'pote', 'vibe', 'aventura', 'respirar'… */
  events?: string[];
}

export interface Outfit {
  chapeu: string | null;
  oculos: string | null;
  roupa: string | null;
  acessorio: string | null;
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

export type PetMood = 'feliz' | 'calmo' | 'sono' | 'animado' | 'dormindo' | 'comendo';

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

export type NotifKind = 'tarefas' | 'hami' | 'missoes' | 'aventura' | 'amigos';

export interface Settings {
  theme: ThemePref;
  accent: string;
  notif: { enabled: boolean; time: string; kinds: Record<NotifKind, boolean> };
  sound: boolean;
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
  finds: string[];
  placesDone: Record<string, number>;
  achievements: Record<string, string>;
  claimed: Record<string, true>;
  photos: Photo[];
  settings: Settings;
  premium: { trialStart: string | null; until: string | null };
  privacy: { requests: 'todos' | 'ninguem'; sharePhotos: boolean };
  lastGift: string | null;
  updatedAt: number;
}
