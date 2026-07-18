---
name: security-refactor
description: >
  Use when refactoring insecure legacy code, primitive obsession, ambiguous parameters, validation duplication, weak error handling, logging gaps, or unsafe money/quantity handling. Not for adding unrelated features.
---

# Security Refactor

Proponha refatorações seguras para transformar código legado vulnerável em código robusto sem alterar comportamento essencial.

## Regras
- Preserve o comportamento funcional básico.
- Introduza tipos de domínio gradualmente quando houver risco de quebra.
- Consolide validações espalhadas em Domain Primitives ou Value Objects.
- Reduza excesso de `null` e parâmetros ambíguos.
- Evite floats para dinheiro.
- Inclua estratégia de rollout quando a mudança for sensível.

## Checklist
- Métodos recebem múltiplas Strings ambíguas?
- Há validação duplicada em vários pontos?
- Dinheiro, percentuais ou quantidades usam tipo inadequado?
- Exceções são genéricas demais?
- Logs capturam eventos críticos sem vazar segredo?
- Há como aplicar por etapas?

## Formato de resposta
1. **Código original vs refatorado**
2. **Princípio aplicado**
3. **Risco mitigado**
4. **Estratégia de rollout**
5. **Testes de regressão**
