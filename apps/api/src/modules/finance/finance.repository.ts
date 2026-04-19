import { query } from '../../db/client.js';

// ── Other Income ──────────────────────────────────────────────────────────────

export async function createOtherIncome(params: {
  tenantId:    string;
  sourceName:  string;
  amount:      number;
  incomeDate:  string;
  description?: string;
  recordedBy:  string;
}) {
  const rows = await query(
    `INSERT INTO other_income (tenant_id, source_name, amount, income_date, description, recorded_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      params.tenantId, params.sourceName, params.amount,
      params.incomeDate, params.description ?? null, params.recordedBy
    ]
  );
  return rows[0];
}

export async function listOtherIncome(params: {
  tenantId: string;
  from?:    string;
  to?:      string;
  page:     number;
  limit:    number;
}) {
  const { tenantId, from, to, page, limit } = params;
  const offset = (page - 1) * limit;

  const conditions: string[] = ['tenant_id = $1'];
  const values: unknown[]    = [tenantId];
  let idx = 2;

  if (from) { conditions.push(`income_date >= $${idx++}`); values.push(from); }
  if (to)   { conditions.push(`income_date <= $${idx++}`); values.push(to); }

  const where = conditions.join(' AND ');

  const rows = await query(
    `SELECT oi.*, u.full_name AS recorded_by_name
     FROM other_income oi
     LEFT JOIN users u ON u.id = oi.recorded_by
     WHERE ${where}
     ORDER BY oi.income_date DESC, oi.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset]
  );

  const [{ count }] = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM other_income WHERE ${where}`,
    values
  );

  return { rows, total: Number(count) };
}

export async function getOtherIncomeById(tenantId: string, id: string) {
  const rows = await query(
    `SELECT oi.*, u.full_name AS recorded_by_name
     FROM other_income oi
     LEFT JOIN users u ON u.id = oi.recorded_by
     WHERE oi.id = $1 AND oi.tenant_id = $2`,
    [id, tenantId]
  );
  return rows[0] ?? null;
}

export async function updateOtherIncome(params: {
  tenantId:    string;
  id:          string;
  sourceName?: string;
  amount?:     number;
  incomeDate?: string;
  description?: string;
}) {
  const rows = await query(
    `UPDATE other_income SET
       source_name  = COALESCE($3, source_name),
       amount       = COALESCE($4, amount),
       income_date  = COALESCE($5::date, income_date),
       description  = COALESCE($6, description),
       updated_at   = NOW()
     WHERE id = $1 AND tenant_id = $2
     RETURNING *`,
    [
      params.id, params.tenantId,
      params.sourceName  ?? null,
      params.amount      ?? null,
      params.incomeDate  ?? null,
      params.description ?? null
    ]
  );
  return rows[0] ?? null;
}

export async function deleteOtherIncome(tenantId: string, id: string) {
  await query(
    `DELETE FROM other_income WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );
}

// ── Profit & Loss ─────────────────────────────────────────────────────────────

