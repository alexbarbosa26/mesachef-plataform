import { UuidValue } from '@mesachef/domain';

import { DatabaseValueError } from './database-value-error.js';

function uuidFromText(value: unknown, concept: string): UuidValue {
  if (typeof value !== 'string') {
    throw new DatabaseValueError(concept);
  }

  return UuidValue.parse(value);
}

export function uuidFromPostgres(value: unknown): UuidValue {
  return uuidFromText(value, 'PostgreSQL UUID');
}

export function uuidToPostgres(value: UuidValue): string {
  return value.toString();
}

export function uuidFromSqliteText(value: unknown): UuidValue {
  return uuidFromText(value, 'SQLite UUID text');
}

export function uuidToSqliteText(value: UuidValue): string {
  return value.toString();
}
