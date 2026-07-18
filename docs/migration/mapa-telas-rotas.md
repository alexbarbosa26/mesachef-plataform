# Mapa de Telas, Rotas e Navegação — Sistema de Referência

## 1. Base da análise

Data de corte: 2026-07-18.

Fontes principais:

- `src/App.tsx` para a declaração de rotas;
- `src/components/layout/Sidebar.tsx` para menus e visibilidade por papel;
- `src/components/layout/DashboardLayout.tsx` para a guarda autenticada comum;
- páginas e guardas específicas para o comportamento de acesso;
- projeto localizado em `../mesachef-migration/mesachef-reference`.

Foram observadas 28 rotas explícitas e uma rota curinga, associadas a 29 arquivos de página. Visibilidade no menu, guarda de página e autorização de dados são mecanismos distintos; este mapa não transforma nenhum deles em política da nova plataforma.

## 2. Rotas públicas e de entrada

| Rota | Página | Acesso observado | Comportamento principal | Observação de migração |
|---|---|---|---|---|
| `/` | `Index` | público | verifica sessão e redireciona autenticado para `/central-lucro`, não autenticado para `/auth` | redirecionamento conflita com o caráter admin da Central de Lucro |
| `/auth` | `Auth` | público | login e recuperação de senha | preservar não enumeração de conta; reforçar segurança no backend |
| `/reset-password` | `ResetPassword` | link/sessão de recuperação | valida link, define nova senha e atualiza metadados de expiração | contrato depende hoje do Supabase Auth |
| `/trust` | `Trust` | público | comunica práticas de segurança e privacidade | conteúdo editorial deve ser revalidado técnica e juridicamente |
| `*` | `NotFound` | público | exibe 404 e registra a rota no console | evitar logar informação sensível na nova solução |

## 3. Rotas autenticadas

| Rota | Tela | Menu/intenção observada | Guarda de página observada | Função principal | Contexto alvo |
|---|---|---|---|---|---|
| `/dashboard` | Visão geral de estoque | todos autenticados; item “Gestão de Estoque” | apenas autenticação | KPIs, abas de alerta, categorias, gráficos e exportação | dashboard / stock |
| `/stock-management` | Gestão detalhada de estoque | admin | autenticação; ações de edição condicionadas por `isAdmin` | CRUD de categorias/itens e configurações de alerta | stock |
| `/stock-entry` | Preenchimento de estoque | staff e admin | apenas autenticação | contagem em lote, validade, busca, filtro e resumo | stock |
| `/stock-valuation` | Valoração do estoque | admin no menu | apenas autenticação | valor total, por categoria, tendência e ranking | stock |
| `/stock-purchases` | Registro de compras | admin no menu | apenas autenticação | compra avulsa, ordem com múltiplos itens, histórico e fornecedor | purchases |
| `/suppliers` | Fornecedores | admin no menu | apenas autenticação | cadastrar, editar, ativar e excluir fornecedor | suppliers |
| `/stock-adjustments` | Ajustes de estoque | admin no menu | apenas autenticação | registrar divergência, impacto e histórico | stock |
| `/calculators` | Calculadoras de produção | staff e admin | apenas autenticação | correção, cocção e histórico; aplicação a estoque restrita na UI | stock / technical-sheets |
| `/cmv` | Dashboard CMV | admin no menu | apenas autenticação | CMV por período, produto, categoria e gráficos | cmv |
| `/cmv/snapshots` | Snapshots CMV | admin no menu | apenas autenticação | gerar, listar e excluir snapshots | cmv |
| `/pricing` | Produtos e precificação | staff e admin | apenas autenticação; ações administrativas condicionadas | produtos, busca, status e acesso à ficha | pricing |
| `/pricing/sheet/:productId` | Ficha técnica | acesso por ação na tela de produtos | autenticação + `AdminOnlyGuard` | composição, rendimento, custo e preço | technical-sheets |
| `/pricing/config` | Configuração de precificação | sem item direto; acesso contextual | autenticação + `AdminOnlyGuard` | custos, percentuais e configuração global | pricing |
| `/pricing/reports` | Relatórios de precificação | admin | autenticação + `AdminOnlyGuard` | KPIs, gráficos, ranking, alertas e exportação | pricing |
| `/pricing/resale` | Precificação de revenda | admin | redireciona/nega quando não admin | tabela editável, custo, preço e viabilidade | pricing |
| `/self-service` | Gestão self-service | admin no menu | apenas autenticação | fechamento diário, histórico e dashboard | self-service |
| `/central-lucro` | Central de Lucro | admin | apenas autenticação | KPIs agregados, gráficos e alertas executivos | profit-center, nome provisório |
| `/users` | Gestão de usuários | admin | redireciona quando não admin | criar, editar, ativar, definir papel/empresa e resetar senha | users-permissions |
| `/companies` | Gestão de empresas | superadmin | redireciona quando não superadmin | cadastrar, editar e ativar/inativar empresa | companies-tenancy |
| `/audit-log` | Log de auditoria | admin | apresenta acesso negado quando não admin | consulta, filtros e exportação | audit |
| `/settings` | Configurações | admin no menu | apresenta acesso negado quando não admin | SMTP global e teste de e-mail | settings |
| `/whatsapp` | Alertas WhatsApp | admin | autenticação + `AdminOnlyGuard` | preferências, destinatários, agenda, teste e envio manual | whatsapp |
| `/whatsapp-global` | Evolution GO global | superadmin | `Navigate` quando não superadmin | credenciais globais e teste do provedor | whatsapp / settings |
| `/whatsapp-monitor` | Monitor WhatsApp | superadmin | `Navigate` quando não superadmin | indicadores, filtros, falhas e últimas tentativas | whatsapp / audit |

