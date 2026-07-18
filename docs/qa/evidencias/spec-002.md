# Evidências — SPEC 002 (refinamento documental)

## 1. Identificação

- **Data:** 2026-07-18
- **Atualização decisória:** 2026-07-18 — aceite das ADRs 0005/0006 e registro dos gates técnicos remanescentes
- **Aceite de persistência:** 2026-07-18 — ADR 0004 aceita após revisão do spike Kysely
- **Spike PostgreSQL RLS:** 2026-07-18 — mecanismo candidato validado tecnicamente; aceite humano pendente
- **Branch observada:** `spike/spec-002-postgres-rls`
- **Modo:** `validation`
- **Spec autorizada:** 002
- **Estado resultante:** `EM_ESPECIFICACAO`
- **Commit:** não criado; não autorizado
- **Produção:** não acessada
- **Código/migrations:** somente experimentais em `spikes/postgres-rls`; módulos e migrations definitivos não alterados

## 2. Objetivo da execução

Refinar tecnicamente identidade, autenticação, empresas, memberships, RBAC, isolamento multiempresa e segurança; decompor a entrega em 002-A a 002-G; e registrar propostas arquiteturais sem selecionar tecnologia silenciosamente nem iniciar implementação.

## 3. Fontes lidas integralmente

- `AGENTS.md`;
- `EXECUTAR.md`;
- versão anterior de `docs/sdd/002-identity-access-multiempresa.md`;
- ADRs 0001, 0002 e 0003 e índice existente;
- inventário completo em `docs/migration`:
  - `inventario-projeto-atual.md`;
  - `mapa-funcionalidades.md`;
  - `mapa-telas-rotas.md`;
  - `mapa-banco-dados.md`;
  - `plano-migracao.md`;
- `docs/qa/pendencias.md`.

## 4. Skills aplicadas

Foram selecionadas somente as skills pertinentes à revisão documental:

- arquitetura: ADRs, trade-offs, modularização e revisão de arquitetura de software;
- DDD: bounded contexts, arquitetura DDD, modelagem de domínio e linguagem ubíqua;
- segurança: autenticação/autorização, API segura, Secure by Design e modelagem segura de domínio;
- Clean Code: princípios, nomenclatura, revisão e testes.

Skills de microserviços e refatoração de código não foram aplicadas porque a arquitetura já é monólito modular e não houve implementação a refatorar.

## 5. Evidências do projeto de referência consideradas

O inventário documenta, sem copiar implementação:

- autenticação gerenciada pelo Supabase por e-mail e senha;
- papéis observados `superadmin`, `admin` e `staff`;
- perfil com vínculo empresarial singular/nullable e papel em estrutura global;
- RLS nas 33 tabelas públicas inventariadas;
- diferenças entre menus, guards de rota e policies;
- verificações de estado de conta predominantemente no cliente;
- ausência de rate limiting próprio comprovado;
- tabela `password_history` sem uso funcional comprovado.

Esses itens foram tratados como evidência de comportamento ou risco. Nenhum código, SQL, migration, componente, função ou credencial do sistema antigo foi copiado ou acessado.

## 6. Rastreabilidade dos 26 tópicos solicitados

| Tópico | Decisão/proposta registrada em |
|---:|---|
| 1. modelo de usuário | SPEC 002, 9.1 e 10 |
| 2. modelo de empresa | SPEC 002, 9.3 e 10 |
| 3. vínculo usuário/empresa | SPEC 002, 9.4 e ADR 0006 |
| 4. uma ou várias empresas | várias memberships; SPEC 002, 9.4 e DEC-002-002 |
| 5. empresa ativa | sessão do servidor; SPEC 002, 10 e 14.2 |
| 6. `superadmin` | papel global separado; SPEC 002, 5, 12 e ADR 0006 |
| 7. `admin` e `staff` | papéis de membership; SPEC 002, 9.5 e 12 |
| 8. permissões extensíveis | catálogo + papéis + concessões; SPEC 002, 9.5 e 11.4 |
| 9. e-mail e senha | SPEC 002, 13.1 e 15.1; ADR 0005 |
| 10. estratégia de sessão | sessão opaca no servidor; ADR 0005 |
| 11. expiração/revogação | SPEC 002, 15.2 e ADR 0005 |
| 12. refresh token | não adotado para a web; SPEC 002, 15.3 |
| 13. recuperação de senha | SPEC 002, 11.3 e 15.4 |
| 14. bloqueio de usuário | SPEC 002, invariantes 4 e 17 |
| 15. bloqueio de empresa | SPEC 002, invariantes 5 e 18 |
| 16. primeiro superadmin | bootstrap único; SPEC 002, RF-BOOT e ADR 0005 |
| 17. isolamento em repositories | SPEC 002, 17.1 e ADR 0006 |
| 18. IDOR | SPEC 002, 17.3 e testes 21.3/21.4 |
| 19. auditoria | SPEC 002, 9.9 e 19 |
| 20. rate limiting | SPEC 002, 16 |
| 21. força bruta | SPEC 002, 16 e ADR 0005 |
| 22. migrations | proposta conceitual em SPEC 002, 18; nenhum arquivo criado |
| 23. testes unitários | SPEC 002, 21.1 |
| 24. testes de integração | SPEC 002, 21.2 |
| 25. testes de isolamento | SPEC 002, 21.3 |
| 26. testes de elevação | SPEC 002, 21.4 |

