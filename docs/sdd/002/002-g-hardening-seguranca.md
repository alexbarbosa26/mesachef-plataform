# SPEC 002-G — Hardening e testes de segurança

## Status

- **Estado:** `BLOQUEADA`
- **Atualização:** 2026-07-18
- **Implementação autorizada:** não
- **Bloqueio principal:** 002-A–F ainda não implementadas e threat model final
  depende do sistema integrado.

## Contexto

As barreiras de autenticação, autorização e tenancy só podem encerrar a SPEC
002 depois de testadas em conjunto e sob caminhos adversariais. Este incremento
consolida hardening, fitness functions e evidências no PostgreSQL 14. Ele não
transforma o spike RLS em prova de produção e não substitui revisão contínua.

## Objetivo

Validar integralmente a superfície da SPEC 002 contra enumeração, força bruta,
roubo/CSRF de sessão, IDOR, elevação de privilégio, vazamento entre tenants,
secrets e configurações inseguras antes de tornar a iniciativa candidata à
conclusão.

## Dependências

- 002-A–F implementadas e em `EM_VALIDACAO` ou concluídas;
- threat model atualizado com os contratos reais;
- matriz RBAC e política de rate limiting aprovadas;
- ambiente PostgreSQL 14 local/pré-produção autorizado e isolado;
- runbooks de incidente/rollback e critérios de risco aprovados;
- autorização explícita para executar 002-G.

## Entradas

- código, migrations e evidências de 002-A–F;
- ADRs 0004–0006;
- relatório dos spikes Kysely/RLS;
- inventário de endpoints, roles, grants e dados sensíveis;
- checklist Secure by Design e autenticação/autorização;
- baseline de dependências e secrets da fundação.

## Escopo

- threat model final de identidade, sessão, tenancy, RBAC, administração e UI;
- revisão de limites arquiteturais e defaults seguros;
- calibração/testes de rate limiting e força bruta;
- hardening de CORS, CSRF, cookies e headers;
- testes adversariais de IDOR e elevação;
- repetição completa das fitness functions de RLS no schema definitivo;
- revisão de roles, ownership, grants e pools;
- concorrência de tenant, último admin/superadmin e idempotência;
- auditoria de logs, eventos, erros, bundle, configuração e secrets;
- auditoria de dependências e tratamento de vulnerabilidades;
- validação de migrations em banco vazio e base representativa;
- regressão funcional e de acessibilidade dos fluxos críticos;
- evidências e recomendação formal de aceite/risco residual.

## Fora de escopo

- pentest em produção ou tráfego real;
- deploy, credenciais ou banco de produção;
- benchmark/carga de capacidade produtiva;
- homologação de PgBouncer;
- failover/HA do PostgreSQL;
- módulos de negócio posteriores;
- impersonação/suporte cross-tenant;
- correções fora da SPEC sem nova autorização;
- afirmar conformidade regulatória sem avaliação própria.

Performance de RLS, PgBouncer e failover permanecem riscos futuros separados.
Se passarem a gate de pré-produção, exigem execução e critérios próprios; não
podem ser presumidos por este hardening inicial.

## Modelo de domínio

Este incremento não cria novos agregados. Ele valida:

- `SecurityContext` discriminado em `TenantContext` ou `PlatformContext`;
- `AuthorizationDecision` com negação por padrão;
- `SecurityEvent` sanitizado e rastreável;
- `RiskFinding`: evidência, impacto, probabilidade, owner, prazo e decisão;
- `TestIdentity`/`TestTenant`: fixtures locais efêmeras, sem credenciais reais.

## Invariantes

1. Nenhuma requisição tenant executa sem contexto validado e transação RLS.
2. Nenhum contexto ou cache de A é observado por B.
3. Nenhuma role de runtime é owner, superuser ou possui `BYPASSRLS`.
4. RLS, repository e autorização permanecem barreiras independentes.
5. `superadmin` não possui bypass tenant implícito.
6. Mudança crítica revoga/invalida acesso obsoleto antes do sucesso externo.
7. Falha de dependência ou configuração sensível nega por padrão.
8. Erros não revelam conta, tenant, SQL, stack, connection string ou secret.
9. Senhas, tokens e secrets não aparecem em logs, auditoria, bundle ou Git.
10. Teste de segurança usa role/configuração representativa, não superuser.
11. Achado crítico aberto impede conclusão da SPEC 002.
12. Risco não testado é registrado como pendência, nunca marcado como aprovado.

## Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-002G-001 | A suíte deve executar matriz completa de acesso permitido/negado por papel e plano. |
| RF-002G-002 | A suíte deve tentar IDOR em leitura, escrita, relação, listagem e agregação. |
| RF-002G-003 | A suíte deve comprovar negação RLS com contexto ausente, inválido e alheio. |
| RF-002G-004 | A suíte deve comprovar limpeza de contexto após commit/rollback e sob concorrência. |
| RF-002G-005 | A suíte deve validar rotação/revogação de sessão e proteção CSRF. |
| RF-002G-006 | A suíte deve validar enumeração e throttling em login/reset/reauth. |
| RF-002G-007 | A revisão deve inventariar grants, secrets e dependências com resultado rastreável. |
| RF-002G-008 | Achados devem ser classificados e impedir aceite conforme severidade aprovada. |
| RF-002G-009 | Evidências devem registrar ambiente/comandos sem valores sensíveis. |

## Requisitos não funcionais

