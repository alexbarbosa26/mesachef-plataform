---
name: secure-by-design-review
description: >
  Use when reviewing architecture or code for intrinsic security, defense in depth, invalid states, secure defaults, CIA-T impact, and business-risk exposure. Not for generic clean-code review.
---

# Secure by Design Review

Revise arquitetura e código para verificar se a segurança nasce do design, e não apenas de ferramentas externas.

## Regras
- Avalie Confidencialidade, Integridade, Disponibilidade e Rastreabilidade.
- Não aceite segurança apenas por firewall, WAF ou configuração de infraestrutura.
- Exija defesa em profundidade: validação de entrada, regras de domínio, autorização e logs.
- Identifique estados inválidos permitidos pelo modelo.
- Aponte riscos de efeito cascata entre componentes.

## Checklist
- O código se protege ou confia apenas na infraestrutura?
- Dados críticos usam tipos genéricos demais?
- O design permite estado inválido?
- A falha de um componente quebra outros?
- Há logs e auditoria suficientes?
- Há dados sensíveis sem proteção adequada?

## Formato de resposta
1. **Nível de exposição:** Baixo, Médio ou Alto
2. **Falha de design**
3. **Impacto CIA-T**
4. **Correção recomendada**
5. **Prioridade de ação**
