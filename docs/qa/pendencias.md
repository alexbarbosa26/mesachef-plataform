# Pendências — MesaChef Platform

## 1. Estado

- **Atualização:** 2026-07-18
- **Spec ativa:** 002 — Identidade, Autorização e Multiempresa
- **Estado da spec:** `EM_ESPECIFICACAO`; não pronta para implementação
- **Próxima spec:** 003 permanece `BLOQUEADA` e não foi iniciada

Este registro concentra conflitos, lacunas de decisão e hipóteses encontradas na leitura das especificações, ADRs e do projeto de referência. Nenhum item deve ser resolvido por suposição silenciosa. A prioridade indica risco para decisões futuras, não autorização para avançar de spec.

## 2. Legenda

| Prioridade | Significado |
|---|---|
| Crítica | impede aceite da visão ou uma decisão segura de arquitetura, segurança, multiempresa ou dados |
| Alta | precisa ser resolvida antes da spec de domínio correspondente ser considerada pronta |
| Média | pode ser refinada na spec indicada, desde que permaneça explicitamente registrada |

## 3. Bloqueios e conflitos

### BLOQUEIO-20260718-001 — Aceite da visão do produto — resolvido

- **Spec:** 000
- **Prioridade:** Crítica
- **Status:** resolvido em 2026-07-18 pelo responsável do produto.
- **Descrição:** a visão foi consolidada a partir dos documentos e do sistema de referência, mas ainda não possui validação explícita do responsável pelo produto quanto a objetivos, limites, atores, módulos e critérios de sucesso.
- **Impacto original:** a SPEC 000 não poderia ser concluída e a SPEC 001 não poderia ser liberada automaticamente sem esse aceite.
- **Evidência:** `docs/sdd/000-visao-produto.md`, seções de critérios de aceite e decisões abertas.
- **Resolução:** o responsável marcou a SPEC 000 como `CONCLUIDA`, liberou a SPEC 001 no commit anterior `eb672a4` e autorizou explicitamente esta execução de implementação.
- **Decisão necessária:** nenhuma para este bloqueio; as demais decisões funcionais continuam registradas separadamente.

### BLOQUEIO-20260718-002 — Matriz de autorização inconsistente

- **Spec:** 000; impacto futuro principal na 002 e na 003
- **Prioridade:** Crítica
- **Status:** parcialmente resolvido em 2026-07-18; negação por padrão, separação de papéis e ausência de bypass implícito foram aceitas. A matriz por módulo e ação continua aberta.
- **Descrição:** o menu do legado restringe várias funções a `admin`, enquanto diversas rotas verificam apenas autenticação; a rota inicial de qualquer usuário autenticado aponta para `/central-lucro`, embora o menu trate essa função como administrativa.
- **Impacto:** reproduzir o comportamento observado pode conceder acesso indevido; restringi-lo sem decisão pode alterar o produto.
- **Evidência:** `docs/migration/mapa-telas-rotas.md`, seções de matriz de rotas e inconsistências; `docs/migration/mapa-funcionalidades.md`, seção de acesso observado.
- **Opções:** tornar o menu a regra; tornar os guards a regra; definir uma nova matriz por módulo, recurso e ação.
- **Decisões humanas registradas:** autorização com negação por padrão; `superadmin` global separado; `admin`/`staff` empresariais; nenhum bypass implícito de tenant.
- **Recomendação remanescente:** definir uma matriz explícita `papel × módulo × ação` no backend, incluindo `read`, `create`, `update`, `delete`, exportação e ações críticas.
- **Decisão necessária:** acesso autorizado para cada ação de `superadmin`, `admin` e `staff`, inclusive página inicial e Central de Lucro.

### BLOQUEIO-20260718-003 — Vínculo empresarial e dados globais

