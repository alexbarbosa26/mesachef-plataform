# MesaChef Platform

Fundação técnica da reconstrução controlada do MesaChef em monólito modular.

## Estado atual

A SPEC 001 entrega a fundação técnica e o incremento 002-A1 acrescenta somente
a infraestrutura inicial de persistência:

- monorepo TypeScript;
- aplicação web React/Vite;
- API Fastify;
- packages de domínio, banco, contratos compartilhados e UI;
- health checks, configuração validada e logging estruturado;
- PostgreSQL 14 local e SQLite auxiliar;
- lint, verificação arquitetural, typecheck, testes e build.
- Kysely e drivers confinados a `packages/database`;
- tipos próprios para dinheiro exato, UUID e data/hora UTC;
- migrator executado fora do startup da API, com checksum SHA-256 e
  canonicalização UTF-8 `v1`.

Não existem login, tabelas de usuários/empresas, memberships, sessões, RBAC,
repositories de identidade, RLS definitiva ou módulos de negócio nesta etapa.

## Requisitos

- Node.js 24 LTS;
- pnpm 11;
- Docker com Compose para usar PostgreSQL local.

Verifique o ambiente:

```bash
pnpm doctor
```

## Preparação

Instale as dependências:

```bash
pnpm install --frozen-lockfile
```

Na primeira instalação, antes de existir lockfile, use `pnpm install` e versione o lockfile gerado.

Crie o ambiente local sem versionar o arquivo resultante:

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

### Linux ou macOS

```bash
cp .env.example .env
```

Os valores de `.env.example` são placeholders exclusivos para desenvolvimento local. Substitua a senha apenas no `.env` ignorado pelo Git.

## PostgreSQL 14 local

Valide e inicie o Compose:

```bash
pnpm db:config
pnpm db:up
```

O banco é publicado somente em `127.0.0.1`. Para interromper os containers sem apagar o volume:

```bash
pnpm db:down
```

## SQLite auxiliar

SQLite não substitui a validação em PostgreSQL. Ele pode ser usado para a fundação e testes compatíveis:

### Windows PowerShell

```powershell
Copy-Item .env.sqlite.example .env
```

### Linux ou macOS

```bash
cp .env.sqlite.example .env
```

A configuração auxiliar usa um banco em memória e não cria schema de negócio.
O adapter usa `better-sqlite3` apenas para cenários compatíveis. SQLite não é
autorizado para produção nem substitui os testes finais em PostgreSQL 14.

## Migrations locais

As migrations são artefatos `.mjs` versionados em
`packages/database/migrations`. A API não importa nem executa o migrator ao
iniciar. Configure `APP_VERSION`, provider, URL, timeout e pool no `.env` local
e mantenha `DATABASE_MIGRATION_ALLOW_REMOTE=false` para desenvolvimento.

Execute a etapa de migration separadamente:

```bash
pnpm db:migrate:status
pnpm db:migrate:up
pnpm db:migrate:down
```

`down` só deve ser usado quando a migration o declarar seguro e em ambiente
controlado. O incremento 002-A1 cria apenas a tabela técnica de checksums e as
tabelas internas do migrator; não cria schema de identidade ou tenancy. Uma
migration aplicada é imutável: divergência do checksum bloqueia a execução e a
correção deve ser uma nova migration.

## Desenvolvimento

Inicie API e web por um único comando:

```bash
pnpm dev
```

Endereços locais padrão:

- web: `http://127.0.0.1:5173`;
- API: `http://127.0.0.1:3000`;
- liveness: `http://127.0.0.1:3000/health/live`;
- readiness: `http://127.0.0.1:3000/health/ready`;
- OpenAPI: `http://127.0.0.1:3000/documentation/json`.

Também é possível iniciar apenas uma aplicação:

```bash
pnpm dev:api
pnpm dev:web
```

## Qualidade

Execute as verificações individualmente:

```bash
pnpm lint
pnpm check:boundaries
pnpm check:compose
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:sqlite
pnpm test:postgres
pnpm build
pnpm audit
```

Ou execute a sequência completa:

```bash
pnpm check
```

## Limites arquiteturais

- o frontend não importa banco, driver PostgreSQL, SQLite ou Supabase;
- `packages/domain` não depende de framework ou infraestrutura;
- `packages/shared` contém somente contratos entre aplicações;
- operações de banco ficam em `packages/database`;
- Kysely, `pg` e `better-sqlite3` não podem escapar para o domínio;
- a API pode usar apenas a superfície pública de saúde do banco e não pode
  importar adapters ou o migrator;
- endpoints de negócio futuros usarão `/api/v1`;
- nenhuma migration é executada pelo frontend ou pelo startup normal da API.

O script `pnpm check:boundaries` verifica essas restrições e ciclos entre packages.

## Segurança local

- nunca use connection string ou segredo de produção;
- nunca versione `.env`;
- health checks não retornam erro do driver ou connection string;
- `AUTH_SECRET` está reservado para a SPEC 002 e permanece sem uso;
- `pnpm db:down` preserva o volume; exclusão de volume exige autorização explícita.
