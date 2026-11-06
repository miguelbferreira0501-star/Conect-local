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

## Rodada 13 (jogo, fase 1: motor, servidor e economia)

- **Motor do jogo (`web/src/shared/game/game.test.ts`):** curva de níveis crescente; cada nível do 1 ao 12 abre uma arena; quem já usava o app continua no mesmo nível com a curva nova; missão leve 5 XP, normal 10, puxada 15; a mesma coisa nunca paga duas vezes; movimento tem teto (exercício demais não rende mais); a rotina do dia tem teto e só 12 missões contam; desmarcar devolve; valores vindos de fora têm limite. Baús: chances somam 100 em toda situação; a proteção suave sobe a chance de raro; nunca mais de 7 baús seguidos sem raro (5.000 aberturas); garantia de lendário; o sorteio segue as chances anunciadas (20.000 aberturas, erro menor que 1,5 ponto); prefere itens que a pessoa não tem e repetido vira fragmentos.
- **Economia (`web/src/shared/game/simulate.test.ts`):** metas de equilíbrio dos 4 perfis (novo, casual, frequente, muito ativo) conferidas a cada mudança de número. Relatório em `docs/ECONOMIA.md`.
- **App (`web/src/lib/economy.test.ts`, `load.test.ts`):** missão paga uma vez, desmarcar devolve, marcar de novo paga uma vez; teto de movimento; humor, diário e respirar uma vez por dia; subir de nível paga nível + arena + baú grátis; desmarcar não faz voltar de nível; abrir um progresso antigo mantém o nível.
- **Servidor (`server/test/game.test.ts`, 15 testes):** o servidor recalcula tudo (energia e categoria da biblioteca, sementes das conquistas, chaves de desafio do período atual); datas longe de hoje não valem; nível e arena só o servidor paga; importação do aparelho uma vez só e com teto; compras com preço do catálogo, sem sementes não compra, a mesma compra não cobra duas vezes, item do Plus exige Plus; baú cobra o preço, entrega o item e registra; baú grátis só com prêmio de arena guardado; proteção contra azar no servidor; menor de 18 vê o item antes e recebe exatamente ele; 5 pedidos ao mesmo tempo pagam a missão uma vez só; cada pessoa só vê a própria carteira (regras do banco).
- **Navegador com servidor local:** progresso antigo (nível 2) abre no nível 2; ao criar a conta, o servidor importa o mesmo saldo do aparelho; depois de 2 missões (e das conquistas que elas liberaram) a pessoa chega ao nível 4 e à arena 4, e o saldo do aparelho e do servidor fica igual (438 sementes, 535 XP), com o histórico no servidor.

## Rodada 14 (jogo, fase 2: as 12 arenas)

- **Arenas (`web/src/data/arenas.test.tsx`):** as 12 arenas têm cenário, casa pronta (parede, piso e móveis que existem) e itens exclusivos; itens de arena não estão à venda e têm desenho (roupas são desenhadas no próprio Hami); toda peça das casas prontas vem de presente ao abrir a arena; passeios nunca exigem o Plus e abrem até o nível da arena ligada; os 12 cenários e os 5 baús desenham de dia, de noite, no amanhecer e no entardecer sem números quebrados.
- **Casas por arena:** abrir uma arena dá os itens exclusivos e deixa a casa dela pronta, sem mudar o Hami de lugar; mudar de casa guarda a antiga com os móveis e dá pra voltar; o mesmo móvel não aparece em duas casas; não dá pra morar numa arena que ainda não abriu.
- **Servidor:** ao abrir a arena 2, os itens exclusivos entram no inventário com origem "arena".
- **Navegador (360 px e 320 px com fonte 35% maior):** Início com o cenário da arena onde o Hami mora e o botão "Mapa"; Mapa das Arenas com nível, barra de XP e a próxima arena; arenas abertas, a atual marcada ("Você está aqui"), as bloqueadas em silhueta com cadeado e o nível; ficha da arena com os prêmios desenhados; "Espiar a casa daqui" e "Morar aqui" (o Início troca de cenário). Subir do nível 5 para o 6: tela de nível com o número, o prêmio e partículas → "Ver o que abriu" → o Hami brilha → a arena aparece inteira com o Hami pulando → a casa nova com os presentes → "Morar aqui agora". "Pular" leva direto à casa. Nada passa da largura e sem erros de página.
- Achados e correções: tapetes cobriam o Hami dentro de casa (agora ficam sempre no chão); com fonte grande, as 5 abas do Mundo passavam da tela (agora quebram em duas linhas); o cenário cortava a casa da arena em telas altas (na revelação ele aparece inteiro).
- 98 testes do app e 49 do servidor passando.

