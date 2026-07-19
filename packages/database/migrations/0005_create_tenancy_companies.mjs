import { sql } from 'kysely';

async function assertCompaniesTableEmpty(database, provider) {
  const result =
    provider === 'postgres'
      ? await sql`select exists(select 1 from tenancy.companies limit 1) as has_rows`.execute(
          database,
        )
      : await sql`select exists(select 1 from tenancy_companies limit 1) as has_rows`.execute(
          database,
        );
  const hasRows = result.rows[0]?.has_rows;

  if (hasRows === true || hasRows === 1 || hasRows === 1n) {
    throw new Error('Cannot roll back tenancy companies while data exists.');
  }
}

export function createMigration(provider) {
  if (provider !== 'postgres' && provider !== 'sqlite') {
    throw new TypeError('Unsupported migration provider.');
  }

  return {
    async down(database) {
      await assertCompaniesTableEmpty(database, provider);

      if (provider === 'postgres') {
        await sql`drop table tenancy.companies`.execute(database);
        return;
      }

      await sql`drop table tenancy_companies`.execute(database);
    },
    async up(database) {
      if (provider === 'postgres') {
        await sql`
          create table tenancy.companies (
            id uuid not null,
            name text not null,
            status text not null,
            authorization_version integer not null,
            created_at timestamptz not null,
            updated_at timestamptz not null,
            blocked_at timestamptz,
            blocked_reason text,
            constraint tenancy_companies_pkey primary key (id),
            constraint tenancy_companies_name_not_empty check (
              char_length(btrim(name)) > 0
            ),
            constraint tenancy_companies_status_allowed check (
              status in ('ACTIVE', 'BLOCKED')
            ),
            constraint tenancy_companies_authorization_version_positive check (
              authorization_version >= 1
            ),
            constraint tenancy_companies_timestamps_ordered check (
              updated_at >= created_at
            ),
            constraint tenancy_companies_blocked_state_coherent check (
              (
                status = 'BLOCKED'
                and blocked_at is not null
                and blocked_at >= created_at
                and blocked_reason is not null
                and char_length(btrim(blocked_reason)) > 0
              )
              or (
                status = 'ACTIVE'
                and blocked_at is null
                and blocked_reason is null
              )
            )
          )
        `.execute(database);
        return;
      }

      await sql`
        create table tenancy_companies (
          id text not null,
          name text not null,
          status text not null,
          authorization_version integer not null,
          created_at text not null,
          updated_at text not null,
          blocked_at text,
          blocked_reason text,
          constraint tenancy_companies_pkey primary key (id),
          constraint tenancy_companies_id_canonical_uuid check (
            length(id) = 36
            and substr(id, 9, 1) = '-'
            and substr(id, 14, 1) = '-'
            and substr(id, 19, 1) = '-'
            and substr(id, 24, 1) = '-'
            and substr(id, 1, 8) not glob '*[^0-9a-f]*'
            and substr(id, 10, 4) not glob '*[^0-9a-f]*'
            and substr(id, 15, 4) not glob '*[^0-9a-f]*'
            and substr(id, 20, 4) not glob '*[^0-9a-f]*'
            and substr(id, 25, 12) not glob '*[^0-9a-f]*'
          ),
          constraint tenancy_companies_name_not_empty check (
            length(trim(name)) > 0
          ),
          constraint tenancy_companies_status_allowed check (
            status in ('ACTIVE', 'BLOCKED')
          ),
          constraint tenancy_companies_authorization_version_positive check (
            typeof(authorization_version) = 'integer'
            and authorization_version >= 1
          ),
          constraint tenancy_companies_created_at_utc check (
            strftime('%Y-%m-%dT%H:%M:%fZ', created_at) is not null
            and strftime('%Y-%m-%dT%H:%M:%fZ', created_at) = created_at
          ),
          constraint tenancy_companies_updated_at_utc check (
            strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) is not null
            and strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) = updated_at
          ),
          constraint tenancy_companies_blocked_at_utc check (
            blocked_at is null
            or (
              strftime('%Y-%m-%dT%H:%M:%fZ', blocked_at) is not null
              and strftime('%Y-%m-%dT%H:%M:%fZ', blocked_at) = blocked_at
            )
          ),
          constraint tenancy_companies_timestamps_ordered check (
            updated_at >= created_at
          ),
          constraint tenancy_companies_blocked_state_coherent check (
            (
              status = 'BLOCKED'
              and blocked_at is not null
              and blocked_at >= created_at
              and blocked_reason is not null
              and length(trim(blocked_reason)) > 0
            )
            or (
              status = 'ACTIVE'
              and blocked_at is null
              and blocked_reason is null
            )
          )
        ) strict
      `.execute(database);
    },
  };
}
