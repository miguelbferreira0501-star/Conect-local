import { describe, expect, it } from 'vitest';
import { DEFAULT_GAME } from './config';
import { chestPool } from './catalog';
import { PERSONAS, simulateMany } from './simulate';

// Metas de equilíbrio: se uma mudança de números quebrar alguma, este teste avisa.
const pool = chestPool();
const sim = (id: string) => simulateMany(PERSONAS.find((p) => p.id === id)!, DEFAULT_GAME, pool, 365, 12);

describe('equilíbrio da economia (simulação de um ano)', () => {
  // Subir de nível é bem difícil de propósito: ninguém chega na última arena em poucos meses.
  it('pessoa nova: o primeiro nível vem em poucos dias, mas em 2 semanas não passa do nível 4', () => {
    const r = sim('novo');
    expect(r.levelDay[2]).toBeGreaterThanOrEqual(2);
    expect(r.levelDay[2]).toBeLessThanOrEqual(6);
    expect(r.levelDay[5]).toBeNull();
    expect(r.finalLevel).toBeLessThanOrEqual(4);
  });

  it('casual: nível 5 só depois de 2 meses e não chega na última arena em 1 ano', () => {
    const r = sim('casual');
    expect(r.levelDay[5]).toBeGreaterThanOrEqual(60);
    expect(r.levelDay[12]).toBeNull();
    expect(r.finalArena).toBeLessThanOrEqual(8);
    expect(r.coinsPerWeek).toBeGreaterThan(60);
  });

  it('frequente: nível 5 em cerca de 1 mês e a última arena leva mais de 1 ano', () => {
    const r = sim('frequente');
    expect(r.levelDay[5]).toBeGreaterThanOrEqual(18);
    expect(r.levelDay[5]).toBeLessThanOrEqual(45);
    expect(r.levelDay[12] ?? 999).toBeGreaterThan(300);
    expect(r.coinsPerWeek).toBeGreaterThan(250);
    expect(r.coinsPerWeek).toBeLessThan(600);
  });

  it('muito ativo: mesmo fazendo tudo todo dia, a última arena leva mais de 5 meses', () => {
    const r = sim('muito-ativo');
    expect(r.levelDay[12]).toBeGreaterThanOrEqual(150);
    expect(r.coinsPerWeek).toBeLessThan(900);
  });
});
