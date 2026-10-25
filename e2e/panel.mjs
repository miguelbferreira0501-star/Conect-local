// Teste ponta a ponta do painel das empresas: cadastro → serviços → horários → foto → aparece na busca →
// cliente agenda → empresa confirma → cliente vê a confirmação.
// Uso: servidor rodando (npm run build && npm start) e `node e2e/panel.mjs`. SHOTS=1 salva capturas.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = process.env.BASE_URL ?? 'http://localhost:3001';
const SHOTS = process.env.SHOTS === '1';
if (SHOTS) mkdirSync('e2e/screenshots', { recursive: true });
const ok = (m) => console.log('✔', m);
const BIZ = `Ateliê Rita ${Date.now().toString(36).slice(-4)}`;

const browser = await chromium.launch();
const mk = async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
  await ctx.addInitScript(() => localStorage.setItem('cl_location', JSON.stringify({ ibge: 4209102, name: 'Joinville', uf: 'SC', lat: -26.3045, lon: -48.8487, timezone: 'America/Sao_Paulo' })));
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  return p;
};
const errors = [];
const register = async (p, name) => {
  await p.goto(`${BASE}/criar-conta`);
  await p.getByLabel('Seu nome').fill(name);
  await p.getByLabel('E-mail', { exact: true }).fill(`${name.split(' ')[0].toLowerCase()}${Date.now()}@teste.com`);
  await p.getByLabel('Crie uma senha', { exact: true }).fill('Senha1234');
  await p.getByRole('checkbox').check();
  await p.getByRole('button', { name: 'Criar conta' }).click();
  await p.waitForURL(BASE + '/');
};
const shot = async (p, n) => SHOTS && p.screenshot({ path: `e2e/screenshots/painel-${n}.png` });

