# ADR 0006 — Isolamento multiempresa e RBAC

## Status

ACCEPTED

## Data

2026-07-18

## Registro da decisão humana

- **Decisor:** responsável do projeto, por instruções explícitas em 2026-07-18.
- **Decisão:** aceitar identidade global com associação muitos-para-muitos por `Membership`, empresa ativa determinada e validada no servidor, papéis globais separados dos empresariais e autorização com negação por padrão.
- **Superadmin:** não existe bypass implícito de tenant; qualquer acesso empresarial exige contexto e autorização explícitos.
- **Persistência:** SQLite pode apoiar desenvolvimento, mas não constitui evidência suficiente de isolamento multiempresa.
- **RLS:** a defesa em profundidade e sua mecânica concreta foram aceitas após o spike PostgreSQL 14 documentado em `docs/qa/spikes/spec-002-postgres-rls.md`.
- **Efeito:** o gate técnico de RLS foi encerrado. Esta ADR orienta implementações futuras, mas não autoriza criar policies, migrations, papéis de banco ou código nesta execução.

## Aceite humano pós-spike PostgreSQL RLS

As decisões abaixo substituem o caráter candidato da mecânica de RLS, sem
generalizar a evidência para produção ou para cenários não testados:

1. PostgreSQL RLS é defesa em profundidade e não substitui RBAC nem autorização da aplicação.
2. Toda tabela tenant-owned usa `ENABLE ROW LEVEL SECURITY` e `FORCE ROW LEVEL SECURITY`.
3. A role comum da aplicação é diferente do owner, `NOSUPERUSER` e `NOBYPASSRLS`.
4. O contexto da empresa é definido somente dentro de transação com operação equivalente a `set_config('app.current_company_id', companyId, true)`.
5. Contexto ausente ou inválido resulta em negação por padrão ou falha sanitizada.
6. Policies tenant-owned aplicam expressões equivalentes em `USING` e `WITH CHECK`.
7. Repositories também exigem `TenantContext` e filtram explicitamente por `company_id`.
8. `TenantContext` e `PlatformContext`, bem como pools e roles de tenant e plataforma, permanecem separados.
9. `superadmin` não possui bypass implícito de RLS no fluxo normal de tenant.
10. Operações globais iteram tenants explicitamente ou usam caminho de plataforma separado e auditado.
11. Contexto de tenant nunca é armazenado em variável global do processo.
12. O contexto local desaparece após `commit` ou `rollback` antes da conexão voltar ao pool.
13. A credencial da aplicação é um segredo de backend, pois sua role consegue definir um UUID de contexto por `set_config`; o servidor continua responsável por derivar e validar a empresa ativa.
14. RLS não substitui validação de usuário, empresa, membership, papel ou permissão.
15. O spike comprovou ausência de vazamento no pool e isolamento sob concorrência entre tenants no escopo executado.
16. Testes com a role real de runtime e PostgreSQL 14 são fitness functions obrigatórias da implementação definitiva.
17. Performance, PgBouncer, carga prolongada e failover não foram validados; ficam fora do escopo inicial e registrados como riscos futuros separados.

O aceite acima encerra apenas o gate técnico de isolamento. Não declara a SPEC
002-A pronta, não autoriza implementação e não resolve decisões de schema,
migrations, identidade ou operação ainda abertas.

## Contexto

O MesaChef é multiempresa. Uma pessoa pode colaborar com mais de uma empresa, mas cada operação empresarial deve ocorrer em um contexto explicitamente selecionado e validado pelo backend. O sistema também possui administração global por `superadmin`, sem que isso possa se tornar um bypass implícito para dados operacionais de clientes.

O projeto de referência associa o perfil a uma única empresa e mantém papéis globais em estrutura separada. Há diferenças observadas entre menus, rotas e políticas. Esse comportamento serve apenas como inventário; não define a autorização da nova plataforma.

