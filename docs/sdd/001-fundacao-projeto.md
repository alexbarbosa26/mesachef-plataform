# SPEC 001 — Fundação Técnica do Projeto

## Status

CONCLUIDA

Concluída em 2026-07-18 após validação local com PostgreSQL 14.23 em Docker, pipeline completo e ciclo de indisponibilidade/recuperação do readiness. A conclusão não libera nem inicia a SPEC 002.

## Dependências

- SPEC 000 — concluída no controlador de execução;
- ADR 0001 — monólito modular;
- ADR 0002 — PostgreSQL 14 oficial e SQLite auxiliar;
- ADR 0003 — API própria sem acesso direto do frontend ao banco.

## 1. Contexto

O MesaChef precisa de uma base técnica reproduzível antes de receber identidade, multiempresa ou módulos de negócio. O repositório já possui documentação, pastas vazias e decisões arquiteturais, mas ainda não possui workspace, aplicações executáveis, testes, build ou infraestrutura local.

## 2. Problema

Sem uma fundação comum, cada módulo futuro poderia escolher convenções incompatíveis para configuração, dependências, erros, logs, testes e acesso a dados. Isso aumentaria acoplamento, risco de segurança e custo de evolução.

## 3. Objetivo

Criar a fundação técnica do MesaChef em monorepo TypeScript, com frontend, backend, packages de responsabilidade explícita, infraestrutura local, testes básicos e padrões verificáveis de qualidade e segurança.

## 4. Atores

| Ator | Necessidade nesta spec |
|---|---|
| Pessoa desenvolvedora | instalar, executar, testar e construir todo o workspace por comandos da raiz |
| Operador local | iniciar PostgreSQL 14 sem usar qualquer banco de produção |
| Monitor de infraestrutura | consultar liveness e readiness sem receber detalhes sensíveis |
| Pipeline futuro | executar verificações determinísticas de lint, limites, tipos, testes e build |

Usuários finais, administradores, staff e superadmin não recebem comportamento funcional nesta spec.

## 5. Pré-condições

- Node.js 24 LTS;
- pnpm 11;
- Docker com Compose apenas para a validação local de PostgreSQL;
- arquivo `.env` local criado a partir de exemplo e nunca versionado;
- nenhuma credencial ou conexão de produção.

## 6. Escopo

- monorepo pnpm com workspaces;
- configuração TypeScript estrita;
- `apps/web` com React e Vite;
- `apps/api` com Fastify e Zod;
- `packages/domain` sem dependência de framework;
- `packages/database` com probes de PostgreSQL e SQLite;
- `packages/shared` limitado a contratos entre aplicações;
- `packages/ui` com componente visual mínimo e reutilizável;
- scripts de desenvolvimento, lint, limites arquiteturais, typecheck, testes e build;
- health checks, logging estruturado, correlation ID e erro HTTP padronizado;
- documento OpenAPI básico;
- Docker Compose local com PostgreSQL 14;
- configuração auxiliar de SQLite;
- exemplos de ambiente e documentação básica de execução.

## 7. Fora de escopo

- autenticação, sessão, papéis ou permissões;
- empresas e isolamento multiempresa funcional;
- usuários;
- estoque, compras, fornecedores, fichas técnicas, precificação, CMV ou self-service;
- WhatsApp, SMTP ou jobs;
- modelos persistentes, migrations e migração de dados;
- escolha definitiva de ORM/query builder;
- design system funcional, layout autenticado ou dashboard;
- CI, deploy e qualquer alteração em produção.

## 8. Decisões técnicas desta spec

| Tema | Decisão | Justificativa |
|---|---|---|
| Runtime | Node.js 24 LTS | runtime LTS disponível, compatível com Vite, Vitest e SQLite nativo |
| Workspace | pnpm 11 | suporte nativo a workspace, lockfile único e instalação estrita |
| Linguagem | TypeScript 6 em modo estrito | estados inválidos e dependências ficam mais visíveis no build |
| Web | React 19 + Vite 8 | atende ao stack preferencial com base mínima e independente do legado |
| API | Fastify 5 + Zod 4 | API própria, configuração validada e baixo custo operacional |
| Testes | Vitest 4 | uma ferramenta para TypeScript, web e integração local |
| PostgreSQL | driver `pg` somente para o probe de dependência | não antecipar repositories ou modelo de dados |
| SQLite | `node:sqlite` somente para desenvolvimento e teste auxiliar | evita dependência nativa externa; a API ainda é experimental no Node 24 e não simula recursos de PostgreSQL |
| Logging | logger estruturado nativo do Fastify/Pino | correlation ID e logs JSON sem criar infraestrutura paralela |
| OpenAPI | documento gerado pelo plugin oficial do Fastify | contrato inicial sem introduzir um portal externo |

