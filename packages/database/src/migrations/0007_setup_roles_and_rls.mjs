import { sql } from 'kysely';

export function createMigration(provider) {
  if (provider !== 'postgres' && provider !== 'sqlite') {
    throw new TypeError('Unsupported migration provider.');
  }

  return {
    async down(database) {
      if (provider === 'postgres') {
        await sql`DROP POLICY IF EXISTS tenant_isolation_policy ON tenancy.memberships;`.execute(database);
        await sql`ALTER TABLE tenancy.memberships NO FORCE ROW LEVEL SECURITY;`.execute(database);
        await sql`ALTER TABLE tenancy.memberships DISABLE ROW LEVEL SECURITY;`.execute(database);
        
        await sql`REVOKE ALL PRIVILEGES ON tenancy.memberships FROM mesachef_tenant;`.execute(database);
        await sql`REVOKE ALL PRIVILEGES ON identity.users FROM mesachef_platform;`.execute(database);
        await sql`REVOKE ALL PRIVILEGES ON identity.password_credentials FROM mesachef_platform;`.execute(database);
        await sql`REVOKE ALL PRIVILEGES ON tenancy.companies FROM mesachef_platform;`.execute(database);
      }
    },
    async up(database) {
      if (provider === 'postgres') {
        await sql`
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'mesachef_tenant') THEN
              CREATE ROLE mesachef_tenant WITH LOGIN PASSWORD 'tenant_local_secret' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
            END IF;
            
            IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'mesachef_platform') THEN
              CREATE ROLE mesachef_platform WITH LOGIN PASSWORD 'platform_local_secret' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
            END IF;
          END
          $$;
        `.execute(database);

        await sql`GRANT USAGE ON SCHEMA public TO mesachef_tenant, mesachef_platform;`.execute(database);
        await sql`GRANT USAGE ON SCHEMA identity TO mesachef_tenant, mesachef_platform;`.execute(database);
        await sql`GRANT USAGE ON SCHEMA tenancy TO mesachef_tenant, mesachef_platform;`.execute(database);

        await sql`GRANT SELECT ON identity.users TO mesachef_platform;`.execute(database);
        await sql`GRANT SELECT ON identity.password_credentials TO mesachef_platform;`.execute(database);
        await sql`GRANT SELECT ON tenancy.companies TO mesachef_platform;`.execute(database);

        await sql`GRANT SELECT, INSERT, UPDATE, DELETE ON tenancy.memberships TO mesachef_tenant;`.execute(database);

        await sql`ALTER TABLE tenancy.memberships ENABLE ROW LEVEL SECURITY;`.execute(database);
        await sql`ALTER TABLE tenancy.memberships FORCE ROW LEVEL SECURITY;`.execute(database);

        await sql`
          CREATE POLICY tenant_isolation_policy ON tenancy.memberships
          AS PERMISSIVE
          FOR ALL
          TO public
          USING (company_id = nullif(current_setting('app.current_company_id', true), '')::uuid)
          WITH CHECK (company_id = nullif(current_setting('app.current_company_id', true), '')::uuid);
        `.execute(database);
      }
    }
  };
}
