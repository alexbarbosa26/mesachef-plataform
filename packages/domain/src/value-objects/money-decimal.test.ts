import { describe, expect, it } from 'vitest';

import { MoneyDecimal } from './money-decimal.js';

describe('MoneyDecimal', () => {
  it('preserves numeric(24,4) values beyond JavaScript safe integers', () => {
    const value = MoneyDecimal.parse('9007199254740993.1234');

    expect(value.toString()).toBe('9007199254740993.1234');
    expect(value.toScaledBigInt()).toBe(90_071_992_547_409_931_234n);
    expect(MoneyDecimal.fromScaledBigInt(value.toScaledBigInt()).equals(value))
      .toBe(true);
  });

  it('normalizes positive, negative and zero values to scale 4', () => {
    expect(MoneyDecimal.parse('42.5').toString()).toBe('42.5000');
    expect(MoneyDecimal.parse('-42.5').toString()).toBe('-42.5000');
    expect(MoneyDecimal.parse('-0').toString()).toBe('0.0000');
  });

  it.each([
    '',
    '01.0000',
    '1.00001',
    '1e2',
    '1,25',
    'NaN',
    '100000000000000000000.0000',
  ])('rejects a value outside the numeric(24,4) contract: %s', (value) => {
    expect(() => MoneyDecimal.parse(value)).toThrow(
      'MoneyDecimal must be an exact decimal with scale 4.',
    );
  });
});
