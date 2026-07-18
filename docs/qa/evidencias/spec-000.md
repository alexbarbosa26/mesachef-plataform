# Evidências — SPEC 000

## 1. Identificação

- **Spec:** `docs/sdd/000-visao-produto.md`
- **Execução:** 2026-07-18
- **Modo:** `documentation`
- **Objetivo:** concluir a visão do produto, inventariar o sistema atual e validar os ADRs iniciais sem criar código de aplicação.
- **Estado proposto:** `EM_VALIDACAO`
- **Commit:** não criado; a execução não possui autorização para commit.
- **Produção:** não acessada nem alterada.

## 2. Estado inicial do repositório

- branch observada: `main`;
- rastreamento observado: `origin/main`;
- `EXECUTAR.md` já aparecia modificado antes desta execução, sem diferença textual no `git diff` e com indício de normalização de final de linha;
- não havia conflito Git identificado;
- os arquivos de migração solicitados estavam vazios e `docs/qa/pendencias.md` não existia.

A alteração preexistente em `EXECUTAR.md` foi preservada; somente trechos de status e registro desta execução foram atualizados.

## 3. Fontes lidas

- `AGENTS.md`, integralmente;
- `EXECUTAR.md`, integralmente;
- `docs/sdd/000-visao-produto.md`, integralmente;
- ADRs `0001`, `0002` e `0003`, integralmente;
- skills selecionadas de arquitetura, DDD, Clean Code e segurança;
- arquivos estritamente necessários do projeto de referência para rotas, páginas, hooks, tipos gerados, migrations, funções, estilos, PWA e integrações.

Não foram lidos arquivos `.env`, valores de segredo ou dados reais.

## 4. Projeto de referência

O caminho configurado `../mesachef-reference` não existe relativamente ao repositório atual. A cópia localizada e inspecionada, em modo somente leitura, foi:

```text
../mesachef-migration/mesachef-reference
```

O repositório de referência estava na branch `main`, sem alterações locais observadas antes da inspeção. Nenhum arquivo desse projeto foi modificado, executado ou copiado.

## 5. Inventário comprovado por leitura estática

| Item | Quantidade observada |
|---|---:|
| Rotas explícitas | 28 |
| Rota curinga | 1 |
| Arquivos de página | 29 |
| Hooks de aplicação | 21 |
| Tabelas públicas tipadas | 33 |
| Tabelas públicas com RLS habilitado nas migrations | 33 |
| Migrations | 63 |
| Edge Functions | 7 |
| Componentes de UI | 50 |
| Testes de exemplo encontrados | 1 |

Também foram inventariados:

- menus e guards por papel;
- autenticação, perfis, papéis e vínculo empresarial;
- estoque, compras, fornecedores e ajustes;
- fichas técnicas, precificação, CMV, Central de Lucro e self-service;
- configurações, auditoria e integração WhatsApp;
- PWA, identidade visual e estados de interface;
- funções, triggers, enums, RLS e dependências específicas do PostgreSQL;
- operações compostas e riscos de consistência observáveis na orquestração do cliente.

As quantidades descrevem a árvore inspecionada na data da execução e não provam uso em produção.

## 6. Validação dos ADRs iniciais

| ADR | Resultado | Evidência |
|---|---|---|
| 0001 — Monólito modular | validado | o conjunto funcional é coeso, compartilha identidade e dados, e não foi observado motivador comprovado para microserviços; o acoplamento do legado reforça a necessidade de limites modulares |
| 0002 — PostgreSQL 14 e SQLite auxiliar | validado com ressalvas | RLS, triggers, enums, arrays, colunas geradas, funções `security definer`, `pg_cron` e `pg_net` exigem gates em PostgreSQL 14 e uma matriz explícita de compatibilidade |
| 0003 — API própria sem acesso direto ao banco | validado | o legado acessa Supabase/PostgREST/RPC/Functions diretamente do navegador e orquestra operações compostas no cliente, confirmando os riscos descritos no ADR |

Nenhum ADR foi alterado, pois não foi identificada contradição que invalidasse as decisões aceitas. As ressalvas e decisões futuras foram registradas na spec e em `docs/qa/pendencias.md`.

## 7. Arquivos da entrega

