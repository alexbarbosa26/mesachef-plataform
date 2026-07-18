# SPEC 000 — Visão do Produto e Escopo da Reconstrução

## Status
EM_VALIDACAO

Conteúdo documental concluído em 2026-07-18 e mantido como spec ativa para validação do proprietário. Este estado não libera nem inicia a SPEC 001.

## 1. Contexto

O MesaChef é uma plataforma SaaS multiempresa destinada à gestão de restaurantes, lanchonetes, cafeterias, docerias e operações similares. A solução atual foi criada com Lovable, React, Vite e Supabase.

A nova plataforma será reconstruída em ambiente controlado pelo proprietário, utilizando o projeto atual apenas como referência funcional e visual. A implementação nova não deve copiar literalmente código, migrations, SQL, funções serverless ou componentes do projeto original.

O caminho configurado `../mesachef-reference` não estava presente durante o inventário. A referência foi localizada em `../mesachef-migration/mesachef-reference` e inspecionada estaticamente, sem execução, sem leitura de dados ou secrets e sem qualquer alteração.

## 2. Problema

A solução atual possui forte dependência da infraestrutura e dos padrões do Lovable/Supabase, dificultando:

- controle integral da arquitetura;
- evolução independente do backend;
- integração com PostgreSQL 14 próprio;
- testes e homologação controlados;
- portabilidade;
- governança técnica;
- aplicação consistente de DDD, SDD, Clean Code e Secure by Design.

## 3. Objetivo

Reconstruir o MesaChef como uma plataforma própria, modular, segura, testável e multiempresa, preservando os fluxos e resultados funcionais relevantes do produto atual.

## 4. Objetivos de negócio

- permitir a operação de múltiplas empresas em uma única plataforma;
- oferecer gestão de estoque, compras, fichas técnicas, precificação, CMV e lucro;
- suportar operações self-service;
- integrar comunicação por WhatsApp;
- oferecer visão administrativa global;
- reduzir dependência de plataformas proprietárias;
- possibilitar evolução incremental e sustentável.

## 5. Perfis de usuário

### Superadmin
Responsável pela administração global da plataforma, empresas, planos, configurações globais, integrações e monitoramento.

### Administrador da empresa
Responsável pela operação e configuração da própria empresa, usuários, estoque, compras, precificação, relatórios e integrações permitidas.

### Staff
Usuário operacional com acesso limitado aos módulos e ações autorizadas.

## 6. Módulos previstos

- Identity and Access;
- Companies and Tenancy;
- Users and Permissions;
- Audit;
- Stock;
- Suppliers;
- Purchases;
- Technical Sheets;
- Pricing;
- CMV;
- Profit Center;
- Self-Service;
- WhatsApp;
- Settings;
- Dashboard.

## 7. Escopo da reconstrução

Inclui:

- nova base frontend;
- nova API;
- nova camada de domínio;
- nova persistência;
- PostgreSQL 14;
- SQLite para desenvolvimento e homologação rápida;
- autenticação e autorização;
- isolamento multiempresa;
- testes;
- observabilidade;
- documentação;
- migração controlada de dados;
- preservação dos fluxos funcionais aprovados.

## 8. Fora de escopo inicial

- microserviços;
- alta disponibilidade multi-região;
- aplicativo móvel nativo;
- emissão fiscal completa;
- operação offline completa;
- billing financeiro automatizado;
- migração direta e irreversível para produção;
- alterações no sistema antigo durante a reconstrução.

Itens fora de escopo podem ser incluídos posteriormente por novas specs e ADRs.

## 9. Princípios do produto

- backend como fonte da verdade;
- isolamento rigoroso por empresa;
- regras críticas fora do frontend;
- segurança desde a modelagem;
- dinheiro sem uso de ponto flutuante;
- mudanças incrementais;
- documentação versionada;
- rastreabilidade entre requisito, código e teste;
- preservação da experiência útil do sistema atual;
- ausência de dependência direta do frontend com banco.

## 10. Requisitos não funcionais globais

