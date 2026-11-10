import { describe, expect, it } from 'vitest';
import { brl, guardianBonus, guardianQuote } from './guardian';

describe('Guardiões do Hami', () => {
  it('níveis fixos: Aliado ajuda 1, Protetor ajuda 3', () => {
    expect(guardianQuote('aliado', 'mes')).toEqual({ seats: 1, months: 1, cents: 990 });
    expect(guardianQuote('protetor', 'ano')).toEqual({ seats: 3, months: 12, cents: 29700 });
  });
  it('Super-herói: o valor escolhido vira pessoas ajudadas', () => {
    expect(guardianQuote('heroi', 'mes', 5000)).toEqual({ seats: 5, months: 1, cents: 5000 });
    expect(guardianQuote('heroi', 'ano', 20000)).toEqual({ seats: 2, months: 12, cents: 20000 });
    expect(guardianQuote('heroi', 'mes', 500)).toBeNull();
    expect(guardianQuote('heroi', 'mes', 600_000)).toBeNull();
  });
  it('agradecimento em sementes tem teto', () => {
    expect(guardianBonus(3)).toBe(300);
    expect(guardianBonus(500)).toBe(3000);
  });
  it('valor em reais', () => {
    expect(brl(990).replace(/\s/g, ' ')).toBe('R$ 9,90');
  });
});
