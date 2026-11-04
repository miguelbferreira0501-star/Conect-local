# HamiCare: o que foi testado

03/11/2026. Tudo roda de novo com `npm test` em `web/` e em `server/`.

## Lógica do app (web, 29 testes, vitest)

| Área | O que é verificado |
|---|---|
| Peso virtual | Menores nunca mudam; sem sincronização o Hami anda até a faixa 120–150 g no máximo 3 g/semana e só com dias ativos; dentro da faixa mantém; sincronizado acompanha a variação proporcional da pessoa (−10% → alvo 148,5 g) devagar; limites do desenho; pesagens atrasadas uma por semana |
| Condicionamento e fases | 10 dias com movimento valem mais que 10 treinos num dia só; limites das fases |
| Metas | Menores sem meta; prazo mínimo de 4 semanas; no máximo 1% por semana; nunca abaixo de IMC 18,5; aviso de mudança rápida |
| Ofensiva | Hoje sem atividade não quebra; até 2 descansos por semana protegem; o 3º quebra; recorde |
| Níveis e desafios | Curva de XP; 3 diários, 2 semanais, 1 mensal, fixos no período; progresso semanal |
| Filtro de gentileza | Elogios passam; ofensas (inclusive "IDIOTAAAA", "1d10t4", "i d i o t a"), corpo, desânimo, contato e links são bloqueados |
| Social na página de teste | Duas pessoas: código, pedido, aceite, post, reação, comentário gentil passa e ofensivo não, quem postou esconde comentário, presente aberto uma vez, desafio em grupo com convite, bloqueio some com tudo, perfil fechado recusa pedido |

## Servidor (20 testes, vitest + PostgreSQL 16 real)

| Área | O que é verificado |
|---|---|
| Conta | Cadastro, entrada, saída, senha errada, e-mail repetido, autorização do responsável para até 12 anos, bloqueio sem cabeçalho anti-CSRF, exclusão de conta com senha |
| Backup | Salva e recupera o estado; recusa formato errado; exige login |
| Plus | Teste grátis uma vez por conta |
| Amigos e feed | Feed só para amigos; estranho não comenta nem reage; filtro de gentileza em comentários e posts; reações só positivas; quem postou esconde comentário; duas denúncias ocultam o post |
| Menores | 13–17: só elogios prontos e sem foto real; até 12: sem social |
| Bloqueio e privacidade | Corta amizade, feed, pedidos e busca por código; perfil fechado recebe "fechado" |
| Presentes e desafios | Só para amigos, abertos uma vez; desafios visíveis para amigos do criador, entrar e marcar o dia |
| Admin | Só admin acessa; estatísticas; Plus; denúncia removida some do feed; suspensão derruba a sessão e impede login; eventos com resgate único |
| RLS direto no banco | Backup de outra pessoa invisível; ninguém se dá Plus nem vira admin; amizade não pode ser inserida direto; posts de não-amigos invisíveis; ninguém posta em nome de outro |
| Push | Um lembrete por dia, só depois do horário no fuso da pessoa; mensagem pelo estado (Hami com fome → lembrete do Hami); inscrição expirada é removida |
| Deploy | Comando de deploy cria o papel da API num banco novo e aplica as migrações |

## Ponta a ponta (Playwright, celular 390×844)

- **Sem servidor (página de teste)**: primeiro acesso inteiro (15 passos, com peso e consentimento), Plus, concluir atividade, compartilhar, casa, decorar, mapa, loja e presente do dia, bem-estar, amigos, banho, Nossa evolução, tema escuro. Sem erros de página e sem rolagem lateral.
- **Com servidor**: Ana e Bia criam conta pela tela de Ajustes, Bia adiciona Ana pelo código, Ana aceita e posta mostrando a casa, Bia reage e tenta comentar "que idiota" (aviso na hora e bloqueio no envio), depois comenta "Que orgulho de você!"; Ana vê só o comentário gentil. Num aparelho novo, a conta da Ana recupera o Hami e o diário da nuvem.
- **Página publicada**: regras de acesso conferidas no armazenamento compartilhado (perfis legíveis por quem tem acesso; ninguém escreve no perfil de outra pessoa; ninguém escreve denúncia no espaço de outra pessoa).

## Não testado aqui

Cobrança real, push num celular de verdade (precisa do app publicado em HTTPS) e uso por várias pessoas na página publicada (precisa compartilhar o link como Contribuidor).


## Rodada 3 (jornada de calorias, cuidados, visual e grupos)

