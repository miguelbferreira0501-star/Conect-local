# Finalista: "Aluguel Direto" — análise cética (27/10/2026)

**Ideia:** software para quem aluga de 1 a 20 imóveis sem imobiliária (e para imobiliárias pequenas). Faz a cobrança mensal (Pix Automático/boleto), manda lembrete no WhatsApp, aplica o reajuste anual (IGP-M/IPCA) com a carta de aviso, gera recibos, calcula multa, separa condomínio/IPTU, faz o relatório do carnê-leão/IRPF e guarda contrato e vistoria. O dinheiro não passa por nós.

**Como ler:** **FATO** tem link e data. **ESTIMATIVA** é uma conta minha ou um número de fornecedor. **HIPÓTESE** ainda precisa ser testada. **Limite:** o proxy bloqueou a abertura das páginas. Tudo vem dos **trechos devolvidos pela busca** (27/10/2026). Abra o link antes de usar qualquer número num pitch.

---

## Veredito: **STOP** (na forma atual)

O recurso principal (Pix Automático caindo direto na conta do locador) **não funciona para quem recebe como pessoa física**. E as outras funções já existem a R$ 0–29,90/mês em pelo menos dois concorrentes. Um fundador solo, possivelmente menor de idade, venderia assinatura barata para pessoa física, com CAC de B2C e sem nada que o diferencie.

| Dimensão | Nota | Motivo em uma linha |
|---|---|---|
| Gravidade do problema | **Moderada** | A dor é real (reajuste esquecido, atraso), mas o reajuste acontece uma vez por ano e a inadimplência nacional fica perto de 3% |
| Evidência de mercado | **Moderada** | Há concorrentes cobrando por isso, mas não achei receita nem número de clientes no segmento "locador direto" |
| Diferenciação | **Fraca** | GeraContratos e Rentos já vendem quase a mesma lista de funções |
| Viabilidade técnica | **Moderada** | Boleto, índices e PDFs são fáceis. O Pix Automático exige recebedor com CNPJ, e a cobrança sem "segurar dinheiro" é a parte difícil |
| Viabilidade do negócio | **Fraca** | Com ~R$ 30–60/mês, chegar a US$ 1 mi/ano pede mais de 10 mil clientes pessoa física |

---

## 1. Tamanho e perfil