- **Spec:** 000; impacto futuro principal na 002, 009, 010 e 011
- **Prioridade:** Crítica
- **Descrição:** o legado combina entidades empresariais, tabelas globais e colunas `company_id` opcionais; a leitura estática não prova a qualidade ou a completude dos vínculos nos dados reais.
- **Impacto:** risco de vazamento entre empresas, associação incorreta na migração e definição inadequada de ownership.
- **Evidência:** `docs/migration/mapa-banco-dados.md`, seções de isolamento e classificação; todas as 33 tabelas públicas têm RLS, mas a semântica de registros nulos ou globais varia.
- **Opções:** exigir empresa em toda entidade de cliente; manter entidades globais estritamente tipadas e auditadas; quarentenar registros sem vínculo; definir backfill autorizado.
- **Recomendação:** modelar explicitamente escopo `GLOBAL` ou `COMPANY`, proibir ambiguidade e validar o tenant no backend e na persistência.
- **Decisão necessária:** classificar cada entidade e estabelecer tratamento para registros legados sem empresa válida.

### BLOQUEIO-20260718-004 — Semântica monetária, unidades e transações

- **Spec:** 000; impacto futuro principal na 004, 005, 006, 007, 008 e 011
- **Prioridade:** Crítica
- **Status:** parcialmente resolvido em 2026-07-18 quanto à representação técnica de dinheiro; regras de arredondamento, percentuais, quantidades, unidades e transações de negócio continuam abertas.
- **Descrição:** o legado usa `numeric` no banco, `number` no cliente, escalas não uniformes, modelos de unidade sobrepostos e operações compostas sem atomicidade aparente.
- **Impacto:** risco de divergência de saldos, custos, preço, CMV e resultado, inclusive durante migração.
- **Evidência:** `docs/migration/inventario-projeto-atual.md`, seções de operações compostas, dinheiro e unidades; `docs/migration/mapa-banco-dados.md`.
- **Opções:** inteiro em centavos com quantidades decimais tipadas; decimal exato com escalas por conceito; modelo explícito de embalagem e conversão; comandos atômicos no backend.
- **Decisão humana registrada:** dinheiro usa `MoneyDecimal` baseado em `BigInt` com escala 4; PostgreSQL usa `numeric(24,4)` e SQLite auxiliar usa texto decimal canônico.
- **Recomendação:** decidir precisão, escala, arredondamento e semântica de unidade por domínio, e tornar operações de estoque/compras atômicas e idempotentes.
- **Decisão necessária:** regras oficiais de dinheiro, percentuais, quantidade, peso, rendimento, embalagem, custo unitário e reversão.

### BLOQUEIO-20260718-005 — Requisitos de segurança não comprovados pelo legado

- **Spec:** 000; impacto futuro principal na 002 e na 010
- **Prioridade:** Crítica
- **Descrição:** a página pública de confiança declara controles que não foram comprovados na inspeção estática, enquanto login e recuperação dependem de verificações predominantemente no cliente e não foi encontrado rate limiting próprio.
- **Impacto:** risco de transformar alegações visuais em requisitos incorretos ou manter lacunas de autenticação, força bruta e governança de senha.
- **Evidência:** `docs/migration/inventario-projeto-atual.md`, seções de autenticação e segurança; tabela `password_history` foi observada, mas seu uso não foi comprovado.
- **Opções:** validar cada controle com evidência operacional; redefinir os controles conforme threat model; revisar a comunicação pública.
- **Recomendação:** tratar a página de confiança como alegação a validar, executar threat modeling e especificar autenticação, revogação, rate limiting e recuperação no backend.
- **Decisão necessária:** controles oficiais e texto público correspondente, com responsáveis e evidências.

## 4. Fila de decisões

