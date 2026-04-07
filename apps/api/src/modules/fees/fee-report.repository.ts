import { query } from '../../db/client.js';

export async function listDueFees(tenantId: string) {
  return query(
    `
      SELECT
        sf.id AS student_fee_id,
        sf.student_id,
        u.id AS user_id,
        u.full_name AS student_name,
        u.email AS student_email,
        sf.total_amount,
        sf.paid_amount,
        sf.due_amount,
        sf.due_date,
        sf.status
      FROM student_fees sf
      JOIN students s ON s.id = sf.student_id
      JOIN users u ON u.id = s.user_id
      WHERE sf.tenant_id = $1 AND sf.due_amount > 0
      ORDER BY sf.due_date ASC
    `,
    [tenantId]
  );
}

export async function listOverdueFees(tenantId: string) {
  return query(
    `
      SELECT
        sf.id AS student_fee_id,
        sf.student_id,
        u.id AS user_id,
        u.full_name AS student_name,
        u.email AS student_email,
        sf.total_amount,
        sf.paid_amount,
        sf.due_amount,
        sf.due_date,
        sf.status
      FROM student_fees sf
      JOIN students s ON s.id = sf.student_id
      JOIN users u ON u.id = s.user_id
      WHERE sf.tenant_id = $1 AND sf.due_amount > 0 AND sf.due_date < CURRENT_DATE
      ORDER BY sf.due_date ASC
    `,
    [tenantId]
  );
}

export async function summaryReport(tenantId: string, from: string, to: string) {
  const [rangeTotal] = await query<{ total: string }>(
    `
      SELECT COALESCE(SUM(amount),0)::text AS total
      FROM fee_payments
      WHERE tenant_id = $1 AND payment_date BETWEEN $2 AND $3
    `,
    [tenantId, from, to]
  );

  const [dues] = await query<{ total: string }>(
    `
      SELECT COALESCE(SUM(due_amount),0)::text AS total
      FROM student_fees
      WHERE tenant_id = $1
    `,
    [tenantId]
  );

  const [overdueCount] = await query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM student_fees
      WHERE tenant_id = $1 AND due_amount > 0 AND due_date < CURRENT_DATE
    `,
    [tenantId]
  );

  const paymentModes = await query<{ payment_mode: string; total: string }>(
    `
      SELECT payment_mode, COALESCE(SUM(amount),0)::text AS total
      FROM fee_payments
      WHERE tenant_id = $1 AND payment_date BETWEEN $2 AND $3
      GROUP BY payment_mode
    `,
    [tenantId, from, to]
  );

  const [todayTotal] = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount),0)::text AS total FROM fee_payments WHERE tenant_id = $1 AND payment_date = CURRENT_DATE`,
    [tenantId]
  );
  const [monthTotal] = await query<{ total: string }>(
    `
      SELECT COALESCE(SUM(amount),0)::text AS total
      FROM fee_payments
      WHERE tenant_id = $1 AND date_trunc('month', payment_date) = date_trunc('month', CURRENT_DATE)
    `,
    [tenantId]
  );
  const [yearTotal] = await query<{ total: string }>(
    `
      SELECT COALESCE(SUM(amount),0)::text AS total
      FROM fee_payments
      WHERE tenant_id = $1 AND date_trunc('year', payment_date) = date_trunc('year', CURRENT_DATE)
    `,
    [tenantId]
  );

  return {
    totalInRange: Number(rangeTotal?.total ?? 0),
    duesPending: Number(dues?.total ?? 0),
    overdueCount: Number(overdueCount?.count ?? 0),
    totals: {
      today: Number(todayTotal?.total ?? 0),
      month: Number(monthTotal?.total ?? 0),
      year: Number(yearTotal?.total ?? 0)
    },
    paymentModes: paymentModes.map((m) => ({ mode: m.payment_mode, amount: Number(m.total) }))
  };
}

export async function dailyCollectionReport(tenantId: string, from: string, to: string) {
  return query(
    `
      SELECT payment_date AS date, COALESCE(SUM(amount),0)::text AS total
      FROM fee_payments
      WHERE tenant_id = $1 AND payment_date BETWEEN $2 AND $3
      GROUP BY payment_date
      ORDER BY payment_date
    `,
    [tenantId, from, to]
  );
}

export async function monthlyCollectionReport(tenantId: string, from: string, to: string) {
  return query(
    `
      SELECT to_char(date_trunc('month', payment_date), 'YYYY-MM') AS month, COALESCE(SUM(amount),0)::text AS total
      FROM fee_payments
      WHERE tenant_id = $1 AND payment_date BETWEEN $2 AND $3
      GROUP BY date_trunc('month', payment_date)
      ORDER BY date_trunc('month', payment_date)
    `,
    [tenantId, from, to]
  );
}

export async function studentFeeStatement(tenantId: string, studentId: string) {
  const fees = await query(
    `
      SELECT sf.*, fs.name AS structure_name
      FROM student_fees sf
      JOIN fee_structures fs ON fs.id = sf.fee_structure_id
      WHERE sf.tenant_id = $1 AND sf.student_id = $2
      ORDER BY sf.created_at DESC
    `,
    [tenantId, studentId]
  );
  const payments = await query(
    `
      SELECT p.*
      FROM fee_payments p
      JOIN student_fees sf ON sf.id = p.student_fee_id
      WHERE p.tenant_id = $1 AND sf.student_id = $2
      ORDER BY p.payment_date DESC
    `,
    [tenantId, studentId]
  );

  return { fees, payments };
}

export async function listStudentFeesByUser(tenantId: string, userId: string) {
  return query(
    `
      SELECT
        sf.id AS student_fee_id,
        sf.student_id,
        sf.total_amount,
        sf.paid_amount,
        sf.due_amount,
        sf.due_date,
        sf.status,
        fs.name AS fee_name,
        fs.frequency
      FROM student_fees sf
      JOIN students s ON s.id = sf.student_id
      JOIN fee_structures fs ON fs.id = sf.fee_structure_id
      WHERE sf.tenant_id = $1 AND s.user_id = $2
      ORDER BY sf.due_date ASC
    `,
    [tenantId, userId]
  );
}