## Rodada 15 (jogo, fase 3: baús, Oficina, coleções e carteira)

- **App (`web/src/lib/chests.test.ts`):** baú cobra o preço, entrega item novo com origem "Baú" e entra no histórico; sem sementes não abre nem cobra; baú grátis da arena abre sem cobrar e uma vez só; repetido vira fragmentos; a proteção contra azar garante raro no baú certo; as chances mostradas somam 100 em todos os baús. **Menores de 18:** o item aparece antes, não muda ao reabrir a loja e é exatamente ele que vem; depois vem uma oferta nova. **Oficina:** troca fragmentos pelo item que falta; sem fragmentos, item já tido ou exclusivo de arena não fabrica. **Álbum:** todas as peças das 10 coleções existem e saem em baú; o prêmio só paga com a coleção completa e uma vez. **Itens:** compra marca a origem e o selo "Novo" some depois de visto; com conta, os baús grátis vêm do servidor.
- **Servidor (`server/test/game.test.ts`, 17 testes):** Oficina cobra fragmentos, entrega o item com origem "oficina", não fabrica de novo nem item de arena ou inventado; coleção só paga com todas as peças no inventário do servidor, uma vez, e coleção inventada não paga.
- **Navegador sem conta (360 px e 320 px com fonte 35% maior):** Loja › Baús com sementes, fragmentos, proteção, baú grátis da arena e as chances abertas; abrir grátis (treme, abre, mostra o item com a cor da raridade); abrir o de Ouro pagando (sementes certas depois); Armário › Itens com filtros, selo "Novo" e ficha do item ("Vestir"); Álbum com as 10 coleções; Oficina fabricando um item (fragmentos certos depois); Carteira com o histórico. Menor de 18: a loja mostra o item de cada baú e vem exatamente ele. Nada passa da largura e sem erros de página.
- **Navegador com servidor local e conta:** baú grátis e baú pago abertos pelo servidor (registrados no banco), saldo e baús pendentes iguais no aparelho e no servidor; Oficina pelo servidor (item no inventário com origem "oficina", fragmentos iguais); Carteira mostra o histórico da conta.
- 111 testes do app e 51 do servidor passando.

## Rodada 16 (jogo, fase 4: temporada, visitas, ranking e editor do jogo)