| ID | Prioridade | Tema | Evidência observada | Decisão necessária | Spec futura relacionada |
|---|---|---|---|---|---|
| PEND-000-001 | Média | Caminho do projeto de referência | `../mesachef-reference` não existe a partir deste repositório; a cópia localizada está em `../mesachef-migration/mesachef-reference` | corrigir a configuração ou criar o caminho canônico sem alterar o legado | 000 |
| PEND-000-002 | Alta | Objetivos e métricas | o legado mostra módulos, mas não prova prioridade, volume, disponibilidade ou resultado de negócio | aprovar prioridades e métricas mensuráveis de sucesso | 000 |
| PEND-000-003 | Média | Linguagem do produto | coexistem “Central de Lucro”, CMV, resultado, precificação e relatórios | definir significado, nome e fronteira de cada conceito | 000/007 |
| PEND-000-004 | Alta | Entrada decimal | foi observado parser que remove pontos antes de converter, podendo interpretar ponto decimal como separador de milhar | definir parser canônico para vírgula/ponto, mensagens e testes de borda | 004/005/006/008 |
| PEND-000-005 | Alta | Compra e estoque | inclusão e edição atualizam múltiplos registros; exclusões não demonstram reversão simétrica | definir comando atômico, idempotência, edição, cancelamento e reversão | 004/005 |
| PEND-000-006 | Alta | Ajuste de estoque | ajuste representa contagem física e alteração de saldo, mas exclusão não demonstra recomposição | decidir se ajustes são imutáveis, canceláveis ou reversíveis por novo movimento | 004 |
| PEND-000-007 | Alta | Ficha técnica | ingredientes são substituídos por exclusão e reinserção; existem composições aninhadas e prevenção de ciclo no banco | definir versionamento, vigência, rendimento, custo, ciclo e histórico | 006 |
| PEND-000-008 | Alta | Fórmula de precificação | foram observadas fórmulas e configurações globais/por produto, sem contrato oficial de escalas e arredondamento | aprovar fórmula, precedência, desconto, margem, markup e arredondamento | 006 |
| PEND-000-009 | Alta | CMV | cálculo observado usa estoque inicial + compras − estoque final; CMV real pode assumir o teórico; limites 5/10 aparecem na interface | definir fórmulas, fonte dos valores, limiares, fechamento e imutabilidade do snapshot | 007 |
| PEND-000-010 | Alta | Self-service | registros diários combinam produção, sobra, consumo, venda, CMV e resultado; linhas são substituídas separadamente | definir fórmula, fechamento, reabertura, versão e atomicidade | 008 |
| PEND-000-011 | Alta | Configurações | a tabela genérica e telas misturam alertas empresariais e SMTP/global | separar ownership, permissões e armazenamento seguro por tipo de configuração | 002/009/010 |
| PEND-000-012 | Alta | WhatsApp | há configuração global, preferências por empresa, job periódico e estruturas legadas sobrepostas | definir provedor, credenciais, habilitação, frequência, timezone, retenção e falhas | 009 |
| PEND-000-013 | Alta | Auditoria | o escopo, a imutabilidade, a retenção e o tratamento de dados pessoais não estão formalizados | definir eventos obrigatórios, ator, tenant, antes/depois, retenção e acesso | 010 |
| PEND-000-014 | Alta | Exclusão e retenção | há exclusões físicas aparentes em fluxos operacionais | decidir soft delete, cancelamento, retenção, anonimização e direito de exclusão | specs de domínio/010 |
| PEND-000-015 | Média | Artefatos legados | `custom_columns`, `password_history`, `whatsapp_credentials`, enum e tabela de categoria coexistem sem uso funcional comprovado | migrar, reprovisionar, quarentenar ou descartar cada artefato | specs de domínio/011 |
| PEND-000-016 | Alta | PostgreSQL × SQLite | RLS, triggers, enums, arrays, colunas geradas, `security definer`, `pg_cron` e `pg_net` são específicos ou divergentes | criar matriz de compatibilidade e gates obrigatórios em PostgreSQL 14 | 001 e specs persistentes |
| PEND-000-017 | Média | Identidade visual | foram observados logo laranja/preto/branco e interface corporativa azul, com temas claro/escuro | aprovar tokens, contraste, marca e nível de fidelidade visual | 003 |
| PEND-000-018 | Média | PWA e offline | há instalação, indicador offline e cache de rede, mas não sincronização completa de comandos | decidir escopo offline, dados cacheáveis e comportamento de gravações | 003 e domínios |
| PEND-000-019 | Crítica | Fonte de migração | não houve acesso a dump ou base representativa autorizada | definir fonte, responsável, janela, anonimização e critérios de qualidade | 011 |
| PEND-000-020 | Crítica | Corte e continuidade | RPO, RTO, tolerâncias, piloto, janela e responsáveis não estão definidos | aprovar runbook e critérios de abortar/rollback após ensaios | 011 |

