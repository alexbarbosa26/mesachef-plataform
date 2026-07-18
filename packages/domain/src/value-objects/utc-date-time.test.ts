import { describe, expect, it } from 'vitest';

import { UtcDateTime } from './utc-date-time.js';

describe('UtcDateTime', () => {
  it('preserves a canonical UTC instant', () => {
    const value = UtcDateTime.parse('2030-01-02T03:04:05.678Z');

    expect(value.toString()).toBe('2030-01-02T03:04:05.678Z');
    expect(UtcDateTime.fromDate(value.toDate()).equals(value)).toBe(true);
  });

  it.each([
    '',
    '2030-01-02',
    '2030-01-02T03:04:05Z',
    '2030-01-02T03:04:05.678+00:00',
    '2030-02-30T03:04:05.678Z',
  ])('rejects a non-canonical UTC instant: %s', (value) => {
    expect(() => UtcDateTime.parse(value)).toThrow(
      'UTC date-time must be a valid ISO 8601 instant ending in Z.',
    );
  });
});
