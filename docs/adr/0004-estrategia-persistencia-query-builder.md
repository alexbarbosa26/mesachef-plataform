# ADR 0004 — Estratégia de persistência, query builder e migrations

## Status

PROPOSED

Mantida em `PROPOSED` por decisão humana registrada em 2026-07-18. Kysely é a tecnologia candidata do spike, não uma dependência autorizada nem uma decisão aceita antes das evidências técnicas.

## Data

2026-07-18

## Registro da decisão humana

- **Decisor:** responsável do projeto, por instrução explícita desta execução.
- **Decisão:** manter esta ADR em `PROPOSED` até concluir e revisar um spike técnico com Kysely no PostgreSQL 14.
- **Efeito:** a recomendação abaixo orienta o spike, mas não autoriza instalar Kysely, criar migrations ou iniciar a SPEC 002-A.
- **Gate:** a mudança para `ACCEPTED` exige evidência reproduzível dos critérios desta ADR e decisão humana posterior.

## Contexto

A SPEC 002 introduzirá o primeiro modelo persistente da nova plataforma. A decisão precisa atender simultaneamente:

- PostgreSQL 14 como banco oficial e gate final;
- SQLite apenas como ferramenta auxiliar, sem prometer equivalência;
- migrations versionadas, revisáveis e testáveis;
- queries parametrizadas e transações explícitas;
- isolamento multiempresa verificável nos repositories;
- suporte a constraints, índices compostos e recursos específicos do PostgreSQL;
- domínio sem dependência de ORM, driver, schema ou tipos gerados;
- TypeScript estrito;
- valores monetários futuros sem `float` ou `number` impreciso;
- equipe pequena e monólito modular, sem infraestrutura desnecessária.

Esta ADR não define o schema físico da SPEC 002 e não autoriza instalar dependências ou criar migrations.

## Drivers priorizados

1. correção e controle do SQL executado em PostgreSQL;
2. segurança de tenant e testabilidade dos repositories;
3. manutenção incremental com tipagem útil, sem contaminar o domínio.

## Alternativas avaliadas

### A. Drizzle ORM e Drizzle Kit

**Vantagens**

- schema e queries tipados em TypeScript;
- API próxima de SQL;
- drivers para PostgreSQL e SQLite;
- geração e aplicação de migrations SQL versionadas;
- transações e escape para SQL explícito quando necessário;
- superfície menor que ORMs mais abstratos.

**Riscos e custos**

- cria uma segunda representação do schema em TypeScript;
- migrations geradas exigem revisão humana, especialmente para renames, backfill, RLS e constraints compostas;
- o fluxo `push` pode alterar o banco sem o histórico exigido e deve ser proibido fora de protótipos descartáveis;
- recursos avançados de PostgreSQL podem exigir SQL manual;
- tipos de schema podem vazar para aplicação/domínio se os limites não forem fiscalizados.

### B. Prisma ORM e Prisma Migrate

**Vantagens**

- client gerado e fortemente tipado para operações comuns;
- ecossistema amplo e boa experiência de desenvolvimento;
- suporte documentado a PostgreSQL 14 e SQLite;
- migrations SQL geradas e customizáveis;
- tipo `Decimal` e mapeamentos explícitos para `numeric/decimal`.

**Riscos e custos**

- abstração e geração de client mais pesadas para um monólito modular pequeno;
- maior risco de o modelo Prisma se tornar o modelo de domínio por conveniência;
- recursos PostgreSQL específicos, RLS, constraints não triviais e queries complexas podem exigir SQL customizado;
- diferenças entre providers podem induzir falsa portabilidade entre PostgreSQL e SQLite;
- atualizações do gerador/client e adapters aumentam a superfície operacional.

### C. Kysely

**Vantagens**

- query builder tipado e deliberadamente próximo de SQL;
- dialects oficiais para PostgreSQL e SQLite;
- baixo acoplamento e pequena superfície de runtime;
- transactions e SQL explícito disponíveis quando o banco exigir;
- migrations `up/down` opcionais e controladas pelo projeto;
- favorece repositories com mapeamento explícito entre rows e domínio;
- não exige que o domínio conheça schema ou client gerado.

**Riscos e custos**

- tipos do banco precisam ser mantidos ou gerados por processo próprio;
- oferece menos automação relacional e exige mais conhecimento de SQL;
- migrations são mais manuais e dependem de disciplina de revisão;
- não resolve por si só semântica decimal, tenant scoping ou desenho de aggregates;
- SQL específico de PostgreSQL continua exigindo caminho auxiliar e teste real.

### D. SQL explícito com `pg` e repositories

**Vantagens**

- controle máximo sobre PostgreSQL, planos, locks, RLS e constraints;
- menor lock-in de biblioteca;
- queries parametrizadas protegem valores contra SQL injection;
- migrations SQL são transparentes e diretamente revisáveis;
- excelente aderência a recursos específicos do PostgreSQL.

**Riscos e custos**

- mais boilerplate de queries, mapeamento e validação de resultados;
- tipagem manual aumenta risco de drift entre SQL e TypeScript;
- composição de filtros e paginação pode duplicar conhecimento;
- suporte auxiliar a SQLite exigiria SQL paralelo ou adapters próprios;
- maior probabilidade de erro humano em queries repetitivas.

## Matriz de trade-offs

