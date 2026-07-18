import { MoneyDecimal } from '@mesachef/domain';

import { DatabaseValueError } from './database-value-error.js';

function moneyDecimalFromText(value: unknown, concept: string): MoneyDecimal {
  if (typeof value !== 'string') {
    throw new DatabaseValueError(concept);
  }

  return MoneyDecimal.parse(value);
}

export function moneyDecimalFromPostgresNumeric(value: unknown): MoneyDecimal {
  return moneyDecimalFromText(value, 'PostgreSQL numeric');
}

export function moneyDecimalToPostgresNumeric(value: MoneyDecimal): string {
  return value.toString();
}

export function moneyDecimalFromSqliteText(value: unknown): MoneyDecimal {
  return moneyDecimalFromText(value, 'SQLite decimal text');
}

export function moneyDecimalToSqliteText(value: MoneyDecimal): string {
  return value.toString();
}
