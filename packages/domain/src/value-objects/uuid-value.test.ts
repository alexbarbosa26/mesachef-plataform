import { describe, expect, it } from 'vitest';

import { UuidValue } from './uuid-value.js';

describe('UuidValue', () => {
  it('normalizes a canonical UUID to lowercase', () => {
    const value = UuidValue.parse('0198F11A-6D47-7B31-9A2F-2B18E920B1D0');

    expect(value.toString()).toBe('0198f11a-6d47-7b31-9a2f-2b18e920b1d0');
  });

  it.each([
    '',
    'not-a-uuid',
    '0198f11a6d477b319a2f2b18e920b1d0',
    '0198f11a-6d47-7b31-9a2f-2b18e920b1d',
  ])('rejects an invalid UUID representation: %s', (value) => {
    expect(() => UuidValue.parse(value)).toThrow(
      'UUID must use the canonical 8-4-4-4-12 representation.',
    );
  });
});
