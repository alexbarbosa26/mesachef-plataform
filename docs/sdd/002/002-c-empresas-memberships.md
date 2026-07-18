# SPEC 002-C — Empresas e memberships

## Status

- **Estado:** `BLOQUEADA`
- **Atualização:** 2026-07-18
- **Implementação autorizada:** não
- **Bloqueio principal:** 002-B não concluída e regras cadastrais/seleção ainda
  não aprovadas.

## Contexto

Uma identidade pode pertencer a várias empresas por `Membership`. Após
autenticação, o servidor deve listar somente vínculos elegíveis e validar a
empresa ativa sem confiar no `companyId` do cliente. A 002-A cria a persistência
mínima; este incremento adiciona comportamento de domínio, seleção de tenant e
coerência da sessão. Gestão administrativa e atribuição de papéis ficam para
002-D/002-E.

## Objetivo

Entregar os ciclos de vida de `Company` e `Membership`, a enumeração segura das
empresas do usuário e a seleção/rotação da empresa ativa, mantendo isolamento
entre memberships e sem antecipar RBAC final.

## Dependências

- 002-B `CONCLUIDA`;
- tabelas, repositories, transações, contexts e RLS da 002-A validados;
- decisão sobre dados cadastrais mínimos de empresa;
- decisão sobre seleção automática quando houver uma única membership;
- decisão sobre último admin em empresa bloqueada, sem implementar RBAC ainda;
- autorização explícita para implementar 002-C.

## Entradas

- entidades persistíveis `Company` e `Membership` da 002-A;
- sessão opaca da 002-B;
- ADR 0006;
- invariantes e estados da SPEC 002 agregadora;
- contratos de erro e auditoria sanitizada.

## Escopo

- comportamento e transições de `Company`;
- comportamento e transições de `Membership`;
- vínculo muitos-para-muitos usuário–empresa;
- listagem das memberships selecionáveis do usuário autenticado;
- seleção e troca de empresa ativa validadas no servidor;
- rotação de sessão na mudança de empresa;
- invalidação do contexto por bloqueio de empresa ou membership;
- constraint composta entre sessão, usuário, empresa e membership;
- `TenantContext` construído somente após todas as validações;
- casos de uso internos de criação/transição para consumo futuro pela 002-E;
- testes concorrentes e de isolamento desses comportamentos.

## Fora de escopo

- login, senha, reset ou política de sessão já entregues na 002-B;
- definição de `admin`, `staff`, catálogo ou matriz de permissões;
- endpoints administrativos públicos de empresa/membership;
- atribuição de papéis;
- bootstrap ou administração de `superadmin`;
- frontend e tela de seleção;
- dados fiscais, endereço completo, plano, cobrança ou grupos econômicos;
- migração de empresas/memberships do legado;
- acesso de suporte ou impersonação.

## Modelo de domínio

### `Company`

- `CompanyId`;
- nome mínimo aprovado;
- status `ACTIVE` ou `BLOCKED`;
- `authorizationVersion` monotônica;
- timestamps e motivo/ator da transição administrativa.

### `Membership`

- `MembershipId`, `UserId` e `CompanyId` imutáveis;
- status `INVITED`, `ACTIVE`, `SUSPENDED` ou `REVOKED`;
- `authorizationVersion`;
- datas e metadados mínimos das transições.

### `ActiveCompanySelection`

Value object/resultado que associa a mesma sessão, usuário, membership e
empresa após validação. Ele produz `TenantContext`; um `companyId` isolado não
é contexto.

## Invariantes

1. Uma membership é única por `(userId, companyId)`.
2. Usuário/empresa da membership nunca mudam após criação.
3. Somente usuário, empresa e membership ativos produzem `TenantContext`.
4. Empresa bloqueada não é selecionável nem aceita operação tenant.
5. Membership suspensa/revogada não afeta memberships válidas em outras
   empresas.
6. Bloqueio global do usuário prevalece sobre todos os vínculos.
7. `activeCompanyId` e `activeMembershipId` são ambos nulos ou ambos coerentes.
8. A membership ativa da sessão pertence ao mesmo usuário e à mesma empresa.
9. Mudança de empresa rotaciona o token da sessão.
10. O frontend pode solicitar um ID, mas o servidor localiza e valida a
    membership antes de gravar a seleção.
11. Falha de seleção não altera silenciosamente a empresa ativa existente.
12. Recurso ou membership de outro tenant não tem existência revelada.
13. `superadmin` sem membership não ganha `TenantContext`.

## Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-002C-001 | O sistema deve permitir zero, uma ou várias memberships por usuário. |
| RF-002C-002 | O usuário deve listar somente suas memberships ativas em empresas ativas. |
| RF-002C-003 | Seleção deve validar sessão, usuário, empresa e membership no servidor. |
| RF-002C-004 | Seleção válida deve gravar IDs coerentes e rotacionar a sessão. |
| RF-002C-005 | Seleção inválida deve falhar sem revelar vínculo alheio. |
| RF-002C-006 | Suspensão/revogação deve invalidar somente contextos daquela membership. |
| RF-002C-007 | Bloqueio de empresa deve invalidar contextos daquela empresa e preservar outros. |
| RF-002C-008 | Transições inválidas de empresa/membership devem ser recusadas pelo domínio. |
| RF-002C-009 | Casos de uso internos devem registrar ator, motivo e correlation ID para futura auditoria. |
| RF-002C-010 | Alteração crítica deve incrementar versão ou revogar sessões afetadas. |