- **App:** 40 testes (`cd web && npm test`). Novos: calorias por MET e por peso, trocas e lanches por jornada, teto diário, Hami chegando à meta junto com a pessoa, ganhar/manter, balança, metas seguras; perfil e grupos na página publicada (amigos de quem criou, mural separado, sair e apagar, nome ofensivo recusado).
- **Servidor:** 25 testes (`cd server && npm test`). Novos: bio com filtro de gentileza, contadores no perfil, perfil invisível para estranhos, grupo só com amigos, mural só para membros, post de grupo fora do feed geral, só o dono adiciona, dono saindo apaga, bloqueio esconde posts no grupo.
- **Navegador (Playwright, 390 px):** onboarding novo (idade → missão → peso e meta → prévia da jornada), concluir missão no Início (número de calorias voando, Hami 165 → 164,9 g, tela de ofensiva), cafuné, lanchinho, banho nas 6 etapas, Chuva de sementes, Busca a bolinha, escovar, nanar, Missões com temporada, sugestões da jornada, Evolução, álbum, loja e modo escuro. Sem erros de página e sem rolagem lateral.
- **Três pessoas com servidor real:** pedidos por código, bio, post, toque duplo para curtir, comentário ofensivo bloqueado, perfil da amiga com bio e grade, grupo criado com duas amigas, post no mural visto por quem não é amigo da autora, post do grupo fora do feed geral, estado antigo migrado para a jornada nova.

## Rodada 4 (cor única por tela e celular)

- **Começo duplicado:** 5 perguntas e a tela de peso antiga apareciam duas vezes. Removido, e a varredura agora acusa qualquer fala repetida em cada passo do começo.
- **Rolagem para o lado:** varredura automática em todas as telas (começo, Início, cuidados, Evolução, Ajustes, Missões, sugestões, Mundo, Bem-estar, Amigos) em 390, 360 e 320 px, também com texto 35% maior (como a fonte grande do Android). Corrigidos: gaveta de Ajustes (nomes das cores), passos do banho, prévia da jornada (grades de uma coluna agora nunca passam da tela) e o número de calorias perto da borda. Gavetas e telas cheias não rolam mais para o lado.
- 40 testes do app passando; servidor sem mudanças nesta rodada.

## Rodada 5 (aba Cuidar)

- Cuidados saíram do Início para a aba **Cuidar** (6 abas). O Início ficou com o Hami, a jornada de peso e as missões.
- Varredura de largura refeita com os cuidados na aba nova: nada passa da tela em 390, 360 e 320 px, também com fonte 35% maior. Os 6 nomes das abas cabem inteiros nas três larguras.

## Rodada 6 (guarda-roupa e bem-estar)

- **Catálogo:** 312 itens. Teste novo (`web/src/data/items.test.tsx`) desenha o Hami com cada uma das 195 peças de vestir e confere que todas aparecem, que variações de cor mudam o desenho, que os ids são únicos e que os 12 looks têm peças existentes, uma por lugar.
- **Prova visual:** folha com as 195 peças conferida peça a peça; prints da loja de looks, do provador e do Armário.
- **Bem-estar:** prints das 9 ferramentas em uso (inspirar, soltar, 5-4-3-2-1, meditação, foco, relaxar, dormir, pote, quiz), sem erros de página.
- **Largura:** varredura em 360 e 320 px com fonte 35% maior, agora incluindo as 9 ferramentas, a loja e o Armário: nada passa da tela.
- 45 testes do app e 25 do servidor passando (o servidor aceita o espaço novo de efeito no perfil público).

## Rodada 7 (cardápio de hoje)

- Testes novos de lógica (`web/src/logic/meals.test.ts`): totais planejado e comido, calorias de 0 a 3.000 por item, referência diária segura (1.200 a 5.000) e aviso de cardápio pequeno demais.
- Navegador em 390, 360 e 320 px (as duas últimas com fonte 35% maior): montar café e almoço pelas sugestões, criar um alimento próprio, editar as calorias, salvar a referência, marcar o que comeu, recarregar e conferir que tudo ficou salvo. Nada passa da largura e sem erros de página.
- 49 testes do app passando.

## Rodada 8 (missões só com hábitos)

- Teste novo: nenhuma missão da biblioteca é comida. Teste novo da jornada de ganhar peso pelo Cardápio (comido acima da referência, teto de 700, sem referência não conta, para emagrecer o Cardápio não conta).
- Navegador: lista antiga com "Comer uma fruta" e "Trocar o refrigerante" é limpa ao abrir (água e caminhada ficam); biblioteca sem nenhum alimento; plano inicial de emagrecer só com hábitos; jornada de ganhar peso: comer 2.300 kcal com referência de 2.000 fez o Hami ir de 115 g para 115,3 g e o card mostrar +300 kcal.
- 51 testes do app passando.

## Rodada 9 (mais missões por dia)

- O plano monta 8 hábitos (antes 5 a 6). Quem já usava o app e ficou com poucas missões (ex.: ganhar peso, depois que as de comida saíram) ganha hábitos do plano até ter 7, uma vez só: se depois apagar, não voltam.
- Teste novo de abertura com dados antigos (`web/src/lib/load.test.ts`): o progresso fica intacto (moedas, nome, começo feito), as missões de comida saem e a lista chega a 7. Esse teste pegou um erro de ordem no código que faria o app abrir como novo; corrigido, e o carregamento agora nunca descarta dados salvos se algo falhar.
- Navegador: lista com 2 hábitos virou 7; plano inicial de emagrecer com 8. 54 testes do app passando.

