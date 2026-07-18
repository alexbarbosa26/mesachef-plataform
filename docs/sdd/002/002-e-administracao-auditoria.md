# SPEC 002-E — Administração e auditoria

## Status

- **Estado:** `BLOQUEADA`
- **Atualização:** 2026-07-18
- **Implementação autorizada:** não
- **Bloqueio principal:** 002-D não concluída; MFA/bootstrap e governança de
  auditoria ainda abertos.

## Contexto

Após identidade, tenancy e RBAC, a plataforma precisa expor operações
administrativas globais e empresariais sem criar um bypass universal. Ações
críticas devem ser rastreáveis e o primeiro `superadmin` precisa nascer por
processo único, fora de endpoint público e sem credencial fixa.

## Objetivo

Entregar casos de uso administrativos com privilégio mínimo, bootstrap seguro,
bloqueios e auditoria imutável/sanitizada nos planos tenant e plataforma.

## Dependências

- 002-D `CONCLUIDA`;
- matriz RBAC e endpoints administrativos aprovados;
- MFA ou controle compensatório de `superadmin` aprovado;
- canal de ativação/bootstrap fora de banda definido;
- política de retenção, acesso, exportação e privacidade da auditoria aprovada;
- eventos obrigatórios e reautenticação recente aprovados;
- autorização explícita para implementar 002-E.

## Entradas

- autenticação/sessão da 002-B;
- empresas/memberships da 002-C;
- papéis/permissões da 002-D;
- `TenantContext` e `PlatformContext` separados;
- ADRs 0005 e 0006;
- eventos mínimos da SPEC 002 agregadora.

## Escopo

- bootstrap único do primeiro `superadmin` por comando interno;
- administração global de empresas, usuários e atribuições de plataforma;
- administração empresarial de memberships dentro da matriz aprovada;
- bloqueio/desbloqueio de usuário e empresa;
- convite, suspensão, reativação e revogação de membership;
- proteção do último admin e último superadmin;
- reautenticação/MFA nas operações aprovadas;
- produção e persistência de `AuditEvent` imutável;
- consulta paginada de auditoria por plano e escopo;
- sanitização e allowlist de metadados;
- idempotência e concorrência de comandos críticos;
- observabilidade de resultados e acessos negados relevantes.

## Fora de escopo

- impersonação ou “entrar como cliente”;
- bypass implícito de tenant por superadmin;
- suporte temporário cross-tenant;
- gestão de módulos de negócio;
- exclusão física/anonimização ampla;
- SIEM, data lake ou exportação não aprovada;
- migração de auditoria/usuários do legado;
- frontend administrativo completo;
- segredo de bootstrap persistido no banco ou Git.

## Modelo de domínio

- `PlatformAdministrator`: identidade com `PlatformRoleAssignment` ativa e
  contexto global validado;
- `BootstrapAttempt`: comando único com precondições e resultado auditável, não
  uma entidade com secret persistido;
- `AdministrativeCommand`: ator, plano, alvo, motivo, idempotency key e
  correlation ID;
- `AuditEvent`: ator humano/técnico, escopo `PLATFORM` ou `COMPANY`, empresa
  condicional, ação, alvo, resultado, instante e metadados allowlisted;
- `AuditMetadata`: value object sanitizado, limitado em tamanho e sem secrets;
- eventos de mudança de `User`, `Company`, `Membership` e papéis definidos nos
  incrementos anteriores.

## Invariantes

1. Não existe endpoint público, usuário padrão ou senha fixa de bootstrap.
2. Bootstrap recusa execução se já existir `superadmin` ativo e é seguro sob
   concorrência.
3. Material de bootstrap vem de canal externo, é de uso único e é revogado.
4. Após bootstrap, sempre existe ao menos um `superadmin` ativo.
5. Empresa operacional preserva ao menos um `admin` ativo.
6. `PlatformContext` não acessa dados operacionais tenant-owned.
7. Operação empresarial usa `TenantContext` da empresa ativa e permissão
   efetiva.