## 7. ADRs produzidas

| ADR | Status | Recomendação condicionada |
|---|---|---|
| 0004 — persistência/query builder | `ACCEPTED` | Kysely na infraestrutura, PostgreSQL 14 oficial e migrations imutáveis com checksum SHA-256 |
| 0005 — autenticação/sessões/tokens | `ACCEPTED` | sessão opaca revogável no servidor e nenhum refresh token para a web inicial |
| 0006 — isolamento/RBAC | `ACCEPTED` | identidade global, memberships multiempresa, contextos separados e RLS em profundidade; mecânica de RLS depende de spike |

As ADRs 0004, 0005 e 0006 estão em `ACCEPTED` por decisão humana explícita do responsável. A ADR 0004 foi aceita após conclusão e revisão do spike com Kysely.

## 8. Incrementos especificados

- 002-A — Persistência e migrations de identidade;
- 002-B — Autenticação e sessões;
- 002-C — Empresas e memberships;
- 002-D — Papéis e permissões;
- 002-E — Administração e auditoria;
- 002-F — Login e seleção de empresa no frontend;
- 002-G — Hardening e testes de segurança.

Cada incremento possui entrada, entrega, fora de escopo e gate de saída na SPEC. Nenhum foi iniciado.

## 9. Validações desta execução

Como a execução é exclusivamente documental:

- lint, typecheck, testes de aplicação e build: `N/A`, pois nenhum código/configuração de aplicação foi alterado;
- migrations executadas: nenhuma;
- banco e Docker: não acessados;
- validações aplicáveis: estrutura documental, consistência de status, escopo do diff, ausência de arquivos de aplicação/migration e busca por secrets.

Os comandos e resultados finais de validação estática devem ser registrados na seção 12 antes do encerramento desta execução.

## 10. Segurança e multiempresa

- backend e repositories permanecem a fonte da verdade;
- `TenantContext` e `PlatformContext` são separados;
- `companyId` do cliente não é autoridade;
- filtros compostos, FKs compostas e RLS formam defesa em profundidade;
- `superadmin` não ganha bypass operacional implícito;
- sessão opaca permite revogação imediata;
- reset, bloqueio, CSRF, rate limiting e brute force possuem requisitos/testes;
- auditoria usa metadados em allowlist e exclui credenciais.

## 11. Limitações e bloqueios

A SPEC continua não pronta porque ainda dependem de decisão:

- matriz RBAC detalhada, delegação e papéis customizados;
- aceite humano da mecânica RLS já validada com pool e role real no PostgreSQL;
- MFA, TTL, senha e bootstrap;
- provedor de recuperação;
- retenção/privacidade da auditoria;
- normalização e alteração de e-mail.

As pendências detalhadas estão em `docs/qa/pendencias.md`, seção 8.

## 12. Resultado das validações estáticas do refinamento inicial

- `git diff --check`: passou, sem erro de whitespace no diff rastreado; o Git apenas informou a conversão configurada de LF para CRLF no Windows.
- escopo de arquivos: passou; exatamente 8 arquivos documentais, todos na allowlist desta execução.
- código/configuração de aplicação: nenhuma alteração em `apps`, `packages`, `infra`, `scripts`, manifests ou lockfile.
- migrations físicas: nenhum arquivo criado ou alterado.
- estrutura da SPEC: passaram contexto, atores, domínio, invariantes, requisitos, contratos, persistência, segurança, aceite, testes, fora de escopo, rollout, rollback e dúvidas.
- incrementos: 002-A, B, C, D, E, F e G encontrados com os nomes exigidos.
- controlador: SPEC ativa 002 em `EM_ESPECIFICACAO`, modo `documentation`; SPEC 003 permanece `BLOQUEADA`.
- ADR 0004: Drizzle, Prisma, Kysely e SQL explícito presentes na comparação.
- ADRs 0004–0006: naquela execução inicial, todas permaneciam `PROPOSED`; o registro humano posterior está na seção 13.
- Markdown: nenhum whitespace final e code fences balanceados nos 8 arquivos.
- secrets: nenhuma chave privada, access key AWS, token GitHub/Slack, JWT ou URI de banco com credencial encontrada nos 8 arquivos alterados/criados.

