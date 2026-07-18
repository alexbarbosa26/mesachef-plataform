import type { Kysely } from 'kysely';

import {
  createTenantContext,
  type PlatformContext,
} from '../domain/context.js';
import { KyselyTenantResourceRepository } from '../database/kysely-tenant-resource-repository.js';
import { PlatformCompanyRepository } from '../database/platform-company-repository.js';
import type { SpikeRlsDatabase } from '../database/schema.js';
import { runInTenantTransaction } from '../database/tenant-transaction.js';

export type TenantResourceCount = Readonly<{
  companyId: string;
  resourceCount: number;
}>;

export async function runGlobalResourceCountJob(input: Readonly<{
  platformContext: PlatformContext;
  platformDatabase: Kysely<SpikeRlsDatabase>;
  tenantDatabase: Kysely<SpikeRlsDatabase>;
}>): Promise<readonly TenantResourceCount[]> {
  const companies = await input.platformDatabase.transaction().execute(
    async (transaction) =>
      new PlatformCompanyRepository(transaction).list(input.platformContext),
  );

  const counts: TenantResourceCount[] = [];

  for (const company of companies) {
    const tenantContext = createTenantContext({
      actorId: input.platformContext.actorId,
      companyId: company.id,
      correlationId: input.platformContext.correlationId,
    });
    const resourceCount = await runInTenantTransaction(
      input.tenantDatabase,
      tenantContext,
      async (transaction) =>
        (await new KyselyTenantResourceRepository(transaction).list(tenantContext))
          .length,
    );

    counts.push({ companyId: company.id, resourceCount });
  }

  return counts;
}
