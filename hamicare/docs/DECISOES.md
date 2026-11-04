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

### Mecânica de peso (o diferencial) — versão 2: jornada de calorias

Pedido do dono do produto: o foco principal é o Hami **emagrecer ou engordar com a pessoa**, e cada missão saudável tirar "calorias" do Hami, o equivalente ao que a pessoa perderia. Isso substitui a regra antiga "exercício nunca muda o peso" para adultos.

- **Missão no começo:** emagrecer, ganhar peso ou manter (ou só hábitos). Menores de 18 nem veem as opções de peso.
- **Calorias por missão (estimativas, explicadas na tela):**
  - Movimento: (MET − 1) × peso da pessoa × horas, ou seja, só o que passa do gasto em repouso. Caminhada de 15 min para 70 kg ≈ 44 kcal.
  - Trocas saudáveis (emagrecer): refrigerante → água ≈ 140 kcal; fruta no lugar do doce ≈ 90; café sem açúcar ≈ 40; salada antes do almoço ≈ 80. Um copo d'água sozinho vale 5 kcal (sendo honesto: a água quase não queima calorias).
  - Lanches nutritivos (ganhar): vitamina ≈ 350, lanche extra ≈ 300, castanhas ≈ 180. Para quem quer ganhar, exercício **não** tira peso do Hami (vira condicionamento).
- **Equivalência:** 7.700 kcal ≈ 1 kg. A meta da pessoa vira o total de calorias da jornada (padrão: 5% do peso). O Hami vai do peso inicial dele até o da meta na mesma proporção: quando a pessoa chega na meta, ele chega na dele. Sem peso informado, as contas usam 70 kg e a tela avisa.
- **Sem exagero:** até 800 kcal contam por dia (700 para ganhar), o que mantém o ritmo perto de 1% do peso por semana. Descanso nunca tira nada.
- **Metas:** até 20% do peso por jornada (15% para ganhar), nunca abaixo de IMC 18,5 com altura. Depois da meta, a pessoa escolhe a próxima missão (manter também comemora).
- **Balança (opcional):** com registros de peso e consentimento, o Hami pode seguir o progresso real em vez das missões. Aviso de cuidado se a queda for rápida.
- **Menores de 18:** o Hami não muda de peso e não há contagem de calorias.
- **Nunca público:** peso, calorias, diário e humor ficam fora do perfil, do feed e dos grupos.

### Aparência
- **Fofura** (largura do corpo e das bochechas) vem do peso do Hami: muda um pouquinho a cada missão e fica fofa em qualquer valor.
- **Visual vivo** (arte própria): jardim com céu da hora do dia, botões com volume, abas ilustradas, boas-vindas do dia, tela de ofensiva com raios, álbum de figurinhas, loja da Dona Capivara com coleção do dia e temporada do mês.
- **Cuidados interativos:** cada cuidado é um minijogo com ferramenta que segue o dedo, partículas e reação do Hami (risada, boca aberta, molhado, brilhando).
- **Identidade de cor única:** cada aba tem uma cor de fundo só (Início menta, Missões céu, Mundo pêssego, Bem-estar rosa, Amigos lavanda, começo damasco), usada também na barra de abas e nas telas cheias. Conteúdo em cartões brancos; botões "quadradinhos" arredondados com volume embaixo; botão de concluir branco com check verde; desafios numa linha do tempo com barrinha "0 / 1". O tema claro passou a ser o padrão (o escuro continua nos Ajustes, também com cores por aba).
- **Rede social gentil:** perfil com bio e contadores só positivos, stories, toque duplo para curtir e grupos com mural próprio (só amigos de quem criou entram; bloqueio esconde a pessoa no grupo).
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

### Missões x Cardápio (atualização)

Pedido do dono do produto: missões são hábitos saudáveis, sem alimentos; os alimentos ficam só no Cardápio, onde a pessoa monta o prato e vê as calorias.

- Saíram das missões: comer fruta, refeição equilibrada, salada, trocar refrigerante, café sem açúcar, lanche, vitamina e castanhas. Quem já tinha essas missões na lista perde só elas (o histórico dos dias fica).
- Entraram: dar 5 mil passos, yoga ou pilates, beber água ao acordar.
- **Emagrecer:** o Hami muda com os hábitos (movimento, água, sono). O Cardápio é só para ver as calorias; ele não conta para emagrecer, para não premiar comer menos do que o corpo precisa nem registrar pela metade.
- **Ganhar peso:** como ganhar peso depende de comer mais, o Hami cresce com o que a pessoa marcou que comeu acima da referência dela no Cardápio (até 700 kcal por dia). Sem referência, o app pede para colocar uma. As missões dessa jornada são hábitos que ajudam (força, sono, água).

### Preparação para publicar

- **Troca de senha:** link por e-mail (Resend) que vale 1 hora e uma vez só. O código do link fica guardado embaralhado no banco, vai depois do `#` (não chega a registros de servidor) e some da barra de endereço ao abrir. A resposta é a mesma exista a conta ou não. O endereço do link vem da configuração (`APP_URL` ou o endereço do Render), nunca do cabeçalho da requisição. Ao trocar, todas as sessões caem.
- **Privacidade e termos:** um texto só (`web/src/shared/legal.ts`) para o app e para o site, porque as lojas pedem uma URL pública. Linguagem simples, com resumo no topo, seguindo LGPD (dados de saúde com consentimento destacado, direitos do art. 18, transferência internacional), CDC (arrependimento de 7 dias) e as regras para crianças e adolescentes. Os dados da empresa ficam em `LEGAL_INFO`, e o servidor avisa enquanto estiverem em branco.
- **Consentimento registrado:** o cadastro grava a versão dos termos, a data do aceite e a data do consentimento de saúde, porque cabe ao app provar o consentimento (LGPD, art. 8º).
- **Passo a passo de publicação:** `docs/PUBLICAR.md`.
- **E-mail sem domínio para começar:** o Resend só entrega para o próprio dono da conta enquanto não há domínio verificado, e o plano grátis do Render bloqueia SMTP. Por isso o servidor aceita três caminhos, nesta ordem: Resend (com domínio), Brevo (pela web, com um e-mail verificado como remetente, funciona no plano grátis) e SMTP (Gmail com senha de app, no plano pago).

