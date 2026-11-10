import { describe, expect, it } from 'vitest';
import {
  applyHammers, buyHammer, claimFriendReward, claimQuickMeta, fresh, getState, hammersOf, quickDone, quickEmotion, quickMetaReady, quickReflection, replaceState, todayKey, toggleTask,
} from './store';
import { addDays } from './util';
import { HAMMER_PRICE } from '../shared/game';
import type { DayLog, Task } from '../types';

const T = (id: string): Task => ({ id, title: id, emoji: '⭐', cat: 'habitos', freq: { kind: 'diaria' }, reward: 3, energy: 1, createdAt: todayKey() });
function start(coins = 0, extra: Partial<ReturnType<typeof fresh>> = {}) {
  const base = fresh();
  replaceState({ ...base, onboarded: true, missionsV: 1, xpV: 2, coins, tasks: [T('agua')], profile: { ...base.profile, goal: 'habitos' }, ...extra });
}

describe('missões rápidas (a cada 8 horas)', () => {
  it('nomear a emoção paga uma vez por turno', () => {
    start();
    expect(quickEmotion(['Calmo'])).toBe(4);
    expect(quickDone(getState(), 'emocao')).toBe(true);
    expect(quickEmotion(['Grato'])).toBe(0);
    expect(getState().days[todayKey()].emotions).toEqual(['Calmo', 'Grato']);
  });
  it('reflexão maior vale mais e vai para o diário', () => {
    start();
    expect(quickReflection('curta')).toBe(0); // menos de 10 letras não vale
    expect(quickReflection('x'.repeat(420))).toBe(12);
    expect(getState().journal.length).toBe(1);
  });
  it('"complete uma meta" fica pronta depois de uma missão e paga ao pegar', () => {
    start();
    expect(quickMetaReady(getState())).toBe(false);
    toggleTask('agua');
    expect(quickMetaReady(getState())).toBe(true);
    const before = getState().coins;
    expect(claimQuickMeta()).toBe(4);
    expect(getState().coins).toBe(before + 4);
    expect(claimQuickMeta()).toBe(0);
  });
});

describe('martelinho', () => {
  it('começa com 1, compra com sementes e não gasta à toa', () => {
    const today = todayKey();
    const on: DayLog = { done: { a: 'habitos' }, care: [] };
    const days: Record<string, DayLog> = {};
    for (let i = 0; i <= 20; i++) days[addDays(today, -i)] = on;
    start(0, { days, createdAt: addDays(today, -20) });
    expect(hammersOf(getState())).toBe(1);
    replaceState({ ...getState(), coins: 0 });
    expect(buyHammer()).toBe('sem-sementes');
    replaceState({ ...getState(), coins: getState().coins + HAMMER_PRICE });
    expect(buyHammer()).toBe('ok');
    expect(getState().game.ledger.find((l) => l.label === 'Martelinho')?.coins).toBe(-HAMMER_PRICE);
    expect(hammersOf(getState())).toBe(2);
    // Sem ofensiva quebrada, não há o que consertar e nenhum martelinho é gasto (o conserto em si é testado em streak.test.ts).
    expect(applyHammers()).toBeNull();
    expect(hammersOf(getState())).toBe(2);
  });
});

describe('prêmio por amigo', () => {
  it('cada amigo vale mais e só paga com amizades suficientes', () => {
    start();
    expect(claimFriendReward(2, 1)).toBe(0);
    expect(claimFriendReward(1, 1)).toBe(40);
    expect(claimFriendReward(1, 1)).toBe(0);
    expect(claimFriendReward(2, 3)).toBe(60);
  });
});

describe('casa na Lua', () => {
  it('custa 5.000 sementes, dá a casa lunar e o Hami se muda', async () => {
    const { buyMoon, homeArenaOf } = await import('./store');
    const { MOON_N, MOON_PRICE } = await import('../data/arenas');
    start(100);
    expect(buyMoon()).toBe('sem-sementes');
    replaceState({ ...getState(), coins: MOON_PRICE + 10 });
    expect(buyMoon()).toBe('ok');
    const s = getState();
    expect(s.moon).toBe(true);
    expect(homeArenaOf(s)).toBe(MOON_N);
    expect(s.house.wallpaper).toBe('p-lua');
    expect(s.inventory['foguete-hami']).toBe(1);
    expect(s.game.ledger.find((l) => l.label === 'Viagem para a Lua')?.coins).toBe(-MOON_PRICE);
    expect(buyMoon()).toBe('ja-tem');
  });
});
