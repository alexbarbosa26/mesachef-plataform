# EXECUTAR.md — Plano Mestre de Execução do MesaChef Platform

## 1. Finalidade

Este arquivo é o roteiro operacional da reconstrução do MesaChef.

Ele informa ao Codex:

- qual spec está liberada;
- em que ordem executar;
- quais dependências precisam estar concluídas;
- quais documentos consultar;
- quando pode avançar;
- como registrar evidências;
- como lidar com bloqueios;
- quais comandos mínimos executar.

O `EXECUTAR.md` não substitui as specs. Ele controla **a ordem e o processo de execução**.

---

## 2. Regra principal

Executar apenas uma spec principal por vez.

A spec ativa deve ser indicada neste arquivo.

O agente não deve iniciar a próxima spec automaticamente apenas porque terminou a anterior. Deve:

1. concluir os critérios de aceite;
2. executar verificações;
3. atualizar este arquivo;
4. apresentar o resumo;
5. aguardar a próxima instrução do usuário, salvo autorização explícita para execução sequencial.

---

## 3. Configuração de execução

```yaml
project: MesaChef Platform
method: SDD
architecture: modular-monolith
current_spec: "002-A"
execution_mode: implementation
auto_advance: false
auto_commit: false
auto_push: false
allow_production_changes: false
reference_project_path: "../mesachef-reference"
production_database: "PostgreSQL 14"
development_database: "SQLite ou PostgreSQL 14 local"
preproduction_database: "PostgreSQL 14"
```

O modo acima mantém a 002-A ativa durante sua implementação incremental. A
002-A1 foi concluída nesta execução; 002-A2 e etapas posteriores continuam sem
autorização e exigem nova instrução explícita do usuário.

### Modos possíveis

- `documentation`: apenas documentação, inventário, specs e ADRs;
- `implementation`: código, testes e documentação da spec ativa;
- `review`: revisão sem alterar código, salvo correção autorizada;
- `migration`: preparação ou execução controlada de migração;
- `validation`: testes, regressão, segurança e homologação.

---

## 4. Documentos obrigatórios antes da primeira implementação

Os arquivos abaixo devem existir e possuir conteúdo utilizável:

```text
AGENTS.md
EXECUTAR.md
PROMPT-CHAVE.md
docs/sdd/000-visao-produto.md
docs/sdd/001-fundacao-projeto.md
docs/adr/0001-monolito-modular.md
docs/adr/0002-postgresql-producao-sqlite-homologacao.md
docs/adr/0003-api-propria-sem-supabase-direto.md
docs/migration/inventario-projeto-atual.md
docs/migration/mapa-funcionalidades.md
docs/migration/mapa-telas-rotas.md
docs/migration/mapa-banco-dados.md
docs/qa/pendencias.md
```

As skills devem estar extraídas e organizadas em:

```text
docs/skills/architecture
docs/skills/clean-code
docs/skills/ddd
docs/skills/security
```

---

## 5. Sequência oficial das specs

| Ordem | Arquivo | Nome | Dependências | Estado |
|---:|---|---|---|---|
| 000 | `docs/sdd/000-visao-produto.md` | Visão do produto e escopo da reconstrução | Nenhuma | CONCLUIDA |
| 001 | `docs/sdd/001-fundacao-projeto.md` | Fundação técnica | 000 e ADRs iniciais | CONCLUIDA |
| 002 | `docs/sdd/002-identity-access-multiempresa.md` | Autenticação, autorização e multiempresa | 001 | EM_ESPECIFICACAO |
| 003 | `docs/sdd/003-layout-navegacao.md` | Layout, navegação e design system | 001 e contratos iniciais da 002 | BLOQUEADA |
| 004 | `docs/sdd/004-estoque.md` | Estoque e movimentações | 002 e 003 | BLOQUEADA |
| 005 | `docs/sdd/005-fornecedores-compras.md` | Fornecedores e compras | 002 e 004 | BLOQUEADA |
| 006 | `docs/sdd/006-fichas-tecnicas-precificacao.md` | Fichas técnicas e precificação | 002, 004 e 005 | BLOQUEADA |
| 007 | `docs/sdd/007-cmv-central-lucro-relatorios.md` | CMV, lucro e relatórios | 004 e 006 | BLOQUEADA |
| 008 | `docs/sdd/008-self-service.md` | Operação self-service | 002, 004, 006 e 007 | BLOQUEADA |
| 009 | `docs/sdd/009-whatsapp.md` | Integração WhatsApp | 002 e fundação de jobs | BLOQUEADA |
| 010 | `docs/sdd/010-auditoria-seguranca.md` | Consolidação de auditoria e segurança | 002 até 009 | BLOQUEADA |
| 011 | `docs/sdd/011-migracao-dados.md` | Migração de dados | Schemas estáveis e validação das specs anteriores | BLOQUEADA |

