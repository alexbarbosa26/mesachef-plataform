import type { CompanyId, ResourceId } from './identifiers.js';
import type { MoneyDecimal } from './money-decimal.js';

declare const resourceCodeBrand: unique symbol;

export type ResourceCode = string & { readonly [resourceCodeBrand]: true };

export interface Resource {
  readonly code: ResourceCode;
  readonly companyId: CompanyId;
  readonly createdAt: string;
  readonly id: ResourceId;
  readonly unitPrice: MoneyDecimal;
}

export interface NewResource {
  readonly code: ResourceCode;
  readonly id: ResourceId;
  readonly unitPrice: MoneyDecimal;
}

export function resourceCodeFromString(value: string): ResourceCode {
  if (!/^[A-Z][A-Z0-9_]{1,31}$/u.test(value)) {
    throw new TypeError(
      'ResourceCode deve usar letras maiúsculas, números ou underscore.',
    );
  }

  return value as ResourceCode;
}

