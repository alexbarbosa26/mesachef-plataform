# ADR 0005 — Autenticação, sessões e tokens

## Status

PROPOSED

## Data

2026-07-18

## Contexto

A SPEC 002 precisa autenticar pessoas por e-mail e senha em uma aplicação web própria, permitir revogação imediata, suportar troca segura de empresa ativa e evitar que credenciais ou contexto de tenant sejam confiados ao navegador. A decisão deve funcionar no monólito modular, manter o backend como fonte da verdade e deixar uma eventual API para clientes não web como decisão futura.

O projeto de referência utiliza autenticação gerenciada pelo Supabase. A nova plataforma não herdará essa implementação nem seus tokens. Esta ADR também não autoriza criar endpoints, tabelas, migrations, segredos ou um primeiro usuário real.

## Drivers priorizados

1. revogação efetiva e bloqueio imediato de usuário ou empresa;
2. resistência a roubo, fixação e reutilização de sessão;
3. simplicidade operacional para a aplicação web de primeira parte;
4. compatibilidade com autenticação por cookie e proteção explícita contra CSRF;
5. ausência de segredos e dados sensíveis em logs, URLs e armazenamento do navegador.

## Alternativas avaliadas

### A. Sessão opaca persistida no servidor

O navegador recebe apenas um identificador aleatório em cookie; o servidor armazena o hash desse identificador e o estado da sessão.

**Vantagens**

- revogação, bloqueio e logout têm efeito imediato;
- empresa ativa, versão de autorização e datas de expiração ficam sob controle do servidor;
- o cliente não recebe claims de autorização potencialmente desatualizadas;
- rotação e invalidação seletiva são simples de modelar;
- reduz a complexidade de access token e refresh token em uma SPA de primeira parte.

**Riscos e custos**

- cada requisição autenticada consulta um armazenamento de sessão;
- exige limpeza de sessões expiradas e índices adequados;
- cookie automático exige proteção contra CSRF;
- indisponibilidade do banco afeta autenticação, o que deve aparecer no readiness.

### B. Access token JWT curto e refresh token rotativo

**Vantagens**

- access token pode ser validado sem consulta de sessão em alguns desenhos;
- é comum em APIs consumidas por clientes distintos;
- refresh token permite renovar access tokens curtos.

**Riscos e custos**

- revogação imediata ainda exige estado, lista de revogação ou versão de credencial;
- claims de papel, permissão e empresa podem ficar desatualizadas;
- rotação, detecção de reuse e famílias de refresh tokens ampliam estados e casos de falha;
- armazenamento no navegador aumenta a superfície de exposição; cookie continua exigindo CSRF;
- não há benefício operacional relevante para o monólito web atual que compense a complexidade.

### C. JWT de longa duração sem estado

**Vantagens**

- validação local simples;
- menor consulta ao banco por requisição.

**Riscos e custos**

- bloqueio, troca de papel e logout não revogam o token de imediato;
- aumenta a janela de impacto de um token roubado;
- estimula autorização baseada em claims antigas;
- conflita com os requisitos de revogação e bloqueio da SPEC 002.

## Decisão proposta

Adotar **sessão opaca persistida no servidor** para a aplicação web de primeira parte.

### Identificador e cookie

- gerar pelo menos 256 bits aleatórios com gerador criptograficamente seguro;
- enviar o valor somente no cookie `__Host-mesachef_session`;
- configurar `HttpOnly`, `Secure`, `Path=/` e ausência de `Domain`;
- usar `SameSite=Lax` como padrão inicial; qualquer necessidade de `SameSite=None` exige nova análise;
- armazenar no banco apenas um hash criptográfico do identificador;
- nunca enviar identificadores de sessão em URL, payload de resposta, local storage ou logs;
- regenerar o identificador após autenticação e em toda mudança relevante de privilégio ou contexto.

Em desenvolvimento HTTP local, uma configuração explicitamente não produtiva poderá usar nome e atributo compatíveis com o ambiente. O modo de produção deve falhar ao iniciar se a política segura do cookie não puder ser aplicada.

### Estado da sessão