Estados permitidos:

- `PENDENTE`;
- `EM_ESPECIFICACAO`;
- `PRONTA_PARA_IMPLEMENTAR`;
- `EM_IMPLEMENTACAO`;
- `EM_VALIDACAO`;
- `CONCLUIDA`;
- `BLOQUEADA`;
- `CANCELADA`.

---

## 6. Spec ativa

```yaml
active_spec:
  id: "002-A"
  file: "docs/sdd/002/002-a-persistencia-migrations.md"
  state: "EM_IMPLEMENTACAO"
  owner: "Alex"
  objective: "Manter a 002-A em implementação incremental após concluir somente a infraestrutura Kysely, tipos, migrator e checksum da 002-A1; aguardar autorização para 002-A2."
  parent_spec:
    id: "002"
    state: "EM_ESPECIFICACAO"
  increment_states:
    "002-A": "EM_IMPLEMENTACAO"
    "002-B": "BLOQUEADA"
    "002-C": "BLOQUEADA"
    "002-D": "BLOQUEADA"
    "002-E": "BLOQUEADA"
    "002-F": "BLOQUEADA"
    "002-G": "BLOQUEADA"
  subincrement_control:
    last_completed: "002-A1"
    next_planned: "002-A2"
    next_authorized: false
```

Para mudar a spec ativa, atualizar este bloco antes de iniciar a execução.

Exemplo:

```yaml
active_spec:
  id: "001"
  file: "docs/sdd/001-fundacao-projeto.md"
  state: "PRONTA_PARA_IMPLEMENTAR"
  owner: "Alex"
  objective: "Criar a fundação técnica do monorepo."
```

---

## 7. Fluxo obrigatório por spec

### Fase A — Preparação

1. Confirmar que a spec está ativa.
2. Ler `AGENTS.md`.
3. Ler a spec.
4. Ler ADRs relacionadas.
5. Ler skills aplicáveis.
6. Verificar dependências.
7. Verificar `git status`.
8. Registrar riscos e dúvidas.
9. Confirmar fora de escopo.
10. Produzir plano de execução.

Saída mínima:

```text
SPEC ATIVA:
DEPENDÊNCIAS:
ADRs:
SKILLS:
ESCOPO:
FORA DO ESCOPO:
PLANO:
TESTES:
RISCOS:
```

### Fase B — Especificação

Antes de implementar, a spec deve conter:

- contexto;
- problema;
- objetivo;
- escopo;
- fora de escopo;
- atores;
- pré-condições;
- regras de negócio;
- requisitos funcionais;
- requisitos não funcionais;
- modelo de domínio;
- contratos necessários;
- persistência;
- segurança;
- observabilidade;
- critérios de aceite;
- casos de teste;
- estratégia de rollout;
- rollback;
- dúvidas abertas.

Quando aplicável, usar linguagem Given/When/Then.

A spec só muda para `PRONTA_PARA_IMPLEMENTAR` quando não houver dúvida crítica.

### Fase C — Implementação

1. Criar branch sugerida.
2. Implementar o menor incremento.
3. Criar testes junto com o código.
4. Evitar mudanças não relacionadas.
5. Registrar decisões não triviais.
6. Atualizar documentação durante a implementação.
7. Não acessar produção.

### Fase D — Validação

