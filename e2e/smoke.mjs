// Teste ponta a ponta dos fluxos principais em tela de celular.
// Uso: com o servidor rodando (npm start ou npm run dev), execute `npm run test:e2e`.
// Variáveis: BASE_URL (padrão http://localhost:3001), SHOTS=1 para salvar capturas em e2e/screenshots.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');

const BASE = process.env.BASE_URL ?? 'http://localhost:3001';
const SHOTS = process.env.SHOTS === '1';
if (SHOTS) mkdirSync('e2e/screenshots', { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

let step = 0;
const shot = async (name) => { if (SHOTS) await page.screenshot({ path: `e2e/screenshots/${String(++step).padStart(2, '0')}-${name}.png`, fullPage: false }); };
const check = (cond, msg) => { if (!cond) throw new Error(`Falhou: ${msg}`); console.log(`✔ ${msg}`); };

try {
  // 1. Primeira visita: seletor de localização abre sozinho
  await page.goto(BASE);
  await page.getByRole('dialog', { name: 'Onde você está?' }).waitFor();
  await shot('seletor-localizacao');
  await page.getByLabel('Estado').selectOption('SC');
  await page.getByPlaceholder('Digite o nome da cidade').fill('joinv');
  await page.getByRole('option', { name: 'Joinville' }).click();
  await page.getByRole('heading', { name: /Cuidado para o seu pet em Joinville/ }).waitFor();
  check(true, 'cidade escolhida pelo seletor estado → cidade');
  await page.getByText('Bem avaliados em Joinville').waitFor();
  await page.getByText('Banho e tosa em Joinville').waitFor();
  check(await page.getByText('Pet ao Vivo').first().isVisible(), 'banner do Pet ao Vivo');
  await shot('inicio');
  check(await page.getByRole('link', { name: /^Banho e tosa Pet shops/ }).isVisible(), 'serviços pet exibidos');

  // 2. Busca com sugestões
  await page.getByRole('combobox').fill('passe');
  await page.getByRole('listbox').getByText('Passeador de cães', { exact: true }).waitFor();
  await shot('sugestoes');
  await page.getByRole('combobox').press('Enter');
  await page.waitForURL(/buscar\?q=passe/);
  await page.getByText(/resultado/).first().waitFor();
  await shot('resultados');
  const cards = await page.locator('article').count();
  check(cards > 0, `busca retornou ${cards} empresa(s)`);

  // 3. Categoria + filtros
  await page.goto(`${BASE}/categoria/pet-sitter`);
  await page.getByRole('heading', { name: 'Pet sitter (cuidado em casa)' }).waitFor();
  await page.getByRole('button', { name: /^Filtros/ }).click();
  await page.getByRole('button', { name: '4 ou mais' }).click();
  await shot('filtros');
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await page.waitForURL(/nota=4/);
  check(true, 'filtro de nota mínima aplicado na URL');

  // 4. Página da empresa
  await page.goto(`${BASE}/categoria/banho-e-tosa`);
  await page.locator('article a').first().click();
  await page.getByRole('tab', { name: 'Visão geral' }).waitFor();
  await shot('empresa');
  await page.getByRole('tab', { name: /Avaliações/ }).click();
  await page.getByText('Distribuição das notas').count();
  await shot('empresa-avaliacoes');
  await page.getByRole('tab', { name: 'Serviços' }).click();
  await shot('empresa-servicos');
  check(await page.getByRole('tabpanel').getByText(/R\$|Solicitar orçamento|Consulte o preço/).first().isVisible(), 'serviços com preço ou "solicitar orçamento"');

  // 5. Favorito sem login leva ao login
  await page.getByRole('button', { name: /Salvar .* nos favoritos/ }).click();
  await page.waitForURL(/entrar/);
  await page.getByRole('button', { name: 'Preencher dados de teste' }).click();
  await shot('login');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL(/empresa\//);
  const fav = page.getByRole('button', { name: /(Salvar .* nos|Remover .* dos) favoritos/ });
  const wasFav = (await fav.getAttribute('aria-pressed')) === 'true';
  await fav.click();
  await page.getByText(wasFav ? 'Removida dos favoritos.' : 'Salva nos favoritos.').waitFor();
  if (wasFav) { await fav.click(); await page.getByText('Salva nos favoritos.').waitFor(); }
  check(true, 'login e salvar favorito');

  // 6. Ficha do pet e agendamento com o pet
  const back = page.url();
  await page.goto(`${BASE}/pets`);
  await page.waitForLoadState('networkidle');
  const existing = await page.getByText('Thor', { exact: true }).count();
  if (!existing) {
    await page.getByRole('button', { name: /Cadastrar pet|Adicionar outro pet/ }).first().click();
    await page.getByLabel('Nome', { exact: true }).fill('Thor');
    await page.getByRole('dialog').getByRole('button', { name: /^Pequeno/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Medo de secador' }).click();
    await page.getByLabel(/Saúde/).fill('Alergia a shampoo com perfume');
    await shot('ficha-pet');
    await page.getByRole('dialog').getByRole('button', { name: 'Cadastrar pet' }).click();
    await page.getByText('Thor foi cadastrado!').waitFor();
  }
  check(await page.getByText('Thor', { exact: true }).first().isVisible(), 'ficha do pet cadastrada');
  await page.goto(back);
  await page.getByRole('link', { name: 'Agendar', exact: true }).last().click();
  await page.getByRole('heading', { name: 'Para qual pet?' }).waitFor();
  check((await page.getByRole('radio', { name: 'Thor', exact: true }).getAttribute('aria-checked')) === 'true', 'pet já escolhido no agendamento');
  await page.getByRole('heading', { name: 'Serviço', exact: true }).waitFor();
  await page.locator('input[name="service"]').first().check();
  const day = page.locator('[role="radiogroup"][aria-label="Dia"] button:not([disabled])').nth(1);
  await day.click();
  await page.locator('[role="radiogroup"][aria-label="Horário"] button').first().click();
  await shot('agendamento');
  await page.getByRole('button', { name: 'Solicitar agendamento' }).click();
  await page.getByText('Pedido de agendamento registrado').waitFor();
  await shot('agendamento-ok');
  check(true, 'agendamento solicitado');

  // 7. Atividades → marcar realizado → avaliar
  await page.goto(`${BASE}/atividades`);
  await page.getByRole('button', { name: 'O serviço foi realizado' }).first().click();
  await page.getByRole('button', { name: 'Sim, foi realizado' }).click();
  await page.getByRole('link', { name: 'Avaliar' }).first().waitFor();
  await shot('atividades');
  await page.getByRole('link', { name: 'Avaliar' }).first().click();
  await page.getByRole('button', { name: 'Publicar avaliação' }).click();
  await page.getByText('Escolha de 1 a 5 estrelas.').waitFor();
  check(true, 'validação impede avaliação sem nota');
  await page.getByLabel('5 estrelas, Excelente').first().check({ force: true });
  await page.getByLabel('Conte como foi').fill('Atendimento muito atencioso, ambiente limpo e cumpriram o horário.');
  await shot('avaliacao');
  await page.getByRole('button', { name: 'Publicar avaliação' }).click();
  await page.getByText('Obrigado pela avaliação!').waitFor();
  check(true, 'avaliação publicada após serviço realizado');

  // 8. Orçamento
  await page.goto(`${BASE}/buscar?q=adestramento`);
  await page.locator('article a').first().click();
  await page.getByRole('link', { name: /Orçamento|Solicitar orçamento/ }).first().click();
  await page.getByLabel(/O que você precisa/).fill('Meu cachorro puxa muito na guia e late para outros cães.');
  await page.getByLabel('Telefone com DDD').fill('47999990000');
  await shot('orcamento');
  await page.getByRole('button', { name: 'Enviar pedido de orçamento' }).click();
  await page.getByText('Pedido de orçamento registrado').waitFor();
  check(true, 'pedido de orçamento registrado');

  // 9. Favoritos e perfil
  await page.goto(`${BASE}/favoritos`);
  await page.locator('article').first().waitFor();
  await shot('favoritos');
  await page.goto(`${BASE}/perfil`);
  await shot('perfil');
  await page.goto(`${BASE}/como-funciona`);
  await shot('como-funciona');

  // 10. Cidade sem empresas
  await page.goto(BASE);
  await page.getByRole('button', { name: /Localização:/ }).click();
  await page.getByLabel('Estado').selectOption('AM');
  await page.getByPlaceholder('Digite o nome da cidade').fill('Tefé');
  await page.getByRole('option', { name: 'Tefé' }).click();
  await page.getByText(/Ainda não há empresas cadastradas em Tefé/).waitFor();
  await shot('cidade-sem-empresas');
  check(true, 'cidade sem empresas mostra alternativas');

  // 11. Telas grandes
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.getByRole('button', { name: /Joinville|Curitiba|Florianópolis|São Paulo/ }).first().click();
  await page.getByText(/Bem avaliados em/).waitFor();
  await shot('desktop-inicio');
  await page.goto(`${BASE}/buscar?q=passeio`);
  await page.locator('article').first().waitFor();
  await shot('desktop-busca');

  const relevant = errors.filter((e) => !/401|Failed to load resource/.test(e));
  check(relevant.length === 0, `sem erros no console${relevant.length ? ': ' + relevant.join(' | ') : ''}`);
  console.log('\nTodos os fluxos passaram.');
} catch (e) {
  await page.screenshot({ path: 'e2e/falha.png', fullPage: true }).catch(() => {});
  console.error(e.message);
  console.error(errors.join('\n'));
  process.exitCode = 1;
} finally {
  await browser.close();
}
