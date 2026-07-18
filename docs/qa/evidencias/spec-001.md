# Evidências — SPEC 001

## 1. Identificação

- **Spec:** `docs/sdd/001-fundacao-projeto.md`
- **Execução:** 2026-07-18
- **Modo:** `implementation`
- **Branch:** `feat/spec-001-foundation`
- **Estado final proposto:** `EM_VALIDACAO`
- **Commit:** não criado; a execução não possui autorização para commit.
- **Produção:** não acessada nem alterada.

## 2. Resumo da entrega

Foi criada a fundação técnica independente do MesaChef com:

- workspace pnpm e lockfile único;
- TypeScript estrito e exports controlados;
- aplicação web React/Vite;
- API Fastify com configuração Zod;
- packages `domain`, `database`, `shared` e `ui`;
- liveness, readiness, OpenAPI, correlation ID e erros sanitizados;
- CORS por allowlist, headers Helmet e logs estruturados;
- probe PostgreSQL e probe SQLite auxiliar;
- Compose local para PostgreSQL 14;
- scripts de ambiente, limites arquiteturais e contrato do Compose;
- testes unitários, integração, build e documentação.

Nenhum módulo de negócio foi implementado.

## 3. Toolchain fixada

| Componente | Versão |
|---|---:|
| Node.js | 24.14.0 |
| pnpm | 11.9.0 |
| TypeScript | 6.0.3 |
| React / React DOM | 19.2.7 |
| Vite | 8.1.5 |
| Fastify | 5.10.0 |
| Zod | 4.4.3 |
| Vitest | 4.1.10 |
| driver PostgreSQL `pg` | 8.22.0 |

O TypeScript foi fixado em 6.0.3 porque o `typescript-eslint` selecionado aceita TypeScript menor que 6.1.0. O pnpm permite script de instalação somente para `esbuild`, dependência necessária do Vite/Vitest; nenhum outro build de terceiro foi liberado implicitamente.

## 4. Arquivos e áreas principais

- configurações raiz: `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.npmrc`, `.node-version`, `tsconfig*`, ESLint e Vitest;
- API: `apps/api`;
- web: `apps/web`;
- packages: `packages/domain`, `packages/database`, `packages/shared`, `packages/ui`;
- infraestrutura: `infra/docker/compose.yaml`;
- fitness functions: `scripts/verify-boundaries.mjs` e `scripts/validate-compose.mjs`;
- diagnóstico: `scripts/check-environment.mjs`;
- execução: `README.md`, `.env.example` e `.env.sqlite.example`.

## 5. Instalação

Comando final:

```text
pnpm install --frozen-lockfile
```

Resultado: **passou**, 7 projetos do workspace, lockfile consistente e nenhuma dependência pendente.

A primeira instalação bloqueou o postinstall de `esbuild` pela política do pnpm. A correção foi explícita em `pnpm-workspace.yaml` por `allowBuilds.esbuild: true`; após isso, a instalação e o frozen lockfile passaram.

## 6. Verificações automatizadas

Comando consolidado:

```text
pnpm check
```

Resultado final: **exit code 0**.

| Verificação | Resultado |
|---|---|
| ESLint | passou sem warnings |
| limites arquiteturais | passou; nenhum import proibido ou ciclo de workspace |
| contrato estático do Compose | passou |
| TypeScript | passou nos 6 projetos executáveis |
| testes unitários | 4 arquivos, 11 testes aprovados |
| testes de integração | 2 arquivos, 2 testes aprovados |
| build dos packages/API | passou |
| build web | passou, 19 módulos transformados |

Artefatos web observados no build:

- HTML: 0,50 kB;
- CSS: 4,06 kB, gzip 1,50 kB;
- JavaScript: 192,75 kB, gzip 60,82 kB.

## 7. Smoke tests

### API compilada

A API compilada foi iniciada localmente com SQLite em memória e configuração sem segredo:

- `GET /health/live`: HTTP 200, `status=ok`, `service=mesachef-api`;
- `GET /health/ready`: HTTP 200, banco `up`, provider `sqlite`;
- `GET /documentation/json`: OpenAPI 3.1.0, título MesaChef Platform API;
- header `x-correlation-id`: presente;
- header `x-content-type-options`: `nosniff`;
- origem CORS permitida: devolvida;
- origem não permitida: nenhum header de permissão devolvido.

