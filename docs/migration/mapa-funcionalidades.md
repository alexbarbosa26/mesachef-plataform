# Mapa de Funcionalidades — Sistema de Referência

## 1. Objetivo e legenda

Este mapa relaciona capacidades observadas no sistema antigo aos contextos previstos para a nova plataforma. Ele é descritivo; não aprova automaticamente comportamento, fórmula ou prioridade.

Estados:

- **Evidenciada:** há tela e fluxo de dados identificável.
- **Parcial:** existe implementação, mas faltam garantias ou etapas coerentes.
- **Legada:** artefato mantido sem uso funcional atual aparente.
- **Editorial:** texto ou comunicação, não funcionalidade comprovada.
- **Hipótese:** intenção inferida que exige validação.

Papéis citados são a intenção visível no menu/página. A autorização efetiva precisa ser redefinida e testada no backend.

## 2. Identidade, empresas e administração

| ID | Capacidade observada | Ator aparente | Estado | Contexto de destino | Evidência e observação |
|---|---|---|---|---|---|
| `AUTH-01` | login por e-mail e senha | público | Evidenciada | identity-access | autentica no Supabase e redireciona ao dashboard |
| `AUTH-02` | logout e restauração de sessão | autenticado | Evidenciada | identity-access | sessão persistida no client Supabase |
| `AUTH-03` | recuperação de senha por e-mail | público | Evidenciada | identity-access | função privilegiada gera link e envia por SMTP |
| `AUTH-04` | redefinição por link | público com token | Evidenciada | identity-access | valida sessão de recuperação e atualiza senha |
| `AUTH-05` | status ativo e expiração configurável | autenticado/admin | Parcial | identity-access | verificação principal ocorre após o login no cliente; enforcement global não foi comprovado |
| `AUTH-06` | histórico das últimas senhas | usuário/admin | Legada ou incompleta | identity-access | tabela e texto existem, mas gravação e bloqueio de reutilização não foram localizados |
| `TEN-01` | cadastrar e editar empresa | superadmin | Evidenciada | companies-tenancy | nome, documento e estado ativo |
| `TEN-02` | ativar/inativar empresa | superadmin | Evidenciada | companies-tenancy | impacto sobre sessões e acesso ainda não está explícito |
| `USR-01` | listar usuários e papéis | admin/superadmin | Evidenciada | users-permissions | escopo por empresa depende de RLS/profile |
| `USR-02` | criar admin ou staff | admin/superadmin | Evidenciada | users-permissions | função serverless cria auth user, profile e papel |
| `USR-03` | editar nome, papel, empresa, estado e expiração | admin/superadmin | Evidenciada | users-permissions | mudança de empresa/superadmin restrita na função |
| `USR-04` | reset administrativo de senha | admin/superadmin | Evidenciada | identity-access | autoriza por papel e tenant na função |
| `PERM-01` | visibilidade de menus por papel | autenticado | Evidenciada | users-permissions / web | controle de UX, não fronteira de segurança |
| `PERM-02` | autorização por policies RLS | autenticado | Evidenciada | users-permissions / API | precisa ser reconstruída como política de backend |
| `AUD-01` | registrar ações de estoque, preço e CMV | sistema/usuário | Parcial | audit | RPC protegida, mas chamada pelo cliente em muitos fluxos |
| `AUD-02` | consultar, filtrar e exportar auditoria | admin | Evidenciada | audit | ator, ação, entidade, data e detalhes |
| `SET-01` | configurar SMTP e testar envio | admin na UI; superadmin no banco atual | Parcial | settings | conflito de escopo e autorização |
| `TRUST-01` | página pública de segurança e privacidade | público | Editorial | settings/compliance | afirmações precisam de evidência técnica e revisão jurídica |

## 3. Estoque e produção

