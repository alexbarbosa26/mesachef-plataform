import { describe, expect, it } from 'vitest';

import {
  createPlatformContext,
  createTenantContext,
  SecurityContextError,
} from '../../src/domain/context.js';

describe('contextos de segurança separados', () => {
  it('cria TenantContext imutável a partir de empresa validada', () => {
    const context = createTenantContext({
      actorId: 'actor-a',
      companyId: 'a0000000-0000-4000-8000-000000000001',
      correlationId: 'correlation-a',
    });

    expect(context).toMatchObject({
      companyId: 'a0000000-0000-4000-8000-000000000001',
      kind: 'tenant',
    });
    expect(Object.isFrozen(context)).toBe(true);
  });

  it('recusa companyId inválido sem repetir o valor no erro', () => {
    const invalidCompanyId = 'not-a-company-id';

    expect(() =>
      createTenantContext({
        actorId: 'actor-a',
        companyId: invalidCompanyId,
        correlationId: 'correlation-a',
      }),
    ).toThrow(SecurityContextError);

    try {
      createTenantContext({
        actorId: 'actor-a',
        companyId: invalidCompanyId,
        correlationId: 'correlation-a',
      });
    } catch (error: unknown) {
      expect((error as Error).message).not.toContain(invalidCompanyId);
    }
  });

  it('mantém PlatformContext sem companyId ou bypass de tenant', () => {
    const context = createPlatformContext({
      actorId: 'platform-actor',
      correlationId: 'platform-correlation',
    });

    expect(context).toEqual({
      actorId: 'platform-actor',
      correlationId: 'platform-correlation',
      kind: 'platform',
    });
    expect('companyId' in context).toBe(false);
    expect('bypassTenant' in context).toBe(false);
  });
});
