# Nota do CFO: Pataí

> Os valores estão em **reais** (a ferramenta escreve "$") e cada "unidade" é **uma empresa pagante em um mês**: onde a tabela diz "a day", leia "por mês". Não é aconselhamento financeiro, contábil ou jurídico: um contador deve conferir CNPJ, enquadramento no Simples e impostos antes de qualquer dinheiro mudar de mão.

- **A margem:** cada empresa pagante deixa **R$ 45,00 por mês** (90% dos R$ 49,99), depois da taxa da Asaas e do imposto. Com 30 empresas pagantes, a margem é de **67%**.
- **Ponto de equilíbrio: 8 empresas pagantes** cobrem os R$ 345 fixos por mês (servidor, banco, contador).
- **Dinheiro antes de se pagar: cerca de R$ 978**, o pior momento do caixa (mês 4). O investimento inicial volta no **mês 8**, e o 1º ano fecha com **R$ 3.420 de lucro** sobre R$ 8.398 de receita.

**O ponto de atenção é o seu tempo, não o preço.** Estas contas assumem **pró-labore zero** e **marketing zero**. Com um pró-labore de R$ 2.000 por mês, o equilíbrio sobe de 8 para **53 empresas pagantes** e o 1º ano termina com **R$ 20.580 de prejuízo**. A segunda linha é a curva de entrada (todas as empresas por mês são estimativa minha): se entrarem só metade, o 1º ano fecha com **R$ 360 de prejuízo** e o investimento não volta no ano.

**Três jeitos de melhorar a margem (rodados na ferramenta):**
1. **Cobrar R$ 59,99:** equilíbrio cai para 7 empresas, o lucro do 1º ano sobe para R$ 5.100 (+R$ 1.680) e o investimento volta no mês 7. Ainda abaixo do AppBarber (R$ 79,90).
2. **Trazer empresas mais rápido:** é o que mais pesa. Cada empresa a mais, todo mês do ano, soma R$ 45 por mês. Metade do ritmo transforma lucro em prejuízo.
3. **Cortar fixos:** o contador (R$ 200, estimativa) é 58% do custo fixo. Enquanto não houver faturamento, dá para adiar o banco pago (R$ 105) ficando no plano grátis do Neon.

Atenção ao "preço de fundador" que o conselho sugeriu: a **R$ 39,99** o 1º ano cai para **R$ 1.740** e o equilíbrio sobe para 10 empresas. Funciona como urgência, mas só para poucas empresas e por prazo curto.

**Condições de dinheiro do conselho (founder/board.md):**
- [x] A taxa da Asaas cabe em R$ 49,99: sim, sobram R$ 45 (90%).
- [ ] Custo e ritmo de aquisição de cada empresa: **em aberto**, e é o número que decide tudo. Medir no piloto.
- [ ] Conversão do teste grátis para pagante: **em aberto**. A curva acima supõe que toda empresa que entra paga.
- [ ] Garantia que o CFO aprova: com R$ 45 de margem, um mês grátis de garantia custa R$ 45 por empresa que usar; cabe se for para poucas empresas piloto.

---

# Unit economics: Pataí (assinatura para empresas pet, Joinville)

Every number below comes from the input file. Nothing is looked up or guessed.

## One empresa pagante no mês

| line | per empresa pagante no mês |
| --- | ---: |
| Price | $49.99 |
| Taxa Asaas por cobrança recebida (Pix R$ 1,99; cartão R$ 0,49 + 2,99% = R$ 1,98) | -$1.99 |
| Imposto Simples Nacional, estimativa 6% (Anexo III) | -$3.00 |
| **Contribution** (what each empresa pagante no mês leaves to pay the fixed costs) | **$45.00** (90%) |

## The margin that matters

Fixed costs: $345 a month (Servidor Render Starter (US$ 7) $40, Banco de dados Neon pago (US$ 19) $105, Contador para o CNPJ no Simples (estimativa) $200, Pró-labore do fundador (não informado: 0) $0, Marketing pago (não informado: 0) $0).

- **Break-even: 8 empresa pagante no mêss a day.** Below that you lose money every month.
- **Profit margin at your plan** (30 a day): **67%** of every sale, after every cost.

## Year 1, month by month

| month | empresa pagante no mêss a day | revenue | profit | cumulative (after $138 startup) |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 0 | $0 | -$345 | -$483 |
| 2 | 2 | $100 | -$255 | -$738 |
| 3 | 4 | $200 | -$165 | -$903 |
| 4 | 6 | $300 | -$75 | -$978 |
| 5 | 9 | $450 | $60 | -$918 |
| 6 | 12 | $600 | $195 | -$723 |
| 7 | 15 | $750 | $330 | -$393 |
| 8 | 18 | $900 | $465 | $72 |
| 9 | 21 | $1,050 | $600 | $672 |
| 10 | 24 | $1,200 | $735 | $1,407 |
| 11 | 27 | $1,350 | $870 | $2,277 |
| 12 | 30 | $1,500 | $1,005 | $3,282 |

- **Year 1 operating profit: $3,420** on $8,398 of revenue.
- After the $138 startup spend: $3,282.
- Startup money earned back: month 8.
- Cash you need before it pays for itself: **$978**.

## What if

| scenario | margin at plan | break-even a day | year 1 profit |
| --- | ---: | ---: | ---: |
| Base plan | 67% | 8 | $3,420 |
| Price -10% | 63% | 9 | $2,580 |
| Volume -20% | 61% | 8 | $1,908 |
| Unit costs +15% | 66% | 8 | $3,294 |

No red flags in these numbers. They are only as good as the inputs: check every cost against a real quote.