- disponibilidade compatível com operação comercial;
- logs estruturados;
- correlation ID;
- auditoria de ações críticas;
- migrations versionadas;
- tempo de resposta adequado aos fluxos operacionais;
- proteção contra múltiplos envios;
- suporte a navegadores modernos;
- interface responsiva;
- acessibilidade progressiva, com navegação por teclado, foco visível, rótulos e contraste verificáveis;
- conformidade com princípios da LGPD;
- backups e rollback antes de migração.

Metas quantitativas de disponibilidade, desempenho, retenção e recuperação ainda não foram aprovadas e não devem ser inferidas a partir do legado.

## 11. Critérios de sucesso

- todos os módulos prioritários reconstruídos;
- isolamento entre empresas comprovado por testes;
- fluxos principais homologados;
- migrations validadas em PostgreSQL 14;
- ausência de acesso direto ao banco pelo frontend;
- documentação SDD e ADR atualizada;
- migração de dados executada com reconciliação;
- usuários conseguem operar sem perda funcional crítica.

## 12. Critérios de aceite

- [x] Perfis de usuário documentados.
- [x] Módulos e limites iniciais documentados.
- [x] Escopo e fora de escopo documentados.
- [x] Restrições técnicas registradas.
- [x] Projeto antigo definido apenas como referência.
- [x] Objetivos de qualidade documentados.
- [x] ADRs iniciais criadas e validadas contra o inventário.
- [x] Inventário de funcionalidades, rotas, telas, dados e integrações registrado.
- [x] Hipóteses funcionais separadas de requisitos aprovados.
- [ ] Visão, escopo e prioridades aprovados pelo proprietário do produto.
- [ ] SPEC 001 liberada após aprovação.

## 13. Dependências

Nenhuma.

## 14. Riscos

- regras implícitas no sistema antigo;
- dependência de dados ou comportamentos não documentados;
- diferenças entre SQLite e PostgreSQL;
- tentativa de migrar todos os módulos simultaneamente;
- regressão visual ou funcional;
- exposição indevida de dados multiempresa.
- semântica divergente de unidades, embalagens, quantidades e custos;
- operações compostas do legado sem transação ou idempotência;
- claims públicos de segurança não comprovados pela implementação observada;
- migração acidental de credenciais, hashes ou secrets;
- confusão entre dados calculados, snapshots históricos e fontes primárias.

## 15. Evidências esperadas

- [x] inventário de telas;
- [x] inventário de rotas;
- [x] inventário de tabelas;
- [x] mapa de funcionalidades;
- [x] glossário inicial;
- [x] lista de hipóteses funcionais;
- [x] ADRs iniciais validadas;
- [x] plano de migração documental;
- [x] registro de pendências e decisões necessárias.

As evidências estão consolidadas em `docs/migration`, `docs/qa/pendencias.md` e `docs/qa/evidencias/spec-000.md`.

## 16. Proposta de valor e resultados esperados

O MesaChef deve reduzir a incerteza operacional de negócios de alimentação ao conectar estoque, compras, custos, fichas técnicas, preços e resultado em uma visão coerente e auditável.

Resultados esperados para o cliente:

- conhecer quantidades, validade e valor do estoque;
- registrar compras e entender seu impacto em quantidade e custo;
- calcular custo de produção e preço de venda com premissas explícitas;
- acompanhar CMV, perdas, sobras e resultado operacional;
- padronizar rotinas de contagem e fechamento;
- receber alertas úteis sem expor dados ou credenciais;
- delegar tarefas a staff sem conceder privilégios administrativos;
- manter rastreabilidade das ações críticas.

Resultados esperados para a operação da plataforma:

- administrar várias empresas com isolamento verificável;
- evoluir módulos de forma incremental dentro de um monólito modular;
- reduzir dependência de Lovable, Supabase Client e funções serverless proprietárias;
- migrar dados por empresa com reconciliação e rollback;
- operar infraestrutura própria com observabilidade e governança.

## 17. Atores e necessidades