Executar, quando disponíveis:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run build
```

Para monorepo, usar os scripts definidos na raiz.

Também validar:

- isolamento de empresa;
- autorização;
- dados monetários;
- idempotência;
- migrations;
- saúde da API;
- ausência de secrets;
- comportamento em PostgreSQL 14;
- regressão visual, quando houver frontend.

### Fase E — Encerramento

1. Atualizar o estado da spec.
2. Atualizar a tabela de sequência.
3. Registrar evidências.
4. Registrar pendências.
5. Atualizar ADR, se necessário.
6. Produzir resumo final.
7. Não avançar automaticamente, salvo autorização.

---

## 8. Evidências de execução

Criar uma seção por spec em `docs/qa/evidencias/` ou arquivo equivalente.

Estrutura sugerida:

```text
docs/qa/evidencias/
├── spec-001.md
├── spec-002.md
└── ...
```

Modelo:

```markdown
# Evidências — SPEC 001

## Commit ou branch

## Arquivos principais

## Comandos executados

## Testes

## Resultado

## Critérios de aceite

- [ ] Critério 1
- [ ] Critério 2

## Segurança

## Multiempresa

## Limitações

## Pendências
```

---

## 9. Regras para PostgreSQL e SQLite

### Desenvolvimento rápido

SQLite pode ser usado para:

- testes unitários;
- protótipos locais;
- testes simples de repositories;
- homologação funcional inicial.

### Pré-produção e produção

PostgreSQL 14 é obrigatório para:

- validação de migrations;
- constraints;
- transações;
- concorrência;
- locks;
- índices;
- tipos decimais;
- queries específicas;
- performance;
- migração final.

Nenhuma spec de persistência é concluída apenas com SQLite.

---

## 10. Branches sugeridas

```text
docs/spec-000-product-vision
feat/spec-001-foundation
feat/spec-002-identity-access
feat/spec-003-layout-navigation
feat/spec-004-stock
feat/spec-005-purchases
feat/spec-006-pricing
feat/spec-007-cmv-reports
feat/spec-008-self-service
feat/spec-009-whatsapp
feat/spec-010-security-audit
feat/spec-011-data-migration
```

---

## 11. Comandos iniciais de Git

Na raiz do projeto novo:

```bash
git status
git branch --show-current
git log --oneline -5
```

Para criar uma branch:

```bash
git switch -c docs/spec-000-product-vision
```

ou:

```bash
git switch -c feat/spec-001-foundation
```

Adicionar alterações:

```bash
git add .
git status
```

Criar commit apenas quando autorizado:

```bash
git commit -m "docs(sdd): define product vision"
```

ou:

```bash
git commit -m "feat(foundation): create initial monorepo structure"
```

---

## 12. Critérios de bloqueio

Bloquear a execução quando:

- a spec não existe;
- a spec possui contradição crítica;
- a dependência não está concluída;
- há risco de perda de dados;
- a tarefa exige credencial não fornecida;
- há conflito Git não resolvido;
- a implementação exigiria alterar produção;
- não existe estratégia segura de migration;
- não é possível garantir isolamento multiempresa;
- a mudança contradiz ADR aceita.

Registrar o bloqueio em:

```text
docs/qa/pendencias.md
```

Formato:

```markdown
## BLOQUEIO-YYYYMMDD-NNN

