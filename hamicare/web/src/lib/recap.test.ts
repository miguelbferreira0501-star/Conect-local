import { describe, expect, it } from 'vitest';
import { prevMonth, recapDue, recapOf, recapPick } from './recap';
import { fresh } from './store';
import type { State } from '../types';

const d = (done: string[], patch: object = {}) => ({ done: Object.fromEntries(done.map((x) => [x, 'habitos' as const])), care: [], ...patch });

function base(): State {
  const s = fresh();
  return {
    ...s,
    onboarded: true,
    createdAt: '2026-09-01',
    days: {
      '2026-10-01': d(['agua', 'dentes'], { water: 6, mood: 4, emotions: ['Grato'] }),
      '2026-10-02': d(['agua'], { water: 8, mood: 4, events: ['aventura', 'viagem:jardim'] }),
      '2026-10-03': d(['agua'], { mood: 2 }),
      '2026-10-10': d(['dentes'], { water: 2 }),
      '2026-11-02': d(['agua']),
    },
    journal: [{ id: 'j', date: '2026-10-05', text: 'oi' }],
  };
}

describe('retrospectiva do mês', () => {
  it('conta os dias, tarefas, água, humor, hábito favorito, sequência e viagens do mês', () => {
    const r = recapOf(base(), '2026-10');
    expect(r).toMatchObject({ monthName: 'outubro', daysInMonth: 31, daysCared: 4, tasks: 5, waterCups: 16, waterL: 4, bestRun: 3, trips: 1, place: 'Jardim Florido', journal: 1 });
    expect(r.mood).toMatchObject({ label: 'Bem', days: 2 });
    expect(r.emotion).toEqual({ name: 'Grato', days: 1 });
    expect(r.topTask?.times).toBe(3);
  });

  it('abre sozinha só na primeira semana do mês, uma vez, e só se teve cuidado', () => {
    const s = base();
    expect(prevMonth('2026-11-03')).toBe('2026-10');
    expect(prevMonth('2026-01-03')).toBe('2025-12');
    expect(recapDue(s, '2026-11-03')).toBe('2026-10');
    expect(recapDue(s, '2026-11-12')).toBeNull();
    expect(recapDue({ ...s, recapSeen: '2026-10' }, '2026-11-03')).toBeNull();
    expect(recapDue(s, '2026-10-03')).toBeNull(); // setembro não teve nada
    expect(recapPick(s, '2026-11-03')).toBe('2026-10');
    expect(recapPick(s, '2026-11-20')).toBe('2026-11');
  });
});
