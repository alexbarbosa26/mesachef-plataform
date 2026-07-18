# SPEC 003 — Layout, Navegação e Design System

## Status
DRAFT

## Dependências
- SPEC 001
- contratos iniciais da SPEC 002

## 1. Objetivo

Criar a estrutura visual e de navegação do novo MesaChef, preservando a identidade e os fluxos úteis do projeto atual, porém com implementação independente.

## 2. Escopo

- layout autenticado;
- layout público;
- menu lateral retrátil;
- cabeçalho;
- navegação responsiva;
- breadcrumbs;
- estados de carregamento;
- estados vazios;
- tratamento visual de erro;
- componentes básicos;
- permissões aplicadas ao menu;
- tema e tokens;
- acessibilidade inicial.

## 3. Regras

- menus devem refletir permissões efetivas;
- esconder menu não substitui autorização no backend;
- páginas não devem piscar ou perder estado ao alternar janelas;
- consultas devem possuir política explícita de refetch;
- ações devem impedir múltiplos envios;
- desktop, notebook e mobile devem ser suportados;
- aparência deve evitar padrão genérico de IA;
- componentes devem ser reutilizáveis sem acoplamento ao domínio.

## 4. Rotas iniciais

- login;
- dashboard;
- empresas;
- usuários;
- estoque;
- fornecedores;
- compras;
- fichas técnicas;
- precificação;
- CMV;
- central de lucro;
- self-service;
- WhatsApp;
- auditoria;
- configurações.

As rotas podem ser liberadas gradualmente conforme as specs.

## 5. Requisitos não funcionais

- acessibilidade básica por teclado;
- contraste adequado;
- feedback visível;
- responsividade;
- consistência visual;
- carregamento progressivo;
- sem reload completo na navegação interna;
- preservação de estado relevante;
- mensagens em português do Brasil.

## 6. Critérios de aceite

- [ ] Layout público implementado.
- [ ] Layout autenticado implementado.
- [ ] Menu retrátil funciona.
- [ ] Menu mobile funciona.
- [ ] Rotas protegidas funcionam.
- [ ] Menu respeita permissões.
- [ ] Estados de loading, vazio e erro existem.
- [ ] Não ocorre reload completo ao trocar de página.
- [ ] Alternar abas/janelas não limpa estado sem motivo.
- [ ] Componentes passam em build e testes visuais definidos.
