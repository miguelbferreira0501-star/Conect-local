import { describe, expect, it } from 'vitest';
import { DEFAULT_GAME } from './config';
import { chestPool } from './catalog';
import { PERSONAS, simulateMany } from './simulate';

// Metas de equilíbrio: se uma mudança de números quebrar alguma, este teste avisa.
const pool = chestPool();
const sim = (id: string) => simulateMany(PERSONAS.find((p) => p.id === id)!, DEFAULT_GAME, pool, 365, 12);

describe('equilíbrio da economia (simulação de um ano)', () => {
  it('pessoa nova: primeiras conquistas rápidas', () => {
    const r = sim('novo');
    expect(r.levelDay[2]).toBeLessThanOrEqual(2);
    expect(r.levelDay[3]).toBeLessThanOrEqual(4);
    expect(r.levelDay[5]).toBeLessThanOrEqual(10);
  });

  it('casual: chega às primeiras arenas, as últimas pedem constância', () => {
    const r = sim('casual');
    expect(r.levelDay[5]).toBeGreaterThanOrEqual(15);
    expect(r.levelDay[5]).toBeLessThanOrEqual(60);
    expect(r.levelDay[12] ?? 999).toBeGreaterThan(300);
    expect(r.coinsPerWeek).toBeGreaterThan(60);
  });

  it('frequente: última arena entre 2,5 e 5 meses', () => {
    const r = sim('frequente');
    expect(r.levelDay[12]).toBeGreaterThanOrEqual(75);
    expect(r.levelDay[12]).toBeLessThanOrEqual(150);
    expect(r.coinsPerWeek).toBeGreaterThan(250);
    expect(r.coinsPerWeek).toBeLessThan(600);
  });

  it('muito ativo: mesmo fazendo tudo, a última arena leva mais de 7 semanas', () => {
    const r = sim('muito-ativo');
    expect(r.levelDay[12]).toBeGreaterThanOrEqual(50);
    expect(r.coinsPerWeek).toBeLessThan(900);
  });
});
