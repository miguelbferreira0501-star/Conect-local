# Ranking e selos

Implementação: `packages/shared/src/ranking.ts` e `badges.ts` (testados em `packages/shared/test`).

## Nota ajustada (média bayesiana)

```
nota_ajustada = (n / (n + m)) × média_da_empresa + (m / (n + m)) × média_geral
```

- `n` = avaliações publicadas da empresa; `m = 10` (peso do “prior”).
- `média_geral` = média de todas as avaliações publicadas (usa 3,8 enquanto a plataforma tiver menos de 50).

## Pontuação “Mais relevantes”

```
qualidade    = (nota_ajustada − 1) / 4
volume       = log(1 + n) / log(1 + 200)            (máx. 1)
recência     = 0,5 ^ (dias_desde_a_última_avaliação / 180)
consistência = 1 − desvio_padrão / 2                (só com 3+ avaliações)
completude   = itens do perfil preenchidos / 10

base  = 0,50·qualidade + 0,15·volume·qualidade + 0,10·recência + 0,10·consistência + 0,15·completude
final = base × (0,4 + 0,6·relevância_textual) × fator_localização
```

- O volume é multiplicado pela qualidade: muitas avaliações medianas não viram vantagem.
- `fator_localização`: sede na cidade 1,0 · atende a cidade 0,95 · só on-line 0,9.
- **Descoberta:** a cada 6 posições, a primeira empresa “nova” (≤ 90 dias e < 5 avaliações) que estiver mais
  abaixo sobe para essa vaga, com a etiqueta “Nova na plataforma” — não é selo de qualidade.
- **Melhor avaliadas** ordena pela nota ajustada; **Mais avaliações** pela contagem; **Mais próximas** só fica
  disponível com a localização do aparelho; **Mais recentes** pela data de cadastro.
- Pagamento não entra na fórmula. Resultados patrocinados, se existirem, devem ser exibidos à parte, com o rótulo
  “Patrocinado”.

## Exibição da nota

Uma casa decimal, **arredondada para baixo** (4,86 → 4,8). Sem avaliações: “Sem avaliações ainda”. Com menos de
3: aviso “(poucas avaliações)”.

## Selos

| Selo | Critério |
| --- | --- |
| Perfil verificado | `verified_at` preenchido por processo interno de verificação (documento/CNPJ, endereço, telefone). Não garante qualidade. |
| Histórico consistente | ≥ 20 avaliações, média ≥ 4,3, desvio ≤ 1,0 e avaliações espalhadas por ≥ 180 dias. |
| Muitas avaliações | ≥ 50 avaliações publicadas. |
| Responde às solicitações | ≥ 80 % de respostas com ≥ 10 pedidos recebidos (preenchido pelo painel empresarial). |
| Agenda disponível | Aceita agendamento, tem serviço agendável e horários cadastrados. |

## Outros dados exibidos com cautela

- “Aberto agora” só aparece se os horários foram confirmados nos últimos 180 dias e a empresa atende no local.
- Distância só aparece com a localização do aparelho e coordenadas da empresa.
- “Serviços procurados” só aparece com pelo menos 3 serviços com 3+ pedidos nos últimos 90 dias.
