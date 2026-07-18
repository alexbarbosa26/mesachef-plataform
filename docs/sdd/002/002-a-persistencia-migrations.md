# SPEC 002-A — Persistência e migrations de identidade e tenancy

## Status

- **Estado:** `EM_ESPECIFICACAO`
- **Atualização:** 2026-07-18
- **Implementação autorizada:** não
- **Motivo:** o gate técnico de RLS está encerrado, mas decisões críticas de
  checksum, tipos/drift e normalização de e-mail permanecem abertas.

## Contexto

A fundação técnica ainda não possui persistência de negócio. Este incremento
deve criar, em execução futura autorizada, a fronteira definitiva entre domínio
e banco para os primeiros dados de identidade e tenancy. Os spikes provaram
Kysely no PostgreSQL 14/SQLite auxiliar e uma mecânica segura de RLS no
PostgreSQL 14 com transações e pool; os objetos experimentais não são schema a
copiar.

002-A é infraestrutura e persistência. Ela prepara dados para incrementos
posteriores, mas não autentica pessoas, não determina permissões de negócio e
não oferece interface HTTP.

## Objetivo

Entregar adapters Kysely, infraestrutura governada de migrations, schemas
iniciais de identidade/tenancy, repositories e contextos transacionais com
isolamento em profundidade no PostgreSQL 14, sem acoplar o domínio ao banco.

## Dependências

- SPEC 001 `CONCLUIDA`;
- ADR 0001, 0002 e 0003 aceitas;
- ADR 0004 aceita: Kysely, representações por dialect e checksum SHA-256;
- ADR 0006 aceita: `TenantContext`/`PlatformContext` e mecânica RLS;
- spikes Kysely e PostgreSQL RLS concluídos;
- resolução de `PEND-002-008` sobre normalização de e-mail;
- resolução de `PEND-002-009` sobre checksum canônico e tipos/drift;
- autorização humana específica para implementar 002-A.

## Entradas

- `docs/sdd/002-identity-access-multiempresa.md`;
- `docs/adr/0004-estrategia-persistencia-query-builder.md`;
- `docs/adr/0006-isolamento-multiempresa-rbac.md`;
- `docs/qa/spikes/spec-002-kysely-persistence.md`;
- `docs/qa/spikes/spec-002-postgres-rls.md`;
- contratos arquiteturais e scripts da SPEC 001;
- decisões humanas registradas em `docs/qa/pendencias.md`.

## Escopo

- dependências e configuração definitiva de Kysely somente na infraestrutura;
- dialect oficial PostgreSQL 14 e adapter SQLite auxiliar compatível;
- runner de migrations separado do processo de startup da API;
- histórico imutável com checksum SHA-256;
- estratégia de tipos de tabela e detecção de drift confinada ao database;
- representação de UUID, UTC timestamp e decimal exato por dialect;
- schemas e tabelas iniciais de identidade e tenancy;
- portas de repository no domínio/aplicação e adapters no database;
- unidade de trabalho e executores transacionais;
- `TenantContext` e `PlatformContext` como tipos distintos;
- pools e roles PostgreSQL separados para tenant e plataforma;
- ownership, grants mínimos, RLS e policies de tabelas tenant-owned;
- testes de migrations, repositories, transações, tipos e isolamento.

## Fora de escopo

- login ou autenticação completa;
- validação, hashing ou política de senha;
- sessão HTTP, cookie, CSRF ou refresh token;
- recuperação ou redefinição de senha;
- endpoints públicos, empresariais ou administrativos;
- frontend, formulários ou telas;
- seleção funcional de empresa ativa;
- casos de uso de convite, suspensão ou gestão de membership;
- catálogo, cálculo ou regras finais de RBAC;
- bootstrap de `superadmin` e auditoria funcional;
- migrations ou dados do legado;
- produção, deploy e provisionamento de secrets reais.

## Modelo de domínio

### Primitivos e entidades

- `UserId`, `CompanyId` e `MembershipId`: UUIDs validados e semanticamente
  distintos;
- `NormalizedEmail`: value object global, cujo algoritmo precisa ser decidido
  antes da primeira migration;
- `User`: identidade global mínima e seu estado persistível;
- `PasswordCredential`: registro persistível separado, sem comportamento de
  validação de senha neste incremento;
- `Company`: tenant globalmente identificável com estado mínimo;
- `Membership`: vínculo único entre um usuário e uma empresa;
- `TenantContext`: contexto confiável e não anulável para um tenant;
- `PlatformContext`: contexto confiável para operação global, sem `companyId` ou
  capacidade de bypass.

