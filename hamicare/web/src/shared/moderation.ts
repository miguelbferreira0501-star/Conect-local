// Filtro de gentileza: comentários e textos públicos só passam se forem gentis.
// Usado no app (aviso na hora) e no servidor (decisão final). Sem dependências.

export type KindnessReason = 'vazio' | 'longo' | 'ofensa' | 'corpo' | 'negativo' | 'contato' | 'link';
export type KindnessResult = { ok: true; text: string } | { ok: false; reason: KindnessReason };

export const MAX_COMMENT = 200;

export const REASON_TEXT: Record<KindnessReason, string> = {
  vazio: 'Escreva alguma coisa.',
  longo: `Use até ${MAX_COMMENT} caracteres.`,
  ofensa: 'Esse texto não passou no filtro de gentileza. Que tal um elogio?',
  corpo: 'Aqui não se comenta o corpo de ninguém. Que tal elogiar o esforço?',
  negativo: 'Esse texto parece desanimador. No HamiCare só vale incentivo.',
  contato: 'Por segurança, não compartilhe telefone, e-mail ou outras redes.',
  link: 'Links não são permitidos nos comentários.',
};

/** Minúsculas, sem acento, sem "leetspeak" e sem letras repetidas (idiotaaaa → idiota). */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[0@4]/g, (c) => ({ '0': 'o', '@': 'a', '4': 'a' })[c] as string)
    .replace(/[1!]/g, 'i')
    .replace(/3/g, 'e')
    .replace(/[5$]/g, 's')
    .replace(/7/g, 't')
    .replace(/([a-z])\1{2,}/g, '$1')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Palavras inteiras (depois de normalizar).
const OFFENSE = [
  'idiota', 'idiotas', 'burro', 'burra', 'burros', 'otario', 'otaria', 'imbecil', 'babaca', 'ridiculo', 'ridicula', 'lixo',
  'feio', 'feia', 'feios', 'nojento', 'nojenta', 'horroroso', 'horrorosa', 'inutil', 'fracassado', 'fracassada', 'perdedor',
  'retardado', 'retardada', 'mongol', 'vagabundo', 'vagabunda', 'vadia', 'puta', 'porra', 'caralho', 'merda', 'foda', 'fodase',
  'fdp', 'vsf', 'vtnc', 'pqp', 'cu', 'bosta', 'desgraca', 'desgracado', 'desgracada', 'arrombado', 'arrombada', 'corno',
  'piranha', 'viado', 'bicha', 'sapatao', 'trouxa', 'cretino', 'cretina', 'escroto', 'escrota', 'patetico', 'patetica',
  'chato', 'chata', 'odeio', 'odio', 'nojo', 'vergonhoso', 'lerdo', 'lerda', 'besta', 'tosco', 'tosca', 'kys',
];
const BODY = [
  'gordo', 'gorda', 'gordos', 'gordas', 'gordinho', 'gordinha', 'gordao', 'gordona', 'baleia', 'obeso', 'obesa', 'rolha',
  'magrelo', 'magrela', 'esqueleto', 'palito', 'pelancuda', 'pelancudo', 'banha', 'pochete', 'pansa', 'panca', 'barrigudo',
  'barriguda', 'baixinho', 'nanico', 'nanica', 'tabua', 'peso', 'quilos', 'kilos', 'kg', 'emagrece', 'emagrecer', 'engorda',
  'engordou', 'engordar', 'dieta', 'corpo',
];
// Expressões (substring depois de normalizar).
const NEGATIVE_PHRASES = [
  'se mata', 'se matar', 'vai morrer', 'morre logo', 'ninguem liga', 'ninguem gosta de voce', 'ninguem te ama', 'desiste',
  'nunca vai conseguir', 'nao vai conseguir', 'nao serve pra nada', 'que vergonha', 'sem graca', 'que preguica', 'mentiroso',
  'mentirosa', 'falso', 'falsa', 'deveria ter vergonha', 'cala a boca', 'cala boca', 'vai se ferrar', 'vai pro inferno',
  'tomara que', 'quem liga', 'e dai', 'fake', 'cringe', 'mico',
];
const CONTACT_WORDS = ['whatsapp', 'whats', 'zap', 'wpp', 'insta', 'instagram', 'telegram', 'discord', 'tiktok', 'snap', 'snapchat', 'face', 'facebook', 'email', 'gmail', 'hotmail', 'arroba', 'pix'];

export function checkKindness(raw: string): KindnessResult {
  const text = raw.replace(/\s+/g, ' ').trim();
  if (!text) return { ok: false, reason: 'vazio' };
  if (text.length > MAX_COMMENT) return { ok: false, reason: 'longo' };
  if (/[\w.+-]+@[\w-]+\.\w+/.test(text) || /(?:\d[\s().-]*){8,}/.test(text) || /(^|\s)@[\w.]{3,}/.test(text)) {
    return { ok: false, reason: 'contato' };
  }
  if (/(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|br|io|me|gg|ly|app)\b)/i.test(text)) return { ok: false, reason: 'link' };
  const norm = normalize(text);
  const words = new Set(norm.split(' '));
  if (CONTACT_WORDS.some((w) => words.has(w))) return { ok: false, reason: 'contato' };
  if (BODY.some((w) => words.has(w))) return { ok: false, reason: 'corpo' };
  if (OFFENSE.some((w) => words.has(w))) return { ok: false, reason: 'ofensa' };
  // Palavras grudadas ou disfarçadas com espaço (i d i o t a).
  const joined = norm.replace(/ /g, '');
  if (['idiota', 'imbecil', 'babaca', 'otario', 'caralho', 'porra', 'merda', 'vagabund', 'retardad', 'desgrac', 'arrombad'].some((w) => joined.includes(w))) {
    return { ok: false, reason: 'ofensa' };
  }
  if (NEGATIVE_PHRASES.some((p) => ` ${norm} `.includes(` ${p} `))) return { ok: false, reason: 'negativo' };
  return { ok: true, text };
}

/** Elogios prontos: o único jeito de comentar para menores de 18 anos. */
export const PRESET_COMMENTS = [
  'Que orgulho de você! 💛',
  'Arrasou! 👏',
  'Continua assim! 💪',
  'Que fofo o seu Hami! 🐹',
  'Você me inspira! ✨',
  'Um passo de cada vez 🌻',
  'Tô torcendo por você! 🤗',
  'Que casa linda! 🏡',
  'Parabéns pela conquista! 🏅',
  'Cuidar de si é lindo 💐',
];

export const REACTIONS = [
  { id: 'carinho', emoji: '💛', label: 'Carinho' },
  { id: 'parabens', emoji: '👏', label: 'Parabéns' },
  { id: 'forca', emoji: '💪', label: 'Força' },
  { id: 'girassol', emoji: '🌻', label: 'Girassol' },
  { id: 'abraco', emoji: '🤗', label: 'Abraço' },
] as const;

export type ReactionId = (typeof REACTIONS)[number]['id'];
export const REACTION_IDS = REACTIONS.map((r) => r.id) as string[];
