import { query } from '../../db/client.js';

export async function getTestAnalytics(payload: { tenantId: string; testId: string }) {
  const [test] = await query<{ batch_id: string; passing_marks: string }>(
    `SELECT batch_id, passing_marks FROM tests WHERE tenant_id = $1 AND id = $2`,
    [payload.tenantId, payload.testId]
  );
  if (!test) return null;

  const [totalStudents] = await query<{ total: string }>(
    `
      SELECT COUNT(*)::text AS total
      FROM batch_students
      WHERE batch_id = $1
    `,
    [test.batch_id]
  );

  const attempts = await query<{
    total_marks_obtained: string;
    percentage: string;
  }>(
    `
      SELECT total_marks_obtained, percentage
      FROM test_attempts
      WHERE test_id = $1 AND status IN ('submitted','evaluated')
    `,
    [payload.testId]
  );

  const scores = attempts.map((a) => Number(a.percentage ?? 0));
  const attempted = attempts.length;
  const average = attempted ? scores.reduce((a, b) => a + b, 0) / attempted : 0;
  const highest = attempted ? Math.max(...scores) : 0;
  const lowest = attempted ? Math.min(...scores) : 0;

  const passing = attempts.filter((a) => Number(a.total_marks_obtained) >= Number(test.passing_marks ?? 0)).length;
  const passingPercentage = attempted ? Math.round((passing / attempted) * 100) : 0;

  const buckets = {
    '90-100': 0,
    '80-89': 0,
    '70-79': 0,
    '60-69': 0,
    '50-59': 0,
    '0-49': 0
  };
  scores.forEach((score) => {
    if (score >= 90) buckets['90-100'] += 1;
    else if (score >= 80) buckets['80-89'] += 1;
    else if (score >= 70) buckets['70-79'] += 1;
    else if (score >= 60) buckets['60-69'] += 1;
    else if (score >= 50) buckets['50-59'] += 1;
    else buckets['0-49'] += 1;
  });

  const questionPerf = await query(
    `
      SELECT
        q.id AS question_id,
        SUM(CASE WHEN ta.is_correct = TRUE THEN 1 ELSE 0 END)::int AS correct_attempts,
        SUM(CASE WHEN ta.is_correct = FALSE THEN 1 ELSE 0 END)::int AS incorrect_attempts
      FROM test_questions tq
      JOIN test_answers ta ON ta.question_id = tq.question_id
      JOIN question_bank q ON q.id = tq.question_id
      WHERE tq.test_id = $1
      GROUP BY q.id
    `,
    [payload.testId]
  );

  const questionWise = questionPerf.map((row: any) => {
    const total = Number(row.correct_attempts) + Number(row.incorrect_attempts);
    const accuracy = total > 0 ? Math.round((Number(row.correct_attempts) / total) * 1000) / 10 : 0;
    return { ...row, accuracy };
  });

  return {
    total_students: Number(totalStudents?.total ?? 0),
    attempted,
    average_score: Math.round(average * 10) / 10,
    highest_score: Math.round(highest * 10) / 10,
    lowest_score: Math.round(lowest * 10) / 10,
    passing_percentage: passingPercentage,
    score_distribution: buckets,
    question_wise_performance: questionWise
  };
}

export async function getLeaderboard(payload: { tenantId: string; testId: string }) {
  return query(
    `
      SELECT
        s.id AS student_id,
        u.full_name AS student_name,
        u.email AS student_email,
        ta.total_marks_obtained,
        ta.percentage,
        DENSE_RANK() OVER (ORDER BY ta.total_marks_obtained DESC) AS rank,
        PERCENT_RANK() OVER (ORDER BY ta.total_marks_obtained) AS percentile
      FROM test_attempts ta
      JOIN students s ON s.id = ta.student_id
      JOIN users u ON u.id = s.user_id
      JOIN tests t ON t.id = ta.test_id
      WHERE ta.test_id = $1 AND t.tenant_id = $2 AND ta.status IN ('submitted','evaluated')
      ORDER BY ta.total_marks_obtained DESC
    `,
    [payload.testId, payload.tenantId]
  );
}

export async function getStudentPerformance(payload: { tenantId: string; studentId: string }) {
  const attempts = await query(
    `
      SELECT
        ta.id AS attempt_id,
        ta.total_marks_obtained,
        ta.percentage,
        ta.status,
        ta.created_at,
        t.title,
        t.id AS test_id
      FROM test_attempts ta
      JOIN tests t ON t.id = ta.test_id
      WHERE ta.student_id = $1 AND t.tenant_id = $2
      ORDER BY ta.created_at ASC
    `,
    [payload.studentId, payload.tenantId]
  );

  const avg =
    attempts.length > 0
      ? attempts.reduce((sum: number, a: any) => sum + Number(a.percentage ?? 0), 0) / attempts.length
      : 0;

  return {
    attempts,
    average: Math.round(avg * 10) / 10,
    trend: attempts.map((a: any) => ({ date: a.created_at, percentage: Number(a.percentage ?? 0) }))
  };
}
