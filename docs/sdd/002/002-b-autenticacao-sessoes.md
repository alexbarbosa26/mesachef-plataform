# SPEC 002-B — Autenticação e sessões

## Status

- **Estado:** `BLOQUEADA`
- **Atualização:** 2026-07-18
- **Implementação autorizada:** não
- **Bloqueio principal:** 002-A não concluída e parâmetros operacionais da ADR
  0005 ainda não aprovados.

## Contexto

Com a persistência de identidade disponível, a plataforma precisa autenticar
por e-mail/senha e manter sessão web revogável sob controle do servidor. A ADR
0005 escolheu sessão opaca em cookie e rejeitou refresh token para a aplicação
web inicial. Este incremento implementará o backend de autenticação; a empresa
ativa e o RBAC empresarial pertencem aos incrementos seguintes.

## Objetivo

Entregar login, sessão opaca, logout, revogação, recuperação de senha, proteção
CSRF e throttling com respostas resistentes a enumeração, sem selecionar tenant
ou conceder autorização empresarial.

## Dependências

- 002-A `CONCLUIDA`;
- ADR 0005 `ACCEPTED`;
- TTL ocioso e absoluto aprovados;
- parâmetros Argon2id definidos por benchmark;
- política de senha aprovada;
- estratégia de rate limiting para uma/múltiplas instâncias aprovada;
- provedor/canal de recuperação definido ou adapter fake explicitamente
  limitado para desenvolvimento;
- threat model de login, reset, cookie e CSRF revisado;
- autorização explícita para implementar 002-B.

## Entradas

- modelo de `User` e `PasswordCredential` da 002-A;
- runner transacional e repositories globais da 002-A;
- ADR 0005;
- contratos agregados da SPEC 002;
- política de erros/correlation ID da SPEC 001.

## Escopo

- criação e verificação segura de credencial local;
- login por e-mail e senha;
- sessão opaca persistida no servidor;
- cookie seguro e rotação do identificador;
- consulta da sessão autenticada sem tenant ativo;
- logout atual e logout global;
- expiração ociosa/absoluta e revogação;
- proteção CSRF das operações autenticadas mutáveis;
- solicitação e consumo de reset de senha;
- buckets de throttling e proteção contra força bruta;
- job idempotente de limpeza de sessões/tokens expirados;
- auditoria técnica mínima sem segredos, integrada ao incremento E quando
  disponível;
- contratos HTTP e testes de autenticação.

## Fora de escopo

- criação/gestão de empresa e membership;
- seleção ou troca de empresa ativa;
- `TenantContext`, permissões empresariais ou RBAC final;
- administração de usuários por endpoints de plataforma;
- bootstrap de `superadmin` e MFA;
- telas de login/recuperação;
- login social, OIDC, OAuth, passkeys ou refresh token;
- envio de e-mail produtivo sem provedor aprovado;
- migração de hashes/usuários do legado.

## Modelo de domínio

- `PasswordCredential`: hash Argon2id versionado e instante de alteração;
- `Session`: token hash, usuário, expirações, última atividade, versão de
  autorização e revogação;
- `PasswordResetToken`: token hash de uso único, expiração e consumo;
- `AuthThrottleBucket`: chave opaca, categoria, janela, contagem e expiração;
- `AuthenticationAttempt`: resultado sanitizado para observabilidade;
- `SessionToken` e `ResetToken`: valores aleatórios que só existem em claro na
  borda necessária e nunca são persistidos.

`Session` nasce sem empresa ativa. Campos empresariais serão adicionados e
validados na 002-C.

## Invariantes

1. Senha, token em claro e segredo nunca são persistidos ou logados.
2. E-mail é normalizado pela única regra aprovada na 002-A antes da consulta.
3. Usuário inexistente, senha errada e usuário bloqueado têm resposta externa
   equivalente.
4. Somente usuário `ACTIVE` pode receber sessão.
5. Token de sessão tem entropia mínima de 256 bits e somente seu hash é salvo.
6. Sessão expirada ou revogada nunca é aceita, mesmo antes do cleanup físico.
7. Expiração absoluta nunca é estendida pela atividade.
8. Login, reset, reautenticação futura e mudança de privilégio rotacionam ou
   revogam conforme ADR 0005.
9. Reset é único, atômico, expira e revoga sessões/tokens remanescentes.
10. Reset bem-sucedido não autentica automaticamente.
11. Throttling automático não altera `User.status` nem vira bloqueio permanente.
12. Operação mutável autenticada com cookie exige CSRF válido.
13. Não existe endpoint de refresh token.

## Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-002B-001 | Login válido deve verificar a credencial e criar sessão opaca rotacionada. |
| RF-002B-002 | Login inválido deve responder genericamente e executar trabalho de hash equivalente para usuário inexistente. |
| RF-002B-003 | Consulta da sessão deve retornar somente identidade mínima e estado autenticado, sem credenciais. |
| RF-002B-004 | Logout deve revogar a sessão atual e expirar o cookie. |
| RF-002B-005 | Logout global deve revogar todas as sessões do usuário de modo transacional. |
| RF-002B-006 | A validade deve considerar expiração ociosa, absoluta, revogação e versão de autorização. |
| RF-002B-007 | Forgot password deve sempre responder de forma genérica e aplicar rate limiting. |
| RF-002B-008 | Reset válido deve trocar hash, consumir token e revogar sessões atomicamente. |
| RF-002B-009 | O backend deve rejeitar mutação autenticada sem CSRF/origem válidos. |
| RF-002B-010 | Cleanup deve ser idempotente e não ser necessário para considerar registro expirado inválido. |

## Requisitos não funcionais

- Argon2id medido no ambiente alvo, com parâmetros versionados e rehash
  oportunista;
