# SPEC 002 — Identidade, Autorização e Multiempresa

## Status
DRAFT

## Dependências
- SPEC 001

## 1. Objetivo

Implementar autenticação, sessão, usuários, empresas, vínculos, papéis, permissões e isolamento multiempresa.

## 2. Escopo

- cadastro e manutenção de empresas;
- usuários;
- membership entre usuário e empresa;
- papéis;
- permissões;
- login;
- logout;
- refresh/revogação;
- recuperação de acesso;
- contexto da empresa;
- autorização no backend;
- trilha de auditoria inicial.

## 3. Entidades

- User;
- Company;
- Membership;
- Role;
- Permission;
- Session;
- PasswordResetToken;
- AuditLog.

## 4. Papéis iniciais

- `superadmin`;
- `admin`;
- `staff`.

## 5. Regras de negócio

- usuários comuns devem pertencer a pelo menos uma empresa ativa;
- `superadmin` pode operar globalmente;
- `admin` só administra a própria empresa;
- `staff` acessa apenas permissões concedidas;
- o `companyId` efetivo deve ser validado a partir da sessão;
- usuário de uma empresa não pode inferir a existência de recursos de outra;
- mudanças de papel e permissão são auditadas;
- contas inativas não podem autenticar;
- empresa inativa bloqueia o acesso operacional;
- tokens e sessões devem expirar e poder ser revogados.

## 6. Requisitos de segurança

- hash de senha forte;
- rate limiting;
- proteção contra força bruta;
- mensagens de erro sem enumeração de usuário;
- tokens com expiração;
- secrets fora do repositório;
- cookies seguros quando aplicável;
- CORS restrito;
- logs sem senha ou token;
- verificação de autorização no caso de uso e/ou camada apropriada do backend.

## 7. API mínima

- `POST /api/v1/auth/login`;
- `POST /api/v1/auth/logout`;
- `POST /api/v1/auth/refresh`;
- `POST /api/v1/auth/forgot-password`;
- `POST /api/v1/auth/reset-password`;
- CRUD controlado de empresas;
- CRUD controlado de usuários;
- gestão de memberships;
- consulta das permissões efetivas.

## 8. Critérios de aceite

- [ ] Login válido cria sessão.
- [ ] Login inválido não revela se o usuário existe.
- [ ] Usuário inativo é bloqueado.
- [ ] Empresa inativa é bloqueada.
- [ ] Admin da empresa A não acessa empresa B.
- [ ] Staff não acessa funções administrativas sem permissão.
- [ ] Superadmin possui visão global auditada.
- [ ] Alteração de papel gera auditoria.
- [ ] Logout revoga sessão.
- [ ] Testes de isolamento multiempresa passam.
- [ ] Testes de autorização por papel passam.

## 9. Casos de teste obrigatórios

- acesso cruzado entre empresas;
- IDOR;
- elevação de privilégio;
- token expirado;
- sessão revogada;
- empresa desativada;
- usuário desativado;
- rate limiting;
- redefinição de senha;
- permissões insuficientes.
