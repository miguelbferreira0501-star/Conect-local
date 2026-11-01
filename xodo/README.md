# Xodó (nome provisório)

App de autocuidado com um bichinho virtual, **em português**. O xodó cresce quando você cuida de você: beber água, sair da cama, respirar fundo. Sem culpa e sem cobrança.

Inspirado no que as pessoas elogiam nos apps de "bichinho de autocuidado" (como o Finch, que só existe em inglês), mas **original**: outro bichinho, outro nome, outra arte, outras mecânicas. Não copie arte, nomes ou textos de outro app.

## O que as avaliações pediam → o que o Xodó faz

| Avaliações (Play Store, Brasil) | No Xodó |
|---|---|
| "Pena não ter tradução para português" | 100% em português do Brasil, com jeito brasileiro de falar |
| "Bichinho fofo + gamificação" | Xodó desenhado do zero, com 4 fases (Broto → Filhote → Jovem → Adulto), expressões, piscadas e pulinho a cada cuidado |
| "Metas simples que a gente esquece (agradecer a si mesmo por ter sobrevivido ao dia)" | Biblioteca de cuidados pequenos, mais as metas da própria pessoa (todo dia ou só hoje) |
| "Técnicas para acalmar ansiedade" | Tela **Calma**: respiração guiada pelo próprio bichinho, exercício 5-4-3-2-1 e ajuda (CVV 188, SAMU 192) |
| "Moedas, eventos, itens, aventuras" | Sementinhas, loja, temporadas (Natal, Festa Junina) e passeios pelo Brasil |
| "Deixar fazer login para salvar o progresso" | Código de backup para guardar e recuperar o progresso em outro celular (conta na nuvem é o próximo passo) |

## Inovações

1. **Bateria do dia.** A pessoa diz se a bateria está baixa, média ou cheia, e a lista de cuidados se ajusta ao tamanho da energia (3, 5 ou 6 itens).
2. **Modo dia difícil.** Com um toque, a lista encolhe e o bichinho muda de tom. Nada de culpa.
3. **Sem sequência perdida.** O app conta *dias em que você se cuidou*, nunca "você quebrou a sequência".
4. **Passeios pelo Brasil.** Com a disposição cheia, o xodó viaja (Noronha, Jalapão, Pantanal, Joinville…) e volta com um **cartão-postal**. Cada cuidado feito durante a viagem o traz 5 minutos mais cedo.
5. **Álbum de 14 lugares** e **lembrancinhas** que só vêm de viagem (cuia de chimarrão, capim-dourado…).
6. **Cantinho que muda com a hora do dia** (manhã, tarde, noite), com decoração brasileira (radinho, relógio da vó, costela-de-adão).
7. **Temporadas**: pisca-pisca e gorro no Natal, bandeirinhas e chapéu de palha no São João.
8. **Pote de coisas boas**: guarda uma coisa boa por dia e, no dia ruim, tira um bilhete aleatório.
9. **Diário de humor** com a semana em carinhas e anotação por dia.
10. **Integrações**: respirar na tela Calma ou guardar um bilhete no pote marca o cuidado correspondente sozinho.

## Rodar

```bash
cd xodo
npm install
npm run dev              # abre no navegador
npm run build            # gera dist/index.html (um arquivo só, funciona offline depois de aberto)
npm run build:artifact   # gera também dist/xodo.html, no formato para publicar como página
```

Tecnologia: React 18 + TypeScript + Vite + Tailwind (a mesma do Pataí). Tudo fica guardado no aparelho (localStorage); não há servidor ainda.

## Estrutura

- `src/data/`: conteúdo (cuidados, itens, lugares, falas do bichinho). Para criar conteúdo novo, mexa aqui.
- `src/lib/store.ts`: regras do jogo e progresso salvo.
- `src/components/Pet.tsx`: o bichinho (SVG), com fases, expressões, chapéus e acessórios.
- `src/screens/`: telas Hoje, Calma, Diário, Coleção, Ajustes e Primeiro acesso.

## Próximos passos

1. **Teste de demanda com anúncio** (R$ 300 a 500): página com vídeo do app e pré-venda. Ver `founder/ideias/eua-brasil.md`.
2. **Conta e nuvem** (Supabase ou o Postgres do Pataí) para trocar de celular sem código.
3. **Lembretes** (notificação no celular) no horário que a pessoa escolher.
4. **App nas lojas** com Capacitor. Atenção: assinatura dentro de app de loja tem que usar o pagamento da Apple/Google; Pix via Asaas só vale na versão web.
5. **Xodó+** (assinatura): mais roupas, passeios, temporadas e bichinhos. O básico (cuidados, Calma, diário) continua grátis.
6. **Cuidados legais e de saúde**: não prometer tratar ansiedade ou depressão; manter o CVV visível; política de privacidade (LGPD); regras das lojas para usuários menores de idade.
