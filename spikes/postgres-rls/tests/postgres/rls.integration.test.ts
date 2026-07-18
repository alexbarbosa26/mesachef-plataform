import { sql } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createPlatformContext } from '../../src/domain/context.js';
import {
  resourceCodeFromString,
  resourceIdFromString,
} from '../../src/domain/resource.js';
import { KyselyTenantResourceRepository } from '../../src/database/kysely-tenant-resource-repository.js';
import { PlatformCompanyRepository } from '../../src/database/platform-company-repository.js';
import { EXPERIMENTAL_ROLE_NAMES } from '../../src/database/roles.js';
import {
  readCurrentTenantSetting,
  runInTenantTransaction,
} from '../../src/database/tenant-transaction.js';
import {
  RlsSpikeDatabaseError,
  toSafeDatabaseError,
} from '../../src/database/errors.js';
import {
  createPostgresRlsFixture,
  RESOURCE_IDS,
  TEST_IDS,
  type PostgresRlsFixture,
} from '../support/postgres-fixture.js';

let fixture: PostgresRlsFixture;

beforeAll(async () => {
  fixture = await createPostgresRlsFixture({ maxApplicationConnections: 1 });
});

afterAll(async () => {
  await fixture.dispose();
});

async function expectSafeDatabaseFailure(
  operation: Promise<unknown>,
): Promise<void> {
  let receivedError: unknown;

  try {
    await operation;
  } catch (error: unknown) {
    receivedError = error;
  }

  expect(receivedError).toBeInstanceOf(RlsSpikeDatabaseError);
  expect((receivedError as Error).message).not.toMatch(
    /postgres(?:ql)?:\/\//iu,
  );
  expect((receivedError as Error).message).not.toContain('@');
}

