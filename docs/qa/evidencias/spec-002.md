# Evidências — SPEC 002 (refinamento documental)

## 1. Identificação

- **Data:** 2026-07-18
- **Branch observada:** `docs/spec-002-identity-design`
- **Modo:** `documentation`
- **Spec autorizada:** 002
- **Estado resultante:** `EM_ESPECIFICACAO`
- **Commit:** não criado; não autorizado
- **Produção:** não acessada
- **Código/migrations:** não criados nem alterados

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
| 0004 — persistência/query builder | `PROPOSED` | Kysely sobre `pg`, repositories e migrations explícitas/versionadas |
| 0005 — autenticação/sessões/tokens | `PROPOSED` | sessão opaca revogável no servidor e nenhum refresh token para a web inicial |
| 0006 — isolamento/RBAC | `PROPOSED` | identidade global, memberships multiempresa, contextos separados e RLS em profundidade |

Nenhuma ADR foi marcada `ACCEPTED` sem decisão do responsável.

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

- aceite da estratégia de persistência e spike;
- modelo multiempresa e empresa ativa;
- matriz RBAC/delegação e limite de `superadmin`;
- RLS com pool e role real;
- MFA, TTL, senha e bootstrap;
- provedor de recuperação;
- retenção/privacidade da auditoria;
- normalização e alteração de e-mail.

As pendências detalhadas estão em `docs/qa/pendencias.md`, seção 8.

## 12. Resultado das validações estáticas

- `git diff --check`: passou, sem erro de whitespace no diff rastreado; o Git apenas informou a conversão configurada de LF para CRLF no Windows.
- escopo de arquivos: passou; exatamente 8 arquivos documentais, todos na allowlist desta execução.
- código/configuração de aplicação: nenhuma alteração em `apps`, `packages`, `infra`, `scripts`, manifests ou lockfile.
- migrations físicas: nenhum arquivo criado ou alterado.
- estrutura da SPEC: passaram contexto, atores, domínio, invariantes, requisitos, contratos, persistência, segurança, aceite, testes, fora de escopo, rollout, rollback e dúvidas.
- incrementos: 002-A, B, C, D, E, F e G encontrados com os nomes exigidos.
- controlador: SPEC ativa 002 em `EM_ESPECIFICACAO`, modo `documentation`; SPEC 003 permanece `BLOQUEADA`.
- ADR 0004: Drizzle, Prisma, Kysely e SQL explícito presentes na comparação.
- ADRs 0004–0006: todas permanecem `PROPOSED`.
- Markdown: nenhum whitespace final e code fences balanceados nos 8 arquivos.
- secrets: nenhuma chave privada, access key AWS, token GitHub/Slack, JWT ou URI de banco com credencial encontrada nos 8 arquivos alterados/criados.

**Resultado:** documentação consistente com o escopo autorizado. Não houve execução de código de aplicação, testes de runtime, banco, Docker, migration, commit ou produção.
