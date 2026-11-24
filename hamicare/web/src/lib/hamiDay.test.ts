import { describe, expect, it } from 'vitest';
import { ACTIVITY_ORDER, CONDITION_ORDER, CONDITIONS, askText, conditionNeed, conditionOf, cryEvery, pickActivity, type Activity } from './hamiDay';
import { itemById } from '../data/items';

const days = Array.from({ length: 60 }, (_, i) => {
  const d = new Date(2026, 0, 1 + i);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
});

describe('situação do dia', () => {
  it('é a mesma o dia todo (sorteio fixo) e nunca repete a de ontem', () => {
    for (const seed of [1, 7, 42]) {
      days.forEach((d, i) => {
        expect(conditionOf(seed, d)).toBe(conditionOf(seed, d));
        if (i) expect(conditionOf(seed, d)).not.toBe(conditionOf(seed, days[i - 1]));
      });
    }
  });
  it('em dois meses aparecem situações variadas', () => {
    const seen = new Set(days.map((d) => conditionOf(3, d)));
    expect(seen.size).toBeGreaterThanOrEqual(5);
  });
  it('pede 2 tarefas (ou menos se o dia tiver menos)', () => {
    expect(conditionNeed(6)).toBe(2);
    expect(conditionNeed(1)).toBe(1);
    expect(askText('frio', 2)).toContain('2 tarefas pra me esquentar');
  });
  it('as roupinhas da situação existem no catálogo', () => {
    for (const c of CONDITION_ORDER) for (const id of Object.values(CONDITIONS[c].wear ?? {})) expect(itemById(id as string), `${c}: ${id}`).toBeTruthy();
  });
});

describe('atividade de cada visita', () => {
  it('nunca repete a anterior', () => {
    let last: Activity | null = null;
    for (let i = 0; i < 200; i++) {
      const a = pickActivity(last, 14, (i * 0.137) % 1);
      expect(a).not.toBe(last);
      last = a;
    }
  });
  it('de dia a soneca (no chão ou na cama) é rara; de noite é mais comum', () => {
    const count = (hour: number) => Array.from({ length: 1000 }, (_, i) => pickActivity(null, hour, (i + 0.5) / 1000)).filter((a) => a === 'soneca' || a === 'cama').length;
    expect(count(14)).toBeLessThan(120);
    expect(count(23)).toBeGreaterThan(300);
    expect(ACTIVITY_ORDER.length).toBeGreaterThanOrEqual(8);
  });
});

describe('chorão fofinho', () => {
  it('chora mais vezes de noite e as situações tristes deixam os olhinhos marejados', () => {
    expect(cryEvery(20)).toBeLessThan(cryEvery(10));
    expect(CONDITIONS.saudade.teary && CONDITIONS.medo.teary && CONDITIONS.chuva.teary).toBe(true);
    expect(CONDITION_ORDER).toContain('saudade');
  });
});
