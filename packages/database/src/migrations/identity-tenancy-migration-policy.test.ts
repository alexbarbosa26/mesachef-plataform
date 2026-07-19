import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { FileMigrationArtifactProvider } from './file-migration-artifact-provider.js';

const MIGRATION_FOLDER = resolve('packages/database/migrations');
const MIGRATION_NAMES = [
  '0001_create_migration_integrity',
  '0002_create_identity_tenancy_namespaces',
  '0003_create_identity_users',
  '0004_create_identity_password_credentials',
  '0005_create_tenancy_companies',
  '0006_create_tenancy_memberships',
] as const;
const ORIGINAL_MIGRATION_CHECKSUM =
  '2a3f6a7760fe271fc04fb7d53f75ea570d18d97219815e9bdc83bba4a6579a80';

describe('identity and tenancy migration policy', () => {
  it('preserves migration 0001 and exposes only the monotonic 002-A2 sequence', async () => {
    const artifacts = await new FileMigrationArtifactProvider({
      migrationFolder: MIGRATION_FOLDER,
      provider: 'postgres',
    }).loadArtifactDescriptors();

    expect(artifacts.map(({ name }) => name)).toEqual(MIGRATION_NAMES);
    expect(artifacts[0]?.checksumSha256).toBe(ORIGINAL_MIGRATION_CHECKSUM);
  });

  it('contains no destructive shortcuts, runtime roles, RLS or seed data', async () => {
    const sources = await Promise.all(
      MIGRATION_NAMES.slice(1).map(async (migrationName) =>
        readFile(join(MIGRATION_FOLDER, `${migrationName}.mjs`), 'utf8'),
      ),
    );
    const combinedSource = sources.join('\n').toLowerCase();

    expect(combinedSource).not.toMatch(/\bif\s+(?:not\s+)?exists\b/u);
    expect(combinedSource).not.toMatch(/\bcascade\b/u);
    expect(combinedSource).not.toMatch(/\b(?:grant|revoke)\b/u);
    expect(combinedSource).not.toMatch(/\bcreate\s+role\b/u);
    expect(combinedSource).not.toMatch(/\brow\s+level\s+security\b/u);
    expect(combinedSource).not.toMatch(/\bcreate\s+policy\b/u);
    expect(combinedSource).not.toMatch(/\binsert\s+into\b/u);
    expect(combinedSource).not.toMatch(/\bdefault\s+['"]?active\b/u);
    expect(sources.every((source) => source.includes('async down(database)'))).toBe(
      true,
    );
    expect(sources[0]).toContain('drop schema tenancy restrict');
    expect(sources[0]).toContain('drop schema identity restrict');
  });
});
