// Biblioteca de missões: só hábitos saudáveis (movimento, água, sono, pausas, cuidado).
// Comida não entra aqui: fica no Cardápio de hoje, no Início.
import type { Category } from '../types';

export interface LibTask {
  id: string;
  title: string;
  emoji: string;
  cat: Category;
  /** 1 = cabe num dia difícil, 2 = dia normal, 3 = dia com energia. */
  energy: 1 | 2 | 3;
  /** Movimento: intensidade (MET) e minutos, para estimar o gasto. */
  met?: number;
  min?: number;
  /** Calorias ligadas ao hábito (água, sono) para quem quer emagrecer. */
  swap?: number;
  /** Não usado nas missões: comida fica no Cardápio. */
  gain?: number;
  /** De onde vem a estimativa, em palavras simples. */
  why?: string;
  /** Para qual jornada esta missão foi pensada (aparece primeiro na lista). */
  for?: ('perder' | 'ganhar')[];
}

export const CATEGORIES: Record<Category, { label: string; emoji: string; desc: string }> = {
  fitness: { label: 'Movimento', emoji: '🏃', desc: 'Atividade física no seu ritmo' },
  autocuidado: { label: 'Autocuidado', emoji: '🛁', desc: 'Cuidar do corpo e do espaço' },
  habitos: { label: 'Hábitos saudáveis', emoji: '💧', desc: 'Água, sono e pausas' },
  emocional: { label: 'Bem-estar emocional', emoji: '💛', desc: 'Cuidar da cabeça e do coração' },
};

export const CAT_ORDER: Category[] = ['fitness', 'autocuidado', 'habitos', 'emocional'];

