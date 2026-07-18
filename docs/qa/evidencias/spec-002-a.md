# Evidências — SPEC 002-A

## 1. Identificação

- **Data:** 2026-07-18
- **SPEC:** 002-A — Persistência e migrations de identidade e tenancy
- **Incremento:** 002-A1 — infraestrutura Kysely, tipos, migrator e checksum
- **Modo:** `implementation`
- **Estado do incremento:** `CONCLUIDO`
- **Estado da SPEC 002-A:** `EM_IMPLEMENTACAO`
- **Branch observada:** `feat/spec-002a-persistence`
- **Commit:** não autorizado e não realizado
- **Produção:** não acessada nem alterada

## 2. Escopo entregue

- Kysely `0.29.4` confinado ao adapter de infraestrutura;
- `pg` `8.22.0` e `better-sqlite3` `12.11.1` como drivers locais;
- factory validada para PostgreSQL 14 e SQLite auxiliar, com pool PostgreSQL
  limitado e `foreign_keys` ativo no SQLite;
- `MoneyDecimal` baseado em `BigInt`, escala 4 e faixa compatível com
  `numeric(24,4)`;
- value objects próprios e adapters de UUID e instantes UTC;
- parser PostgreSQL de `numeric` configurado para string, nunca `number`;
- adapters de decimal canônico textual para PostgreSQL e SQLite;
- migrator Kysely executável somente por comando separado;
- canonicalização UTF-8 `v1`: remoção de BOM inicial, CRLF/CR para LF e
  preservação integral do restante;
- checksum SHA-256 e metadados de migration, canonicalização, aplicação,
  ferramenta e data;
- validação fail-closed quando o artefato aplicado é removido, diverge do
  checksum ou possui metadado inválido, antes de importar o módulo divergente;
- comandos raiz `db:migrate:up`, `db:migrate:status` e `db:migrate:down`;
- boundaries que impedem Kysely/drivers no domínio e migrator/adapters na API.

## 3. Migration criada

`packages/database/migrations/0001_create_migration_integrity.mjs` cria
somente a tabela técnica `mesachef_migration_checksum`. O migrator mantém ainda
suas tabelas internas com nomes `mesachef_kysely_migration` e
`mesachef_kysely_migration_lock`.

Não foram criadas tabelas de usuário, empresa, membership, credencial, sessão,
RBAC, auditoria funcional ou qualquer outro schema de negócio. A API não chama
o migrator durante o startup.

## 4. Contrato de integridade comprovado

1. o arquivo é lido como bytes e decodificado como UTF-8 estrito;
2. BOM UTF-8 inicial é removido;
3. CRLF e CR são normalizados para LF;
4. espaços, comentários, Unicode e newline final permanecem significativos;
5. SHA-256 é calculado sobre os bytes canônicos;
6. `canonicalization_version` recebe `v1`;
7. checksum e metadados são gravados na mesma transação da migration;
8. o histórico nativo e a tabela auxiliar são comparados antes e depois da
   execução;
9. divergência gera `MIGRATION_INTEGRITY_FAILED`, não avalia o módulo alterado
   e não atualiza o checksum;
10. erros do CLI expõem somente código controlado, sem connection string.

## 5. Evidências executáveis

| Comando/evidência | Resultado |
|---|---|
| `pnpm install` | aprovado; manifests e lockfile atualizados, build nativo de `better-sqlite3` concluído |
| `pnpm check` | aprovado |
| lint | aprovado, zero warnings |
| limites arquiteturais | aprovado — `Architecture boundaries verified.` |
| contrato estático do Compose | aprovado |
| typecheck estrito do monorepo | aprovado |
| testes unitários | 10 arquivos, 42 testes aprovados |
| testes de integração sem PostgreSQL | 5 arquivos, 7 testes aprovados |
| `pnpm test:sqlite` | 1 arquivo, 2 testes aprovados |
| `pnpm test:postgres` | 1 arquivo, 2 testes aprovados |
| container PostgreSQL local | `mesachef-platform-postgres-1`, healthy, publicado somente em `127.0.0.1:5432` |
| build do monorepo | aprovado, incluindo web e API |
| `db:migrate:up/status/down` | aprovados contra SQLite temporário; arquivo removido ao final |
| `pnpm audit` e `pnpm audit --prod` | nenhuma vulnerabilidade conhecida |
| auditoria estática de secrets | aprovada; `.env` não rastreado e nenhum padrão conhecido encontrado |

Observação não bloqueadora: a instalação reportou `prebuild-install@7.1.3`,
dependência transitiva de `better-sqlite3@12.11.1`, como depreciada. Não há
vulnerabilidade conhecida no audit atual; a substituição deve ser acompanhada
em futuras atualizações do driver SQLite.

## 6. PostgreSQL 14

Os testes usaram somente o PostgreSQL local publicado em `127.0.0.1`. O teste
confirma major version 14, round-trip de `numeric(24,4)` como string exata,
`up`, `down`, metadados e verificação de integridade. A validação do schema
técnico ocorreu dentro de uma transação externa revertida deliberadamente; as
tabelas do teste não permaneceram no banco.

Nenhuma connection string foi registrada na saída ou nesta evidência. Nenhum
banco remoto ou de produção foi acessado.

## 7. SQLite auxiliar

O teste em memória comprovou `up`, `down`, reaplicação, data ISO 8601 textual,
checksum e bloqueio após alteração do arquivo aplicado. Um segundo exercício
validou os três comandos em um arquivo temporário local, removido ao final.

SQLite continua auxiliar: não comprova paridade de catálogo, concorrência,
roles, grants ou RLS do PostgreSQL.

## 8. Segurança e boundaries

- domínio não importa Kysely, `pg`, `better-sqlite3`, `node:sqlite` ou database;
- API não importa migrator, adapters, Kysely ou drivers;
- a superfície raiz de `@mesachef/database` preserva apenas configuração e
  health probe, sem exportar o migrator;
- migrations remotas exigem opt-in explícito; o padrão dos exemplos é negar;
- erros de configuração informam apenas campos inválidos;
- erros do CLI não imprimem causa, SQL ou conexão;
- não há credencial real em código, migration, teste ou documentação.

## 9. Itens deliberadamente não implementados

- normalização de e-mail e tabelas definitivas de identidade/tenancy;
- `db:verify` e detecção completa de drift de catálogo;
- repositories, unidade de trabalho e contexts tenant/plataforma;
- roles PostgreSQL, grants, ownership e policies RLS definitivas;
- usuários, empresas, memberships, credentials, sessions e RBAC;
- login, senha, endpoints e frontend;
- qualquer parte da 002-A2, 002-B ou posterior.

## 10. Estado e próximo gate

002-A1 está concluído no escopo autorizado. A SPEC 002-A permanece
`EM_IMPLEMENTACAO`, a SPEC 002 permanece `EM_ESPECIFICACAO`, 002-B a 002-G e a
SPEC 003 permanecem `BLOQUEADAS`. `PEND-002-010` continua aberta e não
bloqueadora para a implementação inicial.

O próximo incremento planejado é 002-A2, mas não está autorizado. Seu escopo
deve ser confirmado em uma nova execução antes de qualquer schema definitivo.
