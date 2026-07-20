# Governança MesaChef Platform

## Fontes obrigatórias

Antes de qualquer tarefa, ler integralmente:

- `@AGENTS.md` — regras permanentes e arquitetura;
- `@EXECUTAR.md` — plano mestre, spec ativa, incremento autorizado e modo de execução.

## Spec e ADRs

- Ler a spec ativa indicada em `@EXECUTAR.md` antes de qualquer análise ou implementação.
- Ler todas as ADRs referenciadas pela spec ativa, em especial:
  - `@docs/adr/0004-estrategia-persistencia-query-builder.md`;
  - `@docs/adr/0006-isolamento-multiempresa-rbac.md`.
- Ler o incremento ativo em `@docs/sdd/002/002-a-persistencia-migrations.md` quando for a spec corrente.
- Consultar skills em `docs/skills/` somente quando aplicáveis à tarefa.

## Proibições operacionais

- **Produção:** não acessar, alterar ou conectar a ambientes de produção.
- **Avanço automático:** não iniciar o próximo incremento ou spec sem autorização humana explícita registrada em `@EXECUTAR.md`.
- **Git destrutivo:** não executar `git push --force`, `git reset --hard`, `git clean -fd`, rebase destrutivo, exclusão de branches remotas ou alteração de histórico compartilhado.
- **Commit/push/merge:** não fazer commit, push ou merge sem autorização humana explícita na sessão corrente.

## Exigências de implementação

- **Mudanças pequenas:** implementar somente o menor incremento autorizado; não ampliar escopo.
- **Testes obrigatórios:** criar ou atualizar testes junto com a implementação; não entregar código sem teste.
- **Evidências:** atualizar `docs/qa/evidencias/` ao concluir cada incremento.
- **Isolamento multiempresa:** toda entidade de cliente deve possuir vínculo com empresa; queries devem filtrar por `company_id` via `TenantContext`.
- **Autorização no backend:** autorização deve ocorrer no backend; nunca confiar em dados do frontend para acesso.
- **Decimal exato para dinheiro:** usar `MoneyDecimal`/`BigInt` no domínio, `numeric(24,4)` no PostgreSQL e texto decimal canônico no SQLite; nunca usar `float` ou `number` para valores monetários.
- **Agente escritor único:** apenas um agente escritor pode alterar arquivos por fase de implementação; agentes de análise e revisão são somente leitura.