| Ator | Necessidade principal | Limite inicial |
|---|---|---|
| Superadmin | Administrar empresas e configurações globais, supervisionar integrações e incidentes | Toda ação global é auditada; acesso global não implica uso irrestrito de dados operacionais |
| Administrador da empresa | Configurar e operar todos os módulos da própria empresa | Não pode consultar, inferir ou alterar outra empresa |
| Staff | Executar rotinas operacionais autorizadas, especialmente contagem e consulta | Não administra empresas, usuários, permissões, secrets ou configurações críticas |
| Job interno | Executar tarefas agendadas e integrações em nome do sistema | Usa identidade técnica, escopo explícito, idempotência e auditoria |
| Operador de migração | Extrair, transformar, carregar e reconciliar dados autorizados | Atua em janela controlada, com backup, trilha e acesso temporário mínimo |

Não há, nesta spec, papel autônomo de cliente final do restaurante, fornecedor ou consumidor de API externa.

## 18. Contextos de domínio e limites iniciais

Os módulos abaixo são limites conceituais iniciais, não tabelas nem serviços independentes.

| Contexto | Tipo DDD inicial | Responsabilidade | Dados que não deve possuir |
|---|---|---|---|
| Identity & Access | Genérico | autenticação, sessão, revogação e identidade | regras de estoque ou preço |
| Companies & Tenancy | Suporte crítico | empresa, vínculo do usuário e contexto do tenant | credenciais de login e cálculos operacionais |
| Users & Permissions | Suporte crítico | papéis, permissões e administração de usuários | autorização delegada apenas ao frontend |
| Audit | Suporte crítico | eventos críticos, ator, alvo, empresa e correlação | secrets ou payloads sensíveis completos |
| Stock | Core | catálogo de insumos, unidades, saldo, contagem, validade e movimentos | cadastro de fornecedor ou regra de preço de venda |
| Suppliers | Suporte | cadastro e estado de fornecedores | saldo de estoque |
| Purchases | Core | compras, itens, custo de aquisição e entrada de estoque | alteração direta de tabelas do contexto Stock |
| Technical Sheets | Core | composição, rendimento, custo e versões de ficha técnica | configuração de autenticação |
| Pricing | Core | premissas, preço sugerido, preço praticado e análise de margem | movimentação de estoque |
| CMV | Core | apuração teórica/real, snapshots e divergências | reescrita de compras históricas |
| Profit Analytics | Core analítico | visão executiva consolidada e alertas | origem primária de valores operacionais |
| Self-Service | Core especializado | fechamento diário de buffet, produção, consumo, sobras e resultado | regra genérica de identidade |
| WhatsApp | Suporte | preferências por empresa, envio, agendamento e monitoramento | armazenamento de segredo no cliente |
| Settings | Suporte | configurações tipadas e explicitamente globais ou por empresa | chave-valor genérico sem classificação |
| Dashboard | Apresentação | projeções de leitura para decisão | regra de domínio ou persistência própria sem justificativa |

O nome `Profit Analytics` é provisório. A tela legada usa “Central de Lucro”, que aparenta ser um painel executivo e não um centro de lucro contábil. A decisão de linguagem está registrada em `docs/qa/pendencias.md`.

## 19. Mapa inicial de dependências

- Identity & Access, Companies & Tenancy e Users & Permissions fornecem o contexto de segurança para todos os demais módulos.
- Suppliers fornece identificação de fornecedor a Purchases.
- Purchases solicita ao Stock uma entrada idempotente; não grava o saldo diretamente.
- Technical Sheets referencia insumos publicados por Stock e, se aprovado, componentes publicados por outras fichas.
- Pricing consome custos e rendimentos publicados por Technical Sheets, além de suas próprias premissas.
- CMV consome movimentos e valorações de Stock e Purchases; ajustes físicos entram por contrato explícito.
- Self-Service pode importar custos publicados por Technical Sheets, mas mantém o próprio fechamento histórico.
- Profit Analytics e Dashboard consomem projeções dos contextos; não são fontes da verdade.
- WhatsApp consome uma projeção autorizada de alertas de Stock e usa configuração global do provedor mais preferências do tenant.
- Audit recebe eventos das operações críticas sem criar dependência do domínio em infraestrutura de log.