## 4. Hierarquia do menu lateral

### Itens independentes

| Rótulo | Rota | Visibilidade observada |
|---|---|---|
| Central de Lucro | `/central-lucro` | admin e superadmin |
| Gestão de Estoque | `/dashboard` | todos autenticados |

### Grupo Estoque

| Rótulo | Rota | Visibilidade observada |
|---|---|---|
| Gestão de Estoque | `/stock-management` | admin e superadmin |
| Preenchimento | `/stock-entry` | todos autenticados |
| Valoração | `/stock-valuation` | admin e superadmin |
| Compras | `/stock-purchases` | admin e superadmin |
| Fornecedores | `/suppliers` | admin e superadmin |
| Ajustes de Estoque | `/stock-adjustments` | admin e superadmin |
| Calculadoras | `/calculators` | todos autenticados |

### Grupo CMV

| Rótulo | Rota | Visibilidade observada |
|---|---|---|
| Dashboard CMV | `/cmv` | admin e superadmin |
| Snapshots CMV | `/cmv/snapshots` | admin e superadmin |

### Grupo Precificação

| Rótulo | Rota | Visibilidade observada |
|---|---|---|
| Precificação | `/pricing` | todos autenticados |
| Revenda | `/pricing/resale` | admin e superadmin |
| Relatórios | `/pricing/reports` | admin e superadmin |
| Self-Service | `/self-service` | admin e superadmin |

### Grupo Administração

| Rótulo | Rota | Visibilidade observada |
|---|---|---|
| Empresas | `/companies` | superadmin |
| Usuários | `/users` | admin e superadmin |
| Log de Auditoria | `/audit-log` | admin e superadmin |
| WhatsApp | `/whatsapp` | admin e superadmin |
| Evolution GO (Global) | `/whatsapp-global` | superadmin |
| Monitor WhatsApp | `/whatsapp-monitor` | superadmin |
| Configurações | `/settings` | admin e superadmin |

Rotas de ficha técnica, configuração de precificação, recuperação de senha e confiança não possuem item direto no menu.

## 5. Inventário resumido das telas

### 5.1 Autenticação

- login com e-mail e senha;
- “esqueci minha senha” no mesmo cartão;
- estados de envio de e-mail, link inválido, validação e sucesso;
- alerta de senha expirada após login;
- marca MesaChef em tela centralizada.

### 5.2 Dashboard e estoque

- cabeçalhos com título, descrição, ações e exportação;
- cartões de total de itens, valor, sem estoque, baixo estoque e validade;
- abas por situação e categoria;
- tabelas com alertas por cor;
- CRUD por diálogos;
- edição de unidade de contagem, unidade base e embalagem;
- contagem em lote com navegação por teclado e resumo final;
- gráficos de valor e distribuição.

### 5.3 Compras e fornecedores

- modal de compra avulsa;
- seletor pesquisável de item e fornecedor;
- cadastro rápido de fornecedor;
- diálogo de ordem de compra com múltiplas linhas;
- campos de quantidade, embalagem, custo, data, nota fiscal e observação;
- histórico avulso e agrupamento por fornecedor;
- tabela de fornecedores com ativação e exclusão.

### 5.4 Precificação e fichas

- catálogo pesquisável de produtos;
- badges de estado e categoria;
- formulário de ficha com ingredientes e fichas compostas;
- seleção de base por unidade, quilo ou porção;
- cartões de resultado, CMV, margem, lucro e investimento;
- configuração de despesas fixas/variáveis e overrides;
- relatórios com gráficos, ranking e alertas;
- planilha editável de produtos de revenda.

### 5.5 CMV, lucro e self-service

- seletores de período;
- indicadores e gráficos de CMV;
- modal de geração de snapshot;
- painel executivo com alertas acionáveis;
- fechamento self-service com abas “Fechamento do dia”, “Histórico” e “Dashboard”;
- linhas de receita, importação de ficha, planejamento e executado;
- detalhe de fechamento e indicadores do período.

### 5.6 Administração e integrações

