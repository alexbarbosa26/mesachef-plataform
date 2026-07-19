# SPEC 002 — Identidade, Autorização e Multiempresa

## Status da especificação

- **Estado:** `EM_ESPECIFICACAO`
- **Atualização:** 2026-07-18
- **Modo desta revisão:** documentação e decomposição executável
- **Pronta para implementação:** não como iniciativa agregadora; somente a 002-A está `PRONTA_PARA_IMPLEMENTAR`
- **Dependência concluída:** SPEC 001
- **Próxima spec:** SPEC 003 permanece bloqueada

As ADRs 0004, 0005 e 0006 estão aceitas. Os spikes de persistência com Kysely e
de RLS no PostgreSQL 14 foram concluídos e revisados; a mecânica RLS foi aceita
humanamente e o gate técnico correspondente foi encerrado. A iniciativa está
decomposta nas sub-specs executáveis em `docs/sdd/002/`, mas esta SPEC
agregadora não pode mudar para `PRONTA_PARA_IMPLEMENTAR` ou `CONCLUIDA` enquanto
decisões críticas e incrementos permanecerem abertos. As decisões próprias de
persistência da 002-A foram registradas e esse incremento está
`PRONTA_PARA_IMPLEMENTAR`; 002-B–G mantêm o estado `BLOQUEADA`. Esta revisão é apenas
documental e não autoriza código, dependências, migrations físicas, produção ou
interface.

## 1. Contexto

O MesaChef precisa estabelecer identidade, autenticação, empresas, autorização e isolamento multiempresa antes dos módulos de negócio. O backend deve ser a fonte da verdade: nenhum `companyId`, papel ou permissão enviado pelo frontend concede acesso.

O sistema de referência possui autenticação por e-mail e senha no Supabase, papéis `superadmin`, `admin` e `staff`, vínculo de perfil com uma única empresa e Row-Level Security nas tabelas públicas inventariadas. Também foram observadas diferenças entre menu, guards de rotas e políticas, além da ausência de rate limiting próprio comprovado. Esses achados são referência funcional e de risco; não são desenho a copiar.

**Decisão humana registrada em 2026-07-18.** Uma mesma identidade pode se vincular a várias empresas por `Membership`; a empresa ativa é determinada e validada no servidor.

**Decisão humana registrada em 2026-07-18.** `superadmin` é papel global separado dos papéis empresariais e não possui bypass implícito para dados operacionais de tenants.

## 2. Problema

Sem um modelo explícito, o sistema fica sujeito a:

- duplicação de identidades por empresa;
- autorização baseada em menu ou papel espalhado pelo código;
- IDOR e vazamento entre tenants;
- sessões não revogáveis após bloqueio ou mudança de permissão;
- elevação de privilégio por autoconcessão ou atribuição indevida;
- criação insegura do primeiro superadmin;
- auditoria incompleta de ações administrativas;
- falsa confiança em SQLite para controles que dependem de PostgreSQL.

## 3. Objetivo e resultados esperados

Definir e, em execuções futuras explicitamente autorizadas, entregar de forma incremental:

- identidade global por e-mail e senha;
- sessão web segura, expiráveis e revogáveis;
- empresa como tenant;
- membership de usuário em uma ou várias empresas;
- seleção e validação da empresa ativa;
- RBAC empresarial extensível e papel global de `superadmin`;
- isolamento obrigatório nos casos de uso, repositories, constraints e PostgreSQL RLS;
- administração segura, recuperação de senha e bloqueios;
- auditoria dos eventos críticos;
- frontend mínimo de login e seleção de empresa;
- testes negativos de isolamento, IDOR, força bruta e elevação de privilégio.

## 4. Dependências e decisões arquiteturais

### 4.1 Dependências

- SPEC 001 concluída e validada em PostgreSQL 14 local;
- monólito modular e limites arquiteturais disponíveis;
- API própria, sem Supabase Client no frontend;
- gestão de configuração e secrets por variáveis de ambiente;
- logging com correlation ID e health checks da fundação.

### 4.2 ADRs aceitas aplicáveis

- ADR 0001 — monólito modular;
- ADR 0002 — PostgreSQL 14 oficial e SQLite auxiliar;
- ADR 0003 — API própria sem acesso direto do frontend ao banco.

### 4.3 ADRs da SPEC 002

- ADR 0004 — `ACCEPTED`; Kysely nos adapters de infraestrutura, domínio independente e migrations imutáveis com checksum SHA-256;
- ADR 0005 — `ACCEPTED`; sessão opaca persistida no servidor, sem refresh token na aplicação web inicial;
- ADR 0006 — `ACCEPTED`; identidade global, membership multiempresa, RBAC e
  isolamento em profundidade com a mecânica RLS transacional validada no
  PostgreSQL 14 e aceita humanamente.

### 4.4 Decisões humanas registradas em 2026-07-18

- associação usuário–empresa muitos-para-muitos por `Membership`;
- empresa ativa determinada e validada no servidor;
- `superadmin` global separado de `admin` e `staff` empresariais;
- autorização com negação por padrão;
- ausência de bypass implícito de tenant para `superadmin`;
- SQLite não constitui evidência suficiente de isolamento multiempresa;
- SPEC 002 mantida em `EM_ESPECIFICACAO`;
- RLS tenant-owned com `ENABLE` + `FORCE`, role comum não-owner,
  `NOSUPERUSER`/`NOBYPASSRLS`, policies `USING`/`WITH CHECK` e contexto local
  por transação;
- contexts, pools e roles de tenant/plataforma separados;
- contexto ausente/inválido nega por padrão e desaparece após commit/rollback;
- repositories continuam exigindo `TenantContext` e filtro explícito;
- e-mail persistido como original e normalizado por algoritmo centralizado,
  determinístico e independente de provedor;
- checksum SHA-256 calculado sobre canonicalização `v1`, com metadados e
  verificação fail-closed de migrations aplicadas;
- política de tipos entre domínio, PostgreSQL e SQLite definida sem conversão de
  dinheiro ou `numeric` para `number`;
- migrations como fonte de verdade e futuro `db:verify` fail-closed para histórico,
  checksums e objetos críticos do catálogo PostgreSQL;
- SPEC 002-A em `PRONTA_PARA_IMPLEMENTAR`, sem implementação nesta revisão;
- SPEC 002-B e posteriores mantêm o estado `BLOQUEADA`;
- SPEC 003 mantida bloqueada.

## 5. Atores

| Ator | Escopo | Responsabilidades e limites |
|---|---|---|
| Visitante | público | autenticar e solicitar recuperação sem enumerar contas |
| Usuário autenticado | identidade | consultar/alterar perfil próprio, encerrar sessões e selecionar empresa permitida |
| `staff` | empresa ativa | executar somente ações concedidas por permissões efetivas |
| `admin` | empresa ativa | administrar a própria empresa, memberships e papéis dentro da capacidade delegável |
| `superadmin` | plataforma | administrar empresas, identidades e papéis globais por endpoints separados e auditados |
| Operador de bootstrap | infraestrutura controlada | criar o primeiro superadmin uma única vez, sem endpoint público |
| Sistema/job | plataforma ou tenant explícito | limpar expirações, entregar mensagens e executar tarefas com identidade técnica e escopo definido |

`superadmin` não é implicitamente um usuário empresarial. Acesso de suporte a dados operacionais, impersonação ou “entrar como cliente” está fora desta SPEC até decisão específica.

## 6. Escopo desta SPEC

- usuários e credenciais locais;
- empresas e seu estado de acesso;
- memberships multiempresa;
- empresa ativa na sessão;
- papéis empresariais `admin` e `staff`;
- papel global `superadmin`;
- catálogo extensível de permissões e atribuição por papel;
- login, logout, logout global e consulta da sessão;
- expiração, rotação e revogação de sessão;
- recuperação e redefinição de senha;
- bloqueio de usuário, empresa e membership;
- bootstrap seguro do primeiro superadmin;
- autorização no backend;
- isolamento multiempresa nos repositories e no PostgreSQL;
- auditoria inicial de identidade e administração;
- rate limiting e proteção contra força bruta;
- frontend mínimo de login, recuperação e seleção de empresa;
- migrations versionadas e testes da própria SPEC, após autorização futura.

