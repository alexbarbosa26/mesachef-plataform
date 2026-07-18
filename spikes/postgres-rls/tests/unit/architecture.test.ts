import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const INFRASTRUCTURE_IMPORT =
  /(?:from|import\s*)\s*['"](?:kysely|pg|\.\.\/database|\.\.\/migrations)/u;

describe('limites arquiteturais do spike RLS', () => {
  it('mantém o domínio sem Kysely, pg, banco ou estado global', async () => {
    const domainDirectory = resolve('src/domain');
    const files = (await readdir(domainDirectory, { withFileTypes: true })).filter(
      (entry) => entry.isFile() && entry.name.endsWith('.ts'),
    );

    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const source = await readFile(resolve(domainDirectory, file.name), 'utf8');
      expect(source, file.name).not.toMatch(INFRASTRUCTURE_IMPORT);
      expect(source, file.name).not.toContain('globalThis');
      expect(source, file.name).not.toContain('process.env');
    }
  });

  it('exige TenantContext e filtros company_id no repository', async () => {
    const port = await readFile(
      resolve('src/domain/resource-repository.ts'),
      'utf8',
    );
    const adapter = await readFile(
      resolve('src/database/kysely-tenant-resource-repository.ts'),
      'utf8',
    );

    expect(port).toContain('context: TenantContext');
    expect(adapter.match(/where\('company_id'/gu)).toHaveLength(4);
    expect(adapter).toContain('company_id: context.companyId');
  });

  it('define o tenant apenas por configuração local transacional', async () => {
    const source = await readFile(
      resolve('src/database/tenant-transaction.ts'),
      'utf8',
    );

    expect(source).toContain("'app.current_company_id'");
    expect(source).toMatch(/set_config\([\s\S]*true/gu);
    expect(source).not.toContain('globalThis');
    expect(source).not.toMatch(/set_config\([\s\S]*false/gu);
  });

  it('restringe todos os nomes físicos experimentais ao prefixo spike_rls_', async () => {
    const migration = await readFile(
      resolve('src/migrations/001-create-rls-schema.ts'),
      'utf8',
    );

    expect(migration).toContain('enable row level security');
    expect(migration).toContain('force row level security');
    expect(migration).not.toMatch(/\b(?:companies|resources|audit_events)\b(?!_)/u);
  });
});
