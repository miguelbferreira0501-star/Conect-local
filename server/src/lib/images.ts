import { AppError } from './errors';

/** Lê um data URL de imagem já reduzida no navegador e confere a assinatura do arquivo. */
export function decodeImage(dataUrl: string, maxBytes = 600_000): { mime: string; data: Buffer } {
  const [, mime, b64] = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/) ?? [];
  if (!mime) throw new AppError(422, 'validation_error', 'Imagem inválida.');
  const data = Buffer.from(b64, 'base64');
  if (data.length > maxBytes) throw new AppError(422, 'validation_error', 'Imagem muito grande (máximo de 600 KB).');
  const sig = data.subarray(0, 12).toString('hex');
  const ok = (mime === 'image/jpeg' && sig.startsWith('ffd8ff')) || (mime === 'image/png' && sig.startsWith('89504e47'))
    || (mime === 'image/webp' && sig.startsWith('52494646') && sig.slice(16, 24) === '57454250');
  if (!ok) throw new AppError(422, 'validation_error', 'O arquivo não é uma imagem válida.');
  return { mime, data };
}
