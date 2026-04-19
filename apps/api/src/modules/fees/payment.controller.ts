import type { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { HttpError } from '../../utils/http-error.js';
import { findPaymentById, getReceiptDetails, listPaymentsForStudent, recordPayment } from './payment.repository.js';

export async function recordPaymentHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const result = await recordPayment({
    tenantId,
    studentId: req.body.studentId,
    studentFeeId: req.body.studentFeeId,
    amount: req.body.amount,
    paymentMode: req.body.paymentMode,
    paymentDate: req.body.paymentDate,
    transactionId: req.body.transactionId,
    remarks: req.body.remarks,
    collectedBy: req.auth?.userId
  });

  res.status(201).json(result);
}

export async function listPaymentHistoryHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const payments = await listPaymentsForStudent({
    tenantId,
    studentId: req.params.studentId
  });

  res.status(200).json({ payments });
}

export async function receiptHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const payment = await findPaymentById({ tenantId, paymentId: req.params.paymentId });
  if (!payment) throw new HttpError(404, 'Payment not found');

  const receipt = await getReceiptDetails({ tenantId, paymentId: req.params.paymentId });
  if (!receipt) throw new HttpError(404, 'Receipt details not found');

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${receipt.receipt_number}.pdf`);
  doc.pipe(res);

  doc.fontSize(20).text(receipt.institute_name, { align: 'left' });
  doc.fontSize(10).text(`Institute Email: ${receipt.institute_email}`);
  doc.moveDown();

  doc.fontSize(16).text('Payment Receipt', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text(`Receipt No: ${receipt.receipt_number}`);
  if (receipt.invoice_number) doc.text(`Invoice No: ${receipt.invoice_number}`);
  doc.text(`Payment Date: ${receipt.payment_date}`);
  doc.text(`Payment Mode: ${receipt.payment_mode}`);
  if (receipt.transaction_id) doc.text(`Transaction ID: ${receipt.transaction_id}`);
  doc.moveDown();

  doc.fontSize(12).text(`Student: ${receipt.student_name}`);
  doc.text(`Student Email: ${receipt.student_email}`);
  doc.text(`Amount Paid: ₹${receipt.amount}`);
  doc.text(`GST Amount: ₹${receipt.gst_amount}`);
  doc.text(`Total Amount: ₹${receipt.total_amount}`);
  doc.text(`Paid Amount: ₹${receipt.paid_amount}`);
  doc.text(`Due Amount: ₹${receipt.due_amount}`);
  if (receipt.remarks) doc.text(`Remarks: ${receipt.remarks}`);

  doc.moveDown();
  doc.fontSize(10).text('Thank you for your payment.', { align: 'center' });

  doc.end();
}