try {
  const owner = await mk();
  await register(owner, 'Rita Dona');
  await owner.goto(`${BASE}/perfil`);
  await owner.getByRole('link', { name: /Tenho uma empresa/ }).click();
  await owner.getByRole('link', { name: 'Cadastrar minha empresa' }).click();
  await shot(owner, '1-cadastro');
  await owner.getByLabel('Nome da empresa').fill(BIZ);
  await owner.getByLabel('Categoria').selectOption('outros-servicos');
  await owner.getByLabel('Frase curta').fill('Ajustes e consertos de roupas com entrega rápida.');
  await owner.getByLabel('Estado', { exact: true }).selectOption('SC');
  await owner.getByLabel('Cidade', { exact: true }).fill('Joinv');
  await owner.getByRole('button', { name: 'Joinville' }).click();
  await owner.getByLabel('Endereço (rua e número)').fill('Rua das Flores, 120');
  await owner.getByRole('textbox', { name: /^Bairro/ }).fill('Centro');
  await owner.getByRole('button', { name: 'Cadastrar empresa' }).click();
  await owner.getByText('Informe pelo menos um contato').waitFor();
  ok('validação exige contato');
  await owner.getByRole('textbox', { name: /^WhatsApp/ }).fill('47999990001');
  await owner.getByRole('button', { name: 'Cadastrar empresa' }).click();
  await owner.getByText('Perfil completo atrai mais clientes').waitFor();
  await shot(owner, '2-inicio');
  ok('empresa cadastrada');

  await owner.getByRole('navigation', { name: 'Seções do painel' }).getByRole('link', { name: 'Serviços' }).click();
  await owner.getByRole('button', { name: 'Adicionar serviço' }).click();
  await owner.getByLabel('Nome do serviço').fill('Barra de calça');
  await owner.getByLabel('Valor (R$)').fill('25,00');
  await owner.getByRole('textbox', { name: /^Duração/ }).fill('30');
  await owner.getByRole('checkbox', { name: /agendar este serviço/ }).check();
  await shot(owner, '3-servico');
  await owner.getByRole('button', { name: 'Salvar serviço' }).click();
  await owner.getByText('R$ 25,00 · 30 min · agendável').waitFor();
  ok('serviço cadastrado');

  await owner.getByRole('navigation', { name: 'Seções do painel' }).getByRole('link', { name: 'Horários' }).click();
  for (const day of ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']) {
    await owner.locator('li', { hasText: day }).getByRole('checkbox', { name: 'Aberto' }).check();
  }
  await shot(owner, '4-horarios');
  await owner.getByRole('button', { name: 'Salvar e confirmar horários' }).click();
  await owner.getByText('Horários salvos e confirmados.').waitFor();
  ok('horários salvos');

  await owner.getByRole('navigation', { name: 'Seções do painel' }).getByRole('link', { name: 'Equipe' }).click();
  await owner.getByRole('button', { name: /^Adicionar profissional/ }).click();
  await owner.getByLabel('Nome', { exact: true }).fill('Rita');
  await owner.getByRole('button', { name: 'Salvar', exact: true }).click();
  await owner.getByText('Faz todos os serviços agendáveis').waitFor();
  await shot(owner, '4b-equipe');
  ok('profissional cadastrada');

  await owner.getByRole('navigation', { name: 'Seções do painel' }).getByRole('link', { name: 'Fotos' }).click();
  const chooser = owner.waitForEvent('filechooser');
  await owner.locator('.card', { hasText: 'Foto de capa' }).getByRole('button', { name: 'Enviar' }).click();
  await (await chooser).setFiles('e2e/foto-teste.jpg');
  await owner.getByText('Imagem enviada.').waitFor();
  await owner.locator('.card', { hasText: 'Foto de capa' }).locator('img').waitFor();
  await shot(owner, '5-fotos');
  ok('foto de capa enviada (reduzida no navegador)');

  // Cliente encontra e agenda
  const customer = await mk();
  await register(customer, 'Carlos Cliente');
  await customer.goto(`${BASE}/buscar?q=barra de calça`);
  await customer.getByText(BIZ).first().waitFor();
  ok('empresa aparece na busca na hora');
  await customer.getByText(BIZ).first().click();
  await customer.getByRole('link', { name: 'Agendar', exact: true }).last().click();
  await customer.getByRole('button', { name: /Rita/ }).click();
  await customer.locator('[aria-label="Dia"] button:not([disabled])').nth(1).click();
  await customer.locator('[aria-label="Horário"] button').first().click();
  await customer.getByRole('button', { name: 'Solicitar agendamento' }).click();
  await customer.getByText('Pedido de agendamento registrado').waitFor();
  ok('cliente agendou');

  await owner.getByRole('navigation', { name: 'Seções do painel' }).getByRole('link', { name: /Pedidos/ }).click();
  await owner.getByText('Carlos Cliente').waitFor();
  await owner.getByText('Com: Rita').waitFor();
  await shot(owner, '6-pedidos');
  await owner.getByRole('button', { name: 'Confirmar horário' }).click();
  await owner.getByText('Pedido atualizado.').waitFor();
  ok('empresa confirmou');

  await customer.goto(`${BASE}/atividades`);
  await customer.getByText('Confirmado').first().waitFor();
  await customer.getByText(/com Rita/).first().waitFor();
  ok('cliente vê o agendamento confirmado com a profissional');

  await customer.goto(`${BASE}/admin`);
  await customer.getByText('Área restrita').waitFor();
  ok('cliente comum não acessa a administração');

  console.log(errors.length ? 'ERROS: ' + errors.join(' | ') : '✔ sem erros na página');
  console.log('\nPainel: todos os fluxos passaram.');
} catch (e) {
  console.error(e.message.split('\n').slice(0, 6).join('\n'));
  for (const pg of browser.contexts().flatMap((c) => c.pages())) await pg.screenshot({ path: `e2e/falha-${Math.random().toString(16).slice(2, 6)}.png` }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