### Ilustrações próprias

Pedido do dono do produto: tirar os emojis e usar desenhos como os de apps de bichinho (sem copiar nenhum). O HamiCare ganhou um conjunto próprio de cerca de 230 ilustrações em SVG (`web/src/components/art/`), num estilo só: formas chapadas e arredondadas, uma sombra suave e um brilho. Os dados continuam usando o emoji como chave, então nada salvo pelas pessoas precisou mudar; a tela desenha a ilustração no lugar (`<Glyph e="🪥" />`). Os móveis da casa também passaram a ser desenhados.

### Foto real

A foto real do feed agora abre uma câmera dentro do app (tirar, refazer, usar, virar a câmera), com a galeria como segunda opção. O botão antigo dependia do seletor de arquivos do navegador, que alguns visualizadores ignoram.

### Áreas

Pedido do dono do produto: no começo, escolher a área (só perder ou ganhar peso, ou só hábitos saudáveis), algo para quem tem ansiedade, e poder trocar de área depois.

- **Quatro áreas no começo:** Perder peso, Ganhar peso, Só hábitos saudáveis e Calma para a ansiedade. Dentro do app também aparece Manter o peso, que faz sentido depois da meta. Menores de 18 só veem hábitos e calma.
- **Hábitos e calma não falam de peso:** sem cartão de peso, sem Cardápio e sem selos de calorias. O Hami evolui com os hábitos e o movimento.
- **Calma:** cantinho no Início com o SOS (respirar → 5-4-3-2-1 → como você está → CVV 188 e SAMU 192 se ainda estiver mal), atalhos para respirar, 5-4-3-2-1 e dormir, e missões próprias (respirar, 5-4-3-2-1, meditar, anotar as preocupações, música calma, ar livre). O SOS também fica no topo do Bem-estar para todo mundo. Não é tratamento: o app sempre aponta para o CVV e para o SAMU.
- **Mudar de área:** pílula "Área: … · Mudar" no Início, nos Ajustes e em Nossa evolução. A pessoa escolhe se troca as missões do dia pelas da nova área ou só muda a área; as missões que ela criou nunca somem.

### Jogo (fase 1): motor único, servidor e economia

- **Um motor só** (`web/src/shared/game`) para o app e para o servidor: curva de níveis, XP por atividade, limites do dia, arenas, raridades, baús, proteção contra azar e repetidos. Os números ficam numa configuração que o administrador poderá editar.
- **Com conta, o servidor decide.** Cada ganho vai para o servidor com uma referência única; ele recalcula o valor com os dados dele, aplica os limites do dia, paga nível e arena, cobra compras pelo preço do catálogo e sorteia os baús. O saldo do servidor vale e o app só mostra. Sem internet, os pedidos ficam guardados e saem depois.
- **Sem conta**, o mesmo motor roda no aparelho (não há ranking nem troca com outras pessoas para trapacear).
- **Ninguém perdeu nível** com a curva nova: o XP antigo foi convertido mantendo nível e progresso. Desmarcar uma missão devolve o XP, mas nunca faz cair de nível.
- **Economia ajustada por simulação** de 4 perfis (`docs/ECONOMIA.md`): primeiras conquistas rápidas, última arena em cerca de 3,5 meses para quem usa quase todo dia e cerca de 2 meses para quem faz tudo todo dia. As sementes por missão continuam as de antes (3, 5 e 8).
- **Baús:** só com sementes ganhas no app; chances visíveis; para menores de 18, baú revelado (o item aparece antes da compra), por causa do ECA Digital.

### Jogo (fase 2): as 12 arenas

- **Cada arena tem cenário próprio** (casinha, jardim, vila, floresta, praia tropical, montanhas nevadas, cidade, fundo do mar, reino dos sonhos, castelo, estação espacial e ilha celestial), todos desenhados em SVG para o HamiCare, com clima animado (borboletas, folhas, neve, bolhas, estrelas) e coisas que reagem ao toque. O céu acompanha a hora do dia.
- **O Início mostra a arena onde o Hami mora.** Abrir uma arena nova não muda o Hami de lugar sozinho: a pessoa escolhe "Morar aqui agora" ou "Explorar depois". A casa antiga fica guardada com os móveis, e dá pra voltar quando quiser pelo Mapa das Arenas, de graça.
- **Mapa das Arenas** (Mundo › Arenas, ou o botão "Mapa" no Início): trilha das 12 arenas com a atual marcada, as abertas com selo e as próximas em silhueta com o nível e os prêmios. A aba de aventuras passou a se chamar "Passeios" para não confundir.
- **Arena nova é um momento:** tela de nível (número grande, prêmio, partículas) → o Hami brilha → a arena aparece → a casa nova com os presentes (sementes, baú grátis e os itens exclusivos). Tudo pode ser pulado e respeita "reduzir movimento".
- **A progressão nunca exige o Plus:** o Castelo e o Espaço sideral (passeios) deixaram de ser do Plus, e os passeios ligados a uma arena abrem até o nível dela.
