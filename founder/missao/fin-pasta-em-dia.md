# Finalista: "Pasta em Dia" — coleta de documentos para escritório contábil pelo WhatsApp

Data: 27/10/2026. Método: founder-competitors, market-sizing, identify-assumptions-new e idea-validator (com o scoring-rubric).

**Aviso de método:** o proxy bloqueou a abertura direta dos sites (erro ENOTFOUND em contadorflow, pastacontabil, acessorias.com e omie.com.br). Tudo abaixo vem de **trechos de busca**. Nenhum preço foi confirmado na página oficial do fornecedor. Também não houve entrevista com contador. Esta análise é uma hipótese bem informada, não uma validação.

Legenda: **FATO** (fonte e data) · **ESTIMATIVA** (número de terceiro ou conta minha) · **HIPÓTESE** (a testar).

---

## Veredito: ITERATE

A dor existe, volta todo mês e já tem gente pagando para resolver. Mas a ideia, como está, é "mais um" num espaço onde os líderes **já ligaram o WhatsApp**. Só vale seguir com uma cunha mais estreita (ver o fim do documento).

| Dimensão | Nota | Motivo em uma linha |
|---|---|---|
| Gravidade do problema | **Strong** | Acontece todo mês, consome horas e já tem gambiarra (grupo de WhatsApp + planilha) e ferramenta paga |
| Evidência de mercado | **Strong** | Vários concorrentes cobram por isso, e dois foram comprados por empresas grandes (Omie e Thomson Reuters) |
| Diferenciação | **Weak** | G-Click, Tareffa, Conta Azul e pelo menos uma startup já cobram documento pelo WhatsApp |
| Viabilidade técnica | **Moderate** | O MVP dá para fazer em semanas; o difícil é API oficial, verificação na Meta, LGPD e ler extrato bancário com precisão |
| Viabilidade do negócio | **Moderate** | Preço-teto em torno de R$ 100 a 150/mês; US$ 1 milhão por ano exige uns 3.000 escritórios |

---

## 1. Validação comercial: o contador já gasta com isso?

**Sim.** As provas:

