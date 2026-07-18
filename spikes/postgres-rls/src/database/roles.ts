import { randomBytes } from 'node:crypto';

import { sql, type Kysely } from 'kysely';

import type { SpikeRlsDatabase } from './schema.js';

export const EXPERIMENTAL_ROLE_NAMES = Object.freeze({
  application: 'spike_rls_app',
  owner: 'spike_rls_owner',
  platform: 'spike_rls_platform',
});

export type ExperimentalRoleCredentials = Readonly<{
  applicationPassword: string;
  platformPassword: string;
}>;

function createEphemeralPassword(): string {
  return randomBytes(32).toString('hex');
}

export async function provisionExperimentalRoles(
  database: Kysely<SpikeRlsDatabase>,
): Promise<ExperimentalRoleCredentials> {
  const applicationPassword = createEphemeralPassword();
  const platformPassword = createEphemeralPassword();

  await sql.raw(`
    create role ${EXPERIMENTAL_ROLE_NAMES.owner}
      nologin nosuperuser nocreatedb nocreaterole noinherit noreplication nobypassrls
  `).execute(database);
  await sql.raw(`
    create role ${EXPERIMENTAL_ROLE_NAMES.application}
      login password '${applicationPassword}'
      nosuperuser nocreatedb nocreaterole noinherit noreplication nobypassrls
  `).execute(database);
  await sql.raw(`
    create role ${EXPERIMENTAL_ROLE_NAMES.platform}
      login password '${platformPassword}'
      nosuperuser nocreatedb nocreaterole noinherit noreplication nobypassrls
  `).execute(database);

  await sql.raw(
    `alter role ${EXPERIMENTAL_ROLE_NAMES.application} set row_security = on`,
  ).execute(database);
  await sql.raw(
    `alter role ${EXPERIMENTAL_ROLE_NAMES.platform} set row_security = on`,
  ).execute(database);

  return { applicationPassword, platformPassword };
}

export async function dropExperimentalRoles(
  database: Kysely<SpikeRlsDatabase>,
): Promise<void> {
  await sql`
    select pg_terminate_backend(pid)
    from pg_stat_activity
    where usename in (
      ${EXPERIMENTAL_ROLE_NAMES.application},
      ${EXPERIMENTAL_ROLE_NAMES.platform}
    )
      and pid <> pg_backend_pid()
  `.execute(database);

  await sql.raw(`
    drop role if exists
      ${EXPERIMENTAL_ROLE_NAMES.application},
      ${EXPERIMENTAL_ROLE_NAMES.platform},
      ${EXPERIMENTAL_ROLE_NAMES.owner}
  `).execute(database);
}
