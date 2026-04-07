import { query, withTransaction } from '../../db/client.js';

export async function getStudentPerformanceOverview(payload: {
  tenantId: string;
  studentId: string;
}) {
  const summaries = await query(
    `
      SELECT ps.*, c.name AS course_name
      FROM performance_summary ps
      JOIN courses c ON c.id = ps.course_id
      WHERE ps.tenant_id = $1 AND ps.student_id = $2
      ORDER BY c.name
    `,
    [payload.tenantId, payload.studentId]
  );

  const overallTests = summaries.reduce((sum: number, s: any) => sum + Number(s.total_tests_taken), 0);
  const overallAverage =
    summaries.length > 0
      ? summaries.reduce((sum: number, s: any) => sum + Number(s.average_score), 0) / summaries.length
      : 0;
  const overallAttendance =
    summaries.length > 0
      ? summaries.reduce((sum: number, s: any) => sum + Number(s.attendance_percentage), 0) / summaries.length
      : 0;

  return {
    overall_percentage: Math.round(overallAverage * 10) / 10,
    total_tests: overallTests,
    average_score: Math.round(overallAverage * 10) / 10,
    attendance_percentage: Math.round(overallAttendance * 10) / 10,
    subjects: summaries.map((s: any) => ({
      course_id: s.course_id,
      course_name: s.course_name,
      average_score: Number(s.average_score),
      tests_taken: Number(s.total_tests_taken),
      attendance: Number(s.attendance_percentage)
    }))
  };
}

export async function getSubjectPerformance(payload: {
  tenantId: string;
  studentId: string;
  courseId: string;
}) {
  const tests = await query(
    `
      SELECT
        ta.id AS attempt_id,
        ta.percentage,
        ta.total_marks_obtained,
        ta.created_at,
        t.title,
        t.id AS test_id
      FROM test_attempts ta
      JOIN tests t ON t.id = ta.test_id
      WHERE ta.student_id = $1 AND t.course_id = $2 AND t.tenant_id = $3
      ORDER BY ta.created_at DESC
    `,
    [payload.studentId, payload.courseId, payload.tenantId]
  );

  const topicBreakdown = await query(
    `
      SELECT
        q.topic,
        COUNT(*)::int AS total,
        AVG(a.marks_obtained)::numeric(6,2) AS avg_marks
      FROM test_answers a
      JOIN question_bank q ON q.id = a.question_id
      JOIN test_attempts ta ON ta.id = a.attempt_id
      JOIN tests t ON t.id = ta.test_id
      WHERE ta.student_id = $1 AND t.course_id = $2 AND t.tenant_id = $3
      GROUP BY q.topic
      ORDER BY q.topic
    `,
    [payload.studentId, payload.courseId, payload.tenantId]
  );

  return { tests, topic_breakdown: topicBreakdown };
}

export async function getPerformanceTrend(payload: { tenantId: string; studentId: string }) {
  const rows = await query(
    `
      SELECT
        ta.test_id,
        ta.percentage AS score,
        ta.created_at AS date
      FROM test_attempts ta
      JOIN tests t ON t.id = ta.test_id
      WHERE ta.student_id = $1 AND t.tenant_id = $2
      ORDER BY ta.created_at ASC
    `,
    [payload.studentId, payload.tenantId]
  );

  let trend = 'stable';
  if (rows.length >= 2) {
    const first = Number(rows[0].score ?? 0);
    const last = Number(rows[rows.length - 1].score ?? 0);
    const diff = last - first;
    if (diff >= 5) trend = 'improving';
    else if (diff <= -5) trend = 'declining';
  }

  return { trend_data: rows, trend };
}

