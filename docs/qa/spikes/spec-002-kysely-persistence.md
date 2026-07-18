# Spike técnico — SPEC 002 — Kysely persistence

## 1. Identificação

- **Data:** 2026-07-18
- **Tipo:** spike técnico descartável
- **Spec relacionada:** 002
- **Status:** `CONCLUIDO_COM_RESSALVAS`
- **Branch observada:** `spike/spec-002-kysely-persistence`
- **Diretório isolado:** `spikes/kysely-persistence`
- **Commit:** não criado; não autorizado
- **Produção:** não acessada
- **SPEC 002-A:** não implementada

## 2. Objetivo e limites

O experimento avaliou Kysely como query builder e migrator para a estratégia de
persistência proposta na ADR 0004. Foram usados somente bancos locais e as
entidades experimentais:

- `spike_companies`;
- `spike_users`;
- `spike_memberships`;
- `spike_resources`.

As tabelas internas do migrator receberam nomes exclusivos,
`spike_kysely_migration` e `spike_kysely_migration_lock`. O `down` remove as
quatro tabelas de entidade; por desenho do Kysely, as tabelas internas
permanecem para controle do migrator.

Não foram criados login, senha, sessão, RBAC, RLS, migrations definitivas ou
código nos módulos `apps/**` e `packages/**`.

## 3. Ambiente validado

| Componente | Versão/estado observado |
|---|---|
| Node.js | 24.18.0 |
| pnpm | 11.9.0 |
| Kysely | 0.29.4 |
| `pg` | 8.22.0 |
| `better-sqlite3` | 12.11.1 |
| PostgreSQL | 14.23, container local `healthy` |
| SQLite | 3.53.2, banco `:memory:` |

A URL PostgreSQL preexistente foi injetada apenas no processo de teste. Seu
valor não foi impresso nem gravado no spike. A configuração recusa hosts que
não sejam `localhost`, `127.0.0.1` ou `::1`.

## 4. Matriz dos critérios

| Critério | PostgreSQL 14 | SQLite auxiliar | Resultado |
|---|---|---|---|
| migration `up` em alvo sem tabelas experimentais | sim | sim | aprovado |
| migration `down` e reaplicação | sim | sim | aprovado |
| transação com commit | sim | sim | aprovado |
| rollback por exceção | sim | sim | aprovado |
| UUID | tipo nativo `uuid` | `text` validado pelo domínio | aprovado com diferença documentada |
| timestamps | `timestamptz` | ISO 8601 em `text` | aprovado com diferença documentada |
| decimal monetário | `numeric(24,4)` como string | `text` canônico | aprovado sem `float` |
| foreign keys | aplicadas | aplicadas com `PRAGMA foreign_keys = ON` | aprovado |
| chave única composta | aplicada | aplicada | aprovado |
| muitos-para-muitos | usuário em duas empresas | usuário em duas empresas | aprovado |
| repository isolado do domínio | sim | sim | aprovado |
| filtro obrigatório por empresa | sim | sim | aprovado no adapter e nos testes |
| configuração inválida | erro tipado e sanitizado | erro tipado e sanitizado | aprovado |
| migration fora de ordem | detectada | detectada | aprovado |
| conteúdo de migration aplicada alterado | não detectado pelo migrator nativo | não detectado pelo migrator nativo | gate não atendido |

## 5. Kysely funciona com PostgreSQL 14?

**Sim, para o escopo avaliado.** O dialect PostgreSQL executou migrations,
constraints, inserts, selects, filtros compostos e transações no PostgreSQL
14.23 local. A inspeção do catálogo confirmou `uuid`, `timestamptz` e
`numeric(24,4)`. O round-trip monetário preservou
`9007199254740993.1234`, valor além do inteiro seguro do JavaScript.

Isso não comprova RLS, carga, concorrência de produção, plano de consultas ou
migrations sobre uma base representativa.

## 6. Kysely funciona com SQLite nos casos auxiliares?

