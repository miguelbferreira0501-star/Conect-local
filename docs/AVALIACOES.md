# Avaliações

## Quem pode avaliar

Somente quem tem uma contratação registrada na plataforma:

- **Agendamento**: depois do horário marcado, o cliente confirma “O serviço foi realizado”.
- **Orçamento**: o cliente marca “Contratei”.

Regras (API `server/src/services/reviews.ts` + banco):

1. Uma avaliação por contratação (`UNIQUE` em `booking_id`/`quote_id`).
2. No máximo uma avaliação da mesma empresa a cada 30 dias, e até 180 dias após a contratação.
3. Até 5 avaliações por dia por pessoa, além de limite por IP.
4. Comentário de 20 a 1000 caracteres, sem links, e-mails ou telefones.
5. O gatilho `reviews_check_activity` recusa no banco qualquer avaliação sem contratação concluída do próprio autor.
6. A política RLS garante que a avaliação só pode ser criada/alterada/excluída pelo autor.
7. Edição por até 30 dias; exclusão a qualquer momento.

## Privacidade

O nome público é “Primeiro nome + inicial do sobrenome” (gravado no momento da avaliação).

## Denúncias e moderação

Qualquer pessoa logada pode denunciar (uma vez por avaliação). Denúncias **não** ocultam a avaliação
automaticamente — isso impediria que concorrentes derrubassem avaliações legítimas. O status `under_review`
e a tabela `review_reports` alimentarão o futuro painel de moderação. Empresas não podem apagar avaliações;
poderão respondê-las publicamente (`review_replies`).
