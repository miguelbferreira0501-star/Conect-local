import { describe, expect, it } from 'vitest';
import { plannedNotifications } from './nativeReminders';
import { fresh } from './store';

describe('lembretes no app da loja', () => {
  it('agenda os próximos dias, só no futuro, com ids diferentes', () => {
    const s = { ...fresh(), onboarded: true, settings: { ...fresh().settings, notif: { ...fresh().settings.notif, enabled: true, time: '19:00' } } };
    s.pet = { ...s.pet, name: 'Pudim' };
    const now = new Date(2026, 10, 5, 14, 0);
    const list = plannedNotifications(s, now);
    expect(list.length).toBeGreaterThan(8);
    expect(list.every((n) => n.schedule.at.getTime() > now.getTime())).toBe(true);
    expect(new Set(list.map((n) => n.id)).size).toBe(list.length);
    expect(list.some((n) => n.body.includes('Pudim'))).toBe(true);
  });
  it('lembretes desligados: nada agendado', () => {
    expect(plannedNotifications({ ...fresh(), onboarded: true })).toEqual([]);
  });
});
