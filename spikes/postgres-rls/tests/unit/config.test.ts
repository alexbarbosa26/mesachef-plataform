import { describe, expect, it } from 'vitest';

import {
  assertLocalPostgresConnectionString,
  loadRlsSpikeConfig,
  RlsSpikeConfigurationError,
} from '../../src/config.js';

function databaseUrl(host: string, password = 'ephemeral-test-value'): string {
  const url = new URL(`postgresql://${host}/spike_database`);
  url.username = 'spike_example';
  url.password = password;
  return url.toString();
}

describe('configuração segura do spike RLS', () => {
  it.each(['127.0.0.1', 'localhost', '[::1]'])(
    'aceita apenas o PostgreSQL local em %s',
    (host) => {
      expect(
        loadRlsSpikeConfig({
          SPIKE_RLS_ADMIN_DATABASE_URL: databaseUrl(host),
        }),
      ).toMatchObject({ adminConnectionString: expect.any(String) });
    },
  );

  it('recusa host remoto sem revelar a URL ou a credencial', () => {
    const sensitiveValue = 'must-not-appear-in-errors';
    let receivedError: unknown;

    try {
      assertLocalPostgresConnectionString(
        databaseUrl('database.example.invalid', sensitiveValue),
      );
    } catch (error: unknown) {
      receivedError = error;
    }

    expect(receivedError).toBeInstanceOf(RlsSpikeConfigurationError);
    expect((receivedError as Error).message).not.toContain(sensitiveValue);
    expect((receivedError as Error).message).not.toContain(
      'database.example.invalid',
    );
  });

  it('recusa configuração ausente, malformada ou sem banco explícito', () => {
    expect(() => loadRlsSpikeConfig({})).toThrow(RlsSpikeConfigurationError);
    expect(() =>
      loadRlsSpikeConfig({ SPIKE_RLS_ADMIN_DATABASE_URL: 'not-a-url' }),
    ).toThrow(RlsSpikeConfigurationError);
    expect(() =>
      loadRlsSpikeConfig({
        SPIKE_RLS_ADMIN_DATABASE_URL: 'postgresql://localhost',
      }),
    ).toThrow(RlsSpikeConfigurationError);
  });
});
