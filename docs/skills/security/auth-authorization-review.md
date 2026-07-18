---
name: auth-authorization-review
description: >
  Use when reviewing authentication, authorization, roles, permissions, JWT/OAuth flows, row-level security, tenant isolation, audit trails, and security context propagation. Not for visual login screen design only.
---

# Auth and Authorization Review

Revise controle de acesso, rastreabilidade, escopo de permissões e propagação de identidade.

## Regras
- Todo acesso deve ser rastreável ao originador.
- Valide autorização na borda e também nas regras relevantes de domínio.
- Aplique privilégio mínimo.
- Em sistemas multiempresa, garanta isolamento por tenant.
- Não confie apenas no frontend para controle de acesso.
- Trate dados sensíveis com cuidado em trânsito, repouso e logs.

## Checklist
- A identidade do usuário se perde entre chamadas?
- Roles e permissões refletem regras de negócio ou apenas flags técnicas?
- Um tenant pode acessar dados de outro?
- RLS ou equivalente está habilitado onde precisa?
- Há logs de ações críticas?
- Tokens, secrets ou PII aparecem em logs?

## Formato de resposta
1. **Lacuna de rastreabilidade**
2. **Risco de privilégio excessivo**
3. **Risco multiempresa/tenant**
4. **Sugestão de fluxo seguro**
5. **Testes manuais recomendados**
