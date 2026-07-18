import { MoneyDecimal, UtcDateTime, UuidValue } from '@mesachef/domain';
import { describe, expect, it } from 'vitest';

import {
  moneyDecimalFromPostgresNumeric,
  moneyDecimalFromSqliteText,
  moneyDecimalToPostgresNumeric,
  moneyDecimalToSqliteText,
} from './money-decimal-adapter.js';
import {
  utcDateTimeFromPostgres,
  utcDateTimeFromSqliteText,
  utcDateTimeToPostgres,
  utcDateTimeToSqliteText,
} from './utc-date-time-adapter.js';
import {
  uuidFromPostgres,
  uuidFromSqliteText,
  uuidToPostgres,
  uuidToSqliteText,
} from './uuid-adapter.js';

describe('database value adapters', () => {
  it('keeps PostgreSQL numeric and SQLite decimal as exact text', () => {
    const raw = '9007199254740993.1234';
    const expected = MoneyDecimal.parse(raw);

    expect(moneyDecimalFromPostgresNumeric(raw).equals(expected)).toBe(true);
    expect(moneyDecimalFromSqliteText(raw).equals(expected)).toBe(true);
    expect(moneyDecimalToPostgresNumeric(expected)).toBe(raw);
    expect(moneyDecimalToSqliteText(expected)).toBe(raw);
  });

  it('refuses a JavaScript number from a numeric column', () => {
    expect(() => moneyDecimalFromPostgresNumeric(1.25)).toThrow(
      'Database value for PostgreSQL numeric is invalid.',
    );
  });

  it('maps UUID without losing its canonical representation', () => {
    const raw = '0198f11a-6d47-7b31-9a2f-2b18e920b1d0';
    const expected = UuidValue.parse(raw);

    expect(uuidFromPostgres(raw).equals(expected)).toBe(true);
    expect(uuidFromSqliteText(raw).equals(expected)).toBe(true);
    expect(uuidToPostgres(expected)).toBe(raw);
    expect(uuidToSqliteText(expected)).toBe(raw);
  });

  it('normalizes PostgreSQL dates and keeps SQLite dates in canonical UTC', () => {
    const raw = '2030-01-02T03:04:05.678Z';
    const expected = UtcDateTime.parse(raw);

    expect(utcDateTimeFromPostgres(new Date(raw)).equals(expected)).toBe(true);
    expect(utcDateTimeFromPostgres('2030-01-02T00:04:05.678-03:00').equals(expected))
      .toBe(true);
    expect(utcDateTimeFromSqliteText(raw).equals(expected)).toBe(true);
    expect(utcDateTimeToPostgres(expected)).toBe(raw);
    expect(utcDateTimeToSqliteText(expected)).toBe(raw);
  });
});
