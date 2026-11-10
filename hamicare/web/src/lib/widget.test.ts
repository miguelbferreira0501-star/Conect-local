import { describe, expect, it } from 'vitest';
import { widgetData } from './widget';
import { fresh } from './store';

describe('widget da tela do celular', () => {
  it('resume o dia: nome, missões, água em litros e ofensiva', () => {
    const base = fresh();
    const s = { ...base, onboarded: true, pet: { ...base.pet, name: 'Pudim' }, settings: { ...base.settings, waterGoal: 8 } };
    const d = widgetData(s, new Date(2026, 10, 10, 9, 0));
    expect(d.name).toBe('Pudim');
    expect(d.water).toBe('0 L de 2 L');
    expect(d.done).toBe(0);
    expect(typeof d.line).toBe('string');
    expect(d.line.length).toBeGreaterThan(3);
    expect(d.streak).toBe(0);
  });
});
