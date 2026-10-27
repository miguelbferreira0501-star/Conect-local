# Relatório final: qual SaaS construir primeiro

**Data:** 27/10/2026.

**Arquivos de apoio (mesma pasta):**
- `00-inventario.md`: o que foi usado.
- `01` a `04`: as quatro pesquisas.
- `05-ideias.md`: as 27 fichas.
- `matriz.xlsx` / `matriz.md`: as notas.
- `fin-*.md`: as cinco finalistas.
- `financas.py`: as contas.

**Como ler:**
- **FATO:** tem fonte com link.
- **ESTIMATIVA:** número de terceiro ou conta minha.
- **HIPÓTESE:** ainda precisa ser testado.

Nenhuma conversa com cliente aconteceu. Nada aqui está validado: é a melhor aposta para **testar primeiro**.

---

## PARTE A — Resumo executivo

**A ideia que deve ser testada primeiro é o Pasta em Dia.** É uma ferramenta para **escritórios contábeis pequenos (1 a 5 pessoas, 30 a 150 empresas clientes) que ainda cobram documentos pelo WhatsApp e controlam tudo em planilha**.

Funciona assim:
- Todo mês, cada cliente do escritório recebe um lembrete com um link próprio, sem login.
- O cliente manda extratos, notas e folha como já está acostumado: foto ou PDF, pelo celular.
- A IA identifica cada arquivo (tipo, banco, mês, CNPJ) e marca o que chegou e o que falta.
- O escritório vê num painel quem está em dia e quem está atrasado, e cobra os atrasados com um clique.

