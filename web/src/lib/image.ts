/**
 * Reduz a imagem no próprio aparelho antes de enviar (economiza dados móveis e espaço no servidor).
 * Retorna um data URL JPEG com no máximo ~550 KB.
 */
export async function resizeImage(file: File, maxSide: number): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Escolha um arquivo de imagem (JPG, PNG ou WebP).');
  if (file.size > 25 * 1024 * 1024) throw new Error('A imagem é muito grande. Escolha uma com até 25 MB.');
  const bitmap = await loadImage(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  for (const q of [0.85, 0.75, 0.65, 0.5]) {
    const url = canvas.toDataURL('image/jpeg', q);
    if (url.length < 740_000) return url; // ~550 KB em binário
  }
  throw new Error('Não foi possível reduzir esta imagem. Tente outra.');
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Não foi possível abrir esta imagem.'));
    // Lê como data: (a política de segurança do site não permite imagens blob:).
    const reader = new FileReader();
    reader.onload = () => { img.src = String(reader.result); };
    reader.onerror = () => reject(new Error('Não foi possível ler esta imagem.'));
    reader.readAsDataURL(file);
  });
}