Nenhuma decisão desta tabela autoriza schema de negócio. A escolha de ORM/query builder continua condicionada a ADR específica quando existir um primeiro caso de persistência.

## 9. Estrutura mínima

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

Direção de dependência inicial:

```text
apps/web  -> packages/ui, packages/shared
apps/api  -> packages/database, packages/shared
packages/database -> infraestrutura Node/PostgreSQL/SQLite
packages/domain   -> nenhuma dependência interna ou de framework
packages/ui       -> React
packages/shared   -> nenhuma dependência interna
```

Dependências circulares e acesso do frontend ao package de banco são proibidos e verificados por script.

## 10. Requisitos funcionais

- `RF-001-001` — A API responde `GET /health/live` sem consultar dependências externas.
- `RF-001-002` — A API responde `GET /health/ready` após verificar a dependência de banco configurada.
- `RF-001-003` — Readiness indisponível retorna HTTP 503 sem expor connection string, SQL, stack ou erro do driver.
- `RF-001-004` — A aplicação web abre uma tela inicial informando que o MesaChef Platform está operacional.
- `RF-001-005` — A raiz disponibiliza comandos para desenvolvimento, lint, limites arquiteturais, typecheck, testes e build.
- `RF-001-006` — O ambiente Docker inicia PostgreSQL 14 local com health check e volume nomeado.
- `RF-001-007` — A API inicia com PostgreSQL ou SQLite conforme configuração validada.
- `RF-001-008` — A API disponibiliza o contrato OpenAPI dos endpoints da fundação.
- `RF-001-009` — A API encerra servidor e conexão de banco de forma graciosa.

## 11. Requisitos não funcionais

- TypeScript em modo estrito, sem `any` explícito no código da aplicação;
- nenhuma credencial real versionada;
- builds determinados por lockfile;
- logs estruturados com correlation ID;
- configuração validada antes de abrir a porta HTTP;
- tratamento centralizado de erros e 404;
- CORS restrito às origens configuradas;
- headers de segurança;
- suporte a Windows e Linux para desenvolvimento;
- testes rápidos, independentes e sem ordem implícita;
- packages com exports públicos controlados;
- nenhum código ou dependência do Supabase.

## 12. Modelo conceitual da fundação

Esta spec não cria entidades de negócio. Os únicos contratos internos são técnicos:

- `ApplicationConfig`: configuração validada e imutável da API;
- `DatabaseHealthProbe`: porta para verificar e encerrar a dependência de banco;
- `HealthResponse`: contrato público de liveness;
- `ReadinessResponse`: contrato público de dependências;
- `ApiErrorResponse`: envelope sanitizado de erro;
- `DomainRuleError`: categoria base e independente de framework para futuras violações de regra.

## 13. Contratos HTTP

### `GET /health/live`

- sucesso: HTTP 200;
- informa estado, serviço, versão e timestamp;
- não consulta banco.

### `GET /health/ready`

- pronto: HTTP 200, dependência de banco `up`;
- não pronto: HTTP 503, dependência de banco `down`;
- não revela host, arquivo, usuário, SQL ou causa interna.

