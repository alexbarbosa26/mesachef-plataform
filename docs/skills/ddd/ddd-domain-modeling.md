---
name: ddd-domain-modeling
description: >
  Use when modeling domain entities, value objects, aggregates, invariants, factories, and business rules. Not for database CRUD design without domain behavior.
---

# DDD Domain Modeling

Modele o domínio usando Entidades, Value Objects, Agregados, Raízes de Agregado, Fábricas e invariantes.

## Regras
- Priorize Value Objects quando não houver identidade própria.
- Entidades devem representar identidade e continuidade.
- Mudanças de estado devem passar pela Raiz do Agregado.
- Objetos devem nascer em estado válido.
- Explicite regras de negócio como comportamento do domínio, não apenas validações externas.

## Checklist
- O objeto precisa de identidade ou apenas descreve atributos?
- Value Objects são imutáveis?
- A Raiz do Agregado protege invariantes?
- Existe Factory para criação complexa?
- As regras estão no domínio ou vazaram para UI/controller/banco?

## Formato de resposta
1. **Análise do modelo atual**
2. **Entidades sugeridas**
3. **Value Objects sugeridos**
4. **Agregados e raízes**
5. **Invariantes protegidas**
6. **Exemplo de implementação**
