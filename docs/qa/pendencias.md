# Pendências — MesaChef Platform

## 1. Estado

- **Atualização:** 2026-07-18
- **Spec ativa:** 001 — Fundação técnica
- **Estado da spec:** `CONCLUIDA`
- **Próxima spec:** 002 permanece `BLOQUEADA` e não foi iniciada

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
- **Descrição:** o menu do legado restringe várias funções a `admin`, enquanto diversas rotas verificam apenas autenticação; a rota inicial de qualquer usuário autenticado aponta para `/central-lucro`, embora o menu trate essa função como administrativa.
- **Impacto:** reproduzir o comportamento observado pode conceder acesso indevido; restringi-lo sem decisão pode alterar o produto.
- **Evidência:** `docs/migration/mapa-telas-rotas.md`, seções de matriz de rotas e inconsistências; `docs/migration/mapa-funcionalidades.md`, seção de acesso observado.
- **Opções:** tornar o menu a regra; tornar os guards a regra; definir uma nova matriz por módulo, recurso e ação.
- **Recomendação:** definir uma matriz explícita `papel × módulo × ação` no backend, incluindo `read`, `create`, `update`, `delete`, exportação e ações críticas.
- **Decisão necessária:** acesso autorizado para `superadmin`, `admin` e `staff`, inclusive página inicial e Central de Lucro.

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
- **Descrição:** o legado usa `numeric` no banco, `number` no cliente, escalas não uniformes, modelos de unidade sobrepostos e operações compostas sem atomicidade aparente.
- **Impacto:** risco de divergência de saldos, custos, preço, CMV e resultado, inclusive durante migração.
- **Evidência:** `docs/migration/inventario-projeto-atual.md`, seções de operações compostas, dinheiro e unidades; `docs/migration/mapa-banco-dados.md`.
- **Opções:** inteiro em centavos com quantidades decimais tipadas; decimal exato com escalas por conceito; modelo explícito de embalagem e conversão; comandos atômicos no backend.
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

- **Prioridade:** Média.
- **Descrição:** não existe schema, repository ou caso de persistência de negócio na SPEC 001.
- **Impacto:** escolher uma ferramenta agora criaria compromisso sem evidência suficiente.
- **Recomendação:** criar ADR na primeira spec que introduzir persistência e comparar suporte a PostgreSQL, testes auxiliares SQLite, migrations, tipagem e operação.
- **Decisão necessária:** adiada de forma explícita; a fundação usa somente probes de conectividade.