### Comando raiz de desenvolvimento

`pnpm dev` iniciou simultaneamente:

- web em `http://127.0.0.1:5173`, HTTP 200;
- API em porta local isolada, com liveness HTTP 200.

Os processos de teste foram encerrados após a verificação.

## 8. Validação visual da web

A página compilada foi aberta em navegador local e verificada por DOM e imagem:

- título e mensagem operacional renderizados;
- três cartões da fundação renderizados;
- landmarks e hierarquia de headings presentes;
- viewport desktop sem erro de console;
- viewport móvel de 390 × 844 sem overflow horizontal;
- os três cartões permanecem presentes no breakpoint móvel;
- nenhum warning ou error do navegador foi observado.

## 9. Docker e PostgreSQL 14

O arquivo `infra/docker/compose.yaml` foi criado com:

- imagem `postgres:14-alpine`;
- publicação restrita a `127.0.0.1`;
- senha obrigatória por variável;
- health check com `pg_isready`;
- volume nomeado;
- `no-new-privileges`.

`pnpm check:compose` passou para sintaxe YAML e invariantes do contrato.

`pnpm db:config` não pôde ser executado porque Docker não está instalado ou acessível no `PATH` deste ambiente. Consequentemente, PostgreSQL 14 não foi iniciado e esse critério permanece pendente.

## 10. Critérios de aceite

- [x] Instalação de dependências sem erro.
- [x] Desenvolvimento de web e API iniciado por comando raiz.
- [x] `lint` passa.
- [x] verificação de limites arquiteturais passa.
- [x] `typecheck` passa.
- [x] testes unitários passam.
- [x] testes de integração passam.
- [x] build passa.
- [ ] PostgreSQL 14 sobe por Docker Compose.
- [x] API responde aos health checks.
- [x] frontend abre a página inicial.
- [x] `.env.example` está completo e sem secrets reais.
- [x] README possui instruções básicas.
- [x] Nenhum módulo de negócio foi implementado.
- [x] Evidências foram registradas.

## 11. Segurança

- nenhuma connection string ou credencial real foi versionada;
- os valores de ambiente são placeholders locais;
- configuração falha antes de abrir a porta quando campo obrigatório está ausente;
- erro de readiness não expõe causa interna;
- erro HTTP inesperado não expõe stack ou mensagem técnica;
- correlation ID é gerado pelo servidor;
- CORS, Helmet, limite de body e redaction de headers sensíveis foram configurados;
- frontend não importa database, PostgreSQL, SQLite ou Supabase;
- lockfile e allowlist de build de dependência estão versionados.

## 12. Multiempresa

**N/A nesta spec.** Não existem identidade, empresa, sessão, dados ou endpoints autenticados. A fronteira necessária foi preparada impedindo acesso do frontend à infraestrutura de banco. Testes de isolamento multiempresa pertencem à SPEC 002 e continuam bloqueados.

## 13. Migrations

**N/A.** Nenhuma migration, tabela, schema ou repository foi criado ou executado. PostgreSQL e SQLite são usados apenas por probes de dependência.

## 14. Limitações e pendências

- falta executar o Compose e validar readiness contra PostgreSQL 14 real;
- `node:sqlite` emite aviso experimental no Node 24 e permanece estritamente auxiliar;
- CI não faz parte da autorização desta execução;
- ORM/query builder foi deliberadamente adiado até existir caso de persistência e ADR;
- a experiência visual é uma página técnica mínima; design system e layout pertencem à SPEC 003;
- sinais de shutdown foram implementados, e o fechamento do probe é testado; propagação de sinal pelo wrapper pnpm no terminal gerenciado não foi usada como critério.

## 15. Resultado

A fundação está implementada e pronta para a validação externa do PostgreSQL 14. A SPEC 001 deve permanecer `EM_VALIDACAO`, e a SPEC 002 deve permanecer `BLOQUEADA` até nova autorização explícita e atendimento do critério Docker/PostgreSQL.
