// "O Lumbi que lembra de você": ele guarda o que você contou (humor, emoções, diário, água, sono, os dias
// em que vocês se viram) e volta no assunto nos dias seguintes, como um amigo que se importa.
// Tudo é calculado no aparelho, a partir do que já está salvo. Nada disso vai para os amigos.
import { addDays, dayDiff } from "./util";
import { streakOf } from "../logic/streak";
import type { PetMood, State } from "../types";

export interface MemoryReply {
  label: string;
  answer: string;
}
export interface Memory {
  /** Identifica a lembrança (para não repetir a mesma no dia seguinte). */
  id: string;
  text: string;
  mood: PetMood;
  replies: [MemoryReply, MemoryReply];
}

const HARD: Record<string, string> = {
  Ansioso: "ansiedade",
  Cansado: "cansaço",
  Triste: "tristeza",
  Irritado: "irritação",
  Sozinho: "solidão",
};
const GOOD: Record<string, string> = {
  Grato: "gratidão",
  Orgulhoso: "orgulho",
  Animado: "animação",
  Esperançoso: "esperança",
  Calmo: "calma",
};

/** Coisas que a pessoa contou no diário e que valem uma pergunta depois ("Como foi a prova?"). */
const EVENTS: [RegExp, string][] = [
  [/\bprovas?\b|\bvestibular|\benem\b/i, "a prova"],
  [/entrevista/i, "a entrevista"],
  [/consulta|m[ée]dic[oa]|dentista|exame/i, "a consulta"],
  [/apresenta[çc][ãa]o|semin[áa]rio/i, "a apresentação"],
  [/reuni[ãa]o/i, "a reunião"],
  [/viagem|viajar/i, "a viagem"],
  [/anivers[áa]rio/i, "o aniversário"],
  [/primeiro dia/i, "o primeiro dia"],
  [/encontro|date\b/i, "o encontro"],
  [/jogo|campeonato|competi[çc][ãa]o/i, "o jogo"],
  [/mudan[çc]a|me mudar/i, "a mudança"],
];

const quote = (t: string, n = 70) => {
  const one = t.replace(/\s+/g, " ").trim();
  return one.length > n ? `${one.slice(0, n - 1).trimEnd()}…` : one;
};
const quando = (n: number) =>
  n === 1 ? "Ontem" : n === 7 ? "Uma semana atrás" : `Há ${n} dias`;
const active = (s: State, key: string) =>
  Object.keys(s.days[key]?.done ?? {}).length > 0 || !!s.days[key]?.mood;

