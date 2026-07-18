import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { parseDocument } from 'yaml';

const composePath = resolve(
  import.meta.dirname,
  '../infra/docker/compose.yaml',
);
const document = parseDocument(await readFile(composePath, 'utf8'));

if (document.errors.length > 0) {
  throw new Error('The Docker Compose file is not valid YAML.');
}

const compose = document.toJS();
const postgres = compose?.services?.postgres;
const failures = [];

if (postgres?.image !== 'postgres:14-alpine') {
  failures.push('PostgreSQL image must be postgres:14-alpine.');
}

if (
  !Array.isArray(postgres?.ports) ||
  !postgres.ports.includes(
    '127.0.0.1:${POSTGRES_PORT:-5432}:5432',
  )
) {
  failures.push('PostgreSQL port must bind only to 127.0.0.1.');
}

for (const variableName of [
  'POSTGRES_DB',
  'POSTGRES_PASSWORD',
  'POSTGRES_USER',
]) {
  const value = postgres?.environment?.[variableName];
  if (typeof value !== 'string' || !value.includes(':?')) {
    failures.push(`${variableName} must be required by Compose.`);
  }
}

if (postgres?.healthcheck === undefined) {
  failures.push('PostgreSQL must define a health check.');
}

if (compose?.volumes?.mesachef_postgres_data === undefined) {
  failures.push('The named PostgreSQL volume is missing.');
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Docker Compose static contract verified.\n');
}
