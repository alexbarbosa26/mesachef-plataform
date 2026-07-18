# Spike Kysely Persistence

Experimento descartável da SPEC 002 para avaliar Kysely 0.29.4 com PostgreSQL 14 e SQLite auxiliar. Este pacote não pertence ao workspace principal e não implementa a SPEC 002-A.

## Limites

- usa somente as tabelas experimentais `spike_companies`, `spike_users`, `spike_memberships` e `spike_resources`;
- usa tabelas de controle próprias, `spike_kysely_migration*`;
- não cria login, senha, sessão, RBAC ou RLS;
- não importa nem altera `apps/**` ou `packages/**`;
- recusa URL PostgreSQL não local;
- usa SQLite somente em memória;
- nunca registra connection string.

## Instalação isolada

Na raiz do repositório:

```text
pnpm --dir spikes/kysely-persistence install
```

O subdiretório possui um `pnpm-workspace.yaml` próprio. O comando cria
`node_modules` e `pnpm-lock.yaml` somente dentro deste diretório e autoriza o
build nativo apenas de `better-sqlite3`.

## Verificações sem PostgreSQL

```text
pnpm --dir spikes/kysely-persistence run check
```

Esse comando executa lint, typecheck, testes unitários, limites arquiteturais e o contrato SQLite em memória.

## Verificação PostgreSQL 14 local

Defina as variáveis apenas no processo local, sem criar `.env` versionado:

```text
SPIKE_POSTGRES_URL=postgresql://USER:PASSWORD@127.0.0.1:5432/LOCAL_DATABASE
```

Depois execute:

```text
pnpm --dir spikes/kysely-persistence run test:postgres
```

A configuração recusa hosts que não sejam `127.0.0.1`, `::1` ou `localhost`.

## Migrations manuais

Os comandos abaixo usam `SPIKE_DATABASE_PROVIDER` e `SPIKE_DATABASE_URL`:

```text
pnpm --dir spikes/kysely-persistence run migrate:up
pnpm --dir spikes/kysely-persistence run migrate:down
```

`down` remove somente as quatro tabelas `spike_*` do experimento. A validação automatizada sempre tenta reverter a migration no cleanup.

## Representação de dinheiro

- domínio: `MoneyDecimal`, baseado em `BigInt` com escala fixa de quatro casas;
- PostgreSQL: `numeric(24,4)`, lido e escrito como string;
- SQLite: `text`, porque a afinidade `NUMERIC` pode converter para ponto flutuante;
- nenhum valor monetário aceita `number`, `float` ou `double`.

## Resultado

O experimento passou no PostgreSQL 14.23 e no SQLite 3.53.2 para migrations,
constraints, transações, rollback, decimal exato e repository com tenant
obrigatório.

O migrator nativo detectou migration fora de ordem, mas não alteração de
conteúdo sob um nome já aplicado. Por isso, o resultado observado, os riscos e
a recomendação de manter a ADR 0004 como `PROPOSED` até decidir checksum e
manutenção dos tipos estão em
`docs/qa/spikes/spec-002-kysely-persistence.md`.