**Resultado:** documentação consistente com o escopo autorizado. Não houve execução de código de aplicação, testes de runtime, banco, Docker, migration, commit ou produção.

## 13. Decisões humanas registradas antes do spike — 2026-07-18

Esta seção preserva o estado histórico anterior ao spike. O aceite posterior da
ADR 0004 e o estado vigente estão na seção 16.

| # | Decisão | Registro resultante |
|---:|---|---|
| 1 | ADR 0004 permanece `PROPOSED` até spike com Kysely | Kysely é candidato do spike; SPEC 002-A bloqueada |
| 2 | ADR 0005 aceita | status `ACCEPTED`; sessão opaca sem refresh token |
| 3 | ADR 0006 aceita, com RLS dependente de spike | status `ACCEPTED`; implementação ainda não selecionada |
| 4 | usuário–empresa muitos-para-muitos | `Membership` é o vínculo oficial |
| 5 | empresa ativa no servidor | contexto derivado e validado pelo backend |
| 6 | `superadmin` separado | papel global fora dos papéis empresariais |
| 7 | negação por padrão | ausência de concessão falha fechada |
| 8 | sem bypass implícito para `superadmin` | acesso tenant exige contexto/autorização explícitos |
| 9 | SQLite insuficiente para isolamento | PostgreSQL 14 é o gate de evidência |
| 10 | SPEC 002 continua em especificação | estado mantido em `EM_ESPECIFICACAO` |
| 11 | SPEC 002-A bloqueada | depende dos spikes de persistência e RLS |
| 12 | SPEC 003 bloqueada | nenhuma liberação ou avanço realizado |

### Pendências afetadas

- `PEND-002-002`: encerrada quanto à cardinalidade e autoridade da empresa ativa;
- `PEND-002-003`: parcialmente resolvida; matriz detalhada/delegação continuam abertas;
- `PEND-002-004`: parcialmente resolvida; estratégia de sessão aceita, parâmetros operacionais continuam abertos;
- `PEND-002-001` e `PEND-002-006`: permaneciam bloqueadoras da SPEC 002-A;
- `PEND-002-005`, `PEND-002-007` e `PEND-002-008`: permanecem abertas.

## 14. Validação da atualização decisória

- `git diff --check`: passou; apenas avisos esperados de normalização LF/CRLF no Windows.
- escopo: exatamente 8 arquivos documentais alterados; nenhum arquivo em `apps`, `packages`, `infra`, `scripts`, manifest ou lockfile.
- ADR 0004: naquela atualização, `PROPOSED` e condicionada a spike com Kysely; o aceite posterior está na seção 16.
- ADR 0005: `ACCEPTED` e seção `Decisão` definitiva.
- ADR 0006: `ACCEPTED`, com as decisões de membership, contexto no servidor, separação de papéis, negação por padrão, ausência de bypass e gate PostgreSQL registradas.
- bloqueios naquele momento: SPEC 002-A dependia dos spikes de persistência e RLS; SPEC 003 permanecia `BLOQUEADA`.
- Kysely: nenhuma ocorrência de dependência instalada em `package.json` ou `pnpm-lock.yaml`.
- migrations: nenhum arquivo criado ou alterado.
- Markdown: sem whitespace final e com code fences balanceados nos 8 arquivos.
- secrets: nenhum padrão de chave privada, AWS, GitHub, Slack, JWT ou URI de banco com credencial encontrado no diff documental.
- testes de aplicação, lint, typecheck e build: `N/A`, pois não houve mudança em código ou configuração executável.

**Resultado:** as 12 decisões humanas foram registradas sem implementar, instalar dependências, acessar banco/produção, criar migration, avançar de spec ou criar commit.

## 15. Spike Kysely persistence — 2026-07-18

### Identificação e escopo

