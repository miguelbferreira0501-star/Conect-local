import { describe, expect, it } from 'vitest';
import { computeAvailability, effectivePlan, PLANS } from '../src';

const tz = 'America/Sao_Paulo';
const now = new Date('2026-10-26T03:00:00Z'); // segunda 00:00 em SP
const hours = { '1': [['09:00', '12:00']] as Array<[string, string]> };

describe('agendas por nicho', () => {
  it('horário marcado: cada profissional tem a própria agenda', () => {
    const r = computeAvailability({
      mode: 'slot', date: '2026-10-26', timezone: tz, durationMinutes: 60, businessHours: hours, now,
      staff: [{ id: 'ana', name: 'Ana', openingHours: null }, { id: 'bia', name: 'Bia', openingHours: null }],
      busy: [{ starts_at: '2026-10-26T12:00:00Z', ends_at: '2026-10-26T13:00:00Z', staff_id: 'ana' }], // 09:00 Ana ocupada
    });
    const nine = r.slots.find((s) => s.label === '09:00')!;
    expect(nine.staffIds).toEqual(['bia']);
    expect(r.slots.find((s) => s.label === '10:00')!.staffIds.sort()).toEqual(['ana', 'bia']);
  });

  it('profissional com horário próprio (folga) não aparece no dia', () => {
    const r = computeAvailability({
      mode: 'slot', date: '2026-10-26', timezone: tz, durationMinutes: 60, businessHours: hours, now, busy: [],
      staff: [{ id: 'ana', name: 'Ana', openingHours: {} }, { id: 'bia', name: 'Bia', openingHours: null }],
    });
    expect(r.slots.every((s) => s.staffIds.join() === 'bia')).toBe(true);
  });

  it('sem equipe: agenda única da empresa', () => {
    const r = computeAvailability({ mode: 'slot', date: '2026-10-26', timezone: tz, durationMinutes: 90, businessHours: hours, now, busy: [], staff: [] });
    expect(r.slots.map((s) => s.label)).toEqual(['09:00', '09:30', '10:00', '10:30']);
  });

  it('dia e turno: só turnos em que a empresa abre', () => {
    const r = computeAvailability({ mode: 'period', date: '2026-10-26', timezone: tz, durationMinutes: null, businessHours: { '1': [['08:00', '17:00']] }, now, busy: [], staff: [] });
    expect(r.slots.map((s) => s.label)).toEqual(['morning', 'afternoon']);
  });

  it('diária: um dia ocupado some da lista', () => {
    const allWeek = Object.fromEntries(['0', '1', '2', '3', '4', '5', '6'].map((d) => [d, [['10:00', '22:00']]])) as Record<string, Array<[string, string]>>;
    const r = computeAvailability({
      mode: 'day', date: '2026-10-27', timezone: tz, durationMinutes: null, businessHours: allWeek, now, days: 3, staff: [],
      busy: [{ starts_at: '2026-10-28T03:00:00Z', ends_at: '2026-10-29T03:00:00Z', staff_id: null }],
    });
    expect(r.slots.map((s) => s.label)).toEqual(['2026-10-27', '2026-10-29']);
  });
});

describe('planos', () => {
  it('plano pago vencido volta a valer como grátis', () => {
    expect(effectivePlan('pro', '2026-01-01', now)).toBe('free');
    expect(effectivePlan('team', '2027-01-01', now)).toBe('team');
    expect(PLANS.pro.maxStaff).toBeGreaterThan(PLANS.free.maxStaff);
  });
});
