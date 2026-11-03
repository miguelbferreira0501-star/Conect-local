# HamiCare

<img src="docs/logo/hamicare-logo-1024.png" alt="Logo do HamiCare: o Hami de pertinho com um girassol" width="160">

**Sua jornada, seu mascote, sua evolução.** O **Hami**, um hamster, **emagrece ou ganha peso junto com você**: cada missão saudável (beber água no lugar do refrigerante, comer uma fruta, caminhar) tira ou soma as mesmas calorias de vocês dois. Em volta disso: cuidados animados, casa, aventuras, bem-estar e uma rede de amigos só de gentileza.

- Decisões (auditoria, escolha do mascote, plano, mecânica de peso): [`docs/DECISOES.md`](docs/DECISOES.md)
- O que veio do Finch e como ficou original: [`docs/FINCH.md`](docs/FINCH.md)
- O que foi testado: [`docs/TESTES.md`](docs/TESTES.md)
- Logo e ícones: [`docs/logo/`](docs/logo) (o SVG gera os ícones do app em `web/public/`)

## O que tem

| Área | Funções |
|---|---|
| **Jornada de peso** | Missão escolhida no começo: emagrecer, ganhar peso ou manter. Cada missão tem calorias estimadas (movimento pelo MET × seu peso; trocas saudáveis; lanches nutritivos para ganhar). O Hami recebe as mesmas calorias: quando você chega na sua meta, ele chega na dele. Número voando ao concluir, resumo semanal, meta alcançada, opção de seguir a balança |
| **Início** | Só o essencial: o Hami no jardim (céu muda com a hora), o card da jornada de peso e as missões do dia com o botão de concluir. Boas-vindas do dia e tela de ofensiva com raios de sol |
| **Cuidar** | Aba própria do Hami: ele na casinha dizendo do que precisa (com atalho para o cuidado certo), as 4 barrinhas e os 8 cuidados em botões grandes, com marquinha do que já foi feito hoje |
| **Cuidados** | Cafuné (cócegas na barriga, cafuné na cabeça), lanchinho arrastando a comida até a boca, banho com chuveirinho/esponja/toalha/secador e espuma de verdade, Chuva de sementes e Busca a bolinha, escovar os nozinhos do pelo, hora de nanar (apagar a luz, cobrir, cantar) e acordar |
| **Nossa evolução** | Jornada (agora → meta, progresso, calorias da semana, gráfico do peso do Hami, como as contas funcionam, trocar missão), 4 fases, condicionamento, seu peso (opcional, privado), meta segura, conquistas, fotos, linha do tempo |
| **Missões** | 39 sugestões (com "Para a sua jornada" no topo) + as suas; selo de calorias em cada uma; bateria do dia e modo dia difícil; ofensiva com 2 descansos protegidos; temporada do mês com prêmio; desafios diários, semanais e mensais |
| **Mundo** | Casa com móveis arrastáveis e 7 estilos; mapa com 10 lugares e álbum de figurinhas dos 30 achadinhos (sombrinha nas que faltam); loja da Dona Capivara com coleção do dia, 79 itens, temporadas, desejos e presentes; armário |
| **Bem-estar** | Humor com emoções e gráfico, diário privado com reflexões guiadas, respiração (3 ritmos), 5-4-3-2-1, meditação, foco, relaxamento, rotina de sono, afirmações, pote de coisas boas, quizzes de autoconhecimento, CVV 188 |
| **Amigos** | Perfil estilo rede social (Hami com anel, bio, posts, amigos, ofensiva, grade de posts, casa), "stories" dos amigos, feed com toque duplo para curtir, reações só positivas e comentários no filtro de gentileza; **grupos** com mural próprio; pedidos, bloquear, denunciar, vibes, presentes e desafios em grupo |
| **Ajustes** | Perfil e faixa de idade, Hami (nome, 14 pelagens, jeitinho), tema claro/escuro, 6 cores de app, lembretes, privacidade, dados físicos (consentimento, modo sem números, apagar registros), HamiCare+, conta e nuvem, código de backup, começar do zero |
| **Admin** | Estatísticas, denúncias (remover/manter), usuários (Plus, suspender), eventos e missões especiais |

## Segurança e cuidado

- Calorias são **estimativas honestas** (7.700 kcal ≈ 1 kg), explicadas na tela. Água e fruta contam como **trocas** (o que deixou de comer ou beber); a água sozinha vale só 5 kcal.
- **Sem exagero**: até 800 kcal contam por dia (700 para ganhar). Exercício para quem quer ganhar peso nunca tira peso do Hami. Descanso nunca tira nada.
- Meta segura: até 20% do peso por jornada (15% para ganhar), nunca abaixo de IMC 18,5. Aviso de cuidado se o peso real cai rápido.
- **Menores de 18**: o Hami não muda de peso e não existe contagem de calorias. Comentários só com elogios prontos, sem foto real. **Até 12 anos**: sem amigos e feed, com autorização de um responsável.
- Perfil público mostra só coisas boas (nome, Hami, nível, ofensiva, conquistas, bio): **nunca** peso, calorias, diário ou humor.
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
npm test                                    # 40 testes da lógica (calorias e jornada, ofensiva, desafios, filtro, social e grupos)

# Servidor (serve a API e o app em http://localhost:3002)
cd ../server && npm install && cp .env.example .env
npm run migrate && npm run dev
npm test                                    # 25 testes de API e RLS em Postgres real (inclui perfis e grupos)
```

Para a página de teste no Claude: `cd web && npm run build:artifact` gera `dist/hamicare.html`.

## Publicar

`render.yaml` (na pasta `hamicare/`) sobe tudo no Render: informe `DATABASE_OWNER_URL` (Neon ou Supabase), `ADMIN_EMAILS` e `APP_ORIGINS`. O deploy cria o papel da API, aplica as migrações e serve o app. Instalado no celular (PWA), o HamiCare recebe lembretes push.

## Estrutura

```
docs/      decisões, pesquisa do Finch e testes
web/       app (React + TypeScript + Vite + Tailwind)
  src/data/      conteúdo: atividades, itens, mundo, falas, bem-estar, pelagens
  src/logic/     regras puras e testadas: calorias e jornada, condicionamento, ofensiva, níveis, desafios, conquistas
  src/shared/    filtro de gentileza (usado também pelo servidor)
  src/lib/       estado salvo, conta e sincronização, social (página de teste e servidor), lembretes
  src/components o Hami (SVG), o jardim, a casa, a jornada, a vendedora e interface
  src/screens/   telas (social/ tem perfil, posts e grupos)
server/    API (Hono + PostgreSQL com RLS), migrações e testes
```

## Próximos passos

1. **Cobrança do Plus**: Google Play Billing / App Store (obrigatório dentro das lojas) e Pix via Asaas na web. O teste grátis de 7 dias já funciona.
2. **App nas lojas** com Capacitor (o mesmo código).
3. **Moderação com IA** no servidor, somada ao filtro atual.
4. **Revisão jurídica**: termos de uso, política de privacidade (LGPD) e regras para crianças e adolescentes (ECA Digital).
5. **Teste com pessoas reais** antes de investir em anúncios.