/** Todas as lembranças possíveis para hoje, da mais importante para a menos. */
export function memoriesFor(s: State, today: string): Memory[] {
  const out: Memory[] = [];
  const name = s.pet.name.trim() || "Lumbi";
  // Ele fala de si no masculino ou no feminino, conforme você escolheu no começo.
  const o = s.pet.gender === "menina" ? "a" : "o";
  const yesterday = addDays(today, -1);
  const y = s.days[yesterday];
  const age = dayDiff(s.createdAt.slice(0, 10), today);
  if (age < 1) return out;

  // 1. Voltou depois de sumir alguns dias.
  let gap = 0;
  for (let i = 1; i <= 30 && !active(s, addDays(today, -i)); i++) gap = i;
  if (gap >= 3 && gap < age) {
    out.push({
      id: `volta:${today}`,
      text: `Senti sua falta! Faz ${gap + 1} dias que a gente não se via. Que bom que você voltou 💛`,
      mood: "amor",
      replies: [
        {
          label: "Também senti 🥹",
          answer:
            "Hoje a gente vai devagarinho, juntos. Uma tarefa já está ótimo!",
        },
        {
          label: "Foi corrido…",
          answer:
            "Eu entendo. O importante é que você está aqui agora. Sem pressa!",
        },
      ],
    });
  }

  // 2. Algo que a pessoa contou no diário (uma prova, uma consulta…) nos últimos dias.
  const recent = [...s.journal].filter((j) => {
    const n = dayDiff(j.date, today);
    return n >= 1 && n <= 4;
  });
  for (const j of recent.reverse()) {
    const hit = EVENTS.find(([re]) => re.test(j.text));
    if (!hit) continue;
    const n = dayDiff(j.date, today);
    out.push({
      id: `diario:${j.id}`,
      text: `${quando(n)} você me contou sobre ${hit[1]}. Como foi? Fiquei pensando em você!`,
      mood: "feliz",
      replies: [
        {
          label: "Foi bem! 🎉",
          answer: `Eu sabia! Estou muito orgulhos${o} de você. Conta tudo no diário depois?`,
        },
        {
          label: "Não foi como eu queria",
          answer:
            "Tudo bem não dar certo sempre. Você tentou, e isso já é coragem. Estou aqui 💛",
        },
      ],
    });
    break;
  }

  // 3. Ontem foi difícil (humor baixo ou emoções pesadas).
  const hard = (y?.emotions ?? []).map((e) => HARD[e]).filter(Boolean);
  if (y && ((y.mood ?? 3) <= 2 || hard.length)) {
    const what = hard.length
      ? `muita ${hard[0]}`.replace("muita cansaço", "muito cansaço")
      : "um dia difícil";
    out.push({
      id: `ontem-dificil:${yesterday}`,
      text: hard.length
        ? `Ontem você sentiu ${what}. Hoje está um pouquinho melhor?`
        : `Ontem foi ${what} para você. Hoje está um pouquinho melhor?`,
      mood: "amor",
      replies: [
        {
          label: "Melhor sim 💛",
          answer: "Que bom! Fico feliz de verdade. Vamos fazer hoje ser leve.",
        },
        {
          label: "Ainda difícil",
          answer:
            "Tudo bem. Hoje a gente vai no seu tempo, uma coisinha de cada vez. Estou do seu lado.",
        },
      ],
    });
  }

  // 4. Uma semana atrás estava mal e agora está bem.
  const weekAgo = s.days[addDays(today, -7)]?.mood;
  const now = s.days[today]?.mood ?? y?.mood;
  if (weekAgo && now && weekAgo <= 2 && now >= 4) {
    out.push({
      id: `melhorou:${today}`,
      text: `Uma semana atrás foi um dia bem difícil. Agora você marcou que está bem! Estou orgulhos${o} de você 💛`,
      mood: "risada",
      replies: [
        {
          label: "Valeu! 🥰",
          answer: "Você que fez isso acontecer. Eu só fiquei do lado!",
        },
        {
          label: "Aos pouquinhos",
          answer: "Aos pouquinhos é o melhor jeito. Continua assim!",
        },
      ],
    });
  }

  // 5. Ontem foi bom (gratidão, orgulho…).
  const good = (y?.emotions ?? []).map((e) => GOOD[e]).filter(Boolean);
  if (good.length && !hard.length) {
    out.push({
      id: `ontem-bom:${yesterday}`,
      text: `Ontem você sentiu ${good[0]}! Quero mais dias assim com você. O que deixou o dia tão bom?`,
      mood: "risada",
      replies: [
        {
          label: "Coisas pequenas ✨",
          answer:
            "As coisas pequenas são as melhores. Vamos procurar mais delas hoje!",
        },
        {
          label: "Nem sei!",
          answer: "Às vezes o dia é bom e pronto. A gente aproveita!",
        },
      ],
    });
  }

  // 6. Pouca água nos últimos 3 dias (de quem costuma marcar água).
  const goal = s.settings.waterGoal ?? 8;
  const last3 = [1, 2, 3].map((i) => s.days[addDays(today, -i)]?.water ?? 0);
  const tracks = Object.values(s.days).some((d) => (d.water ?? 0) > 0);
  if (tracks && last3.every((w) => w < goal / 2)) {
    out.push({
      id: `agua:${today}`,
      text: `Faz 3 dias que você bebe pouquinha água. Hoje a gente bebe juntos? Eu pego o meu potinho! 💧`,
      mood: "feliz",
      replies: [
        {
          label: "Bora! 💧",
          answer:
            "Combinado! Cada copo que você marcar, eu bebo um golinho também.",
        },
        {
          label: "Vou tentar",
          answer: "Tentar já vale muito. Começa com um copo agora?",
        },
      ],
    });
  }

  // 7. Sono: tem a missão de dormir no horário e não fez nos últimos 3 dias (mas já fez antes).
  if (s.tasks.some((t) => t.id === "sono")) {
    const miss = [1, 2, 3].every(
      (i) => !("sono" in (s.days[addDays(today, -i)]?.done ?? {})),
    );
    const ever = Object.values(s.days).some((d) => "sono" in d.done);
    if (miss && ever) {
      out.push({
        id: `sono:${today}`,
        text: `Faz 3 noites que você dorme tarde. Hoje a gente deita mais cedinho? Eu já estou com soninho 😴`,
        mood: "sono",
        replies: [
          {
            label: "Combinado 🌙",
            answer: "Eba! Vou separar o travesseiro mais fofinho.",
          },
          {
            label: "Hoje não dá",
            answer: "Tudo bem. Amanhã a gente tenta de novo, sem culpa.",
          },
        ],
      });
    }
  }

  // 8. Marcos: dias seguidos e "aniversário" de vocês.
  const streak = streakOf(s.days, today, s.createdAt).count;
  if ([7, 14, 21, 30, 50, 100, 200, 365].includes(streak)) {
    out.push({
      id: `sequencia:${streak}`,
      text: `Já são ${streak} dias seguidos cuidando de você! Lembra do primeiro dia? Olha o quanto a gente andou 🔥`,
      mood: "risada",
      replies: [
        {
          label: "Que orgulho! 🔥",
          answer: "Muito! E eu estive aqui em cada um desses dias.",
        },
        {
          label: "Nem acredito",
          answer: "Pode acreditar: foi você que fez cada um deles!",
        },
      ],
    });
  }
  const marks: Record<number, string> = {
    7: "uma semana",
    30: "um mês",
    100: "100 dias",
    182: "meio ano",
    365: "um ano",
  };
  if (marks[age]) {
    out.push({
      id: `aniversario:${age}`,
      text: `Hoje faz ${marks[age]} que você me resgatou daquela chuva. Obrigado por cuidar de mim (e de você) 🥹`,
      mood: "amor",
      replies: [
        {
          label: `Te amo, ${name}!`,
          answer: "Eu também! Vamos ter muitos dias mais juntos.",
        },
        {
          label: "Passou rápido!",
          answer: "Passou mesmo! E cada dia valeu a pena.",
        },
      ],
    });
  }

  // 9. Algo do diário de uma semana atrás (para ver o quanto mudou).
  const old = s.journal.find((j) => dayDiff(j.date, today) === 7);
  if (old) {
    out.push({
      id: `diario7:${old.id}`,
      text: `Uma semana atrás você escreveu: “${quote(old.text)}”. Como isso está agora?`,
      mood: "feliz",
      replies: [
        {
          label: "Melhorou!",
          answer:
            "Que bom! Uma semana faz diferença, né? Estou feliz por você.",
        },
        {
          label: "Ainda igual",
          answer:
            "Tudo bem. Algumas coisas levam tempo. Eu continuo aqui com você.",
        },
      ],
    });
  }

  return out;
}

/** A lembrança de hoje (no máximo uma por dia; nunca a mesma de ontem). */
export function memoryOf(s: State, today: string): Memory | null {
  if (s.memo?.day === today) return null;
  const list = memoriesFor(s, today).filter((m) => m.id !== s.memo?.id);
  return list[0] ?? null;
}