## 7. Fora de escopo

- cadastro público e autoatendimento de novas empresas;
- login social, SAML, LDAP, passkeys ou federação OIDC;
- aplicativo móvel, API pública e OAuth para terceiros;
- JWT de access token ou família de refresh tokens para a SPA;
- impersonação, suporte com acesso a dados de cliente ou delegação temporária;
- módulos de estoque, compras, fichas técnicas, precificação, WhatsApp ou outros domínios;
- matriz de permissões dos módulos ainda não especificados;
- migração de usuários, hashes, sessões ou empresas do legado;
- envio real de e-mail antes da escolha do provedor;
- exclusão física ou anonimização de usuários e empresas;
- integração com PostgreSQL de produção;
- qualquer implementação fora de uma sub-spec explicitamente
  `PRONTA_PARA_IMPLEMENTAR`, ativa e autorizada para execução.

## 8. Linguagem ubíqua e bounded contexts

### 8.1 Termos

| Termo | Definição |
|---|---|
| Identidade (`User`) | pessoa global reconhecida pela plataforma, independente de empresa |
| Credencial | prova local de autenticação vinculada ao usuário; inicialmente senha |
| Empresa (`Company`) | tenant que delimita dados e autorização operacional |
| Membership | vínculo de uma identidade com exatamente uma empresa |
| Empresa ativa | empresa validada pelo backend e registrada na sessão atual |
| Papel (`Role`) | agrupamento empresarial de permissões |
| Permissão | capacidade estável no formato `recurso.acao` |
| Papel de plataforma | atribuição global, separada de membership; inicialmente `superadmin` |
| Sessão | estado autenticado revogável mantido no servidor |
| Contexto de tenant | valor confiável criado no backend com usuário, empresa e membership válidos |
| Contexto de plataforma | valor confiável para casos de uso globais, sem bypass de tenant |
| Auditoria | registro imutável e sanitizado de uma ação relevante e seu resultado |

### 8.2 Contextos e responsabilidades

| Bounded context/módulo | Responsabilidade | Não pode fazer |
|---|---|---|
| `identity-access` | usuário, credencial, login, sessão, reset e bloqueio global | decidir permissões de domínio empresarial |
| `companies-tenancy` | empresa, membership e empresa ativa | autenticar senha ou conceder papel global |
| `users-permissions` | catálogo, papéis, atribuições e autorização efetiva | acessar tabelas de outros módulos diretamente |
| `audit` | receber e persistir eventos críticos sanitizados | guardar secrets ou virar mecanismo primário de autorização |

Casos de uso dependem de portas. O domínio não importa Fastify, cookies, Kysely, `pg`, migrations ou componentes React.

## 9. Modelo de domínio

### 9.1 `User`

Identidade global com:

- `id` opaco e não sequencial;
- `emailOriginal` para exibição e auditoria e `emailNormalized` para
  autenticação e unicidade;
- `displayName`;
- `status`: `PENDING_ACTIVATION`, `ACTIVE`, `BLOCKED` ou `DEACTIVATED`;
- `authorizationVersion` monotônica;
- `createdAt`, `updatedAt`, `blockedAt` e motivo administrativo quando aplicável.

Um usuário pode existir temporariamente sem membership durante convite, bootstrap ou administração de plataforma. Acesso operacional exige membership ativa.

O e-mail é validado antes da persistência. A normalização remove espaços apenas
nas extremidades, aplica Unicode NFC, converte para minúsculas de forma
independente de locale e normaliza o domínio por IDNA quando necessário. Não
remove pontos do local-part, aliases com `+` nem aplica regras específicas de
provedor. A regra fica centralizada em componente de domínio ou serviço
compartilhado testável; `citext` não é sua fonte principal.

### 9.2 `PasswordCredential`

Agregado de infraestrutura de identidade separado do perfil:

- `userId` único;
- hash Argon2id e versão dos parâmetros;
- instante da última alteração;
- indicador de ativação/troca obrigatória quando necessário;
- nenhuma senha reversível ou dica de senha.

### 9.3 `Company`

Tenant empresarial com:

- `id` opaco;
- nome e identificador comercial mínimo;
- `status`: `ACTIVE` ou `BLOCKED` nesta SPEC;
- `authorizationVersion`;
- datas de criação, atualização e bloqueio;
- motivo de bloqueio, acessível somente a atores autorizados.

CNPJ, endereço, faturamento, plano e dados fiscais dependem de requisitos de produto ainda não aprovados e não devem ser inventados nesta SPEC.

### 9.4 `Membership`

Vínculo muitos-para-muitos entre `User` e `Company`:

- `id` opaco;
- `userId` e `companyId` imutáveis após criação;
- `status`: `INVITED`, `ACTIVE`, `SUSPENDED` ou `REVOKED`;
- `authorizationVersion`;
- datas de convite, ativação, suspensão e revogação;
- ator e motivo das transições administrativas.

Uma identidade pode possuir memberships em várias empresas. Não há duplicidade para o mesmo par usuário/empresa.

### 9.5 `Permission`, `Role` e atribuições

- `Permission`: código global estável `recurso.acao`, descrição e classificação;
- `Role`: papel pertencente a uma empresa, com código/nome, estado e indicador de papel de sistema;
- `RolePermission`: concessão aditiva de uma permissão a um papel;
- `MembershipRole`: atribuição de papel à membership da mesma empresa;
- `PlatformRoleAssignment`: atribuição global separada; inicialmente apenas `superadmin`.

O schema pode suportar papéis customizados, mas sua exposição funcional depende de decisão. Não haverá `deny` explícito no primeiro modelo: ausência de concessão significa negação.

### 9.6 `Session`

Sessão opaca persistida no servidor com:

- identificador interno e hash único do token aleatório;
- `userId`;
- `activeCompanyId` e `activeMembershipId` nulos ou coerentes entre si;
- versão de autorização observada;
- expiração por inatividade e absoluta;
- criação, última atividade e revogação com motivo;
- metadados de segurança minimizados.

O token em claro só existe no cookie seguro do cliente e durante a comparação no backend.

### 9.7 `PasswordResetToken`

Token opaco, aleatório, de uso único e curta duração:

- hash único do token;
- `userId`;
- emissão, expiração e consumo;
- revogação e motivo;
- nenhuma informação que permita recuperar a senha.

### 9.8 `AuthThrottleBucket`

Estado técnico para limitação distribuída por conta normalizada e origem de rede. As chaves devem ser transformadas para evitar que consultas administrativas exponham e-mails ou IPs em claro sem necessidade.

### 9.9 `AuditEvent`

Registro imutável com:

- ator humano ou técnico;
- escopo explícito `PLATFORM` ou `COMPANY`;
- `companyId` obrigatório somente no escopo empresarial;
- ação, alvo, resultado, instante e correlation ID;
- metadados minimizados e sanitizados;
- ausência de senha, token, hash de senha e secret.

## 10. Invariantes

1. `emailNormalized` é globalmente único; antes da consulta ou persistência a
   regra centralizada valida o formato, remove espaços das extremidades, aplica
   NFC, lowercase independente de locale e IDNA ao domínio, sem remover pontos,
   aliases `+` ou aplicar semântica específica de provedor.
