// Conteúdo das ferramentas de bem-estar. Não é tratamento: é apoio para o dia a dia.

export interface BreathPattern {
  id: string;
  name: string;
  desc: string;
  phases: { label: string; ms: number; scale: number }[];
  cycles: number;
}

export const BREATHS: BreathPattern[] = [
  {
    id: 'calma', name: 'Calma', desc: 'Puxa 4, segura 2, solta 6. Para acalmar rápido.', cycles: 5,
    phases: [{ label: 'Puxa o ar pelo nariz…', ms: 4000, scale: 1.22 }, { label: 'Segura um pouquinho…', ms: 2000, scale: 1.22 }, { label: 'Solta devagar pela boca…', ms: 6000, scale: 1 }],
  },
  {
    id: 'caixa', name: 'Caixa', desc: '4 tempos em cada etapa. Para focar.', cycles: 4,
    phases: [{ label: 'Puxa…', ms: 4000, scale: 1.22 }, { label: 'Segura…', ms: 4000, scale: 1.22 }, { label: 'Solta…', ms: 4000, scale: 1 }, { label: 'Espera…', ms: 4000, scale: 1 }],
  },
  {
    id: 'sono', name: 'Para dormir', desc: 'Puxa 4, segura 7, solta 8. Para desacelerar à noite.', cycles: 4,
    phases: [{ label: 'Puxa pelo nariz…', ms: 4000, scale: 1.22 }, { label: 'Segura…', ms: 7000, scale: 1.22 }, { label: 'Solta bem devagar…', ms: 8000, scale: 1 }],
  },
];

/** Meditação guiada: frases que aparecem ao longo do tempo escolhido. */
export const MEDITATION_CUES = [
  'Ajeite o corpo de um jeito confortável.',
  'Feche os olhos, se quiser.',
  'Perceba o ar entrando e saindo, sem mudar nada.',
  'Se a cabeça for pra longe, tudo bem. Volte para a respiração.',
  'Sinta o peso do corpo apoiado.',
  'Solte os ombros. Solte a testa.',
  'Você não precisa resolver nada agora.',
  'Só respirar já é o bastante.',
  'Quando quiser, abra os olhos devagar.',
];

/** Relaxamento: escaneamento do corpo, um passo de cada vez. */
export const BODY_SCAN = [
  { part: 'Pés', text: 'Mexa os dedos dos pés e depois deixe eles soltos.' },
  { part: 'Pernas', text: 'Sinta as pernas pesadas, afundando no apoio.' },
  { part: 'Barriga', text: 'Deixe a barriga subir e descer com a respiração.' },
  { part: 'Mãos', text: 'Abra e feche as mãos. Depois deixe elas descansarem.' },
  { part: 'Ombros', text: 'Suba os ombros até a orelha e solte de uma vez.' },
  { part: 'Rosto', text: 'Solte a mandíbula, a testa e os olhos.' },
  { part: 'Corpo todo', text: 'Sinta o corpo inteiro mais leve. Fique aqui um pouco.' },
];

export const SLEEP_ROUTINE = [
  { id: 'tela', text: 'Deixar o celular longe por 20 minutos', emoji: '📵' },
  { id: 'luz', text: 'Diminuir as luzes', emoji: '💡' },
  { id: 'agua', text: 'Beber um pouco de água', emoji: '💧' },
  { id: 'dentes', text: 'Escovar os dentes', emoji: '🪥' },
  { id: 'amanha', text: 'Anotar uma coisa pra amanhã (e soltar da cabeça)', emoji: '📝' },
  { id: 'respirar', text: 'Fazer a respiração para dormir', emoji: '🌙' },
];

/** Quizzes de autoconhecimento. Não são testes clínicos e não dão diagnóstico. */
export const QUIZZES = [
  {
    id: 'descanso',
    title: 'Qual é o seu jeito de descansar?',
    questions: [
      { q: 'Num sábado livre, você prefere…', a: [['Ficar em casa quietinho', 'calma'], ['Sair com amigos', 'social'], ['Fazer algo com as mãos', 'criativo'], ['Se mexer, passear', 'movimento']] },
      { q: 'Depois de um dia cansativo, o que mais ajuda?', a: [['Silêncio', 'calma'], ['Conversar', 'social'], ['Desenhar, cozinhar, tocar', 'criativo'], ['Uma caminhada', 'movimento']] },
      { q: 'Qual lugar te acalma?', a: [['Minha cama', 'calma'], ['Uma mesa cheia de gente', 'social'], ['Um cantinho meu', 'criativo'], ['Ao ar livre', 'movimento']] },
    ],
    results: {
      calma: 'Você recarrega no silêncio. Proteja seus momentos de quietinho: eles são o seu combustível.',
      social: 'Você recarrega com gente. Uma conversa boa vale como descanso pra você.',
      criativo: 'Você recarrega criando. Fazer algo com as mãos tira o peso da cabeça.',
      movimento: 'Você recarrega se mexendo. Uma caminhada leve pode ser seu melhor descanso.',
    } as Record<string, string>,
  },
  {
    id: 'energia',
    title: 'O que mais rouba sua energia?',
    questions: [
      { q: 'O que mais te cansa numa semana?', a: [['Dormir pouco', 'sono'], ['Ficar muito tempo no celular', 'tela'], ['Pular refeições', 'comida'], ['Me cobrar demais', 'cobranca']] },
      { q: 'Quando você está sem energia, normalmente…', a: [['Dormi tarde', 'sono'], ['Rolei o feed por horas', 'tela'], ['Esqueci de comer direito', 'comida'], ['Achei que não fiz o suficiente', 'cobranca']] },
    ],
    results: {
      sono: 'O sono pode ser seu ponto-chave. Experimente a rotina para dormir no Bem-estar.',
      tela: 'As telas podem estar pesando. Que tal a tarefa "pausa longe da tela"?',
      comida: 'Comer bem e na hora pode mudar seu dia. Coloque "refeição equilibrada" na sua lista.',
      cobranca: 'A cobrança pesa mais que a tarefa. Lembre: pequeno ainda é progresso.',
    } as Record<string, string>,
  },
];
