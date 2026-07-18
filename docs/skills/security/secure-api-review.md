---
name: secure-api-review
description: >
  Use when reviewing REST, RPC, Edge Functions, Supabase APIs, input validation, error handling, payloads, contracts, rate limits, and information leakage. Not for pure frontend layout changes.
---

# Secure API Review

Revise interfaces de entrada, validação, contratos de erro e vazamento de informações.

## Regras
- Valide entrada na ordem: origem, tamanho, léxico, sintaxe e semântica.
- Nunca ecoe input inválido bruto em mensagens de erro.
- Não exponha stack traces, SQL, secrets ou detalhes de infraestrutura.
- Separe falhas técnicas de falhas de negócio.
- APIs devem expressar operações de domínio quando houver comportamento, não apenas CRUD anêmico.
- Valide antes de processamento pesado.

## Checklist
- Existe validação de tamanho e formato?
- O erro retorna detalhes sensíveis?
- A API confia no frontend?
- Há rate limiting ou proteção contra abuso quando necessário?
- Contratos de entrada e saída estão claros?
- Falhas são logadas sem expor dados sensíveis?

## Formato de resposta
1. **Vulnerabilidade de contrato**
2. **Problema na validação**
3. **Payload seguro sugerido**
4. **Pipeline de validação**
5. **Casos de teste**
