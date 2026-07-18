import type { TenantContext } from './context.js';
import type { NewResource, Resource, ResourceId } from './resource.js';

export interface TenantResourceRepository {
  create(context: TenantContext, resource: NewResource): Promise<Resource>;
  deleteById(context: TenantContext, resourceId: ResourceId): Promise<boolean>;
  findById(
    context: TenantContext,
    resourceId: ResourceId,
  ): Promise<Resource | null>;
  list(context: TenantContext): Promise<readonly Resource[]>;
  updateName(
    context: TenantContext,
    resourceId: ResourceId,
    name: string,
  ): Promise<Resource | null>;
}
