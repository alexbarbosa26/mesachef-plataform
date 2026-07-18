---
name: architecture-decision-records
description: >
  Use when creating, reviewing, or updating Architecture Decision Records (ADRs) to document why a technical decision was made. Not for generic documentation without a decision.
---

# Architecture Decision Records

Crie ou revise ADRs com foco no porquê da decisão, nos trade-offs e na forma de verificar se a decisão está sendo seguida.

## Regras
- Explique o contexto que torna a decisão necessária.
- Escreva a decisão em voz ativa e linguagem direta.
- Mostre consequências positivas e negativas.
- Inclua critérios de compliance ou fitness functions quando aplicável.
- Evite decisões vagas como “usar boas práticas” sem evidência concreta.

## Estrutura obrigatória
- **Título:** numerado e descritivo.
- **Status:** Proposed, Accepted, Deprecated ou Superseded.
- **Contexto:** forças, restrições, riscos e drivers de negócio.
- **Decisão:** escolha técnica e justificativa.
- **Consequências:** ganhos, perdas, custos e riscos.
- **Compliance/Fitness Function:** como verificar que a decisão está sendo respeitada.

## Formato de resposta
Entregue em Markdown, pronto para salvar como `docs/adr/NNNN-titulo.md`.

## Cuidados
- Não invente contexto que não foi informado; marque como premissa.
- Quando houver incerteza, liste perguntas abertas no final.
