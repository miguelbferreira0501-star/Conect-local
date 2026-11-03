import { serve } from '@hono/node-server';
import { createApp } from './app';
import { env } from './env';
import { syncAdmins } from './db';
import { sendDueReminders } from './push';

await syncAdmins().catch((e) => console.error('Admins:', e.message));
serve({ fetch: createApp().fetch, port: env.PORT }, (info) => console.log(`HamiCare no ar: http://localhost:${info.port}`));

// Lembretes: confere a cada 5 minutos quem já passou do horário escolhido.
setInterval(() => sendDueReminders().catch((e) => console.error('Lembretes:', e.message)), 5 * 60_000);