## Requisitos não funcionais

- mudanças de estado e sessão são transacionais;
- índices suportam lookup por usuário/status e empresa/status;
- invalidação não depende apenas de cache ou job eventual;
- paginação e ordenação são determinísticas;
- erros de outro tenant seguem a mesma semântica de inexistência;
- PostgreSQL 14 é obrigatório para constraints, concorrência e RLS;
- nenhuma consulta é liberada por contexto nulo, flag de admin ou fallback;
- logs/métricas não expõem motivo administrativo a ator não autorizado.

## Persistência

A 002-A já cria `tenancy.companies` e `tenancy.memberships`. A 002-C valida ou
evolui:

- constraints de status e timestamps coerentes;
- `UNIQUE (user_id, company_id)`;
- chave única composta que permita provar `(membership_id, user_id,
  company_id)`;
- índices por usuário/status e empresa/status;
- campos `active_company_id` e `active_membership_id` em `identity.sessions`;
- FK composta da sessão para a membership correspondente;
- `CHECK` que exige os dois campos ativos nulos ou preenchidos em conjunto;
- policies RLS e grants já definidos na 002-A para acessos tenant-owned.

## Segurança

- servidor deriva a lista de empresas da identidade da sessão;
- payload não pode fornecer `userId`, `membershipId`, papel ou permissão como
  autoridade;
- seleção revalida estados e versão de autorização;
- rotação impede fixation ao trocar tenant;
- contextos antigos são revogados/invalidados após bloqueio ou suspensão;
- queries usam tenant e ID; RLS continua habilitada e forçada;
- resposta para empresa/membership alheia não confirma existência;
- `PlatformContext` pode executar comando administrativo interno somente por
  porta separada, futuramente exposta pela 002-E;
- nenhuma seleção concede automaticamente papel ou permissão.

## Contratos

| Método e rota | Autorização | Resultado |
|---|---|---|
| `GET /api/v1/me/companies` | sessão | memberships/empresas selecionáveis do próprio usuário |
| `POST /api/v1/auth/select-company` | sessão + CSRF | sessão rotacionada com tenant validado |
| `GET /api/v1/auth/session` | sessão | passa a incluir empresas elegíveis e empresa ativa |
| `GET /api/v1/company` | sessão + tenant ativo | dados mínimos da empresa ativa; permissão final será integrada na 002-D |

Comandos de criar/bloquear empresa ou gerir membership permanecem portas
internas sem rota pública até 002-E. O contrato não aceita
`activeMembershipId`; ele é derivado pelo backend a partir de `companyId` e da
identidade da sessão.

## Migrations

1. evoluir campos/constraints de `companies` e `memberships`, se necessário;
2. adicionar chave candidata composta na membership;
3. adicionar campos nulos de tenant ativo à sessão;
4. backfill não se aplica a banco novo; base existente futura exige etapa
   explícita antes de validar FK;
5. adicionar `CHECK` e FK composta;
6. validar índices, policies e grants com a role real.

Não há migration de papel/permissão neste incremento.

## Testes obrigatórios

- transições válidas e inválidas de empresa/membership;
- usuário com zero, uma e múltiplas memberships;
- regra aprovada de seleção automática ou explícita;
- seleção própria ativa, suspensa, revogada, bloqueada e alheia;
- empresa bloqueada e usuário bloqueado;
- rotação da sessão e atomicidade em falha;
- FK composta recusa usuário/empresa/membership incoerentes;
- unicidade sob criação concorrente da mesma membership;
- A não lista/seleciona membership de B;
- suspensão em A preserva acesso válido em B;
- bloqueio de A não seleciona B silenciosamente;
- contexto antigo deixa de funcionar após alteração de versão;
- `superadmin` sem membership não entra em tenant;
- RLS, pool e repositories repetidos no schema definitivo PostgreSQL 14;
- migrations vazia/representativa, lint, typecheck, testes, build e secrets.

## Critérios de aceite

- [ ] cardinalidade muitos-para-muitos e constraints passam;
- [ ] empresa ativa é sempre determinada/validada pelo servidor;
- [ ] sessão armazena par coerente empresa/membership e rotaciona na troca;
- [ ] bloqueios e suspensões invalidam somente o escopo correto;
- [ ] nenhuma função RBAC final foi antecipada;
- [ ] isolamento e concorrência passam no PostgreSQL 14;
- [ ] contratos/evidências estão atualizados.

## Gate de saída

002-C só é concluída quando seleção, transições, constraints e isolamento forem
comprovados no PostgreSQL 14 e as decisões cadastrais estiverem encerradas. A
conclusão não habilita rotas administrativas nem inicia 002-D automaticamente.

## Rollback

- desabilitar seleção de tenant e revogar sessões com campos incoerentes;
- preservar empresas/memberships e corrigir schema por migration forward;
- nunca desabilitar RLS para restaurar disponibilidade;
- mudanças de estado são revertidas por novo comando auditável, não por edição
  direta de histórico;
- rollback de campos da sessão só é permitido após revogar todas as sessões que
  os utilizam.

## Pendências

- definir campos cadastrais mínimos de `Company`;
- decidir seleção automática com exatamente uma membership ativa;
- definir comportamento do último admin ao bloquear empresa;
- confirmar idempotência e semântica de convite, que será exposta na 002-E;
- decidir eventos/retenção de auditoria para troca e transições.
