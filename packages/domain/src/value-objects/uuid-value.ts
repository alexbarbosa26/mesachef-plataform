import { DomainRuleError } from '../errors/domain-rule-error.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

function invalidUuid(): DomainRuleError {
  return new DomainRuleError({
    code: 'INVALID_UUID',
    message: 'UUID must use the canonical 8-4-4-4-12 representation.',
  });
}

export class UuidValue {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
    Object.freeze(this);
  }

  public static parse(value: string): UuidValue {
    if (!UUID_PATTERN.test(value)) {
      throw invalidUuid();
    }

    return new UuidValue(value.toLowerCase());
  }

  public equals(other: UuidValue): boolean {
    return this.#value === other.#value;
  }

  public toJSON(): string {
    return this.#value;
  }

  public toString(): string {
    return this.#value;
  }
}
