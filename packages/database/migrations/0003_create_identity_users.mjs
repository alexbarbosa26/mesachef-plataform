import { sql } from 'kysely';

async function assertUsersTableEmpty(database, provider) {
  const result =
    provider === 'postgres'
      ? await sql`select exists(select 1 from identity.users limit 1) as has_rows`.execute(
          database,
        )
      : await sql`select exists(select 1 from identity_users limit 1) as has_rows`.execute(
          database,
        );
  const hasRows = result.rows[0]?.has_rows;

  if (hasRows === true || hasRows === 1 || hasRows === 1n) {
    throw new Error('Cannot roll back identity users while data exists.');
  }
}

export function createMigration(provider) {
  if (provider !== 'postgres' && provider !== 'sqlite') {
    throw new TypeError('Unsupported migration provider.');
  }

  return {
    async down(database) {
      await assertUsersTableEmpty(database, provider);

      if (provider === 'postgres') {
        await sql`drop table identity.users`.execute(database);
        return;
      }

      await sql`drop table identity_users`.execute(database);
    },
    async up(database) {
      if (provider === 'postgres') {
        await sql`
          create table identity.users (
            id uuid not null,
            email_original text not null,
            email_normalized text collate "C" not null,
            display_name text not null,
            status text not null,
            authorization_version integer not null,
            created_at timestamptz not null,
            updated_at timestamptz not null,
            blocked_at timestamptz,
            blocked_reason text,
            constraint identity_users_pkey primary key (id),
            constraint identity_users_email_normalized_unique unique (email_normalized),
            constraint identity_users_email_original_not_empty check (
              char_length(btrim(email_original)) > 0
            ),
            constraint identity_users_email_normalized_canonical check (
              char_length(email_normalized) > 0
              and email_normalized = btrim(email_normalized)
            ),
            constraint identity_users_display_name_not_empty check (
              char_length(btrim(display_name)) > 0
            ),
            constraint identity_users_status_allowed check (
              status in ('PENDING_ACTIVATION', 'ACTIVE', 'BLOCKED', 'DEACTIVATED')
            ),
            constraint identity_users_authorization_version_positive check (
              authorization_version >= 1
            ),
            constraint identity_users_timestamps_ordered check (
              updated_at >= created_at
            ),
            constraint identity_users_blocked_state_coherent check (
              (
                status = 'BLOCKED'
                and blocked_at is not null
                and blocked_at >= created_at
                and blocked_reason is not null
                and char_length(btrim(blocked_reason)) > 0
              )
              or (
                status <> 'BLOCKED'
                and blocked_at is null
                and blocked_reason is null
              )
            )
          )
        `.execute(database);
        return;
      }

      await sql`
        create table identity_users (
          id text not null,
          email_original text not null,
          email_normalized text collate binary not null,
          display_name text not null,
          status text not null,
          authorization_version integer not null,
          created_at text not null,
          updated_at text not null,
          blocked_at text,
          blocked_reason text,
          constraint identity_users_pkey primary key (id),
          constraint identity_users_id_canonical_uuid check (
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
          constraint identity_users_email_normalized_unique unique (email_normalized),
          constraint identity_users_email_original_not_empty check (
            length(trim(email_original)) > 0
          ),
          constraint identity_users_email_normalized_canonical check (
            length(email_normalized) > 0
            and email_normalized = trim(email_normalized)
          ),
          constraint identity_users_display_name_not_empty check (
            length(trim(display_name)) > 0
          ),
          constraint identity_users_status_allowed check (
            status in ('PENDING_ACTIVATION', 'ACTIVE', 'BLOCKED', 'DEACTIVATED')
          ),
          constraint identity_users_authorization_version_positive check (
            typeof(authorization_version) = 'integer'
            and authorization_version >= 1
          ),
          constraint identity_users_created_at_utc check (
            strftime('%Y-%m-%dT%H:%M:%fZ', created_at) is not null
            and strftime('%Y-%m-%dT%H:%M:%fZ', created_at) = created_at
          ),
          constraint identity_users_updated_at_utc check (
            strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) is not null
            and strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) = updated_at
          ),
          constraint identity_users_blocked_at_utc check (
            blocked_at is null
            or (
              strftime('%Y-%m-%dT%H:%M:%fZ', blocked_at) is not null
              and strftime('%Y-%m-%dT%H:%M:%fZ', blocked_at) = blocked_at
            )
          ),
          constraint identity_users_timestamps_ordered check (
            updated_at >= created_at
          ),
          constraint identity_users_blocked_state_coherent check (
            (
              status = 'BLOCKED'
              and blocked_at is not null
              and blocked_at >= created_at
              and blocked_reason is not null
              and length(trim(blocked_reason)) > 0
            )
            or (
              status <> 'BLOCKED'
              and blocked_at is null
              and blocked_reason is null
            )
          )
        ) strict
      `.execute(database);
    },
  };
}
