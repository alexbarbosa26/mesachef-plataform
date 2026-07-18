import { sql } from 'kysely';
import type { Migration } from 'kysely/migration';

export type SpikeMigrationProvider = 'postgres' | 'sqlite';

export function createExperimentalSchemaMigration(
  provider: SpikeMigrationProvider,
): Migration {
  const identifierType = provider === 'postgres' ? 'uuid' : 'text';
  const timestampType = provider === 'postgres' ? 'timestamptz' : 'text';
  const decimalType =
    provider === 'postgres' ? sql`numeric(24, 4)` : 'text';

  return {
    async down(database): Promise<void> {
      await database.schema.dropTable('spike_resources').execute();
      await database.schema.dropTable('spike_memberships').execute();
      await database.schema.dropTable('spike_users').execute();
      await database.schema.dropTable('spike_companies').execute();
    },
    async up(database): Promise<void> {
      await database.schema
        .createTable('spike_companies')
        .addColumn('id', identifierType, (column) => column.primaryKey())
        .addColumn('name', 'varchar(120)', (column) => column.notNull())
        .addColumn('created_at', timestampType, (column) => column.notNull())
        .execute();

      await database.schema
        .createTable('spike_users')
        .addColumn('id', identifierType, (column) => column.primaryKey())
        .addColumn('display_name', 'varchar(120)', (column) => column.notNull())
        .addColumn('created_at', timestampType, (column) => column.notNull())
        .execute();

      await database.schema
        .createTable('spike_memberships')
        .addColumn('id', identifierType, (column) => column.primaryKey())
        .addColumn('company_id', identifierType, (column) =>
          column
            .notNull()
            .references('spike_companies.id')
            .onDelete('cascade'),
        )
        .addColumn('user_id', identifierType, (column) =>
          column.notNull().references('spike_users.id').onDelete('cascade'),
        )
        .addColumn('created_at', timestampType, (column) => column.notNull())
        .addUniqueConstraint('spike_memberships_user_company_unique', [
          'user_id',
          'company_id',
        ])
        .execute();

      await database.schema
        .createTable('spike_resources')
        .addColumn('id', identifierType, (column) => column.primaryKey())
        .addColumn('company_id', identifierType, (column) =>
          column
            .notNull()
            .references('spike_companies.id')
            .onDelete('cascade'),
        )
        .addColumn('resource_code', 'varchar(32)', (column) => column.notNull())
        .addColumn('unit_price', decimalType, (column) => column.notNull())
        .addColumn('created_at', timestampType, (column) => column.notNull())
        .addUniqueConstraint('spike_resources_company_code_unique', [
          'company_id',
          'resource_code',
        ])
        .execute();

      await database.schema
        .createIndex('spike_resources_company_index')
        .on('spike_resources')
        .column('company_id')
        .execute();
    },
  };
}
