import type { Kysely } from 'kysely';

import {
  companyIdFromString,
  resourceIdFromString,
} from '../domain/identifiers.js';
import { MoneyDecimal } from '../domain/money-decimal.js';
import type {
  ResourceRepository,
  TenantContext,
} from '../domain/resource-repository.js';
import type { NewResource, Resource } from '../domain/resource.js';
import { resourceCodeFromString } from '../domain/resource.js';
import type { SpikeDatabase, SpikeResourceRow } from './schema.js';

type Clock = () => string;

function systemClock(): string {
  return new Date().toISOString();
}

function mapTimestamp(value: Date | string): string {
  const timestamp = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(timestamp.getTime())) {
    throw new TypeError('Timestamp inválido retornado pela persistência.');
  }

  return timestamp.toISOString();
}

function mapResource(row: SpikeResourceRow): Resource {
  return {
    code: resourceCodeFromString(row.resource_code),
    companyId: companyIdFromString(row.company_id),
    createdAt: mapTimestamp(row.created_at),
    id: resourceIdFromString(row.id),
    unitPrice: MoneyDecimal.fromDatabase(row.unit_price),
  };
}

export class KyselyResourceRepository implements ResourceRepository {
  readonly #clock: Clock;
  readonly #database: Kysely<SpikeDatabase>;

  public constructor(
    database: Kysely<SpikeDatabase>,
    clock: Clock = systemClock,
  ) {
    this.#database = database;
    this.#clock = clock;
  }

  public async create(
    context: TenantContext,
    resource: NewResource,
  ): Promise<Resource> {
    await this.#database
      .insertInto('spike_resources')
      .values({
        company_id: context.companyId,
        created_at: this.#clock(),
        id: resource.id,
        resource_code: resource.code,
        unit_price: resource.unitPrice.toDatabaseString(),
      })
      .executeTakeFirstOrThrow();

    const createdResource = await this.findById(context, resource.id);

    if (createdResource === null) {
      throw new Error('Recurso persistido não pôde ser relido no mesmo tenant.');
    }

    return createdResource;
  }

  public async findById(
    context: TenantContext,
    resourceId: Resource['id'],
  ): Promise<Resource | null> {
    const row = await this.#database
      .selectFrom('spike_resources')
      .selectAll()
      .where('company_id', '=', context.companyId)
      .where('id', '=', resourceId)
      .executeTakeFirst();

    return row === undefined ? null : mapResource(row);
  }

  public async list(context: TenantContext): Promise<readonly Resource[]> {
    const rows = await this.#database
      .selectFrom('spike_resources')
      .selectAll()
      .where('company_id', '=', context.companyId)
      .orderBy('resource_code', 'asc')
      .execute();

    return rows.map(mapResource);
  }
}
