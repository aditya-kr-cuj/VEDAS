import { query } from '../../db/client.js';

// ── Upsert budgets (bulk set for a year) ──────────────────────────────────────

export async function upsertBudgets(params: {
  tenantId: string;
  budgetYear: number;
  categoryBudgets: { categoryId: string; allocatedAmount: number }[];
}) {
  const { tenantId, budgetYear, categoryBudgets } = params;

  const results = [];
  for (const cb of categoryBudgets) {
    const rows = await query(
      `INSERT INTO budgets (tenant_id, budget_year, category_id, allocated_amount, spent_amount)
       VALUES (
         $1, $2, $3, $4,
         COALESCE((
           SELECT SUM(e.amount)::DECIMAL(12,2)
           FROM expenses e
           WHERE e.tenant_id = $1
             AND e.expense_category_id = $3
             AND EXTRACT(YEAR FROM e.expense_date)::INTEGER = $2
         ), 0)
       )
       ON CONFLICT (tenant_id, budget_year, category_id)
       DO UPDATE SET allocated_amount = EXCLUDED.allocated_amount,
                     spent_amount     = EXCLUDED.spent_amount,
                     updated_at       = NOW()
       RETURNING *`,
      [tenantId, budgetYear, cb.categoryId, cb.allocatedAmount]
    );
    results.push(rows[0]);
  }
  return results;
}

// ── Get budget vs actual for a year ──────────────────────────────────────────

export async function getBudgetVsActual(tenantId: string, year: number) {
  const rows = await query(
    `SELECT
       b.id,
       b.budget_year,
       b.category_id,
       ec.category_name                                    AS category,
       b.allocated_amount::numeric                         AS allocated,
       b.spent_amount::numeric                             AS spent,
       b.updated_at
     FROM budgets b
     JOIN expense_categories ec ON ec.id = b.category_id
     WHERE b.tenant_id  = $1
       AND b.budget_year = $2
     ORDER BY ec.category_name`,
    [tenantId, year]
  );

  return rows.map((r: Record<string, unknown>) => {
    const allocated       = Number(r.allocated);
    const spent           = Number(r.spent);
    const remaining       = allocated - spent;
    const percentage_used = allocated > 0
      ? Math.round((spent / allocated) * 100 * 10) / 10
      : 0;
    return {
      id:               r.id,
      category_id:      r.category_id,
      category:         r.category,
      allocated,
      spent,
      remaining,
      percentage_used,
      status: percentage_used >= 100 ? 'exceeded'
            : percentage_used >= 80  ? 'warning'
            : 'ok'
    };
  });
}

// ── List distinct years that have budgets ─────────────────────────────────────

export async function getBudgetYears(tenantId: string) {
  return query<{ year: number }>(
    `SELECT DISTINCT budget_year AS year FROM budgets
     WHERE tenant_id = $1
     ORDER BY budget_year DESC`,
    [tenantId]
  );
}

// ── Delete a single budget row ────────────────────────────────────────────────

export async function deleteBudget(tenantId: string, budgetId: string) {
  await query(
    `DELETE FROM budgets WHERE id = $1 AND tenant_id = $2`,
    [budgetId, tenantId]
  );
}

// ── Monthly financial report ──────────────────────────────────────────────────

