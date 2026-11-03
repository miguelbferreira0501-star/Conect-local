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
