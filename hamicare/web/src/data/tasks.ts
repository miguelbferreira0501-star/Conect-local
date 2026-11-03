// Biblioteca de atividades. A pessoa monta a própria lista a partir daqui ou cria as suas.
import type { Category } from '../types';

export interface LibTask {
  id: string;
  title: string;
  emoji: string;
  cat: Category;
  /** 1 = cabe num dia difícil, 2 = dia normal, 3 = dia com energia. */
  energy: 1 | 2 | 3;
}

export const CATEGORIES: Record<Category, { label: string; emoji: string; desc: string }> = {
  fitness: { label: 'Movimento', emoji: '🏃', desc: 'Atividade física no seu ritmo' },
  autocuidado: { label: 'Autocuidado', emoji: '🛁', desc: 'Cuidar do corpo e do espaço' },
  habitos: { label: 'Hábitos saudáveis', emoji: '💧', desc: 'Água, sono, comida e pausas' },
  emocional: { label: 'Bem-estar emocional', emoji: '💛', desc: 'Cuidar da cabeça e do coração' },
};

export const CAT_ORDER: Category[] = ['fitness', 'autocuidado', 'habitos', 'emocional'];

export const LIBRARY: LibTask[] = [
  { id: 'caminhada', title: 'Caminhar 15 minutos', emoji: '🚶', cat: 'fitness', energy: 2 },
  { id: 'corrida', title: 'Corrida leve (no seu ritmo)', emoji: '🏃', cat: 'fitness', energy: 3 },
  { id: 'alongar', title: 'Alongar o corpo', emoji: '🙆', cat: 'fitness', energy: 1 },
  { id: 'bike', title: 'Andar de bicicleta', emoji: '🚲', cat: 'fitness', energy: 3 },
  { id: 'casa', title: 'Exercícios em casa (10 min)', emoji: '🤸', cat: 'fitness', energy: 2 },
  { id: 'academia', title: 'Ir à academia', emoji: '🏋️', cat: 'fitness', energy: 3 },
  { id: 'danca', title: 'Dançar uma música inteira', emoji: '💃', cat: 'fitness', energy: 2 },
  { id: 'mobilidade', title: 'Mobilidade e postura (5 min)', emoji: '🧘', cat: 'fitness', energy: 1 },
  { id: 'esporte', title: 'Jogar um esporte', emoji: '⚽', cat: 'fitness', energy: 3 },
  { id: 'escada', title: 'Subir escadas em vez do elevador', emoji: '🪜', cat: 'fitness', energy: 2 },
  { id: 'banho', title: 'Tomar banho (banho rápido vale!)', emoji: '🚿', cat: 'autocuidado', energy: 2 },
  { id: 'pele', title: 'Cuidar da pele', emoji: '🧴', cat: 'autocuidado', energy: 1 },
  { id: 'dentes', title: 'Escovar os dentes', emoji: '🪥', cat: 'autocuidado', energy: 1 },
  { id: 'quarto', title: 'Organizar o quarto', emoji: '🧹', cat: 'autocuidado', energy: 3 },
  { id: 'cama-arrumar', title: 'Arrumar só a cama', emoji: '🛏️', cat: 'autocuidado', energy: 1 },
  { id: 'descansar', title: 'Descansar sem culpa (15 min)', emoji: '🛋️', cat: 'autocuidado', energy: 1 },
  { id: 'pausa', title: 'Fazer uma pausa longe da tela', emoji: '📵', cat: 'autocuidado', energy: 1 },
  { id: 'agua', title: 'Beber um copo d’água', emoji: '💧', cat: 'habitos', energy: 1 },
  { id: 'garrafa', title: 'Beber 1 garrafa de água no dia', emoji: '🥤', cat: 'habitos', energy: 2 },
  { id: 'sono', title: 'Ir dormir no horário', emoji: '🌙', cat: 'habitos', energy: 2 },
  { id: 'refeicao', title: 'Fazer uma refeição equilibrada', emoji: '🥗', cat: 'habitos', energy: 2 },
  { id: 'fruta', title: 'Comer uma fruta', emoji: '🍎', cat: 'habitos', energy: 1 },
  { id: 'levantar', title: 'Levantar e andar um pouco a cada hora', emoji: '⏰', cat: 'habitos', energy: 2 },
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
