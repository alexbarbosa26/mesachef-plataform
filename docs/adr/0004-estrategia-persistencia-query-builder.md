# ADR 0004 — Estratégia de persistência, query builder e migrations

## Status

ACCEPTED

Aceita por decisão humana em 2026-07-18 após revisão do spike com Kysely. O aceite define a estratégia de persistência e a política de integridade das migrations, mas não autoriza implementar a SPEC 002-A nem remove o gate do spike de RLS.

## Data

2026-07-18

## Registro da decisão humana

### Proposição e gate originais

- **Decisão inicial:** manter esta ADR em `PROPOSED` até concluir e revisar um spike técnico com Kysely no PostgreSQL 14.
- **Evidência produzida:** o spike foi concluído e documentado em `docs/qa/spikes/spec-002-kysely-persistence.md`.

### Aceite posterior ao spike

- **Decisor:** responsável do projeto, por instrução explícita em 2026-07-18.
- **Decisão:** aceitar Kysely como query builder e adapter de infraestrutura, preservando o domínio sem dependência da biblioteca.
- **Bancos:** manter PostgreSQL 14 como banco oficial e SQLite somente como auxiliar para cenários compatíveis.
- **Integridade:** complementar o migrator do Kysely com checksum SHA-256 e imutabilidade de migrations aplicadas.
- **Operação:** executar migrations como etapa separada de deploy; a API não executa migrations no startup.
- **Limite:** o aceite não autoriza instalar dependências, criar migrations definitivas ou iniciar a SPEC 002-A nesta execução. A 002-A permanece bloqueada pelo spike de RLS.

## Evidência técnica do spike — 2026-07-18

O spike descartável em `spikes/kysely-persistence` validou Kysely 0.29.4 no
PostgreSQL 14.23 e no SQLite 3.53.2 auxiliar. Foram aprovados migrations
`up/down`, DDL transacional, commit, rollback, UUID, timestamps, decimal exato,
foreign keys, chaves únicas compostas, relação muitos-para-muitos, repository
sem dependência do domínio e filtro obrigatório por empresa.

O migrator nativo recusou migration inserida fora da ordem histórica, mas não
detectou alteração no conteúdo de uma migration já aplicada com o mesmo nome.
Sua tabela de histórico possui somente `name` e `timestamp`. A política de
geração/manutenção dos tipos de tabela também continua sem aceite.

**Resultado para esta ADR:** o responsável revisou a evidência, aceitou Kysely e
fechou a lacuna do migrator nativo com uma camada obrigatória de checksum
SHA-256. O mecanismo de geração ou manutenção dos tipos de tabela permanece uma
decisão interna de infraestrutura, sem permissão para vazar ao domínio.
Evidências completas: `docs/qa/spikes/spec-002-kysely-persistence.md`.

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

Esta ADR não define o schema físico da SPEC 002. Seu aceite não autoriza instalar dependências, criar migrations ou implementar a SPEC 002-A sem execução específica posterior.

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

## Decisão

1. Kysely é o query builder e adapter de infraestrutura adotado para a persistência.
2. O domínio não importa tipos, APIs, schemas ou contratos do Kysely.
3. PostgreSQL 14 é o banco oficial.
4. SQLite é apenas auxiliar para desenvolvimento e testes compatíveis.
5. Persistência, concorrência e isolamento recebem validação final no PostgreSQL 14.
6. Dinheiro no domínio usa `MoneyDecimal` baseado em `BigInt`, com escala fixa 4.
7. PostgreSQL armazena dinheiro como `numeric(24,4)`.
8. SQLite armazena dinheiro como texto decimal canônico.
9. UUID usa tipo nativo no PostgreSQL e texto validado no SQLite.
10. Datas são persistidas em UTC: `timestamptz` no PostgreSQL e texto ISO 8601 no SQLite.
11. Uma migration aplicada é imutável e nunca pode ser editada.
12. Toda correção de schema ou dados é feita por nova migration.
13. O migrator do Kysely recebe uma camada obrigatória de checksum SHA-256.
14. Nome e checksum SHA-256 de cada migration aplicada são registrados em tabela auxiliar.
15. Divergência entre o conteúdo atual e o checksum registrado de uma migration aplicada causa falha fechada.
16. Migrations são executadas como etapa separada e explicitamente controlada de deploy.
17. A API não procura nem executa migrations automaticamente ao iniciar.
18. A SPEC 002-A permanece bloqueada até a conclusão e aprovação do spike de RLS no PostgreSQL 14.

