import { query } from '../../db/client.js';
import { calculateGstAmount, getTaxSettings } from '../finance/tax.repository.js';

// ── Expense Categories ────────────────────────────────────────────────────────

export async function createExpenseCategory(params: {
  tenantId: string;
  categoryName: string;
  categoryType: 'fixed' | 'variable';
  parentCategoryId?: string | null;
}) {
  const rows = await query<{ id: string }>(
    `INSERT INTO expense_categories (tenant_id, category_name, category_type, parent_category_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [params.tenantId, params.categoryName, params.categoryType, params.parentCategoryId ?? null]
  );
  return rows[0];
}

export async function listExpenseCategories(tenantId: string) {
  return query(
    `SELECT
       ec.*,
       parent.category_name AS parent_name,
       COUNT(e.id)::int AS expense_count,
       COALESCE(SUM(e.amount), 0)::numeric AS total_spent
     FROM expense_categories ec
     LEFT JOIN expense_categories parent ON parent.id = ec.parent_category_id
     LEFT JOIN expenses e ON e.expense_category_id = ec.id AND e.tenant_id = ec.tenant_id
     WHERE ec.tenant_id = $1
     GROUP BY ec.id, parent.category_name
     ORDER BY ec.category_name`,
    [tenantId]
  );
}

export async function findExpenseCategoryById(tenantId: string, categoryId: string) {
  const rows = await query(
    `SELECT ec.*, parent.category_name AS parent_name
     FROM expense_categories ec
     LEFT JOIN expense_categories parent ON parent.id = ec.parent_category_id
     WHERE ec.id = $1 AND ec.tenant_id = $2`,
    [categoryId, tenantId]
  );
  return rows[0] ?? null;
}

export async function updateExpenseCategory(params: {
  tenantId: string;
  categoryId: string;
  categoryName?: string;
  categoryType?: string;
  parentCategoryId?: string | null;
}) {
  const rows = await query(
    `UPDATE expense_categories SET
       category_name      = COALESCE($3, category_name),
       category_type      = COALESCE($4::expense_cat_type, category_type),
       parent_category_id = CASE WHEN $5::text = '__clear__' THEN NULL
                                 WHEN $5::uuid IS NOT NULL THEN $5::uuid
                                 ELSE parent_category_id END,
       updated_at         = NOW()
     WHERE id = $1 AND tenant_id = $2
     RETURNING *`,
    [
      params.categoryId, params.tenantId,
      params.categoryName ?? null,
      params.categoryType ?? null,
      params.parentCategoryId === null ? '__clear__' : (params.parentCategoryId ?? null)
    ]
  );
  return rows[0] ?? null;
}

export async function deleteExpenseCategory(tenantId: string, categoryId: string) {
  // Prevent deletion if expenses exist for this category
  const [{ count }] = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM expenses WHERE expense_category_id = $1 AND tenant_id = $2`,
    [categoryId, tenantId]
  );
  if (Number(count) > 0) {
    throw new Error(`Cannot delete: ${count} expense(s) are assigned to this category`);
  }
  await query(
    `DELETE FROM expense_categories WHERE id = $1 AND tenant_id = $2`,
    [categoryId, tenantId]
  );
}

// ── Expenses ──────────────────────────────────────────────────────────────────

