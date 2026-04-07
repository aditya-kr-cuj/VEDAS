import { query } from '../../db/client.js';

export async function createReport(payload: {
  tenantId: string;
  studentId: string;
  reportType: string;
  fromDate: string;
  toDate: string;
  reportData: any;
  createdBy?: string;
}) {
  const rows = await query(
    `
      INSERT INTO reports (tenant_id, student_id, report_type, from_date, to_date, report_data, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `,
    [
      payload.tenantId,
      payload.studentId,
      payload.reportType,
      payload.fromDate,
      payload.toDate,
      JSON.stringify(payload.reportData),
      payload.createdBy ?? null
    ]
  );
  return rows[0];
}

export async function getReportById(payload: { tenantId: string; reportId: string }) {
  const [report] = await query(
    `
      SELECT *
      FROM reports
      WHERE tenant_id = $1 AND id = $2
      LIMIT 1
    `,
    [payload.tenantId, payload.reportId]
  );
  return report ?? null;
}

export async function getStudentReportData(payload: {
  tenantId: string;
  studentId: string;
  fromDate: string;
  toDate: string;
}) {
  const [student] = await query(
    `
      SELECT s.id, u.full_name, u.email
      FROM students s
      JOIN users u ON u.id = s.user_id
      WHERE s.tenant_id = $1 AND s.id = $2
    `,
    [payload.tenantId, payload.studentId]
  );

  const [tenant] = await query(
    `
      SELECT name, owner_email
      FROM tenants
      WHERE id = $1
    `,
    [payload.tenantId]
  );

  const tests = await query(
    `
      SELECT
        t.id AS test_id,
        t.title,
        t.course_id,
        c.name AS course_name,
        ta.total_marks_obtained,
        ta.percentage,
        ta.created_at
      FROM test_attempts ta
      JOIN tests t ON t.id = ta.test_id
      JOIN courses c ON c.id = t.course_id
      WHERE ta.student_id = $1 AND t.tenant_id = $2
        AND ta.created_at::date BETWEEN $3 AND $4
      ORDER BY ta.created_at
    `,
    [payload.studentId, payload.tenantId, payload.fromDate, payload.toDate]
  );

  const subjectAverages = await query(
    `
      SELECT
        t.course_id,
        c.name AS course_name,
        AVG(ta.percentage)::numeric(6,2) AS average_score
      FROM test_attempts ta
      JOIN tests t ON t.id = ta.test_id
      JOIN courses c ON c.id = t.course_id
      WHERE ta.student_id = $1 AND t.tenant_id = $2
        AND ta.created_at::date BETWEEN $3 AND $4
      GROUP BY t.course_id, c.name
    `,
    [payload.studentId, payload.tenantId, payload.fromDate, payload.toDate]
  );

  const attendance = await query<{ present: string; total: string }>(
    `
      SELECT
        SUM(CASE WHEN status IN ('present','late','excused') THEN 1 ELSE 0 END)::text AS present,
        COUNT(*)::text AS total
      FROM attendance_records
      WHERE tenant_id = $1 AND student_id = $2
        AND date BETWEEN $3 AND $4
    `,
    [payload.tenantId, payload.studentId, payload.fromDate, payload.toDate]
  );
  const total = Number(attendance[0]?.total ?? 0);
  const present = Number(attendance[0]?.present ?? 0);
  const attendancePct = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;

  const overallAvg =
    tests.length > 0 ? tests.reduce((sum: number, t: any) => sum + Number(t.percentage), 0) / tests.length : 0;

  return {
    student,
    tenant,
    attendance_summary: {
      total,
      present,
      percentage: attendancePct
    },
    tests,
    subject_averages: subjectAverages,
    overall_percentage: Math.round(overallAvg * 10) / 10,
    remarks: '',
    improvements: ''
  };
}

export async function listStudentsInBatch(payload: { tenantId: string; batchId: string }) {
  return query(
    `
      SELECT s.id AS student_id, u.full_name, u.email
      FROM batch_students bs
      JOIN students s ON s.id = bs.student_id
      JOIN users u ON u.id = s.user_id
      JOIN batches b ON b.id = bs.batch_id
      WHERE b.tenant_id = $1 AND bs.batch_id = $2
    `,
    [payload.tenantId, payload.batchId]
  );
}