- **Configuração (`web/src/shared/game/validate.test.ts`):** a configuração padrão passa na conferência; a conferência acha chances que não somam 100%, arenas fora de ordem, peça de coleção que não existe, degrau da temporada com mais de 28 dias, fabricar mais barato que um repetido rende e proteção contra azar fora de ordem.
- **Página de teste (`web/src/lib/social/artifact.test.ts`):** reação de visita só entre amigos e uma por dia; quem recebeu vê a visita; ranking só com você e amigos que aceitam aparecer; quem sai do ranking some para os outros e também não vê.
- **Servidor (`server/test/phase4.test.ts`, `admin-game.test.ts`):** a temporada usa os dias ativos contados pelo servidor, paga só degraus alcançados e uma vez, guarda o baú grátis do degrau e não aceita mês velho; reação de visita só entre amigos (403 para quem não é), reação inventada recusada, uma por dia, e o anfitrião vê quem passou; a arena de casa aparece no perfil; ranking com números do servidor (sem peso) e quem sai do ranking some e não vê; só admin edita o jogo, configuração com erro não salva (e diz o porquê), versão nova vale para o app de todo mundo e para os preços cobrados, e voltar para uma versão vira uma versão nova. 58 testes do servidor e 114 do app passando.
- **Navegador sem conta (360 px e 320 px com fonte 35% maior):** Missões com a trilha da temporada (já rolada até o próximo degrau); "Pegar" paga sementes e fragmentos dos degraus alcançados.
- **Navegador com servidor local e duas contas (390 px e 320 px com fonte maior):** Lia visita o Rui e vê a casa dele na arena de neve; deixa um abraço; a segunda reação no mesmo dia avisa que já deixou; "Ver dentro" mostra a casa. Rui vê "Lia deixou abraço · agora" e o ranking por constância e por missões. Lia como administradora: Jogo › Baús, chances do Prata somando 110% mostram o erro e travam o salvar; corrigido, a simulação dos 4 perfis aparece; salvar cria a versão e o app do Rui passa a ver o Baú de Prata por 250. Nada passa da largura e sem erros de página.
- Achados e correções: o painel de administração abria preso dentro da gaveta de Ajustes (o topo do Início aparecia por cima); agora abre na tela toda. As 5 categorias do ranking quebravam em duas linhas; viraram uma fileira que rola.

## Rodada 17 (progressão difícil e Plus à vista)

- **Simulação (`web/src/shared/game/simulate.test.ts`), metas novas:** pessoa nova chega ao nível 2 em 2 a 6 dias e não passa do nível 4 em 2 semanas; casual só chega ao nível 5 depois de 2 meses e não alcança a última arena em 1 ano; quem usa quase todo dia chega ao nível 5 em 18 a 45 dias e leva mais de 300 dias para a última arena; quem faz tudo todo dia leva mais de 5 meses.
- Testes do app e do servidor passaram a ler o XP da configuração (em vez de números fixos). 114 testes do app e 60 do servidor passando.
- **Navegador (390 px e 320 px com fonte 35% maior):** botão Plus no cenário do Início sem apertar a saudação; cartões do Plus no Início, em Missões, na Loja, no Armário e no Bem-estar; selo "Plus" nos itens da loja; tela de planos com a tabela e a escolha entre anual e mensal. Nada passa da largura e sem erros de página.

## Rodada 18 (lembretes ao longo do dia)

- **Planejador (`web/src/shared/reminders.test.ts`, 10 testes):** água nos horários do plano, uma vez cada e com o nome do Hami; horário perdido há mais de 2 horas não sai atrasado; silêncio da noite (mais cedo para menores); no máximo 5 por dia e 1 hora entre eles, com a conta zerando no dia seguinte; Hami com fome só depois do meio-dia e uma vez; missões só no horário e só se faltar alguma; pausa e hora de dormir só ligadas; desafios da semana na segunda; volta do passeio uma vez por passeio; hora local pelo fuso.
- **Servidor (`server/test/push.test.ts`):** preferências novas (plano de água inválido recusado); água às 10h05 e 13h10 de São Paulo, sem repetir e nada às 23h30; inscrição vencida é apagada; Hami com fome às 12h10 abre em Cuidar; pedido de amizade, visita com reação e vibe boa avisam quem recebe; com "Amigos" desligado ou sem lembretes ligados, nada chega. 62 testes do servidor e 124 do app passando.
- **Navegador (390 px e 320 px com fonte maior):** Ajustes › Lembretes com os 8 tipos, o plano de água, o horário das missões e a hora de dormir aparecendo ao ligar; escolhas salvas. Nada passa da largura e sem erros de página.

## Rodada 19 (Turma)

