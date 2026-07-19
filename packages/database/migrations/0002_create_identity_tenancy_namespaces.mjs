import { sql } from 'kysely';

export function createMigration(provider) {
  if (provider !== 'postgres' && provider !== 'sqlite') {
    throw new TypeError('Unsupported migration provider.');
  }

  return {
    async down(database) {
      if (provider === 'sqlite') {
        return;
      }

      await sql`drop schema tenancy restrict`.execute(database);
      await sql`drop schema identity restrict`.execute(database);
    },
    async up(database) {
      if (provider === 'sqlite') {
        return;
      }

      await sql`create schema identity`.execute(database);
      await sql`create schema tenancy`.execute(database);
    },
  };
}
