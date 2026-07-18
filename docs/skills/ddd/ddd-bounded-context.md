---
name: ddd-bounded-context
description: >
  Use when defining bounded contexts, context maps, core domain, subdomains, anti-corruption layers, and integration boundaries. Not for simple component folder organization.
---

# DDD Bounded Context

Defina limites de modelo e estratégias de integração entre contextos, times ou sistemas.

## Regras
- Um modelo deve ter limite explícito onde os termos possuem significado consistente.
- Identifique Core Domain, Supporting Subdomain e Generic Subdomain.
- Use Camada Anticorrupção ao integrar com sistemas legados ou modelos externos ruins.
- Não force um único modelo para toda a empresa quando os termos mudam de significado.
- Separe contextos por linguagem, regras e ciclo de vida, não apenas por tabela.

## Checklist
- Quais termos mudam de significado entre áreas?
- O contexto tem base de código, banco ou API própria?
- Como os contextos se comunicam?
- Há Shared Kernel, Customer-Supplier, Conformist ou ACL?
- Onde existe risco de contaminação do modelo?

## Formato de resposta
1. **Mapa de contextos**
2. **Termos com significados conflitantes**
3. **Padrão de integração recomendado**
4. **Risco de contaminação**
5. **Plano incremental**
