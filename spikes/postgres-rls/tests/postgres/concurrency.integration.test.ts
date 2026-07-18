import { sql } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { runGlobalResourceCountJob } from '../../src/application/platform-job.js';
import { createPlatformContext } from '../../src/domain/context.js';
import { KyselyTenantResourceRepository } from '../../src/database/kysely-tenant-resource-repository.js';
import {
  readCurrentTenantSetting,
  runInTenantTransaction,
} from '../../src/database/tenant-transaction.js';
import {
  createPostgresRlsFixture,
  TEST_IDS,
  type PostgresRlsFixture,
} from '../support/postgres-fixture.js';

let fixture: PostgresRlsFixture;

beforeAll(async () => {
  fixture = await createPostgresRlsFixture({ maxApplicationConnections: 8 });
});

afterAll(async () => {
  await fixture.dispose();
});

describe('concorrência e reuso do pool PostgreSQL', () => {
  it('isola requisições concorrentes de empresas diferentes', async () => {
    const executions = Array.from({ length: 40 }, (_, index) => {
      const context = index % 2 === 0 ? fixture.contextA : fixture.contextB;

      return runInTenantTransaction(
        fixture.application.database,
        context,
        async (transaction) => {
          const setting = await sql<{
            company_id: string;
            process_id: number;
          }>`
            select
              current_setting('app.current_company_id') as company_id,
              pg_backend_pid() as process_id,
              pg_sleep(0.01)
          `.execute(transaction);
          const rows = await new KyselyTenantResourceRepository(transaction).list(
            context,
          );

          return {
            companyId: setting.rows[0]?.company_id,
            processId: setting.rows[0]?.process_id,
            rowCompanyIds: rows.map((row) => row.companyId),
          };
        },
      );
    });
    const results = await Promise.all(executions);

    expect(new Set(results.map((result) => result.processId)).size).toBeGreaterThan(
      1,
    );
    for (const result of results) {
      expect(result.rowCompanyIds).toEqual([result.companyId]);
    }
  });

  it('devolve conexões ao pool sem contexto residual', async () => {
    for (let index = 0; index < 20; index += 1) {
      const context = index % 2 === 0 ? fixture.contextA : fixture.contextB;
      const companyId = await runInTenantTransaction(
        fixture.application.database,
        context,
        async (transaction) => {
          const result = await sql<{ company_id: string }>`
            select current_setting('app.current_company_id') as company_id
          `.execute(transaction);
          return result.rows[0]?.company_id;
        },
      );

      expect(companyId).toBe(context.companyId);
    }

    expect(await readCurrentTenantSetting(fixture.application.database)).toBeNull();

    const poolProbes = await Promise.all(
      Array.from({ length: 16 }, async () => {
        const result = await sql<{
          company_id: string | null;
          process_id: number;
          row_count: number;
        }>`
          select
            nullif(
              current_setting('app.current_company_id', true),
              ''
            ) as company_id,
            pg_backend_pid() as process_id,
            (select count(*)::integer from spike_rls_resources) as row_count,
            pg_sleep(0.01)
        `.execute(fixture.application.database);

        return result.rows[0];
      }),
    );

    expect(new Set(poolProbes.map((probe) => probe?.process_id)).size).toBeGreaterThan(
      1,
    );
    expect(
      poolProbes.every(
        (probe) => probe?.company_id === null && probe.row_count === 0,
      ),
    ).toBe(true);
  });

  it('executa job global por iteração explícita de tenants e termina sem resíduo', async () => {
    const counts = await runGlobalResourceCountJob({
      platformContext: createPlatformContext({
        actorId: 'spike-global-job',
        correlationId: 'spike-global-job-correlation',
      }),
      platformDatabase: fixture.platform.database,
      tenantDatabase: fixture.application.database,
    });

    expect(counts).toEqual([
      { companyId: TEST_IDS.companyA, resourceCount: 1 },
      { companyId: TEST_IDS.companyB, resourceCount: 1 },
    ]);
    expect(await readCurrentTenantSetting(fixture.application.database)).toBeNull();
    expect(
      await fixture.application.database
        .selectFrom('spike_rls_resources')
        .selectAll()
        .execute(),
    ).toEqual([]);
  });
});
