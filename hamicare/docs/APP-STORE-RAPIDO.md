# Lançar o Lumbi na App Store (sem Mac)

O Codemagic compila num Mac na nuvem, assina e envia para a Apple. O código já está pronto para a loja:
compra do Lumbi+ pela Apple (com o servidor conferindo cada compra), restaurar compras, gerenciar
assinatura, excluir conta, termos e privacidade dentro do app. O programa Guardião (Pix fora da Apple)
não aparece no app do iPhone, só no site e no Android.

Quem faz os passos 1, 2, 5 e 6 é a **Jessika**, dona da conta (são dados e contratos dela).

---

## 1. Conta Apple Developer (1 a 2 dias de espera)
1. [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll) → entrar com o Apple ID
   da Jessika (com verificação em duas etapas ligada).
2. **Pessoa física**, nome igual ao documento, pagar **US$ 99 por ano** no cartão dela.
3. Esperar o e-mail de aprovação.

## 2. Criar o app (5 minutos)
[appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **Apps** → **+** → **Novo app**:

| Campo | Valor |
|---|---|
| Plataforma | iOS |
| Nome | `Lumbi: Self-Care` |
| Idioma principal | Português (Brasil) |
| ID do pacote | `com.hamicare.app` (se não aparecer: developer.apple.com → Identifiers → **+** → App IDs → esse pacote) |
| SKU | `hamicare-ios` |

Depois de criar, abra **Informações do app** e anote o **Apple ID** (um número, ex.: `6741234567`).

## 3. Assinaturas do Lumbi+ (15 minutos)
1. **Negócios** (ou "Contratos"): aceitar o **Contrato de apps pagos** e preencher banco e impostos (dados da
   Jessika). Sem isso as compras não funcionam, nem no teste.
2. No app → **Monetização → Assinaturas** → criar o grupo **`Lumbi+`** e, dentro dele, duas assinaturas:

| ID do produto (exatamente assim) | Nome | Duração | Preço (Brasil) |
|---|---|---|---|
| `com.hamicare.app.plus.anual` | Lumbi+ anual | 1 ano | R$ 329,90 |
| `com.hamicare.app.plus.mensal` | Lumbi+ mensal | 1 mês | R$ 49,90 |

   Em cada uma: nome de exibição e descrição em português (ex.: "Roupas, casas e jogos exclusivos, relatório
   da semana e sementes toda semana"), e a imagem de revisão (pode ser a captura `docs/lojas/iphone/3-volei.png`).
   **Não crie oferta de teste grátis da Apple**: o app já dá 7 dias sem cartão.
3. Em **Informações do app → Notificações do servidor da App Store**, colocar nos dois campos (Produção e
   Sandbox), versão 2:
   `https://hamicare.onrender.com/api/apple-webhook`

## 4. Servidor (Render, 2 minutos)
Render → serviço do Lumbi → **Environment** → adicionar `APPLE_APP_ID` = o número anotado no passo 2.
Depois, **Manual Deploy**. (Isso também aplica as mudanças de banco 011 a 014.)

## 5. Chave de API e Codemagic (15 minutos)
1. App Store Connect → **Usuários e acesso → Integrações → App Store Connect API** → gerar chave com acesso
   **App Manager**. Baixar o `.p8` (só baixa uma vez) e anotar **Issuer ID** e **Key ID**.
2. [codemagic.io](https://codemagic.io) → entrar com o GitHub → adicionar o repositório **Conect-local**.
3. **Team settings → Integrations → Developer Portal** → conectar com os três dados, com o nome exatamente
   **`Lumbi ASC`**.
4. Rodar o workflow **Lumbi iOS (TestFlight)**. Em uns 20 minutos o app aparece no TestFlight.

## 6. Testar no iPhone antes de mandar (TestFlight)
1. App Store Connect → **Usuários e acesso → +** → seu e-mail (função *Marketing* basta).
2. No app → **TestFlight → Testes internos** → adicionar você. Instalar o app **TestFlight** e aceitar o convite.
3. Para testar a compra sem pagar: App Store Connect → **Usuários e acesso → Sandbox → +** → criar um
   "testador sandbox" (e-mail que nunca foi Apple ID). No iPhone: Ajustes → App Store → **Conta Sandbox**.
4. Conferir: criar conta, missões, parque de jogos, e em Plus → planos → **Assinar** (a compra de teste é grátis).

## 7. Ficha da loja (copiar e colar)

**Subtítulo:** `Hábitos e calma com um pet`

**Palavras-chave:** `autocuidado,saúde mental,ansiedade,hábitos,calma,bem-estar,rotina,humor,diário,pet virtual`

**Texto promocional:** `Novo: coleções de Inverno, Praia e Jardim, com móveis e roupinhas combinando!`

**Descrição:**
```
Conheça o Lumbi, um cachorrinho que cresce junto com você. Cada cuidado que você tem consigo, como beber água, arrumar a cama, alongar ou respirar fundo, vira uma tarefa cumprida: o Lumbi fica feliz e sai em aventuras.

AUTOCUIDADO SEM PRESSÃO
• Tarefas pequenas do seu jeito e uma meta do dia que você escolhe
• Rotinas prontas para organizar o dia, se mexer, estudar e relaxar
• Check-in de humor, diário, respiração e SOS para a ansiedade
• Autoavaliações rápidas para se conhecer melhor (não são diagnóstico)
• Água do dia com lembretes

UM CANTINHO SÓ SEU
• Decore a casa do Lumbi com móveis e coleções temáticas
• Centenas de roupas e fantasias fofas
• Brinque com ele no quintal: jogue o graveto, dê petiscos e ganhe corações
• Complete a meta do dia e ele viaja por 12 mundos, até a Lua

LUMBI+ (opcional)
• Roupas, casas e pelagens exclusivas, relatório da semana e sementes toda semana
• Até 7 dias grátis, sem cartão. Depois: R$ 49,90 por mês ou R$ 329,90 por ano, com renovação automática pela sua conta Apple. Cancele quando quiser nos Ajustes do iPhone.

O essencial é sempre grátis e sem anúncios.

O Lumbi é um app de bem-estar e não substitui acompanhamento profissional. Em uma crise, ligue para o CVV (188) ou o SAMU (192).

Termos de Uso: https://hamicare.onrender.com/termos
Privacidade: https://hamicare.onrender.com/privacidade
```

**URLs:** Suporte `https://hamicare.onrender.com/excluir-conta` · Privacidade `https://hamicare.onrender.com/privacidade`

**Categoria:** Saúde e fitness (secundária: Estilo de vida) · **Direitos autorais:** `2026 Jessika Neusa Borges Gervin`

**Capturas (iPhone 6,9", 1320×2868):** as 8 de `docs/lojas/iphone/`, nesta ordem. O app é só para iPhone: não precisa de iPad.

**Classificação etária:** responder o questionário com sinceridade: conteúdo gerado por usuários (com
moderação, denúncia e bloqueio), compras no app, sem violência, sem jogos de azar com dinheiro. Os baús são
prêmios do jogo, comprados só com sementes ganhas no app (nunca com dinheiro).

**Privacidade do app** (perguntas da Apple):
- Coleta dados? **Sim**. Usados para rastreamento? **Não** (nenhum).
- *Informações de contato → E-mail* e *Nome*: funcionalidade do app, ligados à conta.
- *Saúde e condicionamento → Saúde*: funcionalidade do app (humor, diário), ligados à conta.
- *Conteúdo do usuário → Fotos e Outros conteúdos* (posts, diário no backup): funcionalidade do app, ligados à conta.
- *Identificadores → ID do usuário*: funcionalidade do app, ligado à conta.
- *Compras → Histórico de compras*: funcionalidade do app (liberar o Plus), ligado à conta.

**Informações para a revisão** (campo "Notas"):
```
Conta de teste: [e-mail] / [senha]
O Lumbi é um app de autocuidado com um bichinho virtual. As missões são hábitos simples (beber água, alongar).
O Lumbi+ é vendido só pela compra da Apple (Plus → Ver planos → Assinar; "Restaurar compras" também fica em Ajustes).
O teste grátis de 7 dias é do próprio app e não pede cartão.
Os baús são prêmios do jogo comprados só com sementes ganhas no app; as chances aparecem antes de abrir. Para menores de 18 anos o conteúdo do baú é mostrado antes.
Amigos e feed precisam de duas contas; comentários passam por filtro e há denúncia e bloqueio.
Excluir conta: Ajustes → Conta e nuvem → Excluir conta.
```
Crie essa conta de teste no app de verdade antes (com idade 18+) e troque o e-mail e a senha acima.

## 8. Mandar para a revisão
- Pelo celular: GitHub → repositório → **Releases → Draft a new release** → tag `ios-v1.0.0` → **Publish
  release**. O Codemagic compila, sobe e manda para a revisão (workflow "Lumbi iOS (enviar para a App Store)").
- Ou no App Store Connect: na versão 1.0, escolher a compilação do TestFlight, marcar as duas assinaturas em
  **Compras no app e assinaturas** (na primeira vez elas vão junto com o app) e **Enviar para revisão**.
- A Apple responde em 1 a 3 dias. Se recusar, mande o print da mensagem que eu resolvo.
- Aprovado: tocar em **Publicar** (o lançamento é manual, para escolher o dia).

## Versões novas
Nova tag `ios-v1.0.1`, `ios-v1.0.2`… e pronto.
