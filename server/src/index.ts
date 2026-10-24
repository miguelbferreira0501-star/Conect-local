import { serve } from '@hono/node-server';
import { createApp } from './app';
import { env } from './env';

const app = createApp();
serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`API ouvindo em http://localhost:${info.port} (modo demonstração: ${env.DEMO_MODE ? 'sim' : 'não'})`);
});
