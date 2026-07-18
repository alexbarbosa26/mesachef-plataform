# SPEC 002-F — Frontend de login e seleção de empresa

## Status

- **Estado:** `BLOQUEADA`
- **Atualização:** 2026-07-18
- **Implementação autorizada:** não
- **Bloqueio principal:** contratos e comportamentos de 002-B–E ainda não estão
  implementados e validados.

## Contexto

O frontend precisa oferecer login, recuperação e seleção de empresa sem se
tornar fonte de verdade para autenticação ou autorização. Toda decisão vem da
API; esconder menu é apenas experiência. A interface deve tratar estados
assíncronos, evitar duplo envio e não armazenar tokens de sessão.

## Objetivo

Entregar os fluxos web mínimos de autenticação e entrada no tenant com
acessibilidade, respostas genéricas e integração real aos contratos seguros da
API.

## Dependências

- 002-B, 002-C, 002-D e 002-E concluídas ou contratos explicitamente estáveis
  e em validação;
- fluxos, textos e estados de bloqueio aprovados pelo produto;
- tokens visuais/acessibilidade da SPEC 003 somente quando indispensáveis e
  sem desbloquear a SPEC 003 inteira;
- contrato de CSRF/cookie/CORS validado em ambiente local;
- autorização explícita para implementar 002-F.

## Entradas

- OpenAPI/DTOs de autenticação, sessão, empresas e permissões;
- cliente HTTP e padrões assíncronos da fundação;
- identidade visual aprovada sem copiar componentes do legado;
- mensagens genéricas de segurança;
- critérios WCAG adotados pelo projeto.

## Escopo

- tela de login;
- solicitação de recuperação;
- redefinição de senha por token;
- bootstrap da sessão ao carregar a aplicação;
- tela/estado de seleção de empresa;
- seleção automática apenas se a regra humana for aprovada;
- estados sem membership, bloqueio genérico e suporte;
- logout e expiração visual da sessão;
- cliente API tipado para contratos da SPEC 002;
- tratamento de loading, erro, sucesso, repetição e offline;
- prevenção de duplo clique/múltiplos envios;
- acessibilidade por teclado, foco e leitores de tela;
- uso das permissões retornadas apenas para orientar a UI.

## Fora de escopo

- dashboard, layout completo ou módulos da SPEC 003;
- telas administrativas de empresa, usuário, papel ou auditoria;
- criação pública de empresa;
- armazenamento de token em local/session storage;
- decisão de autorização no cliente;
- acesso direto ao banco/Supabase;
- login social, MFA UI não aprovada, PWA offline com gravação;
- migração visual literal ou cópia de componentes do legado.

## Modelo de domínio

O frontend não replica agregados. Ele usa modelos de apresentação derivados de
DTOs:

- `AuthFormState`;
- `PasswordRecoveryState`;
- `SessionView`;
- `SelectableCompanyView`;
- `ActiveTenantView`;
- `PermissionView` apenas para affordances;
- `AsyncActionState` discriminado (`idle`, `submitting`, `success`, `error`).

Regras críticas permanecem no backend. Schemas de formulário validam entrada e
experiência, mas não substituem validação da API.

## Invariantes

1. Cookie de sessão é gerenciado pelo navegador e nunca lido/armazenado pelo
   JavaScript da aplicação.
2. Frontend não cria `userId`, papel, permissão ou tenant confiável.
3. Lista de empresas e empresa ativa sempre vêm da API.
4. Seleção envia somente o ID solicitado; sucesso depende da validação do
   servidor e da sessão rotacionada.
5. UI nunca distingue usuário inexistente, senha inválida ou bloqueio a partir
   de mensagens não autorizadas.
6. Permissão na UI oculta/desabilita ações, mas URL direta continua protegida
   pelo backend.
7. Uma ação mutável não pode ser enviada novamente enquanto a primeira estiver
   pendente, salvo retry explícito após resultado.
8. Token de reset não aparece em analytics, logs ou mensagens.
9. Estado de sessão é limpo em `401`, logout e expiração.
10. Falha de rede não é tratada como credencial inválida.

## Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-002F-001 | Usuário deve enviar e-mail/senha e receber resultado genérico de autenticação. |
| RF-002F-002 | Aplicação deve consultar sessão existente antes de decidir a rota inicial. |
| RF-002F-003 | Usuário com várias empresas deve escolher entre as opções fornecidas pelo backend. |
| RF-002F-004 | Usuário sem empresa elegível deve receber estado seguro orientado ao suporte. |
| RF-002F-005 | Seleção válida deve atualizar o estado somente após resposta do servidor. |
| RF-002F-006 | Forgot password deve exibir confirmação genérica independentemente da conta. |
| RF-002F-007 | Reset deve tratar token válido, inválido/expirado e sucesso sem login automático. |
| RF-002F-008 | Logout deve encerrar a sessão e limpar caches sensíveis do cliente. |
| RF-002F-009 | Erro `401` deve levar a estado autenticável sem loop de requisições. |
| RF-002F-010 | Ações devem expor loading, erro recuperável, sucesso e retry seguro. |

