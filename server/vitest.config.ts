import { defineConfig } from 'vitest/config';

// Os testes usam um banco separado (conecta_test), recriado a cada execução.
export default defineConfig({
  test: {
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? 'postgres://conecta_app:conecta_app@localhost:5432/conecta_test',
      DATABASE_OWNER_URL: process.env.TEST_DATABASE_OWNER_URL ?? 'postgres://conecta:conecta@localhost:5432/conecta_test',
      DEMO_MODE: 'true',
      NODE_ENV: 'test',
      WEB_DIST: '/nao-existe',
    },
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 120000,
  },
});
