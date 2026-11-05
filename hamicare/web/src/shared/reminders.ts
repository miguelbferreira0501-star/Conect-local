// Lembretes ao longo do dia: água, cuidar do Hami, missões, pausa, hora de dormir e a volta dos passeios.
// O servidor usa este planejador a cada poucos minutos. Regras de gentileza:
// - no máximo 5 por dia, com pelo menos 1 hora entre um e outro;
// - nunca de madrugada (silêncio das 22h30 às 8h; para menores, das 21h30 às 8h);
// - cada lembrete sai uma vez só no seu horário, e nenhum fala em culpa.

export type ReminderKind = 'agua' | 'hami' | 'tarefas' | 'pausa' | 'dormir' | 'aventura' | 'missoes' | 'amigos';
export type WaterPlan = 'pouco' | 'normal' | 'muito';

export interface ReminderPrefs {
  enabled: boolean;
  /** Horário do lembrete das missões. */
  time: string;
  kinds: Partial<Record<ReminderKind, boolean>>;
  water: WaterPlan;
  /** Hora de dormir (lembrete para desacelerar). */
  bedtime: string;
}

/** Ligados quando a pessoa não escolheu: pausa e hora de dormir só se ela quiser. */
export const REMINDER_DEFAULTS: Record<ReminderKind, boolean> = { agua: true, hami: true, tarefas: true, aventura: true, missoes: true, amigos: true, pausa: false, dormir: false };

export const WATER_SLOTS: Record<WaterPlan, string[]> = {
  pouco: ['11:00', '16:00'],
  normal: ['10:00', '13:00', '16:00', '19:00'],
  muito: ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'],
};
export const PAUSE_TIME = '15:30';
export const HAMI_FROM = '12:00';
export const WEEKLY_TIME = '09:30';
export const DAILY_MAX = 5;
export const MIN_GAP_MS = 60 * 60_000;
/** Um horário vale até 2 horas depois (se o servidor estava dormindo, não manda atrasado demais). */
const WINDOW_MIN = 120;
export const QUIET = { adulto: { from: '22:30', to: '08:00' }, menor: { from: '21:30', to: '08:00' } };

/** Quanto a fome e a alegria do Hami caem por hora (o mesmo do app). */
export const DECAY_PER_HOUR = { felicidade: 1.5, saciedade: 2.5, limpeza: 1, energia: 1.2 };

const MSG: Record<Exclude<ReminderKind, 'amigos'>, string[]> = {
  agua: ['💧 Hora de um copo d’água! O {pet} já pegou o copinho dele.', 'Um gole de água agora? O {pet} brinda com você 💧', 'Pausa pra hidratar: o {pet} lembrou de você 💧', 'Água fresquinha faz bem. Bora, junto com o {pet}?'],
  hami: ['O {pet} está com saudade. Que tal um carinho? 🐹', 'O {pet} está com fome! Passa lá pra dar um lanchinho 🥕', 'O {pet} quer brincar um pouquinho com você.'],
  tarefas: ['Ainda dá tempo de uma missão leve hoje. O {pet} torce por você!', 'Uma coisinha só e pronto: o {pet} te espera nas missões.', 'Que tal um cuidado pequeno agora? Já conta para o dia.'],
  pausa: ['Pausa de 1 minuto? Respira junto com o {pet} 🧘', 'Solta os ombros e respira fundo. O {pet} faz junto.', 'Um alongamento rapidinho? O {pet} já começou 🙆'],
  dormir: ['Hora de desacelerar. O {pet} já está bocejando 🌙', 'Que tal deixar a tela de lado? O {pet} vai dormir também 🌙', 'Uma respiração calma antes de dormir? O {pet} te acompanha.'],
  aventura: ['O {pet} voltou do passeio e trouxe novidades!', 'O {pet} chegou da aventura. Vem ver o que ele achou!'],
  missoes: ['Desafios novos da semana chegaram! O {pet} já escolheu o favorito.', 'Semana nova, desafios novos. Bora ver?'],
};

const URL: Record<ReminderKind, string> = {
  agua: '/#atividades',
  hami: '/#cuidar',
  tarefas: '/#atividades',
  pausa: '/#bem-estar',
  dormir: '/#bem-estar',
  aventura: '/#mundo',
  missoes: '/#atividades',
  amigos: '/#amigos',
};

export interface Reminder {
  key: string;
  kind: ReminderKind;
  title: string;
  body: string;
  url: string;
  tag: string;
}

const toMin = (hm: string) => {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
};
/** Está no silêncio da noite? (janela que passa da meia-noite) */
export function isQuiet(hm: string, minor: boolean): boolean {
  const q = minor ? QUIET.menor : QUIET.adulto;
  const t = toMin(hm);
  return t >= toMin(q.from) || t < toMin(q.to);
}
const inWindow = (hm: string, at: string) => {
  const d = toMin(hm) - toMin(at);
  return d >= 0 && d <= WINDOW_MIN;
};

export function reminderText(kind: Exclude<ReminderKind, 'amigos'>, pet: string, seed: number): string {
  const list = MSG[kind];
  return list[Math.abs(seed) % list.length].replace(/\{pet\}/g, pet || 'Hami');
}

