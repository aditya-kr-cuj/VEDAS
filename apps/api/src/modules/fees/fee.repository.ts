import { query, withTransaction } from '../../db/client.js';
import { HttpError } from '../../utils/http-error.js';

export interface FeeStructureRecord {
  id: string;
  tenant_id: string;
  name: string;
  fee_type: string;
  amount: string;
  frequency: string;
  course_id: string | null;
  batch_id: string | null;
  late_fee_amount: string;
  late_fee_after_days: number;
  created_at: Date;
  updated_at: Date;
}

export async function createFeeStructure(payload: {
  tenantId: string;
  name: string;
  feeType: string;
  amount: number;
  frequency: string;
  courseId?: string;
  batchId?: string;
  lateFeeAmount?: number;
  lateFeeAfterDays?: number;
}): Promise<FeeStructureRecord> {
  const rows = await query<FeeStructureRecord>(
    `
      INSERT INTO fee_structures (
        tenant_id, name, fee_type, amount, frequency, course_id, batch_id, late_fee_amount, late_fee_after_days
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `,
    [
      payload.tenantId,
      payload.name,
      payload.feeType,
      payload.amount,
      payload.frequency,
      payload.courseId ?? null,
      payload.batchId ?? null,
      payload.lateFeeAmount ?? 0,
      payload.lateFeeAfterDays ?? 0
    ]
  );

  return rows[0];
}

export async function listFeeStructures(tenantId: string): Promise<FeeStructureRecord[]> {
  return query<FeeStructureRecord>(
    `
      SELECT *
      FROM fee_structures
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `,
    [tenantId]
  );
}

export async function assignFeeStructure(payload: {
  tenantId: string;
  feeStructureId: string;
  studentIds: string[];
  dueDate: string;
}) {
  return withTransaction(async (client) => {
    const [structure] = await client.query<FeeStructureRecord>(
      `SELECT * FROM fee_structures WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
      [payload.tenantId, payload.feeStructureId]
    );
    if (!structure) throw new HttpError(404, 'Fee structure not found');

    for (const studentId of payload.studentIds) {
      await client.query(
        `
          INSERT INTO student_fees (
            tenant_id, student_id, fee_structure_id, total_amount, paid_amount, due_amount, due_date, status
          )
          VALUES ($1,$2,$3,$4,0,$4,$5,'pending')
          ON CONFLICT (student_id, fee_structure_id) DO NOTHING
        `,
        [payload.tenantId, studentId, payload.feeStructureId, structure.amount, payload.dueDate]
      );
    }
  });
}
