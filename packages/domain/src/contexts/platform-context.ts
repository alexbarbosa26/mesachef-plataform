import { UuidValue } from '../value-objects/uuid-value.js';
import { DomainRuleError } from '../errors/domain-rule-error.js';

export interface PlatformContextProps {
  userId?: string;
  correlationId: string;
}

/**
 * Representa o contexto autenticado e validado para operações globais na plataforma.
 * Não provê `companyId` nem autoriza acesso a tabelas tenant-owned.
 */
export class PlatformContext {
  public readonly userId?: UuidValue;
  public readonly correlationId: string;

  private constructor(props: { userId?: UuidValue; correlationId: string }) {
    if (props.userId) {
      this.userId = props.userId;
    }
    this.correlationId = props.correlationId;
  }

  public static create(props: PlatformContextProps): PlatformContext {
    const userId = props.userId ? UuidValue.parse(props.userId) : undefined;

    if (!props.correlationId || props.correlationId.trim() === '') {
      throw new DomainRuleError({ code: 'PLATFORM_CONTEXT_INVALID', message: 'Correlation ID is required' });
    }

    const ctxProps: { userId?: UuidValue; correlationId: string } = {
      correlationId: props.correlationId,
    };

    if (userId) {
      ctxProps.userId = userId;
    }

    return new PlatformContext(ctxProps);
  }
}
