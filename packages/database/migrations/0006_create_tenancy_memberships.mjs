import { sql } from 'kysely';

async function assertMembershipsTableEmpty(database, provider) {
  const result =
    provider === 'postgres'
      ? await sql`select exists(select 1 from tenancy.memberships limit 1) as has_rows`.execute(
          database,
        )
      : await sql`select exists(select 1 from tenancy_memberships limit 1) as has_rows`.execute(
          database,
        );
  const hasRows = result.rows[0]?.has_rows;

  if (hasRows === true || hasRows === 1 || hasRows === 1n) {
    throw new Error('Cannot roll back tenancy memberships while data exists.');
  }
}

export function createMigration(provider) {
  if (provider !== 'postgres' && provider !== 'sqlite') {
    throw new TypeError('Unsupported migration provider.');
  }

  return {
    async down(database) {
      await assertMembershipsTableEmpty(database, provider);

      if (provider === 'postgres') {
        await sql`drop table tenancy.memberships`.execute(database);
        return;
      }

      await sql`drop table tenancy_memberships`.execute(database);
    },
    async up(database) {
      if (provider === 'postgres') {
        await sql`
          create table tenancy.memberships (
            id uuid not null,
            user_id uuid not null,
            company_id uuid not null,
            status text not null,
            authorization_version integer not null,
            created_at timestamptz not null,
            updated_at timestamptz not null,
            constraint tenancy_memberships_pkey primary key (id),
            constraint tenancy_memberships_user_fk foreign key (user_id)
              references identity.users (id)
              on update restrict
              on delete restrict,
            constraint tenancy_memberships_company_fk foreign key (company_id)
              references tenancy.companies (id)
              on update restrict
              on delete restrict,
            constraint tenancy_memberships_user_company_unique unique (user_id, company_id),
            constraint tenancy_memberships_company_id_id_unique unique (company_id, id),
            constraint tenancy_memberships_id_user_company_unique unique (id, user_id, company_id),
            constraint tenancy_memberships_status_allowed check (
              status in ('INVITED', 'ACTIVE', 'SUSPENDED', 'REVOKED')
            ),
            constraint tenancy_memberships_authorization_version_positive check (
              authorization_version >= 1
            ),
            constraint tenancy_memberships_timestamps_ordered check (
              updated_at >= created_at
            )
          )
        `.execute(database);
        await sql`
          create index tenancy_memberships_user_status_idx
          on tenancy.memberships (user_id, status)
        `.execute(database);
        await sql`
          create index tenancy_memberships_company_status_idx
          on tenancy.memberships (company_id, status)
        `.execute(database);
        return;
      }

      await sql`
        create table tenancy_memberships (
          id text not null,
          user_id text not null,
          company_id text not null,
          status text not null,
          authorization_version integer not null,
          created_at text not null,
          updated_at text not null,
          constraint tenancy_memberships_pkey primary key (id),
          constraint tenancy_memberships_id_canonical_uuid check (
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
          constraint tenancy_memberships_user_id_canonical_uuid check (
            length(user_id) = 36
            and substr(user_id, 9, 1) = '-'
            and substr(user_id, 14, 1) = '-'
            and substr(user_id, 19, 1) = '-'
            and substr(user_id, 24, 1) = '-'
            and substr(user_id, 1, 8) not glob '*[^0-9a-f]*'
            and substr(user_id, 10, 4) not glob '*[^0-9a-f]*'
            and substr(user_id, 15, 4) not glob '*[^0-9a-f]*'
            and substr(user_id, 20, 4) not glob '*[^0-9a-f]*'
            and substr(user_id, 25, 12) not glob '*[^0-9a-f]*'
          ),
          constraint tenancy_memberships_company_id_canonical_uuid check (
            length(company_id) = 36
            and substr(company_id, 9, 1) = '-'
            and substr(company_id, 14, 1) = '-'
            and substr(company_id, 19, 1) = '-'
            and substr(company_id, 24, 1) = '-'
            and substr(company_id, 1, 8) not glob '*[^0-9a-f]*'
            and substr(company_id, 10, 4) not glob '*[^0-9a-f]*'
            and substr(company_id, 15, 4) not glob '*[^0-9a-f]*'
            and substr(company_id, 20, 4) not glob '*[^0-9a-f]*'
            and substr(company_id, 25, 12) not glob '*[^0-9a-f]*'
          ),
          constraint tenancy_memberships_user_fk foreign key (user_id)
            references identity_users (id)
            on update restrict
            on delete restrict,
          constraint tenancy_memberships_company_fk foreign key (company_id)
            references tenancy_companies (id)
            on update restrict
            on delete restrict,
          constraint tenancy_memberships_user_company_unique unique (user_id, company_id),
          constraint tenancy_memberships_company_id_id_unique unique (company_id, id),
          constraint tenancy_memberships_id_user_company_unique unique (id, user_id, company_id),
          constraint tenancy_memberships_status_allowed check (
            status in ('INVITED', 'ACTIVE', 'SUSPENDED', 'REVOKED')
          ),
          constraint tenancy_memberships_authorization_version_positive check (
            typeof(authorization_version) = 'integer'
            and authorization_version >= 1
          ),
          constraint tenancy_memberships_created_at_utc check (
            strftime('%Y-%m-%dT%H:%M:%fZ', created_at) is not null
            and strftime('%Y-%m-%dT%H:%M:%fZ', created_at) = created_at
          ),
          constraint tenancy_memberships_updated_at_utc check (
            strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) is not null
            and strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) = updated_at
          ),
          constraint tenancy_memberships_timestamps_ordered check (
            updated_at >= created_at
          )
        ) strict
      `.execute(database);
      await sql`
        create index tenancy_memberships_user_status_idx
        on tenancy_memberships (user_id, status)
      `.execute(database);
      await sql`
        create index tenancy_memberships_company_status_idx
        on tenancy_memberships (company_id, status)
      `.execute(database);
    },
  };
}
