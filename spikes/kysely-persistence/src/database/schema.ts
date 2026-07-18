import type { ColumnType, Insertable, Selectable } from 'kysely';

type TimestampColumn = ColumnType<Date | string, string, never>;

export interface SpikeCompanyTable {
  created_at: TimestampColumn;
  id: string;
  name: string;
}

export interface SpikeMembershipTable {
  company_id: string;
  created_at: TimestampColumn;
  id: string;
  user_id: string;
}

export interface SpikeResourceTable {
  company_id: string;
  created_at: TimestampColumn;
  id: string;
  resource_code: string;
  unit_price: string;
}

export interface SpikeUserTable {
  created_at: TimestampColumn;
  display_name: string;
  id: string;
}

export interface SpikeDatabase {
  spike_companies: SpikeCompanyTable;
  spike_memberships: SpikeMembershipTable;
  spike_resources: SpikeResourceTable;
  spike_users: SpikeUserTable;
}

export type NewSpikeCompanyRow = Insertable<SpikeCompanyTable>;
export type NewSpikeMembershipRow = Insertable<SpikeMembershipTable>;
export type NewSpikeUserRow = Insertable<SpikeUserTable>;
export type SpikeResourceRow = Selectable<SpikeResourceTable>;

