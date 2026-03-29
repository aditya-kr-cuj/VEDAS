import type { PoolClient } from 'pg';

export interface StudentRecord {
  id: string;
  tenant_id: string;
  user_id: string | null;
  roll_number: string | null;
  class_name: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function createStudentProfile(
  client: PoolClient,
  payload: { tenantId: string; userId: string }
): Promise<StudentRecord> {
  const result = await client.query<StudentRecord>(
    `
      INSERT INTO students (tenant_id, user_id)
      VALUES ($1, $2)
      RETURNING *
    `,
    [payload.tenantId, payload.userId]
  );

  return result.rows[0];
}