Uma sessão contém, conceitualmente:

- `id` interno;
- `tokenHash` único;
- `userId`;
- `activeCompanyId` e `activeMembershipId`, ambos nulos antes da seleção válida;
- `authorizationVersion` ou mecanismo equivalente para detectar mudanças críticas;
- `createdAt`, `lastSeenAt`, `idleExpiresAt` e `absoluteExpiresAt`;
- `revokedAt` e `revokeReason`;
- metadados minimizados de segurança, como hash de IP quando justificado e resumo de user-agent.

IP e user-agent não são fatores únicos de autenticação e não podem bloquear legitimamente um usuário apenas por mudança de rede ou navegador.

### Expiração, rotação e revogação

- proposta inicial: expiração por inatividade de 30 minutos e absoluta de 12 horas;
- os tempos são configuração de segurança e precisam de aceite antes da implementação;
- atualizar `lastSeenAt` com limitação de frequência para evitar uma escrita por requisição;
- rotacionar a sessão no login, recuperação de senha, reautenticação, mudança de empresa ativa e elevação de privilégio;
- revogar a sessão corrente no logout;
- oferecer revogação de todas as sessões do usuário, preservando ou não a corrente conforme o caso de uso explícito;
- revogar todas as sessões após redefinição de senha, bloqueio do usuário ou incidente de credencial;
- invalidar o contexto de empresa quando membership ou empresa deixar de estar ativa;
- remover sessões expiradas por job idempotente; expiração é aplicada mesmo antes da limpeza física.

### Refresh token

Não adotar refresh token na aplicação web inicial. O cookie opaco já representa uma sessão renovável dentro de limites de inatividade e expiração absoluta. Um cliente móvel, integração pública ou arquitetura distribuída futura deverá ter ADR própria para OAuth/OIDC, access tokens e rotação de refresh token.

### Autenticação por e-mail e senha

- e-mail é normalizado por uma regra única e comparado por chave normalizada globalmente única;
- senha é armazenada somente como hash **Argon2id** com parâmetros versionados;
- os parâmetros mínimos devem ser medidos no ambiente de execução e atender, no mínimo, à recomendação vigente adotada pelo projeto;
- aceitar senhas longas, espaços, colagem e todos os caracteres Unicode normalizados de modo documentado;
- proposta inicial para autenticação de fator único: mínimo de 15 caracteres e máximo aceito de pelo menos 64 caracteres, sem regras arbitrárias de composição;
- verificar novas senhas contra lista de senhas comuns ou comprometidas por mecanismo que não revele a senha;
- não exigir troca periódica sem evidência de comprometimento;
- respostas de login não distinguem usuário inexistente, senha inválida ou conta bloqueada;
- executar verificação de hash de custo equivalente também quando o usuário não existir, reduzindo enumeração por tempo.

### Proteção contra CSRF

Como o navegador envia cookies automaticamente, `SameSite` é defesa em profundidade, não a única proteção. Toda operação mutável autenticada deve exigir:

- origem permitida por CORS e validação de `Origin`/`Referer` conforme aplicável;
- token anti-CSRF vinculado à sessão e enviado em header não simples;
- métodos HTTP corretos, sem mutação em `GET`;
- content types aceitos explicitamente.

### Recuperação de senha

- a solicitação sempre responde de forma genérica e com tempo aproximadamente uniforme;
- limitar por conta normalizada e IP, sem revelar se o e-mail existe;
- gerar token aleatório de pelo menos 256 bits, armazenando apenas seu hash;
- token de uso único, com validade proposta de 30 minutos;
- invalidar tokens anteriores ao emitir um novo, conforme regra transacional;
- construir a URL a partir de configuração confiável, nunca do header `Host` sem validação;
- não registrar token nem incluir dados sensíveis na URL além do token opaco;
- ao concluir, alterar a senha, revogar sessões e tokens restantes e não autenticar automaticamente;
- notificar o titular após a alteração sem incluir a nova senha.

O provedor de entrega de e-mail e seu tratamento de bounce constituem decisão operacional ainda aberta.

### Bloqueio e força bruta