2. Senha nunca é persistida, retornada ou registrada em claro.
3. Uma membership é única por `(userId, companyId)` e nunca muda de usuário ou empresa.
4. Usuário bloqueado ou desativado não autentica e não mantém sessão válida.
5. Empresa bloqueada não pode ser selecionada nem usada para operação empresarial.
6. Membership diferente de `ACTIVE` não concede contexto empresarial.
7. Empresa ativa é derivada de sessão do servidor após validar usuário, empresa e membership; o frontend não a impõe.
8. `activeCompanyId` e `activeMembershipId` da sessão pertencem ao mesmo usuário e à mesma empresa.
9. Mudança de empresa ativa rotaciona o identificador da sessão.
10. `superadmin` é papel global e não autoriza implicitamente dados operacionais de tenant.
11. `admin` e `staff` são papéis empresariais e só produzem permissões na membership ativa.
12. Autorização nega por padrão e usa permissão efetiva, não visibilidade de menu ou nome de papel espalhado.
13. Um ator nunca concede capacidade que não possui permissão delegável para conceder.
14. Autoconcessão, elevação indireta e alteração concorrente que resulte em privilégio maior são recusadas.
15. Uma empresa operacional preserva ao menos um `admin` ativo; remoção do último é transacionalmente recusada.
16. Após o bootstrap, a plataforma preserva ao menos um `superadmin` ativo; remoção ou bloqueio do último é recusado.
17. Bloqueio de usuário revoga todas as suas sessões e resets pendentes.
18. Bloqueio de empresa invalida imediatamente o contexto dessa empresa nas sessões afetadas, sem bloquear memberships em outras empresas.
19. Suspensão de membership invalida somente o contexto correspondente.
20. Reset de senha é de uso único, expira, troca a credencial de forma atômica e revoga as sessões do usuário.
21. Recurso de outra empresa não tem sua existência revelada ao solicitante.
22. Toda query tenant-owned recebe contexto não anulável e filtra por empresa; nenhum booleano ou valor nulo habilita bypass.
23. Relações entre dados tenant-owned não podem ligar empresas diferentes, inclusive sob concorrência.
24. Alteração crítica de identidade, empresa, membership ou autorização incrementa versão ou revoga sessões/caches afetados.
25. Operação administrativa crítica produz auditoria correlacionada no mesmo limite transacional quando tecnicamente possível.
26. Auditoria e logs nunca contêm senha, token de sessão/reset, hash de senha ou secret.

## 11. Requisitos funcionais

### 11.1 Identidade, empresa e membership

| ID | Requisito |
|---|---|
| RF-ID-001 | O sistema deve manter uma identidade global por e-mail normalizado. |
| RF-ID-002 | O usuário autorizado deve consultar e alterar apenas os campos permitidos do próprio perfil. |
| RF-ID-003 | O administrador autorizado deve criar usuário sem definir senha conhecida por ele. |
| RF-COMP-001 | `superadmin` deve criar, consultar, atualizar, bloquear e desbloquear empresas por casos de uso globais. |
| RF-COMP-002 | Bloqueio de empresa deve impedir acesso operacional e preservar dados. |
| RF-MEM-001 | Um usuário deve poder possuir memberships em uma ou várias empresas. |
| RF-MEM-002 | `admin` deve gerir memberships somente da empresa ativa e dentro de suas permissões. |
| RF-MEM-003 | O sistema deve suspender, reativar ou revogar membership sem afetar outras empresas do usuário. |
| RF-MEM-004 | O sistema deve listar ao usuário somente suas empresas selecionáveis. |
| RF-MEM-005 | Havendo uma única membership ativa, o produto pode selecioná-la automaticamente; havendo várias, deve solicitar escolha. |

### 11.2 Autenticação e sessão

| ID | Requisito |
|---|---|
| RF-AUTH-001 | Login deve aceitar e-mail e senha e emitir sessão opaca somente após validação completa. |
| RF-AUTH-002 | Resposta inválida não deve distinguir usuário inexistente, senha incorreta, bloqueio ou ausência de membership. |
| RF-AUTH-003 | Logout deve revogar a sessão corrente e expirar o cookie. |
| RF-AUTH-004 | Usuário deve poder revogar todas as próprias sessões por uma ação confirmada. |
| RF-AUTH-005 | O backend deve informar sessão atual, usuário, empresas elegíveis, empresa ativa e permissões efetivas sem expor credenciais. |
| RF-AUTH-006 | Seleção de empresa deve validar membership/estados e rotacionar a sessão. |
| RF-AUTH-007 | Sessão deve expirar por inatividade e por limite absoluto e poder ser revogada a qualquer momento. |
| RF-AUTH-008 | A aplicação web inicial não deve possuir endpoint de refresh token. |
| RF-AUTH-009 | Operações críticas devem poder exigir reautenticação recente conforme matriz a aprovar. |

### 11.3 Recuperação, bloqueios e bootstrap

| ID | Requisito |
|---|---|
| RF-REC-001 | Solicitação de recuperação deve responder genericamente e aplicar rate limiting. |
| RF-REC-002 | Token de reset deve ser aleatório, armazenado como hash, de uso único e expirar. |
| RF-REC-003 | Reset concluído deve trocar a senha, invalidar tokens pendentes e revogar sessões. |
| RF-REC-004 | Reset não deve autenticar automaticamente o usuário. |
| RF-BLOCK-001 | Bloqueio administrativo de usuário deve exigir permissão, motivo e auditoria. |
| RF-BLOCK-002 | Bloqueio administrativo de empresa deve exigir permissão, motivo e auditoria. |
| RF-BOOT-001 | Primeiro `superadmin` deve ser criado uma única vez fora de endpoint público. |
| RF-BOOT-002 | Bootstrap deve recusar execução concorrente ou quando já existir `superadmin` ativo. |
| RF-BOOT-003 | Nenhuma credencial inicial fixa deve existir em código, migration, exemplo ou log. |

### 11.4 Papéis, permissões e auditoria

| ID | Requisito |
|---|---|
| RF-RBAC-001 | Backend deve autorizar por permissão efetiva e contexto, com negação por padrão. |
| RF-RBAC-002 | `admin` e `staff` devem ser papéis empresariais atribuídos a memberships. |
| RF-RBAC-003 | `superadmin` deve ser atribuição global separada e auditada. |
| RF-RBAC-004 | O sistema deve suportar catálogo versionado de permissões e atribuição aditiva por papel. |
| RF-RBAC-005 | Mudanças de papel devem impedir autoconcessão e concessão além da capacidade delegável. |
| RF-RBAC-006 | A API deve retornar permissões efetivas da empresa ativa para orientar a UI, sem transferir a decisão de autorização ao cliente. |
| RF-AUD-001 | Eventos críticos definidos nesta SPEC devem produzir auditoria imutável e sanitizada. |
| RF-AUD-002 | Usuário autorizado deve consultar auditoria apenas no escopo permitido e com paginação. |

## 12. Matriz inicial de capacidades proposta

Esta matriz cobre somente identidade, empresas, memberships, RBAC e auditoria. Permissões de módulos de negócio serão definidas nas respectivas specs.

| Capacidade | `staff` | `admin` da empresa | `superadmin` da plataforma |
|---|:---:|:---:|:---:|
| consultar/alterar perfil próprio | sim | sim | sim |
| listar próprias empresas e selecionar empresa | sim | sim | se possuir membership |
| consultar dados básicos da empresa ativa | sim | sim | não implicitamente |
| listar memberships da empresa ativa | não por padrão | sim | não pelo plano empresarial |
| convidar/suspender membership | não | sim, com limites | por endpoint global aprovado |
| atribuir `staff`/`admin` | não | sim, sem elevar a si e preservando último admin | por endpoint global aprovado |
| criar/bloquear empresa | não | não | sim |
| bloquear usuário globalmente | não | não | sim |
| atribuir/remover `superadmin` | não | não | sim, preservando último ativo |
| consultar auditoria da empresa | não por padrão | sim | não implicitamente |
| consultar auditoria global | não | não | sim |
| acessar dados operacionais de outro tenant | não | não | não implicitamente |

A matriz exata, códigos de permissão, ações delegáveis e eventual papel customizado são gates de decisão do incremento 002-D.

## 13. Requisitos não funcionais

### 13.1 Segurança

- hash de senha com Argon2id e parâmetros versionados, medidos antes do aceite;
- mínimo proposto de 15 caracteres para senha de fator único, máximo aceito de pelo menos 64, sem regras arbitrárias de composição;
- bloqueio de senhas comprometidas e aceitação de colagem e caracteres amplos;
- tokens aleatórios com pelo menos 256 bits de entropia;
- cookie de produção com prefixo `__Host-`, `HttpOnly`, `Secure`, `Path=/` e `SameSite=Lax` como proposta inicial;
- proteção CSRF por token vinculado à sessão, validação de origem e content type explícito;
- CORS restrito e headers de segurança;
- queries parametrizadas e payloads validados por schema;
- respostas e logs sem dados de credencial;
- rate limiting distribuído ou semanticamente consistente entre instâncias;
- dependências submetidas às verificações já existentes no projeto.

