const LOCAL_POSTGRES_HOSTS = new Set(['127.0.0.1', '::1', 'localhost']);

export type SpikeConfig =
  | Readonly<{
      connectionString: string;
      provider: 'postgres';
    }>
  | Readonly<{
      databasePath: ':memory:';
      provider: 'sqlite';
    }>;

export class SpikeConfigurationError extends Error {
  public readonly code = 'SPIKE_INVALID_CONFIGURATION';

  public constructor(message: string) {
    super(message);
    this.name = 'SpikeConfigurationError';
  }
}

export function loadSpikeConfig(
  environment: Readonly<Record<string, string | undefined>>,
): SpikeConfig {
  const provider = environment['SPIKE_DATABASE_PROVIDER'];

  if (provider === 'sqlite') {
    const databasePath = environment['SPIKE_DATABASE_URL'];

    if (databasePath !== ':memory:') {
      throw new SpikeConfigurationError(
        'SQLite do spike aceita somente o banco local em memória.',
      );
    }

    return { databasePath, provider };
  }

  if (provider === 'postgres') {
    const connectionString = environment['SPIKE_DATABASE_URL'];

    if (connectionString === undefined || connectionString.trim() === '') {
      throw new SpikeConfigurationError(
        'A URL do PostgreSQL local é obrigatória para o spike.',
      );
    }

    assertLocalPostgresConnectionString(connectionString);

    return { connectionString, provider };
  }

  throw new SpikeConfigurationError(
    'O provider do spike deve ser postgres ou sqlite.',
  );
}

export function assertLocalPostgresConnectionString(
  connectionString: string,
): void {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(connectionString);
  } catch {
    throw new SpikeConfigurationError(
      'A URL do PostgreSQL local possui formato inválido.',
    );
  }

  const hostname = parsedUrl.hostname.replace(/^\[|\]$/gu, '');

  if (
    !['postgres:', 'postgresql:'].includes(parsedUrl.protocol) ||
    !LOCAL_POSTGRES_HOSTS.has(hostname)
  ) {
    throw new SpikeConfigurationError(
      'O spike recusa conexões PostgreSQL que não sejam locais.',
    );
  }
}