- testes F.I.R.S.T., isolados, repetíveis e autocontidos;
- fixtures usam bancos locais descartáveis e cleanup verificável;
- concorrência evita asserts dependentes de timing frágil;
- varreduras têm versão/configuração registrada;
- logs de teste redigem connection strings e credenciais;
- falsos positivos são justificados, não ignorados silenciosamente;
- findings incluem prioridade por impacto e probabilidade;
- PostgreSQL 14 é obrigatório para todo gate de isolamento;
- evidência SQLite nunca substitui PostgreSQL.

## Persistência

- usar schema definitivo e dataset representativo anonimizado/sintético;
- verificar catálogo de constraints, índices, RLS, policies, owners e grants;
- executar migrations do zero, upgrade e validação de checksum;
- qualquer correção necessária usa nova migration dentro da sub-spec de origem;
- fixtures e dados de teste são locais, identificáveis e removidos ao final;
- auditoria de segurança usa eventos sintéticos sem PII real.

## Segurança

Threats mínimos:

- enumeração de conta e tenant;
- credential stuffing, força bruta e DoS por lockout;
- session fixation, roubo, CSRF e sessão obsoleta;
- IDOR, mass assignment e confused deputy;
- cross-tenant por repository, relação, RLS, pool, cache e job;
- autoconcessão, delegação excessiva e corrida de último administrador;
- abuso de `PlatformContext`/superadmin;
- SQL injection, XSS/reflected errors e log injection;
- exposição de token/reset/connection string/secrets;
- configuração insegura de CORS, cookie, proxy e rate limit.

Cada controle deve apontar para prevenção, detecção, teste e rollback. WAF ou
infraestrutura externa não são evidência suficiente de segurança do design.

## Contratos

Não são criados endpoints de negócio. Podem existir apenas:

- comandos internos de teste/diagnóstico restritos a ambiente não produtivo e
  ausentes do bundle/runtime de produção;
- métricas e logs já aprovados, sem labels/dados sensíveis;
- runbooks documentais de resposta e revogação.

Todos os contratos HTTP de 002-B–F são revalidados; mudanças incompatíveis
retornam à sub-spec proprietária.

## Migrations

Não há migration própria obrigatória. Se o hardening revelar índice,
constraint, policy ou grant incorreto:

1. registrar finding e owner;
2. alterar a sub-spec responsável;
3. criar nova migration versionada e checksum;
4. repetir toda a suíte pertinente;
5. nunca editar migration aplicada ou corrigir produção diretamente.

## Testes obrigatórios

### Autenticação e sessão

- matriz de login/reset sem enumeração;
- força bruta/rate limiting por conta e origem;
- cookie, CSRF, CORS e headers;
- fixation, rotação, expiração, revogação e sessões concorrentes;
- bloqueio/reset invalidando acesso imediatamente.

### Autorização e elevação

- matriz completa `staff`, `admin`, `superadmin`;
- URL direta, payload extra, mass assignment e parâmetro duplicado;
- autoconcessão e delegação acima da capacidade;
- último admin/superadmin sob concorrência;
- cache/versão antiga após revogação;
- plano plataforma tentando repository tenant.

### Isolamento PostgreSQL 14

- catálogo confirma owner, `NOSUPERUSER`, `NOBYPASSRLS`, `ENABLE` e `FORCE`;
- `USING` e `WITH CHECK` em CRUD completo;
- contexto ausente, inválido, A, B e troca maliciosa;
- commit, rollback, pool `max=1`, reuso alternado e concorrência;
- filters de repository testados independentemente de RLS;
- FKs/uniques compostas e mensagens sanitizadas;
- jobs globais por iteração e sem resíduo.

### Qualidade operacional

- migrations vazia/representativa/checksum/drift;
- lint, limites arquiteturais, typecheck, unitários, integração, E2E e build;
- auditoria de secrets, bundle, logs e eventos;
- auditoria de dependências e licenças conforme política;
- acessibilidade e regressão dos fluxos web;
- cleanup de fixtures/roles/schemas locais.

## Critérios de aceite

- [ ] threat model cobre ativos, fronteiras, atores e ameaças reais;
- [ ] todos os testes obrigatórios passam no ambiente correto;
- [ ] nenhum finding crítico/alto bloqueador permanece sem decisão formal;
- [ ] RLS/pool/repositories provam isolamento no schema definitivo;
- [ ] sessão, RBAC e auditoria provam revogação/rastreabilidade;
- [ ] secrets/dependências/configurações passam;
- [ ] migrations e build do monorepo passam;
- [ ] riscos de performance/PgBouncer/failover permanecem explicitamente
  separados, sem falso aceite;
- [ ] evidências permitem recomendar ou recusar conclusão da SPEC 002.

## Gate de saída

002-G só é concluída quando todos os critérios forem evidenciados e os riscos
residuais forem aceitos pelo responsável. Somente depois a SPEC 002 pode ser
candidata a `CONCLUIDA`; a mudança de estado e a liberação da SPEC 003 exigem
instrução humana separada.

## Rollback

- suspender o fluxo afetado e revogar sessões/credenciais técnicas quando
  necessário;
- restaurar configuração/policy previamente testada sem desabilitar isolamento;
- corrigir schema por nova migration;
- preservar evidências e auditoria do finding;
- se o controle não puder falhar fechado, bloquear o tráfego correspondente;
- nenhum rollback de produção está autorizado nesta spec.

## Pendências

- critérios de severidade/aceite de risco;
- baseline de scanners e política de dependências;
- dataset representativo e anonimização;
- capacidade/rate limits após medição;
- performance e planos de consulta com RLS;
- compatibilidade e modo de pool do PgBouncer;
- failover/HA e runbook de contexto após reconexão;
- pentest e pré-produção, em execução futura autorizada.
