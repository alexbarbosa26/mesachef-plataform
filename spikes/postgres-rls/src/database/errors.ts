export class RlsSpikeDatabaseError extends Error {
  public readonly code = 'SPIKE_RLS_DATABASE_OPERATION_FAILED';

  public constructor(message = 'A operação PostgreSQL do spike falhou com segurança.') {
    super(message);
    this.name = 'RlsSpikeDatabaseError';
  }
}

export function toSafeDatabaseError(_error: unknown): RlsSpikeDatabaseError {
  return new RlsSpikeDatabaseError();
}
