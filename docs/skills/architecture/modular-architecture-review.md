---
name: modular-architecture-review
description: >
  Use when reviewing modularity, cohesion, coupling, folder structure, component boundaries, dependency cycles, and refactoring paths in a codebase. Not for isolated bug fixes unless modularity is the issue.
---

# Modular Architecture Review

Revise a modularidade do sistema, identificando acoplamento, baixa coesão, ciclos de dependência e componentes que fazem coisas demais.

## Regras
- Prefira alta coesão funcional e baixo acoplamento.
- Identifique módulos com responsabilidades misturadas.
- Aponte dependências cíclicas e dependências indevidas entre domínio, UI, aplicação e infraestrutura.
- Evite refatorações grandes demais sem plano incremental.
- Preserve comportamento funcional enquanto melhora a estrutura.

## Checklist
- O módulo tem uma responsabilidade clara?
- Existem componentes genéricos demais, como `utils`, `helpers`, `manager` ou `service` com muitas responsabilidades?
- A UI contém regra de negócio?
- O domínio depende de detalhes de infraestrutura?
- Existem imports cruzados entre módulos que deveriam ser independentes?
- Há duplicação de regra de negócio?

## Formato de resposta
1. **Diagnóstico de modularidade**
2. **Pontos de acoplamento**
3. **Risco de regressão**
4. **Plano de refatoração incremental**
5. **Arquivos ou camadas que devem ser protegidos**