### 13.2 Persistência e consistência

- PostgreSQL 14 é o gate oficial para migrations, constraints, concorrência, locks e RLS;
- SQLite é auxiliar e não comprova isolamento final;
- migrations são incrementais, versionadas, revisadas e testadas em banco vazio e representativo;
- migrations são a fonte de verdade do schema e alterações manuais são proibidas;
- checksum usa SHA-256 sobre bytes UTF-8 canonicalizados pela versão `v1`: remove
  BOM UTF-8, converte CRLF/CR em LF e preserva todo o conteúdo restante;
- o histórico registra migration, checksum, versão de canonicalização, data,
  versão da aplicação e versão da ferramenta; divergência bloqueia a execução;
- o futuro `db:verify` falha diante de drift no histórico/checksums ou nos objetos
  críticos do catálogo PostgreSQL e nunca corrige o schema automaticamente;
- transações protegem regras de último administrador, último superadmin e alterações de autorização;
- domínio não depende de ORM/query builder;
- dinheiro no domínio usa `MoneyDecimal` baseado em `BigInt` com escala 4;
  PostgreSQL usa `numeric(24,4)` e SQLite texto decimal canônico;
- drivers nunca convertem `numeric` em JavaScript `number`; UUID, timestamps e
  JSON seguem os mappings e validações definidos na 002-A, sem tipos de Kysely ou
  drivers escaparem da infraestrutura.

### 13.3 Operação e observabilidade

- toda resposta usa correlation ID e erro padronizado;
- falhas de autenticação são observáveis sem enumerar contas;
- métricas distinguem sucesso, falha, rate limit, revogação e acesso negado sem labels de alta cardinalidade contendo dados pessoais;
- readiness falha quando a dependência necessária à autenticação está indisponível;
- jobs de limpeza são idempotentes e não definem a validade da sessão — a expiração é verificada em leitura;
- relógio deve ser UTC na persistência e apresentação local apenas na borda.

### 13.4 Qualidade

- TypeScript estrito e sem `any` não justificado;
- limites arquiteturais impedem domínio → HTTP/UI/database e acesso direto a tabelas fora dos repositories;
- testes não repetem a implementação e incluem caminhos negativos;
- nenhum endpoint de negócio aparece nesta SPEC.

## 14. Contratos de API propostos

Todos os contratos usam `/api/v1`, JSON validado e o envelope de erro da fundação. IDs são opacos. Campos adicionais não documentados são rejeitados nos comandos sensíveis.

### 14.1 Erro comum

```json
{
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Não foi possível autenticar com os dados informados.",
    "correlationId": "..."
  }
}
```

- `401`: autenticação ausente, inválida ou expirada;
- `403`: autenticado sem permissão, quando a resposta não revelar outro tenant;
- `404`: recurso inexistente ou pertencente a outro tenant;
- `409`: conflito de estado ou unicidade;
- `422`: payload semanticamente inválido;
- `429`: limite excedido, com resposta genérica e `Retry-After` quando seguro;
- não utilizar `423` no login, porque revelaria bloqueio da conta.

### 14.2 Autenticação e sessão

| Método e rota | Autorização | Entrada | Saída principal |
|---|---|---|---|
| `POST /api/v1/auth/login` | pública + rate limit | `email`, `password`, token CSRF de pré-sessão se adotado | `200`, cookie rotacionado, usuário mínimo e estado de seleção; ou erro genérico |
| `POST /api/v1/auth/logout` | sessão + CSRF | nenhuma | `204`, sessão revogada e cookie expirado |
| `POST /api/v1/auth/logout-all` | sessão + CSRF + reautenticação conforme decisão | confirmação | `204`, sessões revogadas |
| `GET /api/v1/auth/session` | sessão | nenhuma | usuário, empresas elegíveis, empresa ativa e permissões efetivas |
| `POST /api/v1/auth/select-company` | sessão + CSRF | `companyId` solicitado | `200`, sessão rotacionada e contexto validado |
| `POST /api/v1/auth/reauthenticate` | sessão + CSRF + rate limit | `password` | `204` e marca temporal curta na sessão |
| `POST /api/v1/auth/forgot-password` | pública + rate limit | `email` | `202` genérico |
| `POST /api/v1/auth/reset-password` | pública + rate limit | `token`, `newPassword` | `204`, sem login automático |

Não existe `POST /auth/refresh`. A renovação ociosa da sessão opaca ocorre no servidor sem ultrapassar a expiração absoluta.

Exemplo de resposta sanitizada de sessão:

```json
{
  "data": {
    "user": { "id": "...", "email": "usuario@example.invalid", "displayName": "Usuário" },
    "companies": [{ "id": "...", "name": "Empresa A", "requiresSelection": true }],
    "activeCompany": null,
    "permissions": []
  }
}
```

### 14.3 Identidade própria e empresa ativa

| Método e rota | Autorização | Finalidade |
|---|---|---|
| `GET /api/v1/me` | sessão | consultar perfil próprio |
| `PATCH /api/v1/me` | sessão + CSRF | alterar somente campos permitidos do perfil |
| `GET /api/v1/me/companies` | sessão | listar memberships selecionáveis do usuário |
| `GET /api/v1/me/permissions` | sessão + empresa ativa | listar permissões efetivas da membership ativa |
| `GET /api/v1/company` | empresa ativa + `company.read` | consultar dados básicos da empresa ativa |
| `PATCH /api/v1/company` | empresa ativa + CSRF + `company.update` | atualizar campos permitidos da empresa ativa |

### 14.4 Administração da empresa ativa

| Método e rota | Permissão proposta | Finalidade |
|---|---|---|
| `GET /api/v1/company/memberships` | `membership.read` | listar memberships somente da empresa ativa |
| `POST /api/v1/company/memberships` | `membership.invite` | criar convite/vínculo sem senha definida pelo admin |
| `POST /api/v1/company/memberships/{id}/suspend` | `membership.suspend` | suspender vínculo com motivo |
| `POST /api/v1/company/memberships/{id}/reactivate` | `membership.reactivate` | reativar vínculo elegível |
| `PUT /api/v1/company/memberships/{id}/roles` | `role.assign` | substituir atribuições de modo transacional e auditado |
| `GET /api/v1/company/roles` | `role.read` | listar papéis e permissões disponíveis na empresa |
| `GET /api/v1/company/audit-events` | `audit.read` | consultar auditoria empresarial paginada |

Rotas empresariais usam a empresa ativa da sessão. O ID da membership é sempre combinado com o tenant no repository.

### 14.5 Administração global

| Método e rota | Permissão global proposta | Finalidade |
|---|---|---|
| `GET/POST /api/v1/platform/companies` | `platform.company.read/create` | listar ou criar empresas |
| `GET/PATCH /api/v1/platform/companies/{id}` | `platform.company.read/update` | consultar ou atualizar empresa |
| `POST /api/v1/platform/companies/{id}/block` | `platform.company.block` | bloquear com motivo e invalidar contextos |
| `POST /api/v1/platform/companies/{id}/unblock` | `platform.company.unblock` | desbloquear após validação |
| `GET/POST /api/v1/platform/users` | `platform.user.read/create` | listar ou criar identidades |
| `POST /api/v1/platform/users/{id}/block` | `platform.user.block` | bloquear e revogar sessões |
| `POST /api/v1/platform/users/{id}/unblock` | `platform.user.unblock` | desbloquear sem restaurar sessões antigas |
| `PUT /api/v1/platform/users/{id}/platform-roles` | `platform.role.assign` | alterar papéis globais preservando último superadmin |
| `GET /api/v1/platform/audit-events` | `platform.audit.read` | consultar auditoria global paginada |

Criação de membership por `superadmin` deve usar caso de uso global explícito; não será obtida alterando o contexto para uma empresa arbitrária.

### 14.6 Regras transversais dos contratos

- cookie de sessão nunca aparece no corpo;
- operações mutáveis com cookie exigem header anti-CSRF;
- paginação usa cursor opaco e limite máximo definido;
- comandos críticos aceitam chave de idempotência quando repetição puder duplicar convite ou atribuição;
- respostas não retornam hash, motivo interno de segurança ou existência em outro tenant;
- `companyId`, `userId` e permissões efetivas nunca são aceitos como claims confiáveis do frontend;
- OpenAPI deve documentar schemas, erros, segurança e exemplos sem credenciais reais.

