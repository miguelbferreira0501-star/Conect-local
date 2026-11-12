# App Store do jeito mais curto (sem Mac)

O Codemagic compila no Mac dele, assina e envia para a Apple. Você só faz as partes que exigem uma pessoa.

## Uma vez só (cerca de 1 hora, mais a espera da Apple)
1. **Conta Apple Developer** (US$ 99/ano), feita por um **adulto, no nome dele**, como pessoa física:
   developer.apple.com/programs/enroll. A aprovação leva de 1 a 2 dias.
2. **Criar o app** em appstoreconnect.apple.com → Apps → **+**: iOS, nome "HamiCare", português (Brasil),
   pacote **com.hamicare.app**.
3. **Chave de API**: App Store Connect → Usuários e acesso → Integrações → **App Store Connect API** → gerar
   chave com acesso **App Manager**. Baixe o arquivo `.p8` (só baixa uma vez) e anote o Issuer ID e o Key ID.
4. **Codemagic** (codemagic.io, entrar com o GitHub): Team settings → Integrations → Developer Portal →
   conectar com os três dados acima e dar o nome **HamiCare ASC**. Adicionar o repositório Conect-local.
5. **Ficha da loja** no App Store Connect (copiar e colar de `docs/lojas/` e `docs/LOJAS.md`): descrição,
   palavras-chave, capturas de 6,9" (já prontas em `docs/lojas/`), URL de privacidade
   (`/privacidade` do site), classificação etária (12+), "Privacidade do app" (dados: e-mail, saúde/
   bem-estar, vinculados à conta, sem rastreamento) e conta de teste para o revisor (e-mail e senha).
6. **Assinatura do Plus** (In-App Purchase): Monetização → Assinaturas → grupo "HamiCare+" com mensal e
   anual. Sem isso a Apple recusa, porque o Plus é vendido dentro do app.

## Toda vez que quiser lançar uma versão (2 minutos)
- Crie uma tag no GitHub chamada `ios-v1.0.0` (depois `ios-v1.0.1`, …). Pelo celular: GitHub → repositório
  → Releases → **Draft a new release** → "Choose a tag" → digite `ios-v1.0.0` → **Publish release**.
- O Codemagic compila, sobe para o TestFlight e já manda para a revisão da Apple (workflow
  "HamiCare iOS (enviar para a App Store)"). A revisão costuma levar de 1 a 3 dias.
- Quando chegar o e-mail de aprovado, toque em **Publicar** no App Store Connect (lançamento manual, para
  você escolher o dia).

Para só testar no seu iPhone sem passar pela revisão, rode o workflow "HamiCare iOS (TestFlight)" e instale
pelo app TestFlight.

## O que costuma dar recusa (e já está resolvido no app)
- Excluir conta dentro do app: tem (Ajustes → Conta).
- Chances dos baús visíveis antes de abrir: tem. Para menores de 18, o baú é revelado.
- Termos e privacidade dentro do app: tem.
- Pagamento por fora da Apple dentro do app: o programa Guardiões só aparece fora das lojas (já é assim).