- **Servidor (`server/test/team.test.ts`):** só amigos (403 para quem não é), missão inventada e mais de 3 missões recusadas, no máximo 4 pessoas (409 "turma cheia"), uma turma por pessoa (409), quem não é amigo direto vê os Hamis da turma e quem está fora não vê nada; a missão só conta quando todos fazem; o prêmio só é pago com o dia completo e uma vez; aviso de dia completo para os outros e "falta só você" para quem falta; sair, tirar (só quem criou) e a turma acaba quando quem criou sai. 66 testes do servidor.
- **Página de teste (`web/src/lib/social/artifact.test.ts`):** os mesmos limites e o dia completo só com todos. 125 testes do app.
- **Navegador com servidor local e 3 contas (390 px e 320 px com fonte maior):** Lia cria a turma com Rui e Gil pelo app, marca "Fiz!"; Rui e Gil marcam; a tela mostra quem fez cada missão, "Todos fizeram!", o dia completo com o prêmio (e as sementes chegam no servidor), a ofensiva de 1 dia e o cartão da turma no Início de Lia e de Rui. Nada passa da largura e sem erros de página.
- Esse teste achou o problema do backup e da carteira que só ligavam ao abrir certas abas (corrigido).

## Rodada 20 (código de amigo)

- **Problema relatado:** "não achamos ninguém com esse código". Reproduzido no navegador: quem criava a conta pelos Ajustes ficava sem perfil (e sem código no servidor) até abrir a aba Amigos, e o código só era achado se fosse digitado exatamente com "HAMI-".
- **Correções:** o código é aceito do jeito que a pessoa digitar (sem "HAMI-", minúsculo, com espaço ou traço, O no lugar de 0, I/L no lugar de 1); o perfil é criado logo ao criar a conta ou entrar; mensagens claras para o próprio código, código de outro app (versão de teste), código curto e código não achado; "Seu código" com botão Convidar (link `#amigo=HAMI-…` que abre Amigos com o perfil já procurado, mesmo para quem ainda vai criar a conta); se o perfil não puder ser criado (nome recusado pelo filtro), a tela diz o motivo em vez de ficar carregando.
- **Servidor (`server/test/social.test.ts`):** busca sem "HAMI-", minúscula com espaços, "hami " + código e O no lugar de 0 acham a pessoa; código inexistente ou curto devolve ninguém. 66 testes do servidor.
- **App (`web/src/shared/friendCode.test.ts`, `artifact.test.ts`):** normalização do código e busca na página de teste (sem prefixo, minúscula, o próprio código não aparece). 127 testes do app.
- **Navegador com servidor local e 3 contas:** Bia cria a conta pelos Ajustes e já tem código; Ana acha Bia antes de Bia abrir Amigos; as 8 formas de digitar dão o resultado certo; Caio abre o link de convite sem conta, vê o aviso do convite, cria a conta e cai direto no perfil da Ana. Sem erros e sem rolagem para o lado.

## Rodada 21 (efeitos sonoros)