Regras complementares:

- repositories são as únicas portas de persistência consumidas pelos casos de uso;
- rows e tipos de tabela ficam na infraestrutura e são mapeados explicitamente para o domínio;
- SQL bruto é permitido somente na infraestrutura, parametrizado, documentado e coberto por teste;
- nenhum comando equivalente a schema `push` é permitido em ambiente persistente;
- recursos específicos do PostgreSQL não são artificialmente portados para SQLite;
- toda query tenant-owned exige `TenantContext` válido conforme ADR 0006;
- a estratégia de manutenção ou geração dos tipos de tabela deve detectar drift e permanecer confinada a `packages/database`.

A decisão favorece controle e baixo lock-in sem assumir o custo total de SQL manual. Popularidade não foi critério decisivo.

## Estratégia de migrations

- usar prefixo monotônico e nome descritivo;
- manter o histórico operacional do Kysely e uma tabela auxiliar com, no mínimo, nome da migration e checksum SHA-256;
- calcular o checksum sobre uma representação canônica, determinística e versionada do conteúdo da migration;
- validar todas as migrations já aplicadas antes de executar qualquer migration pendente;
- falhar sem aplicar mudanças se nome, conteúdo ou checksum de migration aplicada divergirem;
- nunca sobrescrever automaticamente o checksum registrado para acomodar divergência;
- tratar migrations aplicadas como artefatos imutáveis; correções são sempre novas migrations;
- usar execução forward-only como padrão operacional;
- oferecer `down` somente quando a reversão for segura e não destruir dado válido;
- dividir mudanças destrutivas em expandir, backfill, validar e contrair;
- testar execução em banco vazio e base representativa;
- validar obrigatoriamente no PostgreSQL 14;
- executar migrations com papel e etapa de deploy separados da API;
- proibir execução automática de migrations no startup da API;
- exigir backup e autorização explícita antes de qualquer operação destrutiva.

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
- falhar o pipeline se uma migration aplicada tiver nome presente e checksum SHA-256 divergente;
- testar que alteração de um byte na representação canônica de migration aplicada impede qualquer nova execução;
- testar que uma correção criada como nova migration preserva o histórico anterior;
- validar que a tabela auxiliar registra nome e checksum no mesmo fluxo transacional seguro da aplicação da migration;
- verificar que a API inicia sem consultar, criar ou alterar tabelas de migration;
- verificar que o deploy executa migrations em etapa separada com credenciais próprias;
- testar migrations do zero e sobre snapshot representativo no PostgreSQL 14;
- testar rollback somente quando declarado seguro;
- verificar que queries tenant-owned recebem contexto empresarial e filtram por chave composta;
- proibir `number` para dinheiro no domínio e testar round-trip de `MoneyDecimal` com escala 4;
- verificar `numeric(24,4)`, UUID nativo e `timestamptz` no schema PostgreSQL;
- verificar texto decimal canônico, UUID textual validado e ISO 8601 UTC no adapter SQLite;
- impedir que uma validação apenas em SQLite conclua persistência, concorrência ou isolamento;
- revisar o SQL de toda migration antes de aplicação.

## Critérios satisfeitos para aceite

- [x] spike autorizado com Kysely e PostgreSQL 14 concluído;
- [x] adapter SQLite auxiliar demonstrado sem duplicar regras de domínio;
- [x] relatório do spike revisado formalmente;
- [x] Kysely aceito como query builder e infraestrutura, sem dependência do domínio;
- [x] representações de dinheiro, UUID e datas definidas por banco;
- [x] política de imutabilidade e correção por nova migration definida;
- [x] camada de checksum SHA-256 e falha por divergência decididas;
- [x] execução de migrations separada do startup da API decidida;
- [x] aceite humano registrado.

O spike de RLS não condiciona o status desta ADR, mas continua sendo gate obrigatório para iniciar a SPEC 002-A.

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

- Os tipos de tabela serão mantidos manualmente, gerados ou introspectados em CI dentro de `packages/database`?
- Qual representação canônica versionada será usada como entrada do SHA-256 para permanecer estável entre ambientes?
- Qual é a política operacional de rollback para migrations com transformação de dados?
- O suporte SQLite continuará obrigatório após os primeiros módulos persistentes?