- gestão de empresas e usuários por tabelas e diálogos;
- filtros e exportação de auditoria;
- configuração SMTP e teste;
- preferências WhatsApp por empresa;
- configuração global Evolution GO;
- monitor com total, sucesso, falhas, empresas afetadas e tentativas.

## 6. Padrões visuais observados

| Elemento | Padrão atual | Diretriz para reconstrução |
|---|---|---|
| Navegação | sidebar escura, recolhível, agrupada e responsiva | preservar hierarquia útil; revisar nomenclatura e permissões |
| Tipografia | Inter | pode ser mantida se aprovada e hospedada de forma adequada |
| Cor primária | azul corporativo | confrontar com identidade laranja/preto do logotipo |
| Feedback | toasts, loaders, estados vazios e badges | manter estados explícitos de carregamento, erro e sucesso |
| Alertas | verde, amarelo e vermelho | validar contraste e não depender apenas de cor |
| Dados densos | cards, tabelas, abas e gráficos | preservar eficiência operacional e responsividade |
| Tema | claro/escuro | candidato a preservação na SPEC 003 |
| PWA | prompt de instalação e indicador offline | separar instalação de suporte offline real |

## 7. Inconsistências e riscos de navegação

### 7.1 Dois significados de “Gestão de Estoque”

- `/dashboard` é a visão geral e aparece para todos;
- `/stock-management` é a administração detalhada e aparece para admin;
- ambos usam rótulo semelhante, o que dificulta linguagem ubíqua e suporte.

Recomendação documental: reservar “Visão de Estoque” para leitura e “Cadastro de Estoque” ou “Administração de Estoque” para manutenção, sujeito a validação.

### 7.2 Menu não equivale a autorização

Várias páginas ocultas no menu para staff não possuem guarda de papel própria. O acesso direto pode exibir a tela e depender de RLS para negar operações. Na nova plataforma:

- cada rota deve declarar a permissão necessária para UX;
- cada endpoint deve validar a mesma ação no backend;
- repositories e domínio devem preservar tenant/invariantes;
- testes devem acessar endpoints diretamente, sem depender do menu.

### 7.3 Rota inicial incompatível com staff

A rota `/` envia todo autenticado para `/central-lucro`, mas essa opção é admin no menu. O destino inicial deve ser definido por permissão ou por uma página comum autorizada.

### 7.4 Configurações com escopo ambíguo

A tela é rotulada para admin, mas contém SMTP global e policies recentes indicam proteção de superadmin. A nova navegação deve separar:

- preferências da empresa;
- configurações globais da plataforma;
- secrets de integração, nunca renderizados ao cliente.

## 8. Proposta de agrupamento conceitual para a nova UI

Esta proposta é insumo para a SPEC 003, não decisão implementável:

| Área | Destinos candidatos |
|---|---|
| Início | visão permitida por papel e atalhos operacionais |
| Estoque | visão, cadastro, contagem, valoração, ajustes e calculadoras |
| Compras | compras e fornecedores |
| Engenharia de produto | produtos e fichas técnicas |
| Preços e resultado | configuração, precificação, revenda, CMV, self-service e análises |
| Comunicação | WhatsApp da empresa |
| Administração da empresa | usuários, auditoria e preferências |
| Administração da plataforma | empresas, integrações globais e monitoramento |

## 9. Requisitos de aceitação futuros para rotas

- rota protegida sem sessão redireciona ou responde de modo consistente;
- rota sem permissão não renderiza dados antes da decisão de autorização;
- endpoint correspondente nega acesso construído manualmente;
- staff não alcança tela administrativa pelo redirecionamento inicial;
- superadmin possui contexto global explícito e auditado;
- navegação por teclado e foco são verificáveis;
- sidebar móvel e desktop mantêm o mesmo conjunto autorizado;
- URL profunda preserva retorno após autenticação quando seguro;
- 404 não expõe stack, estrutura interna ou dados pessoais;
- estados de carregamento, vazio, erro e repetição são definidos por tela.

## 10. Hipóteses a validar

- **Hipótese funcional — necessita validação.** `/dashboard` deve continuar como página inicial comum.
- **Hipótese funcional — necessita validação.** Staff deve acessar contagem, calculadoras e leitura de produtos, mas não relatórios financeiros.
- **Hipótese funcional — necessita validação.** Central de Lucro, CMV e self-service pertencem à área analítica/resultado.
- **Hipótese funcional — necessita validação.** Configuração de precificação deve ser acessível a partir do módulo de preço, sem item global de administração.
- **Hipótese funcional — necessita validação.** Trust/privacidade permanece pública, após revisão do conteúdo.
- **Hipótese funcional — necessita validação.** Tema claro/escuro e PWA instalável são parte da experiência a preservar.

As decisões de rota e permissão estão registradas em `docs/qa/pendencias.md` e serão aprovadas nas SPECS 002 e 003.