- **FATO:** a Omie comprou a G-Click, ferramenta de gestão de tarefas para escritório contábil ([Omie](https://www.omie.com.br/blog/omie-anuncia-compra-da-gclick/); [Startupi, 2021](https://startupi.com.br/2021/10/omie-adquire-startup-que-oferece-ferramenta-web-de-gestao-para-escritorios-de-contabilidade/)). A Thomson Reuters comprou a Gestta em 26/04/2022 ([TR](https://www.thomsonreuters.com.br/pt/sala-de-imprensa/thomson-reuters-anuncia-aquisicao-de-gestta.html)). Empresa grande não compra categoria sem receita.
- **FATO (preço):** a página da Omie Store mostra o Omie.G-Click "a partir de R$ 100,00 por mês" ([Omie Store](https://store.omie.com.br/apps/omie-g-click), trecho de busca de out/2026).
- **FATO (preço, fonte fraca):** uma reclamação no Reclame Aqui contra a Acessórias cita mensalidade de **R$ 389,00** na contratação em 2023, com reajuste posterior. A empresa tem nota 6,4/10 em jan–jun/2026 e 90 reclamações listadas ([Reclame Aqui](https://www.reclameaqui.com.br/empresa/acessorias-com/lista-reclamacoes)).
- **FATO (preço de outro produto):** apareceu um "Gestta" a R$ 127/mês em [gesttaapp.com.br](https://gesttaapp.com.br/), que se apresenta como "gestão para pequenos negócios". **HIPÓTESE:** não é a Gestta da Thomson Reuters. Não usei esse número.
- **FATO:** o Nibo cobra por CNPJ ativo. Um site comparativo diz "R$ 64+/mês" por CNPJ ([planilhadefluxo](https://www.planilhadefluxo.com.br/alternativa/nibo)). O número é de terceiro e pode estar velho.
- **Sem preço público:** Questor/Tareffa ("sob consulta", segundo o [B2Bstack](https://www.b2bstack.com.br/compare/questor-cloud-vs-contabilizei)), Onvio Processos, Zap Contábil, WhatsContábil, Pasta Contábil, ContadorFlow e Ultradocs. [NEED: preço real, por ligação ou demonstração.]
- **Quantos escritórios usam cada um:** nenhuma fonte trouxe esse número. [NEED.]
- **FATO (o tempo gasto):** numa pesquisa de 2020 com 258 contadores, "receber os documentos no prazo" foi a 2ª maior dificuldade, citada por 21,7% ([Jornal Contábil](https://jornalcontabil.com.br/noticia/contador-nova-rotina-em-tempos-de-pandemia/amp/)). ESTIMATIVA de fornecedor: de 6 a 10 horas por mês com lembretes num escritório de 80 clientes (ver 01-problemas-brasil.md).

## 2. Cliente ideal (ICP)

- **Quem compra:** o dono ou dona de um escritório contábil com 1 a 5 pessoas e **50 a 150 CNPJs**, quase todos no Simples Nacional (serviço e comércio pequeno), que fazem também a folha.
- **Situação hoje:** **não usa** G-Click, Acessórias nem Tareffa. Cobra documento por WhatsApp, num celular só ou no WhatsApp Business com etiquetas, e controla tudo numa planilha ou de cabeça. Usa um sistema contábil (Domínio, Alterdata, Questor etc.) só para a escrituração.
- **Gatilho de compra:** os dias 1 a 10 do mês, quando falta extrato e nota, e os picos da reforma tributária e da NFS-e nacional.
- **Quem não é ICP:** o escritório que já paga ferramenta de gestão (troca cara), o MEI contador com menos de 20 clientes (não paga) e o escritório com mais de 300 clientes (quer integração e compra por licitação interna).
- **Base:** FATO: 42% dos escritórios têm de 1 a 3 funcionários, segundo pesquisa da HubCount com o Portal Contábeis com mais de 700 escritórios ([Contábeis](https://www.contabeis.com.br/noticias/60322/pesquisa-revela-perfil-do-mercado-contabil-e-escritorios-no-pais/)). A parte "não usa ferramenta" é **HIPÓTESE**. [NEED: % de escritórios pequenos sem software de gestão.]

## 3. Tamanho do mercado (de baixo para cima, em reais)

**Entradas:**
- FATO: 100.037 organizações contábeis ativas em ago/2025 (CFC, citado pelo [BNE](https://www.bne.com.br/blog/sao-paulo-e-o-estado-com-mais-oportunidades-para-contadores-segundo-bne)).
- FATO: na pesquisa da HubCount, 28% têm até 20 clientes e 20% têm de 20 a 50 ([Contábeis](https://www.contabeis.com.br/noticias/60322/pesquisa-revela-perfil-do-mercado-contabil-e-escritorios-no-pais/)). No Sescon-SP 2024, só em SP, 17% têm até 50, 21% têm de 51 a 100, 15% de 101 a 150, 16% de 151 a 200, 17% de 201 a 300 e 15% mais de 300 ([Contábeis](https://www.contabeis.com.br/noticias/67687/estudo-do-sescon-sp-revela-tendencias-de-cobrancas-e-porte-dos-escritorios-contabeis/)). As duas amostras são voluntárias e não batem entre si.
- HIPÓTESE de preço: R$ 149/mês. Fica entre o G-Click (a partir de R$ 100) e a Acessórias (R$ 389 relatado).

| Camada | Conta | Valor por ano |
|---|---|---|
| **TAM** (todo escritório no Brasil) | 100 mil × R$ 149 × 12 | **≈ R$ 179 milhões** (ESTIMATIVA) |
| **SAM** (de 30 a 300 clientes; uns 50%, juntando as duas pesquisas) | 50 mil × R$ 149 × 12 | **≈ R$ 89 milhões** (ESTIMATIVA, confiança baixa) |
| SAM sem quem já tem ferramenta (HIPÓTESE: metade) | 25 mil × R$ 1.788 | ≈ R$ 45 milhões |
| **SOM em 3 anos** (fundador solo, vendendo por WhatsApp e visita a partir de SC) | de 100 a 300 escritórios | **≈ R$ 180 mil a R$ 540 mil** (HIPÓTESE) |

De cima para baixo: não achei relatório de mercado de "software para contador" com número confiável. [NEED.] Para crescer, ajudam a reforma tributária, que aumenta o trabalho de 2026 a 2027, e a IA que lê documento a custo baixo. Contra, pesa a consolidação: Omie e Thomson Reuters empacotam a coleta "de graça" dentro da suíte.

## 4. Comparação com os concorrentes

| Concorrente | Tipo | Preço | O que faz no WhatsApp | Ponto fraco |
|---|---|---|---|---|
| **Omie.G-Click** | Direto | a partir de R$ 100/mês ([Omie Store](https://store.omie.com.br/apps/omie-g-click)) | FATO: em 09/12/2025 lançou integração com a WhatsContábil "para solicitar e enviar documentos" pelo WhatsApp; também integra Digisac e Zap Contábil ([Ajuda Omie](https://ajuda.omie.com.br/pt-BR/articles/15213088-omie-g-click-vocepode-lancamento-de-novidades-radar-financeiro-integracao-whatscontabil-09-12-2025)) | Exige contratar **outra** ferramenta de WhatsApp; é uma suíte de tarefas, não um coletor |
| **Questor Tareffa** | Direto | sob consulta | FATO: tem um processo modelo de "cobrança de arquivos" que avisa o cliente por e-mail ou WhatsApp, com página para anexar e lembretes ([Questor](https://docs.questor.com.br/pt-br/Produtos/Tareffa/gestao-processos/proc-modelo-cobranca)) | O cliente sai do WhatsApp e vai para um portal. HIPÓTESE: não confere o conteúdo do arquivo |
| **Acessórias** | Direto | R$ 389/mês relatado (Reclame Aqui) | Área VIP e app com a marca do escritório ([Fenacon](https://fenacon.org.br/noticias/acessorias-e-o-novo-parceiro-do-clube-fenacon/)) | Reclamações de reajuste e de dificuldade para cancelar (Reclame Aqui, 2026) |
| **Ultradocs** | Direto, nativo do WhatsApp | não achei | FATO (só um trecho de busca): "automatiza a coleta, validação e organização de documentos direto no WhatsApp", com a assistente de IA "Lia"; coletas recorrentes aparecem "em breve" ([ultradocs.ai](https://ultradocs.ai/)) | Uma segunda busca não achou mais nada. Parece novo e pequeno. **É a mesma ideia** |
| **Conta Azul (Conta AI Captura)** | Indireto | só no plano Pro | recebe documento por WhatsApp ou e-mail e sugere o lançamento ([RDD](https://www.robertodiasduarte.com.br/conta-ai-captura-automacao-inteligente-para-gestao-contabil/)) | Só funciona se o cliente do contador usa a Conta Azul |
| **Nibo Obrigações** | Indireto | cerca de R$ 64 por CNPJ (terceiro) | app do cliente avisa quais documentos faltam ([Nibo ajuda](https://intercom.help/niboajuda/pt-BR/articles/6988406-nibo-impressora)) | Caro por CNPJ; o cliente precisa instalar o app |
| **WhatsApp + planilha** | Substituto | grátis | tudo manual | Leva horas, perde arquivo e expõe a LGPD (celular pessoal, grupo de WhatsApp) |

**Por que um escritório trocaria?** Só o escritório **que hoje usa WhatsApp e planilha**. Ele trocaria por três motivos: (a) o cliente dele manda tudo pelo WhatsApp sem login nem app; (b) a IA diz "esse é o extrato do Itaú de setembro, falta o do Sicoob"; (c) custa menos que uma suíte e entra em um dia. Quem já paga G-Click ou Tareffa **não troca** por isso. No máximo pede ao fornecedor atual o mesmo recurso (HIPÓTESE forte).

## 5. Viabilidade técnica do MVP

- **API oficial do WhatsApp:** ESTIMATIVA (fornecedores, tabela de 01/10/2026): utilidade custa **R$ 0,035** por mensagem e marketing **R$ 0,3217**, com cobrança em reais desde jul/2026 ([ChatMaxima](https://chatmaxima.com/pt-br/whatsapp-api-pricing/brazil/), [DragApp](https://www.dragapp.com/pt-br/blog/api-oficial-do-whatsapp/)). Há conflito: uma fonte diz que utilidade dentro da janela de 24 horas continua grátis ([Kommo](https://support.kommo.com/docs/updated-pricing-rules-for-whatsapp-business.md)), e outra diz que, desde 01/10/2026, passou a ser cobrada ([Zenvia](https://zenvia.movidesk.com/kb/en/article/600343/frequently-asked-questions-new-whatsapp-business-pricing-rules-2)). [NEED: conferir na tabela da Meta.]
  - Conta minha (ESTIMATIVA): 100 clientes × 4 lembretes por mês × R$ 0,035 = **R$ 14/mês** por escritório. É barato, desde que o modelo de mensagem continue na categoria utilidade.
  - **Regra de risco (FATO, fornecedores):** a Meta reclassifica sozinha um modelo de utilidade como marketing quando o texto tem tom promocional ou é genérico ([WANotifier](https://help.wanotifier.com/en/article/whatsapp-utility-templates-getting-recategorized-to-marketing-heres-the-fix-xjz06j/), [Wati](https://support.wati.io/en/articles/15932488-best-practices-to-reduce-whatsapp-utility-to-marketing-template-reclassification)). Como marketing, o custo sobe cerca de 9 vezes.
  - **Arquitetura:** um número por escritório (o cliente reconhece o nome do contador) significa uma conta e uma verificação na Meta para cada escritório, via um provedor oficial (BSP). Isso dá atrito no cadastro. A alternativa é um número único da "Pasta em Dia", que custa menos confiança.
  - **Bot com IA:** no Brasil, chatbot de terceiros continua liberado, mas mensagem fora de modelo custa US$ 0,0625 desde 11/03/2026 (ver 03-tendencias.md). O MVP deve usar só modelos e o link, sem conversa livre.
- **OCR e IA por documento:** ESTIMATIVA: Mistral OCR custa de US$ 2 a 5 por 1.000 páginas (03-tendencias.md). Com 100 clientes × 10 páginas por mês, isso dá menos de US$ 5/mês por escritório. Classificar o tipo de documento, o CNPJ e a competência com um modelo de visão também deve custar centavos. **Risco:** o modelo pode inventar um CNPJ ou uma data que parece certa. A conferência tem de ser por regra (dígito verificador do CNPJ, CNPJ igual ao do cadastro). Extrato bancário em PDF muda de banco para banco.
- **Armazenamento:** S3 ou R2, região Brasil de preferência, com criptografia e links que expiram. O custo é desprezível (ESTIMATIVA).
- **LGPD:** FATO (blogs do setor): o cliente costuma ser o controlador, o escritório o operador, e as ferramentas usadas pelo escritório são suboperadoras. Operador e controlador podem responder juntos por um vazamento ([Confidata](https://confidata.com.br/blog/lgpd-contadores-escritorios-contabeis)). A folha traz CPF, PIS e salário. O que isso exige: contrato de tratamento de dados (DPA), registro de acesso, política de retenção, apagar a pedido, e cuidado com dado enviado à API de IA (sem uso para treino). **Para um fundador menor de idade, isso é sério:** quem assina o DPA e responde por um vazamento? HIPÓTESE: é preciso um CNPJ em nome de um responsável legal, ou emancipação.
- **Dependências:** Meta (preço, categoria do modelo, bloqueio de número), o BSP, o provedor de IA e o provedor de nuvem. O MVP (link sem login, lembretes, painel, classificação) dá para fazer **em 4 a 6 semanas** com IA ajudando a programar (ESTIMATIVA).

## 6. Teste de estresse: por que NÃO construir

1. **Os grandes já fizeram.** G-Click e WhatsContábil (dez/2025), Tareffa com aviso por WhatsApp e página de upload, Conta Azul capturando documento pelo WhatsApp, e o Ultradocs fazendo exatamente "coleta + validação com IA no WhatsApp". A única diferença que sobra ("sem login, a IA confere o arquivo") um concorrente copia em uma sprint. **Este é o argumento mais forte contra.**
2. **O gargalo é comportamento, não ferramenta.** O cliente atrasa porque não tem o extrato, não liga ou tem medo do imposto, não porque faltou um link. Lembrete automático pode virar mais uma mensagem ignorada. Não há dado público sobre quantos clientes abrem esses links. [NEED.] (Num outro setor, um estudo não viu efeito de lembrete por WhatsApp sobre faltas em consultas, ver 01-problemas-brasil.md.)
3. **Teto de preço baixo.** O escritório pequeno cobra pouco por cliente. ESTIMATIVA: honorários online a partir de R$ 90 a 150 por empresa ([Contabilidade.com](https://contabilidade.com/blog/quanto-custa-a-contabilidade-online-guia-de-precos-e-o-que-esta-incluso/)). Pagar R$ 149 por uma ferramenta "só de coleta" compete com uma suíte que faz coleta e mais.
4. **Churn.** HIPÓTESE: o escritório testa no pico, organiza os clientes e volta ao WhatsApp manual quando vê que 30% continuam sem mandar nada. Sem integração com o sistema contábil, a ferramenta é fácil de largar.
5. **Resistência do contador.** Um consultor do setor recomenda tirar o documento do WhatsApp e levar para um portal oficial, por causa da LGPD ([RDD](https://www.robertodiasduarte.com.br/?p=115144)). Parte do público vê o "documento no WhatsApp" como o problema, não como a solução.
6. **Meta.** Reclassificação do modelo, bloqueio de número por denúncia de cliente que se irritou com lembrete e mudanças de preço quase todo semestre em 2025–2026.
7. **Fundador.** Vender para contador exige confiança e responder por dados financeiros. Um fundador com menos de 18 anos, sozinho, enfrenta objeção de credibilidade e de contrato.

**Tentativa de matar a ideia, resultado:** os argumentos 1 e 2 juntos **quase** matam a ideia. Ela não morre porque a maioria dos escritórios pequenos (HIPÓTESE) ainda não paga nenhuma suíte, e a dor está provada.

## 7. Raciocínio por dimensão (idea-validator)

**Gravidade do problema: Strong.** A dor volta todo mês, nos dias 1 a 10, e afeta a entrega de obrigações com multa. Já existem gambiarras (grupo por cliente, etiquetas, planilha) e ferramentas pagas. Foi a 2ª maior dificuldade numa pesquisa de 2020 (21,7%). Ressalva: o dado de horas gastas vem de fornecedor, e o dado de pesquisa tem 6 anos.

**Evidência de mercado: Strong.** Há várias empresas cobrando, duas compradas por grupos grandes, e preços entre R$ 100 e R$ 389/mês. O que falta é saber quantos escritórios usam e o preço oficial, por isso é um Strong com ressalva.

**Diferenciação: Weak.** "Coleta pelo WhatsApp com IA" já é anunciada pelo Ultradocs e montada pelo G-Click com parceiros. "Sem login" e "a IA confere período e CNPJ" são melhorias de experiência de uso, não algo que se defenda. Não há efeito de rede nem dado exclusivo. A única cunha possível é o segmento (escritório pequeno sem suíte) e o preço.

**Viabilidade técnica: Moderate.** O MVP sai em semanas com API, OCR e IA comprados prontos. A parte difícil: verificação na Meta e conta por escritório, manter o modelo como utilidade, ler bem extratos de dezenas de bancos, e LGPD com contrato assinado. O dono da conta precisa ser maior de idade ou ter CNPJ.

**Viabilidade do negócio: Moderate.** Margem bruta alta: o custo variável fica abaixo de R$ 50 por escritório por mês (ESTIMATIVA). Mas US$ 1 milhão por ano (cerca de R$ 5,4 milhões; câmbio é ESTIMATIVA) a R$ 149/mês pede uns 3.000 escritórios, pouco mais de 1% do SAM. Para chegar lá, vender visita a visita ou por WhatsApp não basta. O caminho seria canal com Sescon, CRC ou fornecedores de sistema contábil.

## 8. Premissas de maior risco (identify-assumptions-new)

| Categoria | Premissa | Confiança | Teste |
|---|---|---|---|
| Valor | O cliente do contador manda **mais e mais cedo** quando recebe um link sem login | Baixa | Piloto com 1 escritório e 30 clientes: % de envio até o dia 5, antes e depois |
| Valor | A IA identifica o tipo, o CNPJ e o mês com mais de 95% de acerto | Média | Rodar 200 documentos reais anonimizados |
| Usabilidade | O contador configura 100 clientes em menos de 1 hora | Média | Importar planilha ou CSV no piloto |
| Viabilidade | Escritório sem suíte paga R$ 99 a 149/mês | Baixa | Pré-venda com 10 escritórios de Joinville |
| Viabilidade | Lembrete continua como utilidade, a R$ 0,035 | Média | Aprovar 3 modelos de mensagem num BSP |
| Técnica | Dá para ler extrato de Sicoob, Viacredi, BB, Itaú e Nubank em PDF ou OFX | Média | Teste com amostras |
| Ética e LGPD | Dados de folha e extrato podem ser tratados com segurança por um fundador solo | Baixa | DPA revisado por advogado; criptografia; não usar dados para treino |
| Mercado (GTM) | Contador de Joinville atende visita de fundador jovem | Média | 15 visitas ou mensagens em 2 semanas |
| Estratégia | G-Click e Tareffa não baixam preço nem empacotam isso para o pequeno em 12 meses | Baixa | Acompanhar as notas de lançamento deles |
| Equipe | Um fundador solo dá conta de suporte no pico (dias 1 a 10) | Baixa | Medir chamados no piloto |

## 9. Perguntas que podem matar a ideia

1. Entre 20 escritórios pequenos de Joinville, quantos **não** usam G-Click, Acessórias, Tareffa, Nibo ou Onvio? Quanto pagariam?
2. Quando o cliente recebe um lembrete com link, a taxa de envio no prazo sobe de verdade, ou o atraso é de comportamento?
3. Qual é a cunha que o G-Click não copia em um trimestre? Por exemplo: ler o extrato e já entregar o OFX conciliado, ou o preço por CNPJ para escritórios de 30 a 80 clientes.

## 10. Próximos 3 experimentos (antes de programar)

- **Experimento:** 15 conversas (visita ou WhatsApp) com escritórios de Joinville, seguindo o estilo do Mom Test: "como foi a cobrança de documentos no mês passado? Que ferramenta você paga?" **Custo:** 2 semanas, R$ 0. **Sinal:** mais de 8 sem suíte e mais de 5 dizendo que gastam mais de 5 horas por mês fortalecem a ideia. A maioria já com G-Click ou Tareffa e satisfeita a enfraquece muito.
- **Experimento:** piloto "concierge" com 1 escritório e 30 clientes durante um ciclo. Lembretes do WhatsApp Business manual, link de um Google Form ou upload simples, e conferência feita à mão. **Custo:** 1 mês, cerca de R$ 0 a 50. **Sinal:** % de clientes que mandam tudo até o dia 5, contra o mês anterior. Ganho abaixo de 15 pontos percentuais indica que o gargalo é comportamento.
- **Experimento:** pré-venda de R$ 99/mês para os 3 primeiros meses, com Pix antecipado, para os escritórios das conversas. **Custo:** 1 semana. **Sinal:** 3 ou mais pagando significa construir o MVP; 0 significa STOP.

**Pivô sugerido (por que ITERATE e não GO):** deixar de lado a ideia de "painel de quem mandou", que todo mundo tem, e testar uma de duas cunhas. (a) **Extrato bancário pronto para importar**: coleta pelo WhatsApp, conversão para OFX ou planilha e conferência do saldo, o que tira trabalho do contador depois da coleta. (b) **Plano barato por CNPJ para o escritório de 30 a 80 clientes sem suíte**, vendido em SC por visita.

## Premissas e lacunas

- [NEED: preço oficial de Acessórias, G-Click, Tareffa, Onvio, Zap Contábil, WhatsContábil, Pasta Contábil, ContadorFlow e Ultradocs.]
- [NEED: número de escritórios clientes de cada concorrente.]
- [NEED: % de escritórios pequenos sem software de gestão.]
- [NEED: tabela oficial da Meta em reais e a regra da janela de 24 horas após 01/10/2026.]
- [NEED: dado de quantos clientes abrem os links de lembrete.]
- ASSUMPTION: preço de R$ 149/mês; 50% dos escritórios entre 30 e 300 clientes; metade sem suíte; câmbio de cerca de R$ 5,4 por dólar; custo de IA abaixo de US$ 5 por escritório por mês.
- ASSUMPTION: o "Gestta" de R$ 127 não é a Gestta da Thomson Reuters.
- ASSUMPTION: o fundador menor de idade precisa de um responsável legal ou de CNPJ para a verificação na Meta e para o DPA.
