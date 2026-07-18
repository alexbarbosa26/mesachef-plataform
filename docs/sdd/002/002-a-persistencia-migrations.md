# SPEC 002-A — Persistência e migrations de identidade e tenancy

## Status

- **Estado:** `EM_IMPLEMENTACAO`
- **Atualização:** 2026-07-18
- **Implementação executada nesta revisão:** somente 002-A1 — infraestrutura
  Kysely, tipos, migrator e checksum
- **Motivo:** 002-A1 foi implementado e validado; os schemas, repositories,
  contextos e controles de isolamento dos incrementos seguintes não foram
  autorizados nem iniciados.

### Controle incremental

| Incremento | Escopo | Estado | Evidência |
|---|---|---|---|
| 002-A1 | Kysely/drivers, tipos exatos, migrator separado, SHA-256 e canonicalização `v1` | `CONCLUIDO` | `docs/qa/evidencias/spec-002-a.md` |
| 002-A2 e seguintes | schema de identidade/tenancy, `db:verify`, repositories, contextos, roles e RLS definitivos | `BLOQUEADOS` | exigem nova autorização explícita |

## Contexto

A fundação técnica ainda não possui persistência de negócio. A execução
incremental começou pela fronteira definitiva entre domínio e infraestrutura,
sem criar tabelas de identidade ou tenancy. Os spikes provaram
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
- `PEND-002-008` encerrada com algoritmo de normalização de e-mail aprovado;
- `PEND-002-009` encerrada com canonicalização `v1`, política de tipos e
  contrato de `db:verify` aprovados;
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
- canonicalização UTF-8 `v1` e metadados completos das migrations;
- comando `db:verify` para migrations/checksums e catálogo PostgreSQL;
- tipos de tabela e detecção de drift confinados ao database;
- representação de UUID, UTC timestamp e decimal exato por dialect;
- normalização central de e-mail e unicidade por `email_normalized`;
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
- `EmailAddress`: value object com `original` para exibição/auditoria e
  `normalized` para autenticação/unicidade;
- `EmailNormalizer`: componente puro e testável do domínio `identity-access`,
  responsável por trim de extremidades, NFC, lowercase independente de locale,
  IDNA do domínio e validação de formato;
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
2. `email_original` é persistido para exibição/auditoria e nunca é chave de
   autenticação ou unicidade.
3. `email_normalized` resulta, em ordem determinística, da remoção de espaços
   nas extremidades, normalização Unicode NFC, lowercase independente de locale
   e normalização IDNA do domínio quando necessária.
4. A normalização não remove pontos do local-part, aliases com `+` nem aplica
   regra específica de Gmail ou outro provedor.
5. O formato do e-mail é validado antes da persistência, e a unicidade global é
   aplicada sobre `email_normalized`; `citext` não é a fonte da regra.
6. Uma membership é única por `(user_id, company_id)` e seus vínculos são
   imutáveis.
7. UUID, timestamps e decimal nunca perdem precisão no round-trip.
8. Instantes são UTC; PostgreSQL usa `timestamptz` e SQLite usa ISO 8601 textual.
9. JSON é validado por schema antes de entrar no domínio.
10. Dinheiro futuro usa `MoneyDecimal`/`BigInt` escala 4, `numeric(24,4)` no
    PostgreSQL e texto decimal canônico no SQLite; driver nunca converte
    `numeric` para JavaScript `number`.
11. Migration aplicada nunca é editada; toda correção é uma nova migration.
12. Checksum SHA-256 usa canonicalização `v1`: UTF-8, remoção de BOM inicial e
    normalização CRLF/CR para LF, preservando todo o restante.
13. Divergência de checksum de migration aplicada falha antes de qualquer
    mudança pendente e nunca é corrigida automaticamente.
14. Histórico registra migration, checksum, `canonicalization_version`, data,
    versão da aplicação e versão da ferramenta.
15. Migrations rodam em etapa separada de deploy; a API não as aplica ao iniciar.
16. Migrations são a fonte de verdade do schema; alterações manuais são proibidas.
17. `db:verify` falha ao encontrar drift e nunca modifica schema ou checksums.
18. Toda operação tenant-owned recebe `TenantContext` e transação obrigatórios.
19. Inserts derivam `company_id` do contexto; leituras, updates e deletes
    filtram por `company_id` e identificador.
20. Contexto ausente ou inválido nega por padrão.
21. Contexto local desaparece após commit ou rollback antes do reuso do pool.
22. Role tenant não é owner, superuser nem possui `BYPASSRLS` ou DDL.
23. Role/plano de plataforma não recebe grant tenant-owned por conveniência.
24. RLS não substitui repository, constraint ou autorização futura.
25. SQLite é auxiliar e não prova paridade integral, RLS ou concorrência.

## Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-002A-001 | O runner deve listar, validar e aplicar migrations pendentes em ordem monotônica. |
| RF-002A-002 | O runner deve registrar migration, checksum, canonicalização, data, versão da aplicação e versão da ferramenta em tabela auxiliar. |
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
| RF-002A-013 | O normalizador deve produzir `email_original` e `email_normalized` conforme o algoritmo aprovado. |
| RF-002A-014 | Persistência deve validar formato e garantir unicidade global de `email_normalized`. |
| RF-002A-015 | O checksum deve aplicar somente as transformações da canonicalização UTF-8 `v1`. |
| RF-002A-016 | O comando `db:verify` deve validar migrations/checksums e objetos críticos do catálogo PostgreSQL. |
| RF-002A-017 | Drift deve falhar sem autocorreção e exigir nova migration. |
| RF-002A-018 | Adapters devem preservar dinheiro, UUID, UTC timestamp e JSON validado sem tipos do driver no domínio. |

## Requisitos não funcionais

- TypeScript estrito, sem `any` ou casts que ocultem drift;
- queries e SQL explícito parametrizados;
- pool limitado, encerrável e observável sem expor connection string;
- erros de configuração e banco convertidos para categorias sanitizadas;
- migrations determinísticas, revisáveis e repetíveis;
- canonicalização e checksum reproduzíveis entre Windows/Linux sem ignorar
  alteração substantiva de conteúdo;
- migrations como única fonte de verdade e `db:verify` fail-closed;
- PostgreSQL 14 obrigatório para constraints, migrations, RLS e concorrência;
- SQLite somente para feedback auxiliar e cenários declaradamente compatíveis;
- nenhum secret em código, exemplos, snapshots, logs ou evidências;
- nomes revelam o plano (`tenant` ou `platform`) e evitam helpers genéricos;
- normalização de e-mail centralizada, pura e independente de locale/provedor;
- performance não é inferida do spike; medições ficam em gate posterior.

## Persistência

### Schemas e tabelas iniciais

O desenho lógico inicial contém:

- schema `identity`:
  - `users` — identidade global, `email_original`, `email_normalized`, status,
    versão e timestamps;
  - índice/constraint unique sobre `email_normalized`; nenhuma unicidade ou
    autenticação baseada em `email_original`/`citext`;
  - `password_credentials` — FK única para usuário, hash e metadados de
    algoritmo; somente estrutura, sem criação/validação de senha;
- schema `tenancy`:
  - `companies` — tenant, nome mínimo, status, versão e timestamps;
  - `memberships` — UUID, usuário, empresa, status, versão e timestamps, com
    unicidade `(user_id, company_id)`;
- schema técnico de migration ou nomes equivalentes:
  - histórico do migrator Kysely;
  - tabela auxiliar imutável com `migration_name`, `checksum_sha256`,
    `canonicalization_version`, `applied_at`, `application_version` e
    `migration_tool_version`.

`users`, `password_credentials` e `companies` são dados globais acessados por
repositories restritos. `memberships` é tenant-owned e recebe `company_id`,
constraints compostas e RLS. Novas tabelas tenant-owned futuras devem seguir o
mesmo template, sem depender de migration retroativa para habilitar isolamento.

### Normalização de e-mail

`EmailNormalizer` recebe o endereço informado, preserva o valor em
`email_original` para exibição/auditoria e calcula `email_normalized` para
lookup e unicidade:

1. remover espaços no início e no fim para o valor normalizado;
2. aplicar Unicode NFC;
3. converter para minúsculas de modo independente de locale;
4. normalizar o domínio por IDNA quando necessário;
5. validar o formato antes de construir/persistir o value object.

O algoritmo não remove pontos do local-part, não remove `+alias`, não conhece
Gmail ou outro provedor e não usa `citext` como fonte de verdade. Todos os
caminhos de criação, busca e autenticação futura reutilizam o mesmo componente
testável; o banco apenas reforça a unicidade do resultado normalizado.

### Canonicalização de migrations `v1`

O runner lê UTF-8, recusa encoding inválido, remove somente BOM UTF-8 inicial,
converte CRLF e CR para LF e preserva todo o restante. O SHA-256 é calculado
sobre os bytes UTF-8 resultantes. Espaços, tabs, comentários, linhas vazias,
Unicode e presença/ausência de newline final não são alterados.

O runner valida todo o histórico antes de aplicar pendências. Divergência
impede a execução e não atualiza metadados. Uma nova versão de canonicalização
exige decisão/documentação própria e não reinterpreta silenciosamente registros
`v1`.

### Tipos e detecção de drift

- `MoneyDecimal` usa `BigInt`/escala 4 no domínio e string canônica na fronteira;
- PostgreSQL usa `numeric(24,4)`, UUID nativo e `timestamptz`;
- SQLite usa texto decimal canônico, UUID textual validado e ISO 8601 textual;
- instantes são UTC;
- JSON é validado por schema antes do domínio;
- tipos Kysely/driver/row ficam em `packages/database`.

Migrations são a fonte de verdade. O futuro comando `db:verify`, parte da
implementação da 002-A, verifica histórico/checksums e, no PostgreSQL, tabelas,
colunas, tipos, constraints, índices, policies RLS, roles e grants. Qualquer
drift falha sem autocorreção; a correção é sempre nova migration. SQLite não é
prova de paridade completa.

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
EmailNormalizer.normalize(input): EmailAddress
MigrationCanonicalizer.v1(utf8File): CanonicalMigrationContent
MigrationChecksum.sha256(canonicalContent): MigrationChecksum
MigrationRunner.validateApplied(): MigrationIntegrityResult
MigrationRunner.up(target?): MigrationExecutionResult
MigrationRunner.down(target): MigrationExecutionResult  // apenas se segura
DatabaseVerifier.verify(): DatabaseVerificationResult

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
2. criar infraestrutura de histórico/checksum com metadados da
   canonicalização `v1`;
