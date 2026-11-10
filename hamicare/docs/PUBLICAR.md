# Colocar o HamiCare no ar

Guia passo a passo, sem precisar programar. Leva cerca de 1 hora na primeira vez.
No fim, o HamiCare fica num endereço público (ex.: `https://hamicare.onrender.com`), com contas,
backup na nuvem, amigos, troca de senha por e-mail e as páginas de privacidade e termos.

**Dá para começar sem domínio e sem gastar nada.** O domínio próprio (ex.: `hamicare.com.br`)
pode vir depois, quando for lançar de verdade (veja a seção 6).

| Serviço | Para quê | Custo para começar |
| --- | --- | --- |
| [Neon](https://neon.com) | Banco de dados (contas, backup, amigos) | Grátis (0,5 GB) |
| [Render](https://render.com) | Servidor que roda o app | Grátis (dorme sem uso) ou US$ 7/mês |
| [Brevo](https://brevo.com) | E-mail de "Esqueci minha senha", sem domínio | Grátis (300 e-mails/dia) |

> **Plano grátis do Render:** o servidor dorme depois de 15 minutos sem visitas e leva cerca de
> 1 minuto para acordar. Para testar com amigos, tudo bem. Para lançar de verdade, use o plano
> Starter (US$ 7/mês): os **lembretes (água, Hami, missões, amigos…) só saem com o servidor acordado**.
>
> **Pagou o Starter e o app continua "acordando"?** O serviço é controlado pelo arquivo `hamicare/render.yaml`
> (Blueprint). Se ele disser `plan: free`, cada sincronização do Blueprint volta o serviço para o grátis.
> O arquivo agora diz `plan: starter`. Confira no Render → serviço **hamicare** → **Settings → Instance Type**:
> tem que estar **Starter**. Se não estiver, abra **Blueprints → o do HamiCare → Manual Sync**.

---

## 1. Banco de dados no Neon

1. Crie a conta em [neon.com](https://neon.com) (dá para entrar com o GitHub).
2. **Create project**:
   - Nome: `hamicare`
   - Postgres: a versão mais nova oferecida
   - Região: **AWS São Paulo (sa-east-1)**. Assim os dados ficam no Brasil e o app fica mais rápido.
3. Na tela do projeto, clique em **Connect** e copie o endereço de conexão (*connection string*).
   Ele começa com `postgresql://neondb_owner:...` e termina com `?sslmode=require`.
   Guarde: é o `DATABASE_OWNER_URL`.

Não precisa criar tabelas: o servidor faz isso sozinho na primeira vez que liga.

## 2. E-mail no Brevo (sem domínio)

1. Crie a conta em [brevo.com](https://www.brevo.com) e complete o cadastro que ele pedir.
2. Cadastre o remetente: menu **Senders, Domains & Dedicated IPs → Senders → Add a sender**.
   - Nome: `HamiCare`
   - E-mail: um e-mail seu (pode ser Gmail). Ele manda um código para esse e-mail; confirme.
3. Crie a chave: menu **SMTP & API → API Keys → Generate a new API key**. Copie a chave,
   que começa com `xkeysib-`. Guarde: é o `BREVO_API_KEY`.

Sem domínio próprio, o Brevo pode trocar o endereço que aparece como remetente por um endereço dele.
O nome "HamiCare" continua aparecendo e o e-mail chega, mas cai no spam com mais facilidade.
Avise quem for testar para olhar o spam na primeira vez.

## 3. Servidor no Render

1. Crie a conta em [render.com](https://render.com) entrando com o **GitHub** e libere o acesso
   ao repositório `conect-local`.
2. **New → Blueprint** → escolha o repositório.
3. Em **Blueprint Path**, escreva: `hamicare/render.yaml`
4. O Render vai pedir alguns valores:

| Campo | O que colocar |
| --- | --- |
| `DATABASE_OWNER_URL` | O endereço copiado do Neon (passo 1) |
| `ADMIN_EMAILS` | O seu e-mail, o mesmo que você vai usar para criar sua conta no app |
| `APP_ORIGINS` | `https://hamicare.onrender.com` |
| `BREVO_API_KEY` | A chave `xkeysib-...` do Brevo (passo 2) |
| `MAIL_FROM` | `HamiCare <seuemail@gmail.com>`, com o e-mail que você confirmou no Brevo |

5. **Apply**. A primeira publicação leva uns 5 minutos. Quando aparecer *Live*, abra o endereço.
   O endereço exato `...onrender.com` aparece no topo do serviço. Se for diferente de
   `hamicare.onrender.com`, corrija o `APP_ORIGINS` em **Environment** (e salve).
6. Plano: em **Settings → Instance type**, troque para **Starter** quando for lançar.

## 4. Antes de chamar pessoas

- [ ] **Seus dados na política e nos termos.** Abra `web/src/shared/legal.ts` e troque os campos entre
      `[colchetes]` em `LEGAL_INFO`: nome da empresa (ou o seu), CNPJ/CPF, cidade e e-mail de contato.
      Enquanto não trocar, o servidor avisa no registro (*Logs*) do Render. Me mande os dados que eu troco.
- [ ] **Revisão jurídica.** O texto segue a LGPD, o CDC e o Estatuto Digital da Criança e do
      Adolescente (Lei 15.211/2025), mas vale a revisão de um advogado, principalmente sobre:
      verificação de idade e vínculo com responsável para menores de 16 na parte social,
      e a guarda de registros de acesso por 6 meses (Marco Civil), que passa a ser obrigatória
      quando o app for de uma empresa com fins lucrativos.
- [ ] **Criar sua conta** no app com o e-mail de `ADMIN_EMAILS`: o *Painel de administração*
      aparece em Ajustes → Conta e nuvem.
- [ ] **Testar a troca de senha:** Ajustes → Conta e nuvem → Já tenho conta → Esqueci minha senha.
      O e-mail deve chegar em 1 minuto (olhe o spam).
- [ ] **Instalar no celular:** abra o endereço no Chrome (Android) ou Safari (iPhone) →
      *Adicionar à tela inicial*. Assim o app recebe lembretes.
- [ ] **Páginas para as lojas:** `https://SEU-ENDERECO/privacidade` e `https://SEU-ENDERECO/termos`.

## 5. Outro jeito sem domínio: Gmail (só no plano pago do Render)

O plano grátis do Render bloqueia envio de e-mail por SMTP (o jeito que o Gmail usa). No plano
Starter, dá para mandar pelo seu Gmail em vez do Brevo:

1. Na sua Conta Google, ligue a **Verificação em duas etapas**.
2. Em [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), crie uma
   **senha de app** chamada `HamiCare`. Ela tem 16 letras.
3. No Render, em **Environment**: apague `BREVO_API_KEY` e adicione `SMTP_USER` (seu Gmail) e
   `SMTP_PASS` (a senha de app; pode colar com os espaços). O `MAIL_FROM` pode ficar em branco.

O Gmail manda até cerca de 500 e-mails por dia.

## 6. Depois: domínio próprio

Com domínio, o e-mail sai como `nao-responda@hamicare.com.br` e quase não cai no spam.

1. Em [registro.br](https://registro.br), compre o nome (ex.: `hamicare.com.br`, cerca de R$ 40/ano).
2. **E-mail:** em [resend.com](https://resend.com) → **Domains → Add domain**. Cadastre os registros
   que ele mostrar no DNS do Registro.br e clique em **Verify**. Depois, em **API Keys**, crie uma
   chave (`re_...`). No Render, em **Environment**: adicione `RESEND_API_KEY`, troque o `MAIL_FROM` para
   `HamiCare <nao-responda@hamicare.com.br>` e adicione `APP_URL` = `https://hamicare.com.br`.
   O Resend passa a valer no lugar do Brevo.
3. **Endereço do app:** no Render, **Settings → Custom Domains → Add** → `hamicare.com.br`.
   Cadastre no Registro.br os registros que ele mostrar. Acrescente `,https://hamicare.com.br`
   no fim do `APP_ORIGINS`.

## 7. Lojas de apps

O passo a passo completo da Google Play e da App Store, com os textos e as imagens prontas, está em
[`LOJAS.md`](LOJAS.md).

- **Assinatura HamiCare+ paga:** hoje o app tem só o teste grátis de 7 dias. Para cobrar, o caminho
  é a cobrança da própria loja (Google Play Billing / App Store), que também resolve nota e reembolso.

## Problemas comuns

| O que aparece | O que fazer |
| --- | --- |
| *Deploy failed* com `Falha na migração` | Confira se o `DATABASE_OWNER_URL` é o do papel `neondb_owner` |
| *Deploy failed* no build com `Cannot find module 'vitest'` ou `vite: not found` | O comando de build precisa do `npm ci --include=dev` (já está no `hamicare/render.yaml`). Faça **Manual sync** no Blueprint para pegar a versão nova |
| O Render pede `ASAAS_API_KEY` e `ANDROID_...` | É o arquivo de outro projeto: cancele e escreva `hamicare/render.yaml` em **Blueprint Path** |
| "Requisição bloqueada por segurança" ao criar conta | O endereço aberto não está em `APP_ORIGINS` |
| O e-mail de troca de senha não chega | Olhe o spam. Nos *Logs* do Render, procure "Falha ao enviar e-mail": `401` é chave errada; erro de remetente é `MAIL_FROM` diferente do e-mail confirmado no Brevo |
| "Falha ao enviar e-mail por SMTP" com tempo esgotado | O plano grátis bloqueia SMTP: use o Brevo ou o plano Starter |
| App demora 1 minuto para abrir | Plano grátis dormindo. Troque para Starter |
