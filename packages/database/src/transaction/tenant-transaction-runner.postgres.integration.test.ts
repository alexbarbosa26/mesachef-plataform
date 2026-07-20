import { describe, expect, it, afterAll } from 'vitest';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { TenantTransactionRunner } from './tenant-transaction-runner.js';
import { TenantContext } from '@mesachef/domain';
import type { MigrationInfrastructureDatabase } from '../kysely/database-schema.js';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

const environmentPath = resolve('.env');
if (existsSync(environmentPath)) {
  process.loadEnvFile(environmentPath);
}

// Utilizando um pool real contra o banco de teste do PostgreSQL 14 (mesachef_test_db)
const pool = new Pool({
  connectionString: process.env['DATABASE_URL'] || 'postgres://postgres:postgres@localhost:5432/mesachef_test_db',
  max: 10,
});

const dialect = new PostgresDialect({
  pool,
});

const db = new Kysely<MigrationInfrastructureDatabase>({ dialect });

describe('TenantTransactionRunner - PostgreSQL Integration', () => {
  afterAll(async () => {
    await db.destroy();
  });

  it('deve executar transacao injetando companyId e limpar apois commit', async () => {
    const runner = new TenantTransactionRunner(db);
    const context = TenantContext.create({
      userId: '11111111-1111-1111-1111-111111111111',
      companyId: '22222222-2222-2222-2222-222222222222',
      membershipId: '33333333-3333-3333-3333-333333333333',
      correlationId: 'test-req',
    });

    const result = await runner.run(context, async (trx) => {
      // Verifica se a configuracao esta setada no PostgreSQL
      const res = await sql`select current_setting('app.current_company_id', true) as company_id`.execute(trx);
      return res.rows[0];
    });

    // Validar injecao
    expect((result as { company_id: string }).company_id).toBe('22222222-2222-2222-2222-222222222222');

    // Validar limpeza forçando outra query na mesma pool fora do runner
    const outside = await sql`select current_setting('app.current_company_id', true) as company_id`.execute(db);
    expect((outside.rows[0] as { company_id: string | null }).company_id).toBe('');
  });

  it('nao deve vazar companyId apos erro (rollback)', async () => {
    const runner = new TenantTransactionRunner(db);
    const context = TenantContext.create({
      userId: '11111111-1111-1111-1111-111111111111',
      companyId: '44444444-4444-4444-4444-444444444444',
      membershipId: '33333333-3333-3333-3333-333333333333',
      correlationId: 'test-req-2',
    });

    try {
      await runner.run(context, async (_trx) => {
        throw new Error('Simulando erro');
      });
    } catch (_err) {
      // ignorado
    }

    const outside = await sql`select current_setting('app.current_company_id', true) as company_id`.execute(db);
    expect((outside.rows[0] as { company_id: string | null }).company_id).toBe('');
  });
});