Esta ADR define limites arquiteturais e o modelo conceitual. Não cria tabelas, policies, migrations, papéis de banco ou endpoints.

## Drivers priorizados

1. impedir acesso entre empresas mesmo diante de IDs conhecidos ou previsíveis;
2. manter autorização central, explícita, testável e com negação por padrão;
3. suportar uma pessoa em várias empresas sem duplicar identidade;
4. separar administração da plataforma de administração de uma empresa;
5. reduzir o impacto de erro de repository com defesa em profundidade no PostgreSQL;
6. manter o domínio independente de HTTP, ORM e mecanismos do banco.

## Alternativas avaliadas

### A. `companyId` enviado em cada requisição e filtrado ad hoc

**Vantagens**

- implementação inicial curta;
- contexto visível no payload ou path.

**Riscos e custos**

- confia em dado controlado pelo cliente;
- filtros podem ser esquecidos em queries;
- facilita IDOR e enumeração entre empresas;
- regras de superadmin tendem a se espalhar em condicionais;
- não há contrato uniforme para repositories.

Esta alternativa é rejeitada.

### B. Uma identidade por empresa

**Vantagens**

- cada registro de usuário possui um único tenant;
- consultas simples dentro de uma empresa.

**Riscos e custos**

- duplica credenciais, recuperação e perfil para a mesma pessoa;
- torna troca de empresa e revogação global inconsistentes;
- dificulta auditoria de uma identidade humana em várias empresas;
- conflita com o requisito de associação múltipla.

Esta alternativa é rejeitada.

### C. Identidade global, membership por empresa e contexto ativo na sessão

**Vantagens**

- uma credencial e uma identidade podem pertencer a várias empresas;
- ativação, suspensão e papéis são específicos da membership;
- empresa ativa é validada uma vez e revalidada no backend;
- permite separar papéis globais dos papéis empresariais;
- favorece chaves e constraints compostas com `company_id`.

**Riscos e custos**

- troca de empresa exige rotação/revalidação de sessão;
- casos de uso precisam declarar se são globais ou de tenant;
- repositories precisam de interfaces distintas para evitar bypass;
- regras de último administrador exigem transação e concorrência controlada.

Esta é a alternativa recomendada.

## Decisão

Adotar identidade global, vínculo `Membership` muitos-para-muitos entre usuário e empresa, RBAC empresarial extensível e contexto de empresa ativa mantido na sessão do servidor.

### Limites de autorização

Haverá dois planos explicitamente separados:

- **plano da plataforma**: administração global, executada com `PlatformContext` e permissões globais;
- **plano da empresa**: dados operacionais de uma empresa, executados com `TenantContext`.

Um caso de uso, endpoint ou repository pertence a um plano. Não existe contexto híbrido baseado em `companyId = null`, empresa sentinela ou booleano `isSuperadmin` capaz de desativar filtros.

### Identidade e membership

- `User` é global e possui e-mail normalizado único;
- `Company` representa o tenant e possui estado próprio;
- `Membership` liga um usuário a uma empresa e é única por `(user_id, company_id)`;
- um usuário pode possuir zero, uma ou várias memberships;
- `Membership.status` controla acesso somente à empresa vinculada;
- bloqueio global do usuário prevalece sobre qualquer membership;
- bloqueio da empresa prevalece sobre suas memberships;
- a seleção da empresa ativa aceita um identificador solicitado, mas o backend deriva e valida a membership correspondente antes de alterar a sessão.

### Empresa ativa

Após autenticação:

- nenhuma membership ativa: a sessão permanece autenticada sem contexto empresarial e exibe estado orientado ao suporte;
- exatamente uma membership ativa: o produto pode selecioná-la automaticamente, registrando a decisão e rotacionando a sessão;
- mais de uma membership ativa: o usuário escolhe entre empresas listadas pelo backend;
- mudança de empresa exige sessão válida, usuário ativo, empresa ativa e membership ativa;
- o backend grava `activeCompanyId` e `activeMembershipId` na sessão e rotaciona seu identificador;
- cada requisição empresarial revalida o estado mínimo ou uma versão de autorização capaz de invalidá-lo imediatamente.