## Requisitos não funcionais

- React/Vite/TypeScript conforme fundação e componentes acessíveis;
- formulários com rótulos, erros associados, foco previsível e navegação por
  teclado;
- layout responsivo sem sacrificar legibilidade;
- nenhum dado sensível em analytics, console ou persistência do navegador;
- bundles não incluem driver de banco, Kysely, Supabase Client ou secrets;
- cliente HTTP centraliza base URL, credentials, CSRF e correlation ID;
- mensagens em português claras e não enumeráveis;
- testes confiáveis não dependem de timers/rede reais quando desnecessário.

## Persistência

Não há persistência de negócio no frontend. Permitido somente:

- cache em memória da sessão/queries conforme política de invalidação;
- preferências visuais não sensíveis, quando aprovadas;
- nenhuma sessão, token, senha, membership ou permissão em armazenamento
  persistente do navegador.

## Segurança

- requisições autenticadas usam cookies com `credentials` configurado pelo
  cliente central;
- mutações incluem token/header CSRF do contrato aprovado;
- UI não ecoa payload inválido nem detalhe técnico da API;
- token de reset é consumido de forma minimizada e removido da navegação quando
  possível sem quebrar o fluxo;
- política de referrer/analytics impede vazamento de URL de reset;
- conteúdo retornado é renderizado como texto, sem HTML não confiável;
- caches são limpos ao trocar empresa, fazer logout ou receber revogação;
- `companyId` local jamais habilita rota/ação sem sessão confirmada;
- erros `403`/`404` não revelam dados de outro tenant.

## Contratos

Consome, sem redefinir:

- `POST /api/v1/auth/login`;
- `GET /api/v1/auth/session`;
- `POST /api/v1/auth/logout`;
- `POST /api/v1/auth/forgot-password`;
- `POST /api/v1/auth/reset-password`;
- `GET /api/v1/me/companies`;
- `POST /api/v1/auth/select-company`;
- `GET /api/v1/me/permissions`.

O cliente valida schemas de resposta e converte o envelope de erro para estados
de apresentação. Campos desconhecidos não viram autoridade; respostas inválidas
falham de modo controlado.

## Migrations

`N/A`. Este incremento não cria nem altera schema. Qualquer necessidade de
persistência servidor deve voltar à sub-spec backend correspondente e receber
nova migration versionada; não pode ser resolvida pelo frontend.

## Testes obrigatórios

- login loading/sucesso/erro genérico e duplo clique;
- resposta inválida/timeout/offline sem enumerar conta;
- sessão existente, expirada, revogada e API indisponível;
- zero, uma e várias empresas conforme regra aprovada;
- seleção própria, resposta negada e rotação refletida por nova consulta;
- troca de tenant limpa caches e permissões anteriores;
- forgot/reset e remoção segura do token da navegação;
- logout limpa estado/cache e evita retry indevido;
- CSRF presente nas mutações e ausente em leituras;
- URL direta/elemento oculto não concede autorização;
- acessibilidade automatizada e manual: teclado, foco, labels, contraste e
  anúncio de erros;
- responsividade nos breakpoints aprovados;
- nenhum token/secret em storage, console, analytics ou bundle;
- integração contra API real local, lint, typecheck, testes e build.

## Critérios de aceite

- [ ] fluxos usam somente contratos estáveis da API;
- [ ] sessão/token não são persistidos ou expostos ao JavaScript;
- [ ] empresa ativa e permissões são confirmadas pelo servidor;
- [ ] respostas não enumeram usuário ou tenant;
- [ ] loading/erro/sucesso/retry e duplo envio estão cobertos;
- [ ] acessibilidade e responsividade passam;
- [ ] caches são invalidados em troca/logout/revogação;
- [ ] nenhuma tela administrativa/dashboard foi antecipada;
- [ ] lint, typecheck, testes, build e auditoria de bundle/secrets passam.

## Gate de saída

002-F só é concluída após testes de integração com backend real local, revisão
de segurança do navegador e evidência de acessibilidade. Conclusão não libera
SPEC 003 nem 002-G automaticamente.

## Rollback

- reverter o bundle/feature flag sem alterar schema ou credenciais;
- forçar nova consulta de sessão e limpar caches ao detectar versão incompatível;
- manter endpoints antigos apenas durante janela versionada aprovada;
- nunca relaxar cookie, CSRF ou autorização para preservar compatibilidade;
- tokens de reset continuam controlados pelo backend durante rollback visual.

## Pendências

- textos oficiais para falha/bloqueio/sem membership;
- regra de seleção automática com uma empresa;
- identidade visual e critérios WCAG finais;
- comportamento de offline/retry;
- política de analytics e referrer no fluxo de reset;
- compatibilidade navegadores/dispositivos alvo.
