import { describe, expect, it } from 'vitest';
import { addWater, dayOf, fresh, getState, litersText, replaceState, setWaterGoal, todayKey, waterGoalOf } from './store';
import { floorPalette, FLOOR_TONE } from '../components/Furniture';

describe('água em litros', () => {
  it('mostra litros no jeito brasileiro', () => {
    expect(litersText(0)).toBe('0 L');
    expect(litersText(3)).toBe('0,75 L');
    expect(litersText(8)).toBe('2 L');
    expect(litersText(10)).toBe('2,5 L');
  });

  it('copo soma 250 ml, garrafinha 500 ml, e a meta comemora uma vez só ao passar dela', () => {
    replaceState({ ...fresh(), onboarded: true });
    setWaterGoal(6); // 1,5 L
    expect(waterGoalOf(getState())).toBe(6);
    expect(addWater(2).hitGoal).toBe(false);
    expect(addWater(2).hitGoal).toBe(false);
    const r = addWater(2);
    expect(r.cups).toBe(6);
    expect(r.hitGoal).toBe(true);
    expect(addWater(1).hitGoal).toBe(false);
    expect(dayOf(getState(), todayKey()).water).toBe(7);
    expect(addWater(-1).hitGoal).toBe(false);
  });

  it('a meta fica entre 1 L e 4 L', () => {
    replaceState({ ...fresh(), onboarded: true });
    setWaterGoal(1);
    expect(waterGoalOf(getState())).toBe(4);
    setWaterGoal(40);
    expect(waterGoalOf(getState())).toBe(16);
  });
});

describe('cores do Início a partir do chão', () => {
  const lum = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const c = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * c(n >> 16) + 0.7152 * c((n >> 8) & 255) + 0.0722 * c(n & 255);
  };
  it('a página é a própria cor do chão (lisa) e o texto solto nela fica legível', () => {
    const ratio = (a: string, b: string) => {
      const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
      return (x + 0.05) / (y + 0.05);
    };
    for (const floor of Object.keys(FLOOR_TONE)) {
      const p = floorPalette(floor);
      expect(p.page.toLowerCase()).toBe(FLOOR_TONE[floor].toLowerCase());
      expect(ratio(p.ink, p.page)).toBeGreaterThanOrEqual(3);
      // os cartões continuam num tom mais fundo, com texto branco legível
      expect(1.05 / (lum(p.card) + 0.05)).toBeGreaterThanOrEqual(3);
    }
  });
  it('piso desconhecido usa a madeira', () => {
    expect(floorPalette('nao-existe').tone).toBe(FLOOR_TONE['f-madeira']);
  });
});
