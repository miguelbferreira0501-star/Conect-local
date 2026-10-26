// Gera os ícones do app (PWA e Play Store) a partir de web/public/icon.svg (usa o Chromium do Playwright).
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright'); // NODE_PATH ou dependência local

const svg = readFileSync('web/public/icon.svg', 'utf8');
const BRAND = '#6250EB';
mkdirSync('store', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
// [tamanho, arquivo, fração do ícone ocupada pelo símbolo]
const jobs = [
  [192, 'web/public/icon-192.png', 1],
  [512, 'web/public/icon-512.png', 1],
  [180, 'web/public/apple-touch-icon.png', 1],
  // "maskable": o Android recorta em círculo/forma; o símbolo fica dentro da zona segura (80%).
  [512, 'web/public/icon-maskable-512.png', 0.62],
  // Ícone da ficha da Play Store: 512×512, sem transparência (o Google aplica os cantos).
  [512, 'store/icone-play-512.png', 0.7],
];
for (const [size, file, scale] of jobs) {
  await page.setViewportSize({ width: size, height: size });
  const inner = Math.round(size * scale);
  const art = scale === 1
    ? svg.replace('<svg ', `<svg width="${size}" height="${size}" `)
    : svg.replace('<rect width="64" height="64" rx="16" fill="#6250EB"/>', '').replace('<svg ', `<svg width="${inner}" height="${inner}" `);
  await page.setContent(`<html><body style="margin:0;width:${size}px;height:${size}px;background:${BRAND};display:flex;align-items:center;justify-content:center">${art}</body></html>`);
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: size, height: size } });
}
await browser.close();
console.log('Ícones gerados.');
