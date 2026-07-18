import { describe, expect, it } from 'vitest';

import { MoneyDecimal } from '../src/domain/money-decimal.js';

describe('MoneyDecimal', () => {
  it('preserva valores além do limite inteiro seguro do JavaScript', () => {
    const money = MoneyDecimal.parse('9007199254740993.1234');

    expect(money.toDatabaseString()).toBe('9007199254740993.1234');
    expect(MoneyDecimal.fromDatabase(money.toDatabaseString()).equals(money)).toBe(
      true,
    );
  });

  it('normaliza a escala para quatro casas sem usar number', () => {
    expect(MoneyDecimal.parse('42.5').toString()).toBe('42.5000');
    expect(MoneyDecimal.parse('0').toJSON()).toBe('0.0000');
  });

  it.each(['-1.0000', '1.00001', '1e2', '1,25', 'NaN', '']) (
    'recusa representação monetária inválida: %s',
    (value) => {
      expect(() => MoneyDecimal.parse(value)).toThrow(TypeError);
    },
  );
});
