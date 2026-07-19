import { sql } from 'kysely';

async function assertCredentialsTableEmpty(database, provider) {
  const result =
    provider === 'postgres'
      ? await sql`select exists(select 1 from identity.password_credentials limit 1) as has_rows`.execute(
          database,
        )
      : await sql`select exists(select 1 from identity_password_credentials limit 1) as has_rows`.execute(
          database,
        );
  const hasRows = result.rows[0]?.has_rows;

  if (hasRows === true || hasRows === 1 || hasRows === 1n) {
    throw new Error(
      'Cannot roll back identity password credentials while data exists.',
    );
  }
}

export function createMigration(provider) {
  if (provider !== 'postgres' && provider !== 'sqlite') {
    throw new TypeError('Unsupported migration provider.');
  }

  return {
    async down(database) {
      await assertCredentialsTableEmpty(database, provider);

      if (provider === 'postgres') {
        await sql`drop table identity.password_credentials`.execute(database);
        return;
      }

      await sql`drop table identity_password_credentials`.execute(database);
    },
    async up(database) {
      if (provider === 'postgres') {
        await sql`
          create table identity.password_credentials (
            user_id uuid not null,
            password_hash text not null,
            hash_algorithm text not null,
            hash_parameters_version integer not null,
            password_changed_at timestamptz not null,
            requires_password_change boolean not null,
            created_at timestamptz not null,
            updated_at timestamptz not null,
            constraint identity_password_credentials_pkey primary key (user_id),
            constraint identity_password_credentials_user_fk foreign key (user_id)
              references identity.users (id)
              on update restrict
              on delete restrict,
            constraint identity_password_credentials_hash_not_empty check (
              char_length(btrim(password_hash)) > 0
            ),
            constraint identity_password_credentials_algorithm_not_empty check (
              char_length(btrim(hash_algorithm)) > 0
            ),
            constraint identity_password_credentials_parameters_version_positive check (
              hash_parameters_version >= 1
            ),
            constraint identity_password_credentials_timestamps_ordered check (
              password_changed_at >= created_at
              and updated_at >= password_changed_at
            )
          )
        `.execute(database);
        return;
      }

      await sql`
        create table identity_password_credentials (
          user_id text not null,
          password_hash text not null,
          hash_algorithm text not null,
          hash_parameters_version integer not null,
          password_changed_at text not null,
          requires_password_change integer not null,
          created_at text not null,
          updated_at text not null,
          constraint identity_password_credentials_pkey primary key (user_id),
          constraint identity_password_credentials_user_id_canonical_uuid check (
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
          constraint identity_password_credentials_user_fk foreign key (user_id)
            references identity_users (id)
            on update restrict
            on delete restrict,
          constraint identity_password_credentials_hash_not_empty check (
            length(trim(password_hash)) > 0
          ),
          constraint identity_password_credentials_algorithm_not_empty check (
            length(trim(hash_algorithm)) > 0
          ),
          constraint identity_password_credentials_parameters_version_positive check (
            typeof(hash_parameters_version) = 'integer'
            and hash_parameters_version >= 1
          ),
          constraint identity_password_credentials_requires_change_boolean check (
            typeof(requires_password_change) = 'integer'
            and requires_password_change in (0, 1)
          ),
          constraint identity_password_credentials_changed_at_utc check (
            strftime('%Y-%m-%dT%H:%M:%fZ', password_changed_at) is not null
            and strftime('%Y-%m-%dT%H:%M:%fZ', password_changed_at) = password_changed_at
          ),
          constraint identity_password_credentials_created_at_utc check (
            strftime('%Y-%m-%dT%H:%M:%fZ', created_at) is not null
            and strftime('%Y-%m-%dT%H:%M:%fZ', created_at) = created_at
          ),
          constraint identity_password_credentials_updated_at_utc check (
            strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) is not null
            and strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) = updated_at
          ),
          constraint identity_password_credentials_timestamps_ordered check (
            password_changed_at >= created_at
            and updated_at >= password_changed_at
          )
        ) strict
      `.execute(database);
    },
  };
}
