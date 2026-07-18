import type { TenantContext } from '../domain/context.js';
import {
  resourceCodeFromString,
  resourceIdFromString,
  resourceNameFromString,
  type NewResource,
  type Resource,
  type ResourceId,
} from '../domain/resource.js';
import type { TenantResourceRepository } from '../domain/resource-repository.js';
import type { TenantTransaction } from './tenant-transaction.js';

function mapResource(row: Readonly<{
  company_id: string;
  id: string;
  name: string;
  resource_code: string;
}>): Resource {
  return {
    code: resourceCodeFromString(row.resource_code),
    companyId: row.company_id,
    id: resourceIdFromString(row.id),
    name: resourceNameFromString(row.name),
  };
}

export class KyselyTenantResourceRepository
  implements TenantResourceRepository
{
  readonly #transaction: TenantTransaction;

  public constructor(transaction: TenantTransaction) {
    this.#transaction = transaction;
  }

  public async create(
    context: TenantContext,
    resource: NewResource,
  ): Promise<Resource> {
    const row = await this.#transaction
      .insertInto('spike_rls_resources')
      .values({
        company_id: context.companyId,
        id: resource.id,
        name: resourceNameFromString(resource.name),
        resource_code: resource.code,
      })
      .returning(['company_id', 'id', 'name', 'resource_code'])
      .executeTakeFirstOrThrow();

    return mapResource(row);
  }

  public async deleteById(
    context: TenantContext,
    resourceId: ResourceId,
  ): Promise<boolean> {
    const result = await this.#transaction
      .deleteFrom('spike_rls_resources')
      .where('company_id', '=', context.companyId)
      .where('id', '=', resourceId)
      .executeTakeFirst();

    return result.numDeletedRows === 1n;
  }

  public async findById(
    context: TenantContext,
    resourceId: ResourceId,
  ): Promise<Resource | null> {
    const row = await this.#transaction
      .selectFrom('spike_rls_resources')
      .select(['company_id', 'id', 'name', 'resource_code'])
      .where('company_id', '=', context.companyId)
      .where('id', '=', resourceId)
      .executeTakeFirst();

    return row === undefined ? null : mapResource(row);
  }

  public async list(context: TenantContext): Promise<readonly Resource[]> {
    const rows = await this.#transaction
      .selectFrom('spike_rls_resources')
      .select(['company_id', 'id', 'name', 'resource_code'])
      .where('company_id', '=', context.companyId)
      .orderBy('resource_code', 'asc')
      .execute();

    return rows.map(mapResource);
  }

  public async updateName(
    context: TenantContext,
    resourceId: ResourceId,
    name: string,
  ): Promise<Resource | null> {
    const row = await this.#transaction
      .updateTable('spike_rls_resources')
      .set({ name: resourceNameFromString(name) })
      .where('company_id', '=', context.companyId)
      .where('id', '=', resourceId)
      .returning(['company_id', 'id', 'name', 'resource_code'])
      .executeTakeFirst();

    return row === undefined ? null : mapResource(row);
  }
}