| ID | Capacidade observada | Ator aparente | Estado | Contexto de destino | Evidência e observação |
|---|---|---|---|---|---|
| `STK-01` | dashboard de estoque | staff/admin | Evidenciada | dashboard / stock | totais, alertas, categorias, itens sem/baixo estoque e vencimento |
| `STK-02` | exportar visão de estoque | staff/admin | Evidenciada | stock | formato e campos finais precisam ser especificados |
| `STK-03` | cadastrar e editar categoria | admin | Evidenciada | stock | hard delete observado; política alvo não definida |
| `STK-04` | cadastrar e editar insumo | admin | Evidenciada | stock | nome, unidade, custo, mínimo, saldo, validade e responsável |
| `STK-05` | ativar/inativar insumo | admin | Evidenciada | stock | itens inativos são removidos de rotinas operacionais |
| `STK-06` | excluir insumo | admin | Evidenciada | stock | hard delete observado; impacto em históricos exige decisão |
| `STK-07` | preencher contagem em lote | staff/admin | Evidenciada | stock | quantidade, validade, data e responsável; múltiplas chamadas no cliente |
| `STK-08` | descartar edição e exibir resumo da contagem | staff/admin | Evidenciada | stock / web | comportamento de UX útil a preservar |
| `STK-09` | registrar histórico de mudança de saldo | sistema | Evidenciada | stock | trigger de banco; leitura administrativa e tendência |
| `STK-10` | configurar limiar de baixo estoque e vencimento | admin | Evidenciada | settings / stock | valores armazenados em `settings` global chave-valor |
| `STK-11` | calcular valor total e por categoria | admin no menu | Evidenciada | stock | quantidade normalizada multiplicada por custo base |
| `STK-12` | mostrar tendência de valor | admin no menu | Evidenciada | stock / dashboard | usa histórico de estoque; sem especificação de periodicidade |
| `STK-13` | colunas personalizadas de estoque | admin | Legada ou incompleta | stock | tabela existe, consumidor de UI não foi localizado |
| `CALC-01` | fator de correção por peso bruto/líquido/perda | staff/admin | Evidenciada | stock / technical-sheets | calcula perda, rendimento e custo líquido |
| `CALC-02` | fator de cocção | staff/admin | Evidenciada | stock / technical-sheets | calcula perda/ganho e custo após cocção |
| `CALC-03` | salvar histórico de cálculo | staff/admin | Evidenciada | stock | tabela `production_calculations` |
| `CALC-04` | aplicar resultado a insumo existente ou novo | admin | Evidenciada | stock | semântica de custo/unidade requer validação |

## 4. Fornecedores, compras e ajustes

| ID | Capacidade observada | Ator aparente | Estado | Contexto de destino | Evidência e observação |
|---|---|---|---|---|---|
| `SUP-01` | cadastrar, editar e inativar fornecedor | admin | Evidenciada | suppliers | nome, CNPJ, telefone, e-mail e observação |
| `SUP-02` | excluir fornecedor | admin | Evidenciada | suppliers | hard delete; compras usam `SET NULL` e snapshot de nome |
| `PUR-01` | registrar compra avulsa | admin | Evidenciada | purchases | item, quantidade, custo, data, fornecedor e notas |
| `PUR-02` | editar compra avulsa e ajustar saldo | admin | Parcial | purchases / stock | lógica de delta está no cliente e não é transacional |
| `PUR-03` | excluir compra avulsa | admin | Parcial | purchases / stock | exclusão não demonstra estorno do saldo |
| `PUR-04` | criar ordem com múltiplos itens | admin | Evidenciada | purchases | fornecedor, nota fiscal, itens, embalagem e total |
| `PUR-05` | converter embalagem para unidade e custo base | admin/sistema | Evidenciada | purchases / stock | unidade de compra × tamanho da embalagem |
| `PUR-06` | atualizar estoque a partir da ordem | sistema | Parcial | purchases / stock | chamadas sequenciais; falha parcial pode deixar dados divergentes |
| `PUR-07` | excluir ordem de compra | admin | Parcial | purchases / stock | não há estorno de saldo evidente |
| `PUR-08` | consolidar compras por fornecedor | admin | Evidenciada | purchases / dashboard | visão analítica na página de compras |
| `ADJ-01` | registrar divergência físico x teórico | admin | Evidenciada | stock | tipos: perda, quebra e erro operacional |
| `ADJ-02` | atualizar saldo para quantidade física | sistema | Evidenciada | stock | deve virar operação atômica com movimento |
| `ADJ-03` | excluir ajuste | admin | Parcial | stock / audit | exclusão não demonstra reversão do saldo; semântica precisa de decisão |

