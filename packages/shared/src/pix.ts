/**
 * Pix "copia e cola" (BR Code estático do Banco Central) com a chave da própria empresa.
 * O dinheiro vai direto para a empresa; o app só monta o código com o valor do sinal.
 */
import { z } from 'zod';

const clean = (s: string, max: number) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ]/g, '').replace(/\s+/g, ' ').trim().toUpperCase().slice(0, max) || 'PATAI';

const field = (id: string, value: string) => `${id}${String(value.length).padStart(2, '0')}${value}`;

function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Normaliza a chave: CPF/CNPJ só números, telefone com +55, e-mail minúsculo, aleatória como veio. */
export function normalizePixKey(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return v.toLowerCase();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) return v.toLowerCase();
  const digits = v.replace(/\D/g, '');
  if (v.startsWith('+') && digits.length >= 12 && digits.length <= 13) return `+${digits}`;
  if (digits.length === 11 && /^\d{2}9/.test(digits) && !/^[\d.\-\s]{14}$/.test(v) && /[()\s]/.test(v)) return `+55${digits}`; // (47) 99999-9999
  if (digits.length === 11 || digits.length === 14) return digits; // CPF ou CNPJ
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  return null;
}

export const pixKeySchema = z.string().trim().max(77).transform((v, ctx) => {
  if (!v) return null;
  const k = normalizePixKey(v);
  if (!k) ctx.addIssue({ code: 'custom', message: 'Chave Pix inválida. Use CPF, CNPJ, e-mail, celular ou chave aleatória.' });
  return k;
});

export function pixPayload(o: { key: string; amountCents: number; name: string; city: string; txid?: string }): string {
  const account = field('00', 'br.gov.bcb.pix') + field('01', o.key);
  const txid = (o.txid ?? '***').replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***';
  const body = field('00', '01') + field('26', account) + field('52', '0000') + field('53', '986')
    + field('54', (o.amountCents / 100).toFixed(2)) + field('58', 'BR') + field('59', clean(o.name, 25)) + field('60', clean(o.city, 15))
    + field('62', field('05', txid)) + '6304';
  return body + crc16(body);
}
