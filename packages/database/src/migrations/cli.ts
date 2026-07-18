import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { createInfrastructureDatabase } from '../kysely/create-database.js';
import { FileMigrationArtifactProvider } from './file-migration-artifact-provider.js';
import { loadMigrationEnvironment } from './migration-environment.js';
import { MigrationError } from './migration-errors.js';
import { MigrationRunner } from './migration-runner.js';

const action = process.argv[2];
const workspaceEnvironmentPath = resolve(
  import.meta.dirname,
  '../../../../.env',
);
const migrationFolder = resolve(import.meta.dirname, '../../migrations');

async function run(): Promise<void> {
  if (existsSync(workspaceEnvironmentPath)) {
    process.loadEnvFile(workspaceEnvironmentPath);
  }

  if (action !== 'down' && action !== 'status' && action !== 'up') {
    throw new MigrationError(
      'MIGRATION_CONFIGURATION_INVALID',
      'Migration action must be down, status or up.',
    );
  }

  const config = loadMigrationEnvironment(process.env);
  const database = createInfrastructureDatabase(config.database);
  const runner = new MigrationRunner({
    applicationVersion: config.applicationVersion,
    artifactProvider: new FileMigrationArtifactProvider({
      migrationFolder,
      provider: config.database.provider,
    }),
    database,
  });

  try {
    if (action === 'status') {
      const statuses = await runner.status();
      for (const migration of statuses) {
        process.stdout.write(
          `${migration.name} ${migration.status.toUpperCase()}\n`,
        );
      }
      return;
    }

    const executions =
      action === 'up' ? await runner.up() : await runner.down();
    for (const migration of executions) {
      process.stdout.write(
        `${migration.name} ${migration.direction.toUpperCase()} ${migration.status.toUpperCase()}\n`,
      );
    }
  } finally {
    await database.destroy();
  }
}

try {
  await run();
} catch (error: unknown) {
  const errorCode =
    error instanceof MigrationError
      ? error.code
      : 'MIGRATION_EXECUTION_FAILED';
  process.stderr.write(`${errorCode}\n`);
  process.exitCode = 1;
}
