# Plano de migração — MesaChef Platform

## 1. Estado e finalidade

- **Estado:** planejamento documental inicial.
- **Spec de origem:** SPEC 000 — Visão do produto.
- **Autorização desta execução:** inventário e planejamento; nenhuma migração de dados está autorizada.
- **Execução futura:** condicionada à SPEC 011, aos schemas de destino estabilizados e a uma autorização explícita.

Este documento define a estratégia de migração do sistema de referência para a nova plataforma. Ele não é um runbook de produção e não autoriza acesso, extração, alteração ou exclusão de dados reais.

## 2. Princípios obrigatórios

1. Migrar comportamento e dados necessários ao produto, não a estrutura interna do legado.
2. Definir o modelo de destino pelas specs e ADRs da nova plataforma antes de fechar qualquer mapeamento físico.
3. Preservar isolamento por empresa em todas as etapas e derivar o vínculo empresarial de fonte validada.
4. Tratar dinheiro com representação decimal exata ou inteiro em centavos, com escala e arredondamento documentados.
5. Executar cargas idempotentes, auditáveis, reconciliáveis e repetíveis.
6. Não transportar senhas, tokens, chaves, certificados ou credenciais de integração sem um procedimento específico e aprovado; por padrão, reprovisioná-los.
7. Realizar ensaios e validação final em PostgreSQL 14. SQLite não representa integralmente o ambiente de destino.
8. Nunca copiar migrations, SQL, funções ou componentes do projeto de referência.
9. Evitar mudanças destrutivas na origem e manter o legado em modo somente leitura durante extrações autorizadas.
10. Definir rollback, RPO, RTO e responsáveis antes do primeiro corte.

## 3. Escopo preliminar dos dados

| Classe | Tratamento padrão | Exemplos observados |
|---|---|---|
| Dados mestres | Migrar após deduplicação e validação | empresas, usuários, categorias, itens, fornecedores |
| Dados operacionais | Migrar com vínculo empresarial e reconciliação | compras, pedidos, ajustes, histórico de estoque |
| Configurações de negócio | Migrar somente após equivalência semântica | precificação, custos, alertas, preferências |
| Histórico analítico | Migrar ou recomputar conforme decisão da spec | snapshots de CMV, produção/self-service, logs de envio |
| Dados derivados | Preferir recomputar quando a regra de destino estiver validada | saldos, indicadores, totais e resultados |
| Auditoria | Preservar com origem identificada e política de retenção | eventos administrativos e operacionais críticos |
| Segredos | Reprovisionar; não copiar por padrão | SMTP, WhatsApp, cron e tokens |
| Artefatos sem uso comprovado | Quarentenar ou excluir do escopo por decisão explícita | `custom_columns`, `password_history`, `whatsapp_credentials` |

Esta classificação é preliminar. O mapeamento coluna a coluna somente poderá ser aprovado após a modelagem das specs de domínio e a autorização de acesso a uma fonte representativa e saneada.

## 4. Critérios de entrada

Antes de iniciar qualquer implementação ou execução de migração, devem estar atendidos:

- specs de identidade, empresas, estoque, compras, fichas técnicas, precificação, CMV, self-service, WhatsApp e auditoria aprovadas no nível necessário;
- SPEC 011 autorizada e sem conflito crítico;
- schemas de destino versionados e validados em PostgreSQL 14;
- matriz de correspondência origem/destino aprovada pelo responsável do produto;
- classificação de dados pessoais, política de retenção e base legal registradas;
- matriz de permissões e regras de isolamento multiempresa aprovadas;
- inventário de segredos concluído sem revelar valores;
- acesso à fonte autorizado, com escopo, responsável e janela definidos;
- backup e restauração da fonte sob responsabilidade do operador autorizado;
- ambientes de ensaio sem dados reais ou com dados protegidos;
- critérios de reconciliação, rollback, RPO e RTO aprovados;
- responsáveis por decisão, execução, validação e comunicação nomeados.

## 5. Estratégia por fases

### Fase 0 — Governança e congelamento de decisões

- resolver as pendências críticas da SPEC 000;
- aprovar linguagem de domínio, ownership e fronteiras dos módulos;
- definir a matriz de acesso e a classificação global versus empresarial;
- aprovar retenção, descarte e tratamento de dados pessoais;
- registrar ADRs adicionais quando uma decisão arquitetural exigir.

**Saída:** decisões rastreáveis e critérios de entrada aprovados.

### Fase 1 — Perfil e dicionário da origem

- obter uma extração autorizada ou relatório anonimizado;
- medir volume, nulidade, duplicidade, órfãos, formatos e cardinalidade por empresa;
- identificar timezone, escala decimal, unidade e semântica de cada campo relevante;
- inventariar registros globais, empresariais e sem vínculo válido;
- produzir um manifesto imutável da extração, com contagens e checksums quando permitido.

