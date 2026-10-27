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

- **FATO:** a Omie comprou a G-Click, ferramenta de gestão de tarefas para escritório contábil ([Omie](https://www.omie.com.br/blog/omie-anuncia-compra-da-gclick/); [Startupi, 2021](https://startupi.com.br/2021/10/omie-adquire-startup-que-oferece-ferramenta-web-de-gestao-para-escritorios-de-contabilidade/)). A Thomson Reuters comprou a Gestta em 26/04/2022 ([TR](https://www.thomsonreuters.com.br/pt/sala-de-imprensa/thomson-reuters-anuncia-aquisicao-de-gestta.html)). Isso indica que a categoria tem receita.
- **FATO (preço):** a página da Omie Store mostra o Omie.G-Click "a partir de R$ 100,00 por mês" ([Omie Store](https://store.omie.com.br/apps/omie-g-click), trecho de busca de out/2026).
- **FATO (preço, fonte fraca):** uma reclamação no Reclame Aqui contra a Acessórias cita mensalidade de **R$ 389,00** na contratação em 2023, com reajuste posterior. A empresa tem nota 6,4/10 em jan–jun/2026 e 90 reclamações listadas ([Reclame Aqui](https://www.reclameaqui.com.br/empresa/acessorias-com/lista-reclamacoes)).
- **FATO:** o Nibo cobra por CNPJ ativo. Um site comparativo diz "R$ 64+/mês" por CNPJ ([planilhadefluxo](https://www.planilhadefluxo.com.br/alternativa/nibo)). O número é de terceiro e pode estar velho.
- **Sem preço público:** Questor/Tareffa ("sob consulta", segundo o [B2Bstack](https://www.b2bstack.com.br/compare/questor-cloud-vs-contabilizei)), Onvio Processos, Zap Contábil, WhatsContábil, Pasta Contábil, ContadorFlow e Ultradocs. Nenhuma fonte diz quantos escritórios usam cada um. [NEED: ligar ou pedir demonstração.]
- **FATO (o tempo gasto):** numa pesquisa de 2020 com 258 contadores, "receber os documentos no prazo" foi a 2ª maior dificuldade, citada por 21,7% ([Jornal Contábil](https://jornalcontabil.com.br/noticia/contador-nova-rotina-em-tempos-de-pandemia/amp/)). ESTIMATIVA de fornecedor: de 6 a 10 horas por mês com lembretes num escritório de 80 clientes (ver 01-problemas-brasil.md).

## 2. Cliente ideal (ICP)

- **Quem compra:** o dono ou dona de um escritório contábil com 1 a 5 pessoas e **50 a 150 CNPJs**, quase todos no Simples Nacional (serviço e comércio pequeno), que fazem também a folha.
- **Situação hoje:** **não usa** G-Click, Acessórias nem Tareffa. Cobra documento por WhatsApp, num celular só ou no WhatsApp Business com etiquetas, e controla tudo numa planilha ou de cabeça. Usa sistema contábil só para escrituração.
- **Gatilho de compra:** os dias 1 a 10 do mês, quando falta extrato e nota, e os picos da reforma tributária e da NFS-e nacional.
- **Quem não é ICP:** quem já paga uma suíte, quem tem menos de 20 clientes e quem tem mais de 300.
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
| **Ultradocs** | Direto, nativo do WhatsApp | não achei | FATO (só um trecho de busca): "automatiza a coleta, validação e organização de documentos direto no WhatsApp", com a assistente de IA "Lia"; coletas recorrentes aparecem "em breve" ([ultradocs.ai](https://ultradocs.ai/)) | Pouco rastro público, parece pequeno. **É a mesma ideia** |
| **Conta Azul (Conta AI Captura)** | Indireto | só no plano Pro | recebe documento por WhatsApp ou e-mail e sugere o lançamento ([RDD](https://www.robertodiasduarte.com.br/conta-ai-captura-automacao-inteligente-para-gestao-contabil/)) | Só funciona se o cliente do contador usa a Conta Azul |
| **Nibo Obrigações** | Indireto | cerca de R$ 64 por CNPJ (terceiro) | app do cliente avisa quais documentos faltam ([Nibo ajuda](https://intercom.help/niboajuda/pt-BR/articles/6988406-nibo-impressora)) | Caro por CNPJ; o cliente precisa instalar o app |
| **WhatsApp + planilha** | Substituto | grátis | tudo manual | Leva horas, perde arquivo e expõe a LGPD (celular pessoal, grupo de WhatsApp) |

**Por que um escritório trocaria?** Só o escritório **que hoje usa WhatsApp e planilha**. Ele trocaria por três motivos: (a) o cliente dele manda tudo pelo WhatsApp sem login nem app; (b) a IA diz "esse é o extrato do Itaú de setembro, falta o do Sicoob"; (c) custa menos que uma suíte e entra em um dia. Quem já paga G-Click ou Tareffa **não troca** por isso. No máximo pede ao fornecedor atual o mesmo recurso (HIPÓTESE forte).

## 5. Viabilidade técnica do MVP

- **WhatsApp (API oficial):** ESTIMATIVA (fornecedores, tabela de 01/10/2026): utilidade custa **R$ 0,035** por mensagem e marketing **R$ 0,3217**, com cobrança em reais desde jul/2026 ([ChatMaxima](https://chatmaxima.com/pt-br/whatsapp-api-pricing/brazil/), [DragApp](https://www.dragapp.com/pt-br/blog/api-oficial-do-whatsapp/)). As fontes divergem sobre a utilidade continuar grátis dentro da janela de 24 horas depois de 01/10/2026 ([Kommo](https://support.kommo.com/docs/updated-pricing-rules-for-whatsapp-business.md) contra [Zenvia](https://zenvia.movidesk.com/kb/en/article/600343/frequently-asked-questions-new-whatsapp-business-pricing-rules-2)). Conta minha: 100 clientes × 4 lembretes × R$ 0,035 ≈ **R$ 14/mês** por escritório.
- **Regras da Meta (FATO, fornecedores):** a Meta reclassifica sozinha um modelo de utilidade como marketing quando o texto soa promocional ou genérico ([WANotifier](https://help.wanotifier.com/en/article/whatsapp-utility-templates-getting-recategorized-to-marketing-heres-the-fix-xjz06j/)). Nesse caso o custo sobe cerca de 9 vezes. Bot de IA conversando fora de modelo custa US$ 0,0625 por mensagem no Brasil desde 11/03/2026 (03-tendencias.md), então o MVP deve usar só modelo e link. Um número por escritório exige verificar uma conta na Meta para cada um via BSP, o que gera atrito.
- **OCR e IA:** ESTIMATIVA: Mistral OCR custa de US$ 2 a 5 por 1.000 páginas (03-tendencias.md), ou seja, menos de US$ 5/mês por escritório. Risco: o modelo inventa um CNPJ ou uma data que parece certa. A conferência tem de ser por regra (dígito do CNPJ igual ao do cadastro). Extrato em PDF muda de banco para banco.
- **Armazenamento:** S3 ou R2, criptografado, com link que expira. Custo desprezível (ESTIMATIVA).
- **LGPD:** FATO (blogs do setor): o cliente costuma ser o controlador, o escritório o operador e a ferramenta um suboperador. Todos podem responder juntos por um vazamento ([Confidata](https://confidata.com.br/blog/lgpd-contadores-escritorios-contabeis)). A folha traz CPF, PIS e salário. É preciso DPA, registro de acesso, prazo de retenção e garantia de que a IA não treina com os dados. **HIPÓTESE:** um fundador menor de idade precisa de CNPJ em nome de um responsável legal para assinar o DPA e passar na verificação da Meta.
- **Prazo:** link sem login, lembretes, painel e classificação saem em 4 a 6 semanas com IA ajudando a programar (ESTIMATIVA).

## 6. Teste de estresse: por que NÃO construir

1. **Os grandes já fizeram (o argumento mais forte).** G-Click com WhatsContábil (dez/2025), Tareffa com aviso por WhatsApp e upload, Conta Azul capturando pelo WhatsApp, e o Ultradocs anunciando exatamente "coleta + validação com IA no WhatsApp". O que sobra de diferença, um concorrente copia em uma sprint.
2. **O gargalo pode ser comportamento.** O cliente atrasa porque não tem o extrato ou não liga, não por falta de link. Não há dado público de quantos clientes abrem esses links [NEED]. Num estudo de outro setor, lembrete por WhatsApp não reduziu faltas em consultas (01-problemas-brasil.md).
3. **Teto de preço.** ESTIMATIVA: a contabilidade online cobra a partir de R$ 90 a 150 por empresa ([Contabilidade.com](https://contabilidade.com/blog/quanto-custa-a-contabilidade-online-guia-de-precos-e-o-que-esta-incluso/)). Uma ferramenta "só de coleta" a R$ 149 disputa com suítes que fazem coleta e muito mais.
4. **Churn (HIPÓTESE).** O escritório testa no pico e volta ao manual quando 30% dos clientes continuam sem mandar. Sem integração com o sistema contábil, é fácil largar.
5. **Resistência.** Um consultor do setor recomenda tirar o documento do WhatsApp e levar para um portal, por causa da LGPD ([RDD](https://www.robertodiasduarte.com.br/?p=115144)).
6. **Meta e fundador.** A Meta reclassifica modelos, bloqueia números denunciados e mudou o preço quase todo semestre. E um fundador menor de idade, sozinho, cuidando de dados financeiros, enfrenta objeção de credibilidade.

**Resultado:** os pontos 1 e 2 quase matam a ideia. Ela não morre porque a dor está provada e, por HIPÓTESE, a maioria dos escritórios pequenos ainda não paga nenhuma suíte.

## 7. Raciocínio por dimensão (idea-validator)

**Problema: Strong.** A dor volta todo mês, multa atrasos e já tem gambiarra e ferramenta paga. Ressalva: o dado de horas é de fornecedor e a pesquisa é de 2020.
**Mercado: Strong.** Vários fornecedores cobram de R$ 100 a R$ 389/mês, e dois foram comprados por grupos grandes. Falta saber quantos escritórios usam cada um.
**Diferenciação: Weak.** "Coleta pelo WhatsApp com IA" já é vendida pelo Ultradocs e montada pelo G-Click com parceiros. "Sem login" e "a IA confere" melhoram a experiência, mas não se defendem: não há efeito de rede nem dado exclusivo.
**Técnica: Moderate.** O MVP sai em semanas com peças prontas. O difícil é a verificação na Meta, manter o modelo como utilidade, ler extratos de dezenas de bancos e fechar contrato de LGPD.
**Negócio: Moderate.** O custo variável fica abaixo de R$ 50 por escritório por mês (ESTIMATIVA). Mas US$ 1 milhão por ano (cerca de R$ 5,4 milhões) a R$ 149 pede uns 3.000 escritórios, e isso exige canal (Sescon, CRC, sistemas contábeis), não só visitas.

## 8. Premissas de maior risco (identify-assumptions-new)

| Categoria | Premissa | Confiança | Teste |
|---|---|---|---|
| Valor | Com um link sem login, o cliente manda mais e mais cedo | Baixa | Piloto: % de envio até o dia 5, antes e depois |
| Viabilidade | Escritório sem suíte paga R$ 99 a 149/mês | Baixa | Pré-venda com 10 escritórios |
| Técnica | A IA acerta tipo, CNPJ e mês em mais de 95% dos casos | Média | 200 documentos reais anonimizados |
| Ética e LGPD | Fundador solo trata folha e extrato com segurança | Baixa | DPA com advogado, criptografia |
| Estratégia | G-Click e Tareffa não empacotam isso barato para o pequeno em 12 meses | Baixa | Acompanhar os lançamentos deles |
| GTM e equipe | Contador atende fundador jovem; uma pessoa dá conta do suporte nos dias 1 a 10 | Média | 15 visitas; medir chamados no piloto |

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

- [NEED: preços oficiais e número de clientes de cada concorrente; % de escritórios pequenos sem software; tabela oficial da Meta em reais; taxa de abertura dos links de lembrete.]
- ASSUMPTION: preço de R$ 149; 50% dos escritórios entre 30 e 300 clientes, metade deles sem suíte; câmbio de cerca de R$ 5,4 por dólar; o fundador menor de idade precisa de responsável legal ou CNPJ.
