# Brief: "Quarteirão" (nome provisório)

## A ideia
Um jogo de exercício em que a cidade vira um tabuleiro. Ele junta quatro mecânicas que já funcionam em outros apps e acrescenta uma quinta para ganhar dinheiro:

1. **Território por GPS, mas em equipe** (como o INTVL, mas por time): cada caminhada, corrida, pedal ou passeio com o cachorro pinta as ruas da cor da sua equipe (escola, academia, assessoria de corrida, empresa, turma de amigos ou bairro). A temporada é semanal e reinicia toda segunda, para quem chegou agora ter chance.
2. **Ofensiva que protege o mapa** (como o Duolingo): se você não fizer o mínimo do dia (10 minutos de movimento), o território da sua equipe começa a desbotar. Faltar no treino tira cor do mapa do time, e não só do seu número.
3. **Ligas semanais na cidade** (bronze, prata, ouro, diamante), com subida e descida.
4. **Missões em lugares reais:** "passe pela praça X", "termine na padaria Y".
5. **Pontos patrocinados (como faziam os PokéStops patrocinados do Pokémon Go):** um comércio local (padaria, açaí, loja de suplemento, pet shop, academia) paga para ser um ponto do jogo. Quem passa ali ganha um bônus no jogo e um cupom na loja. O comércio paga por visita confirmada ou uma mensalidade.

Modos: caminhada, corrida, bike e passeio com cachorro (com um elo possível com o app de pet shop que o fundador já tem).

## Como ganha dinheiro (hipóteses)
- **Principal:** comércios locais pagando por visita confirmada (ex.: R$ 0,50 a 2,00 por visita) ou R$ 99 a 199 por mês para ser um "ponto". O Pokémon Go cobrava menos de US$ 0,50 por visitante único diário em locais patrocinados (McDonald's no Japão, Starbucks nos EUA); o fundador da Niantic chamou isso de "modelo de negócio melhor para jogos" do que compras dentro do app (TechCrunch, 31/05/2017; PYMNTS).
- **Secundário:** equipes pagas para academias e assessorias de corrida (R$ 49 a 99/mês: painel da equipe, desafios próprios) e um plano premium para o usuário (R$ 9,90/mês: estatísticas, cores, "escudo" que protege o território por um dia).
- **Não fazer:** apostas com dinheiro real (estilo StepBet/WayBetter) por causa da regulação de apostas e promoções no Brasil (Lei 14.790/2023, Lei 5.768/1971).

## Evidência e concorrência (com fonte)
- Apps de território por GPS já são muitos: INTVL (diz ter 2,5 milhões de downloads em 182 países, segundo um comunicado de jul/2026 citado por terceiros; a AppGoblin estima receita abaixo de US$ 10 mil/mês e de 23 a 68 mil usuários ativos por mês), Korra, Stride/Terrarun (invasões e ligas no plano Pro), Domirun (clãs, ranking de bairro), Plotta, KYRO, Runner Territory, Territory Run, Turf e Turf Warz (território com cachorro).
- Retenção em apps de fitness: depois de 30 dias, só 5 a 12% dos usuários seguem usando (benchmarks de terceiros, que divergem).
- StepBet/WayBetter (apostar na própria meta) têm um modelo pago comprovado nos EUA. A receita estimada por terceiros do WayBetter é de US$ 25 mil/mês. Não operam no Brasil.
- Pesquisa acadêmica brasileira (SBGames 2019): ranking semanal entre tutores de cães aumentou a motivação para passear.
- Não foi encontrado nenhum app que junte território em equipe + ofensiva + pontos patrocinados no comércio local no Brasil.

## Limites técnicos
- Rastrear o GPS com a tela apagada exige um app nativo (iOS/Android). Um web app não faz isso de forma confiável. Por isso o fundador precisaria aprender React Native/Expo e passar pelas lojas.
- É preciso um anti-trapaça (velocidade de carro, GPS falso).
- Privacidade e segurança: nunca mostrar a posição ao vivo, criar uma "zona privada" ao redor de casa e atrasar a publicação da rota. Muitos usuários serão adolescentes, o que traz ECA Digital (vigente desde 17/03/2026) e LGPD.

## O fundador
Veja ../../contexto-fundador.md. O fundador sabe vender para o comércio local porta a porta (já fez isso com pet shops).

## O que não se sabe
- Se comércios pagam por visita vinda de um app desconhecido.
- Se há gente suficiente jogando na mesma cidade para o mapa ficar vivo (o problema do "mapa vazio").
- A retenção depois de 30 dias.
