// Gera os ícones PNG do PWA a partir de web/public/icon.svg (usa o Chromium do Playwright).
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright'); // NODE_PATH ou dependência local
import { readFileSync } from 'node:fs';
const svg = readFileSync('web/public/icon.svg', 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [size, file, pad] of [[192, 'icon-192.png', 0], [512, 'icon-512.png', 0], [180, 'apple-touch-icon.png', 0]]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:#123C7A">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: `web/public/${file}`, omitBackground: false, clip: { x: 0, y: 0, width: size, height: size } });
}
await browser.close();
console.log('Ícones gerados.');
