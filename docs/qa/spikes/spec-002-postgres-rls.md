# Spike técnico — SPEC 002 — PostgreSQL Row-Level Security

## 1. Identificação

- **Data:** 2026-07-18
- **Tipo:** spike técnico descartável de PostgreSQL RLS
- **Spec relacionada:** 002
- **Status:** `CONCLUIDO`
- **Branch observada:** `spike/spec-002-postgres-rls`
- **Diretório isolado:** `spikes/postgres-rls`
- **Commit:** não criado; não autorizado
- **Produção:** não acessada
- **SPEC 002-A:** não implementada nem liberada automaticamente
- **Spike anterior:** `spikes/kysely-persistence` não alterado

## 2. Objetivo e limites

O experimento validou uma estratégia de defesa em profundidade para dados
tenant-owned com:

- Kysely sobre PostgreSQL 14 local;
- role real da aplicação sem ownership, superuser ou `BYPASSRLS`;
- `ENABLE ROW LEVEL SECURITY` e `FORCE ROW LEVEL SECURITY`;
- `TenantContext` definido com `set_config(..., true)` somente dentro de
  transação;
- filtros explícitos por empresa nos repositories;
- pool de conexões sob reuso e concorrência;
- plano global separado por `PlatformContext` e role própria.

Foram criados somente objetos experimentais:

- `spike_rls_companies`;
- `spike_rls_resources`;
- `spike_rls_audit_events`;
- `spike_rls_migration` e `spike_rls_migration_lock`;
- policies e roles com nomes `spike_rls_*`.

Não foram implementados login, senha, sessão, usuário, empresa, membership ou
RBAC definitivos. Nenhum módulo em `apps/**` ou `packages/**` foi alterado.

## 3. Ambiente validado

| Componente | Versão/estado observado |
|---|---|
| Node.js | 24.18.0 |
| pnpm | 11.9.0 |
| Kysely | 0.29.4 |
| `pg` | 8.22.0 |
| Docker Engine | 29.6.1 |
| PostgreSQL | 14.23, container local `healthy` |
| Pool de tenant | `pg.Pool`, até 8 conexões na suíte concorrente |

A URL administrativa preexistente foi injetada somente no processo de teste.
Seu valor não foi impresso nem gravado no spike. A configuração recusa hosts
fora de `localhost`, `127.0.0.1` e `::1`.

## 4. Desenho validado

### 4.1 Roles e privilégios

| Role experimental | Propriedade | Grants | RLS |
|---|---|---|---|
| `spike_rls_owner` | owner das três tabelas | implícitos de owner; sem login | `FORCE` impede bypass de owner |
| `spike_rls_app` | não é owner | CRUD em resources; leitura/inserção de audit | sem superuser e sem `BYPASSRLS` |
| `spike_rls_platform` | não é owner | somente leitura de companies | sem grant nas tabelas tenant-owned |

As roles são efêmeras. As senhas de login são geradas aleatoriamente em memória
por suíte e não entram em código, documentação ou logs.

### 4.2 Policy

A policy de resources e audit aplica `USING` e `WITH CHECK` equivalentes:

```sql
company_id = nullif(
  current_setting('app.current_company_id', true),
  ''
)::uuid
```

- configuração inexistente ou limpa produz `NULL` e nega;
- UUID válido permite somente a empresa correspondente;
- texto inválido falha durante o cast e é sanitizado pela infraestrutura;
- `WITH CHECK` impede insert e mudança de `company_id` para outro tenant.

### 4.3 Propagação do contexto

`runInTenantTransaction` abre uma transação Kysely e executa na mesma conexão:

```sql
select set_config('app.current_company_id', $1, true);
```

O valor nunca é armazenado em variável global do processo. O terceiro argumento
`true` limita a configuração à transação. O teste com pool `max=1` comprova que
a mesma conexão retorna sem o tenant após commit e rollback.

### 4.4 Defense in depth

