import { describe, expect, it } from 'vitest';
import { moodColor, moodOf } from './MoodSlider';

describe('humor com barrinha', () => {
  it('a barrinha vira humor de 1 a 5 (o gráfico continua igual)', () => {
    expect([0, 12, 13, 37, 38, 50, 62, 63, 87, 88, 100].map(moodOf)).toEqual([1, 1, 2, 2, 3, 3, 3, 4, 4, 5, 5]);
  });
  it('a cor vai do roxo (difícil) ao amarelo (muito bem), sem pular', () => {
    expect(moodColor(0)).toBe('#9b95e8');
    expect(moodColor(1)).toBe('#ffd34d');
    expect(moodColor(0.5)).toBe('#9ed9b8');
    expect(moodColor(0.6)).toMatch(/^#[0-9a-f]{6}$/);
  });
});
