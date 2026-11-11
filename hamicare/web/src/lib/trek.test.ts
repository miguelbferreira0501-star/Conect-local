import { describe, expect, it } from 'vitest';
import { claimSeasonPlus, finishTrek, fresh, getState, mailClear, mailRead, replaceState, startTrek, todayKey, toggleTask, trekMissing, trekReady, SEASON_PLUS, TREK } from './store';
import { lettersOf, unreadMail } from './mail';
import { addDays } from './util';
import type { Task } from '../types';

const T = (id: string): Task => ({ id, title: id, emoji: '⭐', cat: 'habitos', freq: { kind: 'diaria' }, reward: 3, energy: 1, createdAt: todayKey() });
function start(extra: Partial<ReturnType<typeof fresh>> = {}) {
  const base = fresh();
  replaceState({ ...base, onboarded: true, missionsV: 1, xpV: 2, coins: 0, tasks: ['a', 'b', 'c', 'd'].map(T), profile: { ...base.profile, goal: 'habitos' }, ...extra });
}

describe('viagem do dia', () => {
  it('só sai depois de algumas missões, uma vez por dia', () => {
    start();
    expect(trekReady(getState())).toBe(false);
    expect(trekMissing(getState())).toBe(TREK.needs);
    expect(startTrek()).toBe(false);
    for (const id of ['a', 'b', 'c']) toggleTask(id);
    expect(trekReady(getState())).toBe(true);
    expect(startTrek(1000)).toBe(true);
    expect(getState().trek?.endsAt).toBe(1000 + TREK.hours * 3600_000);
    expect(startTrek()).toBe(false);
  });
  it('cada missão traz ele mais cedo; na volta dá sementes e uma comidinha', () => {
    start();
    for (const id of ['a', 'b', 'c']) toggleTask(id);
    startTrek(1000);
    const ends = getState().trek!.endsAt;
    toggleTask('d');
    expect(getState().trek!.endsAt).toBe(ends - TREK.perTaskMin * 60_000);
    expect(finishTrek(2000)).toBeNull();
    const coins = getState().coins;
    const r = finishTrek(getState().trek!.endsAt + 1)!;
    expect(r.coins).toBe(TREK.coins);
    expect(getState().coins).toBeGreaterThanOrEqual(coins + TREK.coins);
    expect(getState().inventory[r.food]).toBeGreaterThanOrEqual(1);
    expect(getState().trek).toBeNull();
    // hoje não sai de novo
    expect(trekReady(getState())).toBe(false);
  });
});

describe('trilha Plus da temporada', () => {
  it('só com Plus e com os dias ativos; uma vez por degrau', () => {
    start();
    expect(claimSeasonPlus(0, 5)).toBe(0);
    start({ premium: { trialStart: null, until: addDays(todayKey(), 30) } });
    expect(claimSeasonPlus(0, 0)).toBe(0);
    expect(claimSeasonPlus(0, 5)).toBe(SEASON_PLUS[0]);
    expect(claimSeasonPlus(0, 5)).toBe(0);
  });
});

describe('correio do Hami', () => {
  it('tem cartas novas, marca como lida e limpa', () => {
    start();
    const all = lettersOf(getState());
    expect(all.length).toBeGreaterThanOrEqual(2);
    expect(unreadMail(getState())).toBe(all.length);
    mailRead(all[0].id);
    expect(unreadMail(getState())).toBe(all.length - 1);
    mailClear(all.map((l) => l.id));
    expect(lettersOf(getState())).toHaveLength(0);
  });
  it('menores de 13 não recebem a carta dos Guardiões', () => {
    const base = fresh();
    replaceState({ ...base, onboarded: true, profile: { ...base.profile, ageGroup: 'ate12' } });
    expect(lettersOf(getState()).some((l) => l.id.startsWith('guardioes'))).toBe(false);
  });
});