export const LIBRARY: LibTask[] = [
  { id: 'caminhada', title: 'Caminhar 15 minutos', emoji: '🚶', cat: 'fitness', energy: 2, met: 3.5, min: 15, why: 'Caminhada em ritmo normal', for: ['perder'] },
  { id: 'corrida', title: 'Corrida leve (20 min, no seu ritmo)', emoji: '🏃', cat: 'fitness', energy: 3, met: 7, min: 20, why: 'Trote leve', for: ['perder'] },
  { id: 'alongar', title: 'Alongar o corpo (10 min)', emoji: '🙆', cat: 'fitness', energy: 1, met: 2.3, min: 10, why: 'Alongamento' },
  { id: 'bike', title: 'Andar de bicicleta (20 min)', emoji: '🚲', cat: 'fitness', energy: 3, met: 6.8, min: 20, why: 'Pedal moderado', for: ['perder'] },
  { id: 'casa', title: 'Exercícios em casa (10 min)', emoji: '🤸', cat: 'fitness', energy: 2, met: 4.5, min: 10, why: 'Polichinelo, agachamento e afins' },
  { id: 'forca', title: 'Treino de força (20 min)', emoji: '🏋️', cat: 'fitness', energy: 3, met: 5, min: 20, why: 'Ajuda a ganhar massa magra', for: ['ganhar'] },
  { id: 'academia', title: 'Ir à academia', emoji: '💪', cat: 'fitness', energy: 3, met: 5, min: 45, why: 'Treino de 45 minutos', for: ['ganhar'] },
  { id: 'passos', title: 'Dar 5 mil passos no dia', emoji: '👟', cat: 'fitness', energy: 2, met: 3.5, min: 50, why: 'Uns 50 minutos andando, somando o dia todo', for: ['perder'] },
  { id: 'yoga', title: 'Yoga ou pilates (15 min)', emoji: '🧘\u200d♀️', cat: 'fitness', energy: 1, met: 2.8, min: 15, why: 'Alongamento com respiração' },
  { id: 'danca', title: 'Dançar 3 músicas (10 min)', emoji: '💃', cat: 'fitness', energy: 2, met: 5, min: 10, why: 'Dança animada' },
  { id: 'corda', title: 'Pular corda (5 min)', emoji: '🪢', cat: 'fitness', energy: 3, met: 11, min: 5, why: 'Intenso e rapidinho' },
  { id: 'mobilidade', title: 'Mobilidade e postura (5 min)', emoji: '🧘', cat: 'fitness', energy: 1, met: 2.5, min: 5, why: 'Movimentos leves' },
  { id: 'esporte', title: 'Jogar um esporte (40 min)', emoji: '⚽', cat: 'fitness', energy: 3, met: 7, min: 40, why: 'Futebol, vôlei, basquete…' },
  { id: 'escada', title: 'Subir escadas em vez do elevador', emoji: '🪜', cat: 'fitness', energy: 2, met: 6, min: 4, why: 'Uns 4 minutos de escada', for: ['perder'] },
  { id: 'banho', title: 'Tomar banho (banho rápido vale!)', emoji: '🚿', cat: 'autocuidado', energy: 2 },
  { id: 'pele', title: 'Cuidar da pele', emoji: '🧴', cat: 'autocuidado', energy: 1 },
  { id: 'dentes', title: 'Escovar os dentes', emoji: '🪥', cat: 'autocuidado', energy: 1 },
  { id: 'quarto', title: 'Organizar o quarto (20 min)', emoji: '🧹', cat: 'autocuidado', energy: 3, met: 3.3, min: 20, why: 'Arrumar a casa também mexe o corpo' },
  { id: 'cama-arrumar', title: 'Arrumar só a cama', emoji: '🛏️', cat: 'autocuidado', energy: 1 },
  { id: 'descansar', title: 'Descansar sem culpa (15 min)', emoji: '🛋️', cat: 'autocuidado', energy: 1 },
  { id: 'pausa', title: 'Fazer uma pausa longe da tela', emoji: '📵', cat: 'autocuidado', energy: 1 },
  { id: 'agua', title: 'Beber um copo d’água', emoji: '💧', cat: 'habitos', energy: 1, swap: 5, why: 'A água quase não queima calorias, mas ajuda o corpo e a fome' },
  { id: 'garrafa', title: 'Beber 1 garrafa de água no dia', emoji: '🚰', cat: 'habitos', energy: 2, swap: 15, why: 'Bem hidratado, o corpo funciona melhor' },
  { id: 'sono', title: 'Ir dormir no horário', emoji: '🌙', cat: 'habitos', energy: 2, swap: 30, why: 'Quem dorme bem tem menos fome de noite. Para ganhar massa, o corpo cresce descansando', for: ['ganhar'] },
  { id: 'agua-acordar', title: 'Beber água ao acordar', emoji: '🌅', cat: 'habitos', energy: 1, swap: 5, why: 'Começa o dia hidratado' },
  { id: 'levantar', title: 'Levantar e andar um pouco a cada hora', emoji: '⏰', cat: 'habitos', energy: 2, met: 3, min: 16, why: 'Umas 8 pausas de 2 minutos' },
  { id: 'sol', title: 'Pegar 10 minutos de sol', emoji: '☀️', cat: 'habitos', energy: 1 },
  { id: 'diario', title: 'Escrever no diário', emoji: '📔', cat: 'emocional', energy: 2 },
  { id: 'sentir', title: 'Registrar como estou me sentindo', emoji: '🫶', cat: 'emocional', energy: 1 },
  { id: 'gratidao', title: 'Guardar uma coisa boa no pote', emoji: '🌻', cat: 'emocional', energy: 1 },
  { id: 'gosto', title: 'Fazer algo de que eu gosto', emoji: '🎨', cat: 'emocional', energy: 2 },
  { id: 'conversar', title: 'Conversar com alguém', emoji: '💬', cat: 'emocional', energy: 2 },
  { id: 'respirar', title: 'Respirar com o Hami', emoji: '🌬️', cat: 'emocional', energy: 1 },
  { id: 'agradecer', title: 'Agradecer a mim mesmo por ter chegado até aqui', emoji: '💛', cat: 'emocional', energy: 1 },
];

export const libById = (id: string) => LIBRARY.find((t) => t.id === id);

/** Sementes por atividade: o pequeno também vale. */
export const rewardFor = (energy: 1 | 2 | 3) => (energy === 1 ? 3 : energy === 2 ? 5 : 8);

export const TASK_EMOJIS = ['⭐', '💧', '📚', '🧘', '🎨', '🐶', '🏃', '🍎', '💊', '🧹', '🎵', '💼', '🚲', '🧴', '🌱', '💌'];
