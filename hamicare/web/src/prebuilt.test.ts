import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
// @ts-expect-error script em JS puro
import { sourceHash } from '../scripts/source-hash.mjs';

// O Render publica o app já compilado em prebuilt/. Se o código mudou e o prebuilt não, o site sai velho.
describe('app compilado para o servidor', () => {
  it('prebuilt/ corresponde ao código atual (rode "npm run prebuilt")', () => {
    const file = new URL('../prebuilt/SOURCE_HASH', import.meta.url);
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file, 'utf8').trim()).toBe(sourceHash());
  });
});
