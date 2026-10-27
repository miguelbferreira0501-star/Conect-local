# Avaliação: Depois

27/10/2026. Complementa o [board](board.md), o [idea-validator](../pesquisa.md) e os [concorrentes](concorrentes.md).

## 1. Tamanho do mercado (TAM, SAM, SOM)

**Em uma linha:** o TAM é o dinheiro total se todo o Brasil comprasse, o SAM é a parte que dá para alcançar com o canal (funerárias de SC) e o SOM é o que é realista ganhar em 1 a 3 anos.

**Unidade:** uma família por óbito. O preço testado é R$ 29 por família que ativa (hipótese do brief).

**Dados**
- Brasil: **1.495.386 óbitos em 2024**, 4,6% a mais que em 2023 (IBGE, Registro Civil, via [Folha BV](https://www.folhabv.com.br/?p=592913) e [SBT News](https://sbtnews.sbt.com.br/noticia/brasil/numero-de-mortes-sobe-4-6-no-brasil-em-2024-diz-ibge)).
- Santa Catarina: **51.615 óbitos em 2024** (+7,5%). **Joinville: cerca de 3,8 mil**, o maior número do estado (IBGE, via [ND+](https://ndmais.com.br/seguranca/alta-nas-mortes-em-sc-e-mes-vira-pico-critico-nas-estatisticas-segundo-o-ibge/) e [NSC Total](https://www.nsctotal.com.br/noticias/sc-tem-um-dos-maiores-aumentos-de-mortes-entre-os-estados-brasileiros-em-2024)). Isso confirma a estimativa anterior de "uns 4 mil".
- Funerárias: cerca de 5 mil empreendimentos no Brasil ([Câmara dos Deputados](https://www.camara.leg.br/noticias/374972-SEGURIDADE-APROVA-REGULAMENTACAO-PARA-PLANOS-DE-ASSISTENCIA-FUNERARIA)). Joinville tem 4 ([Prefeitura](https://www.joinville.sc.gov.br/wp-content/uploads/2023/02/Anexo-I-Edital-PMI-no-01-2023.pdf)). Em SC: [NEED: contagem na Receita Federal pelo CNAE 9603-3/04].

**De cima para baixo:** o setor funerário movimenta cerca de R$ 13 bilhões por ano ([EM](https://www.em.com.br/mundo-corporativo/2025/10/7277569-setor-funerario-inova-cresce-e-tem-foco-sustentavel.html)), o que dá uns R$ 8.700 por óbito. R$ 29 é 0,3% desse valor, um extra pequeno para a funerária.

**De baixo para cima (por ano)**

| | Conta | Valor |
|---|---|---|
| **TAM** Brasil | 1.495.386 × R$ 29 | **R$ 43,4 milhões** |
| **SAM** SC | 51.615 × R$ 29 | **R$ 1,5 milhão** |
| Teto Joinville | 3.800 × R$ 29 | R$ 110 mil |
| **SOM** ano 1 | 1 das 4 funerárias (ASSUMPTION: 25% dos óbitos) × 30% ativam (ASSUMPTION) = 285 famílias | **R$ 8,3 mil** (≈ R$ 690/mês) |
| **SOM** ano 3 | parceiros com 10% dos óbitos de SC (ASSUMPTION) × 30% = 1.549 famílias | **R$ 44,9 mil** (≈ R$ 3,7 mil/mês) |

| Métrica | Hoje | Em 2 a 3 anos |
|---|---|---|
| TAM | R$ 43,4 mi | sobe com os óbitos (+4,6% em 2024) |
| SAM | R$ 1,5 mi | sobe com os óbitos (+7,5% em SC em 2024) |
| SOM | R$ 8,3 mil | R$ 44,9 mil |

**O que isso quer dizer:** cobrando por família, SC inteira vale no máximo R$ 1,5 milhão por ano, e isso exigiria 100% de cobertura e de ativação. Chegar a R$ 1 milhão por ano pede 34,5 mil famílias, ou 67% dos óbitos de SC. O que pode crescer é **cobrar por plano funerário ativo** (vivos pagando todo mês), e não por óbito: a R$ 3 por plano por mês, cada 10 mil planos dão R$ 30 mil/mês. [NEED: quantos planos ativos a Prever e a SBC têm].

**Hipóteses-chave:** (1) taxa de ativação de 30%, confiança baixa (testar no experimento 2); (2) participação de 25% de uma funerária em Joinville, baixa ([NEED: perguntar a cada uma quantos atendimentos faz por mês]); (3) preço de R$ 29, baixa; (4) números de óbitos, alta (IBGE).

## 2. Hipóteses de risco (8 categorias)

| Categoria | Hipótese | Confiança | Teste |
|---|---|---|---|
| Valor | A família usa a lista e cumpre os prazos (pensão, inventário) | Média | Experimento 2: quantas abrem e voltam na semana 2 |
| Usabilidade | Um filho enlutado responde 8 perguntas no celular, sozinho, em 3 dias | Média | Entregar para 5 famílias e cronometrar |
| Viabilidade | A funerária paga R$ 29 por família, ou R$ 3 por plano | **Baixa** | Experimento 3: Pix pago |
| Viabilidade (conteúdo) | Um advogado de sucessões revisa o conteúdo por um preço que o projeto suporta | Baixa | Pedir 3 orçamentos [NEED] |
| Viabilidade técnica | O fundador constrói a lista e os lembretes com o que já fez no Pataí | **Alta** | Não precisa testar agora |
| **Ética** | Vender para quem está de luto é aceitável se: a família não paga, ninguém liga para vender, o app não empurra advogado por comissão, e os dados do falecido e da família (LGPD, dados sensíveis) não são vendidos nem usados para vender planos | Média | Mostrar o texto exato da mensagem a 5 pessoas que perderam alguém há mais de 6 meses; se 2 acharem invasivo, reescrever. Política de dados escrita antes do piloto |
| Ética (erro) | Um prazo errado faz a família perder dinheiro | Média | Revisão jurídica com data visível, e "confirme no INSS" em toda tarefa |
| Go-to-Market | A Prever ou outra das 4 funerárias recebe um fundador jovem e aceita um piloto | Baixa | Experimento 1 |
| Go-to-Market | A mensagem enviada 3 dias depois funciona melhor que o QR no velório | Baixa | Experimento 2 (dois braços) |
| Estratégia | Ninguém copia antes de ganhar SC: software de funerária, Guarda Digital, a própria Prever | **Baixa** | Monitorar; buscar exclusividade de 12 meses no contrato do piloto |
| Estratégia | A Amparo morreu por um motivo que não se aplica aqui | Baixa | Mensagem ao fundador e consulta ao CNPJ |
| Equipe | Um fundador solo e talvez menor de 18 anos consegue fechar contrato e receber (precisa de um responsável legal no Asaas e no contrato) | Média | Definir o responsável antes do experimento 3 |
| Equipe | O fundador aguenta um tema pesado (morte) por 2 ou mais anos | Média | Conversar com 10 famílias e perceber como se sente |

**Mais arriscado:** a funerária pagar (Viabilidade), seguido de ganhar a confiança da Prever (Go-to-Market).

## 3. Experimentos

**Hipótese XYZ:** "Pelo menos **1 das 4 funerárias de Joinville** (25%) vai **pagar** pela lista dos 90 dias entregue com a marca dela, e pelo menos **20% das famílias** que a recebem vão **ativá-la**."

| # | Experimento | Testa | Como | Métrica | Passa se | Custo |
|---|---|---|---|---|---|---|
| 1 | Pedido de carta de intenção (pretotipo "nome falso na porta") | A funerária aceita | Levar o PDF "Os primeiros 90 dias em SC" com o logo de cada funerária às 4 de Joinville, Prever primeiro, e pedir para entregar às próximas 20 famílias | Quantas assinam um aceite de piloto de 30 dias | **≥ 1 de 4** assina. Se for 0, **STOP** | 1 semana, R$ 0 |
| 2 | MVP manual (concierge) | A família ativa | No piloto, metade das famílias recebe o QR no recibo, e a outra metade recebe um WhatsApp da funerária no dia 3. O fundador monta cada lista à mão num formulário | % que responde às 8 perguntas e % que abre de novo na semana 2 | **≥ 20%** ativam no melhor braço e **≥ 50%** dessas voltam. Abaixo de 10% nos dois braços, o canal falhou | 30 dias, R$ 0 |
| 3 | Pré-venda (dinheiro no jogo) | A funerária paga | Mostrar à funerária do piloto o número de famílias ajudadas e oferecer dois preços: R$ 29 por família ativada, ou R$ 3 por plano por mês | Pix pago por um 2º mês | **1 pagamento** de qualquer valor ≥ R$ 290 por mês. Só um "gostei" não conta | 1 conversa |

Todos usam dados próprios (YODA): nenhum número de mercado substitui o Pix do experimento 3.

## Veredito atualizado: ITERATE (mantido, mais fraco)

A evidência nova **não muda o ITERATE**, mas aperta as condições:

- **Evidência de mercado continua Moderada, e pesa contra.** A Amparo tinha R$ 5 milhões, um fundador advogado e canais B2B (seguros, Flash, Kavak), e não há sinal público dela depois de 2024. Ninguém provou ainda que um parceiro brasileiro paga por isso. A Guarda Digital já vende para planos de assistência familiar, então o canal "empresa de plano" não é exclusivo.
- **A viabilidade do negócio cai de Moderada para perto de Fraca se o preço for por óbito.** SC inteira vale R$ 1,5 milhão por ano, e um SOM realista de 3 anos fica em uns R$ 45 mil por ano. Só fica Moderada se o preço for **por plano ativo** numa empresa como a Prever.
- **Gravidade (Forte) e viabilidade técnica (Forte) não mudam.** Os óbitos de Joinville (cerca de 3,8 mil) confirmam a estimativa anterior.

**Mudança de rumo:** o primeiro cliente é a **Prever** (funerária e empresa de plano, sede em Joinville), com preço por plano. Antes disso, mandar mensagem ao fundador da Amparo. **Vira STOP** se nenhuma das 4 funerárias aceitar o piloto nem de graça, ou se, depois do piloto, ninguém pagar.