- **O que entrou:** 54 sons e 2 sons contínuos, todos criados na hora pelo próprio app (Web Audio), sem arquivos de áudio: funcionam sem internet e na página de teste. Toque em todos os botões, abas, chaves e janelas; banho completo (chuveiro enquanto o dedo está na tela, shampoo, espuma, bolhas estourando, toalha, Hami se sacudindo, secador que acelera e desacelera); comida (nhac ou gole), cafuné (notinhas, risada nas cócegas), escova, hora de nanar (abajur, coberta, canção, ronquinho, cortina, espreguiçar); bolinha e chuva de sementes (nota sobe com o combo, contagem final); missão feita/desfeita, sementes, compra, roupa nova, casa, foto; conquista, ofensiva, nível novo (fanfarra), arena e casa nova; baú (treme, abre com brilho conforme a raridade); respiração guiada com som bem baixinho que sobe e desce.
- **Ajustes > Sons:** liga e desliga, e volume baixo, médio ou alto. No iPhone os sons se misturam com a música e respeitam a chave do silencioso. Som de mudança de estado só toca logo depois de um toque da pessoa (nunca na sincronização).
- **Testes automáticos (`web/src/lib/sound.test.ts`):** cada som monta nós de áudio válidos (rampas nunca chegam a zero, tempos finitos); desligado, nenhum som contínuo começa; som certo para cada tipo de clique; som certo para cada mudança do app (missão, desfazer, compra, sementes, roupa, fim do começo). 131 testes do app.
- **Volume medido no navegador (OfflineAudioContext):** nenhum som estoura (pico máximo −8 dB no nível novo); sons de arrastar mais baixos que os de conquista. Esse teste achou um pulo de volume ao soltar o chuveiro e o secador em alguns navegadores (corrigido: o som some a partir do volume atual) e sons baixos demais (espuma, toalha, ronquinho; aumentados).
- **Navegador com o app:** banho inteiro, comida, bolinha (5 jogadas), escova, nanar, baú, missão feita e desfeita, Ajustes e as comemorações, registrando cada som; com o som desligado nada toca. Sem erros de página.

## Rodada 22 (casas decoradas, roupas novas e crescimento)

- **Casas:** cômodo novo em todas as telas (parede com padrão, lambri, rodapé e moldura; chão em perspectiva de verdade; janela com cortina e céu da hora do dia; sombra dos móveis no chão; luz e noite sem acinzentar). Kit novo com 37 móveis desenhados com detalhe (cama, criado-mudo, guarda-roupa, cômoda, penteadeira, espelho, sofá, poltrona, estante, TV, mesa com cadeiras, geladeira, fogão, torre de brincar, casinha, rodinha, túnel, relógio cuco, prateleira, quadros, plantas, tapetes, ursinho, cesto, baú, pufe…), em várias cores: 100 móveis e 77 decorações na loja. As 12 casas de arena (e a casinha inicial) já vêm decoradas no tema; casas que ainda estavam do jeito que vieram ganham a decoração nova e os móveis entram no inventário; casas arrumadas pela pessoa ficam como estão. 3 estilos prontos novos.
- **Roupas:** 14 fantasias de corpo inteiro com capuz e orelhinhas (coelho, urso, gato, sapo, dinossauro, pintinho, pinguim, unicórnio), 6 vestidos de festa (babados e estrelinhas), 4 colares com pingente e 8 coisinhas de segurar na patinha (suco, microfone, cestinha de morangos, pirulito, balão, varinha, girassol, chaveiro).
- **Crescimento:** o Hami nasce com metade do tamanho e cresce um pouquinho a cada dia de cuidado (missão feita ou cuidado com ele, não precisa ser seguido), em 8 fases, até o tamanho máximo com 300 dias de cuidado. Filhote tem olhos maiores e orelhinhas menores. Comemoração a cada fase nova; selinho no Início e cartão "Crescimento" em Nossa evolução. As áreas de toque dos cuidados acompanham o tamanho.
- **Testes automáticos:** crescimento (tamanho, fases, nunca diminui, conta dias com missão ou cuidado), reforma das casas (casa padrão atualiza, casa arrumada não muda), peças das casas existem e são exclusivas da arena ou da loja. 136 testes do app e 66 do servidor.
- **Navegador:** as 12 casas, o kit inteiro e todas as roupas novas renderizados e conferidos; Início, Mundo > Casa, Loja e Nossa evolução no app; banho, comida, bolinha, escova e nanar completos com o Hami filhote, sem erros.

## Rodada 23 (humor com barrinha)

