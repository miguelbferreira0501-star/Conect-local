// Política de privacidade e termos de uso como páginas do site (/privacidade e /termos).
// É o endereço que a Google Play e a App Store pedem. O texto é o mesmo do app.
import { Hono } from 'hono';
import { LEGAL, LEGAL_INFO, formatLegalDate, legalPlaceholders, type LegalBlock, type LegalDoc } from '../../../web/src/shared/legal';

const esc = (t: string) => t.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

const block = (b: LegalBlock) => (typeof b === 'string' ? `<p>${esc(b)}</p>` : `<ul>${b.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`);

export function legalHtml(doc: LegalDoc): string {
  const other = doc.id === 'termos' ? LEGAL.privacidade : LEGAL.termos;
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(doc.title)} · HamiCare</title>
<meta name="description" content="${esc(doc.title)} do HamiCare, app de autocuidado com o hamster Hami.">
<link rel="icon" href="/icon-192.png">
<style>
  :root { --bg: #E9F6F1; --card: #ffffff; --ink: #24323A; --muted: #55656E; --accent: #2F9E83; --line: #CBE9DF; color-scheme: light dark; }
  @media (prefers-color-scheme: dark) { :root { --bg: #14211E; --card: #1C2C28; --ink: #E8F2EE; --muted: #A9BCB5; --accent: #6FD1B5; --line: #2C433D; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { max-width: 720px; margin: 0 auto; padding: 28px 16px 56px; }
  header { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
  header a { color: inherit; text-decoration: none; font-weight: 800; font-size: 18px; }
  .card { background: var(--card); border: 2px solid var(--line); border-radius: 24px; padding: 22px 20px; }
  h1 { font-size: 28px; line-height: 1.2; margin: 0 0 4px; }
  h2 { font-size: 19px; line-height: 1.3; margin: 26px 0 6px; }
  .date { color: var(--muted); font-size: 14px; font-weight: 700; margin: 0 0 16px; }
  .summary { background: var(--bg); border-radius: 18px; padding: 14px 16px; }
  .summary strong { display: block; margin-bottom: 4px; }
  ul { padding-left: 22px; margin: 8px 0; }
  li { margin: 4px 0; }
  p { margin: 8px 0; }
  a { color: var(--accent); font-weight: 700; }
  footer { margin-top: 20px; color: var(--muted); font-size: 14px; text-align: center; }
</style>
</head>
<body>
<main>
  <header><span style="font-size:30px" aria-hidden="true">🐹</span><a href="/">HamiCare</a></header>
  <article class="card">
    <h1>${esc(doc.title)}</h1>
    <p class="date">Versão de ${esc(formatLegalDate(LEGAL_INFO.atualizado))}</p>
    <div class="summary"><strong>Em poucas palavras</strong><ul>${doc.summary.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
    ${doc.sections.map((s) => `<section><h2>${esc(s.h)}</h2>${s.body.map(block).join('')}</section>`).join('\n    ')}
  </article>
  <footer><a href="/${other.id}">${esc(other.title)}</a> · <a href="/">Abrir o HamiCare</a></footer>
</main>
</body>
</html>`;
}

export const legal = new Hono();
for (const doc of Object.values(LEGAL)) {
  const html = legalHtml(doc);
  legal.get(`/${doc.id}`, (c) => {
    c.header('Cache-Control', 'public, max-age=3600');
    return c.html(html);
  });
}

/** Avisa no terminal se os dados da empresa ainda estão com [colchetes]. */
export function warnLegalPlaceholders() {
  const missing = legalPlaceholders();
  if (missing.length) console.warn(`⚠️  Preencha LEGAL_INFO em web/src/shared/legal.ts antes de publicar: ${missing.join(', ')}`);
}
