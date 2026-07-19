# AGENTS.md — MesaChef Platform

## 1. Missão do agente

Você é o agente de engenharia responsável pela reconstrução controlada do **MesaChef Platform**.

O sistema atual, desenvolvido com Lovable, React, Vite e Supabase, deve ser utilizado apenas como:

- referência funcional;
- referência de fluxos;
- referência visual;
- referência de regras de negócio;
- fonte para inventário de telas, rotas, entidades e integrações.

A nova solução deve ser escrita de forma independente, sem copiar literalmente código, componentes, migrations, funções, SQL ou estrutura interna da solução original.

A reconstrução deve seguir:

- Specification-Driven Development — SDD;
- Domain-Driven Design pragmático;
- Clean Code;
- Secure by Design;
- arquitetura de monólito modular;
- desenvolvimento incremental;
- testes automatizados;
- isolamento multiempresa;
- rastreabilidade entre spec, implementação e testes.

---

## 2. Fontes de verdade e ordem de precedência

Ao trabalhar neste repositório, considere a seguinte ordem de autoridade:

1. `AGENTS.md`
2. `EXECUTAR.md`
3. Spec ativa em `docs/sdd`
4. ADRs em `docs/adr`
5. Skills em `docs/skills`
6. Documentos de migração em `docs/migration`
7. Código existente no novo projeto
8. Projeto de referência em `../mesachef-reference`

Quando houver conflito:

- não improvise;
- interrompa a implementação da parte conflitante;
- registre o conflito em `docs/qa/pendencias.md`;
- proponha uma atualização de spec ou ADR;
- não altere decisões arquiteturais silenciosamente.

O projeto antigo nunca tem prioridade sobre as specs e ADRs da nova plataforma.

---

## 3. Estrutura esperada do repositório

```text
mesachef-platform/
├── AGENTS.md
├── EXECUTAR.md
├── PROMPT-CHAVE.md
├── README.md
├── .env.example
├── .gitignore
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── domain/
│   ├── database/
│   ├── shared/
│   └── ui/
├── docs/
│   ├── adr/
│   ├── migration/
│   ├── qa/
│   ├── sdd/
│   └── skills/
├── infra/
│   └── docker/
└── scripts/
```

---

## 4. Arquitetura obrigatória

### 4.1 Estilo arquitetural

A solução deve começar como **monólito modular**.

Cada módulo deve possuir limites claros, evitando dependências indevidas entre domínios.

Não criar microserviços nesta fase, salvo se uma ADR aprovada substituir essa decisão.

### 4.2 Frontend

Stack preferencial:

- React;
- Vite;
- TypeScript;
- Tailwind CSS;
- shadcn/ui;
- TanStack Query;
- React Hook Form;
- Zod.

Regras:

- o frontend nunca acessa diretamente PostgreSQL ou SQLite;
- o frontend não utiliza Supabase Client para acessar dados;
- regras críticas não ficam em componentes React;
- componentes de página não devem concentrar regras de negócio;
- chamadas remotas passam por uma camada de cliente da API;
- estados assíncronos devem tratar carregamento, erro, sucesso e repetição;
- ações de gravação devem possuir proteção contra duplo clique e múltiplos envios;
- formulários devem aceitar vírgula ou ponto em valores decimais quando aplicável;
- valores monetários devem ser formatados para `pt-BR`;
- o design deve preservar a identidade visual e os fluxos úteis do sistema atual, sem copiar a implementação.

### 4.3 Backend

Stack preferencial:

- Node.js;
- TypeScript;
- Fastify;
- validação por schema;
- API HTTP versionada;
- jobs internos para tarefas agendadas e integrações.

Regras:

- o backend é a fonte da verdade;
- toda entrada externa deve ser validada;
- autorização deve ocorrer no backend;
- todo endpoint autenticado deve conhecer `userId`, `companyId` e permissões;
- casos de uso não devem depender diretamente de framework HTTP;
- regras de domínio não devem importar bibliotecas de UI, HTTP ou banco;
- integrações externas devem ser isoladas por portas e adaptadores;
- erros devem ser tipados e convertidos em respostas HTTP consistentes.

