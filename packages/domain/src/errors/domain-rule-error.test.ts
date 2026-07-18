import { describe, expect, it } from 'vitest';

import { DomainRuleError } from './domain-rule-error.js';

describe('DomainRuleError', () => {
  it('preserves a searchable code and a safe message', () => {
    const error = new DomainRuleError({
      code: 'FOUNDATION_RULE_VIOLATION',
      message: 'A foundation rule was violated.',
    });

    expect(error).toMatchObject({
      code: 'FOUNDATION_RULE_VIOLATION',
      message: 'A foundation rule was violated.',
      name: 'DomainRuleError',
    });
  });

  it('rejects an empty error code', () => {
    expect(
      () =>
        new DomainRuleError({
          code: '  ',
          message: 'A valid message.',
        }),
    ).toThrow('Domain error code must not be empty.');
  });
});
