# SPEC 001 — Fundação Técnica do Projeto

## Status
DRAFT

## Dependências
- SPEC 000
- ADR 0001
- ADR 0002
- ADR 0003

## 1. Objetivo

Criar a fundação técnica do novo MesaChef em monorepo, com frontend, backend, packages compartilhados, infraestrutura local, testes básicos e padrões de qualidade.

## 2. Escopo

- monorepo TypeScript;
- `apps/web`;
- `apps/api`;
- `packages/domain`;
- `packages/database`;
- `packages/shared`;
- `packages/ui`;
- `infra/docker`;
- scripts raiz;
- lint;
- typecheck;
- testes;
- build;
- health checks;
- logging estruturado;
- configuração de ambiente;
- PostgreSQL 14 local;
- suporte auxiliar a SQLite.

## 3. Fora de escopo

- autenticação completa;
- módulos de negócio;
- migração de dados;
- WhatsApp;
- dashboard funcional;
- deploy em produção.

## 4. Decisões propostas

- Node.js LTS;
- TypeScript estrito;
- frontend React + Vite;
- backend Fastify;
- workspace com npm, pnpm ou equivalente definido na implementação;
- validação com Zod;
- testes com Vitest;
- documentação OpenAPI;
- Docker Compose para desenvolvimento.

## 5. Estrutura mínima

```text
apps/
  web/
  api/
packages/
  domain/
  database/
  shared/
  ui/
infra/
  docker/
docs/
scripts/
```

## 6. Requisitos funcionais

### RF-001
A API deve responder `GET /health/live`.

### RF-002
A API deve responder `GET /health/ready`, validando as dependências configuradas.

### RF-003
A aplicação web deve abrir uma tela inicial informando que o MesaChef Platform está operacional.

### RF-004
A raiz deve disponibilizar comandos para desenvolvimento, lint, typecheck, teste e build.

### RF-005
O ambiente Docker deve iniciar PostgreSQL 14 e serviços locais necessários.

## 7. Requisitos não funcionais

- TypeScript em modo estrito;
- nenhuma credencial real versionada;
- logs estruturados;
- encerramento gracioso da API;
- tratamento centralizado de erros;
- correlation ID;
- builds reproduzíveis;
- configuração validada na inicialização;
- suporte a Windows e Linux para desenvolvimento.

## 8. Variáveis iniciais

```dotenv
APP_ENV=
APP_PORT=
APP_URL=
DATABASE_PROVIDER=
DATABASE_URL=
AUTH_SECRET=
CORS_ALLOWED_ORIGINS=
LOG_LEVEL=
```

## 9. Testes

- teste unitário básico do pacote de domínio;
- teste da rota `/health/live`;
- teste da rota `/health/ready`;
- build do frontend;
- typecheck do monorepo;
- inicialização com PostgreSQL 14;
- validação de falha quando variável obrigatória não existir.

## 10. Critérios de aceite

- [ ] Instalação de dependências sem erro.
- [ ] Desenvolvimento de web e API iniciado por comando raiz.
- [ ] `lint` passa.
- [ ] `typecheck` passa.
- [ ] testes passam.
- [ ] build passa.
- [ ] PostgreSQL 14 sobe por Docker Compose.
- [ ] API responde aos health checks.
- [ ] frontend abre a página inicial.
- [ ] `.env.example` está completo e sem secrets.
- [ ] README possui instruções básicas.
- [ ] Nenhum módulo de negócio foi implementado.

## 11. Definition of Done

A spec é concluída somente após validação em máquina limpa ou ambiente equivalente e registro das evidências em `docs/qa/evidencias/spec-001.md`.
