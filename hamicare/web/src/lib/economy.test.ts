import { describe, expect, it } from 'vitest';
import { fresh, getState, replaceState, toggleTask, todayKey, setMood, addJournal, logEvent, onCelebrate, type Celebration } from './store';
import { DEFAULT_GAME as G, xpAt } from '../shared/game';
import type { Task } from '../types';
import { ACHIEVEMENTS } from '../logic/progress';

const allAch = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, '2026-01-01']));

const T = (id: string, energy: 1 | 2 | 3, cat: Task['cat'] = 'habitos'): Task => ({ id, title: id, emoji: '⭐', cat, freq: { kind: 'diaria' }, reward: 3, energy, createdAt: todayKey() });

function start(tasks: Task[], xp = 0) {
  const base = fresh();
  replaceState({ ...base, onboarded: true, missionsV: 1, xpV: 2, xp, coins: 0, tasks, achievements: allAch, game: { ...base.game, maxLevel: 1 }, profile: { ...base.profile, goal: 'habitos' } });
}

describe('economia no app', () => {
  it('missão paga uma vez; desmarcar devolve; marcar de novo paga uma vez só', () => {
    start([T('agua', 1)]);
    toggleTask('agua');
    expect(getState().xp).toBe(G.task.xp[0]);
    expect(getState().coins).toBe(G.task.coins[0]);
    toggleTask('agua');
    expect(getState().xp).toBe(0);
    expect(getState().coins).toBe(0);
    toggleTask('agua');
    expect(getState().xp).toBe(G.task.xp[0]);
    const refs = getState().game.ledger.map((l) => l.ref);
    expect(refs).toContain(`tarefa:${todayKey()}:agua`);
    expect(refs).toContain(`estorno:tarefa:${todayKey()}:agua`);
  });

  it('movimento para de render XP no teto do dia', () => {
    start(Array.from({ length: 6 }, (_, i) => T(`treino${i}`, 3, 'fitness')));
    for (let i = 0; i < 6; i++) toggleTask(`treino${i}`);
    expect(getState().xp).toBe(G.caps.category.fitness);
  });

  it('humor, diário e ferramenta de bem-estar pagam uma vez por dia', () => {
    start([]);
    setMood(4);
    setMood(5);
    addJournal('hoje foi bom');
    addJournal('de novo');
    logEvent('respirar');
    logEvent('respirar');
    expect(getState().xp).toBe(G.small.humor.xp + G.small.diario.xp + G.small.bemestar.xp);
  });

  it('subir de nível paga o prêmio do nível e da arena nova, com baú grátis', async () => {
    const seen: Celebration[] = [];
    const off = onCelebrate((c) => seen.push(c));
    start([T('corrida', 3, 'fitness')], xpAt(2, G) - 1);
    const before = getState().coins;
    toggleTask('corrida');
    await new Promise((r) => setTimeout(r, 5));
    off();
    const s = getState();
    expect(s.game.maxLevel).toBe(2);
    const arena = G.arenas.find((a) => a.n === 2)!;
    expect(s.coins - before).toBe(G.task.coins[2] + G.levelUp.base + G.levelUp.perLevel * 2 + arena.reward.coins);
    expect(s.game.pendingChests).toEqual([arena.reward.chest]);
    expect(seen.find((c) => c.type === 'level')).toMatchObject({ level: 2, arena: { n: 2 } });
  });

  it('desmarcar não faz voltar de nível, e o prêmio do nível não paga de novo', () => {
    start([T('corrida', 3, 'fitness')], xpAt(2, G) - 1);
    toggleTask('corrida');
    const coins = getState().coins;
    toggleTask('corrida');
    expect(getState().xp).toBe(xpAt(2, G));
    toggleTask('corrida');
    expect(getState().coins).toBe(coins);
    expect(getState().game.pendingChests).toHaveLength(1);
  });
});
