// Impressão digital do código do app (src, public, index.html, configs). Serve para saber se o build
// pronto em prebuilt/ corresponde ao código atual.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const inputs = ['src', 'public', 'index.html', 'vite.config.ts', 'package.json', 'tsconfig.json'];

function walk(p, out) {
  const st = statSync(p);
  if (st.isDirectory()) for (const f of readdirSync(p).sort()) walk(join(p, f), out);
  else if (!/\.test\.[tj]sx?$/.test(p)) out.push(p);
}

export function sourceHash() {
  const files = [];
  for (const i of inputs) walk(join(root, i), files);
  const h = createHash('sha256');
  for (const f of files.sort()) {
    h.update(relative(root, f));
    h.update(readFileSync(f));
  }
  return h.digest('hex');
}

if (process.argv[1] && process.argv[1].endsWith('source-hash.mjs')) console.log(sourceHash());
