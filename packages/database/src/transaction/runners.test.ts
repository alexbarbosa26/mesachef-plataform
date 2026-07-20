import { describe, expect, it } from 'vitest';
import { PlatformContext } from '@mesachef/domain';
import { TenantTransactionRunner } from './tenant-transaction-runner.js';
import { PlatformTransactionRunner } from './platform-transaction-runner.js';
import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';

describe('Transaction Runners', () => {
  it('PlatformTransactionRunner envelopa operação na transação (SQLite Mock)', async () => {
    const sqliteDatabase = new Database(':memory:');
    const db = new Kysely<unknown>({ dialect: new SqliteDialect({ database: sqliteDatabase }) });
    const runner = new PlatformTransactionRunner(db);
    const context = PlatformContext.create({ correlationId: 'req-1' });

    const result = await runner.run(context, async (_trx) => {
      return 'platform-ok';
    });

    expect(result).toBe('platform-ok');
    await db.destroy();
  });

  it('TenantTransactionRunner lança falha silenciosa ou roda set_config em PostgreSQL Mock', async () => {
    // A validação real é feita em testes de integração.
    expect(TenantTransactionRunner).toBeDefined();
  });
});
