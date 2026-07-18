---
name: clean-code-refactor
description: >
  Use when refactoring code to reduce complexity, split large functions, improve naming, isolate error handling, or apply safer incremental improvements. Not for feature development from scratch.
---

# Clean Code Refactor

Refatore código de forma incremental, preservando o comportamento funcional.

## Regras
- Não altere o comportamento sem sinalizar explicitamente.
- Priorize extrair métodos, reduzir parâmetros, melhorar nomes e isolar tratamento de erro.
- Faça pequenas mudanças seguras.
- Aplique a regra do escoteiro: deixe o código melhor do que encontrou.
- Preserve testes existentes e sugira novos testes quando necessário.

## Checklist
- A função foi dividida em partes menores?
- Os nomes revelam intenção?
- O tratamento de exceções está separado da lógica principal?
- A duplicação foi reduzida?
- A refatoração pode ser testada facilmente?

## Formato de resposta
1. **Problema identificado**
2. **Código sugerido**
3. **Por que melhora**
4. **Garantia de comportamento preservado**
5. **Testes recomendados**