RLS não substitui o repository. Todos os métodos tenant-owned recebem
`TenantContext`, inserts derivam `company_id` do contexto e leituras, updates e
deletes incluem `company_id` no predicado.

Para provar independência entre as barreiras, o repository foi executado também
pela conexão administrativa, que ignora RLS por ser superuser. Mesmo nesse
caminho, o filtro explícito impediu a leitura do tenant B pelo contexto A.

## 5. Matriz dos 24 critérios obrigatórios

| # | Critério | Evidência | Resultado |
|---:|---|---|---|
| 1 | ativação de RLS | `pg_class.relrowsecurity = true` | aprovado |
| 2 | `FORCE ROW LEVEL SECURITY` | `pg_class.relforcerowsecurity = true` | aprovado |
| 3 | role sem `BYPASSRLS` | catálogo confirma `rolbypassrls=false`, `rolsuper=false` e owner distinto | aprovado |
| 4 | acesso à empresa ativa | A lê somente resource/audit de A | aprovado |
| 5 | negação de outra empresa | SQL direto e repository de A não veem B | aprovado |
| 6 | insert limitado | insert de A funciona; insert para B sob contexto A falha | aprovado |
| 7 | update limitado | A atualiza A; B resulta em zero linhas; mover A para B falha | aprovado |
| 8 | delete limitado | A remove A e não remove B | aprovado |
| 9 | ausência de contexto | select retorna zero; insert falha | aprovado |
| 10 | contexto inválido | cast falha e adapter retorna erro sanitizado | aprovado |
| 11 | contexto somente na transação | única API usa transaction + `set_config(..., true)` | aprovado |
| 12 | limpeza após commit | mesma conexão `max=1` retorna `NULL`/sem linhas | aprovado |
| 13 | limpeza após rollback | mesma conexão `max=1` retorna `NULL`/sem linhas | aprovado |
| 14 | reuso do pool | 20 alternâncias A/B e 16 probes simultâneos em múltiplos backends sem resíduo | aprovado |
| 15 | concorrência A/B | 40 transações sobre múltiplos backends sem cruzamento | aprovado |
| 16 | repository exige contexto | porta e todos os métodos exigem `TenantContext` | aprovado |
| 17 | filtros além de RLS | filtro comprovado sob superuser que ignora RLS | aprovado |
| 18 | IDOR | ID de B e ID inexistente retornam o mesmo `null` | aprovado |
| 19 | troca livre de `companyId` | contexto A + tentativa de escrever B falha no `WITH CHECK` | aprovado |
| 20 | superadmin sem bypass | role/plano de plataforma não possui grant tenant-owned | aprovado |
| 21 | contextos separados | tipos branded e repositories distintos | aprovado |
| 22 | job global sem resíduo | enumera companies e abre uma transação por tenant | aprovado |
| 23 | erros sem connection string | configuração e erros de banco usam mensagens allowlisted | aprovado |
| 24 | cleanup final | catálogo confirmou zero tabelas e zero roles `spike_rls_*` | aprovado |

## 6. RLS bloqueia acesso entre empresas?

**Sim, no escopo testado.** Com a role real `spike_rls_app`, contexto A não lê,
altera ou remove a linha B. `WITH CHECK` também impede inserir B ou mover uma
linha de A para B. A prova usa SQL direto além do repository.

## 7. A negação por padrão funciona?

**Sim.** Sem configuração, `current_setting(..., true)` resulta em ausência e a
expressão da policy não retorna `true`: selects recebem zero linhas e inserts
falham. Um valor malformado produz falha de cast, convertida para erro genérico.

Não foi criada policy permissiva global ou fallback por `companyId` nulo.

## 8. `FORCE ROW LEVEL SECURITY` é necessário?

Para a role comum, não ser owner e não possuir `BYPASSRLS` já é obrigatório e
faz RLS atuar. `FORCE ROW LEVEL SECURITY` continua **necessário como hardening**
no desenho recomendado porque impede que a role proprietária não-superuser
ignore as policies e protege contra ownership acidental no caminho de runtime.