export async function getBatchComparison(payload: { tenantId: string; batchId: string }) {
  return query(
    `
      SELECT
        s.id AS student_id,
        u.full_name AS student_name,
        AVG(ta.percentage)::numeric(6,2) AS average_score,
        COUNT(ta.id)::int AS tests_taken,
        ps.attendance_percentage,
        DENSE_RANK() OVER (ORDER BY AVG(ta.percentage) DESC) AS rank
      FROM batch_students bs
      JOIN students s ON s.id = bs.student_id
      JOIN users u ON u.id = s.user_id
      LEFT JOIN test_attempts ta ON ta.student_id = s.id
      LEFT JOIN tests t ON t.id = ta.test_id AND t.batch_id = bs.batch_id AND t.tenant_id = $1
      LEFT JOIN performance_summary ps ON ps.student_id = s.id AND ps.tenant_id = $1
      WHERE bs.batch_id = $2
      GROUP BY s.id, u.full_name, ps.attendance_percentage
      ORDER BY average_score DESC NULLS LAST
    `,
    [payload.tenantId, payload.batchId]
  );
}

export async function getTestComparison(payload: { tenantId: string; testIds: string[] }) {
  return query(
    `
      SELECT
        s.id AS student_id,
        u.full_name AS student_name,
        ta.test_id,
        ta.percentage
      FROM test_attempts ta
      JOIN students s ON s.id = ta.student_id
      JOIN users u ON u.id = s.user_id
      JOIN tests t ON t.id = ta.test_id
      WHERE t.tenant_id = $1 AND ta.test_id = ANY($2::uuid[])
      ORDER BY u.full_name, ta.test_id
    `,
    [payload.tenantId, payload.testIds]
  );
}

export async function upsertPerformanceSummary(payload: {
  tenantId: string;
  studentId: string;
  courseId: string;
  totalTests: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  attendancePercentage: number;
}) {
  await query(
    `
      INSERT INTO performance_summary (
        tenant_id, student_id, course_id, total_tests_taken, average_score,
        highest_score, lowest_score, attendance_percentage, last_updated
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
      ON CONFLICT (tenant_id, student_id, course_id)
      DO UPDATE SET
        total_tests_taken = EXCLUDED.total_tests_taken,
        average_score = EXCLUDED.average_score,
        highest_score = EXCLUDED.highest_score,
        lowest_score = EXCLUDED.lowest_score,
        attendance_percentage = EXCLUDED.attendance_percentage,
        last_updated = NOW(),
        updated_at = NOW()
    `,
    [
      payload.tenantId,
      payload.studentId,
      payload.courseId,
      payload.totalTests,
      payload.averageScore,
      payload.highestScore,
      payload.lowestScore,
      payload.attendancePercentage
    ]
  );
}

export async function rebuildPerformanceSummaries() {
  const tenants = await query<{ id: string }>(`SELECT id FROM tenants WHERE is_active = TRUE`);

  for (const tenant of tenants) {
    const students = await query<{ id: string }>(
      `SELECT id FROM students WHERE tenant_id = $1`,
      [tenant.id]
    );

    for (const student of students) {
      const courseStats = await query(
        `
          SELECT
            t.course_id,
            COUNT(*)::int AS total_tests,
            AVG(ta.percentage)::numeric(6,2) AS avg_score,
            MAX(ta.percentage)::numeric(6,2) AS max_score,
            MIN(ta.percentage)::numeric(6,2) AS min_score
          FROM test_attempts ta
          JOIN tests t ON t.id = ta.test_id
          WHERE ta.student_id = $1 AND t.tenant_id = $2
          GROUP BY t.course_id
        `,
        [student.id, tenant.id]
      );

      for (const row of courseStats) {
        const attendance = await query<{ present: string; total: string }>(
          `
            SELECT
              SUM(CASE WHEN status IN ('present','late','excused') THEN 1 ELSE 0 END)::text AS present,
              COUNT(*)::text AS total
            FROM attendance_records
            WHERE tenant_id = $1 AND student_id = $2 AND course_id = $3
          `,
          [tenant.id, student.id, row.course_id]
        );

        const total = Number(attendance[0]?.total ?? 0);
        const present = Number(attendance[0]?.present ?? 0);
        const attendancePct = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;

        await upsertPerformanceSummary({
          tenantId: tenant.id,
          studentId: student.id,
          courseId: row.course_id,
          totalTests: Number(row.total_tests),
          averageScore: Number(row.avg_score ?? 0),
          highestScore: Number(row.max_score ?? 0),
          lowestScore: Number(row.min_score ?? 0),
          attendancePercentage: attendancePct
        });
      }
    }
  }
}
