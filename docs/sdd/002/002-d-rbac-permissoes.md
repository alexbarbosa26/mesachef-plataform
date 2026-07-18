# SPEC 002-D — RBAC e permissões

## Status

- **Estado:** `BLOQUEADA`
- **Atualização:** 2026-07-18
- **Implementação autorizada:** não
- **Bloqueio principal:** 002-C não concluída e matriz/delegação RBAC sem aceite.

## Contexto

`admin` e `staff` são papéis empresariais vinculados à membership;
`superadmin` é uma atribuição global separada. Menus e nomes de papel não podem
decidir autorização. Este incremento cria o catálogo extensível, calcula
permissões efetivas e aplica negação por padrão no backend, preservando a
separação entre os planos tenant e plataforma.

## Objetivo

Entregar RBAC empresarial e global, autorização por capacidade, atribuições
seguras e invalidação imediata, com testes de elevação, concorrência e
isolamento.

## Dependências

- 002-C `CONCLUIDA`;
- ADR 0006 e mecânica RLS implementadas/validadas;
- matriz `papel × recurso × ação` da identidade/tenancy aprovada;
- códigos estáveis e capacidade delegável aprovados;
- decisão sobre papéis customizados;
- regra do último admin e último superadmin aprovada;
- autorização explícita para implementar 002-D.

## Entradas

- `User`, `Company`, `Membership`, sessão e contexts dos incrementos A–C;
- matriz proposta na SPEC 002 agregadora;
- ADR 0006;
- política de versão/revogação de autorização;
- catálogo de erros e auditoria.

## Escopo

- `Permission`, `CompanyRole`, `RolePermission` e `MembershipRole`;
- `PlatformRoleAssignment` separado;
- papéis empresariais iniciais `admin` e `staff`;
- atribuição global inicial `superadmin`;
- catálogo versionado e seed determinística de permissões da SPEC 002;
- cálculo de permissões efetivas da membership ativa;
- guard/serviço de autorização consumido pelos casos de uso;
- negação por padrão;
- capacidade delegável e prevenção de autoconcessão;
- preservação transacional de último admin/superadmin;
- invalidação de sessão/cache após mudança;
- endpoints empresariais de leitura/atribuição dentro da matriz aprovada;
- testes positivos, negativos, concorrentes e entre tenants.

## Fora de escopo

- permissões de estoque, compras ou módulos ainda não especificados;
- UI para criar papéis customizados, salvo decisão explícita;
- ABAC, policies por expressão livre ou `deny` explícito;
- impersonação, suporte temporário ou bypass de superadmin;
- bootstrap do primeiro superadmin;
- criação/bloqueio administrativo de usuário/empresa;
- consulta persistente de auditoria;
- frontend/menu;
- migração de papéis do legado.

## Modelo de domínio

- `PermissionCode`: value object estável `resource.action`;
- `Permission`: capacidade global conhecida e classificada;
- `CompanyRole`: papel pertencente a exatamente uma empresa;
- `RolePermission`: concessão aditiva de capacidade a papel;
- `MembershipRole`: atribuição de papel da mesma empresa à membership;
- `PlatformRoleAssignment`: atribuição global separada, inicialmente
  `superadmin`;
- `EffectivePermissions`: conjunto imutável calculado para um contexto;
- `DelegationPolicy`: regra explícita sobre capacidades que o ator pode
  conceder;
- `AuthorizationDecision`: allow/deny com código interno sanitizado e
  correlation ID.

## Invariantes

1. Ausência de concessão implica negação.
2. Permissão empresarial é calculada somente para membership ativa da empresa
   ativa.
3. Papel empresarial, membership e atribuição pertencem à mesma empresa.
4. `superadmin` nunca é papel de membership.
5. `superadmin` não autoriza implicitamente repository tenant-owned.
6. Controller, UI e repository não autorizam por string de papel espalhada.
7. Ator não concede capacidade que não possui e não está autorizado a delegar.
8. Autoconcessão e elevação indireta são recusadas.
9. Empresa ativa operacional preserva ao menos um `admin` ativo.
10. Após bootstrap, a plataforma preserva ao menos um `superadmin` ativo.
11. Atribuição concorrente não pode cruzar tenants nem contornar os dois
    últimos invariantes.
12. Alteração de papel/catálogo incrementa versão ou revoga sessões/caches
    afetados antes de confirmar sucesso.
13. Código de permissão aplicado é conhecido pelo catálogo versionado.
14. UI orienta experiência, mas backend sempre recalcula/valida a decisão.

## Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-002D-001 | O sistema deve carregar catálogo determinístico de permissões da SPEC 002. |
| RF-002D-002 | O sistema deve criar papéis `admin` e `staff` por empresa conforme matriz aprovada. |
| RF-002D-003 | O backend deve calcular permissões efetivas da membership ativa. |
| RF-002D-004 | Todo caso de uso protegido deve declarar a permissão exigida e negar por padrão. |
| RF-002D-005 | Admin autorizado deve atribuir apenas papéis/capacidades delegáveis na própria empresa. |
| RF-002D-006 | Mudança de atribuição deve ser transacional, idempotente e invalidar acesso obsoleto. |
| RF-002D-007 | O sistema deve recusar remoção concorrente do último admin/superadmin. |
| RF-002D-008 | O sistema deve retornar permissões efetivas para orientar a UI sem torná-la autoridade. |
| RF-002D-009 | Mudança crítica deve produzir evento sanitizado para o módulo de auditoria. |
| RF-002D-010 | Código desconhecido ou contexto incompleto deve resultar em negação. |

