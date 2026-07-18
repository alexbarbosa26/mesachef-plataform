import type { Transaction } from 'kysely';

import type { PlatformContext } from '../domain/context.js';
import type { SpikeRlsDatabase } from './schema.js';

export type PlatformCompany = Readonly<{ id: string; name: string }>;

export class PlatformCompanyRepository {
  readonly #transaction: Transaction<SpikeRlsDatabase>;

  public constructor(transaction: Transaction<SpikeRlsDatabase>) {
    this.#transaction = transaction;
  }

  public async list(
    _context: PlatformContext,
  ): Promise<readonly PlatformCompany[]> {
    return this.#transaction
      .selectFrom('spike_rls_companies')
      .select(['id', 'name'])
      .orderBy('id', 'asc')
      .execute();
  }
}
