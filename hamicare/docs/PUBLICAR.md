# Colocar o HamiCare no ar

Guia passo a passo, sem precisar programar. Leva umas 2 horas na primeira vez.
No fim, o HamiCare fica num endereço público (ex.: `https://hamicare.com.br`), com contas,
backup na nuvem, amigos, troca de senha por e-mail e as páginas de privacidade e termos.

| Serviço | Para quê | Custo para começar |
| --- | --- | --- |
| [Neon](https://neon.com) | Banco de dados (contas, backup, amigos) | Grátis (0,5 GB) |
| [Render](https://render.com) | Servidor que roda o app | Grátis (dorme sem uso) ou US$ 7/mês |
| [Resend](https://resend.com) | E-mail de "Esqueci minha senha" | Grátis (3.000 e-mails/mês, 100/dia) |
| [Registro.br](https://registro.br) | Domínio `.com.br` | ~R$ 40/ano |

> **Plano grátis do Render:** o servidor dorme depois de 15 minutos sem visitas e leva cerca de
> 1 minuto para acordar. Para testar com amigos, tudo bem. Para lançar de verdade, use o plano
> Starter (US$ 7/mês): os **lembretes push só saem com o servidor acordado**.

---

## 1. Banco de dados no Neon

1. Crie a conta em [neon.com](https://neon.com) (dá para entrar com o GitHub).
2. **Create project**:
   - Nome: `hamicare`
   - Postgres: a versão mais nova oferecida
   - Região: **AWS São Paulo (sa-east-1)** — os dados ficam no Brasil e o app fica mais rápido.
3. Na tela do projeto, clique em **Connect** e copie o endereço de conexão (*connection string*).
   Ele começa com `postgresql://neondb_owner:...` e termina com `?sslmode=require`.
   Guarde: é o `DATABASE_OWNER_URL`.

Não precisa criar tabelas: o servidor faz isso sozinho na primeira vez que liga.

## 2. Domínio (recomendado)

Sem domínio próprio o app funciona em `https://hamicare.onrender.com`, mas o e-mail de troca de
senha precisa de um domínio verificado para chegar a qualquer pessoa.

1. Em [registro.br](https://registro.br), procure e compre um nome (ex.: `hamicare.com.br`).
   Para `.com.br` pede CPF ou CNPJ.
2. Deixe a página de DNS aberta: você vai colar registros do Resend e do Render nela.

## 3. E-mail no Resend

1. Crie a conta em [resend.com](https://resend.com).
2. **Domains → Add domain** → escreva seu domínio (ex.: `hamicare.com.br`).
3. O Resend mostra alguns registros (TXT e MX). Cadastre cada um no DNS do Registro.br
   (*Editar zona*) e volte ao Resend para clicar em **Verify**. Pode levar de minutos a algumas horas.
4. **API Keys → Create API key** (permissão *Sending access*). Copie a chave, que começa com `re_`.
   Guarde: é o `RESEND_API_KEY`.

## 4. Servidor no Render

1. Crie a conta em [render.com](https://render.com) entrando com o **GitHub** e libere o acesso
   ao repositório `conect-local`.
2. **New → Blueprint** → escolha o repositório.
3. Em **Blueprint Path**, escreva: `hamicare/render.yaml`
4. O Render vai pedir alguns valores:

| Campo | O que colocar |
| --- | --- |
| `DATABASE_OWNER_URL` | O endereço copiado do Neon (passo 1) |
| `ADMIN_EMAILS` | O seu e-mail — o mesmo que você vai usar para criar sua conta no app |
| `APP_ORIGINS` | `https://hamicare.onrender.com` (e, com domínio, também `,https://hamicare.com.br`) |
| `RESEND_API_KEY` | A chave `re_...` do Resend (passo 3) |
| `MAIL_FROM` | `HamiCare <nao-responda@hamicare.com.br>` (com o seu domínio) |
| `APP_URL` | Com domínio: `https://hamicare.com.br`. Sem domínio: deixe em branco |

   O nome exato do endereço `onrender.com` aparece no painel do serviço depois de criado.
   Se for diferente de `hamicare.onrender.com`, corrija o `APP_ORIGINS` em **Environment**.
5. **Apply**. A primeira publicação leva uns 5 minutos. Quando aparecer *Live*, abra o endereço.
6. Plano: em **Settings → Instance type**, troque para **Starter** quando for lançar.

### Ligar o domínio no Render

1. No serviço: **Settings → Custom Domains → Add** → `hamicare.com.br` (e `www.hamicare.com.br`).
2. O Render mostra os registros de DNS; cadastre no Registro.br.
3. O certificado HTTPS é feito sozinho em alguns minutos.

## 5. Antes de chamar pessoas

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
      O e-mail deve chegar em 1 minuto (olhe o spam na primeira vez).
- [ ] **Instalar no celular:** abra o endereço no Chrome (Android) ou Safari (iPhone) →
      *Adicionar à tela inicial*. Assim o app recebe lembretes.
- [ ] **Páginas para as lojas:** `https://SEU-ENDERECO/privacidade` e `https://SEU-ENDERECO/termos`.

## 6. Depois (lojas de apps)

- **Google Play:** conta de desenvolvedor (US$ 25, uma vez). O app web vira app Android com
  TWA (Trusted Web Activity). Precisa da URL da política de privacidade (passo 5) e do formulário
  *Segurança dos dados*, que pode ser preenchido com base na seção 2 da política.
- **App Store:** conta Apple Developer (US$ 99/ano) e um Mac (ou serviço de build na nuvem).
- **Assinatura HamiCare+ paga:** hoje o app tem só o teste grátis de 7 dias. Para cobrar, o caminho
  é a cobrança da própria loja (Google Play Billing / App Store), que também resolve nota e reembolso.

## Problemas comuns

| O que aparece | O que fazer |
| --- | --- |
| *Deploy failed* com `Falha na migração` | Confira se o `DATABASE_OWNER_URL` é o do papel `neondb_owner` |
| "Requisição bloqueada por segurança" ao criar conta | O endereço aberto não está em `APP_ORIGINS` |
| O e-mail de troca de senha não chega | Domínio ainda não verificado no Resend, ou `MAIL_FROM` com outro domínio. Veja *Logs* no Render |
| App demora 1 minuto para abrir | Plano grátis dormindo. Troque para Starter |
