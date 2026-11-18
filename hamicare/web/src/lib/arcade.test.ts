import { describe, expect, it } from 'vitest';
import { finishGame, fresh, gameCoins, gameLocked, gamePrizesLeft, getState, JOGO, replaceState, todayKey } from './store';
import { addDays } from './util';

function start(premium = false) {
  const base = fresh();
  replaceState({ ...base, onboarded: true, coins: 0, premium: premium ? { trialStart: null, until: addDays(todayKey(), 30) } : base.premium });
}

describe('parque de jogos', () => {
  it('cada partida dá sementes pelas estrelas, até o limite do dia', () => {
    start();
    expect(finishGame('penalti', 3)).toBe(gameCoins('penalti', 3));
    expect(finishGame('memoria', 1)).toBe(gameCoins('memoria', 1));
    for (let i = 2; i < JOGO.perDay; i++) finishGame('carrinho', 2);
    expect(gamePrizesLeft(getState())).toBe(0);
    expect(finishGame('carrinho', 3)).toBe(0);
  });
  it('jogos do Plus ficam travados sem Plus e valem mais com Plus', () => {
    start();
    expect(gameLocked(getState(), 'volei')).toBe(true);
    expect(finishGame('volei', 3)).toBe(0);
    start(true);
    expect(gameLocked(getState(), 'volei')).toBe(false);
    expect(finishGame('volei', 3)).toBe(gameCoins('volei', 3));
    expect(gameCoins('volei', 3)).toBeGreaterThan(gameCoins('embaixadinha', 3));
  });
});