Integrações com o legado ou provedores externos devem usar camada anticorrupção para impedir que modelos de Supabase, Evolution GO ou SMTP contaminem o domínio novo.

## 20. Glossário inicial

| Termo em português | Nome de código sugerido | Definição inicial |
|---|---|---|
| Empresa | Company / Tenant | cliente isolado que possui dados e usuários |
| Insumo | Stock Item | item controlado em estoque e potencial ingrediente de ficha |
| Categoria de estoque | Stock Category | classificação de insumos dentro de uma empresa |
| Unidade base | Base Unit | unidade na qual saldo e custo unitário são normalizados |
| Unidade de compra | Purchase Unit | embalagem ou unidade comercial usada na compra |
| Tamanho da embalagem | Package Size | quantidade de unidades base contida em uma unidade de compra |
| Contagem de estoque | Stock Count | registro de quantidade física em uma data |
| Movimento de estoque | Stock Movement | alteração imutável de saldo, com causa e origem |
| Ajuste de estoque | Stock Adjustment | correção autorizada entre quantidade teórica e física |
| Compra | Purchase | aquisição de um ou mais itens de fornecedor |
| Ficha técnica | Technical Sheet | composição versionável que calcula custo e rendimento de um produto |
| Rendimento | Yield | quantidade útil produzida, expressa por massa ou porções |
| CMV | Cost of Goods Sold | custo de mercadorias vendidas no período, com definição a aprovar por contexto |
| Preço sugerido | Suggested Price | resultado calculado a partir de custo e premissas aprovadas |
| Preço praticado | Practiced Price | valor efetivamente informado para venda |
| Margem de contribuição | Contribution Margin | receita menos custos variáveis conforme fórmula aprovada |
| Fechamento self-service | Self-Service Daily Closing | registro diário de planejamento, produção, consumo, sobras e venda do buffet |
| Central de Lucro | Profit Analytics, provisório | painel executivo agregado; não confirmado como centro de lucro contábil |
| Snapshot | Snapshot | fotografia histórica imutável de valores e premissas em um instante ou período |

O glossário será refinado nas specs de módulo. Termos iguais com semânticas distintas devem permanecer separados, especialmente unidade, quantidade, custo, preço, percentual, rendimento e consumo.

## 21. Pré-condições e dependências da reconstrução

- aprovação desta visão e das prioridades pelo proprietário;
- ADRs 0001, 0002 e 0003 mantidas como `ACCEPTED`;
- fundação técnica definida somente na SPEC 001;
- política de identidade e isolamento definida na SPEC 002;
- matriz de permissões por ação antes de expor módulos;
- modelo monetário, arredondamento e unidades definidos nas specs de domínio;
- acesso a dados de origem autorizado apenas na SPEC 011;
- backup, ensaio e plano de rollback antes de qualquer cutover.

## 22. Regras globais de negócio

- `RN-000-001` — Toda entidade pertencente a cliente possui vínculo inequívoco com uma empresa.
- `RN-000-002` — O contexto de empresa é derivado da identidade autenticada e validado no backend; `companyId` livre do cliente não é confiável.
- `RN-000-003` — Um recurso de outra empresa deve ser indistinguível de um recurso inexistente para usuário sem acesso.
- `RN-000-004` — Superadmin, admin e staff recebem permissões por ação; papéis não substituem a verificação contextual.
- `RN-000-005` — O backend é a fonte da verdade para autorização, cálculos críticos e mudanças de estado.
- `RN-000-006` — Valores monetários usam representação exata e arredondamento documentado; `float`/`double` não são aceitos no domínio.
- `RN-000-007` — Entradas decimais aceitam vírgula ou ponto, são normalizadas uma única vez e rejeitam ambiguidades.
- `RN-000-008` — Quantidade, peso, rendimento, preço, custo e percentual são conceitos distintos e não compartilham tipo genérico sem validação.
- `RN-000-009` — Operações com risco de duplicidade possuem idempotência e proteção contra múltiplos envios.
- `RN-000-010` — Ações críticas geram auditoria com ator, empresa, ação, alvo, data e correlation ID.
- `RN-000-011` — Secrets não são enviados ao navegador, exportados na migração comum, registrados em logs nem incluídos no Git.
- `RN-000-012` — Exclusão, estorno e inativação possuem semânticas distintas e explícitas em cada módulo.
- `RN-000-013` — Uma regra observada somente no legado permanece hipótese até validação de negócio.
- `RN-000-014` — Dados derivados identificam suas fontes e premissas; relatórios não sobrescrevem fontes primárias.