### 4.4 Banco de dados

Ambientes:

- produção: PostgreSQL 14;
- pré-produção: PostgreSQL 14;
- desenvolvimento e homologação rápida: SQLite, quando compatível.

Regras:

- não assumir que SQLite representa integralmente PostgreSQL;
- toda funcionalidade deve passar por teste final em PostgreSQL 14 antes da produção;
- consultas específicas de PostgreSQL exigem ADR ou documentação explícita;
- acesso a dados deve ser encapsulado por repositories;
- migrations devem ser versionadas;
- migrations devem ser reversíveis quando tecnicamente seguro;
- scripts destrutivos exigem confirmação explícita e backup;
- não executar alteração diretamente no banco de produção;
- segredos e connection strings nunca entram no Git.

### 4.5 Dinheiro e números

- não usar `float` para dinheiro;
- usar decimal exato ou inteiro em centavos;
- documentar arredondamentos;
- armazenar percentuais com precisão definida;
- diferenciar valor monetário, quantidade, peso, rendimento e percentual;
- garantir aceitação de vírgula e ponto na entrada do usuário;
- normalizar o valor antes de enviá-lo ao backend.

---

## 5. Multiempresa e autorização

O MesaChef é multiempresa.

Regras obrigatórias:

- toda entidade pertencente a cliente deve possuir vínculo inequívoco com a empresa;
- consultas devem ser filtradas por empresa no backend;
- não confiar em `companyId` enviado livremente pelo frontend;
- o contexto da empresa deve ser derivado da sessão e validado;
- administradores de uma empresa não podem acessar outra empresa;
- usuários `staff` acessam apenas módulos e ações permitidos;
- `superadmin` possui visão global, mas suas ações devem ser auditadas;
- testes de isolamento entre empresas são obrigatórios;
- endpoints administrativos devem verificar papel e permissão;
- IDs previsíveis não substituem autorização;
- respostas de erro não devem revelar existência de recursos de outra empresa.

Papéis iniciais:

- `superadmin`;
- `admin`;
- `staff`.

Permissões devem ser modeladas de maneira extensível, evitando condicionais espalhadas pelo código.

---

## 6. Segurança obrigatória

Aplicar as skills de segurança existentes em `docs/skills/security`.

Requisitos mínimos:

- autenticação segura;
- hash forte de senhas, quando houver senha local;
- tokens com expiração;
- rotação e revogação quando aplicável;
- rate limiting em login e endpoints sensíveis;
- proteção contra força bruta;
- CORS restrito;
- headers de segurança;
- validação de payload;
- proteção contra SQL Injection;
- proteção contra XSS;
- proteção contra CSRF quando o método de autenticação exigir;
- logs sem senhas, tokens, certificados ou segredos;
- secrets apenas por variáveis de ambiente ou cofre;
- trilha de auditoria para ações críticas;
- princípio do menor privilégio;
- tratamento seguro de upload, quando existir;
- dependências analisadas;
- nenhuma credencial real em exemplos ou testes.

Operações críticas que exigem auditoria:

- login administrativo;
- criação e alteração de usuário;
- alteração de papel ou permissão;
- criação ou alteração de empresa;
- alteração de configuração global;
- ajuste manual de estoque;
- exclusão lógica ou física;
- alteração de preço e ficha técnica;
- acesso ou alteração de integração WhatsApp;
- migração de dados;
- ações de superadmin.

---

## 7. Uso das skills

As skills ficam em `docs/skills`.

Antes de uma tarefa, selecionar apenas as skills relevantes.

### 7.1 Arquitetura

Consultar `docs/skills/architecture` para:

- ADRs;
- trade-offs;
- estrutura modular;
- revisão arquitetural;
- avaliação de microserviços;
- dependências entre módulos;
- decisões de infraestrutura.

### 7.2 DDD

Consultar `docs/skills/ddd` para:

- bounded contexts;
- linguagem ubíqua;
- entidades;
- value objects;
- agregados;
- invariantes;
- serviços de domínio;
- eventos de domínio;
- refatoração do modelo.

