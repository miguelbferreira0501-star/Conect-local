# Arquitetura

```
Navegador (PWA) ──HTTP/JSON──▶ API Hono ──SQL──▶ PostgreSQL
  web/                          server/            RLS + funções SECURITY DEFINER
        ╲                        ╱
         packages/shared (tipos, validação Zod, ranking, selos, formatação)
```

## Camadas

- **routes/** — HTTP: lê parâmetros, valida com os esquemas de `@conecta/shared`, chama serviços. Sem SQL.
- **services/** — regras de negócio: ranking, disponibilidade de horários, elegibilidade de avaliações, limites.
- **repositories/** — SQL parametrizado. Nenhuma regra de negócio.
- **db/pool.ts** — `withUser(userId, fn)` abre uma transação e define `app.user_id`, usado pelas políticas RLS.

No front-end, componentes visuais não chamam `fetch`: os dados passam por `web/src/lib/queries.ts` (React Query)
e `web/src/lib/api.ts`.

## Modelo de dados (resumo)

| Tabela | Observação |
| --- | --- |
| `states`, `cities` | IBGE; `cities` tem coordenadas e fuso horário (usados em distância, “aberto agora” e agenda). |
| `categories` | Dados, não código: nova categoria = nova linha (ícone Lucide + palavras-chave da busca). |
| `businesses` | Sede (`city_ibge`, endereço, coordenadas), contatos, modos de atendimento (`mode_in_person`, `mode_at_customer`, `mode_online`), horários + data de confirmação, verificação, `is_demo`. |
| `business_service_areas` | Cidades atendidas além da sede — uma empresa, várias cidades, uma conta. |
| `business_members` | Quem administra a empresa (futuro painel). As políticas RLS de edição já usam esta tabela. |
| `services`, `photos` | Preço `fixed`/`from`/`range`/`quote`, duração, se é agendável. |
| `bookings`, `quote_requests` | Contratações do cliente. Índice único impede dois agendamentos ativos no mesmo início. |
| `reviews`, `review_replies`, `review_reports` | Avaliação ligada a uma contratação (trigger valida). |
| `business_review_stats` (view) | Contagem, média, desvio e distribuição das avaliações publicadas. |

## Busca

1. SQL filtra por localização (sede na cidade, cidade na área atendida, ou on-line quando há termo/categoria) e
   pelos filtros estruturados.
2. O serviço calcula a relevância textual (`textRelevance`, sem acentos, plural simples, palavras-chave da categoria)
   e a pontuação (`rankBusiness`) para cada candidata, ordena e pagina.

Isso é adequado para centenas de empresas por cidade. Para escala maior: índice `tsvector` em português e
pontuação base pré-calculada (visão materializada atualizada por gatilho/tarefa).

## Futuro painel empresarial

Usará a mesma API, os mesmos esquemas de `packages/shared` e o mesmo banco. Permissões já previstas:
membros `owner`/`manager` podem editar perfil, serviços, fotos e áreas (políticas `*_member_write`).
Campos de confiança (`verified_at`, contadores, `status`) **não** são editáveis pelo papel da aplicação.