**Saída:** perfil de dados, dicionário e relatório de qualidade. A leitura estática do repositório não substitui esta fase.

### Fase 2 — Contratos e mapeamento para o destino

- mapear cada conceito da origem para agregado, entidade ou evento do destino;
- definir chaves técnicas, chaves de negócio e tabela de correspondência de IDs;
- documentar conversões de unidades, moedas, percentuais, status e timestamps;
- classificar cada campo como migrar, transformar, recomputar, reprovisionar, quarentenar ou descartar;
- definir invariantes e rejeições por módulo.

**Saída:** matriz origem/destino versionada e aprovada.

### Fase 3 — Extração e área de preparação

- extrair em modo somente leitura, por lote e com recorte temporal explícito;
- manter dados de empresas separados lógica e operacionalmente;
- registrar versão do extrator, janela, contagens e hash do manifesto;
- impedir segredos e campos fora do escopo na área de preparação;
- criptografar dados em trânsito e em repouso e limitar acesso pelo menor privilégio.

**Saída:** lotes rastreáveis e reproduzíveis, sem alteração da origem.

### Fase 4 — Transformação e saneamento

- normalizar identificadores, textos, datas, unidades e números;
- converter valores monetários sem `float` e registrar regras de arredondamento;
- resolver duplicidades e órfãos conforme regras aprovadas, nunca por suposição silenciosa;
- associar cada registro empresarial a uma empresa válida;
- enviar registros inválidos para quarentena com código de motivo e referência de origem;
- reprovisionar credenciais em fluxo separado.

**Saída:** lote validado ou rejeitado de forma explicável.

### Fase 5 — Carga controlada

A ordem conceitual inicial é:

1. empresas e configurações globais não secretas;
2. identidades, perfis, papéis e permissões;
3. categorias, itens e fornecedores;
4. fichas técnicas e configurações de precificação;
5. compras, ajustes e movimentos de estoque;
6. snapshots de CMV e registros de produção/self-service;
7. configurações não secretas e preferências de WhatsApp;
8. histórico e auditoria aprovados;
9. recomputação de saldos e indicadores derivados.

Cada lote deve usar uma chave de idempotência, preservar o mapa de IDs e ter unidade de transação explicitamente definida. Uma falha de empresa não deve contaminar os lotes de outra empresa.

### Fase 6 — Reconciliação e validação

- comparar contagens por entidade, empresa, status e período;
- reconciliar somatórios monetários com precisão definida;
- comparar quantidade inicial, entradas, saídas, ajustes e saldo calculado;
- verificar referências órfãs, unicidade, constraints e invariantes;
- testar isolamento entre empresas e autorização por papel;
- verificar trilha de auditoria, dados pessoais e ausência de segredos;
- executar testes de migrations em banco vazio e sobre base representativa;
- validar concorrência, locks, índices e cálculos no PostgreSQL 14.

Diferenças devem ser explicadas por uma regra aprovada ou bloquear a promoção do lote.

### Fase 7 — Ensaios de migração

- realizar ao menos dois ensaios completos com a mesma automação prevista para o corte;
- medir duração, falhas, volume de quarentena e tempo de rollback;
- testar restauração, reexecução idempotente e comunicação de incidente;
- obter aceite funcional por amostragem de empresas e fluxos críticos;
- congelar a versão do runbook e das ferramentas aprovadas.

**Saída:** relatório de ensaio e decisão formal de pronto/não pronto.

### Fase 8 — Piloto e corte

- escolher piloto com critérios de risco e representatividade;
- comunicar janela e congelar gravações conforme plano aprovado;
- gerar extração incremental final;
- carregar, reconciliar e executar smoke tests;
- liberar acesso gradualmente após aceite dos responsáveis;
- preservar a origem conforme a política de retenção e o plano de rollback.

Nenhuma atividade desta fase está autorizada por este documento.

### Fase 9 — Estabilização e encerramento

- monitorar erros, reconciliação, desempenho e suporte por período definido;
- resolver ou aceitar formalmente itens de quarentena;
- emitir relatório final por empresa e por módulo;
- revogar acessos temporários e destruir cópias intermediárias conforme política;
- desativar o legado somente mediante autorização separada, evidência de restauração e fim da janela de rollback.

## 6. Ondas funcionais propostas

| Onda | Conteúdo | Dependência principal |
|---:|---|---|
| 0 | empresas, identidade, papéis e permissões | specs 001 e 002 |
| 1 | categorias, itens, unidades e fornecedores | specs 004 e 005 |
| 2 | compras, ajustes e histórico de estoque | specs 004 e 005 |
| 3 | fichas técnicas, custos e precificação | SPEC 006 |
| 4 | CMV, lucro e relatórios | SPEC 007 |
| 5 | produção e self-service | SPEC 008 |
| 6 | preferências, logs e integração WhatsApp | SPEC 009 |
| 7 | auditoria consolidada e históricos remanescentes | SPEC 010 |

