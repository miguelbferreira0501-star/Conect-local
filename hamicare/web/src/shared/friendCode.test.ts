import { describe, expect, it } from 'vitest';
import { codeKey, isServerKey } from './friendCode';

describe('código de amigo', () => {
  it('aceita do jeito que a pessoa digitar', () => {
    for (const typed of ['HAMI-B84DBA', 'hami-b84dba', ' B84DBA ', 'hami b84 dba', 'HAMI–B84DBA', 'HAMIB84DBA']) expect(codeKey(typed)).toBe('B84DBA');
    expect(codeKey('HAMI-1O3E4C')).toBe('103E4C');
    expect(codeKey('hami-i0l2ab')).toBe('1012AB');
  });
  it('reconhece código do servidor', () => {
    expect(isServerKey(codeKey('HAMI-1F3E4C'))).toBe(true);
    expect(isServerKey(codeKey('HAMI-ZK8QW2'))).toBe(false);
    expect(isServerKey(codeKey('HAMI-1F3E'))).toBe(false);
  });
});
