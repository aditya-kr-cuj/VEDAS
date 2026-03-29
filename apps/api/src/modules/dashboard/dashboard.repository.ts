import { query } from '../../db/client.js';

interface DashboardSummary {
  students: number;
  teachers: number;
  staff: number;
  totalUsers: number;
}

export async function getDashboardSummary(tenantId: string): Promise<DashboardSummary> {
  const rows = await query<{
    students: string;
    teachers: string;
    staff: string;
    totalusers: string;
  }>(
    `
      SELECT
        COUNT(*) FILTER (WHERE role = 'student')::text AS students,
        COUNT(*) FILTER (WHERE role = 'teacher')::text AS teachers,
        COUNT(*) FILTER (WHERE role = 'staff')::text AS staff,
        COUNT(*)::text AS totalusers
      FROM users
      WHERE tenant_id = $1
    `,
    [tenantId]
  );

  const row = rows[0];
  return {
    students: Number(row?.students ?? 0),
    teachers: Number(row?.teachers ?? 0),
    staff: Number(row?.staff ?? 0),
    totalUsers: Number(row?.totalusers ?? 0)
  };
}
