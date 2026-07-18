import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { createDatabaseHealthProbe } from '@mesachef/database';

import { buildApi } from './app.js';
import { loadApplicationConfig } from './config/environment.js';

const workspaceEnvironmentPath = resolve(
  import.meta.dirname,
  '../../../.env',
);

if (existsSync(workspaceEnvironmentPath)) {
  process.loadEnvFile(workspaceEnvironmentPath);
}

async function start(): Promise<void> {
  const config = loadApplicationConfig(process.env);
  const databaseProbe = createDatabaseHealthProbe(config.database);
  const app = await buildApi({ config, databaseProbe });
  let isClosing = false;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (isClosing) {
      return;
    }

    isClosing = true;
    app.log.info({ signal }, 'Graceful shutdown started');
    await app.close();
    app.log.info('Graceful shutdown completed');
  };

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  await app.listen({ host: config.app.host, port: config.app.port });
  app.log.info(
    {
      environment: config.app.environment,
      host: config.app.host,
      port: config.app.port,
    },
    'MesaChef API started',
  );
}

try {
  await start();
} catch (error: unknown) {
  const errorName = error instanceof Error ? error.name : 'UnknownError';
  process.stderr.write(
    `${JSON.stringify({ errorName, level: 'fatal', message: 'API failed to start' })}\n`,
  );
  process.exitCode = 1;
}
