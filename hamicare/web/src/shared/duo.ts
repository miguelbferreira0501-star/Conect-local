// Ofensiva em dupla: você e um amigo mantêm uma sequência juntos.
// O dia conta quando os dois fazem pelo menos 1 tarefa. Se hoje ainda não fechou, a sequência conta até ontem.

const shift = (d: string, n: number) => {
  const t = new Date(`${d}T12:00:00Z`);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
};

/** Dias em que os dois fizeram a parte deles. */
export function duoBoth(
  mine: Iterable<string>,
  theirs: Iterable<string>,
): Set<string> {
  const t = new Set(theirs);
  return new Set([...mine].filter((d) => t.has(d)));
}

/** Dias seguidos (até hoje, ou até ontem se hoje ainda falta alguém). */
export function duoStreak(both: Set<string>, today: string): number {
  let d = both.has(today) ? today : shift(today, -1);
  let n = 0;
  while (both.has(d)) {
    n++;
    d = shift(d, -1);
  }
  return n;
}

/** Maior sequência que a dupla já teve. */
export function duoBest(both: Set<string>): number {
  let best = 0;
  for (const d of both) {
    if (both.has(shift(d, -1))) continue;
    let n = 0;
    let x = d;
    while (both.has(x)) {
      n++;
      x = shift(x, 1);
    }
    best = Math.max(best, n);
  }
  return best;
}

/** Os últimos 7 dias (do mais antigo para hoje), com quem fez. */
export function duoWeek(
  mine: Set<string>,
  theirs: Set<string>,
  today: string,
): { date: string; me: boolean; partner: boolean }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = shift(today, i - 6);
    return { date, me: mine.has(date), partner: theirs.has(date) };
  });
}

/** Marcos que ganham comemoração. */
export const DUO_MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365] as const;