- **FATO:** em 2024, 23% dos domicílios do Brasil eram alugados, cerca de 17,8 milhões de 77,3 milhões (PNAD Contínua, divulgada em ago/2025). Em 2016 eram 18,4%. Centro-Oeste 29,8%, Norte 15,3%. [Agência Brasil, ago/2025](https://agenciabrasil.ebc.com.br/geral/noticia/2025-08/parcela-de-familias-quem-pagam-aluguel-sobe-25-em-8-anos-mostra-ibge) · [Diário do Comércio](https://diariodocomercio.com.br/economia/parcela-familias-pagam-aluguel-sobe-25-8-anos/). Um trecho cita 23,8% para 2025, mas não confirmei a fonte.
- **FATO:** uma pesquisa do QuintoAndar diz que 45% dos proprietários do **Rio** fecharam o último contrato direto, sem intermediação. Desses, 33% assinaram sem reconhecer firma e 12% só de boca. A data provável é 2026, não confirmada, e não há número nacional. [Portas](https://portas.com.br/noticias/contratos-sem-cartorio-crescem-no-rio-de-janeiro/)
- **FATO:** em Joinville, 168,5 mil pessoas moram de aluguel (Censo 2022), e em SC são 25,6% dos moradores. [NSC Total](https://www.nsctotal.com.br/?p=7369669) · [NSC Total SC](https://www.nsctotal.com.br/?p=7369691)
- **Perfil do locador:** não achei nenhum dado sobre quantos imóveis cada locador tem. FATO: o QuintoAndar fez uma campanha para o público 50+, que chamou de "detentor da maior parcela de imóveis do país". [Acontecendo Aqui](https://acontecendoaqui.com.br/propaganda/quintoandar-lanca-campanha-direcionada-para-o-publico-50-que-e-detentor-da-maior-parcela-de-imoveis-do-pais/) **HIPÓTESE:** o locador típico tem mais de 50 anos, 1 a 3 imóveis e usa pouca tecnologia.
- **Imposto (FATO, de blogs de contabilidade, não da Receita):** quem recebe aluguel de pessoa física recolhe o carnê-leão todo mês (DARF 0190, vence no último dia útil do mês seguinte) e pode deduzir condomínio e IPTU pagos por ele. Se o inquilino é empresa, ela retém o imposto na fonte. O limite de isenção citado varia entre as fontes (R$ 2.259,20, R$ 2.428,80 e R$ 2.824,00), então confira na Receita. [Fast Company Brasil](https://fastcompanybrasil.com/money/carne-leao-2026-quem-precisa-pagar-como-preencher-e-qual-o-valor/) · [GeraContratos](https://geracontratos.com.br/recursos/carne-leao-aluguel-guia). Aluguel não declarado pode render multa de 75%. [Correio Braziliense](https://www.correiobraziliense.com.br/cbradar/como-declarar-alugueis-recebidos-no-imposto-de-renda/)
- **FATO (reforma tributária):** pela LC 214/2025, art. 251, a pessoa física só passa a pagar IBS/CBS sobre aluguel se tiver **mais de 3 imóveis alugados E** receita acima de R$ 240 mil/ano. As fontes divergem sobre quando a cobrança começa (2026 ou 2027–2033). [Movimento Econômico, 29/06/2026](https://movimentoeconomico.com.br/economia/lei-de-incentivos/tributacao/2026/06/29/aluguel-veja-quem-tera-de-pagar-cbs-e-ibs-na-reforma-tributaria/). **HIPÓTESE:** isso cria uma dor nova, mas só para uma faixa estreita de locadores (o topo do ICP).
- **Não achei:** quantos declarantes do IRPF informam renda de aluguel. A tabela existe em "Grandes Números do IRPF", mas o trecho não trouxe o número. [Receita](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/estudos/imposto-de-renda/estudos-por-ano/grandes-numeros-do-IRPF-2008-a-2023/grandes-numeros-do-irpf-2024-ano-calendario-2023-1) [NEED: abrir a tabela]

## 2. Concorrentes e preços

| Nome | Tipo | Preço (fonte) | O que faz | Ponto fraco |
|---|---|---|---|---|
| **GeraContratos** | Direto | R$ 29,90/mês (1 imóvel), R$ 59,90 (2–10), R$ 99,90 (11–30), + R$ 1,99 por Pix / R$ 3,99 por boleto recebido. Aditivo de reajuste avulso: R$ 39,90. Teste de 7 dias [calculadora](https://geracontratos.com.br/recursos/calculadora-economia-imobiliaria) · [análise](https://geracontratos.com.br/analise-inquilino) · [aditivo](https://geracontratos.com.br/recursos/aditivo-reajuste-contrato-aluguel-assinatura-digital) | Contrato, boleto/Pix, reajuste IGP-M/IPCA, recibo, carnê-leão. Identifica o pagamento e **repassa por Pix** ao dono, já descontada a taxa [simulador](https://geracontratos.com.br/recursos/simulador-economia-cobranca-automatica) | Os preços divergem entre páginas. Não achei avaliações |
| **Rentos** | Direto | **Grátis para 1 imóvel**. Planos pagos não encontrados [Capterra](https://www.capterra.com.sg/software/1112638/Rentos) · [B2B Stack](https://www.b2bstack.com.br/product/rentos) | Contrato, vistoria com fotos, reajuste IPCA/IGP-M, lembretes **por WhatsApp**, recibo, multa/juros, **relatório para o carnê-leão**, portal do inquilino | Não achei avaliações. É praticamente a nossa lista de funções |
| **AiLar** | Direto/corretor | App "Free" na App Store, planos não encontrados [App Store](https://apps.apple.com/dm/app/ailar/id6475095930) | Cobrança e **split automático** | Foco em corretor |
| **QuintoAndar** | Substituto | Corretagem = 1 aluguel. A taxa de administração "varia por tipo de anúncio" (fontes antigas falam em 6,9–8%). Há modalidade "sem administração" com Fiança Simples obrigatória [Startups](https://startups.com.br/negocios/quintoandar-amplia-modelo-de-negocio-e-lanca-nova-opcao-de-contrato/) · [Migalhas](https://www.migalhas.com.br/depeso/312990/startups-e-direito-imobiliario--consideracoes-sobre-a-operacao-da-quintoandar) | Garantia de pagamento até o dia 12 mesmo com inadimplência | Mais caro. O dono perde o controle |
| **Superlógica Imobiliárias** | Para imobiliária | A partir de R$ 229/mês (agregador) [B2B Stack](https://www.b2bstack.com.br/product/superlogica-imobiliarias/alternativas) | ERP de locação completo | Nota 7,2 no Reclame Aqui, queixas de "falhas recorrentes" [RA](https://www.reclameaqui.com.br/superlogica/falhas-recorrentes-no-sistema-superlogica-e-suporte-sem-solucao_vTku95Oh2PrpdW0y/) |
| **Imobzi** | Para imobiliária | A partir de R$ 129/mês, tem versão grátis [B2B Stack](https://www.b2bstack.com.br/compare/imobzi-vs-kenlo) | CRM e locação | — |
| **Kenlo** | Para imobiliária | "Sob consulta" [B2B Stack](https://www.b2bstack.com.br/product/kenlo-imob) | Suíte para imobiliária | — |
| **Cora** | Banco (ameaça) | "Em breve": recebe por boleto, separa a taxa e repassa ao proprietário [Cora](https://www.cora.com.br/alugueis-com-repasse-automatico/) | Foco em imobiliária (conta PJ) | Ainda não lançou |
| **Loft / LocPay (Sicoob)** | Para imobiliária | Preço não encontrado. O proprietário recebe em D0 [Loft](https://loft.com.br/para-imobiliarias/repasse/) · [Sicoob](https://www.sicoob.com.br/web/sicoobimob/locpay) | Split e repasse | Só para imobiliárias |
| **Planilha + WhatsApp + app do banco** | Substituto | Grátis | — | É esquecido. É o concorrente real |

"Meu Aluguel" e "Alugue Direto": a busca não achou esses apps. **Faixa de preço** para o locador direto: de R$ 0 (Rentos, 1 imóvel) a R$ 99,90/mês (GeraContratos). Mediana do que achei: R$ 59,90.

**Reclamações:** os temas encontrados são sobre **imobiliárias** (repasse atrasado e falta de transparência, ver item 6 de [01-problemas-brasil.md](01-problemas-brasil.md)) e sobre o Superlógica. **Não achei reclamações públicas de GeraContratos ou Rentos.** O tema é fraco: menos de 3 reviews.

## 3. Evidência de dor

- **FATO:** a inadimplência de aluguel da Superlógica ficou em 2,93% em set/2026, a menor da série desde abr/2023. Nos residenciais de até R$ 1 mil foi de 6,31% (mai/2026) e 5,99% (jul/2026). [Portas](https://portas.com.br/noticias/inadimplencia-do-aluguel-recua-a-293-e-atinge-menor-nivel-da-serie/) · [A Gazeta](https://www.agazeta.com.br/imoveis/inadimplencia-do-aluguel-sobe-3-22-em-maio-veja-quem-mais-atrasa-0626). A base são contratos de imobiliária, então pode não valer para o locador direto.
- **FATO (o custo do reajuste esquecido):** o STJ (3ª Turma) decidiu que o locador que deixou de reajustar por anos **não pode cobrar o retroativo**, só reajustar daqui para frente (tese da *supressio*). O caso era comercial. [OAB-RS](https://www2.oabrs.org.br/jornalDaOrdem/inercia-do-locador-dispensa-loja-de-pagar-reajustes-retroativos-mas-nao-a-isenta-de-obrigacoes-futuras/46262) · [Conjur](https://www.conjur.com.br/?p=422278)
- **ESTIMATIVA:** esquecer um reajuste de 5% num aluguel de R$ 2.000 custa R$ 100/mês, ou R$ 1.200 no ano. Um ano de software (R$ 360–720) se paga com **um** reajuste lembrado. Esse é o melhor argumento de venda.
- **HIPÓTESE:** a dor maior do locador direto é a ansiedade de cobrar o inquilino e o carnê-leão. Não achei relatos em primeira pessoa (Reddit e Facebook não apareceram).

## 4. Viabilidade técnica e regulatória

- **FATO, o problema central:** pelas reportagens sobre as regras do BC, no Pix Automático o **recebedor tem de ser pessoa jurídica**, e uma delas fala em pelo menos 6 meses de CNPJ ativo. [Agência Brasil, jun/2025](https://agenciabrasil.ebc.com.br/economia/noticia/2025-06/bc-publica-regras-para-evitar-fraudes-por-empresas-no-pix-automatico). O FAQ do Asaas confirma o requisito de CNPJ ativo há 6 meses ou mais para o Pix Automático. [Asaas docs](https://docs.asaas.com/docs/faq-2). **Consequência:** o locador pessoa física **não pode** receber Pix Automático na própria conta. Para usar o recurso, o recebedor teria de ser uma empresa (nós ou o provedor), o que é exatamente "segurar o dinheiro". O GeraContratos faz isso: recebe e repassa por Pix.
- **Tarifa do Pix Automático:** não encontrada para o Asaas nem para a Efí. O pagador não paga, e o recebedor paga o que negociar. [BCB FAQ](https://cdn-www.bcb.gov.br/content/estabilidadefinanceira/pix/pix-automatico-FAQ-participantes.pdf)
- **Alternativas sem custódia:** (a) cobrança em nome do locador, com conta Asaas ou Inter própria e integração por API. FATO: o boleto recorrente grátis do Inter aparece para MEI/PJ (100 por mês), e para PF não ficou claro. [Itatiaia](https://www.itatiaia.com.br/economia/negocios/inter-zera-tarifa-de-liquidacao-de-boletos-para-pmes-de-forma-ilimitada/) · [Inter](https://blog.inter.co/boleto-recorrente/). (b) **Pix com QR Code e chave do próprio locador + conciliação manual ("já paguei")**. É simples, não toca no dinheiro e não precisa de CNPJ, mas deixa de ser "automático".
- **Índices:** FATO: a API pública do BC (SGS) entrega JSON sem chave. IPCA é a série 433 e IGP-M a série 189 (variação mensal). [python-bcb](https://wilsonfreitas.github.io/python-bcb/sgs.html) · [TabNews](https://www.tabnews.com.br/SidneyBissoli/series-do-banco-central-como-consultar-o-sgs-a-focus-e-a-ptax-sem-cair-nas-armadilhas). É fácil de construir.
- **LGPD:** HIPÓTESE: guardamos CPF, renda, contrato e fotos do inquilino. Isso pede termo, base legal (execução de contrato) e armazenamento seguro. Não é um impeditivo, mas exige cuidado.
- **Fundador menor de 18 anos:** [NEED: confirmar] se Asaas e Efí aceitam conta e contrato de API de menor, ou de CNPJ com sócio menor. HIPÓTESE: precisaria de um responsável legal ou de emancipação.

## 5. Cliente ideal e mercado (bottom-up)

**ICP (HIPÓTESE):** locador pessoa física de 45 a 70 anos em Joinville/SC, com **3 a 15 imóveis residenciais**, aluguel de R$ 1.500 ou mais, que já paga carnê-leão e hoje usa planilha ou contador. Segundo ICP: o corretor que administra 20–150 contratos de forma informal.

| Métrica | Conta | Valor |
|---|---|---|
| **TAM** (Brasil) | 17,8 mi domicílios alugados × 45% direto (taxa do Rio aplicada ao Brasil, ASSUMPTION) ≈ 8,0 mi contratos × R$ 10/contrato/mês × 12 | **ESTIMATIVA ≈ R$ 960 mi/ano** |
| **SAM** (Joinville + região, contratos formais e aluguel ≥ R$ 1.500) | 168,5 mil moradores ÷ ~2,6 pessoas/domicílio (ASSUMPTION) ≈ 65 mil contratos × 45% direto ≈ 29 mil × ~30% formais e de valor médio/alto (ASSUMPTION) ≈ 9 mil contratos × R$ 120/ano | **ESTIMATIVA ≈ R$ 1 mi/ano** |
| **SOM** (12–24 meses) | 150 locadores × 3 contratos × R$ 15/contrato/mês × 12 | **ESTIMATIVA ≈ R$ 80 mil/ano** |

Para chegar a US$ 1 mi/ano (cerca de R$ 5,5 mi, câmbio ASSUMPTION) a R$ 45/mês por cliente, seriam necessários **cerca de 10 mil locadores pagantes**. Pela régua do idea-validator, isso é "Fraca/Moderada".

## 6. Por que alguém trocaria?

- **Contra a imobiliária (8–12%, ESTIMATIVA de [GeraContratos](https://geracontratos.com.br/recursos/calculadora-taxa-administracao-aluguel)):** num aluguel de R$ 2.000, a imobiliária custa R$ 160–240/mês. Software a R$ 30 economiza mais de R$ 130/mês. Só que o locador que paga imobiliária paga para **não ter trabalho** (visitas, vistoria, briga, despejo), e software não tira esse trabalho. Quem sai da imobiliária já é "do-it-yourself" e tende a pagar pouco.
- **Contra GeraContratos/Rentos:** o único ângulo que vejo é o **serviço local presencial em Joinville**: cadastro feito na visita, suporte por WhatsApp com uma pessoa e "nunca mais esqueça o reajuste". É uma diferença de atendimento, não de produto, e não se defende sozinha.
- **Contra a planilha:** a dor aparece uma vez por ano (reajuste) e uma vez por mês só se o inquilino atrasa. **HIPÓTESE:** a maioria aceita a planilha.

## 7. Teste de estresse: tentando matar a ideia

1. **"O recurso principal não funciona para pessoa física."** É o argumento mais forte (ver item 4). Sem Pix Automático, sobra lembrete + boleto/Pix comum, que o Rentos dá de graça para 1 imóvel.
2. **"Já existe, e mais barato."** GeraContratos (R$ 29,90) e Rentos (grátis para 1 imóvel) cobrem quase toda a lista, inclusive WhatsApp e carnê-leão. Não é um mercado vazio, é um mercado já atendido com preço baixo.
3. **Bancos.** A Cora está chegando com repasse automático (por enquanto para imobiliárias), e os bancos dão boleto/Pix de graça para PJ. **HIPÓTESE:** a cobrança vira uma função que o banco dá de graça.
4. **ARPA baixo × CAC de B2C.** Cliente com 1 a 3 imóveis paga R$ 30–60/mês. Visitar porta a porta um locador de 60 anos custa horas. Se cada venda levar 3 visitas, o CAC em tempo é alto para um ticket de R$ 360–720/ano.
5. **QuintoAndar e as imobiliárias** ficam com o locador que quer garantia. Com a inadimplência a ~3%, a "garantia" pesa mais que a "automação".
6. **O fundador.** Ser menor de idade complica contas de pagamento, contratos e a confiança de um locador de 60 anos que entrega dados financeiros.

**O que sobrevive:** a dor do reajuste esquecido e do carnê-leão é real e quantificável, e a API dos índices é grátis. Mas isso é uma **função**, não uma empresa.

## 8. Riscos e suposições (identify-assumptions)

| Categoria | Suposição | Confiança | Teste |
|---|---|---|---|
| Valor | Locador direto sente o reajuste e o carnê-leão como dor que vale pagar | Média | 15 entrevistas (Mom Test) com locadores de Joinville |
| Usabilidade | Locador 50+ consegue fazer o cadastro sozinho | Baixa | Cadastro assistido com 5 pessoas, cronometrado |
| Viabilidade | Paga R$ 30+/mês mesmo com o Rentos grátis | Baixa | Pré-venda de R$ 99/ano |
| Técnica | Cobrança automática sem custódia e sem CNPJ do locador | **Baixa** (o Pix Automático exige PJ) | Ligar para Asaas/Efí e perguntar sobre subconta PF |
| Ética/LGPD | Dados de inquilino tratados com segurança | Média | Revisão com advogado |
| GTM | Visitas e indicação de contadores trazem clientes | Baixa | Parceria com 3 contadores que fazem carnê-leão |
| Estratégia | Os bancos não vão dar isso de graça | Baixa | Acompanhar o lançamento da Cora |
| Time | Fundador menor consegue contratar provedores | Baixa | [NEED] termos do Asaas/Efí |

## Perguntas que matam a ideia

1. Por que um locador pagaria a você em vez de usar o Rentos (grátis) ou o GeraContratos (R$ 29,90)?
2. Como fazer cobrança "automática" para pessoa física sem receber o dinheiro numa conta sua?
3. Quantos locadores com 3 imóveis ou mais existem a até 20 km de você, e como você chega neles por menos de R$ 100 cada?

## Próximos 3 experimentos (antes de programar)

- **Entrevistas:** 15 locadores diretos, achados com contadores e anúncios "direto com o proprietário" na OLX. Custo: ~10 h, R$ 0. **Sinal:** 5 ou mais relatam reajuste esquecido ou pagam contador só pelo carnê-leão.
- **Serviço manual ("concierge"):** "eu faço seu reajuste e seu carnê-leão por R$ 49/mês", com planilha e WhatsApp, para 5 locadores. Custo: ~2 semanas. **Sinal:** 3 pagam o segundo mês.
- **Contadores como canal:** pergunte a 5 escritórios de Joinville se indicariam a ferramenta ou se pagariam por ela para os clientes locadores. **Sinal:** 1 contador com 20 ou mais locadores quer testar. Isso abre um pivô B2B (ver o item 1 de 01-problemas-brasil).

**Pivô sugerido, se insistir:** deixar o "SaaS de cobrança para locador" e oferecer um **serviço de reajuste + carnê-leão vendido via contadores**, ou uma função de reajuste e aviso **para corretores pequenos**. As duas opções são hipóteses ainda não validadas.

## Suposições e lacunas

ASSUMPTION: os 45% de contratos diretos do Rio valem para o Brasil e para Joinville · ASSUMPTION: ~2,6 pessoas por domicílio em Joinville · ASSUMPTION: 30% dos contratos diretos são formais e de valor médio/alto · ASSUMPTION: preço de R$ 10–15 por contrato/mês · [NEED] número de declarantes com renda de aluguel (Grandes Números IRPF) · [NEED] tarifa do Pix Automático e do boleto PF no Asaas e na Efí · [NEED] se a regra de CNPJ do Pix Automático continua igual em 2026 (texto normativo do BC) · [NEED] planos pagos do Rentos e avaliações de GeraContratos e Rentos · [NEED] se provedores aceitam conta de menor de idade · [NEED] percentual atual de administração do QuintoAndar.
