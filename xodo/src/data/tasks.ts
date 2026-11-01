// Biblioteca de cuidados sugeridos. `energy` diz quanta "bateria" o cuidado pede:
// 1 = cabe num dia difícil, 2 = dia normal, 3 = dia com bateria cheia.
export type Energy = 1 | 2 | 3;

export interface TaskDef {
  id: string;
  title: string;
  emoji: string;
  energy: Energy;
}

export const TASKS: TaskDef[] = [
  { id: 'cama', title: 'Sair da cama (já conta!)', emoji: '🛏️', energy: 1 },
  { id: 'agua', title: 'Beber um copo d’água', emoji: '💧', energy: 1 },
  { id: 'respirar', title: 'Respirar junto com seu xodó', emoji: '🌬️', energy: 1 },
  { id: 'janela', title: 'Abrir a janela e olhar o céu', emoji: '🪟', energy: 1 },
  { id: 'agradecer', title: 'Agradecer a si mesmo por ter chegado até aqui', emoji: '💛', energy: 1 },
  { id: 'dentes', title: 'Escovar os dentes', emoji: '🪥', energy: 1 },
  { id: 'musica', title: 'Ouvir uma música que você ama', emoji: '🎧', energy: 1 },
  { id: 'alongar', title: 'Alongar o pescoço e os ombros', emoji: '🙆', energy: 1 },
  { id: 'remedio', title: 'Tomar seus remédios, se tiver', emoji: '💊', energy: 1 },
  { id: 'fruta', title: 'Comer uma fruta', emoji: '🍌', energy: 1 },
  { id: 'banho', title: 'Tomar banho (banho rápido vale!)', emoji: '🚿', energy: 2 },
  { id: 'refeicao', title: 'Fazer uma refeição de verdade', emoji: '🍛', energy: 2 },
  { id: 'mensagem', title: 'Mandar mensagem pra alguém que você gosta', emoji: '💬', energy: 2 },
  { id: 'sol', title: 'Pegar 10 minutos de sol', emoji: '☀️', energy: 2 },
  { id: 'arrumar-cama', title: 'Arrumar só a cama', emoji: '🧺', energy: 2 },
  { id: 'louca', title: 'Lavar a louça de uma refeição', emoji: '🍽️', energy: 2 },
  { id: 'tela', title: 'Ficar 30 minutos longe do celular', emoji: '📵', energy: 2 },
  { id: 'cafe', title: 'Fazer um café ou chá com calma', emoji: '☕', energy: 2 },
  { id: 'planta', title: 'Regar uma planta (ou cuidar de algo vivo)', emoji: '🪴', energy: 2 },
  { id: 'escrever', title: 'Guardar uma coisa boa no pote', emoji: '📝', energy: 2 },
  { id: 'dormir', title: 'Ir dormir no horário hoje', emoji: '🌙', energy: 2 },
  { id: 'caminhar', title: 'Caminhar 15 minutos', emoji: '🚶', energy: 3 },
  { id: 'arrumar', title: 'Arrumar um cantinho da casa', emoji: '🧹', energy: 3 },
  { id: 'cozinhar', title: 'Cozinhar algo gostoso pra você', emoji: '🍳', energy: 3 },
  { id: 'exercicio', title: 'Mexer o corpo por 20 minutos', emoji: '🏃', energy: 3 },
  { id: 'ligar', title: 'Ligar pra alguém da família ou amigo', emoji: '📞', energy: 3 },
  { id: 'ler', title: 'Ler 10 páginas de um livro', emoji: '📖', energy: 3 },
  { id: 'pendencia', title: 'Resolver uma pendência que você está adiando', emoji: '✅', energy: 3 },
];

export const taskById = (id: string) => TASKS.find((t) => t.id === id);

/** Sementinhas ganhas por cuidado. Cuidado pequeno também vale. */
export const rewardFor = (energy: Energy) => (energy === 1 ? 3 : energy === 2 ? 5 : 8);

export const GOAL_EMOJIS = ['⭐', '💧', '📚', '🧘', '🎨', '🐶', '🏃', '🍎', '💊', '🧹', '🎵', '💼'];
