# Lançamento na Google Play

O app Android é o próprio site empacotado como **TWA** (Trusted Web Activity): abre em tela cheia, sem barra de
navegador, e se atualiza sozinho quando o site é atualizado — sem reenviar o app à loja.

## Antes de começar

- [ ] Site publicado com HTTPS (Render + Neon — veja o README).
- [ ] **Empresas reais cadastradas pelo painel (`/empresas`) e `DEMO_MODE=false`** no Render (as fictícias são apagadas sozinhas na reinicialização). A Play Store não aceita apps que apresentam
      empresas ou avaliações fictícias como reais (política de conteúdo enganoso).
- [ ] Termos e política de privacidade revisados (hoje são texto-modelo em `/termos`).
- [ ] `ADMIN_EMAILS` no Render com o seu e-mail, para moderar em `/admin`.
- [ ] E-mail de suporte real em `packages/shared/src/brand.ts`.
- [ ] Conta de desenvolvedor no [Google Play Console](https://play.google.com/console) (taxa única de US$ 25).
      Contas pessoais novas precisam de um **teste fechado com pelo menos 12 testadores por 14 dias**
      antes de liberar para todos.

## 1. Gerar o app (PWABuilder)

1. Acesse https://www.pwabuilder.com, digite o endereço do site (ex.: `https://conecta-local.onrender.com`) e clique em **Start**.
2. Clique em **Package for stores** → **Android** → **Generate Package**.
   - *Package ID*: `br.com.conectalocal.app` (não pode ser trocado depois).
   - *App name*: `Conecta Local` · *Launcher name*: `Conecta`.
   - Deixe o PWABuilder **criar uma nova chave de assinatura** (signing key).
3. Baixe o `.zip`. Dentro dele estão:
   - `*.aab` → o arquivo que vai para a Play Store;
   - `signing.keystore` e `signing-key-info.txt` → **guarde em lugar seguro** (sem eles não dá para atualizar o app);
   - `assetlinks.json` → contém o *package name* e a impressão digital SHA-256.

## 2. Ligar o app ao site

No Render, em **Environment**, preencha e salve (o site reinicia sozinho):

- `ANDROID_PACKAGE_NAME` = o Package ID (ex.: `br.com.conectalocal.app`)
- `ANDROID_CERT_SHA256` = o valor de `sha256_cert_fingerprints` do `assetlinks.json`

Depois de enviar o app (passo 3), copie também a impressão digital da **chave de assinatura do Google**
(Play Console → *Testar e lançar* → *Configuração* → *Integridade do app* → *Assinatura de apps*) e acrescente em
`ANDROID_CERT_SHA256`, separada por vírgula. Confira em `https://SEU-SITE/.well-known/assetlinks.json`.

## 3. Play Console

1. **Criar app** → nome `Conecta Local`, idioma Português (Brasil), App, Gratuito.
2. **Ficha da loja principal** → textos abaixo + imagens desta pasta:
   - Ícone: `icone-play-512.png`
   - Recurso gráfico: `banner-1024x500.png`
   - Capturas de tela do telefone: `capturas/*.png` (de 2 a 8)
3. **Conteúdo do app**: política de privacidade `https://SEU-SITE/termos`, anúncios: **não**, acesso ao app
   (informe a conta de teste para o revisor), classificação de conteúdo, público-alvo **18+**, segurança dos dados
   (respostas abaixo), exclusão de conta `https://SEU-SITE/excluir-conta`.
4. **Testar e lançar** → **Teste fechado** → envie o `.aab`, adicione os testadores (e-mails) e publique.
   Após 14 dias com 12+ testadores, solicite o acesso à **Produção**.

## Textos da ficha

**Nome do app (30):** Conecta Local

**Descrição curta (80):** Encontre empresas confiáveis na sua cidade, compare avaliações reais e agende.

**Descrição completa:**

> Precisa de um eletricista, uma oficina, um pet shop ou um fotógrafo e não sabe em quem confiar?
> O Conecta Local reúne empresas e profissionais da sua cidade em um só lugar.
>
> • Escolha seu estado e cidade — todos os municípios do Brasil
> • Busque por serviço ou nome da empresa
> • Compare notas, avaliações, serviços e preços
> • Veja horários, área atendida e formas de contato
> • Agende horários ou peça orçamentos em poucos toques
> • Salve suas empresas favoritas
> • Acompanhe seus pedidos e avalie depois do atendimento
>
> Avaliações confiáveis: só avalia quem contratou pela plataforma, e a posição das empresas na busca não pode ser
> comprada. Você entende por que cada empresa aparece em cada posição.
>
> Navegue sem cadastro. Crie uma conta grátis só quando quiser agendar, pedir orçamento ou avaliar.

**Categoria:** Estilo de vida (alternativa: Empresa) · **Tags:** serviços locais, avaliações, agendamento

## Segurança dos dados (respostas sugeridas)

| Pergunta | Resposta |
| --- | --- |
| Coleta ou compartilha dados? | Sim, coleta |
| Dados criptografados em trânsito? | Sim (HTTPS) |
| Usuário pode pedir exclusão? | Sim — no app e em `/excluir-conta` |
| Informações pessoais | Nome, e-mail, telefone (opcional) — funcionalidade do app e gerenciamento da conta; obrigatórios só para criar conta |
| Local | Local aproximado — opcional, processado temporariamente (não armazenado), funcionalidade do app |
| Atividade no app | Interações (agendamentos, pedidos, favoritos) e conteúdo gerado (avaliações) — funcionalidade do app |
| Compartilhamento | Não. Os dados de contato vão para a empresa somente quando o usuário envia um pedido a ela (ação iniciada pelo usuário) |

Revise as respostas se integrar outros serviços (analytics, e-mail, mapas).

## Atualizar as imagens da loja

Com o servidor rodando localmente: `node scripts/make-store-assets.mjs` (e `node scripts/make-icons.mjs` para ícones).
