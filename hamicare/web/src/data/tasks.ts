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
  for?: ('perder' | 'ganhar' | 'habitos' | 'calma')[];
}

export const CATEGORIES: Record<Category, { label: string; emoji: string; desc: string }> = {
  fitness: { label: 'Movimento', emoji: '🏃', desc: 'Atividade física no seu ritmo' },
  autocuidado: { label: 'Autocuidado', emoji: '🛁', desc: 'Cuidar do corpo e do espaço' },
  habitos: { label: 'Hábitos saudáveis', emoji: '💧', desc: 'Água, sono e pausas' },
  emocional: { label: 'Bem-estar emocional', emoji: '💛', desc: 'Cuidar da cabeça e do coração' },
};

export const CAT_ORDER: Category[] = ['fitness', 'autocuidado', 'habitos', 'emocional'];

/** Áreas da vida (cartões ilustrados). Cada uma traz hábitos prontos para adicionar. Missões nunca têm comida. */
export type LifeArea = 'calma' | 'agua' | 'estudo' | 'movimento' | 'carinho' | 'sono' | 'alegria' | 'higiene' | 'casa' | 'saude';
export interface LifeAreaInfo {
  label: string;
  /** Cor do cartão (a mesma do fundo da ilustração). */
  tone: string;
  prop: string;
  tasks: string[];
  focus: Category[];
  desc: string;
  /** Pergunta da página da área ("Como você quer…?"). */
  ask: string;
}
export const LIFE_AREAS: Record<LifeArea, LifeAreaInfo> = {
  calma: { label: 'Calma', tone: '#B0EFC0', prop: '🕯️', tasks: ['respirar', 'meditar', 'sentir', 'diario', 'aterrar', 'preocupacao'], focus: ['emocional'], desc: 'Respirar, sentir e desacelerar', ask: 'Como você quer encontrar calma?' },
  agua: { label: 'Nutrição', tone: '#6FBF5F', prop: '💧', tasks: ['agua', 'agua-acordar', 'garrafa', 'garrafa-perto'], focus: ['habitos'], desc: 'Água ao longo do dia', ask: 'Como você quer se nutrir melhor?' },
  estudo: { label: 'Produtividade', tone: '#FCEBC0', prop: '📚', tasks: ['planejar', 'tarefa-chave', 'estudar', 'pausa', 'ler'], focus: ['habitos'], desc: 'Foco, pausas e organização', ask: 'Como você quer render mais, sem se cansar?' },
  movimento: { label: 'Movimento', tone: '#FBCB62', prop: '👟', tasks: ['caminhada', 'alongar', 'danca', 'yoga', 'mobilidade', 'levantar'], focus: ['fitness'], desc: 'Mexer o corpo do seu jeito', ask: 'Como você quer mexer o corpo?' },
  carinho: { label: 'Amor-próprio', tone: '#A86FDC', prop: '💛', tasks: ['agradecer', 'gentil-comigo', 'gosto', 'descansar', 'pausa'], focus: ['emocional'], desc: 'Gentileza consigo', ask: 'Como você quer cuidar de você com carinho?' },
  sono: { label: 'Sono', tone: '#3550B0', prop: '🌙', tasks: ['sono', 'sem-tela-noite', 'acordar-hora', 'descansar', 'musica'], focus: ['habitos'], desc: 'Dormir melhor e descansar', ask: 'Como você quer dormir melhor?' },
  alegria: { label: 'Gratidão', tone: '#F77CB1', prop: '🌻', tasks: ['gratidao', 'elogio', 'conversar', 'sol', 'natureza'], focus: ['emocional'], desc: 'Coisas boas e gente querida', ask: 'Como você quer praticar a gratidão?' },
  higiene: { label: 'Higiene', tone: '#6CD0C0', prop: '🛁', tasks: ['banho', 'dentes', 'pele', 'cama-arrumar', 'roupas', 'quarto'], focus: ['autocuidado'], desc: 'Banho, dentes e cantinho limpo', ask: 'Como você quer se cuidar no dia a dia?' },
  // Áreas antigas (quem escolheu continua com elas; não aparecem mais nos cartões).
  casa: { label: 'Casa em ordem', tone: '#9EE3A6', prop: '🧹', tasks: ['cama-arrumar', 'louca', 'roupas', 'quarto', 'plantas', 'lixo'], focus: ['autocuidado'], desc: 'Pequenas arrumações do dia', ask: 'Como você quer cuidar da sua casa?' },
  saude: { label: 'Saúde', tone: '#9EE3A6', prop: '💧', tasks: ['agua', 'dentes', 'alongar', 'sono', 'caminhada'], focus: ['fitness', 'habitos'], desc: 'Água, sono, corpo e movimento', ask: 'Como você quer cuidar da saúde?' },
};
export const LIFE_ORDER: LifeArea[] = ['calma', 'agua', 'estudo', 'movimento', 'carinho', 'sono', 'alegria', 'higiene'];

