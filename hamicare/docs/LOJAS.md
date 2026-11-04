# Colocar o HamiCare na Google Play e na App Store

O HamiCare já está no ar em `https://hamicare.onrender.com`. Para as lojas, o app vira um pacote
que abre esse mesmo endereço em tela cheia, sem a barra do navegador. Tudo o que muda no site
chega no app das lojas na hora, sem precisar mandar versão nova.

Imagens prontas para as lojas ficam em [`docs/lojas/`](lojas): ícone 512×512, banner 1024×500 e
6 capturas 1080×1920 com legenda.

---

## 0. Antes de começar

- [ ] **Seus dados na política e nos termos** (`LEGAL_INFO` em `web/src/shared/legal.ts`): nome ou empresa,
      CPF ou CNPJ, cidade e e-mail de contato. As duas lojas exigem saber quem responde pelo app.
- [ ] **Plano Starter no Render (US$ 7/mês).** No plano grátis o servidor dorme e leva 1 minuto para abrir.
      Quem avalia o app nas lojas pode recusar um app que demora para abrir.
- [ ] **Domínio próprio (opcional).** O app das lojas fica preso ao endereço. Se depois trocar
      `hamicare.onrender.com` por `hamicare.com.br`, é preciso mandar uma versão nova do app.
      Se for comprar o domínio, compre antes.
- [ ] **Público-alvo.** Decida se o app nas lojas é para 13 anos ou mais (mais simples) ou se inclui
      crianças de até 12 anos. Com crianças, a Google Play aplica a Política para Famílias, que tem mais regras e uma revisão mais longa.

---

## 1. Google Play (Android)