`User.status = BLOCKED` é uma decisão administrativa explícita e distinta do throttling automático. O bloqueio administrativo revoga sessões e impede login.

Para tentativas inválidas:

- usar buckets por identificador de conta normalizado e por origem de rede;
- aplicar atraso progressivo e janelas temporárias, nunca bloqueio administrativo permanente automático;
- manter a resposta genérica;
- registrar eventos de segurança sem senha, token ou e-mail em claro quando um hash estável for suficiente;
- proposta inicial para validação: 5 falhas por conta em 15 minutos e 20 falhas por IP em 15 minutos, seguida de espera progressiva;
- limites finais, infraestrutura distribuída e tratamento de proxies confiáveis dependem de teste e aceite.

### Bootstrap do primeiro superadmin

Não haverá endpoint público, usuário padrão nem credencial em arquivo. O bootstrap será uma operação administrativa única e auditável, com estas propriedades:

- comando interno/CLI executado explicitamente, desabilitado por padrão;
- segredo de habilitação fornecido fora do Git e consumido uma única vez;
- transação e lock que impeçam dois primeiros superadmins concorrentes;
- recusa se já existir qualquer atribuição ativa de `superadmin`;
- credencial inicial entregue por canal fora de banda ou fluxo de ativação de uso único;
- obrigatoriedade de troca/ativação e revogação do material de bootstrap;
- evento de auditoria sem segredo.

O canal de ativação e a exigência de MFA para superadmin precisam ser decididos antes da implementação do incremento 002-E.

## Consequências positivas

- revogação, bloqueio e mudança de empresa têm efeito centralizado;
- a aplicação não precisa implementar uma família de refresh tokens;
- permissões não são confiadas a claims mantidas pelo navegador;
- o desenho torna sessões administrativas observáveis e revogáveis.

## Consequências negativas

- o banco de sessão entra no caminho crítico de requisições autenticadas;
- proteção CSRF e limpeza de sessões precisam ser operadas corretamente;
- uma futura API pública demandará protocolo diferente ou extensão formal;
- parâmetros de senha, TTL e throttling precisam ser calibrados.

## Compliance e fitness functions

- nenhuma sessão válida sobrevive a bloqueio de usuário ou redefinição de senha;
- cookie de produção possui todos os atributos definidos nesta ADR;
- nenhum teste, log ou resposta contém senha, token ou hash de senha;
- testes comprovam rotação, expiração ociosa, expiração absoluta e revogação;
- testes comprovam resposta genérica e limitação de login/recuperação;
- operações mutáveis autenticadas falham sem proteção CSRF válida;
- empresa ativa inválida é removida da sessão e nunca aceita do payload como autoridade.

## Gates para aceitar esta ADR

- aprovar sessão opaca sem refresh token para a web;
- aprovar TTL ocioso e absoluto;
- aprovar política mínima de senha e parâmetros Argon2id após benchmark;
- definir MFA obrigatório ou controle compensatório para superadmin;
- definir canal de entrega da recuperação e ativação inicial;
- validar estratégia de rate limiting para uma ou várias instâncias;
- realizar threat model de login, reset, sessão, CSRF e bootstrap.

## Quando revisar

- surgimento de app móvel, API pública ou federação de identidade;
- implantação distribuída que exija armazenamento de sessão dedicado;
- exigência regulatória distinta de expiração ou autenticação forte;
- adoção de provedor OIDC externo;
- evidência operacional de que os limites geram abuso ou bloqueios indevidos.

## Fontes técnicas consultadas

- [NIST SP 800-63B-4 — Authentication and Authenticator Management](https://pages.nist.gov/800-63-4/sp800-63b.html)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

## Questões abertas

- O negócio aceita 30 minutos de inatividade e 12 horas de duração absoluta?
- MFA será obrigatório para todo superadmin já na SPEC 002?
- Qual serviço entregará e-mails de ativação e recuperação?
- O bootstrap criará credencial temporária ou enviará link de ativação de uso único?
- Haverá suporte a múltiplas sessões visíveis e revogáveis pelo usuário nesta primeira versão?
