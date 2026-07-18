---
name: architecture-tradeoff-analysis
description: >
  Use when comparing architectural styles, technologies, integration approaches, deployment models, or implementation alternatives. Not for deciding purely visual UI preferences.
---

# Architecture Trade-off Analysis

Compare alternativas técnicas com foco em ganhos, perdas, riscos, custo operacional e aderência ao contexto do produto.

## Regras
- Toda decisão arquitetural possui trade-offs.
- Evite respostas absolutas. Use “depende” apenas quando explicar de que depende.
- Avalie complexidade operacional, custo de manutenção, maturidade do time e impacto em produção.
- Para soluções distribuídas, considere latência, falhas de rede, consistência de dados e observabilidade.
- Recomende a solução “menos pior” para o contexto atual.

## Checklist
- Como cada alternativa afeta performance?
- Como cada alternativa afeta manutenção e evolução?
- Qual é o custo de implementação e operação?
- Qual risco de lock-in, overengineering ou retrabalho?
- Qual alternativa preserva melhor as funcionalidades existentes?

## Formato de resposta
Crie uma tabela:

| Critério | Solução A | Solução B | Observação |
|---|---|---|---|

Finalize com:
- **Veredito**
- **Quando eu mudaria de decisão**
- **Próximo passo seguro**
