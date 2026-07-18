# SPEC 009 — Integração WhatsApp

## Status
DRAFT

## Dependências
- SPEC 002
- infraestrutura de jobs da SPEC 001

## 1. Objetivo

Implementar configuração, envio, monitoramento, logs e alertas da integração WhatsApp por empresa e visão global do superadmin.

## 2. Entidades

- WhatsAppProviderConfiguration;
- WhatsAppInstance;
- WhatsAppMessage;
- WhatsAppDeliveryAttempt;
- WhatsAppFailureSequence;
- WhatsAppAlert.

## 3. Regras de negócio

- secrets ficam apenas no backend;
- configuração global é restrita ao superadmin;
- configuração da empresa exige permissão;
- cada tentativa deve ser rastreável;
- falhas consecutivas devem ser contabilizadas;
- após três falhas consecutivas, gerar alerta;
- sucesso deve zerar ou encerrar a sequência conforme regra definida;
- reenvio deve usar idempotência;
- payloads sensíveis devem ser mascarados em logs;
- o fornecedor externo deve ficar atrás de um adapter.

## 4. Requisitos funcionais

- configurar provedor;
- configurar instância;
- testar conexão;
- enviar mensagem;
- consultar status;
- visualizar falhas;
- visualizar painel global;
- alertar após três falhas;
- executar job de acompanhamento.

## 5. Segurança

- criptografia ou proteção adequada de credenciais;
- rate limiting;
- validação de destinatário;
- logs sem API key;
- segregação por empresa;
- auditoria de alterações;
- timeout e retry controlados.

## 6. Critérios de aceite

- [ ] Instância pode ser configurada.
- [ ] Teste de conexão funciona.
- [ ] Envio registra tentativa.
- [ ] Sucesso e falha são registrados.
- [ ] Três falhas geram alerta.
- [ ] Secrets não aparecem no frontend.
- [ ] Superadmin possui visão global.
- [ ] Admin vê apenas sua empresa.
- [ ] Reenvio idempotente não duplica mensagem indevidamente.