O `companyId` presente em path, query ou payload identifica um recurso solicitado; nunca concede contexto nem substitui a empresa ativa validada.

### Papéis globais e empresariais

`superadmin` é uma atribuição global (`PlatformRoleAssignment`) e não um papel de membership. Ele pode administrar identidades, empresas e configurações globais apenas por casos de uso e endpoints do plano da plataforma.

Por padrão, `superadmin` **não recebe acesso automático aos dados operacionais de uma empresa**. Acesso de suporte, impersonação ou elevação temporária exigirá decisão específica, justificativa, escopo temporal e auditoria reforçada; não faz parte desta ADR.

`admin` e `staff` são papéis empresariais:

- `admin` recebe o conjunto administrativo aprovado para a empresa;
- `staff` recebe somente permissões explicitamente atribuídas pelo catálogo e pela matriz;
- nomes de papel não são testados em controllers ou componentes para decidir ações; casos de uso consultam permissões efetivas;
- o catálogo inicial e a matriz detalhada precisam ser aprovados antes da implementação do incremento 002-D.

### Modelo extensível de permissões

O modelo recomendado contém:

- `Permission`: código estável no formato `recurso.acao`, descrição e classificação;
- `Role`: papel empresarial, de sistema ou customizável conforme decisão de produto;
- `RolePermission`: conjunto de permissões concedidas pelo papel;
- `MembershipRole`: atribuição de um ou mais papéis a uma membership;
- `PlatformRoleAssignment`: papel global separado;
- `PermissionCatalog`: catálogo versionado em código e sincronizado por seed/migration determinística.

Regras:

- negação por padrão;
- composição inicialmente aditiva, sem `deny` explícito;
- nenhuma permissão é inferida apenas pelo nome de rota, menu ou papel;
- UI pode esconder ações, mas somente o backend autoriza;
- alteração de catálogo é revisada como mudança de contrato de segurança;
- ator não concede papel ou permissão que não possa delegar;
- autoconcessão e elevação indireta são proibidas;
- permissões efetivas são calculadas no contexto da membership ativa;
- cache, se houver, carrega versão de autorização e é invalidado em mudança de papel, membership, usuário ou empresa.

O schema pode suportar papéis customizados sem expor criação de papéis na primeira entrega. A liberação funcional dessa capacidade permanece decisão aberta.

### Contrato obrigatório dos repositories

Todo repository de entidade pertencente a cliente exige `TenantContext` não anulável criado pelo backend após autenticação e autorização. Esse contexto contém, no mínimo:

- `userId`;
- `companyId`;
- `membershipId`;
- correlation ID;
- permissões ou referência de autorização necessária ao caso de uso.

Regras arquiteturais:

- não expor métodos genéricos como `findById(id)` para entidade tenant-owned;
- usar operações como `findById(context, id)` e filtrar simultaneamente por `company_id` e `id`;
- inserts derivam `company_id` do contexto, nunca do DTO do cliente;
- updates e deletes incluem tenant na condição e interpretam zero linhas sem revelar outro tenant;
- relações tenant-owned carregam `company_id` e usam foreign keys compostas quando isso impede associação cruzada;
- listagens, contagens, agregações, exports, jobs e auditoria respeitam o mesmo limite;
- repositories globais são interfaces diferentes e só aceitam `PlatformContext`;
- nenhum parâmetro opcional desliga tenant scoping;
- transações propagam o mesmo contexto a todos os repositories participantes.

### Prevenção de IDOR e semântica de erro