## Requisitos não funcionais

- decisões de autorização são determinísticas, testáveis e centralizadas;
- catálogo em código e banco possui versão/drift verificável;
- atribuições usam transação/lock apropriado sob concorrência;
- cache, se adotado, inclui versão de autorização e nunca amplia acesso;
- respostas não listam permissões de outro tenant;
- métricas de deny evitam PII e cardinalidade não controlada;
- PostgreSQL 14 é gate para FKs compostas, locks e concorrência;
- adicionar permissão futura não exige condicionais dispersas.

## Persistência

- `access.permissions`: código global único, descrição, classificação e versão;
- `access.company_roles`: `company_id`, código/nome, estado, indicador de sistema,
  unicidade `(company_id, code)`;
- `access.company_role_permissions`: relação de papel e permissão com empresa
  explícita;
- `access.membership_roles`: relação de membership e papel com empresa explícita;
- `access.platform_role_assignments`: usuário, código global, estado, ator e
  timestamps;
- FKs compostas impedem membership/papel de empresas diferentes;
- tabelas empresariais são tenant-owned e recebem RLS/policies da ADR 0006;
- atribuições globais só são acessíveis no plano plataforma.

## Segurança

- authorization middleware valida sessão/contexto, mas o caso de uso também
  exige capacidade pertinente;
- DTO não aceita permissões efetivas, `isAdmin`, `isSuperadmin` ou `companyId`
  como autoridade;
- mass assignment e códigos extras são rejeitados;
- updates usam allowlist e conjunto completo esperado, não merge permissivo;
- zero linhas alheias não revela existência;
- `PlatformContext` e role global não recebem acesso tenant-owned;
- grants, RLS e filtro de repository permanecem mesmo para endpoints admin;
- mudança de privilégio exige reautenticação recente conforme decisão da ADR
  0005 e produz auditoria futura;
- tentativas de elevação geram evento sanitizado sem payload sensível.

## Contratos

| Método e rota | Permissão | Finalidade |
|---|---|---|
| `GET /api/v1/me/permissions` | tenant ativo | permissões efetivas da membership ativa |
| `GET /api/v1/company/roles` | `role.read` | papéis disponíveis da própria empresa |
| `GET /api/v1/company/memberships` | `membership.read` | memberships do tenant ativo |
| `PUT /api/v1/company/memberships/{id}/roles` | `role.assign` + delegação | substituição transacional de atribuições |

Contratos globais para alterar `superadmin` serão expostos na 002-E. A porta
interna de autorização recebe `TenantContext` ou `PlatformContext` distintos e
um `PermissionCode`; não aceita booleano de bypass.

## Migrations

1. criar schema/tabelas `access` e constraints compostas;
2. habilitar/forçar RLS nas tabelas empresariais;
3. criar policies `USING`/`WITH CHECK` e grants mínimos;
4. semear catálogo e papéis iniciais por migration determinística e idempotente;
5. validar que versão em código e banco coincidem;
6. criar índices por empresa, membership, papel e código;
7. não inserir usuário, senha ou superadmin padrão.

## Testes obrigatórios

- catálogo determinístico, código desconhecido e drift;
- matriz positiva/negativa de `admin`, `staff` e `superadmin`;
- negação por padrão sem contexto/permissão;
- `staff` chama URL direta, injeta papel ou permissão no payload;
- admin de A tenta atribuir papel de B;
- papel de A não pode ser ligado a membership de B por FK/RLS/repository;
- admin tenta se elevar ou delegar além da capacidade;
- superadmin tenta repository tenant sem membership/contexto;
- remoção concorrente do último admin e último superadmin;
- alteração invalida sessão/cache imediatamente;
- ID alheio e inexistente têm semântica equivalente;
- catálogos/policies/migrations passam no PostgreSQL 14;
- lint, limites, typecheck, testes, build, dependências e secrets.

## Critérios de aceite

- [ ] matriz e delegação foram aprovadas e rastreadas;
- [ ] `admin`/`staff` são empresariais e `superadmin` é global separado;
- [ ] todo acesso nega por padrão e usa permissão efetiva no backend;
- [ ] autoconcessão, cruzamento de tenant e último administrador são protegidos;
- [ ] invalidação impede privilégio obsoleto;
- [ ] RLS e filters permanecem ativos para dados empresariais;
- [ ] testes adversariais/concorrentes passam no PostgreSQL 14;
- [ ] nenhum módulo futuro ou bypass foi implementado.

## Gate de saída

002-D só pode ser concluída após a matriz aprovada estar integralmente coberta
por testes positivos/negativos, inclusive concorrência e isolamento. A saída
estabiliza contratos para 002-E/002-F, mas não os inicia automaticamente.

## Rollback

- desabilitar endpoints de atribuição e revogar sessões afetadas;
- corrigir catálogo por nova versão/migration, nunca editar migration aplicada;
- restaurar conjunto anterior por comando transacional auditável;
- diante de incoerência, negar acesso em vez de assumir papel padrão;
- preservar eventos e histórico de atribuição necessários à investigação.

## Pendências

- matriz final `papel × recurso × ação` da SPEC 002;
- regras de capacidade delegável;
- exposição ou apenas suporte estrutural a papéis customizados;
- regra exata de último admin em empresa bloqueada;
- reautenticação exigida para cada mudança crítica;
- estratégia e TTL de cache de permissões, caso necessário.