export async function getMonthlyReport(params: {
  tenantId: string;
  year:  number;
  month: number;       // 1-12
}) {
  const { tenantId, year, month } = params;

  const pad   = (n: number) => String(n).padStart(2, '0');
  const from  = `${year}-${pad(month)}-01`;
  // Last day of month via next month minus 1 in Postgres
  const to    = `${year}-${pad(month)}-01`; // we'll use date_trunc in SQL

  // Previous month boundaries
  const prevMonth     = month === 1 ? 12 : month - 1;
  const prevYear      = month === 1 ? year - 1 : year;
  const prevFrom      = `${prevYear}-${pad(prevMonth)}-01`;

  // Income this month
  const [feeInc] = await query<{ total: string }>(
    `SELECT COALESCE(SUM(fp.amount),0)::text AS total
     FROM fee_payments fp
     WHERE fp.tenant_id = $1
       AND date_trunc('month', fp.payment_date::date) = date_trunc('month', $2::date)`,
    [tenantId, from]
  );

  const [otherInc] = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount),0)::text AS total
     FROM other_income
     WHERE tenant_id = $1
       AND date_trunc('month', income_date) = date_trunc('month', $2::date)`,
    [tenantId, from]
  );

  // Expenses this month
  const [expTotal] = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount),0)::text AS total
     FROM expenses
     WHERE tenant_id = $1
       AND date_trunc('month', expense_date) = date_trunc('month', $2::date)`,
    [tenantId, from]
  );

  const expBreakdown = await query<{ category_name: string; total: string }>(
    `SELECT ec.category_name, COALESCE(SUM(e.amount),0)::text AS total
     FROM expenses e
     JOIN expense_categories ec ON ec.id = e.expense_category_id
     WHERE e.tenant_id = $1
       AND date_trunc('month', e.expense_date) = date_trunc('month', $2::date)
     GROUP BY ec.category_name ORDER BY SUM(e.amount) DESC`,
    [tenantId, from]
  );

  // Previous month totals
  const [prevFeeInc] = await query<{ total: string }>(
    `SELECT COALESCE(SUM(fp.amount),0)::text AS total
     FROM fee_payments fp
     WHERE fp.tenant_id = $1
       AND date_trunc('month', fp.payment_date::date) = date_trunc('month', $2::date)`,
    [tenantId, prevFrom]
  );

  const [prevExp] = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount),0)::text AS total
     FROM expenses
     WHERE tenant_id = $1
       AND date_trunc('month', expense_date) = date_trunc('month', $2::date)`,
    [tenantId, prevFrom]
  );

  const [prevOtherInc] = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount),0)::text AS total
     FROM other_income
     WHERE tenant_id = $1
       AND date_trunc('month', income_date) = date_trunc('month', $2::date)`,
    [tenantId, prevFrom]
  );

  const totalInc  = Number(feeInc?.total    ?? 0) + Number(otherInc?.total    ?? 0);
  const totalExp  = Number(expTotal?.total   ?? 0);
  const prevInc   = Number(prevFeeInc?.total ?? 0) + Number(prevOtherInc?.total ?? 0);
  const prevExpN  = Number(prevExp?.total    ?? 0);

  return {
    period: { year, month },
    income: {
      total:        totalInc,
      fee_payments: Number(feeInc?.total   ?? 0),
      other:        Number(otherInc?.total ?? 0)
    },
    expenses: {
      total:     totalExp,
      breakdown: expBreakdown.map((b) => ({ category: b.category_name, amount: Number(b.total) }))
    },
    net_profit: totalInc - totalExp,
    comparison_previous_month: {
      income_change:  totalInc - prevInc,
      expense_change: totalExp - prevExpN,
      prev_income:    prevInc,
      prev_expenses:  prevExpN
    }
  };
}

// ── Yearly financial report ────────────────────────────────────────────────────

export async function getYearlyReport(params: {
  tenantId: string;
  year:     number;
}) {
  const { tenantId, year } = params;

  // Month-by-month income & expenses (12 rows guaranteed)
  const monthlyData = await query<{
    month: number; fee_income: string; other_income: string; expenses: string;
  }>(
    `SELECT
       gs.m                                        AS month,
       COALESCE(fi.total, 0)::text                  AS fee_income,
       COALESCE(oi.total, 0)::text                  AS other_income,
       COALESCE(ex.total, 0)::text                  AS expenses
     FROM generate_series(1, 12) AS gs(m)
     LEFT JOIN (
       SELECT EXTRACT(MONTH FROM payment_date)::int AS m,
              SUM(amount) AS total
       FROM fee_payments
       WHERE tenant_id = $1
         AND EXTRACT(YEAR FROM payment_date) = $2
       GROUP BY m
     ) fi ON fi.m = gs.m
     LEFT JOIN (
       SELECT EXTRACT(MONTH FROM income_date)::int AS m,
              SUM(amount) AS total
       FROM other_income
       WHERE tenant_id = $1
         AND EXTRACT(YEAR FROM income_date) = $2
       GROUP BY m
     ) oi ON oi.m = gs.m
     LEFT JOIN (
       SELECT EXTRACT(MONTH FROM expense_date)::int AS m,
              SUM(amount) AS total
       FROM expenses
       WHERE tenant_id = $1
         AND EXTRACT(YEAR FROM expense_date) = $2
       GROUP BY m
     ) ex ON ex.m = gs.m
     ORDER BY gs.m`,
    [tenantId, year]
  );

  const months = monthlyData.map((row) => {
    const income   = Number(row.fee_income) + Number(row.other_income);
    const expenses = Number(row.expenses);
    return {
      month:      row.month,
      income,
      expenses,
      net_profit: income - expenses
    };
  });

  const totalInc = months.reduce((s, m) => s + m.income, 0);
  const totalExp = months.reduce((s, m) => s + m.expenses, 0);

  return {
    year,
    summary: {
      total_income:   totalInc,
      total_expenses: totalExp,
      net_profit:     totalInc - totalExp,
      profit_margin:  totalInc > 0 ? Math.round((totalInc - totalExp) / totalInc * 100 * 10) / 10 : 0
    },
    monthly: months
  };
}
