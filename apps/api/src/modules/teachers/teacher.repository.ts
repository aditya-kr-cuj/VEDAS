import type { PoolClient } from 'pg';

export interface TeacherRecord {
  id: string;
  tenant_id: string;
  user_id: string | null;
  specialization: string | null;
  qualification: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function createTeacherProfile(
  client: PoolClient,
  payload: { tenantId: string; userId: string }
): Promise<TeacherRecord> {
  const result = await client.query<TeacherRecord>(
    `
      INSERT INTO teachers (tenant_id, user_id)
      VALUES ($1, $2)
      RETURNING *
    `,
    [payload.tenantId, payload.userId]
  );

  return result.rows[0];
}