## 5. Hipóteses funcionais a validar

Todas as afirmações abaixo resultam da observação do legado e não constituem regra aprovada:

- **Hipótese funcional — necessita validação.** Usuários `staff` deveriam acessar somente as rotas exibidas no menu, apesar de várias páginas aceitarem qualquer usuário autenticado.
- **Hipótese funcional — necessita validação.** A Central de Lucro é uma função administrativa e não a página inicial universal de usuários autenticados.
- **Hipótese funcional — necessita validação.** A exclusão de compras, pedidos ou ajustes deveria gerar reversão auditável, e não simplesmente remover o registro.
- **Hipótese funcional — necessita validação.** CMV real deve ser informado ou calculado por regra própria, em vez de assumir silenciosamente o CMV teórico.
- **Hipótese funcional — necessita validação.** Limites de 5% e 10% representam faixas oficiais de variação de CMV.
- **Hipótese funcional — necessita validação.** Fichas técnicas, precificações e registros de self-service precisam de versões históricas imutáveis após uso operacional.
- **Hipótese funcional — necessita validação.** Configurações globais de SMTP e WhatsApp são exclusivas de `superadmin`, enquanto preferências operacionais pertencem à empresa.
- **Hipótese funcional — necessita validação.** Tabelas sem uso comprovado são vestígios e não requisitos do novo produto.
- **Hipótese funcional — necessita validação.** O PWA deve manter instalação e leitura resiliente, mas não aceitar gravação offline sem uma estratégia explícita de sincronização e conflito.

## 6. Critério de atualização

Ao resolver um item, registrar data, decisor, decisão, documento alterado e evidência. Remover um item da lista sem essa rastreabilidade não é permitido. Decisões que mudem arquitetura devem gerar ou atualizar ADR; decisões de comportamento devem atualizar a spec correspondente antes de implementação.

## 7. Pendências da SPEC 001

### PEND-001-001 — Estado divergente antes da implementação

- **Prioridade:** Resolvida em 2026-07-18 nesta execução.
- **Descrição:** `EXECUTAR.md` e a autorização do proprietário liberavam a SPEC 001, mas o cabeçalho da spec permanecia `DRAFT`.
- **Decisão aplicada:** sincronizar a spec para `EM_IMPLEMENTACAO` antes das alterações, completar suas seções obrigatórias e, após as verificações, registrá-la como `EM_VALIDACAO`, mantendo a SPEC 002 bloqueada.
- **Evidência:** `docs/sdd/001-fundacao-projeto.md` e commit anterior `eb672a4` que liberou a execução no controlador.

### PEND-001-002 — Validação do Docker/PostgreSQL 14 — resolvida

- **Prioridade:** resolvida em 2026-07-18 na execução de validação.
- **Descrição original:** Docker não estava acessível no ambiente da execução de implementação.
- **Impacto original:** o Compose só havia sido revisado estaticamente, impedindo concluir o critério PostgreSQL 14.
- **Resolução:** Docker Compose 5.3.0 iniciou e aguardou o container `postgres:14-alpine`; PostgreSQL 14.23 ficou `healthy`, aceitou conexões e sustentou o probe da API. Com o banco parado, live permaneceu 200 e ready passou a 503; após o reinício, ready voltou a 200 no mesmo processo.
- **Evidência:** `docs/qa/evidencias/spec-001.md`, seções 6, 9 e 10.
- **Decisão necessária:** nenhuma; a pendência está encerrada e nenhum volume foi removido.

