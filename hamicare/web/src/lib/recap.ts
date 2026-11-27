// Retrospectiva do mês (estilo "Wrapped"): os números bonitos do mês que passou, prontos para virar
// uma sequência de telas e uma imagem para os stories. Nunca entra peso nem o texto do diário.
import { MOODS } from "../data/lines";
import { destById } from "../data/destinations";
import { libById } from "../data/tasks";
import { addDays } from "./util";
import type { State } from "../types";

export interface Recap {
  /** AAAA-MM */
  month: string;
  /** "novembro" */
  monthName: string;
  daysInMonth: number;
  /** Dias com pelo menos 1 tarefa. */
  daysCared: number;
  tasks: number;
  waterCups: number;
  waterL: number;
  /** Humor mais marcado no mês. */
  mood: { emoji: string; label: string; days: number } | null;
  /** Emoção mais marcada. */
  emotion: { name: string; days: number } | null;
  /** Hábito que mais apareceu. */
  topTask: { title: string; emoji: string; times: number } | null;
  /** Maior sequência de dias seguidos dentro do mês. */
  bestRun: number;
  trips: number;
  /** Lugar favorito das viagens do mês. */
  place: string | null;
  journal: number;
}

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export const monthNameOf = (month: string) =>
  MONTHS[Number(month.slice(5, 7)) - 1] ?? "";
/** O mês anterior ao do dia (AAAA-MM). */
export const prevMonth = (today: string) =>
  addDays(`${today.slice(0, 7)}-01`, -1).slice(0, 7);

export function recapOf(s: State, month: string): Recap {
  const first = `${month}-01`;
  const daysInMonth = Number(
    addDays(addDays(first, 32).slice(0, 7) + "-01", -1).slice(8, 10),
  );
  const keys = Array.from({ length: daysInMonth }, (_, i) => addDays(first, i));
  let daysCared = 0;
  let tasks = 0;
  let waterCups = 0;
  let trips = 0;
  let run = 0;
  let bestRun = 0;
  const moods: Record<number, number> = {};
  const emotions: Record<string, number> = {};
  const taskCount: Record<string, number> = {};
  const places: Record<string, number> = {};
  for (const k of keys) {
    const d = s.days[k];
    const n = d ? Object.keys(d.done).length : 0;
    if (n) {
      daysCared++;
      run++;
      bestRun = Math.max(bestRun, run);
    } else if (!d?.rest && !d?.repaired) run = 0;
    if (!d) continue;
    tasks += n;
    waterCups += d.water ?? 0;
    if (d.mood) moods[d.mood] = (moods[d.mood] ?? 0) + 1;
    for (const e of d.emotions ?? []) emotions[e] = (emotions[e] ?? 0) + 1;
    for (const id of Object.keys(d.done))
      taskCount[id] = (taskCount[id] ?? 0) + 1;
    for (const ev of d.events ?? []) {
      if (ev === "aventura") trips++;
      if (ev.startsWith("viagem:"))
        places[ev.slice(7)] = (places[ev.slice(7)] ?? 0) + 1;
    }
  }
  const top = <T extends string | number>(m: Record<T, number>) =>
    (Object.entries(m) as [string, number][]).sort((a, b) => b[1] - a[1])[0] ??
    null;
  const m = top(moods);
  const moodDef = m ? MOODS.find((x) => x.value === Number(m[0])) : null;
  const e = top(emotions);
  const t = top(taskCount);
  const tDef = t ? (s.tasks.find((x) => x.id === t[0]) ?? libById(t[0])) : null;
  const p = top(places);
  return {
    month,
    monthName: monthNameOf(month),
    daysInMonth,
    daysCared,
    tasks,
    waterCups,
    waterL: Math.round(waterCups * 0.25 * 10) / 10,
    mood:
      m && moodDef
        ? { emoji: moodDef.emoji, label: moodDef.label, days: m[1] }
        : null,
    emotion: e ? { name: e[0], days: e[1] } : null,
    topTask:
      t && tDef ? { title: tDef.title, emoji: tDef.emoji, times: t[1] } : null,
    bestRun,
    trips,
    place: p ? (destById(p[0])?.name ?? null) : null,
    journal: s.journal.filter((j) => j.date.startsWith(month)).length,
  };
}

/** Tem o que mostrar? (pelo menos 3 dias de cuidado no mês) */
export const recapWorth = (r: Recap) => r.daysCared >= 3;

/** Mostrar sozinha nos primeiros dias do mês, uma vez, a retrospectiva do mês que passou. */
export function recapDue(s: State, today: string): string | null {
  if (!s.onboarded || Number(today.slice(8, 10)) > 7) return null;
  const month = prevMonth(today);
  if (s.recapSeen && s.recapSeen >= month) return null;
  return recapWorth(recapOf(s, month)) ? month : null;
}

/** Pelo menu: o mês passado (se teve cuidado) ou o mês de agora até hoje. */
export function recapPick(s: State, today: string): string {
  const prev = prevMonth(today);
  return Number(today.slice(8, 10)) <= 10 && recapWorth(recapOf(s, prev))
    ? prev
    : today.slice(0, 7);
}
