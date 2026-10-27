# Finalista — "Repasse Conferido" (conciliação do repasse iFood)

Data: 27/10/2026. Autor: agente analista (papel cético).
Base: seção 3 de `04-reclamacoes.md` + buscas na web feitas hoje.

**Legenda:** **FATO** = veio de uma fonte (link). **ESTIMATIVA** = conta minha a partir de fatos. **HIPÓTESE** = palpite que precisa de teste.

**Limite importante:** o proxy bloqueou todas as páginas que tentei abrir (portal de desenvolvedores do iFood, blog do iFood, Koncili, Reclame Aqui). Tudo abaixo vem dos **trechos que aparecem nos resultados de busca**. Abra os links antes de citar em público.

---

## Veredito em 1 minuto

**STOP como produto SaaS para um fundador solo.** A dor existe, mas os dados e o canal de contestação são do iFood. O iFood já dá um relatório de conciliação e uma API financeira de graça, além do Meu Caixa. Ele também é dono da Saipos, um dos maiores sistemas de restaurante. E já existem conciliadores especializados. Ninguém publicou quanto dinheiro dá para recuperar por loja. Se esse valor for pequeno, o produto não se paga. Mais abaixo há um teste de 2 semanas que pode derrubar este veredito.

---

## 1. Validação comercial

