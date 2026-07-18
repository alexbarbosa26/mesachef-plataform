import { z } from 'zod';

const rawEnvironmentSchema = z
  .object({
    APP_ENV: z.enum(['development', 'production', 'test']),
    APP_HOST: z.string().trim().min(1),
    APP_PORT: z.coerce.number().int().min(1).max(65_535),
    APP_URL: z.string().url(),
    CORS_ALLOWED_ORIGINS: z.string().trim().min(1),
    DATABASE_CONNECTION_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(100)
      .max(30_000),
    DATABASE_PROVIDER: z.enum(['postgres', 'sqlite']),
    DATABASE_URL: z.string().trim().min(1),
    LOG_LEVEL: z.enum(['debug', 'error', 'fatal', 'info', 'silent', 'trace', 'warn']),
    OPENAPI_ENABLED: z.enum(['false', 'true']),
  })
  .superRefine((environment, context) => {
    const isPostgresUrl = /^(?:postgres|postgresql):\/\//u.test(
      environment.DATABASE_URL,
    );

    if (environment.DATABASE_PROVIDER === 'postgres' && !isPostgresUrl) {
      context.addIssue({
        code: 'custom',
        message: 'must use a PostgreSQL URL',
        path: ['DATABASE_URL'],
      });
    }

    if (environment.DATABASE_PROVIDER === 'sqlite' && isPostgresUrl) {
      context.addIssue({
        code: 'custom',
        message: 'must use a SQLite path or :memory:',
        path: ['DATABASE_URL'],
      });
    }
  });

export type ApplicationConfig = Readonly<{
  app: Readonly<{
    environment: 'development' | 'production' | 'test';
    host: string;
    port: number;
    publicUrl: string;
  }>;
  cors: Readonly<{
    allowedOrigins: ReadonlySet<string>;
  }>;
  database: Readonly<{
    connectionString: string;
    connectionTimeoutMs: number;
    provider: 'postgres' | 'sqlite';
  }>;
  logLevel: 'debug' | 'error' | 'fatal' | 'info' | 'silent' | 'trace' | 'warn';
  openApiEnabled: boolean;
}>;

export class EnvironmentConfigurationError extends Error {
  public readonly invalidFields: readonly string[];

  public constructor(invalidFields: readonly string[]) {
    const uniqueFields = [...new Set(invalidFields)].sort();
    super(`Invalid environment fields: ${uniqueFields.join(', ')}.`);
    this.invalidFields = uniqueFields;
    this.name = 'EnvironmentConfigurationError';
  }
}

function parseAllowedOrigins(value: string): ReadonlySet<string> {
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  const invalidOrigins = origins.filter((origin) => {
    try {
      const url = new URL(origin);
      return url.protocol !== 'http:' && url.protocol !== 'https:';
    } catch {
      return true;
    }
  });

  if (origins.length === 0 || invalidOrigins.length > 0) {
    throw new EnvironmentConfigurationError(['CORS_ALLOWED_ORIGINS']);
  }

  return new Set(origins);
}

export function loadApplicationConfig(
  source: NodeJS.ProcessEnv,
): ApplicationConfig {
  const parsed = rawEnvironmentSchema.safeParse(source);

  if (!parsed.success) {
    const invalidFields = parsed.error.issues.map(
      (issue) => String(issue.path[0] ?? 'environment'),
    );
    throw new EnvironmentConfigurationError(invalidFields);
  }

  return Object.freeze({
    app: Object.freeze({
      environment: parsed.data.APP_ENV,
      host: parsed.data.APP_HOST,
      port: parsed.data.APP_PORT,
      publicUrl: parsed.data.APP_URL,
    }),
    cors: Object.freeze({
      allowedOrigins: parseAllowedOrigins(parsed.data.CORS_ALLOWED_ORIGINS),
    }),
    database: Object.freeze({
      connectionString: parsed.data.DATABASE_URL,
      connectionTimeoutMs: parsed.data.DATABASE_CONNECTION_TIMEOUT_MS,
      provider: parsed.data.DATABASE_PROVIDER,
    }),
    logLevel: parsed.data.LOG_LEVEL,
    openApiEnabled: parsed.data.OPENAPI_ENABLED === 'true',
  });
}