**Sim, nos casos auxiliares compatíveis e explicitamente adaptados.** O dialect
SQLite executou a mesma API de repository, migrations, constraints e
transações em memória. A compatibilidade não é transparente: UUID, timestamp e
decimal foram armazenados como `text`, e foreign keys exigiram ativação por
conexão.

SQLite continua inadequado como evidência final de isolamento multiempresa,
RLS ou semântica específica do PostgreSQL.

## 7. As migrations são adequadas?

**Adequadas para migrations explícitas `up/down` e transacionais, mas
insuficientes sozinhas para a governança exigida pela ADR 0004.**

Resultados positivos:

- execução no alvo sem tabelas experimentais;
- `down` em ordem segura de foreign keys;
- reaplicação após rollback estrutural;
- lock e histórico isolados por nomes próprios;
- migrations envolvidas em transação quando o dialect informa suporte a DDL
  transacional;
- recusa de migration adicionada fora da ordem histórica.

Ressalva bloqueadora: a tabela nativa guarda somente `name` e `timestamp`. Um
teste substituiu o conteúdo da migration já aplicada mantendo o mesmo nome; o
migrator não reportou erro e corretamente não a reexecutou. Portanto, Kysely
0.29.4 não oferece checksum nativo de conteúdo para este fluxo.

Antes das migrations definitivas, é necessário escolher uma destas políticas:

1. adicionar verificação de checksum imutável ao runner do projeto;
2. usar Kysely para queries e um migrator dedicado que detecte alteração;
3. remover o gate de checksum por ADR explícita e adotar imutabilidade de
   arquivos com outro controle verificável de CI.

## 8. Como representar decimal?

- no domínio: `MoneyDecimal` com `BigInt` e escala fixa 4;
- no contrato com o banco: string canônica, nunca `number`;
- no PostgreSQL: `numeric(24,4)` lido e escrito como string;
- no SQLite auxiliar: `text`, evitando que a afinidade `NUMERIC` converta o
  valor para ponto flutuante;
- na API futura: DTO decimal textual e validação explícita, a ser definida pela
  spec do módulo que introduzir dinheiro.

O spike não define arredondamento de negócio; ele apenas impede perda de
precisão no round-trip.

## 9. Como garantir transações e rollback?

Os casos de uso de gravação devem receber um executor transacional e executar o
conjunto atômico dentro de `database.transaction().execute(...)`. O teste
comprovou persistência após commit e ausência da linha após exceção, em ambos os
dialects.

O migrator também usa transação por padrão quando o adapter declara suporte a
DDL transacional. `disableTransactions` não deve ser habilitado sem justificativa
e teste específico.

## 10. Como evitar dependência do domínio?

O domínio experimental declara IDs, `MoneyDecimal`, `Resource` e a porta
`ResourceRepository`. Ele não importa Kysely, `pg`, `better-sqlite3`, tipos de
tabela ou migrations. O adapter `KyselyResourceRepository` fica na camada de
banco e faz o mapeamento explícito entre rows e objetos de domínio.

Um teste arquitetural falha caso um pacote de persistência seja importado por
`src/domain`. O mesmo limite deve virar fitness function do monorepo se a ADR
for aceita.

## 11. Como garantir o filtro por empresa?

- todos os métodos da porta exigem `TenantContext`;
- `NewResource` não recebe `companyId` livremente;
- o adapter deriva `company_id` do contexto na escrita;
- `findById` e `list` incluem `company_id` no predicado;
- a constraint de código é composta por `(company_id, resource_code)`;
- o teste cria o mesmo código em duas empresas e impede leitura cruzada.

Isso valida a primeira barreira no repository, não substitui RLS. A defesa em
profundidade continua bloqueada pelo spike PostgreSQL da ADR 0006.

## 12. Diferenças PostgreSQL × SQLite

