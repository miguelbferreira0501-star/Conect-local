// Falas do bichinho. Tom acolhedor, informal, sem culpa e sem gênero.
export type Period = 'manha' | 'tarde' | 'noite';

export function periodOf(d = new Date()): Period {
  const h = d.getHours();
  if (h >= 5 && h < 12) return 'manha';
  if (h >= 12 && h < 18) return 'tarde';
  return 'noite';
}

export const GREETING: Record<Period, string> = {
  manha: 'Bom dia',
  tarde: 'Boa tarde',
  noite: 'Boa noite',
};

const LINES = {
  checkin: {
    manha: ['Bom dia, {u}! Me conta: como tá sua bateria hoje?'],
    tarde: ['Oi, {u}! Que bom te ver. Como tá sua bateria agora?'],
    noite: ['Boa noite, {u}. Antes de tudo: como você chegou até aqui hoje?'],
  },
  low: [
    'Dia difícil? Tudo bem. A gente faz só o básico, juntinhos.',
    'Hoje sair da cama já foi uma vitória. Sério.',
    'Sem pressa. Um cuidado pequenininho já me deixa feliz.',
  ],
  start: {
    manha: ['Vamos começar devagarinho?', 'Que tal um copo d’água pra começar?'],
    tarde: ['Ainda dá tempo de um cuidadinho.', 'Bora fazer uma coisa pequena por você?'],
    noite: ['Que tal um cuidado bem pequeno antes de dormir?', 'O dia tá acabando. Uma coisinha só e pronto.'],
  },
  progress: [
    'Que orgulho de você! Já são {d}.',
    'Cada cuidadinho conta. Um de cada vez.',
    'Eu cresço um pouquinho a cada coisa que você faz por você.',
    'Você tá indo muito bem, viu?',
  ],
  done: [
    'Você cuidou de você hoje. Isso é enorme.',
    'Missão cumprida! Agora descansa, tá?',
    'Tudo feito. Vou contar pra todo mundo do meu cantinho.',
  ],
};

function pick(list: string[], seed: number) {
  return list[Math.abs(seed) % list.length];
}

export function petLine(opts: {
  period: Period;
  battery?: number;
  done: number;
  total: number;
  user: string;
  seed: number;
}): string {
  const { period, battery, done, total, user, seed } = opts;
  let line: string;
  if (!battery) line = pick(LINES.checkin[period], seed);
  else if (total > 0 && done >= total) line = pick(LINES.done, seed);
  else if (done > 0) line = pick(LINES.progress, seed + done);
  else if (battery === 1) line = pick(LINES.low, seed);
  else line = pick(LINES.start[period], seed);
  const doneText = done === 1 ? '1 cuidado' : `${done} cuidados`;
  return line.replace('{u}', user || 'você').replace('{d}', doneText);
}

export const AFFIRMATIONS = [
  'Descansar também é fazer alguma coisa.',
  'Você não precisa dar conta de tudo hoje.',
  'Pequeno ainda é progresso.',
  'Seus sentimentos fazem sentido, mesmo os difíceis.',
  'Tudo bem pedir ajuda.',
  'Você já passou por dias difíceis antes, e chegou até aqui.',
];

export const MOODS = [
  { value: 1, emoji: '😣', label: 'Muito difícil' },
  { value: 2, emoji: '😕', label: 'Difícil' },
  { value: 3, emoji: '😐', label: 'Mais ou menos' },
  { value: 4, emoji: '🙂', label: 'Bem' },
  { value: 5, emoji: '😄', label: 'Muito bem' },
] as const;

export const BATTERIES = [
  { value: 1, label: 'Baixa', hint: 'Só o básico hoje' },
  { value: 2, label: 'Média', hint: 'Um dia normal' },
  { value: 3, label: 'Cheia', hint: 'Tô com energia' },
] as const;

export const PET_NAME_IDEAS = ['Paçoca', 'Pudim', 'Pipoca', 'Brigadeiro', 'Tapioca', 'Biscoito', 'Jujuba'];
