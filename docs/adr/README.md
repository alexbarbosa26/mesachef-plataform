# Índice dos Architecture Decision Records

| ADR | Arquivo | Status | Decisão ou proposta |
|---:|---|---|---|
| 0001 | `0001-monolito-modular.md` | `ACCEPTED` | Adotar monólito modular |
| 0002 | `0002-postgresql-producao-sqlite-homologacao.md` | `ACCEPTED` | PostgreSQL 14 oficial e SQLite auxiliar |
| 0003 | `0003-api-propria-sem-supabase-direto.md` | `ACCEPTED` | API própria sem acesso direto do frontend ao banco |
| 0004 | `0004-estrategia-persistencia-query-builder.md` | `ACCEPTED` | Kysely na infraestrutura; PostgreSQL 14 oficial; migrations imutáveis com checksum SHA-256 |
| 0005 | `0005-autenticacao-sessoes-tokens.md` | `ACCEPTED` | Sessão opaca revogável no servidor para a aplicação web |
| 0006 | `0006-isolamento-multiempresa-rbac.md` | `ACCEPTED` | Membership multiempresa, planos tenant/plataforma separados e RLS transacional validada no PostgreSQL 14 |

ADRs em `PROPOSED` registram uma recomendação para decisão. Elas não autorizam implementação até serem formalmente aceitas ou substituídas. Uma ADR `ACCEPTED` orienta implementações futuras, mas não substitui a autorização de execução nem os gates da spec correspondente.
