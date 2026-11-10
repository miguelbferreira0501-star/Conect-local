// Turma: você e até 3 amigos, com 1 a 3 missões em comum por dia.
// Uma missão só conta quando todos da turma fazem; o dia fica completo quando todos fazem todas.

export const TEAM_MAX = 4;
/** Com HamiCare+ (de quem criou a turma), a turma pode ter até 8 pessoas. */
export const TEAM_MAX_PLUS = 8;
export const TEAM_MISSIONS_MAX = 3;

/** Missões que dá para fazer em turma (ids da biblioteca de missões: marcar a missão pessoal também marca a da turma). */
export const TEAM_MISSIONS = ['agua', 'caminhada', 'cama-arrumar', 'alongar', 'dentes', 'sono', 'sol', 'respirar', 'pausa', 'gratidao', 'natureza', 'passos'] as const;
export type TeamMission = (typeof TEAM_MISSIONS)[number];
export const isTeamMission = (x: string): x is TeamMission => (TEAM_MISSIONS as readonly string[]).includes(x);

/** Quem já fez cada missão no dia: id da pessoa → missões feitas. */
export type TeamCheckins = Record<string, string[]>;

export function missionDoneByAll(mission: string, members: string[], checkins: TeamCheckins): boolean {
  return members.length >= 2 && members.every((m) => (checkins[m] ?? []).includes(mission));
}

export function dayComplete(missions: string[], members: string[], checkins: TeamCheckins): boolean {
  return missions.length > 0 && missions.every((ms) => missionDoneByAll(ms, members, checkins));
}

/** Dias completos seguidos até hoje (se hoje ainda não fechou, conta até ontem). */
export function teamStreak(completeDays: Set<string>, today: string): number {
  const prev = (d: string) => {
    const t = new Date(`${d}T12:00:00Z`);
    t.setUTCDate(t.getUTCDate() - 1);
    return t.toISOString().slice(0, 10);
  };
  let d = completeDays.has(today) ? today : prev(today);
  let n = 0;
  while (completeDays.has(d)) {
    n++;
    d = prev(d);
  }
  return n;
}