### 7.3 Clean Code

Consultar `docs/skills/clean-code` para:

- nomenclatura;
- funções;
- classes;
- legibilidade;
- refatoração;
- testes;
- revisão;
- redução de duplicação.

### 7.4 Segurança

Consultar `docs/skills/security` para:

- autenticação;
- autorização;
- API;
- multiempresa;
- domínio seguro;
- revisão e refatoração de segurança.

### 7.5 Regra de aplicação

Antes de codificar, o agente deve declarar no resumo de execução:

- spec ativa;
- ADRs aplicáveis;
- skills selecionadas;
- riscos principais;
- testes planejados.

Não copiar integralmente as skills para o código ou para a resposta. Aplicar suas regras de forma objetiva.

---

## 8. Processo SDD obrigatório

Nenhuma funcionalidade de negócio deve ser implementada sem uma spec.

Para cada spec:

1. Ler a spec completa.
2. Validar objetivo, escopo, fora de escopo e critérios de aceite.
3. Identificar dependências.
4. Ler ADRs relacionadas.
5. Ler skills relevantes.
6. Inspecionar apenas as partes necessárias do projeto de referência.
7. Registrar dúvidas ou conflitos.
8. Produzir plano pequeno e verificável.
9. Criar ou atualizar testes.
10. Implementar o menor incremento necessário.
11. Executar lint, typecheck, testes e build.
12. Verificar segurança e isolamento multiempresa.
13. Atualizar documentação.
14. Atualizar o status em `EXECUTAR.md`.
15. Gerar resumo da entrega.

Não avançar para a próxima spec se a atual estiver com falhas críticas.

---

## 9. Inspeção do projeto de referência

O projeto antigo deve estar preferencialmente em:

```text
../mesachef-reference
```

É permitido:

- consultar rotas;
- observar telas;
- mapear comportamento;
- identificar campos e mensagens;
- levantar entidades;
- comparar fluxo funcional;
- entender integrações;
- registrar regras percebidas;
- produzir documentação de inventário.

É proibido:

- copiar arquivos inteiros;
- copiar componentes;
- copiar migrations;
- copiar SQL;
- copiar funções serverless;
- renomear código copiado para simular reescrita;
- preservar acoplamentos ruins apenas porque existem no original;
- acessar credenciais ou dados reais sem autorização.

Quando uma regra for inferida apenas pela observação do sistema antigo, marcá-la como:

```text
Hipótese funcional — necessita validação.
```

---

## 10. Modularização inicial

Módulos previstos:

- identity-access;
- companies-tenancy;
- users-permissions;
- audit;
- stock;
- suppliers;
- purchases;
- technical-sheets;
- pricing;
- cmv;
- profit-center;
- self-service;
- whatsapp;
- settings;
- dashboard.

Regras de dependência:

- módulos não acessam tabelas de outros módulos diretamente sem contrato;
- domínio não depende de infraestrutura;
- API depende de casos de uso, não do inverso;
- integrações externas ficam atrás de interfaces;
- tipos compartilhados devem ser mínimos;
- evitar um pacote `shared` genérico e sem responsabilidade;
- dependências circulares são proibidas.

---

## 11. Padrões de código

### 11.1 TypeScript

- modo estrito;
- evitar `any`;
- não ignorar erros com comentários sem justificativa;
- tipos de domínio devem representar significado real;
- usar unions e value objects quando reduzirem estados inválidos;
- exports públicos devem ser controlados;
- funções devem possuir responsabilidade clara.

### 11.2 Nomenclatura

- nomes em inglês no código;
- linguagem do domínio documentada em português e inglês quando necessário;
- nomes devem revelar intenção;
- não usar abreviações obscuras;
- manter nomes consistentes entre domínio, API, banco e frontend.

### 11.3 Comentários

Comentários devem explicar:

- motivo;
- restrição;
- trade-off;
- comportamento não óbvio.

Não comentar o que o código já expressa claramente.

### 11.4 Erros

Criar categorias coerentes, como:

- ValidationError;
- AuthenticationError;
- AuthorizationError;
- NotFoundError;
- ConflictError;
- DomainRuleError;
- IntegrationError.

Não retornar stack trace ao cliente em produção.

---

## 12. API

Regras:

- versionamento inicial `/api/v1`;
- endpoints orientados a recursos e casos de uso;
- DTOs separados de entidades de domínio;
- schemas de entrada e saída;
- paginação padronizada;
- filtros explícitos;
- idempotência para operações com risco de duplicidade;
- status HTTP coerentes;
- erros em formato consistente;
- correlation ID;
- documentação OpenAPI quando a fundação estiver pronta;
- health checks distintos para aplicação e dependências.

Exemplo de erro:

```json
{
  "error": {
    "code": "STOCK_ADJUSTMENT_REASON_REQUIRED",
    "message": "O motivo do ajuste é obrigatório.",
    "correlationId": "..."
  }
}
```

---

## 13. Testes

Pirâmide recomendada:

- testes unitários de domínio;
- testes de casos de uso;
- testes de repositories;
- testes de integração da API;
- poucos testes E2E dos fluxos críticos.

Obrigatórios:

- isolamento entre empresas;
- autorização por papel;
- validação de entrada;
- idempotência;
- cálculos monetários;
- arredondamento;
- custo por porção;
- preço sugerido;
- movimentação de estoque;
- histórico e auditoria;
- migrations em banco vazio;
- migrations sobre base representativa;
- execução mínima em PostgreSQL 14.

Não criar testes que apenas repetem a implementação.

---

## 14. Qualidade e Definition of Done

Uma tarefa só está concluída quando:

- atende integralmente à spec;
- não implementa itens fora do escopo;
- possui testes adequados;
- lint passa;
- typecheck passa;
- testes passam;
- build passa;
- migrations foram validadas;
- isolamento multiempresa foi verificado;
- riscos de segurança foram revisados;
- documentação foi atualizada;
- `EXECUTAR.md` foi atualizado;
- não existem segredos no diff;
- o resumo final informa arquivos alterados e limitações.

---

## 15. Git

### 15.1 Antes de alterar

Executar:

```bash
git status
git branch --show-current
```

Não iniciar mudanças com arquivos desconhecidos ou conflitos sem registrar isso.

### 15.2 Branches

Padrão sugerido:

```text
feat/spec-001-foundation
feat/spec-002-identity-access
fix/<descricao>
refactor/<descricao>
docs/<descricao>
```

### 15.3 Commits

Padrão:

```text
feat(module): descrição
fix(module): descrição
refactor(module): descrição
test(module): descrição
docs(module): descrição
chore(module): descrição
```

Cada commit deve ser pequeno, coerente e reversível.

Não executar:

- `git push --force`;
- rebase destrutivo;
- exclusão de branches remotas;
- reset destrutivo;
- alteração de histórico compartilhado;

sem autorização explícita.

### 15.4 Commits do agente

O agente pode preparar alterações e sugerir commits.

Só deve criar commits automaticamente quando o usuário solicitar ou quando o modo de execução registrado em `EXECUTAR.md` autorizar explicitamente.

---

## 16. Comandos destrutivos

Nunca executar sem autorização explícita:

- apagar banco;
- limpar volume Docker;
- `DROP DATABASE`;
- `DROP SCHEMA`;
- migrations destrutivas em produção;
- exclusão em massa;
- `git reset --hard`;
- `git clean -fd`;
- sobrescrever `.env`;
- remover dados persistentes;
- alterar firewall;
- publicar secrets;
- realizar deploy em produção.

---

## 17. Variáveis de ambiente

Manter `.env.example` sem valores reais.

Categorias sugeridas:

```dotenv
APP_ENV=
APP_PORT=
APP_URL=

DATABASE_URL=
DATABASE_PROVIDER=

AUTH_SECRET=
AUTH_TOKEN_TTL=

CORS_ALLOWED_ORIGINS=

LOG_LEVEL=

WHATSAPP_BASE_URL=
WHATSAPP_API_KEY=
```

Nunca imprimir os valores reais em logs ou respostas.

---

