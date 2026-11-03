# HamiCare

**Sua jornada, seu mascote, sua evolução.** App de autocuidado, hábitos, movimento e bem-estar emocional em que o **Hami**, um hamster, evolui junto com você: peso virtual, fases, casa, aventuras e amigos.

- Decisões (auditoria, escolha do mascote, plano, mecânica de peso): [`docs/DECISOES.md`](docs/DECISOES.md)
- O que veio do Finch e como ficou original: [`docs/FINCH.md`](docs/FINCH.md)
- O que foi testado: [`docs/TESTES.md`](docs/TESTES.md)

## O que tem

| Área | Funções |
|---|---|
| **Início** | Hami na casa, fala do dia, 8 cuidados (carinho, comida, banho em 6 passos, brincar, escovar, dormir/acordar, conversar, foto), felicidade/energia/barriguinha/limpeza, resumo do dia com ofensiva, missões, eventos, "Nossa evolução" |
| **Nossa evolução** | 4 fases lado a lado, condicionamento, gráfico do peso virtual (faixa saudável), seu peso (opcional, privado, sincronizável), meta segura, atividades por semana, conquistas, fotos virtuais, linha do tempo |
| **Atividades** | 31 sugestões em 4 categorias + as suas; criar, editar, excluir, concluir, desfazer; frequência (todo dia, dias da semana, só hoje); bateria do dia e modo dia difícil; ofensiva com 2 descansos protegidos por semana; desafios diários, semanais e mensais; compartilhar atividade concluída com foto |
| **Mundo** | Casa com móveis arrastáveis, parede, piso e 7 estilos (minimalista, aconchegante, natureza, moderno, tropical, colorido, pastel); mapa com 10 lugares, 30 missões e 30 achadinhos; loja com 79 itens, temporadas, lista de desejos, presente do dia e presentes para amigos; armário |
| **Bem-estar** | Humor com emoções e gráfico, diário privado com reflexões guiadas, respiração (3 ritmos), 5-4-3-2-1, meditação, foco, relaxamento, rotina de sono, afirmações, pote de coisas boas, quizzes de autoconhecimento, CVV 188 |
| **Amigos** | Código pessoal, pedidos, aceitar/recusar, bloquear, denunciar, visitar casas, vibes boas, presentes, desafios em grupo, feed com reações só positivas e comentários que passam no filtro de gentileza |
| **Ajustes** | Perfil e faixa de idade, Hami (nome, 14 pelagens, jeitinho), tema claro/escuro, 6 cores de app, lembretes, privacidade, dados físicos (consentimento, modo sem números, apagar registros), HamiCare+, conta e nuvem, código de backup, começar do zero |
| **Admin** | Estatísticas, denúncias (remover/manter), usuários (Plus, suspender), eventos e missões especiais |

## Segurança e cuidado

- Peso do Hami em **gramas de hamster**: nunca comparável a gente. Muda **uma vez por semana**, no máximo 3 g, nunca por exercício.
- **Menores de 18**: sem números de peso, sem metas, comentários só com elogios prontos, sem foto real. **Até 12 anos**: sem amigos e feed, com autorização de um responsável.
- No feed e nas visitas, o Hami de todo mundo aparece no **formato padrão**: ninguém compara corpo.
- Filtro de gentileza no app **e no servidor**: ofensas (inclusive disfarçadas), comentários sobre corpo, frases desanimadoras, telefone, redes e links são bloqueados. Duas denúncias de pessoas diferentes escondem o conteúdo na hora.
- Banco com **RLS**: cada consulta da API roda como o usuário. Backup (diário, peso, humor) só o dono lê. Plus e banimento só por funções de admin.
- Nada de culpa: descanso não tira nível, fase nem conquista.

## Rodar

```bash
# Banco (uma vez): cria os papéis e bancos locais do PostgreSQL
bash server/scripts/setup-local-db.sh

# App
cd web && npm install && npm run build      # dist/index.html + ícones e service worker
npm test                                    # 29 testes da lógica (peso, ofensiva, desafios, filtro, social)

# Servidor (serve a API e o app em http://localhost:3002)
cd ../server && npm install && cp .env.example .env
npm run migrate && npm run dev
npm test                                    # 20 testes de API e RLS em Postgres real
```

Para a página de teste no Claude: `cd web && npm run build:artifact` gera `dist/hamicare.html`.

## Publicar

`render.yaml` (na pasta `hamicare/`) sobe tudo no Render: informe `DATABASE_OWNER_URL` (Neon ou Supabase), `ADMIN_EMAILS` e `APP_ORIGINS`. O deploy cria o papel da API, aplica as migrações e serve o app. Instalado no celular (PWA), o HamiCare recebe lembretes push.

## Estrutura

```
docs/      decisões, pesquisa do Finch e testes
web/       app (React + TypeScript + Vite + Tailwind)
  src/data/      conteúdo: atividades, itens, mundo, falas, bem-estar, pelagens
  src/logic/     regras puras e testadas: peso, condicionamento, ofensiva, níveis, desafios, conquistas
  src/shared/    filtro de gentileza (usado também pelo servidor)
  src/lib/       estado salvo, conta e sincronização, social (página de teste e servidor), lembretes
  src/components o Hami (SVG), a casa, móveis e interface
  src/screens/   telas
server/    API (Hono + PostgreSQL com RLS), migrações e testes
```

## Próximos passos

1. **Cobrança do Plus**: Google Play Billing / App Store (obrigatório dentro das lojas) e Pix via Asaas na web. O teste grátis de 7 dias já funciona.
2. **App nas lojas** com Capacitor (o mesmo código).
3. **Moderação com IA** no servidor, somada ao filtro atual.
4. **Revisão jurídica**: termos de uso, política de privacidade (LGPD) e regras para crianças e adolescentes (ECA Digital).
5. **Teste com pessoas reais** antes de investir em anúncios.
