# Economia do jogo

Números de níveis, XP, sementes e baús do HamiCare, ajustados por simulação.
Os valores ficam em `web/src/shared/game/config.ts` (o painel de administração poderá gravar outra versão),
e as metas de equilíbrio são conferidas pelo teste `web/src/shared/game/simulate.test.ts`.

## Como se ganha

Desde novembro de 2026, subir de nível é **bem difícil de propósito** (cerca de 4 vezes mais lento
que a primeira versão): cada ação vale pouco XP e o teto do dia é baixo, para ninguém conseguir
correr fazendo coisa demais. As sementes não mudaram. Quem já tinha nível não perdeu nada.

| O quê | XP | Sementes | Limite |
|---|---:|---:|---|
| Missão leve (ex.: beber água, arrumar a cama) | 1 | 3 | conta no teto do dia |
| Missão normal | 2 | 5 | conta no teto do dia |
| Missão puxada | 3 | 8 | conta no teto do dia |
| Caminhar | 3 | 5 | movimento tem teto de 12 XP por dia |
| Alongar, yoga, mobilidade, meditar, 5-4-3-2-1 | 2 | 3 a 5 | |
| Escrever no diário | 2 | 3 | 1 por dia |
| Registrar o humor, guardar algo no pote, momento de bem-estar | 1 | 1 a 2 | 1 por dia cada |
| Cuidar do Hami (cada cuidado diferente) | 1 | 1 | |
| Passeio | 3 a 10 | 12 a 45 | teto de 15 XP por dia |
| Desafio diário | 5 | 5 | 3 por dia |
| Desafio semanal | 12 | 30 | 2 por semana |
| Desafio do mês | 25 | 100 | 1 por mês |
| Conquista | 10 | a da conquista (até 500) | 1 vez cada |
| Coleção completa | 10 a 15 | 100 a 250 | 1 vez cada |
| Temporada (último degrau) | 30 | 120 + baú de prata | 1 por mês |
| Subir de nível | | 10 + 5 × nível | |
| Abrir arena nova | | 40 a 250 + baú grátis | |

**Teto da rotina:** 25 XP e 45 sementes por dia (missões, cuidados, diário, humor, pote e bem-estar). Só 12 missões contam por dia.
Movimento tem teto próprio de 12 XP e as outras categorias de 10 XP: fazer mais do que isso não rende mais, para o app não incentivar exagero.
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

## Quanto tempo leva (simulação de um ano)

| Perfil | Nível 2 | Nível 3 | Nível 5 | Nível 8 | Nível 12 (última arena) | Onde chega em 1 ano | Sementes/semana |
|---|---|---|---|---|---|---|---:|
| Novo (2 semanas animado, depois para) | 4 dias | 9 dias | – | – | – | nível 4 | 482 |
| Casual (3 dias por semana) | 18 dias | 37 dias | 3,8 meses | – | – | arena 7 | 104 |
| Frequente (quase todo dia) | 4 dias | 10 dias | 27 dias | 3 meses | mais de 1 ano | arena 11 | 394 |
| Muito ativo (todo dia, tudo) | 2 dias | 5 dias | 13 dias | 48 dias | 7 meses | arena 12, nível 14 | 633 |

- **Antes** (primeira versão): nível 5 em 1 semana, última arena em cerca de 3,5 meses para quem usa quase todo dia e em 2 meses para quem faz tudo todo dia.
- **Agora:** nível 5 em cerca de 1 mês para quem usa quase todo dia. A última arena leva mais de 1 ano para essa pessoa e cerca de 7 meses para quem faz tudo, todo dia.
- Quem usa 3 dias por semana leva quase 4 meses até a arena 5 e chega à arena 7 no fim do ano.
- Os números podem ser mudados no painel (Administração › Jogo), que simula os 4 perfis antes de salvar.
- Nada depende de dinheiro: todo o progresso vem das ações no app.

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
