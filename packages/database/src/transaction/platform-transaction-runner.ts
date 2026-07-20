import type { Kysely, Transaction } from 'kysely';
import type { PlatformContext } from '@mesachef/domain';

/**
 * Runner de transação para operações globais na plataforma.
 * Não injeta contexto de tenant, permitindo acesso apenas às tabelas permitidas
 * para a role de plataforma.
 */
export class PlatformTransactionRunner<DB> {
  constructor(private readonly db: Kysely<DB>) {}

  public async run<T>(
    _context: PlatformContext,
    operation: (trx: Transaction<DB>) => Promise<T>
  ): Promise<T> {
    return this.db.transaction().execute(async (trx) => {
      // Platform context doesn't require setting 'app.current_company_id' 
      // because it relies on the mesachef_platform role and explicit global queries.
      return operation(trx);
    });
  }
}