- **Bem-estar > Como você está agora?:** no lugar dos 5 botões, uma barrinha para arrastar. A carinha muda aos pouquinhos enquanto o dedo anda (cor de roxo a amarelo, boca de triste a sorriso, sobrancelhas preocupadas, lágrima, bochechas coradas, olhinhos felizes), com uma notinha a cada mudança de humor. Salva ao soltar (ou com as setas do teclado); o valor guardado continua de 1 a 5, então o gráfico e o histórico não mudam.
- **Testes:** conversão da barrinha para 1–5 e cores (`web/src/components/MoodSlider.test.ts`), 138 testes do app. No navegador: arrastar de ponta a ponta (5 carinhas conferidas), salvar 5 ao soltar na direita e 1 com a tecla Home, sem rolagem para o lado e sem erros.

## Rodada 24 (coleção do Plus)

- **Itens novos só do Plus (68):** 11 fantasias (raposinha, panda, leãozinho, dragãozinho em 3 cores, tubarão, vaquinha, moranguinho, abacate, renazinha), 7 roupas especiais (manto de mago, sereia, pijama de nuvenzinhas, vestido arco-íris), 8 chapéus (mago, coroa de flores e estrelas, cogumelo, touca de morango, tiara de borboleta), 5 coisinhas de segurar (guarda-chuva, coelhinho de pelúcia, chá de bolinhas, sorvete, livro de feitiços) e 37 móveis/decorações (cama com dossel e luzinhas, castelinho do hamster, balanço, escorregador, poltrona ovo, cabaninha, sofá nuvem, mesa do chá, piano de cauda, aquário, neons, varal de luzinhas, estante casinha, arco de flores, tapetes nuvem e arco-íris, pufe gatinho). 2 estilos de casa completos só do Plus. Agora são 99 itens à venda só do Plus.
- **Vender sem ser chato (nenhum pop-up novo):** vitrine "Prove no Hami, é de graça" na loja (8 peças que mudam todo dia); provar qualquer roupa do Plus no próprio Hami e ver qualquer móvel, parede ou piso dentro da própria casa antes de decidir; aba "Só do Plus" na loja; o cartão do Plus avisa quando itens da lista de desejos são do Plus; texto carinhoso no provador com "Experimentar o Plus 7 dias grátis"; fileira de fantasias com a pelagem do próprio Hami na tela do Plus. Para menores de 13 anos, a vitrine e a aba do Plus não aparecem.
- **Testes:** 138 testes do app; todas as peças novas renderizadas e conferidas; no navegador, vitrine, provador, "Na sua casa", aba "Só do Plus" (99 itens) e tela do Plus, sem erros e sem rolagem para o lado.

## Rodada 25 (tela do Plus e preços)

- **Preços:** mensal R$ 49,90; anual R$ 329,90 (R$ 27,49/mês, riscado R$ 598,80 = 12 × o mensal, economize 45%). Teste grátis de 7 dias no anual e 3 dias no mensal (o servidor confere: migração `009_trial_plan.sql`), uma vez por conta, sem cartão e sem virar assinatura sozinho.
- **Tela em duas etapas:** "Com o Plus, cuidar de você fica ainda mais gostoso!", três benefícios (deixar o Hami do seu jeito, mimos novos todo dia, apoiar a missão), "Testar por R$ 0,00" e "Agora não"; depois "Escolha seu plano e comece o teste grátis", 12 meses com "Melhor oferta", mensal, "O essencial é sempre grátis · Sem anúncios", "Comparar Grátis e Plus" e "Começar meus 7 (ou 3) dias grátis".
- **Testes:** servidor (7 dias no anual, 3 no mensal; teste só uma vez), 67 testes; app 138 testes; no navegador, as duas etapas, troca de plano muda o botão e o teste libera o Plus por 7 dias, sem erros e sem rolagem para o lado.

## Rodada 26 (app do iPhone)