8. Bloqueio de usuário revoga sessões e resets pendentes atomicamente.
9. Bloqueio de empresa invalida apenas seus contextos empresariais.
10. Comando crítico exige motivo, reautenticação/MFA quando aprovado e
    idempotência quando repetível.
11. Sucesso ou falha relevante gera evento correlacionado no mesmo limite
    transacional quando possível.
12. Evento de auditoria é append-only e não contém senha, token, hash de senha,
    secret ou payload integral sensível.
13. Consulta de auditoria respeita plano, tenant, permissão e retenção.

## Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-002E-001 | Comando interno deve criar o primeiro superadmin uma única vez e sem endpoint público. |
| RF-002E-002 | Superadmin autorizado deve gerir empresas e identidades por endpoints de plataforma. |
| RF-002E-003 | Alteração de papel global deve preservar o último superadmin e revogar acesso obsoleto. |
| RF-002E-004 | Admin autorizado deve gerir memberships somente da empresa ativa e dentro da delegação. |
| RF-002E-005 | Bloqueios devem exigir motivo e invalidar sessões/contextos correspondentes. |
| RF-002E-006 | Comandos repetíveis devem aplicar chave de idempotência e detectar payload conflitante. |
| RF-002E-007 | Toda ação crítica deve produzir auditoria sanitizada com resultado e correlation ID. |
| RF-002E-008 | Consulta global deve retornar somente eventos `PLATFORM` autorizados. |
| RF-002E-009 | Consulta empresarial deve retornar somente eventos da empresa ativa. |
| RF-002E-010 | Tentativa de elevação/cross-tenant deve negar e gerar evento proporcional. |

## Requisitos não funcionais

- comandos críticos são transacionais e concorrente-seguros;
- auditoria é append-only, paginada e indexada pelos padrões aprovados;
- falha de auditoria transacional impede confirmação da ação quando o evento for
  obrigatório para rastreabilidade;
- metadados têm schema/versionamento e limite de tamanho;
- timestamps UTC e correlation ID obrigatório;
- secrets/PII são minimizados em logs, métricas e auditoria;
- retenção e cleanup preservam integridade/requisitos legais aprovados;
- endpoints globais e empresariais ficam em namespaces distintos;
- operação administrativa possui alertas e runbooks proporcionais.

## Persistência

- `audit.events`: ID, escopo, empresa condicional, ator, ação, alvo, resultado,
  correlation ID, timestamp, versão e metadados sanitizados;
- `CHECK` exige `company_id` apenas quando escopo é `COMPANY`;
- índices por instante/ID, empresa+instante, ator+instante e ação conforme
  consultas aprovadas;
- grants de insert separados de grants de leitura; update/delete não concedidos
  à role comum;
- RLS em eventos empresariais com `USING`/`WITH CHECK`; eventos globais por
  repository/role de plataforma;
- idempotency records, se adotados, armazenam hash do comando e resultado
  mínimo, nunca segredo;
- nenhum secret de bootstrap é persistido.

## Segurança

- bootstrap desabilitado por padrão, com secret efêmero fora do Git e lock
  transacional;
- MFA obrigatório ou controle compensatório aprovado antes de ação global;
- reautenticação recente em atribuição de superadmin, bloqueios e operações
  equivalentes;
- endpoints `/platform` exigem `PlatformContext` e permissão global;
- endpoints `/company` exigem `TenantContext` e permissão empresarial;
- superadmin não troca `companyId` para acessar repository tenant;
- payloads usam allowlist, limites e schemas estritos;
- erros de ID alheio não revelam existência;
- auditoria evita log injection e serialização arbitrária de objetos;
- alteração de papel/situação revoga sessões/caches antes de responder sucesso.

## Contratos

### Plataforma

| Método e rota | Permissão global | Finalidade |
|---|---|---|
| `GET/POST /api/v1/platform/companies` | `platform.company.read/create` | listar/criar empresa |
| `GET/PATCH /api/v1/platform/companies/{id}` | `platform.company.read/update` | consultar/alterar empresa |
| `POST /api/v1/platform/companies/{id}/block` | `platform.company.block` | bloquear com motivo |
| `POST /api/v1/platform/users/{id}/block` | `platform.user.block` | bloquear usuário e revogar sessões |
| `PUT /api/v1/platform/users/{id}/platform-roles` | `platform.role.assign` | alterar papéis globais |
| `GET /api/v1/platform/audit-events` | `platform.audit.read` | consultar auditoria global |

