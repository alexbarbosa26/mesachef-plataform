---
name: clean-code-naming
description: >
  Use when improving names of variables, functions, classes, files, components, database fields, or domain concepts. Not for changing brand names or marketing copy.
---

# Clean Code Naming

Sugira nomes que revelem intenção, reduzam ambiguidade e aproximem código da linguagem do domínio.

## Regras
- Use nomes que expliquem por que algo existe e o que faz.
- Classes e componentes devem tender a substantivos.
- Métodos e funções devem tender a verbos.
- Evite nomes genéricos: `data`, `info`, `item`, `handle`, `process`, `manager`, `helper`.
- Use nomes pesquisáveis e pronunciáveis.
- Evite codificação desnecessária no nome.

## Checklist
- O nome revela intenção?
- Um novo desenvolvedor entenderia sem abrir a implementação?
- O nome é específico ao domínio?
- Há termos diferentes para o mesmo conceito?
- Há o mesmo termo com significados diferentes?

## Formato de resposta
Crie uma tabela:

| Original | Sugerido | Motivo |
|---|---|---|

Finalize com um glossário curto quando houver termos de domínio.
