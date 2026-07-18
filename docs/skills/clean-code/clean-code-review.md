---
name: clean-code-review
description: >
  Use when reviewing code quality, readability, duplication, complexity, functions, classes, and maintainability. Not for security-focused reviews unless code cleanliness is the main issue.
---

# Clean Code Review

Revise código com foco em legibilidade, simplicidade, duplicação, funções pequenas, nomes claros e responsabilidade única.

## Regras
- Identifique violações de DRY.
- Avalie se funções e classes seguem responsabilidade única.
- Remova ruídos: comentários óbvios, variáveis inúteis, abstrações sem valor e código morto.
- Prefira clareza a esperteza.
- Não proponha mudanças que alterem comportamento sem avisar.

## Checklist
- O código é fácil de ler como uma narrativa?
- Existem nomes genéricos como `data`, `info`, `result`, `manager`, `helper`?
- Há ifs/loops aninhados demais?
- Funções têm mais de um nível de abstração?
- Existe duplicação de regra de negócio?
- Erros são tratados de forma consistente?

## Formato de resposta
1. **Nota de saúde do código:** 1 a 5
2. **Principais violações**
3. **Sugestões objetivas**
4. **Refatoração recomendada**
5. **Risco de alterar comportamento**
