# SPEC 007 — CMV, Central de Lucro e Relatórios

## Status
DRAFT

## Dependências
- SPEC 004
- SPEC 006

## 1. Objetivo

Implementar snapshots de CMV, indicadores de lucro, relatórios de precificação e dashboards gerenciais.

## 2. Entidades

- CMVSnapshot;
- CMVSnapshotItem;
- ProfitSnapshot;
- PricingReport;
- DashboardMetric.

## 3. Regras de negócio

- relatórios são filtrados por empresa;
- snapshots preservam o estado histórico;
- mudanças futuras não alteram snapshots anteriores;
- indicadores devem diferenciar receita, custo, margem e lucro;
- fórmulas devem ter versão;
- períodos devem respeitar fuso horário configurado;
- valores agregados devem ser conciliáveis com dados de origem.

## 4. Indicadores iniciais

- CMV total;
- CMV percentual;
- custo por categoria;
- margem bruta;
- lucro estimado;
- produtos com baixa viabilidade;
- estoque valorizado;
- variação de custo;
- preço sugerido versus praticado.

## 5. Requisitos funcionais

- gerar snapshot;
- consultar histórico;
- filtrar período;
- comparar períodos;
- detalhar composição;
- visualizar produtos críticos;
- preparar exportação;
- exibir dashboards.

## 6. Critérios de aceite

- [ ] Snapshot é imutável.
- [ ] Histórico é consultável.
- [ ] Fórmula utilizada é identificável.
- [ ] Indicadores conciliam com dados de origem.
- [ ] Comparação entre períodos funciona.
- [ ] Isolamento multiempresa é garantido.
- [ ] Fuso horário é consistente.
- [ ] Testes de arredondamento passam.