3. criar `identity.users` com `email_original`, `email_normalized` e unicidade
   global sobre o segundo;
4. criar `identity.password_credentials` sem qualquer credencial inicial;
5. criar `tenancy.companies`;
6. criar `tenancy.memberships`, chaves compostas e índices;
7. habilitar/forçar RLS e criar policies `USING`/`WITH CHECK` nas tabelas
   tenant-owned;
8. validar catálogo, grants, policies, migrations e checksums por `db:verify`
   antes de liberar tráfego.

Cada migration declara se `down` é seguro. Mudança destrutiva ou transformação
de dados usa expandir → backfill → validar → contrair e rollback operacional por
forward fix como padrão.

## Testes obrigatórios

### Unitários e arquiteturais

- value objects de UUID, UTC e decimal canônico;
- e-mail preserva `original` e produz `normalized` após espaços, NFC,
  lowercase independente de locale e IDNA;
- endereços equivalentes por casing/NFC/IDNA colidem em `email_normalized`;
- pontos no local-part e aliases com `+` permanecem significativos;
- nenhuma regra Gmail/provedor ou dependência de `citext` participa do resultado;
- formato inválido é recusado antes do repository;
- mappers preservam precisão e recusam valores inválidos;
- JSON inválido não entra no domínio;
- domínio não importa Kysely, drivers ou database;
- repositories não oferecem método tenant sem `TenantContext`;
- planos tenant/plataforma não compartilham tipo, factory ou bypass;
- nenhuma variável global armazena tenant;
- API inicia sem invocar migrator.

### Migrations e tipos

- banco PostgreSQL vazio recebe todas as migrations;
- base representativa recebe upgrade sem perda;
- segunda execução não altera schema;
- UTF-8 com/sem BOM e CRLF/CR/LF equivalentes geram o mesmo checksum `v1`;
- mudança em qualquer conteúdo fora das normalizações `v1`, inclusive espaços
  ou newline final, altera o checksum;
- arquivo com UTF-8 inválido falha antes da migration;
- alteração de um byte em migration aplicada impede qualquer migration nova;
- migration, checksum, canonicalização, data e versões são persistidos
  atomicamente;
- correção por nova migration preserva o histórico;
- `down` roda apenas onde declarado seguro;
- catálogo confirma UUID, `timestamptz`, constraints, índices, RLS e grants;
- round-trip de decimal exato não usa `number` em nenhum mapper/driver;
- `db:verify` detecta drift de tabelas, colunas, tipos, constraints, índices,
  policies, roles e grants;
- `db:verify` falha sem modificar schema, grants ou checksums;
- SQLite nunca satisfaz o teste de paridade completa.

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

- [x] decisões críticas de checksum, tipos/drift e e-mail aprovadas;
- [ ] `email_original`/`email_normalized`, normalizador e unicidade implementados/testados;
- [x] Kysely existe somente nos adapters de infraestrutura;
- [x] migrations são externas ao startup e protegidas por checksum SHA-256 `v1`;
- [ ] `db:verify` detecta os objetos críticos e falha sem autocorreção;
- [ ] schema inicial de identidade/tenancy atende constraints e ownership;
- [ ] contexts, pools, roles e repositories tenant/plataforma estão separados;
- [ ] RLS `ENABLE` + `FORCE`, `USING` + `WITH CHECK` passa com role real;
- [ ] contexto transacional desaparece após commit/rollback e não vaza no pool;
- [ ] filtros explícitos e testes de IDOR passam independentemente da RLS;
- [ ] migrations e isolamento passam no PostgreSQL 14;
- [x] SQLite está documentado somente como auxiliar;
- [x] lint, typecheck, testes, build e auditorias passam para o escopo 002-A1;
- [x] evidências e documentação de 002-A1 são atualizadas sem secret.

Os itens marcados para 002-A1 devem ser reexecutados no gate final da 002-A;
eles não antecipam o aceite dos itens ainda abertos.

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

| ID | Estado | Resultado/efeito |
|---|---|---|
| PEND-002-008 | `ENCERRADA` | normalização de e-mail e unicidade definidas; fluxo funcional de alteração pertence a incremento posterior |
| PEND-002-009 | `ENCERRADA` | canonicalização `v1`, tipos, migrations como fonte de verdade e `db:verify` definidos |
| PEND-002-010 | `ABERTA_NAO_BLOQUEADORA` | performance, PgBouncer e failover são gate futuro de hardening/pré-produção |

Não resta decisão crítica de persistência ou isolamento para iniciar este
incremento. A 002-A está `EM_IMPLEMENTACAO`: somente 002-A1 está concluído e
002-A2 ou qualquer etapa posterior depende de nova autorização explícita.