export async function createExpense(params: {
  tenantId: string;
  expenseCategoryId: string;
  amount: number;
  expenseDate: string;
  description?: string;
  paymentMode: string;
  vendorName?: string;
  receiptUrl?: string;
  recordedBy: string;
  isRecurring: boolean;
  recurrenceFrequency?: string | null;
}) {
  const taxSettings = await getTaxSettings(params.tenantId);
  const gstAmount = calculateGstAmount(params.amount, taxSettings.tax_rate, taxSettings.tax_regime);
  const rows = await query(
    `INSERT INTO expenses
       (tenant_id, expense_category_id, amount, expense_date, description,
        payment_mode, vendor_name, receipt_url, recorded_by, is_recurring, recurrence_frequency, gst_amount)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      params.tenantId, params.expenseCategoryId, params.amount, params.expenseDate,
      params.description ?? null, params.paymentMode,
      params.vendorName ?? null, params.receiptUrl ?? null,
      params.recordedBy, params.isRecurring,
      params.recurrenceFrequency ?? null,
      gstAmount
    ]
  );
  return rows[0];
}

export async function listExpenses(params: {
  tenantId: string;
  categoryId?: string;
  paymentMode?: string;
  from?: string;
  to?: string;
  isRecurring?: boolean;
  page: number;
  limit: number;
}) {
  const { tenantId, categoryId, paymentMode, from, to, isRecurring, page, limit } = params;
  const offset = (page - 1) * limit;

  const conditions: string[] = ['e.tenant_id = $1'];
  const values: unknown[]    = [tenantId];
  let idx = 2;

  if (categoryId)            { conditions.push(`e.expense_category_id = $${idx++}`); values.push(categoryId); }
  if (paymentMode)           { conditions.push(`e.payment_mode = $${idx++}`);         values.push(paymentMode); }
  if (from)                  { conditions.push(`e.expense_date >= $${idx++}`);        values.push(from); }
  if (to)                    { conditions.push(`e.expense_date <= $${idx++}`);        values.push(to); }
  if (isRecurring !== undefined) { conditions.push(`e.is_recurring = $${idx++}`);    values.push(isRecurring); }

  const where = conditions.join(' AND ');

  const rows = await query(
    `SELECT
       e.*,
       ec.category_name,
       ec.category_type,
       u.full_name AS recorded_by_name
     FROM expenses e
     JOIN expense_categories ec ON ec.id = e.expense_category_id
     LEFT JOIN users u ON u.id = e.recorded_by
     WHERE ${where}
     ORDER BY e.expense_date DESC, e.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset]
  );

  const [{ count }] = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM expenses e WHERE ${where}`,
    values
  );

  // Summary totals for the filtered result set
  const [summary] = await query<{ total: string; avg: string }>(
    `SELECT
       COALESCE(SUM(e.amount),0)::text AS total,
       COALESCE(AVG(e.amount),0)::text AS avg
     FROM expenses e WHERE ${where}`,
    values
  );

  // Breakdown by category
  const breakdown = await query(
    `SELECT ec.category_name, COALESCE(SUM(e.amount),0)::text AS total
     FROM expenses e
     JOIN expense_categories ec ON ec.id = e.expense_category_id
     WHERE ${where}
     GROUP BY ec.category_name
     ORDER BY SUM(e.amount) DESC`,
    values
  );

  return {
    rows,
    total:    Number(count),
    summary: {
      total:     Number(summary?.total ?? 0),
      average:   Number(summary?.avg   ?? 0),
      breakdown: breakdown.map((b: any) => ({
        category: b.category_name,
        amount:   Number(b.total)
      }))
    }
  };
}

export async function getExpenseById(tenantId: string, expenseId: string) {
  const rows = await query(
    `SELECT e.*, ec.category_name, ec.category_type, u.full_name AS recorded_by_name
     FROM expenses e
     JOIN expense_categories ec ON ec.id = e.expense_category_id
     LEFT JOIN users u ON u.id = e.recorded_by
     WHERE e.id = $1 AND e.tenant_id = $2`,
    [expenseId, tenantId]
  );
  return rows[0] ?? null;
}

export async function updateExpense(params: {
  tenantId: string;
  expenseId: string;
  expenseCategoryId?: string;
  amount?: number;
  expenseDate?: string;
  description?: string;
  paymentMode?: string;
  vendorName?: string;
  receiptUrl?: string;
  isRecurring?: boolean;
  recurrenceFrequency?: string | null;
}) {
  const {
    tenantId, expenseId, expenseCategoryId, amount, expenseDate,
    description, paymentMode, vendorName, receiptUrl, isRecurring, recurrenceFrequency
  } = params;

  const currentRows = await query<{ amount: string }>(
    `SELECT amount FROM expenses WHERE id = $1 AND tenant_id = $2 LIMIT 1`,
    [expenseId, tenantId]
  );
  const currentAmount = Number(currentRows[0]?.amount ?? 0);
  const nextAmount = amount ?? currentAmount;
  const taxSettings = await getTaxSettings(tenantId);
  const gstAmount = calculateGstAmount(nextAmount, taxSettings.tax_rate, taxSettings.tax_regime);

  const rows = await query(
    `UPDATE expenses SET
       expense_category_id = COALESCE($3::uuid, expense_category_id),
       amount               = COALESCE($4, amount),
       expense_date         = COALESCE($5::date, expense_date),
       description          = COALESCE($6, description),
       payment_mode         = COALESCE($7::expense_payment_mode, payment_mode),
       vendor_name          = COALESCE($8, vendor_name),
       receipt_url          = COALESCE($9, receipt_url),
       is_recurring         = COALESCE($10, is_recurring),
       recurrence_frequency = COALESCE($11::recurrence_frequency, recurrence_frequency),
       gst_amount           = $12,
       updated_at           = NOW()
     WHERE id = $1 AND tenant_id = $2
     RETURNING *`,
    [
      expenseId, tenantId,
      expenseCategoryId ?? null, amount ?? null,
      expenseDate ?? null, description ?? null,
      paymentMode ?? null, vendorName ?? null,
      receiptUrl ?? null, isRecurring ?? null,
      recurrenceFrequency ?? null,
      gstAmount
    ]
  );
  return rows[0] ?? null;
}

export async function deleteExpense(tenantId: string, expenseId: string) {
  await query(
    `DELETE FROM expenses WHERE id = $1 AND tenant_id = $2`,
    [expenseId, tenantId]
  );
}

// ── Expense Summary (for dashboard widgets) ──────────────────────────────────

export async function getExpenseSummary(tenantId: string) {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const today      = now.toISOString().slice(0, 10);
  const yearStart  = `${now.getFullYear()}-01-01`;

  const [monthTotal] = await query<{ total: string; count: string }>(
    `SELECT COALESCE(SUM(amount),0)::text AS total, COUNT(*)::text AS count
     FROM expenses WHERE tenant_id = $1 AND expense_date BETWEEN $2 AND $3`,
    [tenantId, monthStart, today]
  );
  const [yearTotal] = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount),0)::text AS total
     FROM expenses WHERE tenant_id = $1 AND expense_date BETWEEN $2 AND $3`,
    [tenantId, yearStart, today]
  );
  const topCategories = await query(
    `SELECT ec.category_name, COALESCE(SUM(e.amount),0)::numeric AS total
     FROM expenses e JOIN expense_categories ec ON ec.id = e.expense_category_id
     WHERE e.tenant_id = $1 AND e.expense_date BETWEEN $2 AND $3
     GROUP BY ec.category_name ORDER BY total DESC LIMIT 5`,
    [tenantId, monthStart, today]
  );
  const recurringTotal = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount),0)::text AS total
     FROM expenses WHERE tenant_id = $1 AND is_recurring = TRUE`,
    [tenantId]
  );

  return {
    thisMonth: {
      total: Number(monthTotal?.total ?? 0),
      count: Number(monthTotal?.count ?? 0)
    },
    thisYear:       { total: Number(yearTotal?.total ?? 0) },
    recurringTotal: { total: Number(recurringTotal[0]?.total ?? 0) },
    topCategories:  topCategories.map((c: any) => ({
      category: c.category_name,
      amount:   Number(c.total)
    }))
  };
}
