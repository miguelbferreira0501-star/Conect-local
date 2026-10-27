# Finalista: Base Solar (O&M para pequenas integradoras solares)

Data da análise: 27/10/2026. Método: founder-competitors, market-sizing, identify-assumptions-new e idea-validator (rubrica).

**Como ler:** FATO tem link. ESTIMATIVA é uma conta feita com fatos. HIPÓTESE é um palpite que ainda precisa de teste.

**Limite da pesquisa:** o proxy bloqueou a abertura direta das páginas (o Canal Solar deu erro de DNS). Quase tudo abaixo veio de **trechos de busca**, sem leitura da página inteira. As datas que aparecem nas páginas do Canal Solar costumam ser a data do acesso, não a da publicação. Por isso, quando a data não foi confirmada, eu aviso. Não consegui nenhuma conversa com integradoras: **esta análise não tem nenhuma voz de cliente real.**

---

## Veredito: STOP (para o SaaS como foi descrito)

O problema existe e há gente pagando por ferramentas de pós-venda. Mas o espaço já tem um líder com dinheiro de investidores (SolarZ: cerca de 4.700 integradoras e mais de 100 portais) que já lançou exatamente a função de "achar oportunidades na base instalada". E o acesso aos dados dos inversores depende da permissão de cada fabricante, que pode ser cortada a qualquer momento. Para um fundador solo, menor de idade, sem rede no setor, isso não se resolve com uma mudança de rumo do software.

| Dimensão | Nota | Motivo em uma linha |
|---|---|---|
| Gravidade do problema | Moderada | É real (clientes órfãos, queda de vendas), mas metade das integradoras já oferece O&M e se vira sem a ferramenta. |
| Evidência de mercado | Moderada | Concorrentes com dinheiro e clientes, mas sem preço público e com o mercado novo encolhendo. |
| Diferenciação | Fraca | SolarZ, SolarView e Solfácil já fazem monitoramento, pós-venda e oferta ao cliente final. |
| Viabilidade técnica | Moderada | Dá para fazer um MVP com uma marca (Growatt); juntar várias marcas exige APIs pagas, NDA e lista de IPs liberados. |
| Viabilidade do negócio | Fraca | Para chegar a US$ 1 milhão por ano, seria preciso ter cerca de 1/3 de todas as integradoras do país. |

---

## 1. Validação comercial (o que se sabe)