- **Modo:** `validation`;
- **tipo:** spike técnico descartável;
- **branch observada:** `spike/spec-002-kysely-persistence`;
- **código:** restrito a `spikes/kysely-persistence`;
- **relatório:** `docs/qa/spikes/spec-002-kysely-persistence.md`;
- **módulos definitivos:** nenhuma alteração em `apps/**` ou `packages/**`;
- **produção:** não acessada;
- **commit:** não criado;
- **estado da SPEC 002:** mantido em `EM_ESPECIFICACAO`;
- **SPEC 002-A e SPEC 003:** permanecem bloqueadas.

### Evidências executáveis

| Evidência | Resultado |
|---|---|
| Docker/PostgreSQL | container local `healthy`; PostgreSQL 14.23 |
| SQLite | 3.53.2 em memória |
| Kysely | 0.29.4 |
| lint | aprovado, zero warnings |
| typecheck estrito | aprovado |
| suíte sem PostgreSQL | 5 arquivos, 20 testes aprovados |
| suíte PostgreSQL | 1 arquivo, 5 testes aprovados |
| build isolado | aprovado |
| auditoria de dependências de produção | nenhuma vulnerabilidade conhecida |
| cleanup | nenhuma das quatro tabelas de entidade permaneceu após os testes |

Os testes cobriram `up/down`, alvo sem tabelas experimentais, reaplicação,
transações, rollback, UUID, timestamps, decimal exato sem `float`, foreign keys,
chave única composta, muitos-para-muitos, repository desacoplado, tenant query e
erro controlado para configuração inválida.

### Resultado arquitetural

Kysely foi considerado adequado como query builder e adapter de infraestrutura
para PostgreSQL 14, com SQLite somente auxiliar. O domínio permaneceu separado
dos drivers e do schema, e o filtro por empresa foi exigido pela porta e
comprovado pelo contrato dos dois dialects.

O migrator nativo detectou migration fora de ordem, mas não alteração de
conteúdo já aplicado sob o mesmo nome. A tabela de histórico observada possui
somente `name` e `timestamp`. A política de manutenção/verificação de drift dos
tipos de tabela também continua sem decisão humana.

**Conclusão na data do spike:** a evidência técnica foi concluída com ressalvas.
O aceite humano posterior está registrado na seção 16: a ADR 0004 passou para
`ACCEPTED`, `PEND-002-001` foi encerrada e `PEND-002-006` continua aberta e
bloqueando a SPEC 002-A.

## 16. Aceite humano da estratégia de persistência — 2026-07-18

### Decisões registradas

| # | Decisão humana | Efeito arquitetural |
|---:|---|---|
| 1 | Kysely aceito como query builder e adapter de infraestrutura | persistência futura usa Kysely atrás de repositories |
| 2 | domínio não importa tipos ou APIs do Kysely | limite arquitetural obrigatório e testável |
| 3 | PostgreSQL 14 é o banco oficial | gate final de persistência |
| 4 | SQLite é somente auxiliar | uso restrito a desenvolvimento e testes compatíveis |
| 5 | persistência, concorrência e isolamento são validados finalmente no PostgreSQL 14 | SQLite nunca conclui esses critérios sozinho |
| 6 | dinheiro usa `MoneyDecimal` baseado em `BigInt`, escala 4 | sem `float` ou `number` no domínio |
| 7 | PostgreSQL usa `numeric(24,4)` para dinheiro | armazenamento exato oficial |
| 8 | SQLite usa texto decimal canônico para dinheiro | evita coerção de ponto flutuante |
| 9 | UUID é nativo no PostgreSQL e texto validado no SQLite | diferença de dialect explícita |
| 10 | datas são UTC; `timestamptz` no PostgreSQL e ISO 8601 textual no SQLite | instante preservado por adapter |
| 11 | migration aplicada nunca é editada | histórico imutável |
| 12 | correção usa nova migration | evolução forward-only por padrão |
| 13 | migrator Kysely recebe camada de checksum SHA-256 | lacuna nativa do spike mitigada |
| 14 | nome e checksum ficam em tabela auxiliar | integridade persistida e verificável |
| 15 | conteúdo alterado de migration aplicada causa falha | comportamento fail-closed obrigatório |
| 16 | migrations rodam como etapa separada de deploy | execução operacional controlada |
| 17 | API não executa migrations no startup | credenciais e ciclo de vida separados |
| 18 | SPEC 002-A permanece bloqueada até concluir o spike de RLS | nenhuma implementação liberada |

### Estado resultante

