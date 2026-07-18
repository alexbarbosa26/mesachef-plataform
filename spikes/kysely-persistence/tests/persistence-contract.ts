import type { Kysely } from 'kysely';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import { KyselyResourceRepository } from '../src/database/kysely-resource-repository.js';
import type { SpikeDatabase } from '../src/database/schema.js';
import {
  createCompanyId,
  createMembershipId,
  createResourceId,
  createUserId,
} from '../src/domain/identifiers.js';
import { MoneyDecimal } from '../src/domain/money-decimal.js';
import { resourceCodeFromString } from '../src/domain/resource.js';
import {
  migrateOneStepDown,
  migrateToLatest,
} from '../src/migrations/migrator.js';
import type { SpikeMigrationProvider } from '../src/migrations/001-create-experimental-schema.js';

const EXPERIMENTAL_TABLES = [
  'spike_companies',
  'spike_memberships',
  'spike_resources',
  'spike_users',
] as const;

const FIXED_TIMESTAMP = '2030-01-02T03:04:05.678Z';

interface PersistenceContractOptions {
  readonly createDatabase: () => Kysely<SpikeDatabase>;
  readonly provider: SpikeMigrationProvider;
  readonly verifyDialectSchema: (
    database: Kysely<SpikeDatabase>,
  ) => Promise<void>;
}

async function experimentalTableNames(
  database: Kysely<SpikeDatabase>,
): Promise<readonly string[]> {
  const metadata = await database.introspection.getTables();
  const allowedNames = new Set<string>(EXPERIMENTAL_TABLES);

  return metadata
    .map((table) => table.name)
    .filter((tableName) => allowedNames.has(tableName))
    .sort();
}

async function seedCompany(
  database: Kysely<SpikeDatabase>,
  companyId = createCompanyId(),
): Promise<ReturnType<typeof createCompanyId>> {
  await database
    .insertInto('spike_companies')
    .values({
      created_at: FIXED_TIMESTAMP,
      id: companyId,
      name: `Company ${companyId.slice(0, 8)}`,
    })
    .executeTakeFirstOrThrow();

  return companyId;
}

