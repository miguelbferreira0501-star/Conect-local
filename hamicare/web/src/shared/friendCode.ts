// Código de amigo (HAMI-XXXXXX): aceita do jeito que a pessoa digitar.
// Sem "HAMI-", com espaço ou traço, minúsculo, O no lugar de 0, I ou L no lugar de 1.
export function codeKey(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .replace(/^HAMI/, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
}

/** Códigos do servidor têm 6 caracteres, só de 0 a 9 e de A a F. */
export const isServerKey = (key: string) => /^[0-9A-F]{6}$/.test(key);
