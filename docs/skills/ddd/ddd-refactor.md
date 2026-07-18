---
name: ddd-refactor
description: >
  Use when refactoring anemic models, procedural business rules, implicit concepts, validations, and complex domain logic into explicit DDD structures. Not for cosmetic code cleanup.
---

# DDD Refactor

Transforme lógica de domínio implícita em conceitos explícitos, com pequenos passos seguros.

## Regras
- Refatore incrementalmente para evitar quebra.
- Extraia conceitos de negócio mencionados por especialistas para classes, Value Objects ou Specifications.
- Use Specifications para regras complexas e combináveis.
- Evite mover tudo para padrões DDD sem necessidade real.
- Preserve comportamento e recomende testes de caracterização antes da mudança.

## Checklist
- Há lógica escondida em métodos procedurais?
- Há validações duplicadas em vários pontos?
- Existe conceito de negócio implícito sem nome?
- Uma regra complexa pode virar Specification?
- O modelo atual expressa a linguagem do negócio?

## Formato de resposta
1. **Conceito implícito identificado**
2. **Transformação explícita sugerida**
3. **Antes e depois**
4. **Impacto na flexibilidade**
5. **Plano de rollout seguro**