## 15. Estratégia de autenticação, sessão e recuperação

### 15.1 Senha

- normalizar e-mail por regra aprovada antes de qualquer consulta;
- usar Argon2id e benchmark do ambiente, com rehash oportunista quando parâmetros evoluírem;
- comparar em tempo resistente a enumeração e executar hash substituto para usuário inexistente;
- recusar senhas comprometidas sem enviar senha completa a terceiro;
- não registrar senha nem mesmo em nível de debug.

### 15.2 Sessão

- identificador aleatório de 256 bits ou mais;
- somente hash no banco e cookie seguro no navegador;
- proposta de 30 minutos de inatividade e 12 horas absolutas;
- rotação em login, seleção de empresa, reset, reautenticação e elevação;
- revogação imediata por logout, bloqueio, reset ou mudança crítica;
- atualização de última atividade limitada para evitar escrita por requisição.

### 15.3 Refresh token

Refresh token não é adotado para a aplicação web desta SPEC. Uma necessidade futura para cliente móvel, API pública ou OIDC exige ADR distinta.

### 15.4 Recuperação

- resposta uniforme e assíncrona (`202`) independentemente da conta;
- token único com hash no banco e validade proposta de 30 minutos;
- URL construída a partir de origem configurada e confiável;
- consumo transacional, revogação de sessões e aviso posterior;
- provedor de entrega, templates e política de bounce permanecem abertos.

## 16. Rate limiting e proteção contra força bruta

Valores abaixo são baseline para teste, não decisão operacional final:

| Operação | Chave de conta | Chave de origem | Resposta após limite |
|---|---:|---:|---|
| login inválido | 5 em 15 min | 20 em 15 min | espera progressiva e `429` genérico |
| forgot password | 3 em 1 h | 10 em 1 h | `202` genérico, sem nova entrega |
| reset inválido | 5 em 15 min | 20 em 15 min | `429` genérico |
| reautenticação | 5 em 15 min | 20 em 15 min | espera progressiva e auditoria |

Regras:

- combinar conta normalizada e rede para evitar distribuição simples do ataque;
- considerar somente IP extraído de proxy explicitamente confiável;
- não transformar throttling em bloqueio administrativo permanente, evitando DoS contra a vítima;
- resetar ou decair buckets após sucesso conforme política testada;
- alertar sobre padrões anormais sem expor identidade em métricas;
- validar funcionamento em múltiplas instâncias antes do rollout.

## 17. Isolamento multiempresa e prevenção de IDOR

### 17.1 Nos casos de uso e repositories

- casos de uso empresariais recebem `TenantContext` construído por middleware de autenticação/autorização;
- repositories tenant-owned não oferecem método sem contexto;
- inserts derivam `company_id` do contexto;
- leituras, updates e deletes filtram por `(company_id, id)`;
- contagens, agregações, exports e jobs mantêm o mesmo filtro;
- zero linhas não revela se o ID existe em outra empresa;
- repositories globais aceitam `PlatformContext` por interface separada;
- não existe `skipTenant`, `includeAllCompanies` ou `companyId` opcional no caminho empresarial.

### 17.2 No PostgreSQL 14

- chaves únicas e foreign keys compostas evitam relações entre tenants;
- role comum de runtime é distinta do owner, `NOSUPERUSER` e `NOBYPASSRLS`;
- tabelas tenant-owned usam `ENABLE` e `FORCE ROW LEVEL SECURITY` como defesa em profundidade;
- contexto é definido com `set_config('app.current_company_id', companyId, true)` dentro de transação e limpo por commit ou rollback;
- policies aplicam predicados equivalentes em `USING` e `WITH CHECK` e negam quando o contexto estiver ausente ou inválido;
- pools/roles de tenant e plataforma são distintos e não compartilham grants;
- testes usam a mesma role de runtime da aplicação;
- SQLite não substitui esses testes.

O spike descartável em `spikes/postgres-rls`, documentado em
`docs/qa/spikes/spec-002-postgres-rls.md`, comprovou tecnicamente esse mecanismo
com pool, reuso da mesma conexão, 40 transações concorrentes, IDOR, filtros
independentes no repository e separação entre os planos de tenant e plataforma.
O responsável aceitou essa mecânica em 2026-07-18. O resultado não substitui
membership, RBAC, autorização da aplicação ou filtros dos repositories e não
libera implementação.

A credencial da role tenant é um secret restrito ao backend: ela consegue
definir outro UUID por `set_config`, portanto o servidor precisa derivar e
validar a empresa antes de abrir a transação. Contexto nunca fica em variável
global do processo. Operações globais iteram tenants explicitamente ou usam um
caminho de plataforma separado e auditado. Performance, PgBouncer e failover
continuam riscos futuros não validados pelo spike.

### 17.3 Semântica externa

- ID de outro tenant e ID inexistente retornam `404` quando a distinção revelaria informação;
- `403` fica restrito a recurso do próprio tenant cuja existência já possa ser conhecida;
- UUID não substitui autorização;
- toda ação recebe teste negativo com troca de empresa, membership, papel e alvo.

## 18. Persistência e migrations propostas

Esta seção descreve a intenção agregada. As migrations definitivas `0001` a
`0006` dos incrementos 002-A1/002-A2 já foram criadas e validadas para a
infraestrutura de integridade e o schema inicial de identidade/tenancy. Roles,
grants, RLS, repositories, sessões, RBAC e migrations posteriores permanecem
não implementados. As migrations experimentais dos spikes usam somente objetos
`spike_*`, foram revertidas e não definem o schema real.

### 18.1 Incremento 002-A — infraestrutura, identidade e tenancy inicial

1. Infraestrutura de migrations
   - histórico do migrator Kysely;
   - tabela auxiliar com migration, checksum SHA-256, `canonicalization_version`
     (`v1`), data, versão da aplicação e versão da ferramenta;
   - canonicalização UTF-8 que remove BOM, converte CRLF/CR em LF e preserva o
     restante do conteúdo;
   - validação fail-closed de todas as migrations aplicadas antes de qualquer
     migration pendente;
   - execução separada do deploy, sem migration automática no startup da API;
   - futuro `db:verify` para histórico/checksums e tabelas, colunas, tipos,
     constraints, índices, policies RLS, roles e grants no catálogo PostgreSQL.
2. Schema `identity`
   - `users`: UUID, `email_original`, `email_normalized` com unicidade, status,
     versão e timestamps;
   - `password_credentials`: FK única, hash e metadados do algoritmo, sem
     implementar validação de senha.
3. Schema `tenancy`
   - `companies`: UUID, nome mínimo, status, versão e timestamps;
   - `memberships`: UUID, `user_id`, `company_id`, status, versão, timestamps e
     `UNIQUE (user_id, company_id)`.
4. Segurança PostgreSQL inicial
   - owner, migrator, role/pool tenant e role/pool plataforma separados;
   - RLS `ENABLE` + `FORCE`, policies `USING`/`WITH CHECK` e grants mínimos nas
     tabelas tenant-owned;
   - repositories, transações, `TenantContext` e `PlatformContext`.

### 18.2 Incremento 002-B — autenticação e sessões

5. `identity_sessions`
   - token hash único, usuário, expirações, revogação e metadados minimizados;
   - índices de sessão ativa por usuário e expiração;
   - campos de empresa/membership inicialmente nulos, adicionados/validados no incremento C.
6. `identity_password_reset_tokens`
   - token hash único, usuário, emissão, expiração, consumo e revogação;
   - índice para limpeza sem usar token em claro.
7. `identity_auth_throttle_buckets`
   - chave opaca, tipo, janela, contagem e expiração;
   - desenho compatível com atualização atômica.

### 18.3 Incremento 002-C — empresas e memberships

8. Evolução de `tenancy_companies` e `tenancy_memberships`
   - constraints de transição e chave composta para provar membership,
     usuário e empresa;
   - índices dos casos de uso aprovados.
