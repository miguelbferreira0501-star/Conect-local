// O que as lojas de apps pedem do site: o vínculo do app Android com o domínio
// (/.well-known/assetlinks.json, para abrir em tela cheia) e a página para excluir a conta.
import { Hono } from 'hono';
import { env } from '../env';
import { LEGAL_INFO } from '../../../web/src/shared/legal';
import { esc, pageShell } from './legal';

/** Aceita "AB:CD:..." ou "abcd..." e devolve no formato das lojas (maiúsculas com dois-pontos). */
export function normalizeFingerprint(raw: string): string | null {
  const hex = raw.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
  if (hex.length !== 64) return null;
  return hex.match(/.{2}/g)!.join(':');
}

export function assetLinks(pkg: string | undefined, certs: string | undefined) {
  const fingerprints = (certs ?? '')
    .split(/[,\s]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map(normalizeFingerprint)
    .filter((x): x is string => !!x);
  if (!pkg || !fingerprints.length) return null;
  return [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: { namespace: 'android_app', package_name: pkg, sha256_cert_fingerprints: [...new Set(fingerprints)] },
    },
  ];
}

const DELETE_HTML = pageShell(
  'Excluir sua conta',
  'Como excluir sua conta do HamiCare e o que acontece com os seus dados.',
  `    <h1>Excluir sua conta do HamiCare</h1>
    <p>Você pode excluir sua conta a qualquer momento, sem custo e sem precisar explicar o motivo.</p>
    <h2>Pelo app (o jeito mais rápido)</h2>
    <ol>
      <li>Abra o HamiCare e toque na engrenagem (Ajustes), no topo do Início.</li>
      <li>Toque em <b>Conta e nuvem</b> e depois em <b>Excluir minha conta</b>.</li>
      <li>Digite a sua senha e confirme.</li>
    </ol>
    <p>Esqueceu a senha? Na mesma tela, toque em <b>Já tenho conta → Esqueci minha senha</b>, troque a senha pelo link que chega no seu e-mail e depois exclua a conta.</p>
    <h2>Sem acesso ao app</h2>
    <p>Escreva para <a href="mailto:${esc(LEGAL_INFO.email)}?subject=Excluir%20conta">${esc(LEGAL_INFO.email)}</a> com o assunto <b>Excluir conta</b>, a partir do e-mail cadastrado. Respondemos em até 15 dias.</p>
    <h2>O que é apagado na hora</h2>
    <ul>
      <li>Conta (nome, e-mail e senha) e o backup do seu progresso.</li>
      <li>Perfil, amizades, grupos que você criou, posts, comentários, reações, presentes e visitas.</li>
      <li>Sementes, itens, baús, coleções e o histórico do jogo.</li>
      <li>Lembretes e notificações.</li>
    </ul>
    <h2>O que pode ficar por um tempo</h2>
    <ul>
      <li>Cópias de segurança do banco de dados, que somem sozinhas em até 30 dias.</li>
      <li>Registros de acesso ao servidor (data, hora e IP), guardados por 6 meses porque a lei exige (Marco Civil da Internet, art. 15).</li>
    </ul>
    <h2>Sem conta</h2>
    <p>Sem conta, tudo fica só no seu aparelho e nós não temos acesso. Para apagar, desinstale o app ou limpe os dados do site no navegador.</p>`,
  `<a href="/privacidade">Política de Privacidade</a> · <a href="/termos">Termos de Uso</a> · <a href="/">Abrir o HamiCare</a>`,
);

export const stores = new Hono();

stores.get('/.well-known/assetlinks.json', (c) => {
  const links = assetLinks(env.ANDROID_PACKAGE_NAME, env.ANDROID_CERT_SHA256);
  if (!links) return c.json([], 404);
  c.header('Cache-Control', 'public, max-age=3600');
  return c.json(links);
});

stores.get('/excluir-conta', (c) => {
  c.header('Cache-Control', 'public, max-age=3600');
  return c.html(DELETE_HTML);
});
