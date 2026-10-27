import { BRAND } from '@conecta/shared';
import { ensureAsaasWebhook } from './services/billing/asaas';
import { serve } from '@hono/node-server';
import { createApp } from './app';
import { env } from './env';
import { startPushScheduler } from './services/push';

const app = createApp();

// Pagamentos: confere a chave da Asaas e cadastra o aviso de pagamento automaticamente.
const contact = (env.ADMIN_EMAILS ?? '').split(',')[0]?.trim() || BRAND.supportEmail;
ensureAsaasWebhook(contact).then((s) => s.configured && console.log(s.message)).catch(() => {});
// Lembretes no celular (véspera do horário e hora de voltar), a cada 15 minutos.
startPushScheduler();
serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`API ouvindo em http://localhost:${info.port} (modo demonstração: ${env.DEMO_MODE ? 'sim' : 'não'})`);
});