9. Alteração expansiva de `identity_sessions`
   - `active_company_id` e `active_membership_id` nulos;
   - FK composta `(user_id, active_company_id, active_membership_id)` para a membership correspondente;
   - regra que exige ambos nulos ou ambos preenchidos.

### 18.4 Incremento 002-D — papéis e permissões

10. `access_permissions`
   - catálogo global por código estável e versionado.
11. `access_company_roles`
   - papel pertencente a `company_id`, código, nome, estado e indicador de sistema;
   - unicidade `(company_id, code)`.
12. `access_company_role_permissions`
   - relação com empresa explícita e FKs compostas para papel da mesma empresa e permissão global.
13. `access_membership_roles`
   - relação com `company_id` e FKs compostas que impedem cruzar membership e papel de empresas diferentes.
14. `access_platform_role_assignments`
   - usuário, código global, estado, ator e timestamps;
   - constraints que suportem preservar o último `superadmin` por transação/lock.
15. Seed/migration determinística do catálogo e dos papéis empresariais iniciais, sem credenciais.

### 18.5 Incremento 002-E — administração e auditoria

16. `audit_events`
   - evento imutável, escopo explícito, ator, empresa condicional, ação, alvo, resultado, correlation ID e metadados JSON sanitizados;
   - `CHECK` que exige empresa somente para escopo `COMPANY`;
   - índices por instante, ator, empresa, ação e alvo conforme consultas aprovadas.
17. Não criar tabela com secret de bootstrap. O comando usa transação, lock e configuração efêmera externa.

### 18.6 Incrementos 002-F e 002-G

- 002-F não exige novas tabelas;
- 002-G repete e endurece policies, roles/grants, índices ou constraints no
  schema definitivo; toda correção retorna à sub-spec proprietária;
- qualquer ajuste segue expandir → backfill → validar → contrair;
- migrations aplicadas não são editadas; correções usam nova migration.

### 18.7 Regras de migração

- testar do zero e sobre base representativa no PostgreSQL 14;
- `down` somente quando seguro; rollback operacional padrão é forward fix;
- migration não roda automaticamente no startup de produção;
- migrations são a fonte de verdade; migration aplicada é imutável e correção
  ou drift exige nova migration, nunca edição ou reparo automático;
- role de migration é distinta da role da aplicação;
- nenhum `DROP`, limpeza de volume ou alteração de produção sem autorização e backup;
- adapter SQLite, se criado, é auxiliar e documenta recursos não equivalentes, especialmente RLS e concorrência.

## 19. Auditoria obrigatória

Eventos mínimos:

- login administrativo bem-sucedido e falhas anormais agregadas;
- logout global e revogação administrativa de sessão;
- bootstrap e mudança de `superadmin`;
- criação, ativação, bloqueio e desbloqueio de usuário;
- criação, bloqueio e desbloqueio de empresa;
- convite, ativação, suspensão, reativação e revogação de membership;
- atribuição e remoção de papel;
- mudança do catálogo de permissões;
- reset de senha concluído, sem token ou senha;
- tentativa negada de elevação ou acesso entre tenants;
- mudança de empresa ativa, se o threat model confirmar necessidade e retenção proporcional.

Auditoria não substitui logs operacionais. Retenção, exportação, acesso do titular e tratamento de dados pessoais precisam de decisão antes do incremento 002-E.

## 20. Incrementos de entrega

Esta SPEC permanece o documento agregador. Os contratos executáveis, critérios
de aceite e gates próprios estão em `docs/sdd/002/README.md` e nos documentos
abaixo. Cada incremento exige autorização própria, preserva a SPEC 003
bloqueada e só começa após os gates anteriores.

### SPEC 002-A — Persistência e migrations de identidade

- **Documento:** `docs/sdd/002/002-a-persistencia-migrations.md`.
- **Estado:** `PRONTA_PARA_IMPLEMENTAR`.
- **Entrada:** ADRs 0004/0006 e spikes aceitos; decisões críticas de normalização
  de e-mail, checksum, tipos e detecção de drift registradas.
- **Entrega:** adapter Kysely, migrations/checksum, tipos, schema inicial de
  identidade/tenancy, repositories, transações, contexts, roles, RLS e testes.
- **Não inclui:** login, validação de senha, sessão HTTP, endpoints, frontend ou
  RBAC final.
- **Saída:** migrations, constraints, limites arquiteturais e isolamento
  aprovados no PostgreSQL 14.

### SPEC 002-B — Autenticação e sessões

- **Documento:** `docs/sdd/002/002-b-autenticacao-sessoes.md`.
- **Estado:** `BLOQUEADA`.
- **Entrada:** 002-A concluída; ADR 0005 aceita; TTL, senha e rate limits aprovados.
- **Entrega:** login, logout, logout global, sessão opaca, CSRF, reset e throttling.
- **Não inclui:** seleção de empresa ou RBAC empresarial.
- **Saída:** testes de expiração, rotação, revogação, enumeração e força bruta aprovados.

### SPEC 002-C — Empresas e memberships

- **Documento:** `docs/sdd/002/002-c-empresas-memberships.md`.
- **Estado:** `BLOQUEADA`.
- **Entrada:** 002-B concluída; decisão multiempresa aceita.
- **Entrega:** empresa, membership, estados e seleção/rotação da empresa ativa.
- **Não inclui:** matriz de papéis ou administração visual.
- **Saída:** constraints compostas e cenários multiempresa aprovados em PostgreSQL.

### SPEC 002-D — Papéis e permissões

- **Documento:** `docs/sdd/002/002-d-rbac-permissoes.md`.
- **Estado:** `BLOQUEADA`.
- **Entrada:** 002-C concluída; ADR 0006 e matriz inicial aceitas.
- **Entrega:** catálogo, papéis, atribuições, autorização por permissão e invalidação de versão/cache.
- **Não inclui:** permissões de módulos de negócio futuros.
- **Saída:** matriz positiva/negativa e preservação do último admin/superadmin aprovadas.

### SPEC 002-E — Administração e auditoria

- **Documento:** `docs/sdd/002/002-e-administracao-auditoria.md`.
- **Estado:** `BLOQUEADA`.
- **Entrada:** 002-D concluída; MFA/bootstrap, retenção e eventos aprovados.
- **Entrega:** casos de uso globais/empresariais administrativos, bootstrap único e auditoria.
- **Não inclui:** impersonação ou migração do legado.
- **Saída:** bootstrap concorrente, auditoria sanitizada e bloqueios aprovados.

### SPEC 002-F — Login e seleção de empresa no frontend

- **Documento:** `docs/sdd/002/002-f-frontend-login-tenant.md`.
- **Estado:** `BLOQUEADA`.
- **Entrada:** contratos B–E estáveis; fluxos e acessibilidade aprovados.
- **Entrega:** telas de login, recuperação, redefinição, estados de bloqueio genéricos, seleção de empresa e bootstrap de sessão do frontend.
- **Não inclui:** dashboard ou módulos de negócio.
- **Saída:** loading/erro/sucesso/repetição, duplo envio, acessibilidade e integração real aprovados.

### SPEC 002-G — Hardening e testes de segurança

- **Documento:** `docs/sdd/002/002-g-hardening-seguranca.md`.
- **Estado:** `BLOQUEADA`.
- **Entrada:** 002-A a 002-F em validação; threat model atualizado.
- **Entrega:** RLS/grants, testes adversariais, rate limits calibrados, revisão de secrets/dependências e evidências PostgreSQL 14.
- **Não inclui:** pentest de produção ou deploy.
- **Saída:** todos os critérios da SPEC, regressão, build e documentação aprovados; somente então a SPEC 002 pode ser candidata a `CONCLUIDA`.

## 21. Estratégia de testes

### 21.1 Testes unitários

- normalização e validação de e-mail;
- transições válidas/inválidas de usuário, empresa e membership;
- seleção automática/obrigatória de empresa;
- cálculo de permissões efetivas e negação por padrão;
- ator não pode conceder além da capacidade delegável;
- preservação de último admin e último superadmin;
- expiração ociosa/absoluta e decisão de rotação;
- consumo único e expiração de reset;
- chaves e janelas de rate limiting;
- sanitização de evento de auditoria;
- mapeamento de erros sem enumeração.