O teste executou como `spike_rls_owner`: `row_security_active(...)` retornou
`true` e nenhuma linha ficou visível. Superuser/migration continua sendo plano
operacional separado e não pode atender tráfego da aplicação.

## 9. O contexto transacional funciona?

**Sim.** A configuração local foi observada dentro da transação e desapareceu
após commit e rollback. A mesma conexão física foi forçada com pool `max=1`.
Não existe variável global de tenant.

Todo caminho tenant-owned deve exigir transação, mesmo para leitura, se a policy
depender desse contexto. Uma query executada fora do wrapper falha fechada.

## 10. O pool reutiliza conexões sem vazamento?

**Sim, para os cenários executados.** Foram validados:

- mesma conexão após commit;
- mesma conexão após rollback;
- 20 alternâncias sequenciais A/B;
- 40 transações concorrentes A/B distribuídas em mais de um backend;
- 16 probes simultâneos após a carga, todos sem contexto e sem linhas visíveis;
- consulta sem contexto após a carga, retornando zero linhas.

Nenhuma execução recebeu o tenant anterior.

## 11. Como devem funcionar os repositories?

- exigir `TenantContext` não anulável em todos os métodos;
- aceitar apenas executor transacional no adapter;
- derivar `company_id` do contexto no insert;
- filtrar por `(company_id, id)` em leitura, update e delete;
- tratar zero linhas de outro tenant como inexistência;
- não oferecer `skipTenant`, contexto opcional ou bypass de superadmin;
- manter Kysely e tipos de tabela fora do domínio;
- preservar RLS como segunda barreira, não como justificativa para remover
  filtros.

## 12. Como separar `TenantContext` e `PlatformContext`?

Os contextos usam tipos, discriminadores e repositories distintos:

- `TenantContext` contém `companyId` validado e só entra no plano tenant;
- `PlatformContext` não possui `companyId`, `bypassTenant` ou `isSuperadmin`;
- a role de plataforma lê somente o catálogo global experimental;
- tentar consultar resources pela conexão de plataforma falha por falta de
  grant;
- entrar em um tenant exige criar explicitamente um novo `TenantContext` por um
  fluxo autorizado e auditável.

O sistema de tipos auxilia, mas os grants separados são a barreira de runtime.

## 13. Como tratar operações globais?

O job experimental usa `PlatformContext` para listar empresas e, em seguida,
itera cada tenant. Para cada empresa abre uma nova transação com
`TenantContext` explícito. Ao terminar, o pool não retém contexto.

Operações genuinamente globais devem usar repositories/tabelas próprios do
plano de plataforma. Agregações tenant-owned não recebem query irrestrita por
conveniência. Exceções futuras de suporte ou impersonação exigem ADR e auditoria
específicas.

## 14. Testes e comandos executados

| Verificação | Resultado |
|---|---|
| Docker/PostgreSQL | Engine 29.6.1; container `healthy`; PostgreSQL 14.23 |
| instalação isolada | 147 pacotes reutilizados do cache; zero download observado |
| lint | aprovado, zero warnings |
| typecheck estrito | aprovado |
| testes unitários/arquiteturais | 3 arquivos, 12 testes aprovados |
| testes PostgreSQL RLS | 1 arquivo, 13 testes aprovados |
| testes concorrentes | 1 arquivo, 3 testes aprovados |
| total | 5 arquivos, 28 testes aprovados |
| build | aprovado |
| auditoria de secrets | aprovada |
| `pnpm audit --prod` | nenhuma vulnerabilidade conhecida |
| cleanup no catálogo | zero tabelas e zero roles `spike_rls_*` |

## 15. Riscos e limitações remanescentes

1. qualquer cliente com a credencial da role de aplicação consegue chamar
   `set_config` com outro UUID; portanto, a credencial só pode existir no backend
   confiável e o servidor deve derivar/validar a empresa ativa;