- **Projeto iOS (Capacitor 8, Swift Package Manager)** em `web/ios`: pacote `com.hamicare.app`, só iPhone e só em pé, ícone e tela de abertura gerados do logo, textos de permissão da câmera e das fotos em português, sem criptografia própria (`ITSAppUsesNonExemptEncryption = NO`). `codemagic.yaml` na raiz compila no Mac da nuvem e manda para o TestFlight.
- **App da loja conversando com o servidor:** os pedidos saem pelo lado nativo (CapacitorHttp e cookies nativos), para `hamicare.onrender.com`; o servidor aceita a origem do app (`capacitor://localhost`) e continua bloqueando outros sites. Links de convite usam o endereço do site. Texto de assinatura sem Pix no iPhone ("pela App Store").
- **Lembretes no iPhone:** notificações agendadas no próprio celular para os próximos 4 dias (água, missões no horário escolhido, hora de dormir, pausa, Hami depois do almoço, desafios de segunda), no máximo 5 por dia, 1 hora entre elas, fora do silêncio da noite (mais cedo para menores), reagendadas quando o app abre ou algo muda.
- **Testes:** servidor 69 (origem do app aceita, outros sites bloqueados, pré-pedido de CORS só para o app); app 142 (planejamento do dia e das notificações). Capturas da App Store (1320 × 2868) geradas no navegador sem erros. A compilação do iPhone em si só roda no Mac (Codemagic): primeira compilação fica para quando a conta da Apple existir.

## Rodada 27 (lojinhas com o Hami vendedor, pets companheiros e arenas interativas)

- **Toque dos botões mais seco:** um "tec" curtinho (estalo + batidinha grave, uns 30 ms), sem eco e sem nota que escorrega; as abas têm a mesma ideia um pouco mais grave.
- **Lojinhas:** a Loja virou cinco lojinhas (Vendinha, Roupas, Casa, Comida e Baús), cada uma com fachada desenhada (toldo, parede, prateleiras, balcão) e o próprio Hami de vendedor atrás do balcão, com a pelagem da pessoa: avental listrado e sacolinha na Vendinha, boina, avental de costura com fita métrica e tesoura no Ateliê, capacete de obra, colete e martelinho na Marcenaria, chapéu de chef, dólmã e frigideira na Cozinha, chapéu de pirata, casaco de capitão e mapa no Porto dos Baús. Tocar no Hami faz ele pular, fazer barulhinho e falar outra coisa (frases leves, sem empurrar compra). Cada lojinha mostra só as categorias dela; o Ateliê tem os looks prontos. As roupas de trabalho estão à venda (12 peças) e viraram 4 looks novos (Construtor, Mestre-cuca, Estilista, Capitão).
- **Pets companheiros:** cada arena aberta traz um ovo misterioso (12 pets: passarinho, joaninha, gatinho, ouriço, tartaruguinha, pinguim, cachorrinho, polvinho, ovelhinha de nuvem, dragãozinho, robozinho e unicórnio alado). O ovo vai trincando e choca depois de 3 dias com missão ou cuidado (contados desde que ele chegou); três toquinhos no ovo e o pet nasce. O pet escolhido anda do lado do Hami no Início, na Casa e nas arenas, no mesmo chão e do tamanho certo para o Hami filhote; tocar nele faz ele pular e fazer o barulhinho dele. Cartão no Mapa das Arenas, coleção com ovos, prontos e pets; a tela de arena nova avisa do ovo. Tudo grátis, sem Plus.
- **Arenas mais vivas:** cada toque reage do seu jeito, com som e partículas (árvore solta folhas, flor solta pétalas, água faz bolhas, cristal e estrela brilham, cogumelo e bola quicam, foguete decola, sino toca notinhas). Tocar na casa de uma arena faz o pet daquela arena espiar do lado ("Oi! Sou Piu") ou o ovo dele aparecer. Detalhes novos em todas as 12: cerquinha, caixa de correio e caminho de pedras, abelhas e regador, bandeirinhas e gatinho dormindo no café, sapinho e vitórias-régias no lago, castelinho de areia, caranguejo e conchas, pinheirinhos com luzes e pegadas na neve, pombinhos, hidrante e semáforo, águas-vivas, balões de coração e balinhas, estandartes do castelo, crateras e disco voador, sino dourado no céu; luz suave do sol e sombra no chão para dar profundidade.
- **Testes:** ovos e choco (`web/src/data/companions.test.ts`), todas as peças novas desenhadas no Hami; 146 testes do app e 69 do servidor. No navegador: as cinco lojinhas (390 e 320 px, perfil adulto e de criança, sem Plus para menores de 13), toque no vendedor, ovo pronto → três toques → pet nasce → leva junto → aparece no Início, as 12 arenas de dia e de noite, toques com som e o pet espiando da casa, sem erros e sem rolagem para o lado.

