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
| **Jornada de peso** | Missão escolhida no começo: emagrecer, ganhar peso ou manter. **Missões são só hábitos saudáveis** (movimento, água, sono, pausas, cuidado): cada uma tem calorias estimadas (movimento pelo MET × seu peso) e o Hami recebe as mesmas. **Comida fica só no Cardápio de hoje**, para ver as calorias do prato. Para ganhar peso, o Hami cresce com o que a pessoa marcou que comeu acima da referência dela no Cardápio. Quando você chega na sua meta, ele chega na dele |
| **Início** | Só o essencial: o Hami no jardim (céu muda com a hora), o card da jornada de peso, o **cardápio de hoje** (alimentos de cada refeição com quantidade e calorias editáveis, 39 sugestões por refeição, "meus alimentos", marcar o que comeu, total e referência do dia, repetir o de ontem) e as missões do dia com o botão de concluir |
| **Cuidar** | Aba própria do Hami: ele na casinha dizendo do que precisa (com atalho para o cuidado certo), as 4 barrinhas e os 8 cuidados em botões grandes, com marquinha do que já foi feito hoje |
| **Cuidados** | Cafuné (cócegas na barriga, cafuné na cabeça), lanchinho arrastando a comida até a boca, banho com chuveirinho/esponja/toalha/secador e espuma de verdade, Chuva de sementes e Busca a bolinha, escovar os nozinhos do pelo, hora de nanar (apagar a luz, cobrir, cantar) e acordar |
| **Nossa evolução** | Jornada (agora → meta, progresso, calorias da semana, gráfico do peso do Hami, como as contas funcionam, trocar missão), 4 fases, condicionamento, seu peso (opcional, privado), meta segura, conquistas, fotos, linha do tempo |
| **Missões** | Só hábitos (sem alimentos): (com "Para a sua jornada" no topo) + as suas; selo de calorias em cada uma; bateria do dia e modo dia difícil; ofensiva com 2 descansos protegidos; temporada do mês com prêmio; desafios diários, semanais e mensais |
| **Mundo** | Casa com móveis arrastáveis e 7 estilos; mapa com 10 lugares e álbum de figurinhas dos 30 achadinhos; loja da Dona Capivara com coleção do dia, **312 itens** (195 para vestir: 72 chapéus, 23 óculos, 54 roupas, 34 acessórios e 12 efeitos como aura, asas e brilhos; 76 de casa; 16 paredes; 12 pisos), **12 looks completos com 20% de desconto** e **provador** para experimentar antes de comprar; Armário com 24 pelagens (8 compradas com sementes e 4 do Plus) |
| **Bem-estar** | Humor com emoções e gráfico, diário privado com reflexões guiadas e 9 ferramentas com cenário próprio e o Hami reagindo: respiração (anel que cresce e encolhe, Hami enche as bochechas e solta ventinho), 5-4-3-2-1, meditação (Hami flutuando sob a aurora), foco (Hami de óculos lendo), relaxar (luz passando pelo corpo), para dormir (cada passo acende uma estrela), afirmações, pote que enche de bilhetinhos e quizzes. CVV 188 |
| **Amigos** | Perfil estilo rede social (Hami com anel, bio, posts, amigos, ofensiva, grade de posts, casa), "stories" dos amigos, feed com toque duplo para curtir, reações só positivas e comentários no filtro de gentileza; **grupos** com mural próprio; pedidos, bloquear, denunciar, vibes, presentes e desafios em grupo |
| **Ajustes** | Perfil e faixa de idade, Hami (nome, 14 pelagens, jeitinho), tema claro/escuro, 6 cores de app, lembretes, privacidade, dados físicos (consentimento, modo sem números, apagar registros), HamiCare+, conta e nuvem, código de backup, começar do zero |
| **Admin** | Estatísticas, denúncias (remover/manter), usuários (Plus, suspender), eventos e missões especiais |

## Segurança e cuidado

- Calorias são **estimativas honestas** (7.700 kcal ≈ 1 kg), explicadas na tela. Um copo d'água vale só 5 kcal. Para emagrecer, o Cardápio não conta (só os hábitos), para não incentivar a comer menos do que precisa.
- **Sem exagero**: até 800 kcal contam por dia (700 para ganhar). Exercício para quem quer ganhar peso nunca tira peso do Hami. Descanso nunca tira nada.
- Meta segura: até 20% do peso por jornada (15% para ganhar), nunca abaixo de IMC 18,5. Aviso de cuidado se o peso real cai rápido.
- **Menores de 18**: o Hami não muda de peso e não existe contagem de calorias. Comentários só com elogios prontos, sem foto real. **Até 12 anos**: sem amigos e feed, com autorização de um responsável.
- Cardápio com calorias só para 18+ e só no aparelho e no backup privado. Referência diária abaixo de 1.200 kcal é recusada (só com nutricionista) e um cardápio pequeno demais ganha um aviso gentil.
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

Passo a passo em [`docs/PUBLICAR.md`](docs/PUBLICAR.md) (Neon, Render, Resend e domínio).

`render.yaml` (na pasta `hamicare/`; no Render, use *Blueprint Path* `hamicare/render.yaml`) sobe tudo: informe `DATABASE_OWNER_URL`, `ADMIN_EMAILS`, `APP_ORIGINS` e, para o e-mail de troca de senha, `RESEND_API_KEY` e `MAIL_FROM`. O deploy cria o papel da API, aplica as migrações e serve o app, a política de privacidade (`/privacidade`) e os termos (`/termos`). Instalado no celular (PWA), o HamiCare recebe lembretes push.

Antes de publicar, preencha os dados da empresa em `web/src/shared/legal.ts` (`LEGAL_INFO`).

## Estrutura

```
docs/      decisões, pesquisa do Finch e testes
web/       app (React + TypeScript + Vite + Tailwind)
  src/data/      conteúdo: atividades, itens, mundo, falas, bem-estar, pelagens
  src/logic/     regras puras e testadas: calorias e jornada, condicionamento, ofensiva, níveis, desafios, conquistas
  src/shared/    filtro de gentileza, política de privacidade e termos (usados também pelo servidor)
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