export const LIBRARY: LibTask[] = [
  { id: 'caminhada', title: 'Caminhar 15 minutos', emoji: '🚶', cat: 'fitness', energy: 2, met: 3.5, min: 15, why: 'Caminhada em ritmo normal', for: ['perder', 'habitos', 'calma'] },
  { id: 'corrida', title: 'Corrida leve (20 min, no seu ritmo)', emoji: '🏃', cat: 'fitness', energy: 3, met: 7, min: 20, why: 'Trote leve', for: ['perder'] },
  { id: 'alongar', title: 'Alongar o corpo (10 min)', emoji: '🙆', cat: 'fitness', energy: 1, met: 2.3, min: 10, why: 'Alongamento', for: ['habitos'] },
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
  { id: 'banho', title: 'Tomar banho (banho rápido vale!)', emoji: '🚿', cat: 'autocuidado', energy: 2, for: ['habitos'] },
  { id: 'pele', title: 'Cuidar da pele', emoji: '🧴', cat: 'autocuidado', energy: 1, for: ['habitos'] },
  { id: 'dentes', title: 'Escovar os dentes', emoji: '🪥', cat: 'autocuidado', energy: 1, for: ['habitos'] },
  { id: 'quarto', title: 'Organizar o quarto (20 min)', emoji: '🧹', cat: 'autocuidado', energy: 3, met: 3.3, min: 20, why: 'Arrumar a casa também mexe o corpo', for: ['habitos'] },
  { id: 'planejar', title: 'Planejar o dia em 3 passos', emoji: '📝', cat: 'habitos', energy: 1 },
  { id: 'tarefa-chave', title: 'Fazer a tarefa mais importante do dia', emoji: '⭐', cat: 'habitos', energy: 2 },
  { id: 'estudar', title: 'Estudar ou trabalhar focado (25 min)', emoji: '📚', cat: 'habitos', energy: 2 },
  { id: 'ler', title: 'Ler 10 páginas', emoji: '📖', cat: 'habitos', energy: 1 },
  { id: 'louca', title: 'Lavar a louça', emoji: '🍽️', cat: 'autocuidado', energy: 2 },
  { id: 'roupas', title: 'Guardar as roupas', emoji: '👕', cat: 'autocuidado', energy: 1 },
  { id: 'lixo', title: 'Tirar o lixo', emoji: '🗑️', cat: 'autocuidado', energy: 1 },
  { id: 'plantas', title: 'Regar as plantas', emoji: '🪴', cat: 'autocuidado', energy: 1 },
  { id: 'cama-arrumar', title: 'Arrumar a cama', emoji: '🛏️', cat: 'autocuidado', energy: 1, for: ['habitos'] },
  { id: 'descansar', title: 'Descansar sem culpa (15 min)', emoji: '🛋️', cat: 'autocuidado', energy: 1 },
  { id: 'pausa', title: 'Fazer uma pausa longe da tela', emoji: '📵', cat: 'autocuidado', energy: 1, for: ['habitos', 'calma'] },
  { id: 'agua', title: 'Beber um copo d’água', emoji: '💧', cat: 'habitos', energy: 1, swap: 5, why: 'A água quase não queima calorias, mas ajuda o corpo e a fome', for: ['habitos'] },
  { id: 'garrafa', title: 'Beber 1 garrafa de água no dia', emoji: '🚰', cat: 'habitos', energy: 2, swap: 15, why: 'Bem hidratado, o corpo funciona melhor' },
  { id: 'sono', title: 'Ir dormir no horário', emoji: '🌙', cat: 'habitos', energy: 2, swap: 30, why: 'Quem dorme bem tem menos fome de noite. Para ganhar massa, o corpo cresce descansando', for: ['ganhar', 'habitos', 'calma'] },
  { id: 'agua-acordar', title: 'Beber água ao acordar', emoji: '🌅', cat: 'habitos', energy: 1, swap: 5, why: 'Começa o dia hidratado' },
  { id: 'levantar', title: 'Levantar e andar um pouco a cada hora', emoji: '⏰', cat: 'habitos', energy: 2, met: 3, min: 16, why: 'Umas 8 pausas de 2 minutos' },
  { id: 'sol', title: 'Pegar 10 minutos de sol', emoji: '☀️', cat: 'habitos', energy: 1 },
  { id: 'diario', title: 'Escrever no diário', emoji: '📔', cat: 'emocional', energy: 2, for: ['calma'] },
  { id: 'sentir', title: 'Registrar como estou me sentindo', emoji: '🫶', cat: 'emocional', energy: 1, for: ['calma'] },
  { id: 'gratidao', title: 'Guardar uma coisa boa no pote', emoji: '🌻', cat: 'emocional', energy: 1 },
  { id: 'gosto', title: 'Fazer algo de que eu gosto', emoji: '🎨', cat: 'emocional', energy: 2 },
  { id: 'conversar', title: 'Conversar com alguém', emoji: '💬', cat: 'emocional', energy: 2, for: ['calma'] },
  { id: 'respirar', title: 'Respirar com o Hami', emoji: '🌬️', cat: 'emocional', energy: 1, for: ['calma'] },
  { id: 'agradecer', title: 'Agradecer a mim mesmo por ter chegado até aqui', emoji: '💛', cat: 'emocional', energy: 1 },
  { id: 'aterrar', title: 'Fazer o 5-4-3-2-1 com o Hami', emoji: '🖐️', cat: 'emocional', energy: 1, for: ['calma'] },
  { id: 'meditar', title: 'Meditar 5 minutos', emoji: '🧘', cat: 'emocional', energy: 1, for: ['calma'] },
  { id: 'preocupacao', title: 'Anotar as preocupações e deixar no papel', emoji: '📝', cat: 'emocional', energy: 1, for: ['calma'] },
  { id: 'musica', title: 'Ouvir uma música calma', emoji: '🎵', cat: 'emocional', energy: 1, for: ['calma'] },
  { id: 'natureza', title: 'Ficar 10 minutos ao ar livre', emoji: '🌳', cat: 'habitos', energy: 1, for: ['calma', 'habitos'] },
  { id: 'sem-tela-noite', title: 'Largar as telas 30 min antes de dormir', emoji: '📵', cat: 'habitos', energy: 2 },
  { id: 'acordar-hora', title: 'Acordar sempre no mesmo horário', emoji: '⏰', cat: 'habitos', energy: 2 },
  { id: 'garrafa-perto', title: 'Deixar a garrafinha de água por perto', emoji: '🚰', cat: 'habitos', energy: 1 },
  { id: 'elogio', title: 'Fazer um elogio sincero a alguém', emoji: '💌', cat: 'emocional', energy: 1 },
  { id: 'gastos', title: 'Anotar os gastos do dia', emoji: '📝', cat: 'habitos', energy: 1 },
  { id: 'cofrinho', title: 'Guardar um dinheirinho no cofrinho', emoji: '🫙', cat: 'habitos', energy: 1 },
  { id: 'assinaturas', title: 'Rever as assinaturas e cortar o que não usa', emoji: '🔍', cat: 'habitos', energy: 2 },
  { id: 'esperar-compra', title: 'Esperar um dia antes de comprar por impulso', emoji: '⏰', cat: 'habitos', energy: 1 },
  { id: 'gentil-comigo', title: 'Falar comigo com a gentileza que falo com um amigo', emoji: '🫶', cat: 'emocional', energy: 1 },
];

export const libById = (id: string) => LIBRARY.find((t) => t.id === id);

/** Sementes por atividade: o pequeno também vale. */
export const rewardFor = (energy: 1 | 2 | 3) => (energy === 1 ? 3 : energy === 2 ? 5 : 8);

export const TASK_EMOJIS = ['⭐', '💧', '📚', '🧘', '🎨', '🐶', '🏃', '🍎', '💊', '🧹', '🎵', '💼', '🚲', '🧴', '🌱', '💌'];
