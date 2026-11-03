// Converte o build (um HTML só) no formato de página do Artifact:
// sem <html>/<head>/<body>, com <title> e estilos no topo e o script no fim.
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? '';
const body = html.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? '';

const scripts = [];
const headRest = head
  .replace(/<script[\s\S]*?<\/script>/g, (s) => (scripts.push(s), ''))
  .replace(/<meta charset[^>]*>/i, '')
  .replace(/<meta name="viewport"[^>]*>/i, '');
const bodyRest = body.replace(/<script[\s\S]*?<\/script>/g, (s) => (scripts.push(s), ''));

const out = `${headRest.trim()}\n${bodyRest.trim()}\n${scripts.join('\n')}\n`;
writeFileSync(new URL('../dist/hamicare.html', import.meta.url), out);
console.log(`dist/hamicare.html: ${(out.length / 1024).toFixed(0)} KB`);