- Spec:
- Descrição:
- Impacto:
- Evidência:
- Opções:
- Recomendação:
- Decisão necessária:
```

---

## 13. Critérios para concluir cada spec

Uma spec só pode ser marcada como `CONCLUIDA` quando:

- todos os critérios de aceite foram atendidos;
- todos os testes obrigatórios passaram;
- build passou;
- typecheck passou;
- lint passou;
- migrations foram validadas;
- segurança foi revisada;
- multiempresa foi testada;
- documentação foi atualizada;
- não há bloqueio crítico;
- evidências foram registradas.

Quando um item não se aplicar, registrar `N/A` com justificativa.

---

## 14. Plano detalhado da fase inicial

### Passo 1 — Preparação do repositório

- [ ] Criar o novo repositório.
- [ ] Executar `git init`.
- [ ] Criar estrutura de pastas.
- [ ] Adicionar `AGENTS.md`.
- [ ] Adicionar `EXECUTAR.md`.
- [ ] Adicionar `PROMPT-CHAVE.md`.
- [ ] Adicionar `.gitignore`.
- [ ] Adicionar `.env.example`.
- [ ] Fazer primeiro commit.

### Passo 2 — Instalar as skills

- [ ] Extrair os arquivos de arquitetura.
- [ ] Extrair os arquivos de Clean Code.
- [ ] Extrair os arquivos de DDD.
- [ ] Extrair os arquivos de segurança.
- [ ] Converter ou manter instruções em Markdown legível.
- [ ] Organizar em `docs/skills`.
- [ ] Validar que não existem arquivos executáveis ou secrets.
- [ ] Fazer commit de documentação.

### Passo 3 — Inventariar o projeto antigo

- [x] Mapear rotas.
- [x] Mapear telas.
- [x] Mapear menus.
- [x] Mapear entidades.
- [x] Mapear tabelas e migrations.
- [x] Mapear autenticação e autorização.
- [x] Mapear integrações.
- [x] Mapear regras de precificação.
- [x] Mapear estoque.
- [x] Mapear self-service.
- [x] Mapear WhatsApp.
- [x] Registrar hipóteses funcionais.

### Passo 4 — Concluir SPEC 000

- [x] Visão do produto.
- [x] Perfis de usuário.
- [x] Módulos.
- [x] Escopo da reconstrução.
- [x] Fora de escopo.
- [x] Restrições.
- [x] Objetivos de qualidade.
- [x] Critérios de sucesso.

Os itens documentais acima foram preenchidos e a SPEC 000 foi concluída pelo responsável do produto antes da autorização da SPEC 001.

### Passo 5 — Preparar SPEC 001

- [x] Definir gerenciador de pacotes.
- [x] Definir organização do monorepo.
- [x] Definir framework da API.
- [x] Definir estratégia de banco.
- [x] Definir ORM/query builder mediante ADR.
- [x] Definir scripts.
- [x] Definir Docker Compose.
- [ ] Definir CI inicial.
- [x] Definir health checks.
- [x] Definir logging.
- [x] Definir testes básicos.

A estratégia de persistência foi definida pela ADR 0004 após spike com Kysely. A CI inicial permanece deliberadamente pendente e exige execução futura própria.

### Passo 6 — Implementar SPEC 001

- [x] Criar `apps/web`.
- [x] Criar `apps/api`.
- [x] Criar packages.
- [x] Criar scripts raiz.
- [x] Criar health check.
- [x] Criar página inicial.
- [x] Criar ambiente Docker.
- [x] Criar conexão local segura.
- [x] Criar testes mínimos.
- [x] Validar build completo.
- [x] Validar PostgreSQL 14.

### Passo 7 — Especificar SPEC 002

- [x] Inventariar identidade, autenticação, autorização e tenancy do legado sem copiar implementação.
- [x] Refinar contexto, atores, domínio, invariantes, requisitos, contratos e segurança.
- [x] Dividir a entrega nos incrementos 002-A a 002-G.
- [x] Propor ADR de persistência e comparar Drizzle, Prisma, Kysely e SQL explícito.
- [x] Propor ADR de autenticação, sessões e tokens.
- [x] Propor ADR de isolamento multiempresa e RBAC.
- [x] Registrar migrations conceituais e testes obrigatórios sem criar migrations físicas.
- [x] Registrar decisões críticas e manter a SPEC como `EM_ESPECIFICACAO`.
- [x] Aceitar a ADR 0005 — autenticação, sessões e tokens.
- [x] Aceitar a ADR 0006 — isolamento multiempresa e RBAC, mantendo a implementação da RLS condicionada a spike.
- [x] Aprovar `Membership` muitos-para-muitos, empresa ativa no servidor, separação de `superadmin`, negação por padrão e ausência de bypass implícito.
- [x] Concluir o spike técnico descartável com Kysely no PostgreSQL 14 e SQLite auxiliar.
- [x] Revisar as ressalvas do spike e aceitar a ADR 0004 com checksum SHA-256 e domínio independente.
- [x] Concluir o spike PostgreSQL de RLS com role real, transação, pool e concorrência.
- [x] Revisar humanamente o relatório e registrar na ADR 0006 a forma de implementação da RLS.
- [x] Encerrar o gate técnico de RLS, preservando performance, PgBouncer e failover como riscos futuros separados.
- [x] Criar o índice e as sub-specs executáveis 002-A a 002-G.
- [x] Resolver normalização de e-mail, formato canônico de checksum, política de tipos e detecção de drift da 002-A.
- [x] Encerrar `PEND-002-008` e `PEND-002-009` e promover somente a 002-A para `PRONTA_PARA_IMPLEMENTAR`.
- [x] Preparar 002-A como spec ativa e o modo `implementation` para a próxima execução, sem implementar nesta revisão documental.
- [x] Implementar e validar somente 002-A1 — infraestrutura Kysely, tipos, migrator e checksum `v1`.
- [ ] Autorizar e executar 002-A2 em uma nova execução, sem avanço automático.
- [ ] Resolver as decisões críticas da SPEC 002.
- [ ] Executar a 002-A em uma execução de implementação explicitamente autorizada.

---

## 15. Registro de execução atual

```yaml
last_execution:
  date: "2026-07-18"
  spec: "002-A"
  increment: "002-A1"
  mode: "implementation"
  status: "CONCLUIDO"
  summary: "Somente 002-A1 foi implementado: Kysely 0.29.4, drivers PostgreSQL/SQLite, boundaries, MoneyDecimal/UUID/UTC, adapters exatos, migrator externo, checksum SHA-256 e canonicalização UTF-8 v1 com metadados e falha por alteração. A migration criada contém apenas infraestrutura técnica de integridade. Nenhuma tabela de identidade/tenancy, repository, role, RLS, endpoint, frontend ou item de 002-A2 foi criado. A 002-A fica EM_IMPLEMENTACAO; SPEC 002 continua EM_ESPECIFICACAO e 002-B a 002-G/SPEC 003 continuam BLOQUEADAS."
  tests:
    - "pnpm check: aprovado — lint, boundaries, Compose, typecheck, 42 testes unitários, 7 testes de integração, 2 testes PostgreSQL 14 e build do monorepo."
    - "pnpm test:sqlite: aprovado — 2 testes do migrator, incluindo up/down, metadados e adulteração fail-closed."
    - "Container PostgreSQL local: healthy e publicado somente em 127.0.0.1:5432."
    - "db:migrate:up/status/down: aprovados em arquivo SQLite temporário removido ao final."
    - "pnpm audit e pnpm audit --prod: aprovados — nenhuma vulnerabilidade conhecida."
    - "Auditoria estática de secrets: aprovada; .env não rastreado e nenhum padrão conhecido de credencial encontrado."
  blockers:
    - "002-A2 e etapas posteriores não foram autorizadas nesta execução."
    - "Matriz/delegação RBAC, MFA/bootstrap, recuperação e auditoria continuam como gates da SPEC 002 e dos incrementos posteriores, sem bloquear a 002-A."
  future_risks:
    - "PEND-002-010: performance RLS, PgBouncer e failover exigem validação futura separada e não bloqueiam a implementação inicial."
  next_recommended_action: "Solicitar autorização específica para 002-A2 e definir seu menor escopo antes de criar qualquer schema definitivo de identidade/tenancy. Não iniciar 002-A2, 002-B nem avançar a SPEC 002 ou a SPEC 003 automaticamente."
```

O Codex deve atualizar esse bloco ao final de cada execução relevante.

---

## 16. Comando lógico para o Codex

Ao receber instrução para executar, o agente deve interpretar:

```text
Leia AGENTS.md.
Leia EXECUTAR.md.
Identifique a spec ativa.
Não execute outra spec.
Aplique as ADRs e skills relacionadas.
Siga todas as fases.
Não acesse produção.
Não avance automaticamente.
```

---

## 17. Regra final

Este arquivo é o controlador da ordem de trabalho.

- `AGENTS.md` define as regras permanentes.
- `EXECUTAR.md` define o que executar agora e em qual sequência.
- `docs/sdd` define o que cada funcionalidade deve fazer.
- `docs/adr` registra decisões arquiteturais.
- `docs/skills` define como analisar e implementar com qualidade.
- `PROMPT-CHAVE.md` inicia cada sessão do Codex.
