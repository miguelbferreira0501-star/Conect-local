# Planos, custos e margem (estimativa)

Valores de referência em outubro de 2026, com US$ 1 = R$ 5,50 (ajuste à cotação do dia).
Não é aconselhamento contábil: confirme impostos e enquadramento com um contador.

## Planos

| Plano | Preço | Agendas (profissionais/recursos) | Assistente de IA |
| --- | --- | --- | --- |
| Grátis | R$ 0 | 1 | 10 usos/mês |
| Profissional | R$ 49,90/mês | 3 | 80 usos/mês |
| Equipe | R$ 99,90/mês | 10 | 250 usos/mês |

Por que esses valores: sistemas de agenda vendidos no Brasil cobram, em geral, de R$ 70 a R$ 250 por mês e não trazem
clientes novos; aqui a empresa ganha agenda **e** vitrine. Um plano grátis útil é essencial no começo — sem empresas,
o app não tem valor para os clientes. Sugestão de lançamento: para as 100 primeiras empresas, 3 meses de Profissional
grátis e preço travado em R$ 39,90 por 12 meses. Plano anual com 2 meses de desconto.

Regras que protegem a confiança: o plano não muda a posição na busca nem concede selos.

## Custo do assistente de IA por uso

Estimativa por pedido: ~1.500 tokens de entrada e ~1.000 de saída (texto + raciocínio em esforço `low`).

| Modelo (`AI_MODEL`) | Preço (US$/milhão de tokens, entrada/saída) | Custo por uso |
| --- | --- | --- |
| `claude-opus-5-5` (padrão) | 4 / 20 | ~US$ 0,026 ≈ **R$ 0,14** |
| `claude-haiku-5-5` | 0,10 / 0,50 | ~US$ 0,0007 ≈ **R$ 0,004** |

Pior caso (empresa usa todo o limite do mês) com Opus: Grátis R$ 1,40 · Profissional R$ 11,20 · Equipe R$ 35.
Com Haiku, menos de R$ 1 em qualquer plano. O Opus escreve melhor; o Haiku custa cerca de 40 vezes menos.
O uso real fica registrado na tabela `ai_usage` (pedidos e tokens por empresa/mês) — acompanhe e ajuste.

## Outros custos mensais

- **Hospedagem** (Render Starter, sem "dormir"): ~US$ 7 ≈ R$ 40.
- **Banco** (Neon pago): ~US$ 19–30 ≈ R$ 105–165. As fotos ficam no banco; acima de ~100 empresas com muitas fotos,
  mover as imagens para um armazenamento de arquivos (ex.: Cloudflare R2, ~US$ 0,015/GB) sai bem mais barato.
- **Meio de pagamento** (Pix/cartão, ex.: Asaas, Mercado Pago): ~1% a 5% por cobrança — estimativa média de 4%.
- **Impostos**: empresa no Simples Nacional; serviços de software costumam começar em ~6% (Anexo III, depende do
  "Fator R") ou 15,5% (Anexo V). Estimamos 6%–8%. O MEI não cobre esta atividade.
- **Lojas de apps**: no site e no app instalado pelo navegador, o pagamento é direto (Pix/cartão, sem taxa de loja).
  No app baixado da Google Play/App Store, as regras das lojas exigem o sistema de pagamento delas para assinaturas
  digitais (15%–30%); por isso a compra fica desligada lá (`STORE_APP_PAYMENTS=false`) e a empresa assina pelo site.

## Configurar a Asaas

1. Crie a conta em asaas.com (pode começar pela conta de **testes/sandbox**) e copie a **chave da API**.
2. No Render, em **Environment**, cole a chave em `ASAAS_API_KEY` e salve.
3. Pronto: ao reiniciar, o servidor descobre se a chave é de testes ou de produção e cadastra sozinho, na Asaas,
   o aviso de pagamento (`/api/webhooks/asaas`) com o token `ASAAS_WEBHOOK_TOKEN`. Confira em **/admin** →
   “Pagamentos funcionando”. Para cobrar de verdade, troque pela chave de produção.