A ordem poderá mudar por decisão registrada. A SPEC 000 não autoriza nenhuma dessas ondas.

## 7. Reconciliação mínima por domínio

| Domínio | Evidência mínima |
|---|---|
| Empresas e usuários | contagem por empresa e papel; usuários ativos/inativos; ausência de associação cruzada |
| Estoque | itens, unidades, movimentos e equação de saldo por empresa e data de corte |
| Compras | cabeçalhos, itens, fornecedor, total e efeito aprovado no estoque |
| Fichas técnicas | produto, rendimento, ingredientes, quantidade e ausência de ciclos |
| Precificação | custos, percentuais, arredondamento e preço calculado/revisado |
| CMV | estoque inicial, compras, estoque final, CMV teórico/real e período |
| Self-service | produção, sobra, consumo, venda, custo e resultado por dia |
| WhatsApp | preferências e metadados autorizados; credenciais reprovisionadas |
| Auditoria | ator, empresa, ação, alvo, timestamp e origem da migração |

## 8. Tratamento de erros e quarentena

Um registro rejeitado deve conter, sem expor dados além do necessário:

- identificador do lote;
- referência opaca à origem;
- empresa esperada;
- entidade e etapa;
- código e descrição segura do erro;
- data, versão da regra e estado de resolução;
- responsável pela decisão, quando houver correção manual.

Não corrigir silenciosamente a fonte nem converter rejeições em valores padrão sem regra aprovada. A reexecução deve processar somente itens elegíveis e manter histórico de tentativas.

## 9. Segurança, privacidade e multiempresa

- contas de migração terão prazo, escopo e menor privilégio;
- extrações serão criptografadas, inventariadas e eliminadas conforme retenção;
- logs não conterão senhas, tokens, certificados ou payloads pessoais desnecessários;
- segredos serão reprovisionados em cofre ou variáveis de ambiente, nunca no repositório;
- ações manuais e de superadmin serão auditadas;
- testes negativos provarão que uma empresa não consulta, altera ou infere dados de outra;
- relatórios de reconciliação serão segmentados por empresa e terão acesso restrito;
- mascaramento ou anonimização será aplicado em ambientes não produtivos.

## 10. Estratégia de corte e rollback

O runbook futuro deverá especificar, no mínimo:

- responsáveis e canais de decisão;
- horário de congelamento, extração, validação e liberação;
- RPO e RTO aprovados;
- critérios quantitativos de sucesso;
- critérios de abortar antes da liberação;
- gatilhos de rollback após a liberação;
- procedimento de retorno do tráfego e das gravações ao legado;
- tratamento das gravações ocorridas após o corte;
- comunicação e preservação de evidências.

Gatilhos preliminares de rollback incluem falha de isolamento, divergência monetária acima da tolerância aprovada, perda de registros, indisponibilidade além do RTO ou impossibilidade de auditar operações críticas. As tolerâncias ainda precisam de decisão.

## 11. Riscos principais

- `company_id` opcional ou políticas históricas podem ocultar registros sem tenant confiável;
- saldos mutáveis e operações cliente-orquestradas podem produzir divergências ou cargas parciais;
- uso de `number` no cliente e parsing inconsistente podem ter alterado valores monetários;
- coexistência de modelos antigos e novos pode gerar duplicidade semântica;
- unidades e tamanhos de embalagem não têm semântica uniforme comprovada;
- credenciais e configurações globais exigem segregação especial;
- funções, triggers, RLS, arrays, enums e jobs do PostgreSQL não são reproduzidos fielmente em SQLite;
- não houve acesso autorizado a uma base representativa nesta execução.

## 12. Decisões ainda necessárias

As decisões são controladas em `docs/qa/pendencias.md`, especialmente:

- fonte oficial, janela e autorização de dados;
- matriz de permissões e classificação global/empresa;
- precisão, escala e arredondamento;
- equivalência de unidades e custos;
- regras transacionais de compras, estoque e exclusões;
- retenção de auditoria e dados pessoais;
- escopo dos históricos e artefatos legados;
- RPO, RTO, tolerâncias, piloto e responsáveis;
- estratégia de reprovisionamento de credenciais.

## 13. Critério para considerar este plano pronto para execução

Este plano somente poderá mudar de **documental** para **executável** quando a SPEC 011 estiver autorizada, todos os critérios de entrada estiverem evidenciados, o runbook tiver sido ensaiado e a aprovação de produção estiver registrada. Até lá, nenhuma extração, carga, corte, rollback ou desativação está permitida.