- ADR 0004: `ACCEPTED`;
- ADR 0002: permanece `ACCEPTED` e coerente com PostgreSQL/SQLite;
- `PEND-001-003` e `PEND-002-001`: encerradas;
- `PEND-002-006`: aberta e bloqueadora da SPEC 002-A;
- SPEC 002: permanece `EM_ESPECIFICACAO`;
- SPEC 003: permanece `BLOQUEADA`;
- dependências, migrations definitivas, banco e produção: não acessados ou alterados;
- autenticação, empresas, usuários, sessões e RBAC: não implementados;
- commit: não criado.

### Validação aplicável

Esta execução é exclusivamente documental. Não se aplicam lint, typecheck,
testes de runtime, build ou execução de migrations. A validação consiste em
coerência de status, presença das 18 decisões, escopo do diff, ausência de
alterações no spike/código/manifests, whitespace e busca por secrets.

Resultados verificados:

- ADR 0004 e índice de ADRs registram `ACCEPTED`;
- as decisões numeradas de 1 a 18 estão presentes tanto na ADR 0004 quanto
  nesta evidência;
- `PEND-002-001` está encerrada e `PEND-002-006` permanece aberta;
- SPEC 002-A permanece bloqueada;
- o diff está restrito aos cinco documentos autorizados;
- `apps`, `packages`, `spikes`, `infra`, `scripts`, manifests, specs e
  migrations não foram alterados;
- `git diff --check` não identificou erro de whitespace;
- os blocos Markdown permanecem balanceados;
- a busca estática não identificou credencial ou secret no diff.

## 17. Spike PostgreSQL RLS — 2026-07-18

### Identificação e escopo

- **Modo:** `validation`;
- **tipo:** spike técnico descartável;
- **diretório:** `spikes/postgres-rls`;
- **relatório:** `docs/qa/spikes/spec-002-postgres-rls.md`;
- **PostgreSQL:** 14.23 local, container `healthy`;
- **módulos definitivos:** nenhuma alteração em `apps/**` ou `packages/**`;
- **spike Kysely anterior:** não alterado;
- **produção:** não acessada;
- **commit:** não criado;
- **estado da SPEC 002:** mantido em `EM_ESPECIFICACAO`;
- **SPEC 002-A e SPEC 003:** não liberadas.

### Evidências executáveis

| Evidência | Resultado |
|---|---|
| RLS | `ENABLE` e `FORCE` confirmados no catálogo |
| roles | owner, aplicação e plataforma sem superuser/`BYPASSRLS`; aplicação distinta do owner |
| negação por padrão | ausência retorna zero linhas; escrita falha; contexto inválido falha com erro sanitizado |
| CRUD tenant | leitura, insert, update e delete isolados entre A e B |
| IDOR/troca de empresa | ID alheio equivale a inexistente; tentativa de escrever B sob contexto A falha |
| contexto | `set_config('app.current_company_id', companyId, true)` somente em transação |
| commit/rollback | mesma conexão `max=1` sem contexto residual |
| pool | 20 alternâncias A/B e 16 probes simultâneos em múltiplos backends sem vazamento |
| concorrência | 40 transações A/B sobre múltiplos backends sem cruzamento |
| repositories | `TenantContext` obrigatório e filtro comprovado mesmo sob superuser que ignora RLS |
| plataforma | role sem grant tenant-owned; job itera empresas com contexto explícito |
| lint | aprovado, zero warnings |
| typecheck | aprovado em TypeScript estrito |
| testes unitários/arquiteturais | 3 arquivos, 12 testes aprovados |
| testes PostgreSQL | 1 arquivo, 13 testes aprovados |
| testes concorrentes | 1 arquivo, 3 testes aprovados |
| build | aprovado |
| auditoria de secrets | aprovada |
| auditoria de dependências de produção | nenhuma vulnerabilidade conhecida |
| cleanup | zero tabelas e zero roles `spike_rls_*` no catálogo |

### Resultado arquitetural

A mecânica candidata da ADR 0006 foi tecnicamente validada no PostgreSQL 14:

- role runtime não-owner e `NOBYPASSRLS`;
- `ENABLE` + `FORCE ROW LEVEL SECURITY`;
- policy `USING` + `WITH CHECK` baseada em configuração local;
- transação obrigatória com `set_config(..., true)`;
- repositories ainda filtrados por empresa;
- `TenantContext` e `PlatformContext` separados também por grants/pools;
- jobs globais iterando tenants explicitamente.

O resultado sustenta encerrar o gate técnico de isolamento após revisão humana.
Ele não altera sozinho a ADR 0006, não libera a SPEC 002-A, não resolve os
demais gates da SPEC 002 e não autoriza implementação definitiva.
