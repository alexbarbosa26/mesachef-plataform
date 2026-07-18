# Spike PostgreSQL RLS — SPEC 002

Experimento descartável e isolado para validar Row-Level Security no PostgreSQL
14 com Kysely, transações e pool de conexões. Nada deste diretório constitui
schema, migration ou implementação definitiva da SPEC 002-A.

## Limites

- usa somente PostgreSQL local em `127.0.0.1`, `localhost` ou `::1`;
- recusa connection string remota ou sem banco explícito;
- não usa SQLite;
- não altera `apps/**`, `packages/**` ou `spikes/kysely-persistence`;
- não implementa login, senha, sessão, usuários, empresas ou RBAC reais;
- usa somente tabelas, policies e roles com prefixo/nome `spike_rls_*`;
- remove tabelas e roles experimentais ao final de cada suíte PostgreSQL.

## Estratégia avaliada

```text
PlatformContext ──> role/pool de plataforma ──> spike_rls_companies
                                               │
                                               └─ itera empresas
                                                  uma a uma
                                                       │
TenantContext ──> transação Kysely ──> set_config(..., true)
                                      │
                                      ├─ repository com company_id
                                      └─ RLS ENABLE + FORCE
```

Roles efêmeras:

- `spike_rls_owner`: owner sem login, sem superuser e sem `BYPASSRLS`;
- `spike_rls_app`: login de tenant, sem ownership ou `BYPASSRLS`;
- `spike_rls_platform`: login global, com acesso apenas ao catálogo
  experimental de empresas e sem grants nas tabelas tenant-owned.

As senhas das duas roles de login são aleatórias, existem somente em memória e
não são escritas ou exibidas.

## Contexto de tenant

O único caminho de tenant do spike abre uma transação e executa, na mesma
conexão:

```sql
select set_config('app.current_company_id', $1, true);
```

O terceiro argumento `true` torna a configuração local à transação. A policy
usa:

```sql
nullif(current_setting('app.current_company_id', true), '')::uuid
```

Assim, configuração ausente ou limpa nega por padrão; valor malformado falha e
é convertido para erro sanitizado na borda de infraestrutura.

## Preparação local

1. Inicie o PostgreSQL 14 local da raiz do projeto.
2. Instale as dependências apenas neste diretório com `pnpm install`.
3. Defina `SPIKE_RLS_ADMIN_DATABASE_URL` no processo com uma URL do PostgreSQL
   local. Não grave o valor em arquivo versionado e não o imprima.

O arquivo `.env.example` contém somente o nome vazio da variável.

## Comandos

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run test:postgres
pnpm run test:concurrency
pnpm run build
pnpm run audit:secrets
```

`test:postgres` e `test:concurrency` exigem a variável local no processo. O
script `check` agrega todas as verificações quando a variável já está definida.

## Cobertura

- `ENABLE ROW LEVEL SECURITY` e `FORCE ROW LEVEL SECURITY`;
- role real sem `BYPASSRLS` e distinta do owner;
- CRUD permitido no tenant ativo e negado no tenant alheio;
- negação por ausência e falha segura por contexto inválido;
- limpeza após commit e rollback na mesma conexão (`max=1`);
- reuso e concorrência do pool entre empresas A e B;
- filtros explícitos do repository testados também com RLS ignorada pelo
  superuser administrativo;
- IDOR e troca maliciosa de `companyId`;
- separação de `TenantContext` e `PlatformContext`;
- job global que itera tenants com contexto explícito;
- erros sanitizados e auditoria estática de secrets;
- migration experimental `up/down` e cleanup final.

## Cleanup

Cada fixture fecha os pools de tenant e plataforma, executa o `down`, remove as
tabelas internas do migrator, remove as roles e consulta o catálogo. A suíte
falha se qualquer tabela ou role `spike_rls_*` permanecer.

Não executar este spike contra produção.