### PEND-001-003 — ORM ou query builder

- **Prioridade:** resolvida em 2026-07-18 após spike e aceite humano.
- **Status:** encerrada; ADR 0004 em `ACCEPTED`.
- **Descrição:** não existe schema, repository ou caso de persistência de negócio na SPEC 001.
- **Impacto:** escolher uma ferramenta agora criaria compromisso sem evidência suficiente.
- **Encaminhamento em 2026-07-18:** a ADR 0004 compara Drizzle, Prisma, Kysely e SQL explícito com repositories e recomenda Kysely condicionado a spike no PostgreSQL 14.
- **Evidência do spike:** `docs/qa/spikes/spec-002-kysely-persistence.md`; PostgreSQL 14.23 e SQLite auxiliar aprovados para o escopo, com ressalva de checksum e política de tipos.
- **Resolução:** Kysely foi aceito como query builder e infraestrutura, com domínio independente, PostgreSQL 14 oficial, SQLite auxiliar e camada obrigatória de checksum SHA-256 sobre o migrator.
- **Decisão humana original em 2026-07-18:** não aceitar a ADR 0004 antes da conclusão e revisão do spike com Kysely.
- **Decisão humana posterior:** migrations aplicadas são imutáveis; correções usam novas migrations; nome e checksum são registrados em tabela auxiliar; divergência falha fechada; execução ocorre em etapa separada de deploy, nunca no startup da API.
- **Decisão necessária:** nenhuma para escolha da estratégia. A implementação e
  seus testes dependem de autorização futura; o spike de RLS foi aceito, mas a
  SPEC 002-A continua em especificação por seus gates próprios.

## 8. Pendências da SPEC 002

### Registro de decisões humanas — 2026-07-18

| Decisão | Resultado | Rastreabilidade |
|---|---|---|
| ADR 0004 | `ACCEPTED`; Kysely, mapeamentos de tipos e checksum SHA-256 aprovados | PEND-002-001 encerrada |
| ADR 0005 | `ACCEPTED` | PEND-002-004 parcialmente resolvida |
| ADR 0006 | `ACCEPTED`; mecânica RLS do spike PostgreSQL aceita humanamente | PEND-002-003 parcialmente resolvida e PEND-002-006 encerrada |
| Usuário–empresa | muitos-para-muitos por `Membership` | PEND-002-002 encerrada |
| Empresa ativa | determinada e validada no servidor | PEND-002-002 encerrada quanto à autoridade do contexto |
| Papéis | `superadmin` global separado de papéis empresariais | PEND-002-003 parcialmente resolvida |
| Autorização | negação por padrão | PEND-002-003 parcialmente resolvida |
| Superadmin | nenhum bypass implícito de tenant | PEND-002-003 parcialmente resolvida |
| Evidência | SQLite não valida isolamento multiempresa | spike RLS validado somente no PostgreSQL 14; gate técnico encerrado |
| RLS | role não-owner/`NOSUPERUSER`/`NOBYPASSRLS`, `ENABLE` + `FORCE`, `USING` + `WITH CHECK` e contexto local transacional | ADR 0006 e PEND-002-006 |
| Separação de planos | contexts, pools, roles e repositories tenant/plataforma separados | ADR 0006; sem bypass implícito |
| Operações globais | iterar tenants explicitamente ou usar caminho de plataforma separado e auditado | ADR 0006 |
| Risco futuro | performance, PgBouncer e failover não comprovados | PEND-002-010, separada do gate encerrado |
| Ordem | SPEC 002 e 002-A em especificação; 002-B–G e 003 bloqueadas | `EXECUTAR.md` |