## 23. Requisitos funcionais de visão

- `RF-000-001` — Autenticar usuários, encerrar e revogar sessões e recuperar credenciais com respostas que não enumerem contas.
- `RF-000-002` — Administrar empresas e seus estados por superadmin, com auditoria.
- `RF-000-003` — Administrar usuários, papéis e permissões no escopo autorizado.
- `RF-000-004` — Cadastrar insumos, categorias, unidades, mínimos, validade e responsáveis.
- `RF-000-005` — Registrar contagens e movimentos de estoque com histórico e causa.
- `RF-000-006` — Cadastrar fornecedores e compras, atualizando estoque por contrato transacional e idempotente.
- `RF-000-007` — Criar fichas técnicas com ingredientes, componentes aprovados, rendimento e custo reproduzível.
- `RF-000-008` — Configurar premissas e calcular preços, margens e alertas de viabilidade.
- `RF-000-009` — Apurar CMV e registrar snapshots reconciliáveis.
- `RF-000-010` — Registrar operação self-service e apresentar histórico e indicadores.
- `RF-000-011` — Exibir dashboards operacionais e executivos sem duplicar regras de domínio.
- `RF-000-012` — Configurar e executar alertas por WhatsApp, com preferências por empresa e credenciais globais protegidas quando esse modelo for aprovado.
- `RF-000-013` — Consultar e exportar auditoria conforme papel, empresa e retenção.
- `RF-000-014` — Oferecer configurações tipadas, diferenciando claramente escopo global e escopo de empresa.
- `RF-000-015` — Migrar dados autorizados com manifesto, reconciliação, relatório de rejeições e rollback.

Detalhes de tela, endpoint, fórmula e persistência pertencem às specs específicas e não são definidos por estes requisitos de visão.

## 24. Modelo de domínio conceitual

Entidades candidatas:

- Company, User, RoleAssignment e PermissionGrant;
- StockItem, StockCategory, StockCount, StockMovement e StockAdjustment;
- Supplier, Purchase e PurchaseLine;
- Product, TechnicalSheet, TechnicalSheetComponent e TechnicalSheetVersion;
- PricingPolicy, ProductPricingOverride e PracticedPrice;
- CMVPeriod e CMVSnapshot;
- SelfServiceDailyClosing e BuffetRecipeLine;
- WhatsAppPreference, MessageDeliveryAttempt e ProviderConfiguration;
- AuditEvent.

Value Objects candidatos:

- CompanyId, UserId, CorrelationId e IdempotencyKey;
- Money, Percentage, Quantity, Weight, Yield e UnitOfMeasure;
- EmailAddress, PhoneNumber e Cnpj;
- DateRange, BusinessDate e TimeOfDay;
- StockLevel, PackageConversion e UnitCost.

Agregados e invariantes só serão confirmados nas specs de módulo. O inventário do banco legado não define automaticamente agregados, entidades ou limites da nova solução.

## 25. Contratos, persistência e integrações

- A API HTTP inicial será versionada em `/api/v1` conforme ADR 0003.
- Contratos externos usam DTOs e schemas separados do domínio.
- Operações compostas de compra, ajuste, fechamento e migração precisam de fronteira transacional definida.
- PostgreSQL 14 é a persistência oficial; SQLite é auxiliar e não valida RLS, concorrência, extensões ou comportamento específico de PostgreSQL.
- Repositories encapsulam persistência e não expõem modelos de tabela à UI.
- Evolution GO, SMTP e qualquer provedor de identidade ficam atrás de portas e adapters.
- Endpoints, eventos, filas, ORM/query builder e formato definitivo de autenticação não são decididos nesta spec.

