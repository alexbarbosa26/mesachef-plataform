# ADR 0006 — Isolamento multiempresa e RBAC

## Status

ACCEPTED

## Data

2026-07-18

## Registro da decisão humana

- **Decisor:** responsável do projeto, por instrução explícita desta execução.
- **Decisão:** aceitar identidade global com associação muitos-para-muitos por `Membership`, empresa ativa determinada e validada no servidor, papéis globais separados dos empresariais e autorização com negação por padrão.
- **Superadmin:** não existe bypass implícito de tenant; qualquer acesso empresarial exige contexto e autorização explícitos.
- **Persistência:** SQLite pode apoiar desenvolvimento, mas não constitui evidência suficiente de isolamento multiempresa.
- **RLS:** a defesa em profundidade com PostgreSQL foi aceita como direção arquitetural; a forma concreta de implementação depende de spike no PostgreSQL 14 antes da SPEC 002-A.
- **Efeito:** esta ADR orienta implementações futuras, mas não autoriza criar policies, migrations, papéis de banco ou código nesta execução.

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

Além dos filtros obrigatórios em repository, adotar RLS como defesa em profundidade para tabelas tenant-owned no PostgreSQL 14. A mecânica abaixo é candidata e deve ser comprovada ou ajustada pelo spike:

- role de runtime sem atributo `BYPASSRLS` e sem propriedade das tabelas;
- `ENABLE ROW LEVEL SECURITY` e, quando adequado, `FORCE ROW LEVEL SECURITY`;
- policy de negação por padrão baseada em contexto de tenant definido com `SET LOCAL` dentro de transação;
- pool sempre limpa contexto ao finalizar a transação;
- conexão administrativa/migration usa papel separado e nunca atende tráfego da aplicação;
- jobs multiempresa iteram tenants com contexto explícito, sem query irrestrita do plano empresarial;
- testes executam com o mesmo papel de banco da aplicação.

RLS não substitui autorização de ação, filtro nos repositories nem constraints. Antes da implementação da SPEC 002-A, um spike precisa provar qual mecanismo é seguro com o pool e o query builder escolhidos. SQLite não suporta essa validação e não é gate de isolamento.

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
- testar RLS com role real da aplicação e contexto ausente, inválido e válido;
- testar concorrência ao remover último admin ou último superadmin;
- buscar métodos ou queries com bypass opcional de tenant;
- testar que respostas não revelam existência de recurso de outro tenant;
- testar que alteração de autorização invalida cache e sessão conforme definido.

## Condições antes da implementação

- preservar associação muitos-para-muitos por `Membership`, empresa ativa validada no servidor e separação entre `superadmin` e papéis de membership;
- preservar negação por padrão e ausência de acesso operacional implícito para `superadmin`;
- aprovar matriz inicial de permissões e capacidade, ou não, de papéis customizados;
- concluir spike de RLS com pool, transação, PostgreSQL 14 e Kysely/alternativa escolhida;
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
- O spike comprovará RLS seguro e sustentável com o pool escolhido?
