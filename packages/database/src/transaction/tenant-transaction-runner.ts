import { sql } from 'kysely';
import type { Kysely, Transaction } from 'kysely';
import type { TenantContext } from '@mesachef/domain';

/**
 * Runner de transação para operações tenant-owned.
 * Envolve a execução em uma transação e injeta o `TenantContext` no PostgreSQL
 * via `set_config('app.current_company_id', companyId, true)` (válido apenas dentro da transação).
 */
export class TenantTransactionRunner<DB> {
  constructor(private readonly db: Kysely<DB>) {}

  public async run<T>(
    context: TenantContext,
    operation: (trx: Transaction<DB>) => Promise<T>
  ): Promise<T> {
    return this.db.transaction().execute(async (trx) => {
      // Configura o companyId para RLS localmente nesta transação (is_local = true)
      try {
        await sql`select set_config('app.current_company_id', ${context.companyId.toString()}, true)`.execute(trx);
      } catch (_error) {
        throw new Error('Failed to set tenant context in transaction', { cause: _error });
      }

      return operation(trx);
    });
  }
}
