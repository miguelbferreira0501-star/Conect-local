"""Cenários financeiros do Pasta em Dia. Todas as entradas são premissas (ver RELATORIO.md, Parte G)."""
# Custo variável por escritório/mês (80 clientes, ~4 documentos e ~3 lembretes por cliente)
docs = 80 * 4
ia = docs * 0.0015 * 5.4          # Haiku 5.5: ~US$0,0015 por documento (8 mil tokens de entrada + 1 mil de saída), câmbio R$5,4
whats_fase2 = 80 * 3 * 0.035     # só na fase 2 (API oficial); no MVP os lembretes saem pelo WhatsApp do próprio escritório
armazen = 1.0                     # R2/S3, alguns GB
taxa_cobranca = 3.0               # Asaas (Pix/boleto), aproximado
var_mvp = ia + armazen + taxa_cobranca
var_f2 = var_mvp + whats_fase2
print(f"custo variável/escritório: MVP R$ {var_mvp:.2f} | fase 2 R$ {var_f2:.2f} (IA R$ {ia:.2f})")

cen = {
  "Conservador":   dict(clientes=15, preco=149, fixo=450,  var=var_f2),
  "Intermediário": dict(clientes=40, preco=179, fixo=800,  var=var_f2),
  "Otimista":      dict(clientes=90, preco=199, fixo=1800, var=var_f2),
}
print("\n| Cenário (mês 12) | Clientes | Preço médio | Receita mensal | Receita anualizada | Custo variável | Custo fixo | Margem bruta | Resultado mensal |")
print("|---|---|---|---|---|---|---|---|---|")
for n, c in cen.items():
    mrr = c["clientes"] * c["preco"]; v = c["clientes"] * c["var"]
    mb = (mrr - v) / mrr * 100; res = mrr - v - c["fixo"]
    print(f"| {n} | {c['clientes']} | R$ {c['preco']} | R$ {mrr:,.0f} | R$ {mrr*12:,.0f} | R$ {v:,.0f} | R$ {c['fixo']:,} | {mb:.0f}% | R$ {res:,.0f} |".replace(",", "."))

print("\nPonto de equilíbrio (clientes para cobrir o custo fixo):")
for preco in (99, 149, 199):
    for fixo in (450, 800):
        print(f"  preço R$ {preco}, fixo R$ {fixo}: {fixo / (preco - var_f2):.1f} escritórios")

print("\nSensibilidade (cenário intermediário):")
base = cen["Intermediário"]
def res(cl, pr, fx=base["fixo"]): return cl * (pr - base["var"]) - fx
print(f"  base: R$ {res(40, 179):,.0f}/mês")
print(f"  preço cai para R$ 99: R$ {res(40, 99):,.0f}/mês")
print(f"  só 20 clientes (retenção ruim/aquisição lenta): R$ {res(20, 179):,.0f}/mês")
print(f"  20 clientes a R$ 99: R$ {res(20, 99):,.0f}/mês")
contrib = 179 - base["var"]
for cac in (150, 400, 800):
    print(f"  CAC R$ {cac}: retorno em {cac/contrib:.1f} meses de contribuição")
for churn in (0.03, 0.06, 0.10):
    print(f"  churn {churn:.0%}/mês: vida média {1/churn:.0f} meses, LTV ≈ R$ {contrib/churn:,.0f}")