/** Fome e alegria de agora, pelo estado salvo e o tempo que passou. */
export function petNeeds(state: any, now: number): { saciedade: number; felicidade: number } | null {
  const st = state?.pet?.stats;
  if (!st) return null;
  const hours = Math.max(0, (now - (state.pet.statsAt ?? now)) / 3_600_000);
  return { saciedade: st.saciedade - DECAY_PER_HOUR.saciedade * hours, felicidade: st.felicidade - DECAY_PER_HOUR.felicidade * hours };
}

export interface LocalNow {
  /** AAAA-MM-DD no fuso da pessoa. */
  date: string;
  /** HH:MM no fuso da pessoa. */
  hm: string;
  /** 0 = domingo. */
  weekday: number;
  ms: number;
}

/** Hora local da pessoa no fuso dela. */
export function localNow(now: Date, tz: string): LocalNow {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const hour = parts.hour === '24' ? '00' : parts.hour;
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hm: `${hour}:${parts.minute}`, weekday, ms: now.getTime() };
}

/** Controle do que já saiu: chave → dia (ou valor), mais a hora do último e quantos saíram no dia. */
export type SentLog = Record<string, string | number>;

/**
 * O próximo lembrete que deve sair agora (ou nenhum). Devolve também o que gravar no controle,
 * inclusive horários que passaram sem enviar (para não sair atrasado depois).
 */
export function dueReminder(args: { prefs: ReminderPrefs; state: any; sent: SentLog; now: LocalNow; minor: boolean }): { reminder: Reminder | null; sent: SentLog } {
  const { prefs, state, now, minor } = args;
  const sent: SentLog = { ...args.sent };
  if (sent._day !== now.date) {
    sent._day = now.date;
    sent._count = 0;
  }
  const on = (k: ReminderKind) => prefs.kinds[k] ?? REMINDER_DEFAULTS[k];
  if (!prefs.enabled || isQuiet(now.hm, minor)) return { reminder: null, sent };
  if (Number(sent._count ?? 0) >= DAILY_MAX) return { reminder: null, sent };
  if (now.ms - Number(sent._last ?? 0) < MIN_GAP_MS) return { reminder: null, sent };

  const pet = String(state?.pet?.name ?? 'Hami');
  const seed = Math.floor(now.ms / 86_400_000);
  const done = (key: string, value: string = now.date) => sent[key] === value;
  const pick = (kind: Exclude<ReminderKind, 'amigos'>, key: string, value: string = now.date): { reminder: Reminder; sent: SentLog } => ({
    reminder: { key, kind, title: 'HamiCare', body: reminderText(kind, pet, seed + key.length), url: URL[kind], tag: `hamicare-${kind}` },
    sent: { ...sent, [key]: value, _last: now.ms, _count: Number(sent._count ?? 0) + 1 },
  });

  // 1. Voltou do passeio (uma vez por passeio).
  const adv = state?.adventure;
  if (on('aventura') && adv?.endsAt && adv.endsAt <= now.ms && !done('aventura', String(adv.endsAt))) return pick('aventura', 'aventura', String(adv.endsAt));

  // 2. O Hami precisa de você (uma vez por dia, depois do meio-dia).
  const needs = petNeeds(state, now.ms);
  if (on('hami') && needs && (needs.saciedade < 30 || needs.felicidade < 30) && toMin(now.hm) >= toMin(HAMI_FROM) && !done('hami')) return pick('hami', 'hami');

  // 3. Missões do dia, no horário escolhido, se ainda faltar alguma.
  const today = state?.days?.[now.date];
  const doneCount = today?.done ? Object.keys(today.done).length : 0;
  const total = Array.isArray(state?.tasks) ? state.tasks.length : 0;
  if (on('tarefas') && inWindow(now.hm, prefs.time) && !done('tarefas') && (total === 0 || doneCount < total)) return pick('tarefas', 'tarefas');

  // 4. Hora de dormir (só se a pessoa ligou).
  if (on('dormir') && inWindow(now.hm, prefs.bedtime) && !done('dormir')) return pick('dormir', 'dormir');

  // 5. Água: o horário mais recente que ainda não saiu (os anteriores ficam marcados, sem atraso).
  if (on('agua')) {
    const slots = WATER_SLOTS[prefs.water] ?? WATER_SLOTS.normal;
    const due = slots.filter((at) => toMin(at) <= toMin(now.hm) && !done(`agua:${at}`));
    const latest = due[due.length - 1];
    if (latest) {
      for (const at of due.slice(0, -1)) sent[`agua:${at}`] = now.date;
      if (inWindow(now.hm, latest)) return pick('agua', `agua:${latest}`);
      sent[`agua:${latest}`] = now.date;
    }
  }

  // 6. Pausa da tarde (só se a pessoa ligou).
  if (on('pausa') && inWindow(now.hm, PAUSE_TIME) && !done('pausa')) return pick('pausa', 'pausa');

  // 7. Desafios novos da semana (segunda de manhã).
  if (on('missoes') && now.weekday === 1 && inWindow(now.hm, WEEKLY_TIME) && !done('missoes')) return pick('missoes', 'missoes');

  return { reminder: null, sent };
}