## 5. Produtos, fichas técnicas e precificação

| ID | Capacidade observada | Ator aparente | Estado | Contexto de destino | Evidência e observação |
|---|---|---|---|---|---|
| `PRD-01` | cadastrar produto de venda | admin | Evidenciada | pricing | nome, categoria, unidade de venda e ativo |
| `PRD-02` | consultar produtos em modo limitado | staff | Evidenciada | pricing | tela informa acesso somente leitura |
| `PRD-03` | gerenciar categorias de produto | admin | Evidenciada | pricing | coexistem categoria customizada e enum legado |
| `TS-01` | criar/editar ficha técnica | admin | Evidenciada | technical-sheets | custo, mão de obra, tempo, embalagem, preço, rendimento e notas |
| `TS-02` | adicionar ingrediente de estoque | admin | Evidenciada | technical-sheets / stock | custo proporcional à quantidade e unidade |
| `TS-03` | adicionar outra ficha como componente | admin | Evidenciada | technical-sheets | trigger tenta impedir ciclo; regra precisa de especificação |
| `TS-04` | salvar ingredientes em lote | admin | Parcial | technical-sheets | apaga e reinsere em chamadas separadas |
| `TS-05` | precificar por unidade, kg ou porção | admin | Evidenciada | technical-sheets / pricing | base escolhida na ficha |
| `PRC-01` | configurar receita e custos mensais | admin | Evidenciada | pricing | receita mensal e despesas fixas detalhadas |
| `PRC-02` | configurar despesas variáveis | admin | Evidenciada | pricing | percentuais ativos somados |
| `PRC-03` | configurar lucro, investimento e limiares | admin | Evidenciada | pricing | globais por empresa |
| `PRC-04` | sobrescrever percentuais por produto | admin | Evidenciada | pricing | valores opcionais substituem configuração global |
| `PRC-05` | calcular custo variável unitário | admin | Evidenciada | pricing | ficha + mão de obra + embalagem |
| `PRC-06` | calcular preço sugerido e mínimo | admin | Evidenciada | pricing | fórmula observada no cliente; necessita aprovação |
| `PRC-07` | calcular CMV, lucro e margem aplicados | admin | Evidenciada | pricing | compara preço praticado à meta |
| `PRC-08` | classificar saudável/atenção/inviável | admin | Evidenciada | pricing | thresholds globais e lucro aplicado |
| `PRC-09` | simular desconto | admin | Evidenciada | pricing | componente específico; política comercial não documentada |
| `PRC-10` | relatórios e gráficos de precificação | admin | Evidenciada | pricing / dashboard | médias, ranking, alertas e categorias |
| `PRC-11` | exportar relatório de precificação | admin | Evidenciada | pricing | layout e precisão precisam de contrato |
| `RES-01` | cadastrar produto de revenda manual ou vinculado ao estoque | admin | Evidenciada | pricing | custo vinculado acompanha `stock_items.value` |
| `RES-02` | calcular preço sugerido de revenda | admin | Evidenciada | pricing | aquisição + embalagem e percentuais |
| `RES-03` | comparar preço praticado e lucro desejado | admin | Evidenciada | pricing | classifica viável/ajuste/dados ausentes |

## 6. CMV, lucro e self-service

