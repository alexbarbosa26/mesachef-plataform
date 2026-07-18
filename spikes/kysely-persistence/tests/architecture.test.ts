import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const PERSISTENCE_PACKAGES = /(?:from|import\s*)\s*['"](?:kysely|pg|better-sqlite3)['"]/u;

describe('limites arquiteturais do spike', () => {
  it('mantém o domínio independente de Kysely e dos drivers', async () => {
    const domainDirectory = resolve('src/domain');
    const entries = await readdir(domainDirectory, { withFileTypes: true });
    const domainFiles = entries.filter(
      (entry) => entry.isFile() && entry.name.endsWith('.ts'),
    );

    expect(domainFiles.length).toBeGreaterThan(0);

    for (const domainFile of domainFiles) {
      const source = await readFile(resolve(domainDirectory, domainFile.name),
        'utf8',
      );

      expect(source, domainFile.name).not.toMatch(PERSISTENCE_PACKAGES);
    }
  });

  it('não converte dinheiro por parseFloat ou Number', async () => {
    const source = await readFile(resolve('src/domain/money-decimal.ts'), 'utf8');

    expect(source).not.toContain('parseFloat');
    expect(source).not.toMatch(/\bNumber\s*\(/u);
  });
});
