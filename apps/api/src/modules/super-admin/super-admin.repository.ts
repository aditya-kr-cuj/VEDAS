import { query } from '../../db/client.js';

interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  is_active: boolean;
  created_at: Date;
  user_count: string;
}

export async function listTenantSummaries(): Promise<TenantSummary[]> {
  return query<TenantSummary>(
    `
      SELECT
        t.id,
        t.name,
        t.slug,
        t.owner_email,
        t.is_active,
        t.created_at,
        COUNT(u.id)::text AS user_count
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `
  );
}
