# SPEC 000 — Visão do Produto e Escopo da Reconstrução

## Status
EM_ESPECIFICACAO

## 1. Contexto

O MesaChef é uma plataforma SaaS multiempresa destinada à gestão de restaurantes, lanchonetes, cafeterias, docerias e operações similares. A solução atual foi criada com Lovable, React, Vite e Supabase.

A nova plataforma será reconstruída em ambiente controlado pelo proprietário, utilizando o projeto atual apenas como referência funcional e visual. A implementação nova não deve copiar literalmente código, migrations, SQL, funções serverless ou componentes do projeto original.

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
- conformidade com princípios da LGPD;
- backups e rollback antes de migração.

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

- [ ] Perfis de usuário documentados.
- [ ] Módulos e limites iniciais documentados.
- [ ] Escopo e fora de escopo aprovados.
- [ ] Restrições técnicas registradas.
- [ ] Projeto antigo definido apenas como referência.
- [ ] Objetivos de qualidade documentados.
- [ ] ADRs iniciais criadas.
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

## 15. Evidências esperadas

- inventário de telas;
- inventário de rotas;
- inventário de tabelas;
- mapa de funcionalidades;
- glossário inicial;
- lista de hipóteses funcionais;
- ADRs iniciais aprovadas.
