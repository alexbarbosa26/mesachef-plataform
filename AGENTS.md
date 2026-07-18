# AGENTS.md — MesaChef Platform

## Objetivo
Reconstruir o MesaChef em ambiente próprio, usando Specification Driven Development, sem copiar código da solução Lovable original. O projeto original deve ser usado apenas como referência funcional, visual e de comportamento.

## Regra principal
Nenhuma funcionalidade deve ser implementada sem spec aprovada em `docs/sdd`.

## Arquitetura
- Monorepo TypeScript.
- Frontend em React + Vite + Tailwind + shadcn-ui.
- Backend em Node.js + TypeScript.
- Banco principal PostgreSQL 14.
- Homologação/local pode usar SQLite.
- Aplicar monólito modular.
- Evitar microserviços nesta fase.

## Princípios obrigatórios
- SDD antes do código.
- DDD pragmático.
- Clean Code.
- Secure by Design.
- Multiempresa com isolamento por tenant.
- Backend como fonte da verdade.
- Frontend nunca deve aplicar regra crítica sozinho.
- Dinheiro deve usar decimal/inteiro em centavos, nunca float livre.
- Toda ação crítica deve gerar auditoria.

## Proibido
- Copiar arquivos do projeto Lovable original.
- Copiar componentes inteiros sem reescrita.
- Usar Supabase Client direto no frontend.
- Criar lógica de negócio dentro de componentes React.
- Criar endpoints CRUD genéricos para regras críticas.
- Misturar dados de empresas diferentes.
- Expor secrets no frontend.
- Implementar funcionalidade sem teste mínimo.

## Fluxo de trabalho
1. Ler a spec.
2. Validar entidades, casos de uso e critérios de aceite.
3. Criar ou alterar testes.
4. Implementar menor incremento possível.
5. Rodar lint, testes e build.
6. Atualizar documentação quando necessário.

## Padrão de commit
- feat(module): descrição
- fix(module): descrição
- refactor(module): descrição
- test(module): descrição
- docs(module): descrição