- autorização verifica objeto e empresa em todas as operações, não apenas na listagem;
- IDs não sequenciais reduzem enumeração, mas não são controle de acesso;
- recurso inexistente e recurso de outra empresa retornam a mesma semântica externa, normalmente `404`;
- falta de permissão sobre recurso conhecido dentro do tenant retorna `403` somente quando isso não revela informação indevida;
- endpoints nunca aceitam `userId`, papel ou `companyId` do corpo como autoridade da sessão;
- testes negativos trocam IDs de empresa, membership, papel e recurso.

### PostgreSQL Row-Level Security como defesa em profundidade

Além dos filtros obrigatórios em repository, adotar RLS como defesa em
profundidade para toda tabela tenant-owned no PostgreSQL 14. A mecânica
definitiva, validada no spike, é:

- owner das tabelas sem login de runtime e role comum distinta, explicitamente `NOSUPERUSER` e `NOBYPASSRLS`;
- `ENABLE ROW LEVEL SECURITY` e `FORCE ROW LEVEL SECURITY` em cada tabela tenant-owned;
- policies de negação por padrão com predicados equivalentes em `USING` e `WITH CHECK`;
- leitura segura do contexto por `current_setting('app.current_company_id', true)`, tratando ausência como valor que não autoriza linha;
- configuração local por `set_config('app.current_company_id', companyId, true)` na mesma conexão e dentro de toda transação tenant, inclusive de leitura;
- encerramento da transação antes de devolver a conexão ao pool, fazendo o contexto desaparecer tanto em `commit` quanto em `rollback`;
- pool e role de tenant separados do pool e da role de plataforma;
- credenciais de owner/migration separadas e nunca usadas para tráfego da aplicação;
- jobs multiempresa iterando tenants com novo `TenantContext` por transação, ou usando repository global restrito e auditado;
- testes executados no PostgreSQL 14 com os mesmos atributos e grants da role comum da aplicação.

O wrapper transacional é a única porta para um executor tenant-owned. Não há
variável global do processo, `SET` de sessão, contexto opcional, sentinela ou
flag de bypass. Texto inválido no contexto falha de modo sanitizado; contexto
ausente não enxerga nem grava linhas.

RLS não substitui autorização de ação, membership, papel, permissão, filtros dos
repositories ou constraints. A credencial da role comum precisa permanecer
restrita ao backend confiável: quem a possuir consegue solicitar
`set_config` com outro UUID, embora a policy continue limitando o acesso ao UUID
informado. SQLite não suporta esta prova e não é gate de isolamento.

### Invariantes administrativas

- deve existir pelo menos um superadmin ativo após o bootstrap; remoção ou bloqueio do último é recusado de forma transacional;
- cada empresa ativa deve preservar ao menos um `admin` ativo enquanto estiver operacional;
- um ator não altera o próprio papel para elevar privilégios;
- bloqueio de usuário revoga todas as sessões;
- bloqueio de empresa invalida o contexto dessa empresa em todas as sessões e impede novas seleções;
- suspensão de membership invalida somente o acesso correspondente;
- mudanças críticas incrementam a versão de autorização ou revogam sessões afetadas.

### Auditoria

Devem gerar evento imutável e correlacionado, no mesmo limite transacional quando possível:

- login administrativo, falhas relevantes e logout global;
- bootstrap e mudanças de superadmin;
- criação, bloqueio e desbloqueio de usuário ou empresa;
- criação, suspensão e reativação de membership;
- atribuição ou remoção de papel/permissão;
- troca de empresa ativa quando necessária para investigação;
- tentativa negada de elevação de privilégio e ações de suporte futuras.

O evento contém ator, plano, empresa quando aplicável, ação, alvo, resultado, correlation ID, instante e metadados minimizados. Não contém senha, token, hash de senha, segredo ou payload integral sensível.

## Consequências positivas

- uma identidade pode trabalhar em várias empresas sem compartilhar dados;
- autorização empresarial e global deixam de ser condicionais dispersas;
- repositories, constraints e RLS formam camadas independentes de proteção;
- mudanças de papel ou bloqueio podem invalidar acesso imediatamente;
- regras são testáveis por matriz de ação e tenant.

