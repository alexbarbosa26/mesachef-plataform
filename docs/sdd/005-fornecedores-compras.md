# SPEC 005 — Fornecedores e Compras

## Status
DRAFT

## Dependências
- SPEC 002
- SPEC 004

## 1. Objetivo

Implementar fornecedores, pedidos de compra, recebimento e integração das compras com o estoque.

## 2. Entidades

- Supplier;
- SupplierContact;
- PurchaseOrder;
- PurchaseOrderItem;
- GoodsReceipt;
- GoodsReceiptItem.

## 3. Regras de negócio

- fornecedor pertence à empresa;
- pedido possui um único fornecedor;
- itens devem referenciar insumos válidos;
- recebimento pode ser total ou parcial;
- somente recebimento confirmado gera estoque;
- cancelamento não deve apagar histórico;
- divergência de quantidade ou preço deve ser registrada;
- duplicidade de recebimento deve ser impedida;
- valores monetários usam precisão decimal;
- alteração posterior deve gerar evento/auditoria.

## 4. Estados do pedido

- draft;
- approved;
- partially_received;
- received;
- cancelled.

## 5. Requisitos funcionais

- cadastrar fornecedor;
- editar fornecedor;
- criar pedido;
- incluir múltiplos itens;
- aprovar;
- registrar recebimento;
- consultar divergências;
- gerar entrada no estoque;
- visualizar histórico;
- filtrar por fornecedor, período e estado.

## 6. Critérios de aceite

- [ ] Um pedido possui apenas um fornecedor.
- [ ] Recebimento confirmado gera movimentação de estoque.
- [ ] Recebimento parcial funciona.
- [ ] Recebimento duplicado é bloqueado.
- [ ] Cancelamento preserva histórico.
- [ ] Divergências são registradas.
- [ ] Dados são isolados por empresa.
- [ ] Valores e arredondamentos possuem testes.
