import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import { createReport, getReportById, getStudentReportData, listStudentsInBatch } from './report.repository.js';
import PDFDocument from 'pdfkit';
import archiver from 'archiver';

function buildPdfBuffer(report: any) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text(report.tenant?.name ?? 'Institute', { align: 'center' });
    doc.fontSize(12).text('Progress Report', { align: 'center' });
    doc.moveDown();

    doc.fontSize(11).text(`Student: ${report.student?.full_name ?? ''}`);
    doc.text(`Email: ${report.student?.email ?? ''}`);
    doc.text(`Period: ${report.from_date} to ${report.to_date}`);
    doc.moveDown();

    doc.fontSize(12).text('Attendance Summary', { underline: true });
    doc.fontSize(11).text(`Present: ${report.attendance_summary.present}/${report.attendance_summary.total}`);
    doc.text(`Attendance %: ${report.attendance_summary.percentage}`);
    doc.moveDown();

    doc.fontSize(12).text('Test Scores', { underline: true });
    report.tests.forEach((t: any) => {
      doc.fontSize(10).text(`${t.title} (${t.course_name}) - ${t.percentage}%`);
    });
    doc.moveDown();

    doc.fontSize(12).text('Subject Averages', { underline: true });
    report.subject_averages.forEach((s: any) => {
      doc.fontSize(10).text(`${s.course_name}: ${s.average_score}%`);
    });
    doc.moveDown();

    doc.fontSize(12).text(`Overall Percentage: ${report.overall_percentage}%`);
    doc.moveDown();

    doc.fontSize(11).text('Teacher Remarks: ____________________________');
    doc.text('Areas of Improvement: _______________________');
    doc.moveDown();

    doc.text('Principal Signature: _________________________');
    doc.text(`Date: ${new Date().toLocaleDateString()}`);

    doc.end();
  });
}

export async function generateReportHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context is required');

  const reportData = await getStudentReportData({
    tenantId,
    studentId: req.body.student_id,
    fromDate: req.body.from_date,
    toDate: req.body.to_date
  });

  const report = await createReport({
    tenantId,
    studentId: req.body.student_id,
    reportType: req.body.report_type,
    fromDate: req.body.from_date,
    toDate: req.body.to_date,
    reportData,
    createdBy: userId
  });

  res.status(201).json({ report_id: report.id, data: reportData });
}

export async function reportPdfHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) throw new HttpError(400, 'Tenant context is required');

  const report = await getReportById({ tenantId, reportId: req.params.id });
  if (!report) throw new HttpError(404, 'Report not found');

  const buffer = await buildPdfBuffer({
    ...report.report_data,
    from_date: report.from_date,
    to_date: report.to_date
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="report-${report.id}.pdf"`);
  res.status(200).send(buffer);
}

export async function bulkReportHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new HttpError(400, 'Tenant context is required');

  const students = await listStudentsInBatch({ tenantId, batchId: req.body.batch_id });
  if (!students.length) throw new HttpError(404, 'No students found');

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="reports.zip"');

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);

  for (const student of students) {
    const reportData = await getStudentReportData({
      tenantId,
      studentId: student.student_id,
      fromDate: req.body.from_date,
      toDate: req.body.to_date
    });
    const report = await createReport({
      tenantId,
      studentId: student.student_id,
      reportType: req.body.report_type,
      fromDate: req.body.from_date,
      toDate: req.body.to_date,
      reportData,
      createdBy: userId
    });
    const buffer = await buildPdfBuffer({
      ...report.report_data,
      from_date: report.from_date,
      to_date: report.to_date
    });
    archive.append(buffer, { name: `${student.full_name}-${report.id}.pdf` });
  }

  archive.finalize();
}