### PEND-002-001 — Estratégia de persistência e migrations

- **Prioridade:** resolvida em 2026-07-18 por decisão humana.
- **Status:** encerrada; ADR 0004 em `ACCEPTED`.
- **Descrição original:** query builder, dialects, transactions, constraints, tenant query e isolamento do domínio foram validados, mas o migrator nativo não detectava alteração de conteúdo sob o mesmo nome.
- **Resolução:** Kysely aceito na infraestrutura; domínio independente; PostgreSQL 14 oficial e SQLite auxiliar; tipos de dinheiro, UUID e datas definidos; migrations aplicadas imutáveis; correções por nova migration; checksum SHA-256 obrigatório em tabela auxiliar; divergência falha fechada; execução separada do deploy e ausente do startup da API.
- **Impacto resultante:** a estratégia de persistência não bloqueia mais a SPEC 002-A. Nenhuma dependência ou migration definitiva está autorizada por este encerramento.
- **Evidência:** `docs/qa/spikes/spec-002-kysely-persistence.md`, ADR 0004 e `docs/qa/evidencias/spec-002.md`, seção 16.
- **Fitness functions futuras:** impedir imports de Kysely no domínio; validar drift dos tipos; alterar migration aplicada deve falhar pelo checksum; API deve iniciar sem executar migrations; validações finais devem passar em PostgreSQL 14.
- **Decisão humana registrada:** o aceite da ADR não libera implementação. O
  spike de RLS foi posteriormente aceito; a SPEC 002-A continua em
  especificação até resolver normalização de e-mail, checksum canônico,
  tipos/drift e receber autorização explícita.
- **Decisão necessária:** nenhuma para esta pendência; cumprir a ADR em execução futura autorizada.

### PEND-002-002 — Associação multiempresa e empresa ativa

- **Prioridade:** resolvida em 2026-07-18 por decisão humana.
- **Status:** encerrada quanto à cardinalidade e à autoridade da empresa ativa; ADR 0006 em `ACCEPTED`.
- **Descrição original:** o legado associa perfil a uma empresa, enquanto a proposta usa identidade global com várias memberships e empresa ativa na sessão.
- **Decisão:** associação muitos-para-muitos por `Membership`; empresa ativa determinada e validada no servidor.
- **Impacto:** schema, login e autorização devem respeitar a decisão. A escolha automática quando existir uma única membership continua registrada em `DEC-002-016`, sem reabrir a autoridade do contexto.
- **Evidência:** inventário em `docs/migration`; ADR 0006; SPEC 002, seções 9, 10 e 20-C.
- **Evidência da resolução:** ADR 0006, SPEC 002, seção 25.1, e instrução humana de 2026-07-18.
- **Decisão necessária:** nenhuma para cardinalidade ou validação no servidor; somente o comportamento de seleção automática permanece aberto.

### PEND-002-003 — Matriz RBAC e limites de superadmin

- **Prioridade:** Crítica.
- **Status:** parcialmente resolvida; ADR 0006 em `ACCEPTED`, relacionada ao `BLOQUEIO-20260718-002`.
- **Descrição:** faltam códigos finais de permissão, capacidade delegável, decisão sobre papéis customizados e regra de acesso operacional de `superadmin`.
- **Impacto:** sem matriz explícita não é seguro implementar administração, menu, guards ou endpoints.
- **Evidência:** `docs/sdd/002-identity-access-multiempresa.md`, seções 12, 14 e 25; inconsistências do legado em `docs/migration/mapa-telas-rotas.md`.
- **Decisões humanas registradas:** negação por padrão; `admin`/`staff` no plano empresarial; `superadmin` global separado; nenhum bypass implícito de tenant.
- **Recomendação remanescente:** manter modelo extensível e adiar exposição de papéis customizados até decisão específica.
- **Decisão necessária:** aprovar matriz `papel × recurso × ação`, capacidade delegável, papéis customizados e eventual fluxo futuro de suporte explícito.