2. RLS não autoriza ações de negócio, papéis ou permissões; RBAC e casos de uso
   continuam obrigatórios;
3. superuser e roles com `BYPASSRLS` ignoram RLS; nunca podem atender requisições;
4. `TRUNCATE` e verificações de integridade referencial não são cobertas por RLS;
   a role comum não recebeu `TRUNCATE` ou DDL;
5. constraints únicas/FKs podem criar canais laterais por mensagens de conflito;
   erros externos precisam permanecer sanitizados;
6. uma query tenant fora da transação negará tudo; isso é seguro, mas exige
   observabilidade para distinguir erro de programação de ausência real;
7. o spike não mediu performance, planos, carga longa, failover, proxies de pool
   ou PgBouncer;
8. o job global validou iteração simples, não retentativa, checkpoint,
   idempotência ou volumes reais;
9. não foram testadas policies definitivas, schema definitivo, memberships,
   autorização ou auditoria real;
10. a SPEC ainda possui outras decisões críticas independentes deste gate.

## 16. A estratégia da ADR 0006 foi validada?

**Sim, tecnicamente, para o mecanismo candidato.** A combinação recomendada é:

1. role runtime não-owner, `NOSUPERUSER` e `NOBYPASSRLS`;
2. `ENABLE` + `FORCE ROW LEVEL SECURITY` em tabelas tenant-owned;
3. policy `USING` + `WITH CHECK` baseada em configuração local segura;
4. `set_config('app.current_company_id', companyId, true)` dentro de toda
   transação tenant;
5. filters explícitos por empresa nos repositories;
6. roles, pools, contextos e repositories distintos para plataforma e tenant;
7. jobs globais iterando tenants com contexto explícito;
8. testes PostgreSQL adversariais e concorrentes como fitness functions.

A ADR 0006 já está `ACCEPTED`. Recomenda-se registrar esta mecânica como a forma
validada de implementação após revisão e aceite humano, preservando os riscos e
fitness functions acima. O spike não altera sozinho a decisão arquitetural.

## 17. A SPEC 002-A pode ser liberada quanto ao isolamento?

**Quanto exclusivamente ao gate técnico de isolamento, sim, após aceite humano
desta evidência.** Os critérios de RLS, contexto transacional, pool,
concorrência, IDOR, separação de planos e cleanup foram atendidos no PostgreSQL
14 local.

Isso **não libera automaticamente a SPEC 002-A**, não muda a SPEC 002 para
`PRONTA_PARA_IMPLEMENTAR` e não autoriza migrations definitivas. Permanecem as
demais decisões críticas da spec e a necessidade de autorização explícita.

## 18. Recomendação final

1. revisar e aceitar humanamente este relatório;
2. atualizar a ADR 0006 para registrar a mecânica validada, sem criar bypass;
3. encerrar `PEND-002-006` somente após esse aceite;
4. manter a SPEC 002 em `EM_ESPECIFICACAO` e a 002-A bloqueada por autorização e
   pelos demais gates;
5. quando a 002-A for autorizada, transformar os testes centrais em fitness
   functions do monorepo e repetir tudo no schema real PostgreSQL 14;
6. nunca usar SQLite como evidência de RLS ou concorrência.

## 19. Fontes técnicas

- [PostgreSQL 14 — Row Security Policies](https://www.postgresql.org/docs/14/ddl-rowsecurity.html)
- [PostgreSQL 14 — CREATE POLICY](https://www.postgresql.org/docs/14/sql-createpolicy.html)
- [PostgreSQL 14 — System Administration Functions](https://www.postgresql.org/docs/14/functions-admin.html)
- [PostgreSQL 14 — CREATE ROLE](https://www.postgresql.org/docs/14/sql-createrole.html)
- ADR 0004, ADR 0006 e o código/testes isolados deste spike.