| Critério | Drizzle | Prisma | Kysely | SQL explícito + repositories |
|---|---|---|---|---|
| Controle de SQL/PostgreSQL | alto | médio | alto | máximo |
| Tipagem de queries | alta | alta | alta | manual |
| Migrations versionadas | geradas em SQL | geradas em SQL | explícitas `up/down` | explícitas em SQL |
| RLS e constraints avançadas | SQL complementar | SQL complementar | SQL complementar direto | direto |
| Isolamento do domínio | bom com disciplina | maior risco de acoplamento ao client | bom por desenho | bom por desenho |
| SQLite auxiliar | suportado | suportado, com diferenças relevantes | dialect oficial | exige adapter/SQL paralelo |
| Complexidade operacional | baixa/média | média/alta | baixa/média | baixa de runtime, alta de manutenção |
| Lock-in | médio | médio/alto | baixo | mínimo |
| Adequação à equipe pequena | boa | boa, porém mais pesada | boa se houver domínio de SQL | razoável, com maior custo repetitivo |

## Decisão proposta

Adotar **Kysely como query builder dentro de `packages/database`**, sobre o driver `pg` para PostgreSQL, com estas regras:

1. repositories são as únicas portas de persistência consumidas pelos casos de uso;
2. entidades, value objects e casos de uso não importam Kysely, `pg`, tipos de tabela ou migrations;
3. rows são mapeadas explicitamente para tipos de domínio;
4. migrations são incrementais, versionadas, possuem `up` e rollback seguro quando possível e permanecem sob revisão humana;
5. SQL bruto é permitido somente em infraestrutura, parametrizado, documentado e coberto por teste;
6. nenhum comando equivalente a schema `push` é permitido nos ambientes persistentes;
7. PostgreSQL possui migrations e testes oficiais; SQLite usa schema/adapters auxiliares apenas para cenários compatíveis;
8. migrations específicas de PostgreSQL não precisam ser artificialmente portadas para SQLite;
9. tipos `numeric/decimal` entram na aplicação como string ou decimal exato e são convertidos para Value Objects; nunca para `float`;
10. toda query tenant-owned exige um `TenantContext` válido conforme ADR 0006.

A recomendação favorece controle e baixo lock-in sem assumir o custo total de SQL manual. Popularidade não foi usada como critério decisivo.

## Estratégia de migrations proposta

- prefixo monotônico e nome descritivo;
- uma tabela de histórico controlada pelo migrator;
- checksum ou detecção de alteração de migration já aplicada;
- execução forward-only como padrão operacional;
- `down` somente quando reversão for segura e não destruir dado válido;
- mudanças destrutivas divididas em expandir, backfill, validar e contrair;
- execução em banco vazio e base representativa;
- validação obrigatória no PostgreSQL 14;
- backup e autorização explícita antes de qualquer operação destrutiva;
- migrations nunca executadas pelo frontend nem automaticamente no startup de produção.

## Consequências positivas

- SQL e tenant scoping permanecem visíveis em revisão;
- domínio continua independente;
- queries comuns recebem tipagem sem esconder o banco;
- PostgreSQL continua sendo a referência real;
- SQLite não se transforma em falsa garantia de compatibilidade.

## Consequências negativas

- exige disciplina de SQL, mapeamento e migrations;
- parte da produtividade de um ORM completo é deliberadamente recusada;
- tipos de database precisam de estratégia de manutenção;
- migrations avançadas terão código específico de PostgreSQL.

## Compliance e fitness functions

- falhar o build se `packages/domain` importar Kysely, `pg` ou `packages/database`;
- falhar a revisão se aplicação/API acessar tabelas sem repository;
- testar migrations do zero e sobre snapshot representativo no PostgreSQL 14;
- testar rollback somente quando declarado seguro;
- verificar que queries tenant-owned recebem contexto empresarial e filtram por chave composta;
- proibir `number` para colunas monetárias;
- revisar o SQL de toda migration antes de aplicação.

## Gates para aceitar esta ADR

- concluir e revisar um spike autorizado com Kysely e PostgreSQL 14 para migration, transaction, constraint composta e tenant query;
- demonstrar um adapter SQLite auxiliar sem duplicar regras de domínio;
- definir a política de geração/manutenção dos tipos de tabela;
- validar que o migrator detecta ordem e migration alterada.

## Quando revisar

- se Kysely não representar queries críticas sem uso excessivo de SQL bruto;
- se a manutenção de tipos causar drift recorrente;
- se a equipe não possuir capacidade suficiente de SQL;
- se SQLite gerar custo desproporcional;
- se requisitos de geração de schema ou introspecção se tornarem dominantes.

## Fontes técnicas consultadas

- [Kysely — documentação oficial](https://www.kysely.dev/)
- [Drizzle — migrations](https://orm.drizzle.team/docs/migrations)
- [Drizzle — transactions](https://orm.drizzle.team/docs/transactions)
- [Prisma Migrate](https://docs.prisma.io/docs/orm/prisma-migrate)
- [Prisma — PostgreSQL](https://docs.prisma.io/docs/orm/v6/overview/databases/postgresql)
- [Prisma — SQLite](https://docs.prisma.io/docs/orm/v6/overview/databases/sqlite)
- [node-postgres — queries parametrizadas](https://node-postgres.com/features/queries)

## Questões abertas

- O spike confirma Kysely como escolha final ou exige revisar as alternativas desta ADR?
- Os tipos de tabela serão mantidos manualmente ou gerados em CI?
- Qual é a política operacional de rollback para migrations com transformação de dados?
- O suporte SQLite continuará obrigatório após os primeiros módulos persistentes?