| ID | Capacidade observada | Ator aparente | Estado | Contexto de destino | Evidência e observação |
|---|---|---|---|---|---|
| `CMV-01` | calcular CMV teórico por período | admin no menu | Evidenciada | cmv | estoque inicial + compras − estoque final |
| `CMV-02` | analisar CMV por produto e categoria | admin no menu | Evidenciada | cmv | custo e quantidades normalizadas |
| `CMV-03` | gerar snapshot com notas | admin | Evidenciada | cmv | real pode assumir teórico quando omitido |
| `CMV-04` | classificar divergência normal/alerta/crítica | admin | Evidenciada | cmv | limiares observados de 5% e 10%, não aprovados |
| `CMV-05` | excluir snapshot | admin | Evidenciada | cmv | necessidade de imutabilidade histórica a decidir |
| `PROFIT-01` | consolidar KPIs executivos | admin | Evidenciada | profit-center, nome provisório | estoque, compras, perdas, CMV, receita, preço e self-service |
| `PROFIT-02` | alertas e recomendações executivas | admin | Evidenciada | profit-center | regras estão no cliente e precisam de ownership |
| `PROFIT-03` | gráficos por período | admin | Evidenciada | profit-center / dashboard | 7, 30, 90 dias e mês atual |
| `SELF-01` | registrar fechamento diário do buffet | admin | Evidenciada | self-service | data, planejamento, executado e observações |
| `SELF-02` | importar receita de ficha técnica | admin | Evidenciada | self-service / technical-sheets | usa custo por kg calculado no momento |
| `SELF-03` | registrar produção, sobra e custo por receita | admin | Evidenciada | self-service | linhas detalhadas do buffet |
| `SELF-04` | calcular consumo, venda, CMV e resultado | admin | Evidenciada | self-service | cálculo no cliente; necessita validação |
| `SELF-05` | editar/excluir fechamento | admin | Evidenciada | self-service | atualização apaga e reinsere itens; não atômica no cliente |
| `SELF-06` | histórico e detalhe por período | admin | Evidenciada | self-service | filtros e modal de detalhe |
| `SELF-07` | dashboard, alertas e indicadores | admin | Evidenciada | self-service / dashboard | médias, sobras, consumo e desempenho |

## 7. WhatsApp, e-mail, PWA e experiência

| ID | Capacidade observada | Ator aparente | Estado | Contexto de destino | Evidência e observação |
|---|---|---|---|---|---|
| `WA-01` | habilitar alertas por empresa | admin | Evidenciada | whatsapp | configuração isolada por company |
| `WA-02` | cadastrar destinatários | admin | Evidenciada | whatsapp | números com DDI/DDD; validação precisa ser especificada |
| `WA-03` | configurar frequência e horário | admin | Evidenciada | whatsapp | intervalo, hora, dia, semana e mês |
| `WA-04` | filtrar relatório por saúde do estoque | admin | Evidenciada | whatsapp / stock | baixo estoque, todos monitorados e saudável |
| `WA-05` | enviar teste ou relatório manual | admin | Evidenciada | whatsapp | função resolve company pelo token |
| `WA-06` | gerenciar credencial global do provedor | superadmin | Evidenciada | whatsapp / settings | API key não retorna ao navegador |
| `WA-07` | executar agenda multiempresa | job interno | Evidenciada | whatsapp | cron a cada cinco minutos e deduplicação por `last_sent_at` |
| `WA-08` | monitorar tentativas e falhas | superadmin | Evidenciada | whatsapp / audit | sem conteúdo de mensagem; destino mascarado |
| `WA-09` | credencial por empresa | nenhum fluxo atual | Legada | whatsapp | tabela mantida apenas por compatibilidade |
| `MAIL-01` | enviar e-mail de teste | admin/superadmin | Evidenciada | settings | usa SMTP e função privilegiada |
| `MAIL-02` | enviar recuperação de senha | público | Evidenciada | identity-access | evita enumerar existência na UI |
| `UX-01` | sidebar responsiva e recolhível | autenticado | Evidenciada | web/ui | grupos por domínio e estado local |
| `UX-02` | tema claro/escuro | público/autenticado | Evidenciada | web/ui | preferência no localStorage |
| `PWA-01` | instalar aplicação | usuário | Evidenciada | web/ui | manifest e prompt de instalação |
| `PWA-02` | avisar indisponibilidade de rede | usuário | Evidenciada | web/ui | não equivale a operação offline completa |
| `PWA-03` | cache temporário da API Supabase | usuário | Parcial | web/ui | estratégia precisa ser reavaliada por segurança e consistência |

## 8. Regras transversais observadas