### 21.2 Testes de integração da API

- login válido/inválido, cookie e CSRF;
- hash substituto para usuário inexistente;
- logout, logout global, revogação e sessão expirada;
- reset válido, expirado, consumido e concorrente;
- bloqueio/desbloqueio de usuário e empresa;
- criação/suspensão/reativação de membership;
- seleção e troca de empresa com rotação;
- atribuição de papéis, invalidação de sessão/cache e auditoria;
- validação de payload, content type, CORS e headers;
- falha segura com banco indisponível;
- idempotência de convite e ação administrativa repetida.

### 21.3 Testes obrigatórios de isolamento em PostgreSQL 14

Com empresas A e B, usuários distintos e um usuário com duas memberships:

- repository de A não lê, conta, altera, remove ou relaciona registro de B;
- ausência de `TenantContext` falha fechada;
- contexto de A com ID de B retorna a mesma semântica de inexistente;
- insert ignora/rejeita `companyId` malicioso e usa o contexto;
- FK composta impede associar membership de A a papel de B;
- RLS nega com role real quando contexto está ausente, inválido ou de outro tenant;
- transação/pool não reutiliza contexto de requisição anterior;
- usuário multiempresa só troca para membership própria ativa;
- suspensão em A não remove acesso válido em B;
- bloqueio de A não concede fallback silencioso para B.

### 21.4 Testes obrigatórios de elevação de privilégio

- `staff` não atribui papel nem chama endpoint administrativo pela URL direta;
- `staff` não inclui código de permissão/papel extra no payload;
- `admin` de A não concede papel em B;
- `admin` não se promove por alteração direta ou corrida concorrente;
- `admin` não atribui `superadmin`;
- `superadmin` não acessa repository operacional sem membership/contexto empresarial;
- último admin e último superadmin não podem ser removidos por duas requisições concorrentes;
- cache/versão antiga não preserva acesso após revogação;
- alteração de ID, mass assignment e parâmetro duplicado não burlam autorização.

### 21.5 Testes de migrations e arquitetura

- migrations em banco vazio, upgrade, repetição segura e snapshot representativo;
- rollback somente das migrations declaradas reversíveis;
- role de runtime sem owner/`BYPASSRLS`;
- domínio sem imports de database, HTTP ou UI;
- frontend sem driver de banco ou Supabase Client;
- repositories globais e tenant-owned separados;
- nenhuma tabela de módulo de negócio criada.

### 21.6 Cenários Given/When/Then prioritários

| ID | Cenário |
|---|---|
| CT-002-001 | **Dado** e-mail inexistente ou senha inválida, **quando** houver login, **então** corpo/status observável não distingue os casos. |
| CT-002-002 | **Dado** usuário bloqueado com sessões, **quando** o bloqueio confirmar, **então** todas são revogadas e novo login falha genericamente. |
| CT-002-003 | **Dada** empresa bloqueada, **quando** membro tentar selecioná-la ou operar nela, **então** o contexto é negado sem afetar outra empresa ativa. |
| CT-002-004 | **Dado** usuário com A e B, **quando** seleciona B, **então** membership é validada, sessão rotaciona e permissões passam a ser de B. |
| CT-002-005 | **Dado** admin de A e alvo de B, **quando** usa o ID do alvo, **então** recebe `404` e nenhum dado de B é alterado. |
| CT-002-006 | **Dado** `staff`, **quando** chama atribuição de papel diretamente, **então** recebe negação e evento de segurança sanitizado. |
| CT-002-007 | **Dados** dois admins concorrentes tentando remover o último admin remanescente, **quando** transações competem, **então** ao menos um admin ativo permanece. |
| CT-002-008 | **Dado** token de reset consumido, **quando** reutilizado, **então** falha genericamente e não muda a senha. |
| CT-002-009 | **Dado** cookie válido sem token CSRF, **quando** operação mutável ocorre, **então** falha sem executar o caso de uso. |
| CT-002-010 | **Dado** pool reutilizado após transação de A, **quando** requisição de B começa, **então** nenhum contexto RLS de A permanece. |
| CT-002-011 | **Dado** primeiro bootstrap concluído, **quando** outra execução ocorre, **então** recusa sem criar segundo bootstrap implícito nem revelar segredo. |
| CT-002-012 | **Dadas** falhas acima do limite, **quando** novo login ocorre, **então** throttling é aplicado sem bloqueio permanente da vítima. |

## 22. Critérios de aceite

### 22.1 Gate documental para `PRONTA_PARA_IMPLEMENTAR`

- [x] ADR 0004 aceita após spike com Kysely e decisão humana.
- [x] ADR 0005 aceita por decisão humana em 2026-07-18.
- [x] ADR 0006 aceita por decisão humana em 2026-07-18.
- [x] Spike de persistência com Kysely concluído e aceito no PostgreSQL 14.
- [x] Spike de RLS concluído e mecânica aceita humanamente no PostgreSQL 14.
- [x] Associação multiempresa por `Membership` e empresa ativa validada no servidor aprovadas.
- [ ] Matriz inicial de permissões e delegação aprovada.
- [x] `superadmin` separado dos papéis empresariais e sem bypass implícito de tenant.
- [ ] MFA e bootstrap aprovados.
- [ ] TTL, senha, reset e rate limits aprovados.
- [ ] Provedor/canal de ativação e recuperação definido.
- [ ] Retenção e acesso à auditoria definidos.
- [x] Sub-specs A–G e ordem de dependência documentadas.
- [ ] Contratos de cada incremento aprovados antes de sua implementação.
- [x] Contratos e decisões de persistência próprios da 002-A aprovados.
- [x] Formato canônico de checksum, estratégia de tipos/drift e normalização de
  e-mail aprovados para a 002-A.

### 22.2 Aceite funcional futuro

- [ ] Login válido cria sessão opaca segura; login inválido não enumera usuário.
- [ ] Logout, reset e bloqueio revogam sessões conforme invariantes.
- [ ] Usuário pode pertencer e trocar entre várias empresas autorizadas.
- [ ] Empresa e membership bloqueadas impedem somente os acessos correspondentes.
- [ ] `staff`, `admin` e `superadmin` respeitam a matriz no backend.
- [ ] `superadmin` não possui bypass implícito para dados operacionais.
- [ ] Mudanças críticas são auditadas sem secrets.
- [ ] Rate limiting e proteção contra força bruta passam nos testes.
- [ ] Bootstrap é único, concorrente-seguro e não contém credencial fixa.

### 22.3 Aceite técnico futuro

- [ ] Migrations passam em banco vazio e representativo no PostgreSQL 14.
- [ ] Constraints e RLS impedem relações/acesso entre tenants.
- [ ] Testes unitários, integração, isolamento e elevação passam.
- [ ] Lint, limites arquiteturais, typecheck, testes e build passam.
- [ ] Auditoria de secrets e dependências passa.
- [ ] SQLite está documentado apenas como auxiliar.
- [ ] Evidências A–G estão registradas.

## 23. Estratégia de rollout

Nenhum rollout é autorizado por esta revisão. Quando houver autorização futura:

1. obter autorização de implementação e entregar a 002-A conforme seu documento;
2. validar a 002-A e então entregar 002-B a 002-G sequencialmente, aplicando a mecânica RLS
   aceita no schema definitivo;
3. aplicar migrations por estratégia expandir/backfill/validar/contrair em ambiente não produtivo;
4. criar catálogo de permissões por seed determinística;
5. executar bootstrap em ambiente isolado e comprovar revogação do material inicial;
6. habilitar autenticação para usuários internos/piloto por feature flag;
7. observar login, rate limit, erros, sessões e acessos negados sem dados pessoais indevidos;
8. liberar empresas em lotes somente após testes de isolamento e runbook aprovado;
9. manter o legado independente até plano de migração da SPEC 011.

Não haverá sincronização silenciosa de credenciais do legado nem conexão com produção nesta SPEC.

## 24. Estratégia de rollback

