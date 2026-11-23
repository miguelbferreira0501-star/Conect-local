// Rotinas prontas da aba Crescer, nas mesmas seções do vídeo de referência: cada uma é um grupinho de
// tarefas da biblioteca. Tocar em "Adicionar" coloca todas na lista (as que a pessoa já tem ficam como estão).

export type RoutineCat = 'novidades' | 'cuidados' | 'tdah' | 'treinos' | 'relax' | 'limpeza' | 'estudo' | 'comeco' | 'saudavel';

export interface Routine {
  id: string;
  title: string;
  desc: string;
  cat: RoutineCat;
  emoji: string;
  /** Cor de fundo da ficha (a mesma da ilustração). */
  tone: string;
  tasks: string[];
  plus?: boolean;
  /** Só para maiores de 18 (rotinas sobre peso). */
  adult?: boolean;
  /** Mostrar o lembrete de ajuda (CVV 188) na ficha. */
  help?: boolean;
}

/** As seções, na ordem do vídeo. */
export const ROUTINE_CATS: { id: RoutineCat; label: string; tone: string }[] = [
  { id: 'novidades', label: 'Novidades e tendências', tone: '#EFE7FF' },
  { id: 'cuidados', label: 'Cuidados pessoais', tone: '#FFE6F0' },
  { id: 'tdah', label: 'TDAH e ansiedade', tone: '#E3F6EA' },
  { id: 'treinos', label: 'Treinos', tone: '#FFF0DC' },
  { id: 'relax', label: 'Relaxamento', tone: '#ECE8FF' },
  { id: 'limpeza', label: 'Plano de limpeza', tone: '#E5F6E8' },
  { id: 'estudo', label: 'Trabalho e estudos', tone: '#FFF3DD' },
  { id: 'comeco', label: 'Começo fácil', tone: '#EEE8FF' },
  { id: 'saudavel', label: 'Estilo de vida saudável', tone: '#E3F5EE' },
];

const T = (cat: RoutineCat) => ROUTINE_CATS.find((c) => c.id === cat)!.tone;
const R = (id: string, title: string, cat: RoutineCat, emoji: string, desc: string, tasks: string[], extra: Partial<Routine> = {}): Routine => ({ id, title, cat, emoji, desc, tasks, tone: T(cat), ...extra });

