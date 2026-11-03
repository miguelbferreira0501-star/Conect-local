// Recursos que dependem de onde o app está rodando: página publicada no Claude (capacidades
// `db`, `user`, `downloads`) ou app instalado / navegador comum.

type ClaudeUse = { use: (name: string) => Promise<any> };

export function claudeRuntime(): ClaudeUse | null {
  const c = (window as unknown as { claude?: ClaudeUse }).claude;
  return c && typeof c.use === 'function' ? c : null;
}

/** Pede uma capacidade da página publicada. `null` quando não existe ou não foi liberada. */
export async function capability<T = any>(name: string): Promise<T | null> {
  const rt = claudeRuntime();
  if (!rt) return null;
  try {
    return (await Promise.race([rt.use(name), new Promise((r) => setTimeout(() => r(null), 10_000))])) as T | null;
  } catch {
    return null;
  }
}

/** Oferece um arquivo para a pessoa salvar (imagem da foto, por exemplo). */
export async function saveFile(filename: string, blob: Blob): Promise<'salvo' | 'cancelado' | 'indisponivel'> {
  const downloads = await capability<{ save: (r: { filename: string; data: Blob }) => Promise<unknown> }>('downloads');
  if (downloads) {
    try {
      await downloads.save({ filename, data: blob });
      return 'salvo';
    } catch {
      return 'cancelado';
    }
  }
  // Fora da página publicada: compartilhar (celular) ou baixar (computador).
  const file = new File([blob], filename, { type: blob.type });
  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: 'Meu Hami' });
      return 'salvo';
    } catch {
      return 'cancelado';
    }
  }
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return 'salvo';
  } catch {
    return 'indisponivel';
  }
}

/** Transforma um <svg> da tela numa imagem PNG com fundo e legenda (fotos do Hami). */
export async function snapshotPng(svg: SVGSVGElement, opts: { bg: [string, string]; caption?: string; size?: number }): Promise<Blob> {
  const size = opts.size ?? 720;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('width', String(size * 0.8));
  clone.setAttribute('height', String(size * 0.8));
  clone.querySelectorAll('[class]').forEach((el) => el.removeAttribute('class'));
  const xml = new XMLSerializer().serializeToString(clone);
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size + (opts.caption ? 90 : 0);
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, opts.bg[0]);
  g.addColorStop(1, opts.bg[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, size * 0.1, size * 0.06, size * 0.8, size * 0.8);
  if (opts.caption) {
    ctx.fillStyle = '#2B2240';
    ctx.font = '700 34px "Baloo 2", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(opts.caption.slice(0, 40), size / 2, size + 40);
  }
  ctx.fillStyle = 'rgba(43,34,64,0.55)';
  ctx.font = '700 22px "Nunito Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HamiCare', size / 2, canvas.height - 18);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('sem imagem'))), 'image/png'));
}

/** Reduz uma foto escolhida pela pessoa para caber no feed (JPEG, lado maior até `max`). */
export async function shrinkPhoto(file: File, max = 900, quality = 0.72): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * k);
    canvas.height = Math.round(img.height * k);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
