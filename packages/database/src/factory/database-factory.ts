import type { Kysely } from 'kysely';
import type { DatabaseConnectionConfig } from '../database-config.js';
import { createInfrastructureDatabase } from '../kysely/create-database.js';
import type { MigrationInfrastructureDatabase } from '../kysely/database-schema.js';

/**
 * Cria o banco de dados (pool) para operações do Tenant.
 * Este pool deve ser configurado com uma role de banco de dados (ex: mesachef_tenant)
 * que NÃO possua ownership das tabelas e que seja restrita pelo RLS.
 */
export function createTenantDatabase(
  config: DatabaseConnectionConfig,
): Kysely<MigrationInfrastructureDatabase> {
  // Poderia haver tipagem específica para o schema do tenant aqui (ex: TenantDatabase)
  // Mas para o momento usamos a infraestrutura base
  return createInfrastructureDatabase(config);
}

/**
 * Cria o banco de dados (pool) para operações da Plataforma.
 * Este pool deve ser configurado com uma role de banco de dados (ex: mesachef_platform)
 * restrita a tabelas globais (sem acesso a tabelas tenant-owned).
 */
export function createPlatformDatabase(
  config: DatabaseConnectionConfig,
): Kysely<MigrationInfrastructureDatabase> {
  return createInfrastructureDatabase(config);
}