export async function getProfitLoss(params: {
  tenantId: string;
  from:     string;
  to:       string;
}) {
  const { tenantId, from, to } = params;

  // Fee income
  const [feeIncome] = await query<{ total: string }>(
    `SELECT COALESCE(SUM(fp.amount), 0)::text AS total
     FROM fee_payments fp
     WHERE fp.tenant_id = $1 AND fp.payment_date BETWEEN $2 AND $3`,
    [tenantId, from, to]
  );

  // Other income
  const [otherIncome] = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0)::text AS total
     FROM other_income
     WHERE tenant_id = $1 AND income_date BETWEEN $2 AND $3`,
    [tenantId, from, to]
  );

  // Total expenses
  const [totalExpense] = await query<{ total: string }>(
    `SELECT COALESCE(SUM(e.amount), 0)::text AS total
     FROM expenses e
     WHERE e.tenant_id = $1 AND e.expense_date BETWEEN $2 AND $3`,
    [tenantId, from, to]
  );

  // Expense breakdown by category
  const expenseBreakdown = await query<{ category_name: string; total: string }>(
    `SELECT ec.category_name, COALESCE(SUM(e.amount), 0)::text AS total
     FROM expenses e
     JOIN expense_categories ec ON ec.id = e.expense_category_id
     WHERE e.tenant_id = $1 AND e.expense_date BETWEEN $2 AND $3
     GROUP BY ec.category_name
     ORDER BY SUM(e.amount) DESC`,
    [tenantId, from, to]
  );

  const feeTotal   = Number(feeIncome?.total   ?? 0);
  const otherTotal = Number(otherIncome?.total  ?? 0);
  const expTotal   = Number(totalExpense?.total ?? 0);
  const totalInc   = feeTotal + otherTotal;
  const netProfit  = totalInc - expTotal;
  const margin     = totalInc > 0 ? Math.round((netProfit / totalInc) * 100 * 100) / 100 : 0;

  return {
    period:            { from, to },
    total_income:      totalInc,
    income_breakdown:  {
      fee_payments: feeTotal,
      other_income: otherTotal
    },
    total_expenses:    expTotal,
    expense_breakdown: expenseBreakdown.reduce((acc: Record<string, number>, row) => {
      acc[row.category_name] = Number(row.total);
      return acc;
    }, {}),
    net_profit:        netProfit,
    profit_margin:     margin
  };
}

// ── Balance Sheet ─────────────────────────────────────────────────────────────

export async function getBalanceSheet(params: {
  tenantId: string;
  asOf:     string;   // date string, defaults to today
}) {
  const { tenantId, asOf } = params;

  // Cash collected (all fee payments to date)
  const [cashCollected] = await query<{ total: string }>(
    `SELECT COALESCE(SUM(fp.amount), 0)::text AS total
     FROM fee_payments fp
     WHERE fp.tenant_id = $1 AND fp.payment_date <= $2`,
    [tenantId, asOf]
  );

  // Other income collected to date
  const [otherInc] = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0)::text AS total
     FROM other_income
     WHERE tenant_id = $1 AND income_date <= $2`,
    [tenantId, asOf]
  );

  // Total expenses paid to date
  const [totalExpPaid] = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0)::text AS total
     FROM expenses
     WHERE tenant_id = $1 AND expense_date <= $2`,
    [tenantId, asOf]
  );

  // Receivables: pending fee amounts (due_amount for pending/partially_paid)
  const [receivables] = await query<{ total: string }>(
    `SELECT COALESCE(SUM(due_amount), 0)::text AS total
     FROM student_fees
     WHERE tenant_id = $1 AND status IN ('pending','partially_paid','overdue')`,
    [tenantId]
  );

  const cashIn    = Number(cashCollected?.total  ?? 0);
  const otherIn   = Number(otherInc?.total       ?? 0);
  const expPaid   = Number(totalExpPaid?.total   ?? 0);
  const receiv    = Number(receivables?.total    ?? 0);

  // Cash in hand / bank = total income received - expenses paid
  const cashBalance = cashIn + otherIn - expPaid;

  // Assets
  const totalAssets = cashBalance + receiv;

  // Liabilities: we don't track loans in DB yet, so 0 with a note
  const totalLiabilities = 0;

  // Equity = Assets - Liabilities
  const equity = totalAssets - totalLiabilities;

  return {
    as_of: asOf,
    assets: {
      cash_and_bank:  cashBalance,
      receivables:    receiv,
      total:          totalAssets
    },
    liabilities: {
      loans:   0,
      payables: 0,
      total:   totalLiabilities
    },
    equity: {
      owners_equity: equity,
      total:         equity
    }
  };
}

// ── GST Report ────────────────────────────────────────────────────────────────

export async function getGstReport(params: {
  tenantId: string;
  from: string;
  to: string;
}) {
  const { tenantId, from, to } = params;

  const [taxSettings] = await query<{
    gst_number: string | null;
    tax_rate: string;
    tax_regime: 'gst' | 'vat' | 'none';
  }>(
    `SELECT gst_number, tax_rate, tax_regime
     FROM tax_settings
     WHERE tenant_id = $1
     LIMIT 1`,
    [tenantId]
  );

  const [collected] = await query<{ total: string }>(
    `SELECT COALESCE(SUM(gst_amount), 0)::text AS total
     FROM fee_payments
     WHERE tenant_id = $1
       AND payment_date BETWEEN $2 AND $3`,
    [tenantId, from, to]
  );

  const [paid] = await query<{ total: string }>(
    `SELECT COALESCE(SUM(gst_amount), 0)::text AS total
     FROM expenses
     WHERE tenant_id = $1
       AND expense_date BETWEEN $2 AND $3`,
    [tenantId, from, to]
  );

  const outwardSupplies = await query<{
    invoice_number: string | null;
    receipt_number: string;
    payment_date: string;
    taxable_value: string;
    gst_amount: string;
  }>(
    `SELECT
       invoice_number,
       receipt_number,
       payment_date::text,
       amount::text AS taxable_value,
       gst_amount::text
     FROM fee_payments
     WHERE tenant_id = $1
       AND payment_date BETWEEN $2 AND $3
     ORDER BY payment_date, created_at`,
    [tenantId, from, to]
  );

  const inputTaxEntries = await query<{
    expense_id: string;
    expense_date: string;
    category_name: string;
    taxable_value: string;
    gst_amount: string;
  }>(
    `SELECT
       e.id AS expense_id,
       e.expense_date::text,
       ec.category_name,
       e.amount::text AS taxable_value,
       e.gst_amount::text
     FROM expenses e
     JOIN expense_categories ec ON ec.id = e.expense_category_id
     WHERE e.tenant_id = $1
       AND e.expense_date BETWEEN $2 AND $3
     ORDER BY e.expense_date, e.created_at`,
    [tenantId, from, to]
  );

  const gstCollected = Number(collected?.total ?? 0);
  const gstPaid = Number(paid?.total ?? 0);

  return {
    period: { from, to },
    tax_settings: {
      gst_number: taxSettings?.gst_number ?? null,
      tax_rate: Number(taxSettings?.tax_rate ?? 0),
      tax_regime: taxSettings?.tax_regime ?? 'none'
    },
    gst_collected: gstCollected,
    gst_paid: gstPaid,
    net_gst_payable: gstCollected - gstPaid,
    gstr_format_data: {
      gstr1_outward_supplies: outwardSupplies.map((row) => ({
        invoice_number: row.invoice_number ?? row.receipt_number,
        date: row.payment_date,
        taxable_value: Number(row.taxable_value),
        gst_amount: Number(row.gst_amount)
      })),
      gstr3b_itc: inputTaxEntries.map((row) => ({
        ref_id: row.expense_id,
        date: row.expense_date,
        category: row.category_name,
        taxable_value: Number(row.taxable_value),
        gst_amount: Number(row.gst_amount)
      }))
    }
  };
}

function xmlEscape(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

// ── Tally Export ──────────────────────────────────────────────────────────────

export async function getTallyExport(params: {
  tenantId: string;
  from: string;
  to: string;
  format: 'xml' | 'excel';
}) {
  const { tenantId, from, to, format } = params;

  const incomeEntries = await query<{
    source: string;
    ref_no: string;
    date: string;
    amount: string;
    gst_amount: string;
    description: string;
  }>(
    `SELECT
       'fee_payment'::text AS source,
       COALESCE(fp.invoice_number, fp.receipt_number) AS ref_no,
       fp.payment_date::text AS date,
       fp.amount::text AS amount,
       fp.gst_amount::text AS gst_amount,
       COALESCE(sf.id::text, '') AS description
     FROM fee_payments fp
     JOIN student_fees sf ON sf.id = fp.student_fee_id
     WHERE fp.tenant_id = $1
       AND fp.payment_date BETWEEN $2 AND $3
     UNION ALL
     SELECT
       'other_income'::text AS source,
       oi.id::text AS ref_no,
       oi.income_date::text AS date,
       oi.amount::text AS amount,
       '0'::text AS gst_amount,
       COALESCE(oi.source_name, '') AS description
     FROM other_income oi
     WHERE oi.tenant_id = $1
       AND oi.income_date BETWEEN $2 AND $3
     ORDER BY date, ref_no`,
    [tenantId, from, to]
  );

  const expenseEntries = await query<{
    expense_id: string;
    date: string;
    amount: string;
    gst_amount: string;
    category_name: string;
    description: string | null;
  }>(
    `SELECT
       e.id AS expense_id,
       e.expense_date::text AS date,
       e.amount::text AS amount,
       e.gst_amount::text AS gst_amount,
       ec.category_name,
       e.description
     FROM expenses e
     JOIN expense_categories ec ON ec.id = e.expense_category_id
     WHERE e.tenant_id = $1
       AND e.expense_date BETWEEN $2 AND $3
     ORDER BY e.expense_date, e.id`,
    [tenantId, from, to]
  );

  if (format === 'excel') {
    const lines = [
      'type,ref_no,date,amount,gst_amount,ledger,description',
      ...incomeEntries.map((entry) =>
        `income,${entry.ref_no},${entry.date},${entry.amount},${entry.gst_amount},Income,${(entry.description ?? '').replaceAll(',', ' ')}`
      ),
      ...expenseEntries.map((entry) =>
        `expense,${entry.expense_id},${entry.date},${entry.amount},${entry.gst_amount},${entry.category_name.replaceAll(',', ' ')},${(entry.description ?? '').replaceAll(',', ' ')}`
      )
    ];

    return {
      contentType: 'application/vnd.ms-excel',
      filename: `tally-export-${from}-to-${to}.xls`,
      body: lines.join('\n')
    };
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<ENVELOPE>',
    '  <HEADER>',
    '    <TALLYREQUEST>Import Data</TALLYREQUEST>',
    '  </HEADER>',
    '  <BODY>',
    '    <IMPORTDATA>',
    '      <REQUESTDATA>',
    '        <TALLYMESSAGE xmlns:UDF="TallyUDF">',
    '          <VOUCHERS>'
  ];

  for (const entry of incomeEntries) {
    xml.push(
      `            <VOUCHER TYPE="Receipt">`,
      `              <DATE>${xmlEscape(entry.date)}</DATE>`,
      `              <REFERENCE>${xmlEscape(entry.ref_no)}</REFERENCE>`,
      `              <LEDGERNAME>Income</LEDGERNAME>`,
      `              <AMOUNT>${xmlEscape(entry.amount)}</AMOUNT>`,
      `              <GSTAMOUNT>${xmlEscape(entry.gst_amount)}</GSTAMOUNT>`,
      `              <NARRATION>${xmlEscape(entry.description ?? '')}</NARRATION>`,
      `            </VOUCHER>`
    );
  }

  for (const entry of expenseEntries) {
    xml.push(
      `            <VOUCHER TYPE="Payment">`,
      `              <DATE>${xmlEscape(entry.date)}</DATE>`,
      `              <REFERENCE>${xmlEscape(entry.expense_id)}</REFERENCE>`,
      `              <LEDGERNAME>${xmlEscape(entry.category_name)}</LEDGERNAME>`,
      `              <AMOUNT>${xmlEscape(entry.amount)}</AMOUNT>`,
      `              <GSTAMOUNT>${xmlEscape(entry.gst_amount)}</GSTAMOUNT>`,
      `              <NARRATION>${xmlEscape(entry.description ?? '')}</NARRATION>`,
      `            </VOUCHER>`
    );
  }

  xml.push(
    '          </VOUCHERS>',
    '        </TALLYMESSAGE>',
    '      </REQUESTDATA>',
    '    </IMPORTDATA>',
    '  </BODY>',
    '</ENVELOPE>'
  );

  return {
    contentType: 'application/xml',
    filename: `tally-export-${from}-to-${to}.xml`,
    body: xml.join('\n')
  };
}
