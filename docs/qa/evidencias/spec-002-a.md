# Evidências — SPEC 002-A

## 1. Identificação

- **Data:** 2026-07-18
- **SPEC:** 002-A — Persistência e migrations de identidade e tenancy
- **Incrementos:** 002-A1 — infraestrutura Kysely, tipos, migrator e checksum; 002-A2 — schemas, tabelas, constraints, índices e migrations iniciais
- **Modo:** `implementation`
- **Estado dos incrementos:** `002-A1 CONCLUIDO`; `002-A2 CONCLUIDO`
- **Estado da SPEC 002-A:** `EM_IMPLEMENTACAO`
- **Branch observada:** `feat/spec-002a-persistence`
- **Commit:** não autorizado e não realizado
- **Produção:** não acessada nem alterada

## 2. Escopo entregue — 002-A1

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

## 3. Migration criada na 002-A1

`packages/database/migrations/0001_create_migration_integrity.mjs` cria
somente a tabela técnica `mesachef_migration_checksum`. O migrator mantém ainda
suas tabelas internas com nomes `mesachef_kysely_migration` e
`mesachef_kysely_migration_lock`.

A API não chama o migrator durante o startup. As tabelas definitivas de
identidade e tenancy foram adicionadas somente no incremento 002-A2, conforme
registrado adiante.

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

## 9. Evidências — 002-A2

### 9.1 Migrations e objetos criados

Foram adicionadas cinco migrations definitivas, sem alterar a migration `0001`
já aplicada:

| Migration | PostgreSQL 14 | SQLite auxiliar |
|---|---|---|
| `0002_create_identity_tenancy_namespaces` | schemas `identity` e `tenancy` | sem namespace, por limitação do banco |
| `0003_create_identity_users` | `identity.users` | `identity_users` |
| `0004_create_identity_password_credentials` | `identity.password_credentials` | `identity_password_credentials` |
| `0005_create_tenancy_companies` | `tenancy.companies` | `tenancy_companies` |
| `0006_create_tenancy_memberships` | `tenancy.memberships` | `tenancy_memberships` |

As tabelas possuem UUID, instantes UTC, estados explícitos, versão de
autorização positiva, coerência entre bloqueio e seus metadados, chaves
estrangeiras com exclusão restrita e unicidades necessárias. A migration de
membership inclui referências compostas que permitirão validar a associação
entre usuário, empresa e membership no incremento de isolamento.

O rollback recusa remover tabela que contenha registros. Em uma base vazia,
remove os objetos na ordem inversa. O runner executa o `down` antes de remover o
checksum, mantém o checksum quando o rollback falha e trata corretamente a
remoção da própria tabela auxiliar da migration `0001`.

### 9.2 Constraints e índices verificados

- unicidade binária e exata de `users.email_normalized`;
- unicidade de `memberships (user_id, company_id)`;
- unicidades compostas `memberships (company_id, id)` e
  `memberships (id, user_id, company_id)` para futuras referências seguras;
- índices `memberships (user_id, status)` e `(company_id, status)`;
- `password_credentials.user_id` como chave primária e chave estrangeira;
- checks de UUID e UTC estritos no SQLite auxiliar;
- checks de estados, versões positivas, ordem temporal e coerência de bloqueio;
- ordem das colunas de índices e constraints comprovada no catálogo PostgreSQL
  e por `PRAGMA` no SQLite.

### 9.3 Normalização de e-mail

A 002-A2 implementa somente o contrato de persistência: `email_original` para
exibição/auditoria, `email_normalized` para autenticação futura e unicidade
exata sobre o valor normalizado. Não usa `citext`, `lower()` ou regra específica
de provedor. O componente testável que valida formato e produz o valor
normalizado não foi implementado porque não integra o escopo autorizado de
schemas e migrations; continua obrigatório antes de qualquer escrita de
usuário em runtime.

### 9.4 Revisão multiagente

`spec_guard`, `database_architect`, `security_reviewer` e `test_architect`
produziram os pareceres antes da alteração. O plano consolidado orientou o
`implementation_worker`, único agente escritor. Depois da implementação,
`security_reviewer`, `integration_reviewer` e `test_architect` revisaram o diff
em paralelo.

Foram aprovadas e corrigidas lacunas de teste para tamper com migrations
pendentes, inventário exato de tabelas, ordem real de constraints/índices,
cenários negativos no PostgreSQL e limpeza explícita. O alerta sobre alteração
direta dos `user_id`/`company_id` de uma membership foi preservado como gate
para repositories, grants e RLS: criar trigger agora extrapolaria o escopo
autorizado e não substituiria as camadas de autorização previstas.

### 9.5 Validações finais

| Comando/evidência | Resultado após a 002-A2 |
|---|---|
| `pnpm check` | aprovado |
| lint | aprovado, zero warnings |
| limites arquiteturais | aprovado |
| contrato estático do Compose | aprovado |
| typecheck estrito do monorepo | aprovado |
| testes unitários | 11 arquivos, 44 testes aprovados |
| testes de integração | 5 arquivos, 17 testes aprovados |
| `pnpm test:postgres` | 1 arquivo, 7 testes aprovados |
| `pnpm test:sqlite` | 1 arquivo, 7 testes aprovados |
| build do monorepo | aprovado |
| `pnpm audit` e `pnpm audit --prod` | nenhuma vulnerabilidade conhecida |
| `git diff --check` e auditoria estática de secrets | aprovados |

O alvo PostgreSQL foi validado como local (`localhost`) sem imprimir a connection
string, e o teste confirma explicitamente a major version 14. Todos os testes
de migration limpam os objetos experimentados; nenhum schema/tabela da 002-A2
permaneceu como resíduo da suíte. SQLite continua sendo evidência auxiliar e
não substitui a validação PostgreSQL.

## 10. Itens deliberadamente não implementados

- componente de validação e normalização de e-mail em runtime;
- `db:verify` e detecção completa de drift de catálogo;
- repositories, unidade de trabalho, `TenantContext` e `PlatformContext`;
- imutabilidade de identidade da membership na camada de aplicação;
- roles PostgreSQL, grants, ownership e policies RLS definitivas;
- sessões, RBAC, login, hashing de senha, endpoints e frontend;
- qualquer parte da 002-A3, 002-A4, 002-B ou posterior.

## 11. Estado e próximo gate

002-A1 e 002-A2 estão concluídos nos respectivos escopos autorizados. A SPEC
002-A permanece `EM_IMPLEMENTACAO`, a SPEC 002 permanece `EM_ESPECIFICACAO`,
002-B a 002-G e a SPEC 003 permanecem `BLOQUEADAS`. `PEND-002-010` continua
aberta e não bloqueadora para a implementação inicial.

O próximo incremento planejado é 002-A3, mas ele não foi autorizado nem
liberado automaticamente. Uma nova decisão humana deve confirmar seu escopo
antes de qualquer repository, unidade de trabalho ou contexto transacional.
