const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

declare const companyIdBrand: unique symbol;
declare const tenantContextBrand: unique symbol;
declare const platformContextBrand: unique symbol;

export type CompanyId = string & { readonly [companyIdBrand]: true };

export type TenantContext = Readonly<{
  actorId: string;
  companyId: CompanyId;
  correlationId: string;
  kind: 'tenant';
  readonly [tenantContextBrand]: true;
}>;

export type PlatformContext = Readonly<{
  actorId: string;
  correlationId: string;
  kind: 'platform';
  readonly [platformContextBrand]: true;
}>;

export class SecurityContextError extends Error {
  public readonly code = 'SPIKE_RLS_INVALID_SECURITY_CONTEXT';

  public constructor(message: string) {
    super(message);
    this.name = 'SecurityContextError';
  }
}

function requireNonEmpty(value: string, fieldName: string): string {
  const normalized = value.trim();

  if (normalized === '') {
    throw new SecurityContextError(`${fieldName} é obrigatório.`);
  }

  return normalized;
}

export function companyIdFromTrustedValue(value: string): CompanyId {
  if (!UUID_PATTERN.test(value)) {
    throw new SecurityContextError('O identificador de empresa é inválido.');
  }

  return value.toLowerCase() as CompanyId;
}

export function createTenantContext(input: Readonly<{
  actorId: string;
  companyId: string;
  correlationId: string;
}>): TenantContext {
  return Object.freeze({
    actorId: requireNonEmpty(input.actorId, 'actorId'),
    companyId: companyIdFromTrustedValue(input.companyId),
    correlationId: requireNonEmpty(input.correlationId, 'correlationId'),
    kind: 'tenant' as const,
  }) as TenantContext;
}

export function createPlatformContext(input: Readonly<{
  actorId: string;
  correlationId: string;
}>): PlatformContext {
  return Object.freeze({
    actorId: requireNonEmpty(input.actorId, 'actorId'),
    correlationId: requireNonEmpty(input.correlationId, 'correlationId'),
    kind: 'platform' as const,
  }) as PlatformContext;
}
