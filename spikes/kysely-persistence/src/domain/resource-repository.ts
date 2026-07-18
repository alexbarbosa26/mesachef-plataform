import type { CompanyId, ResourceId } from './identifiers.js';
import type { NewResource, Resource } from './resource.js';

export interface TenantContext {
  readonly companyId: CompanyId;
}

export interface ResourceRepository {
  create(context: TenantContext, resource: NewResource): Promise<Resource>;
  findById(
    context: TenantContext,
    resourceId: ResourceId,
  ): Promise<Resource | null>;
  list(context: TenantContext): Promise<readonly Resource[]>;
}