## Consequências negativas

- schema e queries carregam `company_id` de forma deliberadamente redundante;
- transações e pool exigem disciplina para RLS;
- RBAC extensível aumenta o número de tabelas e cenários de concorrência;
- regras de último administrador/superadmin demandam locks e testes;
- operações legítimas de suporte global precisam de fluxo futuro específico.

## Compliance e fitness functions

- falhar limites arquiteturais se um repository tenant-owned não exigir `TenantContext`;
- falhar revisão se domínio importar query builder, driver, Fastify ou cookie;
- testar cada ação permitida e negada da matriz para `admin`, `staff` e `superadmin`;
- executar testes de troca de IDs entre duas empresas no PostgreSQL 14;
- inspecionar no catálogo que toda tabela tenant-owned possui RLS habilitada e forçada;
- inspecionar que a role comum não é owner, superuser nem possui `BYPASSRLS`;
- testar `USING` e `WITH CHECK` com role real da aplicação e contexto ausente, inválido, próprio e alheio;
- testar que o contexto existe somente dentro da transação e desaparece após `commit` e `rollback` na mesma conexão física;
- testar reuso sequencial e concorrente do pool entre ao menos dois tenants sem vazamento;
- comprovar filtros explícitos de repository independentemente da RLS;
- impedir por limite arquitetural qualquer variável global de processo para tenant;
- testar que a role/pool de plataforma não possui grant nos dados tenant-owned;
- testar job global por iteração explícita e ausência de contexto residual;
- testar concorrência ao remover último admin ou último superadmin;
- buscar métodos ou queries com bypass opcional de tenant;
- testar que respostas não revelam existência de recurso de outro tenant;
- testar que alteração de autorização invalida cache e sessão conforme definido.

## Condições antes da implementação

- preservar associação muitos-para-muitos por `Membership`, empresa ativa validada no servidor e separação entre `superadmin` e papéis de membership;
- preservar negação por padrão e ausência de acesso operacional implícito para `superadmin`;
- aprovar matriz inicial de permissões e capacidade, ou não, de papéis customizados;
- implementar a mecânica RLS aceita somente em incremento autorizado e repetir as fitness functions no schema definitivo;
- definir comportamento quando a empresa perde o último admin;
- definir retenção e acesso aos eventos de auditoria;
- realizar threat model de IDOR, elevação, confused deputy e contexto de tenant.

## Quando revisar

- necessidade aprovada de suporte/impersonação entre tenants;
- introdução de hierarquia entre empresas ou grupos econômicos;
- autorização baseada em atributos além de RBAC;
- particionamento físico, banco por tenant ou serviço separado;
- custo medido de RLS incompatível com requisitos reais;
- exigência regulatória de residência ou segregação física dos dados.

## Fontes técnicas consultadas

- [PostgreSQL 14 — Row Security Policies](https://www.postgresql.org/docs/14/ddl-rowsecurity.html)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [OWASP Insecure Direct Object Reference Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html)
- [OWASP Multi-Tenant Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html)
- [OWASP Authorization Testing Automation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Testing_Automation_Cheat_Sheet.html)

## Questões abertas

- A seleção será automática quando houver exatamente uma membership ativa ou sempre explícita?
- Será criado futuramente um fluxo explícito de suporte temporário para `superadmin`? Em caso afirmativo, exigirá ADR própria e não poderá reutilizar bypass implícito.
- Papéis customizados serão expostos na SPEC 002 ou apenas suportados pelo modelo?
- Qual é a matriz exata de permissões de `admin` e `staff` neste incremento?
- Qual retenção, acesso e exportação serão exigidos para auditoria?
- Qual limite aceitável de overhead da RLS será adotado após medição no schema e carga definitivos?
- Quais modos de PgBouncer serão suportados e quais testes de contexto transacional serão exigidos?
- Qual runbook garantirá falha fechada e recuperação segura durante failover do PostgreSQL?
