# SPEC 002 — Plano executável dos incrementos

## Status

- **Iniciativa agregadora:** SPEC 002 — `EM_ESPECIFICACAO`
- **Atualização:** 2026-07-18
- **Implementação nesta revisão:** não; promoção documental somente
- **Avanço automático:** não
- **Próxima spec principal:** SPEC 003 — `BLOQUEADA`

Este diretório decompõe a SPEC 002 em incrementos pequenos, ordenados e
verificáveis. O documento
`../002-identity-access-multiempresa.md` permanece a fonte agregadora para o
contexto, a linguagem ubíqua e os critérios da iniciativa. Em caso de conflito,
prevalecem `AGENTS.md`, `EXECUTAR.md`, a SPEC principal e as ADRs aceitas, nessa
ordem.

## Incrementos e estados

| Incremento | Documento | Estado atual | Dependência de execução |
|---|---|---|---|
| 002-A | `002-a-persistencia-migrations.md` | `PRONTA_PARA_IMPLEMENTAR` | execução ativa em modo `implementation`; nenhum código nesta revisão |
| 002-B | `002-b-autenticacao-sessoes.md` | `BLOQUEADA` | 002-A concluída e decisões de autenticação aprovadas |
| 002-C | `002-c-empresas-memberships.md` | `BLOQUEADA` | 002-B concluída e regras cadastrais aprovadas |
| 002-D | `002-d-rbac-permissoes.md` | `BLOQUEADA` | 002-C concluída e matriz RBAC aprovada |
| 002-E | `002-e-administracao-auditoria.md` | `BLOQUEADA` | 002-D concluída e gates de bootstrap/auditoria aprovados |
| 002-F | `002-f-frontend-login-tenant.md` | `BLOQUEADA` | contratos B–E estáveis e validados |
| 002-G | `002-g-hardening-seguranca.md` | `BLOQUEADA` | 002-A–F implementadas e em validação |

## Fluxo de dependência

```text
002-A -> 002-B -> 002-C -> 002-D -> 002-E
                                   |       |
                                   +------>002-F -> 002-G
```

O diagrama expressa ordem mínima, não autorização. Cada incremento exige uma
execução específica, atualização prévia de seu estado e confirmação de que os
gates de entrada foram atendidos.

## Avaliação de prontidão da 002-A

Os spikes encerraram os gates técnicos de Kysely/RLS. As decisões humanas
posteriores encerraram também os gates de e-mail e governança do schema:

1. `email_original`/`email_normalized` com normalização central e unicidade;
2. checksum SHA-256 sobre canonicalização UTF-8 `v1`, com metadados completos;
3. mapeamentos exatos de dinheiro, UUID, timestamp e JSON;
4. migrations como fonte de verdade e `db:verify` fail-closed para catálogo
   PostgreSQL.

`PEND-002-008` e `PEND-002-009` estão encerradas. Não existe outra decisão
crítica de persistência/isolamento para o escopo inicial, portanto a 002-A está
`PRONTA_PARA_IMPLEMENTAR`. `PEND-002-010` permanece aberta para performance
RLS, PgBouncer e failover, sem bloquear a implementação inicial. A promoção não
representa código ou migration executados nesta revisão.

## Rastreabilidade arquitetural

| Tema | Decisão/evidência |
|---|---|
| persistência | ADR 0004 e spike `spec-002-kysely-persistence.md` |
| sessão e tokens | ADR 0005 |
| tenancy, RBAC e RLS | ADR 0006 e spike `spec-002-postgres-rls.md` |
| banco oficial | ADR 0002 — PostgreSQL 14; SQLite apenas auxiliar |
| arquitetura | ADR 0001 — monólito modular; ADR 0003 — API própria |

## Regras comuns de execução

- domínio não importa Kysely, driver, Fastify, cookie ou tipos de tabela;
- backend deriva e valida identidade, empresa ativa e autorização;
- autorização e isolamento negam por padrão;
- `TenantContext` e `PlatformContext` nunca são intercambiáveis;
- migrations aplicadas são imutáveis e executadas fora do startup da API;
- PostgreSQL 14 é obrigatório para evidência final de persistência,
  concorrência e isolamento;
- SQLite não comprova RLS nem equivalência operacional;
- nenhum incremento avança a SPEC 003 automaticamente;
- produção, migração do legado e commit exigem autorizações próprias.

## Definition of Ready por incremento

Um incremento só pode mudar para `PRONTA_PARA_IMPLEMENTAR` quando:

- dependências anteriores estiverem concluídas;
- decisões críticas de seu campo estiverem registradas na SPEC/ADR;
- escopo, fora de escopo, contratos e migrations conceituais estiverem
  consistentes;
- testes e gate de saída forem executáveis e verificáveis;
- não houver bloqueio crítico em `docs/qa/pendencias.md`;
- o responsável aprovar explicitamente a prontidão documental.

O estado `PRONTA_PARA_IMPLEMENTAR` não autoriza código por si só. O início da
execução ainda exige uma instrução explícita em modo `implementation` para o
incremento ativo.

## Definition of Done por incremento

Além dos critérios próprios, todo incremento implementado deve apresentar
lint, limites arquiteturais, typecheck, testes, build, auditoria de secrets e
documentação aprovados. Persistência e isolamento exigem PostgreSQL 14. O estado
somente muda após as evidências serem registradas; conclusão não autoriza o
incremento seguinte.
