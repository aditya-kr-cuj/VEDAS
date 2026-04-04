import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import { findStudentById, softDeleteStudent, updateStudentProfile } from './student.repository.js';
import { parseCsvToRows } from '../../utils/csv.js';
import { createTenantUser } from '../auth/auth.service.js';
import { z } from 'zod';
import xlsx from 'xlsx';

export async function getStudentHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const student = await findStudentById(tenantId, req.params.id);
  if (!student) {
    throw new HttpError(404, 'Student not found');
  }

  res.status(200).json({ student });
}

export async function updateStudentHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const updated = await updateStudentProfile({
    tenantId,
    studentId: req.params.id,
    fullName: req.body.fullName,
    email: req.body.email,
    rollNumber: req.body.rollNumber,
    className: req.body.className,
    guardianName: req.body.guardianName,
    guardianPhone: req.body.guardianPhone
  });

  res.status(200).json({ student: updated });
}

export async function deleteStudentHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  await softDeleteStudent({ tenantId, studentId: req.params.id });
  res.status(200).json({ message: 'Student deactivated' });
}

const bulkRowSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

function parseXlsxToRows(buffer: Buffer) {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][];
  if (rows.length === 0) return [];

  const header = rows[0].map((cell) => String(cell).trim().toLowerCase());
  const dataRows = rows.slice(1);
  const parsed: Array<{ fullName?: string; email?: string; password?: string }> = [];

  for (const row of dataRows) {
    const record: { fullName?: string; email?: string; password?: string } = {};
    header.forEach((key, index) => {
      const value = String(row[index] ?? '').trim();
      if (key === 'fullname' || key === 'full_name') record.fullName = value;
      if (key === 'email') record.email = value;
      if (key === 'password') record.password = value;
    });
    const isEmpty = !record.fullName && !record.email && !record.password;
    if (!isEmpty) parsed.push(record);
  }

  return parsed;
}

export async function bulkUploadStudentsHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const file = req.file;
  if (!file) {
    throw new HttpError(400, 'CSV or XLSX file is required');
  }

  const filename = file.originalname.toLowerCase();
  let rows: Array<{ fullName?: string; email?: string; password?: string }> = [];

  if (filename.endsWith('.csv')) {
    rows = parseCsvToRows(file.buffer.toString('utf8'));
  } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
    rows = parseXlsxToRows(file.buffer);
  } else {
    throw new HttpError(400, 'Unsupported file type');
  }

  const errors: Array<{ row: number; email: string; error: string }> = [];
  let success = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const rowNumber = index + 2;
    const fullName = row.fullName?.trim();
    const email = row.email?.trim();
    const password = row.password?.trim();

    const parsed = bulkRowSchema.safeParse({
      fullName,
      email,
      password
    });

    if (!parsed.success) {
      errors.push({
        row: rowNumber,
        email: email ?? '',
        error: 'Validation failed'
      });
      continue;
    }

    try {
      await createTenantUser({
        tenantId,
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        password: parsed.data.password,
        role: 'student'
      });
      success += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed';
      errors.push({
        row: rowNumber,
        email: parsed.data.email,
        error: message
      });
    }
  }

  res.status(200).json({
    total: rows.length,
    success,
    failed: rows.length - success,
    errors
  });
}

export async function csvTemplateHandler(_req: Request, res: Response): Promise<void> {
  const csv = 'fullName,email,password\nJohn Doe,john@example.com,Pass1234\n';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="students-template.csv"');
  res.status(200).send(csv);
}
