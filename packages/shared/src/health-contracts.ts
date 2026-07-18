export type DatabaseProvider = 'postgres' | 'sqlite';

export type LiveHealthResponse = Readonly<{
  service: 'mesachef-api';
  status: 'ok';
  timestamp: string;
  version: string;
}>;

export type ReadyHealthResponse = Readonly<{
  checks: Readonly<{
    database: Readonly<{
      provider: DatabaseProvider;
      status: 'down' | 'up';
    }>;
  }>;
  status: 'not_ready' | 'ok';
  timestamp: string;
}>;

export type ApiErrorResponse = Readonly<{
  error: Readonly<{
    code: string;
    correlationId: string;
    message: string;
  }>;
}>;
