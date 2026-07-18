import type { ColumnType } from 'kysely';

type MigrationAppliedAtColumn = ColumnType<Date | string, string, never>;

export interface MigrationChecksumTable {
  application_version: string;
  applied_at: MigrationAppliedAtColumn;
  canonicalization_version: string;
  checksum_sha256: string;
  migration_name: string;
  migration_tool_version: string;
}

export interface KyselyMigrationTable {
  name: string;
  timestamp: string;
}

export interface KyselyMigrationLockTable {
  id: string;
  is_locked: number;
}

export interface MigrationInfrastructureDatabase {
  mesachef_kysely_migration: KyselyMigrationTable;
  mesachef_kysely_migration_lock: KyselyMigrationLockTable;
  mesachef_migration_checksum: MigrationChecksumTable;
}