Kysely, rows, dialects e tipos gerados pertencem à infraestrutura. Portas de
repository usam apenas tipos do domínio/aplicação e retornam modelos próprios,
nunca rows do banco.

## Invariantes

1. O domínio não importa Kysely, `pg`, SQLite, schema ou tipos de tabela.
2. `normalized_email` é globalmente único e só é persistido após algoritmo
   canônico aprovado.
3. Uma membership é única por `(user_id, company_id)` e seus vínculos são
   imutáveis.
4. UUID, timestamps e decimal nunca perdem precisão no round-trip.
5. Instantes são UTC; PostgreSQL usa `timestamptz` e SQLite usa ISO 8601 textual.
6. Dinheiro futuro usa `MoneyDecimal`/`BigInt` escala 4, `numeric(24,4)` no
   PostgreSQL e texto decimal canônico no SQLite; nunca `number`/`float`.
7. Migration aplicada nunca é editada; toda correção é uma nova migration.
8. Divergência de checksum de migration aplicada falha antes de qualquer
   mudança pendente.
9. A API não aplica migrations ao iniciar.
10. Toda operação tenant-owned recebe `TenantContext` e transação obrigatórios.
11. Inserts derivam `company_id` do contexto; leituras, updates e deletes
    filtram por `company_id` e identificador.
12. Contexto ausente ou inválido nega por padrão.
13. Contexto local desaparece após commit ou rollback antes do reuso do pool.
14. Role tenant não é owner, superuser nem possui `BYPASSRLS` ou DDL.
15. Role/plano de plataforma não recebe grant tenant-owned por conveniência.
16. RLS não substitui repository, constraint ou autorização futura.

## Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-002A-001 | O runner deve listar, validar e aplicar migrations pendentes em ordem monotônica. |
| RF-002A-002 | O runner deve registrar nome e checksum SHA-256 em tabela auxiliar no mesmo fluxo transacional seguro. |
| RF-002A-003 | O runner deve recusar conteúdo alterado de migration já aplicada sem atualizar o checksum. |
| RF-002A-004 | O sistema deve expor factories de banco por provider configurado e recusar configuração inválida com erro sanitizado. |
| RF-002A-005 | Repositories globais devem exigir `PlatformContext` quando a operação for administrativa/global. |
| RF-002A-006 | Repositories tenant-owned devem exigir `TenantContext` em todos os métodos. |
| RF-002A-007 | O executor tenant deve abrir transação e definir nela o contexto local da empresa na mesma conexão. |
| RF-002A-008 | O executor de plataforma deve usar pool/role e repositories separados, sem contexto tenant implícito. |
| RF-002A-009 | Migrations devem criar constraints que impeçam membership duplicada e referências tenant cruzadas. |
| RF-002A-010 | Policies RLS devem limitar leitura e escrita à empresa do contexto com `USING` e `WITH CHECK`. |
| RF-002A-011 | SQLite deve implementar somente os contratos auxiliares compatíveis e declarar recursos não equivalentes. |
| RF-002A-012 | A aplicação deve mapear rows para tipos próprios sem devolver tipos de infraestrutura ao chamador. |

## Requisitos não funcionais

- TypeScript estrito, sem `any` ou casts que ocultem drift;
- queries e SQL explícito parametrizados;
- pool limitado, encerrável e observável sem expor connection string;
- erros de configuração e banco convertidos para categorias sanitizadas;
- migrations determinísticas, revisáveis e repetíveis;
- PostgreSQL 14 obrigatório para constraints, migrations, RLS e concorrência;
- SQLite somente para feedback auxiliar e cenários declaradamente compatíveis;
- nenhum secret em código, exemplos, snapshots, logs ou evidências;
- nomes revelam o plano (`tenant` ou `platform`) e evitam helpers genéricos;
- performance não é inferida do spike; medições ficam em gate posterior.

## Persistência

### Schemas e tabelas iniciais

O desenho lógico inicial contém:

- schema `identity`:
  - `users` — identidade global, e-mail exibível, chave normalizada, status,
    versão e timestamps;
  - `password_credentials` — FK única para usuário, hash e metadados de
    algoritmo; somente estrutura, sem criação/validação de senha;
- schema `tenancy`:
  - `companies` — tenant, nome mínimo, status, versão e timestamps;
  - `memberships` — UUID, usuário, empresa, status, versão e timestamps, com
    unicidade `(user_id, company_id)`;
