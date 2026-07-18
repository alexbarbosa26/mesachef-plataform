---
name: secure-domain-modeling
description: >
  Use when modeling secure domain objects, domain primitives, value objects, invariants, valid constructors, money, quantities, identifiers, and business constraints. Not for UI-only validation.
---

# Secure Domain Modeling

Modele o domínio para impedir estados inválidos usando tipos fortes, Domain Primitives e invariantes.

## Regras
- Substitua primitivos soltos por Domain Primitives quando representarem conceitos críticos.
- Objetos devem nascer válidos.
- Evite construtores vazios em entidades de domínio.
- Value Objects devem ser imutáveis.
- Não use float/double para dinheiro.
- Proteja coleções internas contra mutação externa.

## Checklist
- Strings, numbers ou booleans carregam conceitos críticos?
- Existem quantidades negativas, emails inválidos, datas incoerentes ou dinheiro com tipo inadequado?
- O construtor valida invariantes?
- Coleções internas são expostas como mutáveis?
- Identidade da entidade é estável?

## Formato de resposta
1. **Primitivos perigosos**
2. **Domain Primitives sugeridos**
3. **Invariantes**
4. **Código sugerido**
5. **Como isso evita falhas**
