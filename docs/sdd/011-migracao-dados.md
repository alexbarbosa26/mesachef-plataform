# SPEC 011 — Migração de Dados

## Status
DRAFT

## Dependências
- schemas dos módulos estabilizados;
- homologação funcional;
- validação de segurança;
- PostgreSQL 14 de pré-produção disponível.

## 1. Objetivo

Migrar dados do ambiente atual para o novo PostgreSQL 14 com segurança, rastreabilidade, reconciliação, possibilidade de rollback e janela controlada.

## 2. Princípios

- nunca migrar diretamente sem ensaio;
- preservar o sistema antigo até aceite;
- não executar scripts destrutivos sem backup;
- toda transformação deve ser versionada;
- IDs e relacionamentos devem ser conciliados;
- senhas podem exigir redefinição, conforme tecnologia atual;
- secrets não devem ser migrados em texto puro;
- dados inválidos devem ser reportados, não ocultados.

## 3. Fases

1. inventário;
2. classificação;
3. mapeamento origem-destino;
4. limpeza;
5. script de extração;
6. transformação;
7. carga em homologação;
8. reconciliação;
9. ensaio completo;
10. plano de corte;
11. backup;
12. migração final;
13. validação;
14. rollback, se necessário;
15. aceite.

## 4. Artefatos obrigatórios

- dicionário de dados;
- mapa origem-destino;
- regras de transformação;
- relatório de dados inválidos;
- script versionado;
- relatório de reconciliação;
- runbook;
- plano de rollback;
- checklist de aceite.

## 5. Reconciliação

Validar, no mínimo:

- empresas;
- usuários;
- memberships;
- categorias;
- itens de estoque;
- saldos;
- movimentações;
- fornecedores;
- compras;
- produtos;
- fichas técnicas;
- preços;
- snapshots;
- configurações;
- logs que forem migráveis.

## 6. Critérios de aceite

- [ ] Backup validado.
- [ ] Ensaio executado.
- [ ] Scripts versionados.
- [ ] Contagens reconciliadas.
- [ ] Totais financeiros reconciliados.
- [ ] Relacionamentos preservados.
- [ ] Registros rejeitados documentados.
- [ ] Tempo de migração medido.
- [ ] Rollback testado.
- [ ] Aceite funcional concluído.
- [ ] Produção não foi alterada antes da autorização.
