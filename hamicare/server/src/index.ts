import { serve } from '@hono/node-server';
import { createApp } from './app';
import { env } from './env';
import { syncAdmins } from './db';
import { sendDueReminders } from './push';
import { warnLegalPlaceholders } from './routes/legal';
import { mailVia } from './lib/mail';

warnLegalPlaceholders();
if (env.NODE_ENV === 'production' && mailVia() === 'nenhum') console.warn('⚠️  E-mail não configurado (Resend, Brevo ou SMTP): o "Esqueci minha senha" não vai mandar o link.');
await syncAdmins().catch((e) => console.error('Admins:', e.message));
serve({ fetch: createApp().fetch, port: env.PORT }, (info) => console.log(`HamiCare no ar: http://localhost:${info.port}`));

// Lembretes: confere a cada 5 minutos quem já passou do horário escolhido.
setInterval(() => sendDueReminders().catch((e) => console.error('Lembretes:', e.message)), 5 * 60_000);
