# Economia do jogo

Números de níveis, XP, sementes e baús do HamiCare, ajustados por simulação.
Os valores ficam em `web/src/shared/game/config.ts` (o painel de administração poderá gravar outra versão),
e as metas de equilíbrio são conferidas pelo teste `web/src/shared/game/simulate.test.ts`.

## Como se ganha

| O quê | XP | Sementes | Limite |
|---|---:|---:|---|
| Missão leve (ex.: beber água, arrumar a cama) | 5 | 3 | conta no teto do dia |
| Missão normal | 10 | 5 | conta no teto do dia |
| Missão puxada | 15 | 8 | conta no teto do dia |
| Caminhar | 15 | 5 | movimento tem teto de 45 XP por dia |
| Alongar, yoga, mobilidade, meditar, 5-4-3-2-1 | 10 | 3 a 5 | |
| Escrever no diário | 10 | 3 | 1 por dia |
| Registrar o humor, guardar algo no pote, momento de bem-estar | 5 | 1 a 2 | 1 por dia cada |
| Cuidar do Hami (cada cuidado diferente) | 2 | 1 | |
| Desafio diário | 20 | 5 | 3 por dia |
| Desafio semanal | 50 | 30 | 2 por semana |
| Desafio do mês | 100 | 100 | 1 por mês |
| Conquista | 100 | a da conquista (até 500) | 1 vez cada |
| Subir de nível | | 10 + 5 × nível | |
| Abrir arena nova | | 40 a 250 + baú grátis | |

**Teto da rotina:** 100 XP e 45 sementes por dia (missões, cuidados, diário, humor, pote e bem-estar). Só 12 missões contam por dia.
Movimento tem teto próprio de 45 XP: treinar mais do que isso não rende mais, para o app não incentivar exagero.
Descansar nunca tira XP, nível, arena nem conquista.

## Níveis e arenas

Cada nível do 1 ao 12 abre uma arena. Depois do 12, os níveis continuam (10% mais longos a cada um) e pagam sementes.

| Nível | XP para o próximo | XP total para chegar | Arena |
|---:|---:|---:|---|
| 1 | 100 | 0 | Casinha Inicial |
| 2 | 150 | 100 | Jardim Encantado |
| 3 | 220 | 250 | Vila Aconchegante |
| 4 | 300 | 470 | Refúgio na Floresta |
| 5 | 450 | 770 | Paraíso Tropical |
| 6 | 700 | 1.220 | Montanhas Nevadas |
| 7 | 1.000 | 1.920 | Cidade Moderna |
| 8 | 1.450 | 2.920 | Fundo do Mar |
| 9 | 2.000 | 4.370 | Reino dos Sonhos |
| 10 | 2.700 | 6.370 | Castelo Encantado |
| 11 | 3.500 | 9.070 | Estação Espacial |
| 12 | 3.850 | 12.570 | Ilha Celestial |
| 13 | 4.240 | 16.420 | – |
| 14 | 4.660 | 20.660 | – |
| 15 | 5.120 | 25.320 | – |

## Quanto tempo leva (média de 20 simulações de um ano)


| Perfil | Nível 3 | Nível 5 | Nível 8 | Nível 10 | Nível 12 (última arena) | Sementes/semana | Baús no ano | Raros ou melhores | Repetidos |
|---|---|---|---|---|---|---:|---|---:|---:|
| Novo (2 semanas animado) | 2 dias | 7 dias | – | – | – | 681 | 2 de madeira, 3 de prata, 1 de ouro | 1 | 0 |
| Casual (3 dias por semana) | 11 dias | 29 dias | 3,7 meses | 7,5 meses | mais de 1 ano | 118 | 2 de madeira, 18 de prata, 5 de ouro, 2 mágico | 8 | 0 |
| Frequente (quase todo dia) | 3 dias | 7 dias | 24 dias | 52 dias | 3,4 meses | 409 | 2 de madeira, 3 de prata, 3 de ouro, 16 mágico, 1 lendário | 19 | 0 |

- As primeiras conquistas são rápidas: nível 2 no primeiro dia e nível 5 na primeira semana para quem usa quase todo dia.
- As arenas do fim pedem constância: mesmo fazendo tudo todo dia, a última arena leva cerca de 2 meses; para quem usa quase todo dia, cerca de 3,5 meses.
- Quem usa 3 dias por semana chega à arena 5 em cerca de 1 mês e continua avançando o ano todo.
- Nada depende de dinheiro: todo o progresso vem das sementes ganhas no app.

## Baús

Baús só aceitam sementes ganhas no app (nunca dinheiro). As chances aparecem antes da compra.


| Baú | Preço | Comum | Incomum | Raro | Épico | Lendário |
|---|---:|---:|---:|---:|---:|---:|
| Baú de Madeira | 100 | 72% | 23% | 5% | 0% | 0% |
| Baú de Prata | 300 | 40% | 42% | 15% | 3% | 0% |
| Baú de Ouro | 700 | 0% | 50% | 38% | 10% | 2% |
| Baú Mágico | 1.500 | 0% | 0% | 60% | 33% | 7% |
| Baú Lendário | 3.000 | 0% | 0% | 0% | 50% | 50% |

- **Proteção contra azar:** a partir do 6º baú seguido sem item raro, a chance de raro sobe 6 pontos a cada baú; o 8º garante raro ou melhor. Depois de 40 baús sem lendário, o próximo garante lendário. O app mostra quando a proteção está ativa.
- **Repetidos:** o baú prefere itens que a pessoa ainda não tem. Quando ela já tem todos daquela raridade, o item vem repetido e vira fragmentos (comum 5, incomum 12, raro 30, épico 75, lendário 200). Com fragmentos dá para fabricar o item que falta (comum 25, incomum 60, raro 150, épico 375, lendário 1.000).
- **Menores de 18:** baú revelado. O item aparece antes da compra, sem sorteio no momento de pagar (ECA Digital, art. 20). A animação de abertura é a mesma.
- **Itens dos baús:** roupas, acessórios, efeitos, móveis, decoração, brinquedos, paredes e pisos. Comidas, itens do Plus e de época não entram.