### PEND-002-004 — Política de autenticação, MFA e bootstrap

- **Prioridade:** Crítica.
- **Status:** parcialmente resolvida; ADR 0005 em `ACCEPTED`.
- **Descrição:** sessão opaca no servidor, sem refresh token para a web inicial, foi aceita. TTL, parâmetros Argon2id, política de senha, MFA administrativo e canal de bootstrap ainda exigem decisão/benchmark.
- **Impacto:** bloqueia autenticação, sessões e criação segura do primeiro superadmin.
- **Evidência:** ADR 0005 e SPEC 002, seções 13, 15, 16 e 25.
- **Decisão humana registrada:** aceitar a estratégia de sessão, rotação, expiração e revogação da ADR 0005; isso não autoriza implementar autenticação.
- **Recomendação remanescente:** 30 minutos de inatividade/12 horas absolutas como baseline, Argon2id e MFA obrigatório para `superadmin`.
- **Decisão necessária:** aprovar parâmetros, tecnologia MFA e fluxo de ativação fora de banda.

### PEND-002-005 — Entrega de recuperação e ativação

- **Prioridade:** Alta.
- **Status:** aberta.
- **Descrição:** não há provedor de e-mail, domínio confiável de links, tratamento de bounce ou runbook de falha aprovado.
- **Impacto:** impede concluir recuperação de senha e ativação sem improvisar integração ou segredo.
- **Evidência:** ADR 0005 e SPEC 002, seções 14.2, 15.4 e 25.
- **Recomendação:** escolher provedor atrás de porta/adaptador, usar origem configurada, token de uso único e resposta genérica.
- **Decisão necessária:** provedor, remetente, domínio, templates, retenção e suporte.

### PEND-002-006 — RLS e contexto de tenant no pool

- **Prioridade:** resolvida em 2026-07-18 por decisão humana.
- **Status:** encerrada quanto ao gate técnico de isolamento; ADR 0006 em
  `ACCEPTED` com mecânica concreta registrada.
- **Descrição original:** RLS foi aceita como direção de defesa em profundidade, mas `SET LOCAL` era apenas candidato; role de runtime, pool, query builder e concorrência ainda não tinham sido comprovados.
- **Resultado técnico:** PostgreSQL 14.23 validou role runtime não-owner e sem `BYPASSRLS`, `ENABLE` + `FORCE RLS`, `set_config(..., true)` transacional, negação por padrão, CRUD isolado, pool após commit/rollback, 40 transações concorrentes A/B, IDOR, repositories com filtro independente, contextos separados e job global sem resíduo.
- **Decisão:** adotar RLS como defesa em profundidade, com `USING` e
  `WITH CHECK`; role tenant distinta do owner, `NOSUPERUSER` e `NOBYPASSRLS`;
  `TenantContext` local à transação; filtros obrigatórios nos repositories;
  contexts/pools/roles tenant e plataforma separados; nenhum bypass implícito
  de superadmin ou variável global de processo.
- **Impacto resultante:** o gate técnico de isolamento não bloqueia mais a
  002-A. A sub-spec não é liberada automaticamente: continua
  `EM_ESPECIFICACAO` por outros gates e exige autorização explícita.
- **Evidência:** `docs/qa/spikes/spec-002-postgres-rls.md`, ADR 0006 e SPEC 002, seções 17, 18.6 e 21.3.
- **Risco preservado:** a credencial tenant permite solicitar `set_config` com
  um UUID; deve ficar no backend confiável, que deriva e valida a empresa.
- **Riscos fora da resolução:** performance, PgBouncer e failover estão em
  `PEND-002-010` e não invalidam a evidência funcional do spike.
- **Decisão necessária:** nenhuma para o gate técnico; repetir as fitness
  functions no schema definitivo durante a 002-A.