## 26. Segurança, privacidade e multiempresa

Prioridades de segurança da visão:

1. confidencialidade e isolamento entre empresas;
2. integridade de estoque, custos, preços, permissões e migrações;
3. rastreabilidade de ações críticas;
4. disponibilidade compatível com operação comercial.

Controles mínimos:

- autenticação segura, tokens com expiração e revogação;
- autorização no backend e no domínio quando a invariante exigir;
- rate limiting e proteção contra força bruta;
- validação de origem, tamanho, formato e semântica;
- CORS restrito e proteção CSRF quando aplicável ao mecanismo de sessão;
- headers de segurança e tratamento consistente de erros;
- criptografia em trânsito e proteção adequada em repouso;
- trilha de auditoria resistente a alteração pelo usuário comum;
- segregação de secrets e rotação de credenciais;
- minimização, retenção, anonimização e atendimento a titulares conforme LGPD;
- testes negativos de acesso cruzado para cada repository e endpoint autenticado.

A página pública de confiança do legado é evidência de comunicação, não prova de implementação. Suas afirmações devem ser revalidadas antes de reaproveitamento editorial.

## 27. Observabilidade e operação

- logs estruturados com nível, timestamp, serviço/módulo, correlation ID, userId e companyId quando seguro;
- métricas de erro, latência, autenticação, filas/jobs, tentativas de integração e reconciliação de migração;
- auditoria separada de log técnico;
- health check da aplicação separado de readiness das dependências;
- alertas para falhas repetidas de jobs, integração e isolamento;
- nenhuma senha, token, chave, conteúdo sensível de mensagem ou payload pessoal completo em logs;
- relógio e fuso explícitos em agendamentos; padrão de negócio observado é `America/Sao_Paulo`, ainda sujeito a confirmação para empresas em outros fusos.

SLOs e políticas de retenção serão definidos em ADR/spec posterior.

## 28. Casos de aceitação da visão

### Isolamento de empresa

- **Given** um usuário autenticado da empresa A
- **When** ele solicita um recurso pertencente à empresa B
- **Then** o backend nega o acesso sem revelar a existência do recurso e registra evidência segura quando aplicável.

### Menor privilégio

- **Given** um usuário staff
- **When** ele tenta executar uma ação administrativa
- **Then** a ação é negada no backend mesmo que a rota ou requisição seja construída manualmente.

### Entrada decimal

- **Given** valores equivalentes digitados com vírgula ou ponto
- **When** o valor é validado
- **Then** ambos produzem a mesma representação decimal exata ou uma mensagem de ambiguidade explícita.

### Operação idempotente

- **Given** uma compra enviada com a mesma chave de idempotência
- **When** a requisição é repetida por duplo clique ou timeout
- **Then** apenas uma compra e um conjunto de movimentos de estoque são efetivados.

### Migração por empresa

- **Given** um lote de migração aprovado para uma empresa
- **When** o lote é carregado em pré-produção
- **Then** contagens, totais monetários, relacionamentos e isolamento são reconciliados antes de qualquer cutover.

## 29. Estratégia de rollout e rollback

Rollout:

1. concluir specs e modelos de destino;
2. implementar por incremento vertical, começando por fundação e identidade/tenancy;
3. validar cada módulo em PostgreSQL 14;
4. ensaiar migração com dados anonimizados ou cópia autorizada;
5. pilotar com empresa selecionada e critérios de aceite mensuráveis;
6. executar cutover em janela aprovada, com freeze e reconciliação;
7. manter observação intensiva e capacidade de retorno.

Rollback:

- preservar backup consistente e manifesto da extração;
- não apagar nem modificar o legado como parte do primeiro cutover;
- interromper o lote diante de divergência de tenant, saldo, dinheiro ou integridade referencial;
- reverter o roteamento para o sistema anterior quando seguro e autorizado;
- invalidar credenciais temporárias de migração;
- documentar divergências e só repetir após correção e novo ensaio.

Nenhuma etapa de produção está autorizada pela SPEC 000.

## 30. Validação dos ADRs iniciais

