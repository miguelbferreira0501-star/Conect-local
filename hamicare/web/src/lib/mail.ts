// Correio do Hami: cartinhas do app (temporada nova, Guardiões, mesada do Plus…). Ficam no aparelho.
import { addDays, dayDiff } from './util';
import { isPremium, plusWeek, plusWeeklyClaimed, todayKey } from './store';
import type { UiTarget } from './bus';
import type { State } from '../types';

export interface Letter {
  id: string;
  /** Cor e desenho do envelope. */
  kind: 'estrela' | 'arco' | 'trofeu' | 'coracao' | 'presente';
  title: string;
  body: string;
  date: string;
  expires?: string;
  action?: { label: string; go: UiTarget | 'guardioes' };
}

const SEASON_NAMES = ['Verão das Ondas', 'Carnaval de Cores', 'Outono das Folhas', 'Bosque dos Cogumelos', 'Festa das Flores', 'Arraial do Hami', 'Inverno Quentinho', 'Ventania de Pipas', 'Primavera Florida', 'Noite das Lanternas', 'Trilha das Estrelas', 'Natal Iluminado'];

export function lettersOf(s: State, today = todayKey()): Letter[] {
  const month = today.slice(0, 7);
  const m = Number(today.slice(5, 7)) - 1;
  const lastDay = new Date(Number(today.slice(0, 4)), m + 1, 0).getDate();
  const pet = s.pet.name || 'Hami';
  const list: Letter[] = [
    {
      id: 'boas-vindas',
      kind: 'coracao',
      title: `Uma cartinha do ${pet}`,
      body: `Oi${s.profile.name ? `, ${s.profile.name}` : ''}! Que bom que você está aqui. Eu cresço um pouquinho cada vez que você cuida de você. Não precisa ser perfeito: um passo pequeno já conta. Com carinho, ${pet}.`,
      date: s.createdAt,
    },
    {
      id: `temporada:${month}`,
      kind: 'trofeu',
      title: `Nova temporada: ${SEASON_NAMES[m]}!`,
      body: 'A trilha da temporada abriu. Cada dia com pelo menos uma missão feita conta um dia na trilha, e cada degrau tem um prêmio: sementes, fragmentos e baús.',
      date: `${month}-01`,
      expires: `${month}-${String(lastDay).padStart(2, '0')}`,
      action: { label: 'Ver a trilha', go: 'temporada' },
    },
  ];
  if (s.profile.ageGroup !== 'ate12') {
    list.push({
      id: `guardioes:${month}`,
      kind: 'arco',
      title: 'Vamos celebrar os Guardiões!',
      body: 'Os Guardiões do Hami dão o HamiCare+ de presente para quem não pode pagar agora. Graças a eles, ninguém fica sem cuidado. Você pode pedir um presente ou virar Guardião.',
      date: `${month}-03` <= today ? `${month}-03` : `${month}-01`,
      action: { label: 'Conhecer os Guardiões', go: 'guardioes' },
    });
  }
  if (dayDiff(s.createdAt, today) >= 3) {
    list.push({
      id: 'gostando',
      kind: 'estrela',
      title: 'Está gostando do HamiCare? Conta pra gente!',
      body: `O ${pet} e a gente adoram saber como você está se sentindo por aqui. Se o app está te fazendo bem, chame um amigo para cuidar do Hami junto com você: cada amigo novo ainda vale sementes.`,
      date: addDays(s.createdAt, 3),
      action: { label: 'Convidar um amigo', go: 'amigos' },
    });
  }
  if (isPremium(s) && !plusWeeklyClaimed(s, today)) {
    list.push({
      id: `mesada:${plusWeek(today)}`,
      kind: 'presente',
      title: 'Sua mesada do Plus chegou!',
      body: 'Tem 500 sementes esperando por você nesta semana. É só pegar no cartão da mesada.',
      date: plusWeek(today),
      expires: addDays(plusWeek(today), 6),
      action: { label: 'Pegar a mesada', go: 'plus' },
    });
  }
  const gone = new Set(s.mail?.gone ?? []);
  return list.filter((l) => !gone.has(l.id) && l.date <= today && (!l.expires || l.expires >= today)).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const unreadMail = (s: State, today = todayKey()) => {
  const read = new Set(s.mail?.read ?? []);
  return lettersOf(s, today).filter((l) => !read.has(l.id)).length;
};

export function agoText(date: string, today = todayKey()) {
  const d = dayDiff(date, today);
  return d <= 0 ? 'hoje' : d === 1 ? 'há 1 dia' : d < 30 ? `há ${d} dias` : 'há mais de um mês';
}
