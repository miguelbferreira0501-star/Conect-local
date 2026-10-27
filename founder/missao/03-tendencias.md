# Tendências: o que mudou em 2025-2026 e abre espaço para um fundador solo no Brasil (27/10/2026)

**Como ler.** **FATO** = tem fonte com link e data. **ESTIMATIVA** = número de terceiros ou conta nossa, com a origem indicada. **HIPÓTESE** = opinião nossa, que precisa de teste.

**Limite da pesquisa.** Só busca na web; o proxy bloqueia gov.br e outros sites oficiais, então as fontes são imprensa, advogados e fornecedores (lidas pelos trechos). Nenhum texto oficial foi lido na íntegra: confira a norma antes de construir.

---

## Parte A: Tecnologia

### A1. Agentes de IA que fazem tarefas de várias etapas
- **O que mudou:** o METR mede a duração (em tempo humano) da tarefa que um agente completa em metade das tentativas. Em mar/2025 isso dobrava a cada ~7 meses (~50 min); na versão 1.1 (jan/2026), terceiros citam dobra em ~4 meses e 14 a 20 horas em fev-mar/2026. **ESTIMATIVA, de fontes secundárias:** [tracker ai2027](https://ai2027-tracker.com/predictions/metr-doubling/), [greaterwrong](https://www.greaterwrong.com/posts/EYb2K9acKfyG2bome/metr-time-horizons-now-10x-year).
- **Por que importa:** o agente já faz back-office de PME de ponta a ponta (conferir notas, conciliar extratos, preencher portais, cobrar), que antes custava um auxiliar administrativo. Quem paga: a PME, por mês ou por tarefa.
- **A vantagem some?** O agente sim. **HIPÓTESE:** fica o conhecimento do processo brasileiro (prefeitura, eSocial, Simples) e a base de clientes.

### A2. Multimodal (imagem, áudio, vídeo)
- **O que mudou:** modelos gerais leem foto de documento, tela e áudio de WhatsApp. **ESTIMATIVA:** Gemini 3.1 Pro marca ~90 no OmniDocBench ([ofox.ai, 2026](https://ofox.ai/blog/best-ai-model-for-ocr-2026/)). Comercialmente, o cliente brasileiro manda foto e áudio, e agora isso vira dado estruturado. Quem paga: prestadores, clínicas, contadores. A vantagem some (recurso comum); fica o fluxo pronto por nicho.

### A3. Voz com IA em português
- **O que mudou:** **ESTIMATIVA (fornecedores, jul/2026):** um agente de voz montado a partir de APIs (transcrição + modelo + voz) sai por US$ 0,007 a 0,091 por minuto ([Inworld](https://inworld.ai/resources/voice-agent-cost-per-minute-2026)). O speech-to-speech da OpenAI (gpt-realtime-2.1) sai por ~US$ 0,096/min ([ecorpit](https://ecorpit.com/gpt-realtime-2-1-voice-agents-reasoning-cost-build-guide-2026/)). **Não achamos dado específico de preço ou qualidade para português.**
- **Por que importa:** uma ligação de 3 minutos custa centavos, contra o custo de uma atendente. Ficam baratos agendamento, confirmação, cobrança e atendimento fora do horário.
- **A vantagem some?** O preço sim. **HIPÓTESE:** fica a qualidade de sotaque e vocabulário regional, que só se ganha testando.

### A4. Documentos, OCR e extração de dados
- **O que mudou:** **ESTIMATIVA (fornecedores, 2026):** o Mistral OCR custa US$ 2 a 5 por 1.000 páginas ([IntuitionLabs](https://intuitionlabs.ai/pdfs/mistral-ocr-vs-cohere-parse.pdf)). Modelos de visão acertam 90-97% dos campos de nota fiscal, contra 85-92% do OCR clássico. Mas inventam códigos que parecem plausíveis, então identificadores precisam de checagem ([parsli](https://parsli.co/blog/llm-ocr-vs-traditional-ocr), [dev.to](https://dev.to/aiengine/extract-pdf-tables-in-2026-hybrid-ocr-llm-beats-gpt-4o-vision-1dgm)).
- **Por que importa:** ler boleto, nota, contrato e laudo custava digitador ou software sob medida. Quem paga: contábeis, imobiliárias, clínicas.
- **A vantagem some?** Sim. O que fica é a validação, o encaixe no sistema do cliente e a responsabilidade pelo erro.

### A5. WhatsApp Business Platform
- **Preço (FATO, de fornecedores):** desde 1º/07/2025 a Meta cobra por mensagem de modelo entregue, e não mais por conversa de 24 horas. Utilidade é grátis dentro da janela de atendimento ([respond.io](https://respond.io/pt/help/whatsapp/whatsapp-pricing), [YCloud](https://www.ycloud.com/pt/blog/whatsapp-api-pricing-update)). **ESTIMATIVA:** em out/2026, marketing custa R$ 0,3217 e utilidade/autenticação R$ 0,035 por mensagem, com cobrança em reais desde jul/2026 ([DragApp](https://www.dragapp.com/pt-br/blog/api-oficial-do-whatsapp/), [MobileTime](https://www.mobiletime.com.br/?p=855437)).
- **Regra de IA (FATO):** a Meta proibiu chatbots de IA de uso geral na API a partir de 15/01/2026. Bots de atendimento e vendas continuam permitidos ([respond.io](https://respond.io/blog/whatsapp-general-purpose-chatbots-ban)). **No Brasil foi diferente:** o CADE investigou, e a Meta liberou bots de terceiros mediante cobrança de US$ 0,0625 por mensagem fora de modelo a partir de 11/03/2026 ([TechCrunch, 15/01/2026](https://techcrunch.com/2026/01/15/after-italy-whatsapp-excludes-brazil-from-rival-chatbot-ban), [ainews, 06/03/2026](https://ainews.us.com/2026/03/06/after-europe-whatsapp-will-let-rival-ai-companies-offer-chatbots-in-brazil/)).
- **Concorrência da própria Meta (FATO):** em jun/2026 a Meta ampliou o Meta Business Agent, seu agente de IA dentro do WhatsApp ([Startups.com.br](https://startups.com.br/negocios/big-techs/meta-amplia-ia-para-empresas-com-agentes-integrados-ao-whatsapp/)). Uma fonte única diz que respostas desse agente e conversas vindas de anúncio ficam isentas de cobrança ([TNH1, jul/2026](https://www.tnh1.com.br/tnh1-variedades/?p=30961)). **Não confirmado.**
- **Pagamentos (FATO):** a Cloud API permite enviar cobrança Pix dinâmica dentro da conversa, só para números brasileiros. A Meta não informa se o pagamento caiu, então é preciso um gateway próprio para confirmar ([360dialog](https://docs.360dialog.com/docs/messaging/payments/payments-api-brazil-only)). Cartão no chat foi descontinuado em jan/2026 ([Sinch](https://sinch.com/pt/blog/whatsapp-pay-noticias-estatisticas-desenvolvimento-pagamentos-moveis/)). Sobre Flows, nada novo encontrado.
- **Por que importa:** custo previsível, resposta dentro da janela quase grátis, cobrança sem sair do chat. A PME paga a Meta e o software.
- **A vantagem some?** **HIPÓTESE:** o bot genérico para PME vira produto da própria Meta. Sobrevive quem resolve um processo vertical (agenda + cobrança + nota) que a Meta não vai fazer.

### A6. Pix
- **Pix Automático (FATO):** está no ar desde 16/06/2025 e é voltado a débito recorrente sem cartão. O BC citou ~60 milhões de pessoas sem cartão de crédito como público ([FF News/EBANX](https://ffnews.com/newsarticle/paytech/ebanx-six-months-after-its-launch-recurring-pix-is-growing-at-41-per-month-unlocking-a-new-market-for-subscription-based-global-players/)). **ESTIMATIVA (EBANX, interessada no tema):** o volume cresce ~41% ao mês, e a Hotmart teve +32 pontos de retenção. Não achamos o total oficial do BC.
- **Pix por aproximação (FATO):** lançado em 28/02/2025 pela Jornada Sem Redirecionamento do Open Finance, chegou a 1 milhão de usuários em dois meses ([Portal IN, 28/04/2025](https://www.portalin.com.br/negocios/pix-por-aproximacao-alcanca-1-milhao-de-usuarios-em-dois-meses/)). O teto de R$ 500 por operação cai a partir de 1º/10/2026 ([Let's Money](https://www.letsmoney.com.br/noticias/bc-tira-limite-pix-aproximacao/)). Hoje só pessoa física pode ser pagadora.
- **Pix parcelado (FATO):** o BC desistiu de criar regras próprias em dez/2025 e cada banco faz o seu ([O Povo, 04/12/2025](https://www.opovo.com.br/noticias/economia/2025/12/04/apos-adiamentos-banco-central-desiste-de-regular-pix-parcelado.html)). Um "Pix Garantido" está em estudo, sem data.
- **Por que importa:** mensalidade de academia, escola ou contador passa a ser débito automático sem cartão nem boleto, cortando inadimplência e trabalho de cobrança. Paga o comerciante (tarifa do PSP + software).
- **A vantagem some?** Sim, quando gateways e ERPs oferecerem o Pix Automático. **HIPÓTESE:** a janela vai até 2027 em nichos que ainda cobram por boleto ou planilha.

### A7. Open Finance Brasil
- **O que mudou:** **ESTIMATIVA (dashboard oficial via terceiros):** 254 milhões de consentimentos ativos em ago/2026, +146% em 12 meses ([Let's Money](https://www.letsmoney.com.br/dados/of-consentimentos-ativos/)). A Zetta fala em ~240 milhões em jul/2026 ([Zetta/Poder360](https://static.poder360.com.br/uploads/2026/09/Zetta_2026_Open-Finance-no-Brasil_Final-1-1.pdf)). A adesão de empresas segue sendo o gargalo ([Let's Money](https://www.letsmoney.com.br/noticias/open-finance-cresce-no-brasil-mas-adesao-de-empresas-ainda-e-entrave/)).
- **Por que importa:** ler o extrato da PME com autorização dela (conciliação, caixa, crédito) não exige mais integração banco a banco. Paga a PME ou o contador. Atenção: o fundador solo precisa de uma instituição autorizada como parceira. A vantagem some em parte; fica o produto por nicho.

### A8. Preço das APIs de LLM
- **ESTIMATIVA:** a Epoch AI mede quedas de 9x a 900x por ano no preço para o mesmo desempenho ([Epoch](https://epoch.ai/data-insights/llm-inference-price-trends)); modelos de ponta seguem caros e modelos de raciocínio gastam mais tokens por tarefa. Torna viável atender PME que paga R$ 99/mês. Não é diferencial, é piso para todos.

### A9. Programação com IA
- **O que mudou:** **FATO:** 90% dos desenvolvedores usavam IA no trabalho em jan/2026, segundo a JetBrains, contra 85% em meados de 2025. Só ~31% usam agentes todo mês ([hashnode/JetBrains](https://hashnode.com/blog/state-of-vibe-coding-2026), [Tech Brew](https://www.techbrew.com/stories/2025/07/31/developers-ai-agents-stack-overflow)). **Não há dado confiável sobre o custo de construir.**
- **HIPÓTESE:** uma pessoa constrói e mantém um SaaS vertical que antes pedia uma equipe. A vantagem some totalmente: a barreira cai para os concorrentes também, e o diferencial vira distribuição e nicho.

---

## Parte B: Mercados em transição no Brasil (2026-2027)

### B1. Reforma tributária (CBS/IBS) e split payment
- **Datas (FATO, fontes secundárias):**
  - 2026: ano de teste, com CBS 0,9% e IBS 0,1% informados na nota e compensados.
  - 2027: CBS substitui PIS/Cofins.
  - IBS em alíquota de teste até 2028. ICMS e ISS caem gradualmente de 2029 a 2032.
  - Simples Nacional: preencher IBS/CBS na nota passa a ser obrigatório a partir de jan/2027 ([Jettax](https://www.jettax.com.br/blog/simples-nacional-e-mei-ibs-e-cbs-na-nota-fiscal-em-2026-entenda-as-regras/)).
  - A janela para o Simples escolher o regime regular de IBS/CBS no 1º semestre de 2027 foi de 1 a 30/09/2026 ([Meu Contador Online](https://www.meucontadoronline.com.br/blog/reforma-tributaria-em-2026/)).
  - Split payment: opcional em 2027, só entre empresas (B2B), e sem data para virar obrigatório ([NotaGateway](https://notagateway.com.br/blog/split-payment-sera-opcional-em-2027-ao-menos-inicialmente/), [Omie](https://www.omie.com.br/blog/adiamento-split-payment-reforma-tributaria/index.md)).
- **Quem é afetado:** todas as empresas. **FATO:** 26,3 milhões de CNPJs ativos em 2024, dos quais 23 milhões no Simples (6,7 milhões de ME/EPP e 16,3 milhões de MEI), segundo a Receita citada por [Contabilidade.com](https://contabilidade.com/blog/simples-nacional-2026-entenda-como-funciona-quem-pode-aderir-e-quais-sao-os-pros-e-contras/). Não há número oficial de 2026.
- **Necessidade que surge:** simular "fico no Simples ou vou para o regular?" (o crédito que o comprador B2B toma depende do regime do fornecedor; peso comercial é **HIPÓTESE**), revisar cadastro, preços e contratos longos.
- **Quem já atende:** ERPs (Omie, Bling, Conta Azul), emissores (NotaGateway, Tecnospeed) e contadores. **HIPÓTESE:** falta uma ferramenta simples, que fale a língua do dono, para a pergunta "quanto vou pagar e quanto o meu cliente perde".

### B2. NFS-e Nacional
- **Datas (FATO):** municípios obrigados a aderir desde 1º/01/2026 (LC 214/2025, art. 62). 1.472 municípios aderiram, cerca de 70% da arrecadação de serviços ([reformatributaria.com](https://www.reformatributaria.com/governo-informa-adesao-de-1-472-municipios-a-nfs-e-nacional/)). ME/EPP do Simples que prestam serviço com ISS devem usar o emissor nacional a partir de 1º/09/2026 (Res. CGSN 189/2026, DOU 28/04/2026) ([Fenacon](https://fenacon.org.br/noticias/emissor-nacional-da-nfs-e-passa-a-ser-obrigatorio-para-optantes-do-simples-nacional/)). Uma fonte fala em efeito adiado para 1º/11/2026 ([NotaGateway](https://notagateway.com.br/?p=12200)). **Divergência, confirmar.** O MEI já usa o emissor nacional desde 2023.
- **Quem é afetado:** prestadores de serviço do Simples (número exato não achado; teto de referência: 6,7 milhões de ME/EPP).
- **Necessidade e quem atende:** emitir nota automaticamente quando o pagamento cai, via API nacional única; hoje emissores, ERPs e o emissor gratuito. **HIPÓTESE:** com um padrão único, ficou barato montar "Pix recebido → NFS-e emitida → enviada ao cliente" para um nicho.

### B3. Fim da escala 6x1 (EC 141/2026)
- **Datas (FATO):** emenda promulgada em 16/10/2026 ([Band](https://www.band.com.br/nacional/brasil/congresso-oficializa-pec-que-acaba-com-escala-6x1-202610160836)). Pela imprensa, a transição começa em 16/12/2026, com jornada caindo de 44h para 42h e meta de 40h por volta de dez/2027. Quem presta serviço ao Estado tem 12 meses. Convenções coletivas têm 60 dias para se ajustar ([Meutudo](https://meutudo.com.br/blog/?p=292090), [SBT News](https://sbtnews.sbt.com.br/noticia/politica/pec-da-6x1-tera-no-maximo-9-artigos-diz-relator)). Texto oficial não lido.
- **Quem é afetado (FATO):** ~14,8 milhões de celetistas na escala 6x1, 33,2% dos vínculos, segundo o MTE ([Poder360](https://www.poder360.com.br/poder-economia/maioria-dos-celetistas-esta-no-5-x-2-mas-148-mi-seguem-no-6-x-1/)). A concentração é em comércio e serviços. Há um número do DIEESE de 26,8 milhões que não conseguimos verificar.
- **Necessidade que surge, já em dezembro:** refazer escalas, calcular custo de hora extra e contratação, controlar ponto e rever contratos, sobretudo em lojas, restaurantes, farmácias, supermercados e salões.
- **Quem já atende:** sistemas de ponto e escala (Tangerino, Pontomais e similares, não verificado) e contadores. **HIPÓTESE:** o pequeno varejo monta escala em papel ou planilha, e um simulador de escala 5x2 com custo, vendido pelo WhatsApp, tem urgência real de dez/2026 a mar/2027.

### B4. NR-1: riscos psicossociais
- **Datas (FATO):** fiscalização com multa a partir de 26/05/2026 (Portaria MTE 1.419/2024, adiada pela 765/2025). A dupla visita deixa de ser exigida por volta de ago/2026 ([contadores.cnt.br, 28/04/2026](https://contadores.cnt.br/projetos/25/noticias/tecnicas/2026/04/28/apos-adiamentos-nr-1-entra-em-fase-de-fiscalizacao-em-26-de-maio.html), [Barbieri](https://www.barbieriadvogados.com/?p=12849)). Multas seguem a NR-28. O MTE publicou manual (16/03/2026) e perguntas e respostas (06/05/2026) ([Findes](https://findes.com.br/wp-content/uploads/2026/05/Informe-Estrategico-–-MTE-publica-conteudo-Perguntas-e-respostas-sobre-o-Capitulo-1.5-da-NR-1.pdf)).
- **Quem é afetado:** empregadores com CLT de todos os portes, segundo as fontes. As regras simplificadas para ME/EPP não foram verificadas. **Não achamos o número de empresas.**
- **Necessidade e quem atende:** avaliar riscos, aplicar questionário, plano de ação e evidências no PGR; hoje consultorias de SST, clínicas ocupacionais e RH. **HIPÓTESE:** a PME de 5 a 50 funcionários paga a consultoria uma vez e fica sem rotina. Um produto barato de "questionário + plano + evidência mensal" tem espaço.

### B5. ECA Digital (Lei 15.211/2025)
- **Datas (FATO):** em vigor desde 17/03/2026. O Decreto 12.880/2026 saiu em 18/03, e as orientações preliminares da ANPD sobre aferição de idade em 20/03 ([Machado Meyer](https://www.machadomeyer.com.br/pt/inteligencia-juridica/publicacoes-ij/direito-digital/estatuto-digital-da-crianca-e-do-adolescente-lei-n-15-211-2025-entra-em-vigor-em-17-de-marco-de-2026), [Chambers](https://chambers.com/articles/eca-digital-é-regulamentado-e-anpd-publica-orientações-sobre-verificação-etária)). Autodeclaração de idade não vale. Multa de até 10% do faturamento, limitada a R$ 50 milhões por infração. Uma fonte diz que as sanções começam em nov/2026 e a fiscalização formal em jan/2027 ([Confidata](https://confidata.com.br/blog/eca-digital-o-que-muda-empresas)). **Divergência.**
- **Quem é afetado:** apps, jogos, lojas online, escolas e edtechs com usuário menor. Sem número.
- **Necessidade e quem atende:** aferir idade sem coletar dados demais, supervisão parental, avaliação de impacto; hoje advogados e fornecedores de KYC. **HIPÓTESE:** pequenos apps e escolas precisam de uma solução pronta e barata.

### B6. LGPD e ANPD
- **FATO:** a Lei 15.352/2026 tornou a ANPD agência reguladora (fev/2026); em jun/2026 ela enviou para sanção 21 órgãos e empresas que não responderam ofícios, e prioriza dados de saúde em 2026-2027 ([Turivius](https://turivius.com/portal/anpd-2026-fiscalizacao-lgpd/)). **ESTIMATIVA:** multas em dinheiro contra pequenas ainda são raras ([Confidata](https://confidata.com.br/blog/mapa-sancoes-anpd-todos-casos-2026)). Necessidade: encarregado, canal do titular e registro em clínicas e laboratórios; atendida por consultorias. **HIPÓTESE:** urgência média, só forte em saúde.

### B7. Mercado livre de energia para baixa tensão
- **Datas (FATO):** Lei 15.269/2025 e Decreto 13.097/2026 (13/08/2026). Comércio e indústria em baixa tensão podem migrar a partir de 25/11/2027. Residências e área rural a partir de 25/11/2028. O decreto cria o Supridor de Última Instância ([Agência iNFRA](https://agenciainfra.com/blog/decreto-fixa-abertura-do-mercado-livre-de-energia-para-novembro-de-2027/), [Mayer Brown](https://www.mayerbrown.com/pt/insights/publications/2026/08/decree-no-13097-2026-opening-of-the-free-electricity-market)).
- **Quem é afetado:** "milhões de unidades", sem número oficial encontrado; hoje ~77 mil estão no mercado livre (jun/2025) ([Cenário Energia](https://cenarioenergia.com.br/2025/05/27/brasil-bate-recorde-no-mercado-livre-de-energia-com-70-mil-consumidores-e-40-de-participacao-no-consumo-nacional/)).
- **Necessidade e quem atende:** comparar ofertas, decidir migrar, combinar com solar; hoje comercializadoras e gestoras. **HIPÓTESE:** o comparador independente para PME é oportunidade de 2027. Antes de nov/2027 não há demanda pagante.

### B8. Outros
- **Isenção de IR até R$ 5 mil (Lei 15.270/2025, desde jan/2026) (FATO):** ~15,6 milhões de beneficiados, segundo o DIEESE ([nota técnica](https://www.dieese.org.br/notatecnica/2026/notaTec290isencaoIR.pdf)). Dividendos acima de R$ 50 mil/mês têm 10% retido na fonte. **Necessidade:** dono de PME replanejar pró-labore e dividendos, via contador.
- **CNH sem autoescola (Contran, 01/12/2025) (FATO):** as aulas práticas mínimas caíram de 20 para 2 horas, e foi criado o instrutor autônomo ([O Povo](https://www.opovo.com.br/noticias/brasil/2025/12/01/contran-aprova-resolucao-que-retira-exigencia-de-autoescola-para-cnh.html)). **HIPÓTESE:** surge um mercado novo de instrutores autônomos que precisam de agenda, cobrança e captação de alunos.

---

## Síntese: onde a tecnologia barata encontra a obrigação nova (HIPÓTESE)

| Mudança | Janela | Por que um fundador solo pode competir |
|---|---|---|
| Fim da 6x1 + pequeno varejo | dez/2026 a 2027 | prazo curto, público grande (14,8 mi de vínculos), ferramentas atuais pensadas para empresa média |
| Reforma tributária no Simples (regime, nota, crédito) | 2027 em diante | é obrigatório, confuso, e o contador está sobrecarregado |
| WhatsApp + Pix Automático + NFS-e Nacional | já | três padrões nacionais baratos permitem o ciclo "cobrar, receber e emitir nota" por nicho |
| NR-1 psicossocial | já, com multa | obrigação contínua que a PME não sabe cumprir |
| Agentes, voz e extração de documentos | já | o custo marginal caiu tanto que um preço de R$ 99/mês dá margem |

**HIPÓTESE:** vantagem só de tecnologia some em 12-24 meses; dura nicho, distribuição (contadores, associações) e dados do processo do cliente.