export function definePersistenceContract(
  label: string,
  options: PersistenceContractOptions,
): void {
  describe(`contrato de persistência — ${label}`, () => {
    let database: Kysely<SpikeDatabase>;

    beforeEach(async () => {
      database = options.createDatabase();
      expect(await experimentalTableNames(database)).toEqual([]);
    });

    afterEach(async () => {
      try {
        await migrateOneStepDown(database, options.provider);
      } finally {
        await database.destroy();
      }
    });

    afterAll(async () => {
      const verificationDatabase = options.createDatabase();

      try {
        expect(await experimentalTableNames(verificationDatabase)).toEqual([]);
      } finally {
        await verificationDatabase.destroy();
      }
    });

    it('aplica up em banco vazio, reverte down e reaplica', async () => {
      await migrateToLatest(database, options.provider);
      expect(await experimentalTableNames(database)).toEqual(
        [...EXPERIMENTAL_TABLES].sort(),
      );

      const migrationMetadata = (
        await database.introspection.getTables()
      ).find((table) => table.name === 'spike_kysely_migration');
      expect(
        migrationMetadata?.columns.map((column) => column.name).sort(),
      ).toEqual(['name', 'timestamp']);

      await migrateOneStepDown(database, options.provider);
      expect(await experimentalTableNames(database)).toEqual([]);

      await migrateToLatest(database, options.provider);
      expect(await experimentalTableNames(database)).toEqual(
        [...EXPERIMENTAL_TABLES].sort(),
      );
    });

    it('materializa UUID, timestamp e tipos específicos do dialeto', async () => {
      await migrateToLatest(database, options.provider);
      await options.verifyDialectSchema(database);
    });

    it('garante foreign keys e membership muitos-para-muitos', async () => {
      await migrateToLatest(database, options.provider);
      const companyA = await seedCompany(database);
      const companyB = await seedCompany(database);
      const userId = createUserId();

      await database
        .insertInto('spike_users')
        .values({
          created_at: FIXED_TIMESTAMP,
          display_name: 'Spike User',
          id: userId,
        })
        .executeTakeFirstOrThrow();

      for (const companyId of [companyA, companyB]) {
        await database
          .insertInto('spike_memberships')
          .values({
            company_id: companyId,
            created_at: FIXED_TIMESTAMP,
            id: createMembershipId(),
            user_id: userId,
          })
          .executeTakeFirstOrThrow();
      }

      await expect(
        database
          .insertInto('spike_memberships')
          .values({
            company_id: companyA,
            created_at: FIXED_TIMESTAMP,
            id: createMembershipId(),
            user_id: userId,
          })
          .executeTakeFirstOrThrow(),
      ).rejects.toThrow();

      await expect(
        database
          .insertInto('spike_memberships')
          .values({
            company_id: createCompanyId(),
            created_at: FIXED_TIMESTAMP,
            id: createMembershipId(),
            user_id: userId,
          })
          .executeTakeFirstOrThrow(),
      ).rejects.toThrow();

      const memberships = await database
        .selectFrom('spike_memberships')
        .selectAll()
        .where('user_id', '=', userId)
        .execute();
      expect(memberships).toHaveLength(2);
    });

    it('confirma commit e rollback atômicos', async () => {
      await migrateToLatest(database, options.provider);
      const committedCompany = createCompanyId();
      const rolledBackCompany = createCompanyId();

      await database.transaction().execute(async (transaction) => {
        await transaction
          .insertInto('spike_companies')
          .values({
            created_at: FIXED_TIMESTAMP,
            id: committedCompany,
            name: 'Committed Company',
          })
          .executeTakeFirstOrThrow();
      });

      await expect(
        database.transaction().execute(async (transaction) => {
          await transaction
            .insertInto('spike_companies')
            .values({
              created_at: FIXED_TIMESTAMP,
              id: rolledBackCompany,
              name: 'Rolled Back Company',
            })
            .executeTakeFirstOrThrow();

          throw new Error('EXPECTED_ROLLBACK');
        }),
      ).rejects.toThrow('EXPECTED_ROLLBACK');

      expect(
        await database
          .selectFrom('spike_companies')
          .select('id')
          .where('id', '=', committedCompany)
          .executeTakeFirst(),
      ).toBeDefined();
      expect(
        await database
          .selectFrom('spike_companies')
          .select('id')
          .where('id', '=', rolledBackCompany)
          .executeTakeFirst(),
      ).toBeUndefined();
    });

    it('preserva decimal exato, timestamp e isolamento por empresa', async () => {
      await migrateToLatest(database, options.provider);
      const companyA = await seedCompany(database);
      const companyB = await seedCompany(database);
      const repository = new KyselyResourceRepository(
        database,
        () => FIXED_TIMESTAMP,
      );
      const resourceAId = createResourceId();
      const resourceBId = createResourceId();
      const exactMoney = MoneyDecimal.parse('9007199254740993.1234');

      const resourceA = await repository.create(
        { companyId: companyA },
        {
          code: resourceCodeFromString('SHARED_CODE'),
          id: resourceAId,
          unitPrice: exactMoney,
        },
      );
      await repository.create(
        { companyId: companyB },
        {
          code: resourceCodeFromString('SHARED_CODE'),
          id: resourceBId,
          unitPrice: MoneyDecimal.parse('1.2500'),
        },
      );

      expect(resourceA.createdAt).toBe(FIXED_TIMESTAMP);
      expect(resourceA.unitPrice.toDatabaseString()).toBe(
        '9007199254740993.1234',
      );
      expect(await repository.list({ companyId: companyA })).toHaveLength(1);
      expect(await repository.list({ companyId: companyB })).toHaveLength(1);
      expect(
        await repository.findById({ companyId: companyA }, resourceBId),
      ).toBeNull();

      await expect(
        repository.create(
          { companyId: companyA },
          {
            code: resourceCodeFromString('SHARED_CODE'),
            id: createResourceId(),
            unitPrice: MoneyDecimal.parse('2.0000'),
          },
        ),
      ).rejects.toThrow();
    });
  });
}
