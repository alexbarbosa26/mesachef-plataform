import { loadSpikeConfig, SpikeConfigurationError } from './config.js';
import { createDatabase } from './database/create-database.js';
import {
  migrateOneStepDown,
  migrateToLatest,
  SpikeMigrationError,
} from './migrations/migrator.js';

const action = process.argv[2];

async function run(): Promise<void> {
  if (action !== 'up' && action !== 'down') {
    throw new SpikeConfigurationError('A ação deve ser up ou down.');
  }

  const config = loadSpikeConfig(process.env);
  const database = createDatabase(config);

  try {
    if (action === 'up') {
      await migrateToLatest(database, config.provider);
    } else {
      await migrateOneStepDown(database, config.provider);
    }

    console.log(`SPIKE_MIGRATION_${action.toUpperCase()}_OK`);
  } finally {
    await database.destroy();
  }
}

try {
  await run();
} catch (error: unknown) {
  if (
    error instanceof SpikeConfigurationError ||
    error instanceof SpikeMigrationError
  ) {
    console.error(error.code);
  } else {
    console.error('SPIKE_EXECUTION_FAILED');
  }

  process.exitCode = 1;
}

