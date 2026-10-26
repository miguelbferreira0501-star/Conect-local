import { describe, expect, it } from 'vitest';
import { bookingFlow, bookingOccurrences, stayNights } from '../src/flows';
import { normalizePixKey, pixPayload } from '../src/pix';
import { loyaltyProgress, packageSavings } from '../src/benefits';
import { zonedToUtc } from '../src/time';

const TZ = 'America/Sao_Paulo';

describe('cada área marca do seu jeito', () => {
  it('escolhe o fluxo pela categoria', () => {
    expect(bookingFlow('banho-e-tosa', 'slot')).toBe('grooming');
    expect(bookingFlow('hospedagem-e-creche', 'day')).toBe('stay');
    expect(bookingFlow('hospedagem-e-creche', 'slot')).toBe('daycare');
    expect(bookingFlow('pet-taxi', 'slot')).toBe('ride');
  });

  it('pet sitter: cada dia × cada turno', () => {
    const start = zonedToUtc('2026-11-02', 8 * 60, TZ);
    const out = bookingOccurrences({ startsAt: start, timezone: TZ, mode: 'period', untilDate: '2026-11-04', periods: ['evening', 'morning'] });
    expect(out).toHaveLength(6);
    expect(out[0].getTime()).toBe(start.getTime());
  });

  it('passeio: dias da semana escolhidos por N semanas', () => {
    const start = zonedToUtc('2026-11-02', 9 * 60, TZ); // segunda
    const out = bookingOccurrences({ startsAt: start, timezone: TZ, mode: 'slot', weekdays: [1, 3, 5], repeat: { everyWeeks: 1, count: 2 } });
    expect(out).toHaveLength(6);
    expect(out.every((d) => d.getUTCHours() === 12)).toBe(true);
  });

  it('limita o tamanho do pedido', () => {
    const start = zonedToUtc('2026-11-02', 9 * 60, TZ);
    expect(() => bookingOccurrences({ startsAt: start, timezone: TZ, mode: 'period', untilDate: '2026-12-30', periods: ['morning'] })).toThrow(/período/);
  });

  it('hospedagem: a saída não conta como diária', () => {
    expect(stayNights('2026-12-30', '2027-01-02')).toEqual(['2026-12-30', '2026-12-31', '2027-01-01']);
    expect(stayNights('2026-12-30', '2026-12-30')).toEqual([]);
  });
});

describe('Pix copia e cola', () => {
  it('normaliza as chaves', () => {
    expect(normalizePixKey('(47) 99999-0000')).toBe('+5547999990000');
    expect(normalizePixKey('529.982.247-25')).toBe('52998224725');
    expect(normalizePixKey('Dono@Banho.com')).toBe('dono@banho.com');
    expect(normalizePixKey('abc')).toBeNull();
  });

  it('gera o código com valor e CRC válidos', () => {
    const code = pixPayload({ key: 'dono@banho.com', amountCents: 2000, name: 'Banho & Tosa São João', city: 'Joinville' });
    expect(code.startsWith('000201')).toBe(true);
    expect(code).toContain('540520.00');
    expect(code).toContain('5919BANHO TOSA SAO JOAO');
    expect(code).toMatch(/6304[0-9A-F]{4}$/);
  });
});

describe('benefícios', () => {
  it('fidelidade e economia do pacote', () => {
    expect(loyaltyProgress(9, 10)).toMatchObject({ stamps: 9, nextIsFree: true });
    expect(loyaltyProgress(10, 10)).toMatchObject({ stamps: 0, rewardsEarned: 1 });
    expect(packageSavings({ sessions: 4, priceCents: 20000, singlePriceCents: 6000 })).toBe(17);
    expect(packageSavings({ sessions: 4, priceCents: 30000, singlePriceCents: 6000 })).toBeNull();
  });
});
