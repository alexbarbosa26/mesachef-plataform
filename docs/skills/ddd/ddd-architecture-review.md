---
name: ddd-architecture-review
description: >
  Use when reviewing whether business logic is isolated from UI, application, infrastructure, database, Supabase calls, controllers, and external services. Not for purely visual UI work.
---

# DDD Architecture Review

Revise a separação de responsabilidades com foco em manter o domínio independente da infraestrutura.

## Regras
- A lógica de negócio deve ficar no domínio.
- A camada de aplicação deve coordenar casos de uso, sem conter regra de negócio pesada.
- Repositórios devem ocultar detalhes de persistência.
- UI, banco, APIs e bibliotecas externas não devem ditar o modelo de domínio.
- Evite modelo anêmico quando há regra de negócio relevante.

## Checklist
- Regras de negócio estão em controllers, hooks, componentes React, SQL ou Edge Functions?
- O domínio depende de Supabase, HTTP, storage ou bibliotecas de UI?
- Repositórios existem apenas para Raízes de Agregado?
- Casos de uso estão claros?
- Existe acoplamento que prejudica testes?

## Formato de resposta
1. **Violação de camada**
2. **Impacto na testabilidade**
3. **Risco de manutenção**
4. **Refatoração sugerida**
5. **Sequência segura de alteração**
