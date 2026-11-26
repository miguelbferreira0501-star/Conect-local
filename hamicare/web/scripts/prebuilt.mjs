// Compila o app (build normal, arquivos separados) e guarda em prebuilt/, com a impressão digital do código.
// Rode antes de cada commit que muda o app: npm run prebuilt
import { cpSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { sourceHash } from './source-hash.mjs';

const root = new URL('..', import.meta.url).pathname;
execSync('npx tsc -p tsconfig.json && npx vite build', { stdio: 'inherit', cwd: root });
rmSync(`${root}prebuilt`, { recursive: true, force: true });
cpSync(`${root}dist`, `${root}prebuilt`, { recursive: true });
writeFileSync(`${root}prebuilt/SOURCE_HASH`, sourceHash() + '\n');
console.log('prebuilt/ atualizado.');
