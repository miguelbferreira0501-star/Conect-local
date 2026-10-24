# Segurança e privacidade

## Banco de dados

- Dois papéis: `conecta` (dono do esquema, só migrações/seed) e `conecta_app` (aplicação). A aplicação **não** é
  dona das tabelas, então as políticas **RLS valem para todas as consultas**.
- Cada requisição autenticada roda em transação com `app.user_id` definido (`withUser`). Políticas garantem que
  usuários só leem/alteram seus próprios dados (`users`, `sessions`, `favorites`, `bookings`, `quote_requests`,
  `reviews`, `review_reports`).
- Permissões por coluna: a aplicação não altera `verified_at`, contadores de confiança, `report_count`, nem a
  empresa/autor de uma avaliação.
- Funções `SECURITY DEFINER` com `search_path` fixo expõem só o mínimo: hash de senha por e-mail (login),
  usuário da sessão, horários ocupados (sem dados de quem agendou), contagens agregadas.
- Testes em `server/test/api.test.ts` verificam essas garantias diretamente no banco.

### Usando Supabase

As migrações são PostgreSQL padrão. No Supabase, rode-as com o papel `postgres`, crie um papel de aplicação
dedicado (ou use `DB_APP_ROLE`) e mantenha a API como único ponto de acesso; não exponha as tabelas pela API
REST automática sem revisar as políticas para `auth.uid()`.

## API

- Senhas com bcrypt (custo 11); comparação com hash fictício quando o e-mail não existe (resposta igual e tempo semelhante).
- Sessão: token aleatório de 256 bits em cookie `httpOnly`, `SameSite=Lax`, `Secure` em produção; no banco só o SHA-256.
- CSRF: cabeçalho `X-Requested-With` obrigatório + verificação de `Origin`.
- Validação Zod no servidor para toda entrada (os mesmos esquemas do cliente).
- Limites de requisição para login, cadastro, agendamento, orçamento, avaliação e denúncia (em memória; use Redis com várias instâncias).
- Cabeçalhos: CSP restritiva, `frame-ancestors 'none'`, `Referrer-Policy`, `Permissions-Policy`.
- Redirecionamento pós-login aceita apenas caminhos internos.
- Links externos só `http(s)` e com `rel="noopener noreferrer"`.
- Nenhum segredo no front-end; configuração por variáveis de ambiente (`.env.example`).

## Privacidade (LGPD)

- Navegação sem cadastro; geolocalização só após explicação e permissão, nunca armazenada.
- A cidade escolhida fica no navegador (pode ser desligado em Privacidade) ou na conta, se a pessoa quiser.
- Exclusão de conta pelo app, com confirmação de senha, apagando todos os dados pessoais.
- Os textos de termos/privacidade são modelos e devem ser revisados juridicamente antes do lançamento.
