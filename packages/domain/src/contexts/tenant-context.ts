import { UuidValue } from '../value-objects/uuid-value.js';
import { DomainRuleError } from '../errors/domain-rule-error.js';

export interface TenantContextProps {
  userId: string;
  companyId: string;
  membershipId: string;
  correlationId: string;
}

/**
 * Representa o contexto autenticado e validado para operações em um tenant.
 * Nenhuma operação em repositório tenant-owned deve ser executada sem este contexto.
 */
export class TenantContext {
  public readonly userId: UuidValue;
  public readonly companyId: UuidValue;
  public readonly membershipId: UuidValue;
  public readonly correlationId: string;

  private constructor(props: { userId: UuidValue; companyId: UuidValue; membershipId: UuidValue; correlationId: string }) {
    this.userId = props.userId;
    this.companyId = props.companyId;
    this.membershipId = props.membershipId;
    this.correlationId = props.correlationId;
  }

  public static create(props: TenantContextProps): TenantContext {
    const userId = UuidValue.parse(props.userId);
    const companyId = UuidValue.parse(props.companyId);
    const membershipId = UuidValue.parse(props.membershipId);

    if (!props.correlationId || props.correlationId.trim() === '') {
      throw new DomainRuleError({ code: 'TENANT_CONTEXT_INVALID', message: 'Correlation ID is required' });
    }

    return new TenantContext({
      userId,
      companyId,
      membershipId,
      correlationId: props.correlationId,
    });
  }
}
