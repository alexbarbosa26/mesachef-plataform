# ADR 0003 — API Própria e Proibição de Acesso Direto do Frontend ao Banco

## Status
ACCEPTED

## Contexto

O projeto atual utiliza Supabase Client no frontend para autenticação, consultas e operações. Essa abordagem cria forte dependência da plataforma e distribui regras críticas entre frontend, banco e funções serverless.

A nova solução deve operar com PostgreSQL 14 próprio e permitir controle integral de autorização, regras de negócio, auditoria e integrações.

## Decisão

Criar uma API própria em Node.js e TypeScript.

O frontend consumirá exclusivamente a API para operações de negócio. Não haverá acesso direto do frontend a PostgreSQL, SQLite ou Supabase.

## Consequências positivas

- regras centralizadas;
- autorização consistente;
- menor exposição do modelo de dados;
- melhor auditoria;
- independência do Supabase;
- testes de casos de uso;
- isolamento multiempresa mais controlável;
- integração futura com outros clientes.

## Consequências negativas

- necessidade de manter backend;
- maior quantidade de código;
- necessidade de deploy e observabilidade;
- possível aumento de latência em relação a acesso direto.

## Regras

- API versionada em `/api/v1`;
- validação de entrada e saída;
- DTOs separados do domínio;
- autenticação e autorização no backend;
- `companyId` não é confiado sem validação;
- operações críticas devem ser idempotentes;
- erros possuem formato padronizado;
- integrações externas ficam atrás de adapters;
- frontend nunca recebe secrets;
- migrations não são executadas pelo frontend.

## Alternativas consideradas

### Manter Supabase Client
Rejeitado como arquitetura principal por dependência e distribuição de regras.

### GraphQL imediato
Não adotado por aumentar complexidade sem necessidade comprovada.

### Backend as a Service alternativo
Não adotado porque o objetivo é aumentar o controle do ambiente.

## Critério de revisão

A decisão poderá ser revista apenas quanto ao protocolo da API, não quanto à proibição de acesso direto do frontend ao banco.