**Por que esta ideia:**
- O problema se repete **todo mês**.
- Quem paga está identificado: o dono do escritório.
- Existem **100.037 escritórios ativos** no Brasil (FATO, CFC ago/2025, via [BNE](https://www.bne.com.br/blog/sao-paulo-e-o-estado-com-mais-oportunidades-para-contadores-segundo-bne)).
- Já existe gasto com isso: a Omie comprou a G-Click, a Thomson Reuters comprou a Gestta, e o G-Click custa "a partir de R$ 100/mês" (FATO, [Omie Store](https://store.omie.com.br/apps/omie-g-click)).
- Cada escritório vendido traz dezenas de empresas usando o produto.
- A validação pode ser feita à mão, em 30 dias, sem programar nada.
- Margem bruta estimada acima de 90%.

**Grau de confiança: moderado a baixo.** O maior risco é que a diferenciação é fraca. G-Click (com WhatsContábil), Questor Tareffa, Conta Azul e a pequena Ultradocs já coletam documentos pelo WhatsApp. A aposta só funciona se:
1. existirem muitos escritórios pequenos que **não pagam nenhuma** dessas suítes (HIPÓTESE);
2. o link sem login aumentar de fato o envio no prazo (HIPÓTESE);
3. eles pagarem de R$ 99 a R$ 199 por mês (HIPÓTESE).

As três premissas podem ser testadas em 30 a 45 dias, com custo quase zero. Se falharem, o plano diz para parar.

---

## PARTE B — As 27 oportunidades investigadas (e o Pataí como régua)

As notas vão de 0 a 100 e usam os pesos da missão. A régua de cada critério (o que vale uma nota 3, 7 ou 9) está na aba "Régua" de `matriz.xlsx`. Na planilha, a nota é uma fórmula, então dá para mudar qualquer nota e ver o resultado mudar. Confiança: A = alta, M = média, B = baixa.

| # | Ideia | Público | Problema | Receita | Nota | Conf. |
|---|---|---|---|---|---|---|
| 1 | Pasta em Dia | Escritórios contábeis de 1-10 pessoas (30-300 CNPJs) | Correr atrás de documento todo mês | Assinatura por escritório, faixa por nº de clientes | **76,4** | M |
| 13 | Repasse Conferido (iFood) | Restaurantes com >R$ 30 mil/mês no iFood | Perdas no repasse sem conferência | Assinatura ou % do recuperado | 69,5 | M |
| 6 | Base Solar (O&M) | Integradores solares pequenos (base de 50-1.000 usinas) | Vendas caíram; base parada | Assinatura por integrador + por usina | 65,8 | M |
| 4 | Pedido Único (representante) | Representantes com 3-10 representadas | Redigitar pedido em cada portal | Assinatura por representante | 62,4 | B |
| 9 | Aluguel Direto | Locadores sem imobiliária e imobiliárias pequenas | Reajuste esquecido, cobrança | Assinatura por imóvel | 62,4 | M |
| 3 | Orçamento na Hora (oficina) | Oficinas mecânicas independentes 1-5 elevadores | Orçamento lento, aprovação sem prova | Assinatura mensal | 62,2 | B |
| 20 | Prontuário Vet por Voz | Clínicas veterinárias pequenas | Papelada no fim do dia | Freemium + assinatura | 61,9 | B |
| 7 | Homologa (solar) | Integradores solares | Prazo da distribuidora estourado | Assinatura | 61,2 | M |
| 18 | Atendente de nicho no WhatsApp | Ar-condicionado, dedetização, autoescola | Cliente perdido fora do horário | Assinatura | 61,0 | M |
| 2 | Raio-X da Reforma | Escritórios contábeis com clientes no Simples | Clientes perguntando da CBS/IBS | Assinatura sazonal / por diagnóstico | 60,9 | M |
| 16 | Zap Justo | Empresas com 2-20 atendentes no WhatsApp | Bloqueio de WhatsApp, preço opaco | Assinatura + custo Meta repassado | 60,9 | M |
| 11 | Carteira do Síndico | Síndicos profissionais (5-20 condomínios) | Vários prédios, tudo espalhado | Assinatura por síndico | 60,3 | B |
| 27 | Mensalidade Automática (cursos) | Escolas de idiomas, música, esportes | Inadimplência de 17% | Assinatura + taxa por cobrança | 59,0 | M |
| 14 | Margem Real (ML/Shopee) | Vendedores de marketplace 100-3.000 pedidos/mês | Anúncio com prejuízo após mudança de tarifa | Assinatura | 58,6 | M |
| 15 | Sentinela de Integração | Lojistas multicanal e agências | Estoque que não sincroniza | Assinatura | 58,0 | M |
| 8 | Extra Aprovado (obra) | Empreiteiros e empresas de reforma | Extra de obra não pago | Assinatura barata | 56,8 | B |
| 17 | Prontuário Livre | Psicólogos, nutris e fisios solo | Prontuário bloqueado por cobrança | Assinatura | 55,9 | M |
| 19 | Orçamento pela Foto | Vidraçarias, serralherias, marcenarias | Muitos orçamentos | Assinatura | 55,9 | B |
| 12 | Canhoto Digital | Transportadoras pequenas | Glosa de frete | Por entrega / assinatura | 55,7 | B |
| 21 | Pede Avaliação | Prestadores locais (qualquer) | Poucas avaliações no Google | Assinatura barata | 55,2 | M |
| 28 | Pataí (referência: app atual) | Pet shops de banho e tosa | Concorrência | Assinatura R$ 49,99 | 55,0 | M |
| 5 | Comissão Certa | Representantes comerciais autônomos | Comissão errada | Assinatura ou % do recuperado | 54,9 | B |
| 23 | NR-1 para micro | Empresas de 5-50 funcionários | Obrigação com multa | Assinatura / laudo | 52,8 | A |
| 25 | Depois (pós-óbito via funerária) | Funerárias e planos funerários | Burocracia pós-óbito | Por família ou por plano | 52,3 | M |
| 24 | Rimou (batalhas de rima) | Organizadores de batalha, MCs, contratantes | Ranking feito à mão | Comissão de shows + patrocínio | 51,8 | M |
| 10 | Vistoria em Vídeo | Imobiliárias pequenas e locadores | Briga por caução | Por vistoria | 51,7 | B |
| 22 | Folga Certa (fim da 6x1) | Pequeno varejo 3-30 funcionários | Fim da escala 6x1 | Diagnóstico avulso | 50,1 | A |
| 26 | Integra (imigrantes) | Construtoras e frigoríficos com imigrantes | Curso só em português | Por turma / mensal | 50,0 | M |

**Destaques por categoria:**

| Categoria | Ideia |
|---|---|
| Mais fácil de validar | **Pasta em Dia**: um piloto feito à mão com um escritório em um mês |
| Mais barata de desenvolver | **Pede Avaliação** e **Extra Aprovado** (MVP em dias), mas nenhuma das duas sustenta um negócio sozinha |
| Maior potencial de receita recorrente | **Pasta em Dia**: o fechamento do mês é obrigatório e a troca de ferramenta é dolorosa |
| Melhor diferenciação | **Rimou**: o efeito de rede do ranking. Mas falta quem pague |
| Maior potencial de crescimento | **Pasta em Dia**: cada escritório dá acesso a dezenas de empresas, e os produtos seguintes podem ser vendidos a essas empresas pelo próprio contador |
| Melhor equilíbrio entre risco e retorno | **Pasta em Dia** |

---

## PARTE C — Ranking: as cinco finalistas depois da investigação profunda

Cada finalista recebeu um investigador com a ordem de **tentar matar a ideia**. O investigador aplicou as skills founder-competitors, market-sizing, identify-assumptions-new e idea-validator. As notas abaixo são da 2ª rodada, já com o que foi descoberto.

| Posição | Ideia | 1ª nota | 2ª nota | Veredito | O que derrubou ou salvou |
|---|---|---|---|---|---|
| **1** | **Pasta em Dia** | 76,4 | **≈ 73,8** | **ITERATE** | Problema e mercado fortes. Diferenciação fraca: G-Click, Tareffa, Conta Azul e Ultradocs já usam WhatsApp. Salva-se se o foco for o escritório que não paga suíte nenhuma |
| 2 | Orçamento na Hora (reserva, sem investigação profunda) | 62,2 | 62,2 | — | Primeira alternativa se o Pasta em Dia falhar |
| 3 | Repasse Conferido (iFood) | 69,5 | ≈ 59,0 | STOP | O iFood já dá de graça o relatório de conciliação, uma API financeira e o "Meu Caixa", e é dono da Saipos. O valor recuperável estimado (~R$ 60/mês por loja) não paga a venda por visita |
| 4 | Pedido Único | 62,4 | ≈ 57,2 | ITERATE fraco | A Mercos (de Joinville) já tem "Enviar para representada" e IA que lê pedido de WhatsApp. Robô em portal acerta de 62 a 71% das tarefas, e cada erro vira mercadoria errada |
| 5 | Aluguel Direto | 62,4 | ≈ 55,8 | STOP | Só empresa com CNPJ recebe por Pix Automático. O Rentos é grátis para 1 imóvel. É B2C, com pouca receita por cliente |
| 6 | Base Solar | 65,8 | ≈ 54,6 | STOP | A SolarZ já atende ~4.700 integradoras e lê mais de 100 portais. A GoodWe fechou a API (só com NDA e lista de IPs) |

**Como a 2ª nota foi recalculada:** mudaram só os critérios que a investigação contradisse.
- Pasta em Dia: diferenciação de 6 para 4 e vantagem de IA de 7 para 5.
- iFood: disposição a pagar de 8 para 5, receita de 7 para 4, diferenciação de 6 para 3 e risco de 5 para 3.
- Base Solar: disposição a pagar de 7 para 5, primeiros clientes de 7 para 4, MVP de 5 para 3 e diferenciação de 6 para 2.
- Pedido Único: MVP de 4 para 2 e diferenciação de 7 para 3.
- Aluguel Direto: disposição a pagar de 6 para 4, MVP de 6 para 4 e diferenciação de 5 para 3.

**Por que o Pasta em Dia ganhou:**
- Foi a única finalista em que o investigador confirmou **problema forte e mercado forte** ao mesmo tempo.
- O **dono dos dados** é o próprio cliente. Não depende de iFood, de fabricante de inversor nem de portal de indústria para funcionar.
- Os testes cabem num mês.
- As outras morreram por um ponto fatal: um dono de plataforma que já faz de graça (iFood), um líder com distribuição (SolarZ, Mercos) ou uma barreira de regulação (Pix Automático para pessoa física).

---

## PARTE D — Dossiê da ideia vencedora

**Nome provisório:** Pasta em Dia.

**Em uma frase:** o escritório contábil para de correr atrás de documento. Cada cliente recebe o lembrete com um link próprio, manda pelo celular, e o escritório vê na hora o que chegou e o que falta.

**Para quem (cliente ideal):**
- **Segmento:** escritório contábil com 1 a 5 pessoas e 30 a 150 CNPJs. A maioria é do Simples Nacional (serviço e comércio pequeno) e o escritório faz também a folha.
- **Onde:** Joinville e região primeiro, depois Santa Catarina.
- **Quem decide:** o dono, que costuma ser contador e sócio único.
- **Processo com o problema:** fechamento mensal, nos dias 1 a 10 de cada mês.
- **Ferramentas de hoje:** o sistema contábil (Domínio, Alterdata, Questor ou similar) só para escrituração, mais WhatsApp Business e planilha.
- **Capacidade de pagar:** de R$ 100 a R$ 200 por mês (HIPÓTESE, com base no G-Click a partir de R$ 100).
- **Sinal de boa venda:** "vivo atrás de cliente pra mandar extrato", uma auxiliar dedicada a cobrar, atraso de guias por falta de documento.
- **Base de dados:** 42% dos escritórios têm de 1 a 3 funcionários (FATO, pesquisa HubCount/Contábeis, [link](https://www.contabeis.com.br/noticias/60322/pesquisa-revela-perfil-do-mercado-contabil-e-escritorios-no-pais/)).

**O problema:**
- "Receber os documentos do cliente no prazo" foi a 2ª maior dificuldade, citada por 21,7% de 258 contadores (FATO, 2020, [Jornal Contábil](https://jornalcontabil.com.br/noticia/contador-nova-rotina-em-tempos-de-pandemia/amp/)).
- De 6 a 10 horas por mês só em lembretes num escritório de 80 clientes (ESTIMATIVA de fornecedor).
- O WhatsApp "virou o principal canal com o cliente": é improviso ou risco operacional? (FATO, [CNT, 06/05/2026](https://contadores.cnt.br/projetos/54/noticias/tecnicas/2026/05/06/whatsapp-nos-escritorios-contabeis-solucao-improvisada-ou-risco-operacional.html)).
- A reforma tributária aumenta a carga: 68% dos escritórios já foram procurados por clientes sobre ela, e só 5% têm estratégia (FATO, [e-Auditoria](https://www.e-auditoria.com.br/blog/desafios-da-reforma-tributaria-contador/)).

**Promessa:** "Feche o mês sem perseguir cliente. Você vê em uma tela quem já mandou tudo e cobra os atrasados com um clique."

**Benefício:** horas da equipe de volta, menos guia atrasada e menos multa. Também tira documento sensível do celular pessoal e de grupos de WhatsApp, o que reduz o risco de LGPD.

**Por que pagariam:** uma auxiliar custa por volta de R$ 12 a 15 por hora (ESTIMATIVA). Economizar 8 horas por mês já paga R$ 100 a 120.

**Diferencial (o que precisa ser provado):**
1. O cliente final não instala nada nem cria senha: só um link no WhatsApp.
2. A IA confere o conteúdo ("é o extrato do Itaú de setembro, e falta o do Sicoob").
3. É feito e vendido para o escritório pequeno que acha as suítes grandes caras e complicadas, entra em um dia e cobra preço por faixa.

**A vantagem principal a comprovar:** que a taxa de envio no prazo sobe com o link sem login. Se não subir, o problema é de comportamento do cliente, e o produto não resolve.

**O que o produto não fará no início:**
- contabilidade, escrituração ou lançamentos;
- emissão de notas;
- folha;
- chatbot que conversa;
- app nativo;
- integração com o sistema contábil;
- conversão para OFX, que fica para a fase 2 e só entra se as entrevistas pedirem.

**Apresentação de 30 segundos (para o contador):**
> "Hoje vocês cobram extrato e nota de cliente por WhatsApp, um por um, certo? O Pasta em Dia manda para cada cliente um link do mês: ele toca e envia foto ou PDF, sem senha e sem app. O sistema reconhece o que é cada arquivo, confere o mês e o CNPJ, e mostra numa tela só quem está em dia e quem falta. Os atrasados você cobra com um clique. Quero testar com 20 clientes do seu escritório no próximo fechamento, sem custo, e medir se chega mais documento no prazo. Se chegar, a gente conversa sobre o plano."

---

## PARTE E — Mercado e concorrência

**O que é fato e o que é julgamento:** os preços e os lançamentos abaixo vêm de trechos de busca, porque o proxy bloqueou a abertura das páginas. A conclusão sobre "quem troca" é julgamento meu.

| Concorrente | Tipo | Preço observado | O que faz | Ponto fraco |
|---|---|---|---|---|
| Omie.G-Click | Direto | a partir de R$ 100/mês ([Omie Store](https://store.omie.com.br/apps/omie-g-click)) | Gestão de tarefas. Desde 09/12/2025 integra a WhatsContábil para pedir documentos ([Ajuda Omie](https://ajuda.omie.com.br/pt-BR/articles/15213088-omie-g-click-vocepode-lancamento-de-novidades-radar-financeiro-integracao-whatscontabil-09-12-2025)) | Exige outra ferramenta para o WhatsApp; é uma suíte, não um coletor |
| Questor Tareffa | Direto | sob consulta | Processo de "cobrança de arquivos" com página de upload e aviso por e-mail ou WhatsApp ([Questor](https://docs.questor.com.br/pt-br/Produtos/Tareffa/gestao-processos/proc-modelo-cobranca)) | O cliente sai do WhatsApp e vai para um portal (HIPÓTESE: não confere o conteúdo) |
| Acessórias | Direto | R$ 389/mês citado numa reclamação; nota 6,4 no Reclame Aqui ([RA](https://www.reclameaqui.com.br/empresa/acessorias-com/lista-reclamacoes)) | Portal e app com a marca do escritório | Reclamações de reajuste e de cancelamento |
| Ultradocs | Direto (a mesma ideia) | não encontrado | "Coleta, validação e organização de documentos direto no WhatsApp" ([ultradocs.ai](https://ultradocs.ai/)) | Pouco rastro público |
| Conta Azul (Conta AI Captura) | Indireto | só no plano Pro | Recebe documento por WhatsApp e sugere o lançamento ([Conta Azul](https://contaazul.com/funcionalidades/conta-ai/)) | Só serve se o cliente do contador usa a Conta Azul |
| Nibo | Indireto | ~R$ 64 por CNPJ (terceiro) | App do cliente com documentos pendentes | Caro por CNPJ; o cliente precisa instalar app |
| Conversores de extrato (Convertou, ImporteFile, OFX Fácil) | Vizinho | créditos, ou grátis ([Convertou](https://convertou.com.br/), [ImporteFile](https://www.importefile.com.br/), [OFX Fácil](https://www.ofxfacil.com.br/)) | PDF para OFX | Não coletam nada: o contador ainda precisa conseguir o PDF |
| WhatsApp + planilha | Substituto | grátis | Tudo à mão | Leva horas, perde arquivo e expõe a LGPD |

**Lacuna (julgamento):** o escritório pequeno sem suíte hoje junta três ou quatro coisas à mão: WhatsApp para pedir, planilha para controlar, pasta ou Drive para guardar e conversor para o extrato. Ninguém vende para ele **uma tela só, simples, que entra em um dia**.

**Quem não troca:** quem já paga G-Click, Tareffa ou Acessórias e está satisfeito. No máximo, pede o mesmo recurso ao fornecedor atual.

**Tamanho do mercado** (de baixo para cima; ESTIMATIVA, a R$ 149/mês; detalhes em `fin-pasta-em-dia.md`):

| Camada | Conta | Valor por ano |
|---|---|---|
| TAM (todos os escritórios) | 100 mil × R$ 149 × 12 | ≈ R$ 179 milhões |
| SAM (30 a 300 clientes) | 50 mil escritórios | ≈ R$ 89 milhões |
| SAM sem quem já tem suíte (HIPÓTESE: metade) | 25 mil escritórios | ≈ R$ 45 milhões |
| SOM em 3 anos (a partir de SC) | de 100 a 300 escritórios | ≈ R$ 180 mil a R$ 540 mil |

É um nicho real, não um mercado bilionário. Mesmo assim, vale a pena para um fundador solo com margem acima de 90%.

---

## PARTE F — Especificação do MVP

### Primeiro uso (do zero ao primeiro resultado em cerca de 10 minutos)
1. O contador abre o link da demonstração e cria a conta com o nome do escritório e o WhatsApp.
2. Cola a lista de clientes (nome, CNPJ, WhatsApp) direto de uma planilha. O modelo de planilha está pronto para baixar.
3. Escolhe o checklist padrão do mês (extrato de cada conta, notas, folha, guias pagas) e ajusta por cliente se quiser.
4. Clica em "Enviar link de teste para mim". O WhatsApp abre com a mensagem pronta e o link.
5. Manda um extrato pelo link, do próprio celular. Em segundos, o painel mostra "Extrato Itaú, set/2026, CNPJ confere. ✔".
6. **Pronto:** ele entende o valor. O próximo passo é "Enviar para todos os clientes".

### Telas do MVP (só cinco)
1. **Hoje / mês atual:** a lista de clientes com o status (em dia, parcial ou nada), filtros e o botão "cobrar atrasados".
2. **Cliente:** o checklist do mês, os arquivos recebidos com o que a IA leu, o botão "conferir" e o histórico de meses.
3. **Importar clientes e checklist.**
4. **Página do cliente final (sem login):** "Escritório X pede: 3 itens para setembro". Tem os botões Foto e PDF e mostra o que já foi enviado.
5. **Plano e cobrança** (reaproveitado do Pataí, via Asaas).

### Funcionalidades

**Essenciais:**
- **Link mensal por cliente, sem login** (token assinado que expira em 45 dias). É o coração do produto.
- **Checklist por cliente e status no painel.** É o que o escritório compra.
- **Lembrete com um clique por link wa.me,** com o texto pronto, saindo do WhatsApp do próprio escritório. Não depende da Meta, não tem custo por mensagem e não corre risco de banimento.
- **IA que classifica e confere:** tipo, banco ou emissor, mês e CNPJ, comparando por regra com o cadastro. Quando não tem certeza, marca "conferir". É a diferença em relação à planilha.
- **Download organizado** (ZIP por cliente e mês, com nomes padronizados), para o escritório levar ao sistema dele.
- **Assinatura com 30 dias de teste** (reaproveitada do Pataí).

**Importantes para depois:**
- **Envio automático pela API oficial do WhatsApp.** Só quando houver 10 pagantes, porque exige CNPJ, verificação na Meta e custo por mensagem.
- **Extrato em PDF convertido para OFX/CSV com conferência de saldo.** Só se as entrevistas mostrarem que é a dor seguinte.
- **Pasta no Google Drive ou no OneDrive do escritório.**
- **Vários usuários por escritório.**
- **Relatório "horas economizadas" e taxa de envio no prazo,** que servem como argumento de venda.

**Não desenvolver agora:**
- **Chatbot conversando com o cliente:** custo por mensagem, risco de banimento e nenhum ganho de validação.
- **Integração com Domínio, Alterdata ou Questor:** cada uma é um projeto inteiro.
- **App nativo:** o link web resolve.
- **Portal completo do cliente,** com guias e honorários.
- **Diagnóstico da reforma tributária:** é outro produto.

### Dependências externas
- Hospedagem (Render, já usada).
- Armazenamento de arquivos (Cloudflare R2 ou S3).
- API da Anthropic (IA).
- Asaas (cobrança).
- WhatsApp: no MVP, só links wa.me, sem API.

### Critérios de funcionamento
- Upload de foto de 5 MB em menos de 10 segundos no 4G.
- Classificação em menos de 30 segundos.
- Nenhum arquivo acessível sem o token ou o login do escritório.
- O painel funciona mesmo com a IA fora do ar: o arquivo fica como "recebido, não conferido".

### A IA no produto
- **Tarefa:** ler o arquivo (PDF ou foto) e devolver um JSON com tipo (extrato, nota de entrada ou saída, folha, guia, outro), banco ou emissor, CNPJ encontrado, mês de referência, número de páginas, se está legível, se o PDF tem senha e a confiança.
- **O que recebe:** só as 2 primeiras páginas, mais o checklist esperado daquele cliente.
- **Conferência por regra, não pela IA:** o CNPJ precisa bater com o cadastro, com o dígito verificador validado em código, e o mês precisa ser o pedido. Isso evita confiar num CNPJ inventado pela IA.
- **Revisão humana:** sempre que a confiança for baixa, o CNPJ ou o mês divergirem, ou o tipo for "outro". O contador confirma com um clique.
- **Erros esperados:** foto tremida, PDF de extrato com senha (comum), documento de outro mês, nota de um sócio confundida com a da empresa. Em todos os casos, a resposta é pedir de novo ao cliente com uma frase pronta.
- **Como avaliar:** juntar 200 documentos reais anonimizados do piloto, conferir à mão e medir os acertos de tipo, mês e CNPJ. A meta é mais de 95% de acerto entre os casos marcados como "certeza".
- **Custo:**
  - Claude Haiku 5.5 custa US$ 0,10 por milhão de tokens de entrada e US$ 0,50 por milhão de saída (tabela da Anthropic, out/2026).
  - Isso dá cerca de US$ 0,0015 por documento, ou ~R$ 0,01.
  - Um escritório com 80 clientes manda ~320 documentos por mês: **~R$ 2,60/mês**.
- **Como o custo não cresce mais que a receita:**
  - limite de páginas lidas;
  - cache do checklist;
  - teto de documentos por faixa de plano;
  - reprocessamento só quando o contador pedir.
- **Se o modelo cair:** o arquivo fica "recebido, não conferido", entra numa fila de nova tentativa e o painel continua funcionando.
- **Se a IA ficar barata ou os concorrentes copiarem:** o valor que fica é o fluxo mensal, o histórico por cliente e o hábito do cliente final de usar o link do escritório. A IA é melhoria, não o produto.

### Arquitetura recomendada (reaproveita o Pataí)
- **Frontend:** React + Vite + Tailwind, como web app instalável. É o que o fundador já domina, e o cliente final só precisa do navegador.
- **Backend:** Hono (Node) + Postgres com RLS, a mesma base do Pataí. O isolamento entre escritórios fica no banco, não só no código.
- **Arquivos:** Cloudflare R2 (compatível com S3), criptografado, com URLs assinadas e curtas. É barato e não cobra pela saída de dados.
- **Fila e lembretes:** um agendador no próprio servidor, como o do push do Pataí, ou pg-boss.
- **IA:** API da Anthropic (Haiku 5.5) com saída estruturada (`output_config.format`), chamada em segundo plano.
- **Pagamentos:** Asaas, que já está integrado.
- **Monitoramento:** Sentry (plano grátis) e logs.
- **Backups:** backup diário do Postgres no Render e um `pg_dump` semanal para o R2.
- **Domínio:** um .com.br (~R$ 40/ano).

**Alternativa ainda mais simples (para o piloto à mão):** Google Forms com upload de arquivo + Google Drive + planilha de status + lembretes manuais. Zero código. Serve para as semanas 2 a 4 e prova a dor antes de programar.

**Segurança e LGPD:**
- O escritório é operador e a ferramenta é suboperadora. É preciso um contrato de tratamento de dados (DPA), revisado por advogado.
- Registro de quem acessou o quê.
- Retenção configurável, com apagamento automático de 90 dias até 12 meses depois do download.
- Nada é usado para treinar modelos.
- Os servidores ficam fora do Brasil (Render nos EUA). A transferência internacional precisa ser informada no contrato.
- **Antes de abrir para clientes:** testes do fluxo de token e upload, revisão de segurança do código gerado com IA e teste de "um escritório tenta ver o arquivo do outro".

**Ponto jurídico:** se o fundador tiver menos de 18 anos, um MEI ou CNPJ e a assinatura do DPA e dos contratos precisam ser feitos por um responsável legal ou por um sócio maior de idade (HIPÓTESE; confirmar com um contador).

---

## PARTE G — Preços e viabilidade financeira

**Modelo de cobrança:** assinatura mensal por **faixa de clientes ativos**. O uso é mensal e obrigatório, então a assinatura faz sentido. Haverá desconto no plano anual depois que a retenção estiver provada.

**Faixas para testar (HIPÓTESES, não preços definitivos):**

| Plano | Clientes ativos | Preço de teste |
|---|---|---|
| Essencial | até 40 | R$ 99/mês |
| Escritório | até 120 | R$ 179/mês |
| Completo | até 300 | R$ 299/mês |

- **Teste:** 30 dias grátis.
- **Preço de fundador** para os 10 primeiros: 3 meses a R$ 99 com Pix antecipado.
- **Referência observada:** G-Click a partir de R$ 100 e Acessórias com R$ 389 relatado.

**Custos (premissas; as contas estão em `financas.py`):**
- **Variável por escritório (80 clientes):** IA ~R$ 2,60 + armazenamento ~R$ 1 + taxa de cobrança ~R$ 3 = **~R$ 6,60** no MVP. Na fase 2, com lembretes pela API oficial a R$ 0,035 cada, ~R$ 15.
- **Fixo mensal:**
  - hospedagem web e banco: R$ 150 a 300;
  - domínio e ferramentas: ~R$ 30;
  - DAS do MEI: ~R$ 80;
  - total no começo: de **R$ 450** a **R$ 800**, com algum anúncio e deslocamento.
- **Para começar (estimativa):**
  - de **R$ 800 a R$ 2.500**, com abertura do MEI ou CNPJ por um responsável, 3 meses de hospedagem, domínio, deslocamento para visitas e revisão jurídica simples do DPA;
  - o maior custo é o tempo do fundador.

**Cenários no mês 12** (antes de impostos sobre o lucro e sem pró-labore):

| Cenário | Clientes | Preço médio | Receita mensal | Receita anualizada | Custo variável | Custo fixo | Margem bruta | Resultado mensal |
|---|---|---|---|---|---|---|---|---|
| Conservador | 15 | R$ 149 | R$ 2.235 | R$ 26.820 | R$ 225 | R$ 450 | 90% | R$ 1.560 |
| Intermediário | 40 | R$ 179 | R$ 7.160 | R$ 85.920 | R$ 600 | R$ 800 | 92% | R$ 5.760 |
| Otimista | 90 | R$ 199 | R$ 17.910 | R$ 214.920 | R$ 1.349 | R$ 1.800 | 92% | R$ 14.761 |

**Ponto de equilíbrio:** de 3 a 6 escritórios a R$ 149, ou de 5 a 10 a R$ 99. Isso só cobre os custos fixos. Não é garantia de lucro.

**Sensibilidade (cenário intermediário):**
- Preço cai para R$ 99: o resultado vai de R$ 5.760 para **R$ 2.560/mês**.
- Só 20 clientes (aquisição lenta ou cancelamentos): **R$ 2.480/mês**.
- 20 clientes a R$ 99: **R$ 880/mês**. Nesse caso o negócio vira renda extra, não empresa.
- **Custo para conquistar cada escritório:** a R$ 400, o dinheiro volta em ~2,4 meses; a R$ 800, em ~4,9 meses.
- **Cancelamento:** 3% ao mês dá vida média de 33 meses (valor por cliente ≈ R$ 5.500). 10% ao mês dá 10 meses (≈ R$ 1.600). **A retenção é o número que mais muda o negócio.**
- **Maior fator de risco:** quantos escritórios fecham por mês. Uma pessoa sozinha, visitando, consegue talvez 2 a 5 por mês (HIPÓTESE).

---

## PARTE H — Plano para conseguir clientes

**Público comprador:** donos de escritório contábil com 1 a 5 pessoas em Joinville, Jaraguá do Sul, Blumenau e São Bento do Sul (fase 1), e depois em SC. Dá para listar pelo Google Maps ("contabilidade"), pelo cadastro do CRC-SC e pelos associados do Sescon.

**Canal principal: contato direto** (WhatsApp + visita ao escritório). Contadores são locais, poucos e fáceis de achar, e o produto se mostra melhor em 5 minutos ao vivo.

**Complementares (só dois):**
1. **Indicação entre contadores:** um mês grátis para quem indica e para quem é indicado. Contadores conversam muito entre si.
2. **Sescon, CRC e grupos de contadores da região:** uma palestra curta sobre "como fechar o mês sem perseguir cliente (e sem violar a LGPD)".

**Fora por enquanto:** anúncios pagos, conteúdo em escala e marketplaces.

**Primeira mensagem (pesquisa, sem venda):**
> "Oi, [nome], tudo bem? Sou o [seu nome], aqui de Joinville. Estou estudando como os escritórios contábeis recebem extrato, nota e folha dos clientes todo mês, porque quero criar uma ferramenta pra isso. Ainda não tenho nada pra vender. Posso te fazer umas perguntas em 15 minutos, por ligação ou passando aí? Ajudaria muito."

**Segunda mensagem (convite para o piloto), só para quem relatou a dor:**
> "Obrigado pela conversa. Você comentou que perde [X horas] por mês cobrando documento. No próximo fechamento, posso testar com 20 clientes seus: eles recebem um link pelo WhatsApp, mandam foto ou PDF sem senha, e você vê numa tela o que chegou. Sem custo no teste. No fim a gente compara com o mês anterior."

**Como fazer a demonstração (5 minutos):**
1. Mostre o painel com clientes fictícios.
2. Peça ao contador para mandar um extrato real pelo link, do celular dele.
3. Mostre o arquivo aparecendo conferido.
4. Pergunte: "quantos clientes teus fariam isso?"

**Objeções e respostas:**
- **"Já uso Acessórias ou G-Click."** "Que bom. Quantos clientes mandam pelo portal no prazo?" Se a resposta for "quase todos", esse não é o cliente: agradeça e siga.
- **"Meu cliente não clica em link."** "Vamos medir no piloto, sem custo. Se não melhorar, você não paga nada."
- **"E a segurança dos dados?"** Mostre o contrato de dados (DPA), a criptografia e o apagamento automático, e lembre que hoje o arquivo fica no celular pessoal.
- **"É caro."** Faça a conta das horas: 8 horas por mês de uma auxiliar dão ~R$ 100 a 120.
- **"Você é muito novo."** Seja honesto. O piloto grátis e o contrato em nome de um responsável tiram o risco.

**Experimento de validação (antes de programar):**

| Etapa | Quem | Quantos | O que medir | Bom sinal | Sinal para mudar ou parar |
|---|---|---|---|---|---|
| 1. Entrevistas (semanas 1-2) | Donos de escritórios pequenos da região | 15 (ver roteiro em `interview-script`) | Como cobraram no mês passado, horas gastas, ferramenta que pagam, quanto pagam | 8 ou mais sem suíte e 5 ou mais gastando mais de 5 h/mês | Menos de 5 com a dor, ou a maioria satisfeita com a suíte |
| 2. Piloto à mão (semanas 3-6) | 3 escritórios × 20-30 clientes | 1 fechamento | % de clientes com tudo enviado até o dia 5 ou 10, contra o mês anterior; horas do escritório | Ganho de 15 pontos percentuais ou mais e o escritório querendo continuar | Ganho abaixo de 15 pontos: o problema é comportamento |
| 3. Pré-venda (semana 6) | Os 3 do piloto + os bons sinais das entrevistas | 10 ofertas | Pix pago (preço de fundador: R$ 99 × 3 meses) | 3 ou mais pagando | Nenhum pagando: STOP |

**Diferença entre os sinais:**
- "Gostei" é elogio e não conta.
- Aceitar o piloto grátis é interesse.
- Dizer "pagaria" é intenção.
- **Pix pago é validação.** Só o último sinal autoriza programar o MVP completo.

---

## PARTE I — Plano de execução de 90 dias

**Dias 1 a 7:**
- **Entregas:**
  - lista de 40 escritórios-alvo;
  - roteiro de entrevista (skill interview-script);
  - 15 mensagens enviadas e 6 ou mais conversas feitas;
  - o modelo do piloto (Google Form com upload + Drive + planilha).
- **Métrica:** conversas feitas e quantos relataram a dor.
- **Decisão:** a dor aparece? Se 0 de 6 confirmarem, mude o público (escritórios maiores ou outro nicho) antes de seguir.

**Dias 8 a 30:**
- **Entregas:**
  - 15 entrevistas;
  - 3 pilotos à mão rodando no fechamento de novembro;
  - escopo final do MVP;
  - as telas 1, 2 e 4 programadas com o link sem login e o upload;
  - um teste da IA com 50 documentos reais anonimizados.
- **Métricas:** % de envio no prazo nos pilotos, acerto da IA, horas do escritório.
- **Decisão no dia 30:**
  - **Continuar** se o piloto mostrar ganho de 15 pontos ou mais e 2 de 3 escritórios quiserem seguir.
  - **Ajustar** (cunha OFX ou outro público) se a dor existir mas o link não mudar o comportamento.
  - **Abandonar** se nenhum dos dois acontecer: passe para a reserva, o Orçamento na Hora.

**Dias 31 a 60:**
- **Entregas:**
  - MVP completo (5 telas, IA, ZIP, cobrança);
  - pilotos migrados para o produto;
  - pré-venda para 10 escritórios;
  - contrato de dados (DPA) revisado;
  - MEI ou CNPJ aberto.
- **Métricas:** pagantes, uso no 2º mês, chamados de suporte nos dias 1 a 10.
- **Decisão no dia 60:**
  - **3 ou mais pagantes:** seguir.
  - **1 ou 2:** ajustar preço e oferta.
  - **0:** STOP.

**Dias 61 a 90:**
- **Entregas:**
  - canal principal ajustado (script e taxa visita → piloto → pagante);
  - programa de indicação;
  - a primeira palestra para contadores;
  - relatório "horas economizadas" no produto;
  - decisão sobre a API oficial do WhatsApp (só se houver 10 pagantes).
- **Métricas:**
  - pagantes (meta: 8 a 12);
  - cancelamento mensal;
  - custo de tempo e dinheiro para conquistar cada escritório;
  - receita mensal.
- **Decisão no dia 90:**
  - Retenção de 90% ou mais no 2º mês e pelo menos 8 pagantes: investir em expansão para SC e na fase 2 (OFX ou API oficial).
  - Caso contrário: identificar o gargalo (aquisição, ativação do cliente final ou preço) e atacar só ele por mais 30 dias.

Este calendário serve para aprender. **Não é garantia de lucro em 90 dias.**

---

## PARTE J — Riscos e análise contrária (por que NÃO construir)

1. **Os grandes já fazem.** G-Click com WhatsContábil (dez/2025), Tareffa com aviso e upload, Conta Azul pelo WhatsApp e a Ultradocs com a mesma proposta. A diferença ("sem login, a IA confere, simples") se copia em uma sprint. **A defesa possível é foco e distribuição local, não tecnologia.**
2. **O problema pode ser de comportamento.** O cliente atrasa porque não tem o extrato ou não liga, e nenhum link muda isso. Num estudo de outro setor, lembrete por WhatsApp não reduziu faltas a consultas.
3. **Teto de preço baixo.** Um escritório pequeno cobra de R$ 90 a 150 por empresa cliente (ESTIMATIVA). Uma ferramenta "só de coleta" a R$ 149 pode parecer cara.
4. **O cancelamento pode ser alto.** Sem integração com o sistema contábil, é fácil voltar para o WhatsApp e a planilha.
5. **LGPD e confiança.** Dados de folha e extrato, com um fundador jovem e sozinho. Um vazamento acaba com o negócio.
6. **A Meta (fase 2).** Ela reclassifica mensagens de utilidade como marketing (custo 9 vezes maior) e muda preços com frequência. Por isso o MVP usa links wa.me.
7. **Mercado de nicho.** US$ 1 milhão por ano exige uns 3.000 escritórios, o que pede canais (associações, parcerias com sistemas contábeis) que não vêm só de visitas.
8. **As premissas mais frágeis:** "metade dos escritórios pequenos não tem suíte" e "pagam R$ 99 a 199". Nenhuma das duas tem dado público.

---

## PARTE K — Recomendação final

1. **Qual ideia priorizar:** o Pasta em Dia, coleta mensal de documentos para escritórios contábeis pequenos.
2. **Primeiro tipo de cliente:** o dono de um escritório com 1 a 5 pessoas e 30 a 150 clientes em Joinville e região, que hoje cobra por WhatsApp e controla em planilha, sem G-Click, Acessórias ou Tareffa.
3. **Problema a resolver primeiro:** saber no dia 5 quem ainda não mandou o quê, e cobrar sem perseguir um por um.
4. **Primeira funcionalidade:** o link mensal por cliente, sem login, com o painel de recebido e faltando.
5. **Como validar antes de gastar:** 15 entrevistas, depois 3 pilotos à mão (Google Form + Drive) num fechamento, depois uma pré-venda com Pix.
6. **Como conseguir os primeiros clientes:** WhatsApp e visita direta aos escritórios da região, com piloto grátis medido; depois indicações e Sescon/CRC.
7. **Quanto dinheiro para começar:** de R$ 800 a R$ 2.500 (premissas da Parte G). O recurso principal é o tempo.
8. **Modelo de cobrança a testar:** assinatura mensal por faixa de clientes (R$ 99, R$ 179 e R$ 299), com preço de fundador de R$ 99 por 3 meses pago antecipado.
9. **Maior risco:** diferenciação fraca diante de suítes que já usam WhatsApp, somada à possibilidade de o atraso ser de comportamento.
10. **O que me faria mudar de recomendação:**
    - a maioria dos 15 escritórios já usar e gostar de uma suíte;
    - o piloto não aumentar o envio no prazo em 15 pontos;
    - ninguém pagar R$ 99;
    - nesses casos, passar para o **Orçamento na Hora** (oficinas), a primeira reserva.
11. **O que fazer primeiro, na próxima sessão:**
    - montar a lista de 40 escritórios-alvo;
    - gerar o roteiro de entrevista com a skill `interview-script`;
    - preparar o formulário do piloto à mão.

### Decisão recomendada
**Testar o Pasta em Dia por 30 dias sem programar o produto completo.** Programe só depois de existirem 3 escritórios pagando.

### Ações prioritárias
1. Lista de 40 escritórios contábeis pequenos da região (Google Maps, CRC-SC).
2. Roteiro de entrevista e as 15 primeiras mensagens.
3. Piloto à mão pronto (formulário com upload + Drive + planilha de status).
4. Fazer as 6 primeiras conversas na semana 1.
5. Falar com um responsável legal sobre abrir o MEI ou CNPJ e assinar o contrato de dados.
