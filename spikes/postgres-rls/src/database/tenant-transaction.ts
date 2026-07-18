import { sql, type Kysely, type Transaction } from 'kysely';

import type { TenantContext } from '../domain/context.js';
import { RlsSpikeDatabaseError, toSafeDatabaseError } from './errors.js';
import type { SpikeRlsDatabase } from './schema.js';

export type TenantTransaction = Transaction<SpikeRlsDatabase>;

export async function runInTenantTransaction<T>(
  database: Kysely<SpikeRlsDatabase>,
  context: TenantContext,
  operation: (transaction: TenantTransaction) => Promise<T>,
): Promise<T> {
  try {
    return await database.transaction().execute(async (transaction) => {
      const settingResult = await sql<{ company_id: string }>`
        select set_config(
          'app.current_company_id',
          ${context.companyId},
          true
        ) as company_id
      `.execute(transaction);

      if (settingResult.rows[0]?.company_id !== context.companyId) {
        throw new RlsSpikeDatabaseError(
          'O contexto local de tenant não pôde ser confirmado.',
        );
      }

      return operation(transaction);
    });
  } catch (error: unknown) {
    if (error instanceof RlsSpikeDatabaseError) {
      throw error;
    }

    throw toSafeDatabaseError(error);
  }
}

export async function readCurrentTenantSetting(
  database: Kysely<SpikeRlsDatabase>,
): Promise<string | null> {
  const result = await sql<{ company_id: string | null }>`
    select nullif(
      current_setting('app.current_company_id', true),
      ''
    ) as company_id
  `.execute(database);

  return result.rows[0]?.company_id ?? null;
}
