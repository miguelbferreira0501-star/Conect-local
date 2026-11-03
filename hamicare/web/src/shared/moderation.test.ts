import { describe, expect, it } from 'vitest';
import { checkKindness, PRESET_COMMENTS } from './moderation';

const reason = (t: string) => {
  const r = checkKindness(t);
  return r.ok ? 'ok' : r.reason;
};

describe('filtro de gentileza', () => {
  it('deixa passar elogios', () => {
    expect(reason('Que orgulho de você, continua assim!')).toBe('ok');
    expect(reason('Seu hamster tá muito estiloso 😍')).toBe('ok');
    for (const p of PRESET_COMMENTS) expect(reason(p)).toBe('ok');
  });
  it('bloqueia ofensas, inclusive disfarçadas', () => {
    expect(reason('que idiota')).toBe('ofensa');
    expect(reason('IDIOTAAAA')).toBe('ofensa');
    expect(reason('1d10t4')).toBe('ofensa');
    expect(reason('i d i o t a')).toBe('ofensa');
    expect(reason('você é feia')).toBe('ofensa');
  });
  it('bloqueia comentários sobre o corpo', () => {
    expect(reason('tá gordinho hein')).toBe('corpo');
    expect(reason('perdeu peso?')).toBe('corpo');
  });
  it('bloqueia frases desanimadoras', () => {
    expect(reason('você nunca vai conseguir')).toBe('negativo');
    expect(reason('ninguém liga')).toBe('negativo');
  });
  it('bloqueia contato e links (segurança)', () => {
    expect(reason('me chama no zap')).toBe('contato');
    expect(reason('meu numero 11 98765 4321')).toBe('contato');
    expect(reason('fala comigo eu@email.com')).toBe('contato');
    expect(reason('olha www.site.com')).toBe('link');
  });
  it('vazio e longo', () => {
    expect(reason('   ')).toBe('vazio');
    expect(reason('a'.repeat(201))).toBe('longo');
  });
});
