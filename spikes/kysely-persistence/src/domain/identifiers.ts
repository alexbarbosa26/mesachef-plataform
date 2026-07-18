import { randomUUID } from 'node:crypto';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

declare const companyIdBrand: unique symbol;
declare const membershipIdBrand: unique symbol;
declare const resourceIdBrand: unique symbol;
declare const userIdBrand: unique symbol;

export type CompanyId = string & { readonly [companyIdBrand]: true };
export type MembershipId = string & { readonly [membershipIdBrand]: true };
export type ResourceId = string & { readonly [resourceIdBrand]: true };
export type UserId = string & { readonly [userIdBrand]: true };

function assertUuid(value: string, concept: string): void {
  if (!UUID_PATTERN.test(value)) {
    throw new TypeError(`${concept} deve ser um UUID válido.`);
  }
}

export function companyIdFromString(value: string): CompanyId {
  assertUuid(value, 'CompanyId');
  return value as CompanyId;
}

export function createCompanyId(): CompanyId {
  return companyIdFromString(randomUUID());
}

export function createMembershipId(): MembershipId {
  return membershipIdFromString(randomUUID());
}

export function createResourceId(): ResourceId {
  return resourceIdFromString(randomUUID());
}

export function createUserId(): UserId {
  return userIdFromString(randomUUID());
}

export function membershipIdFromString(value: string): MembershipId {
  assertUuid(value, 'MembershipId');
  return value as MembershipId;
}

export function resourceIdFromString(value: string): ResourceId {
  assertUuid(value, 'ResourceId');
  return value as ResourceId;
}

export function userIdFromString(value: string): UserId {
  assertUuid(value, 'UserId');
  return value as UserId;
}