| Tema | PostgreSQL 14 | SQLite auxiliar |
|---|---|---|
| UUID | tipo nativo e validação pelo banco | texto; validação no domínio |
| timestamp | `timestamptz`, retornado pelo driver como `Date` | texto ISO 8601 |
| decimal | `numeric(24,4)` exato | texto canônico |
| foreign keys | ativas pelo servidor | ativadas por conexão via `PRAGMA` |
| RLS | disponível, não validada neste spike | inexistente |
| tipos | enforcement forte | afinidade dinâmica |
| concorrência | modelo servidor/pool | banco local e locking distinto |

O compartilhamento fica restrito ao domínio, portas e intenção das queries. O
schema físico pode divergir por dialect sem fingir equivalência.

## 13. Testes e comandos executados

| Verificação | Resultado |
|---|---|
| container PostgreSQL | `healthy` |
| versão PostgreSQL | 14.23 |
| `pnpm run check` | lint, typecheck e suíte sem PostgreSQL aprovados |
| suíte SQLite/unitária/arquitetural | 20 testes aprovados |
| `pnpm run test:postgres` | 5 testes aprovados |
| `pnpm run build` | aprovado |
| `pnpm audit --prod` | nenhuma vulnerabilidade conhecida |
| cleanup | nenhuma das quatro tabelas de entidade permaneceu após os testes |

Os 25 testes observados nas duas execuções cobrem configuração, decimal,
limites arquiteturais, migrations, diferenças de schema, foreign keys, chave
única composta, muitos-para-muitos, transações, rollback e filtro de tenant.

## 14. Riscos remanescentes

1. ausência de checksum nativo para migration aplicada;
2. política de geração ou manutenção dos tipos de tabela ainda não aprovada;
3. drift entre tipos TypeScript e schema se o processo depender apenas de
   manutenção manual;
4. tabelas internas do migrator permanecem após `down`;
5. SQLite pode mascarar diferenças de tipos, concorrência e funções SQL;
6. RLS, `SET LOCAL`, reuso de conexão e pool concorrente não foram testados;
7. não houve benchmark, teste de carga ou análise de planos;
8. não houve migration sobre base representativa nem transformação de dados;
9. o driver SQLite possui binário nativo e exige política explícita para scripts
   de instalação;
10. upgrades do Kysely precisam revisar exports e comportamento do migrator; em
    0.29.4, migrations são importadas de `kysely/migration`.

## 15. A ADR 0004 pode ser aceita?

**Ainda não, conforme os gates atualmente escritos.** O spike confirma Kysely
como escolha tecnicamente adequada para query builder, repositories,
transações, PostgreSQL 14 e SQLite auxiliar. Porém, dois gates continuam sem
decisão completa:

- detecção de alteração em migration aplicada;
- política de geração/manutenção e verificação de drift dos tipos de tabela.

Além disso, a mudança de `PROPOSED` para `ACCEPTED` requer revisão e decisão
humana posterior, conforme o registro da própria ADR.

## 16. Recomendação final

1. manter a ADR 0004 em `PROPOSED` durante a revisão deste relatório;
2. aprovar Kysely como query builder e boundary de infraestrutura, não como
   modelo de domínio;
3. decidir antes da SPEC 002-A se o migrator será complementado por checksum ou
   substituído por ferramenta dedicada;
4. definir tipos de tabela confinados a `packages/database`, com verificação de
   drift em CI;
5. após essas duas decisões, aceitar ou rejeitar formalmente a ADR 0004;
6. executar o spike de RLS no PostgreSQL 14 antes de liberar a SPEC 002-A.

## 17. Fontes técnicas

- [Kysely — documentação oficial](https://www.kysely.dev/)
- [Kysely — API do Migrator](https://kysely-org.github.io/kysely-apidoc/classes/Migrator.html)
- [PostgreSQL 14 — tipos numéricos](https://www.postgresql.org/docs/14/datatype-numeric.html)
- [PostgreSQL 14 — UUID](https://www.postgresql.org/docs/14/datatype-uuid.html)
- [SQLite — tipos e afinidade](https://www.sqlite.org/datatype3.html)
- código e tipos instalados de Kysely 0.29.4, inspecionados localmente em
  `node_modules/kysely/dist/migration`.