## Rodada 28 (telas mais limpas: loja em tela própria, Bem-estar em blocos, mapa dos passeios e Início novo)

- **Loja como um cantinho próprio (como no vídeo de referência):** a aba Loja mostra portas grandes e coloridas (Vendinha, Ateliê, Marcenaria, Cozinha, Porto dos Baús, cada uma com o Hami fantasiado). Tocar abre a loja em tela cheia: o Hami vendedor no alto (placa redonda com o ícone da loja, fala ao tocar nele), fundo marrom, faixa "Virar Plus", prateleiras em quadradinhos coloridos só com o desenho e o preço (sem nome; o nome aparece ao tocar, no provador, com comprar, presentear e desejos), selinho de coroa no que é do Plus, coração no que está nos desejos e quantidade nas comidinhas, e abas da loja embaixo (Vendinha, Roupas, Casa, Comida, Baús). A Vendinha tem 6 peças na coleção do dia. Para menores de 13 anos, nada do Plus aparece (nem faixa, nem itens, nem looks).
- **Bem-estar em blocos coloridos:** fundo rosa-lilás, 12 blocos grandes (Como você está?, Diário, SOS ansiedade, Respirar, Foco, Para dormir, Pote de coisas boas, Meditação, Afirmações, Relaxar, 5-4-3-2-1, Quizzes) e o Hami grandinho no morro embaixo: tocar nele faz ele pular, soltar coraçõezinhos e falar algo gentil. Humor e diário abrem em tela própria. "Precisa de ajuda agora? CVV 188" continua na página.
- **Passeios em mapa ilustrado:** cada lugar virou uma ilhinha desenhada (casa, jardim, parque, praia, floresta, cafeteria, montanhas, cidade, castelo, vila de inverno e espaço) ligadas por uma trilha, com rio, pontes, lagos, árvores, balões e nuvens. Lugares fechados ficam acinzentados com cadeado (ou estrelinha do Plus); os abertos mostram quantos achadinhos já vieram. O marcador redondo com o rosto do Hami mostra onde ele está (em casa ou no passeio). O álbum de achadinhos abre por um botão no mapa.
- **Início:** cenário novo e bem detalhado na casinha inicial (casinha com chaminé e fumaça, floreiras, lampião, árvore grande com balanço e maçãs, cerquinha com portão, caminho de pedras, caixa de correio, poste, hortinha, laguinho com patinho, moinho ao longe, passarinhos, arbustos com frutinhas); cada coisa reage ao toque. Menos informação: três selinhos (tamanho do Hami, dias seguidos e área) no lugar de vários cartões, missões logo em seguida e o resto (cardápio, jornada, turma) depois delas.
- **Hami proporcional:** o corpo não fica mais achatado quando ele está mais fofinho (cresce um pouco para cima também, não só para os lados).
- **Testes:** 146 testes do app. No navegador: portas da loja, as cinco lojas em tela cheia, provador com o nome, voltar; Bem-estar com toque no Hami e o bloco de humor; mapa dos passeios com marcador do Hami e uma ilha aberta; Início com Hami fofinho e normal; perfil de criança em 320 px; pets e arenas da rodada anterior; sem erros e sem rolagem para o lado.
