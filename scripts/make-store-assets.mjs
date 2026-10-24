// Gera as imagens da ficha da Google Play em store/:
//  - banner-1024x500.png (imagem de destaque)
//  - capturas/ (1080×1920, telas reais do app)
// Uso: com o servidor rodando (npm run build && npm start), `node scripts/make-store-assets.mjs`.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');

const BASE = process.env.BASE_URL ?? 'http://localhost:3001';
const CITY = { ibge: 4209102, name: 'Joinville', uf: 'SC', lat: -26.3045, lon: -48.8487, timezone: 'America/Sao_Paulo' };
mkdirSync('store/capturas', { recursive: true });
const svg = readFileSync('web/public/icon.svg', 'utf8');
const browser = await chromium.launch();

// Banner de destaque
{
  const page = await browser.newPage({ viewport: { width: 1024, height: 500 } });
  await page.setContent(`<html><body style="margin:0;width:1024px;height:500px;overflow:hidden;font-family:Inter,system-ui,sans-serif;
    background:linear-gradient(135deg,#123C7A 0%,#0E2F60 100%);color:#fff;display:flex;align-items:center;gap:56px;padding:0 72px;box-sizing:border-box">
    <div style="flex:none">${svg.replace('<svg ', '<svg width="200" height="200" ')}</div>
    <div>
      <div style="font-size:64px;font-weight:800;letter-spacing:-1px;line-height:1.05">Conecta Local</div>
      <div style="font-size:30px;margin-top:18px;line-height:1.3;color:#D9E6F7">Empresas confiáveis perto de você.<br/>Compare avaliações reais e agende.</div>
    </div></body></html>`);
  await page.screenshot({ path: 'store/banner-1024x500.png' });
  await page.close();
}

// Capturas de tela (360×640 @3x = 1080×1920)
const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
await ctx.addInitScript((city) => {
  localStorage.setItem('cl_location', JSON.stringify(city));
  localStorage.setItem('cl_demo_banner_hidden', 'true');
}, CITY);
const page = await ctx.newPage();
const shot = (n) => page.screenshot({ path: `store/capturas/${n}.png` });

await page.goto(BASE);
await page.getByText('Bem avaliadas em Joinville').waitFor();
await shot('1-inicio');
await page.goto(`${BASE}/buscar?q=eletricista`);
await page.locator('article').first().waitFor();
await shot('2-busca');
await page.goto(`${BASE}/empresa/espaco-bem-cuidar-joinville`);
await page.getByRole('tab', { name: 'Visão geral' }).waitFor();
await shot('3-empresa');
await page.goto(`${BASE}/empresa/espaco-bem-cuidar-joinville?aba=avaliacoes`);
await page.getByText('Distribuição das notas').count();
await page.locator('article, li.card').first().waitFor();
await page.mouse.wheel(0, 380);
await page.waitForTimeout(300);
await shot('4-avaliacoes');
await page.goto(`${BASE}/entrar`);
await page.getByLabel('E-mail', { exact: true }).fill('demo@conectalocal.app');
await page.getByLabel('Senha', { exact: true }).fill('Demo1234');
await page.getByRole('button', { name: 'Entrar', exact: true }).click();
await page.waitForURL(BASE + '/');
await page.goto(`${BASE}/empresa/espaco-bem-cuidar-joinville/agendar`);
await page.locator('input[name="service"]').first().check();
await page.locator('[aria-label="Dia"] button:not([disabled])').nth(1).click();
await page.locator('[aria-label="Horário"] button').first().waitFor();
await page.mouse.wheel(0, 260);
await page.waitForTimeout(300);
await shot('5-agendamento');
await page.goto(`${BASE}/atividades`);
await page.locator('article').first().waitFor();
await shot('6-atividades');
await browser.close();
console.log('Imagens da loja geradas em store/.');