describe('PostgreSQL 14 RLS com role real da aplicação', () => {
  it('confirma PostgreSQL 14, RLS, FORCE e roles sem bypass', async () => {
    const version = await sql<{ server_version_num: string }>`
      select current_setting('server_version_num') as server_version_num
    `.execute(fixture.admin.database);
    const tables = await sql<{
      owner_name: string;
      relforcerowsecurity: boolean;
      relname: string;
      relrowsecurity: boolean;
    }>`
      select
        owner.rolname as owner_name,
        relation.relforcerowsecurity,
        relation.relname,
        relation.relrowsecurity
      from pg_class relation
      join pg_roles owner on owner.oid = relation.relowner
      where relation.relname in (
        'spike_rls_resources',
        'spike_rls_audit_events'
      )
      order by relation.relname
    `.execute(fixture.admin.database);
    const roles = await sql<{
      rolbypassrls: boolean;
      rolname: string;
      rolsuper: boolean;
    }>`
      select rolname, rolbypassrls, rolsuper
      from pg_roles
      where rolname in (
        ${EXPERIMENTAL_ROLE_NAMES.application},
        ${EXPERIMENTAL_ROLE_NAMES.owner},
        ${EXPERIMENTAL_ROLE_NAMES.platform}
      )
      order by rolname
    `.execute(fixture.admin.database);

    expect(version.rows[0]?.server_version_num.startsWith('14')).toBe(true);
    expect(tables.rows).toHaveLength(2);
    expect(tables.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          owner_name: EXPERIMENTAL_ROLE_NAMES.owner,
          relforcerowsecurity: true,
          relrowsecurity: true,
        }),
      ]),
    );
    expect(roles.rows).toHaveLength(3);
    expect(roles.rows.every((role) => !role.rolbypassrls && !role.rolsuper)).toBe(
      true,
    );
  });

  it('aplica FORCE RLS à role proprietária não-superuser', async () => {
    await fixture.admin.database.transaction().execute(async (transaction) => {
      await sql.raw(
        `set local role ${EXPERIMENTAL_ROLE_NAMES.owner}`,
      ).execute(transaction);
      const result = await sql<{
        active: boolean;
        row_count: number;
      }>`
        select
          row_security_active('spike_rls_resources') as active,
          (select count(*)::integer from spike_rls_resources) as row_count
      `.execute(transaction);

      expect(result.rows[0]).toEqual({ active: true, row_count: 0 });
    });
  });

  it('permite leitura somente da empresa ativa, inclusive em SQL direto e auditoria', async () => {
    const result = await runInTenantTransaction(
      fixture.application.database,
      fixture.contextA,
      async (transaction) => {
        const repository = new KyselyTenantResourceRepository(transaction);
        const directRows = await transaction
          .selectFrom('spike_rls_resources')
          .select(['company_id', 'id'])
          .execute();
        const auditRows = await transaction
          .selectFrom('spike_rls_audit_events')
          .select(['company_id', 'id'])
          .execute();

        return {
          auditRows,
          directRows,
          repositoryRows: await repository.list(fixture.contextA),
        };
      },
    );

    expect(result.directRows).toEqual([
      { company_id: TEST_IDS.companyA, id: TEST_IDS.resourceA },
    ]);
    expect(result.auditRows).toEqual([
      { company_id: TEST_IDS.companyA, id: TEST_IDS.auditA },
    ]);
    expect(result.repositoryRows.map((resource) => resource.companyId)).toEqual([
      TEST_IDS.companyA,
    ]);
  });

  it('limita insert à empresa ativa e recusa companyId trocado', async () => {
    const createdId = resourceIdFromString(
      'a3000000-0000-4000-8000-000000000001',
    );
    const maliciousId = resourceIdFromString(
      'b3000000-0000-4000-8000-000000000001',
    );
    const created = await runInTenantTransaction(
      fixture.application.database,
      fixture.contextA,
      async (transaction) =>
        new KyselyTenantResourceRepository(transaction).create(
          fixture.contextA,
          {
            code: resourceCodeFromString('A_CREATED'),
            id: createdId,
            name: 'Criado na empresa A',
          },
        ),
    );

    expect(created.companyId).toBe(TEST_IDS.companyA);

    await expectSafeDatabaseFailure(
      runInTenantTransaction(
        fixture.application.database,
        fixture.contextA,
        async (transaction) =>
          new KyselyTenantResourceRepository(transaction).create(
            fixture.contextB,
            {
              code: resourceCodeFromString('B_MALICIOUS'),
              id: maliciousId,
              name: 'Tentativa de troca de empresa',
            },
          ),
      ),
    );

    const maliciousRow = await fixture.admin.database
      .selectFrom('spike_rls_resources')
      .select('id')
      .where('id', '=', maliciousId)
      .executeTakeFirst();
    expect(maliciousRow).toBeUndefined();
  });

  it('limita update à empresa ativa e impede mover linha para outro tenant', async () => {
    const result = await runInTenantTransaction(
      fixture.application.database,
      fixture.contextA,
      async (transaction) => {
        const repository = new KyselyTenantResourceRepository(transaction);
        const own = await repository.updateName(
          fixture.contextA,
          RESOURCE_IDS.a,
          'Recurso A atualizado',
        );
        const other = await repository.updateName(
          fixture.contextA,
          RESOURCE_IDS.b,
          'Tentativa cruzada',
        );
        const directOther = await transaction
          .updateTable('spike_rls_resources')
          .set({ name: 'Tentativa SQL cruzada' })
          .where('id', '=', RESOURCE_IDS.b)
          .executeTakeFirst();

        return { directOther, other, own };
      },
    );

    expect(result.own?.name).toBe('Recurso A atualizado');
    expect(result.other).toBeNull();
    expect(result.directOther.numUpdatedRows).toBe(0n);

    await expectSafeDatabaseFailure(
      runInTenantTransaction(
        fixture.application.database,
        fixture.contextA,
        async (transaction) =>
          transaction
            .updateTable('spike_rls_resources')
            .set({ company_id: TEST_IDS.companyB })
            .where('id', '=', RESOURCE_IDS.a)
            .execute(),
      ),
    );
  });

  it('limita delete à empresa ativa', async () => {
    const disposableId = resourceIdFromString(
      'a4000000-0000-4000-8000-000000000001',
    );

    const result = await runInTenantTransaction(
      fixture.application.database,
      fixture.contextA,
      async (transaction) => {
        const repository = new KyselyTenantResourceRepository(transaction);
        await repository.create(fixture.contextA, {
          code: resourceCodeFromString('A_DELETE'),
          id: disposableId,
          name: 'Recurso descartável A',
        });

        return {
          deletedOther: await repository.deleteById(
            fixture.contextA,
            RESOURCE_IDS.b,
          ),
          deletedOwn: await repository.deleteById(
            fixture.contextA,
            disposableId,
          ),
        };
      },
    );

    expect(result).toEqual({ deletedOther: false, deletedOwn: true });
  });

  it('nega por padrão quando o contexto está ausente', async () => {
    const rows = await fixture.application.database
      .selectFrom('spike_rls_resources')
      .selectAll()
      .execute();

    expect(rows).toEqual([]);

    let receivedError: unknown;
    try {
      await fixture.application.database
        .insertInto('spike_rls_resources')
        .values({
          company_id: TEST_IDS.companyA,
          id: 'a5000000-0000-4000-8000-000000000001',
          name: 'Sem contexto',
          resource_code: 'NO_CONTEXT',
        })
        .execute();
    } catch (error: unknown) {
      receivedError = toSafeDatabaseError(error);
    }

    expect(receivedError).toBeInstanceOf(RlsSpikeDatabaseError);
  });

  it('falha com segurança quando o contexto da conexão é inválido', async () => {
    let receivedError: unknown;

    try {
      await fixture.application.database.transaction().execute(
        async (transaction) => {
          await sql`
            select set_config(
              'app.current_company_id',
              'invalid-company-context',
              true
            )
          `.execute(transaction);
          await transaction
            .selectFrom('spike_rls_resources')
            .selectAll()
            .execute();
        },
      );
    } catch (error: unknown) {
      receivedError = toSafeDatabaseError(error);
    }

    expect(receivedError).toBeInstanceOf(RlsSpikeDatabaseError);
    expect((receivedError as Error).message).not.toContain(
      'invalid-company-context',
    );
    expect((receivedError as Error).message).not.toMatch(
      /postgres(?:ql)?:\/\//iu,
    );
  });

  it('remove o contexto da mesma conexão após commit', async () => {
    await runInTenantTransaction(
      fixture.application.database,
      fixture.contextA,
      async (transaction) => {
        const setting = await sql<{ company_id: string }>`
          select current_setting('app.current_company_id') as company_id
        `.execute(transaction);
        expect(setting.rows[0]?.company_id).toBe(TEST_IDS.companyA);
      },
    );

    expect(await readCurrentTenantSetting(fixture.application.database)).toBeNull();
    expect(
      await fixture.application.database
        .selectFrom('spike_rls_resources')
        .selectAll()
        .execute(),
    ).toEqual([]);
  });

  it('remove o contexto da mesma conexão após rollback', async () => {
    await expectSafeDatabaseFailure(
      runInTenantTransaction(
        fixture.application.database,
        fixture.contextA,
        async () => {
          throw new Error('rollback-intencional-do-spike');
        },
      ),
    );

    expect(await readCurrentTenantSetting(fixture.application.database)).toBeNull();
    expect(
      await fixture.application.database
        .selectFrom('spike_rls_resources')
        .selectAll()
        .execute(),
    ).toEqual([]);
  });

  it('trata IDOR e ID inexistente com a mesma semântica', async () => {
    const result = await runInTenantTransaction(
      fixture.application.database,
      fixture.contextA,
      async (transaction) => {
        const repository = new KyselyTenantResourceRepository(transaction);
        return {
          crossTenant: await repository.findById(
            fixture.contextA,
            RESOURCE_IDS.b,
          ),
          missing: await repository.findById(
            fixture.contextA,
            RESOURCE_IDS.missing,
          ),
        };
      },
    );

    expect(result).toEqual({ crossTenant: null, missing: null });
  });

  it('mantém filtro do repository mesmo quando a role administrativa ignora RLS', async () => {
    const rows = await fixture.admin.database.transaction().execute(
      async (transaction) =>
        new KyselyTenantResourceRepository(transaction).list(fixture.contextA),
    );
    const crossTenant = await fixture.admin.database.transaction().execute(
      async (transaction) =>
        new KyselyTenantResourceRepository(transaction).findById(
          fixture.contextA,
          RESOURCE_IDS.b,
        ),
    );

    expect(rows.every((resource) => resource.companyId === TEST_IDS.companyA)).toBe(
      true,
    );
    expect(crossTenant).toBeNull();
  });

  it('separa PlatformContext e impede acesso global implícito aos dados tenant', async () => {
    const platformContext = createPlatformContext({
      actorId: 'spike-superadmin',
      correlationId: 'spike-platform-correlation',
    });
    const companies = await fixture.platform.database.transaction().execute(
      async (transaction) =>
        new PlatformCompanyRepository(transaction).list(platformContext),
    );

    expect(companies.map((company) => company.id)).toEqual([
      TEST_IDS.companyA,
      TEST_IDS.companyB,
    ]);

    let receivedError: unknown;
    try {
      await fixture.platform.database
        .selectFrom('spike_rls_resources')
        .selectAll()
        .execute();
    } catch (error: unknown) {
      receivedError = toSafeDatabaseError(error);
    }

    expect(receivedError).toBeInstanceOf(RlsSpikeDatabaseError);
    expect((receivedError as Error).message).not.toMatch(
      /postgres(?:ql)?:\/\//iu,
    );
  });
});
