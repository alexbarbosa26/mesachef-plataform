import { describe, expect, it } from 'vitest';

import {
  loadSpikeConfig,
  SpikeConfigurationError,
} from '../src/config.js';

describe('configuração segura do spike', () => {
  it('aceita PostgreSQL somente em host local', () => {
    const config = loadSpikeConfig({
      SPIKE_DATABASE_PROVIDER: 'postgres',
      SPIKE_DATABASE_URL:
        'postgresql://spike_user:local_secret@127.0.0.1:5432/spike_database',
    });

    expect(config.provider).toBe('postgres');
    expect(
      loadSpikeConfig({
        SPIKE_DATABASE_PROVIDER: 'postgres',
        SPIKE_DATABASE_URL: 'postgresql://spike:local@[::1]:5432/spike',
      }).provider,
    ).toBe('postgres');
  });

  it('recusa PostgreSQL remoto sem revelar a URL', () => {
    const secret = 'never-log-this-secret';

    let receivedError: unknown;
    try {
      loadSpikeConfig({
        SPIKE_DATABASE_PROVIDER: 'postgres',
        SPIKE_DATABASE_URL: `postgresql://spike:${secret}@database.example.com:5432/spike`,
      });
    } catch (error: unknown) {
      receivedError = error;
    }

    expect(receivedError).toBeInstanceOf(SpikeConfigurationError);
    expect(receivedError).toMatchObject({ code: 'SPIKE_INVALID_CONFIGURATION' });
    expect((receivedError as Error).message).not.toContain(secret);
  });

  it('recusa provider desconhecido e URL PostgreSQL ausente', () => {
    expect(() =>
      loadSpikeConfig({ SPIKE_DATABASE_PROVIDER: 'mysql' }),
    ).toThrow(SpikeConfigurationError);
    expect(() =>
      loadSpikeConfig({ SPIKE_DATABASE_PROVIDER: 'postgres' }),
    ).toThrow(SpikeConfigurationError);
  });

  it('limita SQLite ao banco efêmero em memória', () => {
    expect(
      loadSpikeConfig({
        SPIKE_DATABASE_PROVIDER: 'sqlite',
        SPIKE_DATABASE_URL: ':memory:',
      }),
    ).toEqual({ databasePath: ':memory:', provider: 'sqlite' });

    expect(() =>
      loadSpikeConfig({
        SPIKE_DATABASE_PROVIDER: 'sqlite',
        SPIKE_DATABASE_URL: './persistent.sqlite',
      }),
    ).toThrow(SpikeConfigurationError);
  });
});
