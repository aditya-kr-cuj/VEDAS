import type { PoolClient } from 'pg';
import { query, withTransaction } from '../../db/client.js';
import { HttpError } from '../../utils/http-error.js';
import { calculateGstAmount, getTaxSettings } from '../finance/tax.repository.js';

export interface PaymentRecord {
  id: string;
  tenant_id: string;
  student_fee_id: string;
  amount: string;
  gst_amount: string;
  invoice_number: string | null;
  payment_date: string;
  payment_mode: string;
  transaction_id: string | null;
  receipt_number: string;
  collected_by: string | null;
  remarks: string | null;
  created_at: Date;
  updated_at: Date;
}

function generateReceiptNumber() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');
  return `RCPT-${y}${m}${d}-${rand}`;
}

function getFinancialYearLabel(dateString: string, financialYearStartMonth: number) {
  const date = new Date(dateString);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const startYear = month >= financialYearStartMonth ? year : year - 1;
  const endYearShort = String((startYear + 1) % 100).padStart(2, '0');
  return `${startYear}-${endYearShort}`;
}

async function generateInvoiceNumber(params: {
  client: PoolClient;
  tenantId: string;
  paymentDate: string;
  financialYearStartMonth: number;
}) {
  const fyLabel = getFinancialYearLabel(params.paymentDate, params.financialYearStartMonth);
  const prefix = `INV-${fyLabel}-`;

  await params.client.query(
    `SELECT pg_advisory_xact_lock(hashtext($1))`,
    [`invoice:${params.tenantId}:${fyLabel}`]
  );

  const latestRows = await params.client.query<{ invoice_number: string }>(
    `SELECT invoice_number
     FROM fee_payments
     WHERE tenant_id = $1
       AND invoice_number LIKE $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [params.tenantId, `${prefix}%`]
  );
  const latest = latestRows.rows[0];

  let nextNumber = 1;
  if (latest?.invoice_number) {
    const tail = latest.invoice_number.split('-').pop();
    const parsed = Number(tail);
    if (Number.isFinite(parsed)) nextNumber = parsed + 1;
  }

  return `${prefix}${String(nextNumber).padStart(5, '0')}`;
}

export async function recordPayment(payload: {
  tenantId: string;
  studentId: string;
  studentFeeId: string;
  amount: number;
  paymentMode: string;
  paymentDate: string;
  transactionId?: string;
  remarks?: string;
  collectedBy?: string;
}) {
  return withTransaction(async (client) => {
    const fees = await client.query<{
      id: string;
      total_amount: string;
      paid_amount: string;
      due_amount: string;
      status: string;
      student_id: string;
    }>(
      `SELECT * FROM student_fees WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
      [payload.tenantId, payload.studentFeeId]
    );
    const fee = fees.rows[0];
    if (!fee || fee.student_id !== payload.studentId) {
      throw new HttpError(404, 'Student fee record not found');
    }

    const receiptNumber = generateReceiptNumber();
    const taxSettings = await getTaxSettings(payload.tenantId);
    const gstAmount = calculateGstAmount(payload.amount, taxSettings.tax_rate, taxSettings.tax_regime);
    const invoiceNumber = await generateInvoiceNumber({
      client,
      tenantId: payload.tenantId,
      paymentDate: payload.paymentDate,
      financialYearStartMonth: taxSettings.financial_year_start_month
    });
    const paymentRows = await client.query<PaymentRecord>(
      `
        INSERT INTO fee_payments (
          tenant_id, student_fee_id, amount, gst_amount, invoice_number, payment_date, payment_mode, transaction_id, receipt_number, collected_by, remarks
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING *
      `,
      [
        payload.tenantId,
        payload.studentFeeId,
        payload.amount,
        gstAmount,
        invoiceNumber,
        payload.paymentDate,
        payload.paymentMode,
        payload.transactionId ?? null,
        receiptNumber,
        payload.collectedBy ?? null,
        payload.remarks ?? null
      ]
    );

    const paid = Number(fee.paid_amount) + payload.amount;
    const total = Number(fee.total_amount);
    const due = Math.max(total - paid, 0);
    let status = 'partially_paid';
    if (due === 0) status = 'paid';
    if (paid === 0) status = 'pending';

    await client.query(
      `
        UPDATE student_fees
        SET paid_amount = $1, due_amount = $2, status = $3, updated_at = NOW()
        WHERE id = $4 AND tenant_id = $5
      `,
      [paid, due, status, payload.studentFeeId, payload.tenantId]
    );

    return { payment: paymentRows.rows[0], fee: { total, paid, due, status } };
  });
}

export async function listPaymentsForStudent(payload: {
  tenantId: string;
  studentId: string;
}) {
  return query<PaymentRecord>(
    `
      SELECT p.*
      FROM fee_payments p
      JOIN student_fees sf ON sf.id = p.student_fee_id
      WHERE p.tenant_id = $1 AND sf.student_id = $2
      ORDER BY p.payment_date DESC, p.created_at DESC
    `,
    [payload.tenantId, payload.studentId]
  );
}

export async function findPaymentById(payload: { tenantId: string; paymentId: string }) {
  const rows = await query<PaymentRecord>(
    `SELECT * FROM fee_payments WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
    [payload.tenantId, payload.paymentId]
  );
  return rows[0] ?? null;
}

export async function getReceiptDetails(payload: { tenantId: string; paymentId: string }) {
  const rows = await query<{
    payment_id: string;
    invoice_number: string | null;
    receipt_number: string;
    amount: string;
    gst_amount: string;
    payment_date: string;
    payment_mode: string;
    transaction_id: string | null;
    remarks: string | null;
    student_fee_id: string;
    total_amount: string;
    paid_amount: string;
    due_amount: string;
    student_id: string;
    student_name: string;
    student_email: string;
    institute_name: string;
    institute_email: string;
  }>(
    `
      SELECT
        p.id AS payment_id,
        p.invoice_number,
        p.receipt_number,
        p.amount,
        p.gst_amount,
        p.payment_date,
        p.payment_mode,
        p.transaction_id,
        p.remarks,
        sf.id AS student_fee_id,
        sf.total_amount,
        sf.paid_amount,
        sf.due_amount,
        s.id AS student_id,
        u.full_name AS student_name,
        u.email AS student_email,
        t.name AS institute_name,
        t.owner_email AS institute_email
      FROM fee_payments p
      JOIN student_fees sf ON sf.id = p.student_fee_id
      JOIN students s ON s.id = sf.student_id
      JOIN users u ON u.id = s.user_id
      JOIN tenants t ON t.id = sf.tenant_id
      WHERE p.tenant_id = $1 AND p.id = $2
      LIMIT 1
    `,
    [payload.tenantId, payload.paymentId]
  );

  return rows[0] ?? null;
}
