const LOCAL_POSTGRES_HOSTS = new Set(['127.0.0.1', '::1', 'localhost']);

export type RlsSpikeConfig = Readonly<{
  adminConnectionString: string;
}>;

export class RlsSpikeConfigurationError extends Error {
  public readonly code = 'SPIKE_RLS_INVALID_CONFIGURATION';

  public constructor(message: string) {
    super(message);
    this.name = 'RlsSpikeConfigurationError';
  }
}

export function loadRlsSpikeConfig(
  environment: Readonly<Record<string, string | undefined>>,
): RlsSpikeConfig {
  const adminConnectionString = environment['SPIKE_RLS_ADMIN_DATABASE_URL'];

  if (
    adminConnectionString === undefined ||
    adminConnectionString.trim() === ''
  ) {
    throw new RlsSpikeConfigurationError(
      'A URL administrativa do PostgreSQL 14 local é obrigatória.',
    );
  }

  assertLocalPostgresConnectionString(adminConnectionString);

  return { adminConnectionString };
}

export function assertLocalPostgresConnectionString(
  connectionString: string,
): void {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(connectionString);
  } catch {
    throw new RlsSpikeConfigurationError(
      'A URL do PostgreSQL local possui formato inválido.',
    );
  }

  const hostname = parsedUrl.hostname.replace(/^\[|\]$/gu, '');

  if (
    !['postgres:', 'postgresql:'].includes(parsedUrl.protocol) ||
    !LOCAL_POSTGRES_HOSTS.has(hostname) ||
    parsedUrl.pathname === '' ||
    parsedUrl.pathname === '/'
  ) {
    throw new RlsSpikeConfigurationError(
      'O spike aceita somente um banco PostgreSQL local explícito.',
    );
  }
}

export function connectionStringForRole(
  adminConnectionString: string,
  roleName: string,
  password: string,
): string {
  const parsedUrl = new URL(adminConnectionString);
  parsedUrl.username = roleName;
  parsedUrl.password = password;
  return parsedUrl.toString();
}
