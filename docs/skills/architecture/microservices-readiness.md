---
name: microservices-readiness
description: >
  Use when deciding whether to adopt, migrate to, or avoid microservices, or when comparing microservices with modular monoliths. Not for small single-team apps without distribution concerns.
---

# Microservices Readiness

Avalie criticamente se o sistema precisa de microserviços ou se um monolito modular atende melhor ao momento do produto.

## Regras
- Não recomende microserviços por moda.
- Verifique se há necessidade real de deploy, escala, disponibilidade ou tecnologia diferentes por domínio.
- Considere custo operacional: CI/CD, observabilidade, logs, tracing, versionamento de APIs, segurança, rollback e automação.
- Verifique riscos de transações distribuídas, consistência eventual e sagas.
- Sempre considere monolito modular como alternativa antes de microserviços.

## Checklist
- O domínio é naturalmente desacoplado?
- O time possui maturidade DevOps suficiente?
- As integrações suportam falha parcial?
- Há necessidade de escalar partes de forma independente?
- A complexidade de rede compensa o ganho?
- Existem transações ACID fortes entre domínios?

## Formato de resposta
1. **Veredito:** Pronto, Não pronto ou Modular primeiro
2. **Justificativa de negócio**
3. **Riscos operacionais**
4. **Plano de evolução recomendado**
5. **Critérios para reavaliar no futuro**