Os itens abaixo são fatos técnicos do legado, não regras aprovadas do novo produto:

- consultas dependem da RLS para filtrar empresa; nem todos os hooks enviam `company_id` explicitamente;
- `company_id` é preenchido por triggers em várias tabelas;
- superadmin pode possuir visão global;
- staff visualiza preço e estoque e altera quantidades em cenários permitidos por policy;
- ações administrativas aparecem ou desaparecem com base em papel no frontend;
- auditoria é gerada por RPC e por triggers em partes diferentes;
- exclusões físicas coexistem com flags `is_active`;
- relatórios e dashboards calculam dados derivados no navegador;
- entradas e exibições são majoritariamente orientadas a `pt-BR`;
- formulários não usam uma estratégia única de parsing decimal ou prevenção de duplo envio.

## 9. Inconsistências de acesso observadas

| Situação | Evidência | Risco |
|---|---|---|
| raiz redireciona todo autenticado para `/central-lucro`, mas menu a marca admin | `Index.tsx` e Sidebar | staff chega a rota não destinada a ele |
| valoração, compras, fornecedores, ajustes, CMV, relatórios e self-service têm menu admin, mas várias páginas só exigem autenticação | Sidebar e páginas | experiência incoerente e dependência excessiva da RLS |
| configurações é admin na UI, enquanto policies mais recentes protegem valores sensíveis como superadmin | página, menu e migrations | falha funcional ou exposição de escopo |
| rota de ficha/configuração pode ser acessada diretamente | App e páginas | controle client-side incompleto |
| página de preços oferece leitura a staff, mas fichas e configurações são admin no banco | páginas e policies | erros e contratos pouco claros |

A nova plataforma deve possuir matriz por ação e autorização de backend; o mapa de rotas não será usado como regra de permissão.

## 10. Funcionalidades não evidenciadas ou fora do escopo inicial

- faturamento/billing automatizado;
- emissão fiscal completa;
- aplicativo móvel nativo;
- operação offline completa com mutações;
- multi-região e alta disponibilidade avançada;
- portal de fornecedor;
- portal de consumidor final;
- API pública de parceiros;
- reconciliação automática com contabilidade;
- enforcement comprovado de histórico de dez senhas;
- uso funcional comprovado de colunas personalizadas.

## 11. Hipóteses funcionais principais

- **Hipótese funcional — necessita validação.** A entrada de compra deve gerar movimentos imutáveis e ser revertida por estorno, nunca por simples exclusão.
- **Hipótese funcional — necessita validação.** Staff atualiza somente quantidade/validade de insumos explicitamente atribuídos ou liberados.
- **Hipótese funcional — necessita validação.** Custo de estoque é custo por unidade base, e a embalagem é apenas unidade de aquisição/contagem.
- **Hipótese funcional — necessita validação.** Custo de ficha composta deve preservar a versão do componente usada no cálculo.
- **Hipótese funcional — necessita validação.** Snapshot de CMV deve ser imutável depois de fechado.
- **Hipótese funcional — necessita validação.** Central de Lucro é uma visão analítica, não um agregado transacional.
- **Hipótese funcional — necessita validação.** Preferências WhatsApp são por empresa e credenciais do provedor são globais.
- **Hipótese funcional — necessita validação.** PWA instalável é desejável, mas cache de dados operacionais não deve comprometer isolamento ou consistência.

## 12. Cobertura futura por spec

| Spec | Capacidades principais deste mapa |
|---:|---|
| 001 | fundação, API, persistência, jobs e observabilidade |
| 002 | AUTH, TEN, USR e PERM |
| 003 | UX, navegação, tema, responsividade e PWA básica |
| 004 | STK, CALC e ADJ relacionados a estoque |
| 005 | SUP e PUR |
| 006 | PRD, TS, PRC e RES |
| 007 | CMV e PROFIT |
| 008 | SELF |
| 009 | WA e integrações relacionadas |
| 010 | AUD, hardening e consolidação de segurança |
| 011 | extração, transformação, carga e reconciliação |

Esta tabela organiza rastreabilidade; não autoriza avanço de spec.
