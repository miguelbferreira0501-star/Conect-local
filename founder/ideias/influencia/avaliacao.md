# Marketplace de influenciadores: avaliação (idea-validator + market-sizing)

Data: 29/10/2026. Fontes no `board/brief.md`. Ninguém foi entrevistado: tudo aqui é hipótese bem informada.

## Verdict: ITERATE

Na versão genérica ("app para achar influenciadores"), o veredito é **STOP**. O Instagram oferece de graça um marketplace de criadores no Brasil desde 2024, e há mais de 10 plataformas nacionais e globais fazendo isso. Só vale testar a versão **local e com pagamento protegido**, para o comércio de uma cidade, e só se a pré-venda provar que o comércio paga.

## Scorecard

| Dimensão | Nota | Motivo |
|---|---|---|
| Gravidade do problema | Moderada | O comércio quer divulgar, mas não perde dinheiro todo mês por não achar influenciador. A dor real é a desconfiança (seguidores falsos, publi que não traz cliente) |
| Evidência de mercado | Forte | 64% das marcas investiram em influência em 2024. Há várias plataformas pagas e o Instagram e o TikTok entraram no setor |
| Diferenciação | Fraca | Buscar perfil já existe de graça no Instagram. "Local + pagamento retido + cupom para medir" é melhor, mas copiável (a Alpha Influência já retém o pagamento) |
| Viabilidade técnica | Moderada | O cadastro e a busca são simples. Difícil é verificar o público local sem a API oficial do Instagram (precisa de aprovação da Meta) e reter o pagamento sem ser instituição de pagamento (dá para usar o split de um provedor) |
| Viabilidade do negócio | Fraca | Ticket local pequeno (R$ 300 a 1.500 por post). 15% disso dá de R$ 45 a 225 por negócio, e depois do primeiro contato o comércio e o influenciador combinam direto pelo direct |

## Reasoning (resumido)

- **Problema.** Para o pequeno comércio, o influenciador é uma forma de divulgação entre várias, não uma obrigação. A fraude é real: de 48,9% a 56% dos influenciadores brasileiros são afetados por seguidores falsos (HypeAuditor / Meio & Mensagem). O risco de "pagar e não vir ninguém" é a dor mais forte.
- **Mercado.** Existe e está crescendo. Mas o número de "R$ 20 bilhões" não tem metodologia, e não há dado de quanto o comércio de bairro gasta.
- **Diferenciação.** A cunha possível é a soma de quatro coisas: **público local comprovado, preço fechado, pagamento só depois do post e cupom que mede clientes**. Isoladamente, cada uma já existe em algum concorrente. ASSUMPTION: ninguém junta as quatro para o comércio de cidade média.
- **Técnica.** O MVP é um diretório curado e um fluxo de contratação, sem IA obrigatória. Depende da Meta para os dados do Instagram (ou de prints enviados à mão) e de um provedor de pagamento com split e retenção.
- **Negócio.** O maior risco de um marketplace é o **desvio**: depois de achar o influenciador, o comércio contrata direto. O que segura a transação na plataforma é o valor de proteção (pagamento retido, prova e medição), não a busca.

## Tamanho do mercado (de baixo para cima, local; ESTIMATIVA)
- **Joinville.** ASSUMPTION: de 300 a 800 comércios ativos no Instagram que contratariam 1 publi a cada 2 meses, a R$ 600 em média. Isso dá de R$ 1,1 a 2,9 milhões por ano em publis na cidade. A comissão de 15% vale de R$ 160 mil a R$ 430 mil por ano se o app ficasse com **todo** o mercado da cidade. Uma fatia realista de 5 a 10% dá de **R$ 8 mil a R$ 43 mil por ano**.
- **Santa Catarina e outras cidades médias:** o mesmo modelo, repetido cidade por cidade. Cada cidade exige montar a oferta de influenciadores de novo.
- [NEED: contar comércios de Joinville que já fazem publi; preço médio local real; frequência.]

## Killer questions
1. Dos 20 comércios de Joinville que já fizeram publi, quantos ficaram insatisfeitos com o resultado e pagariam 15% a mais por proteção e medição?
2. Depois do primeiro trabalho, por que o comércio voltaria a contratar pelo app e não pelo direct?
3. Quantos influenciadores locais aceitam enviar o print do público e receber só depois do post?

## Next 3 experiments (sem programar)
- **Planilha curada (1 semana, R$ 0):** listar 30 influenciadores de Joinville com nicho, % de público local (print), preço e exemplos de publis. Sinal: mais de 20 aceitam entrar com preço fechado.
- **Intermediação feita à mão (3 semanas, R$ 0):** oferecer a 15 comércios "eu acho o influenciador certo, o pagamento fica retido até o post e você recebe um cupom para medir; taxa de 15%". Sinal: 5 contratações pagas e pelo menos 2 comércios repetindo no mês seguinte.
- **Teste do desvio (mês 2):** medir quantos comércios voltam pelo intermediário e quantos vão direto ao influenciador. Sinal: mais de 50% voltando indica um negócio. Abaixo de 30%, STOP.

## Hipóteses e lacunas
- ASSUMPTION: o número de comércios ativos e a frequência de publis em Joinville.
- ASSUMPTION: ninguém junta as quatro peças para cidades médias.
- [NEED: as regras para reter pagamento de terceiros: usar o split/escrow de um provedor autorizado; confirmar com o provedor e um contador.]
- [NEED: os preços de Squid, BrandLovers e Airfluencers.]
- Na matriz da missão, esta ideia fica em **≈ 53/100**, abaixo do Pasta em Dia (76).
