import { DomainRuleError } from '../errors/domain-rule-error.js';

const UTC_ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;

function invalidUtcDateTime(): DomainRuleError {
  return new DomainRuleError({
    code: 'INVALID_UTC_DATE_TIME',
    message: 'UTC date-time must be a valid ISO 8601 instant ending in Z.',
  });
}

export class UtcDateTime {
  readonly #isoString: string;

  private constructor(isoString: string) {
    this.#isoString = isoString;
    Object.freeze(this);
  }

  public static fromDate(value: Date): UtcDateTime {
    if (!Number.isFinite(value.getTime())) {
      throw invalidUtcDateTime();
    }

    return new UtcDateTime(value.toISOString());
  }

  public static parse(value: string): UtcDateTime {
    if (!UTC_ISO_PATTERN.test(value)) {
      throw invalidUtcDateTime();
    }

    const parsedDate = new Date(value);

    if (!Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString() !== value) {
      throw invalidUtcDateTime();
    }

    return new UtcDateTime(value);
  }

  public equals(other: UtcDateTime): boolean {
    return this.#isoString === other.#isoString;
  }

  public toDate(): Date {
    return new Date(this.#isoString);
  }

  public toJSON(): string {
    return this.#isoString;
  }

  public toString(): string {
    return this.#isoString;
  }
}
