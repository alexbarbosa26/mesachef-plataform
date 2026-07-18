export class DatabaseValueError extends Error {
  public readonly code = 'DATABASE_VALUE_INVALID';

  public constructor(concept: string) {
    super(`Database value for ${concept} is invalid.`);
    this.name = 'DatabaseValueError';
  }
}