### Erro padrão

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Ocorreu um erro inesperado.",
    "correlationId": "identificador-gerado-pelo-servidor"
  }
}
```

Os health checks são endpoints operacionais não versionados. Endpoints de negócio futuros serão versionados em `/api/v1` conforme ADR 0003.

## 14. Persistência

- PostgreSQL 14 é o alvo oficial.
- SQLite é auxiliar e limitado a desenvolvimento/testes compatíveis.
- A fundação abre conexão apenas para executar um probe constante e fechá-la no shutdown.
- Nenhuma tabela, migration, repository ou query de negócio é criada.
- O readiness não altera dados.
- Uma validação real em PostgreSQL exige Docker disponível e nunca usa produção.

## 15. Segurança

- variáveis obrigatórias são validadas por Zod;
- URLs de banco nunca aparecem na resposta HTTP;
- erros técnicos completos ficam restritos ao log estruturado;
- o correlation ID é gerado pelo servidor e devolvido em header e envelope de erro;
- CORS usa allowlist explícita;
- Helmet adiciona headers de segurança;
- payloads futuros deverão ser validados antes do processamento;
- `AUTH_SECRET` permanece reservado para a SPEC 002 e não é consumido nesta spec;
- nenhum endpoint autenticado ou papel é simulado.

Multiempresa é **N/A** funcionalmente nesta spec porque não existem dados nem endpoints autenticados. O script de limites impede o frontend de acessar infraestrutura de banco, preparando a fronteira exigida pelas specs futuras.

## 16. Observabilidade e operação

- logs JSON em produção e logs estruturados configuráveis nos demais ambientes;
- cada request recebe `x-correlation-id` gerado no servidor;
- liveness separado de readiness;
- mensagens de inicialização e encerramento sem valores secretos;
- sinais `SIGINT` e `SIGTERM` executam encerramento gracioso;
- versão e nome do serviço aparecem nos contratos operacionais.

## 17. Variáveis iniciais

```dotenv
APP_ENV=
APP_PORT=
APP_HOST=
APP_URL=
DATABASE_PROVIDER=
DATABASE_URL=
DATABASE_CONNECTION_TIMEOUT_MS=
AUTH_SECRET=
CORS_ALLOWED_ORIGINS=
LOG_LEVEL=
OPENAPI_ENABLED=
```

Variáveis de Docker local são documentadas separadamente no mesmo arquivo de exemplo. Valores reais nunca entram no Git.

## 18. Testes planejados

- teste unitário do erro básico do package de domínio;
- validação de configuração válida, ausente e incompatível com o provider;
- probe SQLite real em memória;
- `/health/live` sem acesso ao banco;
- `/health/ready` disponível e indisponível;
- erro sanitizado e correlation ID;
- renderização da mensagem operacional da web;
- fitness function de dependências proibidas;
- lint, typecheck e build de todo o workspace;
- smoke test HTTP da API compilada;
- PostgreSQL 14 por Compose quando Docker estiver disponível.

## 19. Casos de aceitação

### Liveness independente

- **Given** uma API iniciada com um probe de banco indisponível
- **When** `GET /health/live` é solicitado
- **Then** a resposta é HTTP 200 sem consultar o probe.

### Readiness seguro

- **Given** uma dependência de banco indisponível
- **When** `GET /health/ready` é solicitado
- **Then** a resposta é HTTP 503 e não contém o erro interno.

### Configuração inválida

- **Given** uma variável obrigatória ausente
- **When** a configuração da API é carregada
- **Then** a inicialização falha antes de abrir a porta e informa somente os nomes dos campos inválidos.

### Fronteira frontend/banco

- **Given** o código do frontend
- **When** a fitness function arquitetural é executada
- **Then** imports de database, `pg`, SQLite ou Supabase fazem a verificação falhar.

## 20. Critérios de aceite

- [x] Instalação de dependências sem erro.
- [x] Desenvolvimento de web e API iniciado por comando raiz.
- [x] `lint` passa.
- [x] verificação de limites arquiteturais passa.
- [x] `typecheck` passa.
- [x] testes unitários passam.
- [x] testes de integração passam.
- [x] build passa.
- [x] PostgreSQL 14 sobe por Docker Compose.
- [x] API responde aos health checks.
- [x] frontend abre a página inicial.
- [x] `.env.example` está completo e sem secrets.
- [x] README possui instruções básicas.
- [x] Nenhum módulo de negócio foi implementado.
- [x] Evidências foram registradas.

## 21. Rollout e rollback

Rollout local:

1. instalar dependências com lockfile;
2. criar `.env` local a partir do exemplo;
3. opcionalmente iniciar PostgreSQL 14 pelo Compose;
4. executar verificações da raiz;
5. iniciar API e web;
6. validar página, liveness, readiness e OpenAPI.

Rollback:

- remover apenas os artefatos da fundação em mudança revisada;
- não executar comandos destrutivos no volume do PostgreSQL;
- manter documentação e lockfile alinhados à versão revertida;
- não há rollback de dados porque esta spec não cria schema nem migration.

## 22. Riscos e decisões abertas

- A indisponibilidade anterior do Docker foi resolvida na execução de validação; PostgreSQL 14.23, health do container e recuperação do readiness foram confirmados localmente.
- `node:sqlite` emite aviso experimental no Node 24; seu uso permanece auxiliar e deve ser reavaliado antes de qualquer persistência real.
- CI inicial não está autorizado no escopo desta execução e permanece para decisão posterior.
- ORM/query builder será decidido por ADR quando existir um primeiro caso de persistência.
- SQLite não valida concorrência, tipos, constraints ou recursos específicos de PostgreSQL.
- A fundação visual é deliberadamente mínima; Tailwind/shadcn e layout funcional pertencem à SPEC 003.

## 23. Definition of Done

A spec é concluída somente quando todos os critérios aplicáveis estiverem evidenciados, inclusive execução do Compose/PostgreSQL 14 em máquina com Docker ou ambiente equivalente. Falhas ou itens não executáveis mantêm a spec em `EM_VALIDACAO`; a SPEC 002 não é liberada automaticamente.
