export type DomainRuleErrorOptions = Readonly<{
  cause?: unknown;
  code: string;
  message: string;
}>;

export class DomainRuleError extends Error {
  public readonly code: string;

  public constructor({ cause, code, message }: DomainRuleErrorOptions) {
    const normalizedCode = code.trim();
    const normalizedMessage = message.trim();

    if (normalizedCode.length === 0) {
      throw new TypeError('Domain error code must not be empty.');
    }

    if (normalizedMessage.length === 0) {
      throw new TypeError('Domain error message must not be empty.');
    }

    super(
      normalizedMessage,
      cause === undefined ? undefined : { cause },
    );
    this.code = normalizedCode;
    this.name = 'DomainRuleError';
  }
}
