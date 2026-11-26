// "npm run build" do servidor (Render): usa o app já compilado em prebuilt/ (compilar o app inteiro passa
// dos 512 MB de memória do plano). Para compilar de verdade: FORCE_BUILD=1 ou "npm run build:full".
import { cpSync, existsSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
if (!process.env.FORCE_BUILD && existsSync(`${root}prebuilt/index.html`)) {
  rmSync(`${root}dist`, { recursive: true, force: true });
  cpSync(`${root}prebuilt`, `${root}dist`, { recursive: true });
  console.log('Usando o app já compilado (prebuilt/).');
} else {
  execSync('npx tsc -p tsconfig.json && npx vite build', { stdio: 'inherit', cwd: root });
}
