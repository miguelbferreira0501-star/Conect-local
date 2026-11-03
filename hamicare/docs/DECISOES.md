# HamiCare: auditoria, decisão do mascote e plano

03/11/2026. Etapas 1 a 3 do prompt mestre. A implementação (etapa 4) e os testes (etapa 5) estão no código e em `docs/TESTES.md`.

## 1. Auditoria do que existia

| Parte | Estado encontrado |
|---|---|
| App | "Xodó": web app (React 18 + TypeScript + Vite + Tailwind), instalável, um arquivo só. 4 abas: Hoje, Calma, Diário, Coleção. |
| Mascote | **Não era um hamster**: era uma criatura redonda e original com um broto na cabeça, em 4 fases (Broto → Adulto). |
| Funções | Cuidados do dia ajustados à "bateria", modo dia difícil, respiração, 5-4-3-2-1, CVV 188, diário de humor, pote de coisas boas, loja com temporadas, passeios pelo Brasil com cartão-postal, backup por código. |
| Dados | Só no aparelho (localStorage). Sem conta, sem servidor, sem amigos. |
| Faltava | Peso/evolução física, ofensivas, amigos, feed, casa editável, mapa, banho e comida, conquistas, quiz inicial, plano pago, notificações, servidor, admin. |
| Base reaproveitável | O servidor do Conecta Local (mesmo repositório): Hono + PostgreSQL com **RLS por usuário**, sessão por cookie seguro, notificações push (web-push) e testes em Postgres real. O fundador já opera essa stack no Render. |

## 2. Decisão sobre o mascote: **hamster, redesenhado do zero**

O nome "HamiCare" já diz *hamster* (Hami) + *care*. Comparei 4 caminhos, com nota de 1 a 5:

| Critério | Hamster redesenhado | Criatura original (Xodó) | Capivara | Gato |
|---|---|---|---|---|
| Combina com o nome HamiCare | **5** | 1 | 1 | 1 |
| Carisma e identificação | 5 | 3 | 4 | 5 |
| Mudança gradual de peso sem virar piada | **5**: hamster já é redondo; o peso aparece como "fofura" (corpo e bochechas), bonito em qualquer fase | 2: uma bolha mais gorda ou mais magra vira "corpo" e nada mais | 3: já é um barril; pouca leitura visual | 3: gato gordo é meme (vira piada, que o prompt proíbe) |
| Metáfora de exercício | **5**: a rodinha é o símbolo mundial de hamster se mexendo | 1 | 2 | 2 |
| Metáfora de comida | **5**: guarda comida nas bochechas (animação natural) | 2 | 3 | 3 |
| Personalização (pelagens e cores) | 5: dourado, creme, cinza, panda, mais tons pastel | 4 | 3 | 5 |
| Animações | 5: correr na roda, encher bochechas, enrolar pra dormir | 3 | 3 | 4 |
| Originalidade | 3: hamster é comum; resolvido com traços próprios (abaixo) | 5 | 2: já existe "Capy: Self-Care Pet" | 2 |
| Público (adolescentes e jovens adultos no Brasil) | 5 | 3 | 5 | 5 |
| **Total** | **43** | 24 | 26 | 30 |

**Decisão:** manter o hamster como espécie e **redesenhá-lo como personagem próprio, o Hami**, para não ser "mais um hamster":
- **Marca registrada:** uma mancha de pelo **em forma de coração** na barriga (o "care" do nome). Na fase avançada ela brilha dourada.
- Silhueta de "pão de forma" com orelhas grandes de dentro rosado, patinhas curtas e bochechas que enchem quando come.
- Pelagens reais (Caramelo, Creme, Cinza-nuvem, Panda) e tons pastel (Algodão-doce, Lavanda, Menta, Céu, Pêssego, Limão).
- O mascote antigo (broto) foi **removido por completo**: logo, ícone, onboarding, loja, casa e fotos agora usam só o Hami.

**Risco assumido:** hamster é comum como figura. A marca vem do coração na barriga, do nome e da jornada de evolução, que nenhum concorrente tem.

## 3. Plano

### Mantido
Respiração, 5-4-3-2-1, CVV 188 sempre visível, diário de humor, pote de coisas boas, cuidados pequenos, modo dia difícil, bateria do dia, temporadas, sabor brasileiro nos textos e lugares, backup por código, tema claro e escuro.