| ADR | Resultado | Evidência do inventário | Condição de continuidade |
|---|---|---|---|
| 0001 — Monólito modular | Validada | SPA única, banco compartilhado, regras cruzadas e equipe pequena; não há driver comprovado para distribuição | fitness functions de dependência e contratos entre módulos na SPEC 001 |
| 0002 — PostgreSQL 14 e SQLite auxiliar | Validada com ressalva | legado depende de RLS, enums, triggers, functions, arrays, colunas geradas, `pg_cron` e `pg_net` | matriz de compatibilidade e gate obrigatório em PostgreSQL 14 |
| 0003 — API própria | Validada | frontend realiza consultas diretas e coordena mudanças compostas de compra, estoque e auditoria | todas as operações de negócio passam pela API e autorização de backend |

Não foi identificada contradição que exija alterar o status ou o texto dos ADRs nesta execução.

## 31. Hipóteses funcionais

Os itens abaixo foram inferidos por análise estática e não constituem requisito aprovado:

- **Hipótese funcional — necessita validação.** “Central de Lucro” é um painel executivo agregado, não um centro de lucro contábil.
- **Hipótese funcional — necessita validação.** Staff deve poder consultar estoque e precificação, mas alterar apenas quantidades atribuídas e rotinas explicitamente delegadas.
- **Hipótese funcional — necessita validação.** O custo do estoque representa custo por unidade base e a unidade de compra é convertida por tamanho da embalagem.
- **Hipótese funcional — necessita validação.** Registrar compra aumenta saldo e atualiza o custo unitário; editar ou excluir deve estornar o efeito anterior de forma transacional.
- **Hipótese funcional — necessita validação.** CMV teórico segue estoque inicial mais compras menos estoque final; CMV real depende de contagem física independente.
- **Hipótese funcional — necessita validação.** A precificação observada usa custo variável unitário e percentuais de despesas, lucro e investimento, com bases por unidade, quilo ou porção.
- **Hipótese funcional — necessita validação.** Fichas técnicas podem compor outras fichas, sem ciclos, e precisam preservar versão do custo usado.
- **Hipótese funcional — necessita validação.** Self-service calcula produção, consumo, sobra, venda, CMV estimado e resultado por fechamento diário.
- **Hipótese funcional — necessita validação.** Credenciais Evolution GO são globais, enquanto destinatários e frequência são preferências por empresa.
- **Hipótese funcional — necessita validação.** A experiência desejada inclui PWA instalável, tema claro/escuro e aviso de conectividade, mas não operação offline completa.

## 32. Dúvidas e decisões abertas

As decisões estão detalhadas e priorizadas em `docs/qa/pendencias.md`. As que impedem aprovação final da visão são:

- prioridade de módulos e definição do primeiro release utilizável;
- matriz de permissões por ação e contexto;
- semântica de unidade, compra, estorno e movimento de estoque;
- precisão e arredondamento de dinheiro, percentuais e quantidades;
- definição aprovada de CMV, preço, margem e fechamento self-service;
- regras de retenção, exclusão, auditoria e LGPD;
- política de autenticação, senha, sessão, rate limiting e recuperação;
- origem, qualidade e autorização para os dados da migração;
- tratamento de secrets e artefatos legados;
- identidade visual e prioridade da experiência PWA.

## 33. Base do inventário

Data de corte: 2026-07-18.

Fontes consultadas:

- `AGENTS.md`, `EXECUTAR.md` e esta spec;
- ADRs 0001, 0002 e 0003;
- skills selecionadas em `docs/skills`;
- projeto somente leitura em `../mesachef-migration/mesachef-reference`;
- rotas, páginas, hooks, utilitários, tipos gerados, migrations e funções serverless necessárias ao inventário.

Limitações:

- nenhum fluxo foi executado;
- nenhum banco ou dado real foi acessado;
- nenhuma credencial ou `.env` foi lida;
- o estado efetivo do banco foi inferido de migrations e tipos gerados;
- textos e comentários do legado podem estar desatualizados;
- toda regra não confirmada foi marcada como hipótese.