### A dor existe? Sim, mas ninguém mediu em reais
- **FATO:** há reclamações de restaurantes no Reclame Aqui sobre cancelamentos debitados da loja e repasse errado. Exemplos: "Problemas com repasse de valores, cancelamentos indevidos e falta de suporte para restaurante no iFood" ([link](https://www.reclameaqui.com.br/ifood/problemas-com-repasse-de-valores-cancelamentos-indevidos-e-falta-de-suport_kMPwXiAyaM0wIhAd/)) e "Pedido cancelado indevidamente pelo sistema do iFood após entrega concluída prejuízo ao restaurante e ausência de suporte" ([link](https://www.reclameaqui.com.br/ifood/pedido-cancelado-indevidamente-pelo-sistema-do-ifood-apos-entrega-concluid_Can0R9Xni23rovzD/)). Busca de 27/10/2026.
- **FATO:** a Abrasel relata casos em que um pedido confirmado e entregue foi cancelado por falha da plataforma, e o prejuízo ficou com o restaurante ([Abrasel](https://abrasel.com.br/noticias/noticias/novo-problema-com-ifood-prejudica-restaurantes/), sem data no trecho).
- **FATO:** a Abrasel denunciou o iFood ao Cade em 01/10/2025. A queixa é sobre subcredenciamento obrigatório e taxas de até 3,5% ([Mercado & Consumo](https://mercadoeconsumo.com.br/01/10/2025/foodservice/ifood-e-denunciado-ao-cade-por-praticas-anticompetitivas-pela-abrasel/)). Em 15/05/2026, o Cade notificou o iFood por indícios de que ele descumpriu um acordo anterior ([Mercado & Consumo](https://mercadoeconsumo.com.br/15/05/2026/foodservice/apos-denuncias-cade-notifica-ifood-por-indicios-de-violacao-a-acordo/)).
- **FATO:** na queixa à Abrasel, cupons de R$ 10 descontados do repasse aparecem como o que "come" a margem. O iFood respondeu que quem decide usar os cupons é o restaurante ([A Tarde](https://atarde.com.br/economia/altas-taxas-e-canibalizacao-ifood-e-alvo-de-acusacoes-de-lojistas-1318514)). Ou seja, parte do "desconto indevido" é, na visão do iFood, escolha da loja e não erro a recuperar.
- **FATO:** não achei **nenhum** estudo com quantos reais um restaurante recupera ao conciliar. A Abrasel mede lucro e preços, não perda com cancelamentos (busca de 27/10/2026).
- **FATO:** o problema vai além de restaurantes. A Rede Plus, uma rede de 13 supermercados, ainda concilia o delivery à mão ([GiroNews, 15/09/2026](https://gironews.com/supermercado/supermercados-enfrentam-desafios-na-conciliacao-financeira-no-delivery/)).

### Quem já vende isso (e por quanto)
| Concorrente | Tipo | O que diz fazer | Preço público |
|---|---|---|---|
| **iFood (Portal do Parceiro)** | Grátis, dono dos dados | Relatório de conciliação no portal ([blog iFood](https://blog-parceiros.ifood.com.br/relatorio-de-conciliacao/)) e aba Financeiro com cada repasse detalhado ([Serasa](https://www.serasa.com.br/blog/abrir-loja-no-ifood/)) | Grátis |
| **iFood Pago – Meu Caixa** | Grátis, dono dos dados | Gestão do fluxo de caixa, sem mensalidade, lançado em 13/11/2024. Mostra valor bruto e líquido e exporta para CSV e Excel ([Mercado & Consumo](https://mercadoeconsumo.com.br/15/11/2024/destaque-do-dia/ifood-pago-apresenta-solucao-para-organizacao-de-fluxo-de-caixa-dos-restaurantes/), [Seu Crédito Digital](https://seucreditodigital.com.br/ifood-lanca-meu-caixa-gestao-financeira/)) | Grátis |
| **Koncili (Grupo DB1)** | Direto | Diz ser "a solução mais completa do mercado para automatizar a conciliação de repasses dos pedidos feitos no iFood" ([Koncili](https://materiais.koncili.com/conciliacao-repasse-ifood), [Portal ERP](https://portalerp.com/br/noticia/koncili-faz-integracao-com-grupo-pao-de-acucar-e-carrefour)) | Não publicado |
| **Conciflex** | Direto | Conciliação de delivery ([Conciflex](https://conciflex.com.br/conciliacao-de-delivery-como-fazer-da-forma-correta/)) | Não publicado |
| **Boavista Tecnologia** | Direto | Conciliação de vendas iFood ([blog](https://boavistatecnologia.com.br/blog/conciliacao-vendas-ifood/)) | Não publicado |
| **Lumanet** | Direto | Página "Conciliação de vendas iFood" ([link](https://www.lumanet.com.br/conciliacao-vendas-ifood)) | Não publicado |
| **Saipos** (comprada pelo iFood) | Indireto (sistema de gestão) | Módulo financeiro integrado ao iFood ([Saipos](https://saipos.com/teste2025/planos-e-precos), [Techleap](https://finder.techleap.nl/news/note/ifood-acquires-saipos-in-second-deal-with-same-founders)) | "a partir de R$ 219" ou "R$ 240,79", conforme a página |
| **Sischef / FoodSistemas** | Indireto | Sischef: "conciliação financeira automática" ([Sischef](https://sischef.com/ifood-para-parceiros-ifood-parceiros-e-ifood-restaurante/)). FoodSistemas: tudo incluso por R$ 690/mês ([FoodSistemas](https://foodsistemas.com.br/)) | Sischef: não publicado. FoodSistemas: R$ 690/mês |
| **Consumer** | Indireto | Gestão com integração iFood | Segundo um concorrente, "a partir de R$ 99", e na prática R$ 200–400 ([SisFood](https://www.sisfood.com.br/saiba-mais/sistema-pdv/melhor-sistema-restaurante-otimizado)). Não verifiquei com a Consumer. |
| **Planilha + contador** | Substituto | Guia de contabilidade recomenda cruzar o repasse com o relatório toda semana ([Ledware, 18/07/2026](https://www.ledware.com.br/2026/07/18/delivery-ifood-contabilidade-2026/)) | Já está no honorário |

Anota AI e Goomer: não achei nenhuma função de conciliação do iFood nos resultados.

**Leitura:** o mercado **existe**. Há pelo menos 4 conciliadores dedicados, e isso é um bom sinal de demanda. Mas ele já está **ocupado**. O iFood oferece de graça a camada básica e é dono de um dos sistemas de gestão que já fazem a parte financeira.

---

## 2. Acesso aos dados

- **FATO:** o iFood tem um **módulo Financial** oficial na API, com uma API de Conciliação. Ela entrega um arquivo CSV compactado, separado por ";", com um campo `impacto_no_repasse` que separa o que mexe no repasse do que é só informativo. O próprio iFood avisa que os lançamentos de um pedido podem cair em semanas diferentes ([conciliação](https://developer.ifood.com.br/pt-BR/docs/guides/modules/financial/api-reconciliation), [definições](https://developer.ifood.com.br/pt-BR/docs/guides/modules/financial/definitions), [settlement](https://developer.ifood.com.br/pt-BR/docs/guides/modules/financial/api-settlement/)). Visto em 27/10/2026, só pelos trechos da busca.
- **FATO:** para usar o módulo Financial é preciso passar por **homologação**, num chamado separado. Exige conta com **CNPJ** (CPF não serve) e um questionário sobre guarda de dados financeiros e limite de chamadas. Só depois da aprovação o integrador pode ligar o app nas lojas ([homologação](https://developer.ifood.com.br/en-US/docs/guides/modules/financial/homologation), [versão em espanhol](https://developer.ifood.com.br/es-CO/docs/food/guides/modules/financial/homologation)). O portal diz que as APIs são grátis para quem tem CNPJ com **CNAE de tecnologia** ([portal](https://developer.ifood.com.br/pt-BR)).
- **FATO:** o restaurante também pode baixar os relatórios no Portal do Parceiro e subir numa ferramenta ([Boavista](https://boavistatecnologia.com.br/blog/conciliacao-vendas-ifood/)).
- **Raspar o portal:** não achei os termos de uso do parceiro nos resultados. **HIPÓTESE:** entrar com o login do dono para coletar dados automaticamente quebra os termos e põe a conta da loja em risco. Não faça isso.
- **HIPÓTESE (crítica):** se o fundador tem menos de 18 anos, ele não consegue sozinho um CNPJ com CNAE de tecnologia. Precisaria de emancipação ou de um sócio adulto. Confirme com um contador.
- **Conclusão:** dá para acessar os dados, e por um caminho legal. Mas o acesso é **concedido e pode ser revogado pelo iFood**. Isso não é uma vantagem própria: é dependência.

---

## 3. Cliente ideal e quantos existem

**Cliente ideal (HIPÓTESE):** dono ou sócio de dark kitchen, ou de 1 a 5 lojas, com R$ 30–150 mil/mês no iFood. Não usa Saipos e não tem financeiro próprio. Hoje confere o repasse "no olho" ou não confere. Um segundo cliente possível: contadores que atendem food service e conciliam várias lojas.

- **FATO:** o iFood fala em cerca de 500 mil estabelecimentos parceiros, contando restaurantes, mercados e farmácias. São mais de 180 milhões de pedidos por mês, e pequenos e médios são mais de 70% da base. Os números são do próprio iFood, divulgados no MOVE de set/2026 ([Central do Varejo](https://centraldovarejo.com.br/?p=45892), [Poder360](https://www.poder360.com.br/poder-economia/ifood-anuncia-investimento-de-r-24-bi-no-brasil/)).
- **FATO:** não existe distribuição pública de quanto cada loja fatura no iFood (busca de 27/10/2026).
- **ESTIMATIVA (fraca):** se ~80% dos 500 mil forem restaurantes (**HIPÓTESE**), são cerca de 400 mil. Se 5% a 15% passam de R$ 30 mil/mês no app (**HIPÓTESE** de concentração tipo Pareto, sem dado), o público fica entre **20 mil e 60 mil lojas**. Conferência da conta: 180 milhões de pedidos ÷ 400 mil lojas dá ~450 pedidos por mês por loja, em média. Com tíquete de R$ 50 (**HIPÓTESE**, não pesquisei), a média seria ~R$ 22 mil/mês. Como poucas lojas grandes puxam a média para cima, é plausível que a maioria fique bem abaixo de R$ 30 mil. Isso bate com a ordem de grandeza da faixa.

---

## 4. Tamanho do mercado (de baixo para cima, em BRL)

Preço de referência (**HIPÓTESE**): R$ 150–250/mês. Fica abaixo de um sistema de gestão completo (Saipos a partir de R$ 219) e acima de "grátis".

| | Conta | Por ano |
|---|---|---|
| **TAM** | 20–60 mil lojas × R$ 200 × 12 | **R$ 48–144 milhões** (ESTIMATIVA) |
| **SAM** | Tira quem já está na Saipos ou num sistema com conciliação e quem não liga para isso. Sobram talvez 30% (HIPÓTESE): 6–18 mil lojas × R$ 200 × 12 | **R$ 14–43 milhões** (ESTIMATIVA) |
| **SOM (2 anos)** | Fundador solo vendendo por WhatsApp, Instagram e visitas no Sul. Conseguir 50–150 lojas pagantes (HIPÓTESE) × R$ 200 × 12 | **R$ 120–360 mil** (ESTIMATIVA) |

De cima para baixo: não achei o valor total de pedidos (GMV) do iFood para cruzar a conta. O TAM serve só como ordem de grandeza.

---

## 5. Concorrentes: por que alguém trocaria?

| Contra quem | Por que trocaria para o Repasse Conferido | Por que **não** trocaria |
|---|---|---|
| Portal/Meu Caixa (grátis) | Mostraria a perda pedido a pedido e já entregaria o texto da contestação | O grátis "resolve mais ou menos", e o dono não vê a perda |
| Koncili/Conciflex/Boavista | Foco em restaurante pequeno, atendimento no WhatsApp, preço claro | Eles já têm homologação, clientes e equipe |
| Saipos/Sischef | Quem não usa esses sistemas não precisa trocar de sistema de gestão | Quem usa já tem o financeiro integrado. A Saipos é do iFood |
| Planilha do contador | Automatiza um trabalho que o contador cobra | O contador não quer perder esse serviço |

**Cobrar % do valor recuperado funciona?** **HIPÓTESE: pouco.** (a) Só é "recuperado" o que o iFood aceitar devolver. Quem decide é o iFood, e a contestação só vale para alguns motivos de cancelamento ([blog iFood](https://blog-parceiros.ifood.com.br/contestacao-cancelamento/)). (b) Guias de terceiros falam em prazo de **7 dias** para contestar ([Restaurante Lucrativo](https://restaurantelucrativo.adsbunker.com/conteudos/contestar-cancelamento-ifood/)). Um relatório mensal chega tarde demais. (c) Conta de exemplo (**HIPÓTESE**): se 1% de R$ 30 mil for recuperável, são R$ 300/mês, e 20% disso dá **R$ 60/mês** de receita por loja. É pouco para pagar a venda feita em visita. Um modelo misto, com mensalidade baixa mais um % do recuperado, só faz sentido se o teste da seção 8 mostrar que a perda recuperável é maior que ~R$ 500/mês por loja.

---

## 6. MVP técnico

- **Versão 0 (sem API):** o dono exporta o relatório de conciliação do portal, em CSV ou planilha, e manda pelo WhatsApp. Um script (Python ou planilha, feito com IA) separa as linhas: desconto pago pelo iFood ou pela loja, cancelamento debitado, taxas e atraso. Depois compara com o extrato do banco e gera o texto de contestação. Custo: ~R$ 0 e 1–2 semanas. **HIPÓTESE:** o formato do relatório que o dono baixa é parecido com o da API, que é CSV com ";".
- **Versão 1 (API):** pede CNPJ com CNAE de tecnologia, homologação do módulo Financial (sem prazo fixo), servidor e guarda segura de dados financeiros. **ESTIMATIVA:** 4–8 semanas, mais o tempo de homologação, mais R$ 50–200/mês de infraestrutura (HIPÓTESE).
- **Parte difícil:** o mesmo pedido gera lançamentos em semanas diferentes, segundo o próprio iFood. Além disso, as regras de "quem pagou o desconto" mudam junto com as promoções. E a contestação continua sendo feita à mão no portal: o produto só **prepara**, não **envia**.

---

## 7. Teste de estresse: tentando matar a ideia

1. **O iFood lança isso de graça.** *Muito provável.* Ele já tem relatório de conciliação, API, Meu Caixa e a Saipos. Colocar um botão "pedidos para contestar" no portal custa pouco. E um fornecedor que mostra quanto o iFood "deve" ao restaurante é algo que o iFood tem motivo para tornar desnecessário. **Este é o argumento mais forte contra a ideia.**
2. **Valor recuperável pequeno.** Não há nenhum número público. Parte do que o dono chama de "desconto indevido" é cupom que ele mesmo ativou ([A Tarde](https://atarde.com.br/economia/altas-taxas-e-canibalizacao-ifood-e-alvo-de-acusacoes-de-lojistas-1318514)). Se a perda real recuperável for de algumas dezenas de reais por mês, o produto morre.
3. **O dono não liga.** **HIPÓTESE:** o dono reclama da *taxa* (12–23% + 3,2%), não da *conferência*. E a taxa não se contesta. O Reclame Aqui mostra raiva com casos isolados, não procura por ferramenta.
4. **O iFood muda o relatório.** O módulo já está na "v2" ([docs](https://developer.ifood.com.br/es-CO/docs/guides/financial/v2/)). Cada mudança quebra o script da versão 0. Na versão 1 o risco é menor, mas o iFood pode revogar o app.
5. **Acesso bloqueado.** Sem CNPJ de tecnologia, não há API. Sem API, a ferramenta depende do dono exportar o arquivo toda semana, e isso costuma não durar.
6. **Concorrentes com vantagem.** Koncili, Conciflex e Boavista já fazem isso. Um fundador solo e menor de idade não ganha deles em confiança para mexer no dinheiro de uma empresa.
7. **Prazo de 7 dias.** O "relatório mensal" do pitch original não serve para contestar. Precisaria de alerta diário ou semanal, e isso exige o dono agir toda semana.

**O que sobrevive:** a dor de "não sei se o iFood me pagou certo" é real em lojas sem financeiro. E um serviço feito à mão, com uma pessoa conferindo e entregando a contestação pronta toda semana, dá para testar com custo zero.

---

## 8. Veredito (idea-validator)

## Verdict: STOP

O iFood controla os dados, o canal de contestação e a decisão de devolver. Ele já dá de graça a camada básica e é dono da Saipos. Nenhuma fonte mostra que o valor recuperável por loja paga uma ferramenta. Mudar o produto não resolve isso, porque a ideia depende de um recurso do iFood que o próprio iFood pode tornar desnecessário.

| Dimensão | Nota | Motivo em uma linha |
|---|---|---|
| Problem Severity | **Moderate** | Acontece toda semana e há reclamações e a Abrasel, mas falta valor em R$ por loja |
| Market Evidence | **Moderate** | Há 4+ conciliadores dedicados, mas nenhum publica preço, e o básico é grátis |
| Solution Differentiation | **Weak** | "Mais simples e no WhatsApp" contra concorrentes grátis e dedicados não segura |
| Feasibility | **Moderate** | Existe API oficial, mas exige homologação e CNPJ de tecnologia, o que trava um menor de idade |
| Business Viability | **Weak** | R$ 1M/ano exige ~420 lojas a R$ 200. Cobrar % do recuperado dá uns R$ 60 por loja (HIPÓTESE). A venda é feita em visita |

**Raciocínio resumido.**
- *Problema:* o repasse acontece toda semana, e há reclamação pública e queixa da Abrasel. Mas o sinal mais forte é sobre a taxa, que não se contesta, e não sobre o erro de repasse.
- *Mercado:* concorrentes dedicados provam que há demanda. Mas eles escondem o preço, e o portal grátis atende o básico.
- *Diferencial:* não há vantagem que se defenda. Os dados são do iFood e podem ser cortados a qualquer momento.
- *Viabilidade técnica:* a versão 0 sai em 2 semanas. A versão 1 depende da homologação e de um CNPJ.
- *Negócio:* com receita pequena por loja e venda por visita, um fundador solo leva anos para chegar a uma base relevante.

**Perguntas decisivas.**
1. Em 10 lojas reais, quantos R$/mês **o iFood aceitou devolver** depois de uma contestação bem feita?
2. Dono ou contador: quem abre o arquivo toda semana, e por quê?
3. Você consegue um CNPJ de tecnologia, seu ou de um sócio adulto, para passar pela homologação?

**3 experimentos antes de escrever código de produto.**
- **Conferência manual grátis:** peça a 5 restaurantes de Joinville o relatório de conciliação dos últimos 30 dias e confira tudo à mão ou em planilha. *Custo:* ~10 h e R$ 0. *Sinal:* a ideia continua viva se a mediana for de pelo menos R$ 500/mês contestável **e** pelo menos 1 contestação for aceita. A ideia morre se a mediana ficar abaixo de R$ 150.
- **Pré-venda:** ofereça "conferência semanal + contestação pronta" por R$ 149/mês para quem fez o teste. *Custo:* 1 semana. *Sinal:* pelo menos 2 de 5 pagam o primeiro mês.
- **Contadores:** fale com 5 contadores de food service da região. *Custo:* 1 semana. *Sinal:* pelo menos 1 aceita revender ou pagar por loja.

**Suposições e lacunas.** São HIPÓTESES: a fatia de restaurantes na base e a fatia acima de R$ 30 mil, o tíquete de R$ 50, o preço de R$ 150–250, a perda recuperável de 1%, o formato do relatório do portal, a proibição de raspagem nos termos e a regra de CNPJ para menor de idade. Faltam: [NEED: preços da Koncili, Conciflex e Boavista], [NEED: distribuição de faturamento das lojas no iFood], [NEED: termos de uso do parceiro iFood], [NEED: taxa de aceite das contestações].

**O que mudaria o veredito para ITERATE:** se o primeiro experimento mostrar perda recuperável mediana acima de R$ 500/mês, faz sentido mudar a ideia para um **serviço semanal de conferência e contestação** (com uma pessoa fazendo o trabalho, vendido junto com contadores). O SaaS ficaria para depois.
