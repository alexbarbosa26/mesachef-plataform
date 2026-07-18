export type MigrationErrorCode =
  | 'MIGRATION_CONFIGURATION_INVALID'
  | 'MIGRATION_EXECUTION_FAILED'
  | 'MIGRATION_INTEGRITY_FAILED'
  | 'MIGRATION_SOURCE_INVALID';

export class MigrationError extends Error {
  public readonly code: MigrationErrorCode;

  public constructor(
    code: MigrationErrorCode,
    message: string,
    cause?: unknown,
  ) {
    super(message, cause === undefined ? undefined : { cause });
    this.code = code;
    this.name = 'MigrationError';
  }
}
