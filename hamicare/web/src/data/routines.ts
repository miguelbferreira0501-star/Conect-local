// Rotinas prontas da aba Crescer: um grupinho de tarefas da biblioteca para um momento do dia ou um objetivo.
// Tocar em "Adicionar" coloca todas na lista (as que a pessoa já tem ficam como estão).

export type RoutineCat = 'cuidar' | 'ansiedade' | 'movimento' | 'relaxar' | 'casa' | 'estudo';

export interface Routine {
  id: string;
  title: string;
  desc: string;
  cat: RoutineCat;
  emoji: string;
  /** Cor do cartão. */
  tone: string;
  tasks: string[];
  fresh?: boolean;
  plus?: boolean;
}

export const ROUTINE_CATS: { id: RoutineCat; label: string; emoji: string; tone: string }[] = [
  { id: 'cuidar', label: 'Cuidar de mim', emoji: '💛', tone: '#FFD7A8' },
  { id: 'ansiedade', label: 'Foco e ansiedade', emoji: '🌬️', tone: '#BFE6FF' },
  { id: 'movimento', label: 'Movimento', emoji: '👟', tone: '#C9F0B8' },
  { id: 'relaxar', label: 'Relaxar', emoji: '🌙', tone: '#D9CCFF' },
  { id: 'casa', label: 'Casa em ordem', emoji: '🧹', tone: '#FFE59A' },
  { id: 'estudo', label: 'Estudo e trabalho', emoji: '📚', tone: '#FFC9D9' },
];

export const ROUTINES: Routine[] = [
  { id: 'manha', title: 'Manhã gostosa', desc: 'Um começo de dia calmo, sem pressa.', cat: 'cuidar', emoji: '🌅', tone: '#FFC98A', tasks: ['agua-acordar', 'cama-arrumar', 'dentes', 'alongar', 'planejar'], fresh: true },
  { id: 'noite', title: 'Noite tranquila', desc: 'Desacelerar para dormir melhor.', cat: 'relaxar', emoji: '🌙', tone: '#B9A8F5', tasks: ['sem-tela-noite', 'banho', 'musica', 'gratidao', 'sono'], fresh: true },
  { id: 'ansiedade', title: 'Quando a ansiedade aperta', desc: 'Passinhos para voltar para o agora.', cat: 'ansiedade', emoji: '🫶', tone: '#9ED8F5', tasks: ['respirar', 'aterrar', 'preocupacao', 'conversar'], fresh: true },
  { id: 'sol', title: 'Passeio de sol', desc: 'Ar livre, luz do dia e água por perto.', cat: 'movimento', emoji: '☀️', tone: '#FFE07A', tasks: ['caminhada', 'sol', 'natureza', 'garrafa'], fresh: true },
  { id: 'gratidao', title: 'Gratidão do dia', desc: 'Reparar nas coisas boas e nas pessoas queridas.', cat: 'cuidar', emoji: '🌻', tone: '#FFB3CF', tasks: ['gratidao', 'elogio', 'agradecer'], fresh: true },
  { id: 'basico', title: 'O básico bem feito', desc: 'Banho, dentes, pele e água: o cuidado que sustenta o resto.', cat: 'cuidar', emoji: '🛁', tone: '#A8E6DA', tasks: ['banho', 'dentes', 'pele', 'agua', 'roupas'] },
  { id: 'carinho', title: 'Dia de carinho comigo', desc: 'Gentileza e descanso sem culpa.', cat: 'cuidar', emoji: '💛', tone: '#E2C6FF', tasks: ['agradecer', 'gentil-comigo', 'gosto', 'descansar'] },
  { id: 'foco', title: 'Foco em pedacinhos', desc: 'Uma coisa de cada vez, com pausas de verdade.', cat: 'ansiedade', emoji: '🧩', tone: '#FFD98A', tasks: ['planejar', 'tarefa-chave', 'estudar', 'pausa', 'levantar'] },
  { id: 'cabeca', title: 'Cabeça mais leve', desc: 'Colocar para fora o que pesa.', cat: 'ansiedade', emoji: '📔', tone: '#C6E9C0', tasks: ['sentir', 'diario', 'meditar', 'natureza'] },
  { id: 'mexer', title: 'Mexer o corpo em 10 minutos', desc: 'Rapidinho, em casa, do seu jeito.', cat: 'movimento', emoji: '💃', tone: '#FFB59A', tasks: ['alongar', 'casa', 'danca'] },
  { id: 'energia', title: 'Mais energia na semana', desc: 'Passos, escadas e pausas para levantar.', cat: 'movimento', emoji: '👟', tone: '#B8E3A0', tasks: ['passos', 'escada', 'levantar', 'mobilidade'] },
  { id: 'yoga', title: 'Yoga e respiração', desc: 'Alongar e respirar com calma.', cat: 'relaxar', emoji: '🧘', tone: '#CFC2FF', tasks: ['yoga', 'respirar', 'meditar'], plus: true },
  { id: 'domingo', title: 'Domingo preguiçoso', desc: 'Descanso, música e gente querida.', cat: 'relaxar', emoji: '🛋️', tone: '#FFCFB0', tasks: ['descansar', 'gosto', 'musica', 'conversar'] },
  { id: 'dormir', title: 'Dormir melhor', desc: 'Horários certos e menos tela à noite.', cat: 'relaxar', emoji: '😴', tone: '#9DB0F0', tasks: ['acordar-hora', 'sem-tela-noite', 'sono', 'descansar'], plus: true },
  { id: 'casa15', title: 'Casa em ordem em 15 minutos', desc: 'Pequenas arrumações que mudam o dia.', cat: 'casa', emoji: '🧹', tone: '#FFE59A', tasks: ['cama-arrumar', 'louca', 'roupas', 'lixo'] },
  { id: 'quarto', title: 'Quarto renovado', desc: 'Um cantinho arrumado e cheio de vida.', cat: 'casa', emoji: '🪴', tone: '#BDE8B0', tasks: ['quarto', 'roupas', 'plantas', 'cama-arrumar'] },
  { id: 'estudo', title: 'Estudo sem cansaço', desc: 'Foco de 25 minutos, pausa e água.', cat: 'estudo', emoji: '📚', tone: '#FFC2D4', tasks: ['planejar', 'estudar', 'pausa', 'agua', 'ler'] },
  { id: 'trabalho', title: 'Trabalho com pausas', desc: 'Render bem sem esquecer de você.', cat: 'estudo', emoji: '💼', tone: '#C2D8FF', tasks: ['tarefa-chave', 'levantar', 'pausa', 'garrafa-perto'], plus: true },
];

export const routineById = (id: string) => ROUTINES.find((r) => r.id === id);
