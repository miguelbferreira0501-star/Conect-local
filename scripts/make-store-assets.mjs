// Gera as imagens da ficha da Google Play em store/:
//  - banner-1024x500.png (imagem de destaque)
//  - capturas/ (1080×1920, telas reais do app)
// Uso: servidor rodando (npm run build && npm start) e a prévia servida em PREVIEW_URL
// (cd web/dist-preview && python3 -m http.server 4700) — a prévia simula o Pet ao Vivo.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');

const BASE = process.env.BASE_URL ?? 'http://localhost:3001';
const PREVIEW = process.env.PREVIEW_URL ?? 'http://localhost:4700/index.html';
const CITY = { ibge: 4209102, name: 'Joinville', uf: 'SC', lat: -26.3045, lon: -48.8487, timezone: 'America/Sao_Paulo' };
mkdirSync('store/capturas', { recursive: true });
const svg = readFileSync('web/public/icon.svg', 'utf8');
// Fonte do app (DM Sans) embutida no banner
const font = readFileSync('node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2').toString('base64');
const fontCss = `<style>@font-face{font-family:'DM Sans Variable';font-weight:100 1000;src:url(data:font/woff2;base64,${font}) format('woff2')}</style>`;
const browser = await chromium.launch();

// Banner de destaque
{
  const page = await browser.newPage({ viewport: { width: 1024, height: 500 } });
  await page.setContent(`<html><head>${fontCss}</head><body style="margin:0;width:1024px;height:500px;overflow:hidden;font-family:'DM Sans Variable','DM Sans',system-ui,sans-serif;
    background:#B8336A;color:#fff;display:flex;align-items:center;gap:56px;padding:0 72px;box-sizing:border-box">
    <div style="flex:none">${svg.replace('<svg ', '<svg width="196" height="196" ').replace('fill="#B8336A"', 'fill="#9D2B5A"')}</div>
    <div>
      <div style="font-size:80px;font-weight:700;letter-spacing:-2px;line-height:1">Pataí</div>
      <div style="font-size:32px;margin-top:18px;line-height:1.25;color:#fff">Banho e tosa, passeador e pet sitter.<br/>Acompanhe cada etapa pelo celular.</div>
      <div style="margin-top:22px;font-size:22px;color:#F8DBE8">Chegou · No banho · Secando · Na tosa · Pronto</div>
    </div></body></html>`);
  await page.screenshot({ path: 'store/banner-1024x500.png' });
  await page.close();
}

const device = { viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' };
const init = (city) => { localStorage.setItem('cl_location', JSON.stringify(city)); localStorage.setItem('cl_demo_banner_hidden', 'true'); };

// Telas do app real
{
  const ctx = await browser.newContext(device);
  await ctx.addInitScript(init, CITY);
  const page = await ctx.newPage();
  const shot = (n) => page.screenshot({ path: `store/capturas/${n}.png` });
  await page.goto(BASE);
  await page.getByText('Banho e tosa em Joinville').waitFor();
  await shot('1-inicio');
  await page.goto(`${BASE}/empresa/banho-tosa-bem-cuidar-joinville`);
  await page.getByRole('tab', { name: 'Visão geral' }).waitFor();
  await shot('3-empresa');
  await page.goto(`${BASE}/entrar`);
  await page.getByLabel('E-mail', { exact: true }).fill('demo@conectalocal.app');
  await page.getByLabel('Senha', { exact: true }).fill('Demo1234');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL(BASE + '/');
  const H = { 'x-requested-with': 'conecta', 'content-type': 'application/json' };
  const pets = await (await page.request.get(`${BASE}/api/me/pets`, { headers: H })).json();
  if (!pets.some((p) => p.name === 'Thor')) {
    await page.request.post(`${BASE}/api/me/pets`, { headers: H, data: { name: 'Thor', species: 'dog', breed: 'Shih-tzu', size: 'small', birthYear: 2021, temperament: ['Medroso', 'Medo de secador'], healthNotes: 'Alergia a shampoo com perfume.', groomingNotes: 'Tosa bebê.' } });
  }
  await page.goto(`${BASE}/pets`);
  await page.getByText('Thor').first().waitFor();
  await page.getByText('Thor').first().click();
  await page.getByRole('dialog').waitFor();
  await page.waitForTimeout(400);
  await shot('5-ficha-do-pet');
  await page.goto(`${BASE}/empresa/banho-tosa-bem-cuidar-joinville/agendar`);
  await page.locator('input[name="service"]').first().check();
  await page.locator('[aria-label="Dia"] button:not([disabled])').nth(1).click();
  await page.locator('[aria-label="Horário"] button').first().click();
  await page.getByRole('button', { name: 'Toda semana' }).waitFor();
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(400);
  await shot('4-agendamento');
  await ctx.close();
}

// Pet ao Vivo (prévia simula as etapas com fotos ilustrativas)
{
  const ctx = await browser.newContext(device);
  await ctx.addInitScript(init, CITY);
  const page = await ctx.newPage();
  await page.goto(PREVIEW);
  await page.getByRole('link', { name: /Entrar ou criar conta/ }).click();
  await page.getByRole('link', { name: 'Entrar' }).first().click().catch(() => {});
  await page.getByRole('button', { name: 'Preencher dados de teste' }).click();
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForTimeout(36_000); // etapas chegando
  await page.getByRole('link', { name: 'Início' }).last().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'store/capturas/2-ao-vivo-inicio.png' });
  await page.getByRole('link', { name: 'Agenda' }).last().click();
  const live = page.getByText('Ao vivo agora').first();
  await live.waitFor();
  await live.scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 140);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'store/capturas/6-pet-ao-vivo.png' });
  await ctx.close();
}
await browser.close();
console.log('Imagens da loja geradas em store/.');
