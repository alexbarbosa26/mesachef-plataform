---
name: clean-code-tests
description: >
  Use when writing or reviewing tests for readability, reliability, independence, coverage, edge cases, and maintainability. Not for manual QA checklists unless test code is involved.
---

# Clean Code Tests

Revise ou crie testes limpos, rápidos, independentes e confiáveis.

## Regras
- Siga F.I.R.S.T.: Fast, Independent, Repeatable, Self-validating, Timely.
- O código de teste deve ser tão legível quanto o código de produção.
- Teste comportamento, não detalhes internos frágeis.
- Prefira um assert por conceito.
- Cubra caminho feliz, erros e casos de borda.

## Checklist
- O teste explica o comportamento esperado?
- Os testes dependem de ordem de execução?
- Existem mocks excessivos?
- O teste falha por motivo claro?
- Há cenários de erro e borda?
- O setup do teste é simples?

## Formato de resposta
1. **Análise F.I.R.S.T.**
2. **Cobertura atual**
3. **Casos ausentes**
4. **Sugestão de testes**
5. **Refatoração de testes**