export const ROUTINES: Routine[] = [
  // Novidades e tendências
  R('organize-dia', 'Organize seu dia', 'novidades', '📝', 'Um plano simples para o dia render sem correria.', ['planejar', 'tarefa-chave', 'cama-arrumar', 'agua']),
  R('movimento-diario', 'Rotina de movimento diário', 'novidades', '💪', 'Mexer o corpo um pouquinho todos os dias.', ['alongar', 'caminhada', 'levantar', 'mobilidade']),
  R('controle-ansiedade', 'Controle sua ansiedade', 'novidades', '🌬️', 'Respirar, voltar para o agora e soltar as preocupações.', ['respirar', 'aterrar', 'preocupacao', 'meditar']),
  // Cuidados pessoais
  R('skincare', 'Skincare é autocuidado', 'cuidados', '🧴', 'Um momento só seu para cuidar da pele com carinho.', ['banho', 'pele', 'agua', 'gentil-comigo']),
  R('boost-manha', 'Boost da manhã (15 min)', 'cuidados', '🌅', 'Quinze minutinhos para começar o dia com energia.', ['agua-acordar', 'alongar', 'sol', 'planejar']),
  R('essenciais', 'Essenciais de autocuidado', 'cuidados', '🛁', 'O básico bem feito: o cuidado que sustenta o resto.', ['banho', 'dentes', 'pele', 'roupas', 'agua']),
  // TDAH e ansiedade
  R('modo-crise', 'Sobreviva hoje (modo crise)', 'tdah', '🫶', 'Dia difícil? Só o essencial, sem cobrança.', ['respirar', 'agua', 'descansar', 'conversar'], { help: true }),
  R('ansiedade-calma', 'Controle sua ansiedade', 'tdah', '💛', 'Perceber o que sente e se acalmar aos pouquinhos.', ['sentir', 'respirar', 'natureza', 'conversar']),
  R('tdah', 'Rotina de TDAH', 'tdah', '🧩', 'Uma coisa de cada vez, com pausas de verdade.', ['planejar', 'tarefa-chave', 'estudar', 'pausa', 'levantar']),
  // Treinos
  R('academia', 'Plano de academia iniciante', 'treinos', '🏋️', 'Para começar na academia sem medo e no seu ritmo.', ['alongar', 'academia', 'forca', 'agua'], { plus: true }),
  R('fitness', 'Comece seu fitness', 'treinos', '🏃', 'Primeiros passos para criar o hábito de se mexer.', ['caminhada', 'casa', 'alongar', 'garrafa']),
  R('movimento', 'Movimento diário', 'treinos', '👟', 'Passos, escadas e dança espalhados pelo dia.', ['passos', 'escada', 'danca', 'levantar']),
  // Relaxamento
  R('diario-criativo', 'Diário de expressão criativa', 'relax', '📔', 'Escrever, desenhar e colocar para fora o que sente.', ['diario', 'gosto', 'gratidao']),
  R('desconexao', 'Desconexão digital', 'relax', '📵', 'Um tempo longe das telas para a cabeça descansar.', ['pausa', 'sem-tela-noite', 'natureza', 'ler']),
  R('domingo', 'Domingo para relaxar', 'relax', '🛋️', 'Descanso, música e gente querida.', ['descansar', 'musica', 'gosto', 'conversar']),
  // Plano de limpeza
  R('cuide-casa', 'Cuide da sua casa', 'limpeza', '🧹', 'Pequenas arrumações que deixam a casa gostosa.', ['louca', 'lixo', 'plantas', 'quarto']),
  R('limpeza-facil', 'Limpeza sem complicação', 'limpeza', '🧽', 'Limpar o essencial em poucos minutos.', ['cama-arrumar', 'louca', 'roupas', 'lixo']),
  R('organize-casa', 'Organize seu dia', 'limpeza', '👕', 'Roupas no lugar e o cantinho em ordem.', ['roupas', 'quarto', 'cama-arrumar', 'planejar']),
  // Trabalho e estudos
  R('dia-produtivo', 'Prepare-se para um dia produtivo', 'estudo', '💼', 'Começar o dia sabendo o que importa.', ['planejar', 'tarefa-chave', 'garrafa-perto', 'pausa']),
  R('pos-escola', 'Rotina pós-escola', 'estudo', '🎒', 'Descansar um pouco e depois estudar com calma.', ['descansar', 'agua', 'estudar', 'ler']),
  R('estudos', 'Rotina de estudos', 'estudo', '📚', 'Foco de 25 minutos, pausa e água.', ['planejar', 'estudar', 'pausa', 'ler', 'agua']),
  // Começo fácil
  R('carteira', 'Deixe sua carteira incrível', 'comeco', '💰', 'Pequenos hábitos para cuidar melhor do seu dinheiro.', ['gastos', 'cofrinho', 'assinaturas', 'esperar-compra'], { plus: true }),
  R('recomeco', 'Recomeço de segunda-feira', 'comeco', '🌱', 'Uma semana nova, um começo leve.', ['planejar', 'cama-arrumar', 'agua-acordar', 'agradecer']),
  // Estilo de vida saudável
  R('emagrecer', 'Hábitos simples para emagrecer', 'saudavel', '🍏', 'Água, sono e movimento: hábitos que ajudam de verdade.', ['caminhada', 'agua', 'sono', 'escada', 'passos'], { adult: true }),
  R('hidratacao', 'Desafio da hidratação', 'saudavel', '💧', 'Beber água ao longo do dia, sem esquecer.', ['agua-acordar', 'agua', 'garrafa', 'garrafa-perto']),
  R('verao', 'Controle de peso no verão', 'saudavel', '🌴', 'Movimento, água e sol com cuidado no verão.', ['caminhada', 'agua', 'natureza', 'pele'], { adult: true, plus: true }),
];

export const routineById = (id: string) => ROUTINES.find((r) => r.id === id);

/** O que cada idade vê: crianças (até 12) não veem nada do Plus; rotinas sobre peso só a partir de 18. */
export const routinesFor = (age: 'ate12' | '13a17' | '18mais') => ROUTINES.filter((r) => !(r.plus && age === 'ate12') && !(r.adult && age !== '18mais'));
