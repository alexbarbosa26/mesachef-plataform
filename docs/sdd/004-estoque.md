# SPEC 004 — Estoque e Movimentações

## Status
DRAFT

## Dependências
- SPEC 002
- SPEC 003

## 1. Objetivo

Implementar cadastro de insumos, categorias, unidades, entradas, saídas, ajustes, histórico e valorização de estoque.

## 2. Entidades

- StockItem;
- StockCategory;
- UnitOfMeasure;
- StockMovement;
- StockBalance;
- StockAdjustmentReason;
- StockHistory.

## 3. Tipos de movimentação

- entrada por compra;
- entrada manual autorizada;
- consumo por produção;
- ajuste positivo;
- ajuste negativo;
- perda;
- correção;
- transferência futura, quando especificada.

## 4. Regras de negócio

- todo item pertence a uma empresa;
- toda movimentação deve ser rastreável;
- ajustes manuais exigem motivo;
- saldo negativo deve ser bloqueado por padrão;
- unidades devem ser normalizadas;
- conversões devem ser explícitas;
- custo médio deve ter fórmula documentada;
- exclusão de item com histórico deve ser lógica;
- movimentações confirmadas não devem ser alteradas silenciosamente;
- correções devem gerar nova movimentação;
- alterações de custo devem refletir nas fichas técnicas conforme a SPEC 006.

## 5. Requisitos funcionais

- cadastrar categoria;
- cadastrar item;
- configurar unidade e conversão;
- registrar entrada;
- registrar ajuste;
- consultar saldo;
- consultar histórico;
- identificar estoque baixo;
- visualizar valorização;
- filtrar por categoria e status.

## 6. Segurança

- isolamento por empresa;
- permissão específica para ajuste;
- auditoria em ajustes e exclusões;
- idempotência em lançamentos;
- proteção contra duplo clique.

## 7. Critérios de aceite

- [ ] Cadastro de item funciona.
- [ ] Categoria funciona.
- [ ] Entrada altera saldo corretamente.
- [ ] Ajuste exige motivo.
- [ ] Histórico é imutável.
- [ ] Saldo negativo é impedido.
- [ ] Custo médio possui testes.
- [ ] Estoque baixo é identificado.
- [ ] Dados não vazam entre empresas.
- [ ] Operação repetida com mesma chave idempotente não duplica saldo.

## 8. Testes obrigatórios

- concorrência em movimentação;
- idempotência;
- saldo negativo;
- conversão de unidade;
- custo médio;
- isolamento de tenant;
- ajuste sem motivo;
- tentativa de editar histórico.
