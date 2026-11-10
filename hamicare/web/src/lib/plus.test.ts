import { describe, expect, it } from 'vitest';
import { claimPlusWeekly, fresh, getState, hammersOf, plusWeeklyClaimed, replaceState, todayKey, PLUS_WEEKLY } from './store';
import { addDays } from './util';

function start(plus: boolean, extra: Partial<ReturnType<typeof fresh>> = {}) {
  const base = fresh();
  replaceState({ ...base, onboarded: true, coins: 0, premium: { trialStart: null, until: plus ? addDays(todayKey(), 30) : null }, ...extra });
}

describe('HamiCare+: mesada da semana', () => {
  it('sem Plus não tem mesada', () => {
    start(false);
    expect(claimPlusWeekly()).toBeNull();
    expect(getState().coins).toBe(0);
  });
  it('com Plus: 500 sementes uma vez por semana e um martelinho por mês', () => {
    start(true, { hammers: 0 });
    const r = claimPlusWeekly();
    expect(r).toEqual({ coins: PLUS_WEEKLY, hammer: true });
    // (pode vir junto uma conquista de sementes)
    const coins = getState().coins;
    expect(coins).toBeGreaterThanOrEqual(PLUS_WEEKLY);
    expect(hammersOf(getState())).toBe(1);
    expect(plusWeeklyClaimed(getState())).toBe(true);
    expect(claimPlusWeekly()).toBeNull();
    expect(getState().coins).toBe(coins);
  });
  it('o martelinho do mês não vem duas vezes no mesmo mês', () => {
    start(true, { hammers: 0, plusHammerMonth: todayKey().slice(0, 7) });
    expect(claimPlusWeekly()).toEqual({ coins: PLUS_WEEKLY, hammer: false });
  });
});
