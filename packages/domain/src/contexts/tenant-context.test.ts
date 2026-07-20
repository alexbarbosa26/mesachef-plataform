import { describe, expect, it } from 'vitest';
import { TenantContext } from './tenant-context.js';
import { DomainRuleError } from '../errors/domain-rule-error.js';

describe('TenantContext', () => {
  it('cria contexto com sucesso', () => {
    const context = TenantContext.create({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      companyId: '123e4567-e89b-12d3-a456-426614174001',
      membershipId: '123e4567-e89b-12d3-a456-426614174002',
      correlationId: 'req-123',
    });
    
    expect(context.userId.toString()).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(context.companyId.toString()).toBe('123e4567-e89b-12d3-a456-426614174001');
    expect(context.correlationId).toBe('req-123');
  });

  it('falha com UUID invalido', () => {
    expect(() => TenantContext.create({
      userId: 'invalid',
      companyId: '123e4567-e89b-12d3-a456-426614174001',
      membershipId: '123e4567-e89b-12d3-a456-426614174002',
      correlationId: 'req-123',
    })).toThrowError(DomainRuleError);
  });

  it('falha sem correlationId', () => {
    expect(() => TenantContext.create({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      companyId: '123e4567-e89b-12d3-a456-426614174001',
      membershipId: '123e4567-e89b-12d3-a456-426614174002',
      correlationId: '',
    })).toThrowError(DomainRuleError);
  });
});