**Base instalada (cresce)**
- FATO: o país tem cerca de 3,87 milhões de sistemas de GD e 43,5 GW, segundo a ABGD ([Cenário Energia, 07/01/2026](https://cenarioenergia.com.br/2026/01/07/geracao-distribuida-alcanca-435-gw-em-2025-e-projeta-salto-para-50-gw-ate-o-fim-de-2026/)).
- FATO: uma matéria de junho de 2026 fala em mais de 4,3 milhões de sistemas, com 202 mil novos entre janeiro e abril de 2026. A fonte original não foi confirmada ([Rondônia Dinâmica, mai/2026](https://www.rondoniadinamica.com/noticias/2026/05/energia-solar-supera-r-300-bilhoes-em-investimentos,243655.shtml)).
- FATO: a ABSOLAR prevê queda de 7% na expansão em 2026: 10,6 GW, contra 11,4 GW em 2025 ([Canal Solar](https://canalsolar.com.br/previsao-da-energia-solar-em-2026/); data da página não confirmada).

**Integradoras (encolhem)**
- FATO: a Greener ouviu **mais de 6.590 integradoras** em janeiro de 2026. Apenas cerca de 10% das fundadas antes de 2016 seguem ativas, e cerca de 25% já se posicionam como "consultores de energia" ([Canal Solar](https://canalsolar.com.br/10-integradoras-antes-2016-seguem-ativas-setor-solar/)).
- FATO: só em Minas Gerais, a FMGD estimou em 2024 cerca de 1,2 mil empresas fechadas (trecho de busca, ver acima). **Não achei um número nacional de integradoras fechadas.**
- FATO: a Solfácil tinha cerca de 8 mil integradores na base ([Finsiders](https://finsidersbrasil.com.br/negocios-em-fintechs/solfacil-capta-100-mi-para-acelerar-seu-ecossistema)).
- FATO (do arquivo 01): segundo a Greener, 53% das integradoras já oferecem O&M, e 85% já foram procuradas por clientes órfãos. Segundo a Solfácil, 70% das ampliações são feitas por outro profissional ([Canal Solar](https://canalsolar.com.br/demanda-sistemas-solares-integradores-perdem-pos-venda/)). Não consegui confirmar de novo o número de 53% nesta rodada.

**Preços de O&M para o cliente final**
- FATO: a limpeza residencial parte de R$ 199 e pode passar de R$ 500 em casas grandes ou de acesso difícil ([Monitor do Mercado, 2026](https://monitordomercado.com.br/economia-2/414431-quanto-custa-para-limpar-as-placas-solares-e-recuperar-a-energia-perdida-debaixo-da-sujeira/)).
- FATO: um site do setor cita de R$ 250 a R$ 500 por visita, com limpeza e checagem, para sistemas de até 12 módulos ([Canal Solar](https://canalsolar.com.br/manutencao-de-placas-solares/)). A frequência recomendada é de pelo menos uma vez por ano.
- **Não achei preço de plano mensal residencial.** As integradoras anunciam "a consultar" ([Solutudo](https://www.solutudo.com.br/classificados/manutencao-de-placa-solar-protecao-e-eficiencia-em-marechal-deodoro-al-557253)).
- FATO: não há lei que obrigue monitoramento em sistemas pequenos e médios ([Canal Solar](https://canalsolar.com.br/monitoramento-solar/)).
- **Não achei a receita de O&M das integradoras** (quanto isso pesa no faturamento delas).

**Cobrança recorrente**
- FATO: o Pix Automático está disponível desde 16/06/2025. Quem paga não paga tarifa, mas o recebedor pode pagar. A empresa precisa ter **mais de 6 meses de atividade** para usar ([Teletime, 04/06/2025](https://teletime.com.br/04/06/2025/pix-automatico-para-pagamentos-recorrentes-fica-disponivel-dia-16/)).

---

## 2. Concorrentes

| Nome | Tipo | Preço | Tamanho | O que faz / ponto fraco |
|---|---|---|---|---|
| **SolarZ** | Direto | Não público | FATO: cerca de 4.700 integradoras e mais de 100 fabricantes; IA que "identificou mais de R$ 1 bilhão em oportunidades" em 60 dias; aporte de R$ 2,3 milhões ([Startupi](https://startupi.com.br/solarz-lanca-ia/)); outra fonte cita mais de 6 mil clientes e 962 mil usinas ([Let's Money](https://www.letsmoney.com.br/noticias/solarz-levanta-58m-fintech-solar/)) | Monitoramento, pós-venda, CRM, propostas e pagamentos. Ponto fraco: a GoodWe restringiu o acesso dela à API (ver seção 3). Há queixas de "app SolarZ não mostra a geração" em reclamações contra integradoras ([Reclame Aqui, D Solare](https://www.reclameaqui.com.br/empresa/d-solare/lista-reclamacoes/)). |
| **SolarView** | Direto | Não público, modelo de assinatura | FATO: fundada em 2013 (BH), aporte de R$ 4 milhões em 2022, meta de 3 mil assinantes ([Canal Solar](https://canalsolar.com.br/solarview-recebe-aporte-de-r-4-mi-para-aprimorar-monitoramento-de-usinas/)) | SuperApp com a marca da integradora e **marketplace para o cliente final comprar serviços de pós-venda** ([Canal Solar](https://canalsolar.com.br/solarview-lanca-sistema-de-atendimento-e-manutencao-da-usina/)). Não confirmei se o marketplace funciona hoje. |
| **Solfácil Smart** | Direto/indireto | Hardware + mensalidade, com divisão de receita com a integradora | FATO: lançado em ago/2025 ([Cenário Energia, 25/08/2025](https://cenarioenergia.com.br/2025/08/25/solfacil-lanca-dispositivo-inteligente-com-ia-para-monitoramento-de-energia-solar-no-brasil/)); a Solfácil também tem campanha para reativar clientes antigos ([Canal Solar](https://canalsolar.com.br/demanda-sistemas-solares-integradores-perdem-pos-venda/)) | Tem o canal de financiamento de 8 mil integradoras. |
| **SolarMarket** | Indireto (CRM) | "Custom": Gold, Diamond e Corporate ([Softwarefinder](https://softwarefinder.com/crm/solarmarket)) | Não confirmado | Foca na venda nova, não no pós-venda. |
| Referência de preço: **SolarLogics** | CRM | A partir de R$ 243/mês ([B2B Stack](https://www.b2bstack.com.br/compare/solarlogics-vs-hubspot-crm)) | — | Única âncora pública de preço de software para integradoras. |
| **Portais dos fabricantes** (Solarman Business, FusionSolar, ShinePhone) | Substituto | App grátis para o cliente; a API do Solarman Business é paga | — | Cada marca tem seu painel. Não cobram nada nem enviam ofertas. |
| **Planilha + WhatsApp** | Substituto | Grátis | Comum (HIPÓTESE) | Ninguém olha a geração; o cliente só reclama quando a conta sobe. |
| SunWatch, marketplace de O&M | — | — | **Não encontrados** | Não achei nenhum marketplace nacional de O&M para clientes órfãos. Isso pode ser lacuna ou falta de mercado. |

**Por que uma integradora trocaria para a Base Solar?** Só por três motivos possíveis. Os três são **HIPÓTESES** e todos são frágeis:
1. Preço menor que o da SolarZ (que não é público).
2. Ser "só O&M + cobrança Pix + WhatsApp", mais simples.
3. Atendimento local em SC.

Nenhum desses motivos dura: a SolarZ já tem "pagamentos" no pacote, e qualquer uma das três pode copiar um fluxo de WhatsApp em um ciclo de produto.

---

## 3. Viabilidade técnica

- **Growatt:** FATO: tem uma OpenAPI v1 com token gerado pelo próprio usuário no portal ou no ShinePhone. Os servidores são regionais, e o histórico vem em janelas de no máximo 7 dias ([growattServer docs](https://sources.debian.org/src/growattserver/2.0.1-1/docs/openapiv1.md)). É a mais fácil das marcas.
- **Huawei FusionSolar:** FATO: a API Northbound tem limite de chamadas atrelado ao número de usinas. Uma fonte não oficial cita a fórmula "chamadas por dia = arredondar(usinas/100) + 24" e erro 407 quando o limite estoura. Há também limite de **uma sessão de login** por vez ([HomeAssistant-FusionSolar](https://github.com/tijsverkoyen/HomeAssistant-FusionSolar/releases)). A meteocontrol recomenda puxar dados a cada 24 h ([VCOM](https://zammad.meteocontrol.de/help/en-us/6-datalogger-import-configuration/179-vcom-import-huawei-fusionsolar-api)).
- **Solarman (Deye e outras):** FATO: o desenvolvedor precisa se cadastrar via vendas. A API é **paga** para usuários Business e para quem tem mais de 3 usinas, e passa por análise, pagamento e só então ativação ([Solarman Help Center](https://helpcenter.solarmanpv.com/portal/en/kb/solarman2/solarman-business/faq/api)). Relato de usuário: o suporte ficou "muito hesitante" em liberar novos appId ([Home Assistant Community](https://community.home-assistant.io/t/collect-inverter-data-from-solarman-api/328760)).
- **GoodWe:** FATO, o sinal mais grave: em 04/06/2026 um integrador reclamou que a GoodWe bloqueou a integração com a SolarZ. A GoodWe respondeu que a API agora é liberada **caso a caso, com NDA e lista de IPs da plataforma** ([Reclame Aqui](https://www.reclameaqui.com.br/goodwe/goodwe-bloqueou-integracao-com-solarz-causando-transtornos-a-clientes-e-integradores_DQLZwIh9j8HX_exF/)).
- **Fronius:** não pesquisei a fundo. [NEED: termos da API Solar.web]
- ESTIMATIVA: com programação assistida por IA, um MVP de uma marca (Growatt) leva de 4 a 6 semanas. Cada nova marca traz outro cadastro, outro limite de chamadas e outro risco de corte. Mais de 4 marcas exigem uma relação comercial que um menor de idade sem CNPJ dificilmente consegue (HIPÓTESE).
- Conta de "produziu 18% menos": exige saber quanto o sistema deveria gerar, a partir da potência, da irradiação local e do histórico. Os dados de irradiação existem (HIPÓTESE: base pública como o CRESESB), mas sombra, sujeira e corte da rede (curtailment) confundem o diagnóstico e geram alarme falso.

---

## 4. Cliente ideal e tamanho do mercado (de baixo para cima)

**Cliente ideal (HIPÓTESE):** integradora de 2 a 10 pessoas em SC ou PR, com 200 a 1.000 sistemas instalados, majoritariamente Growatt ou Deye, ainda sem SolarZ ou SolarView, com vendas novas em queda e um técnico ocioso. Quem paga é o dono.

| Métrica | Conta | Valor/ano |
|---|---|---|
| TAM (software) | ESTIMATIVA: cerca de 6.590 integradoras (piso: respondentes da Greener) × R$ 200/mês (HIPÓTESE, abaixo dos R$ 243 da SolarLogics) × 12 | **cerca de R$ 15,8 milhões** |
| TAM (serviço, teórico) | 4,3 milhões de sistemas × R$ 199 (1 limpeza/ano, preço mínimo) | cerca de R$ 856 milhões de serviço. Uma comissão de 5% (HIPÓTESE) daria cerca de R$ 43 milhões, **se todos limpassem todo ano, o que não acontece** |
| SAM | HIPÓTESE: 20% das integradoras no Sul e fora da SolarZ = cerca de 1.300 × R$ 200 × 12 | **cerca de R$ 3,2 milhões** |
| SOM (2 anos) | HIPÓTESE: 30 a 60 integradoras pagantes × R$ 200 × 12 | **R$ 72 mil a R$ 144 mil** |

Projeção: o número de sistemas cresce, mas o de integradoras cai e se concentra. HIPÓTESE: o TAM de software fica parado ou encolhe. Confiança baixa em todos os percentuais.

**Conta do US$ 1 milhão por ano** (cerca de R$ 5,5 milhões, câmbio HIPÓTESE de R$ 5,5): a R$ 200 por mês, seriam cerca de **2.300 integradoras**. Isso é cerca de 35% do universo pesquisado pela Greener e metade da base da SolarZ.

---

## 5. Teste de estresse: tentando matar a ideia

1. **"A SolarZ já faz."** Morre aqui, em boa parte. FATO: monitoramento de mais de 100 fabricantes, pós-venda, pagamentos e uma IA que aponta oportunidades na base instalada, usada por cerca de 4.700 integradoras. Não confirmei se ela tem um "plano de limpeza com Pix", mas tem tudo o que é necessário para lançar isso.
2. **"As integradoras estão quebradas."** Ferida grave. FATO: só cerca de 10% das antigas sobreviveram, e 25% viraram consultoras. Quem está quebrado corta assinatura de software primeiro (HIPÓTESE).
3. **"O cliente final não paga O&M."** Ferida não testada. FATO: não há obrigação legal e não achei preço de plano mensal publicado. HIPÓTESE: o cliente residencial paga uma limpeza avulsa quando vê a conta subir, e não um plano. [NEED: taxa de aceite de uma oferta via WhatsApp]
4. **"A API vai ser cortada."** Ferida grave. FATO: a GoodWe fez isso com a SolarZ, a Solarman cobra e restringe, e a Huawei limita chamadas e sessões. Se acontece com a líder, que tem investidores, acontece com um fundador solo.
5. **"O mercado está encolhendo."** Ferida parcial. As vendas novas caem 7% em 2026, mas a base instalada cresce. Isso **ajuda** o O&M e prejudica a integradora (que é quem pagaria).
6. **Risco do fundador:** HIPÓTESE: um menor de idade sem CNPJ não fecha NDA com fabricante nem usa Pix Automático como recebedor (que exige mais de 6 meses de atividade). [NEED: confirmar as regras de emancipação e de MEI]

**Melhor argumento para matar a ideia:** a líder (SolarZ) já está dentro de cerca de 4.700 integradoras, já lê mais de 100 portais e já vende "oportunidades da base instalada". Mesmo assim, ela teve a API cortada pela GoodWe. Um fundador solo começa sem canal, sem acesso aos dados e sem diferencial que dure.

---

## 6. Premissas de risco (8 categorias)

| Categoria | Premissa | Confiança | Teste |
|---|---|---|---|
| Valor | O cliente aceita uma oferta de limpeza disparada por alerta | Baixa | Oferta manual via WhatsApp para 50 clientes de uma integradora |
| Usabilidade | O dono importa a lista de clientes e as senhas dos portais | Média | Onboarding com 3 integradoras |
| Viabilidade | A integradora paga R$ 150 a R$ 300 por mês, além do que já gasta | Baixa | Pré-venda com cobrança real |
| Técnica | Acesso estável a 3 ou mais marcas | Baixa | Pedir API à Solarman e à Huawei e ver a resposta |
| Ética/LGPD | Guardar as senhas dos portais dos clientes finais é aceitável | Baixa | Consulta jurídica; preferir conta de "visitante" |
| Go-to-market | Dá para vender por visita e WhatsApp em Joinville | Média | 20 contatos e contagem de reuniões |
| Estratégia | A SolarZ não vai copiar | Muito baixa | Pedir proposta da SolarZ como cliente |
| Time | Um solo menor de idade mantém integrações e suporte | Baixa | — |

---

## 7. Perguntas que podem matar a ideia

1. Quantas integradoras de Joinville e região **não** usam SolarZ nem SolarView, e por quê?
2. Quanto a SolarZ cobra de uma integradora com 300 sistemas, e já oferece plano de manutenção com cobrança?
3. Entre os clientes finais de uma integradora que recebem um alerta real de queda, quantos compram uma limpeza em até 7 dias?

## 8. Próximos 3 experimentos (antes de programar)

- **Pedir 3 propostas como cliente** (SolarZ, SolarView, Solfácil Smart). Custo: 2 dias e R$ 0. Sinal: se alguém cobra mais de R$ 300 por mês e não tem O&M com cobrança, a ideia sobrevive. Se já têm, a ideia morre.
- **Concierge manual:** com uma integradora local, olhar o portal Growatt à mão, achar 10 sistemas com geração baixa e mandar a oferta de limpeza pelo WhatsApp. Custo: 1 semana e R$ 0. Sinal: 3 limpezas vendidas ou mais é positivo; nenhuma mata a premissa de valor.
- **Clientes órfãos:** anúncio local "sua instaladora fechou? cuidamos do seu sistema", com R$ 100 no Instagram. Sinal: o custo por contato e quantos aceitam pagar visita. Isso testa um **negócio de serviço**, que já é outra ideia.

## Lacunas

[NEED: preços da SolarZ, SolarView e Solarman Business]; [NEED: número nacional de integradoras ativas e de fechadas]; [NEED: receita de O&M das integradoras]; [NEED: termos da API Fronius e Deye]; [NEED: entrevistas com integradoras]. Todos os percentuais do SAM e do SOM são HIPÓTESES.
