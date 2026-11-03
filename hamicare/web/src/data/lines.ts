// Falas do Hami, perguntas do onboarding e textos de apoio. Tom acolhedor, sem culpa e sem gênero.
import type { GoalId, Incentive, TraitId } from '../types';

export type Period = 'manha' | 'tarde' | 'noite';

export function periodOf(d = new Date()): Period {
  const h = d.getHours();
  if (h >= 5 && h < 12) return 'manha';
  if (h >= 12 && h < 18) return 'tarde';
  return 'noite';
}

export const GREETING: Record<Period, string> = { manha: 'Bom dia', tarde: 'Boa tarde', noite: 'Boa noite' };

export const TRAITS: Record<TraitId, { label: string; emoji: string; hello: string }> = {
  curioso: { label: 'Curioso', emoji: '🔍', hello: 'O que vamos descobrir hoje?' },
  carinhoso: { label: 'Carinhoso', emoji: '💗', hello: 'Que bom te ver. Senti saudade!' },
  brincalhao: { label: 'Brincalhão', emoji: '🎈', hello: 'Bora fazer o dia ficar divertido?' },
  sonhador: { label: 'Sonhador', emoji: '🌙', hello: 'Sonhei que a gente subia uma montanha juntos.' },
  corajoso: { label: 'Corajoso', emoji: '🦸', hello: 'Um passo de cada vez e a gente chega lá!' },
};

export const GOALS: Record<GoalId, { label: string; emoji: string; desc: string }> = {
  habitos: { label: 'Criar hábitos saudáveis', emoji: '🌱', desc: 'Água, sono, comida e rotina' },
  condicionamento: { label: 'Melhorar o condicionamento', emoji: '💪', desc: 'Ter mais fôlego e disposição' },
  ativo: { label: 'Ter uma rotina mais ativa', emoji: '🚶', desc: 'Se mexer mais no dia a dia' },
  peso: { label: 'Trabalhar uma meta de peso', emoji: '⚖️', desc: 'Com segurança e no seu ritmo' },
  equilibrio: { label: 'Manter uma rotina equilibrada', emoji: '⚖', desc: 'Nem oito nem oitenta' },
  cuidar: { label: 'Cuidar melhor de mim', emoji: '💛', desc: 'Autocuidado e saúde emocional' },
};

export const INCENTIVES: Record<Incentive, { label: string; emoji: string }> = {
  carinho: { label: 'Carinho e palavras gentis', emoji: '🤗' },
  conquistas: { label: 'Conquistas e recompensas', emoji: '🏅' },
  desafios: { label: 'Desafios e metas', emoji: '🎯' },
  calma: { label: 'Calma, sem pressão', emoji: '🍃' },
};

export const LIKES = [
  { id: 'caminhada', label: 'Caminhar', emoji: '🚶' },
  { id: 'danca', label: 'Dançar', emoji: '💃' },
  { id: 'bike', label: 'Pedalar', emoji: '🚲' },
  { id: 'casa', label: 'Treinar em casa', emoji: '🤸' },
  { id: 'academia', label: 'Academia', emoji: '🏋️' },
  { id: 'esporte', label: 'Esportes', emoji: '⚽' },
  { id: 'mobilidade', label: 'Alongar e yoga', emoji: '🧘' },
  { id: 'corrida', label: 'Correr', emoji: '🏃' },
];

export const MOODS = [
  { value: 1, emoji: '😣', label: 'Muito difícil' },
  { value: 2, emoji: '😕', label: 'Difícil' },
  { value: 3, emoji: '😐', label: 'Mais ou menos' },
  { value: 4, emoji: '🙂', label: 'Bem' },
  { value: 5, emoji: '😄', label: 'Muito bem' },
] as const;

export const EMOTIONS = ['Ansioso', 'Cansado', 'Triste', 'Irritado', 'Sozinho', 'Calmo', 'Grato', 'Animado', 'Orgulhoso', 'Esperançoso'];

export const BATTERIES = [
  { value: 1, label: 'Baixa', hint: 'Só o básico hoje' },
  { value: 2, label: 'Média', hint: 'Um dia normal' },
  { value: 3, label: 'Cheia', hint: 'Tô com energia' },
] as const;

export const PET_NAME_IDEAS = ['Paçoca', 'Pudim', 'Pipoca', 'Amendoim', 'Biscoito', 'Jujuba', 'Fubá', 'Bolacha'];

/** "Hoje o Hami descobriu…": uma curiosidade nova por dia de cuidado (personalidade aos poucos). */
export const FACTS = [
  'que ama o barulhinho da chuva no telhado.',
  'que o lado esquerdo da bochecha guarda mais sementes que o direito.',
  'que fica com soluço quando ri demais.',
  'que a cor favorita dele é amarelo-girassol.',
  'que tem medo de aspirador de pó, mas tá trabalhando nisso.',
  'que gosta de dormir com a patinha em cima do nariz.',
  'que já sonhou que era astronauta.',
  'que acha que você tem uma risada muito bonita.',
  'que a música favorita dele é qualquer uma que você cantarolar.',
  'que adora quando você bebe água, porque fica com vontade também.',
  'que conta as estrelas antes de dormir, mas sempre perde a conta no 7.',
  'que fica orgulhoso de cada coisinha que você faz.',
  'que prefere cenoura a brócolis (mas come os dois).',
  'que quer conhecer a neve um dia.',
  'que acha que descansar também é coisa de gente forte.',
];

