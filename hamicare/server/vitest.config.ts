import { defineConfig } from 'vitest/config';

// Os testes usam um banco separado (hamicare_test), recriado a cada execução.
export default defineConfig({
  test: {
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? 'postgres://hamicare_app:hamicare_app@localhost:5432/hamicare_test',
      DATABASE_OWNER_URL: process.env.TEST_DATABASE_OWNER_URL ?? 'postgres://hamicare:hamicare@localhost:5432/hamicare_test',
      NODE_ENV: 'test',
      ADMIN_EMAILS: 'chefe@teste.com',
      WEB_DIST: '/nao-existe',
      GUARDIAN_TEST_PAY: 'true',
    },
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 120000,
  },
});