- schema técnico de migration ou nomes equivalentes:
  - histórico do migrator Kysely;
  - tabela auxiliar imutável com nome, versão do formato canônico, checksum
    SHA-256 e instante de aplicação.

`users`, `password_credentials` e `companies` são dados globais acessados por
repositories restritos. `memberships` é tenant-owned e recebe `company_id`,
constraints compostas e RLS. Novas tabelas tenant-owned futuras devem seguir o
mesmo template, sem depender de migration retroativa para habilitar isolamento.

### Roles e pools PostgreSQL

- owner sem login de runtime, responsável pela propriedade dos schemas;
- role de migration/deploy separada, credencial externa e privilégios somente
  durante a etapa controlada de migration;
- role comum de tenant distinta do owner, `NOSUPERUSER`, `NOBYPASSRLS`, sem DDL
  e com grants mínimos;
- role de plataforma distinta, sem grants em tabelas tenant-owned;
- pool tenant e pool plataforma construídos por configurações separadas e
  allowlisted, sem reutilização cruzada.

O nome físico das roles pode receber prefixo de ambiente, mas os atributos e
grants são contrato. Nenhuma senha é definida em migration versionada.

## Segurança

- tabelas tenant-owned usam `ENABLE ROW LEVEL SECURITY` e
  `FORCE ROW LEVEL SECURITY`;
- policies usam predicados equivalentes em `USING` e `WITH CHECK`;
- contexto é lido com `current_setting('app.current_company_id', true)` de modo
  que ausência não autorize linha;
- executor usa operação equivalente a
  `set_config('app.current_company_id', companyId, true)` dentro da transação;
- UUID inválido causa falha sanitizada, nunca fallback permissivo;
- contexto não existe em variável global, singleton mutável ou storage local do
  processo;
- credencial da aplicação é segredo de backend, pois permite definir o UUID do
  contexto; o servidor ainda valida a empresa antes de abrir a transação;
- zero linhas para ID de outro tenant tem a mesma semântica de inexistência;
- owner, migrator, superuser e role com `BYPASSRLS` nunca atendem tráfego;
- `TRUNCATE`, DDL e grants não são concedidos à role comum.

## Contratos

Não há contrato HTTP neste incremento. Portas internas mínimas:

```text
MigrationRunner.validateApplied(): MigrationIntegrityResult
MigrationRunner.up(target?): MigrationExecutionResult
MigrationRunner.down(target): MigrationExecutionResult  // apenas se segura

TenantTransactionRunner.run(context, work): Result
PlatformTransactionRunner.run(context, work): Result

UserRepository.findById(platformContext, userId)
UserRepository.findByNormalizedEmail(platformContext, normalizedEmail)
CompanyRepository.findById(platformContext, companyId)
MembershipRepository.findById(tenantContext, membershipId)
MembershipRepository.findByUser(tenantContext, userId)
```

Os tipos de executor passados aos adapters são opacos para domínio/casos de
uso. Não deve existir `skipTenant`, `includeAllCompanies`, contexto opcional ou
`companyId` livre em comando de criação tenant-owned.

## Migrations

Nenhum arquivo físico é criado nesta documentação. A ordem futura proposta é:

1. criar roles/ownership e schemas com grants mínimos por etapa operacional;
2. criar infraestrutura de histórico e checksum versionado;
3. criar `identity.users` e suas constraints após decidir normalização;
4. criar `identity.password_credentials` sem qualquer credencial inicial;
5. criar `tenancy.companies`;
6. criar `tenancy.memberships`, chaves compostas e índices;
7. habilitar/forçar RLS e criar policies `USING`/`WITH CHECK` nas tabelas
   tenant-owned;
8. validar catálogo, grants, policies e checksums antes de liberar tráfego.

Cada migration declara se `down` é seguro. Mudança destrutiva ou transformação
de dados usa expandir → backfill → validar → contrair e rollback operacional por
forward fix como padrão.

## Testes obrigatórios

### Unitários e arquiteturais

- value objects de UUID, UTC e decimal canônico;
- mappers preservam precisão e recusam valores inválidos;
- domínio não importa Kysely, drivers ou database;
- repositories não oferecem método tenant sem `TenantContext`;
- planos tenant/plataforma não compartilham tipo, factory ou bypass;
- nenhuma variável global armazena tenant;
- API inicia sem invocar migrator.

### Migrations e tipos

