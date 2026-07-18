# ADR 0002 — PostgreSQL 14 em Produção e SQLite como Banco Auxiliar

## Status
ACCEPTED

## Contexto

O ambiente do usuário já possui PostgreSQL 14 em Docker. Para desenvolvimento e homologação rápida, SQLite reduz a necessidade de infraestrutura local.

Entretanto, SQLite e PostgreSQL possuem diferenças em tipos, concorrência, constraints, índices, transações e SQL.

## Decisão

- PostgreSQL 14 será o banco oficial de produção e pré-produção.
- SQLite poderá ser usado em desenvolvimento, testes unitários e homologação funcional rápida.
- Funcionalidades persistentes só serão concluídas após validação em PostgreSQL 14.
- A camada de persistência deverá ser isolada por repositories.
- Migrations terão validação específica em PostgreSQL.

## Consequências positivas

- desenvolvimento local simplificado;
- testes rápidos;
- produção alinhada ao ambiente já disponível;
- menor acoplamento da regra de negócio ao banco.

## Consequências negativas

- necessidade de testes em dois bancos;
- risco de diferenças comportamentais;
- algumas funcionalidades podem exigir adaptação;
- consultas específicas de PostgreSQL reduzem portabilidade.

## Regras

- dinheiro usa tipo decimal adequado;
- não depender de coerção permissiva do SQLite;
- não considerar migration validada apenas em SQLite;
- SQL específico deve ser documentado;
- testes críticos de concorrência devem usar PostgreSQL;
- banco de produção nunca é usado como ambiente de teste;
- connection strings ficam em variáveis de ambiente.

## Alternativas consideradas

### PostgreSQL em todos os ambientes
Tecnicamente preferível, mas menos simples para alguns fluxos locais.

### SQLite em todos os ambientes
Rejeitado por não atender adequadamente ao ambiente de produção e aos requisitos de concorrência.

### Banco gerenciado externo
Não adotado nesta fase porque o usuário já possui PostgreSQL 14 em Docker.

## Critério de revisão

Reavaliar a utilização de SQLite se a manutenção de compatibilidade gerar custo ou risco excessivo.
