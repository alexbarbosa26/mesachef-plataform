# SPEC 008 — Operação Self-Service

## Status
DRAFT

## Dependências
- SPEC 002
- SPEC 004
- SPEC 006
- SPEC 007

## 1. Objetivo

Implementar o controle diário da operação self-service, incluindo produção, custo por quilograma, receitas, perdas, vendas e indicadores.

## 2. Entidades

- SelfServiceDay;
- BuffetPreparation;
- BuffetRecipeUsage;
- BuffetSale;
- BuffetLoss;
- SelfServiceSnapshot.

## 3. Regras de negócio

- o registro é separado por empresa e dia operacional;
- receitas utilizadas devem referenciar fichas técnicas;
- custo por kg deriva das fichas e quantidades;
- alterações posteriores em insumos não reescrevem dias fechados;
- o dia pode estar aberto ou fechado;
- após fechamento, correções devem ser auditadas;
- peso e valores devem usar precisão adequada;
- não permitir duplicidade de lançamento por múltiplos cliques.

## 4. Requisitos funcionais

- abrir dia;
- registrar preparações;
- selecionar receitas;
- informar quantidades;
- registrar venda por peso;
- registrar perdas;
- calcular custo;
- fechar dia;
- consultar histórico;
- visualizar dashboard.

## 5. Critérios de aceite

- [ ] Dia operacional é criado.
- [ ] Preparações são registradas.
- [ ] Custo por kg é calculado.
- [ ] Venda por peso funciona.
- [ ] Perdas são registradas.
- [ ] Fechamento preserva snapshot.
- [ ] Correção posterior gera auditoria.
- [ ] Duplicidade é impedida.
- [ ] Histórico é filtrado por empresa.
