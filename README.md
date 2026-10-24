# Conecta Local

Plataforma brasileira para **encontrar, comparar, confiar e contratar** empresas e profissionais locais.
Esta versão entrega o **aplicativo do cliente** (web mobile-first, instalável como PWA), com API própria e
banco PostgreSQL protegido por políticas de segurança. “Conecta Local” é um nome provisório: veja
[Trocar a marca](#trocar-a-marca).

> **Modo demonstração:** o seed cria 84 empresas e ~3.900 avaliações **fictícias**, todas marcadas como
> “Exemplo” na interface. Contatos de empresas de exemplo ficam desativados. Conta de teste:
> `demo@conectalocal.app` / `Demo1234`.

## O que o app faz

| Área | Funcionalidades |
| --- | --- |
| **Início** | Cidade selecionada, busca com sugestões, 12 categorias, seções “Bem avaliadas”, “A mais bem avaliada de cada categoria”, “Com avaliações recentes”, “Novas na plataforma” e “Serviços procurados” (só aparece com volume real de pedidos). |
| **Localização** | Estado → cidade com os **5.571 municípios do IBGE** (busca por nome, sem acentos). Localização do aparelho opcional, com explicação antes do pedido de permissão; coordenadas nunca são salvas. Cidade sem empresas sugere cidades próximas. |
| **Busca** | Nome, profissional, categoria, palavras-chave (“eletricista”, “banho e tosa”), serviços e bairro. Filtros combináveis (categoria, nota mínima, nº de avaliações, preço, tipo de atendimento, agenda on-line, bairro), 5 ordenações, “Por que aparece aqui?” em cada resultado. Filtros ficam na URL. |
| **Empresa** | Capa, nota, selos com critérios, abas (Visão geral, Serviços, Avaliações, Fotos, Contato — abas vazias não aparecem), horários com aviso quando desatualizados, área atendida, mapa (OpenStreetMap), preços ou “Solicitar orçamento”. |
| **Contratar** | Agendamento com horários livres reais (fuso da cidade, sem conflitos), pedido de orçamento, contato por WhatsApp/telefone/site (o app diz que **abre** outro app — não afirma que a mensagem foi enviada). |
| **Atividades** | Agendamentos e orçamentos com status, cancelar, “O serviço foi realizado”, “Contratei”, avaliar. |
| **Avaliações** | Só após contratação confirmada; nota + comentário + aspectos opcionais; editar por 30 dias; excluir; denunciar. |
| **Perfil** | Conta, dados, minhas avaliações, privacidade (lembrar cidade, **excluir conta** — LGPD), “Como funciona”, termos. |

Navegação sem cadastro: a pessoa explora tudo e só precisa de conta para favoritar, agendar, pedir orçamento e avaliar.

## Decisão técnica

O ambiente estava vazio. Escolhi **aplicação web mobile-first instalável (PWA)**: funciona em qualquer
Android/iPhone sem loja de apps, roda bem em aparelhos de entrada e continua disponível na web. Um app
Android nativo pode ser gerado depois (Capacitor/TWA) reaproveitando o mesmo front-end e a mesma API.

| Camada | Tecnologia |
| --- | --- |
| Front-end | React 18 + TypeScript + Vite + Tailwind CSS + React Router + TanStack Query + ícones Lucide + vite-plugin-pwa |
| API | Node 20+ com Hono, validação com Zod, sessões em cookie httpOnly |
| Banco | PostgreSQL 16 com **Row Level Security** e funções `SECURITY DEFINER` mínimas |
| Compartilhado | `packages/shared`: tipos, validações, ranking, selos, formatação — usados pelo app, pela API e pelo futuro painel empresarial |

Supabase não foi usado porque não havia credenciais; o esquema e as políticas RLS são PostgreSQL padrão e
podem ser migrados para Supabase (veja [docs/SEGURANCA.md](docs/SEGURANCA.md)).

## Estrutura

```
packages/shared/   regras de negócio e contratos (ranking, selos, validação, formatação, categorias)
server/            API: routes/ (HTTP) → services/ (regras) → repositories/ (SQL)
  src/db/          migrações SQL, importação do IBGE, seed de demonstração
  data/            municípios e estados (IBGE, via github.com/kelvins/municipios-brasileiros)
  test/            testes de API e de segurança (RLS) contra banco real
web/               app do cliente (PWA)
  src/components/  sistema de design (ui/) e componentes do produto
  src/pages/       telas
  src/lib/         cliente da API, autenticação, localização, hooks de dados
e2e/               teste ponta a ponta no navegador (Playwright)
docs/              arquitetura, ranking, avaliações, segurança
```

## Como rodar localmente

Requisitos: Node 20+ e PostgreSQL 14+.

```bash
npm install
cp .env.example .env
npm run db:setup     # cria os papéis conecta (dono) e conecta_app (aplicação) e os bancos
npm run db:reset     # migrações + 5.571 municípios + dados de demonstração
npm run dev          # API em :3001 e app em http://localhost:5173
```

`db:setup` usa `sudo -u postgres psql`; para outro acesso, defina `PSQL="psql -U postgres -h localhost"`.

## Testes

```bash
npm test             # 22 testes de regras (ranking, selos, validação) + 19 testes de API/segurança
npm run test:e2e     # navegador: localização, busca, filtros, empresa, login, favorito, agendamento,
                     # avaliação, orçamento, cidade sem empresas e layout desktop
```

Os testes de API usam o banco `conecta_test` (recriado a cada execução). O teste e2e usa a conta de demonstração
e espera o servidor rodando (`npm run build && npm start`); rode `npm run db:reset` antes de repeti-lo.
Para salvar capturas de tela: `SHOTS=1 npm run test:e2e`.

## Prévia sem servidor

Uma versão que roda inteira no navegador, com os dados de demonstração embutidos, para visualizar o app sem
publicar nada. Usa as mesmas regras (`packages/shared`) que a API; contas, favoritos, pedidos e avaliações
criados nela ficam só no navegador de quem a abre. Não é segura nem substitui o servidor.

```bash
npm run db:reset && npm run preview:data   # atualiza web/src/preview/data.json a partir do banco
npm run preview:build                      # gera web/dist-preview (sem service worker, navegação em memória)
```

## Publicar (Neon + Render, planos gratuitos)

1. **Banco:** crie um projeto em [neon.tech](https://neon.tech) e copie a *connection string*
   (`postgresql://...neon.tech/neondb?sslmode=require`).
2. **App:** no [Render](https://render.com), escolha **New → Blueprint**, selecione este repositório e cole a
   connection string em `DATABASE_OWNER_URL`. O arquivo `render.yaml` cuida do resto.
3. Na primeira inicialização, `npm run db:deploy` cria o papel do app no banco (`conecta_app`, com a senha gerada
   em `DB_APP_PASSWORD`), aplica as migrações, importa os municípios e, com `DEMO_MODE=true`, os dados de exemplo.
   Ele é idempotente: roda a cada inicialização sem apagar nada.

Outros provedores: qualquer Node 22 + PostgreSQL. Comando de build `npm ci --include=dev && npm run build`,
início `npm run db:deploy && npm start`. Variáveis: `NODE_ENV=production`, `COOKIE_SECURE=true`,
`DATABASE_OWNER_URL` (dono, precisa de CREATEROLE), `DB_APP_PASSWORD` (12+ caracteres) ou `DATABASE_URL` pronta
do papel da aplicação, e `DEMO_MODE=false` quando houver empresas reais. HTTPS é obrigatório (PWA e geolocalização).
No plano gratuito do Render o app "dorme" após 15 min sem acesso; o primeiro acesso depois disso leva ~1 minuto.

## Trocar a marca

- Nome, slogan e e-mail: `packages/shared/src/brand.ts`
- Cores: `web/src/styles/theme.css` (e `themeColor` em `brand.ts`)
- Ícone: `web/public/icon.svg` → gere os PNGs com `node scripts/make-icons.mjs`

## Próximos passos

- **Painel empresarial** — o banco já tem `business_members`, políticas RLS de edição para membros,
  `review_replies`, áreas de atendimento e contadores de resposta (selo “Responde às solicitações”).
- Envio real de pedidos às empresas (e-mail/WhatsApp Business API) e notificações ao cliente.
- Recuperação de senha por e-mail (precisa de um provedor de e-mail).
- Upload de fotos (Supabase Storage/S3) e processo de verificação de empresas.
- Painel de moderação de denúncias.
- Ranking pré-calculado em coluna/visão materializada quando houver milhares de empresas por cidade.

Lançamento na Google Play: [store/PLAY-STORE.md](store/PLAY-STORE.md)

Detalhes: [arquitetura](docs/ARQUITETURA.md) · [ranking e selos](docs/RANKING.md) · [avaliações](docs/AVALIACOES.md) · [segurança e privacidade](docs/SEGURANCA.md)
