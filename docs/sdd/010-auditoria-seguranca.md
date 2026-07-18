# SPEC 010 — Consolidação de Auditoria e Segurança

## Status
DRAFT

## Dependências
- SPEC 002 até SPEC 009

## 1. Objetivo

Consolidar controles de auditoria, observabilidade, hardening, gestão de secrets, autorização e revisão de segurança da plataforma.

## 2. Escopo

- trilha de auditoria;
- eventos críticos;
- correlation ID;
- políticas de retenção;
- mascaramento;
- revisão de autorização;
- rate limiting;
- headers;
- CORS;
- gestão de secrets;
- dependências;
- logs;
- alertas;
- checklist de segurança;
- testes negativos.

## 3. Eventos obrigatórios

- login administrativo;
- falha de autenticação relevante;
- criação e alteração de usuário;
- alteração de papel;
- criação e alteração de empresa;
- ajuste de estoque;
- alteração de preços;
- alteração de fichas;
- configuração WhatsApp;
- ação de superadmin;
- migração;
- exclusão lógica ou física.

## 4. Regras

- log de auditoria deve ser append-only no uso normal;
- dados sensíveis devem ser mascarados;
- logs de aplicação e auditoria têm finalidades distintas;
- todas as ações devem conter ator, empresa, data, ação e alvo;
- auditoria deve funcionar mesmo quando a ação falha, quando apropriado;
- acesso aos logs exige permissão;
- retenção deve ser configurável;
- exportação futura deve preservar integridade.

## 5. Requisitos de segurança

- OWASP ASVS como referência proporcional;
- verificação de dependências;
- nenhuma credencial no Git;
- menor privilégio no banco;
- conexão TLS em produção;
- backups protegidos;
- política de senha;
- rate limits;
- proteção contra IDOR;
- proteção contra injection;
- validação de upload;
- CSP quando aplicável;
- tratamento seguro de erros.

## 6. Critérios de aceite

- [ ] Eventos críticos são auditados.
- [ ] Logs não expõem secrets.
- [ ] Correlation ID está presente.
- [ ] CORS está restrito.
- [ ] Rate limiting está ativo.
- [ ] Testes de IDOR passam.
- [ ] Testes de elevação de privilégio passam.
- [ ] Dependências são analisadas.
- [ ] Checklist de segurança está preenchido.
- [ ] Acesso à auditoria é autorizado.
