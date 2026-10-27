# Brief para o conselho: Pataí

(Este documento é tudo o que o conselho sabe. Nada aqui é opinião sobre a ideia.)

## A ideia
- What it is: app brasileiro (site instalável/PWA + app na Play Store) para encontrar, agendar e acompanhar serviços pet, com uma assinatura mensal para as empresas.
- Who it is for: dois lados. (1) Empresas pet pequenas de cidades médias brasileiras: pet shops de banho e tosa, passeadores, pet sitters, hotelzinho/creche, adestradores e táxi dog, que hoje agendam por WhatsApp e caderno. (2) Tutores de cães e gatos dessas cidades, que usam o app de graça.
- What it sells, at what price: Plano Pataí para a empresa, R$ 49,99/mês, sem comissão por atendimento, com 30 dias grátis (uma vez por conta). Sem assinatura ativa a empresa some do app. Tutor não paga.
- Where and how: começando por Joinville/SC. O fundador vai abordar pet shops diretamente por WhatsApp e com um vídeo curto em motion graphics; tutores chegam pela busca do app, pelo cartaz com QR Code da empresa e pelos links que a empresa compartilha. A cobrança da assinatura é por Pix ou cartão via Asaas (no app da Play Store a assinatura é feita pelo site).
- Budget and constraints: fundador solo, sem clientes pagantes ainda. Produto já construído e no ar (servidor no Render, banco Postgres). Conta de desenvolvedor da Play Console em análise. Orçamento de marketing não informado.

## O que o produto já faz (construído e funcionando)
Para o tutor (grátis):
- Busca por cidade e categoria; perfis de empresa com serviços, preços, horários, fotos e avaliações. Só avalia quem foi atendido pelo app; a ordem dos resultados não pode ser comprada (não muda com o plano).
- Ficha do pet (raça, porte, medos, alergias, tosa preferida), que vai junto em cada agendamento.
- Agendamento diferente por área: banho e tosa por horário (com busca e entrega opcional); passeador por dias da semana; pet sitter por período e turnos, com instruções da casa; hospedagem com entrada e saída; creche; adestramento (aula em casa opcional); táxi dog com origem, destino e ida e volta. Agendamento repetido (toda semana, a cada 15 dias...).
- Pet ao Vivo: durante o atendimento a empresa envia cada etapa (chegou, no banho, secando, na tosa, pronto; ou saiu/voltou do passeio; chegou/concluiu a visita) com foto e recado; o tutor recebe notificação no celular.
- Notificações: horário confirmado, lembrete na véspera, "hora de voltar" (ex.: 15 dias após o banho), etapas do Pet ao Vivo.

Para a empresa (no plano):
- Agenda por profissional/recurso (até 15), pedidos para confirmar, agenda do dia em linha do tempo.
- Sinal pelo Pix: o tutor paga direto na chave Pix da empresa (o app não intermedeia nem cobra nada); a empresa marca "sinal recebido".
- Clube de pacotes (ex.: "4 banhos no mês" pago adiantado), cartão fidelidade (a cada N atendimentos, um grátis), lembrete automático de retorno, relatório do mês (atendimentos, faturamento estimado, clientes novos e que voltaram, clientes sumidos com botão de WhatsApp), cartaz com QR Code, mensagens prontas de WhatsApp, notificação de novo pedido.
- Sem comissão. Cancela quando quiser.

## Concorrência conhecida (pesquisa feita antes, preços públicos)
- Agendadores genéricos de beleza/serviços, ex. AppBarber: R$ 79,90/mês (1 profissional), R$ 109,90 (2-5), R$ 164,50 (6-15), R$ 219,90 (mais de 15), sem comissão. Booksy: cerca de R$ 99,99/mês.
- DogHero (passeadores e anfitriões): marketplace que cobra comissão de cerca de 20-25% por serviço.
- O substituto mais comum: WhatsApp + caderno/agenda de papel, de graça.

## Situação e números conhecidos
- Fundador solo. Zero empresas pagantes e zero tutores reais até agora; o app tem dados de demonstração.
- Custos fixos conhecidos: servidor no Render (plano gratuito hoje; plano pago planejado para o lançamento), taxa única da Play Console já paga. A Asaas cobra uma taxa por cobrança recebida (valor exato a confirmar).
- Não há ainda: tamanho de mercado de Joinville, custo de aquisição de cliente, taxa de conversão do teste grátis, churn. Esses números estão em aberto.
- Plano de aquisição: abordar pet shops um a um por WhatsApp com uma mensagem e um vídeo curto; cada empresa traz seus próprios clientes para o app (QR Code, links). Público do vídeo: donos de pet shop ("não acredito que você tem um pet shop e ainda não usa isso").