const LINES = {
  low: ['Dia difícil? Tudo bem. A gente faz só o básico, juntinhos.', 'Hoje sair da cama já foi uma vitória. Sério.', 'Sem pressa. Um cuidado pequenininho já me deixa feliz.'],
  start: {
    manha: ['Vamos começar devagarinho?', 'Que tal um copo d’água pra começar?'],
    tarde: ['Ainda dá tempo de um cuidadinho.', 'Bora fazer uma coisa pequena por você?'],
    noite: ['Que tal um cuidado bem pequeno antes de dormir?', 'O dia tá acabando. Uma coisinha só e pronto.'],
  },
  progress: ['Que orgulho de você! Já são {d}.', 'Cada cuidadinho conta. Um de cada vez.', 'A gente tá evoluindo junto, viu?', 'Você tá indo muito bem!'],
  done: ['Você cuidou de você hoje. Isso é enorme.', 'Missão cumprida! Agora descansa, tá?', 'Tudo feito. Vou contar pra todo mundo do meu cantinho.'],
  hungry: ['Minha barriguinha tá roncando… 🥕', 'Será que tem um lanchinho por aí?'],
  dirty: ['Acho que tô precisando de um banho 🫧', 'Rolei na terra do jardim, hehe.'],
  sleepy: ['Tô com soninho…', 'Uma soneca cairia bem agora.'],
  sad: ['Brinca comigo um pouquinho?', 'Um carinho agora seria bom…'],
  sleeping: ['Zzz… (o Hami tá dormindo. Toque em Acordar quando quiser.)'],
};

const pick = (list: string[], seed: number) => list[Math.abs(seed) % list.length];

export function petLine(o: {
  period: Period;
  battery?: number;
  done: number;
  total: number;
  user: string;
  seed: number;
  stats: { felicidade: number; energia: number; saciedade: number; limpeza: number };
  sleeping: boolean;
}): string {
  if (o.sleeping) return LINES.sleeping[0];
  let line: string;
  if (o.stats.saciedade < 25) line = pick(LINES.hungry, o.seed);
  else if (o.stats.limpeza < 25) line = pick(LINES.dirty, o.seed);
  else if (o.stats.energia < 20) line = pick(LINES.sleepy, o.seed);
  else if (o.stats.felicidade < 25) line = pick(LINES.sad, o.seed);
  else if (o.total > 0 && o.done >= o.total) line = pick(LINES.done, o.seed);
  else if (o.done > 0) line = pick(LINES.progress, o.seed + o.done);
  else if (o.battery === 1) line = pick(LINES.low, o.seed);
  else line = pick(LINES.start[o.period], o.seed);
  return line.replace('{d}', o.done === 1 ? '1 atividade' : `${o.done} atividades`).replace('{u}', o.user || 'você');
}

/** Perguntas que o Hami faz em "Conversar". A resposta vira registro de humor ou só carinho. */
export const CHATS = [
  { q: 'Como foi seu dia até agora?', a: [{ t: 'Foi bom!', mood: 4 }, { t: 'Mais ou menos', mood: 3 }, { t: 'Tá difícil', mood: 2 }] },
  { q: 'Você bebeu água hoje?', a: [{ t: 'Bebi sim!' }, { t: 'Vou beber agora' }] },
  { q: 'O que te deixou feliz essa semana?', a: [{ t: 'Uma conversa boa' }, { t: 'Uma comida gostosa' }, { t: 'Descansar' }] },
  { q: 'Quer que eu te conte uma coisa?', a: [{ t: 'Conta!' }, { t: 'Agora não, mas obrigado' }] },
  { q: 'Você se sente cansado hoje?', a: [{ t: 'Um pouco', mood: 3 }, { t: 'Bastante', mood: 2 }, { t: 'Tô de boa', mood: 4 }] },
] as const;

export const AFFIRMATIONS = [
  'Descansar também é fazer alguma coisa.',
  'Você não precisa dar conta de tudo hoje.',
  'Pequeno ainda é progresso.',
  'Seus sentimentos fazem sentido, mesmo os difíceis.',
  'Tudo bem pedir ajuda.',
  'Você já passou por dias difíceis antes, e chegou até aqui.',
  'Seu valor não depende da sua produtividade.',
  'Seu corpo merece cuidado, não cobrança.',
  'Hoje você pode ser gentil com você.',
  'Um dia ruim não apaga o seu caminho.',
];

export const REFLECTIONS = [
  'O que foi pequeno, mas bom, hoje?',
  'O que você diria pra um amigo que está passando pelo que você está passando?',
  'Do que o seu corpo está precisando agora?',
  'Qual foi o momento mais calmo do seu dia?',
  'O que você quer deixar pra amanhã sem culpa?',
  'Quem te fez bem essa semana? O que essa pessoa fez?',
  'Qual pequena vitória você quer comemorar?',
  'O que está pesando na sua cabeça? Escrever ajuda a soltar.',
];

export const NOTIFS = {
  tarefas: ['Que tal uma caminhada hoje?', 'Hora de cuidar um pouquinho de você.', 'Um copo d’água agora? O Hami acompanha 💧'],
  hami: ['O Hami está esperando pra brincar!', 'O Hami guardou uma semente pra você 🌻'],
  missoes: ['Sua nova missão está disponível!', 'Tem desafio novo no HamiCare.'],
  aventura: ['O Hami voltou da aventura e encontrou algo interessante!'],
  amigos: ['Um amigo mandou uma vibe boa pra você 💛'],
};