### 1.1 Conta de desenvolvedor
1. Acesse [play.google.com/console](https://play.google.com/console) com a sua conta Google.
2. Escolha **conta pessoal** (ou organização, se tiver CNPJ e número D-U-N-S).
3. Pague a taxa única de **US$ 25** e envie o documento para a verificação de identidade (leva alguns dias).

> **Conta pessoal nova:** antes de liberar para todo mundo, a Google exige um **teste fechado com pelo
> menos 12 pessoas por 14 dias seguidos**. Comece a chamar os testadores cedo (amigos e família com Android).
> Contas de organização não têm essa exigência.

### 1.2 Gerar o pacote do app (PWABuilder)
1. Abra [pwabuilder.com](https://www.pwabuilder.com) e cole `https://hamicare.onrender.com`.
2. Toque em **Package for stores → Android → Generate Package** e preencha as opções:
   - **Package ID:** `com.hamicare.app`
   - **App name:** `HamiCare` · **Launcher name:** `HamiCare`
   - **App version:** `1.0.0` · **Version code:** `1`
   - **Signing key:** *Create new* (o PWABuilder cria a chave)
3. Baixe o arquivo `.zip`. Dentro dele estão:
   - `*.aab`: o app que vai para a Google Play;
   - `signing.keystore` e `signing-key-info.txt`: a chave e as senhas;
   - `assetlinks.json`: o vínculo do app com o site.
4. ⚠️ **Guarde o `signing.keystore` e o `signing-key-info.txt` num lugar seguro** (ex.: Google Drive privado).
   Sem eles não dá para mandar versões novas. Não mande esses arquivos no chat.

### 1.3 Ligar o app ao site (tela cheia, sem barra do navegador)
1. Abra o `assetlinks.json` do zip e copie o valor de `sha256_cert_fingerprints`
   (uma sequência como `AB:CD:EF:...`). Ele **não é segredo**.
2. No Render → serviço **hamicare** → **Environment**, adicione:
   - `ANDROID_PACKAGE_NAME` = `com.hamicare.app`
   - `ANDROID_CERT_SHA256` = a sequência copiada
3. Salve. Depois de publicar, abra `https://hamicare.onrender.com/.well-known/assetlinks.json`:
   tem que aparecer o nome do pacote e a sequência.
4. **Depois de enviar o app para a Play (passo 1.6):** a Google assina o app com uma chave dela.
   Em **Play Console → Testar e lançar → Configuração → Integridade do app → Assinatura do app**, copie a
   **Impressão digital do certificado SHA-256** da *chave de assinatura do app* e acrescente no
   `ANDROID_CERT_SHA256`, separada por vírgula:
   `AB:CD:...(do PWABuilder), 12:34:...(da Play)`.
   Sem isso, o app baixado da loja abre com a barra do navegador.

### 1.4 Criar o app no Play Console
**Criar app** → nome `HamiCare` · idioma padrão **Português (Brasil)** · **App** · **Gratuito**.

### 1.5 Página do app na loja (Presença na loja → Página principal)
- **Nome do app:** `HamiCare: hábitos e calma`
- **Descrição curta** e **descrição completa:** veja a seção 3.
- **Ícone:** `docs/lojas/icone-512.png`
- **Recurso gráfico (banner):** `docs/lojas/banner-1024x500.png`
- **Capturas de tela do celular:** as 6 `docs/lojas/captura-*.png`
- **Categoria:** Saúde e fitness · **E-mail de contato:** o mesmo da política

### 1.6 Conteúdo do app (Política → Conteúdo do app)
| Formulário | O que responder |
| --- | --- |
| Política de Privacidade | `https://hamicare.onrender.com/privacidade` |
| Acesso ao app | Tudo funciona sem conta. A conta (Ajustes → Conta e nuvem) pode ser criada com qualquer e-mail. |
| Anúncios | Não tem anúncios |
| Classificação do conteúdo | Questionário IARC: sem violência, sem conteúdo sexual, sem apostas. **Usuários interagem entre si: sim** (amigos e feed com moderação). Não compartilha localização. **Compras digitais: não** (os baús usam só sementes do app). |
| Público-alvo | Conforme a decisão do passo 0 (sugestão: 13 anos ou mais) |
| Apps de saúde | Marque **Controle de peso e nutrição** e **Saúde mental e bem-estar (estresse, sono, meditação)**. O app não é dispositivo médico e não faz diagnóstico. |
| Exclusão de conta | Sim, pelo app e pelo site: `https://hamicare.onrender.com/excluir-conta` |
| Segurança dos dados | Veja a tabela abaixo |
| Apps governamentais / financeiros | Não |

**Segurança dos dados (Data safety)**
- Os dados são criptografados em trânsito: **sim**. O usuário pode pedir a exclusão: **sim**.
- Coletado só para quem cria conta, **não compartilhado** com terceiros, finalidade **funcionalidade do app**:
  - Informações pessoais: **nome** e **endereço de e-mail** (gerenciamento da conta)
  - Saúde e fitness: **informações de saúde** e **de fitness** (peso, calorias e humor, se a pessoa registrar, no backup)
  - Fotos: **fotos** (só as que a pessoa posta no feed)
  - Mensagens / conteúdo do usuário: **outros conteúdos gerados pelo usuário** (posts e comentários)
  - Atividade no app: **interações no app** (missões, progresso do jogo)
  - Identificadores: **outros IDs** (inscrição para lembretes)
- Sem conta, nada sai do aparelho.

### 1.7 Teste fechado (obrigatório para conta pessoal nova)
1. **Testar e lançar → Teste fechado → Criar faixa** → envie o `.aab`.
2. Crie uma lista com os e-mails Google de **12 ou mais testadores** e salve.
3. Mande o **link de participação** para eles. Cada um aceita e instala pela Play.
4. Espere **14 dias seguidos** com os 12 participando. Depois, em **Painel**, peça o **acesso à produção**
   e responda as perguntas sobre o teste.

### 1.8 Produção
**Produção → Criar versão** → use o mesmo `.aab` (ou um novo com *version code* maior) → **Enviar para revisão**.
A primeira revisão costuma levar de alguns dias a 1 semana.

---

## 2. App Store (iPhone)

A Apple não aceita só um site dentro de um app: o HamiCare precisa de um projeto nativo (feito com
Capacitor) com recursos do iPhone, como as notificações. Esse projeto o Claude prepara no repositório.

1. **Conta Apple Developer:** [developer.apple.com/programs](https://developer.apple.com/programs),
   **US$ 99 por ano**, com o seu Apple ID (com verificação em duas etapas). A aprovação leva de 1 a 2 dias.
2. **Compilar sem Mac:** com o [Codemagic](https://codemagic.io) (grátis até 500 minutos por mês), ligado
   ao GitHub e à sua conta Apple por uma *chave de API do App Store Connect*. O Codemagic gera e assina o app
   e manda para o TestFlight.
3. **App Store Connect:** criar o app (`HamiCare`, pacote `com.hamicare.app`), preencher as
   *Informações de privacidade* (iguais à Segurança dos dados da Google), a classificação etária e as capturas.
4. **TestFlight → revisão.** A Apple costuma responder em 1 a 3 dias.

Diferenças da Apple:
- Assinaturas dentro do app têm que usar a compra da Apple (o Plus pago vem depois, junto com o da Google).
- Excluir conta pelo app: já existe.

---

## 3. Textos da loja

**Nome (até 30):** `HamiCare: hábitos e calma`

**Subtítulo da App Store (até 30):** `Hábitos, calma e um mascote`

**Descrição curta da Google Play (até 80):**
`Cuide de você com o Hami: hábitos, calma e um mundo para explorar.`

**Palavras-chave da App Store (até 100):**
`hábitos,autocuidado,ansiedade,calma,bem-estar,mascote,hamster,rotina,saúde,respiração,diário,humor`

**Descrição completa:**

> Conheça o Hami, um hamster que evolui junto com você. Cada cuidado que você tem consigo mesmo, como
> beber água, arrumar a cama, caminhar ou respirar fundo, vira uma missão cumprida, e o Hami fica mais feliz.
>
> **Escolha a sua área**
> • Hábitos saudáveis: rotina leve, no seu ritmo
> • Calma para a ansiedade: SOS, respiração, 5-4-3-2-1 e sono
> • Perder ou ganhar peso, com acompanhamento opcional e privado (só para maiores de 18)
>
> **Um mundo inteiro para explorar**
> • 12 arenas, da casinha inicial à ilha celestial, cada uma com casa própria
> • Baús, coleções, roupas e móveis para o Hami, tudo com sementes ganhas se cuidando
> • Temporada grátis todo mês: um dia com uma missão feita já conta
>
> **Cuidado de verdade**
> • Sem pressa e sem culpa: dias de descanso não quebram a sua ofensiva
> • Diário e humor só seus
> • Amigos e feed só de gentileza, com moderação
> • Funciona sem conta. Com conta, o seu progresso fica salvo na nuvem
>
> O HamiCare é um app de bem-estar e não substitui acompanhamento profissional.
> Em uma crise, ligue para o CVV (188) ou o SAMU (192).

**O que há de novo (versão 1.0.0):** `Primeira versão do HamiCare na loja.`