- `docs/sdd/000-visao-produto.md`;
- `docs/migration/inventario-projeto-atual.md`;
- `docs/migration/mapa-funcionalidades.md`;
- `docs/migration/mapa-telas-rotas.md`;
- `docs/migration/mapa-banco-dados.md`;
- `docs/migration/plano-migracao.md`;
- `docs/qa/pendencias.md`;
- `docs/qa/evidencias/spec-000.md`;
- `EXECUTAR.md`, somente para refletir o estado e a evidência desta execução.

## 8. Critérios de aceite documentais

- [x] visão, problema, objetivos, escopo e fora de escopo registrados;
- [x] atores, módulos, restrições e requisitos não funcionais registrados;
- [x] regras globais de segurança, multiempresa, dinheiro e auditoria registradas;
- [x] rotas, telas, menus e controles de acesso observados inventariados;
- [x] capacidades funcionais e integrações observadas inventariadas;
- [x] modelo de dados legado inventariado conceitualmente, sem copiar SQL;
- [x] plano documental de migração registrado, sem executar migração;
- [x] ADRs iniciais confrontados com a evidência do legado;
- [x] hipóteses funcionais marcadas como necessitando validação;
- [x] conflitos e decisões abertas registrados;
- [ ] validação explícita do responsável pelo produto;
- [ ] autorização separada para alterar o estado ou iniciar a SPEC 001.

## 9. Verificações realizadas

### Documentação

- leitura de todos os arquivos obrigatórios e skills selecionadas;
- inspeção estática do projeto de referência, sem execução ou escrita;
- conferência de rotas, páginas, hooks, tabelas, migrations, funções e RLS;
- revisão de consistência entre a visão, inventários, ADRs e pendências;
- contagem automatizada na referência confirmou 29 declarações de rota, 29 páginas, 21 hooks, 33 tabelas públicas, 63 migrations, 7 Edge Functions, 50 componentes de UI e 1 arquivo de teste;
- varredura das migrations confirmou habilitação de RLS para as mesmas 33 tabelas públicas;
- `git diff --check` passou para os arquivos rastreados;
- varredura adicional dos nove arquivos da entrega não encontrou whitespace ao fim de linha, mojibake ou bloco cercado desbalanceado;
- varredura por padrões de chave privada, JWT e chaves conhecidas não encontrou segredo nos arquivos da entrega;
- o status final do projeto de referência permaneceu limpo na branch `main`;
- o status do novo projeto mostrou somente `EXECUTAR.md` e documentação dentro do escopo desta execução.

### Código, build e banco

- lint: **N/A** — nenhum código de aplicação foi criado ou alterado;
- typecheck: **N/A** — nenhum código de aplicação foi criado ou alterado;
- testes automatizados: **N/A** — execução restrita a documentação;
- build: **N/A** — execução restrita a documentação;
- migrations: **N/A** — nenhuma migration foi criada, copiada ou executada;
- PostgreSQL/SQLite: **N/A** — nenhum banco foi configurado ou acessado.

## 10. Segurança e multiempresa

- nenhum segredo foi coletado, impresso ou incluído nos documentos;
- a inspeção evitou `.env`, credenciais e dados reais;
- todas as entidades de cliente foram classificadas para futura validação de ownership;
- inconsistências entre menu, guards e RLS foram tratadas como risco, não como regra autorizada;
- o plano exige segmentação por empresa, menor privilégio, criptografia, auditoria e testes negativos;
- nenhuma alegação da página pública de confiança foi aceita como controle comprovado sem evidência.

## 11. Limitações

- a análise é estática e não comprova comportamento em produção;
- não houve acesso autorizado a banco, logs operacionais, métricas ou usuários;
- volumes, qualidade dos dados, nulidade, órfãos e duplicidades permanecem desconhecidos;
- fórmulas e regras inferidas do legado não foram transformadas em decisões de negócio;
- a identidade visual foi observada, mas não aprovada pelo responsável da marca;
- o caminho real do projeto de referência diverge da configuração do `EXECUTAR.md`.

## 12. Resultado

A documentação solicitada está preparada para validação do responsável do produto. A SPEC 000 não deve ser marcada como concluída enquanto o aceite e os bloqueios críticos não forem resolvidos. A SPEC 001 permanece bloqueada e fora do escopo desta execução.
