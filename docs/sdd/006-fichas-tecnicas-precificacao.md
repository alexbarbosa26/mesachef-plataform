# SPEC 006 — Fichas Técnicas e Precificação

## Status
DRAFT

## Dependências
- SPEC 002
- SPEC 004
- SPEC 005

## 1. Objetivo

Implementar produtos, fichas técnicas, subfichas, custos, rendimento, perdas, preço sugerido, preço praticado, lucro aplicado e viabilidade.

## 2. Entidades

- Product;
- ProductCategory;
- TechnicalSheet;
- TechnicalSheetItem;
- SubRecipe;
- PricingConfiguration;
- PricingCalculation;
- ResaleProduct.

## 3. Componentes de custo

- insumos;
- embalagens;
- mão de obra;
- perdas;
- fator de correção;
- cocção;
- custos fixos;
- custos variáveis;
- taxas;
- impostos quando configurados.

## 4. Regras de negócio

- produto pertence a uma empresa;
- ficha técnica possui rendimento e unidade;
- custo deve ser calculado por porção/unidade;
- fichas podem usar outras fichas como componentes;
- ciclos de dependência entre fichas são proibidos;
- alteração de insumo deve recalcular fichas afetadas;
- snapshots históricos não devem ser reescritos;
- dinheiro usa decimal exato;
- arredondamento deve ser consistente;
- preço sugerido deve explicar os componentes;
- preço praticado pode diferir do sugerido;
- lucro aplicado e viabilidade devem ser exibidos;
- entrada decimal deve aceitar vírgula ou ponto.

## 5. Fórmulas

As fórmulas finais devem ser documentadas e testadas. A implementação deve evitar fórmulas ocultas em componentes de interface.

Exemplo de lucro aplicado, sujeito à validação da spec detalhada:

```text
(Preço praticado
 - custos variáveis calculados sobre o preço
 - custos fixos calculados sobre o preço
 - custo por porção)
÷ Preço praticado
```

## 6. Requisitos funcionais

- cadastrar produto;
- cadastrar ficha;
- incluir insumos;
- incluir subficha;
- definir rendimento;
- calcular custo;
- simular preço;
- registrar preço praticado;
- avaliar viabilidade;
- listar produtos em formato gerencial;
- recalcular após alteração do insumo.

## 7. Critérios de aceite

- [ ] Custo por porção correto.
- [ ] Subfichas funcionam.
- [ ] Ciclo entre fichas é bloqueado.
- [ ] Alteração de insumo recalcula dependentes.
- [ ] Preço sugerido é explicável.
- [ ] Lucro aplicado é calculado.
- [ ] Viabilidade é exibida.
- [ ] Vírgula e ponto são aceitos.
- [ ] Arredondamentos possuem testes.
- [ ] Isolamento por empresa é comprovado.
