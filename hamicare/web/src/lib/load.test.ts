import { describe, expect, it } from 'vitest';

// Simula abrir o app num aparelho que já tinha um estado salvo da versão anterior.
const day = new Date().toISOString().slice(0, 10);
const T = (id: string, cat: string) => ({ id, title: id, emoji: '⭐', cat, freq: { kind: 'diaria' }, reward: 3, energy: 1, createdAt: day });
const saved = {
  v: 2,
  onboarded: true,
  createdAt: day,
  coins: 123,
  xp: 300,
  tasks: [T('forca', 'fitness'), T('respirar', 'emocional'), T('vitamina', 'habitos'), T('lanche', 'habitos')],
  profile: { name: 'Miguel', ageGroup: '18mais', goal: 'ganhar', focus: [], minutes: 15, likes: [], incentive: 'carinho', feeling: 3 },
};
const mem: Record<string, string> = { 'hamicare:v2': JSON.stringify(saved) };
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => mem[k] ?? null,
  setItem: (k: string, v: string) => void (mem[k] = v),
  removeItem: (k: string) => void delete mem[k],
  clear: () => undefined,
  key: () => null,
  length: 0,
};

describe('abrir o app com dados antigos', () => {
  it('mantém o progresso, tira as missões de comida e completa até 7 hábitos', async () => {
    const { getState, PLAN_MIN } = await import('./store');
    const s = getState();
    expect(s.onboarded).toBe(true);
    expect(s.coins).toBe(123);
    expect(s.profile.name).toBe('Miguel');
    expect(s.tasks.some((t) => t.id === 'vitamina' || t.id === 'lanche')).toBe(false);
    expect(s.tasks.length).toBeGreaterThanOrEqual(PLAN_MIN);
    expect(s.missionsV).toBe(1);
    // Curva nova: quem estava no nível 4 (300 XP na curva antiga) continua no nível 4.
    const { levelOf } = await import('../logic/progress');
    expect(levelOf(s.xp)).toBe(4);
    expect(s.xpV).toBe(2);
    expect(s.game.maxLevel).toBe(4);
    expect(s.game.ledger).toEqual([]);
  });
});