### Aprimorado
- **Tarefas:** 4 categorias (Fitness, Autocuidado, Hábitos saudáveis, Bem-estar emocional), criar, editar, excluir, concluir e desfazer; desafios diários, semanais e mensais.
- **Ofensiva** (pedido do fundador) com **descanso protegido**: até 2 dias por semana sem atividade não quebram a sequência. Nível e conquistas nunca se perdem.
- **Loja:** roupas, chapéus, óculos, acessórios, móveis, brinquedos, comidas, papéis de parede, pisos, coleções temáticas, lista de desejos, presentes e o "presente do dia".
- **Passeios** viraram um **mapa com 10 lugares** que se desbloqueiam por nível, cada um com missões e 3 achadinhos colecionáveis (30 no total).
- **Bem-estar:** gráfico de humor, diário com reflexões guiadas, meditação, foco, relaxamento (escaneamento do corpo), rotina de sono, afirmações e quizzes de autoconhecimento (não clínicos).

### Alterado
- Nome: **HamiCare**. Mascote: **Hami**. Moeda: **sementes de girassol** (comida favorita de hamster).
- Navegação em 5 áreas: **Início, Atividades, Mundo, Bem-estar, Amigos**.
- Onboarding em formato de conversa com o Hami: 10 perguntas, plano inicial e apresentação do HamiCare+ com 7 dias grátis.

### Mecânica de peso (o diferencial)
- O Hami tem um **peso virtual em gramas**, com faixa saudável de **120 a 150 g**. Por ser em gramas de hamster, o número nunca é comparável com o de uma pessoa.
- **Aparência inicial** (só adultos escolhem): *Fofinho* (165 g), *Equilibrado* (135 g) ou *Mignon* (115 g).
- **Pesagem semanal**, nunca por exercício:
  - **Sem sincronização:** o Hami caminha até a faixa saudável, no máximo 3 g por semana, e só se a semana teve pelo menos 3 dias ativos. Dentro da faixa, ele mantém.
  - **Com sincronização** (opcional, só 18+, com consentimento explícito): o peso-alvo do Hami é o inicial × (média recente da pessoa ÷ peso da pessoa no início). Fica limitado a 105–175 g e anda no máximo 3 g por semana. Assim ele acompanha a pessoa de forma proporcional e gradual.
  - Comida e exercício **não** mudam o peso diretamente. Exercício melhora o **condicionamento**; comida melhora a **saciedade** e a felicidade.
- **Menores de 18:** sem números de peso, sem escolha de corpo e sem metas numéricas. O Hami fica sempre equilibrado e evolui só pelo condicionamento e pelos hábitos.
- **Metas pessoais (adultos):** precisam de 4 semanas ou mais e de, no máximo, 1% do peso por semana. Com altura informada, metas abaixo de IMC 18,5 são recusadas. O app não faz recomendação médica. Se aparecer queda rápida, ele mostra uma mensagem acolhedora sugerindo conversar com um profissional, se a pessoa quiser.
- **Modo sem números:** esconde todos os pesos, mesmo para adultos.

### Aparência
- **Fofura** (largura do corpo e das bochechas) vem do peso virtual: muda devagar e fica fofa em qualquer valor.
- **Condicionamento** (0 a 100) vem dos últimos 28 dias de movimento. Conta no máximo 1 ponto cheio por dia, então constância vale mais que intensidade.
- **4 fases**, que nunca regridem (descansar não tira nada):
  1. *Inicial*: topete de filhote.
  2. *Evolução*: orelhas maiores e postura mais alta.
  3. *Condicionamento*: postura atlética e faixa esportiva quando está sem chapéu.
  4. *Avançada*: coração dourado e brilho.
- **Nossa evolução:** linha do tempo, comparação das 4 fases, gráfico de peso do Hami (e o da pessoa, se ela ativar), fotos virtuais e conquistas.

### Onde ficam os dados
- **No aparelho primeiro:** tudo funciona sem internet.
- **Com conta:** backup privado do estado no servidor, com RLS (só o dono lê), salvamento automático e recuperação.
- **Amigos e feed** em tabelas próprias, com RLS. Peso, diário e humor **nunca** vão para tabelas sociais. Nas visitas e no feed, o Hami de outra pessoa aparece sempre no formato padrão, então ninguém compara corpo.
- **No link de teste** (página publicada no Claude), amigos e feed usam o armazenamento compartilhado da página entre as pessoas com acesso a ela.

### Stack
Mantida: React + TypeScript + Vite (web app instalável; Capacitor depois, para as lojas) e servidor **Hono + PostgreSQL com RLS**, igual ao do Conecta Local, que o fundador já sabe publicar. React Native/Expo e Supabase ficaram de fora: reescrever tudo atrasaria o lançamento e não daria para testar aqui. As tabelas e políticas foram escritas de forma que dá para migrar para o Supabase depois, se quiser.

### Fora desta entrega (próximos passos)
Cobrança real (Google Play Billing, App Store ou Pix via Asaas na web: o teste grátis de 7 dias já funciona), envio de push em produção (precisa do app instalado e do servidor no ar), app nas lojas (Capacitor), moderação por IA (o filtro atual é por regras e fica no servidor).