## Rodada 10 (preparação para publicar)

- **Esqueci minha senha (servidor, `server/test/reset.test.ts`):** o link chega por e-mail, troca a senha uma vez só, derruba as sessões antigas e já entra na conta; a senha antiga para de funcionar; link vencido, inventado ou malformado não troca nada; e-mail que não existe recebe a mesma resposta e nenhum e-mail sai; no máximo 3 pedidos por hora por conta; a API não consegue ler a tabela de pedidos (só pelas funções do banco).
- **Consentimento:** o cadastro grava a versão dos termos aceita e o consentimento destacado para dados de saúde; sem esse consentimento, a conta não é criada. `/privacidade` e `/termos` respondem como páginas.
- **Navegador (servidor local + app compilado, 390 px):** criar conta só libera com as duas caixas marcadas; os termos abrem dentro do app; sair, pedir o link, abrir o link do e-mail (o código some da barra de endereço), senhas diferentes avisam, salvar entra na conta; o mesmo link de novo mostra "Esse link não vale mais", inclusive colado com o app já aberto. A página `/privacidade` cabe em 390 px.
- Esse teste achou um incômodo antigo: ao entrar na conta no mesmo aparelho, o app perguntava "Qual progresso manter?" mesmo sendo o mesmo Hami (a energia dele muda com o tempo). Agora, se é o mesmo Hami, fica a versão mais nova sem perguntar.
- 31 testes do servidor e 54 do app passando.
- **E-mail sem domínio (`server/test/mail.test.ts`):** envio pelo Gmail contra um servidor de e-mail local (login com a senha de app, remetente "HamiCare <seu Gmail>", link no corpo) e envio pelo Brevo (endereço da API, chave, remetente e destinatário certos; erro do Brevo vira registro e não derruba nada). 34 testes do servidor passando.

## Rodada 11 (ilustrações próprias e foto real)

- **Ilustrações no lugar dos emojis (`web/src/components/art/art.test.tsx`):** todo emoji que o app mostra (missões, bem-estar, móveis e decoração, brinquedos, comidas do Cardápio e do Hami, lugares e achados do Mundo, conquistas, reações, temporadas, humor) tem desenho próprio; cada desenho vira um SVG válido; se algum faltar, o emoji aparece no lugar (nada some).
- **Navegador (390 px):** Início, Missões, Bem-estar (ferramentas e rotina de dormir), Cuidar (casa com sofá, TV, aquário, relógio e planta desenhados), lanchinho do Hami, loja (móveis e decoração), biblioteca de missões e Cardápio. Nada passa da largura e sem erros de página.
- **Foto real (servidor local + Chromium com câmera de teste):** criar conta pela aba Amigos (a tela agora atualiza sozinha depois de entrar; antes ficava pedindo para entrar), abrir "Compartilhar", tocar em "Foto real", ver a câmera em tela cheia, tirar a foto, "Usar esta foto", publicar: o post aparece no feed com a foto e a câmera é desligada ao sair.
- Achado: dentro da página de teste no app do Claude, o celular não abre câmera nem galeria (o próprio visualizador bloqueia). Agora o app explica isso e oferece a galeria, em vez de não fazer nada.
- 57 testes do app passando.

## Rodada 12 (áreas e calma para a ansiedade)

- **Lógica (`web/src/logic/areas.test.ts`, `web/src/lib/plan.test.ts`):** cada objetivo cai numa área (os antigos viram hábitos); menores de 18 nunca entram em área de peso, nem trocando pelo app; no começo aparecem perder, ganhar, hábitos e calma, e no app também manter; os planos de hábitos (cama, dentes, caminhada…) e de calma (respirar, 5-4-3-2-1, sono…) têm 8 missões da biblioteca; trocar de hábitos para perder peso liga o peso e as calorias e mantém as missões criadas pela pessoa; "só mudar a área" não mexe nas missões.
- **Navegador (390 px e 320 px com fonte 35% maior):** começo escolhendo "Calma para a ansiedade": Início com o cantinho da calma, sem Cardápio e sem calorias, missões da calma; SOS completo (respirar → 5-4-3-2-1 → "Ainda ansioso" mostra CVV 188 e SAMU 192) e as missões "Respirar" e "5-4-3-2-1" ficam feitas sozinhas; "Mudar" no Início → "Perder peso" → "Sim, trocar as missões": volta o cartão de peso, o Cardápio e os selos de calorias. Começo em "Só hábitos saudáveis": cartão de hábitos, sem Cardápio, sem calorias, missões de cama, dentes, caminhada. Nada passa da largura e sem erros.
- 64 testes do app passando.
