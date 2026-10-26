# Asaas: como ligar a cobrança do Plano Pataí

O app já está pronto para cobrar as empresas (R$ 49,99/mês, Pix ou cartão). Falta só a sua conta na Asaas
e colar a chave no Render. Nada de código.

## Como a cobrança funciona

1. A empresa se cadastra e escolhe **"Começar com 30 dias grátis"** (sem cartão) ou **"Já deixar a assinatura pronta"**.
2. O teste grátis vale **uma vez por conta**. Uma segunda empresa da mesma conta já começa sem teste.
3. Se assinar durante o teste, a **primeira cobrança vence no último dia do teste** (ninguém perde dias).
4. Quando o pagamento cai, a Asaas avisa o app e o plano renova sozinho por mais um mês (+3 dias de folga).
5. Se o teste acabar ou um mês vencer sem pagamento, a empresa **sai do app**: some da busca e do perfil
   público, e o painel fica bloqueado (só a aba Plano abre). Ao pagar, tudo volta na hora.
6. Pix: todo mês a Asaas manda a cobrança por e-mail. Cartão: depois do primeiro pagamento, os meses seguintes
   são cobrados automaticamente no cartão.

O CPF/CNPJ e o cartão ficam só na Asaas. O Pataí não guarda esses dados.

## Passo 1 — Testar primeiro (recomendado)

1. Crie uma conta de testes em **sandbox.asaas.com** (dinheiro de mentira).
2. No menu do usuário (canto superior direito): **Integrações → Chaves de API → Gerar nova chave**.
   A chave começa com `$aact_hmlg_`. Copie inteira — ela só aparece uma vez.
3. No Render: serviço do app → **Environment** → `ASAAS_API_KEY` → cole a chave → **Save, rebuild and deploy**.
4. Abra `/admin` no site (com o e-mail de `ADMIN_EMAILS`). O cartão **Pagamentos** deve dizer
   "Pagamentos funcionando" e "Avisos de pagamento configurados".
5. Cadastre uma empresa de teste, vá em **Plano → Assinar**, gere o Pix e marque como pago no painel do
   sandbox (Cobranças → a cobrança → "Confirmar pagamento"). O plano deve ativar sozinho em segundos.

## Passo 2 — Valer de verdade (produção)

1. Crie a conta normal em **asaas.com** (CPF ou CNPJ) e envie os documentos que eles pedirem.
   A aprovação é feita pela Asaas.
2. Depois de aprovada: **Integrações → Chaves de API → Gerar nova chave** (começa com `$aact_prod_`).
3. No Render, troque o valor de `ASAAS_API_KEY` pela chave de produção e faça o deploy.
4. Confira de novo o cartão **Pagamentos** em `/admin`.
5. Cadastre uma conta bancária na Asaas para sacar o dinheiro recebido.

Você **não** precisa configurar o webhook à mão: ao iniciar, o servidor cadastra o aviso
`https://SEU-SITE/api/webhooks/asaas` com o token `ASAAS_WEBHOOK_TOKEN` (gerado pelo Render).
Se o cartão em `/admin` mostrar erro, toque em **Verificar de novo**.

## Taxas

A Asaas cobra uma taxa por cobrança recebida (Pix e cartão têm valores diferentes). Confira a tabela atual em
asaas.com → Preços antes de lançar.

## App da Play Store

Pela regra da Google Play, a assinatura **não** é vendida dentro do app Android: lá a aba Plano diz que a
assinatura é feita pelo site do Pataí no navegador. No site (e no app instalado pelo navegador) a compra
funciona normalmente.

## Problemas comuns

| O que aparece | O que fazer |
| --- | --- |
| "A chave do Asaas foi recusada" | Gere uma chave nova e cole sem espaços. Chave de testes só funciona no sandbox e vice-versa. |
| "falta o endereço público do site (PUBLIC_URL)" | No Render isso é automático. Fora dele, defina `PUBLIC_URL=https://seu-dominio`. |
| "falta ASAAS_WEBHOOK_TOKEN" | No Render: Environment → adicione `ASAAS_WEBHOOK_TOKEN` com um texto aleatório de 20+ caracteres. |
| Pagou e o plano não ativou | Na aba Plano toque em "Já paguei — verificar" (o app confere direto na Asaas). |