### Empresa ativa

| Método e rota | Permissão | Finalidade |
|---|---|---|
| `POST /api/v1/company/memberships` | `membership.invite` | convidar/vincular usuário |
| `POST /api/v1/company/memberships/{id}/suspend` | `membership.suspend` | suspender com motivo |
| `POST /api/v1/company/memberships/{id}/reactivate` | `membership.reactivate` | reativar vínculo elegível |
| `DELETE /api/v1/company/memberships/{id}` | `membership.revoke` | revogar sem exclusão física |
| `GET /api/v1/company/audit-events` | `audit.read` | consultar auditoria do tenant |

Comandos críticos usam CSRF, reautenticação/MFA quando definido, idempotency key
e envelope de erro comum. Respostas não retornam motivo interno ou metadados não
allowlisted.

## Migrations

1. criar `audit.events`, constraints, índices e partição somente se justificada;
2. habilitar/forçar RLS para eventos empresariais e criar policies;
3. conceder insert mínimo e leituras separadas por plano;
4. criar estrutura de idempotência somente se o contrato aprovado exigir
   persistência;
5. nunca inserir conta/credencial/secret de bootstrap;
6. correções seguem nova migration e checksum da 002-A.

## Testes obrigatórios

- bootstrap sem flag/secret, válido, repetido e duas execuções concorrentes;
- nenhum secret aparece em stdout, logs, erro, snapshot ou auditoria;
- último superadmin/admin sob duas transações concorrentes;
- MFA/reautenticação ausente, inválida, expirada e válida;
- superadmin tenta acesso tenant sem membership/contexto;
- admin de A tenta gerir B e trocar IDs/payload;
- convite/idempotência repetida com mesmo e diferente payload;
- bloqueio de usuário revoga sessões/resets atomicamente;
- bloqueio de empresa preserva memberships de outras empresas;
- eventos obrigatórios em sucesso/negação/falha;
- allowlist, tamanho, log injection e ausência de credenciais na auditoria;
- consulta global/tenant, paginação, retenção e RLS;
- migrations/concorrência no PostgreSQL 14;
- lint, limites, typecheck, testes, build, dependências e secrets.

## Critérios de aceite

- [ ] bootstrap é único, externo, concorrente-seguro e sem credencial fixa;
- [ ] operações globais/tenant usam contextos, roles e endpoints separados;
- [ ] último admin/superadmin e revogações passam sob concorrência;
- [ ] todos os eventos aprovados são auditados sem secrets;
- [ ] leitura/retensão de auditoria atende a política humana;
- [ ] nenhuma impersonação ou bypass foi criado;
- [ ] migrations, RLS e testes passam no PostgreSQL 14;
- [ ] documentação/runbooks/evidências estão completos.

## Gate de saída

002-E exige aceite operacional de MFA/bootstrap e auditoria, além de evidência
de concorrência e isolamento. A conclusão estabiliza os contratos consumidos
pela UI, mas não inicia a 002-F automaticamente.

## Rollback

- desabilitar endpoints/CLI afetados e revogar sessões administrativas;
- preservar eventos de auditoria e dados de identidade/tenancy;
- corrigir schema por migration forward;
- em falha de bootstrap, bloquear autenticação administrativa e usar runbook,
  nunca criar conta padrão;
- em falha de auditoria obrigatória, negar a mutação crítica até restaurar a
  rastreabilidade;
- reverter estado administrativo por novo comando auditável.

## Pendências

- tecnologia e obrigatoriedade de MFA para `superadmin`;
- canal de ativação e custódia do material de bootstrap;
- retenção, exportação, acesso e privacidade da auditoria;
- matriz de eventos que exige atomicidade estrita;
- dados cadastrais/editáveis por superadmin;
- semântica final de convite e idempotência;
- política de exclusão/anonimização futura.
