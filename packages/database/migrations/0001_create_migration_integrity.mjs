import { sql } from 'kysely';

const CHECKSUM_TABLE = 'mesachef_migration_checksum';

export function createMigration(provider) {
  if (provider !== 'postgres' && provider !== 'sqlite') {
    throw new TypeError('Unsupported migration provider.');
  }

  const appliedAtType = provider === 'postgres' ? 'timestamptz' : 'text';

  return {
    async down(database) {
      await database.schema.dropTable(CHECKSUM_TABLE).execute();
    },
    async up(database) {
      await database.schema
        .createTable(CHECKSUM_TABLE)
        .addColumn('migration_name', 'varchar(255)', (column) =>
          column.notNull().primaryKey(),
        )
        .addColumn('checksum_sha256', 'varchar(64)', (column) =>
          column.notNull(),
        )
        .addColumn('canonicalization_version', 'varchar(16)', (column) =>
          column.notNull(),
        )
        .addColumn('applied_at', appliedAtType, (column) => column.notNull())
        .addColumn('application_version', 'varchar(64)', (column) =>
          column.notNull(),
        )
        .addColumn('migration_tool_version', 'varchar(96)', (column) =>
          column.notNull(),
        )
        .addCheckConstraint(
          'mesachef_migration_checksum_sha256_length',
          sql`length(checksum_sha256) = 64`,
        )
        .execute();
    },
  };
}
