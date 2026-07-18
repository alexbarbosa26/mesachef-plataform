import type { ColumnType } from 'kysely';

export interface SpikeRlsCompanyTable {
  id: string;
  name: string;
}

export interface SpikeRlsResourceTable {
  company_id: string;
  created_at: ColumnType<Date, Date | string | undefined, never>;
  id: string;
  name: string;
  resource_code: string;
}

export interface SpikeRlsAuditEventTable {
  company_id: string;
  created_at: ColumnType<Date, Date | string | undefined, never>;
  event_type: string;
  id: string;
}

export interface SpikeRlsDatabase {
  spike_rls_audit_events: SpikeRlsAuditEventTable;
  spike_rls_companies: SpikeRlsCompanyTable;
  spike_rls_resources: SpikeRlsResourceTable;
}