### PEND-002-007 — Retenção e privacidade da auditoria

- **Prioridade:** Alta.
- **Status:** aberta; relacionada a `PEND-000-013`.
- **Descrição:** eventos mínimos foram propostos, mas retenção, acesso, exportação, imutabilidade operacional e tratamento de dados pessoais não foram aprovados.
- **Impacto:** pode produzir registro excessivo, insuficiente ou incompatível com obrigações de privacidade.
- **Evidência:** `docs/sdd/002-identity-access-multiempresa.md`, seções 9.9, 19 e 25.
- **Recomendação:** allowlist de metadados, escopo explícito, acesso mínimo e retenção definida antes do incremento 002-E.
- **Decisão necessária:** política de retenção, responsáveis, consultas permitidas e processo de atendimento ao titular.

### PEND-002-008 — Normalização e alteração de e-mail

- **Prioridade:** Alta; bloqueadora da prontidão da 002-A.
- **Status:** aberta; decisão necessária antes da primeira migration de usuário.
- **Descrição:** a unicidade depende de uma normalização global estável, mas não foram decididos Unicode, case folding, alteração de endereço e revalidação.
- **Impacto:** risco de contas duplicadas, bloqueio indevido ou tomada de conta durante mudança de e-mail.
- **Evidência:** SPEC 002, invariantes e `DEC-002-013`.
- **Recomendação:** definir algoritmo único antes da primeira migration e tratar mudança como operação verificada, auditada e revogadora de sessões quando aplicável.
- **Decisão necessária:** regra canônica e fluxo de alteração.

### PEND-002-009 — Checksum canônico e tipos de tabela

- **Prioridade:** Crítica; bloqueadora da prontidão da 002-A.
- **Status:** aberta.
- **Descrição:** a ADR 0004 exige checksum SHA-256 e detecção de drift, mas
  ainda não define a representação canônica/versionada que será hasheada nem se
  os tipos de tabela serão mantidos manualmente, gerados ou introspectados.
- **Impacto:** implementar sem decisão pode produzir checksums diferentes entre
  ambientes, falsa detecção de adulteração ou drift silencioso entre schema e
  TypeScript.
- **Evidência:** ADR 0004, seções de migrations, fitness functions e questões
  abertas; relatório do spike Kysely, riscos 1–3.
- **Opções:** fonte TypeScript canônica normalizada com versão de formato;
  artefato SQL determinístico; geração/introspecção em CI com comparação de
  drift. A escolha deve permanecer confinada a `packages/database`.
- **Recomendação:** executar uma decisão documental curta/prova automatizada
  sobre duas máquinas/line endings, então registrar formato, algoritmo de
  ordenação/encoding e comando de drift na ADR 0004/002-A.
- **Decisão necessária:** representação de entrada do SHA-256, versão do formato
  e estratégia verificável de tipos/drift.

### PEND-002-010 — Performance RLS, PgBouncer e failover

- **Prioridade:** Média nesta fase; gate futuro antes de topologia
  pré-produtiva correspondente.
- **Status:** aberta e deliberadamente separada do gate técnico encerrado em
  `PEND-002-006`.
- **Descrição:** o spike não mediu overhead/planos com schema e volume reais,
  não usou PgBouncer e não simulou failover ou reconexão.
- **Impacto:** uma topologia futura pode mudar pooling, lifecycle de transação,
  latência ou recuperação de contexto. Isso não invalida o isolamento funcional
  já comprovado no PostgreSQL 14 local.
- **Evidência:** `docs/qa/spikes/spec-002-postgres-rls.md`, seção 15; ADR 0006,
  questões abertas.
- **Recomendação:** quando a topologia for definida, criar execução própria com
  carga representativa, modo explícito de PgBouncer e failover que confirme
  negação por padrão após reconexão.
- **Decisão necessária:** SLO/budget de overhead, modo/configuração do pooler,
  topologia de HA e critérios de recuperação segura.
