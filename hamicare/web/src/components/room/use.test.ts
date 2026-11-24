import { describe, expect, it } from 'vitest';
import { useKindOf } from '../Room';
import { arenaHouse, upgradeHouse } from '../../data/arenas';

describe('Hami usando os móveis', () => {
  it('cama deita, banheira dá banho, rodinha corre (sofá e cadeira são só decoração)', () => {
    expect(useKindOf('k-cama-rosa', 'k-cama')).toBe('deitar');
    expect(useKindOf('k-banheira-madeira', 'k-banheira')).toBe('banho');
    expect(useKindOf('k-sofa-azul', 'k-sofa')).toBeNull();
    expect(useKindOf('k-cadeira-madeira', 'k-cadeira')).toBeNull();
    expect(useKindOf('k-rodinha-azul', 'k-rodinha')).toBe('correr');
    expect(useKindOf('k-guarda-roupa-rosa', 'k-guarda-roupa')).toBeNull();
  });
  it('a casa inicial de antes ganha a banheira (sem mexer no resto)', () => {
    const fresh = arenaHouse(1);
    const before = { ...fresh, items: fresh.items.filter((i) => i.itemId !== 'k-banheira-madeira') };
    const up = upgradeHouse(before, 1);
    expect(up.items.map((i) => i.itemId)).toContain('k-banheira-madeira');
    expect(up.items.length).toBe(before.items.length + 1);
    expect(upgradeHouse(up, 1)).toBe(up);
  });
});
