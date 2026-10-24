// Empacota o servidor (incluindo o pacote compartilhado) em dist/index.js.
import { build } from 'esbuild';
import { cpSync } from 'node:fs';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'dist/index.js',
  external: ['pg', 'bcryptjs', 'hono', '@hono/node-server', 'zod'],
  sourcemap: true,
});
cpSync('src/db/migrations', 'dist/migrations', { recursive: true });
console.log('Servidor compilado em server/dist');
