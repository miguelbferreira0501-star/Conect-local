// Testes rápidos da aba Crescer: um momento para se observar (não são diagnóstico).
// Cada resposta vale de 0 a 3; a soma escolhe o resultado e uma rotina que pode ajudar.

export interface SelfTest {
  id: string;
  title: string;
  desc: string;
  get: string;
  emoji: string;
  tone: string;
  questions: string[];
  /** Do resultado mais leve ao mais pesado: até quanto vale (inclusive), título, texto e a rotina sugerida. */
  bands: { max: number; title: string; text: string; routine: string }[];
  /** Só a partir de 13 anos. */
  teen?: boolean;
}

export const ANSWERS = ['Quase nunca', 'Às vezes', 'Muitas vezes', 'Quase sempre'];

export const SELF_TESTS: SelfTest[] = [
  {
    id: 'sono',
    title: 'Como anda seu sono?',
    desc: 'Cinco perguntas sobre as últimas duas semanas de descanso.',
    get: 'Uma ideia de como está seu descanso e uma rotina para a noite.',
    emoji: '🌙',
    tone: '#8E9BF2',
    questions: ['Demoro para pegar no sono.', 'Acordo no meio da noite e custo a dormir de novo.', 'Acordo cansado, mesmo depois de dormir.', 'Fico no celular até tarde.', 'Sinto sono durante o dia.'],
    bands: [
      { max: 4, title: 'Seu sono parece em dia', text: 'Que bom! Manter horários parecidos todo dia ajuda a continuar assim.', routine: 'desconexao' },
      { max: 9, title: 'Seu sono pede um carinho', text: 'Algumas noites estão difíceis. Pequenas mudanças antes de deitar costumam fazer diferença.', routine: 'desconexao' },
      { max: 15, title: 'Seu sono anda pesado', text: 'Parece que descansar tem sido difícil. Vale tentar uma rotina de noite e, se continuar assim, conversar com um profissional de saúde.', routine: 'domingo' },
    ],
  },
  {
    id: 'energia',
    title: 'Como está sua energia?',
    desc: 'Veja o que tem deixado você mais cansado ou mais animado.',
    get: 'Seu nível de energia agora e ideias para recarregar.',
    emoji: '⚡',
    tone: '#FFC94D',
    questions: ['Passo a maior parte do dia sentado.', 'Esqueço de beber água.', 'Fico pouco tempo ao ar livre.', 'Sinto o corpo pesado ou travado.', 'Me falta ânimo para começar as coisas.'],
    bands: [
      { max: 4, title: 'Energia boa por aqui', text: 'Seu corpo parece bem cuidado. Continue se mexendo do seu jeito!', routine: 'movimento' },
      { max: 9, title: 'Energia oscilando', text: 'Um pouco de sol, água e movimento ao longo do dia podem dar aquele empurrãozinho.', routine: 'boost-manha' },
      { max: 15, title: 'Bateria baixinha', text: 'Comece bem pequeno: um copo d’água, cinco minutos lá fora, um alongamento. Cada passinho conta.', routine: 'fitness' },
    ],
  },
  {
    id: 'cuidado',
    title: 'Você tem se cuidado?',
    desc: 'Um olhar gentil para o básico do dia a dia.',
    get: 'Onde o seu autocuidado está forte e onde pode crescer.',
    emoji: '🛁',
    tone: '#6CD0C0',
    questions: ['Pulo o banho ou a escovação quando estou cansado.', 'Meu quarto fica bagunçado por muitos dias.', 'Deixo para depois coisas de que preciso.', 'Quase não tenho tempo para algo de que gosto.', 'Esqueço de descansar.'],
    bands: [
      { max: 4, title: 'Você está se cuidando bem', text: 'Seu básico está firme. Que tal guardar um tempinho para algo de que você gosta?', routine: 'skincare' },
      { max: 9, title: 'Dá para cuidar um pouquinho mais', text: 'Algumas coisas ficaram de lado, e tudo bem. Escolha uma só para começar.', routine: 'essenciais' },
      { max: 15, title: 'Hora de ir com calma', text: 'Os dias parecem corridos ou pesados. O pequeno também vale: um banho, um copo d’água, a cama arrumada.', routine: 'modo-crise' },
    ],
  },
  {
    id: 'estresse',
    title: 'Como está seu estresse?',
    desc: 'Perceba como sua cabeça e seu corpo têm reagido nos últimos dias.',
    get: 'Como o estresse aparece em você e jeitos de aliviar.',
    emoji: '🌬️',
    tone: '#5BB7C2',
    teen: true,
    questions: ['Sinto a cabeça cheia, sem conseguir desligar.', 'Fico irritado com coisas pequenas.', 'Sinto o corpo tenso (ombros, mandíbula, barriga).', 'Me preocupo com coisas que ainda nem aconteceram.', 'Sinto que não dou conta de tudo.'],
    bands: [
      { max: 4, title: 'Tudo bem tranquilo', text: 'Seu estresse parece sob controle. Respirar com calma de vez em quando ajuda a manter assim.', routine: 'diario-criativo' },
      { max: 9, title: 'Um pouco de tensão', text: 'Está pesando um pouco. Pausas curtas, respiração e colocar as preocupações no papel costumam aliviar.', routine: 'controle-ansiedade' },
      { max: 15, title: 'O estresse está alto', text: 'Isso parece estar pesando bastante. Conversar com alguém de confiança ou com um profissional pode ajudar muito.', routine: 'modo-crise' },
    ],
  },
  {
    id: 'foco',
    title: 'Como anda seu foco?',
    desc: 'Para quem sente que a atenção escapa fácil.',
    get: 'Seu jeito de focar e uma rotina em pedacinhos.',
    emoji: '🧩',
    tone: '#F2903A',
    teen: true,
    questions: ['Começo várias coisas e não termino.', 'Me distraio com o celular no meio de uma tarefa.', 'Esqueço compromissos ou o que ia fazer.', 'Adio as tarefas mais importantes.', 'Fico muito tempo sem pausa e depois me sinto esgotado.'],
    bands: [
      { max: 4, title: 'Foco afiado', text: 'Você costuma manter a atenção. Pausas de verdade ajudam a continuar assim.', routine: 'estudos' },
      { max: 9, title: 'Foco que vai e vem', text: 'Dividir o dia em pedacinhos e fazer uma coisa de cada vez pode deixar tudo mais leve.', routine: 'tdah' },
      { max: 15, title: 'A atenção anda escapando', text: 'Comece pela tarefa mais importante e faça pausas curtas. Se isso atrapalha muito sua vida, vale conversar com um profissional.', routine: 'tdah' },
    ],
  },
  {
    id: 'gentileza',
    title: 'Como você fala com você?',
    desc: 'Sobre a voz de dentro: amiga ou cobradora?',
    get: 'Como está sua autocrítica e práticas de gentileza.',
    emoji: '💛',
    tone: '#A86FDC',
    teen: true,
    questions: ['Me cobro mais do que cobraria um amigo.', 'Quando erro, fico me culpando por muito tempo.', 'Acho que nada do que faço é suficiente.', 'Comparo minha vida com a dos outros nas redes.', 'Tenho dificuldade de aceitar um elogio.'],
    bands: [
      { max: 4, title: 'Voz de dentro gentil', text: 'Você costuma se tratar com carinho. Que lindo! Continue celebrando seus passinhos.', routine: 'diario-criativo' },
      { max: 9, title: 'Às vezes a cobrança aparece', text: 'Tente falar com você como falaria com alguém que você ama. Pequeno ainda é progresso.', routine: 'recomeco' },
      { max: 15, title: 'A cobrança está pesada', text: 'Você tem sido duro com você. Você merece a mesma gentileza que dá aos outros. Conversar com alguém de confiança pode ajudar.', routine: 'ansiedade-calma' },
    ],
  },
];

export const testById = (id: string) => SELF_TESTS.find((t) => t.id === id);

/** O resultado de uma soma de respostas. */
export function testResult(t: SelfTest, score: number) {
  return t.bands.find((b) => score <= b.max) ?? t.bands[t.bands.length - 1];
}

/** O resultado é o mais pesado (mostra o lembrete de buscar ajuda). */
export const isHeavy = (t: SelfTest, score: number) => testResult(t, score) === t.bands[t.bands.length - 1];