- banco PostgreSQL vazio recebe todas as migrations;
- base representativa recebe upgrade sem perda;
- segunda execução não altera schema;
- alteração de um byte em migration aplicada impede qualquer migration nova;
- checksum e nome são persistidos atomicamente;
- correção por nova migration preserva o histórico;
- `down` roda apenas onde declarado seguro;
- catálogo confirma UUID, `timestamptz`, constraints, índices, RLS e grants;
- round-trip de decimal exato não usa `number`;
- estratégia aprovada de tipos detecta drift.

### Repositories, transações e isolamento PostgreSQL

- commit persiste e rollback não deixa efeito parcial;
- tenant A não lê, conta, altera, remove ou relaciona dado de B;
- insert deriva A do contexto e recusa tentativa de gravar B;
- contexto ausente nega leitura/escrita;
- contexto inválido falha com erro sanitizado;
- `USING` e `WITH CHECK` são exercitados por SQL direto e repository;
- mesma conexão perde contexto após commit e rollback;
- reuso sequencial e concorrente do pool não vaza tenant;
- role tenant é não-owner, `NOSUPERUSER` e `NOBYPASSRLS`;
- role plataforma não acessa tabela tenant-owned;
- filtro de repository funciona mesmo quando a RLS não é a barreira observada;
- ID de outro tenant e inexistente têm resultado externo indistinguível;
- job global itera tenants com nova transação/contexto por empresa.

### SQLite auxiliar

- contratos compatíveis de repository, transação, UUID, timestamp e decimal;
- foreign keys ativadas por conexão;
- documentação/teste deixa explícito que RLS e concorrência não são cobertas;
- nenhum resultado apenas SQLite satisfaz gate PostgreSQL.

### Qualidade e segurança

- lint, limites arquiteturais, typecheck, testes e build do monorepo;
- auditoria de dependências e secrets;
- erros não revelam connection string, SQL interno ou credenciais;
- nenhum schema de sessão, RBAC final ou módulo de negócio é criado.

## Critérios de aceite

- [ ] decisões críticas de checksum, tipos/drift e e-mail aprovadas;
- [ ] Kysely existe somente nos adapters de infraestrutura;
- [ ] migrations são externas ao startup e protegidas por checksum SHA-256;
- [ ] schema inicial de identidade/tenancy atende constraints e ownership;
- [ ] contexts, pools, roles e repositories tenant/plataforma estão separados;
- [ ] RLS `ENABLE` + `FORCE`, `USING` + `WITH CHECK` passa com role real;
- [ ] contexto transacional desaparece após commit/rollback e não vaza no pool;
- [ ] filtros explícitos e testes de IDOR passam independentemente da RLS;
- [ ] migrations e isolamento passam no PostgreSQL 14;
- [ ] SQLite está documentado somente como auxiliar;
- [ ] lint, typecheck, testes, build e auditorias passam;
- [ ] evidências e documentação são atualizadas sem secret.

## Gate de saída

002-A somente pode mudar para `CONCLUIDA` quando todos os critérios acima
estiverem comprovados em `docs/qa/evidencias/spec-002-a.md`, não houver bloqueio
crítico de persistência/isolamento e o diff não contiver funcionalidade de
002-B–G. A conclusão não inicia automaticamente a 002-B.

## Rollback

- desligar consumers dos novos repositories antes de qualquer reversão;
- preferir nova migration corretiva a editar/reverter migration aplicada;
- usar `down` somente em ambiente controlado e quando declarado sem perda;
- se policy/grant estiver inseguro, bloquear tráfego tenant e restaurar a
  última policy testada, nunca desabilitar RLS para manter disponibilidade;
- preservar histórico/checksums e evidência do incidente;
- nenhum procedimento de produção é autorizado por esta spec.

## Pendências

| ID | Criticidade | Decisão necessária | Efeito |
|---|---|---|---|
| PEND-002-008 | Alta/bloqueadora da 002-A | algoritmo canônico e fluxo de alteração de e-mail | define unicidade da primeira migration |
| PEND-002-009 | Crítica/bloqueadora da 002-A | formato canônico/versionado do checksum e estratégia de tipos/drift | define o runner e os contratos de schema |
| PEND-002-010 | Média/futura | performance, PgBouncer e failover | gate posterior de hardening/pré-produção, não reabre o spike funcional |

Até as duas primeiras decisões serem resolvidas e existir autorização explícita,
002-A permanece `EM_ESPECIFICACAO`.
