const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const RESOURCE_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{1,31}$/u;

declare const resourceIdBrand: unique symbol;
declare const resourceCodeBrand: unique symbol;

export type ResourceId = string & { readonly [resourceIdBrand]: true };
export type ResourceCode = string & { readonly [resourceCodeBrand]: true };

export type Resource = Readonly<{
  code: ResourceCode;
  companyId: string;
  id: ResourceId;
  name: string;
}>;

export type NewResource = Readonly<{
  code: ResourceCode;
  id: ResourceId;
  name: string;
}>;

export function resourceIdFromString(value: string): ResourceId {
  if (!UUID_PATTERN.test(value)) {
    throw new TypeError('O identificador do recurso é inválido.');
  }

  return value.toLowerCase() as ResourceId;
}

export function resourceCodeFromString(value: string): ResourceCode {
  const normalized = value.trim().toUpperCase();

  if (!RESOURCE_CODE_PATTERN.test(normalized)) {
    throw new TypeError('O código do recurso é inválido.');
  }

  return normalized as ResourceCode;
}

export function resourceNameFromString(value: string): string {
  const normalized = value.trim();

  if (normalized.length < 2 || normalized.length > 100) {
    throw new TypeError('O nome do recurso é inválido.');
  }

  return normalized;
}