- comparação e respostas desenhadas contra enumeração temporal;
- cookies de produção `__Host-`, `HttpOnly`, `Secure`, `Path=/`, sem `Domain` e
  `SameSite=Lax` salvo nova decisão;
- tokens gerados por CSPRNG, nunca por UUID previsível;
- rate limiting semanticamente consistente entre instâncias;
- readiness reflete indisponibilidade do storage de sessão;
- métricas não usam e-mail/IP em claro como label;
- atualização de `lastSeenAt` limitada para não gravar a cada request;
- erros padronizados e correlation ID sem stack trace.

## Persistência

- `identity.sessions`: hash único, usuário, criação, última atividade,
  expirações, versão e revogação;
- `identity.password_reset_tokens`: hash único, usuário, emissão, expiração,
  consumo e revogação;
- `identity.auth_throttle_buckets`: chave opaca, tipo, janela, contador e
  expiração, com atualização concorrente atômica;
- evolução de `identity.password_credentials` para parâmetros Argon2id
  versionados;
- índices para lookup por token hash, sessões ativas por usuário e limpeza por
  expiração.

Essas tabelas são globais de identidade e não recebem `company_id`. Grants são
restritos ao plano de identidade, sem transformá-las em caminho de plataforma
genérico.

## Segurança

- payload validado por tamanho, forma e semântica antes do hash caro;
- limite combinado por conta normalizada e origem obtida apenas de proxy
  confiável;
- senha comprometida verificada por mecanismo que não a revele;
- origem de URL de reset vem de configuração allowlisted, não de `Host` livre;
- resposta de login/reset não diferencia existência ou bloqueio;
- token não aparece em log, evento, erro ou corpo após consumo;
- CSRF usa token vinculado à sessão, header não simples, origem e content type;
- CORS restrito e mutações proibidas em `GET`;
- sessões são revogadas em bloqueio de usuário, reset e incidente;
- metadados de IP/user-agent são minimizados e não constituem autenticação.

## Contratos

| Método e rota | Entrada | Saída/efeito |
|---|---|---|
| `POST /api/v1/auth/login` | `email`, `password` | `200` + cookie ou erro genérico |
| `GET /api/v1/auth/session` | cookie | identidade mínima, sem tenant ativo |
| `POST /api/v1/auth/logout` | cookie + CSRF | `204`, revogação e expiração do cookie |
| `POST /api/v1/auth/logout-all` | cookie + CSRF + confirmação | `204`, todas as sessões revogadas |
| `POST /api/v1/auth/forgot-password` | `email` | sempre `202` compatível com resposta genérica |
| `POST /api/v1/auth/reset-password` | `token`, `newPassword` | `204`, sem login automático |

Não existe `/auth/refresh`, seleção de empresa ou retorno de permissões neste
incremento. DTOs não expõem status interno, hash, motivo de bloqueio ou
existência de conta.

## Migrations

1. criar tabelas de sessão, reset e throttling;
2. adicionar índices/constraints de unicidade e expiração;
3. versionar parâmetros de credencial sem criar senha padrão;
4. registrar migrations/checksums pelo runner da 002-A;
5. qualquer `down` que descarte sessão/token é somente para ambiente controlado
   e precisa declarar impacto.

## Testes obrigatórios

- login válido, senha inválida, usuário inexistente, bloqueado e desativado;
- equivalência observável de status/corpo e tolerância temporal dos erros;
- dummy hash para conta inexistente;
- parâmetros Argon2id, rehash e senha Unicode/longa nos limites aprovados;
- cookie e headers seguros em produção e falha de configuração insegura;
- rotação, revogação, expiração ociosa e absoluta;
- logout atual/global concorrente;
- sessão inválida quando storage está indisponível;
- forgot/reset válido, expirado, consumido, concorrente e repetido;
- reset atômico revoga sessões e não cria login;
- CSRF ausente, inválido, origem indevida e content type indevido;
- limites por conta/IP, concorrência e recuperação após janela;
- logs, métricas e auditoria sem senha/token/PII desnecessária;
- migrations em PostgreSQL 14 vazio e representativo;
- lint, limites arquiteturais, typecheck, testes, build, dependências e secrets.

## Critérios de aceite

- [ ] decisões operacionais da ADR 0005 aprovadas;
- [ ] login/reset não enumeram contas;
- [ ] sessão opaca é rotacionável, expirável e revogável;
- [ ] cookie e CSRF atendem a política de produção;
- [ ] bloqueio/reset invalidam sessões imediatamente;
- [ ] throttling funciona sob concorrência sem bloqueio permanente da vítima;
- [ ] nenhum refresh token ou tenant ativo foi implementado;
- [ ] testes/migrations passam no PostgreSQL 14;
- [ ] qualidade, secrets e documentação passam.

## Gate de saída

002-B só pode ser concluída com evidência executável dos fluxos positivos e
negativos, parâmetros humanos aprovados e ausência de funcionalidade de 002-C
em diante. A conclusão não libera automaticamente a 002-C.

## Rollback

- desabilitar endpoints por configuração e revogar sessões emitidas pela versão
  afetada;
- preservar usuários e hashes; corrigir schema por migration forward;
- tokens de reset emitidos por versão insegura devem ser revogados;
- rollback do cookie não pode reduzir seus atributos de produção;
- indisponibilidade segura deve negar autenticação, não aceitar sessão sem
  validação.

## Pendências

- aceitar TTL ocioso/absoluto;
- aprovar política de senha e benchmark Argon2id;
- decidir rate limiting distribuído e proxies confiáveis;
- selecionar provedor, origem e runbook de entrega de recuperação;
- decidir se múltiplas sessões serão listáveis na primeira versão;
- MFA e bootstrap permanecem para 002-E.