- desligar novos endpoints/fluxos por configuração e revogar sessões emitidas pela versão afetada;
- preservar usuários, empresas, memberships e auditoria; não apagar dados para “voltar”;
- corrigir schema por migration forward como padrão;
- usar `down` somente em ambiente controlado e quando a migration declarar reversão sem perda;
- reverter mudança de catálogo por nova versão determinística, sem editar migration aplicada;
- para falha de RLS, negar tráfego empresarial ou restaurar policy previamente testada — nunca desabilitar isolamento para manter disponibilidade;
- para falha de bootstrap, bloquear autenticação administrativa e seguir runbook de recuperação de segredo, sem criar conta padrão;
- rollback de frontend não altera contratos ou credenciais persistidas;
- qualquer rollback produtivo futuro exige backup, autorização e evidência fora do escopo atual.

## 25. Decisões registradas e dúvidas abertas

### 25.1 Decisões humanas registradas

| Tema | Decisão | Efeito |
|---|---|---|
| ADR 0004 | `ACCEPTED` após spike com Kysely, complementada pelas decisões de checksum, tipos e drift | estratégia de persistência e gates documentais da 002-A definidos |
| ADR 0005 | `ACCEPTED` | sessão opaca sem refresh token passa a ser decisão arquitetural |
| ADR 0006 | `ACCEPTED` | modelo multiempresa/RBAC e mecânica RLS transacional são decisões arquiteturais aceitas |
| Usuário e empresa | associação muitos-para-muitos por `Membership` | encerra `DEC-002-002` quanto à cardinalidade |
| Empresa ativa | determinada e validada no servidor | nenhum `companyId` do cliente concede contexto |
| Papéis | `superadmin` global separado de `admin`/`staff` empresariais | planos de plataforma e tenant permanecem distintos |
| Autorização | negação por padrão | ausência de permissão sempre falha fechada |
| Superadmin e tenant | nenhum bypass implícito | acesso empresarial exige contexto e autorização explícitos |
| Evidência de isolamento | SQLite é insuficiente | validação final ocorre no PostgreSQL 14 |
| RLS PostgreSQL | role não-owner/`NOSUPERUSER`/`NOBYPASSRLS`, `ENABLE` + `FORCE`, `USING` + `WITH CHECK` e `set_config(..., true)` transacional | encerra o gate técnico de isolamento, sem substituir autorização |
| Planos de acesso | contexts, pools, roles e repositories tenant/plataforma separados | operações globais iteram tenants ou usam caminho global auditado |
| Normalização de e-mail | persistir original e normalizado; trim, NFC, lowercase independente de locale e IDNA no domínio; preservar pontos e `+`; sem regra de provedor ou `citext` como fonte | autenticação e unicidade usam uma representação determinística e testável |
| Checksum | SHA-256 sobre UTF-8 canonicalizado por `v1`, removendo BOM e normalizando quebras para LF; metadados completos e falha por divergência | migration aplicada é imutável e a API não executa migrations no startup |
| Tipos | `MoneyDecimal`/`BigInt` escala 4, mappings explícitos de decimal, UUID, timestamp UTC e JSON validado | `numeric` nunca vira `number` e tipos de infraestrutura não escapam ao domínio |
| Drift | migrations são a fonte de verdade; futuro `db:verify` verifica histórico, checksums e catálogo PostgreSQL sem corrigir automaticamente | drift falha e sua correção exige nova migration |
| Controlador | 002-A `PRONTA_PARA_IMPLEMENTAR` e próxima spec ativa; SPEC 002 em especificação; 002-B–G e 003 bloqueadas | esta revisão não implementa código; somente a próxima execução explicitamente autorizada pode iniciar a 002-A |

### 25.2 Dúvidas e decisões restantes

| ID | Criticidade | Dúvida/decisão | Recomendação atual | Gate |
|---|---|---|---|---|
| DEC-002-004 | Crítica | matriz e delegação de permissões | negação por padrão já foi aceita; aprovar códigos, ações e capacidade delegável | 002-D |
| DEC-002-006 | Crítica | MFA de `superadmin` | exigir MFA antes de uso administrativo; tecnologia a decidir | 002-E |
| DEC-002-007 | Alta | sessão | aceitar 30 min ociosa/12 h absoluta ou definir outros valores | 002-B |
| DEC-002-008 | Alta | política de senha | aceitar baseline NIST/Argon2id e benchmark | 002-B |
| DEC-002-009 | Alta | bootstrap e ativação | link de uso único por canal fora de banda, sem senha fixa | 002-E |
| DEC-002-010 | Alta | recuperação de senha | escolher provedor de e-mail, origem de URL, bounce e suporte | 002-B/E |
| DEC-002-011 | Alta | papéis customizados | suportar no schema e adiar UI/criação funcional | 002-D |
| DEC-002-012 | Alta | auditoria | definir retenção, leitura, exportação e dados pessoais | 002-E |
| DEC-002-014 | Alta | último admin de empresa bloqueada | preservar admin ou permitir exceção somente ao bloquear tenant | 002-C/D |
| DEC-002-015 | Média | sessões do usuário | decidir se a primeira versão lista dispositivos/sessões individuais | 002-B/F |
| DEC-002-016 | Média | mudança de empresa | confirmar seleção automática quando houver exatamente uma membership | 002-C/F |
| DEC-002-017 | Média | dados cadastrais da empresa | definir campos mínimos sem antecipar fiscal/faturamento | 002-C |
| DEC-002-019 | Média | performance RLS, PgBouncer e failover | manter fora do escopo inicial e criar gates próprios antes de pré-produção quando a topologia estiver definida | 002-G/pré-produção |

## 26. Riscos

| Risco | Impacto | Mitigação proposta |
|---|---|---|
| filtro de tenant esquecido | vazamento crítico | `TenantContext` obrigatório, FK composta, RLS e testes negativos |
| RLS mal configurada no pool | vazamento entre requisições | mecânica validada no spike, transação + configuração local, role sem bypass e fitness functions concorrentes |
| credencial da role tenant exposta | atacante pode definir UUID arbitrário em `set_config` | secret exclusivo do backend, menor privilégio, rotação e empresa validada antes da transação |
| topologia futura divergir do spike | comportamento/performance com PgBouncer ou failover não comprovados | pendência separada e testes próprios antes de pré-produção |
| claims/permissões obsoletas | elevação após revogação | sessão servidor, versão de autorização e invalidação imediata |
| `superadmin` virar bypass universal | acesso indevido a clientes | planos e repositories separados, sem contexto nulo/sentinela |
| enumeração por login/reset | descoberta de contas | resposta/tempo genéricos, dummy hash e rate limit |
| roubo/fixação de sessão | tomada de conta | token forte, hash no banco, cookie seguro, rotação e CSRF |
| bloqueio automático abusável | DoS contra usuário | throttling temporário por múltiplas chaves, bloqueio admin separado |
| último admin removido em corrida | empresa sem administração | transação, lock/constraint apropriada e teste concorrente |
| bootstrap vazado ou repetido | controle total da plataforma | operação única desabilitada, canal fora de banda e MFA |
| abstração de banco vazar ao domínio | acoplamento e regras frágeis | portas, mappers e limites arquiteturais |
| SQLite produzir falsa confiança | falha em produção | PostgreSQL 14 obrigatório para migrations, RLS e concorrência |
| auditoria guardar dados sensíveis | incidente e risco legal | allowlist de metadados, sanitização e retenção aprovada |

## 27. Estado de prontidão e próximo gate

A decomposição A–G está registrada em `docs/sdd/002/` e esta SPEC permanece o
agregador da iniciativa. As ADRs 0004, 0005 e 0006 foram aceitas; os spikes de
persistência e RLS foram concluídos no PostgreSQL 14 e a mecânica RLS foi aceita
humanamente. O gate técnico de isolamento está encerrado.

A iniciativa continua **não pronta para implementação integral** e a SPEC 002
permanece `EM_ESPECIFICACAO`. As decisões de normalização de e-mail, checksum,
tipos e detecção de drift encerraram os últimos bloqueios críticos próprios da
002-A, que passa a `PRONTA_PARA_IMPLEMENTAR`. A pendência futura de performance
RLS, PgBouncer e failover permanece aberta sem bloquear esse primeiro incremento.
002-B–G e a SPEC 003 mantêm o estado `BLOQUEADA`; nenhum deles avança sem concluir os
gates anteriores e receber autorização humana explícita.
