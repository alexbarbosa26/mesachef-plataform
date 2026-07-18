import { DomainRuleError } from '../errors/domain-rule-error.js';

const MONEY_DECIMAL_PATTERN = /^(-?)(0|[1-9]\d{0,19})(?:\.(\d{1,4}))?$/u;
const SCALE = 4;
const SCALE_FACTOR = 10_000n;
const MAX_SCALED_VALUE = 10n ** 24n - 1n;

function invalidMoneyDecimal(): DomainRuleError {
  return new DomainRuleError({
    code: 'INVALID_MONEY_DECIMAL',
    message: 'MoneyDecimal must be an exact decimal with scale 4.',
  });
}

export class MoneyDecimal {
  public static readonly scale = SCALE;

  readonly #scaledValue: bigint;

  private constructor(scaledValue: bigint) {
    if (
      scaledValue < -MAX_SCALED_VALUE ||
      scaledValue > MAX_SCALED_VALUE
    ) {
      throw invalidMoneyDecimal();
    }

    this.#scaledValue = scaledValue;
    Object.freeze(this);
  }

  public static fromScaledBigInt(scaledValue: bigint): MoneyDecimal {
    return new MoneyDecimal(scaledValue);
  }

  public static parse(value: string): MoneyDecimal {
    const match = MONEY_DECIMAL_PATTERN.exec(value);

    if (match === null) {
      throw invalidMoneyDecimal();
    }

    const sign = match[1] === '-' ? -1n : 1n;
    const wholePart = BigInt(match[2] ?? '0');
    const fractionalPart = BigInt((match[3] ?? '').padEnd(SCALE, '0'));

    return new MoneyDecimal(
      sign * (wholePart * SCALE_FACTOR + fractionalPart),
    );
  }

  public equals(other: MoneyDecimal): boolean {
    return this.#scaledValue === other.#scaledValue;
  }

  public toJSON(): string {
    return this.toString();
  }

  public toScaledBigInt(): bigint {
    return this.#scaledValue;
  }

  public toString(): string {
    const absoluteValue =
      this.#scaledValue < 0n ? -this.#scaledValue : this.#scaledValue;
    const wholePart = absoluteValue / SCALE_FACTOR;
    const fractionalPart = (absoluteValue % SCALE_FACTOR)
      .toString()
      .padStart(SCALE, '0');
    const sign = this.#scaledValue < 0n ? '-' : '';

    return `${sign}${wholePart.toString()}.${fractionalPart}`;
  }
}
