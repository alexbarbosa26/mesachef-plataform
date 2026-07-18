const DECIMAL_PATTERN = /^(0|[1-9]\d{0,19})(?:\.(\d{1,4}))?$/u;
const SCALE = 4;
const SCALE_FACTOR = 10_000n;

export class MoneyDecimal {
  readonly #scaledValue: bigint;

  private constructor(scaledValue: bigint) {
    this.#scaledValue = scaledValue;
  }

  public static fromDatabase(value: string): MoneyDecimal {
    return MoneyDecimal.parse(value);
  }

  public static parse(value: string): MoneyDecimal {
    const match = DECIMAL_PATTERN.exec(value);

    if (match === null) {
      throw new TypeError(
        'MoneyDecimal exige valor não negativo com até 20 inteiros e 4 decimais.',
      );
    }

    const wholePart = BigInt(match[1] ?? '0');
    const fractionalPart = BigInt((match[2] ?? '').padEnd(SCALE, '0'));

    return new MoneyDecimal(wholePart * SCALE_FACTOR + fractionalPart);
  }

  public equals(other: MoneyDecimal): boolean {
    return this.#scaledValue === other.#scaledValue;
  }

  public toDatabaseString(): string {
    const wholePart = this.#scaledValue / SCALE_FACTOR;
    const fractionalPart = (this.#scaledValue % SCALE_FACTOR)
      .toString()
      .padStart(SCALE, '0');

    return `${wholePart.toString()}.${fractionalPart}`;
  }

  public toJSON(): string {
    return this.toDatabaseString();
  }

  public toString(): string {
    return this.toDatabaseString();
  }
}
