# Infraestrutura local

O Compose desta pasta inicia somente PostgreSQL 14 para desenvolvimento. Ele não contém configuração ou credencial de produção.

Na raiz do repositório:

```bash
pnpm db:config
pnpm db:up
```

Para acompanhar o banco:

```bash
pnpm db:logs
```

Para encerrar os containers sem apagar o volume:

```bash
pnpm db:down
```

Não use `down --volumes` sem autorização explícita e backup quando houver dados relevantes.
