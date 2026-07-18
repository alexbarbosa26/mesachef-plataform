import { UtcDateTime } from '@mesachef/domain';

import { DatabaseValueError } from './database-value-error.js';

export function utcDateTimeFromPostgres(value: unknown): UtcDateTime {
  if (value instanceof Date) {
    return UtcDateTime.fromDate(value);
  }

  if (typeof value === 'string') {
    const date = new Date(value);

    if (Number.isFinite(date.getTime())) {
      return UtcDateTime.fromDate(date);
    }
  }

  throw new DatabaseValueError('PostgreSQL timestamptz');
}

export function utcDateTimeToPostgres(value: UtcDateTime): string {
  return value.toString();
}

export function utcDateTimeFromSqliteText(value: unknown): UtcDateTime {
  if (typeof value !== 'string') {
    throw new DatabaseValueError('SQLite UTC text');
  }

  return UtcDateTime.parse(value);
}

export function utcDateTimeToSqliteText(value: UtcDateTime): string {
  return value.toString();
}