## 18. Formato obrigatório do plano antes da implementação

Antes de implementar, apresentar:

```text
SPEC ATIVA:
ADRs APLICÁVEIS:
SKILLS UTILIZADAS:
ESCOPO DESTA EXECUÇÃO:
FORA DO ESCOPO:
ARQUIVOS PROVÁVEIS:
TESTES PLANEJADOS:
RISCOS:
```

---

## 19. Formato obrigatório do resumo final

Após a execução, apresentar:

```text
SPEC EXECUTADA:
STATUS:
ALTERAÇÕES:
TESTES EXECUTADOS:
RESULTADOS:
MIGRATIONS:
SEGURANÇA E MULTIEMPRESA:
DOCUMENTAÇÃO:
PENDÊNCIAS:
PRÓXIMO PASSO RECOMENDADO:
```

---

## 20. Orquestração multiagente

### 20.1 Autoridade e limites

O agente principal é o orquestrador e permanece responsável pela decisão final,
pela consolidação dos resultados e pelo cumprimento de `AGENTS.md`,
`EXECUTAR.md`, specs e ADRs.

Regras obrigatórias:

1. o agente principal é o orquestrador;
2. somente um agente escritor pode alterar uma branch por vez;
3. agentes de análise e revisão podem trabalhar em paralelo, desde que sejam
   somente leitura;
4. incrementos dependentes não podem ser implementados simultaneamente;
5. o orquestrador deve esperar todos os agentes da fase antes de avançar;
6. resultados dos agentes devem ser consolidados e conflitos resolvidos antes
   da implementação;
7. após a implementação, revisores devem trabalhar em paralelo quando suas
   análises forem independentes;
8. o agente escritor deve corrigir os achados que o orquestrador aprovar, sem
   ampliar o escopo;
9. o gate final exige lint, limites arquiteturais quando disponíveis,
   typecheck, testes aplicáveis e build;
10. subagentes não podem fazer commit, push, merge, rebase, deploy ou alterar
   histórico;
11. nenhum subagente pode acessar ou alterar produção;
12. a liberação do próximo incremento continua dependendo de autorização
    humana explícita, mesmo quando todos os gates técnicos passarem.

Subagentes não podem criar outros subagentes; a profundidade máxima da
orquestração é um.

### 20.2 Fases da esteira

1. **Preparação e análise:** o orquestrador pode executar em paralelo
   `spec_guard`, `database_architect`, `security_reviewer` e `test_architect`.
2. **Consolidação:** o orquestrador espera todos, elimina duplicações, resolve
   divergências e publica um único plano verificável. Qualquer bloqueio do
   `spec_guard` impede a fase de escrita.
3. **Implementação:** somente uma instância de `implementation_worker` recebe o
   plano consolidado e o incremento autorizado.
4. **Revisão pós-implementação:** `integration_reviewer`,
   `security_reviewer`, `database_architect` e `test_architect` podem revisar em
   paralelo, todos em modo somente leitura.
5. **Correção:** o mesmo agente escritor corrige apenas achados aprovados pelo
   orquestrador; uma nova rodada de revisão é exigida quando a correção alterar
   comportamento ou persistência.
6. **Gate final:** o orquestrador executa ou confirma as validações obrigatórias,
   consolida as evidências e encerra o incremento sem avançar automaticamente.

### 20.3 Dependências e segurança operacional

- o grafo de dependências registrado em `EXECUTAR.md` é vinculante;
- um incremento bloqueado pode ser analisado, mas não implementado;
- análises paralelas não concedem autorização de escrita;
- a configuração project-scoped em `.codex/` só é considerada ativa quando o
  repositório estiver confiável e os agentes forem carregados corretamente;
- sandbox e instruções dos agentes são controles complementares; não substituem
  revisão do orquestrador, autorização humana nem isolamento de produção.

---

## 21. Regra final

Priorize:

1. correção;
2. segurança;
3. isolamento multiempresa;
4. clareza;
5. testes;
6. manutenção;
7. desempenho comprovadamente necessário.

Não priorize velocidade de geração de código em detrimento dessas regras.
