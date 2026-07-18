# ADR 0001 — Adotar Monólito Modular

## Status
ACCEPTED

## Contexto

O MesaChef possui módulos de autenticação, empresas, estoque, compras, fichas técnicas, precificação, CMV, self-service, WhatsApp e auditoria. O produto ainda está em evolução e será reconstruído por uma equipe pequena com apoio do Codex.

Microserviços aumentariam a complexidade de deploy, observabilidade, transações, comunicação e operação.

## Decisão

Adotar um monólito modular no backend.

Os módulos terão limites claros, contratos explícitos e regras de dependência, porém serão implantados inicialmente como uma única aplicação.

## Consequências positivas

- menor complexidade operacional;
- transações locais;
- desenvolvimento e testes mais simples;
- deploy inicial mais fácil;
- menor custo;
- evolução incremental;
- possibilidade de extração futura.

## Consequências negativas

- módulos compartilham processo e ciclo de deploy;
- escala independente não é imediata;
- exige disciplina para evitar acoplamento;
- falha grave pode afetar toda a aplicação.

## Regras de conformidade

- domínio não depende de infraestrutura;
- módulos não acessam tabelas de outros módulos sem contrato;
- dependências circulares são proibidas;
- frontend não acessa banco;
- casos de uso são fronteiras explícitas;
- integrações externas usam adapters;
- revisão arquitetural deve verificar acoplamento.

## Alternativas consideradas

### Microserviços
Rejeitado nesta fase por custo e complexidade.

### Monólito sem modularidade
Rejeitado por risco de acoplamento crescente.

### Serverless por função
Rejeitado como arquitetura principal por fragmentação e dependência operacional.

## Critério de revisão

Reavaliar quando existirem evidências de:

- necessidade de escala independente;
- cadências de deploy incompatíveis;
- isolamento operacional obrigatório;
- equipe dedicada por domínio;
- gargalo comprovado;
- limites modulares maduros.
